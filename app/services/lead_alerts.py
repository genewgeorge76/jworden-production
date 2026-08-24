"""
lead_alerts.py — tell somebody a lead arrived, and record that you did.

THE FAILURE THIS CLOSES
───────────────────────
Notification was fire-and-forget from every intake path: the router queued a
background task and returned 200. If the send failed — no provider configured,
a bad key, Twilio down — it went to the log and nowhere else. The form said
thank you, the row was saved, and nobody was on the way.

That makes an unconfigured pipeline indistinguishable from a quiet week, which
is the worst possible failure for a lead pipeline because the symptom is
silence and silence is also what success looks like from the outside.

Now every path calls notify_and_record and the outcome lands on the lead row,
so "did anybody get told about this one" is a column rather than a log search.

TWO PATHS THAT NEVER CALLED ANYTHING
────────────────────────────────────
social.py and email_sync.py both create Lead rows and neither notified. A lead
from a social channel or an inbound email was written to the database in
silence — no email, no text, nothing. Those are wired here.

WHY IT NEVER RAISES
───────────────────
A notification failure must not fail the request that produced the lead. Losing
the row because the SMS provider is down is strictly worse than losing the
alert: the alert can be re-sent from a row, and a row that was never written is
gone. So this catches everything, records what it can, and returns.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Optional

from .notifications import send_lead_notification

logger = logging.getLogger(__name__)


def notify_and_record(db: Any, lead: Any, payload: Optional[dict] = None) -> dict:
    """
    Send the alert for `lead` and write the receipt onto it.

    `payload` is what the notifier formats. When omitted it is built from the
    row, so a caller that has no dict of its own — email_sync and social both
    build a Lead directly — does not have to invent one.
    """
    data = payload if payload is not None else payload_from(lead)

    try:
        receipt = send_lead_notification(data)
    except Exception as exc:  # noqa: BLE001
        # Never let a notification failure destroy the lead that caused it. The
        # alert can be re-sent from a stored row; a row that was never written
        # is simply gone.
        logger.exception("Lead notification raised for lead id=%s", getattr(lead, "id", None))
        receipt = {
            "attempted": [],
            "delivered": [],
            "failed": ["exception"],
            "error": f"{type(exc).__name__}: {exc}"[:500],
        }

    try:
        lead.notified_at = datetime.now(timezone.utc)
        lead.notify_delivered = ",".join(receipt.get("delivered") or []) or None
        lead.notify_failed = ",".join(receipt.get("failed") or []) or None
        lead.notify_error = receipt.get("error")
        db.commit()
    except Exception:  # noqa: BLE001
        # The receipt is a convenience; the lead is the asset. If the write
        # fails the row still stands.
        logger.exception("Could not record the notification receipt for lead id=%s",
                         getattr(lead, "id", None))
        try:
            db.rollback()
        except Exception:  # noqa: BLE001
            pass

    return receipt


def payload_from(lead: Any) -> dict:
    """
    A notification payload built from a stored lead.

    Only fields the notifier formats, so a row picking up new columns later
    does not start posting internal state into an email.
    """
    score = {}
    if getattr(lead, "score_label", None) or getattr(lead, "score_priority", None):
        score = {
            "label": getattr(lead, "score_label", None) or "—",
            "priority": getattr(lead, "score_priority", None) or "—",
            "value": getattr(lead, "score_value", None),
        }

    return {
        "type": getattr(lead, "source", None) or "lead",
        "db_id": getattr(lead, "id", None),
        "name": getattr(lead, "name", None) or "Unknown",
        "email": getattr(lead, "email", None),
        "phone": getattr(lead, "phone", None),
        "service_type": getattr(lead, "service_type", None),
        "property_type": getattr(lead, "property_type", None),
        "urgency": getattr(lead, "urgency", None),
        "address": getattr(lead, "address", None),
        "state_code": getattr(lead, "state_code", None),
        "message": getattr(lead, "message", None),
        "source": getattr(lead, "source", None),
        "score": score,
    }


def was_delivered(lead: Any) -> bool:
    """Whether any channel actually carried this lead to a person."""
    return bool((getattr(lead, "notify_delivered", "") or "").strip())


def summarise(leads: list) -> dict:
    """
    How the pipeline is doing at the only job that matters.

    Reported as three numbers rather than a percentage: "94% delivered" reads
    as healthy while the six per cent nobody was told about is the entire
    problem.
    """
    total = len(leads)
    delivered = sum(1 for lead in leads if was_delivered(lead))
    never_attempted = sum(1 for lead in leads if getattr(lead, "notified_at", None) is None)
    return {
        "leads": total,
        "someone_was_told": delivered,
        "alert_failed": total - delivered - never_attempted,
        "never_attempted": never_attempted,
    }
