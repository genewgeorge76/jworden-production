"""
jobbook.py — the job book, in the operator's own system.

  GET   /api/v1/jobbook/summary          the tiles
  GET   /api/v1/jobbook/jobs             list, filtered and paged
  GET   /api/v1/jobbook/jobs/{id}        one job
  POST  /api/v1/jobbook/jobs             raise a new one
  PATCH /api/v1/jobbook/jobs/{id}        change one
  GET   /api/v1/jobbook/map              the pins

WHY THIS EXISTS RATHER THAN A KICKSERV LOGIN
────────────────────────────────────────────
The business ran on Kickserv for a decade and nearly lost the lot twice — the
account was cancelled for a failed card in January 2019 and the magic-link
logins were failing again in 2023. 2,610 jobs, 2,263 customers and the entire
billing history sat behind somebody else's subscription. This is the same job
book on the operator's own database, which is backed up on his own schedule.

WHAT IT SHOWS AND WHAT IT REFUSES TO
────────────────────────────────────
Every figure is reported against the evidence behind it. The Kickserv export
sums to $41,295,234.93 across all rows, and that number includes 66 bids the
company LOST. A dashboard tile reading "$41.3M" would be a lie assembled
entirely from true rows, so there is no such tile: completed value, quoted
value and lost value are three numbers and they are never added together.

A RESIDENTIAL JOB IS A TOWN
───────────────────────────
1,955 of the 2,610 jobs are private driveways. Those customers hired a paving
crew; they did not agree to appear on a map or in a list with their address on
it. Residential rows carry a town and no street, no postcode and no coordinate,
here and everywhere else in this system.
"""

# No `from __future__ import annotations` — on the pinned FastAPI a
# @limiter.limit-wrapped endpoint resolves annotations against slowapi's
# globals and a body model degrades into a query parameter.

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from ..core.limiter import limiter
from ..core.security import verify_premium_security
from ..database import get_db
from ..models import ClientJobRecord
from ..services import job_ledger
from ..services.tenancy import is_owner, scope, stamp_for, tenant_of

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/jobbook", tags=["jobbook"])

COMMERCIAL = "commercial"
RESIDENTIAL = "residential"


def _require_operator(auth: dict) -> str:
    tenant = tenant_of(auth)
    if not is_owner(tenant):
        raise HTTPException(
            status_code=403,
            detail="The job book holds client contacts and contract values. Operator only.",
        )
    return tenant


class JobIn(BaseModel):
    client: Optional[str] = None
    category: str = Field(default=COMMERCIAL)
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    scope: Optional[str] = None
    role: Optional[str] = None
    store_number: Optional[str] = None
    program: Optional[str] = None
    invoice_number: Optional[str] = None
    amount: Optional[str] = Field(
        default=None, description="Dollars as a string. Stored as whole cents."
    )
    area_sqft: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    notes: Optional[str] = None


class JobPatch(JobIn):
    category: Optional[str] = None
    completed_on: Optional[str] = None
    evidence: Optional[str] = None


def _kind(payload_category: Optional[str]) -> Optional[str]:
    if payload_category is None:
        return None
    value = payload_category.strip().lower()
    if value not in (COMMERCIAL, RESIDENTIAL):
        raise HTTPException(
            status_code=400,
            detail=f"category must be '{COMMERCIAL}' or '{RESIDENTIAL}'.",
        )
    return value


