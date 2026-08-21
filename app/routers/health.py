"""
health.py — Health check endpoints for Railway deployment probes.

Routes:
  GET /health        — basic liveness (already registered in main.py, kept for compat)
  GET /health/live   — liveness probe: is the process up?
  GET /health/ready  — readiness probe: are all dependencies reachable?

Railway should be configured to use /health/ready as the health check path.
Returns HTTP 200 when healthy, HTTP 503 when any critical dependency is down.
"""

import logging
import time

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse

from ..core.security import verify_premium_security
from ..services.celery_health import (
    check_celery_workers,
    check_queue_depth,
    check_redis_connection,
)
from ..services import autonomy_state
from ..services import web_search as _web_search
from ..services import vapi_caller as _vapi
from ..services import tts_service as _tts
from ..services import runtime_config as _cfg
from ..services.state_data import (
    STATE_MAP,
    TOTAL_US_JURISDICTIONS,
    WORDEN_ACTIVE_STATES,
)
from app.services.jarvis import DEFAULT_ANTHROPIC_MODEL as _DEFAULT_MODEL  # single source of truth for the model default

logger = logging.getLogger(__name__)

router = APIRouter(tags=["ops"])


def _background_stack_configured() -> bool:
    """
    Returns True when Redis/Celery broker settings are explicitly configured.

    In local dev, these env vars are often intentionally unset. In that case
    readiness should not hard-fail on localhost Redis probes.
    """
    return any(
        (
            _cfg.get("REDIS_URL").strip(),
            _cfg.get("CELERY_BROKER_URL").strip(),
            _cfg.get("CELERY_RESULT_BACKEND").strip(),
        )
    )


def _background_stack_health() -> tuple[dict, dict, dict, bool]:
    """
    Returns redis/celery/queue health plus whether the stack is configured.
    """
    configured = _background_stack_configured()
    if not configured:
        skipped = {
            "ok": True,
            "status": "skipped",
            "reason": "REDIS_URL / CELERY_BROKER_URL not configured",
        }
        return skipped, skipped.copy(), skipped.copy(), configured

    redis_status = check_redis_connection()
    celery_status = check_celery_workers()
    queue_status = check_queue_depth()
    return redis_status, celery_status, queue_status, configured


def _elasticsearch_configured() -> bool:
    """
    Returns True when Elasticsearch is explicitly configured.

    Avoid localhost timeouts in local dev where search infra is intentionally
    absent and no ELASTICSEARCH_* variables are provided.
    """
    return any(
        (
            _cfg.get("ELASTICSEARCH_HOST").strip(),
            _cfg.get("ELASTICSEARCH_URL").strip(),
            _cfg.get("ELASTICSEARCH_CLOUD_ID").strip(),
        )
    )


def _elasticsearch_health() -> dict:
    """
    Returns Elasticsearch health status, or skipped when not configured.
    """
    if not _elasticsearch_configured():
        return {
            "ok": True,
            "status": "skipped",
            "reason": "ELASTICSEARCH_HOST not configured",
        }

    try:
        from ..services import search_service  # noqa: PLC0415

        return search_service.health()
    except Exception as exc:  # noqa: BLE001
        logger.warning("ES readiness check failed: %s", exc)
        return {"ok": False, "error": str(exc)}


@router.get("/health/live", summary="Liveness probe — is the process running?")
def health_live():
    """
    Lightweight liveness check.  Returns 200 as long as the Python process is
    alive and the event loop is responsive.  Railway uses this to decide whether
    to restart the container.
    """
    return {"status": "ok", "service": "JWordenAI"}


