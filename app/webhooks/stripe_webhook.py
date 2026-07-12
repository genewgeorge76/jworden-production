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

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/webhooks/stripe", tags=["webhooks"])

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_mock")
WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_mock")

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
                tenant.is_active = 1
                db.commit()
                logger.info(f"Tenant {tenant_id} successfully subscribed via Stripe.")
                
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
            tenant.subscription_tier = 'lite' 
            db.commit()
            logger.info(f"Tenant {tenant.tenant_id} subscription deleted. Downgraded to lite.")

    elif event['type'] == 'customer.subscription.updated':
        subscription = event['data']['object']
        # If they upgraded or downgraded via the billing portal, update their tier
        # (A real implementation would map the new price ID to 'pro', 'max', etc.)
        tenant = db.query(Tenant).filter(Tenant.stripe_subscription_id == subscription.get('id')).first()
        if tenant and subscription.get('status') == 'active':
            tenant.is_active = 1
            db.commit()
            logger.info(f"Tenant {tenant.tenant_id} subscription updated.")

    return {"status": "success"}
