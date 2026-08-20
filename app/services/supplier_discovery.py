"""
supplier_discovery.py — Find the yards you can actually buy from.

Searches a radius for asphalt plants, ready-mix, quarries and sand and gravel,
recycling yards, and brick and paver suppliers, and writes what it finds to
`material_source_candidates` for review.

It proposes, it does not enrol. A text search for "asphalt plant" reliably
also returns paving contractors, a sales office two states away, and a yard
that closed in 2019. Any of those promoted automatically would sit in the
pricing path as a place trucks could load, and the delivered cost of a job
would be computed against it. Confirmation is a person's job, so discovery
ends at a candidate.

One provider is implemented: Google Places (New). It is the only source
reachable from this deployment that returns geocoded, current business
listings — OpenStreetMap's Overpass API was tried first and is unreachable
here. Places is billed per request, so searches are capped and deduplicated
rather than run broadly.

With no API key the search returns `configured: False` and the reason. It
never falls back to a built-in list of suppliers: a plant nobody verified,
presented as one you can buy from, is exactly the failure this module is
shaped to avoid.
"""

from __future__ import annotations

import logging
from typing import Any, Iterable, Optional

from .delivered_cost import haversine_miles

logger = logging.getLogger(__name__)

PLACES_ENDPOINT = "https://places.googleapis.com/v1/places:searchText"
PLACES_FIELD_MASK = (
    "places.id,places.displayName,places.formattedAddress,places.location,"
    "places.primaryType,places.nationalPhoneNumber,places.websiteUri,"
    "places.businessStatus,places.addressComponents"
)

# Google caps a locationBias circle at 50 km.
MAX_BIAS_RADIUS_M = 50_000

# What to search for, per material family, across the whole trade rather than
# just paving. One category carries several phrasings because a single phrase
# misses yards that describe themselves differently — "sand and gravel" and
# "aggregate supplier" rarely return the same list.
#
# This is a starting catalogue, not a closed set. `custom_queries` lets any
# material be searched, because no fixed list of construction materials stays
# complete and a job that needs one thing not on it should not be stuck.
CATEGORY_QUERIES: dict[str, list[str]] = {
    # ── Earth, aggregate, paving ──────────────────────────────────────────
    "asphalt_plant":     ["asphalt plant", "hot mix asphalt supplier", "asphalt paving materials"],
    "quarry":            ["quarry", "crushed stone quarry", "aggregate supplier"],
    "sand_and_gravel":   ["sand and gravel supplier", "sand pit", "gravel pit"],
    "topsoil_fill":      ["topsoil supplier", "fill dirt supplier", "screened topsoil"],
    "recycling":         ["concrete recycling", "asphalt recycling", "construction debris recycling"],

    # ── Concrete and masonry ──────────────────────────────────────────────
    "ready_mix":         ["ready mix concrete plant", "concrete supplier", "concrete batch plant"],
    "precast_concrete":  ["precast concrete supplier", "precast concrete products", "concrete pipe supplier"],
    "cement_lime":       ["cement supplier", "lime supplier", "cement terminal"],
    "masonry":           ["masonry supply", "block supplier", "concrete block supplier"],
    "brick_paver":       ["brick supplier", "paver supplier", "hardscape supply yard"],
    "natural_stone":     ["stone yard", "natural stone supplier", "flagstone supplier"],
    "rebar_reinforcing": ["rebar supplier", "reinforcing steel supplier", "wire mesh supplier"],

    # ── Structure ─────────────────────────────────────────────────────────
    "lumber":            ["lumber yard", "building materials supplier", "timber supplier"],
    "engineered_wood":   ["engineered wood supplier", "truss manufacturer", "plywood supplier"],
    "structural_steel":  ["structural steel supplier", "steel service center", "steel fabricator"],
    "metal_building":    ["metal building supplier", "metal roofing supplier", "steel siding supplier"],

    # ── Envelope and finishes ─────────────────────────────────────────────
    "roofing_supply":    ["roofing supply", "roofing materials supplier", "commercial roofing distributor"],
    "drywall_insulation":["drywall supply", "insulation supplier", "gypsum supplier"],
    "doors_windows":     ["door and window supplier", "millwork supplier", "commercial door supplier"],
    "glass_glazing":     ["glass supplier", "commercial glazing supplier", "glass fabricator"],
    "paint_coatings":    ["paint supplier", "industrial coatings supplier", "sealer supplier"],
    "flooring":          ["flooring supplier", "commercial flooring distributor", "tile supplier"],

    # ── Civil, site and utilities ─────────────────────────────────────────
    "pipe_drainage":     ["drainage pipe supplier", "culvert supplier", "storm pipe supplier"],
    "waterworks":        ["waterworks supplier", "water main supplier", "utility pipe supplier"],
    "geotextile_erosion":["geotextile supplier", "erosion control supplier", "silt fence supplier"],
    "fencing_guardrail": ["fence supplier", "guardrail supplier", "chain link supplier"],
    "traffic_safety":    ["traffic control supplier", "road sign supplier", "pavement marking supplier"],
    "landscape_supply":  ["landscape supply", "mulch supplier", "sod farm"],

    # ── MEP ───────────────────────────────────────────────────────────────
    "electrical_supply": ["electrical supply house", "electrical distributor", "wire and cable supplier"],
    "plumbing_supply":   ["plumbing supply house", "pipe valve fitting supplier", "plumbing distributor"],
    "hvac_supply":       ["hvac supply house", "hvac distributor", "sheet metal supplier"],

    # ── General ───────────────────────────────────────────────────────────
    "fasteners_tools":   ["fastener supplier", "construction tool supplier", "industrial supply"],
    "equipment_rental":  ["construction equipment rental", "heavy equipment rental", "aerial lift rental"],
}

