"""
autonomy_tasks.py — Celery tasks for the Level 4 Autonomous Intelligence Engine

Tasks:
  run_autonomy_audit   — daily scan: executes schedule + safety goals for
                         every active project site, triggers CDT drift check
  run_goal_async       — on-demand background goal execution triggered by
                         the /api/v1/autonomy/goals endpoint (for long goals)
"""

from __future__ import annotations

import logging

from celery import shared_task
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)


@shared_task(
    bind=True,
    name="app.tasks.autonomy_tasks.run_autonomy_audit",
    max_retries=2,
    default_retry_delay=300,
)
def run_autonomy_audit(self, goal_types: list[str] | None = None) -> dict:
    """
    Full-platform autonomy audit.

    For every active ProjectSite:
      1. Run the Cognitive Digital Twin snapshot → log drift
      2. Execute schedule_integrity goal
      3. Execute safety_compliance goal
      4. Execute cost_control goal

    Intended to run daily at 06:00 UTC via Celery beat.
    """
    try:
        from ..database import SessionLocal  # noqa: PLC0415
        from ..models import ProjectSite  # noqa: PLC0415
        from ..services.orchestrator import GoalType, execute_goal  # noqa: PLC0415
        from ..services.cognitive_twin import get_twin_status  # noqa: PLC0415

        db = SessionLocal()
        try:
            active_sites = (
                db.query(ProjectSite)
                .filter(ProjectSite.status == "active")
                .limit(50)
                .all()
            )
        except Exception:  # noqa: BLE001
            # ProjectSite may not have a status column — scan all
            active_sites = db.query(ProjectSite).limit(50).all()

        audit_goals = [
            GoalType.SCHEDULE_INTEGRITY,
            GoalType.SAFETY_COMPLIANCE,
            GoalType.COST_CONTROL,
        ]
        if goal_types:
            try:
                audit_goals = [GoalType(g) for g in goal_types]
            except ValueError as exc:
                logger.warning("Invalid goal_types in audit: %s", exc)

        results = []
        for site in active_sites:
            site_id = str(site.id)
            context = {"project_id": site_id}

            # CDT snapshot
            try:
                twin = get_twin_status(site_id, db)
                drift_sev = twin.get("overall_drift_severity", "NORMAL")
                logger.info("CDT site=%s drift=%s", site_id, drift_sev)
            except Exception as cdt_exc:  # noqa: BLE001
                logger.error("CDT failed for site %s: %s", site_id, cdt_exc)
                drift_sev = "UNKNOWN"

            # Orchestrator goals
            site_results = {"site_id": site_id, "drift_severity": drift_sev, "goals": []}
            for goal_type in audit_goals:
                try:
                    result = execute_goal(goal_type, context, db)
                    site_results["goals"].append({
                        "goal_type": goal_type.value,
                        "status":    result.status,
                        "tasks":     len(result.tasks),
                    })
                except Exception as goal_exc:  # noqa: BLE001
                    logger.error("Goal %s failed for site %s: %s", goal_type.value, site_id, goal_exc)
                    site_results["goals"].append({
                        "goal_type": goal_type.value,
                        "status":    "error",
                        "error":     str(goal_exc),
                    })

            results.append(site_results)

        db.close()
        logger.info("Autonomy audit complete: %d sites scanned", len(active_sites))
        return {"sites_audited": len(active_sites), "results": results}

    except Exception as exc:  # noqa: BLE001
        logger.error("run_autonomy_audit task failed: %s", exc, exc_info=True)
        self.retry(exc=exc)


@shared_task(
    bind=True,
    name="app.tasks.autonomy_tasks.run_goal_async",
    max_retries=1,
    default_retry_delay=60,
)
def run_goal_async(
    self,
    goal_type: str,
    context: dict,
    goal_id_hint: str | None = None,
) -> dict:
    """
    Execute a single goal asynchronously.  Used when the orchestration is
    expected to take > 10 seconds and the caller does not want to block.
    """
    try:
        from ..services.orchestrator import GoalType, execute_goal  # noqa: PLC0415

        result = execute_goal(GoalType(goal_type), context)
        logger.info(
            "Async goal %s (%s) complete: status=%s",
            result.goal_id, goal_type, result.status,
        )
        return result.to_dict()
    except Exception as exc:  # noqa: BLE001
        logger.error("run_goal_async failed: %s", exc, exc_info=True)
        self.retry(exc=exc)
