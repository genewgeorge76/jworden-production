"""
site_health.py — Is each published domain actually serving the site?

Read-only. The check is expensive enough (one HTTPS fetch per domain) that the
periodic run belongs to Celery beat; these endpoints expose the stored result
and allow an on-demand run.
"""

from __future__ import annotations

import logging
from typing import Any, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..core.security import verify_premium_security
from ..database import get_db
from ..models import SiteHealthCheck
from ..services import site_health

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/site-health", tags=["site-health"])


def _row(r: SiteHealthCheck) -> dict[str, Any]:
    return {
        "domain": r.domain, "severity": r.severity,
        "status_code": r.status_code, "visible_words": r.visible_words,
        "title": r.title, "canonical": r.canonical, "server": r.server,
        "findings": r.findings_json or [], "error": r.error,
        "severity_since": r.severity_since.isoformat() if r.severity_since else None,
        "checked_at": r.checked_at.isoformat() if r.checked_at else None,
    }


@router.get("/status", summary="Last observed state of every published domain")
def status(db: Session = Depends(get_db),
           auth: dict = Depends(verify_premium_security)):
    rows = db.query(SiteHealthCheck).order_by(SiteHealthCheck.domain).all()
    if not rows:
        return {
            "ok": True, "checked": 0,
            "message": "No check has run yet. POST /site-health/run, or wait "
                       "for the hourly task.",
            "monitored_domains": list(site_health.PUBLISHED_DOMAINS),
        }

    critical = [r for r in rows if r.severity == "critical"]
    return {
        "ok": True,
        "checked": len(rows),
        "critical": len(critical),
        "warning": sum(1 for r in rows if r.severity == "warning"),
        "not_serving_the_site": sorted(r.domain for r in critical),
        "domains": [_row(r) for r in sorted(
            rows, key=lambda r: site_health.SEVERITY_ORDER.get(r.severity, 3))],
    }


@router.post("/run", summary="Check every domain now")
async def run(save: bool = Query(default=True),
              domain: Optional[str] = Query(default=None),
              db: Session = Depends(get_db),
              auth: dict = Depends(verify_premium_security)):
    result = await site_health.check_all([domain] if domain else None)
    if save:
        result["changes"] = site_health.persist(db, result["reports"])
    return {"ok": True, **result}


@router.get("/monitored", summary="Which domains are watched")
def monitored(auth: dict = Depends(verify_premium_security)):
    return {
        "ok": True,
        "domains": list(site_health.PUBLISHED_DOMAINS),
        "checks": [
            {"check": "parked", "catches": "the domain resolves to a parking or "
             "for-sale service — returns 200 and is invisible to a status check"},
            {"check": "empty_shell", "catches": "200 with no visible text; the "
             "SPA never prerendered, so a crawler sees nothing"},
            {"check": "canonical_drift", "catches": "the page names a different "
             "host as canonical, telling Google not to rank this one"},
            {"check": "unexpected_noindex", "catches": "a page meant to rank "
             "asking crawlers to skip it"},
            {"check": "duplicate_body", "catches": "two domains serving an "
             "identical page, forcing Google to discount one"},
            {"check": "unreachable", "catches": "DNS or hosting failure"},
        ],
    }
