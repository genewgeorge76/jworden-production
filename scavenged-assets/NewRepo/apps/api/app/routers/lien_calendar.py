"""
lien_calendar.py — Mechanics lien deadline tracker.

Routes (under /api/v1/lien):
  POST /calculate     calculate deadlines without saving
  POST /track         save a project to the lien calendar
  GET  /upcoming      list entries with deadlines within N days
  GET  /entries       list all entries (with optional state_code filter)
  GET  /states        list supported states
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.limiter import LIEN_LIMIT, limiter
from ..core.security import verify_premium_security
from ..database import get_db
from ..models import LienCalendarEntry
from ..services.lien_calendar import SUPPORTED_STATES, calculate_deadlines, get_upcoming_deadlines

logger = logging.getLogger(__name__)

router = APIRouter(prefix='/lien', tags=['lien'])


class LienCalcRequest(BaseModel):
    state_code: str
    project_start_date: str  # ISO date string
    last_furnishing_date: str  # ISO date string


class LienTrackRequest(BaseModel):
    customer_name: str
    project_address: str
    state_code: str
    project_start_date: str
    last_furnishing_date: str
    notes: Optional[str] = None


def _parse_dt(s: str) -> datetime:
    try:
        dt = datetime.fromisoformat(s.replace('Z', '+00:00'))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except ValueError as exc:
        raise HTTPException(422, f'Invalid date format: {s!r}') from exc


@router.post('/calculate', summary='Calculate lien deadlines without saving')
@limiter.limit(LIEN_LIMIT)
async def calculate(
    request: Request,
    body: LienCalcRequest,
    _: dict = Depends(verify_premium_security),
):
    state = body.state_code.upper()
    start = _parse_dt(body.project_start_date)
    last = _parse_dt(body.last_furnishing_date)
    return calculate_deadlines(state, start, last)


@router.post('/track', summary='Add a project to the lien calendar')
@limiter.limit(LIEN_LIMIT)
async def track(
    request: Request,
    body: LienTrackRequest,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    state = body.state_code.upper()
    start = _parse_dt(body.project_start_date)
    last = _parse_dt(body.last_furnishing_date)

    deadlines = calculate_deadlines(state, start, last)

    prelim_dt = (
        datetime.fromisoformat(deadlines['preliminary_notice_deadline'])
        if deadlines['preliminary_notice_deadline']
        else None
    )
    lien_dt = datetime.fromisoformat(deadlines['lien_filing_deadline'])
    foreclosure_dt = datetime.fromisoformat(deadlines['foreclosure_deadline'])

    entry = LienCalendarEntry(
        customer_name=body.customer_name,
        project_address=body.project_address,
        state_code=state,
        project_start_date=start,
        last_furnishing_date=last,
        preliminary_notice_deadline=prelim_dt,
        lien_filing_deadline=lien_dt,
        foreclosure_deadline=foreclosure_dt,
        notes=body.notes,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    return {
        'id': entry.id,
        'customer_name': entry.customer_name,
        'project_address': entry.project_address,
        'state_code': entry.state_code,
        **deadlines,
    }


@router.get('/upcoming', summary='List entries with deadlines within N days')
@limiter.limit(LIEN_LIMIT)
async def upcoming(
    request: Request,
    days_ahead: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    entries = get_upcoming_deadlines(db, days_ahead)
    return {'days_ahead': days_ahead, 'count': len(entries), 'entries': entries}


@router.get('/entries', summary='List all lien calendar entries')
@limiter.limit(LIEN_LIMIT)
async def list_entries(
    request: Request,
    state_code: Optional[str] = Query(default=None, max_length=2),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    q = db.query(LienCalendarEntry)
    if state_code:
        q = q.filter(LienCalendarEntry.state_code == state_code.upper())
    total = q.count()
    items = q.order_by(LienCalendarEntry.lien_filing_deadline.asc()).offset(offset).limit(limit).all()

    def _ser(e: LienCalendarEntry) -> dict:
        return {
            'id': e.id,
            'customer_name': e.customer_name,
            'project_address': e.project_address,
            'state_code': e.state_code,
            'preliminary_notice_deadline': e.preliminary_notice_deadline.isoformat() if e.preliminary_notice_deadline else None,
            'lien_filing_deadline': e.lien_filing_deadline.isoformat() if e.lien_filing_deadline else None,
            'foreclosure_deadline': e.foreclosure_deadline.isoformat() if e.foreclosure_deadline else None,
            'notes': e.notes,
            'created_at': e.created_at.isoformat(),
        }

    return {'total': total, 'offset': offset, 'limit': limit, 'entries': [_ser(e) for e in items]}


@router.get('/states', summary='List supported states')
async def list_states():
    return {'supported_states': SUPPORTED_STATES}
