"""
metrics.py — Operational monitoring endpoints for JWordenAI.

Routes (all require premium security):
  GET /api/v1/metrics/celery    — Celery queue depth, active tasks, failed tasks
  GET /api/v1/metrics/redis     — Redis memory usage, key count, connected clients
  GET /api/v1/metrics/database  — Postgres connection pool stats, query latency
  GET /api/v1/metrics/ai        — OpenAI call counters, latency, error rate
  GET /api/v1/metrics/cache     — Redis cache hit/miss ratio and counters

All endpoints are rate-limited to 30/minute and require the premium security
header (master key or JWT).
"""

import logging
import os
import time
from typing import Any
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse

from ..core.cache import get_cache_stats
from ..core.limiter import HEALTH_LIMIT, limiter
from ..core.security import verify_premium_security
from ..services.celery_health import (
    check_celery_workers,
    check_queue_depth,
    check_redis_connection,
)
from ..services import jarvis_observability as _jarvis_observability

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/metrics", tags=["metrics"])

_REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")


def _is_configured(value: str | None) -> bool:
    return bool((value or "").strip())


def _sentry_probe_url_from_dsn(dsn: str | None) -> str | None:
    raw = (dsn or "").strip()
    if not raw:
        return None
    parsed = urlparse(raw)
    if not parsed.scheme or not parsed.netloc:
        return None
    return f"{parsed.scheme}://{parsed.netloc}/api/0/"


