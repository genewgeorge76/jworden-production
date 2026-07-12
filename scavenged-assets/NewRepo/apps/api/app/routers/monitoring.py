"""Monitoring — comprehensive system status + on-demand heartbeat (anti-silent-stall)."""
from __future__ import annotations

import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..config import settings
from ..core.limiter import limiter
from ..core.security import verify_premium_security
from ..database import get_db

router = APIRouter(prefix='/monitoring', tags=['monitoring'])

_PROCESS_START = time.monotonic()
_PROCESS_START_AT = datetime.now(timezone.utc)


def _check_db(db: Session) -> dict:
    try:
        started = time.monotonic()
        db.execute(text('SELECT 1'))
        return {'ok': True, 'latency_ms': round((time.monotonic() - started) * 1000, 1)}
    except Exception as exc:
        return {'ok': False, 'error': str(exc)[:200]}


def _check_redis() -> dict:
    if not settings.redis_url or settings.redis_url.startswith('memory'):
        return {'ok': None, 'configured': False}
    try:
        import redis
        started = time.monotonic()
        client = redis.from_url(settings.redis_url, socket_connect_timeout=2, socket_timeout=2)
        client.ping()
        return {'ok': True, 'configured': True, 'latency_ms': round((time.monotonic() - started) * 1000, 1)}
    except Exception as exc:
        return {'ok': False, 'configured': True, 'error': str(exc)[:200]}


def _provider_config() -> dict:
    """Which external providers have keys set (booleans only — never the values)."""
    return {
        'anthropic': bool(settings.anthropic_api_key),
        'openai': bool(settings.openai_api_key),
        'stripe': bool(settings.stripe_secret_key),
        'twilio': bool(settings.twilio_account_sid),
        'sendgrid': bool(settings.sendgrid_api_key),
        'regrid': bool(settings.regrid_api_key),
        'lob': bool(settings.lob_api_key),
        'sentry': bool(settings.sentry_dsn),
        'heartbeat_email': bool(settings.heartbeat_email),
    }


@router.get('/status', summary='Comprehensive system health for dashboards and uptime probes')
@limiter.limit('60/minute')
async def system_status(
    request: Request,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    db_check = _check_db(db)
    redis_check = _check_redis()
    checks_ok = db_check['ok'] and redis_check['ok'] is not False
    return {
        'status': 'ok' if checks_ok else 'degraded',
        'environment': settings.environment,
        'started_at': _PROCESS_START_AT.isoformat(),
        'uptime_seconds': int(time.monotonic() - _PROCESS_START),
        'database': db_check,
        'redis': redis_check,
        'providers_configured': _provider_config(),
        'timestamp': datetime.now(timezone.utc).isoformat(),
    }


@router.post('/heartbeat', summary='Run the daily heartbeat now (collect vitals + send email)')
@limiter.limit('10/minute')
async def run_heartbeat(
    request: Request,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    from ..tasks.heartbeat import build_heartbeat_summary, send_heartbeat_email

    summary = build_heartbeat_summary(db)
    sent = send_heartbeat_email(summary)
    return {**summary, 'email_sent': sent}
