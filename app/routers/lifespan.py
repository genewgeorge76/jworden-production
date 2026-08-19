"""
lifespan.py — Pavement condition rating and 25-year lifecycle projection.

Answers three questions with the line between them kept visible: what
condition is this pavement in, what happens to it if nothing is done, and what
do the maintenance options cost per year of life they buy.

Every unit cost is an input. None is hardcoded — a dollar-per-square-foot in
source is stale the season after it is written and wrong in the next metro
anyway. Supply your real numbers and the arithmetic is real; supply nothing
and the endpoint says it cannot cost the tiers rather than inventing a price.

Area is an input too. Measuring a lot from imagery is the vision takeoff's job
(`/instant-takeoff.html` on the commercial sites); this endpoint consumes a
measured area rather than claiming to measure one.
"""

from __future__ import annotations

import logging
from typing import Any, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field, model_validator

from ..core.security import verify_premium_security
from ..services import pavement_lifespan as pl

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/lifespan", tags=["lifespan"])


# ── PCI ───────────────────────────────────────────────────────────────────────


class PciRequest(BaseModel):
    deduct_values: list[float] = Field(
        ..., min_length=0, max_length=40,
        description="Deduct values read from the ASTM D6433 distress curves. "
                    "Empty means no distress recorded.",
    )
    corrected_deduct_value: Optional[float] = Field(
        None, ge=0, le=100,
        description="CDV from the D6433 correction curves. Without it the result "
                    "is reported as uncorrected and is indicative only.",
    )


@router.post("/pci", summary="PCI from ASTM D6433 deduct values")
def compute_pci(body: PciRequest, _: dict = Depends(verify_premium_security)):
    """
    Run the D6433 arithmetic over deduct values a surveyor read from the curves.

    The deduct-value and CDV curves are chart data inside the standard and are
    not reproduced here. Coefficients invented to resemble them would yield a
    number that looks like a PCI and is not one, which in a reserve study is
    the kind of figure the other side's engineer checks first.
    """
    r = pl.pci_from_deduct_values(body.deduct_values, body.corrected_deduct_value)
    return {
        "success": True,
        "standard": "ASTM D6433",
        "pci": r.pci,
        "rating": r.rating,
        "corrected": r.corrected,
        "total_deduct_value": r.total_deduct_value,
        "reduced_deduct_values": r.reduced_deduct_values,
        "allowable_deduct_count_m": r.allowable_deduct_count,
        "note": r.note,
    }


@router.get("/rating", summary="ASTM D6433 condition rating for a PCI")
def pci_rating(
    pci: float = Query(..., ge=0, le=100),
    _: dict = Depends(verify_premium_security),
):
    return {"success": True, "standard": "ASTM D6433", "pci": pci, "rating": pl.rating_for_pci(pci)}


# ── Projection and tiers ──────────────────────────────────────────────────────


class Tier(BaseModel):
    id: str = Field(..., min_length=1, max_length=40)
    name: str = Field(..., min_length=1, max_length=160)
    scope: Optional[str] = Field(None, max_length=1000)
    unit_cost_per_sqft: float = Field(
        ..., ge=0,
        description="Your real installed cost per square foot for this scope.",
    )
    extension_years_low: float = Field(..., gt=0, le=60)
    extension_years_high: float = Field(..., gt=0, le=60)
    restored_pci: Optional[float] = Field(None, ge=0, le=100)

    @model_validator(mode="after")
    def _range_ordered(self) -> "Tier":
        if self.extension_years_high < self.extension_years_low:
            raise ValueError("extension_years_high must be >= extension_years_low")
        return self


class LifecycleRequest(BaseModel):
    area_sqft: float = Field(..., gt=0, description="Measured area. Not estimated here.")
    current_pci: Optional[float] = Field(
        None, ge=0, le=100,
        description="From a survey or /pci. Omit it and no projection is produced.",
    )
    horizon_years: int = Field(25, ge=1, le=50)
    tiers: list[Tier] = Field(default_factory=list, max_length=10)

    # Deterioration model parameters, surfaced so they can be calibrated.
    beta: float = Field(pl.DEFAULT_BETA, gt=0, le=10)
    terminal_pci: float = Field(pl.DEFAULT_TERMINAL_PCI, ge=0, le=100)
    service_life_years: float = Field(pl.DEFAULT_SERVICE_LIFE_YEARS, gt=0, le=60)


@router.post("/lifecycle", summary="Do-nothing projection plus costed maintenance tiers")
def lifecycle(body: LifecycleRequest, _: dict = Depends(verify_premium_security)):
    """
    The unmaintained curve, and each tier's cost per year of life it buys.

    Three things this deliberately does not do.

    It does not invent a starting PCI. Without `current_pci` there is no
    projection — a curve drawn from an assumed condition is a picture of an
    assumption, and it is the picture that ends up in the proposal.

    It does not ship default tiers. Slurry, mill-and-overlay and full-depth
    reclamation cost what they cost in your market this season; the caller
    supplies the unit costs and the arithmetic runs over those.

    It does not extrapolate past the model's range. Beyond the service life
    the curve is clamped at the terminal PCI rather than continuing to zero.
    """
    projection = None
    projection_note = (
        "No current_pci supplied, so no projection was produced. A curve drawn "
        "from an assumed starting condition describes the assumption, not the lot."
    )
    if body.current_pci is not None:
        projection = pl.project_pci(
            body.current_pci,
            years=body.horizon_years,
            beta=body.beta,
            terminal_pci=body.terminal_pci,
            service_life_years=body.service_life_years,
        )
        projection_note = (
            "Unmaintained projection. This is a model, not a measurement: the "
            "parameters below are an uncalibrated family curve until they are "
            "fitted to your own condition history."
        )

    tiers = [
        {
            "id": t.id,
            "name": t.name,
            "scope": t.scope,
            **pl.evaluate_tier(
                area_sqft=body.area_sqft,
                unit_cost_per_sqft=t.unit_cost_per_sqft,
                extension_years_low=t.extension_years_low,
                extension_years_high=t.extension_years_high,
                restored_pci=t.restored_pci,
            ),
        }
        for t in body.tiers
    ]

    # Ranked by the cheapest year of life bought, using the conservative
    # (shorter-life) end of each range so the ranking cannot be won by an
    # optimistic upper bound.
    ranked = sorted(
        tiers, key=lambda t: t["annualized_cost_per_sqft_per_year"]["high"]
    )

    return {
        "success": True,
        "area_sqft": body.area_sqft,
        "current_pci": body.current_pci,
        "current_rating": pl.rating_for_pci(body.current_pci),
        "horizon_years": body.horizon_years,
        "projection_unmaintained": projection,
        "projection_note": projection_note,
        "model": {
            "name": pl.DETERIORATION_MODEL,
            "formula": "PCI(t) = PCI0 - (PCI0 - terminal) * (t / service_life) ** beta",
            "beta": body.beta,
            "terminal_pci": body.terminal_pci,
            "service_life_years": body.service_life_years,
            "calibrated": False,
            "calibration_note": (
                "Fit beta and service_life_years to your own PCI history before "
                "quoting the curve. Until then it is a family curve, not a forecast "
                "for this lot."
            ),
        },
        "tiers": tiers,
        "tiers_note": (
            "Costed from the unit prices supplied in this request. No price is "
            "stored in the software." if tiers else
            "No tiers supplied, so none were costed. Send your real unit costs "
            "per square foot to compare options."
        ),
        "ranked_by_annualized_cost": [t["id"] for t in ranked],
    }
