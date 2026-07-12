"""Subcontractors — sub directory, performance reviews, expiry alerts."""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.security import verify_premium_security
from ..database import get_db
from ..models import SubcontractorRoster, SubcontractorPerformance

router = APIRouter(prefix='/subcontractors', tags=['subcontractors'])


class SubCreate(BaseModel):
    company_name: str
    contact_name: str | None = None
    email: str | None = None
    phone: str | None = None
    trade_specialty: str | None = None
    states_licensed: list[str] | None = None
    license_number: str | None = None
    license_expiry: str | None = None
    insurance_expiry: str | None = None
    insurance_limit: float | None = None
    bonded: bool = False
    notes: str | None = None


class SubUpdate(BaseModel):
    company_name: str | None = None
    contact_name: str | None = None
    email: str | None = None
    phone: str | None = None
    trade_specialty: str | None = None
    states_licensed: list[str] | None = None
    status: str | None = None
    license_number: str | None = None
    license_expiry: str | None = None
    insurance_expiry: str | None = None
    insurance_limit: float | None = None
    bonded: bool | None = None
    notes: str | None = None


class PerformanceReview(BaseModel):
    job_id: str | None = None
    job_date: str | None = None
    quality_score: int      # 1–5
    schedule_score: int
    communication_score: int
    would_rehire: bool
    notes: str | None = None


def _parse_dt(s: str | None) -> datetime | None:
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace('Z', '+00:00'))
    except ValueError:
        return None


def _serialize(s: SubcontractorRoster) -> dict:
    return {
        'id': s.id,
        'company_name': s.company_name,
        'contact_name': s.contact_name,
        'email': s.email,
        'phone': s.phone,
        'trade_specialty': s.trade_specialty,
        'states_licensed': s.states_licensed.split(',') if s.states_licensed else [],
        'license_number': s.license_number,
        'license_expiry': s.license_expiry.isoformat() if s.license_expiry else None,
        'insurance_expiry': s.insurance_expiry.isoformat() if s.insurance_expiry else None,
        'insurance_limit': s.insurance_limit,
        'bonded': s.bonded,
        'status': s.status,
        'rating': s.rating,
        'notes': s.notes,
        'created_at': s.created_at.isoformat(),
    }


