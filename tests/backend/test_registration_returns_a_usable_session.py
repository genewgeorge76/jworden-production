"""
Signing up and then paying were two steps with no credential between them.

The flow is: POST /api/v1/auth/register, then POST /api/v1/billing/checkout to
get a Stripe URL. The billing router declares auth at router level. Registration
returned {"status": "success", "tenant_id": ...} and nothing else.

So a brand-new customer had no token, the checkout call was rejected, and the UI
showed "Failed to create checkout session". There was no other way for them to
obtain one — /auth/login needs an account that exists and a password they had
just set, but the page never went back for it. Nobody could subscribe.

This is not a hole that was opened tonight. The router-level guard on billing
predates this work; registration simply never handed back the credential the
next step required. It surfaced while checking which frontend calls the newly
gated endpoints would break.
"""
from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

SIGNUP = {
    "companyName": "New Paving Co",
    "email": "owner@newpaving.example",
    "password": "a-long-enough-password-1",
    "plan": "pro",
    "industry": "Asphalt Paving",
    "state": "VA",
    "city": "Richmond",
}


async def test_registration_returns_an_access_token(client):
    res = await client.post("/api/v1/auth/register", json=SIGNUP)
    assert res.status_code in (200, 201), res.text
    body = res.json()

    assert body["tenant_id"]
    assert body.get("access_token"), (
        "registration returned no credential — the next step in the signup "
        "flow is a checkout call behind router-level auth, so this is the "
        "difference between a working signup and no signup at all"
    )
    assert body.get("token_type") == "bearer"
    assert body.get("expires_in")


async def test_the_returned_token_actually_authenticates(client):
    """
    A token that does not work is worse than none: the flow would fail one step
    later with a less obvious error.
    """
    res = await client.post(
        "/api/v1/auth/register",
        json={**SIGNUP, "email": "second@newpaving.example"},
    )
    token = res.json()["access_token"]

    checkout = await client.post(
        "/api/v1/billing/checkout",
        headers={"Authorization": f"Bearer {token}"},
        json={"tenant_id": res.json()["tenant_id"], "plan": "pro"},
    )
    assert checkout.status_code not in (401, 403), (
        f"the token registration issued was rejected by the very next call in "
        f"the flow ({checkout.status_code}): {checkout.text[:200]}"
    )


async def test_the_token_carries_the_new_tenant(client):
    """
    Billing pins the caller to their own tenant, so a token without the right
    tenant_id claim would authenticate and then be refused authorization.
    """
    from jose import jwt

    from app.core import jwt_secrets

    res = await client.post(
        "/api/v1/auth/register",
        json={**SIGNUP, "email": "third@newpaving.example"},
    )
    body = res.json()
    claims = jwt.decode(
        body["access_token"],
        jwt_secrets.platform_secret(),
        algorithms=[jwt_secrets.ALGORITHM],
    )
    assert claims["tenant_id"] == body["tenant_id"]
    assert claims["sub"] == "third@newpaving.example"
