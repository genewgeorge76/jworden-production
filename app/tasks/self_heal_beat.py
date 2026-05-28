"""
self_heal_beat.py — Celery beat task for continuous self-heal cycles.

Runs on a short cadence (default every 5 minutes) to keep infra and AI runtime
operational with safe in-app recovery actions.
"""

from __future__ import annotations

import logging

from ..celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(
    name="app.tasks.self_heal_beat.run_self_heal_cycle_task",
    bind=False,
    ignore_result=False,
)
def run_self_heal_cycle_task() -> dict:
    """Execute one self-heal monitor cycle and return its status payload."""
    from ..services.self_heal import run_self_heal_cycle  # noqa: PLC0415

    try:
        result = run_self_heal_cycle(trigger="celery-beat")
        logger.info(
            "Self-heal cycle complete: status=%s consecutive_failures=%s",
            result.get("status"),
            result.get("consecutive_failures"),
        )
        return result
    except Exception as exc:  # noqa: BLE001
        logger.error("Self-heal beat task failed: %s", exc, exc_info=True)
        return {"ok": False, "status": "error", "error": str(exc)}
