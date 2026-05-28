"""
Advanced lead ranking for J. Worden & Sons.

Builds on the base lead_scorer with additional factors:
  - Revenue potential (service type + size tier)
  - Geographic completeness (address provided)
  - Time decay (leads age, reducing urgency priority when overdue for follow-up)
  - Response window SLA countdown

The public ``score_lead`` function in lead_scorer.py remains the canonical scorer
used at submission time.  This module adds ``rank_leads`` which re-ranks a list of
ORM Lead objects for display in the admin dashboard.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any


# ── Revenue potential weights ─────────────────────────────────────────────────

_SERVICE_REVENUE = {
    "parking_lot":        100,
    "commercial_paving":  100,
    "paving":              80,
    "driveway":            50,
    "sealcoating":         35,
    "crackfill":           20,
    "crack_fill":          20,
    "maintenance":         30,
}

_URGENCY_WEIGHT = {
    "asap":            30,
    "within_1_week":   22,
    "within_1_month":  12,
    "flexible":         5,
}

_PROPERTY_WEIGHT = {
    "commercial":  25,
    "residential": 12,
}

_SIZE_TIERS = [
    (50_000, 50),
    (10_000, 40),
    ( 5_000, 30),
    ( 1_000, 20),
    (   500, 12),
    (     0,  5),
]

# Time-decay parameters
_DECAY_POINTS_PER_HOUR: int = 2   # ranking score reduction per overdue hour
_DECAY_MAX_PENALTY: int = 40       # maximum penalty (so HOT leads never sink to zero)


def _size_score(sqft: float | None) -> int:
    if not sqft:
        return 5
    for threshold, pts in _SIZE_TIERS:
        if sqft >= threshold:
            return pts
    return 5


def _completeness_bonus(lead) -> int:
    """Reward leads that provided an address (easier to schedule a site visit)."""
    return 8 if getattr(lead, "address", None) else 0


def _time_decay(lead, now: datetime) -> int:
    """
    Reduce the effective ranking score for leads that have aged past their SLA
    window without being contacted.  The penalty increases each day.

    SLA windows (from priority):
      1 (HOT)  → 1 hour
      2 (WARM) → 8 hours
      3 (COOL) → 48 hours
    """
    created = getattr(lead, "created_at", None)
    priority = getattr(lead, "score_priority", 3) or 3
    if created is None:
        return 0

    if created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)

    hours_old = (now - created).total_seconds() / 3600

    sla_hours = {1: 1, 2: 8, 3: 48}.get(priority, 48)
    if hours_old <= sla_hours:
        return 0   # within SLA — no penalty

    overdue_hours = hours_old - sla_hours
    # −_DECAY_POINTS_PER_HOUR pts per overdue hour, capped at −_DECAY_MAX_PENALTY
    return max(-_DECAY_MAX_PENALTY, -int(overdue_hours * _DECAY_POINTS_PER_HOUR))


def compute_ranking_score(lead, now: datetime | None = None) -> int:
    """
    Compute a live ranking score for a single Lead ORM object.

    This is a richer signal than ``score_value`` stored at submission time
    because it incorporates time-decay and completeness bonuses.
    """
    if now is None:
        now = datetime.now(timezone.utc)

    score = 0
    score += _SERVICE_REVENUE.get((getattr(lead, "service_type") or "").lower(), 10)
    score += _URGENCY_WEIGHT.get((getattr(lead, "urgency") or "flexible").lower(), 5)
    score += _PROPERTY_WEIGHT.get((getattr(lead, "property_type") or "residential").lower(), 12)
    score += _size_score(getattr(lead, "project_size_sqft", None))
    score += _completeness_bonus(lead)
    score += _time_decay(lead, now)
    return max(score, 0)


def rank_leads(leads: list[Any], now: datetime | None = None) -> list[dict]:
    """
    Return a list of dicts, each containing the Lead ORM object plus computed
    ranking metadata, sorted from highest to lowest ranking score.

    Args:
        leads: list of Lead ORM objects from SQLAlchemy query
        now: reference timestamp (defaults to UTC now)

    Returns:
        list of dicts with keys:
          lead        – the original ORM object
          rank_score  – computed ranking score (int, higher = more urgent)
          rank_label  – "HOT" | "WARM" | "COOL"
          rank_badge  – CSS class hint for dashboard colour coding
          sla_status  – "within_sla" | "overdue_Xh" | "overdue_Xd"
    """
    if now is None:
        now = datetime.now(timezone.utc)

    ranked = []
    for lead in leads:
        rs = compute_ranking_score(lead, now)

        if rs >= 120:
            rl, rb = "HOT",  "badge-hot"
        elif rs >= 70:
            rl, rb = "WARM", "badge-warm"
        else:
            rl, rb = "COOL", "badge-cool"

        # SLA status string for dashboard display
        created = getattr(lead, "created_at", None)
        priority = getattr(lead, "score_priority", 3) or 3
        sla_map = {1: 1, 2: 8, 3: 48}
        sla_hours = sla_map.get(priority, 48)
        if created:
            if created.tzinfo is None:
                created = created.replace(tzinfo=timezone.utc)
            hours_old = (now - created).total_seconds() / 3600
            if hours_old <= sla_hours:
                sla_status = "within_sla"
            else:
                overdue = hours_old - sla_hours
                if overdue < 24:
                    sla_status = f"overdue_{int(overdue)}h"
                else:
                    sla_status = f"overdue_{int(overdue / 24)}d"
        else:
            sla_status = "unknown"

        ranked.append(
            {
                "lead": lead,
                "rank_score": rs,
                "rank_label": rl,
                "rank_badge": rb,
                "sla_status": sla_status,
            }
        )

    ranked.sort(key=lambda x: x["rank_score"], reverse=True)
    for i, item in enumerate(ranked, 1):
        item["rank_position"] = i

    return ranked
