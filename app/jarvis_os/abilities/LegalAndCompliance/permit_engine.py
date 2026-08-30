"""
Permit triggers and county fees, delegated to the real permit engine.

This module used to manufacture its answer with `random`, and its description
claimed it scraped municipal endpoints for right-of-way and excavation permits
based on property bounds. It scraped nothing. The registry gated it, so it
refused rather than answered.

`app/services/permit_engine.py` answers a narrower question than the old
description promised, and answers it for real: which permits a project triggers
under state building code (VA, NC, SC, GA, MD), with county rules overriding
state where local authorities differ, plus the fee schedule. It is a codified
rules engine, not a scraper — there is no live municipal polling here, and the
description has been rewritten to stop implying otherwise.
"""

from __future__ import annotations

import logging
from typing import Any

from app.services.permit_engine import engine as _permit_engine

logger = logging.getLogger(__name__)


class PermitEngine:
    """Permit trigger and county fee lookup for a state / county / project."""

    #: States the underlying rules engine actually covers.
    SUPPORTED_STATES = ("VA", "NC", "SC", "GA", "MD")

    def __init__(self) -> None:
        self.module_id = "permit_engine"

    def execute(self, params: dict | None = None) -> dict[str, Any]:
        params = params or {}

        state_code = (params.get("state_code") or params.get("state") or "").strip().upper()
        if not state_code:
            return {
                "ok": False,
                "error": (
                    "permit_engine requires 'state_code' (one of "
                    f"{', '.join(self.SUPPORTED_STATES)}). Permit triggers are "
                    "jurisdictional; there is no national default."
                ),
            }
        if state_code not in self.SUPPORTED_STATES:
            # Say what is missing rather than returning state-level guesses for
            # a state whose code was never loaded.
            return {
                "ok": False,
                "error": (
                    f"permit_engine has no rules for '{state_code}'. Covered: "
                    f"{', '.join(self.SUPPORTED_STATES)}."
                ),
            }

        try:
            return _permit_engine.get_permit_info(
                state_code,
                county_name=params.get("county_name") or params.get("county"),
                project_cost=float(params.get("project_cost", 0.0) or 0.0),
                structure_size=float(params.get("structure_size", 0.0) or 0.0),
            )
        except (TypeError, ValueError) as exc:
            return {"ok": False, "error": f"permit_engine: bad parameter — {exc}"}
