"""
customers.py — CRM Customer and Service History router.

Routes (under /api/v1/customers):
  POST /            create customer
  GET  /            list customers (paginated, filterable)
  GET  /stats/overview  CRM stats
  GET  /{id}        get customer
  PATCH /{id}       update customer
  GET  /{id}/history   service history
  POST /{id}/history   add service history entry
"""
from __future__ import annotations

import csv
import hashlib
import io
import json
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.cache import (
    CUSTOMERS_TTL,
    KEY_CUSTOMERS_STATS,
    cache_get,
    cache_set,
    invalidate_customer_caches,
)
from ..core.limiter import CUSTOMERS_LIMIT, limiter
from ..core.security import verify_premium_security
from ..database import get_db
from ..models import Customer, ServiceHistory

logger = logging.getLogger(__name__)

router = APIRouter(prefix='/customers', tags=['customers'])

_VALID_TYPES = {'residential', 'commercial', 'franchise', 'municipal'}
_VALID_STATES = {
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID',
    'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS',
    'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK',
    'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV',
    'WI', 'WY', 'DC',
}


def _validate_state(s: Optional[str]) -> Optional[str]:
    if not s:
        return None
    upper = s.upper().strip()
    if upper not in _VALID_STATES:
        raise HTTPException(422, f'Invalid state code: {s!r}')
    return upper


# ── Schemas ───────────────────────────────────────────────────────────────────

class CustomerCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    city: Optional[str] = None
    state_code: Optional[str] = None
    customer_type: str = 'residential'
    is_franchise: bool = False
    brand: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None


class CustomerOut(BaseModel):
    id: int
    name: str
    email: Optional[str]
    phone: Optional[str]
    company: Optional[str]
    city: Optional[str]
    state_code: Optional[str]
    customer_type: str
    is_franchise: bool
    brand: Optional[str]
    total_jobs: int
    total_revenue: float
    created_at: datetime

    model_config = {'from_attributes': True}


class ServiceHistoryCreate(BaseModel):
    job_date: Optional[datetime] = None
    service_type: Optional[str] = None
    address: Optional[str] = None
    state_code: Optional[str] = None
    revenue: Optional[float] = None
    notes: Optional[str] = None