# Grouped so a caller can sweep a trade without naming every category.
CATEGORY_GROUPS: dict[str, list[str]] = {
    "paving":    ["asphalt_plant", "quarry", "sand_and_gravel", "recycling", "topsoil_fill"],
    "concrete":  ["ready_mix", "precast_concrete", "cement_lime", "rebar_reinforcing"],
    "masonry":   ["masonry", "brick_paver", "natural_stone"],
    "structure": ["lumber", "engineered_wood", "structural_steel", "metal_building"],
    "envelope":  ["roofing_supply", "drywall_insulation", "doors_windows", "glass_glazing",
                  "paint_coatings", "flooring"],
    "sitework":  ["pipe_drainage", "waterworks", "geotextile_erosion", "fencing_guardrail",
                  "traffic_safety", "landscape_supply"],
    "mep":       ["electrical_supply", "plumbing_supply", "hvac_supply"],
    "general":   ["fasteners_tools", "equipment_rental"],
}

# Business types the provider returns that often, but not always, mean this is
# not a place a truck loads from. Flagged, never dropped.
#
# Paving contractors in particular frequently run their own plants and sell
# from them — Slurry Pavers is classified `general_contractor` by Google and
# operates a tack plant behind the Richmond jail that Worden crews load at.
# Google's classification describes how a business presents itself, not what
# it sells over the scale. Only the yard's own operator knows that, which is
# why this is a prompt to check rather than grounds to exclude.
UNLIKELY_SUPPLIER_TYPES = {
    "general_contractor", "roofing_contractor", "plumber", "electrician",
    "real_estate_agency", "insurance_agency", "lawyer", "accounting",
    "corporate_office", "consultant",
}


def category_list() -> list[str]:
    return sorted(CATEGORY_QUERIES)


def group_list() -> dict[str, list[str]]:
    return {g: sorted(c) for g, c in CATEGORY_GROUPS.items()}


def resolve_categories(
    categories: Optional[list[str]] = None,
    groups: Optional[list[str]] = None,
) -> tuple[list[str], list[str]]:
    """
    Expand group names into categories and drop anything unrecognised.

    Returns (resolved, unknown). Unknown names are handed back rather than
    ignored — a typo that silently searches nothing looks identical to a
    market with no suppliers in it.
    """
    wanted: list[str] = []
    unknown: list[str] = []

    for g in groups or []:
        if g in CATEGORY_GROUPS:
            wanted.extend(CATEGORY_GROUPS[g])
        else:
            unknown.append(g)

    for c in categories or []:
        if c in CATEGORY_QUERIES:
            wanted.append(c)
        else:
            unknown.append(c)

    seen: set[str] = set()
    resolved = [c for c in wanted if not (c in seen or seen.add(c))]
    return resolved, unknown


def planned_query_count(
    categories: list[str],
    custom_queries: Optional[list[str]] = None,
) -> int:
    """
    How many billed provider requests a search will cost.

    Places charges per request, so this is reported before and alongside every
    run. A full sweep of every category is over ninety requests, which is a
    decision rather than a default.
    """
    return sum(len(CATEGORY_QUERIES[c]) for c in categories) + len(custom_queries or [])


def _city_state_from_components(components: Iterable[dict[str, Any]]) -> tuple[Optional[str], Optional[str]]:
    city = state = None
    for c in components or []:
        types = c.get("types") or []
        if "locality" in types and not city:
            city = c.get("longText") or c.get("shortText")
        if "administrative_area_level_1" in types and not state:
            state = (c.get("shortText") or "")[:2].upper() or None
    return city, state


