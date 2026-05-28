"""
vdot_bids.py — VDOT bid board router.

Routes:
  GET  /api/v1/vdot-bids           — list stored bids (filterable by district, category, county)
  GET  /api/v1/vdot-bids/{id}      — single bid detail
  POST /api/v1/vdot-bids/scan      — trigger on-demand VDOT scrape
  GET  /api/v1/vdot-bids/status    — health/config

All endpoints require premium auth.
"""

import logging
import os
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..core.security import verify_premium_security
from ..database import get_db
from ..models import VdotBid

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/vdot-bids",
    tags=["VDOT Bids"],
    dependencies=[Depends(verify_premium_security)],
)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/status")
def vdot_status():
    return {
        "ok": True,
        "provider": "vdot_api" if os.getenv("VDOT_BID_API_KEY") else "stub",
        "vdot_key_set": bool(os.getenv("VDOT_BID_API_KEY")),
        "beat_schedule": "daily at 07:00 UTC",
    }


@router.get("")
def list_bids(
    db:           Session = Depends(get_db),
    district:     Optional[str] = Query(None),
    county:       Optional[str] = Query(None),
    category:     Optional[str] = Query(None),
    contract_type: Optional[str] = Query(None),
    min_value:    Optional[float] = Query(None),
    limit:        int = Query(50, ge=1, le=200),
    offset:       int = Query(0, ge=0),
):
    """List VDOT bid opportunities stored from the last scrape."""
    q = db.query(VdotBid).filter(VdotBid.is_active == True)  # noqa: E712
    if district:
        q = q.filter(VdotBid.district.ilike(f"%{district}%"))
    if county:
        q = q.filter(VdotBid.county.ilike(f"%{county}%"))
    if category:
        q = q.filter(VdotBid.category.ilike(f"%{category}%"))
    if contract_type:
        q = q.filter(VdotBid.contract_type.ilike(f"%{contract_type}%"))
    if min_value is not None:
        q = q.filter(VdotBid.estimated_value >= min_value)

    total = q.count()
    bids  = q.order_by(VdotBid.open_date.desc()).offset(offset).limit(limit).all()

    return {
        "total":  total,
        "offset": offset,
        "limit":  limit,
        "bids": [_bid_dict(b) for b in bids],
    }


@router.get("/{bid_id}")
def get_bid(bid_id: int, db: Session = Depends(get_db)):
    bid = db.query(VdotBid).filter(VdotBid.id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
    return _bid_dict(bid)


@router.post("/scan")
def trigger_scan(max_results: int = Query(50, ge=1, le=200)):
    """Trigger an on-demand VDOT bid board scrape (runs synchronously in API process)."""
    from ..database import SessionLocal        # noqa: PLC0415
    from ..tasks.vdot_scraper import scrape_and_persist  # noqa: PLC0415

    db = SessionLocal()
    try:
        result = scrape_and_persist(db, max_results=max_results)
    except Exception as exc:  # noqa: BLE001
        logger.exception("On-demand VDOT scan failed")
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    finally:
        db.close()

    return {"ok": True, **result}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _bid_dict(b: VdotBid) -> dict:
    return {
        "id":              b.id,
        "contract_id":     b.contract_id,
        "title":           b.title,
        "district":        b.district,
        "county":          b.county,
        "category":        b.category,
        "contract_type":   b.contract_type,
        "estimated_value": b.estimated_value,
        "open_date":       b.open_date.isoformat() if b.open_date else None,
        "close_date":      b.close_date.isoformat() if b.close_date else None,
        "location_desc":   b.location_desc,
        "prime_eligible":  b.prime_eligible,
        "source":          b.source,
        "scraped_at":      b.scraped_at.isoformat() if b.scraped_at else None,
    }
