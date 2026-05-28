"""
proposals.py — proposal generator endpoints.

Routes:
  POST /api/v1/proposals/generate       — generate text + PDF proposal
  POST /api/v1/proposals/{lead_id}/send — generate and email proposal to lead
"""

import base64
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Body, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.limiter import limiter
from ..core.security import verify_premium_security
from ..database import get_db
from ..models import Lead
from ..services.audit import write_audit_event
from ..services.estimate_approval import (
    estimate_requires_approval,
    stage_proposal_for_approval,
)
from ..services.notifications import send_transactional_email
from ..services.pricing import estimate_price
from ..services.proposal_generator import generate_proposal_pdf, generate_proposal_text

logger = logging.getLogger(__name__)
router = APIRouter(prefix='/api/v1/proposals', tags=['proposals'])


class ProposalRequest(BaseModel):
    lead_id: int
    include_pdf: bool = True


def _build_lead_dict(lead: Lead) -> dict:
    pricing = estimate_price(
        lead.service_type,
        lead.property_type,
        lead.project_size_sqft or 1000,
        state_code=lead.state_code,
    )
    return {
        'id': lead.id,
        'name': lead.name,
        'email': lead.email,
        'phone': lead.phone,
        'service_type': lead.service_type,
        'property_type': lead.property_type,
        'urgency': lead.urgency,
        'project_size_sqft': lead.project_size_sqft,
        'address': lead.address,
        'state_code': lead.state_code,
        'message': lead.message,
        'price_low': pricing['low_usd'] if pricing else 'Contact for pricing',
        'price_high': pricing['high_usd'] if pricing else '',
    }


