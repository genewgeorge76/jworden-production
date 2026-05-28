"""
drone_capture_router.py — Owner-only drone media upload + manifest API (Ship F).

Endpoints (admin-auth gated, hidden from public OpenAPI):

    GET  /api/v1/admin/drone/snapshot
    GET  /api/v1/admin/drone/captures/{job_id}
    POST /api/v1/admin/drone/upload          (multipart: file, job_id, optional gps/alt/...)
    DELETE /api/v1/admin/drone/captures/{job_id}/{capture_id}
"""

from __future__ import annotations

import logging
import os
import secrets
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.security import HTTPBasic, HTTPBasicCredentials

from ..services import drone_capture

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/admin/drone",
    tags=["admin-drone"],
    include_in_schema=False,
)

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
        raise HTTPException(status_code=503, detail="Admin not configured. Set ADMIN_PASSWORD.")
    u_ok = secrets.compare_digest(credentials.username.encode(), admin_user)
    p_ok = secrets.compare_digest(credentials.password.encode(), admin_pass)
    if not (u_ok and p_ok):
        raise HTTPException(status_code=401, detail="Bad credentials",
                            headers={"WWW-Authenticate": "Basic"})
    return credentials.username


@router.get("/snapshot")
def snap(_owner: str = Depends(_require_owner)):
    return drone_capture.snapshot()


@router.get("/captures/{job_id}")
def captures(job_id: str, _owner: str = Depends(_require_owner)):
    return {"captures": drone_capture.list_captures(job_id)}


@router.post("/upload")
async def upload(
    file: UploadFile = File(...),
    job_id: str = Form(...),
    gps_lat: Optional[float] = Form(None),
    gps_lng: Optional[float] = Form(None),
    altitude_m: Optional[float] = Form(None),
    captured_at: Optional[str] = Form(None),
    pilot: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    _owner: str = Depends(_require_owner),
):
    body = await file.read()
    try:
        row = drone_capture.store_capture(
            job_id=job_id,
            filename=file.filename or "capture",
            content_type=file.content_type,
            body=body,
            gps_lat=gps_lat,
            gps_lng=gps_lng,
            altitude_m=altitude_m,
            captured_at=captured_at,
            pilot=pilot,
            notes=notes,
        )
        return {"ok": True, "capture": row}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/captures/{job_id}/{capture_id}")
def delete(job_id: str, capture_id: str, _owner: str = Depends(_require_owner)):
    if not drone_capture.delete_capture(job_id, capture_id):
        raise HTTPException(status_code=404, detail="capture not found")
    return {"ok": True}
