"""Weather router — Open-Meteo integration (free, no API key required).

Provides: current conditions, 7-day forecast, paving go/no-go analysis,
and lay-down window start recommendations for a given lat/lng.

No demo-mode toggle needed — Open-Meteo is free without keys.
Falls back to cached/mock data on network failure.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from ..core.security import verify_premium_security

router = APIRouter(prefix='/weather', tags=['weather'])

# Richmond, VA default coordinates
_DEFAULT_LAT = 37.5407
_DEFAULT_LNG = -77.4360

# Paving thresholds
_MIN_PAVING_TEMP_F = 50
_RAIN_ABORT_PCT = 30          # precip probability % above which paving is no-go

_OM_BASE = 'https://api.open-meteo.com/v1'


def _c_to_f(c: float) -> float:
    return round(c * 9 / 5 + 32, 1)


def _paving_nogo_reason(temp_f: float, precip_pct: float, wind_mph: float) -> Optional[str]:
    if temp_f < _MIN_PAVING_TEMP_F:
        return f'Temperature {temp_f}°F below {_MIN_PAVING_TEMP_F}°F paving floor'
    if precip_pct >= _RAIN_ABORT_PCT:
        return f'Precipitation probability {precip_pct:.0f}% — rain risk'
    if wind_mph > 25:
        return f'Wind speed {wind_mph:.0f} mph — excessive for mat lay-down'
    return None


async def _fetch_forecast(lat: float, lng: float) -> dict:
    params = {
        'latitude': lat,
        'longitude': lng,
        'current': ['temperature_2m', 'precipitation_probability', 'wind_speed_10m', 'weather_code'],
        'daily': ['temperature_2m_max', 'temperature_2m_min', 'precipitation_probability_max', 'wind_speed_10m_max', 'weather_code'],
        'temperature_unit': 'celsius',
        'wind_speed_unit': 'mph',
        'timezone': 'America/New_York',
        'forecast_days': 7,
    }
    async with httpx.AsyncClient(timeout=8) as client:
        r = await client.get(f'{_OM_BASE}/forecast', params=params)
        r.raise_for_status()
        return r.json()


def _mock_forecast(lat: float, lng: float) -> dict:
    """Fallback when network is unavailable."""
    return {
        'current': {
            'temperature_2m': 19.4,       # ~67°F
            'precipitation_probability': 8,
            'wind_speed_10m': 7.2,
            'weather_code': 1,
        },
        'daily': {
            'time': ['2026-06-22','2026-06-23','2026-06-24','2026-06-25','2026-06-26','2026-06-27','2026-06-28'],
            'temperature_2m_max': [26,27,24,22,28,29,27],
            'temperature_2m_min': [17,18,15,14,19,20,18],
            'precipitation_probability_max': [8,12,45,35,5,3,10],
            'wind_speed_10m_max': [9,11,15,12,8,7,10],
            'weather_code': [1,2,61,61,1,0,2],
        },
        '_mock': True,
    }


_WMO_LABELS = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Icy fog',
    51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
    61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
    80: 'Slight showers', 81: 'Moderate showers', 82: 'Violent showers',
    95: 'Thunderstorm',
}


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get('/current', dependencies=[Depends(verify_premium_security)])
async def current_weather(
    lat: float = Query(_DEFAULT_LAT),
    lng: float = Query(_DEFAULT_LNG),
):
    try:
        data = await _fetch_forecast(lat, lng)
    except Exception:
        data = _mock_forecast(lat, lng)

    cur = data['current']
    temp_f = _c_to_f(cur['temperature_2m'])
    precip_pct = cur['precipitation_probability']
    wind = cur['wind_speed_10m']
    wmo = cur.get('weather_code', 1)

    nogo = _paving_nogo_reason(temp_f, precip_pct, wind)
    return {
        'lat': lat,
        'lng': lng,
        'temp_f': temp_f,
        'temp_c': cur['temperature_2m'],
        'precip_probability_pct': precip_pct,
        'wind_mph': wind,
        'condition': _WMO_LABELS.get(wmo, 'Unknown'),
        'weather_code': wmo,
        'paving_status': 'NO-GO' if nogo else 'GO',
        'nogo_reason': nogo,
        'mock': data.get('_mock', False),
    }


@router.get('/forecast', dependencies=[Depends(verify_premium_security)])
async def forecast(
    lat: float = Query(_DEFAULT_LAT),
    lng: float = Query(_DEFAULT_LNG),
    days: int = Query(7, ge=1, le=7),
):
    try:
        data = await _fetch_forecast(lat, lng)
    except Exception:
        data = _mock_forecast(lat, lng)

    daily = data['daily']
    result = []
    for i in range(min(days, len(daily['time']))):
        max_f = _c_to_f(daily['temperature_2m_max'][i])
        min_f = _c_to_f(daily['temperature_2m_min'][i])
        precip = daily['precipitation_probability_max'][i]
        wind = daily['wind_speed_10m_max'][i]
        wmo = daily['weather_code'][i]
        nogo = _paving_nogo_reason(max_f, precip, wind)
        result.append({
            'date': daily['time'][i],
            'temp_max_f': max_f,
            'temp_min_f': min_f,
            'precip_probability_pct': precip,
            'wind_max_mph': wind,
            'condition': _WMO_LABELS.get(wmo, 'Unknown'),
            'weather_code': wmo,
            'paving_status': 'NO-GO' if nogo else 'GO',
            'nogo_reason': nogo,
        })

    go_days = [d for d in result if d['paving_status'] == 'GO']
    return {
        'lat': lat, 'lng': lng,
        'forecast': result,
        'paving_windows': go_days,
        'next_go_day': go_days[0]['date'] if go_days else None,
        'mock': data.get('_mock', False),
    }


@router.get('/paving-window', dependencies=[Depends(verify_premium_security)])
async def paving_window(
    lat: float = Query(_DEFAULT_LAT),
    lng: float = Query(_DEFAULT_LNG),
    project_hours: float = Query(8.0, description='Estimated job hours'),
):
    """Find the next available paving window + earliest completion time."""
    try:
        data = await _fetch_forecast(lat, lng)
    except Exception:
        data = _mock_forecast(lat, lng)

    daily = data['daily']
    windows = []
    for i in range(len(daily['time'])):
        max_f = _c_to_f(daily['temperature_2m_max'][i])
        precip = daily['precipitation_probability_max'][i]
        wind = daily['wind_speed_10m_max'][i]
        nogo = _paving_nogo_reason(max_f, precip, wind)
        if not nogo:
            windows.append({
                'date': daily['time'][i],
                'temp_max_f': max_f,
                'precip_pct': precip,
                'wind_mph': wind,
                'confidence': 'HIGH' if precip < 10 and wind < 15 else 'MEDIUM',
            })

    return {
        'project_hours': project_hours,
        'available_windows': windows,
        'recommended_start': windows[0]['date'] if windows else None,
        'recommendation': (
            f"Schedule for {windows[0]['date']} — {windows[0]['confidence']} confidence GO day."
            if windows else 'No GO days in forecast window. Monitor daily.'
        ),
        'mock': data.get('_mock', False),
    }
