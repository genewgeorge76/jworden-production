"""
Permitting endpoints for the JWordenAI Command Center.

Routes:
  GET  /api/v1/permits/virginia/vpt        — Virginia Permit Transparency permit feed
  GET  /api/v1/permits/virginia/deq        — DEQ PEEP stormwater permit feed
  POST /api/v1/permits/virginia/dpor       — DPOR license lookup via Apify
  GET  /api/v1/permits/national            — Multi-state national permit feed
  GET  /api/v1/permits/rules/{state_code}  — Codified state permit trigger rules
  POST /api/v1/permits/check               — Intelligent permit check (state + county + cost/size gates)
"""

# NOTE: Do NOT add `from __future__ import annotations` to this module.
# FastAPI captures Pydantic-body annotations at route registration time; with
# postponed evaluation, body models become ForwardRefs and /openapi.json
# raises PydanticUserError. Python 3.11 already supports `list[…]` and `X | None`
# natively, so the future import is unnecessary here.

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field

from ..core.limiter import limiter
from ..core.security import verify_premium_security
from ..services.permit_scraper import fetch_vpt_permits, fetch_deq_permits, lookup_dpor_license
from ..services.lead_scorer import score_lead
from ..services.permit_engine import engine as permit_engine

router = APIRouter(prefix="/api/v1/permits", tags=["permits"])


# ── Response helpers ──────────────────────────────────────────────────────────

def _enrich_with_score(leads: list[dict]) -> list[dict]:
    """Append lead score to each permit lead dict."""
    enriched = []
    for lead in leads:
        scoring = score_lead(lead)
        enriched.append({**lead, "lead_score": scoring})
    return enriched


# ── VPT ───────────────────────────────────────────────────────────────────────

@router.get(
    "/virginia/vpt",
    summary="Virginia Permit Transparency — paving & construction permit feed",
)
@limiter.limit("30/minute")
async def vpt_permits(
    request: Request,
    keyword: str = Query(default="paving", max_length=100, description="Search term (e.g. paving, asphalt, parking)"),
    limit: int = Query(default=50, ge=1, le=200, description="Max number of permits to return"),
    _: dict = Depends(verify_premium_security),
):
    """
    Poll the Virginia Permit Transparency portal for permits matching *keyword*.
    Results are enriched with JWordenAI lead scores so hot prospects are
    immediately identifiable in the Command Center dashboard.
    """
    leads = fetch_vpt_permits(keyword=keyword, max_results=limit)
    return {
        "status": "ok",
        "source": "Virginia Permit Transparency (VPT)",
        "count": len(leads),
        "permits": _enrich_with_score(leads),
    }


# ── DEQ PEEP ─────────────────────────────────────────────────────────────────

@router.get(
    "/virginia/deq",
    summary="Virginia DEQ PEEP — stormwater construction permit feed",
)
@limiter.limit("30/minute")
async def deq_permits(
    request: Request,
    limit: int = Query(default=50, ge=1, le=200, description="Max number of permits to return"),
    _: dict = Depends(verify_premium_security),
):
    """
    Query Virginia DEQ PEEP for active Stormwater Construction General Permits
    (VPDES-CGP). These are reliable precursors to large paving / site-work jobs.
    Results are enriched with JWordenAI lead scores.
    """
    leads = fetch_deq_permits(max_results=limit)
    return {
        "status": "ok",
        "source": "Virginia DEQ PEEP (Stormwater CGP)",
        "count": len(leads),
        "permits": _enrich_with_score(leads),
    }


# ── DPOR ──────────────────────────────────────────────────────────────────────

class DporRequest(BaseModel):
    license_number: str | None = Field(default=None, max_length=50, description="DPOR license number")
    address: str | None = Field(default=None, max_length=300, description="Contractor address to look up")


# Force Pydantic to resolve forward refs created by `from __future__ import annotations`.
# Without this, /openapi.json raises PydanticUserError: "DporRequest is not fully defined".
DporRequest.model_rebuild()


@router.post(
    "/virginia/dpor",
    summary="DPOR license lookup — validate or enrich contractor / prospect intel",
)
@limiter.limit("10/minute")
async def dpor_lookup(request: Request, req: DporRequest, _: dict = Depends(verify_premium_security)):
    """
    Look up a Virginia DPOR license by number or address via the Apify scraper.
    Useful for validating competitor intel or enriching inbound leads with
    license status before sending a sales follow-up.
    """
    if not req.license_number and not req.address:
        raise HTTPException(status_code=422, detail="Provide license_number or address.")

    result = lookup_dpor_license(
        license_number=req.license_number,
        address=req.address,
    )

    if result.get("error") and not result.get("data"):
        raise HTTPException(status_code=503, detail=result["error"])

    return {
        "status": "ok",
        "source": "Virginia DPOR (via Apify)",
        **result,
    }


@router.get("/national", summary="Multi-state national permit feed (Feature 6)")
@limiter.limit("10/minute")
async def national_permits(
    request: Request,
    states: str = "VA,TX,FL,NC,GA,NY,NJ,MI",
    keyword: str = "asphalt",
    limit: int = 25,
    _: dict = Depends(verify_premium_security),
):
    """
    Aggregate permit leads across multiple states using the national permit scrapers.
    Pass `states` as a comma-separated list of 2-letter codes.
    """
    from ..services.national_permits import fetch_all_permits  # noqa: PLC0415

    state_list = [s.strip().upper() for s in states.split(",") if s.strip()]
    if not state_list:
        raise HTTPException(status_code=422, detail="No valid states provided.")

    import asyncio  # noqa: PLC0415
    results = await asyncio.get_event_loop().run_in_executor(
        None, lambda: fetch_all_permits(state_list, keyword=keyword, max_results=limit)
    )
    return {"status": "ok", "count": len(results), "results": results}


