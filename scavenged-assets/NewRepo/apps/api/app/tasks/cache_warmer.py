"""Cache warmer task — pre-populates Redis with hot KPI data every 5 minutes."""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

from ..celery_app import celery_app
from ..core.cache import cache_set
from ..database import SessionLocal
from ..models import Lead, Job, CashFlowEntry

log = logging.getLogger(__name__)

_TTL = 300  # 5-minute TTL matches the task interval


@celery_app.task(
    name='app.tasks.cache_warmer.warm_cache_task',
    queue='housekeeping',
)
def warm_cache_task():
    """Pre-compute and cache lead/job/cashflow summaries for dashboard endpoints."""
    db = SessionLocal()
    try:
        leads_total = db.query(Lead).count()
        new_leads = db.query(Lead).filter(Lead.pipeline_stage == 'new').count()
        jobs_total = db.query(Job).count()
        active_jobs = db.query(Job).filter(Job.status.in_(['In Progress', 'Assigned'])).count()

        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_inflow = (
            db.query(CashFlowEntry)
            .filter(
                CashFlowEntry.is_actual.is_(True),
                CashFlowEntry.week_start >= month_start,
                CashFlowEntry.amount > 0,
            )
            .all()
        )
        inflow_sum = sum(e.amount for e in month_inflow)

        summary = {
            'leads_total': leads_total,
            'new_leads': new_leads,
            'jobs_total': jobs_total,
            'active_jobs': active_jobs,
            'mtd_inflow': inflow_sum,
            'warmed_at': now.isoformat(),
        }
        cache_set('dashboard:summary', json.dumps(summary), ttl=_TTL)
        log.info('Cache warmed: %s', summary)
        return summary
    except Exception as exc:
        log.error('Cache warm failed: %s', exc)
        raise
    finally:
        db.close()
