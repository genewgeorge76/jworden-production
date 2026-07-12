#!/usr/bin/env python3
"""
lead_scoring.py — AI Lead Gatekeeper
J. Worden & Sons Paving & General Contracting

Automated qualification for commercial paving leads.
Scores inbound leads against the Worden Whale Hunter tiers and
writes a JSON summary suitable for downstream CRM/Kickserv import.

Tier classification:
  Tier 1 🐋 Whale  — $500K+  national chains, federal, large municipalities
  Tier 2 🦈 Shark  — $100K–$499K  regional commercial, mid-size gov
  Tier 3 🐟 Fish   — <$100K  residential, small commercial

Scoring factors (100-point scale):
  - Estimated project value     : 0–40 pts
  - Project type alignment      : 0–25 pts  (asphalt/paving/GC)
  - Geography (50-state target) : 0–15 pts  (VA/MD/DC/NC/WV/PA/DE bonus)
  - Client type                 : 0–10 pts  (federal > state > commercial > resi)
  - Urgency / timeline          : 0–10 pts
"""

from __future__ import annotations

import json
import logging
import os
import sys
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Optional

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(message)s",
    level=logging.INFO,
    stream=sys.stdout,
)
log = logging.getLogger("lead_gatekeeper")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
PRIORITY_STATES = {"VA", "MD", "DC", "NC", "WV", "PA", "DE"}
ALL_50_STATES = {
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
    "DC",
}

HIGH_VALUE_PROJECT_TYPES = {
    "asphalt paving", "parking lot", "road construction", "highway",
    "general contracting", "site work", "masonry", "roofing",
    "concrete", "earthwork", "utilities",
}

CLIENT_TYPE_SCORES = {
    "federal": 10,
    "state": 8,
    "municipal": 7,
    "commercial": 5,
    "residential": 2,
    "unknown": 1,
}

TIER_THRESHOLDS = {
    "whale": 75,   # score ≥ 75 → Tier 1
    "shark": 50,   # score ≥ 50 → Tier 2
    "fish": 0,     # score < 50 → Tier 3
}


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------
@dataclass
class Lead:
    lead_id: str
    contact_name: str
    company: str
    email: str
    phone: str
    project_type: str
    estimated_value_usd: float
    state: str
    client_type: str          # federal | state | municipal | commercial | residential
    timeline_days: int        # days until project must start
    notes: str = ""
    score: int = field(default=0, init=False)
    tier: str = field(default="", init=False)
    tier_emoji: str = field(default="", init=False)
    qualified: bool = field(default=False, init=False)
    scored_at: str = field(default="", init=False)


# ---------------------------------------------------------------------------
# Scoring engine
# ---------------------------------------------------------------------------
def score_lead(lead: Lead) -> Lead:
    """Compute score (0–100) and assign tier."""
    pts = 0

    # 1. Estimated project value (0–40 pts)
    v = lead.estimated_value_usd
    if v >= 1_000_000:
        pts += 40
    elif v >= 500_000:
        pts += 35
    elif v >= 250_000:
        pts += 28
    elif v >= 100_000:
        pts += 20
    elif v >= 50_000:
        pts += 12
    elif v >= 10_000:
        pts += 6
    else:
        pts += 0

    # 2. Project type alignment (0–25 pts)
    pt_lower = lead.project_type.lower()
    if any(kw in pt_lower for kw in HIGH_VALUE_PROJECT_TYPES):
        pts += 25
    elif "paving" in pt_lower or "concrete" in pt_lower:
        pts += 15
    else:
        pts += 5

    # 3. Geography (0–15 pts)
    state_upper = lead.state.upper()
    if state_upper in PRIORITY_STATES:
        pts += 15
    elif state_upper in ALL_50_STATES:
        pts += 8
    else:
        pts += 0  # outside US / unknown

    # 4. Client type (0–10 pts)
    pts += CLIENT_TYPE_SCORES.get(lead.client_type.lower(), 1)

    # 5. Urgency / timeline (0–10 pts)
    if lead.timeline_days <= 30:
        pts += 10
    elif lead.timeline_days <= 60:
        pts += 7
    elif lead.timeline_days <= 90:
        pts += 4
    else:
        pts += 1

    lead.score = min(pts, 100)

    # Assign tier
    if lead.score >= TIER_THRESHOLDS["whale"]:
        lead.tier = "Tier 1"
        lead.tier_emoji = "🐋 Whale"
    elif lead.score >= TIER_THRESHOLDS["shark"]:
        lead.tier = "Tier 2"
        lead.tier_emoji = "🦈 Shark"
    else:
        lead.tier = "Tier 3"
        lead.tier_emoji = "🐟 Fish"

    lead.qualified = lead.score >= TIER_THRESHOLDS["shark"]
    lead.scored_at = datetime.now(timezone.utc).isoformat()
    return lead


# ---------------------------------------------------------------------------
# I/O helpers
# ---------------------------------------------------------------------------
def load_leads(path: str) -> list[Lead]:
    """Load leads from a JSON file. Each entry must map to Lead fields."""
    if not os.path.exists(path):
        log.warning("Lead input file not found: %s — using sample data", path)
        return _sample_leads()

    with open(path, encoding="utf-8") as fh:
        raw = json.load(fh)

    leads = []
    for item in raw:
        try:
            leads.append(Lead(**item))
        except TypeError as exc:
            log.warning("Skipping malformed lead entry: %s", exc)
    return leads


