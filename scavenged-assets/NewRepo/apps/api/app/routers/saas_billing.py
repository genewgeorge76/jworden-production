"""SaaS billing router — Stripe subscription management for licensee tenants.

Operator (platform owner) creates/manages tenant orgs.
Each tenant has a Stripe subscription; webhook keeps status current.
Full demo mode when STRIPE_SECRET_KEY not set.
"""
from __future__ import annotations

import json
import time
from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..config import settings
from ..core.security import verify_premium_security
from ..database import get_db
from ..models import TenantBillingEvent, TenantRecord, utcnow

router = APIRouter(prefix='/saas', tags=['saas'])

# Plan definitions — price IDs map to Stripe Price objects
PLANS: dict[str, dict] = {
    'starter': {
        'name': 'Starter',
        'monthly_usd': 299,
        'monthly_cents': 29900,
        'features': ['Jarvis AI', 'Estimates', 'CRM', 'Weather', '5 crew'],
        'stripe_price_id': getattr(settings, 'stripe_price_starter', None) or 'price_starter_demo',
    },
    'pro': {
        'name': 'Pro',
        'monthly_usd': 599,
        'monthly_cents': 59900,
        'features': ['Everything in Starter', 'Dispatch', 'Gantt', 'Catalog', 'QB Sync', '25 crew', 'White-label subdomain'],
        'stripe_price_id': getattr(settings, 'stripe_price_pro', None) or 'price_pro_demo',
    },
    'enterprise': {
        'name': 'Enterprise',
        'monthly_usd': 1499,
        'monthly_cents': 149900,
        'features': ['Everything in Pro', 'Custom domain', 'BIM/Plan markup', 'Drone vision', 'SLA support', 'Unlimited crew'],
        'stripe_price_id': getattr(settings, 'stripe_price_enterprise', None) or 'price_enterprise_demo',
    },
}


def _stripe():
    import stripe as s  # type: ignore
    s.api_key = settings.stripe_secret_key
    return s


def _demo_mode() -> bool:
    return not bool(getattr(settings, 'stripe_secret_key', None))


# ── Schemas ───────────────────────────────────────────────────────────────────

class TenantCreate(BaseModel):
    tenant_id: str             # slug-safe, e.g. 'blueridge-paving'
    business_name: str
    contact_email: str
    contact_phone: Optional[str] = None
    plan: str = 'starter'
    primary_state: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None


class TenantOut(BaseModel):
    id: int
    tenant_id: str
    business_name: str
    contact_email: str
    plan: str
    status: str
    monthly_price_usd: int
    trial_ends_at: Optional[str]
    current_period_end: Optional[str]
    stripe_customer_id: Optional[str]
    features: list[str]
    created_at: str


def _tenant_out(t: TenantRecord) -> TenantOut:
    plan_info = PLANS.get(t.plan, PLANS['starter'])
    return TenantOut(
        id=t.id,
        tenant_id=t.tenant_id,
        business_name=t.business_name,
        contact_email=t.contact_email,
        plan=t.plan,
        status=t.status,
        monthly_price_usd=t.monthly_price_cents // 100,
        trial_ends_at=t.trial_ends_at.isoformat() if t.trial_ends_at else None,
        current_period_end=t.current_period_end.isoformat() if t.current_period_end else None,
        stripe_customer_id=t.stripe_customer_id,
        features=plan_info['features'],
        created_at=t.created_at.isoformat() if t.created_at else '',
    )


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get('/plans', dependencies=[Depends(verify_premium_security)])
def list_plans():
    return {'plans': [{'id': k, **v} for k, v in PLANS.items()], 'demo': _demo_mode()}


@router.get('/tenants', dependencies=[Depends(verify_premium_security)])
def list_tenants(
    status: Optional[str] = Query(None),
    plan: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
):
    qs = db.query(TenantRecord)
    if status:
        qs = qs.filter(TenantRecord.status == status)
    if plan:
        qs = qs.filter(TenantRecord.plan == plan)
    tenants = qs.order_by(TenantRecord.id.desc()).limit(limit).all()
    total_mrr = sum(t.monthly_price_cents / 100 for t in tenants if t.status == 'active')
    return {
        'tenants': [_tenant_out(t) for t in tenants],
        'total': len(tenants),
        'active_mrr_usd': round(total_mrr, 2),
        'demo': _demo_mode(),
    }


@router.post('/tenants', dependencies=[Depends(verify_premium_security)])
def create_tenant(body: TenantCreate, db: Session = Depends(get_db)):
    existing = db.query(TenantRecord).filter(TenantRecord.tenant_id == body.tenant_id).first()
    if existing:
        raise HTTPException(409, f'Tenant {body.tenant_id!r} already exists')
    plan_info = PLANS.get(body.plan, PLANS['starter'])
    tenant = TenantRecord(
        tenant_id=body.tenant_id,
        slug=body.tenant_id,
        business_name=body.business_name,
        contact_email=body.contact_email,
        contact_phone=body.contact_phone,
        plan=body.plan,
        status='trial',
        monthly_price_cents=plan_info['monthly_cents'],
        primary_state=body.primary_state,
        logo_url=body.logo_url,
        primary_color=body.primary_color,
    )
    from datetime import timedelta
    tenant.trial_ends_at = utcnow().__class__(
        *utcnow().timetuple()[:6], tzinfo=utcnow().tzinfo
    ).replace() if False else None  # set below

    import datetime as dt
    tenant.trial_ends_at = dt.datetime.now(dt.timezone.utc) + dt.timedelta(days=14)

    if not _demo_mode():
        try:
            stripe = _stripe()
            customer = stripe.Customer.create(
                email=body.contact_email,
                name=body.business_name,
                metadata={'tenant_id': body.tenant_id},
            )
            tenant.stripe_customer_id = customer['id']
            sub = stripe.Subscription.create(
                customer=customer['id'],
                items=[{'price': plan_info['stripe_price_id']}],
                trial_period_days=14,
            )
            tenant.stripe_subscription_id = sub['id']
            tenant.status = 'trial'
        except Exception as e:
            tenant.status = 'trial'

    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return _tenant_out(tenant)


