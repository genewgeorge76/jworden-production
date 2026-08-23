"""
The operator's own sign-in account.

The operator signs in the same way a subscriber does — email and password at
POST /api/v1/auth/login — and what separates them is the tenant on their user
row, not the credential type. tenancy.is_owner() is true only for the
operator's bucket, and /auth/register mints `secrets.token_urlsafe(12)` for
each new customer, so a subscriber can never reach it by signing up.

That leaves one problem: nothing can create the operator's row. Registration
always mints a fresh tenant, so signing up cannot produce an owner account, and
an endpoint that could would be a privilege-escalation endpoint. So the account
is seeded from the environment, alongside every other deployment secret:

    OWNER_EMAIL       the address the operator signs in with
    OWNER_PASSWORD    the password for it

Both are read at startup. The row is created if absent and its password is
re-hashed whenever OWNER_PASSWORD changes, so rotating the secret rotates the
login — there is no separate "change password" path to secure.

Nothing here logs either value.
"""

from __future__ import annotations

import logging
import os

import bcrypt
from sqlalchemy.orm import Session

from ..models import User
from .tenancy import OWNER_TENANT

logger = logging.getLogger(__name__)

OWNER_EMAIL_VAR = "OWNER_EMAIL"
OWNER_PASSWORD_VAR = "OWNER_PASSWORD"

# The operator's role, distinct from the "admin" that /auth/register stamps on
# every self-serve signup. Role is the within-tenant distinction; it is not what
# makes someone the owner.
OWNER_ROLE = "system_admin"

MIN_OWNER_PASSWORD_LENGTH = 12


class OwnerAccountNotConfigured(RuntimeError):
    """Raised when the operator's credentials are absent from the environment."""


def configured() -> bool:
    return bool(
        os.getenv(OWNER_EMAIL_VAR, "").strip()
        and os.getenv(OWNER_PASSWORD_VAR, "").strip()
    )


def _password_matches(hashed: str, password: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        # A hash this bcrypt build cannot read is not a match, and is a reason
        # to rewrite it rather than to crash the boot.
        return False


def ensure_owner_account(db: Session) -> str | None:
    """
    Create or refresh the operator's login from the environment.

    Returns the email that was seeded, or None when nothing is configured.
    Idempotent: safe to run on every boot and on every instance.
    """
    email = os.getenv(OWNER_EMAIL_VAR, "").strip().lower()
    password = os.getenv(OWNER_PASSWORD_VAR, "")

    if not email or not password:
        return None

    if len(password) < MIN_OWNER_PASSWORD_LENGTH:
        # Refuse rather than seed a weak owner login. This account holds the
        # whole platform; a short password on it is worse than no account,
        # because no account at least cannot be guessed into.
        raise OwnerAccountNotConfigured(
            f"{OWNER_PASSWORD_VAR} must be at least "
            f"{MIN_OWNER_PASSWORD_LENGTH} characters."
        )

    user = db.query(User).filter(User.email == email).first()

    if user is None:
        db.add(
            User(
                tenant_id=OWNER_TENANT,
                email=email,
                hashed_password=bcrypt.hashpw(
                    password.encode("utf-8"), bcrypt.gensalt()
                ).decode("utf-8"),
                full_name="Operator",
                role=OWNER_ROLE,
                is_active=1,
            )
        )
        db.commit()
        logger.info("Seeded operator account for %s (tenant=%s).", email, OWNER_TENANT)
        return email

    changed = False

    # An existing row under a customer tenant must not be silently promoted:
    # that would turn "the operator reused an address he signed up with" into a
    # tenant takeover. Refuse and say so.
    if user.tenant_id != OWNER_TENANT:
        raise OwnerAccountNotConfigured(
            f"{OWNER_EMAIL_VAR} is already registered to tenant "
            f"{user.tenant_id!r}. Use an address that is not a customer account."
        )

    if not _password_matches(user.hashed_password, password):
        user.hashed_password = bcrypt.hashpw(
            password.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")
        changed = True
        logger.info("Operator password rotated from %s.", OWNER_PASSWORD_VAR)

    if user.role != OWNER_ROLE:
        user.role = OWNER_ROLE
        changed = True

    if not user.is_active:
        user.is_active = 1
        changed = True

    if changed:
        db.commit()

    return email


def ensure_owner_account_with_session() -> str | None:
    """
    ensure_owner_account() against a session of its own.

    Startup runs outside a request, so there is no injected session to reuse.
    The session is closed here rather than left to the garbage collector, so a
    boot that fails to seed does not also leak a connection out of the pool.
    """
    from ..database import SessionLocal  # noqa: PLC0415

    db = SessionLocal()
    try:
        return ensure_owner_account(db)
    finally:
        db.close()