async def _probe_provider(
    client: httpx.AsyncClient,
    *,
    method: str,
    url: str,
    configured: bool,
    headers: dict[str, str] | None = None,
    json_payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if not configured:
        return {
            "up": False,
            "status": "not_configured",
            "status_code": None,
            "latency_ms": None,
            "detail": "Missing credentials",
        }

    t0 = time.monotonic()
    try:
        response = await client.request(
            method,
            url,
            headers=headers,
            json=json_payload,
        )
        latency_ms = round((time.monotonic() - t0) * 1000, 2)
        up = 200 <= response.status_code < 300
        detail = "ok" if up else f"HTTP {response.status_code}"
        return {
            "up": up,
            "status": "ok" if up else "degraded",
            "status_code": response.status_code,
            "latency_ms": latency_ms,
            "detail": detail,
        }
    except Exception as exc:  # noqa: BLE001
        latency_ms = round((time.monotonic() - t0) * 1000, 2)
        return {
            "up": False,
            "status": "error",
            "status_code": None,
            "latency_ms": latency_ms,
            "detail": str(exc),
        }


# ── Celery metrics ────────────────────────────────────────────────────────────

@router.get("/celery", summary="Celery queue depth, active tasks, and worker status")
@limiter.limit(HEALTH_LIMIT)
async def celery_metrics(
    request: Request,
    _: dict = Depends(verify_premium_security),
):
    """Return Celery broker queue depth, active task counts, and worker availability."""
    workers = check_celery_workers()
    queue = check_queue_depth()

    active_tasks: dict = {}
    reserved_tasks: dict = {}
    failed_tasks_count: int = 0

    try:
        from ..celery_app import celery_app  # noqa: PLC0415

        inspector = celery_app.control.inspect(timeout=3.0)
        active_tasks = inspector.active() or {}
        reserved_tasks = inspector.reserved() or {}

        # Count total active tasks across all workers
        total_active = sum(len(v) for v in active_tasks.values())
        total_reserved = sum(len(v) for v in reserved_tasks.values())
    except Exception as exc:  # noqa: BLE001
        logger.warning("Could not inspect Celery tasks: %s", exc)
        total_active = 0
        total_reserved = 0

    return {
        "workers": workers,
        "queue": queue,
        "active_tasks": total_active,
        "reserved_tasks": total_reserved,
    }


# ── Redis metrics ─────────────────────────────────────────────────────────────

@router.get("/redis", summary="Redis memory usage, key count, and client connections")
@limiter.limit(HEALTH_LIMIT)
async def redis_metrics(
    request: Request,
    _: dict = Depends(verify_premium_security),
):
    """Return Redis server INFO stats: memory, key count, connected clients."""
    ping = check_redis_connection()
    if not ping["ok"]:
        return JSONResponse(
            status_code=503,
            content={"status": "unavailable", "error": ping.get("error")},
        )

    try:
        import redis as redis_lib  # type: ignore

        client = redis_lib.from_url(_REDIS_URL, socket_connect_timeout=3, socket_timeout=3)
        info = client.info()
        db_info = client.info("keyspace")
        client.close()

        total_keys = sum(
            v.get("keys", 0) for v in db_info.values() if isinstance(v, dict)
        )

        return {
            "status": "ok",
            "latency_ms": ping.get("latency_ms"),
            "used_memory_human": info.get("used_memory_human"),
            "used_memory_bytes": info.get("used_memory"),
            "peak_memory_human": info.get("used_memory_peak_human"),
            "connected_clients": info.get("connected_clients"),
            "total_keys": total_keys,
            "redis_version": info.get("redis_version"),
            "uptime_seconds": info.get("uptime_in_seconds"),
            "evicted_keys": info.get("evicted_keys", 0),
            "keyspace_hits": info.get("keyspace_hits", 0),
            "keyspace_misses": info.get("keyspace_misses", 0),
        }
    except Exception as exc:  # noqa: BLE001
        logger.error("Redis metrics collection failed: %s", exc)
        return JSONResponse(
            status_code=503,
            content={"status": "error", "error": str(exc)},
        )


# ── Database metrics ──────────────────────────────────────────────────────────

@router.get("/database", summary="Postgres connection pool stats and query latency")
@limiter.limit(HEALTH_LIMIT)
async def database_metrics(
    request: Request,
    _: dict = Depends(verify_premium_security),
):
    """Return SQLAlchemy connection pool stats and a SELECT 1 latency probe."""
    try:
        from ..database import engine  # noqa: PLC0415
        from sqlalchemy import text  # noqa: PLC0415

        pool = engine.pool

        t0 = time.monotonic()
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        latency_ms = round((time.monotonic() - t0) * 1000, 2)

        pool_status: dict = {
            "pool_size": getattr(pool, "size", lambda: None)(),
            "checked_out": getattr(pool, "checkedout", lambda: None)(),
            "overflow": getattr(pool, "overflow", lambda: None)(),
            "checked_in": getattr(pool, "checkedin", lambda: None)(),
        }

        return {
            "status": "ok",
            "query_latency_ms": latency_ms,
            "pool": pool_status,
            "database_url_host": engine.url.host,
            "dialect": engine.dialect.name,
        }
    except Exception as exc:  # noqa: BLE001
        logger.error("Database metrics collection failed: %s", exc)
        return JSONResponse(
            status_code=503,
            content={"status": "error", "error": str(exc)},
        )


# ── AI / OpenAI metrics ───────────────────────────────────────────────────────

# In-process counters — reset on worker restart.  For persistent metrics,
# integrate with Prometheus or a time-series DB.
_ai_counters: dict[str, int | float] = {
    "total_calls": 0,
    "successful_calls": 0,
    "failed_calls": 0,
    "total_latency_ms": 0.0,
}


def record_ai_call(success: bool, latency_ms: float) -> None:
    """Call this from AI endpoints to update in-process counters."""
    _ai_counters["total_calls"] += 1
    _ai_counters["total_latency_ms"] += latency_ms
    if success:
        _ai_counters["successful_calls"] += 1
    else:
        _ai_counters["failed_calls"] += 1


@router.get("/ai", summary="OpenAI API call counts, latency, and error rate")
@limiter.limit(HEALTH_LIMIT)
async def ai_metrics(
    request: Request,
    _: dict = Depends(verify_premium_security),
):
    """
    Return in-process OpenAI call statistics since the last worker restart.

    Note: counters are per-worker-process and reset on restart.  For
    persistent metrics, configure Sentry performance monitoring or export
    to an external time-series store.
    """
    total = _ai_counters["total_calls"]
    avg_latency = (
        round(_ai_counters["total_latency_ms"] / total, 2) if total > 0 else 0.0
    )
    error_rate = (
        round(_ai_counters["failed_calls"] / total * 100, 2) if total > 0 else 0.0
    )

    openai_configured = bool(os.getenv("OPENAI_API_KEY", ""))

    return {
        "openai_configured": openai_configured,
        "total_calls": total,
        "successful_calls": _ai_counters["successful_calls"],
        "failed_calls": _ai_counters["failed_calls"],
        "error_rate_pct": error_rate,
        "avg_latency_ms": avg_latency,
        "note": "Counters are per-process and reset on worker restart.",
    }


# ── Cache metrics ─────────────────────────────────────────────────────────────


@router.get("/cache", summary="Redis cache hit/miss ratio and per-key counters")
@limiter.limit(HEALTH_LIMIT)
async def cache_metrics(
    request: Request,
    _: dict = Depends(verify_premium_security),
):
    """
    Return in-process cache hit/miss counters and the computed hit ratio.

    Counters are per-worker-process and reset on restart.  A hit_ratio_pct
    above 70 % indicates the cache is working effectively.  Below 30 % may
    indicate TTLs are too short or the cache warmer is not running.
    """
    stats = get_cache_stats()
    return {
        **stats,
        "note": "Counters are per-process and reset on worker restart.",
    }


@router.get("/jarvis", summary="Jarvis SLO metrics: latency percentiles, fallback, and tool failure rates")
@limiter.limit(HEALTH_LIMIT)
async def jarvis_metrics(
    request: Request,
    _: dict = Depends(verify_premium_security),
):
    """
    Return in-process Jarvis observability counters.

    Includes p50/p95/p99 latency, provider fallback rate, per-role breakdown,
    per-tenant usage counts, and tool failure percentages.
    """
    return {
        "status": "ok",
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "jarvis": _jarvis_observability.snapshot(),
        "note": "Counters are per-process and reset on worker restart.",
    }


@router.get("/providers", summary="Provider heartbeat status for AI + automation integrations")
@limiter.limit(HEALTH_LIMIT)
async def provider_metrics(
    request: Request,
    _: dict = Depends(verify_premium_security),
):
    """
    Return backend-observed provider heartbeat statuses.

    This endpoint uses lightweight API probes and reports whether each provider
    is configured and currently reachable from the backend environment.
    """
    openai_api_key = os.getenv("OPENAI_API_KEY", "").strip()
    gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()
    perplexity_api_key = os.getenv("PERPLEXITY_API_KEY", "").strip()
    anthropic_api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    xai_api_key = os.getenv("XAI_API_KEY", "").strip()
    x_bearer_token = os.getenv("X_BEARER_TOKEN", "").strip()
    dropbox_access_token = os.getenv("DROPBOX_ACCESS_TOKEN", "").strip()
    google_photos_access_token = os.getenv("GOOGLE_PHOTOS_ACCESS_TOKEN", "").strip()
    sentry_dsn = os.getenv("SENTRY_DSN", "").strip()
    codex_model = os.getenv("OPENAI_CODEX_MODEL", "gpt-5.3-codex").strip()
    sentry_probe_url = _sentry_probe_url_from_dsn(sentry_dsn)

    timeout = httpx.Timeout(connect=3.0, read=4.0, write=4.0, pool=4.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        openai = await _probe_provider(
            client,
            method="GET",
            url="https://api.openai.com/v1/models",
            configured=_is_configured(openai_api_key),
            headers={"Authorization": f"Bearer {openai_api_key}"},
        )
        gemini = await _probe_provider(
            client,
            method="GET",
            url=f"https://generativelanguage.googleapis.com/v1beta/models?key={gemini_api_key}",
            configured=_is_configured(gemini_api_key),
        )
        perplexity = await _probe_provider(
            client,
            method="GET",
            url="https://api.perplexity.ai/models",
            configured=_is_configured(perplexity_api_key),
            headers={"Authorization": f"Bearer {perplexity_api_key}"},
        )
        claude = await _probe_provider(
            client,
            method="GET",
            url="https://api.anthropic.com/v1/models",
            configured=_is_configured(anthropic_api_key),
            headers={
                "x-api-key": anthropic_api_key,
                "anthropic-version": "2023-06-01",
            },
        )
        grok = await _probe_provider(
            client,
            method="GET",
            url="https://api.x.ai/v1/models",
            configured=_is_configured(xai_api_key),
            headers={"Authorization": f"Bearer {xai_api_key}"},
        )
        x_api = await _probe_provider(
            client,
            method="GET",
            url="https://api.x.com/2/users/me",
            configured=_is_configured(x_bearer_token),
            headers={"Authorization": f"Bearer {x_bearer_token}"},
        )
        dropbox = await _probe_provider(
            client,
            method="POST",
            url="https://api.dropboxapi.com/2/users/get_current_account",
            configured=_is_configured(dropbox_access_token),
            headers={
                "Authorization": f"Bearer {dropbox_access_token}",
                "Content-Type": "application/json",
            },
            json_payload={},
        )
        gphotos = await _probe_provider(
            client,
            method="GET",
            url="https://photoslibrary.googleapis.com/v1/albums?pageSize=1",
            configured=_is_configured(google_photos_access_token),
            headers={"Authorization": f"Bearer {google_photos_access_token}"},
        )
        sentry = await _probe_provider(
            client,
            method="GET",
            url=sentry_probe_url or "https://sentry.io/api/0/",
            configured=_is_configured(sentry_dsn),
        )

    if _is_configured(sentry_dsn) and not sentry_probe_url:
        sentry = {
            "up": False,
            "status": "error",
            "status_code": None,
            "latency_ms": None,
            "detail": "Invalid SENTRY_DSN format",
        }

    providers: list[dict[str, Any]] = [
        {
            "id": "openai",
            "label": "OpenAI",
            "configured": _is_configured(openai_api_key),
            **openai,
        },
        {
            "id": "gemini",
            "label": "Gemini",
            "configured": _is_configured(gemini_api_key),
            **gemini,
        },
        {
            "id": "perplexity",
            "label": "Perplexity",
            "configured": _is_configured(perplexity_api_key),
            **perplexity,
        },
        {
            "id": "claude",
            "label": "Claude",
            "configured": _is_configured(anthropic_api_key),
            **claude,
        },
        {
            "id": "codex",
            "label": "Codex",
            "configured": _is_configured(openai_api_key),
            "model": codex_model,
            **openai,
        },
        {
            "id": "grok",
            "label": "Grok",
            "configured": _is_configured(xai_api_key),
            **grok,
        },
        {
            "id": "x",
            "label": "X API",
            "configured": _is_configured(x_bearer_token),
            **x_api,
        },
        {
            "id": "dropbox",
            "label": "Dropbox",
            "configured": _is_configured(dropbox_access_token),
            **dropbox,
        },
        {
            "id": "gphotos",
            "label": "Google Photos",
            "configured": _is_configured(google_photos_access_token),
            **gphotos,
        },
        {
            "id": "sentry",
            "label": "Sentry",
            "configured": _is_configured(sentry_dsn),
            **sentry,
        },
    ]

    up_count = sum(1 for p in providers if p.get("up"))
    configured_count = sum(1 for p in providers if p.get("configured"))

    return {
        "status": "ok",
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "summary": {
            "providers_total": len(providers),
            "providers_up": up_count,
            "providers_configured": configured_count,
        },
        "providers": providers,
    }
