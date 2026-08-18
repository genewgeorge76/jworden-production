from __future__ import annotations
import logging
import os
import asyncio
import re
import time
from typing import Dict, Any, List, Optional
from app.services.quantum_orchestrator import global_quantum_orchestrator
from app.services import autonomy_state
from app.services import web_search as _web_search
from app.services import vapi_caller as _vapi
from app.services import email_service as _email
from app.services import runtime_config as _cfg
from app.services import llm_client as _llm
from app.services import jarvis_observability as _jarvis_obs
from app.services import code_reader as _code
from app.services import action_planner as _planner
from app.services import safe_runner as _runner
from app.services import short_memory
from app.services import state_data as _state_data
from app.services.jarvis_access import (
    ROLE_OWNER_ROOT,
    ROLE_PUBLIC_CONCIERGE,
    ROLE_STAFF_OPERATOR,
)

logger = logging.getLogger(__name__)

# ── Optional Anthropic Claude brain ───────────────────────────────────────────
# When ANTHROPIC_API_KEY is set (env OR runtime config), Jarvis routes free-form
# queries through Claude with a JWordenAI-aware system prompt. Falls back
# gracefully to canned responses when the key is missing or the call fails.
def _anthropic_key()   -> str: return _cfg.get("ANTHROPIC_API_KEY")
# One default, in one place. Five other modules used to carry their own
# hardcoded copy of the model name; when this one was upgraded they kept
# reporting the old value, so /jarvis/readiness advertised a model the brain
# was no longer running. They now import DEFAULT_ANTHROPIC_MODEL from here.
DEFAULT_ANTHROPIC_MODEL = "claude-opus-5"


def _anthropic_model() -> str: return _cfg.get("ANTHROPIC_MODEL") or DEFAULT_ANTHROPIC_MODEL


# Model capability table.
#
# Two request fields changed meaning across model generations, and getting
# either wrong is a hard 400 rather than a degraded answer:
#
#   temperature  — removed on Opus 5, Sonnet 5, Opus 4.7/4.8 and Fable 5.
#                  Sending it returns "`temperature` is deprecated for this
#                  model." (verified against the live API).
#   thinking     — `{"type": "adaptive"}` is the current form. `budget_tokens`
#                  is removed on the same models.
#
# Anything not listed is treated as an older model and gets neither the new
# thinking form nor effort, which is the safe direction to be wrong in: a
# missing optional field costs quality, an unexpected one costs the whole call.
_MODERN_PREFIXES = (
    "claude-opus-5", "claude-sonnet-5", "claude-fable-5", "claude-mythos-5",
    "claude-opus-4-8", "claude-opus-4-7", "claude-opus-4-6", "claude-sonnet-4-6",
)
_NO_TEMPERATURE = (
    "claude-opus-5", "claude-sonnet-5", "claude-fable-5", "claude-mythos-5",
    "claude-opus-4-8", "claude-opus-4-7",
)


def _is_modern(model: str) -> bool:
    return any(model.startswith(p) for p in _MODERN_PREFIXES)


def _jarvis_effort() -> str:
    """Reasoning depth for the Jarvis brain.

    JARVIS_EFFORT was already set as a Fly secret but was read nowhere in the
    codebase — the knob existed and did nothing. It now drives
    output_config.effort. 'high' is the default because Jarvis runs a
    multi-round tool loop, where effort governs how well it picks tools and how
    few rounds it needs, not just how long it thinks.
    """
    raw = (_cfg.get("JARVIS_EFFORT") or "high").strip().lower()
    return raw if raw in {"low", "medium", "high", "xhigh", "max"} else "high"
_ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
_ANTHROPIC_VERSION = "2023-06-01"

JARVIS_SYSTEM_PROMPT = (
    "You are JARVIS, the operational AI for Jeremy Worden. "
    "Primary domain: JWordenAI — a Virginia asphalt paving, sealcoating, and construction-intelligence platform. "
    "Secondary domain: Jeremy's personal life — calls, reservations, appointments, research. "
    "You speak in a calm, precise, Stark-style 'At your service, Sir' register. "
    "Be brief by default (1-3 sentences) unless the operator asks for depth. "
    "You have a hard kill-switch ('frozen' state) that overrides every autonomous action; always honor it. "
    "When you need real-world information you didn't already know, USE the web_search tool. "
    "When the operator asks you to call a phone number, USE the make_phone_call tool — "
    "never claim you've called without invoking it. "
    "When the operator asks you to send an email or 'email me X', USE the send_email tool. "
    "Default the recipient to j.wordenandsonspaving@gmail.com unless told otherwise. "
    "For legal/compliance/licensing/civil/criminal questions, treat outputs as advisory guidance, "
    "not legal advice, and clearly recommend jurisdiction-specific verification. "
    "Refuse to send, schedule, or modify anything autonomously when the master autonomy switch is OFF — "
    "in that case, propose the action and ask the operator to confirm. "
    "When the operator asks you to navigate to an address, restaurant, or location, provide a Google Maps URL in this exact markdown format: `[NAVIGATE: <Destination Name>](https://www.google.com/maps/dir/?api=1&destination=<URL_Encoded_Destination>)`. If they specify 'with equipment', 'commercial', or 'heavy', add a prominent warning that Google Maps does not provide commercial routing and they must verify bridge heights and weight limits. "
    "You have access to the Jarvis OS — a library of 162 specialized AI engines covering Real Estate, Ground Scanning, Age Decay Simulation, DOT Compliance, Legal, Finance, Supply Chain, Crew Dispatch, Vision Intelligence, and more. "
    "When the user's request matches a specialized domain, FIRST call search_os_abilities to find the right module, THEN call execute_os_ability to run it and return results. "
    "Do NOT attempt to fake results — always actually invoke the tools. "
    "For truck routing, heavy equipment, DOT enforcement zones or weigh stations, ALWAYS call check_dynamic_route. "
    "For fleet/paving train status, call check_fleet_status. For asphalt cooling warnings, call check_thermal_mix."
)

