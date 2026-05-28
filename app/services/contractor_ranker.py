"""
Contractor quality ranking system for J. Worden & Sons.

Scores and ranks contractor bids by:
  1. Bid price relative to the project estimate (value score)
  2. Licensing tier and class breadth
  3. Bonding level (surety bond amount relative to project size)
  4. Experience and reciprocity coverage
  5. Composite quality-adjusted score

Also provides a state license optimizer that surfaces which US states
offer the widest reciprocity coverage and broadest license class scope —
helping a contractor choose the optimal base license for multi-state work.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


# ── License class scope weights ───────────────────────────────────────────────
# Broader license classes = higher scope score.
_LICENSE_CLASS_KEYWORDS: list[tuple[str, int]] = [
    ("general engineering",   100),
    ("class a",               100),
    ("general building",       90),
    ("class b",                85),
    ("unlimited",              95),
    ("master",                 80),
    ("specialty",              50),
    ("class c",                50),
    ("residential",            40),
    ("class cr",               40),
    ("subcontractor",          35),
]


def _score_license_classes(classes: list[str]) -> int:
    """Return 0–100 scope score for a list of license class labels."""
    if not classes:
        return 0
    best = 0
    combined = " ".join(c.lower() for c in classes)
    for keyword, weight in _LICENSE_CLASS_KEYWORDS:
        if keyword in combined:
            best = max(best, weight)
    return best


# ── State license optimizer ───────────────────────────────────────────────────
# Compact per-state data: (reciprocity_count, class_scope_score, bond_min_commercial)
# Derived from constructionLicensing.js.
_STATE_LICENSE_DATA: dict[str, tuple[int, int, int]] = {
    "AL": (2,  85,  50_000),
    "AK": (0,  40,       0),
    "AZ": (0,  95, 500_000),
    "AR": (3,  85,  25_000),
    "CA": (0,  90, 100_000),
    "CO": (1,  40,       0),
    "CT": (0,  70,  20_000),
    "DE": (1,  75,  15_000),
    "FL": (4,  95,  20_000),
    "GA": (4,  85,  75_000),
    "HI": (0,  70,  10_000),
    "ID": (2,  75,   2_000),
    "IL": (0,  40,       0),
    "IN": (2,  40,       0),
    "IA": (1,  40,       0),
    "KS": (1,  40,       0),
    "KY": (3,  85,  20_000),
    "LA": (3,  90,  10_000),
    "ME": (1,  70,   5_000),
    "MD": (2,  70,  25_000),
    "MA": (0,  80,   5_000),
    "MI": (1,  80,  50_000),
    "MN": (1,  40,       0),
    "MS": (4,  85,  10_000),
    "MO": (2,  40,       0),
    "MT": (2,  70,  25_000),
    "NE": (1,  70,   4_000),
    "NV": (1,  90,  50_000),
    "NH": (2,  70,  25_000),
    "NJ": (0,  70,  75_000),
    "NM": (2,  90,  25_000),
    "NY": (0,  40,       0),
    "NC": (3,  85,  50_000),
    "ND": (3,  70,  50_000),
    "OH": (2,  40,       0),
    "OK": (2,  85,  25_000),
    "OR": (1,  70,  20_000),
    "PA": (1,  40,       0),
    "RI": (0,  80,   5_000),
    "SC": (3,  85,  15_000),
    "SD": (3,  70,  10_000),
    "TN": (4,  85,  10_000),
    "TX": (1,  40,       0),
    "UT": (2,  85,  15_000),
    "VT": (1,  50,  30_000),
    "VA": (3,  85,  50_000),
    "WA": (1,  80,   6_000),
    "WV": (2,  85,  25_000),
    "WI": (1,  40,       0),
    "WY": (1,  70,  15_000),
    "DC": (0,  70,  25_000),
}

_STATE_NAMES: dict[str, str] = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas",
    "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware",
    "FL": "Florida", "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho",
    "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas",
    "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
    "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota",
    "MS": "Mississippi", "MO": "Missouri", "MT": "Montana", "NE": "Nebraska",
    "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey",
    "NM": "New Mexico", "NY": "New York", "NC": "North Carolina",
    "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma", "OR": "Oregon",
    "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
    "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah",
    "VT": "Vermont", "VA": "Virginia", "WA": "Washington", "WV": "West Virginia",
    "WI": "Wisconsin", "WY": "Wyoming", "DC": "District of Columbia",
}


# ── Bid scoring ───────────────────────────────────────────────────────────────

@dataclass
class ContractorBid:
    name:               str
    bid_amount:         float                   # total bid in dollars
    license_state:      str = ""               # state where licensed (abbr)
    license_classes:    list[str] = field(default_factory=list)
    bond_amount:        float = 0.0            # surety bond amount in dollars
    years_experience:   int = 0
    has_insurance:      bool = True
    workers_comp:       bool = True
    reciprocity_states: list[str] = field(default_factory=list)
    notes:              str = ""


@dataclass
class RankedContractor:
    rank:               int
    contractor:         ContractorBid
    bid_score:          int   # 0–100: how competitive the bid price is
    license_score:      int   # 0–100: license tier breadth
    bond_score:         int   # 0–100: bonding adequacy
    experience_score:   int   # 0–100: years in business
    compliance_score:   int   # 0–100: insurance + workers comp
    composite_score:    int   # 0–100: weighted composite
    rank_label:         str   # "BEST VALUE" | "STRONG" | "ACCEPTABLE" | "HIGH RISK"
    recommendation:     str
    flags:              list[str]   # warning flags


def _bid_score(bid_amount: float, estimate_low: float, estimate_high: float) -> int:
    """
    Score a bid relative to the project estimate.
    Within range = 80–90; below range = 90–100 (best value); above range = penalized.
    """
    if estimate_low <= 0 or estimate_high <= 0:
        return 70  # no estimate provided
    mid = (estimate_low + estimate_high) / 2
    if estimate_low <= bid_amount <= estimate_high:
        # Within range: score 75–90 based on how close to low end
        ratio = (bid_amount - estimate_low) / max(estimate_high - estimate_low, 1)
        return int(90 - ratio * 15)  # 75–90
    if bid_amount < estimate_low:
        # Below range: may be too low (red flag if very low)
        pct_below = (estimate_low - bid_amount) / estimate_low
        if pct_below > 0.30:
            return 55  # suspiciously low — possible underbid
        return int(95 - pct_below * 50)  # 80–95
    # Above range
    pct_above = (bid_amount - estimate_high) / estimate_high
    if pct_above > 0.50:
        return 20
    return max(20, int(70 - pct_above * 100))


def _bond_score(bond_amount: float, bid_amount: float) -> int:
    """Score bond adequacy relative to the bid amount."""
    if bid_amount <= 0:
        return 50
    ratio = bond_amount / bid_amount
    if ratio >= 1.0:
        return 100
    if ratio >= 0.50:
        return 85
    if ratio >= 0.25:
        return 70
    if ratio >= 0.10:
        return 50
    if bond_amount > 0:
        return 35
    return 0


def _experience_score(years: int) -> int:
    if years >= 20:
        return 100
    if years >= 10:
        return 85
    if years >= 5:
        return 70
    if years >= 2:
        return 50
    return 30


def _build_flags(c: ContractorBid, bid_amount: float, estimate_low: float, estimate_high: float) -> list[str]:
    flags: list[str] = []
    if not c.has_insurance:
        flags.append("⚠️ No general liability insurance confirmed")
    if not c.workers_comp:
        flags.append("⚠️ No workers comp insurance confirmed")
    if c.bond_amount <= 0:
        flags.append("⚠️ No surety bond on file")
    if c.years_experience < 2:
        flags.append("⚠️ Less than 2 years experience")
    if estimate_low > 0 and bid_amount < estimate_low * 0.70:
        flags.append("⚠️ Bid is more than 30% below estimate — verify scope and materials")
    if not c.license_state:
        flags.append("⚠️ License state not provided")
    return flags


def _rank_label(score: int) -> str:
    if score >= 85:
        return "BEST VALUE"
    if score >= 70:
        return "STRONG"
    if score >= 50:
        return "ACCEPTABLE"
    return "HIGH RISK"


def _recommendation(score: int, flags: list[str]) -> str:
    if flags:
        risk_flags = [f for f in flags if "⚠️" in f]
        if risk_flags:
            return f"Proceed with caution. Resolve {len(risk_flags)} risk flag(s) before awarding."
    if score >= 85:
        return "Recommended — competitive bid with strong qualifications."
    if score >= 70:
        return "Qualified — review scope and references before awarding."
    if score >= 50:
        return "Marginal — requires additional vetting or bond increase."
    return "Not recommended without significant additional qualification."


def score_contractor_bid(
    bid: ContractorBid,
    estimate_low: float = 0.0,
    estimate_high: float = 0.0,
) -> RankedContractor:
    """Score a single contractor bid and return a RankedContractor (rank=0, set by rank_bids)."""
    bid_s  = _bid_score(bid.bid_amount, estimate_low, estimate_high)
    lic_s  = _score_license_classes(bid.license_classes)
    bond_s = _bond_score(bid.bond_amount, bid.bid_amount)
    exp_s  = _experience_score(bid.years_experience)
    comp_s = 100 if (bid.has_insurance and bid.workers_comp) else (60 if bid.has_insurance else 30)

    composite = int(
        bid_s  * 0.35 +
        lic_s  * 0.20 +
        bond_s * 0.20 +
        exp_s  * 0.15 +
        comp_s * 0.10
    )

    flags = _build_flags(bid, bid.bid_amount, estimate_low, estimate_high)

    return RankedContractor(
        rank=0,
        contractor=bid,
        bid_score=bid_s,
        license_score=lic_s,
        bond_score=bond_s,
        experience_score=exp_s,
        compliance_score=comp_s,
        composite_score=composite,
        rank_label=_rank_label(composite),
        recommendation=_recommendation(composite, flags),
        flags=flags,
    )


def rank_contractor_bids(
    bids: list[ContractorBid],
    estimate_low: float = 0.0,
    estimate_high: float = 0.0,
) -> list[RankedContractor]:
    """
    Score and rank a list of ContractorBid objects.
    Returns list sorted from best (rank 1) to worst, with rank positions set.
    """
    ranked = [score_contractor_bid(b, estimate_low, estimate_high) for b in bids]
    ranked.sort(key=lambda r: r.composite_score, reverse=True)
    for i, r in enumerate(ranked, 1):
        r.rank = i
    return ranked


# ── State license optimizer ───────────────────────────────────────────────────

@dataclass
class StateLicenseProfile:
    abbr:             str
    state_name:       str
    reciprocity_count: int
    class_scope_score: int   # 0–100: how broad the license class scope is
    bond_min_commercial: int  # minimum commercial bond required (dollars)
    optimizer_score:  int    # composite: reciprocity × 40% + scope × 40% + low_bond × 20%
    optimizer_label:  str
    notes:            str


def optimize_license_states(top_n: int = 10) -> list[StateLicenseProfile]:
    """
    Rank all states by how beneficial it is for a contractor to hold a license there.

    Score weighs:
      - Reciprocity breadth  (40%) — how many neighboring/partner states accept it
      - License class scope  (40%) — how broad the work authorization is
      - Low bond requirement (20%) — lower barriers to entry

    Returns the top_n states.
    """
    results: list[StateLicenseProfile] = []

    for abbr, (recip, scope, bond) in _STATE_LICENSE_DATA.items():
        # Normalize reciprocity to 0–100 (max observed is ~4)
        recip_norm = min(int(recip * 25), 100)
        # Bond score: lower = better (inverse)
        if bond == 0:
            bond_norm = 100
        elif bond <= 10_000:
            bond_norm = 85
        elif bond <= 25_000:
            bond_norm = 70
        elif bond <= 50_000:
            bond_norm = 55
        elif bond <= 100_000:
            bond_norm = 40
        else:
            bond_norm = 20

        opt = int(recip_norm * 0.40 + scope * 0.40 + bond_norm * 0.20)
        if opt >= 80:
            label = "OPTIMAL"
        elif opt >= 60:
            label = "GOOD"
        elif opt >= 40:
            label = "AVERAGE"
        else:
            label = "LIMITED"

        # State-specific highlight notes
        _HIGHLIGHTS = {
            "FL": "Highest reciprocity with GA, AL, NC, SC — ideal Southeast base license.",
            "TN": "Reciprocal with AL, GA, MS, AR — strong Mid-South coverage.",
            "GA": "Reciprocal with FL, AL, NC, SC — strong Southeast network.",
            "MS": "Reciprocal with AL, AR, LA, TN — solid Gulf Coast coverage.",
            "CA": "No reciprocity but required for largest US market; Class A/B/C very broad scope.",
            "AZ": "No reciprocity but Class A/B/C/CR covers broadest scope of any state licensing system.",
            "NV": "Strong legal protections; Class A/B cover broad scope.",
            "TX": "No statewide license required; local permits cover most work.",
            "IL": "No statewide license required; Chicago has its own license.",
        }

        results.append(StateLicenseProfile(
            abbr=abbr,
            state_name=_STATE_NAMES.get(abbr, abbr),
            reciprocity_count=recip,
            class_scope_score=scope,
            bond_min_commercial=bond,
            optimizer_score=opt,
            optimizer_label=label,
            notes=_HIGHLIGHTS.get(abbr, ""),
        ))

    results.sort(key=lambda s: s.optimizer_score, reverse=True)
    return results[:top_n]
