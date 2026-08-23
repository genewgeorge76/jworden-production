"""
The operator signs in the way his customers do.

There used to be exactly one operator credential — the admin PIN — and the SPA
treated getting past it as proof of being an admin. Email and password is the
single sign-in shape now; what separates the operator from a subscriber is the
tenant on his user row, which only the environment can set.
"""

import pytest

from app.services import owner_account
from app.services.tenancy import OWNER_TENANT, is_owner


OWNER_EMAIL = "gene@thewordenstandard.example"
OWNER_PASSWORD = "a-long-operator-password"


@pytest.fixture()
def db_session(app_modules):
    _, dbmod = app_modules
    session = dbmod.SessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_no_owner_account_without_the_environment(db_session, monkeypatch):
    monkeypatch.delenv(owner_account.OWNER_EMAIL_VAR, raising=False)
    monkeypatch.delenv(owner_account.OWNER_PASSWORD_VAR, raising=False)
    assert owner_account.ensure_owner_account(db_session) is None


def test_seeded_account_lands_in_the_owner_bucket(db_session, monkeypatch):
    monkeypatch.setenv(owner_account.OWNER_EMAIL_VAR, OWNER_EMAIL)
    monkeypatch.setenv(owner_account.OWNER_PASSWORD_VAR, OWNER_PASSWORD)

    assert owner_account.ensure_owner_account(db_session) == OWNER_EMAIL

    from app.models import User

    row = db_session.query(User).filter(User.email == OWNER_EMAIL).one()
    assert row.tenant_id == OWNER_TENANT
    assert is_owner(row.tenant_id)


def test_seeding_is_idempotent(db_session, monkeypatch):
    monkeypatch.setenv(owner_account.OWNER_EMAIL_VAR, OWNER_EMAIL)
    monkeypatch.setenv(owner_account.OWNER_PASSWORD_VAR, OWNER_PASSWORD)

    from app.models import User

    owner_account.ensure_owner_account(db_session)
    owner_account.ensure_owner_account(db_session)
    owner_account.ensure_owner_account(db_session)

    assert db_session.query(User).filter(User.email == OWNER_EMAIL).count() == 1


def test_rotating_the_secret_rotates_the_password(db_session, monkeypatch):
    monkeypatch.setenv(owner_account.OWNER_EMAIL_VAR, OWNER_EMAIL)
    monkeypatch.setenv(owner_account.OWNER_PASSWORD_VAR, OWNER_PASSWORD)
    owner_account.ensure_owner_account(db_session)

    from app.models import User

    first = db_session.query(User).filter(User.email == OWNER_EMAIL).one().hashed_password

    monkeypatch.setenv(owner_account.OWNER_PASSWORD_VAR, "an-entirely-different-password")
    owner_account.ensure_owner_account(db_session)
    db_session.expire_all()

    second = db_session.query(User).filter(User.email == OWNER_EMAIL).one().hashed_password
    assert second != first
    assert owner_account._password_matches(second, "an-entirely-different-password")


def test_a_short_owner_password_is_refused(db_session, monkeypatch):
    monkeypatch.setenv(owner_account.OWNER_EMAIL_VAR, OWNER_EMAIL)
    monkeypatch.setenv(owner_account.OWNER_PASSWORD_VAR, "short")

    with pytest.raises(owner_account.OwnerAccountNotConfigured):
        owner_account.ensure_owner_account(db_session)


def test_an_existing_customer_address_is_not_promoted(db_session, monkeypatch):
    """
    Seeding must never turn a customer's account into the operator's. If the
    address is already registered under a customer tenant, refuse — a silent
    promotion here would be a tenant takeover performed by a config change.
    """
    from app.models import User

    db_session.add(
        User(
            tenant_id="some-customer-tenant",
            email=OWNER_EMAIL,
            hashed_password="x",
            role="admin",
            is_active=1,
        )
    )
    db_session.commit()

    monkeypatch.setenv(owner_account.OWNER_EMAIL_VAR, OWNER_EMAIL)
    monkeypatch.setenv(owner_account.OWNER_PASSWORD_VAR, OWNER_PASSWORD)

    with pytest.raises(owner_account.OwnerAccountNotConfigured):
        owner_account.ensure_owner_account(db_session)

    db_session.expire_all()
    assert (
        db_session.query(User).filter(User.email == OWNER_EMAIL).one().tenant_id
        == "some-customer-tenant"
    )


@pytest.mark.anyio
async def test_owner_signs_in_and_me_reports_the_owner(client, app_modules, monkeypatch):
    """End to end: seed, POST /auth/login, GET /auth/me says is_owner."""
    _, dbmod = app_modules
    monkeypatch.setenv(owner_account.OWNER_EMAIL_VAR, OWNER_EMAIL)
    monkeypatch.setenv(owner_account.OWNER_PASSWORD_VAR, OWNER_PASSWORD)

    session = dbmod.SessionLocal()
    try:
        owner_account.ensure_owner_account(session)
    finally:
        session.close()

    login = await client.post(
        "/api/v1/auth/login",
        # Typed with a capital, the way a phone keyboard offers it.
        json={"email": OWNER_EMAIL.capitalize(), "password": OWNER_PASSWORD},
    )
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]

    me = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200, me.text
    identity = me.json()
    assert identity["is_owner"] is True
    assert identity["tenant_id"] == OWNER_TENANT
    assert identity["role"] == "system_admin"


@pytest.mark.anyio
async def test_a_deactivated_user_cannot_sign_in(client, app_modules):
    """is_active was never consulted, so deactivating an account did nothing."""
    _, dbmod = app_modules

    registration = await client.post(
        "/api/v1/auth/register",
        json={
            "companyName": "Deactivated Paving",
            "email": "gone@deactivated.example",
            "password": "still-a-real-password",
            "plan": "lite",
            "industry": "Asphalt Paving",
            "state": "VA",
            "city": "Roanoke",
        },
    )
    assert registration.status_code == 200, registration.text

    from app.models import User

    session = dbmod.SessionLocal()
    try:
        row = session.query(User).filter(User.email == "gone@deactivated.example").one()
        row.is_active = 0
        session.commit()
    finally:
        session.close()

    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "gone@deactivated.example", "password": "still-a-real-password"},
    )
    assert login.status_code == 401