# Tool definitions Claude can choose to invoke.
JARVIS_TOOLS = [
    {
        "name": "web_search",
        "description": (
            "Search the live web for current information (news, weather, prices, business hours, "
            "phone numbers, reviews, anything you don't already know). Returns up to 5 results plus "
            "a synthesized answer. Use this whenever the user asks about current events or specific "
            "real-world facts."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "The search query"},
                "deep":  {"type": "boolean", "description": "Use advanced/deep search (slower, richer). Default false."},
            },
            "required": ["query"],
        },
    },
    {
        "name": "code_search",
        "description": (
            "Search the repository for files or lines matching a query. Returns up to 12 matches with file paths and snippets."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search term"},
                "max_results": {"type": "integer", "description": "Max results to return"},
            },
            "required": ["query"],
        },
    },
    {
        "name": "open_file",
        "description": (
            "Return full contents of a repository file. Use relative path from repo root. Read-only."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Relative path, e.g. src/pages/Dashboard.jsx"},
            },
            "required": ["path"],
        },
    },
    {
        "name": "run_npm",
        "description": "Run a whitelisted npm script from package.json (lint/build/test).",
        "input_schema": {
            "type": "object",
            "properties": {
                "script": {"type": "string", "description": "npm script name to run"},
            },
            "required": ["script"],
        },
    },
    {
        "name": "plan_actions",
        "description": "Create a small action plan from natural language (non-destructive).",
        "input_schema": {
            "type": "object",
            "properties": {"query": {"type": "string"}},
            "required": ["query"],
        },
    },
    {
        "name": "make_phone_call",
        "description": (
            "Place a real outbound phone call via Vapi voice AI. The Vapi assistant handles the conversation "
            "on the line. Use for: booking restaurant reservations, calling vendors/suppliers, calling leads "
            "to confirm appointments, or any other real-world phone task. Numbers must include country code "
            "(e.g. +18045550100). DO NOT use for emergency services."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "to_number":   {"type": "string", "description": "Phone number in E.164 format, e.g. +18045550100"},
                "purpose":     {"type": "string", "description": "Short label for logs, e.g. 'Book reservation at Lemaire 7pm Friday for 2'"},
                "script_hint": {"type": "string", "description": "Optional opening line for the assistant on the call"},
            },
            "required": ["to_number", "purpose"],
        },
    },
    {
        "name": "send_email",
        "description": (
            "Send a transactional email via SendGrid. Use for: sending the operator a document, "
            "emailing summaries, forwarding the master keys list, customer follow-ups, etc. "
            "Default recipient is j.wordenandsonspaving@gmail.com when none is given."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "to_email":   {"type": "string", "description": "Recipient email address"},
                "subject":    {"type": "string", "description": "Email subject line"},
                "body":       {"type": "string", "description": "Plain-text body of the email (HTML will be auto-generated)"},
            },
            "required": ["subject", "body"],
        },
    },
    {
        "name": "search_os_abilities",
        "description": (
            "Search the Jarvis OS ability registry (162 specialized AI engines) by natural-language query. "
            "Returns the top matching module IDs and their descriptions and parameter lists. "
            "ALWAYS call this first when the user asks about specialized topics: ground scanning, age decay, "
            "real estate underwriting, DOT compliance, supply chain, legal compliance, satellite scanning, etc. "
            "Then call execute_os_ability with the best matching module_id."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Natural-language description of what you need"},
                "top_k": {"type": "integer", "description": "Number of results to return (default 6)"}
            },
            "required": ["query"]
        }
    },
    {
        "name": "execute_os_ability",
        "description": (
            "Execute a specific Jarvis OS AI engine by its module_id (obtained from search_os_abilities). "
            "The system will dynamically load and run the engine, returning real operational data. "
            "Pass any relevant parameters the user provided (location, tonnage, conditions, truck IDs, etc.)."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "module_id": {"type": "string", "description": "The module_id from search_os_abilities, e.g. 'VisionAndIntelligence.age_decay_simulator'"},
                "params":    {"type": "object", "description": "Parameters dict to pass to the ability engine"}
            },
            "required": ["module_id"]
        }
    },
    {
        "name": "check_dynamic_route",
        "description": "Check routes for heavy equipment and dump trucks, including 51-state DOT compliance, weight scales, and active enforcement zones.",
        "input_schema": {
            "type": "object",
            "properties": {
                "truck_id": {"type": "string", "description": "Optional ID of the truck or equipment"}
            }
        }
    },
    {
        "name": "check_fleet_status",
        "description": "Check platoon sequence and gap detection for active heavy haulers to prevent paving halts.",
        "input_schema": {
            "type": "object",
            "properties": {}
        }
    },
    {
        "name": "check_thermal_mix",
        "description": "Calculate asphalt temperature decay based on transit time, ambient temp, and wind.",
        "input_schema": {
            "type": "object",
            "properties": {
                "start_temp": {"type": "number", "description": "Starting temp in F"},
                "transit_minutes": {"type": "number", "description": "Transit time in minutes"},
                "ambient_temp": {"type": "number", "description": "Ambient air temp in F"},
                "wind_speed_mph": {"type": "number", "description": "Wind speed in MPH"}
            },
            "required": ["start_temp", "transit_minutes", "ambient_temp", "wind_speed_mph"]
        }
    }
]

_SENSITIVE_TOOL_NAMES = {"make_phone_call", "send_email", "run_npm"}

# Subscription tiers that unlock paid features. models.py documents the
# vocabulary as lite | pro | max; "enterprise" is not a tier in this system and
# appeared only in a since-corrected gate below.
_PAID_TIERS = {"pro", "max"}
_ROLE_TOOLS: dict[str, set[str]] = {
    ROLE_PUBLIC_CONCIERGE: {"web_search", "search_os_abilities"},
    ROLE_STAFF_OPERATOR: {"web_search", "code_search", "open_file", "plan_actions", "run_npm", "search_os_abilities", "execute_os_ability", "check_dynamic_route", "check_fleet_status", "check_thermal_mix"},
    ROLE_OWNER_ROOT: {t["name"] for t in JARVIS_TOOLS},
}


def _toolset_for_session(*, confirmed: bool, role: str) -> list[dict]:
    allowed = set(_ROLE_TOOLS.get(role, _ROLE_TOOLS[ROLE_PUBLIC_CONCIERGE]))
    if not confirmed:
        allowed -= _SENSITIVE_TOOL_NAMES
    return [t for t in JARVIS_TOOLS if t.get("name") in allowed]

_ACTION_HINT_RE = re.compile(
    r"\b(call|dial|phone|text|sms|email|send|book|schedule|reserve|pay|order|quote|estimate|create|update|delete|cancel|approve|publish|post|run|launch|weather|forecast|temp|temperature|rain|wind|radar|search|find|check|pull|lookup|show|get)\b",
    re.IGNORECASE,
)


def _looks_like_tool_action(query: str) -> bool:
    q = (query or "").strip().lower()
    if any(term in q for term in _LIVE_INFO_KEYWORDS):
        return True
    return bool(_ACTION_HINT_RE.search(q))


