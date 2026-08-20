"""
social.py — Outbound social publishing.

The pipeline is: a real record → composed copy → claim guardrail → queue →
a driver that either sends it or says why it cannot.

The guardrail is not advisory. `POST /posts/{id}/publish` returns 409 with the
offending spans if any blocking claim lacks a live attestation, and there is no
force flag. A guardrail with an override is a guardrail that gets overridden on
the busy day it matters, and the whole reason it exists is that the output is
public, permanent and attributable to the company.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..core.security import verify_premium_security
from ..database import get_db
from ..models import CompanyClaim, Job, Lead, SocialAccount, SocialPost, SocialSignal
from ..services import (
    social_claims,
    social_content,
    social_listening,
    social_publish,
)
from ..services.tenancy import scope, tenant_of

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/social", tags=["social"])

PUBLISHABLE_STATUSES = {"draft", "queued", "failed"}


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _live_claims(db: Session, tenant: str) -> list[CompanyClaim]:
    return scope(db.query(CompanyClaim), CompanyClaim, tenant).all()


def _check(db: Session, tenant: str, body: str) -> social_claims.ClaimReport:
    return social_claims.resolve(social_claims.scan(body), _live_claims(db, tenant))


def _post_dict(p: SocialPost) -> dict[str, Any]:
    return {
        "id": p.id, "platform": p.platform, "status": p.status,
        "body": p.body, "media": p.media_json or [], "link_url": p.link_url,
        "source": {"kind": p.source_kind, "id": p.source_id, "note": p.source_note},
        "claim_report": p.claim_report_json,
        "scheduled_for": p.scheduled_for.isoformat() if p.scheduled_for else None,
        "published_at": p.published_at.isoformat() if p.published_at else None,
        "external_post_id": p.external_post_id, "external_url": p.external_url,
        "last_error": p.last_error, "attempts": p.attempts,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }


# ── Status ───────────────────────────────────────────────────────────────────


@router.get("/status", summary="What is connected, queued and blocked")
def social_status(db: Session = Depends(get_db),
                  auth: dict = Depends(verify_premium_security)):
    tenant = tenant_of(auth)
    posts = scope(db.query(SocialPost), SocialPost, tenant)
    accounts = scope(db.query(SocialAccount), SocialAccount, tenant).count()
    claims = _live_claims(db, tenant)

    today = _utcnow().date()
    expired = [c.key for c in claims if c.expires_on and c.expires_on < today]
    expiring = [
        {"key": c.key, "expires_on": c.expires_on.isoformat()}
        for c in claims
        if c.expires_on and today <= c.expires_on <= today.replace(
            year=today.year + (1 if today.month == 12 else 0),
            month=(today.month % 12) + 1,
        )
    ]

    by_status: dict[str, int] = {}
    for p in posts.all():
        by_status[p.status] = by_status.get(p.status, 0) + 1

    postable = scope(db.query(Job), Job, tenant).filter(Job.status == "completed").count()

    blockers: list[str] = []
    if not accounts:
        blockers.append("no social accounts registered")
    if not postable:
        blockers.append("no completed jobs to post about — content is composed "
                        "from real job records, never invented")
    if expired:
        blockers.append(f"expired attestations: {', '.join(expired)}")

    return {
        "ok": True,
        "tenant": tenant,
        "accounts": accounts,
        "posts_by_status": by_status,
        "completed_jobs_available_as_sources": postable,
        "attestations": {
            "total": len(claims),
            "expired": expired,
            "expiring_within_a_month": expiring,
        },
        "drivers": social_publish.status_all(),
        "listening": {
            "configured": social_listening.configured(),
            "provider": "xai_x_search",
            "signals_new": scope(db.query(SocialSignal), SocialSignal, tenant)
                .filter(SocialSignal.review_status == "new").count(),
            "missing_key": None if social_listening.configured() else "XAI_API_KEY",
        },
        "blockers": blockers,
    }


# ── Attestations ─────────────────────────────────────────────────────────────


class ClaimIn(BaseModel):
    key: str = Field(min_length=2, max_length=60)
    claim_text: str = Field(min_length=2)
    source_note: str = Field(min_length=4, description="Where this is evidenced.")
    evidence_url: Optional[str] = None
    effective_from: Optional[str] = None
    expires_on: Optional[str] = None
    attested_by: Optional[str] = None


def _as_date(value: Optional[str]):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=f"bad date {value!r}, want YYYY-MM-DD") from exc


@router.get("/claims", summary="Attested company claims")
def list_claims(db: Session = Depends(get_db),
                auth: dict = Depends(verify_premium_security)):
    tenant = tenant_of(auth)
    today = _utcnow().date()
    rows = _live_claims(db, tenant)
    return {
        "ok": True,
        "claims": [
            {
                "id": c.id, "key": c.key, "claim_text": c.claim_text,
                "source_note": c.source_note, "evidence_url": c.evidence_url,
                "effective_from": c.effective_from.isoformat() if c.effective_from else None,
                "expires_on": c.expires_on.isoformat() if c.expires_on else None,
                "expired": bool(c.expires_on and c.expires_on < today),
                "attested_by": c.attested_by,
            }
            for c in rows
        ],
        "known_keys": sorted({r.key for r in social_claims.RULES if r.key}),
    }


@router.post("/claims", summary="Attest a claim the company can evidence")
def upsert_claim(payload: ClaimIn, db: Session = Depends(get_db),
                 auth: dict = Depends(verify_premium_security)):
    tenant = tenant_of(auth)
    known = {r.key for r in social_claims.RULES if r.key}
    if payload.key not in known:
        raise HTTPException(
            status_code=422,
            detail=f"unknown claim key {payload.key!r}. Known: {sorted(known)}",
        )

    row = scope(db.query(CompanyClaim), CompanyClaim, tenant).filter(
        CompanyClaim.key == payload.key
    ).first()
    if row is None:
        row = CompanyClaim(tenant_id=tenant, key=payload.key)
        db.add(row)

    row.claim_text = payload.claim_text
    row.source_note = payload.source_note
    row.evidence_url = payload.evidence_url
    row.effective_from = _as_date(payload.effective_from)
    row.expires_on = _as_date(payload.expires_on)
    row.attested_by = payload.attested_by
    db.commit()
    db.refresh(row)
    return {"ok": True, "id": row.id, "key": row.key,
            "expires_on": row.expires_on.isoformat() if row.expires_on else None}


# ── Accounts ─────────────────────────────────────────────────────────────────


class AccountIn(BaseModel):
    platform: str
    handle: str = Field(min_length=1, max_length=120)
    display_name: Optional[str] = None
    external_id: Optional[str] = None
    credential_key_name: Optional[str] = None


@router.get("/accounts", summary="Registered publishing destinations")
def list_accounts(db: Session = Depends(get_db),
                  auth: dict = Depends(verify_premium_security)):
    tenant = tenant_of(auth)
    rows = scope(db.query(SocialAccount), SocialAccount, tenant).all()
    return {
        "ok": True,
        "accounts": [
            {"id": a.id, "platform": a.platform, "handle": a.handle,
             "display_name": a.display_name, "external_id": a.external_id,
             "enabled": a.enabled,
             "driver": (social_publish.status_for(a.platform) or
                        social_publish.DriverStatus(a.platform, False, False)).as_dict()}
            for a in rows
        ],
    }


@router.post("/accounts", summary="Register a publishing destination")
def add_account(payload: AccountIn, db: Session = Depends(get_db),
                auth: dict = Depends(verify_premium_security)):
    tenant = tenant_of(auth)
    platform = payload.platform.lower()
    if platform not in social_publish.PLATFORMS:
        raise HTTPException(status_code=422,
                            detail=f"unknown platform. Known: {list(social_publish.PLATFORMS)}")
    row = SocialAccount(
        tenant_id=tenant, platform=platform, handle=payload.handle,
        display_name=payload.display_name, external_id=payload.external_id,
        credential_key_name=payload.credential_key_name,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"ok": True, "id": row.id,
            "driver": social_publish.status_for(platform).as_dict()}


# ── Composition ──────────────────────────────────────────────────────────────


class ComposeIn(BaseModel):
    source_kind: str = Field(default="job")
    source_id: str
    platform: str = Field(default="export")
    include_spec: bool = True
    queue: bool = Field(default=False, description="Save as a queued post.")


@router.post("/compose", summary="Draft a post from a real record")
def compose(payload: ComposeIn, db: Session = Depends(get_db),
            auth: dict = Depends(verify_premium_security)):
    tenant = tenant_of(auth)
    platform = payload.platform.lower()
    if platform not in social_publish.PLATFORMS:
        raise HTTPException(status_code=422,
                            detail=f"unknown platform. Known: {list(social_publish.PLATFORMS)}")

    if payload.source_kind != "job":
        raise HTTPException(
            status_code=422,
            detail=f"source_kind {payload.source_kind!r} is not supported. "
                   "Only 'job' composes today — a post needs a record behind it.",
        )

    job = scope(db.query(Job), Job, tenant).filter(Job.id == payload.source_id).first()
    try:
        drafted = social_content.compose_from_job(
            job, platform=platform, include_spec=payload.include_spec
        )
    except social_content.NotPostable as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    report = _check(db, tenant, drafted.body)

    if not payload.queue:
        return {"ok": True, "queued": False, "platform": platform,
                "body": drafted.body, "media": drafted.media,
                "source": {"kind": drafted.source_kind, "id": drafted.source_id,
                           "note": drafted.source_note},
                "claim_report": report.as_dict()}

    row = SocialPost(
        tenant_id=tenant, platform=platform, status="queued",
        body=drafted.body, media_json=drafted.media,
        link_url=None,
        source_kind=drafted.source_kind, source_id=drafted.source_id,
        source_note=drafted.source_note,
        claim_report_json=report.as_dict(),
        claims_cleared_at=_utcnow() if report.publishable else None,
        created_by=str(auth.get("sub") or auth.get("user") or "") or None,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"ok": True, "queued": True, "post": _post_dict(row)}


class CheckIn(BaseModel):
    body: str = Field(min_length=1)


@router.post("/check", summary="Run the claim guardrail over arbitrary copy")
def check_copy(payload: CheckIn, db: Session = Depends(get_db),
               auth: dict = Depends(verify_premium_security)):
    tenant = tenant_of(auth)
    return {"ok": True, "claim_report": _check(db, tenant, payload.body).as_dict()}


# ── Queue ────────────────────────────────────────────────────────────────────


@router.get("/posts", summary="The queue")
def list_posts(status: Optional[str] = Query(default=None),
               limit: int = Query(default=50, ge=1, le=500),
               db: Session = Depends(get_db),
               auth: dict = Depends(verify_premium_security)):
    tenant = tenant_of(auth)
    q = scope(db.query(SocialPost), SocialPost, tenant)
    if status:
        q = q.filter(SocialPost.status == status)
    rows = q.order_by(SocialPost.id.desc()).limit(limit).all()
    return {"ok": True, "count": len(rows), "posts": [_post_dict(p) for p in rows]}


@router.post("/posts/{post_id}/publish", summary="Send a queued post")
async def publish_post(post_id: int, db: Session = Depends(get_db),
                       auth: dict = Depends(verify_premium_security)):
    tenant = tenant_of(auth)
    post = scope(db.query(SocialPost), SocialPost, tenant).filter(
        SocialPost.id == post_id
    ).first()
    if post is None:
        raise HTTPException(status_code=404, detail="no such post")
    if post.status not in PUBLISHABLE_STATUSES:
        raise HTTPException(status_code=409,
                            detail=f"post is {post.status}, not publishable")

    # Re-checked at send time, never trusted from the row: an attestation can
    # have expired between queueing and publishing, and that is exactly the
    # case this is here to catch.
    report = _check(db, tenant, post.body)
    post.claim_report_json = report.as_dict()
    if not report.publishable:
        post.status = "draft"
        post.claims_cleared_at = None
        db.commit()
        raise HTTPException(
            status_code=409,
            detail={
                "error": "unsubstantiated claims",
                "message": "Attest each claim with evidence, or remove it from "
                           "the copy. There is no override.",
                "claim_report": report.as_dict(),
            },
        )
    post.claims_cleared_at = _utcnow()

    account = None
    if post.account_id:
        account = scope(db.query(SocialAccount), SocialAccount, tenant).filter(
            SocialAccount.id == post.account_id
        ).first()

    result = await social_publish.publish(post, account)
    post.attempts = (post.attempts or 0) + 1
    if not result.ok:
        post.status = "failed"
        post.last_error = result.reason[:1000]
        db.commit()
        return {"ok": False, "reason": result.reason, "post": _post_dict(post)}

    post.status = "published"
    post.published_at = _utcnow()
    post.external_post_id = result.external_post_id
    post.external_url = result.external_url
    post.last_error = None
    db.commit()
    db.refresh(post)
    return {"ok": True, "post": _post_dict(post), "payload": result.payload}


@router.post("/posts/{post_id}/cancel", summary="Drop a queued post")
def cancel_post(post_id: int, db: Session = Depends(get_db),
                auth: dict = Depends(verify_premium_security)):
    tenant = tenant_of(auth)
    post = scope(db.query(SocialPost), SocialPost, tenant).filter(
        SocialPost.id == post_id
    ).first()
    if post is None:
        raise HTTPException(status_code=404, detail="no such post")
    if post.status == "published":
        raise HTTPException(status_code=409,
                            detail="already published — cancelling here would not "
                                   "unpublish it on the platform")
    post.status = "cancelled"
    db.commit()
    return {"ok": True, "post": _post_dict(post)}


# ── Listening ────────────────────────────────────────────────────────────────


class ListenIn(BaseModel):
    kind: str = Field(description="One of the signal kinds from /listen/kinds.")
    place: str = Field(min_length=2, max_length=160,
                       description="City and state, e.g. 'Richmond, VA'.")
    from_date: Optional[str] = None
    to_date: Optional[str] = None
    allowed_handles: Optional[list[str]] = None
    excluded_handles: Optional[list[str]] = None
    extra: str = ""
    save: bool = Field(default=True, description="Persist cited signals for review.")


def _signal_dict(s: SocialSignal) -> dict[str, Any]:
    return {
        "id": s.id, "kind": s.kind, "url": s.url, "title": s.title,
        "excerpt": s.excerpt, "place": s.place, "provider": s.provider,
        "model": s.model, "review_status": s.review_status,
        "lead_id": s.lead_id,
        "first_seen_at": s.first_seen_at.isoformat() if s.first_seen_at else None,
        "last_seen_at": s.last_seen_at.isoformat() if s.last_seen_at else None,
    }


@router.get("/listen/kinds", summary="What listening can look for")
def listen_kinds(auth: dict = Depends(verify_premium_security)):
    return {
        "ok": True,
        "configured": social_listening.configured(),
        "kinds": [{"kind": k, "looks_for": v}
                  for k, v in social_listening.SIGNAL_KINDS.items()],
        "note": "Only posts the search actually cites become signals. An "
                "uncited summary is returned as narrative and never stored.",
    }


@router.post("/listen/run", summary="Search X for signals")
async def listen_run(payload: ListenIn, db: Session = Depends(get_db),
                     auth: dict = Depends(verify_premium_security)):
    tenant = tenant_of(auth)
    try:
        result = await social_listening.listen(
            payload.kind,
            place=payload.place,
            from_date=_as_date(payload.from_date),
            to_date=_as_date(payload.to_date),
            allowed_handles=payload.allowed_handles,
            excluded_handles=payload.excluded_handles,
            extra=payload.extra,
        )
    except social_listening.ListeningUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    stored, refreshed = 0, 0
    if payload.save:
        for sig in result.signals:
            row = scope(db.query(SocialSignal), SocialSignal, tenant).filter(
                SocialSignal.url == sig.url
            ).first()
            if row is None:
                db.add(SocialSignal(
                    tenant_id=tenant, kind=sig.kind, url=sig.url,
                    title=sig.title or None, excerpt=sig.excerpt or None,
                    query=sig.query, place=payload.place,
                    provider="xai_x_search", model=result.model,
                ))
                stored += 1
            else:
                row.last_seen_at = _utcnow()
                refreshed += 1
        db.commit()

    body = result.as_dict()
    body.update({"ok": True, "stored": stored, "refreshed": refreshed})
    return body


@router.get("/listen/signals", summary="Signals waiting for review")
def list_signals(kind: Optional[str] = Query(default=None),
                 review_status: Optional[str] = Query(default="new"),
                 limit: int = Query(default=100, ge=1, le=500),
                 db: Session = Depends(get_db),
                 auth: dict = Depends(verify_premium_security)):
    tenant = tenant_of(auth)
    q = scope(db.query(SocialSignal), SocialSignal, tenant)
    if kind:
        q = q.filter(SocialSignal.kind == kind)
    if review_status:
        q = q.filter(SocialSignal.review_status == review_status)
    rows = q.order_by(SocialSignal.id.desc()).limit(limit).all()
    return {"ok": True, "count": len(rows),
            "signals": [_signal_dict(r) for r in rows]}


class DismissIn(BaseModel):
    reason: str = Field(min_length=2, max_length=500)


@router.post("/listen/signals/{signal_id}/dismiss", summary="Not worth chasing")
def dismiss_signal(signal_id: int, payload: DismissIn,
                   db: Session = Depends(get_db),
                   auth: dict = Depends(verify_premium_security)):
    tenant = tenant_of(auth)
    row = scope(db.query(SocialSignal), SocialSignal, tenant).filter(
        SocialSignal.id == signal_id
    ).first()
    if row is None:
        raise HTTPException(status_code=404, detail="no such signal")
    row.review_status = "dismissed"
    row.dismissed_reason = payload.reason
    row.reviewed_at = _utcnow()
    row.reviewed_by = str(auth.get("sub") or auth.get("user") or "") or None
    db.commit()
    return {"ok": True, "signal": _signal_dict(row)}


class ConvertIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(
        min_length=3, max_length=254,
        description="Required. `leads.email` is NOT NULL and every other "
                    "intake path supplies one; a synthesised address would put "
                    "a contact in the CRM that reaches nobody.",
    )
    phone: str = Field(min_length=7, max_length=30, description="Required.")
    service_type: str = Field(min_length=2, max_length=60, description="Required.")
    property_type: str = Field(default="commercial", max_length=30)
    urgency: str = Field(default="unknown", max_length=30)
    address: Optional[str] = None
    state_code: Optional[str] = None
    note: Optional[str] = None


@router.post("/listen/signals/{signal_id}/convert", summary="Turn a signal into a lead")
def convert_signal(signal_id: int, payload: ConvertIn,
                   db: Session = Depends(get_db),
                   auth: dict = Depends(verify_premium_security)):
    """
    Deliberate, and never automatic.

    A post complaining about a pothole is not a customer. Someone has to read
    it, decide it is worth a call, and say who it is — which is why `name` and
    `email` are supplied by the operator rather than scraped from a handle or
    invented to satisfy the column.

    `leads` requires name, email, phone, service_type, property_type and
    urgency. An X post carries none of the contact fields. That is not a gap to paper over with a
    generated one: a lead nobody can reach is worse than no lead, because it
    sits in the pipeline looking like work. If the contact is not known yet,
    the signal stays in the review queue where it is honest about what it is.
    """
    tenant = tenant_of(auth)
    row = scope(db.query(SocialSignal), SocialSignal, tenant).filter(
        SocialSignal.id == signal_id
    ).first()
    if row is None:
        raise HTTPException(status_code=404, detail="no such signal")
    if row.lead_id:
        raise HTTPException(status_code=409,
                            detail=f"already converted to lead {row.lead_id}")

    lead = Lead(
        tenant_id=tenant,
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        service_type=payload.service_type,
        property_type=payload.property_type,
        urgency=payload.urgency,
        address=payload.address,
        state_code=payload.state_code,
        message=payload.note or row.excerpt,
        source=f"social:{row.kind}",
        raw_data={"signal_id": row.id, "url": row.url, "place": row.place},
    )
    db.add(lead)
    db.flush()

    row.lead_id = lead.id
    row.review_status = "converted"
    row.reviewed_at = _utcnow()
    row.reviewed_by = str(auth.get("sub") or auth.get("user") or "") or None
    db.commit()
    return {"ok": True, "lead_id": lead.id, "signal": _signal_dict(row)}
