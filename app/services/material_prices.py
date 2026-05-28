"""
material_prices.py — Real-time multi-commodity price feed for JWordenAI.

Pulls live prices for the commodities that drive paving / GC project costs:

  Code         Series                              Source   Why it matters
  ─────────    ─────────────────────────────────   ──────   ────────────────────────────────
  asphalt      EIA EPD2F (road oil, weekly)        EIA      Direct binder for HMA paving
  wti_crude    EIA RWTC (WTI spot, weekly)         EIA      Leading indicator for asphalt
  diesel       EIA EPD2D (US retail diesel, wkly)  EIA      Trucking + equipment fuel pass-through
  natgas       EIA RNGWHHD (Henry Hub, weekly)     EIA      Asphalt plant + cement kiln fuel
  gravel       BLS WPU1321 (sand/gravel/crushed,   BLS      Aggregate base for paving, drives,
                            stone PPI, monthly)              parking lots, concrete, civil

Data sources :
  EIA  — https://api.eia.gov/v2/  (requires EIA_API_KEY)
  BLS  — https://api.bls.gov/publicAPI/v2/timeseries/data/  (BLS_API_KEY optional;
         unauthenticated GET is rate-limited to 25 queries/day per IP — fine
         given our 24 h cache)

Cache layer  : Redis (REDIS_URL) with 24 h TTL; falls back to in-process dict
Fallback     : Each commodity falls back independently to multiplier=1.0
               with a status_message. One commodity failure never takes the
               whole feed down.

Public API
──────────
  fetch_commodity_prices()                                        → dict
      All commodities; cached as a unit.
  fetch_asphalt_price_index()                                     → dict
      Backward-compat wrapper around the asphalt entry of the above.
  get_price_multiplier_with_materials(state_code, service_type)   → dict
      State labor multiplier × service-weighted commodity multiplier.
"""

from __future__ import annotations

import json
import logging
import os
import time
from datetime import datetime, timezone
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

_EIA_API_KEY = os.getenv("EIA_API_KEY", "")
_BLS_API_KEY = os.getenv("BLS_API_KEY", "")
_REDIS_URL = os.getenv("REDIS_URL", "")
_CACHE_KEY = "jworden:material_price_index_v3"
_CACHE_TTL = 60 * 60 * 24  # 24 hours
_HTTP_TIMEOUT_SEC = 10.0

# In-process fallback cache (when Redis unavailable)
_in_process_cache: dict = {}


# ── Commodity registry ────────────────────────────────────────────────────────
# `backend` selects the fetcher. EIA commodities carry a v2 endpoint URL +
# facet pairs; BLS commodities carry a PPI series id. Baselines are anchored
# to Q4 2024 reference levels so multipliers normalize against a recent,
# stable benchmark.

_COMMODITIES: dict[str, dict] = {
    "asphalt": {
        "backend":   "eia",
        "label":     "Asphalt / Road Oil",
        "unit":      "$/gal",
        "baseline":  2.85,
        "url":       "https://api.eia.gov/v2/petroleum/pri/wfr/data/",
        "facets":    [("facets[product][]", "EPD2F")],
    },
    "wti_crude": {
        "backend":   "eia",
        "label":     "WTI Crude Oil",
        "unit":      "$/bbl",
        "baseline":  75.00,
        "url":       "https://api.eia.gov/v2/petroleum/pri/spt/data/",
        "facets":    [("facets[series][]", "RWTC")],
    },
    "diesel": {
        "backend":   "eia",
        "label":     "On-Highway Diesel (US Avg.)",
        "unit":      "$/gal",
        "baseline":  3.80,
        "url":       "https://api.eia.gov/v2/petroleum/pri/gnd/data/",
        "facets":    [("facets[product][]", "EPD2D"), ("facets[duoarea][]", "NUS")],
    },
    "natgas": {
        "backend":   "eia",
        "label":     "Henry Hub Natural Gas",
        "unit":      "$/MMBtu",
        "baseline":  3.00,
        "url":       "https://api.eia.gov/v2/natural-gas/pri/fut/data/",
        "facets":    [("facets[series][]", "RNGWHHD")],
    },
    "gravel": {
        "backend":   "bls",
        "label":     "Construction Sand, Gravel & Crushed Stone (PPI)",
        "unit":      "PPI index",
        "baseline":  280.0,  # WPU1321 ~ Q4 2024 reference level
        "series_id": "WPU1321",
    },
}

