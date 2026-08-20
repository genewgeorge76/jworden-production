"""
Tenant isolation across the costing, discovery and SEO engines.

Every one of these tables was written with a tenant_id from the start and read
without one. In a single-operator deployment that is invisible; the moment the
platform serves a second contractor it means one customer's job prices against
another customer's plants.

These tests attack the boundary directly: two tenants, the same names, and an
assertion that neither can see or price against the other's rows. A read that
forgets the filter fails silently — it returns more rows, not an error — so the
only way to know is to check.
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


def _token(tenant: str, secret: str = "test-jwt-secret") -> str:
    from jose import jwt
    return jwt.encode({"sub": f"user@{tenant}", "tenant_id": tenant}, secret, algorithm="HS256")


@pytest.fixture()
def tenant_a(app_modules):
    return {"Authorization": f"Bearer {_token('ACME_PAVING')}"}


@pytest.fixture()
def tenant_b(app_modules):
    return {"Authorization": f"Bearer {_token('RIVAL_PAVING')}"}


# ── The helper ───────────────────────────────────────────────────────────────


def test_tenant_of_never_falls_back_to_unfiltered():
    """An unknown caller sees the shared bucket, never everything."""
    from app.services.tenancy import DEFAULT_TENANT, tenant_of
    assert tenant_of({"tenant_id": "ACME"}) == "ACME"
    assert tenant_of({"tenant_id": "   "}) == DEFAULT_TENANT
    assert tenant_of({}) == DEFAULT_TENANT
    assert tenant_of(None) == DEFAULT_TENANT


# ── Sources and pricing ──────────────────────────────────────────────────────


async def test_one_tenant_cannot_see_anothers_plants(client, tenant_a, tenant_b):
    await client.post("/api/v1/costing/sources", headers=tenant_a, json={
        "name": "Acme Quarry", "state": "VA", "lat": RICHMOND[0], "lng": RICHMOND[1]})
    await client.post("/api/v1/costing/sources", headers=tenant_b, json={
        "name": "Rival Quarry", "state": "VA", "lat": RICHMOND[0], "lng": RICHMOND[1]})

    a = await client.get("/api/v1/costing/sources", headers=tenant_a)
    b = await client.get("/api/v1/costing/sources", headers=tenant_b)

    assert [s["name"] for s in a.json()["sources"]] == ["Acme Quarry"]
    assert [s["name"] for s in b.json()["sources"]] == ["Rival Quarry"]


async def test_two_tenants_may_both_have_a_plant_of_the_same_name(client, tenant_a, tenant_b):
    """Names are unique within a tenant, not across the platform."""
    ra = await client.post("/api/v1/costing/sources", headers=tenant_a, json={
        "name": "Vulcan Materials", "state": "VA", "lat": RICHMOND[0], "lng": RICHMOND[1]})
    rb = await client.post("/api/v1/costing/sources", headers=tenant_b, json={
        "name": "Vulcan Materials", "state": "VA", "lat": ROANOKE[0], "lng": ROANOKE[1]})

    assert ra.json()["created"] is True
    assert rb.json()["created"] is True, "second tenant must get its own row, not update the first"
    assert ra.json()["source"]["id"] != rb.json()["source"]["id"]


async def test_a_job_never_prices_against_another_tenants_plant(client, tenant_a, tenant_b):
    """The failure this whole change exists to prevent."""
    # B has a plant on the doorstep and a price. A has nothing.
    r = await client.post("/api/v1/costing/sources", headers=tenant_b, json={
        "name": "Rival Plant", "state": "VA", "lat": RICHMOND[0], "lng": RICHMOND[1]})
    await client.post("/api/v1/costing/prices", headers=tenant_b, json={
        "source_id": r.json()["source"]["id"], "material_code": "hma_sm_9_5a",
        "fob_price": 78.0, "source_note": "rival quote"})
    await client.post("/api/v1/costing/haul-profiles", headers=tenant_b, json={
        "name": "b-fleet", "tons_per_load": 22.0, "truck_cost_per_hour": 95.0,
        "is_default": True})

    # A asks for the same material at the same spot and must get nothing.
    a = await client.post("/api/v1/costing/delivered", headers=tenant_a, json={
        "material_code": "hma_sm_9_5a", "lat": RICHMOND[0], "lng": RICHMOND[1]})
    assert a.status_code == 409
    assert "haul profile" in a.json()["detail"] or "material sources" in a.json()["detail"]

    # B, who owns the data, prices fine.
    b = await client.post("/api/v1/costing/delivered", headers=tenant_b, json={
        "material_code": "hma_sm_9_5a", "lat": RICHMOND[0], "lng": RICHMOND[1]})
    assert b.status_code == 200
    assert b.json()["best_source"]["source_name"] == "Rival Plant"


async def test_a_price_cannot_be_attached_to_another_tenants_source(client, tenant_a, tenant_b):
    r = await client.post("/api/v1/costing/sources", headers=tenant_b, json={
        "name": "Rival Plant", "state": "VA", "lat": RICHMOND[0], "lng": RICHMOND[1]})
    sid = r.json()["source"]["id"]

    bad = await client.post("/api/v1/costing/prices", headers=tenant_a, json={
        "source_id": sid, "material_code": "hma_sm_9_5a", "fob_price": 1.0,
        "source_note": "attempted cross-tenant write"})
    assert bad.status_code == 404


async def test_default_haul_profile_is_per_tenant(client, tenant_a, tenant_b):
    """Marking a default must not clear the other tenant's default."""
    await client.post("/api/v1/costing/haul-profiles", headers=tenant_a, json={
        "name": "a-fleet", "tons_per_load": 20.0, "truck_cost_per_hour": 90.0,
        "is_default": True})
    await client.post("/api/v1/costing/haul-profiles", headers=tenant_b, json={
        "name": "b-fleet", "tons_per_load": 24.0, "truck_cost_per_hour": 110.0,
        "is_default": True})

    for headers, plant, expect in ((tenant_a, "A Plant", "a-fleet"),
                                   (tenant_b, "B Plant", "b-fleet")):
        r = await client.post("/api/v1/costing/sources", headers=headers, json={
            "name": plant, "state": "VA", "lat": RICHMOND[0], "lng": RICHMOND[1]})
        await client.post("/api/v1/costing/prices", headers=headers, json={
            "source_id": r.json()["source"]["id"], "material_code": "m",
            "fob_price": 50.0, "source_note": "quote"})
        got = await client.post("/api/v1/costing/delivered", headers=headers, json={
            "material_code": "m", "lat": RICHMOND[0], "lng": RICHMOND[1]})
        assert got.json()["haul_profile"] == expect


