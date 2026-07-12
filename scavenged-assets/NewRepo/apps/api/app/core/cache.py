"""
Simple cache layer — Redis primary, in-memory fallback.

All values must be JSON-serializable. Use `default=str` when calling
cache_set to safely handle datetime objects.
"""
from __future__ import annotations

import json
import logging
import time
from typing import Any

logger = logging.getLogger(__name__)

_mem: dict[str, tuple[Any, float]] = {}

_redis_client = None


def _redis():
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    try:
        from ..config import settings  # noqa: PLC0415
        import redis  # noqa: PLC0415

        if settings.redis_url and settings.redis_url != 'redis://localhost:6379/0':
            _redis_client = redis.from_url(settings.redis_url, decode_responses=True, socket_connect_timeout=1)
    except Exception as exc:
        logger.debug('Redis unavailable, using in-memory cache: %s', exc)
    return _redis_client


def cache_get(key: str) -> Any:
    r = _redis()
    if r:
        try:
            val = r.get(key)
            return json.loads(val) if val else None
        except Exception:
            pass
    entry = _mem.get(key)
    if entry and entry[1] > time.monotonic():
        return entry[0]
    return None


def cache_set(key: str, value: Any, ttl: int = 60) -> None:
    r = _redis()
    if r:
        try:
            r.setex(key, ttl, json.dumps(value, default=str))
            return
        except Exception:
            pass
    _mem[key] = (value, time.monotonic() + ttl)


def invalidate_pattern(pattern: str) -> None:
    r = _redis()
    if r:
        try:
            cursor = 0
            while True:
                cursor, keys = r.scan(cursor, match=pattern, count=100)
                for k in keys:
                    r.delete(k)
                if cursor == 0:
                    break
            return
        except Exception:
            pass
    prefix = pattern.rstrip('*')
    for k in list(_mem.keys()):
        if k.startswith(prefix):
            del _mem[k]


# ── TTLs ────────────────────────────────────────────────────────────────────

CUSTOMERS_TTL = 30
CRM_LEADS_TTL = 30
BLOG_TTL = 60

KEY_CUSTOMERS_STATS = 'customers:stats'
KEY_CRM_FUNNEL = 'crm:funnel'


def invalidate_customer_caches(customer_id: int | None = None) -> None:
    invalidate_pattern('customers:*')
    if customer_id:
        invalidate_pattern(f'customers:{customer_id}:*')


def invalidate_crm_caches() -> None:
    invalidate_pattern('crm:*')
    invalidate_pattern('analytics:*')


def invalidate_blog_caches(slug: str | None = None) -> None:
    invalidate_pattern('blog:*')
    if slug:
        invalidate_pattern(f'blog:post:{slug}')
