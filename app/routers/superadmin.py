"""
superadmin.py — Super Admin APIs for global platform telemetry and intervention.

THESE ENDPOINTS WERE OPEN TO THE INTERNET.

The module docstring said "Restricted to the 'default' tenant (J. Worden HQ)
users with role='admin'", and the guard enforcing that was:

    def verify_super_admin():
        # Placeholder: In a real app we decode the JWT and check tenant_id == 'default'
        pass

A function whose body is `pass`, CALLED at the top of each endpoint so the code
read as though it checked something. The router carried no dependency either, so
the deployed OpenAPI listed both routes with no security requirement, and

    GET /api/v1/superadmin/telemetry

returned HTTP 200 to an anonymous caller with the full tenant roster — company
name, industry, subscription tier, user count and MRR per customer, plus total
platform revenue. With one test tenant that is trivial. On the day a real client
is onboarded it publishes the entire customer list and revenue to anyone who
requests the URL.

POST /api/v1/superadmin/intervene was equally open and returned the tenant's
contact_email to whoever asked.

Both now require the owner. This is deliberately owner-only rather than
tenant-scoped: the whole purpose of these views is to look ACROSS tenants, so
scoping them per tenant would be meaningless. The correct control is that only
the operator may call them at all.
"""

import logging
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..core.security import verify_premium_security
from ..database import get_db
from ..models import Tenant, User
from ..services.tenancy import is_owner, tenant_of
from .auth import _ALGORITHM

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/superadmin", tags=["superadmin"])

def require_owner(auth: dict = Depends(verify_premium_security)) -> dict:
    """
    Only the operator of this deployment may read across tenants.

    Replaces a placeholder that was a bare `pass`. Declared as a FastAPI
    dependency rather than called inside the body, so it appears in the OpenAPI
    security requirements and cannot be silently skipped by an endpoint that
    forgets to invoke it — which is exactly how the previous version failed.
    """
    if not is_owner(tenant_of(auth)):
        # 403 rather than 404: the caller IS authenticated, just not the owner.
        # There is nothing to hide about the existence of these routes.
        raise HTTPException(
            status_code=403,
            detail="Super Admin endpoints are restricted to the platform operator.",
        )
    return auth

class TenantTelemetry(BaseModel):
    tenant_id: str
    company_name: str
    industry: str
    subscription_tier: str
    is_active: bool
    user_count: int
    mrr_contribution: int

class PlatformTelemetry(BaseModel):
    total_mrr: int
    active_tenants: int
    churn_risk_count: int
    tenants: List[TenantTelemetry]

@router.get("/telemetry", response_model=PlatformTelemetry)
def get_telemetry(
    db: Session = Depends(get_db),
    _owner: dict = Depends(require_owner),
):
    """Fetch global telemetry across all SaaS tenants."""
    
    tenants = db.query(Tenant).all()
    
    total_mrr = 0
    active_tenants = 0
    churn_risk = 0
    tenant_list = []
    
    tier_pricing = {
        "lite": 199,
        "pro": 499,
        "max": 999
    }
    
    for t in tenants:
        user_count = db.query(User).filter(User.tenant_id == t.tenant_id).count()
        mrr = tier_pricing.get(t.subscription_tier, 0) if t.is_active else 0
        
        if t.is_active:
            active_tenants += 1
            total_mrr += mrr
            # Simple churn heuristic: if they have 0 or 1 users, they are at risk
            if user_count <= 1 and t.tenant_id != "default":
                churn_risk += 1
                
        tenant_list.append(TenantTelemetry(
            tenant_id=t.tenant_id,
            company_name=t.company_name,
            industry=t.industry,
            subscription_tier=t.subscription_tier,
            is_active=bool(t.is_active),
            user_count=user_count,
            mrr_contribution=mrr
        ))
        
    return PlatformTelemetry(
        total_mrr=total_mrr,
        active_tenants=active_tenants,
        churn_risk_count=churn_risk,
        tenants=tenant_list
    )

class InterventionRequest(BaseModel):
    tenant_id: str
    message: str

@router.post("/intervene")
def trigger_intervention(
    request: InterventionRequest,
    db: Session = Depends(get_db),
    _owner: dict = Depends(require_owner),
):
    """Record an intervention request. Sends nothing — see below."""
    
    tenant = db.query(Tenant).filter(Tenant.tenant_id == request.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    logger.info(
        "Intervention recorded for %s (%s): %s",
        tenant.company_name, request.tenant_id, request.message,
    )

    # NOTHING IS SENT. The previous version returned
    #     {"status": "success", "message": f"Jarvis dispatched to {contact_email}"}
    # directly under the comment "In reality, this would hook into the email.py
    # router or twilio to SMS the owner" — so it reported a dispatch that had
    # not happened, and handed the tenant's email address back to the caller as
    # part of the confirmation.
    #
    # Claiming to have contacted a customer and not contacting them is the same
    # failure as the vendor-dispatch line in the Foreman client: somebody stops
    # chasing because the system said it was handled.
    return {
        "ok": False,
        "status": "not_sent",
        "delivered": False,
        "tenant_id": request.tenant_id,
        "company_name": tenant.company_name,
        "detail": (
            "Intervention was recorded in the log only. No email or SMS is wired "
            "up on this route — contact the tenant directly."
        ),
    }
