"""
Notification stubs for J. Worden & Sons lead pipeline.

Primary email provider: Resend (RESEND_API_KEY + RESEND_FROM_EMAIL)
Fallback provider: SMTP (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD)
"""

from __future__ import annotations

import base64
import json
import logging
import os
import re
import smtplib
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)
_EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')


def _build_email_body(data: dict) -> tuple[str, str]:
    lead_type = data.get('type', 'lead').upper()
    name = data.get('name', 'Unknown')
    score = data.get('score', {})
    label = score.get('label', '—') if isinstance(score, dict) else '—'
    priority = score.get('priority', '—') if isinstance(score, dict) else '—'

    subject = f'[{label}] New {lead_type} – {name} | JWordenAI'
    rows = ''.join(
        f"<tr><td style='padding:6px 12px;font-weight:bold'>{k.replace('_', ' ').title()}</td>"
        f"<td style='padding:6px 12px'>{v}</td></tr>"
        for k, v in data.items()
        if k not in ('type',)
    )

    html = f"""
    <html><body style="font-family:sans-serif;color:#1a1a2e">
      <h2 style="background:#f5a623;padding:16px;color:#1a1a2e;margin:0">
        🏗 New {lead_type} — Priority {priority} ({label})
      </h2>
      <table style="border-collapse:collapse;width:100%;margin-top:12px">
        {rows}
      </table>
      <p style="color:#888;font-size:12px;margin-top:24px">
        J. Worden &amp; Sons Global Platform · Auto-verified via Universal Service Ledger
      </p>
    </body></html>
    """
    return subject, html


def _validate_emails(addresses: list[str]) -> list[str]:
    valid = [e for e in addresses if _EMAIL_RE.match(e)]
    invalid = [e for e in addresses if not _EMAIL_RE.match(e)]
    if invalid:
        logger.warning('Skipping malformed recipient address(es): %s', invalid)
    return valid


def _send_resend(subject: str, html_body: str, to_addresses: list[str], attachments: list[dict] | None = None) -> bool:
    api_key = os.getenv('RESEND_API_KEY', '').strip()
    from_email = os.getenv('RESEND_FROM_EMAIL', '').strip()
    if not (api_key and from_email):
        return False

    to_addresses = _validate_emails(to_addresses)
    if not to_addresses:
        return False

    try:
        import resend  # type: ignore  # noqa: PLC0415

        resend.api_key = api_key
        payload = {
            'from': from_email,
            'to': to_addresses,
            'subject': subject,
            'html': html_body,
        }
        if attachments:
            payload['attachments'] = attachments
        resend.Emails.send(payload)
        logger.info('Email sent via Resend to %s', to_addresses)
        return True
    except Exception as exc:  # noqa: BLE001
        logger.error('Resend send failed: %s', exc)
        return False


def _send_smtp(subject: str, html_body: str, to_addresses: list[str], attachment_bytes: bytes | None = None, attachment_name: str = 'attachment.pdf') -> bool:
    host = os.getenv('SMTP_HOST', '')
    port = int(os.getenv('SMTP_PORT', '587'))
    user = os.getenv('SMTP_USER', '')
    password = os.getenv('SMTP_PASSWORD', '')

    if not (host and user and password):
        logger.info('SMTP not configured – skipping email. subject=%s', subject)
        return False

    to_addresses = _validate_emails(to_addresses)
    if not to_addresses:
        logger.warning('No valid recipient addresses — skipping email')
        return False

    msg = MIMEMultipart('mixed' if attachment_bytes else 'alternative')
    msg['Subject'] = subject
    msg['From'] = user
    msg['To'] = ', '.join(to_addresses)
    msg.attach(MIMEText(html_body, 'html'))

    if attachment_bytes:
        pdf_part = MIMEApplication(attachment_bytes, _subtype='pdf')
        pdf_part.add_header('Content-Disposition', 'attachment', filename=attachment_name)
        msg.attach(pdf_part)

    try:
        with smtplib.SMTP(host, port) as server:
            server.ehlo()
            server.starttls()
            server.login(user, password)
            server.sendmail(user, to_addresses, msg.as_string())
        logger.info('Email sent via SMTP to %s', to_addresses)
        return True
    except Exception as exc:  # noqa: BLE001
        logger.error('Failed to send SMTP email: %s', exc)
        return False


def send_transactional_email(
    *,
    subject: str,
    html_body: str,
    to_addresses: list[str],
    attachment_bytes: bytes | None = None,
    attachment_name: str = 'attachment.pdf',
) -> bool:
    """Send email via Resend first, then fallback to SMTP."""
    resend_attachments = None
    if attachment_bytes:
        resend_attachments = [
            {
                'filename': attachment_name,
                'content': base64.b64encode(attachment_bytes).decode(),
            }
        ]

    if _send_resend(subject, html_body, to_addresses, resend_attachments):
        return True

    return _send_smtp(subject, html_body, to_addresses, attachment_bytes, attachment_name)