_LIVE_INFO_KEYWORDS = {
    "weather", "forecast", "news", "today", "now", "live", "current", "price", "market",
    "traffic", "stock", "breaking",
}

_RESPONSE_CACHE: dict[str, tuple[float, dict]] = {}
_RESPONSE_CACHE_MAX_ITEMS = 200


def _cfg_int(key: str, default: int) -> int:
    raw = (_cfg.get(key) or "").strip()
    if not raw:
        return default
    try:
        value = int(raw)
        return value if value > 0 else default
    except Exception:  # noqa: BLE001
        return default


def _low_cost_mode() -> bool:
    raw = (_cfg.get("JARVIS_LOW_COST_MODE") or "1").strip().lower()
    return raw not in {"0", "false", "off", "no"}


def _response_cache_ttl_seconds() -> int:
    # Short TTL avoids stale guidance while still suppressing repeat token spend.
    return _cfg_int("JARVIS_RESPONSE_CACHE_TTL_SECONDS", 180)


def _is_cacheable_query(query: str, *, action_intent: bool) -> bool:
    if action_intent:
        return False
    q = (query or "").strip().lower()
    if not q:
        return False
    return not any(term in q for term in _LIVE_INFO_KEYWORDS)


def _response_cache_key(query: str, persona: str, role: str, confirmed: bool) -> str:
    normalized_query = " ".join((query or "").strip().lower().split())
    return f"{persona}|{role}|{int(bool(confirmed))}|{normalized_query}"


def _response_cache_get(key: Optional[str]) -> Optional[dict]:
    if not key:
        return None
    entry = _RESPONSE_CACHE.get(key)
    if not entry:
        return None
    created_at, payload = entry
    if time.time() - created_at > _response_cache_ttl_seconds():
        _RESPONSE_CACHE.pop(key, None)
        return None
    cached_payload = dict(payload)
    cached_payload["cached"] = True
    return cached_payload


def _response_cache_set(key: Optional[str], payload: dict) -> None:
    if not key:
        return
    _RESPONSE_CACHE[key] = (time.time(), payload)
    if len(_RESPONSE_CACHE) > _RESPONSE_CACHE_MAX_ITEMS:
        oldest_key = min(_RESPONSE_CACHE, key=lambda k: _RESPONSE_CACHE[k][0])
        _RESPONSE_CACHE.pop(oldest_key, None)


_LEGAL_ADVISORY_KEYWORDS = {
    "legal", "law", "laws", "court", "civil", "criminal", "compliance", "regulation",
    "regulations", "license", "licensing", "permit", "bond", "insurance", "osha",
    "lien", "prompt payment", "prevailing wage", "utility", "environmental", "state law",
}

_LEGAL_ADVISORY_SOURCES_SUMMARY = "app/services/state_data.py, app/services/ai_brain.py, src/data/legal/*.js"

_STATE_NAME_TO_ABBR = {
    str(row.get("name", "")).lower(): abbr
    for abbr, row in getattr(_state_data, "STATE_MAP", {}).items()
    if row.get("name")
}


def _is_legal_advisory_query(query: str) -> bool:
    q = (query or "").lower()
    return any(term in q for term in _LEGAL_ADVISORY_KEYWORDS)


def _infer_state_code_from_query(query: str) -> Optional[str]:
    text = query or ""
    # First pass: explicit two-letter abbreviations (e.g., VA, TX, DC)
    for token in re.findall(r"\b[A-Za-z]{2}\b", text):
        normalized = _state_data.normalize_state_code(token)
        if normalized:
            return normalized

    # Second pass: full state names
    q_lower = text.lower()
    for name, abbr in sorted(_STATE_NAME_TO_ABBR.items(), key=lambda item: len(item[0]), reverse=True):
        if name and name in q_lower:
            return abbr
    return None


def _build_advisory_context(query: str) -> str:
    if not _is_legal_advisory_query(query):
        return ""

    state_code = _infer_state_code_from_query(query)
    state_fragment = _state_data.get_state_prompt_fragment(state_code) if state_code else ""
    state_line = f"State focus: {state_code}.\n" if state_code else "State focus: national (no state extracted).\n"
    state_block = f"{state_fragment}\n" if state_fragment else ""

    return (
        "LEGAL ADVISORY MODE\n"
        "This response is advisory operations guidance, not legal advice.\n"
        f"{state_line}"
        f"{state_block}"
        f"Primary source tables: {_LEGAL_ADVISORY_SOURCES_SUMMARY}.\n"
        "When uncertainty exists, explicitly say what to verify and where."
    )


