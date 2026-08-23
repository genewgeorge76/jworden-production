"""
A plan you ticked is not a plan you paid for.

/auth/register wrote subscription_tier straight from the signup form and
nothing verified it against Stripe. The Stripe webhook's
checkout.session.completed handler recorded the customer and subscription ids
but never granted a tier — because the tier had already been granted by the
form. subscription_status was written once as "pending" and read by nothing.

So the entitlement check in factory.py (`subscription_tier == "lite"`) was
asking "which box did they tick", not "what did they pay for": register with
plan "max", abandon checkout, keep every paid feature forever.
"""

import pytest

from app.services import entitlements


def _signup(plan: str, email: str) -> dict:
    return {
        "companyName": "Free Rider Paving",
        "email": email,
        "password": "a-real-password-here",
        "plan": plan,
        "industry": "Asphalt Paving",
        "state": "VA",
        "city": "Roanoke",
    }


@pytest.mark.anyio
async def test_registering_as_max_does_not_grant_max(client, app_modules):
    _, dbmod = app_modules

    response = await client.post(
        "/api/v1/auth/register", json=_signup("max", "freerider@example.test.example")
    )
    assert response.status_code == 200, response.text
    tenant_id = response.json()["tenant_id"]

    from app.models import Tenant

    session = dbmod.SessionLocal()
    try:
        tenant = session.query(Tenant).filter(Tenant.tenant_id == tenant_id).one()
        assert tenant.subscription_tier == "lite"
        assert tenant.subscription_status == "pending"
    finally:
        session.close()


@pytest.mark.anyio
async def test_unpaid_signup_cannot_use_a_pro_feature(client):
    """The whole point: the free rider is refused at the door."""
    registration = await client.post(
        "/api/v1/auth/register", json=_signup("max", "gate@example.test.example")
    )
    token = registration.json()["access_token"]

    response = await client.post(
        "/api/v1/factory/sites",
        headers={"Authorization": f"Bearer {token}"},
        json={"hostname": "freeloader.example", "city_target": "Roanoke", "state": "VA"},
    )
    assert response.status_code in (402, 403), response.text


def test_a_pending_max_tenant_is_entitled_to_nothing_above_lite():
    from app.models import Tenant

    tenant = Tenant(
        tenant_id="t", company_name="c", subscription_tier="max",
        subscription_status="pending", is_active=1,
    )
    assert entitlements.is_entitled(tenant, "lite") is True
    assert entitlements.is_entitled(tenant, "pro") is False
    assert entitlements.is_entitled(tenant, "max") is False


def test_an_active_pro_tenant_gets_pro_and_not_max():
    from app.models import Tenant

    tenant = Tenant(
        tenant_id="t", company_name="c", subscription_tier="pro",
        subscription_status="active", is_active=1,
    )
    assert entitlements.is_entitled(tenant, "pro") is True
    assert entitlements.is_entitled(tenant, "max") is False


def test_a_canceled_tenant_loses_paid_access():
    from app.models import Tenant

    tenant = Tenant(
        tenant_id="t", company_name="c", subscription_tier="pro",
        subscription_status="canceled", is_active=1,
    )
    assert entitlements.is_entitled(tenant, "pro") is False


def test_past_due_keeps_access_during_stripe_retries():
    """
    A renewal charge failed and Stripe is still retrying — an expired card on a
    long-paying customer. Cutting off their dispatch board that morning is
    worse for the business than a few days of grace, and Stripe sends
    subscription.deleted once retries are exhausted.
    """
    from app.models import Tenant

    tenant = Tenant(
        tenant_id="t", company_name="c", subscription_tier="pro",
        subscription_status="past_due", is_active=1,
    )
    assert entitlements.is_entitled(tenant, "pro") is True


def test_the_operator_is_entitled_without_a_tenants_row(app_modules):
    """
    The previous inline check was `if not tenant or tier == "lite"`. The
    operator's tenant_id is JWORDEN_HQ and there is no tenants row for it, so
    `not tenant` was true and he was refused his own Pro features.
    """
    _, dbmod = app_modules
    session = dbmod.SessionLocal()
    try:
        # Does not raise.
        entitlements.require_tier(session, "JWORDEN_HQ", "max", "the factory")
    finally:
        session.close()


def test_price_ids_map_back_to_the_tier_that_sells_them(monkeypatch):
    import importlib

    monkeypatch.setenv("STRIPE_PRICE_PRO", "price_live_pro_123")
    reloaded = importlib.reload(entitlements)
    try:
        assert reloaded.tier_for_price_id("price_live_pro_123") == "pro"
        assert reloaded.tier_for_price_id("price_someone_elses") is None
        assert reloaded.tier_for_price_id(None) is None
    finally:
        importlib.reload(entitlements)


def test_an_unknown_tier_string_falls_back_to_lite():
    """A tier column holding junk must not read as more than the floor."""
    assert entitlements.normalize_tier("enterprise") == "lite"
    assert entitlements.normalize_tier(None) == "lite"
    assert entitlements.normalize_tier("  PRO ") == "pro"


