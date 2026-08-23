"""
The operator and a paying subscriber must not present as the same identity.

Before /auth/me existed, the SPA answered "who am I?" with a literal:
AuthContext.jsx set `{id: 'admin', role: 'admin'}` after any successful
sign-in. /auth/register also stamps role="admin" on every self-serve signup,
so role could never have separated them even if the SPA had read it. These
tests pin the axis that actually works — the tenant — and pin the fact that
`role` now survives token verification at all.
"""

import pytest


REGISTRATION = {
    "companyName": "Blue Ridge Sealcoating LLC",
    "email": "owner@blueridgesealcoating.example",
    "password": "a-real-password-not-a-pin",
    "plan": "pro",
    "industry": "Asphalt Paving",
    "state": "VA",
    "city": "Roanoke",
}


@pytest.mark.anyio
async def test_master_key_caller_is_the_owner(client, auth_headers):
    response = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200, response.text

    identity = response.json()
    assert identity["is_owner"] is True
    assert identity["tenant_id"] == "JWORDEN_HQ"
    # The operator has no tenants row and therefore no subscription. Reporting
    # a tier here would be inventing one.
    assert identity["subscription_tier"] is None


@pytest.mark.anyio
async def test_subscriber_is_not_the_owner(client):
    registration = await client.post("/api/v1/auth/register", json=REGISTRATION)
    assert registration.status_code == 200, registration.text
    token = registration.json()["access_token"]

    response = await client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200, response.text
    identity = response.json()

    # The whole point. This caller's role is "admin" — the same string the
    # operator's UI used to gate on — and they are still not the owner.
    assert identity["role"] == "admin"
    assert identity["is_owner"] is False
    assert identity["tenant_id"] != "JWORDEN_HQ"
    assert identity["tenant_id"] != "default"
    # LITE, though the signup asked for "pro": registration no longer grants a
    # tier from the form. The Stripe webhook grants it when checkout completes.
    assert identity["subscription_tier"] == "lite"
    assert identity["subscription_status"] == "pending"
    assert identity["email"] == REGISTRATION["email"]


@pytest.mark.anyio
async def test_tier_comes_from_the_database_not_the_token(client, app_modules):
    """A stale token must not keep a downgraded tenant on its old plan."""
    _, dbmod = app_modules

    registration = await client.post(
        "/api/v1/auth/register", json={**REGISTRATION, "email": "downgrade@blueridgesealcoating.example"}
    )
    token = registration.json()["access_token"]
    tenant_id = registration.json()["tenant_id"]

    from app.models import Tenant

    session = dbmod.SessionLocal()
    try:
        row = session.query(Tenant).filter(Tenant.tenant_id == tenant_id).one()
        # Upward, so the assertion cannot pass by accident: registration now
        # creates every tenant at lite, so setting it to lite here would prove
        # nothing about where the value was read from.
        row.subscription_tier = "max"
        session.commit()
    finally:
        session.close()

    response = await client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    # Same token as before, issued when the tenant was on lite.
    assert response.json()["subscription_tier"] == "max"


@pytest.mark.anyio
async def test_role_survives_token_verification(client):
    """
    verify_premium_security used to return only {user, tenant_id}, dropping
    the role claim that /login and /register both set. Any endpoint wanting to
    gate on role had nothing to gate on.
    """
    from app.core.security import verify_premium_security

    registration = await client.post(
        "/api/v1/auth/register", json={**REGISTRATION, "email": "roles@blueridgesealcoating.example"}
    )
    auth = verify_premium_security(registration.json()["access_token"])
    assert auth["role"] == "admin"
    assert auth["tenant_id"] == registration.json()["tenant_id"]


def test_token_without_a_tenant_claim_is_not_the_owner(app_modules):
    """
    A validly-signed token that omits tenant_id used to default to
    "JWORDEN_HQ", which tenancy.owner_bucket() treats as the operator. Unknown
    scope must not resolve to maximum privilege.
    """
    from datetime import datetime, timedelta, timezone

    from fastapi import HTTPException
    from jose import jwt

    from app.core.security import verify_premium_security

    scopeless = jwt.encode(
        {
            "sub": "nobody@blueridgesealcoating.example",
            "role": "admin",
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        },
        "test-jwt-secret",
        algorithm="HS256",
    )

    with pytest.raises(HTTPException) as raised:
        verify_premium_security(scopeless)
    assert raised.value.status_code == 403
