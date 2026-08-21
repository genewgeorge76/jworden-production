"""
notification_health.py — can an arriving lead actually reach anybody.

A lead pipeline fails in a way that looks exactly like a quiet week. The form
accepts the submission, the row lands in the database, the endpoint returns
200, and no phone buzzes. Nothing in that sequence produces an error anybody
sees, because the send happens in a background task after the response has
already gone out.

So the question this module answers is deliberately narrow and checkable:
which delivery channels are configured *right now*, in this process. It does
not send anything and it does not promise delivery — a configured Resend key
can still be revoked, and a valid Twilio number can still be unrouteable. It
distinguishes the two states an operator most needs to tell apart:

    nothing was sent   — a channel exists and the attempt failed
    nothing could be   — no channel is configured at all

The second is by far the more common cause of "I'm not getting my leads", and
it is invisible without something like this.

Secrets are never included in the output. This report is meant to be read
while debugging and pasted into a chat window, so it carries booleans and
provider names, never key material.
"""

from __future__ import annotations

import os
from typing import Any

# Providers are checked in the order `notifications.send_transactional_email`
# actually tries them, so the reported provider is the one that would be used.
_EMAIL_PROVIDERS: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("resend", ("RESEND_API_KEY",)),
    ("sendgrid", ("SENDGRID_API_KEY",)),
    ("smtp", ("SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD")),
)

_SMS_REQUIRED: tuple[str, ...] = (
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_FROM_NUMBER",
)


def _set(name: str) -> bool:
    """True when an environment variable holds a non-empty value."""
    return bool((os.getenv(name) or "").strip())


def _recipients(var: str) -> int:
    """How many comma-separated recipients `var` names."""
    return len([p for p in (os.getenv(var) or "").split(",") if p.strip()])


def _email_status() -> dict[str, Any]:
    for provider, required in _EMAIL_PROVIDERS:
        if all(_set(name) for name in required):
            status: dict[str, Any] = {
                "configured": True,
                "provider": provider,
                "extra_recipients": _recipients("NOTIFY_TO_EMAIL"),
            }
            # Resend refuses to send without a verified From address, so a key
            # on its own is not enough to call this channel usable.
            if provider == "resend" and not _set("RESEND_FROM_EMAIL"):
                status["configured"] = False
                status["blocked_by"] = "RESEND_FROM_EMAIL is not set"
            return status

    return {
        "configured": False,
        "provider": None,
        "missing": [
            f"{provider}: {', '.join(n for n in required if not _set(n))}"
            for provider, required in _EMAIL_PROVIDERS
        ],
        "extra_recipients": _recipients("NOTIFY_TO_EMAIL"),
    }


def _sms_status() -> dict[str, Any]:
    missing = [name for name in _SMS_REQUIRED if not _set(name)]
    recipients = _recipients("NOTIFY_TO_PHONE")

    status: dict[str, Any] = {
        "configured": not missing and recipients > 0,
        "recipients": recipients,
    }
    if missing:
        status["missing"] = missing
    elif recipients == 0:
        # Credentials without a destination is the subtler of the two
        # failures: everything looks configured and no message has anywhere
        # to go.
        status["blocked_by"] = "NOTIFY_TO_PHONE names no recipients"
    return status


def check() -> dict[str, Any]:
    """
    Report which lead-notification channels are configured in this process.

    Returns a JSON-safe dict with `can_notify` — true when at least one
    channel could carry a message — plus a per-channel breakdown and a
    human-readable summary. Contains no secret values.
    """
    email = _email_status()
    sms = _sms_status()
    can_notify = bool(email["configured"] or sms["configured"])

    if can_notify:
        live = [
            name
            for name, ok in (("email", email["configured"]), ("SMS", sms["configured"]))
            if ok
        ]
        summary = f"Lead notifications will be delivered by: {', '.join(live)}."
    else:
        summary = (
            "No notification channel is configured — leads are being saved to the "
            "database and nobody is being told. Set RESEND_API_KEY with "
            "RESEND_FROM_EMAIL for email, or the three TWILIO_* variables with "
            "NOTIFY_TO_PHONE for text messages."
        )

    return {
        "can_notify": can_notify,
        "email": email,
        "sms": sms,
        "summary": summary,
    }
