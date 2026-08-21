"""
site_health_beat.py — Hourly check that each published domain serves the site.

Thin wrapper; the logic is in services/site_health.py so it can be tested
without a broker.

Speaks only on a transition. A task that reports the same critical finding
every hour is a task people filter out, and the finding that mattered here —
a primary domain quietly replaced by an advertising parking page — is exactly
the one that must not arrive as routine noise.
"""

from __future__ import annotations

import asyncio
import logging

from ..celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(
    name="app.tasks.site_health_beat.check_published_sites",
    bind=False,
    ignore_result=False,
)
def check_published_sites() -> dict:
    from ..database import SessionLocal  # noqa: PLC0415
    from ..services import site_health  # noqa: PLC0415

    db = SessionLocal()
    try:
        result = asyncio.run(site_health.check_all())
        changes = site_health.persist(db, result["reports"])

        for line in changes["degraded"]:
            logger.error("Site health DEGRADED — %s", line)
        for line in changes["recovered"]:
            logger.info("Site health recovered — %s", line)
        if not changes["degraded"] and not changes["recovered"]:
            logger.info(
                "Site health steady: %s critical, %s warning, %s ok",
                result["critical"], result["warning"], result["ok"],
            )

        return {
            "domains_checked": result["domains_checked"],
            "critical": result["critical"],
            "warning": result["warning"],
            "not_serving_the_site": result["not_serving_the_site"],
            "changes": changes,
        }
    except Exception as exc:  # noqa: BLE001
        logger.error("Site health check failed: %s", exc)
        return {"error": str(exc)}
    finally:
        db.close()
