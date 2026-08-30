"""
An ability that manufactures its answer with `random` must not be callable.

84 of the 109 registered abilities did exactly that, and every one was reachable
through POST /api/v1/abilities/execute. They are not implementations with a
random element — the draw IS the result:

    dot_density_pay_factor       rolls average density, then issues an
                                 UNDER_COMPACTED_PENALTY. A payment decision on
                                 a state DOT job.
    osha_silica_exposure_bot     rolls whether the crew is using water
                                 suppression, then a silica concentration, and
                                 labels it "Massive violation" or "Within
                                 limits". A worker-health exposure reading.
    contractor_ranker            rolls OSHA violations and on-time delivery,
                                 returns APPROVED or PROBATIONARY for a
                                 subcontractor.
    compaction_density_profiler  rolls roller passes, CMV and mat temperature
                                 against a 96% Marshall floor.
    union_prevailing_wage        Davis-Bacon rates, drawn at random.

Because the draw happens per call, the same question returns a different answer
every time, each shaped exactly like a real one. That is worse than a fixed
stub — a constant is eventually noticed by someone who sees it twice.

They are gated rather than deleted: several wrap a real service twin under
app/services/ that does the work properly, and deleting the ability would lose
the registry entry that a future real implementation should occupy.
"""
from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))


def _registry():
    from app.services import os_ability_service

    os_ability_service._shell_check.cache_clear()
    return os_ability_service._load_registry()


def test_no_random_driven_ability_is_marked_implemented():
    """The rule, stated over the whole registry."""
    from app.services.os_ability_service import _source_path, _is_random_simulator

    offenders = []
    for entry in _registry():
        if not entry.get("implemented"):
            continue
        path = _source_path(entry)
        try:
            src = path.read_text(encoding="utf-8")
        except OSError:
            continue
        if _is_random_simulator(src):
            offenders.append(entry["module_id"])

    assert not offenders, (
        "these abilities generate their answer with random and are still "
        "callable:\n  " + "\n  ".join(offenders)
    )


def test_the_named_offenders_are_gated():
    """
    Spot-checks on the ones whose output a person would act on: money, worker
    health, who gets hired, and the compaction standard the company sells.
    """
    gated = {e["module_id"] for e in _registry() if not e.get("implemented")}
    for module_id in (
        "FinanceAndAccounting.dot_density_pay_factor",
        "LegalAndCompliance.osha_silica_exposure_bot",
        "SalesAndEstimation.contractor_ranker",
        "VisionAndIntelligence.compaction_density_profiler",
        "FinanceAndAccounting.union_prevailing_wage",
    ):
        assert module_id in gated, f"{module_id} is still callable"


def test_the_repointed_abilities_delegate_instead_of_rolling():
    """
    permit_engine, permit_scraper and asphalt_thermal left the gated set on
    2026-08-30 by being rewritten as adapters onto their service twin under
    app/services/. They must be implemented AND free of random draws — passing
    only the first half would mean a dice-roller had been un-gated.
    """
    from app.services.os_ability_service import _source_path, _is_random_simulator

    registry = {e["module_id"]: e for e in _registry()}
    for module_id in (
        "LegalAndCompliance.permit_engine",
        "LegalAndCompliance.permit_scraper",
        "OperationalAndDispatch.asphalt_thermal",
    ):
        entry = registry[module_id]
        assert entry.get("implemented"), f"{module_id} should be callable"
        src = _source_path(entry).read_text(encoding="utf-8")
        assert not _is_random_simulator(src), f"{module_id} still rolls dice"
        assert "app.services" in src, (
            f"{module_id} is marked implemented but does not delegate to a service"
        )


def test_a_repointed_ability_refuses_rather_than_defaulting():
    """
    The old modules invented an address, a roller id, a contractor id. The
    adapters must ask instead — a permit answer for the wrong jurisdiction is
    worse than no answer.
    """
    from app.services.os_ability_service import execute_os_ability

    result = execute_os_ability("LegalAndCompliance.permit_engine", {})
    assert result["ok"] is True, "the ability itself should run"
    assert result["result"]["ok"] is False
    assert "state_code" in result["result"]["error"]


def test_the_six_unrepointed_name_twins_stay_gated():
    """
    Each of these shares a module name with a real service that answers a
    DIFFERENT question — contractor_ranker scores bids rather than scraping
    OSHA records, ai_brain is a compliance engine rather than a blueprint
    estimator. Wiring them on the strength of the shared name would make a
    false catalogue entry executable.
    """
    gated = {e["module_id"] for e in _registry() if not e.get("implemented")}
    for module_id in (
        "SalesAndEstimation.contractor_ranker",
        "SalesAndEstimation.ai_brain",
        "SalesAndEstimation.market_intelligence",
        "VisionAndIntelligence.lidar_ingest",
        "VisionAndIntelligence.drone_capture",
        "OperationalAndDispatch.roller_telemetry",
    ):
        assert module_id in gated, (
            f"{module_id} was un-gated, but its service twin answers a "
            f"different question — check the pairing before wiring it"
        )


def test_executing_a_gated_ability_is_refused_with_a_reason():
    from app.services.os_ability_service import execute_os_ability

    result = execute_os_ability("SalesAndEstimation.contractor_ranker", {})
    assert result["ok"] is False
    assert result["implemented"] is False
    assert "random" in result["error"]


def test_detection_reads_code_not_prose():
    """
    Several gated modules now carry docstrings explaining what they used to
    claim. Matching the word "random" in prose would gate the explanation
    rather than the code, which is the same text-vs-AST trap that has come up
    repeatedly in this codebase.
    """
    from app.services.os_ability_service import _is_random_simulator

    prose_only = '''
"""This module used to use random.uniform to invent a density. It no longer does."""
class Thing:
    def execute(self, params=None):
        return {"ok": True, "density": self._measure()}
'''
    assert _is_random_simulator(prose_only) is False

    real_use = '''
import random
class Thing:
    def execute(self, params=None):
        return {"density": random.uniform(89.5, 96.5)}
'''
    assert _is_random_simulator(real_use) is True


def test_the_implemented_count_is_measured_not_asserted():
    """
    The header count has been wrong twice: it read "109 real implementations,
    0 unimplemented" while tenant_isolator was already opted out, and later
    "107" while 84 modules were rolling dice.
    """
    registry = _registry()
    implemented = sum(1 for e in registry if e.get("implemented"))
    source = (REPO_ROOT / "app" / "services" / "os_ability_service.py").read_text(
        encoding="utf-8"
    )
    assert f"{len(registry)} registered   {implemented} real implementations" in source, (
        f"the docstring count disagrees with the registry: measured "
        f"{len(registry)} registered, {implemented} implemented"
    )