@router.get("/health/ready", summary="Readiness probe — are all dependencies up?")
def health_ready():
    """
    Full readiness check.  Verifies:
      - Redis connectivity (required for Celery broker)
      - Celery worker availability
      - Task queue depth

    Returns 200 if all systems are operational, 503 if any critical dependency
    is unavailable.  Railway routes traffic here only when this returns 200.
    """
    start = time.monotonic()

    redis_status, celery_status, queue_status, background_configured = _background_stack_health()

    # Database connectivity — quick SELECT 1
    db_status: dict = {"ok": False, "error": "not checked"}
    try:
        from ..database import engine  # noqa: PLC0415
        from sqlalchemy import text  # noqa: PLC0415

        t0 = time.monotonic()
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = {"ok": True, "latency_ms": round((time.monotonic() - t0) * 1000, 2)}
    except Exception as exc:  # noqa: BLE001
        logger.warning("DB readiness check failed: %s", exc)
        db_status = {"ok": False, "error": str(exc)}

    # Elasticsearch connectivity — optional, does not affect readiness
    es_status = _elasticsearch_health()

    all_ok = redis_status["ok"] and db_status["ok"]
    # Celery workers are optional — warn but don't fail readiness if no workers
    # are running (e.g. during initial deploy before worker pod starts).
    celery_ok = celery_status.get("ok", False)
    if background_configured and not celery_ok:
        logger.warning("Celery workers unavailable during readiness check")

    elapsed_ms = round((time.monotonic() - start) * 1000, 2)

    payload = {
        "status": "ready" if all_ok else "degraded",
        "checks": {
            "redis": redis_status,
            "database": db_status,
            "celery": celery_status,
            "queue": queue_status,
            "elasticsearch": es_status,
        },
        "elapsed_ms": elapsed_ms,
    }

    status_code = 200 if all_ok else 503
    return JSONResponse(content=payload, status_code=status_code)


@router.get("/api/v1/ops/dashboard-preflight", summary="Command Center preflight (always 200)")
def dashboard_preflight():
    """
    UI-safe readiness snapshot for the owner dashboards.

    Always returns HTTP 200 so frontend polling does not hard-fail when one
    subsystem is degraded. The payload contains strict flags for infra and
    Jarvis full-capacity mode.
    """
    start = time.monotonic()

    redis_status, celery_status, queue_status, _ = _background_stack_health()

    db_status: dict = {"ok": False, "error": "not checked"}
    try:
        from ..database import engine  # noqa: PLC0415
        from sqlalchemy import text  # noqa: PLC0415

        t0 = time.monotonic()
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = {"ok": True, "latency_ms": round((time.monotonic() - t0) * 1000, 2)}
    except Exception as exc:  # noqa: BLE001
        logger.warning("DB preflight check failed: %s", exc)
        db_status = {"ok": False, "error": str(exc)}

    state = autonomy_state.get_state()
    anthropic_ready = bool(_cfg.get("ANTHROPIC_API_KEY").strip())
    web_ready = _web_search.is_available()
    call_ready = _vapi.is_available()
    email_ready = bool(_cfg.get("SENDGRID_API_KEY").strip() and _cfg.get("SENDGRID_FROM_EMAIL").strip())
    tts_provider = _tts.active_provider()
    tts_ready = tts_provider != "none"
    frozen = bool(state.get("frozen"))

    jarvis_blockers: list[str] = []
    if frozen:
        jarvis_blockers.append("Autonomy is frozen")
    if not anthropic_ready:
        jarvis_blockers.append("ANTHROPIC_API_KEY missing")
    if not web_ready:
        jarvis_blockers.append("TAVILY_API_KEY missing")
    if not call_ready:
        jarvis_blockers.append("Vapi integration not fully configured")
    if not email_ready:
        jarvis_blockers.append("SENDGRID_API_KEY/SENDGRID_FROM_EMAIL missing")
    if not tts_ready:
        jarvis_blockers.append("No TTS provider configured")

    infra_ok = bool(redis_status.get("ok") and db_status.get("ok"))
    jarvis_full_capacity = len(jarvis_blockers) == 0
    elapsed_ms = round((time.monotonic() - start) * 1000, 2)

    return {
        "ok": infra_ok,
        "status": "ready" if infra_ok else "degraded",
        "infra": {
            "redis": redis_status,
            "database": db_status,
            "celery": celery_status,
            "queue": queue_status,
        },
        "jarvis": {
            "full_capacity": jarvis_full_capacity,
            "engine": "anthropic-claude" if anthropic_ready else "heuristic-fallback",
            "model": (_cfg.get("ANTHROPIC_MODEL") or _DEFAULT_MODEL) if anthropic_ready else None,
            "tools": {
                "web_search": web_ready,
                "make_phone_call": call_ready,
                "send_email": email_ready,
                "tts": tts_ready,
            },
            "tts_provider": tts_provider,
            "autonomy": {
                "master": state.get("master"),
                "frozen": frozen,
                "frozenAt": state.get("frozenAt"),
            },
            "blockers": jarvis_blockers,
        },
        "elapsed_ms": elapsed_ms,
    }


