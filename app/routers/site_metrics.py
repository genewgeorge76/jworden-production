"""
site_metrics.py — Command Center dashboard metrics endpoint.

Routes:
  GET /api/v1/site-metrics   — monthly compliance & ad-ROI history for Tremor AreaChart

Requires premium security (same as analytics endpoints).
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..core.security import verify_premium_security
from ..database import get_db
from ..models import SiteEvaluation

router = APIRouter(prefix="/api/v1/site-metrics", tags=["site-metrics"])


@router.get("", dependencies=[Depends(verify_premium_security)])
def get_site_metrics(db: Session = Depends(get_db)):
    """
    Return monthly compliance + ad-ROI snapshots formatted for the Tremor AreaChart.

    Response shape:
      [{ "month": "Jan", "Regional Compliance": 82.0, "Ad ROI": 2.4 }, ...]
    """
    evaluations = (
        db.query(SiteEvaluation)
        .order_by(SiteEvaluation.last_checked.asc())
        .all()
    )
    return [
        {
            "month": e.last_checked.strftime("%b"),
            "Regional Compliance": round(e.compliance_score, 1),
            "Ad ROI": round(e.ad_roi, 2),
        }
        for e in evaluations
    ]
