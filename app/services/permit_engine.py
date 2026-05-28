"""
permit_engine.py — Multi-state residential permit & zoning intelligence engine.

Covers: VA, NC, SC, GA, MD

State rules are the "golden rules" that apply when no county-specific data
exists. County entries override or extend state rules where local authorities
differ from the statewide code.

Data version: 1.2.0 (updated 2026-05-02)

Usage:
    from .services.permit_engine import engine
    result = engine.get_permit_info("NC", county_name="Mecklenburg", project_cost=45000)
"""

from __future__ import annotations

import re
from typing import Any


class PermitEngine:
    """Multi-state permit trigger and county fee engine."""

    def __init__(self) -> None:
        self.states  = self._load_state_rules()
        self.counties = self._load_county_data()

    # ── State-level golden rules ──────────────────────────────────────────────

    def _load_state_rules(self) -> dict[str, dict]:
        return {
            "VA": {
                "code_name": "Virginia Uniform Statewide Building Code (USBC)",
                "website":   "https://virginia.gov",
                "triggers": {
                    "deck":           "Required if attached to house OR >30 inches high.",
                    "shed":           "Required if >256 sq ft.",
                    "fence":          "Not required if <7 ft (check zoning).",
                    "cost_threshold": None,   # VA is structure-based, not cost-based
                    "state_levy":     "2% surcharge on all permit fees.",
                },
            },
            "NC": {
                "code_name": "NC General Statute 160D-1110",
                "website":   "https://ncleg.gov",
                "triggers": {
                    "deck":           "Always required.",
                    "shed":           "Required if dimension >12 ft in any direction.",
                    "cost_threshold": 40_000.00,   # $40k rule
                    "exemptions":     ["Farm buildings", "Equipment replacement"],
                },
            },
            "SC": {
                "code_name": "SC International Residential Code",
                "website":   "https://sc.gov",
                "triggers": {
                    "deck":         "Required.",
                    "shed":         "Required if >200 sq ft.",
                    "cost_threshold": 2_000.00,
                    "coastal_note": "Strict Wind/Seismic codes apply in coastal zones.",
                },
            },
            "GA": {
                "code_name": "Georgia State Minimum Standard Codes",
                "website":   "https://georgia.gov",
                "triggers": {
                    "deck":           "Required.",
                    "shed":           "Required if >120 sq ft (varies, often 200).",
                    "cost_threshold": None,   # Based on "inspection required"
                },
            },
            "MD": {
                "code_name": "Maryland Building Performance Standards (MBPS)",
                "website":   "https://maryland.gov",
                "triggers": {
                    "deck":       "Required if >30 inches high.",
                    "shed":       "Varies significantly (150–200 sq ft limit).",
                    "waterfront": "Critical Area Permit required within 1,000 ft of water.",
                },
            },
        }

    # ── County-level overrides ────────────────────────────────────────────────

    def _load_county_data(self) -> dict[str, dict]:
        return {
            # ── VIRGINIA ─────────────────────────────────────────────────────
            "fairfax": {
                "state":        "VA",
                "dept":         "Land Development Services",
                "phone":        "703-222-0801",
                "fee_structure": "Base fee ~$135 + equipment fees. 2% State Levy.",
                "zoning_note":  "Strict enforcement on basement egress windows.",
                "link":         "https://www.fairfaxcounty.gov/landdevelopment/",
            },
            "prince_william": {
                "state":        "VA",
                "dept":         "Building Development Division",
                "phone":        "703-792-6930",
                "fee_structure": "Residential alterations based on contract value.",
                "link":         "https://pwcva.gov",
            },
            "loudoun": {
                "state":  "VA",
                "dept":   "Building & Development",
                "system": "LandMARC (online portal)",
                "fee_structure": "See fee schedule on LandMARC.",
                "link":   "https://www.loudoun.gov/96/Building-Development",
            },
            "virginia_beach": {
                "state":        "VA",
                "dept":         "Planning Department",
                "fee_structure": "$50 min for demolition. Technology fee $10.",
                "link":         "https://planning.virginiabeach.gov/permits/building",
            },
            "franklin": {
                "state":        "VA",
                "dept":         "Building Official",
                "fee_structure": "$0.18 per sq ft for new dwelling. Min $60.",
                "link":         "https://www.franklincountyva.gov/212/Fees",
            },

            # ── NORTH CAROLINA ────────────────────────────────────────────────
            "mecklenburg": {
                "state": "NC",
                "dept":  "Code Enforcement",
                "phone": "980-314-CODE",
                "note":  "Serves Charlotte. Very strict on the $40k rule.",
                "link":  "https://mecknc.gov",
            },
            "brunswick": {
                "state":        "NC",
                "dept":         "Building Permitting",
                "fee_structure": "Trade permits $100. Mobile homes $300–$500.",
                "link":         "https://www.brunswickcountync.gov/197/Permit-Fee-Schedule---Building",
            },

            # ── SOUTH CAROLINA ────────────────────────────────────────────────
            "horry": {
                "state":  "SC",
                "dept":   "Planning and Zoning / Code Enforcement",
                "phone":  "843-915-5340",
                "link":   "https://www.horrycountysc.gov/departments/planning-and-zoning/",
                "fee_schedule": {
                    "plan_review":    "$0.20 per sq ft",
                    "building_permit": "$0.50 per sq ft (min $50.00)",
                    "zoning_fee":     "$25.00",
                    "plan_revision":  "$25.00",
                },
                "note": (
                    "Includes Myrtle Beach. Strict hurricane/wind zone requirements apply. "
                    "Rezoning fee standard is $250.00."
                ),
            },
            "charleston": {
                "state":  "SC",
                "dept":   "Building Inspection Services",
                "phone":  "843-202-6930",
                "link":   "https://www.charlestoncounty.org",
                "fee_schedule": {
                    "base_fee":       "$50.00 (first $2,000 valuation)",
                    "tier_1":         "$4.00 per $1,000 (up to $50,000)",
                    "tier_2":         "$3.75 per $1,000 (above $50,000)",
                    "application_fee": "$40.00",
                },
                "note": "Flood zone compliance is mandatory for coastal properties.",
            },
            "greenville": {
                "state":  "SC",
                "dept":   "Building Safety",
                "phone":  "864-467-7060",
                "link":   "https://www.greenvillecounty.org/permitting/",
                "fee_schedule": {
                    "minimum_permit_fee": "$72.00",
                    "residential_roofing": "$108.00",
                    "electrical_base":    "$72.00 + $0.36 per amp (100-amp min)",
                    "mechanical_base":    "$72.00 + unit charges",
                },
            },

            # ── GEORGIA ───────────────────────────────────────────────────────
            "gwinnett": {
                "state":  "GA",
                "dept":   "Planning and Development",
                "phone":  "678-518-6020",
                "link":   "https://www.gwinnettcounty.com/government/departments/planning-development",
                "fee_schedule": {
                    "building_permit": "$6.00 per $1,000 of construction cost",
                    "minimum_fee":     "$30.00",
                    "rezoning_app":    "$500.00 (0–5 acres)",
                    "technology_fee":  "$15.00",
                },
                "note": "Requires separate trade permits for all mechanical, electrical, and plumbing.",
            },
            "cobb": {
                "state":  "GA",
                "dept":   "Community Development Agency",
                "phone":  "770-528-2189",
                "link":   "https://www.cobbcounty.gov/community-development",
                "fee_schedule": {
                    "new_homes":             "$5.75 per $1,000 of construction value",
                    "construction_valuation": "Heated sq ft × $90 + Unheated sq ft × $22",
                    "zoning_review":         "$25.00",
                    "utility_min":           "$150.00",
                },
            },
            "dekalb": {
                "state":  "GA",
                "dept":   "Planning & Sustainability",
                "phone":  "404-371-2155",
                "link":   "https://dekalbcountyga.gov/departments/planning-and-sustainability",
                "fee_schedule": {
                    "total_min_permit": "$245.00 (includes $195 permit + $50 CO)",
                    "valuation_base":   "$14.00 per $1,000 (first $25k)",
                    "fire_review":      "$100.00 (if applicable)",
                },
            },
            "fulton": {
                "state": "GA",
                "dept":  "Planning & Community Development",
                "link":  "https://fultoncountyga.gov",
                "note":  "Atlanta has its own separate permitting office inside Fulton County.",
            },

            # ── MARYLAND ──────────────────────────────────────────────────────
            "prince_georges": {
                "state":     "MD",
                "dept":      "DPIE (Permitting, Inspections and Enforcement)",
                "phone":     "301-883-5776",
                "link":      "https://www.princegeorgescountymd.gov/departments-offices/permitting-inspections-and-enforcement",
                "fee_schedule": {
                    "base_permit_fee": "$132.00 (minimum)",
                    "valuation_fee":   "1% of construction cost (if above minimum)",
                    "technology_fee":  "10%",
                    "mncppc_fee":      "$5.00",
                },
                "shed_rule": "Permit required for sheds > 150 sq ft (below state average).",
            },
            "montgomery": {
                "state":  "MD",
                "dept":   "Department of Permitting Services",
                "phone":  "240-777-0311",
                "link":   "https://www.montgomerycountymd.gov/dps/",
                "fee_schedule": {
                    "new_home_detached":  "$0.767865 per SF (first 5,000 SF)",
                    "filing_fee_new":     "50% of permit fee or $757.05 (greater)",
                    "deck_permit_small":  "$194.67 (up to 500 SF)",
                    "fence_permit":       "$77.87",
                },
                "note": "Online 'eServices' portal is mandatory for most permits.",
            },
            "baltimore_county": {
                "state":  "MD",
                "dept":   "Permits, Approvals and Inspections",
                "phone":  "410-887-3391",
                "link":   "https://www.baltimorecountymd.gov/departments/pai",
                "fee_schedule": {
                    "application_fee":  "$200.00",
                    "plan_review":      "$325.00",
                    "inspection_fee":   "$810.00 (0–1,500 SF)",
                    "impact_fee":       "$6.00 per SF (new residential development)",
                },
                "note": "Impact fees apply to all new residential enclosed areas as of 2026.",
            },
            "anne_arundel": {
                "state":  "MD",
                "dept":   "Inspections and Permits",
                "phone":  "410-222-7730",
                "link":   "https://www.aacounty.org/inspections-and-permits",
                "fee_schedule": {
                    "application_fee":          "$43.00",
                    "minimum_building_permit":  "$86.00",
                    "minimum_residential_class": "$51.00",
                    "deck_permit_base":          "$150.00 (min 120 SF)",
                },
            },
        }

    # ── Main query function ───────────────────────────────────────────────────

    def get_permit_info(
        self,
        state_code: str,
        county_name: str | None = None,
        project_cost: float = 0.0,
        structure_size: float = 0.0,
    ) -> dict[str, Any]:
        """
        Return permit trigger analysis for a given state / optional county.

        Args:
            state_code:     2-letter US state code (VA, NC, SC, GA, MD).
            county_name:    County name or None for state-level rules only.
            project_cost:   Estimated project value in USD (drives NC/SC gates).
            structure_size: Accessory structure area in sq ft (drives shed gates).

        Returns:
            dict with jurisdiction, authority, triggers, permit_likely, notes,
            and optional local_authority / local_link / fee_schedule fields.
        """
        state_key  = state_code.upper().strip()
        state_rules = self.states.get(state_key)

        if not state_rules:
            return {
                "error": f"State '{state_key}' not supported.",
                "supported_states": sorted(self.states.keys()),
            }

        response: dict[str, Any] = {
            "jurisdiction":    f"{state_key} state rules",
            "authority":       state_rules["code_name"],
            "general_triggers": dict(state_rules["triggers"]),   # mutable copy
            "official_link":   state_rules["website"],
            "permit_likely":   False,
            "notes":           [],
        }

        # 1. County override ──────────────────────────────────────────────────
        if county_name:
            county_key = (
                county_name.lower()
                .replace(" ", "_")
                .replace("_county", "")
                .strip()
            )
            county = self.counties.get(county_key)

            if county and county["state"] == state_key:
                response["jurisdiction"]    = f"{county_name.title()}, {state_key}"
                response["local_authority"] = county["dept"]
                response["local_link"]      = county["link"]

                if "fee_schedule" in county:
                    response["fee_schedule"] = county["fee_schedule"]
                elif "fee_structure" in county:
                    response["notes"].append(f"Fee structure: {county['fee_structure']}")

                if "note" in county:
                    response["notes"].append(county["note"])
                if "zoning_note" in county:
                    response["notes"].append(f"Zoning: {county['zoning_note']}")

                # County shed-rule can override the state trigger
                if "shed_rule" in county:
                    response["general_triggers"]["shed"] = county["shed_rule"]

        # 2. Cost gate (NC / SC primarily) ────────────────────────────────────
        threshold = state_rules["triggers"].get("cost_threshold")
        if threshold and project_cost > threshold:
            response["permit_likely"] = True
            response["notes"].append(
                f"Project cost ${project_cost:,.2f} exceeds state threshold of ${threshold:,.2f}."
            )

        # 3. Size gate (shed trigger) ─────────────────────────────────────────
        if structure_size > 0:
            shed_str = response["general_triggers"].get("shed", "")
            match = re.search(r"(\d+)", shed_str)
            if match:
                sq_ft_limit = int(match.group(1))
                if structure_size > sq_ft_limit:
                    response["permit_likely"] = True
                    response["notes"].append(
                        f"Structure size {structure_size:,.0f} sq ft exceeds "
                        f"exemption limit of {sq_ft_limit} sq ft."
                    )

        return response


# Module-level singleton — import and use directly in routers
engine = PermitEngine()
