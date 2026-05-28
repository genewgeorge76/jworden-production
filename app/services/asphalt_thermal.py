"""
asphalt_thermal.py — Lay-down window calculator (Ship E).

Combines a free NOAA hourly forecast with a simplified lift-cooling model
(MultiCool / Chadbourn surrogate) to tell the foreman when an asphalt mat
will reach the 175°F minimum for compaction — and how many minutes the
crew has to roll before it's too late.

Free NOAA endpoint: https://api.weather.gov/points/{lat},{lng}
                   → forecastHourly + forecastGridData (no key needed).

Inputs:
    lat, lng, mix_temp_f (default 290), lift_in (default 2.0),
    base_temp_f (defaults to forecast hourly air temp),
    wind_mph (defaults to forecast),
    target_breakdown_f (default 240), target_finish_f (default 175)

Output: hourly window estimates + recommended start times.
"""

from __future__ import annotations

import logging
import math
import os
from typing import Any, Optional

import httpx

logger = logging.getLogger(__name__)

NOAA_USER_AGENT = os.getenv("NOAA_USER_AGENT", "jwordenai/1.0 (paving@jwordenasphaltpaving.com)")
NOAA_TIMEOUT = 12.0


# ── Forecast ──────────────────────────────────────────────────────────────────

async def fetch_hourly_forecast(lat: float, lng: float) -> list[dict]:
    """Returns up to 48 hourly periods: [{startTime, temperature_f, wind_mph, sky}]."""
    headers = {"User-Agent": NOAA_USER_AGENT, "Accept": "application/geo+json"}
    async with httpx.AsyncClient(timeout=NOAA_TIMEOUT, headers=headers) as c:
        meta = await c.get(f"https://api.weather.gov/points/{lat:.4f},{lng:.4f}")
        meta.raise_for_status()
        forecast_url = meta.json()["properties"]["forecastHourly"]
        f = await c.get(forecast_url)
        f.raise_for_status()
    periods = f.json().get("properties", {}).get("periods", [])
    out = []
    for p in periods[:48]:
        wind_str = p.get("windSpeed", "0 mph")
        try:
            wind_mph = float(str(wind_str).split(" ")[0])
        except Exception:
            wind_mph = 0.0
        out.append({
            "startTime": p.get("startTime"),
            "temperature_f": p.get("temperature"),
            "wind_mph": wind_mph,
            "sky": p.get("shortForecast"),
            "isDaytime": p.get("isDaytime", True),
        })
    return out


# ── Cooling model ─────────────────────────────────────────────────────────────
# Simplified surrogate of the Chadbourn / MultiCool nomograph:
#   k = 0.018 + 0.005 * wind_mph   (1/min, surface-loss coefficient)
#   t_minutes_to(T_target) = ln((T_mix - T_air)/(T_target - T_air)) / (k / lift_factor)
#   lift_factor = max(0.6, lift_in / 2.0)   thicker = slower cooling
# All temperatures in Fahrenheit. Returns None if T_air >= T_target.

def cooling_minutes(
    mix_temp_f: float,
    air_temp_f: float,
    target_temp_f: float,
    wind_mph: float,
    lift_in: float,
) -> Optional[float]:
    if air_temp_f >= target_temp_f:
        return None
    if mix_temp_f <= target_temp_f:
        return 0.0
    k = 0.018 + 0.005 * max(0.0, wind_mph)
    lift_factor = max(0.6, float(lift_in) / 2.0)
    rate = k / lift_factor
    try:
        ratio = (mix_temp_f - air_temp_f) / (target_temp_f - air_temp_f)
        if ratio <= 0:
            return None
        return math.log(ratio) / rate
    except (ValueError, ZeroDivisionError):
        return None


def evaluate_hour(
    period: dict,
    *,
    mix_temp_f: float,
    lift_in: float,
    target_breakdown_f: float,
    target_finish_f: float,
) -> dict:
    air = float(period.get("temperature_f") or 70)
    wind = float(period.get("wind_mph") or 0)
    t_breakdown = cooling_minutes(mix_temp_f, air, target_breakdown_f, wind, lift_in)
    t_finish = cooling_minutes(mix_temp_f, air, target_finish_f, wind, lift_in)
    # Status:
    #  - good: at least 25 min finish window
    #  - tight: 10–25 min finish window
    #  - poor: <10 min or impossible
    if t_finish is None or t_finish < 10:
        status = "poor"
    elif t_finish < 25:
        status = "tight"
    else:
        status = "good"
    return {
        "startTime": period.get("startTime"),
        "air_temp_f": air,
        "wind_mph": wind,
        "sky": period.get("sky"),
        "minutes_to_breakdown": round(t_breakdown, 1) if t_breakdown is not None else None,
        "minutes_to_finish": round(t_finish, 1) if t_finish is not None else None,
        "status": status,
    }


async def lay_down_window(
    lat: float,
    lng: float,
    *,
    mix_temp_f: float = 290.0,
    lift_in: float = 2.0,
    target_breakdown_f: float = 240.0,
    target_finish_f: float = 175.0,
) -> dict:
    """Full report: 48h forecast + per-hour cooling assessment + best window."""
    try:
        periods = await fetch_hourly_forecast(lat, lng)
    except Exception as exc:
        logger.warning("noaa fetch failed: %s", exc)
        return {
            "ok": False,
            "error": f"noaa fetch failed: {exc}",
            "lat": lat, "lng": lng,
        }
    hourly = [
        evaluate_hour(
            p,
            mix_temp_f=mix_temp_f,
            lift_in=lift_in,
            target_breakdown_f=target_breakdown_f,
            target_finish_f=target_finish_f,
        )
        for p in periods
    ]
    # find the next "good" daytime window of at least 3 consecutive hours
    best = None
    for i in range(len(hourly) - 2):
        if all(h["status"] == "good" for h in hourly[i:i + 3]):
            best = {
                "start": hourly[i]["startTime"],
                "end": hourly[i + 2]["startTime"],
                "avg_air_f": round(sum(h["air_temp_f"] for h in hourly[i:i + 3]) / 3, 1),
                "avg_wind_mph": round(sum(h["wind_mph"] for h in hourly[i:i + 3]) / 3, 1),
            }
            break
    return {
        "ok": True,
        "lat": lat, "lng": lng,
        "params": {
            "mix_temp_f": mix_temp_f,
            "lift_in": lift_in,
            "target_breakdown_f": target_breakdown_f,
            "target_finish_f": target_finish_f,
        },
        "best_window": best,
        "hourly": hourly,
    }