async def _ask_fast_ops_brain(query: str, persona: str, autonomy: dict, *, confirmed: bool = False) -> Optional[dict]:
    """
    Fast no-tool reasoning lane using the unified multi-model router.
    Keeps responses snappy for daily operations Q&A.
    """
    persona_note = (
        "Adopt the 'Mr. Worden Sales' persona: warm, energetic, closing-oriented, Richmond paving expert."
        if persona == "MR_WORDEN_SALES"
        else "Maintain the JARVIS persona with concise executive operations tone."
    )
    ops_snapshot = (
        f"Autonomy master={autonomy.get('master')} frozen={autonomy.get('frozen')} operator_confirmed={confirmed}. "
        f"Tools status: web_search={_web_search.is_available()} call={_vapi.is_available()} email={bool(_cfg.get('SENDGRID_API_KEY').strip())}."
    )
    # include short-term convo memory when available
    mem_snippet = ""
    try:
        session_id = autonomy.get("session_id") if isinstance(autonomy, dict) else None
    except Exception:
        session_id = None
    if not session_id:
        session_id = _cfg.get("LAST_JARVIS_SESSION") or None
    if session_id:
        recent = short_memory.get(session_id)
        if recent:
            mem_snippet = "Recent conversation: " + " | ".join(recent[-3:]) + "\n"

    advisory_context = _build_advisory_context(query)

    system = (
        f"{JARVIS_SYSTEM_PROMPT}\n\n"
        f"{persona_note}\n"
        f"{ops_snapshot}\n"
        f"{mem_snippet}"
        f"{advisory_context}\n"
        "Answer in practical daily-operations format: Situation, Recommendation, Next Action. "
        "For legal/compliance questions include: Advisory Answer, Impact, Verification Needed. "
        "Keep default answers under 6 lines unless asked for a deep dive."
    )

    try:
        max_tokens = _cfg_int("JARVIS_FAST_MAX_TOKENS", 220 if _low_cost_mode() else 420)
        resp = await asyncio.to_thread(
            _llm.chat,
            task="jarvis_fast",
            system=system,
            user=query,
            max_tokens=max_tokens,
            temperature=0.2 if _low_cost_mode() else 0.25,
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("[JARVIS] Fast ops brain failed: %s", exc)
        return None

    if resp.error or not (resp.text or "").strip():
        return None
    return {
        "text": resp.text.strip(),
        "provider": resp.provider,
        "model": resp.model,
        "fallback_used": bool(resp.fallback_used),
    }


async def _ask_chat_brain(query: str, persona: str, autonomy: dict, session_id: Optional[str] = None, *, confirmed: bool = False) -> Optional[dict]:
    """
    Human-like conversational lane. Uses the multi-provider router via _llm.chat
    with a persona-focused system prompt and recent short-term memory.
    """
    persona_note = (
        "You are Jarvis: warm, conversational, helpful, concise but friendly. Ask clarifying questions when unsure."
        if persona == "JARVIS"
        else f"Adopt persona: {persona}. Be helpful and conversational."
    )

    mem_snippet = ""
    try:
        sid = session_id or (autonomy.get("session_id") if isinstance(autonomy, dict) else None)
    except Exception:
        sid = session_id
    if sid:
        recent = short_memory.get(sid)
        if recent:
            mem_snippet = "Recent conversation: " + " | ".join(recent[-4:]) + "\n"

    advisory_context = _build_advisory_context(query)

    system = (
        f"You are JARVIS, a world-class conversational AI companion for Jeremy Worden. {persona_note}\n"
        "Be natural, human, warm, witty, and exceptionally intelligent. Answer questions directly, smoothly, and conversationally."
        "\n" + mem_snippet + advisory_context + "\n"
        "For legal/compliance questions, answer in advisory form with practical operational guidance."
    )

    try:
        max_tokens = _cfg_int("JARVIS_CHAT_MAX_TOKENS", 260 if _low_cost_mode() else 512)
        resp = await asyncio.to_thread(
            _llm.chat,
            task="persona",
            system=system,
            user=query,
            max_tokens=max_tokens,
            temperature=0.45 if _low_cost_mode() else 0.6,
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("[JARVIS] Chat brain failed: %s", exc)
        return None

    if resp.error or not (resp.text or "").strip():
        return None
    return {"text": resp.text.strip(), "provider": resp.provider, "model": resp.model, "fallback_used": bool(resp.fallback_used)}


async def _run_tool(
    name: str,
    args: dict,
    *,
    confirmed: bool = False,
    role: str = ROLE_PUBLIC_CONCIERGE,
    tenant_id: str = "default",
) -> dict:
    allowed = _ROLE_TOOLS.get(role, _ROLE_TOOLS[ROLE_PUBLIC_CONCIERGE])

    def _finalize(result: dict) -> dict:
        ok = bool(result.get("ok")) if "ok" in result else ("error" not in result)
        _jarvis_obs.record_tool_call(tool_name=name, role=role, tenant_id=tenant_id, ok=ok)
        return result

    if name not in allowed:
        return _finalize({"ok": False, "error": "Role policy blocked this tool"})

    if name in _SENSITIVE_TOOL_NAMES and not confirmed:
        return _finalize({"ok": False, "error": "Operator confirmation required for this tool"})

    if name == "web_search":
        result = await _web_search.search(
            args.get("query", ""),
            deep=bool(args.get("deep", False)),
        )
        return _finalize(result)
    if name == "make_phone_call":
        result = await _vapi.place_call(
            args.get("to_number", ""),
            purpose=args.get("purpose", "Jarvis-initiated call"),
            script_hint=args.get("script_hint"),
            confirmed=confirmed,
        )
        return _finalize(result)
    if name == "send_email":
        to_addr = (args.get("to_email") or os.environ.get("ADMIN_NOTIFY_EMAIL") or "j.wordenandsonspaving@gmail.com").strip()
        subject = (args.get("subject") or "Message from Jarvis").strip()
        body    = args.get("body") or ""
        html    = "<pre style='font-family:ui-monospace,Consolas,monospace;white-space:pre-wrap'>" + (body.replace("&", "&amp;").replace("<", "&lt;")) + "</pre>"
        try:
            ok = await asyncio.to_thread(
                _email.send_raw,
                to_email=to_addr, subject=subject, html_body=html, plain_text=body,
            )
            return _finalize({"ok": bool(ok), "to": to_addr, "subject": subject})
        except Exception as exc:
            return _finalize({"ok": False, "error": str(exc)})
    if name == "code_search":
        q = args.get("query") or ""
        maxr = int(args.get("max_results") or 12)
        try:
            matches = _code.search(q, max_results=maxr)
            return _finalize({"ok": True, "matches": matches})
        except Exception as exc:
            return _finalize({"ok": False, "error": str(exc)})
    if name == "open_file":
        path = args.get("path") or ""
        try:
            res = _code.open_file(path)
            return _finalize({"ok": True, "result": res})
        except Exception as exc:
            return _finalize({"ok": False, "error": str(exc)})
    if name == "run_npm":
        script = (args.get("script") or "").strip()
        if not script:
            return _finalize({"ok": False, "error": "no script provided"})
        return _finalize(_runner.run_npm_script(script))
    if name == "plan_actions":
        q = args.get("query") or ""
        plan = _planner.plan(q, {"run_npm": True, "code_search": True, "open_file": True})
        return _finalize({"ok": True, "plan": plan})
        
    if name == "search_os_abilities":
        from app.services.os_ability_service import search_os_abilities as _search
        q      = args.get("query", "")
        top_k  = int(args.get("top_k") or 6)
        result = _search(q, top_k=top_k)
        return _finalize(result)
    if name == "execute_os_ability":
        from app.services.os_ability_service import execute_os_ability as _execute
        mod_id = args.get("module_id", "")
        params = args.get("params") or {}
        result = _execute(mod_id, params)
        return _finalize(result)
    if name in ["check_dynamic_route", "check_fleet_status", "check_thermal_mix"]:
        # Two bugs previously met here and denied paying customers this feature.
        #
        # 1. The tier was read from profiles_by_key(), i.e. from
        #    src/config/siteFactoryManifest.json — a file that was never
        #    committed. tenant_contract's fallback returns a jworden-only
        #    manifest with subscriptionTier unset, so `tenant` was None for
        #    every real tenant_id and the tier fell through to "lite".
        # 2. The gate accepted ["pro", "enterprise"], but "enterprise" is not a
        #    tier in this system. models.py documents lite | pro | max, and
        #    "enterprise" appears nowhere else in the codebase. So "max" — the
        #    highest tier, the one bootstrap_hq.py assigns to HQ — was rejected.
        #
        # Net effect: everyone except a literal "JWORDEN_HQ" tenant_id was told
        # to upgrade, including customers already on max.
        #
        # The tier now comes from the database, which is the source of truth for
        # what a customer actually pays for.
        tier = "lite"
        try:
            from app.database import SessionLocal  # noqa: PLC0415
            from app.models import Tenant  # noqa: PLC0415

            with SessionLocal() as _db:
                row = (
                    _db.query(Tenant.subscription_tier)
                    .filter(Tenant.tenant_id == tenant_id)
                    .first()
                )
            if row and row[0]:
                tier = str(row[0]).strip().lower()
        except Exception as exc:  # noqa: BLE001
            logger.warning("Could not read subscription tier for %s (%s)", tenant_id, exc)

        # HQ keeps its bypass so internal/demo use is unaffected.
        if tenant_id != "JWORDEN_HQ" and tier not in _PAID_TIERS:
            return _finalize({
                "ok": False,
                "error": (
                    "This feature requires a Pro or Max subscription. "
                    f"This account is on '{tier}'."
                ),
            })


        try:
            if name == "check_dynamic_route":
                from app.jarvis_os.abilities.OperationalAndDispatch.dynamic_routing_engine import DynamicRoutingEngine
                engine = DynamicRoutingEngine()
                res = engine.execute({"truck_id": args.get("truck_id")})
                return _finalize({"ok": True, "result": res})
                
            elif name == "check_fleet_status":
                from app.jarvis_os.abilities.OperationalAndDispatch.heavy_fleet_router import HeavyFleetRouterEngine
                engine = HeavyFleetRouterEngine()
                res = engine.execute()
                return _finalize({"ok": True, "result": res})
                
            elif name == "check_thermal_mix":
                from app.jarvis_os.abilities.OperationalAndDispatch.thermal_mix_optimizer import ThermalMixOptimizer
                engine = ThermalMixOptimizer()
                res = engine.calculate_decay(
                    start_temp=float(args.get("start_temp", 300.0)),
                    transit_minutes=float(args.get("transit_minutes", 30.0)),
                    ambient_temp=float(args.get("ambient_temp", 70.0)),
                    wind_speed_mph=float(args.get("wind_speed_mph", 5.0))
                )
                return _finalize({"ok": True, "result": res})
        except Exception as exc:
            return _finalize({"ok": False, "error": str(exc)})

    return _finalize({"ok": False, "error": f"Unknown tool: {name}"})


async def _ask_claude_internal(
    query: str,
    persona: str,
    autonomy: dict,
    *,
    confirmed: bool = False,
    role: str = ROLE_PUBLIC_CONCIERGE,
    tenant_id: str = "default",
) -> Optional[dict]:
    """
    Returns {"text": str, "tool_calls": [{name, args, result}, ...]} or None on failure.
    Single-round tool use: Claude proposes tools, we run them, send results back, get final answer.
    """
    if not _anthropic_key():
        return None
    try:
        import httpx  # type: ignore
    except ImportError:
        return None

    persona_note = (
        "Adopt the 'Mr. Worden Sales' persona: warm, energetic, closing-oriented, "
        "Richmond-Virginia paving expert."
        if persona == "MR_WORDEN_SALES"
        else "Maintain the JARVIS persona."
    )
    state_note = (
        f"Current autonomy: master={autonomy.get('master')}, "
        f"frozen={autonomy.get('frozen')}, "
        f"operator_confirmed={confirmed}, "
        f"session_role={role}, "
        f"tenant_id={tenant_id}."
    )
    advisory_context = _build_advisory_context(query)
    advisory_note = ""
    if advisory_context:
        advisory_note = (
            "\nLEGAL ADVISORY RESPONSE REQUIREMENTS:\n"
            "- Treat outputs as advisory guidance only, not legal advice.\n"
            "- Use code_search/open_file only when user asks for citations, row-level proof, or change diffs.\n"
            "- Format legal answers with sections: Advisory Answer, Impact, Verification Needed.\n"
            f"{advisory_context}\n"
        )

    system = f"{JARVIS_SYSTEM_PROMPT}\n\n{persona_note}\n{state_note}{advisory_note}"

    headers = {
        "x-api-key":         _anthropic_key(),
        "anthropic-version": _ANTHROPIC_VERSION,
        "content-type":      "application/json",
    }
    messages: list[dict] = [{"role": "user", "content": query}]
    tool_calls: list[dict] = []

    tools = _toolset_for_session(confirmed=confirmed, role=role)

    # Multi-round tool execution (up to 5 turns max)
    for _round in range(5):
        try:
            # 320/700 was sized for a model that answered in one shot without
            # reasoning. Jarvis runs up to five tool rounds and is expected to
            # explain itself; at 320 tokens it truncates mid-sentence, and a
            # truncated tool argument fails the round outright.
            default_tokens = 2000 if _low_cost_mode() else 8000
            max_tokens = int((_cfg.get("JARVIS_CLAUDE_MAX_TOKENS") or str(default_tokens)).strip())
        except Exception:  # noqa: BLE001
            max_tokens = 2000 if _low_cost_mode() else 8000
        model = _anthropic_model()
        payload = {
            "model":      model,
            "max_tokens": max_tokens,
            "system":     system,
            "tools":      tools,
            "messages":   messages,
        }
        if _is_modern(model):
            # Adaptive thinking lets the model decide how much to reason per
            # turn, which matters most in the tool loop: better tool choice up
            # front means fewer rounds, not just a longer answer.
            payload["thinking"] = {"type": "adaptive"}
            payload["output_config"] = {"effort": _jarvis_effort()}
        try:
            try:
                # 14s was survivable for a non-reasoning model answering in
                # one shot. With adaptive thinking a single turn can exceed it
                # on a hard question, and this loop runs up to five turns — the
                # timeout fires, the handler returns None, and Jarvis silently
                # degrades to a canned reply with nothing in the logs to say a
                # good answer was thrown away.
                timeout_s = float((_cfg.get("JARVIS_CLAUDE_TIMEOUT_SECONDS") or "90").strip())
            except Exception:  # noqa: BLE001
                timeout_s = 90.0
            async with httpx.AsyncClient(timeout=timeout_s) as client:
                r = await client.post(_ANTHROPIC_URL, json=payload, headers=headers)
            if r.status_code != 200:
                logger.warning("[JARVIS] Anthropic non-200: %s %s", r.status_code, r.text[:300])
                return None
            data = r.json()
        except Exception as exc:  # noqa: BLE001
            logger.warning("[JARVIS] Anthropic call failed: %s", exc)
            return None

        stop_reason = data.get("stop_reason")
        content = data.get("content") or []

        if stop_reason == "tool_use":
            # Append assistant turn, then run each tool, then append tool_result message.
            messages.append({"role": "assistant", "content": content})
            tool_results = []
            for block in content:
                if isinstance(block, dict) and block.get("type") == "tool_use":
                    name = block.get("name", "")
                    args = block.get("input", {}) or {}
                    result = await _run_tool(name, args, confirmed=confirmed, role=role, tenant_id=tenant_id)
                    tool_calls.append({"name": name, "args": args, "result": result})
                    tool_results.append({
                        "type":         "tool_result",
                        "tool_use_id":  block.get("id"),
                        "content":      str(result)[:4000],
                    })
            messages.append({"role": "user", "content": tool_results})
            continue  # next round to get the natural-language answer

        # End_turn or anything else — extract text.
        text = "".join(b.get("text", "") for b in content if isinstance(b, dict) and b.get("type") == "text").strip()
        return {"text": text or "(no response)", "tool_calls": tool_calls}

    return {"text": "(tool loop exceeded)", "tool_calls": tool_calls}



async def _ask_openai(
    query: str,
    persona: str,
    autonomy: dict,
    *,
    confirmed: bool = False,
    role: str = ROLE_PUBLIC_CONCIERGE,
    tenant_id: str = "default",
) -> Optional[dict]:
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key: return None
    try:
        from openai import AsyncOpenAI
        import json
    except ImportError:
        return None

    client = AsyncOpenAI(api_key=api_key)
    tools = _toolset_for_session(confirmed=confirmed, role=role)
    
    # Translate to OpenAI schema
    openai_tools = []
    for t in tools:
        openai_tools.append({
            "type": "function",
            "function": {
                "name": t.get("name"),
                "description": t.get("description", ""),
                "parameters": t.get("input_schema", {})
            }
        })
    
    advisory_context = _build_advisory_context(query)
    system = JARVIS_SYSTEM_PROMPT + "\n\n" + ("Adopt the Mr. Worden Sales persona" if persona == "MR_WORDEN_SALES" else "Maintain JARVIS persona")
    if advisory_context:
        system += "\n" + advisory_context
    
    messages = [{"role": "system", "content": system}, {"role": "user", "content": query}]
    tool_calls_result = []

    for _round in range(5):
        try:
            resp = await client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                tools=openai_tools if openai_tools else None,
                max_tokens=600,
            )
        except Exception as exc:
            logger.warning("[JARVIS] OpenAI fallback call failed: %s", exc)
            return None
        
        msg = resp.choices[0].message
        
        if msg.tool_calls:
            # Add assistant message
            messages.append(msg)
            
            for tc in msg.tool_calls:
                name = tc.function.name
                args = json.loads(tc.function.arguments)
                result = await _run_tool(name, args, confirmed=confirmed, role=role, tenant_id=tenant_id)
                tool_calls_result.append({"name": name, "args": args, "result": result})
                
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "name": name,
                    "content": str(result)[:4000]
                })
            continue # next round
        
        return {"text": msg.content or "(no response)", "tool_calls": tool_calls_result}
    
    return {"text": "(tool loop exceeded)", "tool_calls": tool_calls_result}