@router.get('/tenants/{tenant_id_str}', dependencies=[Depends(verify_premium_security)])
def get_tenant(tenant_id_str: str, db: Session = Depends(get_db)):
    tenant = db.query(TenantRecord).filter(TenantRecord.tenant_id == tenant_id_str).first()
    if not tenant:
        raise HTTPException(404, 'Tenant not found')
    return _tenant_out(tenant)


@router.post('/tenants/{tenant_id_str}/upgrade', dependencies=[Depends(verify_premium_security)])
def upgrade_tenant(
    tenant_id_str: str,
    plan: str = Body(..., embed=True),
    db: Session = Depends(get_db),
):
    tenant = db.query(TenantRecord).filter(TenantRecord.tenant_id == tenant_id_str).first()
    if not tenant:
        raise HTTPException(404, 'Tenant not found')
    if plan not in PLANS:
        raise HTTPException(400, f'Unknown plan: {plan}. Valid: {list(PLANS)}')
    plan_info = PLANS[plan]
    tenant.plan = plan
    tenant.monthly_price_cents = plan_info['monthly_cents']
    if not _demo_mode() and tenant.stripe_subscription_id:
        try:
            stripe = _stripe()
            sub = stripe.Subscription.retrieve(tenant.stripe_subscription_id)
            stripe.Subscription.modify(
                tenant.stripe_subscription_id,
                items=[{'id': sub['items']['data'][0]['id'], 'price': plan_info['stripe_price_id']}],
                proration_behavior='always_invoice',
            )
        except Exception:
            pass
    db.commit()
    return _tenant_out(tenant)


@router.post('/tenants/{tenant_id_str}/cancel', dependencies=[Depends(verify_premium_security)])
def cancel_tenant(tenant_id_str: str, db: Session = Depends(get_db)):
    tenant = db.query(TenantRecord).filter(TenantRecord.tenant_id == tenant_id_str).first()
    if not tenant:
        raise HTTPException(404, 'Tenant not found')
    tenant.status = 'cancelled'
    if not _demo_mode() and tenant.stripe_subscription_id:
        try:
            stripe = _stripe()
            stripe.Subscription.cancel(tenant.stripe_subscription_id)
        except Exception:
            pass
    db.commit()
    return _tenant_out(tenant)


@router.post('/webhook')
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Stripe webhook — handles invoice.paid, subscription.deleted, customer.subscription.updated."""
    payload = await request.body()
    sig = request.headers.get('Stripe-Signature', '')
    webhook_secret = getattr(settings, 'stripe_webhook_secret', None)

    if webhook_secret and not _demo_mode():
        try:
            stripe = _stripe()
            event = stripe.Webhook.construct_event(payload, sig, webhook_secret)
        except Exception as e:
            raise HTTPException(400, f'Webhook error: {e}')
    else:
        try:
            event = json.loads(payload)
        except Exception:
            raise HTTPException(400, 'Invalid JSON')

    event_type = event.get('type', '')
    data = event.get('data', {}).get('object', {})
    stripe_event_id = event.get('id', f'demo_{int(time.time())}')

    tenant = None
    customer_id = data.get('customer')
    if customer_id:
        tenant = db.query(TenantRecord).filter(TenantRecord.stripe_customer_id == customer_id).first()

    if tenant:
        ev = TenantBillingEvent(
            tenant_id=tenant.id,
            stripe_event_id=stripe_event_id,
            event_type=event_type,
            amount_cents=data.get('amount_paid') or data.get('amount', 0),
            status=data.get('status'),
            raw_json=json.dumps(event)[:4000],
        )
        db.add(ev)

        if event_type == 'invoice.paid':
            tenant.status = 'active'
            period_end = data.get('lines', {}).get('data', [{}])
            if period_end:
                ts = period_end[0].get('period', {}).get('end')
                if ts:
                    from datetime import datetime, timezone
                    tenant.current_period_end = datetime.fromtimestamp(ts, tz=timezone.utc)
        elif event_type in ('customer.subscription.deleted', 'invoice.payment_failed'):
            tenant.status = 'past_due' if 'failed' in event_type else 'cancelled'

        db.commit()

    return {'received': True}


@router.get('/analytics', dependencies=[Depends(verify_premium_security)])
def saas_analytics(db: Session = Depends(get_db)):
    """Platform-level SaaS metrics for the admin console."""
    tenants = db.query(TenantRecord).all()
    by_plan: dict[str, int] = {}
    by_status: dict[str, int] = {}
    mrr = 0.0
    for t in tenants:
        by_plan[t.plan] = by_plan.get(t.plan, 0) + 1
        by_status[t.status] = by_status.get(t.status, 0) + 1
        if t.status == 'active':
            mrr += t.monthly_price_cents / 100

    return {
        'total_tenants': len(tenants),
        'by_plan': by_plan,
        'by_status': by_status,
        'mrr_usd': round(mrr, 2),
        'arr_usd': round(mrr * 12, 2),
        'demo': _demo_mode(),
    }