@router.get("/api/v1/ops/state-reach", summary="State rollout coverage snapshot")
def state_reach_snapshot():
    """
    Returns operational visibility for staged state expansion.

    This endpoint is read-only and safe for dashboard polling.
    """
    all_codes = sorted(STATE_MAP.keys())
    active_codes = [abbr for abbr in WORDEN_ACTIVE_STATES if abbr in STATE_MAP]
    active_set = set(active_codes)
    inactive_codes = [abbr for abbr in all_codes if abbr not in active_set]

    total_jurisdictions = TOTAL_US_JURISDICTIONS or len(all_codes)
    active_count = len(active_set)
    inactive_count = max(total_jurisdictions - active_count, 0)
    coverage_pct = round((active_count / total_jurisdictions) * 100, 2) if total_jurisdictions else 0.0

    density_rank = {"high": 3, "medium": 2, "low": 1}
    priority_candidates = sorted(
        [
            {
                "abbr": abbr,
                "name": STATE_MAP[abbr].get("name"),
                "region": STATE_MAP[abbr].get("region"),
                "qsrDensity": STATE_MAP[abbr].get("qsrDensity"),
                "laborIndex": STATE_MAP[abbr].get("laborIndex"),
                "materialPremium": STATE_MAP[abbr].get("materialPremium"),
            }
            for abbr in inactive_codes
        ],
        key=lambda row: (
            -(density_rank.get(str(row.get("qsrDensity", "")).lower(), 0)),
            -(row.get("laborIndex") or 0),
            row.get("abbr") or "",
        ),
    )[:12]

    return {
        "total_jurisdictions": total_jurisdictions,
        "active_count": active_count,
        "inactive_count": inactive_count,
        "coverage_pct": coverage_pct,
        "active_states": active_codes,
        "inactive_states": inactive_codes,
        "priority_candidates": priority_candidates,
        "dataset_integrity": {
            "state_map_count": len(all_codes),
            "expected_count": TOTAL_US_JURISDICTIONS,
            "ok": len(all_codes) == TOTAL_US_JURISDICTIONS,
        },
    }


@router.get(
    "/api/v1/ops/self-heal/status",
    summary="Self-heal monitor status (admin only)",
)
def self_heal_status(_: dict = Depends(verify_premium_security)):
    """Returns config + last execution state for the continuous self-heal loop."""
    from ..services.self_heal import get_self_heal_status  # noqa: PLC0415

    return get_self_heal_status()


@router.get(
    "/api/v1/ops/backups",
    summary="Backup status — when was the last one, and is it fresh? (admin only)",
)
def backup_status(_: dict = Depends(verify_premium_security)):
    """
    What the backup situation actually is, rather than whether a schedule
    exists. Reports the newest stored backup and its age; `latest: null` means
    nothing has ever been stored, which is the answer that matters most and
    the one a "backups: enabled" flag would hide.
    """
    from ..services import db_backup  # noqa: PLC0415

    try:
        newest = db_backup.latest()
    except db_backup.BackupError as exc:
        return {
            "configured": False,
            "latest": None,
            "detail": str(exc),
        }

    age = (newest or {}).get("age_hours")
    return {
        "configured": True,
        "latest": newest,
        "stale": bool(age is not None and age > 36),
        "retention_days": db_backup.RETENTION_DAYS,
        "minimum_kept": db_backup.RETENTION_MIN_KEEP,
    }


@router.post(
    "/api/v1/ops/backups/run",
    summary="Take a backup right now (admin only)",
)
def run_backup_now(_: dict = Depends(verify_premium_security)):
    """
    Run a backup synchronously and report the manifest.

    Worth having separately from the schedule: before a risky operation — a
    bulk customer import, a migration — the useful thing is a backup taken
    just now and confirmed restorable, not one from last night.
    """
    from ..services import db_backup  # noqa: PLC0415

    try:
        manifest = db_backup.create_backup()
    except db_backup.BackupError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return {"ok": True, "backup": manifest.to_dict()}


@router.get(
    "/api/v1/ops/notification-reach",
    summary="Can an incoming lead actually reach anybody? (admin only)",
)
def notification_reach(_: dict = Depends(verify_premium_security)):
    """
    Which lead-notification channels are configured in this process.

    A lead pipeline with no configured channel is indistinguishable from a
    quiet week: the form accepts the submission, the row is saved, the
    endpoint returns 200, and the send fails in a background task after the
    response has gone. This endpoint separates "nothing was sent" from
    "nothing could be sent".

    Reports booleans and provider names only — never key material.
    """
    from ..services import notification_health  # noqa: PLC0415

    return notification_health.check()
