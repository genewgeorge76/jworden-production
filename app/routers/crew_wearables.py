"""
crew_wearables.py — Wearable health vitals webhook + admin dashboard endpoints.

Public ingest endpoints accept signed webhooks from each provider:
    POST /api/v1/wearables/{provider}/webhook
        headers: X-Wearable-Signature: sha256=...
        body:    {crew_id, vitals: {heart_rate, spo2, skin_temp, hrv, ...}}

Owner-only admin endpoints:
    GET  /api/v1/admin/wearables/snapshot
    GET  /api/v1/admin/wearables/crews
    GET  /api/v1/admin/wearables/config
"""

from __future__ import annotations

import logging
import os
import secrets
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel

from ..services import crew_wearables as cw
from ..services import runtime_config

logger = logging.getLogger(__name__)

admin_router = APIRouter(prefix="/api/v1/admin/wearables", tags=["admin-wearables"], include_in_schema=False)
public_router = APIRouter(prefix="/api/v1/wearables", tags=["wearables"], include_in_schema=False)

security = HTTPBasic()


def _require_owner(creds: HTTPBasicCredentials = Depends(security)) -> str:
    if os.getenv("ADMIN_AUTH_DISABLED") == "1":
        return "auth_bypass"
    admin_user = os.getenv("ADMIN_USERNAME", "admin").encode()
    admin_pass = os.getenv("ADMIN_PASSWORD", "").encode()
    if not admin_pass:
        raise HTTPException(status_code=503, detail="Admin not configured. Set ADMIN_PASSWORD.")
    user_ok = secrets.compare_digest((creds.username or "").encode(), admin_user)
    pass_ok = secrets.compare_digest((creds.password or "").encode(), admin_pass)
    if not (user_ok and pass_ok):
        raise HTTPException(status_code=401, detail="Owner auth required",
                            headers={"WWW-Authenticate": 'Basic realm="JWordenAI Admin"'})
    return creds.username


# ── Webhook ingest ────────────────────────────────────────────────────────────

class VitalsBody(BaseModel):
    crew_id: str
    vitals: dict[str, Any]


@public_router.post("/{provider}/webhook")
async def post_webhook(provider: str, request: Request) -> dict:
    if provider not in cw.PROVIDERS:
        raise HTTPException(status_code=404, detail=f"Unknown provider '{provider}'")
    raw = await request.body()
    sig = request.headers.get("x-wearable-signature", "")
    if not cw.verify_signature(provider, raw, sig):
        raise HTTPException(status_code=401, detail="Invalid signature")
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    crew_id = str(body.get("crew_id") or "").strip() or "unknown"
    vitals = body.get("vitals") or body  # accept flat shape too
    if not isinstance(vitals, dict):
        raise HTTPException(status_code=400, detail="vitals must be an object")
    alerts = cw.record(crew_id, provider, vitals)
    return {"ok": True, "crew_id": crew_id, "alerts": alerts}


# ── Owner dashboard ───────────────────────────────────────────────────────────

@admin_router.get("/snapshot")
def get_snapshot(crew_id: str | None = None, _: str = Depends(_require_owner)) -> dict:
    return cw.snapshot(crew_id)


@admin_router.get("/crews")
def get_crews(_: str = Depends(_require_owner)) -> dict:
    return {"crews": cw.crew_list()}


@admin_router.get("/config")
def get_config(_: str = Depends(_require_owner)) -> dict:
    return cw.config_status()
