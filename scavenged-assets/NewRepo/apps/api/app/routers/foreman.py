"""Foreman — job progress check-in, crew status, live site updates."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.security import verify_premium_security
from ..database import get_db
from ..models import WorkOrder

router = APIRouter(prefix='/foreman', tags=['foreman'])


class CheckInRequest(BaseModel):
    work_order_id: str
    status: str           # in_progress, complete, paused, blocked
    notes: str | None = None
    progress_pct: int | None = None  # 0-100
    blockers: str | None = None


class ProgressUpdate(BaseModel):
    progress_pct: int
    notes: str | None = None


@router.post('/check-in', dependencies=[Depends(verify_premium_security)])
async def crew_check_in(body: CheckInRequest, db: Session = Depends(get_db)):
    """Foreman check-in: update work order status and log progress."""
    wo = db.query(WorkOrder).filter(WorkOrder.id == body.work_order_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail='Work order not found')

    valid = {'in_progress', 'complete', 'paused', 'blocked'}
    if body.status not in valid:
        raise HTTPException(status_code=422, detail=f'status must be one of {valid}')

    wo.status = body.status
    if body.notes:
        existing = wo.notes or ''
        timestamp = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
        wo.notes = f'{existing}\n[{timestamp}] {body.notes}'.strip()
    if body.status == 'in_progress' and not wo.started_at:
        wo.started_at = datetime.now(timezone.utc)
    if body.status == 'complete' and not wo.completed_at:
        wo.completed_at = datetime.now(timezone.utc)

    db.commit()
    return {
        'work_order_id': wo.id,
        'title': wo.title,
        'status': wo.status,
        'started_at': wo.started_at.isoformat() if wo.started_at else None,
        'completed_at': wo.completed_at.isoformat() if wo.completed_at else None,
        'notes': wo.notes,
    }


@router.get('/active-jobs', dependencies=[Depends(verify_premium_security)])
async def active_jobs(db: Session = Depends(get_db)):
    """Return all in-progress work orders for the foreman dashboard."""
    wos = (
        db.query(WorkOrder)
        .filter(WorkOrder.status.in_(['assigned', 'in_progress', 'blocked']))
        .order_by(WorkOrder.scheduled_date)
        .all()
    )
    return {
        'active': [
            {
                'id': wo.id,
                'title': wo.title,
                'status': wo.status,
                'site_address': wo.site_address,
                'crew_assigned': wo.crew_assigned,
                'scheduled_date': wo.scheduled_date.isoformat() if wo.scheduled_date else None,
                'started_at': wo.started_at.isoformat() if wo.started_at else None,
                'notes': wo.notes,
            }
            for wo in wos
        ],
        'count': len(wos),
    }


@router.get('/completed-today', dependencies=[Depends(verify_premium_security)])
async def completed_today(db: Session = Depends(get_db)):
    from datetime import timedelta
    now = datetime.now(timezone.utc)
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    wos = (
        db.query(WorkOrder)
        .filter(WorkOrder.completed_at >= start_of_day)
        .all()
    )
    return {'completed_today': len(wos), 'jobs': [{'id': wo.id, 'title': wo.title, 'site_address': wo.site_address} for wo in wos]}


@router.get('/site-status/{work_order_id}', dependencies=[Depends(verify_premium_security)])
async def site_status(work_order_id: str, db: Session = Depends(get_db)):
    wo = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail='Work order not found')
    return {
        'id': wo.id,
        'title': wo.title,
        'status': wo.status,
        'site_address': wo.site_address,
        'crew_assigned': wo.crew_assigned.split(',') if wo.crew_assigned else [],
        'equipment_assigned': wo.equipment_assigned.split(',') if wo.equipment_assigned else [],
        'scheduled_date': wo.scheduled_date.isoformat() if wo.scheduled_date else None,
        'started_at': wo.started_at.isoformat() if wo.started_at else None,
        'completed_at': wo.completed_at.isoformat() if wo.completed_at else None,
        'notes': wo.notes,
    }