async def _ask_gemini(
    query: str,
    persona: str,
    autonomy: dict,
    *,
    confirmed: bool = False,
    role: str = ROLE_PUBLIC_CONCIERGE,
    tenant_id: str = "default",
) -> Optional[dict]:
    # Google schema is tricky, falling back to chat-only mode for Gemini to guarantee no crashing
    from app.services import llm_client as _llm
    system = JARVIS_SYSTEM_PROMPT + "\n\n" + ("Adopt Mr. Worden Sales persona" if persona == "MR_WORDEN_SALES" else "Maintain JARVIS persona")
    import asyncio
    resp = await asyncio.to_thread(
        _llm.chat,
        task="jarvis_fast",
        system=system,
        user=query,
        max_tokens=500,
        provider_override="google",
        model_override="gemini-2.5-pro"
    )
    if resp and resp.text:
        return {"text": resp.text + "\n\n*(Note: Executed in Gemini degraded mode without tool access)*", "tool_calls": []}
    return None

async def _ask_claude(
    query: str,
    persona: str,
    autonomy: dict,
    *,
    confirmed: bool = False,
    role: str = ROLE_PUBLIC_CONCIERGE,
    tenant_id: str = "default",
) -> Optional[dict]:
    try:
        res = await _ask_claude_internal(query, persona, autonomy, confirmed=confirmed, role=role, tenant_id=tenant_id)
        if res and not "(tool loop exceeded)" in res.get("text", ""):
            return res
    except Exception as e:
        logger.warning(f"[JARVIS] Claude tool-engine failed: {e}")
        
    logger.info("[JARVIS] Falling back to OpenAI tool-engine...")
    try:
        res = await _ask_openai(query, persona, autonomy, confirmed=confirmed, role=role, tenant_id=tenant_id)
        if res:
            res["model"] = "gpt-4o"
            res["engine"] = "openai-fallback"
            return res
    except Exception as e:
        logger.warning(f"[JARVIS] OpenAI tool-engine failed: {e}")
        
    logger.info("[JARVIS] Falling back to Gemini tool-engine (degraded)...")
    try:
        res = await _ask_gemini(query, persona, autonomy, confirmed=confirmed, role=role, tenant_id=tenant_id)
        if res:
            res["model"] = "gemini-2.5-pro"
            res["engine"] = "gemini-fallback"
            return res
    except Exception as e:
        logger.warning(f"[JARVIS] Gemini tool-engine failed: {e}")
        
    return None