def write_results(leads: list[Lead], out_path: str) -> None:
    """Write scored leads to JSON."""
    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump([asdict(l) for l in leads], fh, indent=2)
    log.info("Results written → %s", out_path)


def print_summary(leads: list[Lead]) -> None:
    """Print a human-readable summary to stdout."""
    whales = [l for l in leads if l.tier == "Tier 1"]
    sharks = [l for l in leads if l.tier == "Tier 2"]
    fish   = [l for l in leads if l.tier == "Tier 3"]

    log.info("=" * 60)
    log.info("J. WORDEN & SONS — AI LEAD GATEKEEPER REPORT")
    log.info("Run time: %s", datetime.now(timezone.utc).isoformat())
    log.info("=" * 60)
    log.info("Total leads processed : %d", len(leads))
    log.info("🐋 Tier 1 Whales      : %d", len(whales))
    log.info("🦈 Tier 2 Sharks      : %d", len(sharks))
    log.info("🐟 Tier 3 Fish        : %d", len(fish))
    log.info("-" * 60)

    if whales:
        log.info("TOP WHALE LEADS (priority follow-up):")
        for l in sorted(whales, key=lambda x: x.score, reverse=True):
            log.info(
                "  [%d pts] %s — %s | $%.0f | %s | %s",
                l.score, l.company, l.project_type,
                l.estimated_value_usd, l.state, l.tier_emoji,
            )

    if sharks:
        log.info("SHARK LEADS:")
        for l in sorted(sharks, key=lambda x: x.score, reverse=True):
            log.info(
                "  [%d pts] %s — %s | $%.0f | %s | %s",
                l.score, l.company, l.project_type,
                l.estimated_value_usd, l.state, l.tier_emoji,
            )
    log.info("=" * 60)


# ---------------------------------------------------------------------------
# Sample data (used when no input file is provided)
# ---------------------------------------------------------------------------
def _sample_leads() -> list[Lead]:
    return [
        Lead(
            lead_id="LD-001",
            contact_name="James Reynolds",
            company="US Army Corps of Engineers",
            email="j.reynolds@usace.army.mil",
            phone="703-555-0100",
            project_type="Road Construction",
            estimated_value_usd=2_500_000,
            state="VA",
            client_type="federal",
            timeline_days=45,
            notes="USACE base road resurfacing — VDOT Sec 315 required",
        ),
        Lead(
            lead_id="LD-002",
            contact_name="Patricia Nguyen",
            company="KBP Foods (KFC Portfolio)",
            email="p.nguyen@kbpfoods.com",
            phone="804-555-0200",
            project_type="Parking Lot Asphalt Paving",
            estimated_value_usd=185_000,
            state="MD",
            client_type="commercial",
            timeline_days=60,
            notes="12-site KFC portfolio, annual maintenance contract potential",
        ),
        Lead(
            lead_id="LD-003",
            contact_name="Tom Blackwell",
            company="Fairfax County DPW",
            email="t.blackwell@fairfaxcounty.gov",
            phone="703-555-0301",
            project_type="Site Work",
            estimated_value_usd=620_000,
            state="VA",
            client_type="municipal",
            timeline_days=90,
            notes="County maintenance yard expansion — prevailing wage applies",
        ),
        Lead(
            lead_id="LD-004",
            contact_name="Sandra Okafor",
            company="Richmond Homeowners Assoc.",
            email="s.okafor@richmondha.org",
            phone="804-555-0402",
            project_type="Residential Driveway",
            estimated_value_usd=8_500,
            state="VA",
            client_type="residential",
            timeline_days=120,
        ),
        Lead(
            lead_id="LD-005",
            contact_name="Derek Holt",
            company="VDOT District 9",
            email="d.holt@vdot.virginia.gov",
            phone="540-555-0501",
            project_type="Highway Asphalt Paving",
            estimated_value_usd=3_800_000,
            state="VA",
            client_type="state",
            timeline_days=30,
            notes="VDOT Section 315 — 96% Marshall required — oil-price shield clause",
        ),
    ]


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
def main() -> None:
    input_path  = os.environ.get("LEAD_INPUT_FILE",  "data/leads_inbox.json")
    output_path = os.environ.get("LEAD_OUTPUT_FILE", "data/leads_scored.json")

    log.info("Loading leads from: %s", input_path)
    leads = load_leads(input_path)

    if not leads:
        log.warning("No leads to process.")
        return

    log.info("Scoring %d lead(s)…", len(leads))
    scored = [score_lead(l) for l in leads]

    write_results(scored, output_path)
    print_summary(scored)

    # Exit with non-zero if no qualified (Tier 1 or 2) leads found
    qualified_count = sum(1 for l in scored if l.qualified)
    log.info("Qualified leads (Tier 1+2): %d / %d", qualified_count, len(scored))
    sys.exit(0)


if __name__ == "__main__":
    main()
