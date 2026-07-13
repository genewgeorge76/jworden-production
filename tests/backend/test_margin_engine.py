"""
Tests for app/services/margin_engine.py — the internal contractor margin
layer that sits on top of pricing.py's public ballpark cost ranges.
"""
from __future__ import annotations

from app.services import margin_engine


def test_worden_margin_is_always_35_percent():
    assert margin_engine.calculate_worden_margin() == 0.35


def test_dynamic_margin_small_job_is_42_percent():
    assert margin_engine.calculate_dynamic_margin(2000, "paving") == 0.42


def test_dynamic_margin_mid_job_is_35_percent():
    assert margin_engine.calculate_dynamic_margin(10000, "paving") == 0.35


def test_dynamic_margin_large_job_is_28_percent():
    assert margin_engine.calculate_dynamic_margin(50000, "paving") == 0.28


def test_dynamic_margin_high_risk_service_gets_bump():
    baseline = margin_engine.calculate_dynamic_margin(10000, "paving")
    bumped = margin_engine.calculate_dynamic_margin(10000, "general_contracting")
    assert bumped == round(baseline + 0.03, 4)


def test_dynamic_margin_never_drops_below_floor():
    # Even a huge job with no risk bump should not go below 22%.
    assert margin_engine.calculate_dynamic_margin(10_000_000, "paving") >= 0.22


def test_dynamic_margin_never_exceeds_ceiling():
    # Tiny job + risk bump should still be capped at 45%.
    margin = margin_engine.calculate_dynamic_margin(100, "general_contracting")
    assert margin <= 0.45


def test_apply_margin_matches_known_value():
    # $650 cost at 35% margin -> 650 / 0.65 = 1000.0
    assert margin_engine.apply_margin(650, 0.35) == 1000.0


def test_compute_contractor_bid_worden_mode():
    result = margin_engine.compute_contractor_bid(
        cost_low=1000, cost_high=2000, margin_mode="worden",
    )
    assert result["margin_mode"] == "worden"
    assert result["margin"] == 0.35
    assert result["contractor_bid_low"] == margin_engine.apply_margin(1000, 0.35)
    assert result["contractor_bid_high"] == margin_engine.apply_margin(2000, 0.35)


def test_compute_contractor_bid_dynamic_mode():
    result = margin_engine.compute_contractor_bid(
        cost_low=1000, cost_high=2000, margin_mode="dynamic",
        project_size_sqft=50000, service_type="paving",
    )
    assert result["margin_mode"] == "dynamic"
    assert result["margin"] == 0.28


def test_compute_contractor_bid_invalid_mode_falls_back_to_worden():
    result = margin_engine.compute_contractor_bid(
        cost_low=1000, cost_high=2000, margin_mode="not-a-real-mode",
    )
    assert result["margin_mode"] == "worden"
    assert result["margin"] == 0.35


def test_contractor_bid_always_exceeds_raw_cost():
    for mode in ("worden", "dynamic"):
        result = margin_engine.compute_contractor_bid(
            cost_low=500, cost_high=500, margin_mode=mode, project_size_sqft=1000,
        )
        assert result["contractor_bid_low"] > 500
