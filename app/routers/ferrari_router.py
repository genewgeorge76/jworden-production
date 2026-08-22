"""
ferrari_router.py — the backend every Ferrari module saves its work to.

The Ferrari tools (Vision Takeoff, Dispatch, County Assessor, Market Intel,
Street Recon) were browser-only: keys in localStorage, output in localStorage.
That is fine for one operator on one laptop and wrong for a product — a bid is
stuck on the device that built it, and a customer logging in would be holding
someone else's API keys.

This router is the persistence half of the fix. Saved work goes here, scoped
to the caller's tenant, so J. Worden's command center and a hosted
contractor's are the same tool over different rows. The external-API proxying
half (keys server-side) rides on the same tenant auth and lands alongside
these endpoints, one Ferrari at a time.

Every route is tenant-scoped through the same primitives the customers and
leads routers use, so the isolation guarantees — and the owner-bucket trap
handling — are identical rather than reinvented.
"""

# NOTE: `from __future__ import annotations` is deliberately NOT used here.
#
# With it, every annotation becomes a string that FastAPI must resolve later.
# slowapi's @limiter.limit wraps the endpoint, and on the pinned FastAPI
# (0.115.12) the resolution happens against the WRAPPER's module globals, where
# this module's request models do not exist. The annotation stays a ForwardRef,
# FastAPI decides it cannot be a body model, and falls back to treating it as a
# QUERY parameter -- so every POST to these routes returned
#     422 {"loc": ["query", "body"], "msg": "Field required"}
# no matter what was sent.
#
# It was invisible locally because a dev sandbox had FastAPI 0.141, which
# resolves this correctly; CI and the Docker image install the pinned 0.115.12.
# See tests/backend/test_body_models_are_not_query_params.py.

import logging
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..core.limiter import limiter
from ..core.security import verify_premium_security
from ..database import get_db
from ..models import FerrariArtifact
from ..services.tenancy import scope, stamp_for, tenant_of

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ferrari", tags=["ferrari"])

# The modules allowed to store artifacts. A closed set rather than free text so
# a typo in the client cannot silently open a new bucket that no list query
# will ever look in.
KNOWN_FERRARIS = {
    "vision-takeoff",
    "market-intel",
    "dispatch",
    "county-assessor",
    "street-recon",
}


def _require_known(ferrari: str) -> str:
    if ferrari not in KNOWN_FERRARIS:
        raise HTTPException(404, f"unknown ferrari {ferrari!r}")
    return ferrari


# ── Schemas ───────────────────────────────────────────────────────────────────

class VisionAnalyzeIn(BaseModel):
    """
    An aerial image to measure. The key is not in here — that is the point.
    """
    image_base64: str = Field(..., min_length=32, description="raw base64, no data: prefix")
    media_type: str = Field(default="image/png", max_length=40)
    px_per_ft: Optional[float] = Field(default=None, gt=0, description="omit when uncalibrated")
    model: Optional[str] = Field(default=None, max_length=60)


class ReconTextIn(BaseModel):
    """
    Structured findings for Street Recon. The prompt is built server-side
    from these — the client cannot send free text, so a tenant token is not
    an open Claude account.
    """
    kind: str = Field(..., pattern="^(assessment|mailer|street_summary|street_mailer)$")
    # Optional: the street-level kinds describe a road, not one property.
    address: Optional[str] = Field(default=None, max_length=300)
    street: Optional[str] = Field(default=None, max_length=200)
    city: Optional[str] = Field(default=None, max_length=120)
    pci_scores: Optional[list[int]] = Field(default=None, max_length=200)
    property_type: Optional[str] = Field(default=None, max_length=40)
    sqft: Optional[float] = Field(default=None, ge=0)
    pci: Optional[int] = Field(default=None, ge=0, le=100)
    pci_label: Optional[str] = Field(default=None, max_length=40)
    service: Optional[str] = Field(default=None, max_length=120)
    cracking: Optional[int] = Field(default=None, ge=0, le=10)
    surface: Optional[int] = Field(default=None, ge=0, le=10)
    drainage: Optional[int] = Field(default=None, ge=0, le=10)
    edge: Optional[int] = Field(default=None, ge=0, le=10)
    notes: Optional[str] = Field(default=None, max_length=500)
    photo_count: Optional[int] = Field(default=0, ge=0)
    model: Optional[str] = Field(default=None, max_length=60)


class ArtifactIn(BaseModel):
    kind: str = Field(default="default", max_length=40)
    ref: Optional[str] = Field(default=None, max_length=120)
    title: Optional[str] = Field(default=None, max_length=300)
    payload: Any = None


class ArtifactOut(BaseModel):
    id: int
    ferrari: str
    kind: str
    ref: Optional[str]
    title: Optional[str]
    payload: Any
    updated_at: str


def _out(a: FerrariArtifact) -> ArtifactOut:
    return ArtifactOut(
        id=a.id, ferrari=a.ferrari, kind=a.kind, ref=a.ref,
        title=a.title, payload=a.payload,
        updated_at=a.updated_at.isoformat() if a.updated_at else "",
    )


