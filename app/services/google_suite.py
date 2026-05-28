"""
google_suite.py — Unified status + light-touch clients for every Google
integration JWordenAI uses.

Sub-services:
  • GA4         (analytics) — service account
  • GSC         (search console) — service account
  • Google Ads  — developer token + OAuth refresh
  • Google Maps Platform — API key (geocoding, places, distance matrix)
  • Google Trends — via SerpAPI (no first-party key)
  • SerpAPI     — for live SERP scraping + Trends
  • PageSpeed   — public API key (web vitals)

Every probe is non-raising and returns a small dict suitable for an admin
status panel:
    {ok: bool, configured: bool, detail: str, latency_ms?: int}

All keys are read via runtime_config.get() so the Command Center can paste
them at runtime without redeploy.
"""

from __future__ import annotations

import logging
import time
from typing import Any

import httpx

from . import runtime_config as _cfg

logger = logging.getLogger(__name__)

_TIMEOUT = 8.0


# ── Helpers ───────────────────────────────────────────────────────────────────

def _ok(detail: str, **extra) -> dict:
    return {"ok": True, "configured": True, "detail": detail, **extra}


def _bad(detail: str, *, configured: bool = True, **extra) -> dict:
    return {"ok": False, "configured": configured, "detail": detail, **extra}


def _missing(*names: str) -> dict:
    return _bad(f"Missing keys: {', '.join(names)}", configured=False)


# ── GA4 ───────────────────────────────────────────────────────────────────────

def ga4_status() -> dict:
    pid = _cfg.get("GA4_PROPERTY_ID")
    sa = _cfg.get("GA4_SERVICE_ACCOUNT_JSON")
    if not pid:
        return _missing("GA4_PROPERTY_ID")
    if not sa:
        return _missing("GA4_SERVICE_ACCOUNT_JSON")
    try:
        from . import ga4_client
        creds = ga4_client._load_credentials()
        if creds is None:
            return _bad("Service account JSON failed to load")
        return _ok(f"property={pid} credentials loaded")
    except Exception as exc:  # noqa: BLE001
        return _bad(str(exc)[:200])


# ── Google Search Console ─────────────────────────────────────────────────────

def gsc_status() -> dict:
    site = _cfg.get("GSC_SITE_URL")
    sa = _cfg.get("GSC_SERVICE_ACCOUNT_JSON")
    if not site:
        return _missing("GSC_SITE_URL")
    if not sa:
        return _missing("GSC_SERVICE_ACCOUNT_JSON")
    try:
        from . import gsc_client
        creds = gsc_client._load_credentials()
        if creds is None:
            return _bad("Service account JSON failed to load")
        return _ok(f"site={site} credentials loaded")
    except Exception as exc:  # noqa: BLE001
        return _bad(str(exc)[:200])


# ── Google Ads ────────────────────────────────────────────────────────────────

def ads_status() -> dict:
    """
    Lite probe — full Ads API needs developer token + OAuth refresh + login_customer_id.
    We just check the keys are set; live API call deferred to ad_signals service.
    """
    dev = _cfg.get("GOOGLE_ADS_DEVELOPER_TOKEN")
    if not dev:
        return _missing("GOOGLE_ADS_DEVELOPER_TOKEN")
    refresh = _cfg.get("GOOGLE_ADS_REFRESH_TOKEN")
    cid = _cfg.get("GOOGLE_ADS_CUSTOMER_ID")
    missing = []
    if not refresh: missing.append("GOOGLE_ADS_REFRESH_TOKEN")
    if not cid:     missing.append("GOOGLE_ADS_CUSTOMER_ID")
    if missing:
        return _bad(f"Token present, missing: {', '.join(missing)}", configured=False)
    return _ok(f"customer={cid} dev-token + refresh present")


# ── Google Maps Platform ──────────────────────────────────────────────────────

