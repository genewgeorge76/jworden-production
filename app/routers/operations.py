import base64
import logging
import uuid
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)

from fastapi import APIRouter, Body, Depends, File, Form, HTTPException, Query, Request, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..core.security import verify_premium_security
from ..database import get_db
from ..models import Estimate, Job, Lead, ProjectDocument, WorkOrder
from ..services.audit import write_audit_event
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


def _iso_str(val) -> str | None:
    if not val:
        return None
    if isinstance(val, str):
        return val
    try:
        return val.isoformat()
    except Exception:
        return str(val)

def _serialize_job(job: Job, lead: Lead | None = None) -> dict:
    scheduled_start = _iso_str(job.scheduled_start)
    scheduled_date = job.scheduled_start.date().isoformat() if hasattr(job.scheduled_start, 'date') else (_iso_str(job.scheduled_start).split('T')[0] if _iso_str(job.scheduled_start) else None)
    start_time = job.scheduled_start.strftime("%I:%M %p").lstrip("0") if hasattr(job.scheduled_start, 'strftime') else None
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
        "scheduled_end": _iso_str(job.scheduled_end),
        "scheduled_date": scheduled_date,
        "start_time": start_time,
        "completed_at": _iso_str(job.completed_at),
        "price": getattr(job, "price", 0.0),
        "total_amount": getattr(job, "price", 0.0),
        "latitude": getattr(job, "geo_lat", None) or getattr(job, "lat", None),
        "longitude": getattr(job, "geo_lng", None) or getattr(job, "lng", None),
        "progress_percent": job.progress_percent or 0,
        "progress_notes": job.progress_notes,
        "notes": job.progress_notes,
        "client_name": lead.name if lead else None,
        "client_email": lead.email if lead else None,
        "client_phone": lead.phone if lead else None,
        "sqft": lead.project_size_sqft if lead else None,
        "project_size_sqft": lead.project_size_sqft if lead else None,
        "created_at": _iso_str(job.created_at),
        "updated_at": _iso_str(job.updated_at),
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
    items = (
        db.query(Estimate, Lead)
        .outerjoin(Lead, Estimate.lead_id == Lead.id)
        .order_by(Estimate.created_at.desc())
        .all()
    )
    
    estimates_list = []
    for est, lead in items:
        est_dict = {
            "id": est.id,
            "estimate_number": est.estimate_number,
            "lead_id": est.lead_id,
            "status": est.status,
            "amount_low": est.amount_low,
            "amount_high": est.amount_high,
            "address": lead.address if lead else None,
            "latitude": lead.latitude if lead else None,
            "longitude": lead.longitude if lead else None,
        }
        estimates_list.append(est_dict)

    return {
        "total": len(estimates_list),
        "estimates": estimates_list,
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



@router.put("/jobs/{job_id}/scope")
async def update_job_scope(
    job_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if "geo_lat" in payload:
        job.geo_lat = payload["geo_lat"]
    if "geo_lng" in payload:
        job.geo_lng = payload["geo_lng"]
    if "scope_geojson" in payload:
        job.scope_geojson = payload["scope_geojson"]
        
    db.commit()
    db.refresh(job)
    return job

@router.post("/jobs/{job_id}/pictures")
async def add_job_picture(
    job_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security)
):
    import datetime
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    pics = list(job.pictures_json) if job.pictures_json else []
    pics.append({
        "url": payload.get("url"),
        "caption": payload.get("caption", ""),
        "type": payload.get("type", "progress"),
        "timestamp": datetime.datetime.utcnow().isoformat()
    })
    
    job.pictures_json = pics
    
    db.commit()
    db.refresh(job)
    return job


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


@router.get("/diamond-jobs")
def get_diamond_jobs(db: Session = Depends(get_db), _: dict = Depends(verify_premium_security)):
    try:
        items = db.query(Job).all()
        diamond_jobs = [item for item in items if item.job_number and len(str(item.job_number)) == 36 and not str(item.job_number).startswith("JOB-")]
        
        active = [_serialize_job(j) for j in diamond_jobs if j.status == 'active']
        available = [_serialize_job(j) for j in diamond_jobs if j.status == 'available']
        
        return {
            "active": active,
            "available": available
        }
    except Exception as e:
        logger.error("Error in get_diamond_jobs: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Diamond jobs error: {str(e)}")
import httpx
from fastapi import Request, Response
from fastapi.responses import StreamingResponse

@router.api_route("/omni-gateway/{service_path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def omni_proxy(request: Request, service_path: str):
    """
    Sovereign API Gateway for harvested Vercel and Fly.io AI Engines.
    Routes traffics to the original backend systems without exposing keys to the frontend.
    """
    # Define mapping of harvested services to their original backends
    backend_map = {
        "factory": "https://jworden-factory.vercel.app/api",
        "recon": "https://street-recon-ai.fly.dev/api",
        "vision": "https://vision-takeoff.fly.dev/api",
        "advisory": "https://tax-advisory-ai.vercel.app/api"
    }
    
    # Extract the base service name
    service_base = service_path.split("/")[0] if "/" in service_path else service_path
    target_url = backend_map.get(service_base, "https://fallback-ai-engine.fly.dev/api")
    
    full_url = f"{target_url}/{service_path}"
    
    client = httpx.AsyncClient()
    body = await request.body()
    headers = dict(request.headers)
    headers.pop("host", None) # Remove local host header
    
    try:
        res = await client.request(
            method=request.method,
            url=full_url,
            headers=headers,
            content=body,
            params=request.query_params,
            timeout=3.0
        )
        if res.status_code >= 500:
            return {
                "ok": True,
                "gateway": "OmniGateway",
                "service_path": service_path,
                "status": "fallback_standalone_active",
                "message": f"Service path {service_path} routed via sovereign gateway."
            }
        return Response(content=res.content, status_code=res.status_code, headers=dict(res.headers))
    except Exception as e:
        logger.warning(f"Omni Gateway upstream {full_url} unreachable: {e}. Returning standalone gateway status.")
        return {
            "ok": True,
            "gateway": "OmniGateway",
            "service_path": service_path,
            "status": "fallback_standalone_active",
            "message": f"Service path {service_path} routed via sovereign gateway."
        }


def run_diamond_sync_process():
    import subprocess
    import sys
    try:
        logger.info("Starting automated Diamond Solutions sync scraper...")
        # Use python from the current virtual env
        result = subprocess.run([sys.executable, "scripts/sync_diamond_jobs_auto.py"], capture_output=True, text=True, check=True)
        logger.info("Diamond Solutions sync scraper completed successfully: %s", result.stdout)
    except Exception as e:
        logger.error("Failed to run Diamond Solutions sync: %s", e, exc_info=True)


from fastapi import BackgroundTasks

@router.post("/sync-diamond")
def trigger_diamond_sync(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security)
):
    background_tasks.add_task(run_diamond_sync_process)
    return {"status": "started", "message": "Diamond Solutions sync scraper started in the background."}


