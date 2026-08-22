"""
POST /portal/estimates/internal was open to the internet.

The deployed OpenAPI listed it with no security requirement, while comparable
endpoints declare OAuth2PasswordBearer:

    /portal/estimates/internal   security: NONE DECLARED
                                 parameters: tenant_id (query, optional)
    /api/v1/workforce            security: [{'OAuth2PasswordBearer': []}]

So an anonymous caller could POST an estimate attributed to any tenant they
named — `tenant_id` was a query parameter defaulting to "default" — with any
total_amount and deposit_amount, already marked status="sent", and then drive
it through the Stripe checkout route on the same router.

The rest of this router is capability-based ON PURPOSE: the other endpoints are
reached with a public_token (uuid4, 122 bits) that the customer holds, and
holding it is the authorization. Those stay open. This one is different because
it MINTS the token.

Verified against the live schema before changing anything; no row was written
to the production database to prove it.

Separately, the only caller — src/pages/EstimatePage.jsx — was POSTing to
/api/v1/portal/estimates/internal, which does not exist (the router is mounted
at /portal). That call had been 404ing, so the portal link it was supposed to
produce was never generated. Fixed alongside, and it now goes through the
api client's request() helper, which attaches the bearer token.
"""
from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

BODY = {
    "customer_name": "Anon",
    "customer_email": "anon@example.com",
    "service_type": "paving",
    "scope_summary": "whatever",
    "total_amount": 1.0,
    "deposit_amount": 0.0,
}


async def test_anonymous_cannot_create_an_estimate(client):
    res = await client.post("/portal/estimates/internal", json=BODY)
    assert res.status_code in (401, 403), (
        f"anonymous estimate creation returned {res.status_code} — this endpoint "
        "mints a payable portal token and must not be open"
    )


async def test_the_tenant_cannot_be_chosen_by_the_caller(client):
    """
    tenant_id was a query parameter. Even authenticated, a caller must not be
    able to attribute an estimate to somebody else's tenant.
    """
    res = await client.post(
        "/portal/estimates/internal?tenant_id=some-other-tenant", json=BODY
    )
    assert res.status_code in (401, 403)


async def test_an_authenticated_caller_can_still_create_one(
    client, auth_headers, app_modules
):
    res = await client.post("/portal/estimates/internal", headers=auth_headers, json=BODY)
    assert res.status_code in (200, 201), res.text
    payload = res.json()
    assert payload.get("public_token"), "the portal token is the point of this call"

    _, dbmod = app_modules
    from app.models import Estimate

    session = dbmod.SessionLocal()
    try:
        row = session.query(Estimate).filter(
            Estimate.public_token == payload["public_token"]
        ).first()
        assert row is not None
        assert row.tenant_id == "default", (
            f"stamped {row.tenant_id!r} — the tenant must come from the "
            "authenticated identity, not from the request"
        )
    finally:
        session.close()


async def test_the_query_parameter_is_gone(client, auth_headers):
    """
    Passing it must not change the row's owner. FastAPI ignores unknown query
    params, so this proves the parameter is no longer wired to anything.
    """
    res = await client.post(
        "/portal/estimates/internal?tenant_id=rival-co", headers=auth_headers, json=BODY
    )
    assert res.status_code in (200, 201), res.text

    import app.database as db
    from app.models import Estimate

    session = db.SessionLocal()
    try:
        row = session.query(Estimate).filter(
            Estimate.public_token == res.json()["public_token"]
        ).first()
        assert row.tenant_id != "rival-co"
    finally:
        session.close()


async def test_reading_an_estimate_by_token_is_still_open(client, auth_headers):
    """
    The capability model must survive. A customer holding the link has no
    account, so this endpoint stays unauthenticated by design.
    """
    created = await client.post(
        "/portal/estimates/internal", headers=auth_headers, json=BODY
    )
    token = created.json()["public_token"]

    res = await client.get(f"/portal/estimates/{token}")   # no auth header
    assert res.status_code == 200, res.text
    assert res.json()["public_token"] == token