# ── State permit rules (static codified logic) ────────────────────────────────

# Sources:
#   VA — Virginia Uniform Statewide Building Code (USBC)
#   NC — NC General Statute 160D-1110
#   SC — SC Code of Laws Title 6 Chapter 9
#   GA — Georgia State Minimum Standard Codes
#   MD — Maryland Building Performance Standards (MBPS)
_PERMIT_RULES: dict[str, dict] = {
    "VA": {
        "governing_law": "Virginia Uniform Statewide Building Code (USBC)",
        "permit_required_if": [
            "Any new structure or addition",
            "Shed/Accessory structure exceeds 256 sq ft",
            "Deck is attached to house or > 30 inches off ground",
            "Finishing a basement or moving load-bearing walls",
            "New electrical, gas, or plumbing circuits",
        ],
        "universal_exception": "Ordinary repairs and light fixture replacement",
    },
    "NC": {
        "governing_law": "NC General Statute 160D-1110",
        "logic_summary": "Permit required for projects > $40,000 OR specific triggers.",
        "permit_required_if": [
            "Project cost exceeds $40,000",
            "Structural changes (load-bearing walls)",
            "Addition/Change in plumbing, mechanical, or electrical design",
            "Changing building footprint (regardless of cost)",
            "Deck additions or structural deck repairs",
        ],
        "exemptions": ["Replacing pickets, railings, or deck floorboards < $40k"],
    },
    "SC": {
        "governing_law": "SC Code of Laws Title 6 Chapter 9",
        "permit_required_if": [
            "Project value exceeds $2,000 (standard threshold)",
            "Work > $200 usually requires a licensed professional",
            "New construction or structural alterations",
            "Coastal counties: Any change affecting wind/seismic resistance",
        ],
        "special_note": "Coastal counties (Horry, Charleston) have stricter hurricane codes.",
    },
    "GA": {
        "governing_law": "Georgia State Minimum Standard Codes",
        "permit_required_if": [
            "Project requires a professional inspection",
            "Accessory structures (sheds) > 200 sq ft",
            "New electrical, plumbing, or HVAC systems",
            "Structural changes or footprint expansion",
        ],
        "exemptions": ["Retaining walls under 4ft", "Fencing", "Painting/Carpeting"],
    },
    "MD": {
        "governing_law": "Maryland Building Performance Standards (MBPS)",
        "permit_required_if": [
            "All new construction and additions",
            "Structural alterations",
            "Deck > 30 inches above grade",
            "Sheds (varies by county, but generally 150-200 sq ft threshold)",
            "Within 1,000ft of tidal waters (Critical Area permit)",
        ],
    },
}

_SUPPORTED_STATES = sorted(_PERMIT_RULES.keys())


@router.get(
    "/rules/{state_code}",
    summary="State permit rules — codified trigger logic for VA, NC, SC, GA, MD",
)
def get_permit_rules(state_code: str, _: dict = Depends(verify_premium_security)):
    """
    Return the codified permit-trigger rules for a given 2-letter US state code.

    Supported states: VA, NC, SC, GA, MD.

    Response includes:
    - ``governing_law``       — authoritative statute reference
    - ``permit_required_if``  — list of conditions that trigger a permit requirement
    - ``exemptions``          — work categories explicitly exempt (where applicable)
    - ``special_note``        — coastal / local override notes (where applicable)
    """
    key = state_code.upper().strip()
    rules = _PERMIT_RULES.get(key)
    if rules is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"State '{key}' not found. "
                f"Supported states: {', '.join(_SUPPORTED_STATES)}"
            ),
        )
    return {"state": key, **rules}


# ── Intelligent permit check (engine-powered) ─────────────────────────────────

class PermitCheckRequest(BaseModel):
    state_code:     str   = Field(..., min_length=2, max_length=2, description="2-letter state code (VA, NC, SC, GA, MD)")
    county_name:    str | None = Field(default=None, max_length=100, description="County name (optional)")
    project_cost:   float = Field(default=0.0, ge=0, description="Estimated project value in USD")
    structure_size: float = Field(default=0.0, ge=0, description="Accessory structure area in sq ft")


@router.post(
    "/check",
    summary="Intelligent permit check — state + county override + cost/size logic gates",
)
def check_permit(
    req: PermitCheckRequest,
    _: dict = Depends(verify_premium_security),
):
    """
    Run the permit engine against a specific project scenario.

    - Applies state golden rules for VA, NC, SC, GA, or MD.
    - Overlays county-specific fee schedules and trigger overrides where available.
    - Evaluates cost threshold (NC $40k / SC $2k) and structure-size gates.
    - Returns ``permit_likely`` boolean plus annotated ``notes``.

    Supported counties include: Fairfax, Prince William, Loudoun, Virginia Beach,
    Franklin (VA); Mecklenburg, Brunswick (NC); Horry, Charleston, Greenville (SC);
    Gwinnett, Cobb, DeKalb, Fulton (GA); Prince George's, Montgomery,
    Baltimore County, Anne Arundel (MD).
    """
    result = permit_engine.get_permit_info(
        state_code=req.state_code,
        county_name=req.county_name,
        project_cost=req.project_cost,
        structure_size=req.structure_size,
    )
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result
