"""
job_chain.py — Area in, priced job out, with every dollar traceable.

The pieces existed separately: geometry produced tonnage, the costing engine
produced a delivered price at a location, the lifespan engine costed
maintenance options from unit prices handed to it. Nothing joined them, so the
one path that did run end to end — `calculate_takeoff` — closed the gap with
hardcoded rates of $75.00 and $28.00 a ton.

This is the join, and its rule is that a stage which cannot be sourced returns
nothing rather than a plausible number:

    geometry        always computes — it is arithmetic on dimensions
    delivered cost  from the nearest usable plant, or absent with the reason
    labor           from the site's market, or absent
    total           only when every component priced

A partially priced job reports which parts priced and which did not. The
alternative — filling the gap with a default so the total always renders — is
how a bid goes out carrying a number nobody chose.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

# Compacted densities, lb per cubic foot. Standard values for these materials
# and the same ones the existing takeoff arithmetic uses.
HMA_DENSITY_PCF = 145.0
AGGREGATE_BASE_DENSITY_PCF = 135.0

# The Worden compaction floor. Tonnage is what goes down compacted, so the
# floor is part of the quantity, not a note attached to it.
COMPACTION_FLOOR_PCT = 96.0

# Liquid binder as a share of HMA weight, used only to size the oil-price
# exposure — not to price the mix.
BINDER_SHARE_OF_HMA = 0.055


def tonnage(area_sqft: float, thickness_inches: float, density_pcf: float,
            compaction_pct: Optional[float] = None) -> float:
    """
    Tons of compacted material for an area at a thickness.

        volume ft3 = area x (thickness / 12)
        weight lb  = volume x density x compaction
        tons       = weight / 2000
    """
    if area_sqft <= 0 or thickness_inches <= 0:
        return 0.0
    volume_cuft = float(area_sqft) * (float(thickness_inches) / 12.0)
    weight_lb = volume_cuft * float(density_pcf)
    if compaction_pct is not None:
        weight_lb *= float(compaction_pct) / 100.0
    return weight_lb / 2000.0


def build_quantities(
    area_sqft: float,
    surface_thickness_in: float,
    base_thickness_in: float,
    compaction_pct: Optional[float] = None,
) -> dict[str, Any]:
    """
    The bill of quantities. Pure geometry, so this always resolves.

    Compaction is floored at the Worden minimum: a spec written to 96% and a
    quantity computed at less than 96% would order short.
    """
    compaction = max(float(compaction_pct or COMPACTION_FLOOR_PCT), COMPACTION_FLOOR_PCT)
    surface = tonnage(area_sqft, surface_thickness_in, HMA_DENSITY_PCF, compaction)
    base = tonnage(area_sqft, base_thickness_in, AGGREGATE_BASE_DENSITY_PCF)

    return {
        "area_sqft": round(float(area_sqft), 2),
        "compaction_pct": compaction,
        "lines": [
            {
                "key": "surface",
                "description": f"HMA surface course, {surface_thickness_in} in compacted",
                "thickness_inches": float(surface_thickness_in),
                "density_pcf": HMA_DENSITY_PCF,
                "tons": round(surface, 2),
            },
            {
                "key": "base",
                "description": f"Aggregate base, {base_thickness_in} in",
                "thickness_inches": float(base_thickness_in),
                "density_pcf": AGGREGATE_BASE_DENSITY_PCF,
                "tons": round(base, 2),
            },
        ],
        "binder_tons": round(surface * BINDER_SHARE_OF_HMA, 3),
    }


def price_lines(
    quantities: dict[str, Any],
    priced: dict[str, Optional[dict[str, Any]]],
) -> dict[str, Any]:
    """
    Attach delivered cost to each quantity line.

    `priced` maps a line key to that material's costing result, or None when
    the costing engine could not price it. An unpriced line keeps its tonnage
    and carries `cost_usd: None` — the quantity is still correct and still
    useful, and pretending otherwise is the failure this avoids.
    """
    lines: list[dict[str, Any]] = []
    priced_total = 0.0
    unpriced: list[str] = []

    for line in quantities["lines"]:
        result = priced.get(line["key"])
        row = dict(line)

        if result and result.get("delivered_cost_per_ton") is not None:
            rate = float(result["delivered_cost_per_ton"])
            cost = round(line["tons"] * rate, 2)
            best = result.get("best_source") or {}
            row.update({
                "delivered_cost_per_ton": rate,
                "cost_usd": cost,
                "source_name": best.get("source_name"),
                "source_city": best.get("source_city"),
                "fob_price_per_ton": best.get("fob_price_per_ton"),
                "haul_cost_per_ton": best.get("haul_cost_per_ton"),
                "haul_miles": (best.get("distance") or {}).get("miles"),
                "haul_basis": (best.get("distance") or {}).get("basis"),
                "price_effective_date": best.get("price_effective_date"),
                "price_source_note": best.get("price_source_note"),
                "priced": True,
            })
            priced_total += cost
        else:
            reason = "no material source configured"
            if result:
                blocked = [r for s in result.get("all_sources", []) for r in s.get("reasons", [])]
                reason = "; ".join(sorted(set(blocked))) or "no usable source"
            row.update({
                "delivered_cost_per_ton": None,
                "cost_usd": None,
                "priced": False,
                "reason": reason,
            })
            unpriced.append(line["key"])

        lines.append(row)

    return {
        "lines": lines,
        "priced_lines": len(lines) - len(unpriced),
        "unpriced_lines": unpriced,
        # A total is offered only when nothing is missing from it. A running
        # subtotal over a partial set reads as the job's cost and is not.
        "materials_total_usd": round(priced_total, 2) if not unpriced else None,
        "materials_subtotal_priced_usd": round(priced_total, 2),
    }


def oil_price_exposure(binder_tons: float, buffer_per_ton: float = 9.0) -> dict[str, Any]:
    """
    The Worden oil shield: what a swing in liquid asphalt is worth on this job.

    An exposure, not a cost. It sizes a risk so it can be priced deliberately;
    adding it silently to a total would bill a hedge as a material.
    """
    return {
        "binder_tons": round(float(binder_tons), 3),
        "buffer_per_ton_usd": float(buffer_per_ton),
        "exposure_usd": round(float(binder_tons) * float(buffer_per_ton), 2),
        "note": "Swing in job cost per ±$9/ton move in liquid asphalt. Not included "
                "in the materials total — carry it as a contingency or a price "
                "escalation clause, deliberately.",
    }


def labor_estimate(
    market: Optional[dict[str, Any]],
    crew_hours: Optional[float],
) -> dict[str, Any]:
    """
    Crew cost, when the site sits in a configured market and hours are given.

    Two ways to be absent and they mean different things: no market means the
    crew is travelling and per diem applies; no hours means nobody has said
    how long the job takes.
    """
    if market is None:
        return {
            "available": False,
            "reason": "site is outside every configured labor market — the crew is "
                      "travelling, so per diem and travel time belong in the price",
            "cost_usd": None,
        }
    if crew_hours is None:
        return {
            "available": False,
            "reason": "no crew hours supplied",
            "market": market.get("name"),
            "crew_cost_per_hour": market.get("crew_cost_per_hour"),
            "cost_usd": None,
        }
    rate = market.get("crew_cost_per_hour")
    if rate is None:
        return {
            "available": False,
            "reason": f"market {market.get('name')!r} has no crew_cost_per_hour on file",
            "cost_usd": None,
        }
    return {
        "available": True,
        "market": market.get("name"),
        "crew_cost_per_hour": rate,
        "crew_hours": float(crew_hours),
        "cost_usd": round(float(rate) * float(crew_hours), 2),
        "prevailing_wage_required": market.get("prevailing_wage_required", False),
    }
