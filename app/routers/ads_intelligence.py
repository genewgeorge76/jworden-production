"""
ads_intelligence.py — Autonomous Agentic Advertising Intelligence for JWordenAI.

Four interconnected capabilities powering the "AI Max" advertising layer:

  1. URL Exclusion Manager  — Keep AI Max URL expansion pointed only at high-
                              converting pages. Prevents blog/FAQ/careers/legal
                              from consuming paid ad budget.

  2. First-Party CRM Export — Export closed-deal leads (SHA256-hashed) to Google
                              Ads Data Manager as Customer Match audience lists.
                              Provides "closed sale" signal quality vs raw form fills.

  3. Real-Time Lead Qualifier — AI agent classifies inbound traffic as
                               BUYER / RESEARCHER / TIRE_KICKER / BOT instantly,
                               routing only serious buyers to the callback queue.

  4. Anomaly Detector       — Continuously monitors lead metrics for irregularities
                              (volume drop, HOT rate collapse, COOL surge, zero gap).
                              Alerts are persisted and surfaced to the Command Center.

Routes:
  GET  /api/v1/ads/status
  GET  /api/v1/ads/url-exclusions           (format=json | ads_paste)
  POST /api/v1/ads/url-exclusions
  DELETE /api/v1/ads/url-exclusions/{id}
  GET  /api/v1/ads/crm-export
  POST /api/v1/ads/qualify-lead
  GET  /api/v1/ads/anomalies
  POST /api/v1/ads/anomaly-scan
  POST /api/v1/ads/anomalies/{id}/resolve
"""

import logging
import os
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..core.security import verify_premium_security
from ..database import get_db
from ..services.ad_signals import (
    build_google_ads_exclusion_payload,
    export_customer_match,
    get_all_exclusions,
)
from ..services.anomaly_detector import persist_anomalies, run_all_checks
from ..services.lead_qualifier import qualify_lead

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/ads",
    tags=["ads-intelligence"],
    dependencies=[Depends(verify_premium_security)],
)


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class ExclusionCreate(BaseModel):
    path_pattern: str = Field(
        ..., min_length=1, max_length=300,
        description="URL path prefix to exclude, e.g. /blog/"
    )
    reason: Optional[str] = Field(None, max_length=200)
    created_by: Optional[str] = Field(None, max_length=120)


class LeadQualifyRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    service_type: Optional[str] = None
    property_type: Optional[str] = None
    urgency: Optional[str] = None
    project_size_sqft: Optional[float] = None
    state_code: Optional[str] = None
    message: Optional[str] = None
    score_value: Optional[int] = Field(None, description="Pre-computed lead score if available")


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/status", summary="AI Max subsystem health check")
def ads_status():
    """Reports which AI Max subsystems are operational."""
    return {
        "url_exclusion_manager": "ready",
        "crm_export": "ready",
        "lead_qualifier": "gpt-4o" if os.getenv("OPENAI_API_KEY") else "rule-based",
        "anomaly_detector": "ready",
        "google_ads_connected": bool(os.getenv("GOOGLE_ADS_DEVELOPER_TOKEN")),
        "site_domain": os.getenv("GOOGLE_ADS_SITE_DOMAIN", "jworden.com"),
    }


@router.get("/url-exclusions", summary="AI Max URL exclusion list")
def get_url_exclusions(
    format: str = Query("json", description="Response format: json | ads_paste"),
    db: Session = Depends(get_db),
):
    """
    Return the full URL exclusion list for AI Max URL expansion.

    - `format=ads_paste` returns an absolute-URL payload ready to paste
      into Google Ads → Campaign Settings → AI Max → URL Expansion → Excluded URLs.
    - `format=json` returns the structured list with metadata.
    """
    if format == "ads_paste":
        return build_google_ads_exclusion_payload(db)
    exclusions = get_all_exclusions(db)
    return {"exclusions": exclusions, "count": len(exclusions)}


@router.post("/url-exclusions", status_code=201, summary="Add URL exclusion")
def add_url_exclusion(body: ExclusionCreate, db: Session = Depends(get_db)):
    """
    Add a custom URL path to the AI Max exclusion list.
    Paths added here will be included in the `ads_paste` export.
    """
    from ..models import AdUrlExclusion  # noqa: PLC0415

    pattern = body.path_pattern.strip()
    if not pattern.startswith("/"):
        pattern = "/" + pattern

    existing = db.query(AdUrlExclusion).filter(AdUrlExclusion.path_pattern == pattern).first()
    if existing:
        if not existing.is_active:
            existing.is_active = True
            db.commit()
            return {"message": "Exclusion re-activated", "id": existing.id, "path_pattern": pattern}
        raise HTTPException(status_code=409, detail="Path pattern is already excluded.")

    row = AdUrlExclusion(
        path_pattern=pattern,
        reason=body.reason,
        created_by=body.created_by,
        is_active=True,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"message": "Exclusion added", "id": row.id, "path_pattern": pattern}


