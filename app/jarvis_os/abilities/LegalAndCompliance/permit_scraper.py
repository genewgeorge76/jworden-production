"""
Open-permit lead discovery, delegated to the real Virginia permit sources.

This module used to manufacture its answer with `random` while describing
itself as a "Headless Browser Simulation Engine" scraping municipal endpoints
across Richmond, Henrico and Chesterfield. It ran no browser and contacted no
municipality. The registry gated it, so it refused rather than answered.

`app/services/permit_scraper.py` queries real sources: Virginia Permit
Transparency (permits.virginia.gov) for permits matching a keyword, Virginia
DEQ PEEP for active Stormwater Construction General Permits — a reliable
precursor for large site work — and the DPOR licence lookup. Coverage is
Virginia, not "the target region"; the description has been corrected.
"""

from __future__ import annotations

import logging
from typing import Any

from app.services import permit_scraper as _scraper

logger = logging.getLogger(__name__)


class PermitScraperEngine:
    """Open permit leads from Virginia VPT, DEQ PEEP, and DPOR."""

    SOURCES = ("vpt", "deq", "dpor")

    def __init__(self) -> None:
        self.module_id = "permit_scraper"

    def execute(self, params: dict | None = None) -> dict[str, Any]:
        params = params or {}

        source = (params.get("source") or "vpt").strip().lower()
        if source not in self.SOURCES:
            return {
                "ok": False,
                "error": f"permit_scraper: unknown source '{source}'. One of: {', '.join(self.SOURCES)}.",
            }

        try:
            max_results = int(params.get("max_results", 50))
        except (TypeError, ValueError):
            return {"ok": False, "error": "permit_scraper: 'max_results' must be an integer."}

        try:
            if source == "vpt":
                permits = _scraper.fetch_vpt_permits(
                    keyword=params.get("keyword", "paving"),
                    max_results=max_results,
                )
                return {"ok": True, "source": "vpt", "count": len(permits), "permits": permits}

            if source == "deq":
                permits = _scraper.fetch_deq_permits(max_results=max_results)
                return {"ok": True, "source": "deq", "count": len(permits), "permits": permits}

            license_number = params.get("license_number")
            address = params.get("address")
            if not license_number and not address:
                return {
                    "ok": False,
                    "error": "permit_scraper: source 'dpor' needs 'license_number' or 'address'.",
                }
            return {
                "ok": True,
                "source": "dpor",
                "result": _scraper.lookup_dpor_license(
                    license_number=license_number,
                    address=address,
                ),
            }
        except Exception as exc:  # noqa: BLE001 — upstream is network I/O
            logger.warning("permit_scraper (%s) failed: %s", source, exc)
            return {"ok": False, "source": source, "error": f"upstream lookup failed: {exc}"}