@router.post('/', dependencies=[Depends(verify_premium_security)])
async def create_sub(body: SubCreate, db: Session = Depends(get_db)):
    sub = SubcontractorRoster(
        id=str(uuid.uuid4()),
        company_name=body.company_name,
        contact_name=body.contact_name,
        email=body.email,
        phone=body.phone,
        trade_specialty=body.trade_specialty,
        states_licensed=','.join(body.states_licensed) if body.states_licensed else None,
        license_number=body.license_number,
        license_expiry=_parse_dt(body.license_expiry),
        insurance_expiry=_parse_dt(body.insurance_expiry),
        insurance_limit=body.insurance_limit,
        bonded=body.bonded,
        notes=body.notes,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return _serialize(sub)


@router.get('/', dependencies=[Depends(verify_premium_security)])
async def list_subs(
    status: str | None = None,
    trade: str | None = None,
    state: str | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(SubcontractorRoster)
    if status:
        q = q.filter(SubcontractorRoster.status == status)
    if trade:
        q = q.filter(SubcontractorRoster.trade_specialty.ilike(f'%{trade}%'))
    if state:
        q = q.filter(SubcontractorRoster.states_licensed.contains(state))
    subs = q.order_by(SubcontractorRoster.company_name).all()
    return {'subcontractors': [_serialize(s) for s in subs], 'total': len(subs)}


@router.get('/expiring', dependencies=[Depends(verify_premium_security)])
async def expiring_compliance(days: int = 30, db: Session = Depends(get_db)):
    cutoff = datetime.now(timezone.utc) + timedelta(days=days)
    alerts = []
    subs = db.query(SubcontractorRoster).filter(SubcontractorRoster.status == 'active').all()
    for s in subs:
        if s.license_expiry and s.license_expiry <= cutoff:
            alerts.append({'sub_id': s.id, 'company': s.company_name, 'issue': 'License expiring', 'expiry': s.license_expiry.isoformat()})
        if s.insurance_expiry and s.insurance_expiry <= cutoff:
            alerts.append({'sub_id': s.id, 'company': s.company_name, 'issue': 'Insurance expiring', 'expiry': s.insurance_expiry.isoformat()})
    alerts.sort(key=lambda x: x['expiry'])
    return {'alerts': alerts, 'count': len(alerts)}


@router.get('/{sub_id}', dependencies=[Depends(verify_premium_security)])
async def get_sub(sub_id: str, db: Session = Depends(get_db)):
    s = db.query(SubcontractorRoster).filter(SubcontractorRoster.id == sub_id).first()
    if not s:
        raise HTTPException(status_code=404, detail='Subcontractor not found')
    reviews = db.query(SubcontractorPerformance).filter(SubcontractorPerformance.sub_id == sub_id).all()
    result = _serialize(s)
    result['performance_reviews'] = [
        {'id': r.id, 'job_date': r.job_date.isoformat() if r.job_date else None,
         'quality': r.quality_score, 'schedule': r.schedule_score,
         'communication': r.communication_score, 'would_rehire': r.would_rehire, 'notes': r.notes}
        for r in reviews
    ]
    return result


@router.patch('/{sub_id}', dependencies=[Depends(verify_premium_security)])
async def update_sub(sub_id: str, body: SubUpdate, db: Session = Depends(get_db)):
    s = db.query(SubcontractorRoster).filter(SubcontractorRoster.id == sub_id).first()
    if not s:
        raise HTTPException(status_code=404, detail='Subcontractor not found')
    for field, val in body.model_dump(exclude_none=True).items():
        if field == 'states_licensed' and isinstance(val, list):
            setattr(s, field, ','.join(val))
        else:
            if hasattr(s, field):
                setattr(s, field, _parse_dt(val) if field.endswith('_expiry') and val else val)
    db.commit()
    db.refresh(s)
    return _serialize(s)


@router.post('/{sub_id}/performance', dependencies=[Depends(verify_premium_security)])
async def add_review(sub_id: str, body: PerformanceReview, db: Session = Depends(get_db)):
    s = db.query(SubcontractorRoster).filter(SubcontractorRoster.id == sub_id).first()
    if not s:
        raise HTTPException(status_code=404, detail='Subcontractor not found')
    rev = SubcontractorPerformance(
        sub_id=sub_id,
        job_id=body.job_id,
        job_date=_parse_dt(body.job_date),
        quality_score=body.quality_score,
        schedule_score=body.schedule_score,
        communication_score=body.communication_score,
        would_rehire=body.would_rehire,
        notes=body.notes,
    )
    db.add(rev)
    # Update aggregate rating
    all_reviews = db.query(SubcontractorPerformance).filter(SubcontractorPerformance.sub_id == sub_id).all()
    scores = [((r.quality_score or 0) + (r.schedule_score or 0) + (r.communication_score or 0)) / 3 for r in all_reviews]
    scores.append((body.quality_score + body.schedule_score + body.communication_score) / 3)
    s.rating = round(sum(scores) / len(scores), 2)
    db.commit()
    return {'sub_id': sub_id, 'rating': s.rating}


@router.delete('/{sub_id}', dependencies=[Depends(verify_premium_security)])
async def deactivate_sub(sub_id: str, db: Session = Depends(get_db)):
    s = db.query(SubcontractorRoster).filter(SubcontractorRoster.id == sub_id).first()
    if not s:
        raise HTTPException(status_code=404, detail='Subcontractor not found')
    s.status = 'inactive'
    db.commit()
    return {'sub_id': sub_id, 'status': 'inactive'}
