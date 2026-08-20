"""
supplier_discovery_router.py — Find suppliers for any construction material.

Searches a radius and files what it finds as candidates for review. Nothing
reaches `material_sources` — and therefore nothing reaches a price — until a
person promotes it, because a text search for "asphalt plant" also returns
paving contractors, sales offices and yards that closed years ago.

Provider requests are billed, so every response reports how many were spent
and `/preview` reports how many a search would cost before running it.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, model_validator
from sqlalchemy.orm import Session

from ..core.security import verify_premium_security
from ..database import get_db
from ..models import MaterialSource, MaterialSourceCandidate
from ..services import runtime_config
from ..services import supplier_discovery as sd
from ..services.location_resolver import resolve_location
from ..services.tenancy import scope, tenant_of

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/suppliers", tags=["suppliers"])

# A full sweep of every category is ~99 billed requests. Past this, the caller
# has to say so explicitly rather than discovering the bill afterwards.
DEFAULT_QUERY_BUDGET = 30


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _candidate_dict(c: MaterialSourceCandidate) -> dict[str, Any]:
    return {
        "id": c.id,
        "name": c.name,
        "address": c.address,
        "city": c.city,
        "state": c.state,
        "lat": c.lat,
        "lng": c.lng,
        "phone": c.phone,
        "website": c.website,
        "searched_category": c.searched_category,
        "provider_primary_type": c.provider_primary_type,
        "business_status": c.business_status,
        "distance_mi": c.distance_from_search_center_mi,
        "review_status": c.review_status,
        "review_note": c.review_note,
        "promoted_source_id": c.promoted_source_id,
        "provider": c.provider,
        "first_seen_at": c.first_seen_at.isoformat() if c.first_seen_at else None,
        "last_seen_at": c.last_seen_at.isoformat() if c.last_seen_at else None,
    }


@router.get("/categories", summary="Every material family that can be searched")
def categories(_: dict = Depends(verify_premium_security)):
    """
    The built-in catalogue, and the groups that sweep a trade at once.

    It is a starting set, not a closed one — `custom_queries` searches anything
    not listed, because no fixed catalogue of construction materials stays
    complete.
    """
    cats = sd.category_list()
    return {
        "success": True,
        "categories": cats,
        "groups": sd.group_list(),
        "queries_per_category": {c: len(sd.CATEGORY_QUERIES[c]) for c in cats},
        "full_sweep_query_count": sd.planned_query_count(cats),
        "note": "custom_queries accepts free text for anything not listed here.",
    }


class SearchRequest(BaseModel):
    # Any one of these. An address is what a person actually has — the crew in
    # Wichita types "Wichita, KS", not a decimal pair.
    address: Optional[str] = Field(None, min_length=2, max_length=300)
    lat: Optional[float] = Field(None, ge=-90, le=90)
    lng: Optional[float] = Field(None, ge=-180, le=180)
    project_site_id: Optional[int] = None
    radius_miles: float = Field(60.0, gt=0, le=300)
    categories: list[str] = Field(default_factory=list, max_length=40)
    groups: list[str] = Field(default_factory=list, max_length=12)
    custom_queries: list[str] = Field(default_factory=list, max_length=20)
    max_per_query: int = Field(20, ge=1, le=20)
    query_budget: int = Field(DEFAULT_QUERY_BUDGET, ge=1, le=200)

    @model_validator(mode="after")
    def _needs_something_to_search(self) -> "SearchRequest":
        if not (self.categories or self.groups or self.custom_queries):
            raise ValueError("give at least one of categories, groups or custom_queries")
        if self.address is None and self.project_site_id is None and (
            self.lat is None or self.lng is None
        ):
            raise ValueError("give an address, a project_site_id, or both lat and lng")
        return self


@router.post("/preview", summary="What a search would cost before running it")
def preview(body: SearchRequest, _: dict = Depends(verify_premium_security)):
    resolved, unknown = sd.resolve_categories(body.categories, body.groups)
    count = sd.planned_query_count(resolved, body.custom_queries)
    return {
        "success": True,
        "resolved_categories": resolved,
        "unknown_names": unknown,
        "custom_queries": body.custom_queries,
        "billed_requests": count,
        "within_budget": count <= body.query_budget,
        "query_budget": body.query_budget,
    }


@router.post("/search", summary="Find suppliers near a point and file them for review")
def search(body: SearchRequest, db: Session = Depends(get_db),
           auth: dict = Depends(verify_premium_security)):
    """
    Run the search and upsert candidates.

    Re-running over the same ground refreshes `last_seen_at` on what is already
    known rather than duplicating it, and never resets a candidate somebody has
    already reviewed — a promoted yard stays promoted, a rejected one stays
    rejected.
    """
    resolved, unknown = sd.resolve_categories(body.categories, body.groups)
    planned = sd.planned_query_count(resolved, body.custom_queries)
    if planned > body.query_budget:
        raise HTTPException(
            status_code=413,
            detail=f"This search would spend {planned} billed provider requests, over the "
                   f"budget of {body.query_budget}. Narrow the categories or raise "
                   f"query_budget deliberately.",
        )

    where = resolve_location(db, lat=body.lat, lng=body.lng,
                             address=body.address, project_site_id=body.project_site_id)

    api_key = runtime_config.get("GOOGLE_MAPS_API_KEY", "").strip()
    result = sd.discover(
        api_key=api_key or None,
        lat=where["lat"], lng=where["lng"], radius_miles=body.radius_miles,
        categories=resolved, custom_queries=body.custom_queries,
        max_per_query=body.max_per_query,
    )

    if not result["configured"]:
        raise HTTPException(status_code=503, detail=result["reason"])

    tenant_id = tenant_of(auth)
    created = updated = 0
    now = _utcnow()

    for cand in result["candidates"]:
        # Scoped: two customers searching the same city both keep their own
        # candidate for the same yard, each with their own review decision.
        row = scope(
            db.query(MaterialSourceCandidate).filter(
                MaterialSourceCandidate.provider == cand["provider"],
                MaterialSourceCandidate.provider_place_id == cand["provider_place_id"],
            ),
            MaterialSourceCandidate, tenant_id,
        ).one_or_none()
        if row is None:
            row = MaterialSourceCandidate(
                provider=cand["provider"],
                provider_place_id=cand["provider_place_id"],
                review_status="pending",
                first_seen_at=now,
            )
            db.add(row)
            created += 1
        else:
            updated += 1

        for field in ("name", "address", "city", "state", "lat", "lng", "phone",
                      "website", "searched_category", "provider_primary_type",
                      "business_status"):
            if cand.get(field) is not None:
                setattr(row, field, cand[field])
        row.distance_from_search_center_mi = cand["distance_from_search_center_mi"]
        row.raw_json = cand["raw_json"]
        row.tenant_id = tenant_id
        row.last_seen_at = now

    db.commit()

    return {
        "success": True,
        "search_center": {**result["search_center"], **{
            k: v for k, v in where.items() if k not in ("lat", "lng")
        }},
        "categories": resolved,
        "custom_queries": result.get("custom_queries", []),
        "unknown_names": unknown,
        "billed_requests": result["queries_run"],
        "candidates_new": created,
        "candidates_refreshed": updated,
        "dropped_outside_radius": result["dropped_outside_radius"],
        "provider_errors": result["errors"],
        "next_step": "Review with GET /api/v1/suppliers/candidates, then promote the real "
                     "yards with POST /api/v1/suppliers/candidates/{id}/promote. Nothing "
                     "is priced against until it is promoted.",
    }


@router.get("/candidates", summary="Review what discovery found")
def list_candidates(
    review_status: str = Query("pending"),
    category: Optional[str] = None,
    state: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    q = scope(db.query(MaterialSourceCandidate), MaterialSourceCandidate, tenant_of(auth))
    if review_status != "all":
        q = q.filter(MaterialSourceCandidate.review_status == review_status)
    if category:
        q = q.filter(MaterialSourceCandidate.searched_category.contains(category))
    if state:
        q = q.filter(MaterialSourceCandidate.state == state.upper())

    rows = (
        q.order_by(MaterialSourceCandidate.distance_from_search_center_mi.asc().nullslast())
        .limit(limit)
        .all()
    )
    out = []
    for r in rows:
        d = _candidate_dict(r)
        d["review_flags"] = sd._flags(r.provider_primary_type, r.business_status)
        out.append(d)
    return {"success": True, "total": len(out), "candidates": out}


class PromoteRequest(BaseModel):
    source_type: str = Field("supplier", max_length=40)
    season_open_month: Optional[int] = Field(None, ge=1, le=12)
    season_close_month: Optional[int] = Field(None, ge=1, le=12)
    max_haul_minutes: Optional[int] = Field(None, ge=1, le=600)
    account_number: Optional[str] = Field(None, max_length=60)
    note: Optional[str] = Field(None, max_length=300)


@router.post("/candidates/{candidate_id}/promote", summary="Confirm a candidate is a real source")
def promote(candidate_id: int, body: PromoteRequest, db: Session = Depends(get_db),
            auth: dict = Depends(verify_premium_security)):
    """
    Turn a reviewed candidate into a material source it is safe to price against.

    Coordinates are required, because a source without them cannot be hauled
    from — the whole delivered-cost calculation is distance.
    """
    tenant = tenant_of(auth)
    cand = scope(
        db.query(MaterialSourceCandidate).filter(MaterialSourceCandidate.id == candidate_id),
        MaterialSourceCandidate, tenant,
    ).one_or_none()
    if cand is None:
        raise HTTPException(status_code=404, detail=f"No candidate {candidate_id}")
    if cand.lat is None or cand.lng is None:
        raise HTTPException(
            status_code=422,
            detail="Candidate has no coordinates, so haul distance cannot be computed. "
                   "Add it manually via POST /api/v1/costing/sources with a location.",
        )
    if cand.promoted_source_id:
        return {"success": True, "already_promoted": True,
                "source_id": cand.promoted_source_id}

    existing = scope(db.query(MaterialSource).filter(MaterialSource.name == cand.name),
                     MaterialSource, tenant).one_or_none()
    if existing is not None:
        cand.review_status = "promoted"
        cand.promoted_source_id = existing.id
        cand.reviewed_at = _utcnow()
        db.commit()
        return {"success": True, "already_existed": True, "source_id": existing.id}

    source = MaterialSource(
        name=cand.name,
        source_type=body.source_type,
        address=cand.address,
        city=cand.city,
        state=cand.state,
        lat=cand.lat,
        lng=cand.lng,
        phone=cand.phone,
        season_open_month=body.season_open_month,
        season_close_month=body.season_close_month,
        max_haul_minutes=body.max_haul_minutes,
        account_number=body.account_number,
        notes=(f"Promoted from discovery ({cand.provider}, searched as "
               f"{cand.searched_category}). {body.note or ''}").strip(),
        is_active=True,
        tenant_id=tenant,
    )
    db.add(source)
    db.flush()

    cand.review_status = "promoted"
    cand.promoted_source_id = source.id
    cand.reviewed_at = _utcnow()
    cand.review_note = body.note
    db.commit()

    return {
        "success": True,
        "source_id": source.id,
        "name": source.name,
        "next_step": "Add a dated FOB price with POST /api/v1/costing/prices. Until it has "
                     "one, this source is listed but cannot price a job.",
    }


class RejectRequest(BaseModel):
    note: str = Field(..., min_length=2, max_length=300)


@router.post("/candidates/{candidate_id}/reject", summary="Mark a candidate as not a source")
def reject(candidate_id: int, body: RejectRequest, db: Session = Depends(get_db),
           auth: dict = Depends(verify_premium_security)):
    """
    Rejecting records why, so the next sweep does not re-present it as new and
    nobody re-investigates a yard already ruled out.
    """
    cand = scope(
        db.query(MaterialSourceCandidate).filter(MaterialSourceCandidate.id == candidate_id),
        MaterialSourceCandidate, tenant_of(auth),
    ).one_or_none()
    if cand is None:
        raise HTTPException(status_code=404, detail=f"No candidate {candidate_id}")
    cand.review_status = "rejected"
    cand.review_note = body.note
    cand.reviewed_at = _utcnow()
    db.commit()
    return {"success": True, "id": cand.id, "review_status": "rejected"}
