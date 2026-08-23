"""
Jarvis can reach every endpoint — and cannot reach past the checks on them.

The platform has around two hundred endpoints and Jarvis had thirteen tools, so
nearly everything built was unreachable from the assistant. Declaring two
hundred tools is not the fix: model quality falls off well below that, and every
schema costs context on every turn. Two tools instead — one to discover, one to
call.

The risk in that design is obvious and is what these tests are for. A dispatcher
that reaches into the services beneath the API would have to reimplement every
authorization rule, and the first one forgotten is a data leak with an AI in
front of it. So it calls the app over its own ASGI transport with a token
carrying the CALLER's tenant and role, and every existing check applies
unchanged.
"""

import pytest

from app.services import jarvis, jarvis_platform


OWNER = "JWORDEN_HQ"
CUSTOMER = "some-customer-tenant"


# ── Discovery ───────────────────────────────────────────────────────────────

def test_the_catalogue_is_read_from_the_live_schema():
    """Not a hand-kept list — that is how the prompt came to claim 162 engines."""
    result = jarvis_platform.catalogue(tenant_id=OWNER, search="materials")
    assert result["ok"] is True
    assert any(e["path"].startswith("/api/v1/materials") for e in result["endpoints"])


def test_the_catalogue_covers_the_ferraris():
    """The endpoints that existed with nothing calling them are now findable."""
    for term in ("leads", "customers", "weather", "telematics", "estimate"):
        result = jarvis_platform.catalogue(tenant_id=OWNER, search=term)
        assert result["total_matching"] > 0, f"nothing findable for {term!r}"


def test_writes_are_flagged_in_the_catalogue():
    # Searched rather than taken off the top of an unfiltered list: the
    # catalogue sorts reads first deliberately, so the first hundred entries
    # are all GETs.
    result = jarvis_platform.catalogue(tenant_id=OWNER, search="factory", limit=100)
    writes = [e for e in result["endpoints"] if e["writes"]]
    assert writes, "no write endpoints surfaced for 'factory'"
    assert all(e["method"] != "GET" for e in writes)
    assert all(
        e["writes"] is (e["method"] != "GET") for e in result["endpoints"]
    )


def test_a_customer_is_not_offered_operator_endpoints():
    """
    The endpoints refuse a customer themselves. Hiding them stops Jarvis
    offering something it will then be refused on.
    """
    result = jarvis_platform.catalogue(tenant_id=CUSTOMER, limit=100, search="admin")
    assert all(
        not e["path"].startswith(("/api/v1/superadmin", "/api/v1/admin"))
        for e in result["endpoints"]
    )


def test_token_issuance_is_never_listed():
    """An assistant that can mint itself a token has no permission model."""
    result = jarvis_platform.catalogue(tenant_id=OWNER, limit=100, search="auth")
    assert all(not e["path"].startswith("/api/v1/auth/") for e in result["endpoints"])


# ── The refusals ────────────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_minting_a_token_is_refused_even_for_the_operator(app_modules):
    result = await jarvis_platform.call(
        method="POST", path="/api/v1/auth/token", tenant_id=OWNER,
        role=jarvis.ROLE_OWNER_ROOT, confirmed=True,
    )
    assert result["ok"] is False
    assert "not callable from Jarvis" in result["error"]


@pytest.mark.anyio
async def test_forging_a_provider_webhook_is_refused(app_modules):
    """Webhooks trust a provider signature; calling one internally forges it."""
    result = await jarvis_platform.call(
        method="POST", path="/api/v1/webhooks/stripe", tenant_id=OWNER,
        role=jarvis.ROLE_OWNER_ROOT, confirmed=True,
    )
    assert result["ok"] is False


@pytest.mark.anyio
async def test_a_write_without_confirmation_is_refused(app_modules):
    result = await jarvis_platform.call(
        method="POST", path="/api/v1/factory/sites", tenant_id=OWNER,
        role=jarvis.ROLE_OWNER_ROOT, confirmed=False,
    )
    assert result["ok"] is False
    assert result["requires_confirmation"] is True


