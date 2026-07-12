"""Daily heartbeat — proves the system is alive and summarizes the last 24 hours.

Direct response to the June 2026 silent-stall incident: if this email stops
arriving, something is down. Sends to settings.heartbeat_email (empty = disabled).
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from ..celery_app import celery_app
from ..config import settings

logger = logging.getLogger(__name__)


def build_heartbeat_summary(db) -> dict:
    """Collect the last-24h vitals. Import-light so it can run without Celery."""
    from ..models import GroundScanReport, Lead, LienCalendarEntry, WorkOrder

    now = datetime.now(timezone.utc)
    day_ago = now - timedelta(hours=24)
    week_out = now + timedelta(days=7)

    leads_24h = db.query(Lead).filter(Lead.created_at >= day_ago).count()
    open_work_orders = db.query(WorkOrder).filter(WorkOrder.status.in_(['pending', 'in_progress'])).count()
    lien_deadlines_7d = (
        db.query(LienCalendarEntry)
        .filter(LienCalendarEntry.lien_filing_deadline.between(now, week_out))
        .count()
    )
    ground_scans_24h = db.query(GroundScanReport).filter(GroundScanReport.created_at >= day_ago).count()

    return {
        'timestamp': now.isoformat(),
        'environment': settings.environment,
        'leads_24h': leads_24h,
        'open_work_orders': open_work_orders,
        'lien_deadlines_next_7d': lien_deadlines_7d,
        'ground_scans_24h': ground_scans_24h,
    }


def send_heartbeat_email(summary: dict) -> bool:
    from ..services.email_service import send_email

    if not settings.heartbeat_email:
        logger.info('heartbeat: no recipient configured, skipping email')
        return False

    warn = ''
    if summary['lien_deadlines_next_7d'] > 0:
        warn = (
            f"<p style='color:#b00'><strong>⚠ {summary['lien_deadlines_next_7d']} lien deadline(s) "
            'inside 7 days — check the Lien Calendar.</strong></p>'
        )

    html = f"""
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
  <h2 style="color:#1a1a2e">✅ Worden OS is alive — daily heartbeat</h2>
  <p style="color:#666">{summary['timestamp']} · env: {summary['environment']}</p>
  {warn}
  <table style="border-collapse:collapse;width:100%">
    <tr><td style="padding:6px 0">New leads (24h)</td><td style="text-align:right"><strong>{summary['leads_24h']}</strong></td></tr>
    <tr><td style="padding:6px 0">Open work orders</td><td style="text-align:right"><strong>{summary['open_work_orders']}</strong></td></tr>
    <tr><td style="padding:6px 0">Lien deadlines (next 7d)</td><td style="text-align:right"><strong>{summary['lien_deadlines_next_7d']}</strong></td></tr>
    <tr><td style="padding:6px 0">Ground scans (24h)</td><td style="text-align:right"><strong>{summary['ground_scans_24h']}</strong></td></tr>
  </table>
  <p style="color:#888;font-size:12px">If this email stops arriving, the system is down — investigate immediately.</p>
</div>"""
    return send_email(
        to_email=settings.heartbeat_email,
        subject=f"Worden OS heartbeat — {summary['leads_24h']} lead(s) in 24h",
        html_content=html,
    )


@celery_app.task(name='app.tasks.heartbeat.daily_heartbeat_task', bind=True, max_retries=2)
def daily_heartbeat_task(self):
    """Beat-scheduled daily heartbeat: collect vitals and email them."""
    from ..database import SessionLocal

    db = SessionLocal()
    try:
        summary = build_heartbeat_summary(db)
        sent = send_heartbeat_email(summary)
        logger.info('heartbeat: summary=%s email_sent=%s', summary, sent)
        return {**summary, 'email_sent': sent}
    except Exception as exc:
        logger.error('heartbeat failed: %s', exc)
        raise self.retry(exc=exc, countdown=300)
    finally:
        db.close()