async def maps_status() -> dict:
    key = _cfg.get("GOOGLE_MAPS_API_KEY")
    if not key:
        return _missing("GOOGLE_MAPS_API_KEY")
    # Cheap geocode probe.
    try:
        t0 = time.perf_counter()
        async with httpx.AsyncClient(timeout=_TIMEOUT) as c:
            r = await c.get(
                "https://maps.googleapis.com/maps/api/geocode/json",
                params={"address": "Richmond,VA", "key": key},
            )
        ms = int((time.perf_counter() - t0) * 1000)
        if r.status_code != 200:
            return _bad(f"HTTP {r.status_code}", latency_ms=ms)
        data = r.json()
        st = data.get("status")
        if st == "OK":
            return _ok("geocode probe OK", latency_ms=ms)
        return _bad(f"geocode status={st} ({(data.get('error_message') or '')[:120]})", latency_ms=ms)
    except Exception as exc:  # noqa: BLE001
        return _bad(str(exc)[:200])


# ── SerpAPI (Google search results + Trends) ──────────────────────────────────

async def serpapi_status() -> dict:
    key = _cfg.get("SERPAPI_KEY")
    if not key:
        return _missing("SERPAPI_KEY")
    try:
        t0 = time.perf_counter()
        async with httpx.AsyncClient(timeout=_TIMEOUT) as c:
            r = await c.get(
                "https://serpapi.com/account",
                params={"api_key": key},
            )
        ms = int((time.perf_counter() - t0) * 1000)
        if r.status_code != 200:
            return _bad(f"HTTP {r.status_code}: {r.text[:120]}", latency_ms=ms)
        data = r.json()
        plan = data.get("plan_name") or data.get("plan_id") or "unknown"
        left = data.get("plan_searches_left") or data.get("searches_left")
        return _ok(f"plan={plan} searches_left={left}", latency_ms=ms)
    except Exception as exc:  # noqa: BLE001
        return _bad(str(exc)[:200])


# ── PageSpeed Insights ────────────────────────────────────────────────────────

async def pagespeed_status() -> dict:
    key = _cfg.get("GOOGLE_PAGESPEED_API_KEY")
    if not key:
        return _missing("GOOGLE_PAGESPEED_API_KEY")
    try:
        t0 = time.perf_counter()
        async with httpx.AsyncClient(timeout=15.0) as c:
            r = await c.get(
                "https://www.googleapis.com/pagespeedonline/v5/runPagespeed",
                params={"url": "https://www.jwordenasphaltpaving.com/", "key": key, "strategy": "mobile"},
            )
        ms = int((time.perf_counter() - t0) * 1000)
        if r.status_code != 200:
            return _bad(f"HTTP {r.status_code}", latency_ms=ms)
        data = r.json()
        score = (((data.get("lighthouseResult") or {}).get("categories") or {}).get("performance") or {}).get("score")
        return _ok(f"perf score={score}", latency_ms=ms)
    except Exception as exc:  # noqa: BLE001
        return _bad(str(exc)[:200])


# ── Trends (via SerpAPI google_trends engine) ─────────────────────────────────

async def trends_status() -> dict:
    """Trends rides on SerpAPI — surface a separate row for clarity."""
    key = _cfg.get("SERPAPI_KEY")
    if not key:
        return _missing("SERPAPI_KEY")
    geo = _cfg.get("GOOGLE_TRENDS_GEO") or "US-VA"
    return _ok(f"ready (geo={geo}, engine=serpapi:google_trends)")


# ── Aggregator ────────────────────────────────────────────────────────────────

async def health_all() -> dict[str, dict]:
    """Return health for every Google sub-service."""
    import asyncio as _aio
    maps_t, serp_t, ps_t, tr_t = await _aio.gather(
        maps_status(), serpapi_status(), pagespeed_status(), trends_status(),
    )
    return {
        "ga4":       ga4_status(),
        "gsc":       gsc_status(),
        "ads":       ads_status(),
        "maps":      maps_t,
        "serpapi":   serp_t,
        "pagespeed": ps_t,
        "trends":    tr_t,
    }
