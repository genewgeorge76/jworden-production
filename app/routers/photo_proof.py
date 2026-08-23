"""
photo_proof.py — survey the photo archive, and review what it found.

  POST /api/v1/photo-proof/scan        walk Dropbox, upsert clusters
  GET  /api/v1/photo-proof/clusters    what is waiting to be reviewed
  POST /api/v1/photo-proof/clusters/{id}/review   confirm or reject one

Operator only. This reads the operator's personal cloud storage, which is not
a tenant resource and never becomes one — a hosted customer has no business
seeing where these photographs were taken, and the review decisions are the
operator's own.
"""

# Deliberately NO `from __future__ import annotations` here. On the pinned
# FastAPI (0.115.12) a @limiter.limit-wrapped endpoint has its annotations
# resolved against slowapi's module globals, where ScanRequest does not exist;
# the body model degrades to a ForwardRef, FastAPI falls back to Query, and the
# endpoint demands a query parameter named "body" while rejecting the JSON.
# tests/backend/test_body_models_are_not_query_params.py holds this.

import json
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..core.limiter import limiter
from ..core.security import verify_premium_security
from ..database import get_db
from ..models import PhotoCluster
from ..services import photo_archive
from ..services.tenancy import is_owner, scope, stamp_for, tenant_of

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/photo-proof", tags=["photo-proof"])

STATUS_PENDING = "pending"
STATUS_CONFIRMED = "confirmed"
STATUS_REJECTED = "rejected"
_STATUSES = {STATUS_PENDING, STATUS_CONFIRMED, STATUS_REJECTED}


def _require_operator(auth: dict) -> str:
    tenant = tenant_of(auth)
    if not is_owner(tenant):
        raise HTTPException(
            status_code=403,
            detail="The photo archive belongs to the platform operator.",
        )
    return tenant


class ScanRequest(BaseModel):
    folder: str = ""
    cursor: Optional[str] = None
    max_pages: int = Field(default=20, ge=1, le=100)


class ReviewRequest(BaseModel):
    status: str
    kind: Optional[str] = None
    label: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    evidence: Optional[str] = None
    evidence_note: Optional[str] = None


