"""
twilio_verify.py — Twilio Verify v2 wrapper for SMS/voice OTP.

Used by:
  • Admin 2FA fallback (when authenticator app is unavailable)
  • Lead-form phone verification (defeat fake leads before they hit CRM)
  • Future: customer appointment confirmations

Env vars:
  TWILIO_ACCOUNT_SID         — starts with AC...
  TWILIO_AUTH_TOKEN          — 32-char hex
  TWILIO_VERIFY_SERVICE_SID  — starts with VA...

All functions are non-raising; they return {"ok": bool, ...}.
Get keys at: https://console.twilio.com/
"""

from __future__ import annotations

import logging
import os
import re
from typing import Optional

import httpx

from app.services import runtime_config as _cfg

logger = logging.getLogger(__name__)

_BASE_URL = "https://verify.twilio.com/v2"
_TIMEOUT = 15.0
_PHONE_E164 = re.compile(r"^\+\d{8,15}$")


def _creds() -> tuple[str, str, str]:
    return (
        _cfg.get("TWILIO_ACCOUNT_SID"),
        _cfg.get("TWILIO_AUTH_TOKEN"),
        _cfg.get("TWILIO_VERIFY_SERVICE_SID"),
    )


def is_available() -> bool:
    sid, tok, svc = _creds()
    return bool(sid and tok and svc)


def _normalize_phone(raw: str) -> Optional[str]:
    """US-aware E.164 normalizer. Accepts (804) 555-0100, 8045550100, +18045550100, etc."""
    if not raw:
        return None
    s = raw.strip()
    if _PHONE_E164.match(s):
        return s
    digits = re.sub(r"\D", "", s)
    if len(digits) == 10:
        return f"+1{digits}"
    if len(digits) == 11 and digits.startswith("1"):
        return f"+{digits}"
    if 8 <= len(digits) <= 15:
        return f"+{digits}"
    return None


async def start_verification(to: str, *, channel: str = "sms") -> dict:
    """
    Send an SMS or voice OTP to `to`. Channel ∈ {"sms","call","whatsapp","email"}.
    Returns {"ok": True, "sid", "status", "to", "channel"} or {"ok": False, "error", ...}.
    """
    if not is_available():
        return {"ok": False, "error": "Twilio not configured (set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID)"}

    e164 = _normalize_phone(to)
    if not e164:
        return {"ok": False, "error": f"Invalid phone number: {to!r}"}

    if channel not in {"sms", "call", "whatsapp", "email"}:
        return {"ok": False, "error": f"Invalid channel: {channel!r}"}

    sid, tok, svc = _creds()
    url = f"{_BASE_URL}/Services/{svc}/Verifications"
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            r = await client.post(
                url,
                data={"To": e164, "Channel": channel},
                auth=(sid, tok),
            )
        if r.status_code >= 400:
            logger.warning("Twilio start_verification %d: %s", r.status_code, r.text[:300])
            return {"ok": False, "error": f"Twilio HTTP {r.status_code}", "detail": r.text[:300]}
        j = r.json()
        return {
            "ok":      True,
            "sid":     j.get("sid"),
            "status":  j.get("status"),  # "pending" expected
            "to":      e164,
            "channel": channel,
        }
    except Exception as exc:  # noqa: BLE001
        logger.exception("Twilio start_verification failed")
        return {"ok": False, "error": str(exc)}


async def check_verification(to: str, code: str) -> dict:
    """
    Verify the OTP `code` against `to`. Returns {"ok": bool, "status", ...}.
    "approved" status means valid; anything else = rejected.
    """
    if not is_available():
        return {"ok": False, "error": "Twilio not configured"}

    e164 = _normalize_phone(to)
    if not e164:
        return {"ok": False, "error": f"Invalid phone number: {to!r}"}

    code = (code or "").strip()
    if not code or not code.isdigit():
        return {"ok": False, "error": "Code must be digits"}

    sid, tok, svc = _creds()
    url = f"{_BASE_URL}/Services/{svc}/VerificationCheck"
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            r = await client.post(
                url,
                data={"To": e164, "Code": code},
                auth=(sid, tok),
            )
        if r.status_code >= 400:
            logger.warning("Twilio check_verification %d: %s", r.status_code, r.text[:300])
            return {"ok": False, "error": f"Twilio HTTP {r.status_code}", "detail": r.text[:300]}
        j = r.json()
        approved = j.get("status") == "approved" and j.get("valid") is True
        return {
            "ok":       approved,
            "status":   j.get("status"),
            "valid":    bool(j.get("valid")),
            "to":       e164,
        }
    except Exception as exc:  # noqa: BLE001
        logger.exception("Twilio check_verification failed")
        return {"ok": False, "error": str(exc)}