def _parse_place(place: dict[str, Any], category: str,
                 center_lat: float, center_lng: float) -> Optional[dict[str, Any]]:
    """One Places result, flattened. None when it has no usable identity."""
    place_id = place.get("id")
    name = (place.get("displayName") or {}).get("text")
    if not place_id or not name:
        return None

    loc = place.get("location") or {}
    lat, lng = loc.get("latitude"), loc.get("longitude")
    city, state = _city_state_from_components(place.get("addressComponents") or [])

    distance = (
        round(haversine_miles(center_lat, center_lng, lat, lng), 2)
        if lat is not None and lng is not None else None
    )
    primary = place.get("primaryType")

    return {
        "provider": "google_places",
        "provider_place_id": place_id,
        "name": name,
        "address": place.get("formattedAddress"),
        "city": city,
        "state": state,
        "lat": lat,
        "lng": lng,
        "phone": place.get("nationalPhoneNumber"),
        "website": place.get("websiteUri"),
        "searched_category": category,
        "provider_primary_type": primary,
        "business_status": place.get("businessStatus"),
        "distance_from_search_center_mi": distance,
        # Surfaced so a reviewer can sort by it. Never used to auto-drop.
        "review_flags": _flags(primary, place.get("businessStatus")),
        "raw_json": place,
    }


def _flags(primary_type: Optional[str], business_status: Optional[str]) -> list[str]:
    flags: list[str] = []
    if primary_type in UNLIKELY_SUPPLIER_TYPES:
        flags.append(
            f"provider classifies this as {primary_type} — worth a call before pricing "
            f"against it. Contractors often run their own plant and sell from it, so "
            f"this is a check, not a disqualification."
        )
    if business_status and business_status != "OPERATIONAL":
        flags.append(f"business status is {business_status}")
    return flags


def search_places(
    *,
    api_key: str,
    query: str,
    lat: float,
    lng: float,
    radius_miles: float,
    max_results: int = 20,
    http_post=None,
) -> dict[str, Any]:
    """
    One Places text search, biased to a circle.

    `http_post` is injectable so tests exercise the parsing without spending a
    billed request.
    """
    radius_m = min(int(radius_miles * 1609.34), MAX_BIAS_RADIUS_M)
    body = {
        "textQuery": query,
        "maxResultCount": max(1, min(int(max_results), 20)),
        "locationBias": {
            "circle": {"center": {"latitude": lat, "longitude": lng}, "radius": radius_m}
        },
    }
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": PLACES_FIELD_MASK,
    }

    if http_post is None:
        import httpx  # noqa: PLC0415

        def http_post(url, json, headers, timeout):  # type: ignore[misc]
            return httpx.post(url, json=json, headers=headers, timeout=timeout)

    try:
        resp = http_post(PLACES_ENDPOINT, json=body, headers=headers, timeout=25.0)
        status = getattr(resp, "status_code", 200)
        payload = resp.json()
    except Exception as exc:  # noqa: BLE001
        logger.warning("Places search failed for %r: %s", query, exc)
        return {"ok": False, "error": str(exc)[:200], "places": []}

    if status >= 400:
        message = (payload.get("error") or {}).get("message") if isinstance(payload, dict) else None
        return {"ok": False, "error": message or f"HTTP {status}", "places": []}

    return {"ok": True, "places": payload.get("places") or []}


