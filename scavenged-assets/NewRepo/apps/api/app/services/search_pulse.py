"""
search_pulse.py — Live SERP heat map via SerpAPI.

Fans out across 3 search terms × 8 VA hotspot centroids = 24 parallel calls.
Heat score formula: min(1.0, ads*0.18 + organic*0.035)
5-minute in-process cache. Returns demo/stub data when SERPAPI_KEY absent.

Public API: await snapshot(force=False) -> dict
"""
from __future__ import annotations

import asyncio
import logging
import time
from typing import Any

from . import runtime_config as _cfg

logger = logging.getLogger(__name__)

_TERMS = [
    "asphalt paving contractor",
    "paving company near me",
    "driveway paving",
]

VA_HOTSPOTS: list[dict[str, Any]] = [
    {"id": "richmond",      "name": "Richmond",       "lat": 37.541,  "lng": -77.434},
    {"id": "chesterfield",  "name": "Chesterfield",   "lat": 37.378,  "lng": -77.496},
    {"id": "henrico",       "name": "Henrico",         "lat": 37.576,  "lng": -77.376},
    {"id": "colonial-hts",  "name": "Colonial Hts",   "lat": 37.252,  "lng": -77.417},
    {"id": "norfolk",       "name": "Norfolk",         "lat": 36.886,  "lng": -76.260},
    {"id": "va-beach",      "name": "Virginia Beach",  "lat": 36.853,  "lng": -75.978},
    {"id": "fredericksburg","name": "Fredericksburg",  "lat": 38.303,  "lng": -77.461},
    {"id": "charlottesvl",  "name": "Charlottesville", "lat": 38.029,  "lng": -78.477},
]

_CACHE_TTL = 300  # 5 minutes
_cache: dict[str, Any] = {}


def _cached() -> dict | None:
    entry = _cache.get("snapshot")
    if entry and time.time() - entry["ts"] < _CACHE_TTL:
        return entry["data"]
    return None


def _store(data: dict) -> None:
    _cache["snapshot"] = {"ts": time.time(), "data": data}


async def _serp_call(api_key: str, term: str, hotspot: dict) -> dict:
    """Single SerpAPI call. Returns empty dict on any error."""
    try:
        import httpx
        params = {
            "q": f"{term} {hotspot['name']} VA",
            "location": f"{hotspot['name']}, Virginia, United States",
            "hl": "en",
            "gl": "us",
            "api_key": api_key,
            "engine": "google",
            "num": "10",
            "no_cache": "false",
        }
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get("https://serpapi.com/search", params=params)
            resp.raise_for_status()
            return resp.json()
    except Exception as exc:
        logger.debug("SerpAPI error %s / %s: %s", term, hotspot["id"], exc)
        return {}


def _heat(data: dict) -> float:
    ads = len(data.get("ads", []))
    organic = len(data.get("organic_results", []))
    return min(1.0, ads * 0.18 + organic * 0.035)


async def _hotspot_heat(api_key: str, hotspot: dict) -> dict:
    results = await asyncio.gather(
        *[_serp_call(api_key, term, hotspot) for term in _TERMS],
        return_exceptions=True,
    )
    term_data = []
    total = 0.0
    for i, res in enumerate(results):
        h = _heat(res) if isinstance(res, dict) else 0.0
        term_data.append({"term": _TERMS[i], "heat": round(h, 3)})
        total += h
    return {**hotspot, "heat": round(total / len(_TERMS), 3), "terms": term_data}


async def snapshot(force: bool = False) -> dict:
    """
    Returns a SERP heat-map snapshot for all VA hotspots.
    Cached for 5 minutes. Returns demo stub when SERPAPI_KEY absent.
    """
    if not force:
        cached = _cached()
        if cached:
            return {**cached, "cached": True}

    api_key = _cfg.get("SERPAPI_KEY")
    if not api_key:
        return {
            "ok": False,
            "reason": "SERPAPI_KEY not set — add it in runtime config for live data",
            "hotspots": VA_HOTSPOTS,
            "terms": _TERMS,
            "ts": time.time(),
            "ttl_secs": 0,
            "cached": False,
        }

    try:
        hotspots = list(
            await asyncio.gather(*[_hotspot_heat(api_key, hs) for hs in VA_HOTSPOTS])
        )
        result: dict = {
            "ok": True,
            "ts": time.time(),
            "ttl_secs": _CACHE_TTL,
            "terms": _TERMS,
            "hotspots": hotspots,
            "cached": False,
        }
        _store(result)
        return result
    except Exception as exc:
        logger.error("search_pulse.snapshot failed: %s", exc)
        return {
            "ok": False,
            "reason": str(exc),
            "hotspots": VA_HOTSPOTS,
            "terms": _TERMS,
            "ts": time.time(),
            "ttl_secs": 0,
            "cached": False,
        }
