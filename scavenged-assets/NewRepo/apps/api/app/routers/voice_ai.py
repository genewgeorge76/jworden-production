"""
voice_ai.py — Vapi outbound calling + autonomy state management.

Routes (under /api/v1/voice-ai):
  POST /call                  place an outbound Vapi call
  GET  /status                Vapi availability + provider health + autonomy state
  GET  /autonomy              full autonomy state (master, frozen, domains)
  PUT  /autonomy/master       enable/disable master autonomy switch
  PUT  /autonomy/freeze       emergency freeze (disables all autonomous action)
  PUT  /autonomy/unfreeze     lift the freeze

All endpoints require X-Master-Key header (premium/owner-tier security).
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel

from ..core.limiter import limiter
from ..core.security import verify_premium_security
from ..services import autonomy_state as _autonomy
from ..services import vapi_caller as _vapi
from ..services import llm_client as _llm

router = APIRouter(prefix='/voice-ai', tags=['voice-ai'])

VAPI_LIMIT = '5/minute'


# ── Request / response models ────────────────────────────────────────────────

class CallRequest(BaseModel):
    to_number: str
    purpose: str
    script_hint: str | None = None
    assistant_id: str | None = None
    confirmed: bool = False     # must be True when master autonomy is OFF


class MasterRequest(BaseModel):
    enabled: bool


class FreezeRequest(BaseModel):
    reason: str = "manual"


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post('/call', summary='Place outbound Vapi voice call')
@limiter.limit(VAPI_LIMIT)
async def place_call(
    request: Request,
    body: CallRequest,
    _: dict = Depends(verify_premium_security),
):
    """Place an outbound call via Vapi. Respects autonomy freeze state."""
    result = await _vapi.place_call(
        body.to_number,
        purpose=body.purpose,
        script_hint=body.script_hint,
        assistant_id=body.assistant_id,
        confirmed=body.confirmed,
    )
    return result


@router.get('/status', summary='Vapi + provider health + autonomy state')
async def get_status(
    _: dict = Depends(verify_premium_security),
):
    """Returns Vapi availability, configured LLM providers, and current autonomy state."""
    state = _autonomy.get_state()
    providers = _llm.provider_status()
    return {
        "vapi": {
            "available": _vapi.is_available(),
            "key_set":   bool(_vapi._vapi_key()),
            "phone_set": bool(_vapi._vapi_phone_id()),
            "asst_set":  bool(_vapi._vapi_assistant_id()),
        },
        "llm_providers": providers,
        "autonomy": {
            "master":   state.get("master", False),
            "frozen":   state.get("frozen", False),
            "reason":   state.get("reason"),
            "frozenAt": state.get("frozenAt"),
        },
    }


@router.get('/autonomy', summary='Get full autonomy state')
async def get_autonomy(
    _: dict = Depends(verify_premium_security),
):
    return _autonomy.get_state()


@router.put('/autonomy/master', summary='Enable or disable master autonomy switch')
async def set_master(
    body: MasterRequest,
    _: dict = Depends(verify_premium_security),
):
    """Toggle the master autonomy switch. Rejected when system is frozen."""
    return _autonomy.set_master(body.enabled)


@router.put('/autonomy/freeze', summary='Emergency freeze — disables all autonomous action')
async def freeze_autonomy(
    body: FreezeRequest,
    _: dict = Depends(verify_premium_security),
):
    """Freeze Jarvis. All autonomous actions (calls, proposals, emails) are blocked until unfrozen."""
    return _autonomy.freeze(body.reason)


@router.put('/autonomy/unfreeze', summary='Lift the autonomy freeze')
async def unfreeze_autonomy(
    _: dict = Depends(verify_premium_security),
):
    """Lift the freeze. Master autonomy is NOT automatically re-enabled — toggle separately."""
    return _autonomy.unfreeze()
