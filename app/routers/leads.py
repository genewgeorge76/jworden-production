import logging
import os
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from typing import Optional

from ..core.limiter import limiter
from ..database import get_db
from ..models import Lead, ContactMessage
from ..services.audit import write_audit_event
from ..services.lead_scorer import score_lead
from ..services.notifications import send_lead_notification
from ..services.pricing import estimate_price
from ..services.state_data import normalize_state_code
from ..services.email_service import send_quote_confirmation, send_admin_notification, send_contact_response

router = APIRouter(prefix="/api/v1/leads", tags=["leads"])

logger = logging.getLogger(__name__)


class QuoteRequest(BaseModel):
    model_config = {"str_strip_whitespace": True}

    name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    phone: str = Field(..., min_length=7, max_length=30)
    service_type: str = Field(..., max_length=60)   # paving | sealcoating | crackfill | parking_lot | driveway
    property_type: str = Field(..., max_length=30)  # residential | commercial
    urgency: str = Field(..., max_length=30)         # asap | within_1_week | within_1_month | flexible
    project_size_sqft: Optional[float] = Field(default=None, ge=0, le=10_000_000)
    address: Optional[str] = Field(default=None, max_length=300)
    state_code: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=2,
        pattern=r"^[A-Za-z]{2}$",
        description="2-letter US state abbreviation (validated against the 50 states + DC).",
    )
    message: Optional[str] = Field(default=None, max_length=2000)


class ContactRequest(BaseModel):
    model_config = {"str_strip_whitespace": True}

    name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=30)
    message: str = Field(..., min_length=1, max_length=2000)


class WebsiteLeadRequest(BaseModel):
    """Loose-shape lead from the public marketing site (gemni-investigate).

    All fields optional except firstName + phone + jobDescription, mirroring
    what the customer-facing form requires. Email is optional because many
    paving customers will only leave a phone number.
    """

    model_config = {"str_strip_whitespace": True, "extra": "ignore"}

    firstName: str = Field(..., min_length=1, max_length=80)
    lastName: Optional[str] = Field(default=None, max_length=80)
    phone: str = Field(..., min_length=7, max_length=30)
    email: Optional[str] = Field(default=None, max_length=200)
    serviceAddress: Optional[str] = Field(default=None, max_length=300)
    jobDescription: str = Field(..., min_length=1, max_length=2000)
    source: Optional[str] = Field(default="gemni-investigate", max_length=60)
    path: Optional[str] = Field(default=None, max_length=200)


class EstimateRequest(BaseModel):
    service_type: str = Field(..., max_length=60)
    property_type: str = Field(default="residential", max_length=30)
    project_size_sqft: float = Field(..., gt=0, le=10_000_000)
    state_code: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=2,
        pattern=r"^[A-Za-z]{2}$",
        description="Optional 2-letter US state abbreviation for regional price adjustment.",
    )


@router.post("/quote", summary="Submit a quote request")
@limiter.limit("10/minute")
async def submit_quote(
    request: Request,
    req: QuoteRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    # Validate state against the 50-state + DC list. Reject unknown abbreviations
    # (Pydantic has already enforced "two letters", so a non-None mismatch here
    # means the abbreviation just isn't a real US state).
    validated_state = normalize_state_code(req.state_code)
    if req.state_code and validated_state is None:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown US state abbreviation: {req.state_code!r}",
        )

    lead_data = req.model_dump()
    lead_data["state_code"] = validated_state  # use canonical upper-case form
    scoring = score_lead(lead_data)
    lead_data["score"] = scoring

    # Persist to database
    db_lead = Lead(
        name=req.name,
        email=req.email,
        phone=req.phone,
        service_type=req.service_type,
        property_type=req.property_type,
        urgency=req.urgency,
        project_size_sqft=req.project_size_sqft,
        address=req.address,
        state_code=validated_state,
        message=req.message,
        score_value=scoring["score"],
        score_label=scoring["label"],
        score_priority=scoring["priority"],
    )
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    lead_data["db_id"] = db_lead.id

    write_audit_event(
        db,
        event_type="lead.quote_submitted",
        actor_type="customer",
        actor_id=db_lead.email,
        entity_type="lead",
        entity_id=db_lead.id,
        summary=f"Quote request submitted for {db_lead.service_type} ({scoring['label']}).",
        detail={
            "state_code": validated_state,
            "property_type": db_lead.property_type,
            "score_label": scoring["label"],
            "score_priority": scoring["priority"],
        },
    )

    background_tasks.add_task(send_lead_notification, lead_data)

    # SendGrid: send confirmation to customer + admin notification
    background_tasks.add_task(send_quote_confirmation, db_lead)
    background_tasks.add_task(send_admin_notification, db_lead)

    # Feature 4: Schedule follow-up based on lead score
    label = scoring.get("label", "COOL")
    try:
        from ..services.follow_up_tasks import schedule_follow_up  # noqa: PLC0415
        if label == "HOT":
            schedule_follow_up(db_lead.id, "hot_1h", delay_seconds=3600, db=db)
        elif label == "WARM":
            schedule_follow_up(db_lead.id, "warm_3d", delay_seconds=3 * 86400, db=db)
        else:
            schedule_follow_up(db_lead.id, "cool_7d", delay_seconds=7 * 86400, db=db)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Could not schedule follow-up: %s", exc)

    # Celery: dispatch scheduled follow-up email task
    try:
        from ..tasks.email_tasks import send_follow_up_email  # noqa: PLC0415
        task_type_map = {"HOT": "hot_1h", "WARM": "warm_3d", "COOL": "cool_7d"}
        task_type = task_type_map.get(label, "cool_7d")
        delay_map = {"hot_1h": 3600, "warm_3d": 3 * 86400, "cool_7d": 7 * 86400}
        countdown = delay_map[task_type]
        broker_url = os.getenv("CELERY_BROKER_URL") or os.getenv("REDIS_URL")
        if not broker_url:
            logger.info("Celery broker not configured — skipping async follow-up dispatch")
        elif hasattr(send_follow_up_email, "apply_async"):
            send_follow_up_email.apply_async(
                kwargs={"lead_id": db_lead.id, "task_type": task_type},
                countdown=countdown,
                ignore_result=True,
            )
            logger.info(
                "Scheduled %s follow-up email for lead #%d (countdown=%ds)",
                task_type,
                db_lead.id,
                countdown,
            )
        else:
            logger.info("Celery unavailable — follow-up email will not be scheduled")
    except Exception as exc:  # noqa: BLE001
        logger.warning("Could not dispatch follow-up email task: %s", exc)

    response: dict = {
        "status": "received",
        "message": "Thank you! We will contact you within 24 hours.",
        "lead_id": db_lead.id,
        "lead_score": scoring["label"],
        "priority": scoring["priority"],
        "follow_up_sla": scoring["follow_up_sla"],
    }
    if "compliance_warning" in scoring:
        response["compliance_warning"] = scoring["compliance_warning"]
        logger.info(
            "Lead #%d (%s) flagged with compliance warning: %s",
            db_lead.id, validated_state, scoring["compliance_warning"],
        )
    return response