@router.post('/generate', summary='Generate a professional proposal for a lead')
@limiter.limit('10/minute')
async def generate_proposal(
    request: Request,
    req: ProposalRequest = Body(...),
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    lead = db.get(Lead, req.lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail='Lead not found')

    lead_dict = _build_lead_dict(lead)
    proposal_text = generate_proposal_text(lead_dict)

    result: dict = {
        'proposal_id': lead.id,
        'lead_id': lead.id,
        'lead_name': lead.name,
        'proposal_text': proposal_text,
    }

    if req.include_pdf:
        pdf_bytes = generate_proposal_pdf(lead_dict)
        b64 = base64.b64encode(pdf_bytes).decode()
        # Keep both names for backward compatibility
        result['pdf_b64'] = b64
        result['pdf_base64'] = b64
        result['pdf_size_bytes'] = len(pdf_bytes)

    try:
        if lead.pipeline_stage in ('new', 'contacted'):
            lead.pipeline_stage = 'proposal_sent'
            lead.proposal_sent_at = datetime.now(timezone.utc)
            db.commit()
    except Exception as exc:  # noqa: BLE001
        logger.warning('Could not update pipeline stage: %s', exc)

    write_audit_event(
        db,
        event_type='proposal.generated',
        actor_type='admin',
        actor_id='protected_api',
        entity_type='lead',
        entity_id=lead.id,
        summary=f'Proposal generated for lead {lead.name}.',
        detail={'include_pdf': req.include_pdf, 'service_type': lead.service_type},
    )

    return result


def _send_proposal_email(lead_dict: dict, proposal_text: str, pdf_bytes: bytes | None) -> None:
    recipient = lead_dict.get('email', '')
    if not recipient or '@' not in recipient:
        logger.warning('Invalid recipient email for proposal: %s', recipient)
        return

    subject = 'Your Project Proposal from J. Worden & Sons Asphalt Paving'
    html_body = f"""
    <html><body style="font-family: sans-serif; color: #1a1a2e; max-width: 700px;">
      <div style="background: #f5a623; padding: 20px; text-align: center;">
        <h1 style="color: #1a1a2e; margin: 0;">J. Worden & Sons Asphalt Paving</h1>
        <p style="color: #1a1a2e; margin: 4px 0;">Project Proposal</p>
      </div>
      <div style="padding: 24px;">
        <p>Dear {lead_dict.get('name', 'Valued Customer')},</p>
        <p>Thank you for your interest in our services. Please find your project proposal attached.</p>
        <pre style="background: #f9f9f9; padding: 16px; border-radius: 4px; white-space: pre-wrap; font-size: 13px;">
{proposal_text[:3000]}
        </pre>
        <p>Please don't hesitate to contact us with any questions.</p>
      </div>
    </body></html>
    """

    filename = f"proposal_{lead_dict.get('name', 'client').replace(' ', '_')}.pdf"
    ok = send_transactional_email(
        subject=subject,
        html_body=html_body,
        to_addresses=[recipient],
        attachment_bytes=pdf_bytes,
        attachment_name=filename,
    )

    if ok:
        logger.info('Proposal emailed to %s', recipient)
    else:
        logger.error('Proposal email send failed for %s', recipient)


@router.post('/{lead_id}/send', summary='Generate and queue proposal for human approval before customer send')
@limiter.limit('5/minute')
async def send_proposal(
    request: Request,
    lead_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail='Lead not found')
    if not lead.email or '@' not in lead.email:
        raise HTTPException(status_code=422, detail='Lead has no valid email address')

    lead_dict = _build_lead_dict(lead)
    proposal_text = generate_proposal_text(lead_dict)
    pdf_bytes = generate_proposal_pdf(lead_dict)

    # Build the fully-rendered email payload up front so it is reproducible
    # whether dispatched now (legacy / dev) or after approval (default).
    recipient = lead_dict.get('email', '')
    subject = 'Your Project Proposal from J. Worden & Sons Asphalt Paving'
    html_body = f"""
    <html><body style="font-family: sans-serif; color: #1a1a2e; max-width: 700px;">
      <div style="background: #f5a623; padding: 20px; text-align: center;">
        <h1 style="color: #1a1a2e; margin: 0;">J. Worden & Sons Asphalt Paving</h1>
        <p style="color: #1a1a2e; margin: 4px 0;">Project Proposal</p>
      </div>
      <div style="padding: 24px;">
        <p>Dear {lead_dict.get('name', 'Valued Customer')},</p>
        <p>Thank you for your interest in our services. Please find your project proposal attached.</p>
        <pre style="background: #f9f9f9; padding: 16px; border-radius: 4px; white-space: pre-wrap; font-size: 13px;">
{proposal_text[:3000]}
        </pre>
        <p>Please don't hesitate to contact us with any questions.</p>
      </div>
    </body></html>
    """
    filename = f"proposal_{lead_dict.get('name', 'client').replace(' ', '_')}.pdf"

    payload = {
        'recipient':    recipient,
        'subject':      subject,
        'html_body':    html_body,
        'plain_text':   proposal_text,
        'pdf_b64':      base64.b64encode(pdf_bytes).decode() if pdf_bytes else '',
        'filename':     filename,
        'lead_id':      lead.id,
        'lead_name':    lead.name,
        'service_type': lead.service_type,
        'price_low':    lead_dict.get('price_low', ''),
        'price_high':   lead_dict.get('price_high', ''),
    }

    # Default behavior: stage for Mr. Worden's approval. Customer never sees
    # an estimate until it's been reviewed in the command center.
    if estimate_requires_approval():
        item = stage_proposal_for_approval(db, lead, payload)
        write_audit_event(
            db,
            event_type='proposal.staged_for_approval',
            actor_type='admin',
            actor_id='protected_api',
            entity_type='lead',
            entity_id=lead.id,
            summary=f'Proposal staged for approval for {recipient}.',
            detail={'review_item_id': item.id, 'recipient': recipient},
        )
        return {
            'status':          'pending_approval',
            'message':         f'Proposal queued for review — approve in command center to release to {recipient}',
            'review_item_id':  item.id,
            'lead_id':         lead_id,
            'lead_name':       lead.name,
            'recipient':       recipient,
            'price_low':       payload['price_low'],
            'price_high':      payload['price_high'],
        }

    # Auto-send path (only when ESTIMATE_REQUIRES_APPROVAL=false)
    background_tasks.add_task(_send_proposal_email, lead_dict, proposal_text, pdf_bytes)
    write_audit_event(
        db,
        event_type='proposal.queued_for_send',
        actor_type='admin',
        actor_id='protected_api',
        entity_type='lead',
        entity_id=lead.id,
        summary=f'Proposal queued for automatic send to {recipient}.',
        detail={'recipient': recipient},
    )
    return {
        'status': 'queued',
        'message': f'Proposal will be emailed to {lead.email} (auto-send, approval gate disabled)',
        'lead_id': lead_id,
        'lead_name': lead.name,
    }
