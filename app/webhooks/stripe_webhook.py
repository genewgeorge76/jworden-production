"""
stripe_webhook.py — Handles incoming Stripe events to automatically manage Tenant subscriptions.
"""

import logging
import os
from fastapi import APIRouter, Depends, HTTPException, Request
import stripe
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Tenant, Estimate, Job
from ..services import entitlements

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/webhooks/stripe", tags=["webhooks"])

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_mock")
WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_mock")

def _tier_from_session(session) -> str | None:
    """
    The plan a completed checkout paid for.

    Order matters. The line item is what Stripe charged; the metadata is what
    this server asked for. Normally identical — and when they are not, bill
    beats request.
    """
    line_items = (session.get("line_items") or {}).get("data") or []
    for item in line_items:
        price_id = ((item or {}).get("price") or {}).get("id")
        tier = entitlements.tier_for_price_id(price_id)
        if tier:
            return tier

    # checkout.session.completed does not expand line_items by default, so the
    # loop above is usually empty and this is the path that runs. It is still
    # trustworthy: billing.py sets this metadata server-side from the resolved
    # tenant, and Stripe echoes it back unmodified.
    requested = (session.get("metadata") or {}).get("plan")
    if requested and entitlements.normalize_tier(requested) == str(requested).strip().lower():
        return entitlements.normalize_tier(requested)
    return None


def _tier_from_subscription(subscription) -> str | None:
    """The plan a subscription object is currently on, by its price id."""
    items = (subscription.get("items") or {}).get("data") or []
    for item in items:
        price_id = ((item or {}).get("price") or {}).get("id")
        tier = entitlements.tier_for_price_id(price_id)
        if tier:
            return tier
    return None


@router.post("")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, WEBHOOK_SECRET
        )
    except ValueError as e:
        # Invalid payload
        logger.error(f"Stripe Webhook ValueError: {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        logger.error(f"Stripe Webhook Signature Error: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle the checkout.session.completed event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        # 1. Is this a SaaS subscription?
        tenant_id = session.get('metadata', {}).get('tenant_id')
        if tenant_id:
            tenant = db.query(Tenant).filter(Tenant.tenant_id == tenant_id).first()
            if tenant:
                tenant.stripe_customer_id = session.get('customer')
                tenant.stripe_subscription_id = session.get('subscription')

                # THIS is where a paid tier is granted, and the only place.
                #
                # This handler used to record the Stripe ids and stop. The tier
                # had already been set — at registration, from the plan the
                # visitor ticked on the pricing page — so paying for a
                # subscription changed nothing about what the tenant could use,
                # and neither did not paying for one.
                #
                # Prefer the price actually charged over the metadata: metadata
                # is what we asked Stripe for, the line item is what Stripe
                # billed. They agree in the normal case, and when they do not,
                # the money is the truth.
                tier = _tier_from_session(session)
                if tier:
                    entitlements.apply_paid_tier(tenant, tier)
                    logger.info(
                        "Tenant %s subscribed via Stripe on the %s plan.",
                        tenant_id,
                        tier,
                    )
                else:
                    # Paid for something we cannot map to a plan. Recording the
                    # payment without granting a guessed tier is the safe half:
                    # it is visible in Stripe and fixable by hand, whereas a
                    # wrong grant is invisible.
                    tenant.is_active = 1
                    logger.error(
                        "Tenant %s completed checkout but no plan could be "
                        "resolved from the session. Tier NOT granted.",
                        tenant_id,
                    )
                db.commit()
                
        # 2. Is this an Estimate Deposit?
        estimate_id = session.get('metadata', {}).get('estimate_id')
        if estimate_id:
            estimate = db.query(Estimate).filter(Estimate.id == int(estimate_id)).first()
            if estimate:
                estimate.status = "approved"
                estimate.payment_status = "verified"
                estimate.payment_method = "stripe"
                
                # Auto-create Job
                new_job = Job(
                    estimate_id=estimate.id,
                    tenant_id=estimate.tenant_id,
                    customer_id=estimate.customer_id,
                    job_name=f"{estimate.service_type or 'Paving'} - Auto-Converted",
                    status="pending"
                )
                db.add(new_job)
                db.commit()
                logger.info(f"Estimate {estimate_id} deposit paid. Job created.")
                
    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        tenant = db.query(Tenant).filter(Tenant.stripe_subscription_id == subscription.get('id')).first()
        if tenant:
            tenant.is_active = 0
            # Downgrade them to lite or deactivate entirely
            tenant.subscription_tier = entitlements.DEFAULT_TIER
            # The status has to move too. is_entitled() reads both columns, and
            # leaving this at 'active' on a cancelled subscription would keep
            # the tenant entitled to lite-plus features until someone noticed.
            tenant.subscription_status = 'canceled'
            db.commit()
            logger.info(f"Tenant {tenant.tenant_id} subscription deleted. Downgraded to lite.")

    elif event['type'] == 'customer.subscription.updated':
        subscription = event['data']['object']
        # Upgrades, downgrades and lapses all arrive here. The comment that used
        # to sit on this branch said "a real implementation would map the new
        # price ID to 'pro', 'max', etc." — it does now, because without that
        # mapping a downgrade through the billing portal left the tenant on the
        # tier they stopped paying for.
        tenant = db.query(Tenant).filter(Tenant.stripe_subscription_id == subscription.get('id')).first()
        if tenant:
            status = (subscription.get('status') or '').strip().lower()
            tier = _tier_from_subscription(subscription)

            if status in entitlements.ENTITLED_STATUSES:
                # Keep the recorded tier if the price is unrecognised: the
                # subscription is live and paid, so removing access over a
                # price id we failed to map would be punishing the customer
                # for a config gap on our side.
                entitlements.apply_paid_tier(
                    tenant, tier or tenant.subscription_tier, status
                )
            else:
                # incomplete, unpaid, canceled, paused. Record the status and
                # let require_tier() refuse; do not silently keep serving a
                # paid tier against a subscription Stripe says is not paid.
                tenant.subscription_status = status or 'inactive'

            db.commit()
            logger.info(
                "Tenant %s subscription updated: status=%s tier=%s.",
                tenant.tenant_id,
                status or 'unknown',
                tenant.subscription_tier,
            )

    return {"status": "success"}
