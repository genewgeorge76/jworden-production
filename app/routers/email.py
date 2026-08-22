"""
email.py — Email management endpoints for JWordenAI.

Routes
──────
  POST /api/v1/email/send-test          — Send a test email (admin only)
  GET  /api/v1/email/templates          — List available email templates (admin only)
  POST /api/v1/email/resend/{lead_id}   — Resend confirmation email for a lead (admin only)

All routes require premium security (bearer token or master key).
"""

import logging
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from ..core.limiter import limiter
from ..core.security import verify_premium_security
from ..services.tenancy import get_scoped, tenant_of
from ..database import get_db
from ..models import Lead, InboxMessage
from ..services.email_service import (
    send_quote_confirmation,
    send_admin_notification,
    send_raw,
)
from ..services.email_templates import TEMPLATE_REGISTRY
from ..services.email_sync import sync_gmail_accounts

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/email", tags=["email"])


# ── Request / response schemas ─────────────────────────────────────────────────

class TestEmailRequest(BaseModel):
    model_config = {"str_strip_whitespace": True}

    to_email: EmailStr = Field(..., description="Recipient email address for the test")
    template: str = Field(
        default="quote_confirmation",
        description="Template name to preview (see GET /api/v1/email/templates)",
    )


class TestEmailResponse(BaseModel):
    sent: bool
    to_email: str
    template: str
    message: str


class ResendResponse(BaseModel):
    sent: bool
    lead_id: int
    to_email: str
    message: str


class SyncResponse(BaseModel):
    status: str
    accounts_processed: int
    accounts_skipped: int
    emails_read: int
    leads_created: int
    errors: list[str]


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post(
    "/sync",
    summary="Trigger IMAP sync of 5 Gmail accounts (admin only)",
)
@limiter.limit("5/minute")
async def trigger_email_sync(
    request: Request,
    background_tasks: BackgroundTasks,
    auth: dict = Depends(verify_premium_security),
):
    """
    Fires the IMAP email sync in the background and returns immediately.
    Prevents 502 timeouts when syncing hundreds of emails with GPT-4o analysis.
    """
    def _run_sync():
        try:
            results = sync_gmail_accounts()
            logger.info("Background email sync complete: %s", results)
        except Exception as exc:
            logger.error("Background email sync failed: %s", exc, exc_info=True)

    background_tasks.add_task(_run_sync)
    logger.info("Email sync triggered in background via API")
    return {"status": "started", "message": "Email sync is running in the background. Check the Inbox Triage panel in ~60 seconds."}

@router.post(
    "/send-test",
    response_model=TestEmailResponse,
    summary="Send a test email (admin only)",
)
@limiter.limit("10/minute")
async def send_test_email(
    request: Request,
    body: TestEmailRequest,
    auth: dict = Depends(verify_premium_security),
):
    """
    Send a test email using one of the available templates.

    A synthetic lead / contact object is constructed so the template renders
    with realistic placeholder data. Useful for verifying SendGrid configuration
    and previewing template output before going live.
    """
    template_name = body.template

    if template_name not in TEMPLATE_REGISTRY:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unknown template '{template_name}'. "
                f"Available: {list(TEMPLATE_REGISTRY.keys())}"
            ),
        )

    # Build a synthetic lead/contact for template rendering
    synthetic_lead = {
        "id": 0,
        "name": "Test Customer",
        "email": body.to_email,
        "phone": "(804) 555-0199",
        "service_type": "asphalt_paving",
        "property_type": "commercial",
        "urgency": "within_1_week",
        "project_size_sqft": 5000.0,
        "address": "123 Test St, Richmond, VA 23220",
        "message": "This is a test email sent from the JWordenAI admin panel.",
        "score_label": "HOT",
        "score_value": 95,
        "score_priority": 1,
    }

    from ..services import email_templates as tmpl  # noqa: PLC0415

    template_fn_map = {
        "quote_confirmation": tmpl.quote_confirmation,
        "admin_new_lead": tmpl.admin_new_lead,
        "follow_up_hot": tmpl.follow_up_hot,
        "follow_up_warm": tmpl.follow_up_warm,
        "follow_up_cool": tmpl.follow_up_cool,
        "contact_response": tmpl.contact_response,
    }

    template_fn = template_fn_map.get(template_name)
    if template_fn is None:
        raise HTTPException(status_code=500, detail="Template function not found")

    subject, html_body, plain_text = template_fn(synthetic_lead)
    subject = f"[TEST] {subject}"

    sent = send_raw(
        to_email=body.to_email,
        subject=subject,
        html_body=html_body,
        plain_text=plain_text,
    )

    logger.info(
        "Test email: template=%r to=%s sent=%s",
        template_name,
        body.to_email,
        sent,
    )

    return TestEmailResponse(
        sent=sent,
        to_email=body.to_email,
        template=template_name,
        message=(
            f"Test email sent successfully to {body.to_email}."
            if sent
            else (
                "Email send failed. Check SENDGRID_API_KEY and SENDGRID_FROM_EMAIL "
                "environment variables, and review server logs for details."
            )
        ),
    )


