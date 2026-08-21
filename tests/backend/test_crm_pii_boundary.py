"""
The CRM PII boundary — who can read customer and lead records.

`GET /api/v1/leads` took no credential and returned every lead in the table:
name, email, phone, street address and free-text message. It was reachable
from the open internet. The neighbouring `/api/v1/crm/leads` was locked down
and had a test asserting so, which is most of why this one survived — the
test suite said "the CRM leads endpoint requires auth" and it was true, just
about a different endpoint.

The customer routes had the quieter version of the same problem. Auth was
required, but every by-id route resolved through `db.get(Customer, id)`, which
looks up by primary key and nothing else, so any authenticated tenant could
walk the id space and read — or PATCH — another tenant's records.

Two things these tests are careful about:

  * The operator must keep seeing everything of his own. His rows are stamped
    four different ways depending on which writer created them, and a fix that
    isolates tenants by hiding his own leads from his own cockpit is a worse
    bug than the one it replaces.
  * A cross-tenant read can hide in Redis as easily as in SQL. Filtering the
    query is not enough if both tenants hash to the same cache key.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))


def _token(tenant: str, secret: str = "test-jwt-secret") -> str:
    from jose import jwt

    return jwt.encode(
        {"sub": f"user@{tenant}", "tenant_id": tenant}, secret, algorithm="HS256"
    )


@pytest.fixture()
def rival(app_modules):
    """A second contractor on the platform. Not the operator."""
    return {"Authorization": f"Bearer {_token('RIVAL_PAVING')}"}


# ── The exposure itself ───────────────────────────────────────────────────────


async def test_lead_list_requires_a_credential(client):
    """
    The regression that matters. This endpoint served real customer PII to
    unauthenticated callers in production.
    """
    res = await client.get("/api/v1/leads")
    assert res.status_code in {401, 403}, (
        f"GET /api/v1/leads answered {res.status_code} without a token — "
        "this endpoint returns names, emails, phones and addresses"
    )


async def test_lead_list_rejects_a_bad_credential(client):
    res = await client.get(
        "/api/v1/leads", headers={"Authorization": "Bearer not-the-key"}
    )
    assert res.status_code in {401, 403}


async def test_public_lead_submission_still_works(client):
    """
    Locking down the read must not lock down intake. The marketing sites POST
    here unauthenticated and that is correct — a quote form that needs an API
    key collects nothing.
    """
    res = await client.post(
        "/api/v1/leads/quote",
        json={
            "name": "Test Requester",
            "email": "requester@example.com",
            "phone": "5555550123",
            "service_type": "paving",
            "property_type": "commercial",
            "urgency": "planning",
        },
    )
    assert res.status_code == 200, res.text


# ── The operator keeps his own data ───────────────────────────────────────────


async def test_operator_sees_leads_from_every_domain_he_publishes(
    client, auth_headers, app_modules
):
    """
    Public intake stamps the tenant from the Origin header, so a quote from
    richmondasphaltpaving.com is stored under that hostname rather than under
    "JWORDEN_HQ". Scoping the operator to {default, JWORDEN_HQ} would drop
    those on the floor: the forms would keep accepting leads and the cockpit
    would show none of them.
    """
    _, dbmod = app_modules
    from app.models import Lead

    session = dbmod.SessionLocal()
    try:
        for tenant in ("default", "JWORDEN_HQ", "richmondasphaltpaving.com", None):
            session.add(
                Lead(
                    name="Owner Lead",
                    email=f"owner-{tenant}@example.com",
                    phone="5555550100",
                    service_type="paving",
                    property_type="commercial",
                    urgency="planning",
                    tenant_id=tenant,
                )
            )
        session.add(
            Lead(
                name="Rival Lead",
                email="rival@example.com",
                phone="5555550999",
                service_type="paving",
                property_type="commercial",
                urgency="planning",
                tenant_id="RIVAL_PAVING",
            )
        )
        session.commit()
    finally:
        session.close()

    res = await client.get("/api/v1/leads", headers=auth_headers)
    assert res.status_code == 200, res.text
    emails = {row["email"] for row in res.json()}

    assert "owner-default@example.com" in emails
    assert "owner-JWORDEN_HQ@example.com" in emails
    assert "owner-richmondasphaltpaving.com@example.com" in emails, (
        "the operator lost sight of leads his own marketing site produced"
    )
    assert "owner-None@example.com" in emails, "legacy NULL-tenant rows vanished"
    assert "rival@example.com" not in emails


async def test_rival_does_not_see_operator_leads(client, rival, app_modules):
    _, dbmod = app_modules
    from app.models import Lead

    session = dbmod.SessionLocal()
    try:
        session.add(
            Lead(
                name="Operator Only",
                email="operator-only@example.com",
                phone="5555550100",
                service_type="paving",
                property_type="commercial",
                urgency="planning",
                tenant_id="default",
            )
        )
        session.commit()
    finally:
        session.close()

    res = await client.get("/api/v1/leads", headers=rival)
    assert res.status_code == 200, res.text
    assert all(row["email"] != "operator-only@example.com" for row in res.json())


# ── Customers: the id space is not a directory ────────────────────────────────


async def _create_customer(client, headers, name: str, email: str) -> int:
    res = await client.post(
        "/api/v1/customers",
        headers=headers,
        json={"name": name, "email": email, "customer_type": "commercial"},
    )
    assert res.status_code == 200, res.text
    return res.json()["id"]


async def test_rival_cannot_read_operator_customer_by_id(
    client, auth_headers, rival
):
    cid = await _create_customer(
        client, auth_headers, "Operator Client", "op-client@example.com"
    )
    res = await client.get(f"/api/v1/customers/{cid}", headers=rival)
    assert res.status_code == 404, (
        "another tenant read a customer record by counting to its id"
    )


async def test_rival_cannot_overwrite_operator_customer(
    client, auth_headers, rival
):
    cid = await _create_customer(
        client, auth_headers, "Operator Client", "op-client2@example.com"
    )
    res = await client.patch(
        f"/api/v1/customers/{cid}",
        headers=rival,
        json={"name": "Renamed By Rival"},
    )
    assert res.status_code == 404

    check = await client.get(f"/api/v1/customers/{cid}", headers=auth_headers)
    assert check.json()["name"] == "Operator Client"


async def test_missing_customer_and_forbidden_customer_look_identical(
    client, auth_headers, rival
):
    """
    Distinguishing "not yours" from "does not exist" turns the id space into a
    census of the platform's customer count.
    """
    cid = await _create_customer(
        client, auth_headers, "Operator Client", "op-client3@example.com"
    )
    forbidden = await client.get(f"/api/v1/customers/{cid}", headers=rival)
    absent = await client.get("/api/v1/customers/987654", headers=rival)
    assert forbidden.status_code == absent.status_code == 404
    assert forbidden.json() == absent.json()


async def test_customer_list_is_scoped_per_tenant(client, auth_headers, rival):
    await _create_customer(client, auth_headers, "Operator Co", "listop@example.com")
    await _create_customer(client, rival, "Rival Co", "listrival@example.com")

    op = await client.get("/api/v1/customers", headers=auth_headers)
    rv = await client.get("/api/v1/customers", headers=rival)

    op_names = {i["name"] for i in op.json()["items"]}
    rv_names = {i["name"] for i in rv.json()["items"]}

    assert "Operator Co" in op_names and "Rival Co" not in op_names
    assert "Rival Co" in rv_names and "Operator Co" not in rv_names


async def test_customer_list_cache_does_not_cross_tenants(
    client, auth_headers, rival
):
    """
    Both tenants request the same page with the same filters. With a
    tenant-blind cache key they hash identically and whoever asks second is
    served the first one's rows — a leak the SQL filter cannot catch because
    the query never runs.
    """
    await _create_customer(client, auth_headers, "Cached Operator", "cop@example.com")
    await _create_customer(client, rival, "Cached Rival", "crival@example.com")

    first = await client.get("/api/v1/customers?limit=50&offset=0", headers=auth_headers)
    second = await client.get("/api/v1/customers?limit=50&offset=0", headers=rival)

    second_names = {i["name"] for i in second.json()["items"]}
    assert "Cached Operator" not in second_names, "served from the operator's cache entry"
    assert "Cached Rival" in second_names
    assert "Cached Operator" in {i["name"] for i in first.json()["items"]}


async def test_customer_stats_are_scoped_per_tenant(client, auth_headers, rival):
    await _create_customer(client, auth_headers, "Stat Op", "statop@example.com")

    rv = await client.get("/api/v1/customers/stats/overview", headers=rival)
    assert rv.status_code == 200
    assert rv.json()["total_customers"] == 0, (
        "a tenant with no customers was told how many the operator has"
    )


# ── Import ────────────────────────────────────────────────────────────────────


async def test_import_dedupes_within_the_tenant_not_across_it(
    client, auth_headers, rival
):
    """
    The dedupe set was built from every email in the table. A second
    contractor importing a customer the operator already had got that row
    counted as "skipped" and never created — silent data loss during exactly
    the operation where a customer is trusting the system with their book of
    business.
    """
    shared = "shared-customer@example.com"
    await _create_customer(client, auth_headers, "Operator's Copy", shared)

    payload = f'[{{"name": "Rival\'s Copy", "email": "{shared}"}}]'.encode()
    res = await client.post(
        "/api/v1/customers/import",
        headers=rival,
        files={"file": ("book.json", payload, "application/json")},
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["imported"] == 1, (
        f"the rival's own customer was swallowed by the operator's row: {body}"
    )

    listing = await client.get("/api/v1/customers", headers=rival)
    names = {i["name"] for i in listing.json()["items"]}
    assert "Rival's Copy" in names
    assert "Operator's Copy" not in names


async def test_import_stamps_the_importing_tenant(client, rival):
    payload = b'[{"name": "Imported Co", "email": "imported@example.com"}]'
    res = await client.post(
        "/api/v1/customers/import",
        headers=rival,
        files={"file": ("book.json", payload, "application/json")},
    )
    assert res.status_code == 200, res.text
    assert res.json()["imported"] == 1

    listing = await client.get("/api/v1/customers", headers=rival)
    assert "Imported Co" in {i["name"] for i in listing.json()["items"]}
