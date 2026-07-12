"""
seo.py — AI SEO engine + public concierge endpoints.

Routes (under /api/v1/seo):
  POST /city-proof          Gemini-powered per-city authority content
  GET  /serviceability      Virginia ZIP/city serviceability check
  POST /estimate            Public ballpark estimator
  POST /concierge           Mr. Worden public concierge (rate-limited, no auth)
  GET  /features            Which SEO features are enabled by license tier

Requires auth (X-Master-Key) for /city-proof (admin/build-time use).
/concierge and /serviceability are public (no auth, rate-limited).
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from ..core.limiter import AI_LIMIT, LEADS_LIMIT, limiter
from ..core.security import verify_premium_security
from ..services import llm_client as _llm
from ..services import ai_foreman as _foreman
from ..services import proof_pack as _pack
from ..services import runtime_config as _cfg
from ..services import search_pulse as _pulse

logger = logging.getLogger(__name__)

router = APIRouter(prefix='/seo', tags=['seo'])


# ── Request/response models ───────────────────────────────────────────────────

class CityProofRequest(BaseModel):
    city_name: str
    state: str | None = None
    equipment_used: list[str] = []
    project_type: str = "commercial parking lot repaving"
    tenant: str = "jworden"


class EstimateRequest(BaseModel):
    service_type: str
    property_type: str = "residential"
    sqft: float | None = None


class ConciergeRequest(BaseModel):
    messages: list[dict]               # [{"role": "user"|"assistant", "content": str}]
    zip_code: str | None = None
    city: str | None = None
    state_code: str | None = None


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post('/city-proof', summary='Generate AI city authority content (Gemini → GPT-4o fallback)')
@limiter.limit(AI_LIMIT)
async def city_proof(
    request: Request,
    body: CityProofRequest,
    _: dict = Depends(verify_premium_security),
):
    """
    Generates a 3-sentence technical proof statement for a city page.
    Primary: Gemini 2.5 Flash. Fallback: GPT-4o.
    """
    try:
        proof = _foreman.generate_city_proof(
            city_name=body.city_name,
            equipment_used=body.equipment_used,
            project_type=body.project_type,
            tenant=body.tenant,
            state=body.state,
        )
        return {
            "text":          proof.text,
            "city":          proof.city,
            "tenant":        proof.tenant,
            "provider":      proof.provider,
            "model":         proof.model,
            "fallback_used": proof.fallback_used,
            "latency_ms":    proof.latency_ms,
        }
    except RuntimeError as exc:
        raise HTTPException(503, str(exc)) from exc


@router.get('/serviceability', summary='Virginia ZIP/city serviceability check')
async def serviceability(zip_code: str | None = None, city: str | None = None):
    """Public endpoint — no auth required. Always defaults to serviceable when uncertain."""
    return _pack.check_virginia_serviceability(zip_code, city)


@router.post('/estimate', summary='Public ballpark cost estimator')
@limiter.limit(LEADS_LIMIT)
async def ballpark_estimate(request: Request, body: EstimateRequest):
    """Returns a public-safe price range. Never exposes margins or vendor costs."""
    return _pack.get_ballpark_estimate(body.service_type, body.property_type, body.sqft)


@router.post('/concierge', summary='Mr. Worden public concierge (AI chat)')
@limiter.limit(AI_LIMIT)
async def concierge(request: Request, body: ConciergeRequest):
    """
    Public-facing Mr. Worden concierge. No auth required. Rate-limited.
    Uses proof_pack system prompt — safe for external visitors.
    """
    providers = _llm.provider_status()
    if not any(providers.values()):
        raise HTTPException(503, 'Concierge AI not configured — set ANTHROPIC_API_KEY or another provider key')

    # Extract last user message + history
    history: list[dict] = []
    user_msg: str = ''
    for m in body.messages:
        role = m.get('role', '')
        content = m.get('content', '')
        if role in ('user', 'assistant'):
            history.append({'role': role, 'content': content})

    if history and history[-1].get('role') == 'user':
        user_msg = history[-1]['content']
        history = history[:-1]

    result = _llm.chat(
        task='persona',
        system=_pack.PUBLIC_CONCIERGE_SYSTEM_PROMPT,
        user=user_msg,
        history=history or None,
        max_tokens=400,
        temperature=0.5,
    )

    reply = result.text or "I'm having trouble connecting right now. Please call us at (804) 446-1296."

    # Detect handoff signal in the reply
    handoff = _pack.detect_handoff(reply) or _pack.detect_handoff(user_msg)

    # Quick lead score if location data provided
    lead_score = None
    if body.zip_code or body.city or body.state_code:
        lead_score = _pack.score_concierge_lead(
            zip_code=body.zip_code,
            city=body.city,
            state_code=body.state_code,
        )

    return {
        'reply':      reply,
        'handoff':    handoff,
        'lead_score': lead_score,
        'provider':   result.provider,
        'model':      result.model,
    }


@router.get('/search-pulse', summary='Live SERP heat map for VA hotspots')
async def search_pulse(_: dict = Depends(verify_premium_security)):
    """
    Returns SERP heat scores for 8 VA market hotspots across 3 search terms.
    Cached for 5 minutes. Returns demo data when SERPAPI_KEY absent.
    """
    return await _pulse.snapshot(force=False)


@router.post('/search-pulse/refresh', summary='Force-refresh the SERP heat map cache')
@limiter.limit(AI_LIMIT)
async def search_pulse_refresh(request: Request, _: dict = Depends(verify_premium_security)):
    """Forces a live SerpAPI fan-out (bypasses 5-minute cache). Use sparingly."""
    return await _pulse.snapshot(force=True)


@router.get('/features', summary='SEO features enabled by current license tier')
async def seo_features(_: dict = Depends(verify_premium_security)):
    """Returns which SEO and AI features are enabled for the current LICENSE_TIER."""
    from ..services.runtime_config import enabled_features, current_tier
    return {
        "tier": current_tier(),
        "features": enabled_features(),
        "llm_providers": _llm.provider_status(),
    }
