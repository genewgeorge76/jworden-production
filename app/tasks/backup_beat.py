"""
backup_beat.py — nightly database backup and retention.

Thin wrapper; the logic is in services/db_backup.py so the dump and restore
paths can be tested against a real PostgreSQL server without a broker.

Speaks up on failure. A backup task that fails silently is worse than no
backup task at all, because the schedule existing is what convinces everyone
the problem is handled.
"""

from __future__ import annotations

import logging

from ..celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(
    name="app.tasks.backup_beat.run_nightly_backup",
    bind=False,
    ignore_result=False,
)
def run_nightly_backup() -> dict:
    """Dump the database, verify the stored copy, then prune old ones."""
    from ..services import db_backup  # noqa: PLC0415

    try:
        manifest = db_backup.create_backup()
    except db_backup.BackupError as exc:
        # ERROR rather than a raise: Celery would retry a genuinely broken
        # configuration every few seconds and bury the reason in noise.
        logger.error("BACKUP FAILED — the database was not backed up: %s", exc)
        return {"ok": False, "error": str(exc)}

    result: dict = {"ok": True, "backup": manifest.to_dict()}

    try:
        result["pruned"] = db_backup.prune()
    except db_backup.BackupError as exc:
        # A failed prune is not a failed backup. The new copy is already
        # stored and verified; retention can catch up on the next run.
        logger.warning("Backup retention pass failed: %s", exc)
        result["pruned"] = {"error": str(exc)}

    logger.info(
        "Nightly backup stored %s (%.1f MiB, %d tables verified)",
        manifest.key,
        manifest.size_bytes / 1048576,
        len(manifest.tables),
    )
    return result


@celery_app.task(
    name="app.tasks.backup_beat.check_backup_freshness",
    bind=False,
    ignore_result=False,
)
def check_backup_freshness(max_age_hours: int = 36) -> dict:
    """
    Is there a recent backup at all?

    Separate from the task that takes them on purpose. If `run_nightly_backup`
    stops being scheduled — a broker outage, a beat container that never came
    back, a typo in the schedule — it produces no failures because it produces
    nothing. The only way to notice is to ask the question from the outside.
    """
    from ..services import db_backup  # noqa: PLC0415

    try:
        newest = db_backup.latest()
    except db_backup.BackupError as exc:
        logger.error("Could not check backup freshness: %s", exc)
        return {"ok": False, "error": str(exc)}

    if newest is None:
        logger.error(
            "NO BACKUPS EXIST — nothing has ever been stored for this database."
        )
        return {"ok": False, "reason": "no backups found"}

    age = newest.get("age_hours")
    if age is not None and age > max_age_hours:
        logger.error(
            "STALE BACKUP — the newest copy is %.1f hours old (limit %d). "
            "The backup schedule has stopped running.",
            age,
            max_age_hours,
        )
        return {"ok": False, "reason": "stale", "latest": newest}

    logger.info("Backup freshness OK — newest is %.1f hours old", age or 0.0)
    return {"ok": True, "latest": newest}
