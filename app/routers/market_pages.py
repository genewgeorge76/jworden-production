"""
market_pages.py — Programmatic county page planning for Virginia.

Read-only and stateless. It computes what pages would exist and what each
would say; publishing them is the site repositories' job.

`/keywords` exists to answer a question that will keep being asked, with the
truth rather than a plausible table.
"""

from __future__ import annotations

import logging
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from ..core.security import verify_premium_security
from ..services import market_pages as mp
from ..services import va_market_geo as geo

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/market", tags=["market-pages"])


@router.get("/districts", summary="VDOT's nine districts and their counties")
def list_districts(auth: dict = Depends(verify_premium_security)):
    return {
        "ok": True,
        "district_count": len(geo.DISTRICTS),
        "county_count": len(geo.all_counties()),
        "districts": [
            {"key": d.key, "name": d.name, "county_count": len(d.counties),
             "counties": list(d.counties)}
            for d in geo.DISTRICTS
        ],
        "source": "vdot.virginia.gov/about/districts, checked 2026-08-20",
        "note": "Independent cities are excluded — Virginia has 38 and they "
                "belong to no county, so they need their own pages.",
    }


@router.get("/counties", summary="All 95 counties with their district")
def list_counties(district: Optional[str] = Query(default=None),
                  auth: dict = Depends(verify_premium_security)):
    rows = [
        {"county": f"{c} County", "district": d.name, "district_key": d.key}
        for c, d in geo.all_counties()
        if not district or d.key == district
    ]
    if district and not rows:
        raise HTTPException(
            status_code=404,
            detail=f"unknown district {district!r}. Known: {sorted(geo.BY_KEY)}",
        )
    return {"ok": True, "count": len(rows), "counties": rows}


@router.get("/services", summary="Services a page can be generated for")
def list_services(auth: dict = Depends(verify_premium_security)):
    return {
        "ok": True,
        "services": [
            {"key": k, "label": v["label"],
             "specifications": [mp.SPECIFICATIONS[s].code for s in v["specs"]]}
            for k, v in mp.SERVICES.items()
        ],
        "specifications": [
            {"code": s.code, "description": s.description, "source": s.source}
            for s in mp.SPECIFICATIONS.values()
        ],
        "schema_type": mp.SCHEMA_TYPE,
    }


class PageIn(BaseModel):
    domain: str = Field(min_length=4, max_length=200)
    county: str = Field(min_length=2, max_length=60)
    service: str
    business_name: str = Field(min_length=2, max_length=160)
    telephone: Optional[str] = None


@router.post("/pages/preview", summary="Generate one county page")
def preview_page(payload: PageIn, auth: dict = Depends(verify_premium_security)):
    try:
        page = mp.generate_page(
            domain=payload.domain, county=payload.county, service=payload.service,
            business_name=payload.business_name, telephone=payload.telephone,
        )
    except mp.UnknownService as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except mp.UnknownCounty as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"ok": True, "page": page.as_dict()}


class PlanIn(BaseModel):
    domain: str = Field(min_length=4, max_length=200)
    business_name: str = Field(min_length=2, max_length=160)
    services: Optional[list[str]] = None
    districts: Optional[list[str]] = None
    telephone: Optional[str] = None
    include_urls: bool = True


@router.post("/pages/plan", summary="Every page a build would produce")
def plan_pages(payload: PlanIn, auth: dict = Depends(verify_premium_security)):
    try:
        result = mp.plan(
            domain=payload.domain, business_name=payload.business_name,
            services=payload.services, districts=payload.districts,
            telephone=payload.telephone,
        )
    except mp.UnknownService as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except mp.UnknownCounty as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    if not payload.include_urls:
        result.pop("urls", None)
    return {"ok": True, **result}


@router.get("/keywords", summary="Why there are no keyword volumes here")
def keywords(auth: dict = Depends(verify_premium_security)) -> dict[str, Any]:
    """
    Answers the question rather than inventing the table.

    Search volume and CPC are the first thing anyone asks a programmatic SEO
    tool for, and the easiest thing to make up convincingly. Nothing here
    measures them today, so this endpoint says which source would and what it
    needs, and returns no numbers.
    """
    from ..services import runtime_config as cfg

    gsc_ready = bool(cfg.get("GSC_SITE_URL") and cfg.get("GSC_SERVICE_ACCOUNT_JSON"))
    return {
        "ok": True,
        "keywords": [],
        "reason": "No keyword volume or CPC data source is connected, so no "
                  "figures are reported. An unmeasured number gets budgeted "
                  "against as though it were a forecast.",
        "sources": {
            "google_search_console": {
                "connected": gsc_ready,
                "provides": "Real impressions, clicks, CTR and average position "
                            "for queries this site already ranks for.",
                "needs": [] if gsc_ready else
                         ["GSC_SITE_URL", "GSC_SERVICE_ACCOUNT_JSON"],
                "note": "Settable live via the admin integrations endpoint; no "
                        "redeploy required.",
            },
            "ahrefs": {
                "connected": False,
                "provides": "Estimated volume and difficulty for queries the "
                            "site does not yet rank for.",
                "needs": ["An Ahrefs plan that includes API access"],
                "note": "The current plan returns 'Insufficient plan' on every "
                        "endpoint, including the documented free one.",
            },
        },
    }
