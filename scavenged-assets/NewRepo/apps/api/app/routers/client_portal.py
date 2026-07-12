"""Client portal — customer-facing: view proposals, pay deposit, track job status."""
from __future__ import annotations

import hashlib
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..config import settings
from ..core.limiter import limiter
from ..database import get_db
from ..models import Customer, Lead, ProposalOutcome, WorkOrder, PaymentTransaction
from ..routers.auth import is_token_revoked
from ..services.email_service import send_email

router = APIRouter(prefix='/portal', tags=['client-portal'])

_PORTAL_TOKEN_HOURS = 24 * 7   # 7-day portal tokens


class PortalAuthRequest(BaseModel):
    email: str


class PortalTokenResponse(BaseModel):
    access_token: str
    customer_id: int
    name: str
    expires_in: int


def _issue_portal_jwt(customer_id: int, email: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        'sub': str(customer_id),
        'email': email,
        'type': 'portal',
        'jti': uuid.uuid4().hex,
        'iat': int(now.timestamp()),
        'exp': int((now + timedelta(hours=_PORTAL_TOKEN_HOURS)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def _get_portal_customer(request: Request, db: Session) -> Customer:
    """Dependency: validate portal JWT (and revocation blocklist), return Customer row."""
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Portal token required')
    token = auth.split(' ', 1)[1]
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        if payload.get('type') != 'portal':
            raise HTTPException(401, 'Not a portal token')
        customer_id = int(payload['sub'])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid or expired portal token')
    if is_token_revoked(db, payload.get('jti')):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Portal token has been revoked')
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(404, 'Customer not found')
    return customer


def _send_magic_link(customer: Customer, token: str) -> bool:
    """Email the portal magic link (M3). Returns False when email is not configured/fails."""
    link = f'{settings.portal_base_url}?token={token}'
    html = f"""
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
  <h2 style="color:#1a1a2e">Your J. Worden &amp; Sons Portal Link</h2>
  <p>Hi {customer.name or 'there'}, click below to view your proposals, job status, and payments.</p>
  <p style="margin:24px 0"><a href="{link}"
     style="background:#f5a623;color:#1a1a2e;padding:12px 24px;border-radius:6px;
            text-decoration:none;font-weight:bold">Open My Portal</a></p>
  <p style="color:#666;font-size:13px">This link is valid for 7 days. If you didn't request it, you can ignore this email.</p>
</div>"""
    return send_email(
        to_email=customer.email or '',
        subject='Your J. Worden & Sons client portal link',
        html_content=html,
    )


@router.post('/auth')
@limiter.limit('5/minute')
async def portal_auth(request: Request, body: PortalAuthRequest, db: Session = Depends(get_db)):
    """
    Customer enters their email → magic link is emailed if they're in the CRM (M3).
    Production never returns the token in the response; non-production keeps the
    dev shortcut so local testing works without SendGrid.
    """
    generic = {'message': 'If that email is in our system, a portal link has been sent.'}
    customer = db.query(Customer).filter(
        Customer.email == body.email.lower().strip()
    ).first()
    if not customer:
        return generic  # don't reveal whether the email exists
    token = _issue_portal_jwt(customer.id, customer.email or '')

    if settings.environment == 'production':
        if not settings.sendgrid_api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail='Portal email delivery is not configured',
            )
        _send_magic_link(customer, token)
        return generic

    # Dev/test shortcut: return the token directly
    return {
        'access_token': token,
        'customer_id': customer.id,
        'name': customer.name,
        'expires_in': _PORTAL_TOKEN_HOURS * 3600,
        'message': 'Token valid for 7 days.',
    }


@router.get('/me')
async def portal_me(request: Request, db: Session = Depends(get_db)):
    """Return the authenticated customer's profile."""
    customer = _get_portal_customer(request, db)
    return {
        'id': customer.id,
        'name': customer.name,
        'email': customer.email,
        'phone': customer.phone,
        'city': customer.city,
        'state_code': customer.state_code,
        'customer_type': customer.customer_type,
        'total_jobs': customer.total_jobs,
        'total_revenue': customer.total_revenue,
        'member_since': customer.created_at.isoformat() if customer.created_at else None,
    }


@router.get('/proposals')
async def portal_proposals(request: Request, db: Session = Depends(get_db)):
    """Return all proposals tied to the customer's leads."""
    customer = _get_portal_customer(request, db)
    leads = db.query(Lead).filter(Lead.email == customer.email).all()
    lead_ids = {l.id for l in leads}
    proposals = db.query(ProposalOutcome).filter(ProposalOutcome.lead_id.in_(lead_ids)).all()
    return {
        'proposals': [
            {
                'id': p.id,
                'title': p.proposal_title,
                'body': p.proposal_body,
                'estimated_value': p.estimated_value,
                'outcome': p.outcome or 'pending',
                'generated_at': p.generated_at.isoformat() if p.generated_at else None,
            }
            for p in proposals
        ],
        'total': len(proposals),
    }


@router.get('/jobs')
async def portal_jobs(request: Request, db: Session = Depends(get_db)):
    """Return active and completed work orders for this customer."""
    customer = _get_portal_customer(request, db)
    leads = db.query(Lead).filter(Lead.email == customer.email).all()
    lead_ids = {l.id for l in leads}
    wos = db.query(WorkOrder).filter(WorkOrder.lead_id.in_(lead_ids)).all()
    return {
        'jobs': [
            {
                'id': wo.id,
                'title': wo.title,
                'status': wo.status,
                'site_address': wo.site_address,
                'scheduled_date': wo.scheduled_date.isoformat() if wo.scheduled_date else None,
                'started_at': wo.started_at.isoformat() if wo.started_at else None,
                'completed_at': wo.completed_at.isoformat() if wo.completed_at else None,
                'notes': wo.notes,
            }
            for wo in wos
        ],
        'total': len(wos),
    }


@router.get('/payments')
async def portal_payments(request: Request, db: Session = Depends(get_db)):
    """Return payment history for this customer's leads."""
    customer = _get_portal_customer(request, db)
    leads = db.query(Lead).filter(Lead.email == customer.email).all()
    lead_ids = {l.id for l in leads}
    txns = db.query(PaymentTransaction).filter(PaymentTransaction.lead_id.in_(lead_ids)).all()
    return {
        'payments': [
            {
                'id': t.id,
                'amount': t.amount_cents / 100 if t.amount_cents else None,
                'status': t.status,
                'created_at': t.created_at.isoformat(),
            }
            for t in txns
        ],
        'total': len(txns),
    }
