"""
pci_degradation_matrix.py — ASTM D6433 PCI calculation.

This ability previously advertised "strict ASTM D6433 logic" while generating
its distress deducts with `random.uniform(5.0, 35.0)` and `random.choice`,
then printed "Simulating Optical Distress Analysis... SUCCESS" and returned the
result as a Pavement Condition Index. Every call produced a different score for
the same pavement, and a PCI is a figure that goes into reserve studies and
gets checked by the other side's engineer.

It now computes the real thing from real inputs, and refuses when it has none.
The arithmetic lives in `app.services.pavement_lifespan`, which is the same
code path the /api/v1/lifespan endpoints use, so an ability and an API call
cannot disagree about the same pavement.
"""

import logging
from typing import Any

logger = logging.getLogger(__name__)


class PciDegradationMatrixEngine:
    """
    Compute PCI (ASTM D6433) from surveyed distress deduct values.

    Expects params:
      deduct_values           list[float] — read from the D6433 distress curves
      corrected_deduct_value  float|None  — CDV from the correction curves

    With no deduct values it returns `status: "no_data"` and explains what a
    survey has to supply. There is no fallback score: the honest answer to
    "what is the PCI?" with nothing measured is that nobody knows yet.
    """

    def __init__(self) -> None:
        self.module_id = "pci_degradation_matrix"

    def execute(self, params: dict | None = None) -> dict[str, Any]:
        params = params or {}
        raw = params.get("deduct_values") or params.get("deducts") or []
        try:
            deducts = [float(d) for d in raw]
        except (TypeError, ValueError):
            return self._no_data("deduct_values must be numbers read from the D6433 curves.")

        if not deducts:
            return self._no_data(
                "No distress survey supplied. A PCI needs deduct values read from the "
                "ASTM D6433 distress curves for each distress type, severity and density."
            )

        from app.services.pavement_lifespan import pci_from_deduct_values

        cdv = params.get("corrected_deduct_value")
        result = pci_from_deduct_values(deducts, float(cdv) if cdv is not None else None)

        headline = (
            f"PCI {result.pci} / 100 ({result.rating})"
            if result.corrected
            else f"PCI {result.pci} / 100 ({result.rating}) — UNCORRECTED, indicative only"
        )
        assessment = (
            "ASTM D6433 PAVEMENT CONDITION INDEX\n"
            f"-> Deduct values supplied: {len(deducts)}\n"
            f"-> Allowable deduct count m: {result.allowable_deduct_count}\n"
            f"-> Reduced deducts: {result.reduced_deduct_values}\n"
            f"-> Total deduct value: {result.total_deduct_value}\n"
            f"-> {headline}\n"
            f"NOTE: {result.note}"
        )

        return {
            "status": result.rating,
            "engine": "PciDegradationMatrixEngine",
            "standard": "ASTM D6433",
            "assessment": assessment,
            "metrics": {
                "pci_score": result.pci,
                "rating": result.rating,
                "corrected": result.corrected,
                "total_deduct": result.total_deduct_value,
                "allowable_deduct_count_m": result.allowable_deduct_count,
            },
        }

    @staticmethod
    def _no_data(reason: str) -> dict[str, Any]:
        return {
            "status": "no_data",
            "engine": "PciDegradationMatrixEngine",
            "standard": "ASTM D6433",
            "assessment": f"PCI not computed. {reason}",
            "metrics": {"pci_score": None, "rating": None, "corrected": False},
        }
