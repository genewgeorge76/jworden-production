import base64
import logging
import time

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..config import settings
from ..core.limiter import AI_LIMIT, limiter
from ..database import get_db
from ..services.ai_engine import ask_jarvis, score_bid
from ..services import llm_client as _llm
from ..services.conversation_memory import (
    append_message, get_history, get_or_create_session,
)
from ..services.rag_service import build_rag_system_prompt

logger = logging.getLogger(__name__)

router = APIRouter(prefix='/ai', tags=['ai'])

_ALLOWED_MIME = {'image/jpeg', 'image/png', 'image/webp', 'image/gif'}
_MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


class JarvisRequest(BaseModel):
    messages: list[dict]
    field_mode: bool = False
    session_id: str | None = None      # omit for a new session
    state_code: str | None = None      # 2-letter state code for RAG jurisdiction context


class BidScoreRequest(BaseModel):
    rfp_title: str
    rfp_text: str


@router.post('/jarvis')
@limiter.limit(AI_LIMIT)
async def jarvis_endpoint(request: Request, body: JarvisRequest, db: Session = Depends(get_db)):
    providers = _llm.provider_status()
    if not any(providers.values()):
        raise HTTPException(503, 'AI not configured — set ANTHROPIC_API_KEY, OPENAI_API_KEY, or another provider key')

    # Resolve or create session
    session_id = get_or_create_session(db, body.session_id, context='jarvis')

    # Prepend history to messages so Jarvis has full context
    history = get_history(db, session_id, limit=20)
    hydrated_messages = history + body.messages

    # Persist incoming user turn(s)
    user_question = ''
    for msg in body.messages:
        if msg.get('role') == 'user':
            text = msg.get('content', '')
            append_message(db, session_id, 'user', text)
            user_question = text  # last user message is the question for RAG

    # Build RAG-augmented system prompt
    rag_system = build_rag_system_prompt(user_question, body.state_code)

    result = await ask_jarvis(hydrated_messages, body.field_mode, system_override=rag_system)
    reply = result.text or '[Jarvis is unavailable — configure a provider API key in Railway → Variables]'

    # Persist assistant reply
    append_message(db, session_id, 'assistant', reply)

    return {
        'reply': reply,
        'session_id': session_id,
        'provider': result.provider,
        'model': result.model,
        'fallback_used': result.fallback_used,
    }


@router.post('/bid-score')
@limiter.limit(AI_LIMIT)
async def bid_score_endpoint(request: Request, body: BidScoreRequest):
    result = await score_bid(body.rfp_title, body.rfp_text)
    return result


# ── GPT-4o Vision Photo Inspector ─────────────────────────────────────────────

def _stub_analysis() -> dict:
    return {
        'damage_detected': True,
        'severity': 'moderate',
        'findings': [
            {'type': 'longitudinal_cracking', 'coverage_pct': 12, 'urgency': 'address within 6 months'},
            {'type': 'surface_oxidation', 'coverage_pct': 35, 'urgency': 'sealcoating recommended this season'},
        ],
        'recommended_services': ['crack_filling', 'sealcoating'],
        'estimated_lifespan_years': 3,
        'notes': 'Set OPENAI_API_KEY to enable real vision-based analysis. This is a demonstration response.',
        'engine': 'stub',
    }


def _openai_analysis(image_bytes: bytes, mime_type: str) -> dict:
    import json

    from openai import OpenAI

    client = OpenAI(api_key=settings.openai_api_key)

    b64 = base64.b64encode(image_bytes).decode()
    data_url = f'data:{mime_type};base64,{b64}'

    t0 = time.monotonic()
    response = client.chat.completions.create(
        model='gpt-4o',
        messages=[
            {
                'role': 'system',
                'content': (
                    'You are an expert asphalt inspector. Analyze the provided image and '
                    'return a JSON object with: damage_detected (bool), severity '
                    '(none/minor/moderate/severe), findings (list of {type, coverage_pct, urgency}), '
                    'recommended_services (list), estimated_lifespan_years (int), notes (str). '
                    'Return only valid JSON, no markdown fences.'
                ),
            },
            {
                'role': 'user',
                'content': [
                    {'type': 'image_url', 'image_url': {'url': data_url}},
                    {'type': 'text', 'text': 'Inspect this asphalt surface and return your assessment.'},
                ],
            },
        ],
        max_tokens=600,
        timeout=30,
    )
    latency_ms = round((time.monotonic() - t0) * 1000, 2)

    text = response.choices[0].message.content or ''
    if '```' in text:
        text = text.split('```')[1].lstrip('json').strip()

    try:
        result = json.loads(text)
    except Exception:
        logger.warning('GPT-4o returned non-JSON vision response: %s', text[:300])
        result = _stub_analysis()
        result['engine'] = 'stub_fallback'
        result['error'] = 'model returned non-JSON'
        return result

    result['engine'] = 'gpt-4o'
    result['latency_ms'] = latency_ms
    return result


@router.post('/photo-inspect', summary='AI asphalt damage assessment from photo')
@limiter.limit(AI_LIMIT)
async def photo_inspect(
    request: Request,
    file: UploadFile = File(...),
):
    if file.content_type not in _ALLOWED_MIME:
        raise HTTPException(
            415,
            f'Unsupported file type. Allowed: {", ".join(_ALLOWED_MIME)}',
        )

    image_bytes = await file.read()
    if len(image_bytes) > _MAX_SIZE_BYTES:
        raise HTTPException(413, 'Image exceeds 10 MB limit')

    if settings.openai_api_key:
        try:
            analysis = await run_in_threadpool(_openai_analysis, image_bytes, file.content_type)
        except Exception as exc:
            logger.error('OpenAI vision analysis failed: %s', exc)
            raise HTTPException(503, f'Vision analysis unavailable: {exc}') from exc
    else:
        analysis = _stub_analysis()

    return analysis
