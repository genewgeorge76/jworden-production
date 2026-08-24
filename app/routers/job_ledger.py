"""
job_ledger.py — the paperwork behind a claim, and what it actually proves.

  POST /api/v1/job-ledger/import      a programme sheet or a punch list
  GET  /api/v1/job-ledger/records     what is recorded, filtered by grade
  GET  /api/v1/job-ledger/summary     how much of it is actually evidence
  POST /api/v1/job-ledger/records/{id}/publish

Operator only, for the same reason as the photo archive: these are the
operator's client invoices, and the amounts on them are commercially
confidential to both sides.
"""

# Deliberately NO `from __future__ import annotations`. On the pinned FastAPI a
# @limiter.limit-wrapped endpoint resolves annotations against slowapi's module
# globals, the body model degrades to a ForwardRef, and the endpoint demands a
# query parameter named "body" while rejecting the JSON it was sent.

import logging
from datetime import datetime, timezone
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..core.limiter import limiter
from ..core.security import verify_premium_security
from ..database import get_db
from ..models import ClientJobRecord
from fastapi.responses import Response

from ..services import job_ledger, saved_places
from ..services.tenancy import is_owner, scope, stamp_for, tenant_of

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/job-ledger", tags=["job-ledger"])


def _require_operator(auth: dict) -> str:
    tenant = tenant_of(auth)
    if not is_owner(tenant):
        raise HTTPException(
            status_code=403,
            detail="The job ledger holds client invoices and belongs to the platform operator.",
        )
    return tenant


class ImportRequest(BaseModel):
    """
    Either a spreadsheet's rows or a punch list's text, never both in one call.

    They are graded by opposite rules — a sheet row can be evidence of work
    performed, a punch-list line is by definition work not yet performed — and
    mixing them in one request is how the two get confused.
    """

    rows: Optional[List[List[Any]]] = None
    punch_list_text: Optional[str] = None
    client: Optional[str] = None
    program: Optional[str] = None
    category: Optional[str] = None
    source_document: Optional[str] = Field(
        default=None,
        description="The filename this came from, so a record stays checkable.",
    )


class PublishRequest(BaseModel):
    published: bool = True
    notes: Optional[str] = None


