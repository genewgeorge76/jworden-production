"""
rfp_hunter_router.py — B2B Neural Hunter API (Owner/staff-gated).

Endpoints (premium-security gated, same pattern as quotes.py/vdot_bids.py):

    POST /api/v1/rfp-hunter/search          — search live (does not persist)
    POST /api/v1/rfp-hunter/hunt            — search AND persist new leads
    GET  /api/v1/rfp-hunter/leads           — list stored leads (filterable)
    PATCH /api/v1/rfp-hunter/leads/{id}/status — update lead status
    GET  /api/v1/rfp-hunter/status          — health/config
"""

from __future__ import annotations

import logging
import os
from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.security import verify_premium_security
from ..database import get_db
from ..models import CommercialRfpLead
from ..services import rfp_hunter

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/rfp-hunter",
    tags=["rfp-hunter"],
    dependencies=[Depends(verify_premium_security)],
)

_ALLOWED_STATUSES = {"new", "reviewed", "pushed_to_pipeline", "dismissed"}


class SearchRequest(BaseModel):
    query: str
    num_results: int = 10


class StatusUpdate(BaseModel):
    status: str


@router.get("/status")
def hunter_status():
    return {
        "ok": True,
        "provider": "exa" if os.getenv("EXA_API_KEY") else "stub",
        "exa_key_set": bool(os.getenv("EXA_API_KEY")),
    }


@router.post("/search")
def search(payload: SearchRequest):
    """Search for commercial RFPs without persisting — for previewing results."""
    try:
        results = rfp_hunter.search_rfps(payload.query, payload.num_results)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"query": payload.query, "results": results}


@router.post("/hunt")
def hunt(payload: SearchRequest, db: Session = Depends(get_db)):
    """Search for commercial RFPs and persist new (deduped by URL) leads."""
    try:
        return rfp_hunter.search_and_persist(db, payload.query, payload.num_results)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/leads")
def list_leads(
    db: Session = Depends(get_db),
    status: Optional[str] = Query(None),
    query_contains: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    q = db.query(CommercialRfpLead)
    if status:
        q = q.filter(CommercialRfpLead.status == status)
    if query_contains:
        q = q.filter(CommercialRfpLead.query.ilike(f"%{query_contains}%"))

    total = q.count()
    leads = q.order_by(CommercialRfpLead.scraped_at.desc()).offset(offset).limit(limit).all()

    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "leads": [_lead_dict(l) for l in leads],
    }


@router.patch("/leads/{lead_id}/status")
def update_lead_status(lead_id: int, payload: StatusUpdate, db: Session = Depends(get_db)):
    if payload.status not in _ALLOWED_STATUSES:
        raise HTTPException(status_code=400, detail=f"status must be one of {sorted(_ALLOWED_STATUSES)}")
    lead = db.query(CommercialRfpLead).filter(CommercialRfpLead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    lead.status = payload.status
    db.commit()
    return _lead_dict(lead)


def _lead_dict(l: CommercialRfpLead) -> dict:
    return {
        "id": l.id,
        "title": l.title,
        "url": l.url,
        "source_domain": l.source_domain,
        "query": l.query,
        "published_date": l.published_date.isoformat() if l.published_date else None,
        "summary": l.summary,
        "status": l.status,
        "provider": l.provider,
        "scraped_at": l.scraped_at.isoformat() if l.scraped_at else None,
    }