@router.post("/contact", summary="Submit a contact form message")
@limiter.limit("10/minute")
async def submit_contact(
    request: Request,
    req: ContactRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    # Persist to database
    db_msg = ContactMessage(
        name=req.name,
        email=req.email,
        phone=req.phone,
        message=req.message,
    )
    db.add(db_msg)
    db.commit()
    db.refresh(db_msg)

    write_audit_event(
        db,
        event_type="lead.contact_submitted",
        actor_type="customer",
        actor_id=db_msg.email,
        entity_type="contact_message",
        entity_id=db_msg.id,
        summary="General contact form submitted.",
        detail={"has_phone": bool(db_msg.phone)},
    )

    lead_data = {**req.model_dump(), "type": "contact"}
    background_tasks.add_task(send_lead_notification, lead_data)

    # SendGrid: send auto-reply to customer
    background_tasks.add_task(send_contact_response, db_msg)

    return {
        "status": "received",
        "message": "Thank you for reaching out! We will get back to you soon.",
    }


@router.post("/estimate", summary="Get a ballpark price estimate")
@limiter.limit("30/minute")
async def get_estimate(request: Request, req: EstimateRequest):
    """
    Returns a ballpark cost range for the requested service and project size.
    No authentication required — helps prospects self-qualify before submitting a quote.

    Honors an optional ``state_code`` to apply the regional labor/material
    multiplier from ``state_data.STATE_MAP``; unknown abbreviations are
    rejected with 422 (Pydantic enforces the two-letter shape upstream).
    """
    validated_state = normalize_state_code(req.state_code)
    if req.state_code and validated_state is None:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown US state abbreviation: {req.state_code!r}",
        )
    result = estimate_price(
        req.service_type,
        req.property_type,
        req.project_size_sqft,
        state_code=validated_state,
    )
    if result is None:
        return {"estimate_available": False, "reason": "Service type not recognized"}
    return {"estimate_available": True, "state_code": validated_state, **result}



@router.post("/website", summary="Receive a public-website lead from the marketing site")
@limiter.limit("20/minute")
async def submit_website_lead(
    request: Request,
    req: WebsiteLeadRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Bridge endpoint for the gemni-investigate (public marketing) site.

    Persists the lead exactly like /contact, but accepts the site's looser
    field shape (firstName/lastName/phone/jobDescription/...). Email is
    optional; when missing we synthesize a placeholder so downstream code
    that expects an email field doesn't crash.
    """

    full_name = " ".join(p for p in (req.firstName, req.lastName) if p).strip()
    email = req.email or f"no-email+{(req.phone or 'unknown').replace('+', '').replace(' ', '')}@jwordenasphaltpaving.com"

    message_parts = [req.jobDescription]
    if req.serviceAddress:
        message_parts.append(f"Service address: {req.serviceAddress}")
    if req.source:
        message_parts.append(f"Source: {req.source}{(' ' + req.path) if req.path else ''}")
    message_body = "\n\n".join(message_parts)

    db_msg = ContactMessage(
        name=full_name,
        email=email,
        phone=req.phone,
        message=message_body,
    )
    db.add(db_msg)
    db.commit()
    db.refresh(db_msg)

    write_audit_event(
        db,
        event_type="lead.website_submitted",
        actor_type="customer",
        actor_id=db_msg.email,
        entity_type="contact_message",
        entity_id=db_msg.id,
        summary="Public website lead submitted (gemni-investigate).",
        detail={
            "source": req.source,
            "path": req.path,
            "has_email": bool(req.email),
            "has_address": bool(req.serviceAddress),
        },
    )

    payload = {**req.model_dump(), "type": "website"}
    background_tasks.add_task(send_lead_notification, payload)
    if req.email:
        background_tasks.add_task(send_contact_response, db_msg)

    return {"status": "received", "id": db_msg.id}
