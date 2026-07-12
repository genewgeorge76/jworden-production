"""
anomalies.py — Z-score anomaly detection endpoints.

Routes (under /api/v1/anomalies):
  GET  /           Run all 4 checks, persist new alerts (2h dedup), return results
  GET  /history    Recent persisted alerts from the last 48 hours
  PUT  /{id}/resolve  Mark an alert as resolved

All endpoints require X-Master-Key authentication.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..core.security import verify_premium_security
from ..database import get_db
from ..models import AnomalyAlert
from ..services import anomaly_detector as _det

logger = logging.getLogger(__name__)

router = APIRouter(prefix='/anomalies', tags=['anomalies'])


@router.get('/', summary='Run all anomaly checks and persist new alerts')
async def run_anomalies(
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    results = _det.run_all_checks(db)
    saved = _det.persist_anomalies(db, results)
    return {
        "checks_run": len(results),
        "anomalies_found": sum(1 for r in results if r.is_anomaly),
        "new_alerts_saved": saved,
        "results": [r._asdict() for r in results],
    }


@router.get('/history', summary='Recent persisted anomaly alerts (last 48h)')
async def anomaly_history(
    hours: int = 48,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    cutoff = datetime.now(timezone.utc) - timedelta(hours=max(1, min(hours, 168)))
    alerts = (
        db.query(AnomalyAlert)
        .filter(AnomalyAlert.detected_at >= cutoff)
        .order_by(AnomalyAlert.detected_at.desc())
        .limit(100)
        .all()
    )
    return {
        "count": len(alerts),
        "hours": hours,
        "alerts": [
            {
                "id": a.id,
                "metric_name": a.metric_name,
                "current_value": a.current_value,
                "baseline_value": a.baseline_value,
                "z_score": a.z_score,
                "severity": a.severity,
                "message": a.message,
                "detected_at": a.detected_at.isoformat() if a.detected_at else None,
                "resolved_at": a.resolved_at.isoformat() if a.resolved_at else None,
            }
            for a in alerts
        ],
    }


@router.put('/{alert_id}/resolve', summary='Mark an anomaly alert as resolved')
async def resolve_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    alert = db.query(AnomalyAlert).filter(AnomalyAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(404, f"Anomaly alert {alert_id} not found")
    if alert.resolved_at:
        return {"id": alert_id, "already_resolved": True}
    alert.resolved_at = datetime.now(timezone.utc)
    db.commit()
    return {"id": alert_id, "resolved": True}
