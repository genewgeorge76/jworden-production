"""
notification_health.py — can an arriving lead actually reach anybody.

A lead pipeline fails in a way that looks exactly like a quiet week. The form
accepts the submission, the row lands in the database, the endpoint returns
200, and no phone buzzes. Nothing in that sequence produces an error anybody
sees, because the send happens in a background task after the response has
already gone out.

This module answered a narrower question than the one it was asked: which
channels are *configured*, meaning which environment variables hold a value. It
never contacted a provider. So a revoked SendGrid key, or — far more commonly —
a From address that is not a verified sender identity, both reported

    {"configured": true, "provider": "sendgrid"}

while every send returned 403 and no lead notification ever arrived. That is the
same failure the LLM provider dashboard had: reporting key presence and calling
it health. Presence is not reachability.

check() still answers the cheap question, because it must never hang. probe()
answers the real one: it calls the provider, validates the credential, and for
SendGrid checks whether the From address is actually a verified sender — the
single most common reason a correctly-configured SendGrid key sends nothing.

Three states are worth distinguishing, not two:

    nothing could be sent  — no channel is configured at all
    nothing was sent       — a channel exists and the provider rejected it
    it should have sent    — provider accepted; look at the background task

Secrets are never included in the output. This report is meant to be read while
debugging and pasted into a chat window, so it carries booleans, provider names
and provider error text, never key material.

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


# ── Live probes ───────────────────────────────────────────────────────────────

_SENDGRID_SCOPES = "https://api.sendgrid.com/v3/scopes"
_SENDGRID_SENDERS = "https://api.sendgrid.com/v3/verified_senders"
_PROBE_TIMEOUT = 8.0


def _add_error(result: dict[str, Any], message: str) -> None:
    """
    Accumulate problems instead of overwriting them.

    A key can lack the mail.send scope AND name an unverified sender. Assigning
    result["error"] at each site meant only the last one survived, so an
    operator fixed one problem, re-ran the probe, and met the next — which is
    the slowest possible way to learn there were two.

    `error` remains the first (most fundamental) problem so simple readers keep
    working; `errors` carries all of them.
    """
    result.setdefault("errors", []).append(message)
    result.setdefault("error", message)


def _sendgrid_probe(api_key: str, from_email: str) -> dict[str, Any]:
    """
    Validate the key, then check the From address against verified senders.

    Both halves matter and they fail differently. A bad key is a 401 on any
    call. A good key with an unverified From address authenticates perfectly
    and then rejects every send with 403 "The from address does not match a
    verified Sender Identity" — which is invisible to a check that only asks
    whether the key is set.
    """
    import httpx  # noqa: PLC0415

    headers = {"Authorization": f"Bearer {api_key}"}
    result: dict[str, Any] = {"provider": "sendgrid"}

    try:
        with httpx.Client(timeout=_PROBE_TIMEOUT) as client:
            scopes = client.get(_SENDGRID_SCOPES, headers=headers)
    except Exception as exc:  # noqa: BLE001
        return {**result, "reachable": False, "credential": "unknown",
                "error": f"{exc.__class__.__name__}: {exc}"}

    if scopes.status_code == 401:
        return {**result, "reachable": True, "credential": "rejected",
                "error": "SendGrid rejected the API key (401). It is wrong, revoked, or disabled."}
    if scopes.status_code >= 400:
        return {**result, "reachable": True, "credential": "unknown",
                "error": f"SendGrid returned HTTP {scopes.status_code} for /v3/scopes.",
                "detail": (scopes.text or "")[:300]}

    result.update({"reachable": True, "credential": "accepted"})
    try:
        scope_list = (scopes.json() or {}).get("scopes") or []
        result["can_send"] = any(s.startswith("mail.send") for s in scope_list)
        if not result["can_send"]:
            _add_error(
                result,
                "The key authenticates but has no mail.send scope, so it cannot "
                "send email. Create a key with Mail Send permission.",
            )
    except Exception:  # noqa: BLE001
        pass

    if not from_email:
        result["sender_verified"] = None
        _add_error(result, "SENDGRID_FROM_EMAIL is not set; nothing to verify.")
        return result

    try:
        with httpx.Client(timeout=_PROBE_TIMEOUT) as client:
            senders = client.get(_SENDGRID_SENDERS, headers=headers)
        if senders.status_code == 200:
            verified = {
                (e.get("from_email") or "").lower()
                for e in (senders.json() or {}).get("results", [])
                if e.get("verified")
            }
            ok = from_email.lower() in verified
            result["sender_verified"] = ok
            result["from_email"] = from_email
            if not ok:
                _add_error(
                    result,
                    f"{from_email} is not a verified sender on this SendGrid "
                    f"account, so every send is rejected with 403. Verify it "
                    f"under Settings -> Sender Authentication.",
                )
                result["verified_senders"] = sorted(verified)
        else:
            # Not fatal: this endpoint needs its own scope, and a domain-
            # authenticated sender does not appear here at all.
            result["sender_verified"] = None
            result["sender_check"] = f"HTTP {senders.status_code} from /v3/verified_senders"
    except Exception as exc:  # noqa: BLE001
        result["sender_verified"] = None
        result["sender_check"] = f"{exc.__class__.__name__}: {exc}"

    return result


def probe() -> dict[str, Any]:
    """
    Contact the configured email provider and report what it says.

    Unlike check(), this makes network calls. It is admin-only and deliberately
    not called on a hot path.
    """
    report: dict[str, Any] = {"checked": "live probe"}
    api_key = (os.getenv("SENDGRID_API_KEY") or "").strip()
    if not api_key:
        report["email"] = {
            "provider": None,
            "configured": False,
            "error": "SENDGRID_API_KEY is not set.",
        }
        return report

    report["email"] = _sendgrid_probe(
        api_key, (os.getenv("SENDGRID_FROM_EMAIL") or "").strip()
    )
    return report
