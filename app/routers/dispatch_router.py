"""
dispatch_router.py — Owner-only dump-truck dispatch API (Ship D).

Endpoints (admin-auth gated, hidden from public OpenAPI):

    GET  /api/v1/admin/dispatch/snapshot
    GET  /api/v1/admin/dispatch/trucks
    POST /api/v1/admin/dispatch/trucks
    DELETE /api/v1/admin/dispatch/trucks/{id}
    GET  /api/v1/admin/dispatch/drivers
    POST /api/v1/admin/dispatch/drivers
    DELETE /api/v1/admin/dispatch/drivers/{id}
    GET  /api/v1/admin/dispatch/jobs
    POST /api/v1/admin/dispatch/jobs
    DELETE /api/v1/admin/dispatch/jobs/{id}
    GET  /api/v1/admin/dispatch/assign/{job_id}
"""

from __future__ import annotations

import logging
import os
import secrets

from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.security import HTTPBasic, HTTPBasicCredentials

from ..services import dispatch_engine

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/admin/dispatch",
    tags=["admin-dispatch"],
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
def get_snapshot(_owner: str = Depends(_require_owner)):
    return dispatch_engine.snapshot()


@router.get("/trucks")
def trucks(_owner: str = Depends(_require_owner)):
    return {"trucks": dispatch_engine.list_trucks()}


@router.post("/trucks")
def upsert_truck(payload: dict = Body(...), _owner: str = Depends(_require_owner)):
    try:
        return dispatch_engine.upsert_truck(payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/trucks/{rid}")
def delete_truck(rid: str, _owner: str = Depends(_require_owner)):
    if not dispatch_engine.delete_truck(rid):
        raise HTTPException(status_code=404, detail="truck not found")
    return {"ok": True}


@router.get("/drivers")
def drivers(_owner: str = Depends(_require_owner)):
    return {"drivers": dispatch_engine.list_drivers()}


@router.post("/drivers")
def upsert_driver(payload: dict = Body(...), _owner: str = Depends(_require_owner)):
    try:
        return dispatch_engine.upsert_driver(payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/drivers/{rid}")
def delete_driver(rid: str, _owner: str = Depends(_require_owner)):
    if not dispatch_engine.delete_driver(rid):
        raise HTTPException(status_code=404, detail="driver not found")
    return {"ok": True}


@router.get("/jobs")
def jobs(_owner: str = Depends(_require_owner)):
    return {"jobs": dispatch_engine.list_jobs()}


@router.post("/jobs")
def upsert_job(payload: dict = Body(...), _owner: str = Depends(_require_owner)):
    try:
        return dispatch_engine.upsert_job(payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/jobs/{rid}")
def delete_job(rid: str, _owner: str = Depends(_require_owner)):
    if not dispatch_engine.delete_job(rid):
        raise HTTPException(status_code=404, detail="job not found")
    return {"ok": True}


@router.get("/assign/{job_id}")
async def assign(job_id: str, _owner: str = Depends(_require_owner)):
    try:
        return await dispatch_engine.assign(job_id)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