@router.post("/scan", summary="Survey the Dropbox archive for geotagged photographs")
@limiter.limit("4/minute")
async def scan_archive(
    request: Request,
    payload: ScanRequest,
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    """
    Read the archive's metadata and record every place it found.

    Nothing is downloaded: Dropbox returns the coordinate and capture time in
    the file listing. Large archives resume with the returned cursor.
    """
    tenant = _require_operator(auth)

    try:
        result = await photo_archive.scan(
            folder=payload.folder, cursor=payload.cursor, max_pages=payload.max_pages
        )
    except photo_archive.ArchiveNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    if not result.get("ok"):
        raise HTTPException(status_code=502, detail=result.get("error") or "Dropbox scan failed")

    clusters = photo_archive.cluster(result["photos"])
    created = updated = 0

    for found in clusters:
        # Match against what is already stored by proximity rather than by
        # exact coordinate. A second scan of the same car park lands a few
        # metres off, and an equality test would create a duplicate cluster
        # for the operator to review all over again.
        existing = _nearest_stored(db, tenant, found["lat"], found["lon"])

        if existing is None:
            db.add(
                PhotoCluster(
                    tenant_id=stamp_for(tenant),
                    lat=found["lat"],
                    lon=found["lon"],
                    photo_count=found["photo_count"],
                    first_seen=found.get("first_seen"),
                    last_seen=found.get("last_seen"),
                    source="dropbox",
                    sample_paths=json.dumps(found.get("sample_paths") or []),
                    status=STATUS_PENDING,
                )
            )
            created += 1
            continue

        # Counts and dates are refreshed; a decision already made is not.
        # Re-opening a rejected cluster on every scan would make the review
        # endless.
        existing.photo_count = found["photo_count"]
        if found.get("first_seen"):
            existing.first_seen = found["first_seen"]
        if found.get("last_seen"):
            existing.last_seen = found["last_seen"]
        existing.sample_paths = json.dumps(found.get("sample_paths") or [])
        updated += 1

    db.commit()

    return {
        "ok": True,
        "photos_scanned": result["scanned"],
        "photographs_with_a_location": len(result["photos"]),
        "places_found": len(clusters),
        "clusters_created": created,
        "clusters_updated": updated,
        "cursor": result.get("cursor"),
        "has_more": result.get("has_more", False),
        "note": (
            "Nothing here is publishable until it is reviewed. A coordinate is "
            "not a jobsite, and personal photographs share this account."
        ),
    }


def _nearest_stored(db: Session, tenant: str, lat: float, lon: float):
    """The stored cluster this point belongs to, or None."""
    # A degree of latitude is about 69 miles, so the radius in degrees bounds
    # the candidates cheaply before the exact distance is computed.
    span = photo_archive.CLUSTER_RADIUS_MILES / 69.0
    candidates = (
        scope(db.query(PhotoCluster), PhotoCluster, tenant)
        .filter(
            PhotoCluster.lat.between(lat - span, lat + span),
            PhotoCluster.lon.between(lon - span * 2, lon + span * 2),
        )
        .all()
    )
    for candidate in candidates:
        if (
            photo_archive.distance_miles(candidate.lat, candidate.lon, lat, lon)
            <= photo_archive.CLUSTER_RADIUS_MILES
        ):
            return candidate
    return None


@router.get("/clusters", summary="Places found, and what has been decided about them")
@limiter.limit("60/minute")
def list_clusters(
    request: Request,
    status: str = Query(STATUS_PENDING),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    tenant = _require_operator(auth)
    if status not in _STATUSES | {"all"}:
        raise HTTPException(status_code=400, detail=f"status must be one of {sorted(_STATUSES)} or 'all'")

    query = scope(db.query(PhotoCluster), PhotoCluster, tenant)
    if status != "all":
        query = query.filter(PhotoCluster.status == status)

    rows = query.order_by(PhotoCluster.photo_count.desc()).limit(limit).all()
    counts = {
        state: scope(db.query(PhotoCluster), PhotoCluster, tenant)
        .filter(PhotoCluster.status == state)
        .count()
        for state in sorted(_STATUSES)
    }

    return {
        "ok": True,
        "counts": counts,
        "clusters": [_as_dict(r) for r in rows],
    }


@router.post("/clusters/{cluster_id}/review", summary="Confirm or reject one place")
@limiter.limit("120/minute")
def review_cluster(
    request: Request,
    cluster_id: int,
    payload: ReviewRequest,
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    """
    Record the operator's decision about one place.

    A confirmation needs a `kind`. The commercial and residential records are
    published differently — commercial carries an address and a venue name,
    residential is shown by city only, because a homeowner who let a crew
    photograph their driveway did not agree to have the address published.
    """
    tenant = _require_operator(auth)

    if payload.status not in _STATUSES:
        raise HTTPException(status_code=400, detail=f"status must be one of {sorted(_STATUSES)}")

    cluster = (
        scope(db.query(PhotoCluster), PhotoCluster, tenant)
        .filter(PhotoCluster.id == cluster_id)
        .first()
    )
    if cluster is None:
        raise HTTPException(status_code=404, detail="No such cluster")

    if payload.status == STATUS_CONFIRMED:
        kind = (payload.kind or "").strip().lower()
        if kind not in {"commercial", "residential"}:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Confirming a place needs kind='commercial' or 'residential'. "
                    "The two are published differently and the difference cannot "
                    "be guessed from a coordinate."
                ),
            )
        cluster.kind = kind

    if payload.evidence:
        evidence = payload.evidence.strip().lower()
        if evidence not in {"photo_gps", "invoice", "both"}:
            raise HTTPException(
                status_code=400,
                detail="evidence must be photo_gps, invoice, or both.",
            )
        cluster.evidence = evidence

    cluster.status = payload.status
    for field in ("label", "address", "city", "state", "evidence_note"):
        value = getattr(payload, field)
        if value is not None:
            setattr(cluster, field, value.strip() or None)

    cluster.reviewed_at = photo_archive.utcnow()
    cluster.reviewed_by = auth.get("user") or "operator"
    db.commit()
    db.refresh(cluster)

    return {"ok": True, "cluster": _as_dict(cluster)}


def _as_dict(cluster: PhotoCluster) -> dict:
    try:
        samples = json.loads(cluster.sample_paths or "[]")
    except ValueError:
        samples = []
    return {
        "id": cluster.id,
        "lat": cluster.lat,
        "lon": cluster.lon,
        "photo_count": cluster.photo_count,
        "first_seen": cluster.first_seen.isoformat() if cluster.first_seen else None,
        "last_seen": cluster.last_seen.isoformat() if cluster.last_seen else None,
        "source": cluster.source,
        "status": cluster.status,
        "kind": cluster.kind,
        "label": cluster.label,
        "address": cluster.address,
        "city": cluster.city,
        "state": cluster.state,
        "evidence": cluster.evidence,
        "evidence_note": cluster.evidence_note,
        "sample_paths": samples,
        "reviewed_at": cluster.reviewed_at.isoformat() if cluster.reviewed_at else None,
        # A pin the reviewer can open to see where this actually is, which is
        # the fastest way to tell a jobsite from a family holiday.
        "map_url": f"https://www.google.com/maps/search/?api=1&query={cluster.lat},{cluster.lon}",
    }
