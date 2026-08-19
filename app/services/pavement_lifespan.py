"""
pavement_lifespan.py — PCI rating, deterioration projection, and tier economics.

Three things live here, and the line between measured, derived and modelled is
kept visible in the output of every one of them.

MEASURED — the PCI rating scale of ASTM D6433 is published and exact, so
`rating_for_pci` is a lookup, not a judgement.

DERIVED — `pci_from_deduct_values` implements the D6433 arithmetic: allowable
deduct count m, reduction of the deducts beyond m, and PCI = 100 - CDV. That
arithmetic is published and is reproduced here in full.

What is NOT reproduced is the distress deduct-value curves or the corrected
deduct-value (CDV) curves. Those are chart data in the standard itself, they
differ per distress type and severity, and inventing coefficients that resemble
them would produce a number that looks like a PCI and is not one. The caller
supplies deduct values read from the curves; if no corrected deduct value is
available the result says so and reports the uncorrected figure as
uncorrected. The engine this replaces generated its deducts with
`random.uniform(5.0, 35.0)` under the heading "strict ASTM D6433 logic" and
printed "Simulating Optical Distress Analysis... SUCCESS".

MODELLED — the 25-year projection is a power-law deterioration curve. It is a
model, not a measurement, so every response carries the model name and its
parameters, and `calibrated` stays false until the parameters have been fitted
to the owner's own condition history. Uncalibrated family curves are how
pavement management systems normally start; presenting one as a prediction
without saying so is the part that misleads.

Tier economics are ordinary arithmetic over unit costs the caller supplies.
No unit price is hardcoded: a dollar-per-square-foot figure baked into
software is out of date the season after it is written, and it varies by
metro, by haul distance and by plant.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Iterable, Optional

# ASTM D6433 condition rating scale. Published bands, reproduced exactly.
_RATING_BANDS: list[tuple[float, float, str]] = [
    (85.0, 100.0, "Good"),
    (70.0, 85.0, "Satisfactory"),
    (55.0, 70.0, "Fair"),
    (40.0, 55.0, "Poor"),
    (25.0, 40.0, "Very Poor"),
    (10.0, 25.0, "Serious"),
    (0.0, 10.0, "Failed"),
]


def rating_for_pci(pci: Optional[float]) -> Optional[str]:
    """D6433 condition rating for a PCI, or None when there is no PCI."""
    if pci is None:
        return None
    value = max(0.0, min(100.0, float(pci)))
    for lo, hi, label in _RATING_BANDS:
        if value >= lo:
            return label
    return "Failed"


def allowable_deduct_count(highest_deduct_value: float) -> float:
    """
    m = 1 + (9/98) * (100 - HDV), capped at 10.

    The number of deduct values D6433 allows to carry full weight. Deducts
    beyond m are reduced, which is what stops a pavement with many small
    distresses scoring worse than one with a single severe failure.
    """
    hdv = max(0.0, min(100.0, float(highest_deduct_value)))
    return min(10.0, 1.0 + (9.0 / 98.0) * (100.0 - hdv))


def reduce_deduct_values(deducts: Iterable[float]) -> list[float]:
    """
    Sort descending, keep the first m-1 whole, and truncate the m-th by its
    fractional part, per D6433. Values past m are dropped.
    """
    values = sorted((float(d) for d in deducts if d is not None and d > 0), reverse=True)
    if not values:
        return []

    m = allowable_deduct_count(values[0])
    whole = int(m)
    kept = values[:whole]
    fraction = m - whole
    if fraction > 0 and len(values) > whole:
        kept.append(values[whole] * fraction)
    return kept


@dataclass
class PciResult:
    pci: Optional[float]
    rating: Optional[str]
    corrected: bool
    total_deduct_value: Optional[float]
    reduced_deduct_values: list[float]
    allowable_deduct_count: Optional[float]
    note: str


def pci_from_deduct_values(
    deducts: Iterable[float],
    corrected_deduct_value: Optional[float] = None,
) -> PciResult:
    """
    PCI from deduct values read off the D6433 distress curves.

    `corrected_deduct_value` is the CDV from the correction curves. Supply it
    and the result is a D6433 PCI. Omit it and the result is PCI computed from
    the summed reduced deducts, flagged `corrected=False` — usable as an
    indicator, not quotable as a D6433 rating. The distinction is reported
    rather than smoothed over, because a PCI in a reserve study is a number
    someone else's engineer will check.
    """
    reduced = reduce_deduct_values(deducts)
    if not reduced:
        return PciResult(
            pci=100.0, rating=rating_for_pci(100.0), corrected=True,
            total_deduct_value=0.0, reduced_deduct_values=[],
            allowable_deduct_count=None,
            note="No distress recorded: PCI 100 by definition.",
        )

    total = sum(reduced)
    m = allowable_deduct_count(reduced[0])

    if corrected_deduct_value is not None:
        cdv = max(0.0, min(100.0, float(corrected_deduct_value)))
        pci = round(100.0 - cdv, 1)
        return PciResult(
            pci=pci, rating=rating_for_pci(pci), corrected=True,
            total_deduct_value=round(total, 1), reduced_deduct_values=[round(v, 1) for v in reduced],
            allowable_deduct_count=round(m, 2),
            note="PCI = 100 - CDV, using the corrected deduct value supplied.",
        )

    pci = round(max(0.0, 100.0 - total), 1)
    return PciResult(
        pci=pci, rating=rating_for_pci(pci), corrected=False,
        total_deduct_value=round(total, 1), reduced_deduct_values=[round(v, 1) for v in reduced],
        allowable_deduct_count=round(m, 2),
        note=(
            "Uncorrected: no CDV supplied, so this is 100 minus the summed reduced "
            "deducts. D6433 applies a correction curve that raises this figure. "
            "Indicative only — not quotable as a D6433 PCI."
        ),
    )


# ── Deterioration model ───────────────────────────────────────────────────────

DETERIORATION_MODEL = "power-law"
DEFAULT_BETA = 3.0            # convex decay: slow early loss, then acceleration
DEFAULT_TERMINAL_PCI = 25.0   # "Serious" — the lower bound of the model's validity
DEFAULT_SERVICE_LIFE_YEARS = 20.0


def project_pci(
    starting_pci: float,
    years: int = 25,
    beta: float = DEFAULT_BETA,
    terminal_pci: float = DEFAULT_TERMINAL_PCI,
    service_life_years: float = DEFAULT_SERVICE_LIFE_YEARS,
) -> list[dict[str, Any]]:
    """
    PCI year by year under a power-law decay:

        PCI(t) = PCI0 - (PCI0 - terminal) * (t / service_life) ** beta

    Convex, matching the shape agency deterioration families take: a pavement
    holds condition for years and then falls away quickly. Past the service
    life it is clamped at the terminal value rather than extrapolated to zero —
    the curve was never fitted out there, and a model that keeps predicting
    past its own range is the part that gets quoted.
    """
    pci0 = max(0.0, min(100.0, float(starting_pci)))
    span = max(0.1, float(service_life_years))
    drop = max(0.0, pci0 - float(terminal_pci))

    out: list[dict[str, Any]] = []
    for t in range(int(years) + 1):
        ratio = min(1.0, t / span)
        value = pci0 - drop * (ratio ** float(beta))
        value = max(float(terminal_pci), min(100.0, value))
        out.append({"year": t, "pci": round(value, 1), "rating": rating_for_pci(value)})
    return out


# ── Tier economics ────────────────────────────────────────────────────────────


def evaluate_tier(
    area_sqft: float,
    unit_cost_per_sqft: float,
    extension_years_low: float,
    extension_years_high: float,
    restored_pci: Optional[float] = None,
) -> dict[str, Any]:
    """
    Cost and annualised cost for one maintenance tier.

    Annualised cost is `unit_cost / extension_years` — the arithmetic is
    trivial and that is the point: it is arithmetic, over a unit cost the
    caller supplied, not a constant. A range in, a range out; reporting one
    number from a range of service lives hides the range.
    """
    area = max(0.0, float(area_sqft))
    unit = max(0.0, float(unit_cost_per_sqft))
    lo = max(0.1, float(extension_years_low))
    hi = max(lo, float(extension_years_high))

    total = round(unit * area, 2)
    return {
        "area_sqft": area,
        "unit_cost_per_sqft": unit,
        "total_cost_usd": total,
        "extension_years": {"low": lo, "high": hi},
        # Longer life spreads the same cost further, so the low year count is
        # the expensive case.
        "annualized_cost_per_sqft_per_year": {
            "high": round(unit / lo, 4),
            "low": round(unit / hi, 4),
        },
        "annualized_total_per_year": {
            "high": round(total / lo, 2),
            "low": round(total / hi, 2),
        },
        "restored_pci": restored_pci,
        "restored_rating": rating_for_pci(restored_pci),
    }
