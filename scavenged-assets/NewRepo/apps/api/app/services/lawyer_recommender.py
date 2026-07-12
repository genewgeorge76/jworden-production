"""
Lawyer / negotiation recommender for J. Worden & Sons.

Analyzes the dispute type, state, and contractor role to:
  1. Score the state's legal environment (contractor-friendliness, 0–100).
  2. Identify the strongest legal protections available.
  3. Recommend a negotiation strategy tailored to the situation.
  4. Surface which states offer the most favorable legal environment for
     the given dispute type (useful when jurisdiction is negotiable).

State scores are derived from the legal data tables (mechanicsLienLaws,
contractLaw, promptPaymentLaws, constructionLicensing) embedded here in a
compact form so the Python backend can serve the /api/v1/advisor/legal-strategy
endpoint without importing the JavaScript data files.

Scoring methodology
───────────────────
Each dispute category has its own sub-score (0–100) based on weighted
factors drawn from the legal tables.  A composite score is also computed.
Higher = more favorable to the contractor / subcontractor.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


# ── Dispute types ─────────────────────────────────────────────────────────────

DISPUTE_TYPES = ["lien", "payment", "contract_breach", "general"]

ROLE_LABELS = {
    "gc":          "General Contractor",
    "sub":         "Subcontractor",
    "supplier":    "Material Supplier",
    "owner":       "Property Owner",
}

# ── Per-state compact scoring table ───────────────────────────────────────────
# Each entry: (lien_score, payment_score, contract_score)
# Scores derived from mechanicsLienLaws.js, promptPaymentLaws.js, contractLaw.js.
# Factors:
#   lien_score    — filing deadlines, notice simplicity, no residential exceptions
#   payment_score — private coverage, fast cycles, low retainage, interest rate
#   contract_score — anti-indemnity law, no pay-if-paid, long SOL, no-lien-waiver
#
# Scale: 0 = very weak, 100 = very strong protection for contractor/sub.

_STATE_SCORES: dict[str, tuple[int, int, int]] = {
    "AL": (55, 40, 50),
    "AK": (50, 65, 55),
    "AZ": (60, 60, 55),
    "AR": (55, 45, 50),
    "CA": (85, 90, 80),
    "CO": (70, 75, 70),
    "CT": (40, 55, 60),
    "DE": (50, 50, 55),
    "FL": (65, 65, 65),
    "GA": (60, 50, 55),
    "HI": (55, 60, 55),
    "ID": (60, 50, 55),
    "IL": (65, 65, 65),
    "IN": (55, 55, 55),
    "IA": (30, 45, 50),   # Iowa: no private lien law
    "KS": (50, 50, 55),
    "KY": (55, 55, 55),
    "LA": (70, 65, 65),
    "ME": (50, 55, 55),
    "MD": (60, 55, 60),
    "MA": (55, 60, 65),
    "MI": (60, 55, 60),
    "MN": (65, 65, 65),
    "MS": (45, 40, 50),
    "MO": (60, 55, 55),
    "MT": (55, 55, 55),
    "NE": (55, 50, 55),
    "NV": (75, 80, 70),
    "NH": (50, 55, 55),
    "NJ": (55, 60, 65),
    "NM": (60, 60, 60),
    "NY": (60, 65, 65),
    "NC": (55, 55, 60),
    "ND": (55, 50, 55),
    "OH": (60, 60, 60),
    "OK": (60, 55, 60),
    "OR": (70, 75, 70),
    "PA": (60, 60, 65),
    "RI": (50, 55, 60),
    "SC": (55, 55, 55),
    "SD": (55, 50, 55),
    "TN": (55, 55, 55),
    "TX": (75, 70, 70),
    "UT": (60, 65, 60),
    "VT": (45, 55, 55),
    "VA": (65, 60, 65),
    "WA": (70, 75, 70),
    "WV": (55, 50, 55),
    "WI": (60, 60, 60),
    "WY": (55, 50, 55),
    "DC": (55, 60, 60),
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

# ── Legal strategy rules by dispute type ─────────────────────────────────────

_STRATEGY_RULES: dict[str, dict] = {
    "lien": {
        "title": "Mechanics Lien Dispute",
        "description": (
            "Mechanics liens are one of the most powerful tools a contractor has. "
            "A properly filed lien clouds the property title and forces payment disputes "
            "to resolution before the owner can refinance or sell."
        ),
        "key_actions": [
            "File the lien immediately — deadlines are strict and missing them waives your rights entirely.",
            "Send a preliminary notice (if required) as early as possible, even before the deadline.",
            "Document every date of first furnishing labor or materials with timestamped records.",
            "Use certified mail for all required notices and keep green-card return receipts.",
            "Consult a construction attorney in the project state before the filing deadline passes.",
        ],
        "gc_leverage": [
            "GCs generally have the strongest lien rights — no preliminary notice required in most states.",
            "A filed lien immediately creates negotiating pressure; the owner cannot sell or refinance.",
            "In states with no residential owner exceptions, lien rights are absolute.",
        ],
        "sub_leverage": [
            "File your preliminary notice the day you start work — never wait.",
            "Notice requirements are the #1 reason subs lose lien rights; perfect compliance is mandatory.",
            "Once a lien is filed, the GC and owner both have incentive to resolve the dispute quickly.",
        ],
        "weak_position_advice": (
            "If the filing deadline has passed, pursue prompt-payment interest claims and "
            "bond claims on public projects as alternative remedies."
        ),
        "citation_note": "See your state's mechanics lien statute and /advisory/construction-law.",
    },
    "payment": {
        "title": "Payment / Prompt-Payment Dispute",
        "description": (
            "Prompt payment statutes enforce payment timelines and add mandatory interest "
            "penalties for late payment. Many states cover both public and private projects."
        ),
        "key_actions": [
            "Send a formal written demand referencing the state's prompt payment statute by citation.",
            "Calculate statutory interest from the exact due date and include it in your demand.",
            "On public projects, pursue both the payment bond (Miller Act equivalent) and the owner.",
            "Demand payment in writing via certified mail to create a paper trail.",
            "If pay-if-paid is in your contract, challenge its enforceability — many states limit it.",
        ],
        "gc_leverage": [
            "File a payment bond claim on public projects within the statutory window.",
            "Assert prompt payment interest — the penalty rate can be 1–2% per month.",
            "Suspend work after proper written notice for non-payment in most states.",
        ],
        "sub_leverage": [
            "Pay-if-paid clauses are unenforceable in several states — check your state's rule.",
            "Assert lien rights simultaneously with prompt payment claims for maximum pressure.",
            "Document all approved change orders and disputed invoices carefully.",
        ],
        "weak_position_advice": (
            "If your state only covers public projects, focus on bond claims "
            "and pursue breach of contract for private projects."
        ),
        "citation_note": "See your state's prompt payment statute and /advisory/construction-law.",
    },
    "contract_breach": {
        "title": "Contract Breach / Dispute",
        "description": (
            "Contract breach disputes depend heavily on the written contract terms, state SOL, "
            "anti-indemnity protections, and whether the state's implied warranty law applies."
        ),
        "key_actions": [
            "File suit well before the statute of limitations expires — written contracts typically 3–10 years.",
            "Review all anti-indemnity statutes — indemnification clauses that shift fault may be void.",
            "Document all change orders, RFIs, and written communications as evidence.",
            "Invoke the state's right-to-cure process if applicable before filing suit.",
            "Preserve all emails, text messages, photos, and daily logs as evidence.",
        ],
        "gc_leverage": [
            "Anti-indemnity laws in most states void clauses requiring you to indemnify for owner negligence.",
            "Liquidated damages clauses are enforced — ensure any delay was owner-caused.",
            "Implied warranty claims by owners must still prove deviation from workmanlike standard.",
        ],
        "sub_leverage": [
            "Pay-if-paid clauses may be unenforceable — the GC generally cannot withhold indefinitely.",
            "Document all approved and disputed scope changes.",
            "Force majeure provisions and owner-caused delay give strong defenses.",
        ],
        "weak_position_advice": (
            "If the statute of limitations has run, investigate tolling grounds — "
            "fraud, discovery rule, or contractual SOL extension."
        ),
        "citation_note": "See your state's construction contract law and /advisory/contracts.",
    },
    "general": {
        "title": "General Construction Law Inquiry",
        "description": (
            "Multi-factor analysis of the state's overall legal environment for contractors."
        ),
        "key_actions": [
            "Maintain a fully executed written contract before any work begins.",
            "Verify contractor license and bond are current in the project state.",
            "Send a preliminary notice of furnishing on every project as a best practice.",
            "Document all work with daily logs, photos, and signed delivery receipts.",
            "Include a dispute resolution clause specifying governing law in all contracts.",
        ],
        "gc_leverage": [
            "A valid license + bond is your first line of defense against owner counterclaims.",
            "Reciprocity licensing allows expansion to neighboring states without re-examination.",
        ],
        "sub_leverage": [
            "File preliminary notices on every project regardless of whether required.",
            "Ensure all supplier and labor agreements are in writing.",
        ],
        "weak_position_advice": (
            "Consult a licensed construction attorney in the project state before executing any contract."
        ),
        "citation_note": "See /advisory for full state-by-state legal reference.",
    },
}

# ── State-specific negotiation notes ─────────────────────────────────────────

_STATE_NOTES: dict[str, dict[str, str]] = {
    "CA": {
        "lien":            "California requires 20-day preliminary notice for all subs/suppliers but provides among the strongest lien rights nationally. The state's lien law is comprehensive and broadly enforced.",
        "payment":         "California covers both public and private projects with strong prompt payment rules. Interest accrues at 2% per month after 35 days. One of the most contractor-friendly states.",
        "contract_breach": "California's 4-year SOL for written contracts, strong anti-indemnity law (Civil Code § 2782), and broad implied warranty make it favorable for contractors.",
        "general":         "California is generally the most contractor-protective state nationally for payment and contract enforcement.",
    },
    "TX": {
        "lien":            "Texas has strict notice requirements (monthly notices required for subs/suppliers) but provides strong lien rights when properly perfected. Miss a monthly notice and you lose lien rights for that month.",
        "payment":         "Texas Trust Fund statute (Property Code § 162) creates criminal liability for misapplying construction funds — a powerful tool beyond just civil claims.",
        "contract_breach": "Texas anti-indemnity law (Tex. Ins. Code § 151.102) limits broad indemnity clauses. 4-year SOL for written contracts.",
        "general":         "Texas is strong for contractors who follow notice requirements rigorously; weak for those who don't.",
    },
    "NV": {
        "lien":            "Nevada provides 90-day lien filing deadline (after completion) and preliminary notice requirements, but strong foreclosure rights.",
        "payment":         "Nevada's prompt payment statute covers both public and private projects with 3% monthly interest — among the highest nationally.",
        "contract_breach": "Nevada's 6-year SOL for written contracts and anti-indemnity statutes (NRS 338.005) are favorable.",
        "general":         "Nevada is consistently one of the top contractor-protective states.",
    },
    "OR": {
        "lien":            "Oregon requires an 8-day preliminary notice for residential but provides strong lien rights. 75-day filing deadline.",
        "payment":         "Oregon covers public and private projects; requires payment within 30 days with 9% annual interest.",
        "contract_breach": "Oregon's 6-year SOL and strong anti-indemnity law (ORS 30.140) are favorable.",
        "general":         "Oregon is strong across all categories.",
    },
    "WA": {
        "lien":            "Washington requires a 60-day preliminary notice for residential subs; no notice needed for commercial GCs. 90-day filing deadline.",
        "payment":         "Washington's Retainage statute and prompt payment rules cover both public and private work.",
        "contract_breach": "Washington's anti-indemnity law (RCW 4.24.115) is strong. 6-year SOL for written contracts.",
        "general":         "Washington is consistently favorable for contractors across all dispute types.",
    },
    "IA": {
        "lien":            "Iowa has significant limitations on mechanics liens for private residential projects. Verify lien rights carefully before project start.",
        "payment":         "Iowa's prompt payment coverage is limited primarily to public projects.",
        "contract_breach": "5-year SOL for written contracts. Standard anti-indemnity protections.",
        "general":         "Iowa is one of the weaker states for contractor protection, particularly on private residential projects.",
    },
    "MS": {
        "lien":            "Mississippi provides only 1 year to enforce a lien after filing — one of the shorter foreclosure windows nationally.",
        "payment":         "Mississippi's prompt payment law covers public works; private project protections are limited.",
        "contract_breach": "3-year SOL for written contracts. Standard anti-indemnity protections.",
        "general":         "Mississippi is below average for contractor legal protections.",
    },
}

# ── Score label helpers ────────────────────────────────────────────────────────

def _score_label(score: int) -> str:
    if score >= 75:
        return "STRONG"
    if score >= 55:
        return "MODERATE"
    return "WEAK"


def _score_color(score: int) -> str:
    if score >= 75:
        return "green"
    if score >= 55:
        return "yellow"
    return "red"


# ── Public API ────────────────────────────────────────────────────────────────

@dataclass
class NegotiationRecommendation:
    state:              str
    state_name:         str
    dispute_type:       str
    role:               str
    lien_score:         int
    payment_score:      int
    contract_score:     int
    composite_score:    int
    strength_label:     str
    strength_color:     str
    strategy_title:     str
    strategy_description: str
    key_actions:        list[str]
    role_leverage:      list[str]
    state_specific_note: str
    weak_position_advice: str
    citation_note:      str
    top_states:         list[dict]  # top 5 most favorable states for this dispute


def recommend_legal_strategy(
    state: str,
    dispute_type: str,
    role: str = "gc",
) -> NegotiationRecommendation:
    """
    Return a full negotiation recommendation for the given state + dispute type.

    Parameters
    ----------
    state        : 2-letter state abbreviation (e.g. "CA")
    dispute_type : one of "lien" | "payment" | "contract_breach" | "general"
    role         : one of "gc" | "sub" | "supplier" | "owner"
    """
    abbr = state.upper().strip()
    dtype = dispute_type.lower().strip()
    if dtype not in DISPUTE_TYPES:
        dtype = "general"
    role_key = role.lower().strip()
    if role_key not in ROLE_LABELS:
        role_key = "gc"

    scores = _STATE_SCORES.get(abbr, (55, 55, 55))
    lien_score, payment_score, contract_score = scores

    composite = {
        "lien":            int(lien_score * 0.7 + payment_score * 0.15 + contract_score * 0.15),
        "payment":         int(payment_score * 0.7 + lien_score * 0.15 + contract_score * 0.15),
        "contract_breach": int(contract_score * 0.7 + lien_score * 0.15 + payment_score * 0.15),
        "general":         int((lien_score + payment_score + contract_score) / 3),
    }.get(dtype, int((lien_score + payment_score + contract_score) / 3))

    rules = _STRATEGY_RULES[dtype]
    leverage = rules.get("gc_leverage" if role_key in ("gc", "owner") else "sub_leverage", [])

    state_note = _STATE_NOTES.get(abbr, {}).get(dtype, "")

    top = find_strongest_states(dtype, top_n=5)

    return NegotiationRecommendation(
        state=abbr,
        state_name=_STATE_NAMES.get(abbr, abbr),
        dispute_type=dtype,
        role=role_key,
        lien_score=lien_score,
        payment_score=payment_score,
        contract_score=contract_score,
        composite_score=composite,
        strength_label=_score_label(composite),
        strength_color=_score_color(composite),
        strategy_title=rules["title"],
        strategy_description=rules["description"],
        key_actions=rules["key_actions"],
        role_leverage=leverage,
        state_specific_note=state_note,
        weak_position_advice=rules["weak_position_advice"],
        citation_note=rules["citation_note"],
        top_states=top,
    )


def find_strongest_states(
    dispute_type: str,
    top_n: int = 5,
) -> list[dict]:
    """
    Return the top N states ranked by contractor-favorability for the given dispute type.
    Each dict includes state, state_name, score, and label.
    """
    dtype = dispute_type.lower().strip()
    if dtype not in DISPUTE_TYPES:
        dtype = "general"

    scored = []
    for abbr, (lien, payment, contract) in _STATE_SCORES.items():
        if dtype == "lien":
            score = lien
        elif dtype == "payment":
            score = payment
        elif dtype == "contract_breach":
            score = contract
        else:
            score = int((lien + payment + contract) / 3)
        scored.append({"abbr": abbr, "state": _STATE_NAMES.get(abbr, abbr), "score": score, "label": _score_label(score)})

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:top_n]


def rank_states_by_reciprocity(
    home_state: str,
    top_n: int = 10,
) -> list[dict]:
    """
    Identify states with the broadest reciprocity networks.
    Returns a ranked list of states (by estimated reciprocity count) to help
    contractors pick a license base that opens the most doors.

    Note: actual reciprocity counts are stored in constructionLicensing.js;
    this function uses an embedded summary of reciprocity breadth.
    """
    # Reciprocity breadth scores (estimated # of reciprocal states)
    _RECIPROCITY: dict[str, int] = {
        "AL": 2, "AK": 0, "AZ": 0, "AR": 3, "CA": 0, "CO": 1, "CT": 0, "DE": 1,
        "FL": 4, "GA": 4, "HI": 0, "ID": 2, "IL": 0, "IN": 2, "IA": 1, "KS": 1,
        "KY": 3, "LA": 3, "ME": 1, "MD": 2, "MA": 0, "MI": 1, "MN": 1, "MS": 4,
        "MO": 2, "MT": 2, "NE": 1, "NV": 1, "NH": 2, "NJ": 0, "NM": 2, "NY": 0,
        "NC": 3, "ND": 3, "OH": 2, "OK": 2, "OR": 1, "PA": 1, "RI": 0, "SC": 3,
        "SD": 3, "TN": 4, "TX": 1, "UT": 2, "VT": 1, "VA": 3, "WA": 1, "WV": 2,
        "WI": 1, "WY": 1, "DC": 0,
    }

    home = home_state.upper().strip()
    results = []
    for abbr, count in _RECIPROCITY.items():
        results.append({
            "abbr": abbr,
            "state": _STATE_NAMES.get(abbr, abbr),
            "reciprocity_count": count,
            "is_home_state": abbr == home,
        })
    results.sort(key=lambda x: x["reciprocity_count"], reverse=True)
    return results[:top_n]