# Service-aware commodity weighting used when composing the material
# multiplier. Each row should sum to ~1.0. Services not listed here use
# `_DEFAULT_WEIGHTS`. Gravel/aggregate is included anywhere a base course
# or aggregate-bound material is meaningful to project cost.
_SERVICE_COMMODITY_WEIGHTS: dict[str, dict[str, float]] = {
    # ── Asphalt-heavy paving (gravel base course matters) ────────────────────
    "paving":               {"asphalt": 0.55, "gravel": 0.15, "diesel": 0.20, "wti_crude": 0.10},
    "parking_lot":          {"asphalt": 0.50, "gravel": 0.15, "diesel": 0.25, "wti_crude": 0.10},
    "driveway":             {"asphalt": 0.50, "gravel": 0.15, "diesel": 0.25, "wti_crude": 0.10},
    "overlay":              {"asphalt": 0.65, "gravel": 0.05, "diesel": 0.20, "wti_crude": 0.10},
    "patching":             {"asphalt": 0.50, "gravel": 0.10, "diesel": 0.30, "wti_crude": 0.10},
    # ── Pavement preservation (no aggregate, lighter on binder) ──────────────
    "sealcoating":          {"asphalt": 0.30, "diesel": 0.50, "wti_crude": 0.20},
    "crackfill":            {"asphalt": 0.30, "diesel": 0.50, "wti_crude": 0.20},
    "maintenance":          {"asphalt": 0.30, "diesel": 0.60, "wti_crude": 0.10},
    "striping":             {"diesel": 0.70, "wti_crude": 0.30},
    # ── Concrete / civil (aggregate is the bulk of concrete & subgrade) ──────
    "concrete":             {"gravel": 0.25, "diesel": 0.40, "natgas": 0.25, "wti_crude": 0.10},
    "civil_site_work":      {"gravel": 0.30, "diesel": 0.40, "asphalt": 0.15, "wti_crude": 0.15},
    # ── Pavers / masonry (base course aggregate) ─────────────────────────────
    "cobblestone_pavers":   {"gravel": 0.25, "diesel": 0.55, "wti_crude": 0.20},
    "stone_masonry":        {"gravel": 0.10, "diesel": 0.65, "wti_crude": 0.25},
    # ── GC + adjacent (mostly fuel + heating pass-through) ───────────────────
    "general_contracting":  {"diesel": 0.55, "gravel": 0.10, "natgas": 0.20, "wti_crude": 0.15},
    "interior_design":      {"diesel": 0.50, "natgas": 0.30, "wti_crude": 0.20},
    "drone_survey":         {"diesel": 0.80, "wti_crude": 0.20},
}
_DEFAULT_WEIGHTS = {"asphalt": 0.30, "gravel": 0.15, "diesel": 0.35, "wti_crude": 0.20}


# ── Cache helpers ─────────────────────────────────────────────────────────────


def _get_redis():
    if not _REDIS_URL:
        return None
    try:
        import redis  # type: ignore  # noqa: PLC0415
        client = redis.from_url(_REDIS_URL, decode_responses=True)
        client.ping()
        return client
    except Exception:  # noqa: BLE001
        return None


def _get_cached() -> Optional[dict]:
    r = _get_redis()
    if r:
        try:
            raw = r.get(_CACHE_KEY)
            if raw:
                return json.loads(raw)
        except Exception:  # noqa: BLE001
            pass
    cached = _in_process_cache.get(_CACHE_KEY)
    if cached and (time.time() - cached["ts"]) < _CACHE_TTL:
        return cached["data"]
    return None


def _set_cached(data: dict) -> None:
    r = _get_redis()
    if r:
        try:
            r.setex(_CACHE_KEY, _CACHE_TTL, json.dumps(data, default=str))
            return
        except Exception:  # noqa: BLE001
            pass
    _in_process_cache[_CACHE_KEY] = {"data": data, "ts": time.time()}


# ── Per-commodity fetch ───────────────────────────────────────────────────────


def _commodity_fallback(code: str, reason: str) -> dict:
    spec = _COMMODITIES[code]
    return {
        "code":            code,
        "label":           spec["label"],
        "unit":            spec["unit"],
        "price":           spec["baseline"],
        "baseline":        spec["baseline"],
        "multiplier":      1.0,
        "pct_change":      0.0,
        "as_of_date":      datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "status_message":  f"Using baseline (fallback: {reason})",
        "source":          "fallback",
    }


