"""
delivered_cost.py — What a ton actually costs at the job site.

The old model was a single state multiplier, so every Virginia job priced the
same. What separates Charlottesville from Richmond from Roanoke is not the
state, it is how far the mat is from a plant that can supply it: FOB price
barely moves across a state, and haul cost moves a great deal.

    delivered $/ton  =  FOB $/ton  +  haul $/ton

    haul $/ton       =  truck $/hr x cycle hours / tons per load
    cycle time       =  2 x one-way drive  +  load  +  dump

Every figure a caller gets back carries how it was derived. Distance in
particular: a real road distance is used when supplied, and otherwise the
great-circle distance is scaled by an explicit circuity factor and labelled
`estimated`. Straight-line distance quietly under-reads the road by roughly a
fifth, which lands on the wrong side of a bid.

Nothing here has a hidden default price. A source with no price on or before
the job date is reported as having no price, not carried forward from whenever
it was last quoted.
"""

from __future__ import annotations

import math
from datetime import datetime
from typing import Any, Optional

EARTH_RADIUS_MI = 3958.7613


def haversine_miles(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance. Exact for what it is: a straight line, not a road."""
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = p2 - p1
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * EARTH_RADIUS_MI * math.asin(math.sqrt(a))


def road_distance(
    lat1: float, lng1: float, lat2: float, lng2: float,
    circuity_factor: float = 1.25,
    known_road_miles: Optional[float] = None,
) -> dict[str, Any]:
    """
    Road miles, saying which kind of number it is.

    A measured road distance always wins. Otherwise the great-circle distance
    is inflated by the circuity factor, and `basis` says `estimated` so the
    figure is never mistaken for one somebody drove.
    """
    if known_road_miles is not None:
        return {
            "miles": round(float(known_road_miles), 2),
            "basis": "measured",
            "straight_line_miles": round(haversine_miles(lat1, lng1, lat2, lng2), 2),
            "circuity_factor": None,
        }

    straight = haversine_miles(lat1, lng1, lat2, lng2)
    return {
        "miles": round(straight * float(circuity_factor), 2),
        "basis": "estimated",
        "straight_line_miles": round(straight, 2),
        "circuity_factor": float(circuity_factor),
    }


def haul_cost_per_ton(
    one_way_miles: float,
    tons_per_load: float,
    truck_cost_per_hour: float,
    average_speed_mph: float = 45.0,
    load_minutes: float = 15.0,
    dump_minutes: float = 15.0,
) -> dict[str, Any]:
    """
    Trucking cost per ton, with the cycle broken out.

    A truck is paid for the whole cycle, not just the loaded leg, so the return
    trip and both ends of standing time are in here. Costing only the loaded
    miles is the classic way a haul comes in under.
    """
    if tons_per_load <= 0:
        raise ValueError("tons_per_load must be greater than zero")
    speed = max(1.0, float(average_speed_mph))

    one_way_minutes = (float(one_way_miles) / speed) * 60.0
    cycle_minutes = (2 * one_way_minutes) + float(load_minutes) + float(dump_minutes)
    cost = (float(truck_cost_per_hour) * (cycle_minutes / 60.0)) / float(tons_per_load)

    return {
        "cost_per_ton": round(cost, 4),
        "one_way_minutes": round(one_way_minutes, 1),
        "cycle_minutes": round(cycle_minutes, 1),
        "loads_per_8h_shift": round((8 * 60) / cycle_minutes, 2) if cycle_minutes else None,
        "tons_per_8h_shift": round(((8 * 60) / cycle_minutes) * tons_per_load, 1)
        if cycle_minutes else None,
    }


def source_is_open(source_open: Optional[int], source_close: Optional[int],
                   month: Optional[int]) -> bool:
    """
    Whether a seasonal source can supply in a given month.

    Handles a season that wraps the new year (e.g. open 11, close 3). Unknown
    season or unknown month means no opinion — returns True rather than
    silently excluding a plant on missing data.
    """
    if source_open is None or source_close is None or month is None:
        return True
    if source_open <= source_close:
        return source_open <= month <= source_close
    return month >= source_open or month <= source_close


def evaluate_source(
    *,
    source: dict[str, Any],
    fob_price: Optional[float],
    site_lat: float,
    site_lng: float,
    haul: dict[str, Any],
    known_road_miles: Optional[float] = None,
    job_month: Optional[int] = None,
) -> dict[str, Any]:
    """
    Price one material out of one source, delivered to one site.

    Returns a row even when it cannot be priced or cannot be used, with
    `usable` false and a reason — a plant excluded silently is a plant nobody
    checks, and the reason is usually the interesting part (closed for the
    season, or a haul too long for the mix to survive).
    """
    reasons: list[str] = []

    if source.get("lat") is None or source.get("lng") is None:
        return {
            "source_id": source.get("id"),
            "source_name": source.get("name"),
            "usable": False,
            "reasons": ["source has no coordinates"],
            "delivered_cost_per_ton": None,
        }

    dist = road_distance(
        site_lat, site_lng, source["lat"], source["lng"],
        circuity_factor=haul.get("circuity_factor", 1.25),
        known_road_miles=known_road_miles,
    )
    trip = haul_cost_per_ton(
        one_way_miles=dist["miles"],
        tons_per_load=haul["tons_per_load"],
        truck_cost_per_hour=haul["truck_cost_per_hour"],
        average_speed_mph=haul.get("average_speed_mph", 45.0),
        load_minutes=haul.get("load_minutes", 15.0),
        dump_minutes=haul.get("dump_minutes", 15.0),
    )

    if not source_is_open(source.get("season_open_month"), source.get("season_close_month"), job_month):
        reasons.append(
            f"closed in month {job_month} (season {source.get('season_open_month')}"
            f"-{source.get('season_close_month')})"
        )

    max_haul = source.get("max_haul_minutes")
    if max_haul is not None and trip["one_way_minutes"] > max_haul:
        reasons.append(
            f"haul {trip['one_way_minutes']:.0f} min exceeds this source's "
            f"{max_haul} min limit — mix would arrive too cold to lay"
        )

    if fob_price is None:
        reasons.append("no price on file for this material on or before the job date")

    delivered = None if fob_price is None else round(float(fob_price) + trip["cost_per_ton"], 4)

    return {
        "source_id": source.get("id"),
        "source_name": source.get("name"),
        "source_city": source.get("city"),
        "source_state": source.get("state"),
        "usable": not reasons,
        "reasons": reasons,
        "fob_price_per_ton": fob_price,
        "haul_cost_per_ton": trip["cost_per_ton"],
        "delivered_cost_per_ton": delivered,
        "distance": dist,
        "cycle": trip,
    }


def rank_sources(evaluated: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Cheapest delivered first, usable sources only.

    Unusable and unpriced sources are kept in the response but never ranked —
    a plant that cannot supply the job is not an option, however cheap its
    FOB price looks.
    """
    priced = [e for e in evaluated if e["usable"] and e["delivered_cost_per_ton"] is not None]
    return sorted(priced, key=lambda e: e["delivered_cost_per_ton"])


def market_for_site(markets: list[dict[str, Any]], lat: float, lng: float) -> Optional[dict[str, Any]]:
    """
    The labor market a site falls in — nearest whose radius contains it.

    Returns None when the site is outside every market, which is a real answer:
    the crew is travelling, and per diem applies.
    """
    hits = []
    for m in markets:
        if m.get("lat") is None or m.get("lng") is None:
            continue
        d = haversine_miles(lat, lng, m["lat"], m["lng"])
        if d <= float(m.get("radius_miles", 35.0)):
            hits.append((d, m))
    if not hits:
        return None
    hits.sort(key=lambda x: x[0])
    distance, market = hits[0]
    return {**market, "distance_from_market_center_mi": round(distance, 1)}
