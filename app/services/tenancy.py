"""
tenancy.py — Whose data is this.

Every table these engines write carries a `tenant_id`, and every one of them
was written correctly and read globally. In a single-operator deployment that
is invisible. The moment the platform serves a second contractor it means one
customer's job prices against another customer's plants, and their supplier
list and keyword data are readable across the boundary.

Writes were never the problem — the column was always set. Reads are, and a
read that forgets the filter fails silently: it returns more rows, not an
error, so the bug shows up as a competitor's quarry in somebody's bid.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Any

# Rows written before tenancy was enforced carry this. Kept as a constant so
# the fallback is one identifier rather than a literal repeated per query.
DEFAULT_TENANT = "default"

# What `verify_premium_security` stamps for the master key, for the admin PIN
# path, and as the JWT fallback. It is the operator running this deployment.
OWNER_TENANT = "JWORDEN_HQ"


@lru_cache(maxsize=1)
def owner_bucket() -> frozenset[str]:
    """
    Every tenant_id spelling that means "the operator of this deployment".

    Three different writers stamped three different things and all of them are
    the same person:

      * NULL / "default" — rows written before tenancy existed at all.
      * "JWORDEN_HQ"     — what the auth layer hands back for the master key.
      * a bare hostname  — public lead intake derives the tenant from the
        Origin header, so a quote submitted on richmondasphaltpaving.com lands
        under "richmondasphaltpaving.com".

    That last one is why this cannot be a two-element constant. Scoping the
    owner to {default, JWORDEN_HQ} would filter out every lead his own
    marketing sites produce — the cockpit would go quiet while the forms kept
    working, which is the worst possible failure for a lead pipeline.
    """
    from .site_health import PUBLISHED_DOMAINS  # noqa: PLC0415  (avoids a cycle)

    return frozenset({DEFAULT_TENANT, OWNER_TENANT, *PUBLISHED_DOMAINS})


def is_owner(tenant: str) -> bool:
    """True when `tenant` denotes the operator rather than a hosted client."""
    return tenant in owner_bucket()


def tenant_of(auth: dict[str, Any] | None) -> str:
    """
    The tenant for the authenticated caller.

    `verify_premium_security` puts tenant_id on the auth dict for both the
    master-key and JWT paths. Falling back to DEFAULT_TENANT rather than to
    'no filter' matters: an unknown caller should see the shared bucket, never
    everything.
    """
    if not auth:
        return DEFAULT_TENANT
    return (auth.get("tenant_id") or DEFAULT_TENANT).strip() or DEFAULT_TENANT


def scope(query, model, tenant: str):
    """
    Restrict a query to one tenant.

    The operator sees his whole bucket — legacy NULLs, "default", "JWORDEN_HQ",
    and each of his own publishing domains. A hosted client sees exactly its
    own tenant_id and nothing else; in particular a client never inherits the
    NULL rows, because those are the operator's history, not theirs.
    """
    if is_owner(tenant):
        return query.filter(
            model.tenant_id.in_(tuple(owner_bucket())) | model.tenant_id.is_(None)
        )
    return query.filter(model.tenant_id == tenant)


def stamp_for(tenant: str) -> str:
    """
    The tenant_id to write on a row created by `tenant`.

    Owner writes collapse onto DEFAULT_TENANT so that everything he creates
    stays in one bucket and stays readable by the existing cockpit queries.
    """
    return DEFAULT_TENANT if is_owner(tenant) else tenant
