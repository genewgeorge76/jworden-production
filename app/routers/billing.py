"""
billing.py — Stripe Billing Engine for the Worden Standard OS

Routes:
  POST /api/v1/billing/checkout — Creates a Stripe Checkout Session for a new Tenant.
  POST /api/v1/billing/portal — Creates a Stripe Customer Portal Session for an existing Tenant.
"""

import logging
import os
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
import stripe
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Tenant, User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/billing", tags=["billing"])

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_mock")

# Mapping our SaaS tiers to Stripe Price IDs
PRICE_MAP = {
    "lite": os.getenv("STRIPE_PRICE_LITE", "price_lite_mock"),
    "pro": os.getenv("STRIPE_PRICE_PRO", "price_pro_mock"),
    "max": os.getenv("STRIPE_PRICE_MAX", "price_max_mock"),
}

class CheckoutRequest(BaseModel):
    tenant_id: str
    plan: str

@router.post("/checkout", summary="Create Stripe Checkout Session")
def create_checkout_session(request: CheckoutRequest, db: Session = Depends(get_db)):
    tenant = db.query(Tenant).filter(Tenant.tenant_id == request.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    price_id = PRICE_MAP.get(request.plan.lower())
    if not price_id:
        raise HTTPException(status_code=400, detail="Invalid subscription plan")
        
    # Generate success/cancel URLs based on the frontend host
    base_url = os.getenv("VITE_APP_URL", "http://localhost:5173")
    
    try:
        session = stripe.checkout.Session.create(
            customer_email=tenant.contact_email,
            payment_method_types=['card'],
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f"{base_url}/operations/cockpit?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{base_url}/operations/register",
            metadata={
                "tenant_id": tenant.tenant_id,
                "industry": tenant.industry
            }
        )
        return {"url": session.url}
    except Exception as e:
        logger.error(f"Stripe checkout error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create checkout session")


class PortalRequest(BaseModel):
    tenant_id: str
    
@router.post("/portal", summary="Create Stripe Customer Portal Session")
def create_portal_session(request: PortalRequest, db: Session = Depends(get_db)):
    tenant = db.query(Tenant).filter(Tenant.tenant_id == request.tenant_id).first()
    
    if not tenant or not tenant.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No active billing account found")
        
    base_url = os.getenv("VITE_APP_URL", "http://localhost:5173")
    
    try:
        session = stripe.billing_portal.Session.create(
            customer=tenant.stripe_customer_id,
            return_url=f"{base_url}/operations/cockpit"
        )
        return {"url": session.url}
    except Exception as e:
        logger.error(f"Stripe portal error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create portal session")
