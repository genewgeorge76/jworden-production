"""Async email delivery via Celery — decouples SendGrid from request path."""
from __future__ import annotations

from ..celery_app import celery_app
from ..database import SessionLocal
from ..services.email_service import send_email, log_send


@celery_app.task(
    name='app.tasks.email_tasks.send_email_task',
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    queue='default',
)
def send_email_task(self, to_email: str, subject: str, html_content: str, **kwargs):
    """Send a transactional email with automatic retry on failure."""
    db = SessionLocal()
    try:
        ok = send_email(to_email, subject, html_content, **kwargs)
        log_send(db, to_email, subject, ok)
        if not ok:
            raise self.retry(exc=RuntimeError('SendGrid delivery failed'))
        return {'sent': True, 'to': to_email}
    except Exception as exc:
        db.rollback()
        raise self.retry(exc=exc)
    finally:
        db.close()