def discover(
    *,
    api_key: Optional[str],
    lat: float,
    lng: float,
    radius_miles: float = 60.0,
    categories: Optional[list[str]] = None,
    custom_queries: Optional[list[str]] = None,
    max_per_query: int = 20,
    http_post=None,
) -> dict[str, Any]:
    """
    Run every query for the chosen categories and return deduplicated candidates.

    Results are filtered to the requested radius by real distance rather than
    trusting the bias, which only weights the search. Anything the provider
    returned beyond the radius is dropped and counted, so a search that mostly
    found far-away yards says so instead of looking thin.
    """
    if not api_key:
        return {
            "configured": False,
            "reason": "GOOGLE_MAPS_API_KEY is not set. Supplier discovery needs it — "
                      "there is no built-in supplier list, because an unverified plant "
                      "presented as one you can buy from is worse than none.",
            "candidates": [],
            "queries_run": 0,
        }

    wanted = [c for c in (categories or []) if c in CATEGORY_QUERIES]
    customs = [q.strip() for q in (custom_queries or []) if q and q.strip()]
    if not wanted and not customs:
        return {"configured": True,
                "reason": "nothing to search — supply categories, groups, or custom_queries",
                "candidates": [], "queries_run": 0}

    # (category, query) pairs. A custom query is filed under `custom` so a
    # reviewer can see it was asked for by hand rather than matched a known
    # material family.
    plan: list[tuple[str, str]] = [
        (category, query) for category in wanted for query in CATEGORY_QUERIES[category]
    ] + [("custom", q) for q in customs]

    by_place: dict[str, dict[str, Any]] = {}
    errors: list[dict[str, str]] = []
    queries_run = 0
    out_of_radius = 0

    for category, query in plan:
        queries_run += 1
        result = search_places(
            api_key=api_key, query=query, lat=lat, lng=lng,
            radius_miles=radius_miles, max_results=max_per_query, http_post=http_post,
        )
        if not result["ok"]:
            errors.append({"category": category, "query": query, "error": result["error"]})
            continue

        for place in result["places"]:
            parsed = _parse_place(place, category, lat, lng)
            if parsed is None:
                continue
            d = parsed["distance_from_search_center_mi"]
            if d is not None and d > radius_miles:
                out_of_radius += 1
                continue

            key = parsed["provider_place_id"]
            if key in by_place:
                # One yard answers several searches. Keep every category it
                # matched — a quarry that also sells sand is both.
                existing = by_place[key]
                cats = set(existing["searched_category"].split(","))
                cats.add(category)
                existing["searched_category"] = ",".join(sorted(cats))
            else:
                by_place[key] = parsed

    candidates = sorted(
        by_place.values(),
        key=lambda c: (c["distance_from_search_center_mi"] is None,
                       c["distance_from_search_center_mi"] or 0),
    )
    return {
        "configured": True,
        "reason": None,
        "search_center": {"lat": lat, "lng": lng, "radius_miles": radius_miles},
        "categories": wanted,
        "custom_queries": customs,
        "queries_run": queries_run,
        "candidates": candidates,
        "dropped_outside_radius": out_of_radius,
        "errors": errors,
    }


# ── Geocoding ─────────────────────────────────────────────────────────────────
#
# Discovery has always been location-agnostic — it takes a point and searches
# around it, so Boise works exactly as Richmond does. What was missing is that
# nobody has coordinates to hand. A crew in Kansas types "Wichita, KS", and
# until that resolves to a point the engine is unreachable to them.

GEOCODE_ENDPOINT = "https://maps.googleapis.com/maps/api/geocode/json"


def geocode(
    *,
    api_key: Optional[str],
    address: str,
    http_get=None,
) -> dict[str, Any]:
    """
    Turn an address, city or place name into a point.

    Returns the resolved coordinates with the formatted address the provider
    matched, so a caller can see what it actually looked up — "Springfield" is
    a real place in more than thirty states, and echoing the match back is how
    somebody notices it picked the wrong one.

    Never guesses. An unresolvable address returns ok=False with the provider's
    own status rather than a plausible centroid.
    """
    if not api_key:
        return {"ok": False, "error": "GOOGLE_MAPS_API_KEY is not set", "configured": False}
    if not (address or "").strip():
        return {"ok": False, "error": "no address supplied", "configured": True}

    if http_get is None:
        import httpx  # noqa: PLC0415

        def http_get(url, params, timeout):  # type: ignore[misc]
            return httpx.get(url, params=params, timeout=timeout)

    try:
        resp = http_get(GEOCODE_ENDPOINT,
                        params={"address": address.strip(), "key": api_key},
                        timeout=20.0)
        payload = resp.json()
    except Exception as exc:  # noqa: BLE001
        logger.warning("Geocode failed for %r: %s", address, exc)
        return {"ok": False, "error": str(exc)[:200], "configured": True}

    status = payload.get("status")
    if status != "OK" or not payload.get("results"):
        return {
            "ok": False,
            "configured": True,
            "error": payload.get("error_message") or f"geocoder returned {status}",
            "provider_status": status,
        }

    top = payload["results"][0]
    loc = (top.get("geometry") or {}).get("location") or {}
    components = top.get("address_components") or []

    def _component(kind: str, short: bool = True) -> Optional[str]:
        for c in components:
            if kind in (c.get("types") or []):
                return c.get("short_name" if short else "long_name")
        return None

    return {
        "ok": True,
        "configured": True,
        "lat": loc.get("lat"),
        "lng": loc.get("lng"),
        "formatted_address": top.get("formatted_address"),
        "city": _component("locality", short=False) or _component("sublocality", short=False),
        "state": _component("administrative_area_level_1"),
        "postal_code": _component("postal_code"),
        "country": _component("country"),
        "location_type": (top.get("geometry") or {}).get("location_type"),
        "alternatives": [r.get("formatted_address") for r in payload["results"][1:4]],
    }
