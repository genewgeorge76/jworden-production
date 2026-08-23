"""
An unconfigured billing system must not report a sale.

/billing/checkout returned this whenever STRIPE_SECRET_KEY was unset:

    {"url": "https://thewordenstandard.com/?checkout_session=simulated_pro
             &status=success", "simulated": true}

The signup flow follows that URL. So a customer completed signup, was redirected
to a page whose query string said success, and had bought nothing. The same
fabricated URL was also returned from the `except Exception` handler, which
turned a genuine Stripe rejection into an apparent subscription.

It matters more now than it did: the tier is granted by the Stripe webhook
rather than by the signup form, so a fake success means the webhook never fires
and the customer sits on lite forever with no error anywhere explaining why.
"""

import pytest


SIGNUP = {
    "companyName": "Checkout Paving",
    "email": "checkout@thewordenstandard.example",
    "password": "a-real-password-here",
    "plan": "pro",
    "industry": "Asphalt Paving",
    "state": "VA",
    "city": "Roanoke",
}


@pytest.mark.anyio
async def test_unconfigured_stripe_refuses_instead_of_faking_a_sale(
    client, monkeypatch
):
    monkeypatch.delenv("STRIPE_SECRET_KEY", raising=False)

    registration = await client.post("/api/v1/auth/register", json=SIGNUP)
    token = registration.json()["access_token"]

    response = await client.post(
        "/api/v1/billing/checkout",
        headers={"Authorization": f"Bearer {token}"},
        json={"tenant_id": registration.json()["tenant_id"], "plan": "pro"},
    )

    assert response.status_code == 503, response.text
    detail = response.json()["detail"]
    assert "STRIPE_SECRET_KEY" in detail
    # The account still exists and the person is still signed in; only the
    # part that takes money failed, and the message says so.
    assert "signed in" in detail.lower()

    # Nothing that looks like a completed purchase.
    assert "status=success" not in response.text
    assert "simulated" not in response.text.lower()


@pytest.mark.anyio
async def test_a_mock_key_counts_as_unconfigured(client, monkeypatch):
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_mock_placeholder")

    registration = await client.post(
        "/api/v1/auth/register", json={**SIGNUP, "email": "mock@thewordenstandard.example"}
    )
    token = registration.json()["access_token"]

    response = await client.post(
        "/api/v1/billing/checkout",
        headers={"Authorization": f"Bearer {token}"},
        json={"tenant_id": registration.json()["tenant_id"], "plan": "pro"},
    )
    assert response.status_code == 503


@pytest.mark.anyio
async def test_a_real_key_with_placeholder_price_ids_is_refused(client, monkeypatch):
    """
    A real key against a price id that does not exist would create a session
    Stripe cannot bill, and the webhook could not map the payment to a plan.
    """
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_live_not_a_mock_value")

    registration = await client.post(
        "/api/v1/auth/register", json={**SIGNUP, "email": "prices@thewordenstandard.example"}
    )
    token = registration.json()["access_token"]

    response = await client.post(
        "/api/v1/billing/checkout",
        headers={"Authorization": f"Bearer {token}"},
        json={"tenant_id": registration.json()["tenant_id"], "plan": "pro"},
    )
    assert response.status_code == 503, response.text
    assert "STRIPE_PRICE_PRO" in response.json()["detail"]
