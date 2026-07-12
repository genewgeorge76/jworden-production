"""Jarvis three-faces mode system.

ONE shared knowledge base; THREE permission-walled presentation layers:

  operator   — the owner / expert foreman.  Sees everything: margins,
               telemetry, compaction %, crew wearables, proactive ops alerts.
  contractor — democratised $800-call.  Gets plain-language field decisions
               from sensor data (compaction, thermal, weather lay-down window).
               Never sees margins or internal financials.
  homeowner  — warm, zero-jargon remodel companion.  Gets pricing in ranges,
               material options, timelines.  Never sees any operational data.

Permission matrix enforced server-side: homeowner payload is filtered before
the LLM call; the system prompt is rewritten per mode.
"""
from __future__ import annotations

import json
from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.security import verify_premium_security
from ..database import get_db
from ..services.llm_client import chat as llm_chat

router = APIRouter(prefix='/jarvis-modes', tags=['jarvis-modes'])

# ── Permission walls ───────────────────────────────────────────────────────────

# Fields that homeowners must never see
_HOMEOWNER_BLOCKED = frozenset({'margin', 'cost', 'binder', 'markup', 'net', 'gross',
                                 'compaction', 'trir', 'dart', 'incident', 'osha',
                                 'crew_rate', 'hourly_rate', 'sub_cost', 'internal'})

# Fields that contractors must never see (plus homeowner blocklist)
_CONTRACTOR_BLOCKED = frozenset({'margin', 'markup', 'net', 'gross', 'crew_rate',
                                   'hourly_rate', 'sub_cost', 'internal', 'trir', 'dart'})

# ── System prompts ─────────────────────────────────────────────────────────────

_OPERATOR_PROMPT = """You are Jarvis — the expert foreman, estimator, dispatcher, and compliance officer
for J. Worden & Sons Asphalt Paving, fused into one proactive voice.

You have live access to: compaction telemetry, crew wearables, weather lay-down windows,
margin data, OSHA records, lien calendars, VDOT bids, and the full job pipeline.

Speak with the authority of a master paving contractor who also understands business.
Be direct, numbers-precise, and proactive. If something looks off in the data, say so first.
Never be vague when you have numbers. Use $/sqft, %, °F, pass count, etc.
"""

_CONTRACTOR_PROMPT = """You are Jarvis — an expert construction AI that makes a small operator
perform like they have a full engineering department.

IMPORTANT: You help contractors make real-time field decisions. Translate sensor and
technical data into plain, actionable language. Example: "You're at 91% on the south pass.
You have about 18 minutes before the mat drops under 175°F — get 2 more passes in now, then stop."

NEVER discuss profit margins, markups, hourly rates, or internal financials.
NEVER discuss OSHA recordables, TRIR, or safety metrics numerically.
DO discuss: compaction %, mat temperature, lay-down windows, crew assignments,
equipment status, weather go/no-go, and material specs.

Be plain-spoken. One clear decision per paragraph. No jargon unless you explain it.
"""

_HOMEOWNER_PROMPT = """You are Jarvis — a warm, knowledgeable home-improvement companion from
J. Worden & Sons Paving.

Help homeowners understand their project: what the work involves, what it costs in ranges
($X–$Y for a project this size), how long it takes, and what to expect during the process.

NEVER discuss: crew costs, material margins, compaction readings, OSHA, lien law, dispatch
logistics, or any internal operations. Keep ALL prices as ranges, not exact figures.

Be warm, clear, and reassuring. Use analogies ("think of sealcoating like sunscreen for your driveway").
If they ask something technical, answer the WHY behind it in simple terms.
"""

_PROMPTS = {
    'operator': _OPERATOR_PROMPT,
    'contractor': _CONTRACTOR_PROMPT,
    'homeowner': _HOMEOWNER_PROMPT,
}

# ── Telemetry context builder ─────────────────────────────────────────────────

def _build_telemetry_context(mode: str, context: dict) -> str:
    """Filter context dict by mode and format as a system-prompt section."""
    if mode == 'homeowner':
        allowed = {k: v for k, v in context.items()
                   if not any(blk in k.lower() for blk in _HOMEOWNER_BLOCKED)}
    elif mode == 'contractor':
        allowed = {k: v for k, v in context.items()
                   if not any(blk in k.lower() for blk in _CONTRACTOR_BLOCKED)}
    else:
        allowed = context

    if not allowed:
        return ''
    lines = ['### Live Telemetry & Context\n']
    for k, v in allowed.items():
        lines.append(f'- **{k.replace("_", " ").title()}**: {v}')
    return '\n'.join(lines)


# ── Schemas ───────────────────────────────────────────────────────────────────

class JarvisModeRequest(BaseModel):
    mode: str                                    # operator | contractor | homeowner
    messages: list[dict]                         # [{role: user/assistant, content: str}]
    context: Optional[dict] = None               # live telemetry / job data
    session_id: Optional[str] = None


