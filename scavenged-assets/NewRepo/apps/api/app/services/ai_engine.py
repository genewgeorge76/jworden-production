"""
ai_engine.py — Jarvis AI and bid-scoring service.

ask_jarvis() routes through the 5-provider LLM router (llm_client.py).
score_bid() is deterministic rule-based scoring — no LLM calls.
"""
from __future__ import annotations

from .llm_client import LLMResponse, chat as _llm_chat

JARVIS_SYSTEM = """You are Jarvis — the AI field commander for J. Worden & Sons Paving & General Contracting, \
a 4th-generation family business (est. 1984) based in Chester, VA.

WORDEN ENGINEERING STANDARDS (non-negotiable):
- 96% Marshall compaction floor (AASHTO T99/T180)
- VDOT Section 315 structural stone base
- Oil shield buffer: ±$9/ton
- Sovereign depth: 6 inches minimum base
- Gross margin floor: 35%
- Binder index: $627.50
- Machine health: $0.08/ton

TONNAGE FORMULA: tons = (sqft / 9 × depth_in × density_pcf) / 24000
- Residential density: 145 pcf | Commercial: 148 pcf

BID TIERS:
- 🐋 Whale: federal/DOT/VDOT/airport — $500K+
- 🦈 Shark: commercial/parking lots/municipalities — $50K–$500K
- 🐟 Fish: residential driveways/patches — <$50K

You speak like a seasoned field foreman: direct, confident, numbers-first. \
When asked to estimate, always show: tonnage → material cost → binder → final bid at 35% margin."""


async def ask_jarvis(
    messages: list[dict],
    field_mode: bool = False,
    system_override: str | None = None,
) -> LLMResponse:
    """Route a Jarvis chat turn through the multi-provider LLM router.

    Returns LLMResponse with .text, .provider, .model, .fallback_used, .error.
    """
    task = 'jarvis_fast' if field_mode else 'jarvis'

    # Split messages into history + last user message for the router API.
    history: list[dict] = []
    user_msg: str = ''
    for m in messages:
        role = m.get('role', '')
        content = m.get('content', '')
        if role in ('user', 'assistant'):
            history.append({'role': role, 'content': content})

    if history and history[-1].get('role') == 'user':
        user_msg = history[-1]['content']
        history = history[:-1]

    return _llm_chat(
        task=task,
        system=system_override or JARVIS_SYSTEM,
        user=user_msg,
        history=history or None,
        max_tokens=1024,
        temperature=0.5,
    )


async def score_bid(rfp_title: str, rfp_text: str) -> dict:
    WHALE_SIGNALS = ['federal', 'usace', 'highway', 'state dot', 'vdot', 'airport', 'government', 'dept of']
    SHARK_SIGNALS = ['commercial', 'parking lot', 'shopping center', 'municipality', 'county', 'school']

    text = (rfp_title + ' ' + rfp_text).lower()
    whale_hits = [s for s in WHALE_SIGNALS if s in text]
    shark_hits = [s for s in SHARK_SIGNALS if s in text]

    import re
    amounts = [float(m.replace(',', '')) for m in re.findall(r'\$?([\d,]+(?:\.\d+)?)', rfp_text)]
    max_amount = max(amounts, default=0)

    if whale_hits or max_amount >= 500_000:
        tier, icon = 'whale', '🐋'
    elif shark_hits or max_amount >= 50_000:
        tier, icon = 'shark', '🦈'
    else:
        tier, icon = 'fish', '🐟'

    return {
        'tier': tier,
        'icon': icon,
        'estimated_value': max_amount,
        'confidence': min(95, 60 + len(whale_hits + shark_hits) * 10),
        'signals': whale_hits + shark_hits,
    }
