"""
anomaly_beat.py — Celery beat task for continuous anomaly detection.

Runs every 30 minutes to scan key business metrics for statistical irregularities:
  - Lead volume (24h vs 7-day rolling average)
  - HOT lead rate (should be 20-40% of total)
  - COOL lead surge (bad AI Max targeting signal)
  - Zero lead gap during business hours (possible site/form outage)

Results are persisted to the anomaly_alerts table with deduplication
(same metric is not re-alerted within a 2-hour window).

Registration
────────────
This module is listed in celery_app.include, and the beat schedule entry
is defined in celery_app.CELERYBEAT_SCHEDULE:

    "anomaly-scan-every-30m": {
        "task": "app.tasks.anomaly_beat.run_anomaly_scan_task",
        "schedule": crontab(minute="*/30"),
    }
"""

from __future__ import annotations

import logging

from ..celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(
    name="app.tasks.anomaly_beat.run_anomaly_scan_task",
    bind=False,
    ignore_result=False,
)
def run_anomaly_scan_task() -> dict:
    """
    Celery beat task: run full anomaly scan and persist any new alerts.

    Returns a summary dict logged to the Celery result backend:
      {checks_run, anomalies_found, new_alerts_written}
    """
    from ..database import SessionLocal  # noqa: PLC0415
    from ..services.anomaly_detector import persist_anomalies, run_all_checks  # noqa: PLC0415

    db = SessionLocal()
    try:
        results = run_all_checks(db)
        written = persist_anomalies(db, results)
        logger.info(
            "Anomaly scan complete: %d detected, %d new alerts persisted.",
            len(results), written,
        )
        return {
            "checks_run": 4,
            "anomalies_found": len(results),
            "new_alerts_written": written,
        }
    except Exception as exc:  # noqa: BLE001
        logger.error("Anomaly beat task failed: %s", exc)
        return {"error": str(exc)}
    finally:
        db.close()
