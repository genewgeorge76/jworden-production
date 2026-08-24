"""
mailboxes.py — connect a mailbox, and let it be read.

  GET  /api/v1/mailboxes                    what is connected, and how far it has read
  POST /api/v1/mailboxes/consent-url        the link to grant one mailbox
  POST /api/v1/mailboxes/callback           exchange the code Google returns
  POST /api/v1/mailboxes/{id}/scan          read one window and file what it justifies
  DELETE /api/v1/mailboxes/{id}             forget a mailbox and its token

Operator only, and not negotiable. A refresh token is a long-lived key to a
person's entire mail; nothing about a hosted customer's subscription entitles
them to one.
"""

# Deliberately NO `from __future__ import annotations` — on the pinned FastAPI a
# rate-limited endpoint resolves annotations against slowapi's globals and a
# body model degrades into a query parameter.

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from ..core.limiter import limiter
from ..core.security import verify_premium_security
from ..database import get_db
from ..models import ClientJobRecord, MailboxConnection
from ..services import gmail_ingest, job_ledger, mailbox_auth
from ..services.tenancy import is_owner, scope, stamp_for, tenant_of

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/mailboxes", tags=["mailboxes"])


def _require_operator(auth: dict) -> str:
    tenant = tenant_of(auth)
    if not is_owner(tenant):
        raise HTTPException(
            status_code=403,
            detail="A mailbox connection is a key to somebody's entire mail. Operator only.",
        )
    return tenant


class ConsentRequest(BaseModel):
    email_address: EmailStr
    state: Optional[str] = None


class CallbackRequest(BaseModel):
    code: str = Field(min_length=10)


class ScanRequest(BaseModel):
    days: int = Field(default=gmail_ingest.BACKFILL_WINDOW_DAYS, ge=1, le=365)
    max_messages: int = Field(default=400, ge=1, le=2000)
    client_name: Optional[str] = None


