"""
What a tenant is actually entitled to, and why.

Two separate facts decide it, and the codebase used to consult only the first:

  subscription_tier    which plan the tenant is on
  subscription_status  whether that plan has been paid for

`/auth/register` set the tier straight from the signup form — whatever plan the
customer clicked — and nothing ever verified it against Stripe. The Stripe
webhook had a `checkout.session.completed` handler, but it only recorded the
customer and subscription ids; it never granted the tier, because the tier had
already been granted by the form. `subscription_status` was written once at
registration as "pending" and then read by nothing at all.

So the entitlement check in factory.py — `subscription_tier == "lite"` — was
answering "which box did they tick at signup", not "what did they pay for".
Registering with plan "max" and abandoning checkout produced a tenant with
tier="max", status="pending", and full access to every paid feature.

Now: registration always creates a tenant at lite/pending, the webhook grants
the tier from the price that was actually paid, and every feature gate goes
through require_tier() below, which reads both columns.
"""

from __future__ import annotations

import logging
import os

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models import Tenant
from .tenancy import is_owner

logger = logging.getLogger(__name__)

# Weakest first. These are the three values the tenants.subscription_tier
# column accepts, and they match the plans on the published price list.
TIER_RANK = {"lite": 0, "pro": 1, "max": 2}
DEFAULT_TIER = "lite"

# Stripe price ids, one definition. billing.py imports this rather than keeping
# its own copy, so the id a customer is charged against and the id the webhook
# maps back to a tier cannot drift apart.
PRICE_MAP = {
    "lite": os.getenv("STRIPE_PRICE_LITE", "price_lite_mock"),
    "pro": os.getenv("STRIPE_PRICE_PRO", "price_pro_mock"),
    "max": os.getenv("STRIPE_PRICE_MAX", "price_max_mock"),
}

# Subscription statuses that carry entitlement.
#
# `past_due` is included deliberately. It means a renewal charge failed and
# Stripe is still retrying — an expired card on a customer who has been paying
# for a year. Cutting off their crew's dispatch board the morning a card
# expires is worse for the business than a few days of unpaid access, and when
# the retries are exhausted Stripe sends customer.subscription.deleted, which
# downgrades the tenant to lite. If that grace period is not wanted, remove
# "past_due" from this set — it is the only place it appears.
ENTITLED_STATUSES = frozenset({"active", "trialing", "past_due"})

# What a tenant looks like the moment it is created, before any money moves.
PENDING_STATUS = "pending"


def normalize_tier(value: str | None) -> str:
    tier = (value or "").strip().lower()
    return tier if tier in TIER_RANK else DEFAULT_TIER


def tier_for_price_id(price_id: str | None) -> str | None:
    """The plan a Stripe price id sells, or None if it is not one of ours."""
    if not price_id:
        return None
    for tier, mapped in PRICE_MAP.items():
        if mapped and mapped == price_id:
            return tier
    return None


def is_entitled(tenant: Tenant | None, minimum: str) -> bool:
    """
    Whether `tenant` may use a feature that requires at least `minimum`.

    Both columns are consulted. A tenant on tier "max" with status "pending"
    has picked a plan and not paid for it, and is entitled to nothing above
    lite.
    """
    if tenant is None:
        return False

    need = TIER_RANK.get(normalize_tier(minimum))
    have = TIER_RANK.get(normalize_tier(tenant.subscription_tier))
    if need is None or have is None or have < need:
        return False

    # Lite is the floor and costs nothing to hold, so it does not require a
    # settled payment. Everything above it does.
    if need == TIER_RANK[DEFAULT_TIER]:
        return bool(tenant.is_active)

    status = (tenant.subscription_status or "").strip().lower()
    return bool(tenant.is_active) and status in ENTITLED_STATUSES


def require_tier(db: Session, tenant_id: str, minimum: str, feature: str) -> None:
    """
    Raise 403 unless `tenant_id` may use `feature`.

    The operator is entitled to everything: he runs the platform rather than
    subscribing to it, and has no tenants row at all. The previous inline check
    (`if not tenant or tier == "lite"`) refused him for exactly that reason —
    the row lookup for JWORDEN_HQ returns nothing, so the operator was locked
    out of his own Pro features.
    """
    if is_owner(tenant_id):
        return

    tenant = db.query(Tenant).filter(Tenant.tenant_id == tenant_id).first()
    if is_entitled(tenant, minimum):
        return

    plan = normalize_tier(minimum).upper()
    if tenant is not None and TIER_RANK.get(
        normalize_tier(tenant.subscription_tier), 0
    ) >= TIER_RANK.get(normalize_tier(minimum), 0):
        # They are on the right plan; it is the payment that has not settled.
        # Saying "upgrade" here would send a customer to buy something they
        # already bought.
        raise HTTPException(
            status_code=402,
            detail=(
                f"Your {plan} subscription is not active yet. "
                f"Complete checkout to use {feature}."
            ),
        )

    raise HTTPException(
        status_code=403,
        detail=f"Upgrade to {plan} to use {feature}.",
    )


def apply_paid_tier(tenant: Tenant, tier: str, status: str = "active") -> None:
    """Record a settled payment. Called from the Stripe webhook only."""
    tenant.subscription_tier = normalize_tier(tier)
    tenant.subscription_status = (status or "active").strip().lower()
    tenant.is_active = 1
