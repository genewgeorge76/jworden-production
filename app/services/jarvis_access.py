from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from typing import Optional

from fastapi import HTTPException

from app.core.security import verify_premium_security

logger = logging.getLogger(__name__)

ROLE_PUBLIC_CONCIERGE = "public_concierge"
ROLE_STAFF_OPERATOR = "staff_operator"
ROLE_OWNER_ROOT = "owner_root"

_ROLE_RANK = {
    ROLE_PUBLIC_CONCIERGE: 0,
    ROLE_STAFF_OPERATOR: 1,
    ROLE_OWNER_ROOT: 2,
}


@dataclass
class JarvisAccessContext:
    role: str
    tenant_id: str
    user_id: str
    owner: bool
    authenticated: bool


def _extract_bearer_token(authorization: Optional[str]) -> Optional[str]:
    if not authorization:
        return None
    parts = authorization.strip().split(" ", 1)
    if len(parts) != 2:
        return None
    if parts[0].lower() != "bearer":
        return None
    token = parts[1].strip()
    return token or None


def is_owner_token(x_owner_token: Optional[str]) -> bool:
    if not x_owner_token:
        return False
    allowed = os.environ.get("OWNER_TOKENS", os.environ.get("OWNER_TOKEN", "")).split(",")
    allowed = [t.strip() for t in allowed if t and t.strip()]
    return x_owner_token.strip() in allowed


def resolve_access_context(
    *,
    x_owner_token: Optional[str] = None,
    authorization: Optional[str] = None,
) -> JarvisAccessContext:
    if is_owner_token(x_owner_token):
        return JarvisAccessContext(
            role=ROLE_OWNER_ROOT,
            tenant_id="JWORDEN_HQ",
            user_id="owner",
            owner=True,
            authenticated=True,
        )

    bearer = _extract_bearer_token(authorization)
    if bearer:
        try:
            payload = verify_premium_security(bearer)
            return JarvisAccessContext(
                role=ROLE_STAFF_OPERATOR,
                tenant_id=payload.get("tenant_id", "JWORDEN_HQ"),
                user_id=payload.get("user", "staff"),
                owner=False,
                authenticated=True,
            )
        except HTTPException as exc:
            logger.info("Jarvis bearer token rejected for staff role: %s", exc.detail)

    return JarvisAccessContext(
        role=ROLE_PUBLIC_CONCIERGE,
        tenant_id="default",
        user_id="public",
        owner=False,
        authenticated=False,
    )


def role_allows(*, current_role: str, minimum_role: str) -> bool:
    return _ROLE_RANK.get(current_role, -1) >= _ROLE_RANK.get(minimum_role, 999)


def require_minimum_role(*, ctx: JarvisAccessContext, minimum_role: str) -> None:
    if not role_allows(current_role=ctx.role, minimum_role=minimum_role):
        raise HTTPException(status_code=403, detail=f"{minimum_role} access required.")
