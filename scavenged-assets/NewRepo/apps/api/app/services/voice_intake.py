"""
voice_intake.py — OpenAI Whisper transcription + GPT-4o entity extraction.

Public API:
  transcribe_audio(audio_bytes, content_type) → str
  extract_lead_entities(transcript) → dict
  create_lead_from_transcript(transcript, db) → dict
"""
from __future__ import annotations

import io
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)

_ALLOWED_AUDIO = {
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
    'audio/webm', 'audio/mp4', 'audio/m4a',
}

_EXT_MAP = {
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/webm': 'webm',
    'audio/mp4': 'mp4',
    'audio/m4a': 'm4a',
}


def _openai():
    from ..config import settings  # noqa: PLC0415
    if not settings.openai_api_key:
        raise RuntimeError('OPENAI_API_KEY not configured')
    from openai import OpenAI  # noqa: PLC0415
    return OpenAI(api_key=settings.openai_api_key)


def transcribe_audio(audio_bytes: bytes, content_type: str) -> str:
    """Transcribe audio via OpenAI Whisper. Returns transcript text."""
    client = _openai()
    ext = _EXT_MAP.get(content_type, 'mp3')
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = f'recording.{ext}'
    response = client.audio.transcriptions.create(
        model='whisper-1',
        file=audio_file,
        response_format='text',
    )
    return str(response).strip()


def extract_lead_entities(transcript: str) -> dict:
    """
    Use GPT-4o to extract lead fields from a call transcript.

    Returns: {name, phone, email, address, service_type, urgency, confidence}
    """
    client = _openai()

    system = (
        'You are a lead extraction assistant for J. Worden & Sons Asphalt Paving. '
        'Extract caller information from the transcript and return ONLY valid JSON with '
        'these keys: name (str|null), phone (str|null), email (str|null), '
        'address (str|null), service_type (str|null — one of: driveway_paving, '
        'parking_lot, sealcoating, crack_filling, milling, resurfacing, other), '
        'urgency (str — low/medium/high), confidence (float 0-1). '
        'Return only the JSON object, no markdown fences.'
    )

    response = client.chat.completions.create(
        model='gpt-4o',
        messages=[
            {'role': 'system', 'content': system},
            {'role': 'user', 'content': f'Transcript:\n{transcript}'},
        ],
        max_tokens=300,
        temperature=0,
    )

    text = (response.choices[0].message.content or '').strip()
    if '```' in text:
        text = text.split('```')[1].lstrip('json').strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        logger.warning('entity extraction returned non-JSON: %s', text[:200])
        return {
            'name': None, 'phone': None, 'email': None, 'address': None,
            'service_type': None, 'urgency': 'medium', 'confidence': 0.0,
        }


def create_lead_from_transcript(transcript: str, db) -> dict:
    """Transcribe, extract entities, persist a Lead, and return the result."""
    from ..models import Lead  # noqa: PLC0415

    entities = extract_lead_entities(transcript)

    lead = Lead(
        id=str(uuid.uuid4()),
        name=entities.get('name') or 'Voice Lead',
        phone=entities.get('phone'),
        email=entities.get('email'),
        address=entities.get('address'),
        service_type=entities.get('service_type'),
        urgency=entities.get('urgency', 'medium'),
        source='voice_intake',
        status='new',
        pipeline_stage='new',
        created_at=datetime.now(timezone.utc),
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)

    return {
        'lead_id': lead.id,
        'transcript': transcript,
        'entities': entities,
        'confidence': entities.get('confidence', 0.0),
    }
