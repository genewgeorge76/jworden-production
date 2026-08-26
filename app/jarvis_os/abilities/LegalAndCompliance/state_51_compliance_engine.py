"""
state_51_compliance_engine.py — compliance facts for all 51 jurisdictions.

WHAT THIS WAS
─────────────
This class was registered as "Autonomous In-House Counsel", tagged `51`, and
described as processing state-specific regulations for mechanics liens,
prevailing wage and contractor licensing.

It held three states. Its own comment said "Hardcoded database for
demonstration of capabilities". For the other forty-eight it returned:

    "Legal matrix for state 'GA' requires external API lookup.
     Reverting to Federal default guidelines."

There were no federal default guidelines behind it. It returned nothing, worded
so that the system appeared to have handled the request. A tool that answers
confidently about three states and reassuringly about forty-eight is worse than
one that answers about three and says so, because nothing downstream can tell
the two apart.

WHAT IT IS NOW
──────────────
It reads app/services/legal_tables.py, generated from the cited datasets in
src/data/legal/, where every row carries a statute citation and a verification
date. The name is finally accurate: fifty states and the District of Columbia.

RETAINAGE
─────────
The old three-state table was the only place in this repository where a
statutory retainage limit ever appeared, and it was not sourced. No cited
dataset here covers retainage, so this returns the topic as uncovered and names
it rather than producing a percentage. A retainage limit is the kind of figure
that reads as authoritative and gets relied on in a negotiation.
"""

import logging

from ....services.legal_tables import (
    CONTRACTOR_LICENSING,
    LIEN_LAWS,
    PREVAILING_WAGE,
    UNCOVERED_TOPICS,
)

logger = logging.getLogger(__name__)


class State51ComplianceEngine:
    """
    State compliance lookup across mechanics liens, prevailing wage and
    contractor licensing, for all 51 US jurisdictions.
    """

    def __init__(self):
        logger.info(
            "State compliance engine ready: %d jurisdictions from the cited datasets.",
            len(LIEN_LAWS),
        )

    def query_compliance(self, state_abbr: str) -> dict:
        """Compliance facts for one jurisdiction, with the citation behind each."""
        state = str(state_abbr or "").upper()

        lien = LIEN_LAWS.get(state)
        wage = PREVAILING_WAGE.get(state)
        licensing = CONTRACTOR_LICENSING.get(state)

        if lien is None and wage is None and licensing is None:
            # An unrecognised code is reported as unrecognised. It is not
            # answered with a federal fallback that does not exist.
            return {
                "status": "error",
                "state": state,
                "assessment": (
                    f"'{state}' is not one of the {len(LIEN_LAWS)} US jurisdictions "
                    "in the cited datasets. No guidance is available for it."
                ),
                "citations": {},
                "uncovered": UNCOVERED_TOPICS,
            }

        lines = [f"LEGAL & COMPLIANCE ASSESSMENT FOR {state}:"]
        citations: dict[str, str] = {}

        if lien:
            lines.append(f"- Mechanics Lien Deadline: {lien['lien_filing_note'] or 'see citation'}")
            if lien["preliminary_notice_required"]:
                lines.append(
                    f"- Preliminary Notice: required — "
                    f"{lien['preliminary_notice_note'] or 'see citation'}"
                )
            else:
                lines.append("- Preliminary Notice: not required")
            if lien["foreclosure_days"] is None:
                lines.append("- Foreclosure Period: the source states none for this jurisdiction")
            else:
                lines.append(f"- Foreclosure Period: {lien['foreclosure_days']} days from filing")
            if lien["citation"]:
                citations["mechanics_lien"] = lien["citation"]

        if wage:
            if wage["prevailing_wage_law"]:
                threshold = wage["threshold_public_works_usd"]
                scope = wage["law_scope"] or "public construction contracts"
                amount = f", threshold ${threshold:,}" if threshold else ""
                lines.append(f"- Prevailing Wage Law: yes — {scope}{amount}")
                if wage["administered_by"]:
                    lines.append(f"  Administered by: {wage['administered_by']}")
            else:
                lines.append("- Prevailing Wage Law: no state law")
            if wage["davis_bacon_applies"]:
                lines.append("  Federal Davis-Bacon applies to federally funded work")
            if wage["citation"]:
                citations["prevailing_wage"] = wage["citation"]

        if licensing:
            if licensing["state_license_required"]:
                threshold = licensing["threshold_usd"]
                over = f" over ${threshold:,}" if threshold else ""
                lines.append(f"- Contractor Licence: required at state level{over}")
                if licensing["authority"]:
                    lines.append(f"  Authority: {licensing['authority']}")
            else:
                lines.append("- Contractor Licence: no state-level requirement (check locally)")
            if licensing["authority_url"]:
                citations["licensing_authority"] = licensing["authority_url"]

        lines.append("- Retainage Limits: not covered by any cited dataset here")

        return {
            "status": "success",
            "state": state,
            "assessment": "\n".join(lines),
            "citations": citations,
            "source_last_verified": (lien or wage or licensing or {}).get("last_verified"),
            "uncovered": UNCOVERED_TOPICS,
            "disclaimer": (
                "Sourced from statute citations with a verification date. Verify "
                "with a licensed attorney in that state before relying on it."
            ),
        }
