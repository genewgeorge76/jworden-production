"""
search_pulse.py — Live Google search intelligence for Virginia.

Polls SerpAPI for tracked terms, snapshots SERP rank + estimated volume per
VA county centroid, and aggregates into a heatmap-ready feed.

All keys via runtime_config.
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any

import httpx

from . import runtime_config as _cfg

logger = logging.getLogger(__name__)

# Sample of populous VA counties/cities (lat,lng) for heatmap centroids.
VA_HOTSPOTS: list[dict] = [
    {"id": "richmond",       "name": "Richmond",       "lat": 37.5407, "lng": -77.4360},
    {"id": "henrico",        "name": "Henrico",        "lat": 37.5907, "lng": -77.4063},
    {"id": "chesterfield",   "name": "Chesterfield",   "lat": 37.3771, "lng": -77.5050},
    {"id": "hanover",        "name": "Hanover",        "lat": 37.7596, "lng": -77.4416},
    {"id": "midlothian",     "name": "Midlothian",     "lat": 37.5012, "lng": -77.6486},
    {"id": "shortpump",      "name": "Short Pump",     "lat": 37.6510, "lng": -77.6122},
    {"id": "mechanicsville", "name": "Mechanicsville", "lat": 37.6087, "lng": -77.3735},
    {"id": "glenallen",      "name": "Glen Allen",     "lat": 37.6657, "lng": -77.5083},
    {"id": "powhatan",       "name": "Powhatan",       "lat": 37.5468, "lng": -77.9156},
    {"id": "goochland",      "name": "Goochland",      "lat": 37.6818, "lng": -77.8855},
    {"id": "nkent",          "name": "New Kent",       "lat": 37.5210, "lng": -77.0094},
    {"id": "petersburg",     "name": "Petersburg",     "lat": 37.2279, "lng": -77.4019},
    {"id": "fredericksburg", "name": "Fredericksburg", "lat": 38.3032, "lng": -77.4605},
    {"id": "charlottesville","name": "Charlottesville","lat": 38.0293, "lng": -78.4767},
    {"id": "norfolk",        "name": "Norfolk",        "lat": 36.8508, "lng": -76.2859},
    {"id": "vabeach",        "name": "Virginia Beach", "lat": 36.8529, "lng": -75.9780},
]

_CACHE: dict[str, Any] = {"ts": 0, "snapshot": None}
_CACHE_TTL_SECS = 300  # 5 minutes


def _terms() -> list[str]:
    raw = _cfg.get("SEARCH_PULSE_TERMS")
    if not raw:
        return [
            "asphalt paving richmond va",
            "driveway sealcoating richmond",
            "parking lot paving virginia",
        ]
    return [t.strip() for t in raw.split(",") if t.strip()]


async def _serp_volume(client: httpx.AsyncClient, key: str, term: str, location: str) -> dict:
    """One SerpAPI call → estimated competitiveness + first organic title."""
    try:
        r = await client.get(
            "https://serpapi.com/search.json",
            params={
                "engine": "google",
                "q": term,
                "location": f"{location},Virginia,United States",
                "hl": "en", "gl": "us",
                "api_key": key,
                "num": 10,
            },
        )
        if r.status_code != 200:
            return {"ok": False, "detail": f"HTTP {r.status_code}"}
        d = r.json()
        results = d.get("organic_results") or []
        ads = len(d.get("ads") or [])
        # Heat = ad density + result count (paid competition is the strongest demand signal).
        heat = min(1.0, (ads * 0.18) + (min(len(results), 10) * 0.035))
        top = results[0] if results else {}
        return {
            "ok": True, "heat": round(heat, 3),
            "ads": ads, "organic": len(results),
            "top_title": top.get("title"),
            "top_link":  top.get("link"),
        }
    except Exception as exc:  # noqa: BLE001
        return {"ok": False, "detail": str(exc)[:160]}


async def snapshot(force: bool = False) -> dict:
    now = time.time()
    if not force and _CACHE["snapshot"] and (now - _CACHE["ts"]) < _CACHE_TTL_SECS:
        return _CACHE["snapshot"]

    key = _cfg.get("SERPAPI_KEY")
    terms = _terms()
    if not key:
        return {"ok": False, "reason": "SERPAPI_KEY not set",
                "hotspots": VA_HOTSPOTS, "terms": terms}

    # Cap fan-out: top 3 terms × 8 hotspots = 24 calls per refresh.
    terms = terms[:3]
    spots = VA_HOTSPOTS[:8]
    cells: list[dict] = []
    async with httpx.AsyncClient(timeout=12.0) as c:
        results = await asyncio.gather(*[
            _serp_volume(c, key, t, s["name"]) for s in spots for t in terms
        ])
    i = 0
    for s in spots:
        spot_heat = 0.0
        spot_terms = []
        for t in terms:
            r = results[i]; i += 1
            if r.get("ok"):
                spot_heat = max(spot_heat, r["heat"])
                spot_terms.append({"term": t, **r})
            else:
                spot_terms.append({"term": t, **r})
        cells.append({**s, "heat": round(spot_heat, 3), "terms": spot_terms})

    snap = {
        "ok": True, "ts": now, "ttl_secs": _CACHE_TTL_SECS,
        "terms": terms, "hotspots": cells,
    }
    _CACHE.update(ts=now, snapshot=snap)
    return snap
