"""
Tests for the end-to-end estimate chain.

The property that matters: quantities always resolve, and everything
downstream either sources its number or says it could not. A total appears
only when nothing is missing from it.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

RICHMOND = (37.5407, -77.4360)
ROANOKE = (37.2710, -79.9414)


# ── Quantities are geometry ──────────────────────────────────────────────────


def test_tonnage_is_volume_times_density():
    from app.services.job_chain import tonnage, HMA_DENSITY_PCF
    # 85,000 sf at 2in = 14,166.67 cf x 145 pcf x 0.96 / 2000
    t = tonnage(85_000, 2.0, HMA_DENSITY_PCF, 96.0)
    assert t == pytest.approx(986.0, abs=0.5)


def test_compaction_is_floored_at_the_worden_minimum():
    """A quantity computed below 96% would order short against a 96% spec."""
    from app.services.job_chain import build_quantities
    low = build_quantities(10_000, 2.0, 6.0, compaction_pct=80.0)
    at_floor = build_quantities(10_000, 2.0, 6.0, compaction_pct=96.0)
    assert low["compaction_pct"] == 96.0
    assert low["lines"][0]["tons"] == at_floor["lines"][0]["tons"]


def test_quantities_resolve_with_nothing_configured():
    from app.services.job_chain import build_quantities, price_lines
    q = build_quantities(85_000, 2.0, 6.0)
    costed = price_lines(q, {"surface": None, "base": None})
    assert costed["lines"][0]["tons"] == pytest.approx(986.0, abs=0.5)
    assert costed["lines"][0]["cost_usd"] is None
    assert costed["materials_total_usd"] is None


def test_no_total_while_any_line_is_unpriced():
    """A subtotal over a partial set reads as the job's cost and is not."""
    from app.services.job_chain import build_quantities, price_lines
    q = build_quantities(10_000, 2.0, 6.0)
    partial = price_lines(q, {
        "surface": {"delivered_cost_per_ton": 80.0, "best_source": {"source_name": "P"}},
        "base": None,
    })
    assert partial["materials_total_usd"] is None
    assert partial["materials_subtotal_priced_usd"] > 0
    assert partial["unpriced_lines"] == ["base"]


def test_oil_exposure_is_not_folded_into_the_total():
    from app.services.job_chain import oil_price_exposure
    e = oil_price_exposure(54.23)
    assert e["exposure_usd"] == pytest.approx(488.07, abs=0.02)
    assert "Not included" in e["note"]


def test_labor_absence_distinguishes_no_market_from_no_hours():
    from app.services.job_chain import labor_estimate
    assert "travelling" in labor_estimate(None, 40.0)["reason"]
    market = {"name": "Richmond, VA", "crew_cost_per_hour": 68.0}
    assert "no crew hours" in labor_estimate(market, None)["reason"]
    assert labor_estimate(market, 40.0)["cost_usd"] == pytest.approx(2720.0)


# ── The endpoint ─────────────────────────────────────────────────────────────


async def test_chain_returns_quantities_before_anything_is_configured(client, auth_headers):
    r = await client.post("/api/v1/estimate/job", headers=auth_headers, json={
        "area_sqft": 85000, "surface_thickness_in": 2.0, "base_thickness_in": 6.0,
        "lat": RICHMOND[0], "lng": RICHMOND[1]})
    assert r.status_code == 200, r.text
    body = r.json()

    assert body["quantities"]["lines"][0]["tons"] == pytest.approx(986.0, abs=0.5)
    assert body["job_total_usd"] is None
    assert "still correct and usable as a takeoff" in body["job_total_note"]

    stages = {s["stage"]: s for s in body["stages"]}
    assert stages["quantities"]["ok"] is True
    assert stages["materials"]["ok"] is False
    assert "haul profile" in stages["materials"]["note"]
    assert stages["labor"]["ok"] is False


async def _configure(client, auth_headers):
    await client.post("/api/v1/costing/haul-profiles", headers=auth_headers, json={
        "name": "tri-axle", "tons_per_load": 22.0, "truck_cost_per_hour": 95.0,
        "is_default": True})
    for name, (lat, lng) in [("Richmond plant", RICHMOND), ("Roanoke plant", ROANOKE)]:
        r = await client.post("/api/v1/costing/sources", headers=auth_headers, json={
            "name": name, "state": "VA", "lat": lat, "lng": lng})
        sid = r.json()["source"]["id"]
        for code, price in [("hma_sm_9_5a", 78.0), ("agg_21a", 24.0)]:
            await client.post("/api/v1/costing/prices", headers=auth_headers, json={
                "source_id": sid, "material_code": code, "fob_price": price,
                "source_note": "plant quote"})
    await client.post("/api/v1/costing/labor-markets", headers=auth_headers, json={
        "name": "Richmond, VA", "state": "VA", "lat": RICHMOND[0], "lng": RICHMOND[1],
        "radius_miles": 35.0, "crew_cost_per_hour": 68.0})


