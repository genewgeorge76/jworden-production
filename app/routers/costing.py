"""
costing.py — Delivered material cost by location.

Answers the question a state multiplier could not: what does a ton cost at
*this* job site, from which plant, and why that one.

Everything is caller-supplied. No plant, price, truck rate or crew rate ships
with the software, because every one of them is specific to a market and a
season, and a hardcoded figure is wrong the moment it is written. An
unconfigured system reports that it is unconfigured.
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
from ..models import (
    HaulProfile,
    LaborMarket,
    MaterialSource,
    MaterialSourcePrice,
    ProjectSite,
)
from ..services import delivered_cost as dc

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/costing", tags=["costing"])


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _source_dict(s: MaterialSource) -> dict[str, Any]:
    return {
        "id": s.id, "name": s.name, "operator": s.operator, "source_type": s.source_type,
        "city": s.city, "state": s.state, "lat": s.lat, "lng": s.lng,
        "season_open_month": s.season_open_month, "season_close_month": s.season_close_month,
        "max_haul_minutes": s.max_haul_minutes, "is_active": s.is_active,
    }


# ── Status ────────────────────────────────────────────────────────────────────


@router.get("/status", summary="What costing data exists")
def costing_status(db: Session = Depends(get_db), _: dict = Depends(verify_premium_security)):
    sources = db.query(MaterialSource).count()
    prices = db.query(MaterialSourcePrice).count()
    profiles = db.query(HaulProfile).count()
    markets = db.query(LaborMarket).count()

    blocking = []
    if not sources:
        blocking.append("no material sources — add the plants and quarries you buy from")
    if not prices:
        blocking.append("no FOB prices — add at least one price per material per source")
    if not profiles:
        blocking.append("no haul profile — add tons per load and truck cost per hour")

    return {
        "success": True,
        "material_sources": sources,
        "material_prices": prices,
        "haul_profiles": profiles,
        "labor_markets": markets,
        "can_price_delivered": not blocking,
        "blocking": blocking,
    }


# ── Sources ───────────────────────────────────────────────────────────────────


class SourceIn(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    source_type: str = Field("hma_plant", max_length=40)
    operator: Optional[str] = Field(None, max_length=200)
    address: Optional[str] = Field(None, max_length=300)
    city: Optional[str] = Field(None, max_length=120)
    state: Optional[str] = Field(None, min_length=2, max_length=2)
    lat: Optional[float] = Field(None, ge=-90, le=90)
    lng: Optional[float] = Field(None, ge=-180, le=180)
    season_open_month: Optional[int] = Field(None, ge=1, le=12)
    season_close_month: Optional[int] = Field(None, ge=1, le=12)
    max_haul_minutes: Optional[int] = Field(None, ge=1, le=600)
    account_number: Optional[str] = Field(None, max_length=60)
    phone: Optional[str] = Field(None, max_length=30)
    notes: Optional[str] = None


@router.post("/sources", summary="Add or update a plant, quarry or supplier")
def upsert_source(body: SourceIn, db: Session = Depends(get_db),
                  auth: dict = Depends(verify_premium_security)):
    row = db.query(MaterialSource).filter(MaterialSource.name == body.name).one_or_none()
    created = row is None
    if created:
        row = MaterialSource(name=body.name)
        db.add(row)
    for f, v in body.model_dump(exclude_unset=True).items():
        if f != "name":
            setattr(row, f, v)
    row.state = row.state.upper() if row.state else None
    row.is_active = True
    row.tenant_id = auth.get("tenant_id") or "default"
    db.commit()
    db.refresh(row)
    return {"success": True, "created": created, "source": _source_dict(row)}


@router.get("/sources", summary="List material sources")
def list_sources(state: Optional[str] = None, db: Session = Depends(get_db),
                 _: dict = Depends(verify_premium_security)):
    q = db.query(MaterialSource).filter(MaterialSource.is_active.is_(True))
    if state:
        q = q.filter(MaterialSource.state == state.upper())
    rows = q.order_by(MaterialSource.state, MaterialSource.city, MaterialSource.name).all()
    return {"success": True, "total": len(rows), "sources": [_source_dict(s) for s in rows]}


# ── Prices ────────────────────────────────────────────────────────────────────


class PriceIn(BaseModel):
    source_id: int
    material_code: str = Field(..., min_length=1, max_length=60)
    fob_price: float = Field(..., ge=0)
    unit: str = Field("ton", max_length=20)
    material_name: Optional[str] = Field(None, max_length=200)
    effective_date: Optional[datetime] = None
    quoted_by: Optional[str] = Field(None, max_length=160)
    # Required for the same reason keyword metrics require one: a price with no
    # origin cannot be defended when a bid is questioned.
    source_note: str = Field(..., min_length=2, max_length=200)


@router.post("/prices", summary="Record a dated FOB price")
def add_price(body: PriceIn, db: Session = Depends(get_db),
              auth: dict = Depends(verify_premium_security)):
    """
    Prices are appended, never overwritten.

    The history is what lets a bid from March be explained in September. An
    update-in-place would erase the number the bid was actually built on.
    """
    if not db.query(MaterialSource).filter(MaterialSource.id == body.source_id).count():
        raise HTTPException(status_code=404, detail=f"No source with id {body.source_id}")

    eff = body.effective_date or _utcnow()
    existing = (
        db.query(MaterialSourcePrice)
        .filter(
            MaterialSourcePrice.source_id == body.source_id,
            MaterialSourcePrice.material_code == body.material_code,
            MaterialSourcePrice.effective_date == eff,
        )
        .one_or_none()
    )
    if existing:
        existing.fob_price = body.fob_price
        existing.unit = body.unit
        existing.material_name = body.material_name
        existing.quoted_by = body.quoted_by
        existing.source_note = body.source_note
        row = existing
        created = False
    else:
        row = MaterialSourcePrice(
            source_id=body.source_id, material_code=body.material_code,
            material_name=body.material_name, unit=body.unit,
            fob_price=body.fob_price, effective_date=eff,
            quoted_by=body.quoted_by, source_note=body.source_note,
            tenant_id=auth.get("tenant_id") or "default",
        )
        db.add(row)
        created = True
    db.commit()
    db.refresh(row)
    return {
        "success": True, "created": created, "id": row.id,
        "material_code": row.material_code, "fob_price": row.fob_price,
        "effective_date": row.effective_date.isoformat(),
    }


# ── Haul profiles and labor markets ───────────────────────────────────────────


class HaulIn(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    tons_per_load: float = Field(..., gt=0, le=60)
    truck_cost_per_hour: float = Field(..., gt=0)
    truck_type: Optional[str] = Field(None, max_length=60)
    load_minutes: float = Field(15.0, ge=0, le=240)
    dump_minutes: float = Field(15.0, ge=0, le=240)
    average_speed_mph: float = Field(45.0, gt=0, le=80)
    circuity_factor: float = Field(1.25, ge=1.0, le=2.0)
    is_default: bool = False
    notes: Optional[str] = None


@router.post("/haul-profiles", summary="Add or update a haul profile")
def upsert_haul(body: HaulIn, db: Session = Depends(get_db),
                auth: dict = Depends(verify_premium_security)):
    row = db.query(HaulProfile).filter(HaulProfile.name == body.name).one_or_none()
    created = row is None
    if created:
        row = HaulProfile(name=body.name)
        db.add(row)
    for f, v in body.model_dump(exclude_unset=True).items():
        if f != "name":
            setattr(row, f, v)
    row.tenant_id = auth.get("tenant_id") or "default"
    if body.is_default:
        for other in db.query(HaulProfile).filter(HaulProfile.name != body.name).all():
            other.is_default = False
    db.commit()
    db.refresh(row)
    return {"success": True, "created": created, "id": row.id, "name": row.name}


class MarketIn(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    state: str = Field(..., min_length=2, max_length=2)
    lat: Optional[float] = Field(None, ge=-90, le=90)
    lng: Optional[float] = Field(None, ge=-180, le=180)
    radius_miles: float = Field(35.0, gt=0, le=300)
    crew_cost_per_hour: Optional[float] = Field(None, ge=0)
    prevailing_wage_required: bool = False
    per_diem_per_day: Optional[float] = Field(None, ge=0)
    source_note: Optional[str] = Field(None, max_length=200)


@router.post("/labor-markets", summary="Add or update a labor market")
def upsert_market(body: MarketIn, db: Session = Depends(get_db),
                  auth: dict = Depends(verify_premium_security)):
    row = db.query(LaborMarket).filter(LaborMarket.name == body.name).one_or_none()
    created = row is None
    if created:
        row = LaborMarket(name=body.name, state=body.state.upper())
        db.add(row)
    for f, v in body.model_dump(exclude_unset=True).items():
        if f not in ("name", "state"):
            setattr(row, f, v)
    row.state = body.state.upper()
    row.is_active = True
    row.tenant_id = auth.get("tenant_id") or "default"
    db.commit()
    db.refresh(row)
    return {"success": True, "created": created, "id": row.id, "name": row.name}


# ── The answer ────────────────────────────────────────────────────────────────


class DeliveredRequest(BaseModel):
    material_code: str = Field(..., min_length=1, max_length=60)
    lat: Optional[float] = Field(None, ge=-90, le=90)
    lng: Optional[float] = Field(None, ge=-180, le=180)
    project_site_id: Optional[int] = None
    job_date: Optional[datetime] = None
    haul_profile: Optional[str] = Field(None, max_length=120)
    tons: Optional[float] = Field(None, gt=0, description="Job quantity, for a total")

    @model_validator(mode="after")
    def _needs_a_location(self) -> "DeliveredRequest":
        if self.project_site_id is None and (self.lat is None or self.lng is None):
            raise ValueError("give either project_site_id or both lat and lng")
        return self


@router.post("/delivered", summary="Delivered cost per ton at a job site, by source")
def delivered(body: DeliveredRequest, db: Session = Depends(get_db),
              _: dict = Depends(verify_premium_security)):
    """
    Price a material into a site from every source, cheapest delivered first.

    Sources that cannot supply the job still appear, with the reason — closed
    for the season, haul too long for the mix, or no price on file. A plant
    dropped silently is a plant nobody re-checks, and the reason is usually
    the useful part.
    """
    lat, lng, site_label = body.lat, body.lng, None
    if body.project_site_id is not None:
        site = db.query(ProjectSite).filter(ProjectSite.id == body.project_site_id).one_or_none()
        if site is None:
            raise HTTPException(status_code=404, detail=f"No project site {body.project_site_id}")
        if site.lat is None or site.lng is None:
            raise HTTPException(
                status_code=422,
                detail=f"Project site {body.project_site_id} has no coordinates.",
            )
        lat, lng = site.lat, site.lng
        site_label = f"{site.city}, {site.state}" if site.city else site.address

    profile = None
    if body.haul_profile:
        profile = db.query(HaulProfile).filter(HaulProfile.name == body.haul_profile).one_or_none()
        if profile is None:
            raise HTTPException(status_code=404, detail=f"No haul profile '{body.haul_profile}'")
    else:
        profile = (
            db.query(HaulProfile).filter(HaulProfile.is_default.is_(True)).one_or_none()
            or db.query(HaulProfile).order_by(HaulProfile.id).first()
        )
    if profile is None:
        raise HTTPException(
            status_code=409,
            detail="No haul profile configured. Delivered cost cannot be computed without "
                   "tons per load and truck cost per hour — POST /api/v1/costing/haul-profiles.",
        )

    haul = {
        "tons_per_load": profile.tons_per_load,
        "truck_cost_per_hour": profile.truck_cost_per_hour,
        "average_speed_mph": profile.average_speed_mph,
        "load_minutes": profile.load_minutes,
        "dump_minutes": profile.dump_minutes,
        "circuity_factor": profile.circuity_factor,
    }

    job_date = body.job_date or _utcnow()
    sources = db.query(MaterialSource).filter(MaterialSource.is_active.is_(True)).all()
    if not sources:
        raise HTTPException(
            status_code=409,
            detail="No material sources configured. Add the plants you buy from — "
                   "POST /api/v1/costing/sources.",
        )

    evaluated = []
    for s in sources:
        price_row = (
            db.query(MaterialSourcePrice)
            .filter(
                MaterialSourcePrice.source_id == s.id,
                MaterialSourcePrice.material_code == body.material_code,
                MaterialSourcePrice.effective_date <= job_date,
            )
            .order_by(MaterialSourcePrice.effective_date.desc())
            .first()
        )
        row = dc.evaluate_source(
            source=_source_dict(s),
            fob_price=price_row.fob_price if price_row else None,
            site_lat=lat, site_lng=lng, haul=haul,
            job_month=job_date.month,
        )
        if price_row:
            row["price_effective_date"] = price_row.effective_date.isoformat()
            row["price_source_note"] = price_row.source_note
        evaluated.append(row)

    ranked = dc.rank_sources(evaluated)
    best = ranked[0] if ranked else None

    markets = [
        {"id": m.id, "name": m.name, "state": m.state, "lat": m.lat, "lng": m.lng,
         "radius_miles": m.radius_miles, "crew_cost_per_hour": m.crew_cost_per_hour,
         "prevailing_wage_required": m.prevailing_wage_required,
         "per_diem_per_day": m.per_diem_per_day}
        for m in db.query(LaborMarket).filter(LaborMarket.is_active.is_(True)).all()
    ]
    market = dc.market_for_site(markets, lat, lng)

    spread = None
    if len(ranked) > 1:
        spread = round(
            ranked[-1]["delivered_cost_per_ton"] - ranked[0]["delivered_cost_per_ton"], 2
        )

    return {
        "success": True,
        "site": {"lat": lat, "lng": lng, "label": site_label},
        "material_code": body.material_code,
        "job_date": job_date.isoformat(),
        "haul_profile": profile.name,
        "best_source": best,
        "delivered_cost_per_ton": best["delivered_cost_per_ton"] if best else None,
        "job_total_usd": round(best["delivered_cost_per_ton"] * body.tons, 2)
        if best and body.tons else None,
        "spread_across_sources_per_ton": spread,
        "sources_evaluated": len(evaluated),
        "sources_usable": len(ranked),
        "all_sources": evaluated,
        "labor_market": market,
        "labor_market_note": None if market else (
            "Site falls outside every configured labor market. If the crew travels to "
            "this job, per diem and travel time belong in the price."
        ),
    }
