"""Celery application factory — Redis broker, Beat schedule."""
from __future__ import annotations

from celery import Celery
from celery.schedules import crontab

from .config import settings

celery_app = Celery(
    'worden',
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=[
        'app.tasks.email_tasks',
        'app.tasks.vdot_scraper',
        'app.tasks.permit_scraper',
        'app.tasks.cache_warmer',
        'app.tasks.vector_tasks',
        'app.tasks.scan_tasks',
        'app.tasks.heartbeat',
    ],
)

celery_app.conf.update(
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    timezone='America/New_York',
    enable_utc=True,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    result_expires=3600,
    worker_concurrency=4,
    task_always_eager=settings.celery_always_eager,
)

celery_app.conf.beat_schedule = {
    # VDOT bid scraper — daily at 07:00 ET
    'scrape-vdot-bids-daily': {
        'task': 'app.tasks.vdot_scraper.scrape_vdot_bids_task',
        'schedule': crontab(hour=7, minute=0),
        'options': {'queue': 'scrapers'},
    },
    # Virginia permit scraper — every 6 hours
    'scrape-permits-6h': {
        'task': 'app.tasks.permit_scraper.scrape_permits_task',
        'schedule': crontab(minute=0, hour='*/6'),
        'options': {'queue': 'scrapers'},
    },
    # Cache warmer — every 5 minutes
    'warm-cache-5m': {
        'task': 'app.tasks.cache_warmer.warm_cache_task',
        'schedule': 300.0,
        'options': {'queue': 'housekeeping'},
    },
    # Vector reindex — every Sunday at 02:00
    'reindex-vectors-weekly': {
        'task': 'app.tasks.vector_tasks.reindex_all_task',
        'schedule': crontab(hour=2, minute=0, day_of_week='sunday'),
        'options': {'queue': 'ai'},
    },
    # Daily heartbeat — 06:30 ET, proves the system is alive (anti-silent-stall)
    'daily-heartbeat': {
        'task': 'app.tasks.heartbeat.daily_heartbeat_task',
        'schedule': crontab(hour=6, minute=30),
        'options': {'queue': 'housekeeping'},
    },
}
