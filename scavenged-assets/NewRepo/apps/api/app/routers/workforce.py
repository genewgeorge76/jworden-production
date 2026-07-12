"""Workforce — employee CRUD, cert tracking, expiry alerts."""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.security import verify_premium_security
from ..database import get_db
from ..models import WorkforceMember

router = APIRouter(prefix='/workforce', tags=['workforce'])


class MemberCreate(BaseModel):
    name: str
    role: str
    email: str | None = None
    phone: str | None = None
    skills: list[str] | None = None
    certifications: list[dict] | None = None   # [{name, expiry}]
    license_number: str | None = None
    license_expiry: str | None = None
    osha_card_expiry: str | None = None
    hire_date: str | None = None
    hourly_rate: float | None = None
    notes: str | None = None


class MemberUpdate(BaseModel):
    name: str | None = None
    role: str | None = None
    status: str | None = None
    email: str | None = None
    phone: str | None = None
    skills: list[str] | None = None
    certifications: list[dict] | None = None
    license_number: str | None = None
    license_expiry: str | None = None
    osha_card_expiry: str | None = None
    hourly_rate: float | None = None
    notes: str | None = None


def _parse_dt(s: str | None) -> datetime | None:
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace('Z', '+00:00'))
    except ValueError:
        return None


def _serialize(m: WorkforceMember) -> dict:
    return {
        'id': m.id,
        'name': m.name,
        'role': m.role,
        'status': m.status,
        'email': m.email,
        'phone': m.phone,
        'skills': json.loads(m.skills) if m.skills else [],
        'certifications': json.loads(m.certifications) if m.certifications else [],
        'license_number': m.license_number,
        'license_expiry': m.license_expiry.isoformat() if m.license_expiry else None,
        'osha_card_expiry': m.osha_card_expiry.isoformat() if m.osha_card_expiry else None,
        'hire_date': m.hire_date.isoformat() if m.hire_date else None,
        'hourly_rate': m.hourly_rate,
        'notes': m.notes,
        'created_at': m.created_at.isoformat(),
    }


@router.post('/', dependencies=[Depends(verify_premium_security)])
async def create_member(body: MemberCreate, db: Session = Depends(get_db)):
    m = WorkforceMember(
        id=str(uuid.uuid4()),
        name=body.name,
        role=body.role,
        email=body.email,
        phone=body.phone,
        skills=json.dumps(body.skills or []),
        certifications=json.dumps(body.certifications or []),
        license_number=body.license_number,
        license_expiry=_parse_dt(body.license_expiry),
        osha_card_expiry=_parse_dt(body.osha_card_expiry),
        hire_date=_parse_dt(body.hire_date),
        hourly_rate=body.hourly_rate,
        notes=body.notes,
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return _serialize(m)


@router.get('/', dependencies=[Depends(verify_premium_security)])
async def list_members(
    status: str | None = None,
    role: str | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(WorkforceMember)
    if status:
        q = q.filter(WorkforceMember.status == status)
    if role:
        q = q.filter(WorkforceMember.role.ilike(f'%{role}%'))
    members = q.order_by(WorkforceMember.name).all()
    return {'members': [_serialize(m) for m in members], 'total': len(members)}


@router.get('/expiring-certs', dependencies=[Depends(verify_premium_security)])
async def expiring_certs(days: int = 30, db: Session = Depends(get_db)):
    """Return members with licenses or OSHA cards expiring within `days` days."""
    cutoff = datetime.now(timezone.utc) + timedelta(days=days)
    alerts = []
    members = db.query(WorkforceMember).filter(WorkforceMember.status == 'active').all()
    for m in members:
        if m.license_expiry and m.license_expiry <= cutoff:
            alerts.append({'member_id': m.id, 'name': m.name, 'cert': 'Contractor License', 'expiry': m.license_expiry.isoformat()})
        if m.osha_card_expiry and m.osha_card_expiry <= cutoff:
            alerts.append({'member_id': m.id, 'name': m.name, 'cert': 'OSHA Card', 'expiry': m.osha_card_expiry.isoformat()})
        certs = json.loads(m.certifications or '[]')
        for cert in certs:
            exp_str = cert.get('expiry')
            if exp_str:
                try:
                    exp = datetime.fromisoformat(exp_str.replace('Z', '+00:00'))
                    if exp <= cutoff:
                        alerts.append({'member_id': m.id, 'name': m.name, 'cert': cert.get('name', 'Unknown'), 'expiry': exp.isoformat()})
                except ValueError:
                    pass
    alerts.sort(key=lambda x: x['expiry'])
    return {'alerts': alerts, 'count': len(alerts)}


@router.get('/{member_id}', dependencies=[Depends(verify_premium_security)])
async def get_member(member_id: str, db: Session = Depends(get_db)):
    m = db.query(WorkforceMember).filter(WorkforceMember.id == member_id).first()
    if not m:
        raise HTTPException(status_code=404, detail='Member not found')
    return _serialize(m)


@router.patch('/{member_id}', dependencies=[Depends(verify_premium_security)])
async def update_member(member_id: str, body: MemberUpdate, db: Session = Depends(get_db)):
    m = db.query(WorkforceMember).filter(WorkforceMember.id == member_id).first()
    if not m:
        raise HTTPException(status_code=404, detail='Member not found')
    if body.name is not None:
        m.name = body.name
    if body.role is not None:
        m.role = body.role
    if body.status is not None:
        m.status = body.status
    if body.email is not None:
        m.email = body.email
    if body.phone is not None:
        m.phone = body.phone
    if body.skills is not None:
        m.skills = json.dumps(body.skills)
    if body.certifications is not None:
        m.certifications = json.dumps(body.certifications)
    if body.license_number is not None:
        m.license_number = body.license_number
    if body.license_expiry is not None:
        m.license_expiry = _parse_dt(body.license_expiry)
    if body.osha_card_expiry is not None:
        m.osha_card_expiry = _parse_dt(body.osha_card_expiry)
    if body.hourly_rate is not None:
        m.hourly_rate = body.hourly_rate
    if body.notes is not None:
        m.notes = body.notes
    db.commit()
    db.refresh(m)
    return _serialize(m)


@router.delete('/{member_id}', dependencies=[Depends(verify_premium_security)])
async def terminate_member(member_id: str, db: Session = Depends(get_db)):
    m = db.query(WorkforceMember).filter(WorkforceMember.id == member_id).first()
    if not m:
        raise HTTPException(status_code=404, detail='Member not found')
    m.status = 'terminated'
    db.commit()
    return {'member_id': member_id, 'status': 'terminated'}