@pytest.mark.anyio
async def test_a_customer_cannot_reach_operator_endpoints(app_modules):
    result = await jarvis_platform.call(
        method="GET", path="/api/v1/superadmin/tenants", tenant_id=CUSTOMER,
        role=jarvis.ROLE_STAFF_OPERATOR,
    )
    assert result["ok"] is False


# ── Authorization is not bypassed ───────────────────────────────────────────

@pytest.mark.anyio
async def test_a_read_runs_and_returns_real_data(app_modules):
    result = await jarvis_platform.call(
        method="GET", path="/api/v1/auth/status", tenant_id=OWNER,
        role=jarvis.ROLE_OWNER_ROOT,
    )
    # /auth/ is forbidden, so this proves the denylist wins over a valid read.
    assert result["ok"] is False

    allowed = await jarvis_platform.call(
        method="GET", path="/api/v1/materials/commodities", tenant_id=OWNER,
        role=jarvis.ROLE_OWNER_ROOT,
    )
    assert allowed["status"] == 200, allowed


@pytest.mark.anyio
async def test_the_tier_gate_still_applies_through_jarvis(client, app_modules):
    """
    The point of the whole design. A LITE customer asking Jarvis for the
    MAX-tier commodity feed gets the same refusal they would get with curl —
    because the call goes through the same endpoint, not around it.
    """
    _, dbmod = app_modules

    registration = await client.post(
        "/api/v1/auth/register",
        json={
            "companyName": "Lite Paving", "email": "lite@blueridgesealcoating.example",
            "password": "a-real-password-here", "plan": "max",
            "industry": "Asphalt Paving", "state": "VA", "city": "Roanoke",
        },
    )
    tenant_id = registration.json()["tenant_id"]

    result = await jarvis_platform.call(
        method="GET", path="/api/v1/materials/commodities",
        tenant_id=tenant_id, role=jarvis.ROLE_STAFF_OPERATOR,
    )
    assert result["ok"] is False
    assert result["status"] in (402, 403), result


@pytest.mark.anyio
async def test_a_refusal_is_relayed_not_papered_over(app_modules):
    """
    A 402 saying "upgrade to MAX" is the honest answer. Jarvis relaying it is
    better than Jarvis inventing the data the endpoint declined to give.
    """
    result = await jarvis_platform.call(
        method="GET", path="/api/v1/materials/commodities",
        tenant_id="an-unpaid-tenant", role=jarvis.ROLE_STAFF_OPERATOR,
    )
    assert result["ok"] is False
    assert "error" in result
    assert result["data"]  # the endpoint's own words came back


@pytest.mark.anyio
async def test_the_internal_token_carries_the_caller_not_jarvis(app_modules):
    """Jarvis has no identity here and cannot acquire one."""
    from jose import jwt

    from app.core import jwt_secrets

    token = jarvis_platform._internal_token(CUSTOMER, jarvis.ROLE_STAFF_OPERATOR)
    claims = jwt.decode(token, jwt_secrets.platform_secret(), algorithms=["HS256"])

    assert claims["tenant_id"] == CUSTOMER
    assert claims["role"] == jarvis.ROLE_STAFF_OPERATOR
    assert claims["exp"] - claims["iat"] <= jarvis_platform._INTERNAL_TOKEN_SECONDS


@pytest.mark.anyio
async def test_the_public_concierge_has_no_platform_access():
    for tool in ("call_platform", "list_platform_capabilities"):
        assert tool not in jarvis._ROLE_TOOLS[jarvis.ROLE_PUBLIC_CONCIERGE]

    blocked = await jarvis._run_tool(
        "call_platform", {"path": "/api/v1/materials/commodities"},
        role=jarvis.ROLE_PUBLIC_CONCIERGE,
    )
    assert blocked["ok"] is False
    assert "Role policy" in blocked["error"]
