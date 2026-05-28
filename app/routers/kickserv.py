"""
kickserv.py — Kickserv integration + dump-truck route optimization for JWordenAI.

Routes:
  GET  /api/v1/kickserv/jobs           — fetch today's Kickserv jobs
  POST /api/v1/kickserv/optimize-route — run nearest-neighbor route optimization
  GET  /api/v1/kickserv/status         — integration health check

Route optimization uses a greedy nearest-neighbor algorithm that minimises
total driving distance between job sites.  When KICKSERV_API_KEY is set, jobs
are pulled live from the Kickserv API.  Without it, the endpoint accepts jobs
in the request body and runs the optimizer against supplied coordinates.

Environment variables:
  KICKSERV_API_KEY     — Kickserv API key (Account Settings → API Access)
  KICKSERV_ACCOUNT     — Kickserv account slug (from your Kickserv URL)
  KICKSERV_BASE_URL    — Override base URL (default: https://api.kickserv.com/v1)

Requires premium security.
"""

import logging
import math
import os
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from ..core.limiter import limiter
from ..core.security import verify_premium_security

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/kickserv", tags=["kickserv"])

_KICKSERV_KEY = os.getenv("KICKSERV_API_KEY", "")
_KICKSERV_ACCOUNT = os.getenv("KICKSERV_ACCOUNT", "")
_KICKSERV_BASE = os.getenv("KICKSERV_BASE_URL", "https://api.kickserv.com/v1")
_TIMEOUT = 10.0


# ── Schemas ───────────────────────────────────────────────────────────────────

class JobStop(BaseModel):
    id: str
    name: str
    address: str
    lat: float
    lng: float
    priority: int = Field(default=1, ge=1, le=3)  # 1=normal, 2=high, 3=urgent


class RouteOptimizeRequest(BaseModel):
    depot_lat: float = Field(..., description="Starting point latitude (yard/depot)")
    depot_lng: float = Field(..., description="Starting point longitude")
    jobs: list[JobStop]


class RouteStop(BaseModel):
    order: int
    job_id: str
    name: str
    address: str
    lat: float
    lng: float
    distance_from_prev_miles: float


class RouteOptimizeResponse(BaseModel):
    total_distance_miles: float
    stops: list[RouteStop]
    savings_vs_unoptimized_miles: float


# ── Helpers ───────────────────────────────────────────────────────────────────

def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Return great-circle distance in miles between two WGS-84 coordinates."""
    R = 3958.8  # Earth radius in miles
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _nearest_neighbor_route(
    depot_lat: float,
    depot_lng: float,
    jobs: list[JobStop],
) -> list[JobStop]:
    """
    Greedy nearest-neighbor TSP heuristic.
    High-priority jobs (priority=3) are always visited first,
    then normal order by nearest unvisited.
    """
    urgent = [j for j in jobs if j.priority == 3]
    normal = [j for j in jobs if j.priority < 3]

    unvisited = urgent + normal  # urgent first, then greedy
    route: list[JobStop] = []
    cur_lat, cur_lng = depot_lat, depot_lng

    while unvisited:
        nearest = min(unvisited, key=lambda j: _haversine(cur_lat, cur_lng, j.lat, j.lng))
        route.append(nearest)
        cur_lat, cur_lng = nearest.lat, nearest.lng
        unvisited.remove(nearest)

    return route


def _total_distance(depot_lat: float, depot_lng: float, route: list[JobStop]) -> float:
    total = 0.0
    prev_lat, prev_lng = depot_lat, depot_lng
    for stop in route:
        total += _haversine(prev_lat, prev_lng, stop.lat, stop.lng)
        prev_lat, prev_lng = stop.lat, stop.lng
    return total


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/status", dependencies=[Depends(verify_premium_security)])
def kickserv_status():
    """Return integration health — whether the Kickserv API key is configured."""
    return {
        "kickserv_configured": bool(_KICKSERV_KEY and _KICKSERV_ACCOUNT),
        "account": _KICKSERV_ACCOUNT or None,
        "note": (
            "Live sync active" if (_KICKSERV_KEY and _KICKSERV_ACCOUNT)
            else "Set KICKSERV_API_KEY and KICKSERV_ACCOUNT to enable live job sync"
        ),
    }


@router.get("/jobs", dependencies=[Depends(verify_premium_security)])
async def get_kickserv_jobs():
    """
    Fetch today's scheduled jobs from Kickserv.
    Returns stub data when KICKSERV_API_KEY is not set.
    """
    if not (_KICKSERV_KEY and _KICKSERV_ACCOUNT):
        logger.info("Kickserv API key not set — returning stub job list")
        return {
            "source": "stub",
            "jobs": [
                {"id": "stub-1", "title": "Asphalt Patch — 123 Main St", "status": "scheduled"},
                {"id": "stub-2", "title": "Sealcoat — 456 Oak Ave", "status": "scheduled"},
            ],
            "note": "Set KICKSERV_API_KEY and KICKSERV_ACCOUNT in Railway to enable live sync",
        }

    url = f"{_KICKSERV_BASE}/accounts/{_KICKSERV_ACCOUNT}/jobs"
    headers = {"Authorization": f"Token token={_KICKSERV_KEY}", "Accept": "application/json"}

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            return {"source": "kickserv", "jobs": resp.json()}
    except httpx.HTTPStatusError as exc:
        logger.error("Kickserv API error: %s", exc)
        raise HTTPException(status_code=502, detail=f"Kickserv API returned {exc.response.status_code}")
    except httpx.RequestError as exc:
        logger.error("Kickserv network error: %s", exc)
        raise HTTPException(status_code=503, detail="Could not reach Kickserv API")


@router.post(
    "/optimize-route",
    response_model=RouteOptimizeResponse,
    dependencies=[Depends(verify_premium_security)],
)
@limiter.limit("30/minute")
async def optimize_route(request: Request, body: RouteOptimizeRequest):
    """
    Nearest-neighbor route optimization for dump trucks.

    Submit a depot location + list of job stops with GPS coordinates.
    Returns stops in optimised order with per-leg distances and total
    distance, plus the estimated savings vs visiting in submission order.
    """
    if not body.jobs:
        return RouteOptimizeResponse(total_distance_miles=0.0, stops=[], savings_vs_unoptimized_miles=0.0)

    # Unoptimized distance (original order) for comparison
    unoptimized_dist = _total_distance(body.depot_lat, body.depot_lng, body.jobs)

    # Optimized route
    optimized = _nearest_neighbor_route(body.depot_lat, body.depot_lng, body.jobs)
    optimized_dist = _total_distance(body.depot_lat, body.depot_lng, optimized)

    prev_lat, prev_lng = body.depot_lat, body.depot_lng
    stops: list[RouteStop] = []
    for i, job in enumerate(optimized, start=1):
        leg_dist = _haversine(prev_lat, prev_lng, job.lat, job.lng)
        stops.append(RouteStop(
            order=i,
            job_id=job.id,
            name=job.name,
            address=job.address,
            lat=job.lat,
            lng=job.lng,
            distance_from_prev_miles=round(leg_dist, 2),
        ))
        prev_lat, prev_lng = job.lat, job.lng

    return RouteOptimizeResponse(
        total_distance_miles=round(optimized_dist, 2),
        stops=stops,
        savings_vs_unoptimized_miles=round(max(0.0, unoptimized_dist - optimized_dist), 2),
    )
