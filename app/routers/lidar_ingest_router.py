"""
lidar_ingest_router.py — Owner-only iPhone LiDAR scan ingestion (Ship G).

Endpoints (admin-auth, hidden):
    GET    /api/v1/admin/lidar/snapshot
    GET    /api/v1/admin/lidar/scans/{bucket}
    POST   /api/v1/admin/lidar/upload          (multipart)
    DELETE /api/v1/admin/lidar/scans/{bucket}/{scan_id}
    GET    /api/v1/admin/lidar/match?lat=&lng= (parcel lookup probe)
"""

from __future__ import annotations

import logging
import os
import secrets
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.security import HTTPBasic, HTTPBasicCredentials

from ..services import lidar_ingest

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/admin/lidar",
    tags=["admin-lidar"],
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
    return lidar_ingest.snapshot()


@router.get("/scans/{bucket}")
def scans(bucket: str, _owner: str = Depends(_require_owner)):
    return {"scans": lidar_ingest.list_scans(bucket)}


@router.get("/match")
def match(lat: float = Query(...), lng: float = Query(...),
          radius_mi: float = Query(0.25, ge=0.01, le=10),
          _owner: str = Depends(_require_owner)):
    return {"match": lidar_ingest.match_parcel(lat, lng, radius_mi=radius_mi)}


@router.post("/upload")
async def upload(
    file: UploadFile = File(...),
    job_id: Optional[str] = Form(None),
    parcel_id: Optional[str] = Form(None),
    gps_lat: Optional[float] = Form(None),
    gps_lng: Optional[float] = Form(None),
    captured_at: Optional[str] = Form(None),
    operator: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    _owner: str = Depends(_require_owner),
):
    body = await file.read()
    try:
        row = lidar_ingest.store_scan(
            filename=file.filename or "scan",
            content_type=file.content_type,
            body=body,
            job_id=job_id,
            parcel_id=parcel_id,
            gps_lat=gps_lat,
            gps_lng=gps_lng,
            captured_at=captured_at,
            operator=operator,
            notes=notes,
        )
        return {"ok": True, "scan": row}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/scans/{bucket}/{scan_id}")
def delete(bucket: str, scan_id: str, _owner: str = Depends(_require_owner)):
    if not lidar_ingest.delete_scan(bucket, scan_id):
        raise HTTPException(status_code=404, detail="scan not found")
    return {"ok": True}