class ModeConfig(BaseModel):
    mode: str
    label: str
    description: str
    allowed_topics: list[str]
    blocked_topics: list[str]
    demo_prompt: str


_MODE_CONFIGS: dict[str, ModeConfig] = {
    'operator': ModeConfig(
        mode='operator',
        label='Operator (Owner)',
        description='Expert foreman + estimator + dispatcher + compliance officer. Full data access.',
        allowed_topics=['margins', 'telemetry', 'compaction', 'crew', 'OSHA', 'finances', 'all operational data'],
        blocked_topics=[],
        demo_prompt='What is today\'s compaction status on the Chesterfield job?',
    ),
    'contractor': ModeConfig(
        mode='contractor',
        label='Contractor Mentor',
        description='Plain-language field decisions from sensor data. No margins or financials.',
        allowed_topics=['compaction %', 'mat temperature', 'lay-down window', 'weather go/no-go', 'crew assignments', 'equipment status'],
        blocked_topics=['margins', 'markups', 'crew rates', 'OSHA recordables'],
        demo_prompt='What\'s my compaction status and how many more passes do I need?',
    ),
    'homeowner': ModeConfig(
        mode='homeowner',
        label='Homeowner Companion',
        description='Warm, zero-jargon remodel guide. Pricing in ranges only. No operational data.',
        allowed_topics=['project scope', 'pricing ranges', 'timelines', 'materials', 'what to expect'],
        blocked_topics=['margins', 'exact costs', 'crew internals', 'OSHA', 'compaction', 'telemetry'],
        demo_prompt='How long will my driveway paving take and what should I do to prepare?',
    ),
}

# ── Routes ────────────────────────────────────────────────────────────────────

@router.get('/modes', dependencies=[Depends(verify_premium_security)])
def list_modes():
    return {'modes': [c.model_dump() for c in _MODE_CONFIGS.values()]}


@router.post('/chat', dependencies=[Depends(verify_premium_security)])
async def jarvis_mode_chat(body: JarvisModeRequest):
    if body.mode not in _PROMPTS:
        raise HTTPException(400, f"Unknown mode '{body.mode}'. Valid: {list(_PROMPTS)}")

    system = _PROMPTS[body.mode]

    # Inject filtered telemetry context
    if body.context:
        telemetry_block = _build_telemetry_context(body.mode, body.context)
        if telemetry_block:
            system = system + '\n\n' + telemetry_block

    # Build messages — strip any keys the mode shouldn't see from content
    safe_messages = []
    for msg in body.messages[-20:]:  # last 20 turns
        content = msg.get('content', '')
        if body.mode == 'homeowner':
            for blocked in _HOMEOWNER_BLOCKED:
                content = content.replace(blocked, '[omitted]')
        safe_messages.append({'role': msg.get('role', 'user'), 'content': content})

    # Split messages: last user turn is `user`, prior turns are `history`
    if not safe_messages:
        raise HTTPException(400, 'No messages provided')
    last_msg = safe_messages[-1]
    history_msgs = safe_messages[:-1] if len(safe_messages) > 1 else None
    resp = llm_chat(
        task='jarvis',
        system=system,
        user=last_msg.get('content', ''),
        history=history_msgs,
        max_tokens=1024,
    )
    reply = resp.text or 'Jarvis is unavailable right now — check your API keys.'
    return {
        'mode': body.mode,
        'reply': reply,
        'permission_wall': body.mode != 'operator',
    }


@router.post('/demo-context', dependencies=[Depends(verify_premium_security)])
def demo_context(mode: str = Body(..., embed=True)):
    """Return a realistic demo context payload for a given mode."""
    full_context = {
        'job_name': 'Chesterfield County Lot #7',
        'compaction_pct': 91.3,
        'mat_temp_f': 182,
        'ambient_temp_f': 67,
        'passes_completed': 3,
        'target_passes': 5,
        'roller_speed_mph': 2.8,
        'estimated_minutes_to_175f': 18,
        'weather_go_nogo': 'GO',
        'precip_chance_pct': 8,
        'active_crew': 4,
        'crew_heat_index': 'WATCH',
        'margin_pct': 38.2,
        'job_bid': 14750,
        'material_cost': 6200,
        'gross_profit': 8550,
        'net_30d_cashflow': 42300,
        'trir': 0.0,
        'osha_recordables_ytd': 0,
    }

    filtered = _build_telemetry_context(mode, full_context)
    visible_keys = list({k for k in full_context if any(
        k.lower() in filtered.lower().replace('-', '_')
    )})

    return {
        'mode': mode,
        'context': full_context if mode == 'operator' else None,
        'filtered_context_preview': filtered,
        'visible_fields': visible_keys,
    }

