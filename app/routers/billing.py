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
from ..services import entitlements
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

# Mapping our SaaS tiers to Stripe Price IDs.
#
# Re-exported from services/entitlements rather than defined here, so the id a
# customer is charged against and the id the Stripe webhook maps back to a tier
# are the same string. Two copies of this dict would eventually disagree, and
# the failure would be a customer paying for Max and being granted Pro.
PRICE_MAP = entitlements.PRICE_MAP

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
    
    # Refuse rather than fake it.
    #
    # This used to return a URL of the form
    #     {base_url}/?checkout_session=simulated_pro&status=success
    # whenever STRIPE_SECRET_KEY was unset — a redirect that says "success" in
    # the query string, on a deployment where no money can move. The signup
    # flow follows that URL, so a customer went through checkout, landed on a
    # page marked success, and had bought nothing.
    #
    # It is worse now than it was, because the tier is granted by the Stripe
    # webhook rather than by the signup form. A fake success means the webhook
    # never fires, so the customer stays on lite forever with no error anywhere
    # to explain why.
    stripe_key = os.getenv("STRIPE_SECRET_KEY", "").strip()
    if not stripe_key or "sk_test_mock" in stripe_key:
        raise HTTPException(
            status_code=503,
            detail=(
                "Billing is not configured on this deployment, so checkout "
                "cannot be started. Your account has been created and you are "
                "signed in. Set STRIPE_SECRET_KEY to enable subscriptions."
            ),
        )

    unmapped = [
        name for name, value in PRICE_MAP.items()
        if not value or value.endswith("_mock")
    ]
    if request.plan.lower() in unmapped:
        # A real Stripe key with a placeholder price id would create a session
        # against a price that does not exist, and the webhook would then be
        # unable to map the payment back to a plan.
        raise HTTPException(
            status_code=503,
            detail=(
                f"No Stripe price is configured for the {request.plan.upper()} "
                f"plan. Set STRIPE_PRICE_{request.plan.upper()}."
            ),
        )

    try:

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
    except HTTPException:
        raise
    except Exception as e:
        # Was: swallow the error and return the same fake success URL. That
        # turned "Stripe rejected this" into "you have subscribed", which is
        # the most expensive possible way to be wrong.
        logger.error("Stripe checkout failed for tenant %s: %s", tenant_id, e)
        raise HTTPException(
            status_code=502,
            detail="Could not start checkout with Stripe. Nothing was charged.",
        )


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