async def test_a_fully_configured_job_prices_end_to_end(client, auth_headers):
    await _configure(client, auth_headers)
    r = await client.post("/api/v1/estimate/job", headers=auth_headers, json={
        "area_sqft": 85000, "surface_thickness_in": 2.0, "base_thickness_in": 6.0,
        "lat": RICHMOND[0], "lng": RICHMOND[1], "crew_hours": 96})
    assert r.status_code == 200, r.text
    body = r.json()

    surface = body["materials"]["lines"][0]
    assert surface["priced"] is True
    assert surface["source_name"] == "Richmond plant"
    # Every dollar traces back to a plant, a quote and a haul.
    assert surface["fob_price_per_ton"] == 78.0
    assert surface["haul_cost_per_ton"] > 0
    assert surface["haul_basis"] == "estimated"
    assert surface["price_source_note"] == "plant quote"

    assert body["materials"]["materials_total_usd"] is not None
    assert body["labor"]["cost_usd"] == pytest.approx(68.0 * 96)
    assert body["job_total_usd"] == pytest.approx(
        body["materials"]["materials_total_usd"] + body["labor"]["cost_usd"], abs=0.01)


async def test_the_same_job_costs_more_far_from_a_plant(client, auth_headers):
    """
    A site between the two plants pays for the haul. This is the whole point of
    the chain — the old path returned one number for all of Virginia.
    """
    await _configure(client, auth_headers)
    body = {"area_sqft": 85000, "surface_thickness_in": 2.0, "base_thickness_in": 6.0,
            "crew_hours": 96}

    near = await client.post("/api/v1/estimate/job", headers=auth_headers,
                             json={**body, "lat": RICHMOND[0], "lng": RICHMOND[1]})
    # Lynchburg-ish: roughly midway, far from both plants.
    far = await client.post("/api/v1/estimate/job", headers=auth_headers,
                            json={**body, "lat": 37.4138, "lng": -79.1422})

    n, f = near.json(), far.json()
    assert f["materials"]["materials_total_usd"] > n["materials"]["materials_total_usd"]
    # And the far site is outside the Richmond market, so labor is absent with a reason.
    assert f["labor"]["available"] is False
    assert "travelling" in f["labor"]["reason"]
    assert f["job_total_usd"] is None


async def test_lifecycle_rides_along_when_tiers_are_supplied(client, auth_headers):
    await _configure(client, auth_headers)
    r = await client.post("/api/v1/estimate/job", headers=auth_headers, json={
        "area_sqft": 100000, "lat": RICHMOND[0], "lng": RICHMOND[1],
        "current_pci": 62,
        "tiers": [{"id": "B", "name": "2in mill and overlay", "unit_cost_per_sqft": 2.40,
                   "extension_years_low": 8, "extension_years_high": 12, "restored_pci": 98}]})
    lc = r.json()["lifecycle"]
    assert lc["current_rating"] == "Fair"
    assert lc["tiers"][0]["total_cost_usd"] == 240_000.0
    assert lc["tiers"][0]["annualized_cost_per_sqft_per_year"]["high"] == 0.3
    assert lc["projection_unmaintained"][0]["pci"] == 62.0


async def test_chain_needs_a_location(client, auth_headers):
    r = await client.post("/api/v1/estimate/job", headers=auth_headers,
                          json={"area_sqft": 1000})
    assert r.status_code == 422


async def test_chain_requires_auth(client):
    r = await client.post("/api/v1/estimate/job", json={"area_sqft": 1000, "lat": 0, "lng": 0})
    assert r.status_code == 403


# ── The two fabrication sites this replaced ──────────────────────────────────


def test_takeoff_returns_quantities_but_no_invented_price():
    from app.jarvis_os.abilities.SalesAndEstimation.takeoff import calculate_takeoff
    r = calculate_takeoff(area_sqft=85000, asphalt_thickness_inches=2.0)
    assert r["asphalt"]["tonnage"] == pytest.approx(986.0, abs=0.5)
    assert r["asphalt"]["cost_usd"] is None
    assert r["total_materials_cost_usd"] is None
    assert r["priced"] is False

    priced = calculate_takeoff(area_sqft=85000, asphalt_thickness_inches=2.0,
                               cost_per_ton_asphalt=80.54, cost_per_ton_stone=31.0)
    assert priced["priced"] is True
    assert priced["total_materials_cost_usd"] > 0


def test_takeoff_no_longer_defaults_to_75_and_28_a_ton():
    """Those constants made this the second, disagreeing pricing path."""
    import inspect
    from app.jarvis_os.abilities.SalesAndEstimation import takeoff
    sig = inspect.signature(takeoff.calculate_takeoff)
    assert sig.parameters["cost_per_ton_asphalt"].default is None
    assert sig.parameters["cost_per_ton_stone"].default is None


def test_b2g_bidder_refuses_without_a_measured_area():
    """
    It used to shadow calculate_takeoff with a stub returning 50,000 sq ft and
    3,500 tons for any input, then send that to a city council.
    """
    from app.jarvis_os.abilities.GovernmentAndB2G.autonomous_b2g_bidder import (
        AutonomousB2GBidder,
    )
    out = AutonomousB2GBidder().submit_unsolicited_proposal("Richmond City", {})
    assert out["status"] == "no_data"
    assert "required, not defaulted" in out["reason"]


def test_b2g_bidder_no_longer_defines_local_pricing_stubs():
    import ast
    from pathlib import Path
    tree = ast.parse(
        Path("app/jarvis_os/abilities/GovernmentAndB2G/autonomous_b2g_bidder.py").read_text()
    )
    module_fns = {n.name for n in tree.body if isinstance(n, ast.FunctionDef)}
    assert "estimate_price" not in module_fns
    assert "calculate_takeoff" not in module_fns
