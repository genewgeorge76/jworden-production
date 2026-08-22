"""
jwt_secrets.py — the single authority for what signs and verifies our tokens.

WHY THIS MODULE EXISTS.

Four places resolved the HS256 signing secret, each with a different order,
and two of them ended in a string literal committed to this repository:

    core/security.py   JWT_SECRET_KEY → JWORDEN_JWT_SECRET → JWORDEN_MASTER_KEY
                       → "fallback_secret"
    routers/auth.py    JWORDEN_JWT_SECRET → JWORDEN_MASTER_KEY → "fallback_secret"
    routers/chat.py    JWT_SECRET_KEY only
    routers/websocket_events.py
                       JWT_SECRET_KEY only
    services/staff_auth.py
                       STAFF_JWT_SECRET → "CHANGE_ME_staff_jwt_secret_not_for_prod"

Two separate failures came out of that, and both were live.

1. A PUBLISHED SECRET CAN SIGN A REAL TOKEN.

   `os.getenv(name, default)` returns the default whenever the variable is
   absent, so an unset STAFF_JWT_SECRET did not disable staff auth — it
   signed every staff token with a string anybody holding the source can
   read, and accepted every token signed with it. Forging a staff session
   needed nothing but the repository.

   core/security.py had a guard for exactly this — "Server authentication is
   not configured. Set JWT_SECRET_KEY." — placed *after* a chain whose last
   link was a non-empty literal, so it could never fire. The protection read
   as present in the source and was unreachable. Its own docstring said
   "Neither key is hard-coded; both must be supplied at runtime," which the
   line below it contradicted.

2. THE HTTP AND WEBSOCKET PATHS DISAGREED ABOUT THE SECRET.

   Set JWORDEN_JWT_SECRET and leave JWT_SECRET_KEY unset — an ordinary
   configuration — and a token minted by /api/v1/auth/login verifies over
   HTTP and is rejected by both WebSocket endpoints, which read only
   JWT_SECRET_KEY. An admin stays logged in on the dashboard while live chat
   and the events feed quietly refuse them, with no error that names a cause.

WHAT THIS DOES INSTEAD.

One resolution order, shared by issuing and verifying, with no default at the
end of it. When nothing is configured the resolver raises, callers answer 503,
and the operator is told which variable to set. An outage that states its
reason is the correct behaviour; silently signing with a known string is not.

The staff portal keeps its own key so a staff token can never verify as a
platform token. If STAFF_JWT_SECRET is unset it is *derived* from the platform
secret rather than defaulted — deterministic across processes and restarts,
unguessable without the platform secret, and requiring no new configuration on
a deployment that already works.
"""

from __future__ import annotations

import hashlib
import hmac
import os

#: Checked in order. The first one set and non-empty wins.
PLATFORM_VARS: tuple[str, ...] = (
    "JWT_SECRET_KEY",
    "JWORDEN_JWT_SECRET",
    "JWORDEN_MASTER_KEY",
)

STAFF_VARS: tuple[str, ...] = ("STAFF_JWT_SECRET",)

#: Domain separation for the derived staff key. Changing this string
#: invalidates every outstanding derived staff token, so it is versioned.
_STAFF_DERIVATION_LABEL = b"jworden-staff-portal-jwt-v1"

ALGORITHM = "HS256"


class SigningSecretUnavailable(RuntimeError):
    """
    No signing secret is configured.

    Raised rather than returning a placeholder. A caller that catches this
    must refuse the request — it must never fall back to a constant, which is
    the exact bug this module was written to remove.
    """


def _first_configured(names: tuple[str, ...]) -> tuple[str | None, str | None]:
    """Return (variable_name, value) for the first one set to something."""
    for name in names:
        value = (os.getenv(name) or "").strip()
        if value:
            return name, value
    return None, None


def platform_secret() -> str:
    """
    The secret for admin/user JWTs — issuing and verifying, HTTP and WebSocket.

    Raises SigningSecretUnavailable when none of PLATFORM_VARS is set.
    """
    name, value = _first_configured(PLATFORM_VARS)
    if value is None:
        raise SigningSecretUnavailable(
            "No JWT signing secret is configured. Set one of: "
            + ", ".join(PLATFORM_VARS)
        )
    del name
    return value


def staff_secret() -> str:
    """
    The secret for Staff Portal JWTs.

    STAFF_JWT_SECRET when set. Otherwise derived from the platform secret, so
    a deployment that never knew this variable existed still gets a key that
    is specific to it instead of one printed in the source.

    Derivation is HMAC-SHA256 under a fixed label: stable across restarts and
    worker processes, and distinct from the platform secret, so a staff token
    cannot be presented as a platform token.
    """
    name, value = _first_configured(STAFF_VARS)
    if value is not None:
        del name
        return value

    base = platform_secret()  # propagates SigningSecretUnavailable
    return hmac.new(
        base.encode("utf-8"), _STAFF_DERIVATION_LABEL, hashlib.sha256
    ).hexdigest()


def platform_secret_source() -> str:
    """
    Which variable supplied the platform secret — the NAME, never the value.

    For diagnostics and health output. Returns 'unconfigured' when nothing is
    set, which is a real state that endpoints are allowed to report.
    """
    name, _ = _first_configured(PLATFORM_VARS)
    return name or "unconfigured"


def staff_secret_source() -> str:
    """As above for the staff key; 'derived' when it comes from the platform secret."""
    name, _ = _first_configured(STAFF_VARS)
    if name:
        return name
    platform = platform_secret_source()
    return "derived" if platform != "unconfigured" else "unconfigured"


def fingerprint(value: str) -> str:
    """
    A logged, non-reversible identifier for a secret.

    Length plus a truncated digest is enough to tell "these two components
    disagree about the key" from "the token is simply wrong", which is the
    question the logs actually need to answer.
    """
    if not value:
        return "unset"
    digest = hashlib.sha256(value.encode("utf-8")).hexdigest()[:12]
    return f"len={len(value)} sha256={digest}"
