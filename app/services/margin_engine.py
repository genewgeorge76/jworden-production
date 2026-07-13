"""
margin_engine.py — Internal contractor margin calculation ("Worden Standard").

`pricing.py::estimate_price()` returns a *public-facing* ballpark market-cost
range and is called from unauthenticated endpoints (see the security audit
header in `app/main.py`). It intentionally carries no margin/profit math.

This module is the separate, internal-only layer that turns that market-cost
range into an actual contractor bid, and is only ever wired into
premium-security-gated routes (`quotes.py`, the Jarvis `generate_estimate`
tool, etc.) — never into a public response.

Two margin modes:
  worden  — flat 35% gross-margin floor. Deterministic, always the same
            regardless of job size. This is the historical "never bid below
            35%" rule.
  dynamic — job-size-tiered margin (higher on small/high-mobilization jobs,
            leaner on large-volume jobs), matching how contractors actually
            price competitively at volume while protecting margin on small
            dispatches. Floored at 22% so no dynamic quote ever prices at a
            loss relative to the deterministic floor's intent.

This complements (does not replace) the experimental AI-driven
Supply Chain Arbitrage Engine (`app/routers/supply_chain.py`), which
estimates a *material cost* multiplier from simulated market indices — that
engine adjusts input costs; this engine sets the margin applied on top of
those costs.
"""

from __future__ import annotations

WORDEN_MARGIN_FLOOR = 0.35

_DYNAMIC_SMALL_JOB_MARGIN = 0.42
_DYNAMIC_MID_JOB_MARGIN = 0.35
_DYNAMIC_LARGE_JOB_MARGIN = 0.28
_DYNAMIC_MARGIN_FLOOR = 0.22
_DYNAMIC_MARGIN_CEILING = 0.45

_SMALL_JOB_SQFT_THRESHOLD = 5_000
_LARGE_JOB_SQFT_THRESHOLD = 20_000

# Categories with higher execution/schedule risk get a small margin bump
# under dynamic mode (matches the risk categories already implied by
# pricing.py's rate table — general contracting, masonry, and concrete
# carry more schedule and callback risk than straight asphalt work).
_HIGH_RISK_SERVICE_TYPES = frozenset({
    "general_contracting", "stone_masonry", "concrete",
    "adu", "commercial_build", "new_construction_residential", "addition",
})

_HIGH_RISK_MARGIN_BUMP = 0.03

VALID_MARGIN_MODES = ("worden", "dynamic")


def calculate_worden_margin() -> float:
    """The flat 35% floor. Always returns the same value — deterministic by design."""
    return WORDEN_MARGIN_FLOOR


def calculate_dynamic_margin(project_size_sqft: float, service_type: str = "") -> float:
    """
    Job-size-tiered margin, floored at 22% and capped at 45%.

    < 5,000 sqft   → 42% (mobilization-heavy, small jobs cost more per unit to run)
    5,000–20,000   → 35% (matches the Worden Standard floor)
    > 20,000 sqft  → 28% (volume efficiency)

    High-risk service types (general contracting, masonry, concrete, new
    builds) add a 3-point margin bump to price in schedule/callback risk.
    """
    sqft = float(project_size_sqft or 0)

    if sqft < _SMALL_JOB_SQFT_THRESHOLD:
        margin = _DYNAMIC_SMALL_JOB_MARGIN
    elif sqft <= _LARGE_JOB_SQFT_THRESHOLD:
        margin = _DYNAMIC_MID_JOB_MARGIN
    else:
        margin = _DYNAMIC_LARGE_JOB_MARGIN

    if (service_type or "").lower().strip() in _HIGH_RISK_SERVICE_TYPES:
        margin += _HIGH_RISK_MARGIN_BUMP

    return round(min(max(margin, _DYNAMIC_MARGIN_FLOOR), _DYNAMIC_MARGIN_CEILING), 4)


def apply_margin(cost: float, margin: float) -> float:
    """
    Turn a raw cost figure into a contractor bid at the given gross margin.

    bid = cost / (1 - margin)   →   at 35% margin, a $650 cost bids at ~$1,000.
    """
    margin = min(max(float(margin), 0.0), 0.95)
    return round(float(cost) / (1 - margin), 2)


def compute_contractor_bid(
    cost_low: float,
    cost_high: float,
    *,
    margin_mode: str = "worden",
    project_size_sqft: float = 0,
    service_type: str = "",
) -> dict:
    """
    Turn a public ballpark cost range (from `pricing.estimate_price()`) into
    an internal contractor bid range at the requested margin.

    Returns
    -------
    {
        "margin_mode":        "worden" | "dynamic",
        "margin":              float,   # e.g. 0.35
        "margin_pct":          str,     # "35.0%"
        "contractor_bid_low":  float,
        "contractor_bid_high": float,
    }
    """
    mode = (margin_mode or "worden").lower().strip()
    if mode not in VALID_MARGIN_MODES:
        mode = "worden"

    if mode == "dynamic":
        margin = calculate_dynamic_margin(project_size_sqft, service_type)
    else:
        margin = calculate_worden_margin()

    return {
        "margin_mode": mode,
        "margin": margin,
        "margin_pct": f"{margin * 100:.1f}%",
        "contractor_bid_low": apply_margin(cost_low, margin),
        "contractor_bid_high": apply_margin(cost_high, margin),
    }