@router.delete("/url-exclusions/{exclusion_id}", summary="Remove URL exclusion")
def remove_url_exclusion(exclusion_id: int, db: Session = Depends(get_db)):
    """Soft-deactivate a custom URL exclusion (sets is_active=False)."""
    from ..models import AdUrlExclusion  # noqa: PLC0415

    row = db.query(AdUrlExclusion).filter(AdUrlExclusion.id == exclusion_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Exclusion not found.")
    row.is_active = False
    db.commit()
    return {"message": "Exclusion deactivated", "id": exclusion_id}


@router.get("/crm-export", summary="First-party closed-deal Customer Match export")
def get_crm_export(
    limit: int = Query(5000, ge=1, le=10000, description="Max records to include"),
    db: Session = Depends(get_db),
):
    """
    Export closed-deal leads as SHA256-hashed Customer Match lists for
    Google Ads Data Manager.

    Segments returned: `jworden_closed_sales_hot`, `..._warm`, `..._cool`.

    These carry "closed sale" signal quality — far more valuable to Google's
    Smart Bidding algorithm than raw form fills.  Upload via:
    Google Ads → Audience Manager → Customer Lists → Upload CSV.
    """
    return export_customer_match(db, limit=limit)


@router.post("/qualify-lead", summary="Real-time lead qualification agent")
def qualify_inbound_lead(body: LeadQualifyRequest):
    """
    Classify an inbound lead in real-time before it enters the pipeline.

    Returns:
      - `buyer_intent`: BUYER | RESEARCHER | TIRE_KICKER | BOT
      - `action`: CALL_NOW | NURTURE | DEPRIORITIZE | DISCARD
      - `confidence`: 0.0–1.0
      - `reason`: one-sentence explanation
      - `engine`: rule-based | gpt-4o

    Call this endpoint at lead submission time to route serious buyers
    to the immediate callback queue before dashboard review.
    """
    lead_dict = body.model_dump(exclude_none=True)
    # Remap score_value to internal key used by rule engine
    if "score_value" in lead_dict:
        lead_dict["_score_value"] = lead_dict.pop("score_value")
    return qualify_lead(lead_dict)


@router.get("/anomalies", summary="Retrieve anomaly alerts")
def get_anomalies(
    include_resolved: bool = Query(False, description="Include resolved alerts"),
    severity: Optional[str] = Query(None, description="Filter by severity: LOW|MEDIUM|HIGH|CRITICAL"),
    db: Session = Depends(get_db),
):
    """
    Retrieve current anomaly alerts for key business metrics.
    Open alerts represent active irregularities requiring attention.
    """
    from ..models import AnomalyAlert  # noqa: PLC0415

    q = db.query(AnomalyAlert).order_by(AnomalyAlert.detected_at.desc())
    if not include_resolved:
        q = q.filter(AnomalyAlert.resolved_at == None)  # noqa: E711
    if severity:
        q = q.filter(AnomalyAlert.severity == severity.upper())

    alerts = q.limit(100).all()
    return {
        "alerts": [
            {
                "id": a.id,
                "metric_name": a.metric_name,
                "severity": a.severity,
                "current_value": a.current_value,
                "baseline_value": a.baseline_value,
                "z_score": a.z_score,
                "message": a.message,
                "detected_at": a.detected_at.isoformat() if a.detected_at else None,
                "resolved_at": a.resolved_at.isoformat() if a.resolved_at else None,
            }
            for a in alerts
        ],
        "open_count": sum(1 for a in alerts if not a.resolved_at),
        "critical_count": sum(1 for a in alerts if not a.resolved_at and a.severity == "CRITICAL"),
    }


@router.post("/anomaly-scan", summary="Trigger manual anomaly scan")
def run_anomaly_scan(db: Session = Depends(get_db)):
    """
    Manually trigger a full anomaly scan across all business metrics.
    In production, this runs automatically every 30 minutes via Celery Beat.
    """
    results = run_all_checks(db)
    written = persist_anomalies(db, results)
    return {
        "anomalies_detected": len(results),
        "new_alerts_persisted": written,
        "results": [
            {
                "metric_name": r.metric_name,
                "severity": r.severity,
                "current_value": r.current_value,
                "baseline_value": r.baseline_value,
                "z_score": r.z_score,
                "message": r.message,
            }
            for r in results
        ],
    }


@router.post("/anomalies/{alert_id}/resolve", summary="Resolve an anomaly alert")
def resolve_anomaly(alert_id: int, db: Session = Depends(get_db)):
    """Mark an anomaly alert as resolved (sets resolved_at timestamp)."""
    from ..models import AnomalyAlert  # noqa: PLC0415

    alert = db.query(AnomalyAlert).filter(AnomalyAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")
    alert.resolved_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Alert resolved", "id": alert_id}
