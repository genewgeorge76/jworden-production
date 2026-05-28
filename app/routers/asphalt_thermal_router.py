"""
asphalt_thermal_router.py — Foreman-facing lay-down window endpoint (Ship E).

Public read (no secrets, no PII), but rate-limited via owner-controlled
deployment. Forecast data comes from NOAA — also public.

GET /api/v1/thermal/window?lat=37.5407&lng=-77.4360
        &mix_temp_f=290&lift_in=2&target_breakdown_f=240&target_finish_f=175
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Query

from ..services import asphalt_thermal

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/thermal",
    tags=["thermal"],
)


@router.get("/window")
async def lay_down_window(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    mix_temp_f: float = Query(290.0, ge=150, le=400),
    lift_in: float = Query(2.0, ge=0.5, le=8.0),
    target_breakdown_f: float = Query(240.0, ge=150, le=350),
    target_finish_f: float = Query(175.0, ge=120, le=300),
):
    if target_finish_f >= target_breakdown_f:
        raise HTTPException(status_code=400, detail="target_finish_f must be < target_breakdown_f")
    return await asphalt_thermal.lay_down_window(
        lat, lng,
        mix_temp_f=mix_temp_f,
        lift_in=lift_in,
        target_breakdown_f=target_breakdown_f,
        target_finish_f=target_finish_f,
    )
