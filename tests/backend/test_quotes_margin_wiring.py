"""
Tests for the margin_engine wiring into POST /api/v1/quotes/generate/{id}.

This endpoint is premium-security gated (never public), so it's the right
place to surface the internal contractor_bid figure that pricing.py's
public estimate_price() deliberately never returns.
"""
from __future__ import annotations


async def _create_evaluation(dbmod, *, sqft=2000.0, damage_type="good"):
    from app.models import PavingEvaluation
    with dbmod.SessionLocal() as db:
        row = PavingEvaluation(region="Chester, VA", calculated_sqft=sqft, damage_type=damage_type)
        db.add(row)
        db.commit()
        db.refresh(row)
        return row.id


async def test_generate_quote_defaults_to_worden_margin(client, auth_headers, app_modules):
    _, dbmod = app_modules
    eval_id = await _create_evaluation(dbmod, sqft=2000.0, damage_type="good")

    res = await client.post(f"/api/v1/quotes/generate/{eval_id}", headers=auth_headers)
    assert res.status_code == 200, res.text
    body = res.json()

    assert body["margin_mode"] == "worden"
    assert body["margin"] == 0.35
    assert body["contractor_bid"] > body["estimated_total"]


async def test_generate_quote_dynamic_margin_mode(client, auth_headers, app_modules):
    _, dbmod = app_modules
    # Large job -> dynamic mode should apply the 28% large-job tier.
    eval_id = await _create_evaluation(dbmod, sqft=30000.0, damage_type="good")

    res = await client.post(
        f"/api/v1/quotes/generate/{eval_id}", params={"margin_mode": "dynamic"}, headers=auth_headers,
    )
    assert res.status_code == 200, res.text
    body = res.json()

    assert body["margin_mode"] == "dynamic"
    assert body["margin"] == 0.28


async def test_generate_quote_alligator_cracking_applies_base_rehab_and_risk_bump(
    client, auth_headers, app_modules,
):
    _, dbmod = app_modules
    eval_id = await _create_evaluation(dbmod, sqft=10000.0, damage_type="alligator_cracking")

    res = await client.post(
        f"/api/v1/quotes/generate/{eval_id}", params={"margin_mode": "dynamic"}, headers=auth_headers,
    )
    assert res.status_code == 200, res.text
    body = res.json()

    assert body["recommended_service"] == "Full Repave + Base Rehab"
    # base_rehab -> classified as general_contracting for margin risk purposes -> +3pt bump over the 35% mid-tier
    assert body["margin"] == 0.38


async def test_generate_quote_requires_auth(client):
    res = await client.post("/api/v1/quotes/generate/1")
    assert res.status_code in (401, 403)


async def test_generate_quote_404_for_missing_evaluation(client, auth_headers):
    res = await client.post("/api/v1/quotes/generate/999999", headers=auth_headers)
    assert res.status_code == 404
