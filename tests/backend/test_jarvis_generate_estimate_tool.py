"""
Tests for the generate_estimate Jarvis tool — connects Jarvis to the real
pricing engine + margin_engine so it can produce priced, margin-aware
estimates instead of guessing numbers conversationally.
"""
from __future__ import annotations

from app.services.jarvis import _run_tool
from app.services.jarvis_access import (
    ROLE_OWNER_ROOT,
    ROLE_PUBLIC_CONCIERGE,
    ROLE_STAFF_OPERATOR,
)


async def test_generate_estimate_blocked_for_public_concierge():
    result = await _run_tool(
        "generate_estimate",
        {"service_type": "paving", "project_size_sqft": 5000},
        role=ROLE_PUBLIC_CONCIERGE,
    )
    assert result["ok"] is False
    assert "policy" in result["error"].lower()


async def test_generate_estimate_allowed_for_staff_operator():
    result = await _run_tool(
        "generate_estimate",
        {"service_type": "paving", "property_type": "commercial",
         "project_size_sqft": 10000, "state_code": "VA", "margin_mode": "worden"},
        role=ROLE_STAFF_OPERATOR,
    )
    assert result["ok"] is True
    assert "market_cost_range" in result
    assert "contractor_bid" in result
    assert result["contractor_bid"]["margin"] == 0.35
    assert result["contractor_bid"]["contractor_bid_low"] > result["market_cost_range"]["low_usd"]


async def test_generate_estimate_dynamic_mode_for_owner():
    result = await _run_tool(
        "generate_estimate",
        {"service_type": "parking_lot", "project_size_sqft": 50000, "margin_mode": "dynamic"},
        role=ROLE_OWNER_ROOT,
    )
    assert result["ok"] is True
    assert result["contractor_bid"]["margin_mode"] == "dynamic"
    assert result["contractor_bid"]["margin"] == 0.28


async def test_generate_estimate_rejects_unknown_service_type():
    result = await _run_tool(
        "generate_estimate",
        {"service_type": "not_a_real_service", "project_size_sqft": 1000},
        role=ROLE_OWNER_ROOT,
    )
    assert result["ok"] is False
    assert "error" in result
