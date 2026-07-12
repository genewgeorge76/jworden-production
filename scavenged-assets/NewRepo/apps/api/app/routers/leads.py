import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..core.limiter import limiter, LEADS_LIMIT
from ..core.security import verify_premium_security
from ..database import get_db
from ..models import Lead

router = APIRouter(prefix='/leads', tags=['leads'])

_AUTH = Depends(verify_premium_security)


class LeadCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    service: str | None = None
    description: str | None = None
    estimated_value: float | None = None
    source: str | None = None


class LeadUpdate(BaseModel):
    status: str | None = None
    tier: str | None = None
    score: int | None = None
    estimated_value: float | None = None


class LeadOut(BaseModel):
    model_config = {'from_attributes': True}
    id: str
    name: str
    email: str | None
    phone: str | None
    city: str | None
    state: str | None
    service: str | None
    estimated_value: float | None
    tier: str | None
    score: int | None
    status: str
    source: str | None
    created_at: datetime
    updated_at: datetime


DB = Annotated[Session, Depends(get_db)]


@router.post('/contact', response_model=LeadOut, status_code=201)
@limiter.limit(LEADS_LIMIT)
async def create_lead(request: Request, body: LeadCreate, db: DB):
    lead = Lead(
        id=f'WEB-{uuid.uuid4().hex[:8].upper()}',
        **body.model_dump(),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@router.get('/', response_model=list[LeadOut], dependencies=[_AUTH])
def list_leads(status: str | None = None, limit: int = 50, db: DB = None):
    q = db.query(Lead)
    if status:
        q = q.filter(Lead.status == status)
    return q.order_by(Lead.created_at.desc()).limit(limit).all()


@router.get('/{lead_id}', response_model=LeadOut, dependencies=[_AUTH])
def get_lead(lead_id: str, db: DB):
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(404, 'Lead not found')
    return lead


@router.patch('/{lead_id}', response_model=LeadOut, dependencies=[_AUTH])
def update_lead(lead_id: str, body: LeadUpdate, db: DB):
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(404, 'Lead not found')
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(lead, k, v)
    lead.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(lead)
    return lead
