import base64
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Body, Depends, File, Form, HTTPException, Query, Request, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..core.security import verify_premium_security
from ..database import get_db
from ..models import Estimate, Job, Lead, ProjectDocument, WorkOrder
from ..services.audit import write_audit_event
from ..services.monitoring_service import monitoring
from ..services.pricing import estimate_price

router = APIRouter(prefix="/api/v1/operations", tags=["operations"])
_MAX_DOCUMENT_UPLOAD_BYTES = 15 * 1024 * 1024


class EstimateFromLeadRequest(BaseModel):
    lead_id: int
    scope_summary: str | None = Field(default=None, max_length=2000)


class JobFromEstimateRequest(BaseModel):
    estimate_id: int
    name: str | None = Field(default=None, max_length=200)
    scheduled_start: datetime | None = None
    scheduled_end: datetime | None = None


class WorkOrderCreateRequest(BaseModel):
    job_id: int
    title: str = Field(..., min_length=1, max_length=200)
    assigned_crew: str | None = Field(default=None, max_length=120)
    scheduled_for: datetime | None = None
    notes: str | None = Field(default=None, max_length=4000)


class JobUpdateRequest(BaseModel):
    status: str | None = Field(default=None, max_length=30)
    progress_percent: int | None = Field(default=None, ge=0, le=100)
    progress_notes: str | None = Field(default=None, max_length=4000)


class ProjectDocumentUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    visible_to_client: bool | None = None


class DemoSeedRequest(BaseModel):
    reset_existing: bool = True


def _estimate_number(lead_id: int) -> str:
    return f"EST-{lead_id}-{int(datetime.now(timezone.utc).timestamp())}"


def _job_number(estimate_id: int) -> str:
    return f"JOB-{estimate_id}-{int(datetime.now(timezone.utc).timestamp())}"


def _work_order_number(job_id: int) -> str:
    return f"WO-{job_id}-{int(datetime.now(timezone.utc).timestamp())}"


def _normalize_job_status(status: str | None) -> str:
    value = (status or "scheduled").strip().lower()
    aliases = {
        "active": "in_progress",
        "in-progress": "in_progress",
    }
    return aliases.get(value, value)


def _serialize_job(job: Job, lead: Lead | None = None) -> dict:
    scheduled_start = job.scheduled_start.isoformat() if job.scheduled_start else None
    scheduled_date = job.scheduled_start.date().isoformat() if job.scheduled_start else None
    start_time = job.scheduled_start.strftime("%I:%M %p").lstrip("0") if job.scheduled_start else None
    return {
        "id": job.id,
        "job_number": job.job_number,
        "estimate_id": job.estimate_id,
        "lead_id": job.lead_id,
        "status": _normalize_job_status(job.status),
        "name": job.name,
        "title": job.name,
        "service_type": job.service_type,
        "surface_type": job.service_type,
        "site_address": job.site_address,
        "address": job.site_address,
        "state_code": job.state_code,
        "scheduled_start": scheduled_start,
        "scheduled_end": job.scheduled_end.isoformat() if job.scheduled_end else None,
        "scheduled_date": scheduled_date,
        "start_time": start_time,
        "completed_at": job.completed_at.isoformat() if job.completed_at else None,
        "progress_percent": job.progress_percent or 0,
        "progress_notes": job.progress_notes,
        "notes": job.progress_notes,
        "client_name": lead.name if lead else None,
        "client_email": lead.email if lead else None,
        "client_phone": lead.phone if lead else None,
        "sqft": lead.project_size_sqft if lead else None,
        "project_size_sqft": lead.project_size_sqft if lead else None,
        "created_at": job.created_at.isoformat() if job.created_at else None,
        "updated_at": job.updated_at.isoformat() if job.updated_at else None,
    }


