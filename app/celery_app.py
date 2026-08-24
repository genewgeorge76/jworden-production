"""
Celery application factory for JWordenAI background task processing.

Broker: Redis (REDIS_URL env var, defaults to localhost)
Result backend: Redis (same URL)

Workers are started with:
    celery -A app.celery_app worker --loglevel=info --concurrency=4

Periodic tasks (Celery Beat):
    celery -A app.celery_app beat --loglevel=info

Beat schedule (see CELERYBEAT_SCHEDULE below):
  - scrape_virginia_lis  — runs every 6 hours
  - process_vision_queue — runs every 15 minutes
"""

import os

from celery import Celery
from celery.schedules import crontab

_BROKER_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", _BROKER_URL)

celery_app = Celery(
    "jworden_tasks",
    broker=_BROKER_URL,
    backend=_RESULT_BACKEND,
    include=[
        "app.tasks.scraper",
        "app.tasks.vision",
        "app.tasks.cache_warmer",
        "app.tasks.email_tasks",
        "app.tasks.vector_tasks",
        "app.tasks.anomaly_beat",
        "app.tasks.vdot_scraper",
        "app.tasks.autonomy_tasks",
        "app.tasks.self_heal_beat",
        "app.tasks.voice_events",
        "app.tasks.social_dispatch",
        "app.tasks.site_health_beat",
        "app.tasks.backup_beat",
        "app.tasks.follow_up_beat",
        # Without this the beat entry below schedules a task the worker has
        # never imported, and every firing dies as "Received unregistered
        # task" in the worker log while the schedule looks perfectly healthy.
        "app.tasks.mailbox_beat",
    ],
)

celery_app.conf.update(
    # Serialization
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    # Timezone
    timezone="America/New_York",
    enable_utc=True,
    # Retries
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    # Result expiry — keep results for 1 hour (dashboard polling)
    result_expires=3600,
    # Beat schedule — long-running periodic tasks
    beat_schedule={
        "scrape-virginia-lis-every-6h": {
            "task": "app.tasks.scraper.scrape_virginia_lis",
            "schedule": crontab(minute=0, hour="*/6"),
            "kwargs": {"max_pages": 10},
        },
        "process-vision-queue-every-15m": {
            "task": "app.tasks.vision.process_vision_batch",
            "schedule": crontab(minute="*/15"),
            "kwargs": {"batch_size": 20},
        },
        # Pre-load hot data into Redis every 5 minutes.
        # Keeps analytics, KPI wall, and CRM lead caches warm so the first
        # request after a TTL expiry is served from Redis, not the database.
        # One window of each connected mailbox per hour. Hourly rather than
        # continuous on purpose: a decade of mail is not urgent, and a gentle
        # cadence keeps well inside Gmail's per-user quota with four or five
        # mailboxes connected at once.
        "scan-mailboxes-hourly": {
            "task": "app.tasks.mailbox_beat.scan_connected_mailboxes",
            "schedule": crontab(minute=17),
        },
        "warm-cache-every-5m": {
            "task": "app.tasks.cache_warmer.warm_cache_task",
            "schedule": crontab(minute="*/5"),
        },
        # Self-heal monitor loop — checks DB/Redis health and runs safe
        # recovery actions (cache warm, table verify, freeze on sustained failure).
        "self-heal-cycle-every-5m": {
            "task": "app.tasks.self_heal_beat.run_self_heal_cycle_task",
            "schedule": crontab(minute="*/5"),
        },
        # Continuous anomaly detection — scans lead volume, HOT rate, COOL surge,
        # and zero-lead gap every 30 minutes during all hours.
        # Scheduled social posts. Every run stamps scheduler_heartbeats, even
        # when nothing is due — an idle dispatcher and a dead one are
        # indistinguishable without it.
        "dispatch-social-posts-every-5m": {
            "task": "app.tasks.social_dispatch.dispatch_due_social_posts",
            "schedule": crontab(minute="*/5"),
        },
        # Does each published domain actually serve the site? Hourly, because
        # a domain can be replaced by a parking page between deploys and the
        # status code will not change when it happens.
        # Nightly database backup at 07:30 UTC — after the VDOT scrape at
        # 07:00 so a failed scrape does not delay the backup, and before the
        # working day in Virginia so the dump reflects a settled database.
        # Lead follow-up. These three ran on a second Celery app that no
        # process starts, so the pipeline had never fired: a HOT lead going
        # uncontacted past its SLA was supposed to raise a notification and
        # never once did. Registered here, on the app beat actually runs.
        "check-hot-leads": {
            "task": "app.tasks.follow_up_beat.check_hot_leads",
            "schedule": crontab(minute="*/15"),
        },
        "check-warm-leads": {
            "task": "app.tasks.follow_up_beat.check_warm_leads",
            "schedule": crontab(minute="*/15"),
        },
        "check-cool-leads": {
            "task": "app.tasks.follow_up_beat.check_cool_leads",
            "schedule": crontab(minute="*/15"),
        },
        "database-backup-nightly": {
            "task": "app.tasks.backup_beat.run_nightly_backup",
            "schedule": crontab(minute=30, hour=7),
        },
        # Asks whether a recent backup exists, which the backup task itself
        # cannot answer: a schedule that stopped firing reports no failures
        # because it reports nothing.
        "backup-freshness-check": {
            "task": "app.tasks.backup_beat.check_backup_freshness",
            "schedule": crontab(minute=0, hour=13),
        },
        "check-published-sites-hourly": {
            "task": "app.tasks.site_health_beat.check_published_sites",
            "schedule": crontab(minute=17),
        },
        "anomaly-scan-every-30m": {
            "task": "app.tasks.anomaly_beat.run_anomaly_scan_task",
            "schedule": crontab(minute="*/30"),
        },
        # VDOT bid board — scrape daily at 07:00 UTC before business hours EST
        "scrape-vdot-bids-daily": {
            "task": "app.tasks.vdot_scraper.scrape_vdot_bids_task",
            "schedule": crontab(minute=0, hour=7),
            "kwargs": {"max_results": 100},
        },
        # Autonomy audit — daily at 06:00 UTC, before VDOT scrape
        "run-autonomy-audit-daily": {
            "task": "app.tasks.autonomy_tasks.run_autonomy_audit",
            "schedule": crontab(minute=0, hour=6),
        },
    },
)
