"""
Tests for PCI rating and the lifecycle projection.

The properties worth pinning are the ones the previous implementation got
wrong: the same pavement scores the same twice, an uncorrected PCI says it is
uncorrected, nothing is projected from an assumed condition, and no price is
baked into the software.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))


# ── D6433 arithmetic ─────────────────────────────────────────────────────────


def test_rating_bands_match_the_standard():
    from app.services.pavement_lifespan import rating_for_pci
    assert rating_for_pci(100) == "Good"
    assert rating_for_pci(85) == "Good"
    assert rating_for_pci(84.9) == "Satisfactory"
    assert rating_for_pci(70) == "Satisfactory"
    assert rating_for_pci(69.9) == "Fair"
    assert rating_for_pci(55) == "Fair"
    assert rating_for_pci(40) == "Poor"
    assert rating_for_pci(25) == "Very Poor"
    assert rating_for_pci(10) == "Serious"
    assert rating_for_pci(9.9) == "Failed"
    assert rating_for_pci(None) is None


def test_allowable_deduct_count_formula():
    """m = 1 + (9/98)(100 - HDV), capped at 10."""
    from app.services.pavement_lifespan import allowable_deduct_count
    assert allowable_deduct_count(100) == pytest.approx(1.0)
    assert allowable_deduct_count(40) == pytest.approx(1 + (9 / 98) * 60)
    # A tiny HDV would give m > 10; the cap holds.
    assert allowable_deduct_count(0) == 10.0


def test_deducts_beyond_m_are_reduced_not_summed_whole():
    from app.services.pavement_lifespan import reduce_deduct_values
    reduced = reduce_deduct_values([45, 30, 20, 15, 10, 8, 5])
    # m for HDV 45 is 1 + (9/98)*55 = 6.05 → six whole, the seventh scaled by .05
    assert reduced[:6] == [45.0, 30.0, 20.0, 15.0, 10.0, 8.0]
    assert reduced[6] == pytest.approx(5 * ((1 + (9 / 98) * 55) % 1), abs=1e-6)
    assert len(reduced) == 7


def test_no_distress_is_pci_100():
    from app.services.pavement_lifespan import pci_from_deduct_values
    r = pci_from_deduct_values([])
    assert r.pci == 100.0 and r.rating == "Good" and r.corrected is True


# ── The endpoint ─────────────────────────────────────────────────────────────


async def test_pci_without_a_cdv_declares_itself_uncorrected(client, auth_headers):
    r = await client.post("/api/v1/lifespan/pci", headers=auth_headers,
                          json={"deduct_values": [45, 30, 20]})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["corrected"] is False
    assert "not quotable" in body["note"]
    assert body["standard"] == "ASTM D6433"


async def test_pci_with_a_cdv_is_a_d6433_result(client, auth_headers):
    r = await client.post("/api/v1/lifespan/pci", headers=auth_headers,
                          json={"deduct_values": [45, 30, 20], "corrected_deduct_value": 52.0})
    body = r.json()
    assert body["corrected"] is True
    assert body["pci"] == 48.0
    assert body["rating"] == "Poor"


async def test_the_same_survey_scores_the_same_twice(client, auth_headers):
    """
    The engine this replaces used random.uniform for its deducts, so one
    pavement produced a different PCI on every call.
    """
    payload = {"deduct_values": [45, 30, 20], "corrected_deduct_value": 52.0}
    a = await client.post("/api/v1/lifespan/pci", headers=auth_headers, json=payload)
    b = await client.post("/api/v1/lifespan/pci", headers=auth_headers, json=payload)
    assert a.json() == b.json()


# ── Lifecycle ────────────────────────────────────────────────────────────────


async def test_no_current_pci_means_no_projection(client, auth_headers):
    r = await client.post("/api/v1/lifespan/lifecycle", headers=auth_headers,
                          json={"area_sqft": 85000})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["projection_unmaintained"] is None
    assert "assumed starting condition" in body["projection_note"]


async def test_no_tiers_means_nothing_costed(client, auth_headers):
    r = await client.post("/api/v1/lifespan/lifecycle", headers=auth_headers,
                          json={"area_sqft": 85000, "current_pci": 62})
    body = r.json()
    assert body["tiers"] == []
    assert "No tiers supplied" in body["tiers_note"]


async def test_projection_is_monotonic_and_clamps_at_terminal(client, auth_headers):
    r = await client.post("/api/v1/lifespan/lifecycle", headers=auth_headers,
                          json={"area_sqft": 1000, "current_pci": 88, "horizon_years": 25})
    curve = r.json()["projection_unmaintained"]
    assert curve[0]["pci"] == 88.0
    values = [p["pci"] for p in curve]
    assert all(b <= a for a, b in zip(values, values[1:])), "PCI must not improve untreated"
    # Past the service life it holds at terminal rather than running to zero.
    assert values[-1] == r.json()["model"]["terminal_pci"]


async def test_model_parameters_are_returned_and_flagged_uncalibrated(client, auth_headers):
    r = await client.post("/api/v1/lifespan/lifecycle", headers=auth_headers,
                          json={"area_sqft": 1000, "current_pci": 80})
    model = r.json()["model"]
    assert model["calibrated"] is False
    assert model["formula"].startswith("PCI(t)")
    for key in ("beta", "terminal_pci", "service_life_years"):
        assert model[key] is not None


async def test_tier_costs_come_from_the_supplied_unit_price(client, auth_headers):
    r = await client.post(
        "/api/v1/lifespan/lifecycle",
        headers=auth_headers,
        json={
            "area_sqft": 100_000,
            "current_pci": 62,
            "tiers": [
                {"id": "A", "name": "Preventative slurry", "unit_cost_per_sqft": 0.30,
                 "extension_years_low": 3, "extension_years_high": 4, "restored_pci": 88},
                {"id": "B", "name": "2in mill and overlay", "unit_cost_per_sqft": 2.40,
                 "extension_years_low": 8, "extension_years_high": 12, "restored_pci": 98},
            ],
        },
    )
    assert r.status_code == 200, r.text
    tiers = {t["id"]: t for t in r.json()["tiers"]}

    a = tiers["A"]
    assert a["total_cost_usd"] == 30_000.0                 # 0.30 x 100,000
    assert a["annualized_cost_per_sqft_per_year"]["high"] == 0.1        # 0.30 / 3
    assert a["annualized_cost_per_sqft_per_year"]["low"] == 0.075       # 0.30 / 4
    assert a["restored_rating"] == "Good"

    b = tiers["B"]
    assert b["total_cost_usd"] == 240_000.0
    assert b["annualized_cost_per_sqft_per_year"]["high"] == 0.3        # 2.40 / 8
    assert b["annualized_total_per_year"]["high"] == 30_000.0

    # Ranked on the conservative end so an optimistic upper bound cannot win it.
    assert r.json()["ranked_by_annualized_cost"] == ["A", "B"]


async def test_tier_year_range_must_be_ordered(client, auth_headers):
    r = await client.post(
        "/api/v1/lifespan/lifecycle",
        headers=auth_headers,
        json={"area_sqft": 1000, "tiers": [
            {"id": "X", "name": "backwards", "unit_cost_per_sqft": 1.0,
             "extension_years_low": 10, "extension_years_high": 3}]},
    )
    assert r.status_code == 422


async def test_lifespan_routes_require_auth(client):
    r = await client.post("/api/v1/lifespan/pci", json={"deduct_values": []})
    assert r.status_code == 403


# ── The jarvis ability ───────────────────────────────────────────────────────


def test_ability_refuses_to_score_without_a_survey():
    from app.jarvis_os.abilities.VisionAndIntelligence.pci_degradation_matrix import (
        PciDegradationMatrixEngine,
    )
    out = PciDegradationMatrixEngine().execute({})
    assert out["status"] == "no_data"
    assert out["metrics"]["pci_score"] is None


def test_ability_is_deterministic_and_shares_the_service_math():
    from app.jarvis_os.abilities.VisionAndIntelligence.pci_degradation_matrix import (
        PciDegradationMatrixEngine,
    )
    from app.services.pavement_lifespan import pci_from_deduct_values

    engine = PciDegradationMatrixEngine()
    params = {"deduct_values": [45, 30, 20], "corrected_deduct_value": 52.0}
    first = engine.execute(params)["metrics"]["pci_score"]
    second = engine.execute(params)["metrics"]["pci_score"]
    assert first == second
    # An ability and an API call must not disagree about the same pavement.
    assert first == pci_from_deduct_values([45, 30, 20], 52.0).pci


def test_ability_does_not_generate_its_own_numbers():
    """
    The old implementation drew its distress deducts from random.uniform, so a
    PCI changed between two calls on one pavement. Checked against the parsed
    module rather than the source text — the docstring names `random` when
    explaining what was removed, and a substring search would trip on that.
    """
    import ast
    from pathlib import Path

    tree = ast.parse(
        Path("app/jarvis_os/abilities/VisionAndIntelligence/pci_degradation_matrix.py").read_text()
    )
    imported = {
        alias.name.split(".")[0]
        for node in ast.walk(tree)
        if isinstance(node, ast.Import)
        for alias in node.names
    } | {
        node.module.split(".")[0]
        for node in ast.walk(tree)
        if isinstance(node, ast.ImportFrom) and node.module
    }
    assert "random" not in imported
    assert "secrets" not in imported

    called = {
        node.func.value.id
        for node in ast.walk(tree)
        if isinstance(node, ast.Call)
        and isinstance(node.func, ast.Attribute)
        and isinstance(node.func.value, ast.Name)
    }
    assert "random" not in called
