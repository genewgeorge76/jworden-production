"""
Tests for supplier discovery.

The property that matters: discovery proposes, it never enrols. Nothing found
by a text search can reach the pricing path without someone confirming it.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

RICHMOND = (37.5407, -77.4360)

# The `auth_headers` fixture presents the master key, which verify_premium_security
# maps to this tenant. Rows inserted directly into the session must carry it, or
# the tenant scoping correctly hides them from the very client that made them.
MASTER_KEY_TENANT = "JWORDEN_HQ"


def _place(pid, name, lat=37.55, lng=-77.44, ptype="store", status="OPERATIONAL"):
    return {
        "id": pid,
        "displayName": {"text": name},
        "formattedAddress": f"1 Main St, Richmond, VA",
        "location": {"latitude": lat, "longitude": lng},
        "primaryType": ptype,
        "businessStatus": status,
        "nationalPhoneNumber": "(804) 555-0100",
        "websiteUri": "https://example.com",
        "addressComponents": [
            {"types": ["locality"], "longText": "Richmond"},
            {"types": ["administrative_area_level_1"], "shortText": "VA"},
        ],
    }


def _transport(places_by_query=None, default=None):
    """Stub Places transport — no network, no billed requests."""
    def post(url, json, headers, timeout):
        q = json["textQuery"]
        payload = (places_by_query or {}).get(q, default if default is not None else [])
        class R:
            status_code = 200
            def json(self_inner):
                return {"places": payload}
        return R()
    return post


# ── Catalogue ────────────────────────────────────────────────────────────────


def test_catalogue_covers_the_trade_not_just_paving():
    from app.services.supplier_discovery import category_list, group_list
    cats = set(category_list())
    for expected in ("asphalt_plant", "ready_mix", "quarry", "brick_paver", "recycling",
                     "structural_steel", "lumber", "roofing_supply", "electrical_supply",
                     "plumbing_supply", "hvac_supply", "pipe_drainage", "glass_glazing"):
        assert expected in cats, expected
    assert len(cats) >= 30
    assert set(group_list()) >= {"paving", "concrete", "masonry", "structure",
                                 "envelope", "sitework", "mep", "general"}


def test_unknown_names_are_returned_not_silently_dropped():
    """A typo that searches nothing looks the same as a market with no suppliers."""
    from app.services.supplier_discovery import resolve_categories
    resolved, unknown = resolve_categories(categories=["quarry", "nonsense"], groups=["mep", "nope"])
    assert "quarry" in resolved and "electrical_supply" in resolved
    assert set(unknown) == {"nonsense", "nope"}


def test_query_count_is_knowable_before_spending_it():
    from app.services.supplier_discovery import category_list, planned_query_count
    assert planned_query_count(["quarry"]) == 3
    assert planned_query_count(["quarry"], ["scaffolding supplier"]) == 4
    assert planned_query_count(category_list()) > 90


# ── Discovery ────────────────────────────────────────────────────────────────


def test_no_api_key_returns_unconfigured_never_a_builtin_list():
    from app.services.supplier_discovery import discover
    r = discover(api_key=None, lat=RICHMOND[0], lng=RICHMOND[1], categories=["quarry"])
    assert r["configured"] is False
    assert r["candidates"] == []
    assert "GOOGLE_MAPS_API_KEY" in r["reason"]


def test_free_text_searches_anything_not_in_the_catalogue():
    from app.services.supplier_discovery import discover
    r = discover(api_key="k", lat=RICHMOND[0], lng=RICHMOND[1],
                 custom_queries=["scaffolding supplier"],
                 http_post=_transport(default=[_place("p1", "Acme Scaffolding")]))
    assert r["queries_run"] == 1
    assert r["candidates"][0]["searched_category"] == "custom"


def test_one_yard_matching_several_searches_keeps_every_category():
    from app.services.supplier_discovery import discover
    r = discover(api_key="k", lat=RICHMOND[0], lng=RICHMOND[1],
                 categories=["quarry", "sand_and_gravel"],
                 http_post=_transport(default=[_place("same", "Big Rock Quarry")]))
    assert len(r["candidates"]) == 1
    assert r["candidates"][0]["searched_category"] == "quarry,sand_and_gravel"


def test_results_beyond_the_radius_are_dropped_and_counted():
    """Location bias only weights a search; it does not bound it."""
    from app.services.supplier_discovery import discover
    far = _place("far", "Distant Quarry", lat=39.9, lng=-75.1)   # Philadelphia-ish
    near = _place("near", "Local Quarry")
    r = discover(api_key="k", lat=RICHMOND[0], lng=RICHMOND[1], radius_miles=50,
                 categories=["quarry"], http_post=_transport(default=[far, near]))
    assert [c["name"] for c in r["candidates"]] == ["Local Quarry"]
    assert r["dropped_outside_radius"] == 3   # once per query in the category


def test_likely_non_suppliers_are_flagged_not_hidden():
    from app.services.supplier_discovery import discover
    r = discover(api_key="k", lat=RICHMOND[0], lng=RICHMOND[1], categories=["asphalt_plant"],
                 http_post=_transport(default=[
                     _place("c1", "Some Paving Co", ptype="general_contractor"),
                     _place("c2", "Closed Yard", status="CLOSED_PERMANENTLY"),
                 ]))
    by_name = {c["name"]: c for c in r["candidates"]}
    flag = by_name["Some Paving Co"]["review_flags"][0]
    assert "general_contractor" in flag
    # A flag is a prompt to check, not grounds to exclude — Slurry Pavers is
    # classified this way and runs a tack plant the crews actually load at.
    assert "not a disqualification" in flag
    assert "CLOSED_PERMANENTLY" in by_name["Closed Yard"]["review_flags"][0]


def test_a_provider_error_does_not_lose_the_other_queries():
    from app.services.supplier_discovery import discover
    def flaky(url, json, headers, timeout):
        if "quarry" == json["textQuery"]:
            raise RuntimeError("upstream 429")
        class R:
            status_code = 200
            def json(self_inner):
                return {"places": [_place("ok", "Working Result")]}
        return R()
    r = discover(api_key="k", lat=RICHMOND[0], lng=RICHMOND[1], categories=["quarry"],
                 http_post=flaky)
    assert len(r["errors"]) == 1
    assert r["candidates"], "the other two queries in the category should still land"


# ── Endpoints ────────────────────────────────────────────────────────────────


async def test_categories_endpoint_lists_the_trade(client, auth_headers):
    r = await client.get("/api/v1/suppliers/categories", headers=auth_headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert len(body["categories"]) >= 30
    assert body["full_sweep_query_count"] > 90
    assert "custom_queries" in body["note"]


async def test_preview_reports_cost_without_spending_it(client, auth_headers):
    r = await client.post("/api/v1/suppliers/preview", headers=auth_headers, json={
        "lat": RICHMOND[0], "lng": RICHMOND[1], "groups": ["paving"]})
    body = r.json()
    assert body["billed_requests"] == 15
    assert body["within_budget"] is True


async def test_a_sweep_over_budget_is_refused_before_spending(client, auth_headers):
    r = await client.post("/api/v1/suppliers/search", headers=auth_headers, json={
        "lat": RICHMOND[0], "lng": RICHMOND[1],
        "categories": [], "groups": ["paving", "concrete", "masonry", "structure",
                                     "envelope", "sitework", "mep", "general"],
        "query_budget": 10})
    assert r.status_code == 413
    assert "billed provider requests" in r.json()["detail"]


async def test_search_without_a_key_fails_closed(client, auth_headers):
    r = await client.post("/api/v1/suppliers/search", headers=auth_headers, json={
        "lat": RICHMOND[0], "lng": RICHMOND[1], "categories": ["quarry"]})
    assert r.status_code == 503
    assert "GOOGLE_MAPS_API_KEY" in r.json()["detail"]


async def test_search_needs_something_to_search_for(client, auth_headers):
    r = await client.post("/api/v1/suppliers/search", headers=auth_headers,
                          json={"lat": RICHMOND[0], "lng": RICHMOND[1]})
    assert r.status_code == 422


async def test_discovery_does_not_create_material_sources(client, auth_headers, app_modules):
    """
    The property this whole design exists for: a candidate is not a source.
    """
    _, dbmod = app_modules
    from app.models import MaterialSource, MaterialSourceCandidate

    session = dbmod.SessionLocal()
    try:
        session.add(MaterialSourceCandidate(
            provider="google_places", provider_place_id="p1", name="Found Quarry",
            city="Richmond", state="VA", lat=37.55, lng=-77.44,
            searched_category="quarry", review_status="pending",
            tenant_id=MASTER_KEY_TENANT))
        session.commit()
        assert session.query(MaterialSource).count() == 0
    finally:
        session.close()

    listing = await client.get("/api/v1/suppliers/candidates", headers=auth_headers)
    assert listing.json()["total"] == 1

    priced = await client.post("/api/v1/costing/delivered", headers=auth_headers, json={
        "material_code": "hma_sm_9_5a", "lat": 37.54, "lng": -77.43})
    # No sources exist, so nothing can be priced against the candidate.
    assert priced.status_code == 409


async def test_promote_turns_a_candidate_into_a_priceable_source(client, auth_headers, app_modules):
    _, dbmod = app_modules
    from app.models import MaterialSourceCandidate

    session = dbmod.SessionLocal()
    try:
        session.add(MaterialSourceCandidate(
            provider="google_places", provider_place_id="p1", name="Found Quarry",
            city="Richmond", state="VA", lat=37.55, lng=-77.44,
            searched_category="quarry", review_status="pending",
            tenant_id=MASTER_KEY_TENANT))
        session.commit()
        cid = session.query(MaterialSourceCandidate).one().id
    finally:
        session.close()

    r = await client.post(f"/api/v1/suppliers/candidates/{cid}/promote",
                          headers=auth_headers, json={"source_type": "quarry"})
    assert r.status_code == 200, r.text
    assert "Add a dated FOB price" in r.json()["next_step"]

    sources = await client.get("/api/v1/costing/sources", headers=auth_headers)
    assert sources.json()["total"] == 1
    assert sources.json()["sources"][0]["name"] == "Found Quarry"

    again = await client.post(f"/api/v1/suppliers/candidates/{cid}/promote",
                              headers=auth_headers, json={})
    assert again.json()["already_promoted"] is True


async def test_a_candidate_without_coordinates_cannot_be_promoted(client, auth_headers, app_modules):
    """Delivered cost is distance; a source with no location cannot be hauled from."""
    _, dbmod = app_modules
    from app.models import MaterialSourceCandidate

    session = dbmod.SessionLocal()
    try:
        session.add(MaterialSourceCandidate(
            provider="google_places", provider_place_id="p2", name="Nowhere Supply",
            searched_category="quarry", review_status="pending",
            tenant_id=MASTER_KEY_TENANT))
        session.commit()
        cid = session.query(MaterialSourceCandidate).one().id
    finally:
        session.close()

    r = await client.post(f"/api/v1/suppliers/candidates/{cid}/promote",
                          headers=auth_headers, json={})
    assert r.status_code == 422
    assert "no coordinates" in r.json()["detail"]


async def test_rejecting_requires_a_reason(client, auth_headers, app_modules):
    _, dbmod = app_modules
    from app.models import MaterialSourceCandidate

    session = dbmod.SessionLocal()
    try:
        session.add(MaterialSourceCandidate(
            provider="google_places", provider_place_id="p3", name="Paving Contractor",
            lat=37.5, lng=-77.4, searched_category="asphalt_plant",
            review_status="pending", tenant_id=MASTER_KEY_TENANT))
        session.commit()
        cid = session.query(MaterialSourceCandidate).one().id
    finally:
        session.close()

    assert (await client.post(f"/api/v1/suppliers/candidates/{cid}/reject",
                              headers=auth_headers, json={})).status_code == 422
    ok = await client.post(f"/api/v1/suppliers/candidates/{cid}/reject",
                           headers=auth_headers, json={"note": "contractor, not a yard"})
    assert ok.json()["review_status"] == "rejected"

    pending = await client.get("/api/v1/suppliers/candidates", headers=auth_headers)
    assert pending.json()["total"] == 0


async def test_supplier_routes_require_auth(client):
    assert (await client.get("/api/v1/suppliers/categories")).status_code == 403
