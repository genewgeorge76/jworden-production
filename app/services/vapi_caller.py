"""
vapi_caller.py — Vapi-backed outbound voice calls for Jarvis.

Required env:
  VAPI_API_KEY=vapi_xxxxxxxxxxxxxxxxxxxxxxxx           # private key from dashboard
  VAPI_PHONE_NUMBER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxx    # the Vapi phone number SID to dial FROM
  VAPI_ASSISTANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxx       # default assistant to use (already configured at /public/vapi-assistant.json)

Get keys at https://dashboard.vapi.ai/
Cost: ~$0.05/min + your provider charges.

Safety:
  - Honors the autonomy_state freeze (no calls when frozen).
  - When master autonomy is OFF, only allows calls explicitly initiated from the Command Center
    (caller passes confirmed=True). Background tasks must check master themselves.
  - All call attempts are logged.
"""
from __future__ import annotations
import os
import re
import logging
from typing import Any, Optional

from app.services import autonomy_state
from app.services import runtime_config as _cfg

logger = logging.getLogger(__name__)

def _vapi_key()         -> str: return _cfg.get("VAPI_API_KEY")
def _vapi_phone_id()    -> str: return _cfg.get("VAPI_PHONE_NUMBER_ID")
def _vapi_assistant_id()-> str: return _cfg.get("VAPI_ASSISTANT_ID")
_VAPI_URL = "https://api.vapi.ai/call"

_E164_RE = re.compile(r"^\+\d{8,15}$")


def is_available() -> bool:
    return bool(_vapi_key() and _vapi_phone_id() and _vapi_assistant_id())


def _normalize_phone(raw: str) -> Optional[str]:
    """Light E.164 normalization — assumes US (+1) when 10 digits."""
    if not raw:
        return None
    digits = re.sub(r"[^\d+]", "", raw)
    if digits.startswith("+"):
        return digits if _E164_RE.match(digits) else None
    if len(digits) == 10:
        return f"+1{digits}"
    if len(digits) == 11 and digits.startswith("1"):
        return f"+{digits}"
    return None


async def place_call(
    to_number: str,
    *,
    purpose: str,
    script_hint: Optional[str] = None,
    assistant_id: Optional[str] = None,
    confirmed: bool = False,
) -> dict[str, Any]:
    """
    Place an outbound call via Vapi. Returns {ok, call_id|error, ...}.

    purpose: human-readable label for logs ("Book reservation at Lemaire 7pm Friday for 2")
    script_hint: optional line passed as assistant overrides.firstMessage
    confirmed: must be True for autonomous calls when master is OFF
    """
    state = autonomy_state.get_state()
    if state.get("frozen"):
        return {"ok": False, "error": "Autonomy is FROZEN — outbound calling disabled."}

    if not is_available():
        missing = [
            name for name, val in (
                ("VAPI_API_KEY", _vapi_key()),
                ("VAPI_PHONE_NUMBER_ID", _vapi_phone_id()),
                ("VAPI_ASSISTANT_ID", _vapi_assistant_id()),
            ) if not val
        ]
        return {"ok": False, "error": f"Vapi not configured. Missing: {', '.join(missing)} (set in Command Center → Integrations)"}

    e164 = _normalize_phone(to_number)
    if not e164:
        return {"ok": False, "error": f"Invalid phone number: {to_number!r} (need E.164 like +18045550100)"}

    if not state.get("master") and not confirmed:
        return {
            "ok": False,
            "error": "Master autonomy OFF and call not confirmed. Set confirmed=True (operator click) to override.",
        }

    try:
        import httpx  # type: ignore
    except ImportError:
        return {"ok": False, "error": "httpx not installed"}

    payload: dict[str, Any] = {
        "assistantId":    (assistant_id or _vapi_assistant_id()),
        "phoneNumberId":  _vapi_phone_id(),
        "customer":       {"number": e164},
    }
    if script_hint:
        payload["assistantOverrides"] = {
            "firstMessage": script_hint[:500],
            "metadata":     {"purpose": purpose[:200]},
        }

    headers = {
        "Authorization": f"Bearer {_vapi_key()}",
        "Content-Type":  "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.post(_VAPI_URL, json=payload, headers=headers)
        if r.status_code not in (200, 201):
            logger.warning("[VAPI] call non-200: %s %s", r.status_code, r.text[:300])
            return {"ok": False, "error": f"vapi http {r.status_code}", "detail": r.text[:300]}
        data = r.json()
        call_id = data.get("id") or data.get("callId")
        logger.info("[VAPI] placed call to %s purpose=%s id=%s", e164, purpose[:80], call_id)
        return {
            "ok":      True,
            "call_id": call_id,
            "to":      e164,
            "purpose": purpose,
            "status":  data.get("status"),
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("[VAPI] call failed: %s", exc)
        return {"ok": False, "error": str(exc)[:200]}
