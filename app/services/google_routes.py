"""
google_routes.py — measured drive distance and time from Google, or nothing.

The costing engine already distinguishes a `measured` road distance from an
`estimated` one (great-circle × circuity). This is the thing that produces a
measured one: Google's Routes API returns the actual driving distance and,
better still, the actual driving duration — so a haul cycle can be costed on
how long the truck is really gone rather than miles ÷ an assumed speed.

Reads GOOGLE_MAPS_API_KEY from the managed key store. If it is not set, every
function here returns None and the caller falls back to the estimate. That is
the whole contract: measured when we can, honestly-labelled estimate when we
cannot, never a measured-looking number that was actually guessed.

Endpoints (checked against Google's docs 2026-08-21):
  Routes     POST routes.googleapis.com/directions/v2:computeRoutes
  Geocoding  GET  maps.googleapis.com/maps/api/geocode/json

Routes bills per element and the field mask keeps the response — and the
charge — to distance and duration only.
"""
from __future__ import annotations

import logging
from typing import Any, Optional

from app.services import runtime_config as _cfg

logger = logging.getLogger(__name__)

ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes"
GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"

METERS_PER_MILE = 1609.344


def _key() -> str:
    # GOOGLE_MAPS_API_KEY is the managed key supplier discovery already uses;
    # the same key answers Routes and Geocoding, so there is one thing to set.
    return (_cfg.get("GOOGLE_MAPS_API_KEY") or "").strip()


def configured() -> bool:
    return bool(_key())


async def drive(
    origin_lat: float, origin_lng: float,
    dest_lat: float, dest_lng: float,
    *, timeout: float = 12.0,
) -> Optional[dict[str, Any]]:
    """
    Measured driving distance and time between two points, or None.

    None means "no measured figure available" — the key is unset, or Google
    could not route it — and the caller must fall back to the estimate rather
    than treat a missing value as zero.
    """
    key = _key()
    if not key:
        return None

    import httpx

    body = {
        "origin": {"location": {"latLng": {
            "latitude": origin_lat, "longitude": origin_lng}}},
        "destination": {"location": {"latLng": {
            "latitude": dest_lat, "longitude": dest_lng}}},
        "travelMode": "DRIVE",
        # Loaded aggregate trucks do not get to use the model's optimistic
        # traffic; TRAFFIC_UNAWARE gives a stable free-flow duration that does
        # not swing with the time of day the estimate happens to be run.
        "routingPreference": "TRAFFIC_UNAWARE",
    }
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
    }

    try:
        async with httpx.AsyncClient(timeout=timeout) as c:
            resp = await c.post(ROUTES_URL, headers=headers, json=body)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Routes API request failed: %s", exc)
        return None

    if resp.status_code >= 400:
        logger.warning("Routes API HTTP %s: %s", resp.status_code, resp.text[:200])
        return None

    routes = (resp.json() or {}).get("routes") or []
    if not routes:
        return None

    top = routes[0]
    meters = top.get("distanceMeters")
    duration = top.get("duration")  # e.g. "10298s"
    if meters is None or not duration:
        return None

    try:
        seconds = float(str(duration).rstrip("s"))
    except ValueError:
        return None

    return {
        "miles": round(meters / METERS_PER_MILE, 2),
        "minutes": round(seconds / 60.0, 1),
        "basis": "measured",
        "provider": "google_routes",
    }


async def geocode(address: str, *, timeout: float = 12.0) -> Optional[dict[str, Any]]:
    """
    An address to coordinates, or None.

    None keeps the same contract as everywhere else here: a job site that will
    not geocode is a job with no location, which the caller must handle, not a
    silent (0, 0) that would put the site off the coast of Africa.
    """
    key = _key()
    if not key or not address or not address.strip():
        return None

    import httpx

    try:
        async with httpx.AsyncClient(timeout=timeout) as c:
            resp = await c.get(GEOCODE_URL, params={"address": address, "key": key})
    except Exception as exc:  # noqa: BLE001
        logger.warning("Geocoding request failed: %s", exc)
        return None

    if resp.status_code >= 400:
        return None

    data = resp.json() or {}
    if data.get("status") != "OK" or not data.get("results"):
        return None

    top = data["results"][0]
    loc = top.get("geometry", {}).get("location", {})
    if "lat" not in loc or "lng" not in loc:
        return None

    return {
        "lat": loc["lat"],
        "lng": loc["lng"],
        "formatted_address": top.get("formatted_address", ""),
        "provider": "google_geocode",
    }
