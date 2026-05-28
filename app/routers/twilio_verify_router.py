"""
twilio_verify_router.py — public + admin endpoints for Twilio Verify SMS OTP.

Public (rate-limited via Twilio's own service quotas):
  POST /api/v1/twilio/verify/start          {to, channel}      — trigger SMS/voice OTP
  POST /api/v1/twilio/verify/check          {to, code}         — verify OTP

Admin-context (operator triggers from Command Center):
  POST /api/v1/twilio/verify/admin/start                       — sends to ADMIN_2FA_PHONE
  GET  /api/v1/twilio/verify/status                            — config sanity check
"""

from __future__ import annotations

import os
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services import twilio_verify as _tv

router = APIRouter(prefix="/api/v1/twilio/verify", tags=["Twilio Verify"])


class StartRequest(BaseModel):
    to:      str = Field(..., description="Phone in any common US format; will be normalized to E.164")
    channel: str = Field("sms", description="sms | call | whatsapp | email")


class CheckRequest(BaseModel):
    to:   str
    code: str


class AdminCheckRequest(BaseModel):
    code: str


@router.get("/status", summary="Is Twilio Verify configured?")
async def verify_status():
    return {
        "configured":     _tv.is_available(),
        "admin_phone_set": bool(os.environ.get("ADMIN_2FA_PHONE", "").strip()),
    }


@router.post("/start", summary="Send an OTP code")
async def verify_start(req: StartRequest):
    result = await _tv.start_verification(req.to, channel=req.channel)
    if not result.get("ok"):
        raise HTTPException(status_code=400, detail=result.get("error") or "Verification start failed")
    return result


@router.post("/check", summary="Validate an OTP code")
async def verify_check(req: CheckRequest):
    result = await _tv.check_verification(req.to, req.code)
    # We deliberately do NOT raise here for invalid code; ok=false is the answer
    return result


@router.post("/admin/start", summary="Send OTP to admin's pre-configured phone (ADMIN_2FA_PHONE)")
async def verify_admin_start():
    phone = os.environ.get("ADMIN_2FA_PHONE", "").strip()
    if not phone:
        raise HTTPException(status_code=503, detail="ADMIN_2FA_PHONE not set")
    result = await _tv.start_verification(phone, channel="sms")
    if not result.get("ok"):
        raise HTTPException(status_code=400, detail=result.get("error") or "Verification start failed")
    # Hide the full phone number in the response — only return last 4
    masked = "***-***-" + phone[-4:]
    return {"ok": True, "sent_to": masked, "status": result.get("status")}
