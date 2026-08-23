import os
import hashlib
import logging
from fastapi import HTTPException, Security
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from . import jwt_secrets

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

_ALGORITHM = "HS256"
logger = logging.getLogger(__name__)


def _secret_fingerprint(value: str) -> str:
    if not value:
        return "unset"
    digest = hashlib.sha256(value.encode("utf-8")).hexdigest()[:12]
    return f"len={len(value)} sha256={digest}"


def _auth_disabled() -> bool:
    mode = os.getenv("AUTH_MODE", "required").strip().lower()
    return mode in {"none", "off", "disabled", "0", "false"}


def verify_premium_security(token: str = Security(oauth2_scheme)):
    """
    Verify a bearer token using either:
      1. A long-lived master API key stored in JWORDEN_MASTER_KEY env var, or
      2. A JWT signed with the platform secret (see core/jwt_secrets.py for
         the resolution order, which is shared with the issuing side and the
         WebSocket endpoints).

    Neither key is hard-coded. That sentence used to sit directly above a
    chain ending in `os.getenv(..., "fallback_secret")`, so an unconfigured
    deployment verified tokens against a string committed to this repository
    and the "not configured" guard below it could never fire.
    """
    if _auth_disabled():
        return {
            "user": "AuthBypass",
            "tenant_id": "JWORDEN_HQ",
            "role": "system_admin",
            "auth_mode": "none",
        }

    if token is None:
        raise HTTPException(status_code=403, detail="Unauthorized: no token")

    # Master key path (simple API key, no expiry — suitable for internal tools)
    master_key = os.getenv("JWORDEN_MASTER_KEY", "")
    if master_key and token == master_key:
        return {"user": "Admin", "tenant_id": "JWORDEN_HQ", "role": "system_admin"}

    # JWT path. One resolver, no default at the end of it: when nothing is
    # configured this raises and the request is refused, instead of quietly
    # accepting whatever a known constant happens to validate.
    try:
        secret = jwt_secrets.platform_secret()
    except jwt_secrets.SigningSecretUnavailable as exc:
        logger.error("Token presented but no signing secret is configured: %s", exc)
        raise HTTPException(
            status_code=503,
            detail=(
                "Server authentication is not configured. Set one of: "
                + ", ".join(jwt_secrets.PLATFORM_VARS)
            ),
        ) from exc

    try:
        payload = jwt.decode(token, secret, algorithms=[_ALGORITHM])
        tenant_id = (payload.get("tenant_id") or "").strip()
        if not tenant_id:
            # "I don't know your scope" must not resolve to "you are the
            # operator". This used to default to JWORDEN_HQ, which is in
            # tenancy.owner_bucket() — so a validly-signed token that simply
            # omitted the claim was handed the owner's whole bucket. Every
            # issuer on the platform secret (auth.py:_issue_admin_jwt, /login,
            # /register) sets tenant_id, so nothing this system mints lands
            # here; a token that does is one we cannot scope, and the safe
            # answer to that is no.
            logger.warning("Token accepted by signature but carries no tenant_id claim; refusing.")
            raise HTTPException(
                status_code=403,
                detail="Unauthorized: token carries no tenant scope",
            )
        # role rides along. It was dropped here, which is why no endpoint could
        # ever gate on it and why the frontend resorted to hard-coding
        # role: 'admin'. Absent claim means the least the caller can be, not
        # the most.
        return {
            "user": payload.get("sub", "unknown"),
            "tenant_id": tenant_id,
            "role": (payload.get("role") or "viewer").strip() or "viewer",
        }
    except JWTError:
        logger.warning(
            "Protected request rejected — invalid token (presented=%s jwt_secret=%s master_key=%s)",
            _secret_fingerprint(token),
            _secret_fingerprint(secret),
            _secret_fingerprint(master_key),
        )
        raise HTTPException(status_code=403, detail="Unauthorized: invalid token")