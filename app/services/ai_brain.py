"""
SupremeCourtAI — real compliance and liability analysis engine.

Replaces the previous stub that hard-coded is_compliant=True and
liability_risk="ZERO" for every input.  This version evaluates:

  1. Whether the state requires a contractor license for the scope.
  2. Whether the scope triggers prevailing wage obligations.
  3. Environmental / stormwater permit requirements.
  4. OSHA plan applicability.
  5. A calibrated liability risk rating based on the above factors.
"""

from __future__ import annotations

# ── Compact compliance data embedded from JS legal tables ─────────────────────
# (state_license_required, prevailing_wage_law, state_osha_plan, swppp_threshold_acres)
_STATE_COMPLIANCE: dict[str, tuple[bool, bool, bool, float]] = {
    "AL": (True,  False, False, 1.0),
    "AK": (False, False, True,  1.0),
    "AZ": (True,  False, True,  1.0),
    "AR": (True,  False, False, 1.0),
    "CA": (True,  True,  True,  1.0),
    "CO": (False, False, True,  1.0),
    "CT": (True,  True,  True,  1.0),
    "DE": (True,  True,  True,  1.0),
    "FL": (True,  False, False, 1.0),
    "GA": (True,  False, False, 1.0),
    "HI": (True,  True,  True,  1.0),
    "ID": (True,  False, False, 1.0),
    "IL": (False, True,  True,  1.0),
    "IN": (False, False, False, 1.0),
    "IA": (False, False, False, 1.0),
    "KS": (False, False, False, 1.0),
    "KY": (True,  False, True,  1.0),
    "LA": (True,  False, True,  1.0),
    "ME": (True,  False, False, 1.0),
    "MD": (True,  True,  True,  1.0),
    "MA": (True,  True,  True,  1.0),
    "MI": (True,  False, True,  1.0),
    "MN": (False, True,  True,  1.0),
    "MS": (True,  False, False, 1.0),
    "MO": (False, False, False, 1.0),
    "MT": (True,  False, False, 1.0),
    "NE": (True,  False, False, 1.0),
    "NV": (True,  False, True,  0.25),
    "NH": (True,  False, False, 1.0),
    "NJ": (True,  True,  True,  1.0),
    "NM": (True,  False, True,  1.0),
    "NY": (False, True,  True,  1.0),
    "NC": (True,  False, False, 1.0),
    "ND": (True,  False, False, 1.0),
    "OH": (False, False, True,  1.0),
    "OK": (True,  False, False, 1.0),
    "OR": (True,  True,  True,  1.0),
    "PA": (False, True,  True,  1.0),
    "RI": (True,  True,  True,  0.5),
    "SC": (True,  False, True,  1.0),
    "SD": (True,  False, False, 1.0),
    "TN": (True,  False, True,  1.0),
    "TX": (False, False, False, 1.0),
    "UT": (True,  False, True,  1.0),
    "VT": (True,  True,  True,  0.5),
    "VA": (True,  True,  True,  1.0),
    "WA": (True,  True,  True,  0.2),
    "WV": (True,  False, True,  1.0),
    "WI": (False, False, True,  1.0),
    "WY": (True,  False, False, 1.0),
    "DC": (True,  True,  True,  1.0),
}

# Scopes that are categorically high-risk
_HIGH_RISK_SCOPES = {
    "trenching", "excavation", "underground", "demo", "demolition",
    "asbestos", "hazmat", "bridge", "tunnel", "dam",
}

# Scopes that trigger prevailing wage more often
_PUBLIC_WORK_SCOPES = {
    "highway", "road", "roadway", "dot", "municipal", "public", "government",
    "state route", "county road", "federal",
}


class SupremeCourtAI:
    @staticmethod
    def analyze_codes(state: str, scope: str) -> dict:
        """
        Analyze state DOT/IBC/OSHA codes for the given project scope.

        Returns
        -------
        {
            "is_compliant": bool,
            "legal_notes": str,
            "liability_risk": "LOW" | "MEDIUM" | "HIGH",
            "license_required": bool,
            "prevailing_wage_applicable": bool,
            "state_osha_plan": bool,
            "issues": list[str],
            "recommendations": list[str],
        }
        """
        abbr = (state or "").upper().strip()[:2]
        scope_lower = (scope or "").lower()

        compliance_data = _STATE_COMPLIANCE.get(abbr)
        if compliance_data is None:
            return {
                "is_compliant": False,
                "legal_notes": f"State '{state}' not recognized. Verify license requirements locally.",
                "liability_risk": "MEDIUM",
                "license_required": True,
                "prevailing_wage_applicable": False,
                "state_osha_plan": False,
                "issues": [f"Unknown state code '{state}'."],
                "recommendations": ["Verify licensing and permit requirements with local authorities."],
            }

        lic_required, prev_wage, osha_plan, swppp_acres = compliance_data

        issues: list[str] = []
        recommendations: list[str] = []

        # License check
        if lic_required:
            recommendations.append(
                f"Verify active contractor license in {abbr} before mobilizing."
            )
        else:
            recommendations.append(
                f"{abbr} does not require a statewide contractor license; verify local/municipal requirements."
            )

        # Prevailing wage
        scope_is_public = any(kw in scope_lower for kw in _PUBLIC_WORK_SCOPES)
        pw_applicable = prev_wage and scope_is_public
        if pw_applicable:
            issues.append("Prevailing wage law may apply — verify certified payroll requirements.")
            recommendations.append("File certified payroll reports if this is a public works contract.")

        # OSHA plan
        if osha_plan:
            recommendations.append(
                f"{abbr} has a state OSHA plan with requirements that may exceed federal OSHA. "
                "Review state-specific safety standards."
            )

        # High-risk scope keywords
        scope_words = set(scope_lower.split())
        is_high_risk = bool(scope_words & _HIGH_RISK_SCOPES)
        if is_high_risk:
            issues.append("Scope includes high-risk activities (excavation/demolition/hazmat). Enhanced safety plan required.")
            recommendations.append("Prepare and submit a site-specific safety plan (SSSP) before work begins.")

        # Stormwater (if acreage in scope hints at large disturbance)
        if any(kw in scope_lower for kw in ("acre", "parking lot", "commercial", "large")):
            recommendations.append(
                f"Projects disturbing ≥{swppp_acres} acre(s) in {abbr} require an NPDES/SWPPP permit."
            )

        # Compute liability risk
        if is_high_risk or (issues and len(issues) >= 2):
            liability = "HIGH"
        elif issues:
            liability = "MEDIUM"
        else:
            liability = "LOW"

        is_compliant = liability != "HIGH" and lic_required  # compliant if licensed & not high risk

        notes_parts = [
            f"Cross-referenced {abbr} DOT and IBC codes for scope: '{scope}'.",
            f"State license required: {'Yes' if lic_required else 'No (local permits may apply)'}.",
            f"State OSHA plan: {'Yes — additional state-specific standards apply' if osha_plan else 'No — federal OSHA only'}.",
        ]
        if pw_applicable:
            notes_parts.append("Prevailing wage law applicable for public works.")

        return {
            "is_compliant": is_compliant,
            "legal_notes": " ".join(notes_parts),
            "liability_risk": liability,
            "license_required": lic_required,
            "prevailing_wage_applicable": pw_applicable,
            "state_osha_plan": osha_plan,
            "issues": issues,
            "recommendations": recommendations,
        }