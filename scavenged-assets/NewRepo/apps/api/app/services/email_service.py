"""SendGrid transactional email service."""
from __future__ import annotations

import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


def _sg_client():
    from ..config import settings
    if not settings.sendgrid_api_key:
        return None
    try:
        from sendgrid import SendGridAPIClient
        return SendGridAPIClient(api_key=settings.sendgrid_api_key)
    except ImportError:
        logger.warning('sendgrid package not installed')
        return None


def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    plain_text: str | None = None,
    from_name: str | None = None,
    reply_to: str | None = None,
) -> bool:
    """Send a transactional email via SendGrid. Returns True on success."""
    from ..config import settings
    client = _sg_client()
    if not client:
        logger.info('SendGrid not configured — email to %s suppressed: %s', to_email, subject)
        return False
    try:
        from sendgrid.helpers.mail import Mail, Email, To, Content, ReplyTo
        from_email = Email(settings.sendgrid_from_email, from_name or 'J. Worden & Sons')
        msg = Mail(
            from_email=from_email,
            to_emails=To(to_email),
            subject=subject,
        )
        msg.content = [Content('text/html', html_content)]
        if plain_text:
            msg.content.insert(0, Content('text/plain', plain_text))
        if reply_to:
            msg.reply_to = ReplyTo(reply_to)
        resp = client.send(msg)
        return resp.status_code in {200, 201, 202}
    except Exception as e:
        logger.error('SendGrid send failed to %s: %s', to_email, e)
        return False


def send_lead_receipt(to_email: str, name: str, service: str) -> bool:
    html = f"""
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
  <h2 style="color:#1a1a2e">Thank you, {name}!</h2>
  <p>We received your request for <strong>{service}</strong>.</p>
  <p>Our team reviews every lead within 1 business hour. We'll reach out by phone first, then email.</p>
  <p style="color:#888;font-size:12px">J. Worden &amp; Sons · Chester, VA · (804) 524-3000</p>
</div>"""
    return send_email(to_email, "We Got Your Request — J. Worden & Sons", html)


def send_proposal_ready(to_email: str, name: str, portal_link: str) -> bool:
    html = f"""
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
  <h2 style="color:#1a1a2e">Your Proposal Is Ready</h2>
  <p>Hi {name}, your project proposal is ready to review.</p>
  <p><a href="{portal_link}" style="background:#f59e0b;color:#000;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:700">View Proposal</a></p>
  <p style="color:#888;font-size:12px">Link expires in 7 days · J. Worden &amp; Sons · Chester, VA</p>
</div>"""
    return send_email(to_email, "Your Proposal from J. Worden & Sons", html)


def send_job_update(to_email: str, name: str, status: str, address: str) -> bool:
    status_msg = {
        'in_progress': 'Work has started at your site.',
        'complete': 'Your project is complete. Thank you for choosing J. Worden & Sons!',
        'paused': "Work has been paused due to weather or scheduling. We'll resume shortly.",
    }.get(status, f'Your job status has been updated to: {status}.')
    html = f"""
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
  <h2 style="color:#1a1a2e">Job Update — {address}</h2>
  <p>Hi {name}, {status_msg}</p>
  <p style="color:#888;font-size:12px">J. Worden &amp; Sons · Chester, VA · (804) 524-3000</p>
</div>"""
    return send_email(to_email, f"Job Update — {address}", html)


def log_send(db, to_email: str, subject: str, success: bool) -> None:
    """Persist an EmailLog record."""
    try:
        from ..models import EmailLog
        log = EmailLog(
            to_email=to_email,
            subject=subject,
            status='sent' if success else 'failed',
            sent_at=datetime.now(timezone.utc) if success else None,
        )
        db.add(log)
        db.commit()
    except Exception as e:
        logger.warning('Failed to log email send: %s', e)