def _owned(db: Session, ferrari: str, artifact_id: int, tenant: str) -> FerrariArtifact:
    """
    Fetch an artifact the caller owns, or 404.

    Scoped-then-filtered, not db.get(): a primary-key lookup would let any
    tenant read another's saved bid by counting ids. A miss is a 404, not a
    403, so the id space cannot be used to count what exists — the same rule
    the customers router follows.
    """
    a = (
        scope(db.query(FerrariArtifact), FerrariArtifact, tenant)
        .filter(FerrariArtifact.id == artifact_id, FerrariArtifact.ferrari == ferrari)
        .first()
    )
    if not a:
        raise HTTPException(404, "artifact not found")
    return a


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/{ferrari}/artifacts", summary="List saved work for a Ferrari (this tenant)")
@limiter.limit("60/minute")
async def list_artifacts(
    request: Request,
    ferrari: str,
    kind: Optional[str] = Query(default=None, max_length=40),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    _require_known(ferrari)
    tenant = tenant_of(auth)
    q = scope(db.query(FerrariArtifact), FerrariArtifact, tenant).filter(
        FerrariArtifact.ferrari == ferrari
    )
    if kind:
        q = q.filter(FerrariArtifact.kind == kind)
    rows = q.order_by(FerrariArtifact.updated_at.desc()).limit(limit).all()
    return {"ferrari": ferrari, "count": len(rows), "items": [_out(a).model_dump() for a in rows]}


@router.post("/{ferrari}/artifacts", summary="Save (or upsert) a Ferrari artifact")
@limiter.limit("60/minute")
async def save_artifact(
    request: Request,
    ferrari: str,
    body: ArtifactIn,
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    _require_known(ferrari)
    tenant = tenant_of(auth)
    stamp = stamp_for(tenant)

    existing = None
    if body.ref:
        # Upsert on (tenant, ferrari, kind, ref) so a module re-saving the same
        # bid number updates it rather than piling up duplicates. Scoped, so the
        # match can only ever be the caller's own row.
        existing = (
            scope(db.query(FerrariArtifact), FerrariArtifact, tenant)
            .filter(
                FerrariArtifact.ferrari == ferrari,
                FerrariArtifact.kind == body.kind,
                FerrariArtifact.ref == body.ref,
            )
            .first()
        )

    if existing:
        existing.title = body.title
        existing.payload = body.payload
        db.commit()
        db.refresh(existing)
        return _out(existing).model_dump()

    a = FerrariArtifact(
        tenant_id=stamp, ferrari=ferrari, kind=body.kind,
        ref=body.ref, title=body.title, payload=body.payload,
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return _out(a).model_dump()


@router.get("/{ferrari}/artifacts/{artifact_id}", summary="Get one saved artifact")
async def get_artifact(
    ferrari: str,
    artifact_id: int,
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    _require_known(ferrari)
    return _out(_owned(db, ferrari, artifact_id, tenant_of(auth))).model_dump()


@router.delete("/{ferrari}/artifacts/{artifact_id}", summary="Delete one saved artifact")
async def delete_artifact(
    ferrari: str,
    artifact_id: int,
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    _require_known(ferrari)
    a = _owned(db, ferrari, artifact_id, tenant_of(auth))
    db.delete(a)
    db.commit()
    return {"ok": True, "deleted": artifact_id}


# ── Vision Takeoff ────────────────────────────────────────────────────────────

@router.get("/vision-takeoff/status", summary="Can vision takeoff run on this server?")
async def vision_status(_: dict = Depends(verify_premium_security)):
    """
    Whether the server holds an Anthropic key.

    Worth its own endpoint: the browser app used to decide this by checking
    localStorage, and with the key server-side it no longer can. Reports a
    boolean and the default model, never key material.
    """
    from ..services import vision_takeoff_ai as vision_takeoff  # noqa: PLC0415

    return {
        "configured": vision_takeoff.is_configured(),
        "default_model": vision_takeoff.DEFAULT_MODEL,
        "max_image_mb": vision_takeoff.MAX_IMAGE_BYTES // 1024 // 1024,
    }


@router.post("/vision-takeoff/analyze", summary="Measure an aerial image (key stays server-side)")
@limiter.limit("10/minute")
async def vision_analyze(
    request: Request,
    body: VisionAnalyzeIn,
    auth: dict = Depends(verify_premium_security),
):
    """
    Run the takeoff and return findings in the shape the browser already renders.

    Rate limited harder than the artifact routes: each call is a vision request
    against a paid model, so an accidental loop in the client should cost ten
    requests a minute rather than a bill.
    """
    from ..services import vision_takeoff_ai as vision_takeoff  # noqa: PLC0415

    try:
        findings = vision_takeoff.analyse(
            image_base64=body.image_base64,
            media_type=body.media_type,
            px_per_ft=body.px_per_ft,
            model=body.model,
        )
    except vision_takeoff.VisionError as exc:
        # 422: the request was understood and the analysis genuinely could not
        # be produced. Distinguishable by the client from a 500, and the
        # message is written to be shown to the operator.
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    logger.info(
        "vision takeoff ok tenant=%s sqft=%s pci=%s",
        tenant_of(auth), findings.get("pavementSqFt"), findings.get("conditionPCI"),
    )
    return findings


# ── Street Recon ──────────────────────────────────────────────────────────────

@router.get("/street-recon/status", summary="Can Street Recon generate text?")
async def recon_status(_: dict = Depends(verify_premium_security)):
    from ..services import street_recon_ai  # noqa: PLC0415

    return {
        "configured": street_recon_ai.is_configured(),
        "default_model": street_recon_ai.DEFAULT_MODEL,
    }


@router.post("/street-recon/text", summary="Write the assessment or the mailer")
@limiter.limit("20/minute")
async def recon_text(
    request: Request,
    body: ReconTextIn,
    auth: dict = Depends(verify_premium_security),
):
    """
    Generate the inspector's assessment or the postcard copy.

    This feature never actually worked: the browser posted to Anthropic with
    no credential at all, every call failed, and a catch silently substituted
    canned text that read like a model had written it. Failures now surface as
    422 so a fallback is a visible choice rather than an invisible default.
    """
    from ..services import street_recon_ai  # noqa: PLC0415

    payload = body.model_dump(exclude={"kind", "model"})
    try:
        return street_recon_ai.generate(body.kind, payload, model=body.model)
    except street_recon_ai.ReconError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