def _normalize_commodity(code: str, price: float, as_of: str, source: str) -> dict:
    spec = _COMMODITIES[code]
    baseline = spec["baseline"]
    multiplier = price / baseline if baseline > 0 else 1.0
    pct_change = round((multiplier - 1.0) * 100, 1)
    if pct_change > 0:
        note = f"{spec['label']}: +{pct_change}% above baseline"
    elif pct_change < 0:
        note = f"{spec['label']}: {pct_change}% below baseline (favorable)"
    else:
        note = f"{spec['label']}: at baseline"
    return {
        "code":            code,
        "label":           spec["label"],
        "unit":            spec["unit"],
        "price":           round(price, 4),
        "baseline":        baseline,
        "multiplier":      round(multiplier, 4),
        "pct_change":      pct_change,
        "as_of_date":      as_of,
        "status_message":  note,
        "source":          source,
    }


def _fetch_eia(code: str, spec: dict) -> dict:
    if not _EIA_API_KEY:
        return _commodity_fallback(code, "EIA_API_KEY not configured")

    # EIA v2 takes repeated `facets[...][]=value` query params; build a list
    # of tuples so httpx serializes duplicates correctly.
    params: list[tuple[str, str]] = [
        ("api_key",            _EIA_API_KEY),
        ("frequency",          "weekly"),
        ("data[0]",            "value"),
        ("sort[0][column]",    "period"),
        ("sort[0][direction]", "desc"),
        ("length",             "4"),
        ("offset",             "0"),
    ]
    params.extend(spec["facets"])

    try:
        resp = httpx.get(spec["url"], params=params, timeout=_HTTP_TIMEOUT_SEC)
        resp.raise_for_status()
        records = resp.json().get("response", {}).get("data", [])
    except Exception as exc:  # noqa: BLE001
        logger.warning("EIA fetch failed for %s: %s", code, exc)
        return _commodity_fallback(code, str(exc))

    if not records:
        return _commodity_fallback(code, "No EIA data returned")

    latest = records[0]
    try:
        price = float(latest.get("value"))
    except (TypeError, ValueError):
        return _commodity_fallback(code, "EIA value missing or non-numeric")

    as_of = latest.get("period", datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    return _normalize_commodity(code, price, as_of, "EIA API v2")


def _fetch_bls(code: str, spec: dict) -> dict:
    """
    Pull a Producer Price Index series from the BLS public API v2.

    The free unauthenticated GET endpoint is rate-limited to 25 queries/day
    per IP — well within our 24 h cache. If BLS_API_KEY is set, we POST
    with the key for higher limits.
    """
    series_id = spec["series_id"]
    base_url = "https://api.bls.gov/publicAPI/v2/timeseries/data/"

    try:
        if _BLS_API_KEY:
            resp = httpx.post(
                base_url,
                json={
                    "seriesid":         [series_id],
                    "registrationkey":  _BLS_API_KEY,
                    "latest":           "true",
                },
                timeout=_HTTP_TIMEOUT_SEC,
            )
        else:
            resp = httpx.get(f"{base_url}{series_id}", timeout=_HTTP_TIMEOUT_SEC)
        resp.raise_for_status()
        payload = resp.json()
    except Exception as exc:  # noqa: BLE001
        logger.warning("BLS fetch failed for %s: %s", code, exc)
        return _commodity_fallback(code, str(exc))

    if payload.get("status") != "REQUEST_SUCCEEDED":
        return _commodity_fallback(code, f"BLS status: {payload.get('status', 'unknown')}")

    series_list = payload.get("Results", {}).get("series", [])
    if not series_list or not series_list[0].get("data"):
        return _commodity_fallback(code, "No BLS data returned")

    # BLS returns observations newest-first; pick the most recent valid value.
    for obs in series_list[0]["data"]:
        try:
            price = float(obs.get("value"))
        except (TypeError, ValueError):
            continue
        period = obs.get("period", "")  # e.g. "M03"
        year = obs.get("year", "")
        as_of = f"{year}-{period[1:].zfill(2)}-01" if period.startswith("M") and year else \
            datetime.now(timezone.utc).strftime("%Y-%m-%d")
        return _normalize_commodity(code, price, as_of, "BLS PPI API v2")

    return _commodity_fallback(code, "No usable BLS observations")


def _fetch_one_commodity(code: str) -> dict:
    """Dispatch to the correct backend for `code`. Always returns a dict (never raises)."""
    spec = _COMMODITIES[code]
    backend = spec.get("backend", "eia")
    if backend == "eia":
        return _fetch_eia(code, spec)
    if backend == "bls":
        return _fetch_bls(code, spec)
    return _commodity_fallback(code, f"unknown backend '{backend}'")


# ── Public: fetch all commodities (cached) ────────────────────────────────────


def fetch_commodity_prices() -> dict:
    """
    Return live multipliers for every commodity in `_COMMODITIES`.

    Shape:
        {
          "as_of_date": "2026-04-25",
          "commodities": {
             "asphalt":   {price, baseline, multiplier, pct_change, label, …},
             "wti_crude": {…},
             "diesel":    {…},
             "natgas":    {…},
             "gravel":    {…},
          }
        }

    Cached as a unit for 24 h. Each commodity has its own fallback so a
    single endpoint hiccup never zeroes out the whole feed.
    """
    cached = _get_cached()
    if cached:
        return cached

    commodities = {code: _fetch_one_commodity(code) for code in _COMMODITIES}
    result = {
        "as_of_date":  datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "commodities": commodities,
    }
    _set_cached(result)
    return result


# ── Public: backward-compat asphalt-only wrapper ──────────────────────────────


def fetch_asphalt_price_index() -> dict:
    """
    Backward-compatible asphalt-only price index.

    Returns the asphalt entry of `fetch_commodity_prices()` flattened into
    the original shape so existing callers (router, AI engine) keep working.
    """
    feed = fetch_commodity_prices()
    asph = feed["commodities"]["asphalt"]
    return {
        "price_per_gallon": asph["price"],
        "baseline_price":   asph["baseline"],
        "multiplier":       asph["multiplier"],
        "pct_change":       asph["pct_change"],
        "as_of_date":       asph["as_of_date"],
        "status_message":   asph["status_message"],
        "source":           asph["source"],
    }


# ── Public: composed pricing multiplier ───────────────────────────────────────


def _service_weights(service_type: Optional[str]) -> dict[str, float]:
    if not service_type:
        return dict(_DEFAULT_WEIGHTS)
    return dict(_SERVICE_COMMODITY_WEIGHTS.get(service_type.lower(), _DEFAULT_WEIGHTS))


def get_price_multiplier_with_materials(
    state_code: Optional[str] = None,
    service_type: Optional[str] = None,
) -> dict:
    """
    Combine state labor/market multiplier with a service-weighted commodity
    multiplier. The commodity multiplier is a weighted blend of every
    commodity that materially drives the chosen service's cost (oil,
    asphalt binder, diesel for trucking, natgas for plants, gravel for
    aggregate base, etc.).

    Returns:
      {
        state_multiplier, material_multiplier, combined_multiplier,
        # Backward-compat aliases (consumed by app/services/pricing.py):
        multiplier,        # ← alias for combined_multiplier
        note,              # ← alias for material_note
        material_note, state_note,
        as_of_date,
        commodities,       # per-commodity breakdown for transparency
        weights,           # weights used in this composition
      }
    """
    from .state_data import get_price_multiplier  # noqa: PLC0415

    state_mult = get_price_multiplier(state_code) if state_code else 1.0
    feed = fetch_commodity_prices()
    commodities = feed["commodities"]

    weights = _service_weights(service_type)
    weight_sum = sum(weights.values()) or 1.0

    # Linear weighted blend: 1.0 + Σ wᵢ · (mᵢ - 1.0) so that an across-the-board
    # 1.0 multiplier collapses to neutral, and individual commodities pull the
    # composite in proportion to their share of total project cost.
    delta = 0.0
    for code, w in weights.items():
        m = commodities.get(code, {}).get("multiplier", 1.0)
        delta += (w / weight_sum) * (m - 1.0)
    material_mult = round(1.0 + delta, 4)

    combined = round(state_mult * material_mult, 4)

    # Compose a human-readable note enumerating only the meaningful movers
    movers = [
        commodities[c].get("status_message", "")
        for c in weights
        if c in commodities and abs(commodities[c].get("pct_change", 0.0)) >= 1.0
    ]
    movers = [m for m in movers if m]  # drop empty messages
    material_note = " · ".join(movers) if movers else "All input commodities at baseline"

    return {
        "state_multiplier":    round(state_mult, 3),
        "material_multiplier": material_mult,
        "combined_multiplier": combined,
        # Backward-compat aliases for existing callers (pricing.py reads these)
        "multiplier":          combined,
        "note":                material_note,
        "material_note":       material_note,
        "state_note":          f"State code: {state_code or 'national average'}",
        "as_of_date":          feed["as_of_date"],
        "commodities":         commodities,
        "weights":             weights,
    }