@router.get("/summary", summary="The tiles, each against its own evidence")
@limiter.limit("60/minute")
def summary(
    request: Request,
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    """
    Counts and money per evidence grade, plus the geography.

    Deliberately no combined total. Summing completed work, open quotes and
    lost bids produces one big number assembled from true rows that means
    nothing — and it is the number a dashboard reaches for first.
    """
    tenant = _require_operator(auth)
    base = scope(db.query(ClientJobRecord), ClientJobRecord, tenant)

    grades = {}
    for grade in job_ledger.EVIDENCE_ORDER:
        rows = base.filter(ClientJobRecord.evidence == grade).with_entities(
            func.count(ClientJobRecord.id),
            func.coalesce(func.sum(ClientJobRecord.invoice_amount_cents), 0),
        ).one()
        grades[grade] = {
            "count": int(rows[0] or 0),
            "value": job_ledger.to_dollars(int(rows[1] or 0)),
            "publishable": job_ledger.is_publishable(grade),
            "means": job_ledger.EVIDENCE_MEANING.get(grade, ""),
        }

    kinds = dict(
        base.with_entities(ClientJobRecord.category, func.count(ClientJobRecord.id))
        .group_by(ClientJobRecord.category)
        .all()
    )
    states = (
        base.filter(ClientJobRecord.state.isnot(None))
        .with_entities(ClientJobRecord.state, func.count(ClientJobRecord.id))
        .group_by(ClientJobRecord.state)
        .order_by(func.count(ClientJobRecord.id).desc())
        .limit(20)
        .all()
    )

    return {
        "ok": True,
        "total_jobs": base.count(),
        "by_evidence": grades,
        "by_kind": {str(k or "unclassified"): v for k, v in kinds.items()},
        "by_state": [{"state": s, "jobs": n} for s, n in states],
        "mappable": base.filter(
            ClientJobRecord.latitude.isnot(None), ClientJobRecord.category == COMMERCIAL
        ).count(),
        "note": (
            "Completed, quoted and lost are three numbers and are never added "
            "together. A combined total would include work that was bid and not won."
        ),
    }


@router.get("/jobs", summary="The job list")
@limiter.limit("120/minute")
def list_jobs(
    request: Request,
    evidence: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    q: Optional[str] = Query(None, description="Client, city, scope, store or job number"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    tenant = _require_operator(auth)
    query = scope(db.query(ClientJobRecord), ClientJobRecord, tenant)

    if evidence:
        if evidence not in set(job_ledger.EVIDENCE_ORDER) | {"publishable"}:
            raise HTTPException(status_code=400, detail="Unknown evidence grade.")
        if evidence == "publishable":
            query = query.filter(ClientJobRecord.evidence.in_(tuple(job_ledger.PUBLISHABLE)))
        else:
            query = query.filter(ClientJobRecord.evidence == evidence)
    if category:
        query = query.filter(ClientJobRecord.category == _kind(category))
    if state:
        query = query.filter(ClientJobRecord.state == state.strip().upper())
    if q:
        needle = f"%{q.strip()}%"
        query = query.filter(
            or_(
                ClientJobRecord.client.ilike(needle),
                ClientJobRecord.city.ilike(needle),
                ClientJobRecord.scope.ilike(needle),
                ClientJobRecord.store_number.ilike(needle),
                ClientJobRecord.invoice_number.ilike(needle),
                ClientJobRecord.notes.ilike(needle),
            )
        )

    total = query.count()
    rows = (
        query.order_by(
            ClientJobRecord.completed_on.desc().nullslast(),
            ClientJobRecord.id.desc(),
        )
        .offset(offset)
        .limit(limit)
        .all()
    )
    return {
        "ok": True,
        "total": total,
        "offset": offset,
        "limit": limit,
        "jobs": [_as_dict(r) for r in rows],
    }


@router.get("/jobs/{job_id}", summary="One job")
@limiter.limit("120/minute")
def get_job(
    request: Request,
    job_id: int,
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    tenant = _require_operator(auth)
    row = (
        scope(db.query(ClientJobRecord), ClientJobRecord, tenant)
        .filter(ClientJobRecord.id == job_id)
        .first()
    )
    if row is None:
        raise HTTPException(status_code=404, detail="No such job")
    return {"ok": True, "job": _as_dict(row, full=True)}


@router.post("/jobs", summary="Raise a new job")
@limiter.limit("60/minute")
def create_job(
    request: Request,
    payload: JobIn,
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    """
    A job typed in by hand starts at `listed`.

    Not `completed`, however sure the person entering it is. Everything in this
    system earns its grade from a document, and a job raised this morning has
    none yet — the invoice or the completion photos move it up.
    """
    tenant = _require_operator(auth)
    category = _kind(payload.category) or COMMERCIAL
    residential = category == RESIDENTIAL

    row = ClientJobRecord(
        tenant_id=stamp_for(tenant),
        client=payload.client,
        category=category,
        # A residential job never stores a street, a postcode or a coordinate.
        address=None if residential else payload.address,
        city=payload.city,
        state=(payload.state or "").strip().upper() or None,
        postal_code=None if residential else payload.postal_code,
        latitude=None if residential else payload.latitude,
        longitude=None if residential else payload.longitude,
        scope=payload.scope,
        scope_source="entered by operator" if payload.scope else None,
        role=payload.role,
        role_source="entered by operator" if payload.role else None,
        store_number=payload.store_number,
        program=payload.program,
        invoice_number=payload.invoice_number,
        invoice_amount_cents=job_ledger.to_cents(payload.amount),
        job_total_cents=job_ledger.to_cents(payload.amount),
        area_sqft=payload.area_sqft,
        area_source="entered by operator" if payload.area_sqft else None,
        notes=payload.notes,
        source_document="jobbook",
        evidence=job_ledger.LISTED,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {
        "ok": True,
        "job": _as_dict(row, full=True),
        "note": (
            "Raised at 'listed'. Attach the invoice or the completion photos to "
            "move it up — nothing here grades itself."
        ),
    }


@router.patch("/jobs/{job_id}", summary="Change a job")
@limiter.limit("120/minute")
def update_job(
    request: Request,
    job_id: int,
    payload: JobPatch,
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    tenant = _require_operator(auth)
    row = (
        scope(db.query(ClientJobRecord), ClientJobRecord, tenant)
        .filter(ClientJobRecord.id == job_id)
        .first()
    )
    if row is None:
        raise HTTPException(status_code=404, detail="No such job")

    if payload.category is not None:
        row.category = _kind(payload.category)

    if payload.evidence is not None:
        if payload.evidence not in job_ledger.EVIDENCE_ORDER:
            raise HTTPException(status_code=400, detail="Unknown evidence grade.")
        # A grade may be raised by hand — the operator has the document in
        # front of him — but never lowered silently by a stray edit, and the
        # reason is recorded either way.
        if job_ledger.rank(payload.evidence) < job_ledger.rank(row.evidence):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"This job is already graded '{row.evidence}'. A grade is not "
                    "lowered by editing; correct the record it came from."
                ),
            )
        row.evidence = payload.evidence
        row.reviewed_at = datetime.now(timezone.utc)
        row.reviewed_by = auth.get("user") or "operator"

    if payload.completed_on is not None:
        row.completed_on = _parse_date(payload.completed_on)

    residential = (row.category or "").lower() == RESIDENTIAL
    simple = {
        "client": payload.client, "city": payload.city, "scope": payload.scope,
        "role": payload.role, "store_number": payload.store_number,
        "program": payload.program, "invoice_number": payload.invoice_number,
        "notes": payload.notes,
    }
    for field, value in simple.items():
        if value is not None:
            setattr(row, field, value.strip() or None if isinstance(value, str) else value)

    if payload.state is not None:
        row.state = payload.state.strip().upper() or None
    if payload.amount is not None:
        row.invoice_amount_cents = job_ledger.to_cents(payload.amount)
    if payload.area_sqft is not None:
        row.area_sqft = payload.area_sqft
        row.area_source = row.area_source or "entered by operator"

    # Never on a residential job, whatever was sent.
    if not residential:
        for field in ("address", "postal_code", "latitude", "longitude"):
            value = getattr(payload, field, None)
            if value is not None:
                setattr(row, field, value)

    db.commit()
    db.refresh(row)
    return {"ok": True, "job": _as_dict(row, full=True)}


@router.get("/map", summary="The pins")
@limiter.limit("60/minute")
def map_pins(
    request: Request,
    evidence: str = Query("publishable"),
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    """
    Commercial jobs that carry a real coordinate.

    Residential jobs are absent by construction — a pin on a house is the
    address by another name. A job without a coordinate is left off rather than
    placed at its town centre: a pin in the wrong car park is a false claim
    with a map reference attached.
    """
    tenant = _require_operator(auth)
    query = scope(db.query(ClientJobRecord), ClientJobRecord, tenant).filter(
        ClientJobRecord.category == COMMERCIAL,
        ClientJobRecord.latitude.isnot(None),
        ClientJobRecord.longitude.isnot(None),
    )
    if evidence == "publishable":
        query = query.filter(ClientJobRecord.evidence.in_(tuple(job_ledger.PUBLISHABLE)))
    elif evidence != "all":
        query = query.filter(ClientJobRecord.evidence == evidence)

    rows = query.limit(2000).all()
    return {
        "ok": True,
        "count": len(rows),
        "pins": [
            {
                "id": r.id,
                "lat": r.latitude,
                "lon": r.longitude,
                "label": r.label_for_map(),
                "client": r.client,
                "city": r.city,
                "state": r.state,
                "evidence": r.evidence,
                "amount": job_ledger.to_dollars(r.invoice_amount_cents),
                "completed_on": r.completed_on.date().isoformat() if r.completed_on else None,
            }
            for r in rows
        ],
    }


def _parse_date(value: str) -> Optional[datetime]:
    text = (value or "").strip()
    if not text:
        return None
    for fmt in ("%Y-%m-%d", "%m/%d/%Y"):
        try:
            return datetime.strptime(text, fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    raise HTTPException(status_code=400, detail="completed_on must be YYYY-MM-DD.")


def _as_dict(row: ClientJobRecord, *, full: bool = False) -> dict:
    residential = (row.category or "").lower() == RESIDENTIAL
    data = {
        "id": row.id,
        "client": row.client,
        "category": row.category,
        # A residential job is a town. Not on the list, not in the detail, not
        # on the map — there is no view in this system that shows the street.
        "address": None if residential else row.address,
        "city": row.city,
        "state": row.state,
        "store_number": row.store_number,
        "invoice_number": row.invoice_number,
        "amount": job_ledger.to_dollars(row.invoice_amount_cents),
        "evidence": row.evidence,
        "evidence_means": job_ledger.EVIDENCE_MEANING.get(row.evidence, ""),
        "publishable": job_ledger.is_publishable(row.evidence),
        "completed_on": row.completed_on.date().isoformat() if row.completed_on else None,
        "has_pin": bool(row.latitude and row.longitude and not residential),
    }
    if not full:
        return data
    data.update(
        {
            "postal_code": None if residential else row.postal_code,
            "latitude": None if residential else row.latitude,
            "longitude": None if residential else row.longitude,
            "program": row.program,
            "scope": row.scope,
            "scope_source": row.scope_source,
            "role": row.role,
            "role_source": row.role_source,
            "area_sqft": row.area_sqft,
            "area_source": row.area_source,
            "job_total": job_ledger.to_dollars(row.job_total_cents),
            "amount_paid": job_ledger.to_dollars(row.amount_paid_cents),
            "paid_date": row.paid_date.date().isoformat() if row.paid_date else None,
            "check_number": row.check_number,
            "job_status": row.job_status,
            "outstanding_issues": row.outstanding_issues,
            "source_document": row.source_document,
            "notes": row.notes,
        }
    )
    return data
