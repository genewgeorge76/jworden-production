"""Operations — work orders CRUD + job lifecycle management."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.security import verify_premium_security
from ..database import get_db
from ..models import WorkOrder, Job, Lead

router = APIRouter(prefix='/operations', tags=['operations'])

VALID_STATUSES = {'pending', 'assigned', 'in_progress', 'complete', 'cancelled'}


class WorkOrderCreate(BaseModel):
    title: str
    description: str | None = None
    job_id: str | None = None
    lead_id: str | None = None
    site_address: str | None = None
    crew_assigned: str | None = None    # comma-separated crew IDs
    equipment_assigned: str | None = None
    scheduled_date: str | None = None   # ISO datetime string


class WorkOrderUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    crew_assigned: str | None = None
    equipment_assigned: str | None = None
    scheduled_date: str | None = None
    notes: str | None = None


def _parse_dt(s: str | None) -> datetime | None:
    if not s:
        return None
    return datetime.fromisoformat(s.replace('Z', '+00:00')).replace(tzinfo=timezone.utc) if s.endswith('Z') else datetime.fromisoformat(s)


def _serialize(wo: WorkOrder) -> dict:
    return {
        'id': wo.id,
        'title': wo.title,
        'description': wo.description,
        'job_id': wo.job_id,
        'lead_id': wo.lead_id,
        'site_address': wo.site_address,
        'status': wo.status,
        'crew_assigned': wo.crew_assigned,
        'equipment_assigned': wo.equipment_assigned,
        'scheduled_date': wo.scheduled_date.isoformat() if wo.scheduled_date else None,
        'started_at': wo.started_at.isoformat() if wo.started_at else None,
        'completed_at': wo.completed_at.isoformat() if wo.completed_at else None,
        'notes': wo.notes,
        'created_at': wo.created_at.isoformat(),
    }


@router.post('/work-orders', dependencies=[Depends(verify_premium_security)])
async def create_work_order(body: WorkOrderCreate, db: Session = Depends(get_db)):
    wo = WorkOrder(
        id=str(uuid.uuid4()),
        title=body.title,
        description=body.description,
        job_id=body.job_id,
        lead_id=body.lead_id,
        site_address=body.site_address,
        crew_assigned=body.crew_assigned,
        equipment_assigned=body.equipment_assigned,
        scheduled_date=_parse_dt(body.scheduled_date),
    )
    db.add(wo)
    db.commit()
    db.refresh(wo)
    return _serialize(wo)


@router.get('/work-orders', dependencies=[Depends(verify_premium_security)])
async def list_work_orders(
    status: str | None = None,
    job_id: str | None = None,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    q = db.query(WorkOrder)
    if status:
        q = q.filter(WorkOrder.status == status)
    if job_id:
        q = q.filter(WorkOrder.job_id == job_id)
    items = q.order_by(WorkOrder.scheduled_date.asc()).limit(limit).all()
    return {'work_orders': [_serialize(wo) for wo in items], 'total': len(items)}


@router.get('/work-orders/{work_order_id}', dependencies=[Depends(verify_premium_security)])
async def get_work_order(work_order_id: str, db: Session = Depends(get_db)):
    wo = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail='Work order not found')
    return _serialize(wo)


@router.patch('/work-orders/{work_order_id}', dependencies=[Depends(verify_premium_security)])
async def update_work_order(
    work_order_id: str,
    body: WorkOrderUpdate,
    db: Session = Depends(get_db),
):
    wo = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail='Work order not found')

    if body.status and body.status not in VALID_STATUSES:
        raise HTTPException(status_code=422, detail=f'status must be one of {VALID_STATUSES}')

    if body.title is not None:
        wo.title = body.title
    if body.description is not None:
        wo.description = body.description
    if body.notes is not None:
        wo.notes = body.notes
    if body.crew_assigned is not None:
        wo.crew_assigned = body.crew_assigned
    if body.equipment_assigned is not None:
        wo.equipment_assigned = body.equipment_assigned
    if body.scheduled_date is not None:
        wo.scheduled_date = _parse_dt(body.scheduled_date)
    if body.status:
        old_status = wo.status
        wo.status = body.status
        if body.status == 'in_progress' and old_status != 'in_progress':
            wo.started_at = datetime.now(timezone.utc)
        elif body.status == 'complete' and not wo.completed_at:
            wo.completed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(wo)
    return _serialize(wo)


@router.delete('/work-orders/{work_order_id}', dependencies=[Depends(verify_premium_security)])
async def delete_work_order(work_order_id: str, db: Session = Depends(get_db)):
    wo = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail='Work order not found')
    db.delete(wo)
    db.commit()
    return {'deleted': work_order_id}


@router.get('/work-orders/stats/summary', dependencies=[Depends(verify_premium_security)])
async def work_order_summary(db: Session = Depends(get_db)):
    from sqlalchemy import func
    counts = (
        db.query(WorkOrder.status, func.count(WorkOrder.id))
        .group_by(WorkOrder.status)
        .all()
    )
    return {'by_status': {status: count for status, count in counts}}


@router.get('/jobs/pipeline', dependencies=[Depends(verify_premium_security)])
async def jobs_pipeline(db: Session = Depends(get_db)):
    """Aggregate job pipeline by status with revenue totals."""
    from sqlalchemy import func
    pipeline = (
        db.query(Job.status, func.count(Job.id), func.sum(Job.bid))
        .group_by(Job.status)
        .all()
    )
    return {
        'pipeline': [
            {'status': status, 'count': count, 'total_bid': float(total or 0)}
            for status, count, total in pipeline
        ]
    }