@router.get("", summary="Mailboxes connected, and how far each has been read")
@limiter.limit("60/minute")
def list_mailboxes(
    request: Request,
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    tenant = _require_operator(auth)
    rows = (
        scope(db.query(MailboxConnection), MailboxConnection, tenant)
        .order_by(MailboxConnection.email_address)
        .all()
    )
    return {
        "ok": True,
        "oauth_configured": mailbox_auth.configured(),
        "mailboxes": [_as_dict(r) for r in rows],
        "note": (
            "Each address is consented to separately and can be disconnected "
            "separately. Nothing here can send, label or delete mail."
        ),
    }


@router.post("/consent-url", summary="The link that grants this system one mailbox")
@limiter.limit("20/minute")
def consent_url(
    request: Request,
    payload: ConsentRequest,
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    """
    Produce the Google consent link for one address.

    The address is a hint on the consent screen, not an instruction: whichever
    account the human actually signs into is the one that gets connected, and
    the callback reads the real address out of Google's response rather than
    trusting what was asked for here.
    """
    _require_operator(auth)
    try:
        url = mailbox_auth.consent_url(
            email_hint=str(payload.email_address), state=payload.state or ""
        )
    except mailbox_auth.MailboxAuthNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return {
        "ok": True,
        "consent_url": url,
        "scopes": list(mailbox_auth.SCOPES),
        "note": (
            "Read-only. Sign in as the address you want connected — the mailbox "
            "that gets granted is the one you sign into, not the one hinted here."
        ),
    }


@router.post("/callback", summary="Exchange Google's code for a stored connection")
@limiter.limit("20/minute")
async def callback(
    request: Request,
    payload: CallbackRequest,
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    tenant = _require_operator(auth)
    try:
        granted = await mailbox_auth.exchange_code(payload.code)
    except mailbox_auth.MailboxAuthNotConfigured as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    address = (granted.get("email_address") or "").strip().lower()
    if not address:
        raise HTTPException(
            status_code=400,
            detail="Google did not say which mailbox was granted, so it cannot be stored.",
        )

    existing = (
        scope(db.query(MailboxConnection), MailboxConnection, tenant)
        .filter(MailboxConnection.email_address == address)
        .first()
    )
    encrypted = mailbox_auth.encrypt_token(granted["refresh_token"])
    now = datetime.now(timezone.utc)

    if existing is None:
        existing = MailboxConnection(
            tenant_id=stamp_for(tenant), email_address=address
        )
        db.add(existing)

    existing.refresh_token_encrypted = encrypted
    existing.scopes = granted.get("scopes")
    existing.connected_at = now
    existing.is_active = 1
    # Reconnecting clears a previous failure. Leaving a stale "consent
    # withdrawn" on a mailbox that has just been re-granted would make a
    # working connection look broken.
    existing.last_error = None
    existing.last_error_at = None
    db.commit()
    db.refresh(existing)

    return {"ok": True, "mailbox": _as_dict(existing)}


@router.post("/{mailbox_id}/scan", summary="Read one window of a mailbox")
@limiter.limit("10/minute")
async def scan_mailbox(
    request: Request,
    mailbox_id: int,
    payload: ScanRequest,
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    """
    Read one window and file the records it justifies.

    A window rather than the whole archive: a decade in one request times out,
    and a scan that times out has read nothing. The cursor moves backwards one
    window per run, so an interruption costs a single window.
    """
    tenant = _require_operator(auth)
    mailbox = (
        scope(db.query(MailboxConnection), MailboxConnection, tenant)
        .filter(MailboxConnection.id == mailbox_id)
        .first()
    )
    if mailbox is None:
        raise HTTPException(status_code=404, detail="No such mailbox")
    if not mailbox.refresh_token_encrypted:
        raise HTTPException(status_code=400, detail="That mailbox has no stored consent.")

    try:
        refresh_token = mailbox_auth.decrypt_token(mailbox.refresh_token_encrypted)
        result = await gmail_ingest.scan_window(
            refresh_token,
            before=mailbox.backfill_before,
            days=payload.days,
            our_addresses=_our_addresses(db, tenant),
            client_name=payload.client_name,
            max_messages=payload.max_messages,
        )
    except (mailbox_auth.MailboxAuthNotConfigured, gmail_ingest.MailboxUnavailable) as exc:
        # Recorded, not swallowed. A mailbox that has stopped working and
        # returns nothing reads exactly like a mailbox with no work in it.
        mailbox.last_error = str(exc)[:1000]
        mailbox.last_error_at = datetime.now(timezone.utc)
        db.commit()
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    created = _file_records(db, tenant, result["records"])

    mailbox.backfill_before = result["next_before"]
    mailbox.last_scan_at = datetime.now(timezone.utc)
    mailbox.messages_seen = (mailbox.messages_seen or 0) + result["messages_seen"]
    mailbox.records_created = (mailbox.records_created or 0) + created
    mailbox.last_error = None
    mailbox.last_error_at = None
    db.commit()

    return {
        "ok": True,
        "window": result["query"],
        "messages_seen": result["messages_seen"],
        "messages_about_work": result["messages_kept"],
        "attachments_seen": result["attachments_seen"],
        "records_created": created,
        "records_read": len(result["records"]),
        "next_window_ends": result["next_before"].isoformat(),
        "note": (
            "A message that names a site proves contact on a date, not that the "
            "work was finished. Only a message that says so grades 'completed'."
        ),
    }


def _our_addresses(db: Session, tenant: str) -> list[str]:
    """
    Every address this company sends from, as far as the system knows.

    Drawn from the connected mailboxes themselves: a message is our record of
    performance only if we sent it, and the mailboxes that have been connected
    are exactly the addresses we send from.
    """
    rows = scope(db.query(MailboxConnection), MailboxConnection, tenant).all()
    return [r.email_address for r in rows if r.email_address]


def _file_records(db: Session, tenant: str, records: list[dict]) -> int:
    """
    Write what the scan produced, strengthening rather than duplicating.

    Keyed on the message thread, because that is the only identifier a mail
    record reliably has: many of these sites have no store number and an
    address parsed out of a subject line is not unique enough to key on.
    """
    created = 0
    for record in records:
        source = record.get("source_document")
        existing = None
        if source:
            existing = (
                scope(db.query(ClientJobRecord), ClientJobRecord, tenant)
                .filter(ClientJobRecord.source_document == source)
                .first()
            )
        if existing is None:
            db.add(ClientJobRecord(tenant_id=stamp_for(tenant), **record))
            created += 1
            continue

        # A thread seen again may only strengthen what is already recorded: the
        # same site often appears first as a bare address and later as
        # "Finished Pictures", and the second must not be undone by a re-scan
        # that reaches the first again.
        if job_ledger.rank(record["evidence"]) > job_ledger.rank(existing.evidence):
            existing.evidence = record["evidence"]
        for field, value in record.items():
            if field == "evidence" or value in (None, ""):
                continue
            if getattr(existing, field, None) in (None, ""):
                setattr(existing, field, value)
    db.commit()
    return created


@router.delete("/{mailbox_id}", summary="Forget a mailbox and its stored consent")
@limiter.limit("20/minute")
def disconnect(
    request: Request,
    mailbox_id: int,
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    """
    Drop the stored token.

    The records already extracted are kept — they are the operator's own
    business history and are not the mailbox's to take back. What goes is the
    key, immediately.
    """
    tenant = _require_operator(auth)
    mailbox = (
        scope(db.query(MailboxConnection), MailboxConnection, tenant)
        .filter(MailboxConnection.id == mailbox_id)
        .first()
    )
    if mailbox is None:
        raise HTTPException(status_code=404, detail="No such mailbox")

    mailbox.refresh_token_encrypted = None
    mailbox.is_active = 0
    db.commit()
    return {
        "ok": True,
        "disconnected": mailbox.email_address,
        "note": (
            "The stored key is gone. Records already extracted are kept — they "
            "are the company's own history. Revoke this app in the Google "
            "account's security settings to be certain."
        ),
    }


def _as_dict(mailbox: MailboxConnection) -> dict:
    return {
        "id": mailbox.id,
        "email_address": mailbox.email_address,
        # Whether it is connected — never the means to connect. A refresh token
        # does not leave this process.
        "connected": bool(mailbox.refresh_token_encrypted) and bool(mailbox.is_active),
        "connected_at": mailbox.connected_at.isoformat() if mailbox.connected_at else None,
        "scopes": (mailbox.scopes or "").split() or None,
        "backfill_reached": (
            mailbox.backfill_before.isoformat() if mailbox.backfill_before else None
        ),
        "backfill_complete": bool(mailbox.backfill_complete),
        "last_scan_at": mailbox.last_scan_at.isoformat() if mailbox.last_scan_at else None,
        "messages_seen": mailbox.messages_seen,
        "records_created": mailbox.records_created,
        "last_error": mailbox.last_error,
        "last_error_at": mailbox.last_error_at.isoformat() if mailbox.last_error_at else None,
    }