def _send_twilio_sms(message: str, to_numbers: list[str]) -> None:
    sid = os.getenv('TWILIO_ACCOUNT_SID', '')
    auth = os.getenv('TWILIO_AUTH_TOKEN', '')
    from_number = os.getenv('TWILIO_FROM_NUMBER', '')

    if not (sid and auth and from_number):
        logger.info('Twilio not configured – skipping SMS. message=%s', message)
        return

    try:
        from twilio.rest import Client  # type: ignore  # noqa: PLC0415

        client = Client(sid, auth)
        for number in to_numbers:
            client.messages.create(body=message, from_=from_number, to=number)
        logger.info('Lead SMS sent to %s', to_numbers)
    except ImportError:
        logger.warning('twilio package not installed – SMS skipped')
    except Exception as exc:  # noqa: BLE001
        logger.error('Failed to send SMS: %s', exc)


COMPANY_EMAIL = 'j.wordenandsonspaving@gmail.com'


def send_lead_notification(data: dict) -> None:
    """Fire-and-forget notification for a new lead or contact form submission."""

    logger.info('NEW LEAD: %s', json.dumps(data, default=str))

    # Always include the company email; merge with any additional addresses from env.
    env_emails = [e.strip() for e in os.getenv('NOTIFY_TO_EMAIL', '').split(',') if e.strip()]
    to_emails = list(dict.fromkeys([COMPANY_EMAIL] + env_emails))  # deduplicated, company first
    to_phones = [p.strip() for p in os.getenv('NOTIFY_TO_PHONE', '').split(',') if p.strip()]

    subject, html_body = _build_email_body(data)

    if to_emails:
        send_transactional_email(subject=subject, html_body=html_body, to_addresses=to_emails)

    if to_phones:
        score = data.get('score', {})
        label = score.get('label', '') if isinstance(score, dict) else ''
        name = data.get('name', 'Someone')
        phone = data.get('phone', 'N/A')
        state_code = str(data.get('state_code') or data.get('state') or '').upper().strip()[:2]

        # Append compact state context: price index + license/wage/OSHA flags
        state_tag = ''
        if state_code:
            try:
                from .state_data import get_price_multiplier  # noqa: PLC0415
                from .ai_brain import _STATE_COMPLIANCE  # noqa: PLC0415
                mult = get_price_multiplier(state_code)
                comp = _STATE_COMPLIANCE.get(state_code)
                if comp is not None:
                    lic, prev_wage, osha_plan, _swppp = comp
                    flags = []
                    if lic: flags.append('LIC')
                    if prev_wage: flags.append('PW')
                    if osha_plan: flags.append('OSHA')
                    flag_str = ('/' + '+'.join(flags)) if flags else ''
                    state_tag = f" | {state_code} {mult:.2f}x{flag_str}"
                else:
                    state_tag = f" | {state_code}"
            except Exception:  # noqa: BLE001
                state_tag = f" | {state_code}"

        sms_body = (
            f"[{label}] New lead: {name} | {phone} | "
            f"{data.get('service_type','contact')} | {data.get('urgency','')}"
            f"{state_tag}"
        )
        _send_twilio_sms(sms_body, to_phones)


def send_safety_alert(crew_name: str, site_name: str, vital_stat: str, vital_value: float, ambient_temp: float) -> None:
    """Send emergency SMS/Email notification for heat stroke / vital threshold breaches."""
    
    subject = f"⚠️ EMERGENCY SAFETY ALERT: {crew_name} @ {site_name}"
    
    html_body = f"""
    <html><body style="font-family:sans-serif;color:#8B0000;background:#FFF0F0;padding:20px;border:4px solid #8B0000">
      <h2 style="margin-top:0">🚨 IMMEDIATE PERSONNEL DANGER</h2>
      <p>A safety threshold has been breached by <b>{crew_name}</b> at <b>{site_name}</b>.</p>
      
      <table style="border-collapse:collapse;width:100%;background:white;border:1px solid #ddd">
        <tr style="border-bottom:1px solid #ddd text-align:left"><th style="padding:10px">Metric</th><th style="padding:10px">Current Reading</th></tr>
        <tr><td style="padding:10px"><b>{vital_stat}</b></td><td style="padding:10px;color:red;font-weight:black">{vital_value}</td></tr>
        <tr><td style="padding:10px"><b>Ambient Temperature</b></td><td style="padding:10px">{ambient_temp}°F</td></tr>
      </table>
      
      <p style="margin-top:20px;font-weight:bold">ACTION REQUIRED: Contact foreman immediately and initiate cooling protocol.</p>
      
      <p style="color:#666;font-size:10px;margin-top:20px">Auto-dispatched via JWordenAI Wearable Link Protection</p>
    </body></html>
    """

    sms_body = (
        f"🚨 SAFETY ALERT: {crew_name} @ {site_name} | "
        f"{vital_stat}: {vital_value} | Amb: {ambient_temp}F | Action Required!"
    )

    env_emails = [e.strip() for e in os.getenv('NOTIFY_TO_EMAIL', '').split(',') if e.strip()]
    to_emails = list(dict.fromkeys([COMPANY_EMAIL] + env_emails))
    to_phones = [p.strip() for p in os.getenv('NOTIFY_TO_PHONE', '').split(',') if p.strip()]

    if to_emails:
        send_transactional_email(subject=subject, html_body=html_body, to_addresses=to_emails)
    
    if to_phones:
        _send_twilio_sms(sms_body, to_phones)
