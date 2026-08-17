"""
geocoding.py — address -> (latitude, longitude).

This module was referenced but never committed. Four modules import it:

    app/routers/leads.py:18          (module level)
    app/services/email_sync.py:13    (module level)
    app/services/voice_intake.py     (function level)
    app/routers/visualizer.py        (function level)

The two module-level imports meant `app.routers.leads` raised ModuleNotFoundError
at import time — and because app/main.py mounts both the leads router and the
email router unguarded, the whole application failed to import. Same failure
mode owner_auth.py documents in its own docstring: the backend landed in one
commit that referenced files which were never created.

That made every endpoint under /api/v1/leads unreachable, which is the path the
public lead-capture forms post to.

CONTRACT — every caller does exactly this:

    coords = geocode_address(addr_str)
    if coords:
        lat, lng = coords

So this function is synchronous, returns a (lat, lng) float tuple on success and
None on every failure. It never raises. A lead must still be saved when geocoding
fails — losing a customer's enquiry because an address could not be resolved
would be far worse than storing it without coordinates.

Without GOOGLE_MAPS_API_KEY set it returns None rather than falling back to a
different provider or inventing coordinates. Callers already handle None, and a
plausible-but-wrong lat/lng would silently misroute dispatch.
"""
from __future__ import annotations

import logging
from typing import Optional, Tuple

import httpx

from . import runtime_config

logger = logging.getLogger(__name__)

_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"
_TIMEOUT_SECONDS = 8.0

# Bounded so a long-running mailbox sync doesn't re-request the same yard twice.
_CACHE_LIMIT = 512
_cache: dict[str, Optional[Tuple[float, float]]] = {}


def geocode_address(address: str) -> Optional[Tuple[float, float]]:
    """
    Resolve a street address to (latitude, longitude).

    Returns None when the address is empty, no API key is configured, the
    request fails, or Google returns no usable result. Never raises.
    """
    if not address or not str(address).strip():
        return None

    key_cache = str(address).strip().lower()
    if key_cache in _cache:
        return _cache[key_cache]

    api_key = (runtime_config.get("GOOGLE_MAPS_API_KEY") or "").strip()
    if not api_key:
        # Not an error worth alarming on — the platform is designed to run
        # without Maps configured; coordinates are simply unavailable.
        logger.debug("geocode_address: GOOGLE_MAPS_API_KEY not configured")
        return None

    result: Optional[Tuple[float, float]] = None
    try:
        with httpx.Client(timeout=_TIMEOUT_SECONDS) as client:
            response = client.get(
                _GEOCODE_URL,
                params={"address": str(address).strip(), "key": api_key},
            )
        payload = response.json()

        status = payload.get("status")
        if status == "OK":
            location = payload["results"][0]["geometry"]["location"]
            result = (float(location["lat"]), float(location["lng"]))
        elif status == "ZERO_RESULTS":
            logger.info("geocode_address: no match for %r", address)
        else:
            # OVER_QUERY_LIMIT / REQUEST_DENIED / INVALID_REQUEST are worth
            # seeing in logs — they mean billing or key configuration is wrong.
            logger.warning(
                "geocode_address: Google returned %s for %r (%s)",
                status, address, payload.get("error_message", "no detail"),
            )
    except Exception as exc:
        logger.warning("geocode_address failed for %r: %s", address, exc)
        result = None

    if len(_cache) >= _CACHE_LIMIT:
        _cache.clear()
    _cache[key_cache] = result
    return result
