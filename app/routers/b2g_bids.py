"""
b2g_bids.py — SAM.gov solicitations and USDA-NRCS soil data.

BOTH ENDPOINTS IN THIS MODULE USED TO RETURN INVENTED DATA.

1. /opportunities returned three fabricated federal solicitations whenever the
   SAM.gov key was absent, the request raised, or the response was not 200:

       SOL-VDOT-2026-8841   I-95 Truck Lane Milling        $2,850,000  88.5%
       SOL-RIC-2026-1049    RIC Airport Taxiway Rehab      $1,450,000  79.2%
       SOL-USACE-2026-0042  Fort Barfoot Staging Lot       $4,200,000  91.0%

   with response deadlines, set-aside categories, and sam.gov links that resolve
   to nothing. It returned them as {"ok": true, "source": "Curated SAM.gov
   Feed"}. Nothing in the shape of that response distinguished it from live
   federal contract data. A person could plan capacity around a $4.2M Army Corps
   job that does not exist.

2. /geotechnical-soil was worse, because its output is a design input rather
   than a sales number. It declared USDA_SOIL_API_URL, never made a request of
   any kind, ignored the latitude and longitude entirely, and returned hardcoded
   soil mechanics — CBR 8.5, plasticity index 12.0, hydrologic group B, 98%
   compaction, 6" aggregate base — under "data_source": "USDA-NRCS SSURGO /
   Soil Data Access REST API".

   Designing a subgrade against a fabricated CBR under-builds the pavement. For
   a company whose stated floor is 96% Marshall and VDOT Section 315 base, a
   made-up bearing ratio attributed to a federal dataset is the worst possible
   failure in this file.

   It is now a real query against Soil Data Access, which is public and needs no
   key. Checked against the coordinates the old code shipped as its default
   (37.54, -77.43): SSURGO returns "Urban land" with a NULL hydrologic group.
   The hardcoded answer claimed "Urban land-Pamunkey complex, 0 to 3 percent
   slopes" and group "B" — invented, and wrong for its own default point.

   CBR IS NOT RETURNED. SSURGO does not publish a California Bearing Ratio;
   there is no column for it. The previous value was attributed to a source that
   does not carry it. What SSURGO does carry — hydrologic group, plasticity
   index, liquid limit, horizon depths — is returned as measured, and the
   caller is told plainly that CBR must come from a site investigation.
"""
import logging
import os
from typing import Any, Dict, Optional

import requests
from fastapi import APIRouter, Body, Query

from ..services import runtime_config as _cfg

router = APIRouter(prefix="/api/v1/b2g", tags=["b2g-bids"])
logger = logging.getLogger(__name__)

SAM_GOV_API_URL = "https://api.sam.gov/prod/opportunities/v2/search"
USDA_SOIL_API_URL = "https://SDMDataAccess.sc.egov.usda.gov/Tabular/post.rest"

_HTTP_TIMEOUT = 15


def _unavailable(reason: str, **extra: Any) -> Dict[str, Any]:
    """
    A refusal that carries no rows.

    `results: []` with `ok: False` rather than a plausible-looking list: "the
    search did not run" and "there is nothing out there this week" call for
    different responses from whoever reads it, and the old code made them
    identical.
    """
    payload = {
        "ok": False,
        "error": reason,
        "results": [],
        "count": 0,
        "note": (
            "No solicitations are listed because none were retrieved. This "
            "response contains no example rows on purpose."
        ),
    }
    payload.update(extra)
    return payload


@router.get("/opportunities", summary="Fetch B2G solicitations from SAM.gov")
def fetch_b2g_opportunities(
    state: str = Query("VA", description="2-letter state code"),
    naics: str = Query("237310", description="NAICS — Highway, Street & Bridge Construction"),
    posted_from: Optional[str] = Query(
        None, description="MM/dd/yyyy. SAM.gov requires a posted-date window."
    ),
    posted_to: Optional[str] = Query(None, description="MM/dd/yyyy"),
    limit: int = Query(25, ge=1, le=100),
):
    """
    Live federal paving and highway solicitations.

    Returns what SAM.gov returned, or an explicit failure. There is no curated
    fallback any more — see the module docstring for what used to be here.
    """
    api_key = (_cfg.get("SAM_GOV_API_KEY", "") or os.getenv("SAM_GOV_API_KEY", "")).strip()
    if not api_key:
        return _unavailable(
            "SAM_GOV_API_KEY is not configured, so no search was performed. "
            "A key is free from https://sam.gov (Account Details → API Key)."
        )

    params: Dict[str, Any] = {
        "api_key": api_key,
        "ncode": naics,
        "state": state,
        "limit": limit,
    }
    # SAM.gov's v2 search requires a posted-date window; omitting it is a 400.
    # Defaulting it here rather than letting the call fail keeps the endpoint
    # usable without the caller knowing that rule.
    if posted_from and posted_to:
        params["postedFrom"] = posted_from
        params["postedTo"] = posted_to
    else:
        from datetime import date, timedelta  # noqa: PLC0415

        today = date.today()
        params["postedFrom"] = (today - timedelta(days=90)).strftime("%m/%d/%Y")
        params["postedTo"] = today.strftime("%m/%d/%Y")

    try:
        resp = requests.get(SAM_GOV_API_URL, params=params, timeout=_HTTP_TIMEOUT)
    except Exception as exc:  # noqa: BLE001
        logger.warning("SAM.gov request failed: %s", exc)
        return _unavailable(f"SAM.gov request failed: {exc.__class__.__name__}: {exc}")

    if resp.status_code != 200:
        # The body is surfaced deliberately. SAM.gov explains rejected
        # parameters in it, and swallowing that behind fabricated rows is how a
        # misconfigured integration looked like a working one.
        detail = (resp.text or "")[:400]
        logger.warning("SAM.gov returned HTTP %s: %s", resp.status_code, detail)
        return _unavailable(
            f"SAM.gov returned HTTP {resp.status_code}.",
            status_code=resp.status_code,
            detail=detail,
        )

    try:
        data = resp.json()
    except ValueError as exc:
        return _unavailable(f"SAM.gov response was not JSON: {exc}")

    opportunities = data.get("opportunitiesData") or []
    return {
        "ok": True,
        "source": "SAM.gov live API",
        "count": len(opportunities),
        "results": opportunities,
        "window": {"posted_from": params["postedFrom"], "posted_to": params["postedTo"]},
    }