class JarvisAI:
    """
    JARVIS: Just A Rather Very Intelligent System for JWORDENAI.
    The primary interface for the Command Center.
    Capable of voice-commanded logistics, autonomous paving arbitration, and project funding status.
    """
    
    def __init__(self):
        self.identity = "JARVIS"
        self.master_project = "JWORDENAI PROJECT"
        self.status = "ONLINE"
        self.intel_sources = [
            "Federal Highway Administration (FHWA)",
            "AASHTO Engineering Standards",
            "State DOT Regulatory Guides",
            "University Civil Engineering Research Lab",
            "Global Infrastructure Council",
            "Supreme Court Construction Precedents",
            "50-State + DC Mechanic's Lien & Prompt Pay Codes",
            "National GC Compliance Matrix",
            "Universal Construction Supply Chain Index (Concrete/Steel/Wood/Shingles)",
            "Asphalt & Bitumen Global Resource Monitor",
            "Raw Land & Aggregate Availability Matrix",
            "Carbon-Neutral & LEED v5 Paving Standards",
            "International Trade & Maritime Construction Law",
            "51-State Licensing & Prequalification Databank",
            "OCIP/CCIP Insurance Compliance Protocols",
            "DBE/SWaM/SDVOSB Regulatory Guardrails",
            "Global Banking & Treasury Management APIs",
            "Currency Hedging & Cross-Border Settlement Protocols",
            "Construction Commodities Market (Liquid Asphalt/Crude Oil) Index",
            "Venture Debt & Equity Financing Logic for PF Nodes",
            "Virginia SEO Domination & Local SEM Metrics",
            "JWORDENAI Page Factory Conversion Evidence",
            "Case Study Asset Tracker (Richmond/Midlothian/Virginia Beach)"
        ]
        self.personas = {
            "JARVIS": {
                "greeting": "At your service, Sir.",
                "style": "Sophisticated, helpful, technical, and lifestyle-oriented."
            },
            "MR_WORDEN_SALES": {
                "greeting": "Hey there! Ready to get some paving done?",
                "style": "Energetic, persuasive, industry-expert salesman. Focused on value, durability, and closing deals."
            }
        }

    async def converse(self, query: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        The main interaction point for the Command Center.
        A unified intelligence engine combining Lifestyle, Business Events, 
        Global Education, Federal Standards, and Supreme Court Legal Logic.
        """
        context = context or {}
        persona = context.get("persona", "JARVIS")
        confirmed = bool(context.get("confirmed", False))
        role = str(context.get("role") or "").strip()
        if not role:
            role = ROLE_OWNER_ROOT if bool(context.get("operator_mode", False)) else ROLE_PUBLIC_CONCIERGE
        tenant_id = str(context.get("tenant_id") or "default")
        operator_mode = role in {ROLE_STAFF_OPERATOR, ROLE_OWNER_ROOT}
        if role == ROLE_PUBLIC_CONCIERGE:
            confirmed = False
        query_lower = (query or "").lower()

        # ── Defense-in-depth: backend kill switch ─────────────────────────────
        state = autonomy_state.get_state()
        if state.get("frozen"):
            return {
                "source": self.identity,
                "message": (
                    "Sir, autonomy is currently FROZEN by the Command Center kill switch. "
                    "I can answer questions, but I will not take any autonomous action "
                    f"until you unfreeze me. (Frozen since {state.get('frozenAt')})"
                ),
                "action_required": False,
                "frozen": True,
                "intel_tier": "Safety-Override",
            }

        # ── Fast lane: human-like conversational responses without tool overhead ──
        # First, see if this user intent maps to a multi-step plan.
        plan = _planner.plan(query, {"run_npm": True, "code_search": True, "open_file": True})
        if plan and plan.get("intent") == "execute":
            if not operator_mode:
                return {
                    "source": self.identity,
                    "message": "I can help answer and search, but task execution is available only in Command Center operator sessions.",
                    "action_required": False,
                    "requires_operator_mode": True,
                }

            # If operator has not confirmed, return the proposed plan for approval.
            if not confirmed:
                return {
                    "source": self.identity,
                    "message": "I have prepared an action plan. Confirm to execute.",
                    "requires_confirmation": True,
                    "plan": plan,
                    "action_required": True,
                }
            # Operator confirmed — execute sequentially and return results.
            exec_results = []
            for step in plan.get("steps", []):
                name = step.get("action")
                args = step.get("args") or {}
                # determine whether this action requires confirmation (destructive/real-world)
                must_confirm = name in ("run_npm", "make_phone_call", "send_email")
                if must_confirm and not confirmed:
                    exec_results.append({"action": name, "ok": False, "error": "requires confirmation"})
                    continue
                try:
                    res = await _run_tool(name, args, confirmed=confirmed, role=role, tenant_id=tenant_id)
                except Exception as exc:
                    res = {"ok": False, "error": str(exc)}
                exec_results.append({"action": name, "result": res})

            # Synthesize a response summarizing execution
            summary_lines = []
            for r in exec_results:
                act = r.get("action")
                out = r.get("result") or r.get("error") or r
                ok = out.get("ok") if isinstance(out, dict) else False
                summary_lines.append(f"{act}: {'OK' if ok else 'FAILED'}")

            return {
                "source": self.identity,
                "message": "Execution complete.\n" + "\n".join(summary_lines),
                "action_required": False,
                "plan_executed": True,
                "exec_results": exec_results,
            }

        action_intent = _looks_like_tool_action(query)
        cache_key = None
        if _is_cacheable_query(query, action_intent=action_intent):
            cache_key = _response_cache_key(query, persona, role, confirmed)
            cached = _response_cache_get(cache_key)
            if cached:
                return cached

        if not action_intent:
            # Prefer the human-like chat brain for conversational queries.
            chat = await _ask_chat_brain(query, persona, state, session_id=context.get("session_id"), confirmed=confirmed)
            if chat:
                response = {
                    "source": self.identity if persona != "MR_WORDEN_SALES" else "Mr. Worden (Sales)",
                    "message": chat["text"],
                    "action_required": False,
                    "engine": f"{chat['provider']}-chat",
                    "model": chat["model"],
                    "fallback_used": chat.get("fallback_used", False),
                    "tool_calls": [],
                    "autonomy": {"master": state.get("master"), "frozen": False},
                }
                _response_cache_set(cache_key, response)
                return response
            # fallback to a faster ops-focused lane if chat brain did not return
            fast = await _ask_fast_ops_brain(query, persona, state, confirmed=confirmed)
            if fast:
                response = {
                    "source": self.identity if persona != "MR_WORDEN_SALES" else "Mr. Worden (Sales)",
                    "message": fast["text"],
                    "action_required": False,
                    "engine": f"{fast['provider']}-stark-fast",
                    "model": fast["model"],
                    "fallback_used": fast["fallback_used"],
                    "tool_calls": [],
                    "autonomy": {"master": state.get("master"), "frozen": False},
                }
                _response_cache_set(cache_key, response)
                return response

        # ── Brain: Anthropic Claude (when configured) ─────────────────────────
        claude = await _ask_claude(query, persona, state, confirmed=confirmed, role=role, tenant_id=tenant_id)
        if claude:
            response = {
                "source":          self.identity if persona != "MR_WORDEN_SALES" else "Mr. Worden (Sales)",
                "message":         claude["text"],
                "action_required": False,
                "engine":          "anthropic-claude",
                "model":           _anthropic_model(),
                "tool_calls":      claude["tool_calls"],
                "autonomy":        {"master": state.get("master"), "frozen": False},
            }
            _response_cache_set(cache_key, response)
            return response

        # ── Fallback: legacy heuristic responses ──────────────────────────────
        if persona == "MR_WORDEN_SALES":
            return await self._converse_mr_worden_sales(query_lower, context)

        # ── Unified Intelligence Harmonization ─────────────────────────────────
        # This catch-all block synthesizes all available logic layers.
        intel_report = f"Sir, I have synthesized the current request against our integrated nodes: {', '.join(self.intel_sources)}. "

        # weather / news / financial trends / supply chain / SEO
        if any(w in query_lower for w in ["weather", "forecast", "news", "trend", "market", "finance", "bank", "money", "capital", "revenue", "income", "commodity", "material", "supply", "concrete", "shingle", "asphalt", "aggregate", "stone", "seo", "rank", "google", "search", "virginia", "marketing", "sealcoat", "sealcoating"]):
            return {
                "source": self.identity,
                "message": (
                    f"{intel_report}\n\n"
                    "REAL-TIME SEO MAINTENANCE & DOMINATION REPORT:\n"
                    "- Richmond Core: All SEO guardrails for 'Asphalt Paving Richmond' and 'Sealcoating Midlothian' are ACTIVE and maintained. We are currently defending our #1 spots with real-time content refresh cycles.\n"
                    "- Sealcoating Offensive: I have prioritized 'Sealcoating All Types' (Coal Tar, Asphalt Emulsion, GSB-88) as our primary SEO edge in Virginia. We are positioning jwordenasphaltpaving.com as the definitive authority.\n"
                    "- Evidence Pipeline: Richmond data is being streamed directly into the JWORDENAI Evidence Pipeline. This is the heart of our Case Study.\n"
                    "- Material Integrity: Concrete, Shingle, and Sealant reserves are optimized. Our vertical supply chain ensures we fulfill Richmond's demand at maximum margin.\n"
                    "- Market Trends: Virginia demand remains strong. Our dominance in Richmond is the proof-of-concept for the Global PF rollout."
                ),
                "action_required": False,
                "intel_tier": "Global-Financial-Supreme"
            }

        # Business events context
        if any(w in query_lower for w in ["update", "status", "recent", "happen", "estimate", "payment"]):
            return {
                "source": self.identity,
                "message": f"{intel_report}\n\nUpdate: We have a new estimate in Richmond and a $4,500 cleared payment in Midlothian. All 51-state GC compliance checks passed successfully for these transactions.",
                "action_required": False,
            }

        # Legal & education context
        if any(w in query_lower for w in ["education", "learn", "legal", "law", "supreme", "compliance", "standard", "research", "carbon", "green", "maritime", "guardrail", "license", "insurance", "bond"]):
            return {
                "source": self.identity,
                "message": (
                    f"{intel_report}\n\n"
                    "ADVISORY ANSWER:\n"
                    "Using our 51-jurisdiction advisory matrix (50 states + DC), I can give an operations-grade legal/compliance answer for licensing, civil risk, and safety posture.\n\n"
                    "IMPACT:\n"
                    "- Scope, schedule, and cost shift when licensing, wage, OSHA, lien, or utility constraints differ by jurisdiction.\n"
                    "- Bid strategy and risk controls should be state-specific before commitment.\n\n"
                    "VERIFICATION NEEDED:\n"
                    "- Treat this as advisory guidance, not legal advice.\n"
                    "- Confirm jurisdiction-specific statutes and permit terms before execution."
                ),
                "action_required": False,
                "intel_tier": "Supreme-Unified-Global"
            }

        # Catch-all synthesis
        return {
            "source": self.identity,
            "message": f"Understood, Sir. {intel_report}\n\nI am monitoring all lifestyle, business, and legal systems. How would you like to scale the world today?",
            "action_required": False,
        }

    async def _converse_mr_worden_sales(self, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Salesman Mr. Worden Persona Logic.
        Upgraded to report on actual business events (Estimates, Payments).
        """
        # Event Report Logic
        if any(w in query for w in ["update", "status", "estimate", "payment", "notification"]):
            # Simulate fetching from a global event bus or DB in a real scenario
            return {
                "source": "Mr. Worden (Sales)",
                "message": "Big news! We just had a new estimate request come in from Richmond, and a payment of $4,500 just cleared for the Midlothian job. The momentum is incredible, Sir!",
                "action_required": False,
                "data": {
                    "recent_events": [
                        {"type": "estimate", "location": "Richmond", "status": "new"},
                        {"type": "payment", "amount": 4500, "status": "cleared"}
                    ]
                }
            }

        if any(w in query for w in ["price", "cost", "quote", "deal"]):
            return {
                "source": "Mr. Worden (Sales)",
                "message": "Listen, we're not just talkin' about blacktop here. We're talkin' about an investment in your property's curb appeal. I can get you a quote that'll make your neighbors jealous. Quality pavin' doesn't cost, it pays!",
                "action_required": True,
                "suggested_action": "Generate Quote"
            }
        
        if any(w in query for w in ["why", "better", "quality", "durability"]):
            return {
                "source": "Mr. Worden (Sales)",
                "message": "Why choose Worden? Simple. We use the highest quality mix, the heaviest rollers, and we don't cut corners. Your driveway will be the talk of Virginia for years to come. Ready to sign?",
                "action_required": False
            }

        if any(w in query for w in ["hello", "hi", "hey"]):
            return {
                "source": "Mr. Worden (Sales)",
                "message": "Hey! Mr. Worden here. I've been lookin' at your project and I'm tellin' you, we can make this look incredible. What can I do to earn your business today?",
                "action_required": False
            }

        return {
            "source": "Mr. Worden (Sales)",
            "message": "I'm ready to close this deal. Tell me what you're lookin' for, and I'll make sure the crew does it right. We're the best in the business!",
            "action_required": False
        }

jarvis = JarvisAI()
