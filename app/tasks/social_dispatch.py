"""
social_dispatch.py — Celery beat task that sends scheduled posts.

Thin wrapper. All logic lives in services/social_scheduler.py so it can be
tested without a broker; this module exists to be registered with beat.

Registration
────────────
Listed in celery_app.include, with the beat entry:

    "dispatch-social-posts-every-5m": {
        "task": "app.tasks.social_dispatch.dispatch_due_social_posts",
        "schedule": crontab(minute="*/5"),
    }

Every run stamps scheduler_heartbeats, including runs that publish nothing.
A dispatcher with an empty queue and a dispatcher that is not running look
identical from the outside, and only one of them is fine.
"""

from __future__ import annotations

import asyncio
import logging

from ..celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(
    name="app.tasks.social_dispatch.dispatch_due_social_posts",
    bind=False,
    ignore_result=False,
)
def dispatch_due_social_posts() -> dict:
    from ..database import SessionLocal  # noqa: PLC0415
    from ..services.social_scheduler import (  # noqa: PLC0415
        DISPATCH_TASK,
        dispatch_due,
        record_heartbeat,
    )

    db = SessionLocal()
    try:
        summary = asyncio.run(dispatch_due(db))
        logger.info(
            "Social dispatch: published=%s blocked=%s failed=%s reclaimed=%s",
            summary["published"], summary["blocked"], summary["failed"],
            summary["reclaimed_abandoned"],
        )
        return summary
    except Exception as exc:  # noqa: BLE001
        logger.error("Social dispatch failed: %s", exc)
        # Stamp the failure too. A heartbeat that only records successes
        # cannot distinguish "erroring every run" from "not running at all".
        try:
            record_heartbeat(db, DISPATCH_TASK, status="error", detail=str(exc))
        except Exception:  # noqa: BLE001
            logger.exception("Could not record dispatch heartbeat")
        return {"error": str(exc)}
    finally:
        db.close()