async def test_status_counts_only_your_own_rows(client, tenant_a, tenant_b):
    await client.post("/api/v1/costing/sources", headers=tenant_b, json={
        "name": "Rival Quarry", "state": "VA", "lat": RICHMOND[0], "lng": RICHMOND[1]})
    a = await client.get("/api/v1/costing/status", headers=tenant_a)
    assert a.json()["material_sources"] == 0
    b = await client.get("/api/v1/costing/status", headers=tenant_b)
    assert b.json()["material_sources"] == 1


# ── Discovery ────────────────────────────────────────────────────────────────


async def test_candidates_are_not_visible_across_tenants(client, tenant_a, tenant_b, app_modules):
    _, dbmod = app_modules
    from app.models import MaterialSourceCandidate

    session = dbmod.SessionLocal()
    try:
        session.add(MaterialSourceCandidate(
            provider="google_places", provider_place_id="p1", name="Found Quarry",
            lat=37.55, lng=-77.44, searched_category="quarry",
            review_status="pending", tenant_id="RIVAL_PAVING"))
        session.commit()
    finally:
        session.close()

    a = await client.get("/api/v1/suppliers/candidates", headers=tenant_a)
    b = await client.get("/api/v1/suppliers/candidates", headers=tenant_b)
    assert a.json()["total"] == 0
    assert b.json()["total"] == 1


async def test_another_tenants_candidate_cannot_be_promoted(client, tenant_a, app_modules):
    _, dbmod = app_modules
    from app.models import MaterialSourceCandidate

    session = dbmod.SessionLocal()
    try:
        session.add(MaterialSourceCandidate(
            provider="google_places", provider_place_id="p1", name="Rival Find",
            lat=37.55, lng=-77.44, searched_category="quarry",
            review_status="pending", tenant_id="RIVAL_PAVING"))
        session.commit()
        cid = session.query(MaterialSourceCandidate).one().id
    finally:
        session.close()

    r = await client.post(f"/api/v1/suppliers/candidates/{cid}/promote",
                          headers=tenant_a, json={})
    assert r.status_code == 404


# ── SEO ──────────────────────────────────────────────────────────────────────


async def test_keyword_stores_do_not_bleed(client, tenant_a, tenant_b):
    await client.post("/api/v1/seo/keywords/import", headers=tenant_b, json={
        "source": "rival-export", "keywords": [{"keyword": "rival secret term",
                                                "volume_monthly": 900}]})
    a = await client.get("/api/v1/seo/keywords", headers=tenant_a)
    b = await client.get("/api/v1/seo/keywords", headers=tenant_b)
    assert a.json()["total"] == 0
    assert b.json()["total"] == 1
    assert (await client.get("/api/v1/seo/status", headers=tenant_a)).json()["keywords_stored"] == 0


# ── The chain ────────────────────────────────────────────────────────────────


async def test_the_estimate_chain_is_scoped_too(client, tenant_a, tenant_b):
    r = await client.post("/api/v1/costing/sources", headers=tenant_b, json={
        "name": "Rival Plant", "state": "VA", "lat": RICHMOND[0], "lng": RICHMOND[1]})
    await client.post("/api/v1/costing/prices", headers=tenant_b, json={
        "source_id": r.json()["source"]["id"], "material_code": "hma_sm_9_5a",
        "fob_price": 78.0, "source_note": "quote"})
    await client.post("/api/v1/costing/haul-profiles", headers=tenant_b, json={
        "name": "b-fleet", "tons_per_load": 22.0, "truck_cost_per_hour": 95.0,
        "is_default": True})

    a = await client.post("/api/v1/estimate/job", headers=tenant_a, json={
        "area_sqft": 10000, "lat": RICHMOND[0], "lng": RICHMOND[1]})
    body = a.json()
    # Quantities still resolve — geometry belongs to nobody.
    assert body["quantities"]["lines"][0]["tons"] > 0
    # But no price, because A owns no plants.
    assert body["materials"]["materials_total_usd"] is None
    assert body["job_total_usd"] is None
