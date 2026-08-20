"""
job_estimate.py — The whole chain in one call.

Area and thicknesses at a location, out the other end a priced job: quantities
from geometry, materials priced delivered from the nearest usable plant, labor
from the site's market, and optionally the maintenance tiers that follow.

Each stage reports its own state. Quantities always resolve, because they are
arithmetic on dimensions. Everything downstream needs data that is specific to
a market and a season, so when it is missing the response says which stage
stopped and why, rather than closing the gap with a default.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, model_validator
from sqlalchemy.orm import Session

from ..core.security import verify_premium_security
from ..database import get_db
from ..models import HaulProfile, LaborMarket, MaterialSource, MaterialSourcePrice, ProjectSite
from ..services import delivered_cost as dc
from ..services import job_chain as jc
from ..services import pavement_lifespan as pl
from ..services.location_resolver import resolve_location
from ..services.tenancy import scope, tenant_of

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/estimate", tags=["estimate"])


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class TierIn(BaseModel):
    id: str = Field(..., min_length=1, max_length=40)
    name: str = Field(..., min_length=1, max_length=160)
    unit_cost_per_sqft: float = Field(..., ge=0)
    extension_years_low: float = Field(..., gt=0, le=60)
    extension_years_high: float = Field(..., gt=0, le=60)
    restored_pci: Optional[float] = Field(None, ge=0, le=100)


class JobRequest(BaseModel):
    area_sqft: float = Field(..., gt=0)
    surface_thickness_in: float = Field(2.0, gt=0, le=12)
    base_thickness_in: float = Field(6.0, ge=0, le=24)
    compaction_pct: Optional[float] = Field(None, ge=0, le=110)

    address: Optional[str] = Field(None, min_length=2, max_length=300)
    lat: Optional[float] = Field(None, ge=-90, le=90)
    lng: Optional[float] = Field(None, ge=-180, le=180)
    project_site_id: Optional[int] = None

    surface_material_code: str = Field("hma_sm_9_5a", max_length=60)
    base_material_code: str = Field("agg_21a", max_length=60)

    job_date: Optional[datetime] = None
    haul_profile: Optional[str] = Field(None, max_length=120)
    crew_hours: Optional[float] = Field(None, gt=0, le=10000)

    current_pci: Optional[float] = Field(None, ge=0, le=100)
    tiers: list[TierIn] = Field(default_factory=list, max_length=10)

    @model_validator(mode="after")
    def _needs_a_location(self) -> "JobRequest":
        if self.address is None and self.project_site_id is None and (
            self.lat is None or self.lng is None
        ):
            raise ValueError("give an address, a project_site_id, or both lat and lng")
        return self


def _price_material(db: Session, material_code: str, lat: float, lng: float,
                    haul: dict[str, Any], job_date: datetime,
                    tenant: str) -> Optional[dict[str, Any]]:
    """Run one material through the costing engine. None when no source exists at all."""
    sources = scope(db.query(MaterialSource).filter(MaterialSource.is_active.is_(True)),
                    MaterialSource, tenant).all()
    if not sources:
        return None

    evaluated = []
    for s in sources:
        price_row = scope(
            db.query(MaterialSourcePrice)
            .filter(
                MaterialSourcePrice.source_id == s.id,
                MaterialSourcePrice.material_code == material_code,
                MaterialSourcePrice.effective_date <= job_date,
            ),
            MaterialSourcePrice, tenant,
        ).order_by(MaterialSourcePrice.effective_date.desc()).first()
        row = dc.evaluate_source(
            source={
                "id": s.id, "name": s.name, "city": s.city, "state": s.state,
                "lat": s.lat, "lng": s.lng,
                "season_open_month": s.season_open_month,
                "season_close_month": s.season_close_month,
                "max_haul_minutes": s.max_haul_minutes,
            },
            fob_price=price_row.fob_price if price_row else None,
            site_lat=lat, site_lng=lng, haul=haul, job_month=job_date.month,
        )
        if price_row:
            row["price_effective_date"] = price_row.effective_date.isoformat()
            row["price_source_note"] = price_row.source_note
        evaluated.append(row)

    ranked = dc.rank_sources(evaluated)
    return {
        "material_code": material_code,
        "best_source": ranked[0] if ranked else None,
        "delivered_cost_per_ton": ranked[0]["delivered_cost_per_ton"] if ranked else None,
        "all_sources": evaluated,
    }


@router.post("/job", summary="Quantities, delivered material cost, labor and lifecycle in one call")
def estimate_job(body: JobRequest, db: Session = Depends(get_db),
                 auth: dict = Depends(verify_premium_security)):
    """
    The end-to-end estimate.

    Quantities come out whatever else is configured, so this is useful on day
    one as a takeoff. Pricing appears as the plants, quotes and haul profile
    are entered, and until then each line says what is missing instead of
    carrying a placeholder rate.
    """
    stages: list[dict[str, Any]] = []
    tenant = tenant_of(auth)

    where = resolve_location(db, lat=body.lat, lng=body.lng,
                             address=body.address, project_site_id=body.project_site_id)
    lat, lng, label = where["lat"], where["lng"], where.get("label")

    job_date = body.job_date or _utcnow()

    # ── 1. Quantities ──
    quantities = jc.build_quantities(
        area_sqft=body.area_sqft,
        surface_thickness_in=body.surface_thickness_in,
        base_thickness_in=body.base_thickness_in,
        compaction_pct=body.compaction_pct,
    )
    stages.append({"stage": "quantities", "ok": True,
                   "note": "geometry only — resolves with nothing configured"})

    # ── 2. Materials, delivered ──
    profile = None
    if body.haul_profile:
        profile = scope(db.query(HaulProfile).filter(HaulProfile.name == body.haul_profile),
                        HaulProfile, tenant).one_or_none()
        if profile is None:
            raise HTTPException(status_code=404, detail=f"No haul profile '{body.haul_profile}'")
    else:
        profile = (scope(db.query(HaulProfile).filter(HaulProfile.is_default.is_(True)),
                         HaulProfile, tenant).one_or_none()
                   or scope(db.query(HaulProfile), HaulProfile, tenant)
                        .order_by(HaulProfile.id).first())

    priced: dict[str, Optional[dict[str, Any]]] = {"surface": None, "base": None}
    if profile is None:
        stages.append({
            "stage": "materials", "ok": False,
            "note": "no haul profile configured — POST /api/v1/costing/haul-profiles with "
                    "tons per load and truck cost per hour",
        })
    else:
        haul = {
            "tons_per_load": profile.tons_per_load,
            "truck_cost_per_hour": profile.truck_cost_per_hour,
            "average_speed_mph": profile.average_speed_mph,
            "load_minutes": profile.load_minutes,
            "dump_minutes": profile.dump_minutes,
            "circuity_factor": profile.circuity_factor,
        }
        priced["surface"] = _price_material(db, body.surface_material_code, lat, lng,
                                            haul, job_date, tenant)
        if body.base_thickness_in > 0:
            priced["base"] = _price_material(db, body.base_material_code, lat, lng,
                                             haul, job_date, tenant)
        any_priced = any(p and p.get("delivered_cost_per_ton") is not None for p in priced.values())
        stages.append({
            "stage": "materials", "ok": any_priced,
            "haul_profile": profile.name,
            "note": None if any_priced else
                    "no source could price these materials — add plants and dated FOB prices "
                    "via POST /api/v1/costing/sources and /prices",
        })

    costed = jc.price_lines(quantities, priced)

    # ── 3. Labor ──
    markets = [
        {"id": m.id, "name": m.name, "state": m.state, "lat": m.lat, "lng": m.lng,
         "radius_miles": m.radius_miles, "crew_cost_per_hour": m.crew_cost_per_hour,
         "prevailing_wage_required": m.prevailing_wage_required,
         "per_diem_per_day": m.per_diem_per_day}
        for m in scope(db.query(LaborMarket).filter(LaborMarket.is_active.is_(True)),
                       LaborMarket, tenant).all()
    ]
    market = dc.market_for_site(markets, lat, lng)
    labor = jc.labor_estimate(market, body.crew_hours)
    stages.append({"stage": "labor", "ok": labor["available"], "note": labor.get("reason")})

    # ── 4. Job total ──
    job_total = None
    if costed["materials_total_usd"] is not None and labor["cost_usd"] is not None:
        job_total = round(costed["materials_total_usd"] + labor["cost_usd"], 2)

    # ── 5. Lifecycle, optional ──
    lifecycle = None
    if body.tiers or body.current_pci is not None:
        tiers = [
            {"id": t.id, "name": t.name,
             **pl.evaluate_tier(area_sqft=body.area_sqft,
                                unit_cost_per_sqft=t.unit_cost_per_sqft,
                                extension_years_low=t.extension_years_low,
                                extension_years_high=t.extension_years_high,
                                restored_pci=t.restored_pci)}
            for t in body.tiers
        ]
        lifecycle = {
            "current_pci": body.current_pci,
            "current_rating": pl.rating_for_pci(body.current_pci),
            "projection_unmaintained": pl.project_pci(body.current_pci)
            if body.current_pci is not None else None,
            "tiers": tiers,
            "note": None if body.current_pci is not None else
                    "no current_pci supplied, so no projection — a curve from an assumed "
                    "condition describes the assumption, not the lot",
        }

    return {
        "success": True,
        "site": where,
        "job_date": job_date.isoformat(),
        "quantities": quantities,
        "materials": costed,
        "oil_price_exposure": jc.oil_price_exposure(quantities["binder_tons"]),
        "labor": labor,
        "job_total_usd": job_total,
        "job_total_note": None if job_total is not None else
                          "no total: at least one component could not be priced. The "
                          "quantities above are still correct and usable as a takeoff.",
        "lifecycle": lifecycle,
        "stages": stages,
    }
