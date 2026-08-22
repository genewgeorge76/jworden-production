"""
lead_qualifier — the registry-facing wrapper.

The qualification logic lives in app/services/lead_qualifier.py. This module
used to hold a second, full copy of it: the same rule table, the same intent
word lists, the same model call, maintained twice.

That is not a theoretical cost. Tonight's provider-router fix — which stopped
a revoked OpenAI key from silently downgrading every inbound lead to the
rule-based score — had to be written into both files. Miss one and half the
lead traffic keeps the old behaviour, with nothing to indicate which half.

So this is now a thin adapter over the one implementation. The registry needs
a class with an `execute(params)` method; everything else is re-exported so
`from ...lead_qualifier import qualify_lead` keeps working for any caller that
already does it.
"""

from app.services.lead_qualifier import (  # noqa: F401  (re-exported surface)
    QualificationResult,
    qualify_lead,
)

__all__ = ["LeadQualifierEngine", "QualificationResult", "qualify_lead"]


class LeadQualifierEngine:
    """Registry entry point: SalesAndEstimation.lead_qualifier."""

    def execute(self, params: dict | None = None) -> dict:
        return qualify_lead(params or {})