#: One horizon-level query against SSURGO. Ordered so the dominant component
#: and the shallowest horizon come first — the subgrade a paving crew meets.
_SOIL_QUERY = """
SELECT TOP 25
    m.mukey, m.muname, c.compname, c.comppct_r, c.hydgrp,
    ch.hzname, ch.hzdept_r, ch.hzdepb_r, ch.pi_r, ch.ll_r
FROM SDA_Get_Mukey_from_intersection_with_WktWgs84('point({lon} {lat})') AS t
JOIN mapunit  m  ON m.mukey = t.mukey
JOIN component c ON c.mukey = m.mukey
LEFT JOIN chorizon ch ON ch.cokey = c.cokey
ORDER BY c.comppct_r DESC, ch.hzdept_r ASC
"""


@router.post("/geotechnical-soil", summary="Soil properties from USDA-NRCS Soil Data Access")
def fetch_soil_mechanics(payload: Dict[str, Any] = Body(...)):
    """
    Query SSURGO for the soil at a coordinate. Public API, no key required.

    Returns measured values only. See the module docstring for what this used to
    return instead, and why CBR is deliberately absent.
    """
    try:
        lat = float(payload.get("lat"))
        lon = float(payload.get("lon"))
    except (TypeError, ValueError):
        return {
            "ok": False,
            "error": "lat and lon are required and must be numbers.",
            "soil_profile": None,
        }
    if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
        return {
            "ok": False,
            "error": f"Coordinates out of range: lat={lat}, lon={lon}.",
            "soil_profile": None,
        }

    query = _SOIL_QUERY.format(lon=lon, lat=lat)
    try:
        resp = requests.post(
            USDA_SOIL_API_URL,
            json={"format": "JSON", "query": query},
            timeout=_HTTP_TIMEOUT,
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Soil Data Access request failed: %s", exc)
        return {
            "ok": False,
            "error": f"Soil Data Access request failed: {exc.__class__.__name__}: {exc}",
            "soil_profile": None,
        }

    if resp.status_code != 200:
        return {
            "ok": False,
            "error": f"Soil Data Access returned HTTP {resp.status_code}.",
            "detail": (resp.text or "")[:400],
            "soil_profile": None,
        }

    rows = (resp.json() or {}).get("Table") or []
    if not rows:
        # A real and ordinary answer: SSURGO does not map open water, and some
        # areas are simply unmapped. Saying so beats inventing a profile.
        return {
            "ok": False,
            "error": "SSURGO has no soil map unit at this coordinate.",
            "coordinates": {"lat": lat, "lon": lon},
            "soil_profile": None,
        }

    def _num(value: Any) -> Optional[float]:
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    head = rows[0]
    horizons = [
        {
            "horizon": r[5],
            "depth_top_cm": _num(r[6]),
            "depth_bottom_cm": _num(r[7]),
            "plasticity_index": _num(r[8]),
            "liquid_limit": _num(r[9]),
        }
        for r in rows
        if r[5] is not None
    ]

    return {
        "ok": True,
        "coordinates": {"lat": lat, "lon": lon},
        "soil_profile": {
            "mukey": head[0],
            "mapunit_name": head[1],
            "dominant_component": head[2],
            "component_percent": _num(head[3]),
            # NULL is a real SSURGO value — "Urban land" carries no hydrologic
            # group. Reporting None is correct; substituting "B" is what the
            # previous version did.
            "hydrologic_soil_group": head[4],
            "horizons": horizons,
        },
        "not_provided": {
            "california_bearing_ratio_cbr": (
                "SSURGO does not publish CBR. Obtain it from a site "
                "investigation; it is not derivable from this dataset."
            )
        },
        "data_source": "USDA-NRCS SSURGO via Soil Data Access (live query)",
    }
