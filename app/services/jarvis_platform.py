"""
Every endpoint on this platform, reachable by Jarvis — through the front door.

The platform has roughly two hundred endpoints. Jarvis had thirteen tools, so
almost everything that was built was unreachable from the assistant: it could
not read the lead pipeline, price a commodity, check the weather verdict, pull
revenue, or look at a customer, because no tool existed for any of it.

Declaring two hundred tools is not the answer. Model quality falls off a cliff
somewhere well below that, and every schema is context spent on every turn. So
there are two tools instead: one to discover what exists, one to call it.

HOW AUTHORIZATION IS NOT BYPASSED
────────────────────────────────
This does not reach past the API into the services beneath it. It mints a
short-lived token carrying the caller's own tenant and role, then calls the
running app over its own ASGI transport — the same request path an outside
client takes. Every existing check therefore still applies, unchanged and
unduplicated: verify_premium_security, require_tier, and the tenant scoping in
services/tenancy. A LITE customer asking Jarvis for the commodity feed gets the
same 402 they would get with curl.

That property is the whole design. The alternative — calling service functions
directly with an assumed identity — means every authorization rule has to be
reimplemented here, and the first one that is forgotten is a data leak with an
AI in front of it.

WHAT IT WILL NOT DO
───────────────────
Reads are free. Anything that writes, sends, charges or deletes requires the
operator's explicit confirmation, through the same `confirmed` flag that
already guards phone calls and email. And a small set of paths is refused
outright at any confirmation level — see _FORBIDDEN.
"""

from __future__ import annotations

import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from jose import jwt

from ..core import jwt_secrets
from .tenancy import is_owner

logger = logging.getLogger(__name__)

_ALGORITHM = "HS256"

# Long enough for one call, short enough that a leaked token is worthless.
_INTERNAL_TOKEN_SECONDS = 60

# Refused at any confirmation level, for the operator as much as anyone.
#
#   auth      — minting credentials. An assistant that can issue itself a token
#               is an assistant with no permission model at all.
#   webhooks  — inbound endpoints that trust a provider signature; calling them
#               internally forges the provider.
#   abilities — has its own tool, with its own gating for the 86 that refuse.
_FORBIDDEN = (
    re.compile(r"^/api/v1/auth/"),
    re.compile(r"^/api/v1/webhooks/"),
    re.compile(r"^/api/v1/abilities/execute"),
)

# Only the operator may reach these, and the catalogue hides them from everyone
# else. The endpoints refuse a customer on their own; this stops Jarvis
# offering a customer something it will then be refused.
_OWNER_ONLY = (
    re.compile(r"^/api/v1/superadmin"),
    re.compile(r"^/api/v1/admin"),
)

_READ_METHODS = frozenset({"get"})
_WRITE_METHODS = frozenset({"post", "put", "patch", "delete"})


def _forbidden(path: str) -> bool:
    return any(pattern.match(path) for pattern in _FORBIDDEN)


def _owner_only(path: str) -> bool:
    return any(pattern.match(path) for pattern in _OWNER_ONLY)


def _internal_token(tenant_id: str, role: str) -> str:
    """
    A credential for the caller, not for Jarvis.

    The tenant and role are the ones resolved for whoever is talking to the
    assistant, so the call is authorized as them. Jarvis has no identity of its
    own here and cannot acquire one.
    """
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "sub": f"jarvis-on-behalf-of:{tenant_id}",
            "tenant_id": tenant_id,
            "role": role,
            "iat": now,
            "exp": now + timedelta(seconds=_INTERNAL_TOKEN_SECONDS),
        },
        jwt_secrets.platform_secret(),
        algorithm=_ALGORITHM,
    )


def _openapi() -> dict[str, Any]:
    from ..main import app  # noqa: PLC0415

    return app.openapi()


