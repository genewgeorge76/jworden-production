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

from ..core.security import verify_premium_security
from ..database import get_db
from ..services.tenancy import is_owner, tenant_of
from ..models import Tenant, User

logger = logging.getLogger(__name__)

# Both routes act on an *existing* tenant supplied in the request body, so both
# must be authenticated — otherwise any caller can mint a Stripe portal session
# for an arbitrary tenant_id.  Enforced at router level (see autonomy.py) so new
# routes inherit the guard by construction.
router = APIRouter(
    prefix="/api/v1/billing",
    tags=["billing"],
    dependencies=[Depends(verify_premium_security)],
)

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_mock")

# Mapping our SaaS tiers to Stripe Price IDs
PRICE_MAP = {
    "lite": os.getenv("STRIPE_PRICE_LITE", "price_lite_mock"),
    "pro": os.getenv("STRIPE_PRICE_PRO", "price_pro_mock"),
    "max": os.getenv("STRIPE_PRICE_MAX", "price_max_mock"),
}

class CheckoutRequest(BaseModel):
    tenant_id: str = "default"
    plan: str = "pro"

def _resolve_billing_tenant(auth: dict, requested: str) -> str:
    """
    Whose billing account this call may touch.

    The comment above the router names the risk exactly — "for an arbitrary
    tenant_id" — and the guard added for it was router-level AUTHENTICATION.
    That proves the caller is *a* known caller. It does nothing about the
    caller passing somebody else's tenant_id in the body, which is the risk in
    the sentence.

    It matters most on /portal: that mints a Stripe Customer Portal session,
    which shows invoices, payment methods and a cancel button. Handing one
    tenant a portal link for another tenant's subscription is not a data leak,
    it is control of their billing.

    The operator may still act on behalf of a tenant — that is a real support
    need. Everybody else is pinned to their own.
    """
    caller = tenant_of(auth)
    if is_owner(caller):
        return (requested or caller).strip() or caller
    if requested and requested.strip() != caller:
        raise HTTPException(
            status_code=403,
            detail="You may only manage billing for your own account.",
        )
    return caller


@router.post("/checkout", summary="Create Stripe Checkout Session")
def create_checkout_session(
    request: CheckoutRequest,
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    tenant_id = _resolve_billing_tenant(auth, request.tenant_id)
    tenant = db.query(Tenant).filter(Tenant.tenant_id == tenant_id).first() if db else None
    contact_email = tenant.contact_email if tenant and hasattr(tenant, "contact_email") else "owner@thewordenstandard.com"
        
    price_id = PRICE_MAP.get(request.plan.lower(), "price_pro_mock")
    base_url = os.getenv("VITE_APP_URL", "https://thewordenstandard.com")
    
    try:
        if not os.getenv("STRIPE_SECRET_KEY") or "sk_test_mock" in os.getenv("STRIPE_SECRET_KEY", ""):
            # Simulation mode fallback when Stripe Secret Key is not configured
            return {
                "url": f"{base_url}/?checkout_session=simulated_{request.plan}&status=success",
                "simulated": True,
                "plan": request.plan
            }

        session = stripe.checkout.Session.create(
            customer_email=contact_email,
            payment_method_types=['card'],
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f"{base_url}/?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{base_url}/",
            metadata={
                # The resolved tenant, not the requested one. The Stripe webhook
                # reads this back to decide whose subscription was paid for, so
                # leaving the caller-supplied value here would put the
                # authorization check in front of a door that was already open.
                "tenant_id": tenant_id,
                "plan": request.plan,
            }
        )
        return {"url": session.url, "simulated": False}
    except Exception as e:
        logger.warning(f"Stripe checkout exception (falling back to mock session): {str(e)}")
        return {
            "url": f"{base_url}/?checkout_session=simulated_{request.plan}&status=success",
            "simulated": True,
            "plan": request.plan
        }


class PortalRequest(BaseModel):
    tenant_id: str
    
@router.post("/portal", summary="Create Stripe Customer Portal Session")
def create_portal_session(
    request: PortalRequest,
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    tenant_id = _resolve_billing_tenant(auth, request.tenant_id)
    tenant = db.query(Tenant).filter(Tenant.tenant_id == tenant_id).first()
    
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
