"""
"My login didn't work" has to be answerable.

A failed owner login and a non-existent owner account return the same 401, on
purpose — distinguishing them would tell an attacker which addresses are
registered. That also made a real failure impossible to diagnose from outside
the deployment, so the first attempt at this ended in guesswork about which of
four causes it was.
"""

import pytest

from app.services import owner_account


EMAIL = "operator@thewordenstandard.example"
GOOD_PASSWORD = "a-long-operator-password"


@pytest.fixture()
def db_session(app_modules):
    _, dbmod = app_modules
    session = dbmod.SessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_nothing_configured(db_session, monkeypatch):
    monkeypatch.delenv(owner_account.OWNER_EMAIL_VAR, raising=False)
    monkeypatch.delenv(owner_account.OWNER_PASSWORD_VAR, raising=False)
    state = owner_account.status(db_session)
    assert state["ready"] is False
    assert state["reason"] == owner_account.NOT_CONFIGURED


def test_password_too_short_is_named(db_session, monkeypatch):
    """The most likely cause of a first failed attempt, and previously silent."""
    monkeypatch.setenv(owner_account.OWNER_EMAIL_VAR, EMAIL)
    monkeypatch.setenv(owner_account.OWNER_PASSWORD_VAR, "short")
    state = owner_account.status(db_session)
    assert state["reason"] == owner_account.PASSWORD_TOO_SHORT
    assert str(owner_account.MIN_OWNER_PASSWORD_LENGTH) in state["detail"]


def test_configured_but_never_seeded(db_session, monkeypatch):
    monkeypatch.setenv(owner_account.OWNER_EMAIL_VAR, EMAIL)
    monkeypatch.setenv(owner_account.OWNER_PASSWORD_VAR, GOOD_PASSWORD)
    assert owner_account.status(db_session)["reason"] == owner_account.NOT_SEEDED


def test_address_already_belongs_to_a_customer(db_session, monkeypatch):
    from app.models import User

    db_session.add(
        User(tenant_id="a-customer", email=EMAIL, hashed_password="x", role="admin", is_active=1)
    )
    db_session.commit()

    monkeypatch.setenv(owner_account.OWNER_EMAIL_VAR, EMAIL)
    monkeypatch.setenv(owner_account.OWNER_PASSWORD_VAR, GOOD_PASSWORD)
    assert owner_account.status(db_session)["reason"] == owner_account.BELONGS_TO_CUSTOMER


def test_secret_changed_but_app_not_restarted(db_session, monkeypatch):
    monkeypatch.setenv(owner_account.OWNER_EMAIL_VAR, EMAIL)
    monkeypatch.setenv(owner_account.OWNER_PASSWORD_VAR, GOOD_PASSWORD)
    owner_account.ensure_owner_account(db_session)

    monkeypatch.setenv(owner_account.OWNER_PASSWORD_VAR, "a-different-long-password")
    assert owner_account.status(db_session)["reason"] == owner_account.PASSWORD_MISMATCH


def test_ready(db_session, monkeypatch):
    monkeypatch.setenv(owner_account.OWNER_EMAIL_VAR, EMAIL)
    monkeypatch.setenv(owner_account.OWNER_PASSWORD_VAR, GOOD_PASSWORD)
    owner_account.ensure_owner_account(db_session)
    state = owner_account.status(db_session)
    assert state["ready"] is True
    assert state["reason"] == owner_account.READY


def test_the_status_never_returns_the_email_or_password(db_session, monkeypatch):
    monkeypatch.setenv(owner_account.OWNER_EMAIL_VAR, EMAIL)
    monkeypatch.setenv(owner_account.OWNER_PASSWORD_VAR, GOOD_PASSWORD)
    blob = repr(owner_account.status(db_session))
    assert EMAIL not in blob
    assert GOOD_PASSWORD not in blob


@pytest.mark.anyio
async def test_public_status_hides_the_specific_reason(client, monkeypatch):
    """
    A short password is a real hint to anyone who can read it, so the public
    endpoint reports only that something is misconfigured.
    """
    monkeypatch.setenv(owner_account.OWNER_EMAIL_VAR, EMAIL)
    monkeypatch.setenv(owner_account.OWNER_PASSWORD_VAR, "short")

    response = await client.get("/api/v1/auth/status")
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["owner_account_ready"] is False
    assert body["owner_account_reason"] == "misconfigured"


@pytest.mark.anyio
async def test_the_operator_gets_the_specific_reason(client, auth_headers, monkeypatch):
    monkeypatch.setenv(owner_account.OWNER_EMAIL_VAR, EMAIL)
    monkeypatch.setenv(owner_account.OWNER_PASSWORD_VAR, "short")

    response = await client.get("/api/v1/auth/owner-account", headers=auth_headers)
    assert response.status_code == 200, response.text
    assert response.json()["reason"] == owner_account.PASSWORD_TOO_SHORT


@pytest.mark.anyio
async def test_a_customer_cannot_read_the_operator_diagnostic(client):
    registration = await client.post(
        "/api/v1/auth/register",
        json={
            "companyName": "Nosy Paving",
            "email": "nosy@thewordenstandard.example",
            "password": "a-real-password-here",
            "plan": "pro",
            "industry": "Asphalt Paving",
            "state": "VA",
            "city": "Roanoke",
        },
    )
    token = registration.json()["access_token"]
    response = await client.get(
        "/api/v1/auth/owner-account", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 403