def catalogue(
    *, tenant_id: str, search: Optional[str] = None, limit: int = 40
) -> dict[str, Any]:
    """
    What Jarvis can call, read off the live schema rather than a list kept by
    hand — a hand-kept list is how the prompt came to claim 162 AI engines.

    `search` matches the path, summary and tag, because two hundred endpoints
    do not fit in one answer and "what can you tell me about leads" is the
    question actually being asked.
    """
    try:
        schema = _openapi()
    except Exception:  # noqa: BLE001
        logger.exception("Could not read the OpenAPI schema.")
        return {"ok": False, "error": "The API schema could not be read."}

    owner = is_owner(tenant_id)
    needle = (search or "").strip().lower()
    matches: list[dict[str, Any]] = []

    for path, operations in (schema.get("paths") or {}).items():
        if _forbidden(path):
            continue
        if _owner_only(path) and not owner:
            continue

        for method, spec in operations.items():
            method = method.lower()
            if method not in _READ_METHODS | _WRITE_METHODS:
                continue

            summary = (spec.get("summary") or spec.get("description") or "").strip()
            tags = spec.get("tags") or []
            haystack = f"{path} {summary} {' '.join(tags)}".lower()
            if needle and needle not in haystack:
                continue

            matches.append(
                {
                    "method": method.upper(),
                    "path": path,
                    "summary": summary[:200] or None,
                    "tags": tags,
                    "writes": method in _WRITE_METHODS,
                    "parameters": [
                        {
                            "name": p.get("name"),
                            "in": p.get("in"),
                            "required": bool(p.get("required")),
                        }
                        for p in (spec.get("parameters") or [])
                    ][:12],
                }
            )

    matches.sort(key=lambda m: (m["writes"], m["path"]))
    limit = max(1, min(int(limit or 40), 100))
    return {
        "ok": True,
        "total_matching": len(matches),
        "returned": min(len(matches), limit),
        "endpoints": matches[:limit],
        "note": (
            "Reads run immediately. Anything with writes=true needs the "
            "operator's confirmation first."
        ),
    }


async def call(
    *,
    method: str,
    path: str,
    tenant_id: str,
    role: str,
    query: Optional[dict] = None,
    body: Optional[dict] = None,
    confirmed: bool = False,
    timeout_seconds: float = 30.0,
) -> dict[str, Any]:
    """Call one platform endpoint as the current caller."""
    method = (method or "GET").strip().upper()
    path = (path or "").strip()

    if not path.startswith("/"):
        return {"ok": False, "error": "path must start with '/', e.g. /api/v1/leads/recent."}

    if _forbidden(path):
        return {
            "ok": False,
            "error": (
                "That endpoint is not callable from Jarvis at any permission "
                "level. Token issuance, provider webhooks and direct ability "
                "execution are excluded by design."
            ),
        }

    if _owner_only(path) and not is_owner(tenant_id):
        return {"ok": False, "error": "That endpoint belongs to the platform operator."}

    if method.lower() in _WRITE_METHODS and not confirmed:
        # Same rule the phone and email tools already follow: propose it, and
        # let the operator say yes.
        return {
            "ok": False,
            "error": (
                f"{method} {path} changes data. Describe what it would do and "
                "ask the operator to confirm before calling it again."
            ),
            "requires_confirmation": True,
        }

    if method.lower() not in _READ_METHODS | _WRITE_METHODS:
        return {"ok": False, "error": f"{method} is not a supported method."}

    try:
        token = _internal_token(tenant_id, role)
    except jwt_secrets.SigningSecretUnavailable:
        return {
            "ok": False,
            "error": "No JWT signing secret is configured, so no call can be authorized.",
        }

    try:
        import httpx  # noqa: PLC0415

        from ..main import app  # noqa: PLC0415

        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(
            transport=transport, base_url="http://jarvis-internal", timeout=timeout_seconds
        ) as client:
            response = await client.request(
                method,
                path,
                params=query or None,
                json=body if method.lower() in _WRITE_METHODS else None,
                headers={"Authorization": f"Bearer {token}"},
            )
    except Exception as exc:  # noqa: BLE001
        logger.exception("[JARVIS] platform call failed: %s %s", method, path)
        return {"ok": False, "error": f"The call could not be completed: {exc}"}

    try:
        payload = response.json()
    except ValueError:
        payload = {"raw": response.text[:2000]}

    ok = response.status_code < 400
    result: dict[str, Any] = {
        "ok": ok,
        "status": response.status_code,
        "method": method,
        "path": path,
        "data": payload,
    }
    if not ok:
        # Hand the refusal back verbatim. A 402 saying "upgrade to MAX" is the
        # honest answer to the question, and Jarvis relaying it is better than
        # Jarvis inventing the data the endpoint declined to give.
        result["error"] = (
            payload.get("detail") if isinstance(payload, dict) else None
        ) or f"HTTP {response.status_code}"
    return result