@router.get(
    "/templates",
    summary="List available email templates (admin only)",
)
@limiter.limit("60/minute")
async def list_templates(
    request: Request,
    auth: dict = Depends(verify_premium_security),
):
    """
    Return metadata for all registered email templates.

    Each entry includes the template key, display name, description,
    the event that triggers it, and the intended recipient type.
    """
    return {
        "total": len(TEMPLATE_REGISTRY),
        "templates": [
            {"key": key, **meta}
            for key, meta in TEMPLATE_REGISTRY.items()
        ],
    }


@router.post(
    "/resend/{lead_id}",
    response_model=ResendResponse,
    summary="Resend confirmation email for a lead (admin only)",
)
@limiter.limit("20/minute")
async def resend_confirmation(
    request: Request,
    lead_id: int,
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    """
    Resend the quote confirmation email to the customer for a given lead.

    Useful when the original email was not delivered or the customer requests
    a copy. Also triggers a fresh admin notification.
    """
    lead = get_scoped(db, Lead, lead_id, tenant_of(auth))
    if lead is None:
        raise HTTPException(status_code=404, detail=f"Lead #{lead_id} not found")

    if not lead.email:
        raise HTTPException(
            status_code=422,
            detail=f"Lead #{lead_id} has no email address — cannot resend",
        )

    # Resend customer confirmation
    customer_sent = send_quote_confirmation(lead)

    # Also fire admin notification so J. Worden is aware of the resend
    send_admin_notification(lead)

    logger.info(
        "Resend confirmation: lead_id=%d email=%s sent=%s",
        lead_id,
        lead.email,
        customer_sent,
    )

    return ResendResponse(
        sent=customer_sent,
        lead_id=lead_id,
        to_email=lead.email,
        message=(
            f"Confirmation email resent to {lead.email}."
            if customer_sent
            else (
                "Email send failed. Check SENDGRID_API_KEY and SENDGRID_FROM_EMAIL "
                "environment variables, and review server logs for details."
            )
        ),
    )


@router.get(
    "/triage",
    summary="Get daily inbox triage summary (admin only)",
)
@limiter.limit("20/minute")
async def get_triage_summary(
    request: Request,
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    """
    Returns all parsed InboxMessage records from the last 24 hours,
    grouped by category and sorted by importance.
    """
    from datetime import datetime, timedelta, timezone
    
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    
    messages = (
        db.query(InboxMessage)
        .filter(InboxMessage.created_at >= cutoff)
        .order_by(InboxMessage.importance_score.desc(), InboxMessage.created_at.desc())
        .all()
    )
    
    return {
        "status": "ok",
        "total_emails": len(messages),
        "messages": [
            {
                "id": m.id,
                "email_account": m.email_account,
                "sender_name": m.sender_name,
                "sender_email": m.sender_email,
                "subject": m.subject,
                "body_summary": m.body_summary,
                "category": m.category,
                "importance_score": m.importance_score,
                "is_lead": m.is_lead,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in messages
        ]
    }

