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

from typing import Any

# Rows written before tenancy was enforced carry this. Kept as a constant so
# the fallback is one identifier rather than a literal repeated per query.
DEFAULT_TENANT = "default"


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

    Rows with a NULL tenant_id predate enforcement and belong to nobody in
    particular, so they resolve into the default bucket rather than vanishing
    from the deployment that created them.
    """
    if tenant == DEFAULT_TENANT:
        return query.filter(
            (model.tenant_id == tenant) | (model.tenant_id.is_(None))
        )
    return query.filter(model.tenant_id == tenant)
