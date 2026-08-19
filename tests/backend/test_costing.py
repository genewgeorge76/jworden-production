"""
Tests for delivered material cost.

The property that matters: two sites in the same state must be able to price
differently. A state multiplier could not do that, which is the whole reason
this exists.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

RICHMOND = (37.5407, -77.4360)
CHARLOTTESVILLE = (38.0293, -78.4767)
ROANOKE = (37.2710, -79.9414)


# ── Geometry and haul arithmetic ─────────────────────────────────────────────


def test_haversine_against_a_known_distance():
    """Richmond to Roanoke is about 145 miles as the crow flies."""
    from app.services.delivered_cost import haversine_miles
    d = haversine_miles(*RICHMOND, *ROANOKE)
    assert 138 <= d <= 152, d


def test_road_distance_says_which_kind_of_number_it_is():
    from app.services.delivered_cost import road_distance

    est = road_distance(*RICHMOND, *ROANOKE, circuity_factor=1.25)
    assert est["basis"] == "estimated"
    assert est["circuity_factor"] == 1.25
    assert est["miles"] > est["straight_line_miles"]

    measured = road_distance(*RICHMOND, *ROANOKE, known_road_miles=189.0)
    assert measured["basis"] == "measured"
    assert measured["miles"] == 189.0
    assert measured["circuity_factor"] is None


def test_haul_cost_pays_for_the_whole_cycle_not_just_the_loaded_leg():
    from app.services.delivered_cost import haul_cost_per_ton
    r = haul_cost_per_ton(one_way_miles=45.0, tons_per_load=20.0,
                          truck_cost_per_hour=100.0, average_speed_mph=45.0,
                          load_minutes=15.0, dump_minutes=15.0)
    # 1h each way plus 30 min standing = 2.5h; $250 over 20 tons.
    assert r["one_way_minutes"] == pytest.approx(60.0)
    assert r["cycle_minutes"] == pytest.approx(150.0)
    assert r["cost_per_ton"] == pytest.approx(12.5)
    assert r["loads_per_8h_shift"] == pytest.approx(3.2)


def test_haul_cost_rejects_a_zero_load():
    from app.services.delivered_cost import haul_cost_per_ton
    with pytest.raises(ValueError):
        haul_cost_per_ton(one_way_miles=10, tons_per_load=0, truck_cost_per_hour=100)


def test_season_window_handles_a_winter_wrap():
    from app.services.delivered_cost import source_is_open
    assert source_is_open(3, 11, 6) is True         # inside a normal season
    assert source_is_open(3, 11, 1) is False        # closed in January
    assert source_is_open(11, 3, 1) is True         # season wrapping the year
    assert source_is_open(11, 3, 6) is False
    assert source_is_open(None, None, 1) is True    # unknown season, no opinion


# ── The point of the whole exercise ──────────────────────────────────────────


def test_identical_fob_prices_still_price_differently_by_distance():
    """
    Three plants, one price, one job. The old state multiplier gave all three
    the same 1.02 and therefore the same answer.
    """
    from app.services.delivered_cost import evaluate_source, rank_sources

    haul = {"tons_per_load": 22.0, "truck_cost_per_hour": 95.0,
            "average_speed_mph": 45.0, "load_minutes": 15.0,
            "dump_minutes": 15.0, "circuity_factor": 1.25}
    plants = [
        {"id": 1, "name": "Richmond", "lat": RICHMOND[0], "lng": RICHMOND[1]},
        {"id": 2, "name": "Charlottesville", "lat": CHARLOTTESVILLE[0], "lng": CHARLOTTESVILLE[1]},
        {"id": 3, "name": "Roanoke", "lat": ROANOKE[0], "lng": ROANOKE[1]},
    ]
    rows = [evaluate_source(source=p, fob_price=78.00, site_lat=RICHMOND[0],
                            site_lng=RICHMOND[1], haul=haul) for p in plants]
    ranked = rank_sources(rows)

    assert ranked[0]["source_name"] == "Richmond"
    assert ranked[-1]["source_name"] == "Roanoke"
    spread = ranked[-1]["delivered_cost_per_ton"] - ranked[0]["delivered_cost_per_ton"]
    assert spread > 25, f"expected a large spread from haul alone, got {spread}"


def test_a_source_too_far_for_the_mix_is_excluded_with_a_reason():
    from app.services.delivered_cost import evaluate_source
    haul = {"tons_per_load": 22.0, "truck_cost_per_hour": 95.0, "circuity_factor": 1.25}
    far = {"id": 9, "name": "Roanoke", "lat": ROANOKE[0], "lng": ROANOKE[1],
           "max_haul_minutes": 90}
    r = evaluate_source(source=far, fob_price=78.0, site_lat=RICHMOND[0],
                        site_lng=RICHMOND[1], haul=haul)
    assert r["usable"] is False
    assert any("too cold" in reason for reason in r["reasons"])


def test_an_unpriced_source_is_reported_not_guessed():
    from app.services.delivered_cost import evaluate_source, rank_sources
    haul = {"tons_per_load": 22.0, "truck_cost_per_hour": 95.0, "circuity_factor": 1.25}
    s = {"id": 1, "name": "Unpriced", "lat": RICHMOND[0], "lng": RICHMOND[1]}
    r = evaluate_source(source=s, fob_price=None, site_lat=RICHMOND[0],
                        site_lng=RICHMOND[1], haul=haul)
    assert r["delivered_cost_per_ton"] is None
    assert r["usable"] is False
    assert rank_sources([r]) == []


def test_market_lookup_returns_none_outside_every_market():
    from app.services.delivered_cost import market_for_site
    markets = [{"name": "Richmond, VA", "lat": RICHMOND[0], "lng": RICHMOND[1],
                "radius_miles": 35.0}]
    assert market_for_site(markets, *RICHMOND)["name"] == "Richmond, VA"
    assert market_for_site(markets, *ROANOKE) is None


# ── Endpoints ────────────────────────────────────────────────────────────────


async def _seed(client, auth_headers):
    await client.post("/api/v1/costing/haul-profiles", headers=auth_headers, json={
        "name": "tri-axle", "tons_per_load": 22.0, "truck_cost_per_hour": 95.0,
        "is_default": True})
    ids = {}
    for name, (lat, lng) in [("Richmond plant", RICHMOND),
                             ("Charlottesville plant", CHARLOTTESVILLE),
                             ("Roanoke plant", ROANOKE)]:
        r = await client.post("/api/v1/costing/sources", headers=auth_headers, json={
            "name": name, "source_type": "hma_plant", "state": "VA", "lat": lat, "lng": lng})
        ids[name] = r.json()["source"]["id"]
        await client.post("/api/v1/costing/prices", headers=auth_headers, json={
            "source_id": ids[name], "material_code": "hma_sm_9_5a", "fob_price": 78.0,
            "source_note": "plant quote 2026-08"})
    return ids


async def test_status_reports_what_is_missing_before_anything_is_added(client, auth_headers):
    r = await client.get("/api/v1/costing/status", headers=auth_headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["can_price_delivered"] is False
    assert len(body["blocking"]) == 3


async def test_delivered_refuses_without_a_haul_profile(client, auth_headers):
    await client.post("/api/v1/costing/sources", headers=auth_headers, json={
        "name": "A plant", "state": "VA", "lat": RICHMOND[0], "lng": RICHMOND[1]})
    r = await client.post("/api/v1/costing/delivered", headers=auth_headers, json={
        "material_code": "hma_sm_9_5a", "lat": RICHMOND[0], "lng": RICHMOND[1]})
    assert r.status_code == 409
    assert "haul profile" in r.json()["detail"]


async def test_two_virginia_sites_price_differently(client, auth_headers):
    """The failure the state multiplier could not express."""
    await _seed(client, auth_headers)

    rva = await client.post("/api/v1/costing/delivered", headers=auth_headers, json={
        "material_code": "hma_sm_9_5a", "lat": RICHMOND[0], "lng": RICHMOND[1], "tons": 1000})
    rke = await client.post("/api/v1/costing/delivered", headers=auth_headers, json={
        "material_code": "hma_sm_9_5a", "lat": ROANOKE[0], "lng": ROANOKE[1], "tons": 1000})

    assert rva.status_code == rke.status_code == 200, rva.text
    a, b = rva.json(), rke.json()
    assert a["best_source"]["source_name"] == "Richmond plant"
    assert b["best_source"]["source_name"] == "Roanoke plant"
    # Both pick a plant on their doorstep, so both land near FOB…
    assert a["delivered_cost_per_ton"] == pytest.approx(b["delivered_cost_per_ton"], abs=1.0)
    # …but the wrong choice is expensive, and the response says by how much.
    assert a["spread_across_sources_per_ton"] > 25
    assert a["job_total_usd"] == pytest.approx(a["delivered_cost_per_ton"] * 1000, abs=0.01)


async def test_unusable_sources_are_still_listed_with_reasons(client, auth_headers):
    await _seed(client, auth_headers)
    r = await client.post("/api/v1/costing/delivered", headers=auth_headers, json={
        "material_code": "hma_sm_9_5a", "lat": RICHMOND[0], "lng": RICHMOND[1]})
    body = r.json()
    assert body["sources_evaluated"] == 3
    assert len(body["all_sources"]) == 3


async def test_a_material_nobody_stocks_prices_nothing(client, auth_headers):
    await _seed(client, auth_headers)
    r = await client.post("/api/v1/costing/delivered", headers=auth_headers, json={
        "material_code": "unobtainium", "lat": RICHMOND[0], "lng": RICHMOND[1]})
    body = r.json()
    assert body["delivered_cost_per_ton"] is None
    assert body["sources_usable"] == 0
    assert all("no price on file" in " ".join(s["reasons"]) for s in body["all_sources"])


async def test_price_requires_a_source_note(client, auth_headers):
    await client.post("/api/v1/costing/sources", headers=auth_headers, json={
        "name": "P", "state": "VA", "lat": RICHMOND[0], "lng": RICHMOND[1]})
    r = await client.post("/api/v1/costing/prices", headers=auth_headers, json={
        "source_id": 1, "material_code": "hma_sm_9_5a", "fob_price": 78.0})
    assert r.status_code == 422


async def test_prices_are_history_so_an_old_bid_still_explains_itself(client, auth_headers):
    ids = await _seed(client, auth_headers)
    sid = ids["Richmond plant"]
    # A spring quote and an August increase, both on the record.
    await client.post("/api/v1/costing/prices", headers=auth_headers, json={
        "source_id": sid, "material_code": "hma_sm_9_5a", "fob_price": 78.0,
        "effective_date": "2026-02-01T00:00:00Z", "source_note": "spring quote"})
    await client.post("/api/v1/costing/prices", headers=auth_headers, json={
        "source_id": sid, "material_code": "hma_sm_9_5a", "fob_price": 91.0,
        "effective_date": "2026-08-15T00:00:00Z", "source_note": "August increase"})

    march = await client.post("/api/v1/costing/delivered", headers=auth_headers, json={
        "material_code": "hma_sm_9_5a", "lat": RICHMOND[0], "lng": RICHMOND[1],
        "job_date": "2026-03-01T00:00:00Z"})
    today = await client.post("/api/v1/costing/delivered", headers=auth_headers, json={
        "material_code": "hma_sm_9_5a", "lat": RICHMOND[0], "lng": RICHMOND[1],
        "job_date": "2026-08-19T00:00:00Z"})

    assert march.json()["best_source"]["fob_price_per_ton"] == 78.0
    assert today.json()["best_source"]["fob_price_per_ton"] == 91.0
    assert today.json()["best_source"]["price_source_note"] == "August increase"


async def test_site_outside_every_labor_market_is_told_so(client, auth_headers):
    await _seed(client, auth_headers)
    await client.post("/api/v1/costing/labor-markets", headers=auth_headers, json={
        "name": "Richmond, VA", "state": "VA", "lat": RICHMOND[0], "lng": RICHMOND[1],
        "radius_miles": 35.0, "crew_cost_per_hour": 68.0})

    inside = await client.post("/api/v1/costing/delivered", headers=auth_headers, json={
        "material_code": "hma_sm_9_5a", "lat": RICHMOND[0], "lng": RICHMOND[1]})
    outside = await client.post("/api/v1/costing/delivered", headers=auth_headers, json={
        "material_code": "hma_sm_9_5a", "lat": ROANOKE[0], "lng": ROANOKE[1]})

    assert inside.json()["labor_market"]["name"] == "Richmond, VA"
    assert outside.json()["labor_market"] is None
    assert "per diem" in outside.json()["labor_market_note"]


async def test_costing_requires_auth(client):
    r = await client.get("/api/v1/costing/status")
    assert r.status_code == 403


async def test_a_price_is_never_carried_backwards(client, auth_headers):
    """
    A job dated before the earliest quote has no price — the later quote is
    not applied retroactively. This is what a bid dispute turns on.
    """
    await _seed(client, auth_headers)   # seeds at today's date
    r = await client.post("/api/v1/costing/delivered", headers=auth_headers, json={
        "material_code": "hma_sm_9_5a", "lat": RICHMOND[0], "lng": RICHMOND[1],
        "job_date": "2020-01-01T00:00:00Z"})
    body = r.json()
    assert body["best_source"] is None
    assert body["delivered_cost_per_ton"] is None
    assert all("no price on file" in " ".join(s["reasons"]) for s in body["all_sources"])