@pytest.mark.anyio
async def test_the_content_engine_refuses_when_no_provider_is_configured(
    client, auth_headers, app_modules
):
    """
    No API keys are set here, which is the same state a fresh deployment is in.

    The old generator did not care: it never called a model at all. It f-strung
    one sentence — "This is a highly optimized post about {topic}..." — and
    saved it with status="published", live on the customer's domain. So an
    unconfigured deployment published filler and looked healthy doing it.

    Unconfigured now means refused, and nothing is written.
    """
    _, dbmod = app_modules

    from app.models import BlogPost, MarketSite

    session = dbmod.SessionLocal()
    try:
        session.add(
            MarketSite(
                # JWORDEN_HQ, not "default": the site lookup in this endpoint
                # compares site.tenant_id to the caller's tenant literally,
                # without the owner-bucket equivalence in services/tenancy.py.
                tenant_id="JWORDEN_HQ",
                hostname="unconfigured.example",
                city_target="Roanoke",
            )
        )
        session.commit()
        posts_before = session.query(BlogPost).count()
    finally:
        session.close()

    response = await client.post(
        "/api/v1/factory/blog/generate",
        headers=auth_headers,
        json={
            "hostname": "unconfigured.example",
            "topic": "sealcoating",
            "keywords": ["seal"],
        },
    )
    assert response.status_code == 502, response.text
    assert "nothing was saved" in response.json()["detail"].lower()

    session = dbmod.SessionLocal()
    try:
        assert session.query(BlogPost).count() == posts_before
    finally:
        session.close()


def test_checkout_completion_grants_the_tier_that_was_paid_for(app_modules, monkeypatch):
    """
    The handler used to record the Stripe ids and stop, so paying for a
    subscription changed nothing about what the tenant could use.
    """
    _, dbmod = app_modules
    from app.models import Tenant
    from app.webhooks import stripe_webhook

    session = dbmod.SessionLocal()
    try:
        session.add(
            Tenant(
                tenant_id="paid-tenant",
                company_name="Paid Paving",
                subscription_tier="lite",
                subscription_status="pending",
                is_active=1,
            )
        )
        session.commit()

        tier = stripe_webhook._tier_from_session(
            {"metadata": {"tenant_id": "paid-tenant", "plan": "pro"}}
        )
        assert tier == "pro"

        tenant = session.query(Tenant).filter(Tenant.tenant_id == "paid-tenant").one()
        entitlements.apply_paid_tier(tenant, tier)
        session.commit()

        assert tenant.subscription_tier == "pro"
        assert tenant.subscription_status == "active"
        assert entitlements.is_entitled(tenant, "pro") is True
    finally:
        session.close()


def test_the_charged_price_beats_the_requested_plan():
    """
    Metadata is what this server asked Stripe for; the line item is what Stripe
    billed. When they disagree, the money is the truth.
    """
    from app.webhooks import stripe_webhook

    tier = stripe_webhook._tier_from_session(
        {
            "metadata": {"tenant_id": "t", "plan": "max"},
            "line_items": {"data": [{"price": {"id": entitlements.PRICE_MAP["pro"]}}]},
        }
    )
    assert tier == "pro"


def test_a_downgrade_through_the_billing_portal_takes_effect():
    """
    This branch carried the comment "a real implementation would map the new
    price ID to 'pro', 'max', etc." — so a downgrade left the tenant on the
    tier they had stopped paying for.
    """
    from app.webhooks import stripe_webhook

    subscription = {
        "id": "sub_1",
        "status": "active",
        "items": {"data": [{"price": {"id": entitlements.PRICE_MAP["lite"]}}]},
    }
    assert stripe_webhook._tier_from_subscription(subscription) == "lite"


# ── Features that existed, were live, and were not gated ────────────────────
#
# Both of these are named on the published price list and both were reachable
# by any signed-in tenant. Authentication proves you are a customer; it does
# not prove you bought the thing.

@pytest.mark.anyio
async def test_supply_chain_pricing_needs_the_max_plan(client):
    """MAX line: "Supply Chain Pricing API"."""
    registration = await client.post(
        "/api/v1/auth/register", json=_signup("max", "commodities@example.test.example")
    )
    token = registration.json()["access_token"]

    for path in ("/api/v1/materials/commodities", "/api/v1/materials/price-index"):
        response = await client.get(path, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code in (402, 403), f"{path} -> {response.status_code}"


@pytest.mark.anyio
async def test_advanced_telemetry_needs_the_pro_plan(client):
    """PRO line: "Advanced Telemetry"."""
    registration = await client.post(
        "/api/v1/auth/register", json=_signup("pro", "telemetry@example.test.example")
    )
    token = registration.json()["access_token"]

    response = await client.get(
        "/api/v1/telematics/live", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code in (402, 403), response.text


@pytest.mark.anyio
async def test_the_operator_still_reaches_both(client, auth_headers):
    """
    require_tier() passes the operator unconditionally. He has no tenants row,
    so a naive check refuses him — which is what the old inline gate did.
    """
    commodities = await client.get("/api/v1/materials/commodities", headers=auth_headers)
    assert commodities.status_code == 200, commodities.text

    telemetry = await client.get("/api/v1/telematics/live", headers=auth_headers)
    assert telemetry.status_code == 200, telemetry.text


@pytest.mark.anyio
async def test_a_paid_max_tenant_reaches_the_commodity_feed(client, app_modules):
    _, dbmod = app_modules
    from app.models import Tenant

    registration = await client.post(
        "/api/v1/auth/register", json=_signup("max", "paidmax@example.test.example")
    )
    token = registration.json()["access_token"]
    tenant_id = registration.json()["tenant_id"]

    # What the Stripe webhook does on checkout.session.completed.
    session = dbmod.SessionLocal()
    try:
        tenant = session.query(Tenant).filter(Tenant.tenant_id == tenant_id).one()
        entitlements.apply_paid_tier(tenant, "max")
        session.commit()
    finally:
        session.close()

    response = await client.get(
        "/api/v1/materials/commodities", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200, response.text
