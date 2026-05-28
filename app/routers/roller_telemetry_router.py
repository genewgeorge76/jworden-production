"""
roller_telemetry_router.py — Roller compaction telemetry (Ship H).

POST endpoints are unauthenticated (designed for in-field phone with a
shared SESSION_KEY in env if needed). Read endpoints are owner-only.

Public-ish (requires matching ROLLER_INGEST_KEY header if configured):
    POST /api/v1/roller/start    body: {session_id, job_id?, operator?, mix?, key?}
    POST /api/v1/roller/sample   body: {session_id, lat, lng, vert_accel_g, ...}
    POST /api/v1/roller/end      body: {session_id, key?}

Owner:
    GET  /api/v1/admin/roller/snapshot
    GET  /api/v1/admin/roller/sessions/{session_id}
"""

from __future__ import annotations

import logging
import os
import secrets
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel

from ..services import roller_telemetry

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["roller"])

security = HTTPBasic()


def _auth_disabled() -> bool:
    mode = os.getenv("AUTH_MODE", "required").strip().lower()
    return mode in {"none", "off", "disabled", "0", "false"}


def _require_owner(credentials: HTTPBasicCredentials = Depends(security)) -> str:
    if _auth_disabled():
        return "auth_bypass"
    admin_user = os.getenv("ADMIN_USERNAME", "admin").encode()
    admin_pass = os.getenv("ADMIN_PASSWORD", "").encode()
    if not admin_pass:
        raise HTTPException(status_code=503, detail="Admin not configured.")
    u_ok = secrets.compare_digest(credentials.username.encode(), admin_user)
    p_ok = secrets.compare_digest(credentials.password.encode(), admin_pass)
    if not (u_ok and p_ok):
        raise HTTPException(status_code=401, detail="Bad credentials",
                            headers={"WWW-Authenticate": "Basic"})
    return credentials.username


def _check_ingest_key(request: Request, body_key: Optional[str]) -> None:
    expected = os.getenv("ROLLER_INGEST_KEY", "").strip()
    if not expected:
        return  # open ingest if no key set
    provided = request.headers.get("X-Roller-Key", "") or (body_key or "")
    if not secrets.compare_digest(expected.encode(), provided.encode()):
        raise HTTPException(status_code=401, detail="bad ingest key")


class StartBody(BaseModel):
    session_id: str
    job_id: Optional[str] = None
    operator: Optional[str] = None
    mix: Optional[str] = None
    key: Optional[str] = None


class Sample(BaseModel):
    session_id: str
    lat: float
    lng: float
    vert_accel_g: float
    speed_mph: Optional[float] = None
    heading_deg: Optional[float] = None
    t_ms: Optional[int] = None
    key: Optional[str] = None


class EndBody(BaseModel):
    session_id: str
    key: Optional[str] = None


@router.post("/roller/start")
def start(body: StartBody, request: Request):
    _check_ingest_key(request, body.key)
    return roller_telemetry.start_session(
        body.session_id, job_id=body.job_id, operator=body.operator, mix=body.mix
    )


@router.post("/roller/sample")
def sample(body: Sample, request: Request):
    _check_ingest_key(request, body.key)
    return roller_telemetry.ingest(
        body.session_id, lat=body.lat, lng=body.lng,
        vert_accel_g=body.vert_accel_g, speed_mph=body.speed_mph,
        heading_deg=body.heading_deg, t_ms=body.t_ms,
    )


@router.post("/roller/end")
def end(body: EndBody, request: Request):
    _check_ingest_key(request, body.key)
    if not roller_telemetry.end_session(body.session_id):
        raise HTTPException(status_code=404, detail="session not found")
    return {"ok": True}


admin_router = APIRouter(prefix="/api/v1/admin/roller", tags=["admin-roller"], include_in_schema=False)


@admin_router.get("/snapshot")
def snap(_owner: str = Depends(_require_owner)):
    return roller_telemetry.snapshot()


@admin_router.get("/sessions/{session_id}")
def session(session_id: str, _owner: str = Depends(_require_owner)):
    s = roller_telemetry.get_session(session_id)
    if not s:
        raise HTTPException(status_code=404, detail="session not found")
    return s
