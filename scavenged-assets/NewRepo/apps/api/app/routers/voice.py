"""
voice.py — Twilio voice intake router.

Routes (under /api/v1/voice):
  POST /upload           upload audio file for transcription + lead creation
  POST /twilio/webhook   TwiML inbound call handler (signature-validated)
  POST /twilio/recording Twilio recording callback (SSRF-protected, signature-validated)
"""
from __future__ import annotations

import hashlib
import hmac
import base64
import logging
import re

import httpx
from fastapi import APIRouter, Depends, File, Header, HTTPException, Request, UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session

from ..core.limiter import VOICE_LIMIT, limiter
from ..core.security import verify_premium_security
from ..database import get_db
from ..services.voice_intake import (
    _ALLOWED_AUDIO,
    create_lead_from_transcript,
    transcribe_audio,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix='/voice', tags=['voice'])

_MAX_BYTES = 25 * 1024 * 1024  # 25 MB
_RECORDING_SID_RE = re.compile(r'^RE[0-9a-f]{32}$')


def _verify_twilio_signature(
    auth_token: str,
    url: str,
    params: dict,
    signature: str,
) -> bool:
    """Validate X-Twilio-Signature per https://www.twilio.com/docs/usage/webhooks/webhooks-security."""
    s = url + ''.join(f'{k}{v}' for k, v in sorted(params.items()))
    expected = base64.b64encode(
        hmac.new(auth_token.encode('utf-8'), s.encode('utf-8'), hashlib.sha1).digest()
    ).decode()
    return hmac.compare_digest(expected, signature)


@router.post('/upload', summary='Upload audio for transcription and lead creation')
@limiter.limit(VOICE_LIMIT)
async def transcribe_upload(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    if file.content_type not in _ALLOWED_AUDIO:
        raise HTTPException(415, f'Unsupported audio type. Allowed: {", ".join(_ALLOWED_AUDIO)}')

    audio_bytes = await file.read()
    if len(audio_bytes) > _MAX_BYTES:
        raise HTTPException(413, 'Audio file exceeds 25 MB limit')

    from ..config import settings  # noqa: PLC0415

    if not settings.openai_api_key:
        raise HTTPException(503, 'OPENAI_API_KEY not configured')

    transcript = transcribe_audio(audio_bytes, file.content_type)
    result = create_lead_from_transcript(transcript, db)
    return result


@router.post('/twilio/webhook', summary='TwiML inbound call handler', response_class=Response)
async def twilio_webhook(
    request: Request,
    x_twilio_signature: str = Header(default='', alias='x-twilio-signature'),
):
    """Returns TwiML to greet the caller, record the message, and thank them."""
    from ..config import settings  # noqa: PLC0415

    # Validate Twilio signature when credentials are configured
    if settings.twilio_auth_token:
        form = await request.form()
        url = str(request.url)
        if not _verify_twilio_signature(settings.twilio_auth_token, url, dict(form), x_twilio_signature):
            raise HTTPException(403, 'Invalid Twilio signature')

    callback_url = f'{request.base_url}api/v1/voice/twilio/recording'
    twiml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<Response>'
        '<Say voice="alice">Thank you for calling J. Worden and Sons Asphalt Paving. '
        'Please leave your name, address, and description of your paving project '
        'after the tone, and we will call you back within 24 hours.</Say>'
        f'<Record maxLength="120" transcribe="false" recordingStatusCallback="{callback_url}" />'
        '<Say voice="alice">Thank you. We look forward to serving you. Goodbye.</Say>'
        '</Response>'
    )
    return Response(content=twiml, media_type='text/xml')


@router.post('/twilio/recording', summary='Twilio recording callback')
async def twilio_recording_callback(
    request: Request,
    x_twilio_signature: str = Header(default='', alias='x-twilio-signature'),
    db: Session = Depends(get_db),
):
    """
    Receives a Twilio recording callback, downloads the audio,
    transcribes it, and creates a lead.

    Security:
    - Twilio signature validated against auth token (forged callbacks rejected).
    - SSRF prevention: RecordingSid validated by regex; URL never taken from request.
    """
    from ..config import settings as _s  # noqa: PLC0415
    form = await request.form()

    if _s.twilio_auth_token:
        url = str(request.url)
        if not _verify_twilio_signature(_s.twilio_auth_token, url, dict(form), x_twilio_signature):
            raise HTTPException(403, 'Invalid Twilio signature')

    recording_sid = form.get('RecordingSid', '')

    if not _RECORDING_SID_RE.match(str(recording_sid)):
        logger.warning('Invalid RecordingSid format: %r', recording_sid)
        raise HTTPException(400, 'Invalid RecordingSid format')

    # Build URL from validated SID only — never use RecordingUrl from the request
    recording_url = f'https://api.twilio.com/2010-04-01/Accounts/{{sid}}/Recordings/{recording_sid}.mp3'

    if not (_s.twilio_account_sid and _s.twilio_auth_token):
        logger.error('Twilio credentials not configured')
        return {'status': 'no_credentials'}

    recording_url = recording_url.replace('{sid}', _s.twilio_account_sid)

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                recording_url,
                auth=(_s.twilio_account_sid, _s.twilio_auth_token),
            )
        resp.raise_for_status()
        audio_bytes = resp.content
    except Exception as exc:
        logger.error('Failed to download Twilio recording %s: %s', recording_sid, exc)
        raise HTTPException(502, 'Could not retrieve recording') from exc

    if not _s.openai_api_key:
        logger.warning('OPENAI_API_KEY not set — skipping transcription for %s', recording_sid)
        return {'status': 'no_openai_key', 'recording_sid': recording_sid}

    result = create_lead_from_transcript(
        transcribe_audio(audio_bytes, 'audio/mpeg'),
        db,
    )
    result['recording_sid'] = recording_sid
    return result
