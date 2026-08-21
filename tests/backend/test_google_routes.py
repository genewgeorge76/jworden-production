"""
Tests for measured drive distance/time and its use in costing.

The property that matters: a measured figure is used when Google can supply
one, and the code falls back to the labelled estimate — never to a wrong
number or a zero — when it cannot. The costing engine already separates
`measured` from `estimated`; this proves the measured path is real and the
fallback is intact.

The live-API test runs only when GOOGLE_MAPS_API_KEY is set in the
environment, so CI (no key) exercises the mocked paths and a developer with
the key can confirm the real endpoint still answers the shape we parse.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from app.services import delivered_cost as dc  # noqa: E402
from app.services import google_routes as gr  # noqa: E402


# ── The fallback contract ────────────────────────────────────────────────────


async def test_drive_returns_none_when_unconfigured(monkeypatch):
    from app.services import runtime_config as cfg
    monkeypatch.setattr(cfg, "get", lambda name, default="": "")
    assert await gr.drive(37.5, -77.4, 37.2, -79.9) is None


async def test_geocode_returns_none_when_unconfigured(monkeypatch):
    from app.services import runtime_config as cfg
    monkeypatch.setattr(cfg, "get", lambda name, default="": "")
    assert await gr.geocode("1000 E Broad St, Richmond, VA") is None


def test_road_distance_is_measured_when_google_supplies_miles():
    d = dc.road_distance(37.54, -77.43, 37.27, -79.94, known_road_miles=188.54)
    assert d["basis"] == "measured"
    assert d["miles"] == 188.54


def test_road_distance_is_estimated_without_a_measurement():
    d = dc.road_distance(37.54, -77.43, 37.27, -79.94)
    assert d["basis"] == "estimated"
    assert d["circuity_factor"] == 1.25


# ── Measured duration in the cycle ───────────────────────────────────────────


def test_measured_minutes_are_used_instead_of_miles_over_speed():
    """
    The reason this exists. A real drive time replaces miles ÷ assumed speed,
    and the returned row says which it used.
    """
    estimated = dc.haul_cost_per_ton(
        one_way_miles=188.54, tons_per_load=22, truck_cost_per_hour=95,
        average_speed_mph=45,
    )
    measured = dc.haul_cost_per_ton(
        one_way_miles=188.54, tons_per_load=22, truck_cost_per_hour=95,
        average_speed_mph=45, known_one_way_minutes=171.9,
    )
    assert estimated["drive_time_basis"] == "estimated"
    assert measured["drive_time_basis"] == "measured"
    assert measured["one_way_minutes"] == 171.9
    # 188.54 mi at 45 mph = 251 min; the real drive is 172. Costing on the
    # assumption would overcharge the haul by roughly a third.
    assert estimated["one_way_minutes"] > measured["one_way_minutes"]
    assert estimated["cost_per_ton"] != measured["cost_per_ton"]


def test_evaluate_source_passes_measured_values_through():
    source = {"id": 1, "name": "Plant A", "lat": 37.27, "lng": -79.94}
    haul = {"tons_per_load": 22, "truck_cost_per_hour": 95}
    row = dc.evaluate_source(
        source=source, fob_price=78.0, site_lat=37.54, site_lng=-77.43,
        haul=haul, known_road_miles=188.54, known_one_way_minutes=171.9,
    )
    assert row["distance"]["basis"] == "measured"
    assert row["cycle"]["drive_time_basis"] == "measured"
    assert row["distance"]["miles"] == 188.54


def test_a_source_with_no_coordinates_is_unusable_not_crashing():
    row = dc.evaluate_source(
        source={"id": 2, "name": "No coords", "lat": None, "lng": None},
        fob_price=78.0, site_lat=37.54, site_lng=-77.43,
        haul={"tons_per_load": 22, "truck_cost_per_hour": 95},
    )
    assert row["usable"] is False


# ── Response parsing (mocked) ────────────────────────────────────────────────


class _Resp:
    def __init__(self, status, payload):
        self.status_code = status
        self._payload = payload
        self.text = str(payload)

    def json(self):
        return self._payload


async def test_drive_parses_a_routes_response(monkeypatch):
    from app.services import runtime_config as cfg
    monkeypatch.setattr(cfg, "get",
                        lambda name, default="": "test-key" if "GOOGLE" in name else default)

    import httpx

    class _Client:
        def __init__(self, *a, **k): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *a): return False
        async def post(self, *a, **k):
            return _Resp(200, {"routes": [{"distanceMeters": 303367,
                                           "duration": "10298s"}]})

    monkeypatch.setattr(httpx, "AsyncClient", _Client)
    d = await gr.drive(37.54, -77.43, 37.27, -79.94)
    assert d["basis"] == "measured"
    assert d["miles"] == round(303367 / 1609.344, 2)
    assert d["minutes"] == round(10298 / 60, 1)


async def test_drive_returns_none_on_empty_routes(monkeypatch):
    from app.services import runtime_config as cfg
    monkeypatch.setattr(cfg, "get",
                        lambda name, default="": "test-key" if "GOOGLE" in name else default)
    import httpx

    class _Client:
        def __init__(self, *a, **k): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *a): return False
        async def post(self, *a, **k):
            return _Resp(200, {"routes": []})

    monkeypatch.setattr(httpx, "AsyncClient", _Client)
    assert await gr.drive(37.54, -77.43, 37.27, -79.94) is None


async def test_drive_returns_none_on_http_error(monkeypatch):
    from app.services import runtime_config as cfg
    monkeypatch.setattr(cfg, "get",
                        lambda name, default="": "test-key" if "GOOGLE" in name else default)
    import httpx

    class _Client:
        def __init__(self, *a, **k): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *a): return False
        async def post(self, *a, **k):
            return _Resp(403, {"error": {"message": "denied"}})

    monkeypatch.setattr(httpx, "AsyncClient", _Client)
    assert await gr.drive(37.54, -77.43, 37.27, -79.94) is None


# ── Live API (skipped without a key) ─────────────────────────────────────────


@pytest.mark.skipif(not gr.configured(),
                    reason="GOOGLE_MAPS_API_KEY not set; skipping live Routes call")
async def test_live_google_routes_still_returns_the_shape_we_parse():
    d = await gr.drive(37.5407, -77.4360, 37.2710, -79.9414)
    assert d is not None, "live Routes call returned nothing"
    assert d["basis"] == "measured"
    assert 100 < d["miles"] < 300, d
    assert 90 < d["minutes"] < 300, d
