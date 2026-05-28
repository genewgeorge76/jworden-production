"""
estimate_approval.py — Human-in-the-loop gate for outbound estimate sends.

Per the operator's standing rule: every estimate that goes out to a customer
requires Mr. Worden's explicit approval (via a 4-digit PIN) before any
email / SMS / portal-notify channel is dispatched.

  • Stages a fully-rendered estimate (recipient, subject, HTML body, PDF) into
    `HumanReviewQueue` with `decision_type='proposal_send'` so it appears in
    the command-center review screen.

  • Approval requires the operator to submit the configured 4-digit PIN
    (`ESTIMATE_APPROVAL_PIN` env var). Wrong PIN → reject with 403.
    If no PIN is configured, the PIN check is skipped (dev / first-run mode).

  • On approval, deserializes the staged payload and actually dispatches the
    email (and any future SMS / portal-notify channels we add).

The gate itself can be disabled in dev/CI by setting
`ESTIMATE_REQUIRES_APPROVAL=false`.

Public API
──────────
  estimate_requires_approval()                                     → bool
  pin_required()                                                   → bool
  verify_pin(submitted)                                            → bool
  stage_proposal_for_approval(db, lead, payload)                   → HumanReviewQueue
  dispatch_approved_proposal(item)                                 → bool
"""

from __future__ import annotations

import base64
import hmac
import json
import logging
import os
import re
from typing import Any, Optional

from .notifications import send_transactional_email

logger = logging.getLogger(__name__)

PROPOSAL_DECISION_TYPE = "proposal_send"
_PIN_RE = re.compile(r"^\d{4}$")


def estimate_requires_approval() -> bool:
    """Default ON. Set ESTIMATE_REQUIRES_APPROVAL=false to restore auto-send."""
    return os.getenv("ESTIMATE_REQUIRES_APPROVAL", "true").strip().lower() not in (
        "false", "0", "no", "off",
    )


def _configured_pin() -> str:
    """
    The 4-digit operator PIN that unlocks dashboard actions (approve / reject
    estimate sends, etc.).

    Reads `JWORDEN_DASHBOARD_PIN` first (preferred name), falling back to
    `ESTIMATE_APPROVAL_PIN`. Returns '' if neither is set.
    """
    return (
        os.getenv("JWORDEN_DASHBOARD_PIN")
        or os.getenv("ESTIMATE_APPROVAL_PIN")
        or ""
    ).strip()


def pin_required() -> bool:
    """A PIN is required iff a valid 4-digit PIN is configured."""
    pin = _configured_pin()
    return bool(_PIN_RE.fullmatch(pin))


def verify_pin(submitted: Optional[str]) -> bool:
    """
    Constant-time check of the submitted PIN against the configured one.
    If no PIN is configured, returns True (PIN check disabled).
    Empty / non-4-digit submissions are always rejected when a PIN is required.
    """
    if not pin_required():
        return True
    if not submitted or not _PIN_RE.fullmatch(submitted.strip()):
        return False
    return hmac.compare_digest(submitted.strip(), _configured_pin())


def _summarize(payload: dict) -> str:
    """One-line human-readable summary shown in the review queue list."""
    name = payload.get("lead_name") or payload.get("recipient", "unknown")
    price_low = payload.get("price_low", "—")
    price_high = payload.get("price_high", "—")
    service = payload.get("service_type", "estimate")
    return f"Proposal for {name} — {service} — ${price_low}–${price_high}"[:500]


def stage_proposal_for_approval(db, lead, payload: dict):
    """
    Persist a fully-rendered proposal to the review queue.

    `payload` is a dict containing everything needed to dispatch later:
        recipient, subject, html_body, plain_text, pdf_b64, filename,
        lead_id, lead_name, service_type, price_low, price_high.

    Returns the persisted HumanReviewQueue item.
    """
    from ..models import HumanReviewQueue  # noqa: PLC0415

    lead_id = getattr(lead, "id", None) or payload.get("lead_id")
    item = HumanReviewQueue(
        decision_type = PROPOSAL_DECISION_TYPE,
        input_summary = _summarize(payload),
        ai_answer     = json.dumps(payload, default=str),
        ai_engine     = "proposal_generator",
        confidence    = None,  # not an AI-confidence decision; pure approval gate
        status        = "pending",
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    logger.info(
        "Estimate staged for approval: review_id=%s lead_id=%s recipient=%s",
        item.id, lead_id, payload.get("recipient", "—"),
    )
    return item


def dispatch_approved_proposal(item: Any) -> bool:
    """
    Read the staged payload off an approved HumanReviewQueue item and send
    the email. Returns True on success, False on failure. Never raises —
    the approval itself must not be rolled back if dispatch hiccups; the
    operator can retry via a re-send endpoint.
    """
    if getattr(item, "decision_type", None) != PROPOSAL_DECISION_TYPE:
        return False

    raw = getattr(item, "ai_answer", "") or ""
    try:
        payload = json.loads(raw)
    except (TypeError, ValueError) as exc:
        logger.error("Cannot decode staged proposal payload (item %s): %s", item.id, exc)
        return False

    recipient = (payload.get("recipient") or "").strip()
    if not recipient or "@" not in recipient:
        logger.warning("Approved proposal item %s has no valid recipient — skipping send", item.id)
        return False

    pdf_bytes: bytes | None = None
    pdf_b64 = payload.get("pdf_b64")
    if pdf_b64:
        try:
            pdf_bytes = base64.b64decode(pdf_b64)
        except (TypeError, ValueError) as exc:
            logger.warning("Bad pdf_b64 on item %s: %s — sending without attachment", item.id, exc)

    ok = send_transactional_email(
        subject         = payload.get("subject", "Your Project Proposal"),
        html_body       = payload.get("html_body", ""),
        to_addresses    = [recipient],
        attachment_bytes = pdf_bytes,
        attachment_name  = payload.get("filename", "proposal.pdf"),
    )
    if ok:
        logger.info("Approved proposal item %s dispatched to %s", item.id, recipient)
    else:
        logger.error("Approved proposal item %s dispatch FAILED to %s", item.id, recipient)
    return bool(ok)
