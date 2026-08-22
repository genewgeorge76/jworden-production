"""
system.py — The Super Admin "single pane of glass" over external integrations.

This endpoint feeds src/pages/ApiDashboard.jsx, where every row renders a green
tick or a red cross. Three separate things used to make those ticks meaningless:

  1. AI providers were reported "connected" from `bool(os.getenv(KEY))`. A
     revoked key is a non-empty string, so a dead OPENAI_API_KEY showed green
     while every call behind it 401'd.
  2. GoDaddy, Vercel and Fly were hardcoded to "connected" with no check of any
     kind — a literal in the source, rendered as a live status.
  3. Every row carried a `monthly_estimate` that was invented at authoring
     time, and the dashboard summed them into an "EST. MONTHLY SPEND" figure
     that had never been read from any billing API.

Now: AI providers are probed for real (see app/services/provider_health.py),
everything else reports whether a credential is *present* and says plainly that
presence is all that was checked, and spend is null until something reads it
from a billing source.

Status vocabulary — the dashboard keys its colours off these:

  live             probed and answering
  invalid_credentials  probed and rejected — rotate the key
  degraded         probed and answering badly
  unreachable      probed and no answer
  configured       a credential is set; reachability NOT checked
  unverified       nothing has been checked yet in this process
  not_configured   no credential set
"""

from __future__ import annotations

import os

from fastapi import APIRouter

from ..services import provider_health

router = APIRouter(prefix="/api/v1/system", tags=["system"])

# Providers this backend can ask "does my key work" in one cheap request.
_PROBED_AI = (
    ("openai", ["gpt-5.6-turbo", "gpt-4o", "gpt-4o-mini"]),
    ("anthropic", ["claude-opus-5", "claude-sonnet-4-6"]),
    ("google", ["gemini-2.5-pro", "gemini-2.5-flash"]),
    ("perplexity", ["sonar-pro"]),
    ("xai", ["grok-4.6"]),
)

# Integrations with no cheap, side-effect-free liveness check wired up. These
# report credential presence only, and say so in `checked`.
_PRESENCE_ONLY = (
    ("twilio", "Twilio", "comms", ("TWILIO_ACCOUNT_SID",)),
    ("vapi", "Vapi Voice AI", "comms", ("VAPI_API_KEY",)),
    ("stripe", "Stripe Payments", "finance", ("STRIPE_SECRET_KEY",)),
    ("godaddy", "GoDaddy DNS", "infra", ("GODADDY_API_KEY", "GODADDY_KEY")),
    ("vercel", "Vercel Frontend", "infra", ("VERCEL_TOKEN", "VERCEL_API_TOKEN")),
)


def _presence_row(pid: str, name: str, category: str, env: tuple[str, ...]) -> dict:
    present = any((os.getenv(var) or "").strip() for var in env)
    return {
        "id": pid,
        "name": name,
        "provider": pid,
        "category": category,
        "configured": present,
        "status": "configured" if present else "not_configured",
        "checked": "credential presence only — reachability not probed",
        "detail": (
            "A credential is set in this environment. Whether it is valid has "
            "not been tested."
            if present
            else "No credential set in this environment"
        ),
        "checked_at": None,
        "monthly_estimate_usd": None,
    }


@router.get("/apis")
async def get_api_statuses():
    """
    Report every external integration, distinguishing observed liveness from
    the mere presence of a key.

    AI provider results are cached for five minutes, so repeated dashboard
    loads do not cost a round trip per provider.
    """
    apis: list[dict] = []

    probes = await provider_health.check_all([pid for pid, _ in _PROBED_AI])

    for pid, models in _PROBED_AI:
        result = probes.get(pid) or provider_health.cached(pid)
        apis.append(
            {
                "id": pid,
                "name": result["label"],
                "provider": pid,
                "category": "ai",
                "configured": result["configured"],
                "status": result["status"],
                "checked": "live probe",
                "detail": result["detail"],
                "status_code": result["status_code"],
                "latency_ms": result["latency_ms"],
                "checked_at": result["checked_at"],
                "models": models,
                "monthly_estimate_usd": None,
            }
        )

    for pid, name, category, env in _PRESENCE_ONLY:
        apis.append(_presence_row(pid, name, category, env))

    # Fly is the one piece of infrastructure this process can speak to from
    # first-hand knowledge: if FLY_APP_NAME is in the environment, this code is
    # running on Fly, and the fact that it is answering the request proves it.
    fly_app = (os.getenv("FLY_APP_NAME") or "").strip()
    apis.append(
        {
            "id": "flyio",
            "name": "Fly.io Backend",
            "provider": "flyio",
            "category": "infra",
            "configured": bool(fly_app),
            "status": "live" if fly_app else "unverified",
            "checked": "self-report — this process is serving the request",
            "detail": (
                f"Serving from Fly app '{fly_app}'"
                if fly_app
                else "FLY_APP_NAME not set — not running on Fly, or not detectable"
            ),
            "checked_at": None,
            "monthly_estimate_usd": None,
        }
    )

    live = sum(1 for a in apis if a["status"] == "live")
    return {
        "apis": apis,
        "summary": {
            "total": len(apis),
            "live": live,
            "configured_not_probed": sum(1 for a in apis if a["status"] == "configured"),
            "not_configured": sum(1 for a in apis if a["status"] == "not_configured"),
            "failing": sum(
                1
                for a in apis
                if a["status"]
                in ("invalid_credentials", "degraded", "unreachable")
            ),
        },
        "spend": {
            "monthly_usd": None,
            "note": (
                "Not reported. No billing API is wired up; the figures that "
                "used to appear here were authored by hand, not read from a "
                "provider."
            ),
        },
    }
