"""Dispatch — crew and truck assignment to work orders + jobs."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.security import verify_premium_security
from ..database import get_db
from ..models import WorkOrder, WorkforceMember
from ..services.dispatch_engine import rank_candidates

router = APIRouter(prefix='/dispatch', tags=['dispatch'])


class AssignRequest(BaseModel):
    work_order_id: str
    crew_ids: list[str]
    equipment_ids: list[str] | None = None
    scheduled_date: str | None = None


class AvailabilityQuery(BaseModel):
    date: str
    skills_required: list[str] | None = None


@router.get('/schedule', dependencies=[Depends(verify_premium_security)])
async def get_schedule(date: str | None = None, db: Session = Depends(get_db)):
    """Return all work orders scheduled for a given date (or next 7 days)."""
    from datetime import timedelta
    if date:
        target = datetime.fromisoformat(date)
        start = target.replace(hour=0, minute=0, second=0, tzinfo=timezone.utc)
        end = start + timedelta(days=1)
    else:
        start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0)
        end = start + timedelta(days=7)

    wos = (
        db.query(WorkOrder)
        .filter(WorkOrder.scheduled_date >= start, WorkOrder.scheduled_date < end)
        .filter(WorkOrder.status.notin_(['cancelled', 'complete']))
        .order_by(WorkOrder.scheduled_date)
        .all()
    )
    return {
        'schedule': [
            {
                'id': wo.id,
                'title': wo.title,
                'status': wo.status,
                'site_address': wo.site_address,
                'scheduled_date': wo.scheduled_date.isoformat() if wo.scheduled_date else None,
                'crew_assigned': wo.crew_assigned,
                'equipment_assigned': wo.equipment_assigned,
            }
            for wo in wos
        ]
    }


@router.post('/assign', dependencies=[Depends(verify_premium_security)])
async def assign_crew(body: AssignRequest, db: Session = Depends(get_db)):
    """Assign crew and equipment to a work order."""
    wo = db.query(WorkOrder).filter(WorkOrder.id == body.work_order_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail='Work order not found')

    wo.crew_assigned = ','.join(body.crew_ids)
    if body.equipment_ids:
        wo.equipment_assigned = ','.join(body.equipment_ids)
    if body.scheduled_date:
        wo.scheduled_date = datetime.fromisoformat(body.scheduled_date.replace('Z', '+00:00'))
    if wo.status == 'pending':
        wo.status = 'assigned'

    db.commit()
    return {
        'work_order_id': wo.id,
        'status': wo.status,
        'crew_assigned': wo.crew_assigned,
        'equipment_assigned': wo.equipment_assigned,
        'scheduled_date': wo.scheduled_date.isoformat() if wo.scheduled_date else None,
    }


@router.post('/unassign/{work_order_id}', dependencies=[Depends(verify_premium_security)])
async def unassign_crew(work_order_id: str, db: Session = Depends(get_db)):
    wo = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail='Work order not found')
    wo.crew_assigned = None
    wo.equipment_assigned = None
    wo.status = 'pending'
    db.commit()
    return {'work_order_id': wo.id, 'status': wo.status}


@router.post('/recommend', dependencies=[Depends(verify_premium_security)])
async def recommend_crew(body: AvailabilityQuery, db: Session = Depends(get_db)):
    """Score and rank available crew members for a job date + skill set."""
    members = (
        db.query(WorkforceMember)
        .filter(WorkforceMember.status == 'active')
        .all()
    )
    candidates = [
        {
            'id': m.id,
            'name': m.name,
            'role': m.role,
            'status': m.status,
            'skills': m.skills,
            'certifications': m.certifications,
        }
        for m in members
    ]
    ranked = rank_candidates(candidates, required_skills=body.skills_required or [])
    return {'recommendations': ranked[:10]}


@router.get('/availability', dependencies=[Depends(verify_premium_security)])
async def crew_availability(date: str, db: Session = Depends(get_db)):
    """Return crew members not already assigned on a given date."""
    from datetime import timedelta
    target = datetime.fromisoformat(date.replace('Z', '+00:00'))
    start = target.replace(hour=0, minute=0, second=0, tzinfo=timezone.utc)
    end = start + timedelta(days=1)

    assigned_wos = (
        db.query(WorkOrder)
        .filter(WorkOrder.scheduled_date >= start, WorkOrder.scheduled_date < end)
        .filter(WorkOrder.crew_assigned.isnot(None))
        .all()
    )
    assigned_ids: set[str] = set()
    for wo in assigned_wos:
        if wo.crew_assigned:
            assigned_ids.update(wo.crew_assigned.split(','))

    all_active = db.query(WorkforceMember).filter(WorkforceMember.status == 'active').all()
    return {
        'date': date,
        'available': [
            {'id': m.id, 'name': m.name, 'role': m.role}
            for m in all_active
            if m.id not in assigned_ids
        ],
        'assigned_count': len(assigned_ids),
    }