def _serialize_project_document(document: ProjectDocument) -> dict:
    return {
        "id": document.id,
        "job_id": document.job_id,
        "client_email": document.client_email,
        "document_type": document.document_type,
        "title": document.title,
        "description": document.description,
        "filename": document.filename,
        "mime_type": document.mime_type,
        "file_size_bytes": document.file_size_bytes,
        "file_url": document.file_url,
        "visible_to_client": bool(document.visible_to_client),
        "uploaded_by": document.uploaded_by,
        "created_at": document.created_at.isoformat() if document.created_at else None,
        "updated_at": document.updated_at.isoformat() if document.updated_at else None,
    }


def _serialize_document_collection(items: list[ProjectDocument]) -> dict:
    return {
        "total": len(items),
        "documents": [_serialize_project_document(item) for item in items],
    }


def _escape_pdf_text(value: str) -> str:
    return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _pdf_document_url(title: str, lines: list[str]) -> tuple[str, int, str]:
    text_commands = ["BT", "/F1 20 Tf", "72 742 Td", f"({_escape_pdf_text('J. Worden & Sons Asphalt Paving')}) Tj"]
    text_commands.extend(["/F1 15 Tf", "0 -32 Td", f"({_escape_pdf_text(title)}) Tj", "/F1 10 Tf"])
    for line in lines:
        text_commands.extend(["0 -18 Td", f"({_escape_pdf_text(line[:92])}) Tj"])
    text_commands.append("ET")
    stream = "\n".join(text_commands).encode("latin-1", errors="replace")
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Length " + str(len(stream)).encode("ascii") + b" >>\nstream\n" + stream + b"\nendstream",
    ]
    pdf = bytearray(b"%PDF-1.4\n")
    offsets = []
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{index} 0 obj\n".encode("ascii"))
        pdf.extend(obj)
        pdf.extend(b"\nendobj\n")
    xref_at = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode("ascii"))
    for offset in offsets:
        pdf.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
    pdf.extend(f"trailer << /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_at}\n%%EOF\n".encode("ascii"))
    encoded = base64.b64encode(bytes(pdf)).decode("utf-8")
    return f"data:application/pdf;base64,{encoded}", len(pdf), "application/pdf"


def _svg_document_url(title: str, subtitle: str, progress: int) -> tuple[str, int, str]:
    width = max(0, min(progress, 100)) * 8.6
    svg = f"""<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'>
<rect width='1200' height='800' fill='#111827'/>
<rect x='80' y='80' width='1040' height='640' rx='16' fill='#f8fafc'/>
<rect x='130' y='150' width='940' height='230' fill='#374151'/>
<path d='M140 360 L520 210 L710 330 L1060 190 L1060 360 Z' fill='#1f2937'/>
<rect x='170' y='430' width='860' height='34' rx='17' fill='#e5e7eb'/>
<rect x='170' y='430' width='{width}' height='34' rx='17' fill='#d97706'/>
<text x='170' y='525' font-family='Arial, sans-serif' font-size='44' font-weight='700' fill='#111827'>{title}</text>
<text x='170' y='580' font-family='Arial, sans-serif' font-size='28' fill='#4b5563'>{subtitle}</text>
<text x='170' y='640' font-family='Arial, sans-serif' font-size='24' fill='#92400e'>Progress: {progress}%</text>
</svg>""".encode("utf-8")
    encoded = base64.b64encode(svg).decode("utf-8")
    return f"data:image/svg+xml;base64,{encoded}", len(svg), "image/svg+xml"


def _create_seed_document(
    db: Session,
    *,
    job: Job,
    lead: Lead,
    document_type: str,
    title: str,
    description: str,
    filename: str,
    file_url: str,
    mime_type: str,
    file_size_bytes: int,
) -> ProjectDocument:
    document = ProjectDocument(
        id=str(uuid.uuid4()),
        job_id=job.id,
        client_email=lead.email.strip().lower(),
        document_type=document_type,
        title=title,
        description=description,
        filename=filename,
        mime_type=mime_type,
        file_size_bytes=file_size_bytes,
        file_url=file_url,
        visible_to_client=True,
        uploaded_by="demo_seed",
    )
    db.add(document)
    return document


