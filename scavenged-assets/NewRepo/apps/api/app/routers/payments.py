"""
payments.py — Stripe checkout and webhook router.

Routes (under /api/v1/payments):
  POST /checkout-session     create Stripe deposit checkout session
  POST /webhook              Stripe webhook handler
  GET  /status/{lead_id}     get latest payment transaction for a lead
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.limiter import PAYMENTS_LIMIT, limiter
from ..core.security import verify_premium_security
from ..database import get_db
from ..models import Lead, PaymentTransaction

logger = logging.getLogger(__name__)

router = APIRouter(prefix='/payments', tags=['payments'])


class CheckoutRequest(BaseModel):
    lead_id: str
    success_url: str
    cancel_url: str
    deposit_pct: float = 0.20


def _stripe():
    import stripe as _s  # noqa: PLC0415
    from ..config import settings  # noqa: PLC0415
    if not settings.stripe_secret_key:
        raise RuntimeError('STRIPE_SECRET_KEY not configured')
    _s.api_key = settings.stripe_secret_key
    return _s


@router.post('/checkout-session', summary='Create a Stripe deposit checkout session')
@limiter.limit(PAYMENTS_LIMIT)
async def create_checkout_session(
    request: Request,
    body: CheckoutRequest,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    lead = db.get(Lead, body.lead_id)
    if not lead:
        raise HTTPException(404, 'Lead not found')

    estimated_value = lead.estimated_value or 0.0
    if estimated_value <= 0:
        raise HTTPException(422, 'Lead has no estimated value — set estimated_value before creating a payment')

    deposit_amount = round(estimated_value * body.deposit_pct)
    deposit_cents = int(deposit_amount * 100)

    from ..config import settings  # noqa: PLC0415

    if settings.stripe_secret_key:
        try:
            stripe = _stripe()
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': f'J. Worden & Sons — {int(body.deposit_pct * 100)}% Deposit',
                            'description': f'Deposit for {lead.name} — {lead.service or "paving services"}',
                        },
                        'unit_amount': deposit_cents,
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=body.success_url,
                cancel_url=body.cancel_url,
                metadata={'lead_id': str(body.lead_id)},
            )
            checkout_session_id = session.id
            checkout_url = session.url
        except Exception as exc:
            logger.error('Stripe checkout creation failed: %s', exc)
            raise HTTPException(503, f'Payment service error: {exc}') from exc
    else:
        # Demo mode — return a mock checkout URL
        checkout_session_id = f'mock_cs_{body.lead_id}'
        checkout_url = f'{body.success_url}?mock=1&lead={body.lead_id}'

    txn = PaymentTransaction(
        lead_id=body.lead_id,
        stripe_checkout_session_id=checkout_session_id,
        amount_cents=deposit_cents,
        status='pending',
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)

    return {
        'transaction_id': txn.id,
        'checkout_url': checkout_url,
        'amount_cents': deposit_cents,
        'amount_usd': deposit_cents / 100,
        'status': 'pending',
    }


@router.post('/webhook', summary='Stripe webhook handler')
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(default='', alias='stripe-signature'),
    db: Session = Depends(get_db),
):
    payload = await request.body()

    from ..config import settings  # noqa: PLC0415

    if not settings.stripe_webhook_secret:
        raise HTTPException(501, 'Stripe webhook not configured')

    try:
        stripe = _stripe()
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, settings.stripe_webhook_secret
        )
    except Exception as exc:
        logger.warning('Stripe webhook signature verification failed: %s', exc)
        raise HTTPException(400, 'Invalid webhook signature') from exc

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        session_id = session.get('id')
        payment_intent = session.get('payment_intent')

        txn = (
            db.query(PaymentTransaction)
            .filter(PaymentTransaction.stripe_checkout_session_id == session_id)
            .first()
        )
        if txn:
            txn.status = 'paid'
            if payment_intent:
                txn.stripe_payment_intent_id = payment_intent
            db.commit()
            logger.info('Payment marked paid for session %s (lead %s)', session_id, txn.lead_id)

    return {'received': True}


@router.get('/status/{lead_id}', summary='Get latest payment status for a lead')
async def payment_status(
    lead_id: str,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    txn = (
        db.query(PaymentTransaction)
        .filter(PaymentTransaction.lead_id == lead_id)
        .order_by(PaymentTransaction.created_at.desc())
        .first()
    )
    if not txn:
        raise HTTPException(404, 'No payment transaction found for this lead')

    return {
        'transaction_id': txn.id,
        'lead_id': txn.lead_id,
        'amount_cents': txn.amount_cents,
        'amount_usd': (txn.amount_cents or 0) / 100,
        'status': txn.status,
        'stripe_checkout_session_id': txn.stripe_checkout_session_id,
        'created_at': txn.created_at.isoformat(),
    }
