"""
Neither endpoint in b2g_bids may invent an answer.

/opportunities returned three fabricated federal solicitations whenever the
SAM.gov key was absent, the request raised, or the response was not 200 —
including a $4,200,000 Fort Barfoot job attributed to the US Army Corps, with a
response deadline, a set-aside category, and a sam.gov link that resolves to
nothing. It shipped them as {"ok": true, "source": "Curated SAM.gov Feed"}.
Nothing in the shape of that response distinguished it from live contract data.

/geotechnical-soil was worse, because its output is a design input rather than a
sales number. It declared a USDA endpoint, never called it, ignored the
coordinates, and returned a fixed profile — CBR 8.5, plasticity index 12.0,
hydrologic group B, 98% compaction — under "data_source": "USDA-NRCS SSURGO".
Designing a subgrade against a fabricated bearing ratio under-builds the
pavement.

Soil Data Access is public and needs no key, so that endpoint is now a real
query. The network tests below are marked and skipped by default; the offline
tests carry the invariants.

CBR is deliberately absent from the response. SSURGO has no such column — the
old value was attributed to a dataset that does not carry it.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

#: Every value the curated feed used to publish.
FABRICATED = (
    "SOL-VDOT-2026-8841", "SOL-RIC-2026-1049", "SOL-USACE-2026-0042",
    "2850000", "1450000", "4200000", "88.5", "79.2", "91.0",
    "Curated SAM.gov Feed", "Fort Barfoot",
)


@pytest.fixture(autouse=True)
def no_sam_key(monkeypatch):
    monkeypatch.delenv("SAM_GOV_API_KEY", raising=False)
    from app.services import runtime_config

    monkeypatch.setattr(runtime_config, "get", lambda k, d="": d)


# ── SAM.gov ───────────────────────────────────────────────────────────────────


def test_no_key_returns_no_solicitations():
    from app.routers.b2g_bids import fetch_b2g_opportunities

    result = fetch_b2g_opportunities()
    assert result["ok"] is False
    assert result["results"] == []
    assert result["count"] == 0
    assert "SAM_GOV_API_KEY" in result["error"]


def test_the_curated_feed_is_gone():
    from app.routers.b2g_bids import fetch_b2g_opportunities

    blob = str(fetch_b2g_opportunities())
    for invented in FABRICATED:
        assert invented not in blob, f"{invented!r} is still being returned"


def test_the_fabricated_rows_are_not_in_the_source():
    source = (REPO_ROOT / "app" / "routers" / "b2g_bids.py").read_text(encoding="utf-8")
    for notice in ("SOL-VDOT-2026-8841", "SOL-RIC-2026-1049", "SOL-USACE-2026-0042"):
        # The docstring names them to explain what was removed; only a dict
        # value would put them back in a response.
        assert f'"notice_id": "{notice}"' not in source


def test_an_http_error_surfaces_instead_of_falling_back(monkeypatch):
    """
    The failure path that mattered most: a configured key plus a rejected
    request used to produce fabricated federal contracts.
    """
    from app.routers import b2g_bids
    from app.services import runtime_config

    monkeypatch.setattr(runtime_config, "get",
                        lambda k, d="": "a-key" if k == "SAM_GOV_API_KEY" else d)

    class _Resp:
        status_code = 400
        text = '{"error":"postedFrom is required"}'

    monkeypatch.setattr(b2g_bids.requests, "get", lambda *a, **k: _Resp())

    result = b2g_bids.fetch_b2g_opportunities()
    assert result["ok"] is False
    assert result["results"] == []
    assert result["status_code"] == 400
    assert "postedFrom" in result["detail"], (
        "SAM.gov explains rejected parameters in the body; swallowing it is how "
        "a misconfigured integration looked like a working one"
    )


def test_a_posted_date_window_is_always_sent(monkeypatch):
    """SAM.gov v2 rejects a search with no posted-date window."""
    from app.routers import b2g_bids
    from app.services import runtime_config

    monkeypatch.setattr(runtime_config, "get",
                        lambda k, d="": "a-key" if k == "SAM_GOV_API_KEY" else d)
    captured = {}

    class _Resp:
        status_code = 200

        @staticmethod
        def json():
            return {"opportunitiesData": []}

    def fake_get(url, params=None, timeout=None):
        captured.update(params or {})
        return _Resp()

    monkeypatch.setattr(b2g_bids.requests, "get", fake_get)
    b2g_bids.fetch_b2g_opportunities()
    assert "postedFrom" in captured and "postedTo" in captured


# ── Soil ──────────────────────────────────────────────────────────────────────


def test_bad_coordinates_are_refused():
    from app.routers.b2g_bids import fetch_soil_mechanics

    for payload in ({}, {"lat": "abc", "lon": 1}, {"lat": 999, "lon": 0}):
        result = fetch_soil_mechanics(payload)
        assert result["ok"] is False
        assert result["soil_profile"] is None


def test_the_hardcoded_profile_is_gone():
    source = (REPO_ROOT / "app" / "routers" / "b2g_bids.py").read_text(encoding="utf-8")
    assert '"california_bearing_ratio_cbr": 8.5' not in source
    assert '"plasticity_index": 12.0' not in source
    assert '"recommended_subgrade_compaction_density_pct": 98.0' not in source


def test_the_coordinates_are_actually_used():
    """
    The old version ignored lat/lon entirely and returned one fixed answer. The
    query must at minimum interpolate the point.
    """
    from app.routers.b2g_bids import _SOIL_QUERY

    q = _SOIL_QUERY.format(lon=-78.2, lat=37.05)
    assert "point(-78.2 37.05)" in q


@pytest.mark.network
def test_live_ssurgo_query_returns_measured_data():
    """
    Requires network. Proves the endpoint reads real SSURGO rather than a
    fixture, and that different coordinates give different answers — which is
    exactly what the hardcoded version could not do.
    """
    from app.routers.b2g_bids import fetch_soil_mechanics

    rural = fetch_soil_mechanics({"lat": 37.05, "lon": -78.20})
    assert rural["ok"] is True
    profile = rural["soil_profile"]
    assert profile["hydrologic_soil_group"] == "B"
    assert "Herndon" in profile["mapunit_name"]
    assert profile["horizons"], "horizon-level data is the point"

    # The coordinates the old code shipped as its default. SSURGO says "Urban
    # land" with a NULL hydrologic group; the hardcoded answer claimed
    # "Urban land-Pamunkey complex" and group "B" — invented, and wrong for its
    # own default point.
    urban = fetch_soil_mechanics({"lat": 37.54, "lon": -77.43})
    assert urban["ok"] is True
    assert urban["soil_profile"]["hydrologic_soil_group"] is None
    assert urban["soil_profile"]["mapunit_name"] != profile["mapunit_name"]


@pytest.mark.network
def test_cbr_is_reported_as_unavailable_not_invented():
    from app.routers.b2g_bids import fetch_soil_mechanics

    result = fetch_soil_mechanics({"lat": 37.05, "lon": -78.20})
    assert "california_bearing_ratio_cbr" not in result["soil_profile"]
    assert "SSURGO does not publish CBR" in result["not_provided"]["california_bearing_ratio_cbr"]
