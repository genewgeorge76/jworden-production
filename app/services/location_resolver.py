"""
location_resolver.py — Turn whatever a caller has into a point.

Coordinates, a saved project site, or an address typed the way a person would
type it. The engines below all price by distance, so every one of them needs a
point; asking for latitude and longitude is asking for something almost nobody
has to hand, which is what kept this usable only where somebody had already
looked coordinates up.

An address that will not resolve is an error, never a centroid. "Springfield"
is a real place in more than thirty states, so the resolved address is always
echoed back and the runner-up matches with it.
"""

from __future__ import annotations

from typing import Any, Optional

from fastapi import HTTPException

from ..models import ProjectSite
from . import runtime_config
from . import supplier_discovery as sd


def resolve_location(
    db,
    *,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    address: Optional[str] = None,
    project_site_id: Optional[int] = None,
) -> dict[str, Any]:
    """
    Resolve to {lat, lng, label, source, ...}. Raises HTTPException on failure.

    Precedence is explicit-first: coordinates, then a saved site, then an
    address. Anything already exact is preferred over anything that has to be
    looked up.
    """
    if lat is not None and lng is not None:
        return {"lat": lat, "lng": lng, "label": None, "source": "coordinates"}

    if project_site_id is not None:
        site = db.query(ProjectSite).filter(ProjectSite.id == project_site_id).one_or_none()
        if site is None:
            raise HTTPException(status_code=404, detail=f"No project site {project_site_id}")
        if site.lat is None or site.lng is None:
            raise HTTPException(
                status_code=422,
                detail=f"Project site {project_site_id} has no coordinates. Give an address "
                       f"instead and it will be geocoded.",
            )
        return {
            "lat": site.lat, "lng": site.lng, "source": "project_site",
            "label": f"{site.city}, {site.state}" if site.city else site.address,
            "state": site.state,
        }

    if address:
        key = runtime_config.get("GOOGLE_MAPS_API_KEY", "").strip() or None
        result = sd.geocode(api_key=key, address=address)
        if not result["ok"]:
            status = 503 if not result.get("configured") else 422
            raise HTTPException(
                status_code=status,
                detail=(f"Could not resolve {address!r}: {result['error']}."
                        + ("" if result.get("configured") else
                           " Geocoding needs GOOGLE_MAPS_API_KEY.")),
            )
        return {
            "lat": result["lat"], "lng": result["lng"], "source": "geocoded",
            "label": result["formatted_address"],
            "city": result.get("city"), "state": result.get("state"),
            "postal_code": result.get("postal_code"),
            "geocode_precision": result.get("location_type"),
            # Echoed so a wrong Springfield is visible rather than silent.
            "other_matches": result.get("alternatives") or [],
        }

    raise HTTPException(
        status_code=422,
        detail="No location given. Supply an address, a project_site_id, or lat and lng.",
    )