@router.post("/import", summary="Record a programme sheet or a punch list")
@limiter.limit("10/minute")
def import_document(
    request: Request,
    payload: ImportRequest,
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    tenant = _require_operator(auth)

    if bool(payload.rows) == bool(payload.punch_list_text):
        raise HTTPException(
            status_code=400,
            detail="Send either rows or punch_list_text, not both and not neither.",
        )

    if payload.rows:
        found = job_ledger.read_program_sheet(
            [tuple(row) for row in payload.rows],
            client=payload.client,
            program=payload.program,
            category=payload.category,
            source_document=payload.source_document,
        )
        if not found:
            raise HTTPException(
                status_code=400,
                detail=(
                    "No header row with a store number and an address was found. "
                    "These sheets open with a title row, so the header is rarely row 1."
                ),
            )
    else:
        found = job_ledger.read_punch_list(
            payload.punch_list_text or "",
            client=payload.client,
            source_document=payload.source_document,
        )

    created = updated = unchanged = 0
    for record in found:
        existing = _existing(db, tenant, record)
        if existing is None:
            db.add(ClientJobRecord(tenant_id=stamp_for(tenant), **record))
            created += 1
            continue

        # A re-import may only strengthen a record. The Texas sheet was sent
        # once with addresses and again with the invoice columns filled in; the
        # second import must upgrade those rows, and a later export that has
        # lost a column must not quietly demote work that was invoiced.
        if job_ledger.rank(record["evidence"]) > job_ledger.rank(existing.evidence):
            existing.evidence = record["evidence"]
            updated += 1
        else:
            unchanged += 1
        for field, value in record.items():
            if field == "evidence" or value in (None, ""):
                continue
            if getattr(existing, field, None) in (None, ""):
                setattr(existing, field, value)

    db.commit()

    return {
        "ok": True,
        "records_read": len(found),
        "created": created,
        "evidence_upgraded": updated,
        "already_recorded": unchanged,
        "summary": job_ledger.summarise(found),
        "note": (
            "Only records graded 'invoiced' may back a public claim. A listed "
            "address is a site, not a job, and a punch-list line is work that "
            "was asked for."
        ),
    }


def _existing(db: Session, tenant: str, record: dict):
    """
    The record this one updates, or None.

    Keyed on store number plus category. A store legitimately appears on both
    the parking programme and the roof programme, and collapsing those into one
    record would lose an invoice.
    """
    store = record.get("store_number")
    if not store:
        return None
    return (
        scope(db.query(ClientJobRecord), ClientJobRecord, tenant)
        .filter(
            ClientJobRecord.store_number == store,
            ClientJobRecord.category == record.get("category"),
        )
        .first()
    )


@router.get("/records", summary="What is recorded, and how well it is evidenced")
@limiter.limit("60/minute")
def list_records(
    request: Request,
    evidence: str = Query("all"),
    state: Optional[str] = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    tenant = _require_operator(auth)
    if evidence not in set(job_ledger.EVIDENCE_ORDER) | {"all", "publishable"}:
        raise HTTPException(
            status_code=400,
            detail=f"evidence must be one of {sorted(job_ledger.EVIDENCE_ORDER)}, 'publishable' or 'all'",
        )

    query = scope(db.query(ClientJobRecord), ClientJobRecord, tenant)
    if evidence == "publishable":
        query = query.filter(ClientJobRecord.evidence.in_(tuple(job_ledger.PUBLISHABLE)))
    elif evidence != "all":
        query = query.filter(ClientJobRecord.evidence == evidence)
    if state:
        query = query.filter(ClientJobRecord.state == state.strip().upper())

    rows = query.order_by(ClientJobRecord.state, ClientJobRecord.city).limit(limit).all()
    return {"ok": True, "count": len(rows), "records": [_as_dict(r) for r in rows]}


@router.get("/summary", summary="How much of the paperwork is actually evidence")
@limiter.limit("60/minute")
def summary(
    request: Request,
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    """
    Counts and money by grade, never rolled into one figure.

    A single "total value of work" that sums invoiced and merely-listed rows is
    precisely the number that would be wrong, and precisely the number a
    dashboard reaches for first.
    """
    tenant = _require_operator(auth)
    rows = scope(db.query(ClientJobRecord), ClientJobRecord, tenant).all()

    states: dict[str, int] = {}
    for row in rows:
        if row.evidence in job_ledger.PUBLISHABLE and row.state:
            states[row.state] = states.get(row.state, 0) + 1

    return {
        "ok": True,
        **job_ledger.summarise(
            [
                {"evidence": r.evidence, "invoice_amount_cents": r.invoice_amount_cents}
                for r in rows
            ]
        ),
        "publishable_states": dict(sorted(states.items())),
        "evidence_meanings": job_ledger.EVIDENCE_MEANING,
    }


@router.get("/map.kml", summary="Verified jobsites as pins for Google My Maps")
@limiter.limit("20/minute")
def jobsite_map(
    request: Request,
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    """
    The publishable records that have a coordinate, as a KML file.

    Imported into Google My Maps this becomes a map the operator owns on his
    own account — restylable, shareable, permanent — rather than a picture of
    one. Each pin carries its evidence grade and the document behind it, so
    anyone looking at the map can see what backs a pin without leaving it.

    Only records whose grade may be published appear. A record with no
    coordinate is skipped rather than placed approximately: a pin in the wrong
    car park is a false claim with a map reference attached.
    """
    tenant = _require_operator(auth)

    rows = (
        scope(db.query(ClientJobRecord), ClientJobRecord, tenant)
        .filter(ClientJobRecord.evidence.in_(tuple(job_ledger.PUBLISHABLE)))
        .all()
    )

    sites = [
        {
            "lat": r.latitude,
            "lon": r.longitude,
            "label": r.label_for_map(),
            "address": r.address,
            "city": r.city,
            "state": r.state,
            "kind": r.category,
            "evidence": r.evidence,
            "completed_on": r.completed_on.date().isoformat() if r.completed_on else None,
            "store_number": r.store_number,
            "client": r.client,
            "source_document": r.source_document,
        }
        for r in rows
        if r.latitude is not None and r.longitude is not None
    ]

    return Response(
        content=saved_places.to_kml(sites),
        media_type="application/vnd.google-earth.kml+xml",
        headers={"Content-Disposition": 'attachment; filename="worden-jobsites.kml"'},
    )


@router.post("/records/{record_id}/publish", summary="Allow one record to back a public claim")
@limiter.limit("120/minute")
def publish_record(
    request: Request,
    record_id: int,
    payload: PublishRequest,
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    tenant = _require_operator(auth)
    record = (
        scope(db.query(ClientJobRecord), ClientJobRecord, tenant)
        .filter(ClientJobRecord.id == record_id)
        .first()
    )
    if record is None:
        raise HTTPException(status_code=404, detail="No such record")

    if payload.published and not job_ledger.is_publishable(record.evidence):
        # The refusal is the feature. Everything upstream exists to make this
        # line reachable, and an override here would make the grades decorative.
        raise HTTPException(
            status_code=400,
            detail=(
                f"This record is graded '{record.evidence}': "
                f"{job_ledger.EVIDENCE_MEANING.get(record.evidence, '')} "
                "Attach the invoice before publishing it as completed work."
            ),
        )

    record.published = 1 if payload.published else 0
    if payload.notes is not None:
        record.notes = payload.notes.strip() or None
    record.reviewed_at = datetime.now(timezone.utc)
    record.reviewed_by = auth.get("user") or "operator"
    db.commit()
    db.refresh(record)
    return {"ok": True, "record": _as_dict(record)}


def _as_dict(record: ClientJobRecord) -> dict:
    return {
        "id": record.id,
        "store_number": record.store_number,
        "client": record.client,
        "program": record.program,
        "category": record.category,
        "address": record.address,
        "city": record.city,
        "state": record.state,
        "postal_code": record.postal_code,
        "scope": record.scope,
        "scope_source": record.scope_source,
        "role": record.role,
        "role_source": record.role_source,
        "area_sqft": record.area_sqft,
        "area_source": record.area_source,
        "invoice_number": record.invoice_number,
        "date_submitted": record.date_submitted.isoformat() if record.date_submitted else None,
        # Strings, because these are money. A float here reaches a page and
        # renders as 24335.999999999996.
        "invoice_amount": job_ledger.to_dollars(record.invoice_amount_cents),
        "job_total": job_ledger.to_dollars(record.job_total_cents),
        "amount_paid": job_ledger.to_dollars(record.amount_paid_cents),
        "completed_on": record.completed_on.isoformat() if record.completed_on else None,
        "paid_date": record.paid_date.isoformat() if record.paid_date else None,
        "check_number": record.check_number,
        "job_status": record.job_status,
        "evidence": record.evidence,
        "evidence_means": job_ledger.EVIDENCE_MEANING.get(record.evidence, ""),
        "publishable": job_ledger.is_publishable(record.evidence),
        "published": bool(record.published),
        "outstanding_issues": record.outstanding_issues,
        "source_document": record.source_document,
        "notes": record.notes,
    }