@router.get("/leads/recent")
def list_recent_leads(
    limit: int = 12,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    leads = (
        db.query(Lead)
        .order_by(Lead.created_at.desc())
        .limit(min(limit, 50))
        .all()
    )
    return {
        "total": len(leads),
        "leads": [
            {
                "id": lead.id,
                "name": lead.name,
                "service_type": lead.service_type,
                "address": lead.address,
                "state_code": lead.state_code,
                "project_size_sqft": lead.project_size_sqft,
                "created_at": lead.created_at.isoformat() if lead.created_at else None,
            }
            for lead in leads
        ],
    }


@router.post("/demo/seed")
def seed_demo_workspace(
    body: DemoSeedRequest | None = Body(default=None),
    db: Session = Depends(get_db),
    security: dict = Depends(verify_premium_security),
):
    body = body or DemoSeedRequest()
    demo_email = "demo.portal@jwordenasphaltpaving.com"

    existing_leads = db.query(Lead).filter(Lead.email == demo_email).all()
    existing_lead_ids = [lead.id for lead in existing_leads]
    if body.reset_existing and existing_lead_ids:
        existing_jobs = db.query(Job).filter(Job.lead_id.in_(existing_lead_ids)).all()
        existing_job_ids = [job.id for job in existing_jobs]
        if existing_job_ids:
            db.query(ProjectDocument).filter(ProjectDocument.job_id.in_(existing_job_ids)).delete(synchronize_session=False)
            db.query(WorkOrder).filter(WorkOrder.job_id.in_(existing_job_ids)).delete(synchronize_session=False)
            db.query(Job).filter(Job.id.in_(existing_job_ids)).delete(synchronize_session=False)
        db.query(Estimate).filter(Estimate.lead_id.in_(existing_lead_ids)).delete(synchronize_session=False)
        db.query(Lead).filter(Lead.id.in_(existing_lead_ids)).delete(synchronize_session=False)
        db.commit()

    now = datetime.now(timezone.utc)
    lead = Lead(
        name="River City Retail Partners",
        email=demo_email,
        phone="804-446-1296",
        service_type="parking_lot_resurface",
        property_type="commercial",
        urgency="scheduled",
        project_size_sqft=18400,
        address="2420 Commerce Road, Richmond, VA",
        state_code="VA",
        message="Polished production demo: mill failed surface, repair base at loading lane, resurface customer parking, stripe ADA-compliant stalls.",
        score_value=94,
        score_label="HOT",
        score_priority=1,
        pipeline_stage="converted",
        contacted_at=now - timedelta(days=3),
        proposal_sent_at=now - timedelta(days=2),
        tenant_id="JWORDEN_HQ",
    )
    db.add(lead)
    db.flush()

    estimate = Estimate(
        lead_id=lead.id,
        estimate_number=f"EST-DEMO-{int(now.timestamp())}",
        service_type=lead.service_type,
        scope_summary="Commercial resurfacing demo: milling, base repair, tack coat, surface lift, striping, and warranty packet.",
        amount_low=38500,
        amount_high=47200,
        status="converted",
        state_code="VA",
        tenant_id="JWORDEN_HQ",
    )
    db.add(estimate)
    db.flush()

    scheduled_start = (now + timedelta(days=2)).replace(hour=7, minute=30, second=0, microsecond=0)
    scheduled_end = scheduled_start + timedelta(hours=9)
    job = Job(
        estimate_id=estimate.id,
        lead_id=lead.id,
        job_number=f"JOB-DEMO-{int(now.timestamp())}",
        name="River City Retail Center Resurface",
        status="in_progress",
        service_type="parking_lot_resurface",
        site_address=lead.address,
        state_code="VA",
        scheduled_start=scheduled_start,
        scheduled_end=scheduled_end,
        progress_percent=62,
        progress_notes="Milling and base repairs are complete. Surface lift is scheduled for the morning weather window, then striping follows after cure time.",
        tenant_id="JWORDEN_HQ",
    )
    db.add(job)
    db.flush()

    work_order = WorkOrder(
        job_id=job.id,
        work_order_number=f"WO-DEMO-{int(now.timestamp())}",
        title="Surface lift and striping prep",
        status="dispatched",
        assigned_crew="Crew A",
        scheduled_for=scheduled_start,
        notes="Confirm tack coat coverage, protect storefront access, and stage striping layout before close of business.",
    )
    db.add(work_order)

    scope_pdf = _pdf_document_url(
        "Approved Commercial Scope",
        [
            "Customer: River City Retail Partners",
            "Site: 2420 Commerce Road, Richmond, VA",
            "Scope: mill failed surface, repair loading lane base, tack coat, resurface, and stripe.",
            "Traffic plan: keep storefront access open and stage equipment along the rear service lane.",
            "Quality check: drainage review, edge compaction, ADA stall layout, and owner walkthrough.",
        ],
    )
    invoice_pdf = _pdf_document_url(
        "Deposit Invoice",
        [
            "Estimate range: $38,500 - $47,200",
            "Deposit due at scheduling: 35%",
            "Balance due after final walkthrough and punch-list approval.",
            "Payment notes: ACH or company check accepted by J. Worden & Sons Asphalt Paving.",
        ],
    )
    warranty_pdf = _pdf_document_url(
        "Workmanship Warranty Preview",
        [
            "Coverage: workmanship and installation practices for resurfacing scope.",
            "Maintenance: inspect drainage after first heavy rain and sealcoat on recommended cadence.",
            "Closeout: final photos, striping verification, and customer signoff are included in packet.",
        ],
    )
    progress_svg = _svg_document_url(
        "Base Repair Complete",
        "Loading lane stabilized; surface lift is next in the weather window.",
        62,
    )
    documents = [
        _create_seed_document(
            db,
            job=job,
            lead=lead,
            document_type="contract",
            title="Approved Commercial Scope",
            description="Customer-facing scope summary for the resurfacing package.",
            filename="river-city-approved-scope.pdf",
            file_url=scope_pdf[0],
            file_size_bytes=scope_pdf[1],
            mime_type=scope_pdf[2],
        ),
        _create_seed_document(
            db,
            job=job,
            lead=lead,
            document_type="invoice",
            title="Deposit Invoice",
            description="Demo invoice record visible in the customer portal.",
            filename="river-city-deposit-invoice.pdf",
            file_url=invoice_pdf[0],
            file_size_bytes=invoice_pdf[1],
            mime_type=invoice_pdf[2],
        ),
        _create_seed_document(
            db,
            job=job,
            lead=lead,
            document_type="warranty",
            title="Workmanship Warranty Preview",
            description="Warranty expectations prepared before closeout.",
            filename="river-city-warranty-preview.pdf",
            file_url=warranty_pdf[0],
            file_size_bytes=warranty_pdf[1],
            mime_type=warranty_pdf[2],
        ),
        _create_seed_document(
            db,
            job=job,
            lead=lead,
            document_type="progress_photo",
            title="Base Repair Progress Note",
            description="Branded visual progress card for the customer portal.",
            filename="river-city-progress-card.svg",
            file_url=progress_svg[0],
            file_size_bytes=progress_svg[1],
            mime_type=progress_svg[2],
        ),
    ]

    db.commit()
    db.refresh(job)

    write_audit_event(
        db,
        event_type="demo.seeded",
        actor_type="admin",
        actor_id=security.get("user"),
        entity_type="job",
        entity_id=job.id,
        summary="Production demo workspace seeded for portal, documents, and ETA verification.",
        detail={"lead_id": lead.id, "estimate_id": estimate.id, "document_count": len(documents)},
    )
    monitoring.log_metric("operations.demo_seeded", 1, tags=["source:admin_documents"])
    monitoring.send_slack_alert(
        "Demo Workspace Seeded",
        f"Job `{job.job_number}` was seeded for `{lead.name}` by `{security.get('user')}`.",
        severity="info",
    )

    return {
        "status": "seeded",
        "lead_id": lead.id,
        "estimate_id": estimate.id,
        "job": _serialize_job(job, lead),
        "documents": [_serialize_project_document(document) for document in documents],
        "work_order": {
            "id": work_order.id,
            "work_order_number": work_order.work_order_number,
            "status": work_order.status,
        },
    }


@router.post("/estimates/from-lead")
def create_estimate_from_lead(
    body: EstimateFromLeadRequest = Body(...),
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    lead = db.get(Lead, body.lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    pricing = estimate_price(
        lead.service_type,
        lead.property_type,
        lead.project_size_sqft or 1000,
        state_code=lead.state_code,
    )
    estimate = Estimate(
        lead_id=lead.id,
        estimate_number=_estimate_number(lead.id),
        service_type=lead.service_type,
        scope_summary=body.scope_summary or lead.message,
        amount_low=pricing["low_usd"] if pricing else None,
        amount_high=pricing["high_usd"] if pricing else None,
        state_code=lead.state_code,
    )
    db.add(estimate)
    db.commit()
    db.refresh(estimate)

    write_audit_event(
        db,
        event_type="estimate.created",
        actor_type="admin",
        actor_id="protected_api",
        entity_type="estimate",
        entity_id=estimate.id,
        summary=f"Estimate {estimate.estimate_number} created from lead {lead.id}.",
        detail={"lead_id": lead.id, "service_type": lead.service_type},
    )

    return {
        "id": estimate.id,
        "estimate_number": estimate.estimate_number,
        "lead_id": estimate.lead_id,
        "status": estimate.status,
        "amount_low": estimate.amount_low,
        "amount_high": estimate.amount_high,
    }


@router.get("/estimates")
def list_estimates(db: Session = Depends(get_db), _: dict = Depends(verify_premium_security)):
    items = db.query(Estimate).order_by(Estimate.created_at.desc()).all()
    return {
        "total": len(items),
        "estimates": [
            {
                "id": item.id,
                "estimate_number": item.estimate_number,
                "lead_id": item.lead_id,
                "status": item.status,
                "amount_low": item.amount_low,
                "amount_high": item.amount_high,
            }
            for item in items
        ],
    }


@router.post("/jobs/from-estimate")
def create_job_from_estimate(
    body: JobFromEstimateRequest = Body(...),
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    estimate = db.get(Estimate, body.estimate_id)
    if not estimate:
        raise HTTPException(status_code=404, detail="Estimate not found")

    lead = db.get(Lead, estimate.lead_id) if estimate.lead_id else None
    job = Job(
        estimate_id=estimate.id,
        lead_id=estimate.lead_id,
        job_number=_job_number(estimate.id),
        name=body.name or f"{estimate.service_type or 'Project'} job #{estimate.id}",
        service_type=estimate.service_type,
        site_address=lead.address if lead else None,
        state_code=estimate.state_code,
        scheduled_start=body.scheduled_start,
        scheduled_end=body.scheduled_end,
    )
    estimate.status = "converted"
    db.add(job)
    db.commit()
    db.refresh(job)

    write_audit_event(
        db,
        event_type="job.created",
        actor_type="admin",
        actor_id="protected_api",
        entity_type="job",
        entity_id=job.id,
        summary=f"Job {job.job_number} created from estimate {estimate.estimate_number}.",
        detail={"estimate_id": estimate.id, "lead_id": estimate.lead_id},
    )

    return {
        "id": job.id,
        "job_number": job.job_number,
        "estimate_id": job.estimate_id,
        "status": job.status,
    }


@router.get("/jobs")
def list_jobs(
    client_email: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    items = db.query(Job).order_by(Job.created_at.desc()).all()
    leads = {
        lead.id: lead
        for lead in db.query(Lead).filter(Lead.id.in_([item.lead_id for item in items if item.lead_id])).all()
    }
    serialized = [_serialize_job(item, leads.get(item.lead_id)) for item in items]
    if client_email:
        client_email = client_email.strip().lower()
        serialized = [item for item in serialized if (item.get("client_email") or "").lower() == client_email]
    return {
        "total": len(serialized),
        "jobs": serialized,
    }


@router.get("/public/jobs/{job_id}")
def get_public_job(job_id: int, db: Session = Depends(get_db)):
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    lead = db.get(Lead, job.lead_id) if job.lead_id else None
    payload = _serialize_job(job, lead)
    return {
        key: payload.get(key)
        for key in (
            "id",
            "status",
            "title",
            "surface_type",
            "address",
            "scheduled_date",
            "start_time",
            "progress_percent",
            "progress_notes",
            "client_name",
        )
    }


@router.get("/jobs/{job_id}")
def get_job(job_id: int, db: Session = Depends(get_db), _: dict = Depends(verify_premium_security)):
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    lead = db.get(Lead, job.lead_id) if job.lead_id else None
    return _serialize_job(job, lead)


@router.patch("/jobs/{job_id}")
def update_job(
    job_id: int,
    body: JobUpdateRequest = Body(...),
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    changed = {}
    if body.status is not None:
        job.status = _normalize_job_status(body.status)
        changed["status"] = job.status
    if body.progress_percent is not None:
        job.progress_percent = body.progress_percent
        changed["progress_percent"] = body.progress_percent
    if body.progress_notes is not None:
        job.progress_notes = body.progress_notes.strip() or None
        changed["progress_notes"] = job.progress_notes

    db.commit()
    db.refresh(job)

    if changed:
        write_audit_event(
            db,
            event_type="job.updated",
            actor_type="admin",
            actor_id="protected_api",
            entity_type="job",
            entity_id=job.id,
            summary=f"Job {job.job_number} updated.",
            detail=changed,
        )

    lead = db.get(Lead, job.lead_id) if job.lead_id else None
    return _serialize_job(job, lead)


@router.post("/work-orders")
def create_work_order(
    body: WorkOrderCreateRequest = Body(...),
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    job = db.get(Job, body.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    work_order = WorkOrder(
        job_id=job.id,
        work_order_number=_work_order_number(job.id),
        title=body.title,
        assigned_crew=body.assigned_crew,
        scheduled_for=body.scheduled_for,
        notes=body.notes,
    )
    db.add(work_order)
    db.commit()
    db.refresh(work_order)

    write_audit_event(
        db,
        event_type="work_order.created",
        actor_type="admin",
        actor_id="protected_api",
        entity_type="work_order",
        entity_id=work_order.id,
        summary=f"Work order {work_order.work_order_number} created for job {job.job_number}.",
        detail={"job_id": job.id, "assigned_crew": body.assigned_crew},
    )

    return {
        "id": work_order.id,
        "work_order_number": work_order.work_order_number,
        "job_id": work_order.job_id,
        "status": work_order.status,
    }


@router.get("/jobs/{job_id}/work-orders")
def list_work_orders(job_id: int, db: Session = Depends(get_db), _: dict = Depends(verify_premium_security)):
    items = (
        db.query(WorkOrder)
        .filter(WorkOrder.job_id == job_id)
        .order_by(WorkOrder.created_at.desc())
        .all()
    )
    return {
        "total": len(items),
        "work_orders": [
            {
                "id": item.id,
                "work_order_number": item.work_order_number,
                "title": item.title,
                "status": item.status,
                "assigned_crew": item.assigned_crew,
            }
            for item in items
        ],
    }


@router.get("/job-documents")
def list_project_documents(
    job_id: int | None = Query(default=None),
    client_email: str | None = Query(default=None),
    visible_to_client: bool | None = Query(default=None),
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    query = db.query(ProjectDocument)
    if job_id is not None:
        query = query.filter(ProjectDocument.job_id == job_id)
    if client_email:
        query = query.filter(ProjectDocument.client_email == client_email.strip().lower())
    if visible_to_client is not None:
        query = query.filter(ProjectDocument.visible_to_client == visible_to_client)
    items = query.order_by(ProjectDocument.created_at.desc()).all()
    return _serialize_document_collection(items)


@router.post("/job-documents/upload")
async def upload_project_document(
    request: Request,
    job_id: int = Form(...),
    client_email: str | None = Form(default=None),
    document_type: str = Form(default="other"),
    title: str = Form(...),
    description: str | None = Form(default=None),
    visible_to_client: bool = Form(default=True),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    security: dict = Depends(verify_premium_security),
):
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    lead = db.get(Lead, job.lead_id) if job.lead_id else None
    resolved_email = (client_email or (lead.email if lead else None) or "").strip().lower() or None
    mime_type = (file.content_type or "application/octet-stream").lower()
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(data) > _MAX_DOCUMENT_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large. Maximum upload size is 15 MB.")

    encoded = base64.b64encode(data).decode("utf-8")
    file_url = f"data:{mime_type};base64,{encoded}"
    document = ProjectDocument(
        id=str(uuid.uuid4()),
        job_id=job.id,
        client_email=resolved_email,
        document_type=document_type.strip().lower() or "other",
        title=title.strip(),
        description=description.strip() if description else None,
        filename=file.filename or "document",
        mime_type=mime_type,
        file_size_bytes=len(data),
        file_url=file_url,
        visible_to_client=visible_to_client,
        uploaded_by=security.get("user"),
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    write_audit_event(
        db,
        event_type="project_document.uploaded",
        actor_type="admin",
        actor_id=security.get("user"),
        entity_type="project_document",
        entity_id=document.id,
        summary=f"Document {document.title} uploaded for job {job.job_number}.",
        detail={
            "job_id": job.id,
            "document_type": document.document_type,
            "visible_to_client": document.visible_to_client,
            "path": request.url.path,
        },
    )
    return {"status": "uploaded", "document": _serialize_project_document(document)}


@router.patch("/job-documents/{document_id}")
def update_project_document(
    document_id: str,
    body: ProjectDocumentUpdateRequest = Body(...),
    db: Session = Depends(get_db),
    security: dict = Depends(verify_premium_security),
):
    document = db.get(ProjectDocument, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    changed = {}
    if body.title is not None:
        document.title = body.title.strip()
        changed["title"] = document.title
    if body.description is not None:
        document.description = body.description.strip() or None
        changed["description"] = document.description
    if body.visible_to_client is not None:
        document.visible_to_client = body.visible_to_client
        changed["visible_to_client"] = document.visible_to_client

    db.commit()
    db.refresh(document)

    if changed:
        write_audit_event(
            db,
            event_type="project_document.updated",
            actor_type="admin",
            actor_id=security.get("user"),
            entity_type="project_document",
            entity_id=document.id,
            summary=f"Document {document.title} updated.",
            detail=changed,
        )

    return _serialize_project_document(document)


@router.delete("/job-documents/{document_id}")
def delete_project_document(
    document_id: str,
    db: Session = Depends(get_db),
    security: dict = Depends(verify_premium_security),
):
    document = db.get(ProjectDocument, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    title = document.title
    db.delete(document)
    db.commit()

    write_audit_event(
        db,
        event_type="project_document.deleted",
        actor_type="admin",
        actor_id=security.get("user"),
        entity_type="project_document",
        entity_id=document_id,
        summary=f"Document {title} deleted.",
        detail={"document_id": document_id},
    )
    return {"status": "deleted", "id": document_id}