class ImportResult(BaseModel):
    imported: int
    skipped: int
    errors: list[str]


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post('/', summary='Create a customer', response_model=CustomerOut)
@limiter.limit(CUSTOMERS_LIMIT)
async def create_customer(
    request: Request,
    body: CustomerCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    if body.customer_type not in _VALID_TYPES:
        raise HTTPException(422, f'Invalid customer_type. Must be one of: {", ".join(sorted(_VALID_TYPES))}')

    customer = Customer(
        **{k: v for k, v in body.model_dump().items() if k != 'state_code'},
        state_code=_validate_state(body.state_code),
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    invalidate_customer_caches()
    return customer


@router.get('/', summary='List customers')
@limiter.limit(CUSTOMERS_LIMIT)
async def list_customers(
    request: Request,
    customer_type: Optional[str] = Query(default=None, max_length=30),
    is_franchise: Optional[bool] = Query(default=None),
    search: Optional[str] = Query(default=None, max_length=100),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    params = json.dumps(
        {'type': customer_type, 'franchise': is_franchise, 'q': search, 'limit': limit, 'offset': offset},
        sort_keys=True,
    )
    cache_key = f'customers:list:{hashlib.md5(params.encode()).hexdigest()}'  # noqa: S324
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    q = db.query(Customer)
    if customer_type:
        q = q.filter(Customer.customer_type == customer_type)
    if is_franchise is not None:
        q = q.filter(Customer.is_franchise == is_franchise)
    if search:
        like = f'%{search}%'
        q = q.filter(
            Customer.name.ilike(like)
            | Customer.email.ilike(like)
            | Customer.company.ilike(like)
        )
    total = q.count()
    items = q.order_by(Customer.created_at.desc()).offset(offset).limit(limit).all()

    result = {
        'total': total,
        'offset': offset,
        'limit': limit,
        'items': [
            {
                'id': c.id,
                'name': c.name,
                'email': c.email,
                'phone': c.phone,
                'company': c.company,
                'city': c.city,
                'state_code': c.state_code,
                'customer_type': c.customer_type,
                'is_franchise': c.is_franchise,
                'brand': c.brand,
                'total_jobs': c.total_jobs,
                'total_revenue': c.total_revenue,
                'created_at': c.created_at.isoformat(),
            }
            for c in items
        ],
    }
    cache_set(cache_key, result, CUSTOMERS_TTL)
    return result


@router.get('/stats/overview', summary='CRM statistics overview')
async def customer_stats(
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    cached = cache_get(KEY_CUSTOMERS_STATS)
    if cached is not None:
        return cached

    from sqlalchemy import func  # noqa: PLC0415

    total = db.query(Customer).count()
    franchise = db.query(Customer).filter(Customer.is_franchise == True).count()  # noqa: E712
    states = db.query(Customer.state_code).distinct().count()
    jobs_total = db.query(ServiceHistory).count()
    rev_total = db.query(func.sum(Customer.total_revenue)).scalar() or 0.0

    result = {
        'total_customers': total,
        'franchise_accounts': franchise,
        'states_represented': states,
        'total_jobs_on_record': jobs_total,
        'total_revenue_on_record': round(float(rev_total), 2),
    }
    cache_set(KEY_CUSTOMERS_STATS, result, CUSTOMERS_TTL)
    return result


@router.get('/{customer_id}', summary='Get a customer', response_model=CustomerOut)
async def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    c = db.get(Customer, customer_id)
    if not c:
        raise HTTPException(404, 'Customer not found')
    return c


@router.patch('/{customer_id}', summary='Update a customer')
async def update_customer(
    customer_id: int,
    body: CustomerCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    c = db.get(Customer, customer_id)
    if not c:
        raise HTTPException(404, 'Customer not found')

    for k, v in body.model_dump(exclude_unset=True).items():
        if k == 'state_code':
            v = _validate_state(v)
        setattr(c, k, v)

    c.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(c)
    invalidate_customer_caches(customer_id)
    return c


@router.get('/{customer_id}/history', summary='Get service history for a customer')
async def get_service_history(
    customer_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    c = db.get(Customer, customer_id)
    if not c:
        raise HTTPException(404, 'Customer not found')

    items = (
        db.query(ServiceHistory)
        .filter(ServiceHistory.customer_id == customer_id)
        .order_by(ServiceHistory.job_date.desc())
        .all()
    )
    return {
        'customer_id': customer_id,
        'jobs': len(items),
        'history': [
            {
                'id': h.id,
                'job_date': h.job_date.isoformat() if h.job_date else None,
                'service_type': h.service_type,
                'address': h.address,
                'state_code': h.state_code,
                'revenue': h.revenue,
                'notes': h.notes,
            }
            for h in items
        ],
    }


@router.post('/{customer_id}/history', summary='Add a service history entry')
async def add_service_history(
    customer_id: int,
    body: ServiceHistoryCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    c = db.get(Customer, customer_id)
    if not c:
        raise HTTPException(404, 'Customer not found')

    entry = ServiceHistory(
        customer_id=customer_id,
        job_date=body.job_date,
        service_type=body.service_type,
        address=body.address,
        state_code=_validate_state(body.state_code),
        revenue=body.revenue,
        notes=body.notes,
    )
    db.add(entry)

    c.total_jobs += 1
    if body.revenue:
        c.total_revenue += body.revenue
    c.last_job_date = body.job_date or datetime.now(timezone.utc)
    c.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(entry)
    invalidate_customer_caches(customer_id)
    return entry


@router.post('/import', summary='Bulk import customers from JSON or CSV', response_model=ImportResult)
@limiter.limit('5/minute')
async def import_customers(
    request: Request,
    file: UploadFile = File(...),
    source: str = Query(default='import', max_length=60),
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    content = await file.read()
    text = content.decode('utf-8-sig', errors='replace')

    records: list[dict] = []
    errors: list[str] = []

    if file.filename and file.filename.lower().endswith('.csv'):
        reader = csv.DictReader(io.StringIO(text))
        for i, row in enumerate(reader):
            records.append({k.strip(): v.strip() for k, v in row.items()})
    else:
        try:
            records = json.loads(text)
            if not isinstance(records, list):
                raise ValueError('JSON must be an array')
        except (json.JSONDecodeError, ValueError) as exc:
            raise HTTPException(422, f'Invalid file format: {exc}') from exc

    imported = 0
    skipped = 0

    for i, rec in enumerate(records):
        name = rec.get('name', '').strip()
        if not name:
            errors.append(f'Row {i + 1}: missing name — skipped')
            skipped += 1
            continue
        try:
            customer = Customer(
                name=name,
                email=rec.get('email') or None,
                phone=rec.get('phone') or None,
                company=rec.get('company') or None,
                city=rec.get('city') or None,
                state_code=_validate_state(rec.get('state_code') or rec.get('state') or None),
                customer_type=rec.get('customer_type', 'residential'),
                is_franchise=str(rec.get('is_franchise', 'false')).lower() in ('1', 'true', 'yes'),
                brand=rec.get('brand') or None,
                source=source,
            )
            db.add(customer)
            imported += 1
        except HTTPException as exc:
            errors.append(f'Row {i + 1} ({name}): {exc.detail}')
            skipped += 1
        except Exception as exc:
            errors.append(f'Row {i + 1} ({name}): {exc}')
            skipped += 1

    db.commit()
    invalidate_customer_caches()
    return ImportResult(imported=imported, skipped=skipped, errors=errors[:50])
