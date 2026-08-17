"""
Shared SlowAPI rate limiter instance and per-endpoint limit constants.

Import this in app/main.py to attach to the FastAPI app state, and
in individual routers to apply per-endpoint limits via @limiter.limit().

Per-endpoint rate limit strategy (requests per minute per IP):
  PUBLIC_LIMIT     = "10/minute"   — quote, contact, estimate (public-facing)
  ANALYTICS_LIMIT  = "30/minute"   — expensive BI aggregations
  CRM_LIMIT        = "60/minute"   — moderate-cost CRM reads/writes
  HEALTH_LIMIT     = "300/minute"  — health/metrics probes
  ADMIN_LIMIT      = "100/minute"  — admin dashboard operations
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

import os as _os
import sys as _sys

# Disable rate limiting under pytest or when explicitly turned off so test
# suites don't hit per-IP caps when looping requests.
_RATE_LIMIT_DISABLED = (
    "pytest" in _sys.modules
    or _os.getenv("PYTEST_CURRENT_TEST") is not None
    or _os.getenv("RATE_LIMIT_DISABLED", "").lower() in ("1", "true", "yes")
)

def client_ip(request) -> str:
    """
    The caller's real address, as seen from behind Fly's proxy.

    SlowAPI's stock get_remote_address returns request.client.host, which in
    this deployment is the FLY PROXY for every single request. Keying limits on
    it groups the entire internet into one bucket: six bad PINs from one
    attacker would 429 every other user off the endpoint — a denial of service
    handed out by the very control meant to prevent one.

    Preference order matters. Fly-Client-IP is stamped by Fly's own proxy and a
    client cannot forge it end-to-end; X-Forwarded-For is the standard fallback
    but is client-supplied, so a spoofer can rotate it freely. That is a real
    limitation and the reason the brute-force guard in bruteforce.py also keeps
    a global counter that no per-client key can evade.
    """
    try:
        fly = request.headers.get("fly-client-ip")
        if fly:
            return fly.strip()[:64]
        xff = request.headers.get("x-forwarded-for")
        if xff:
            return xff.split(",")[0].strip()[:64]
    except Exception:  # noqa: BLE001
        pass
    return get_remote_address(request)


# Counters must be SHARED, not per-process. SlowAPI defaults to memory://,
# which counts inside one worker: with 2 machines running gunicorn, an
# attacker's requests round-robin across processes and each one sees a fraction
# of the traffic, so a "6/minute" limit is really 6 × (machines × workers) and
# nobody can say what it actually is. Observed live — nine consecutive bad PINs
# never tripped a six-per-minute rule.
#
# Redis makes the count global. If REDIS_URL is unset we fall back to memory://
# rather than refusing to boot: a weakened limit is bad, an app that will not
# start is worse, and the brute-force guard keeps its own Redis-backed counters
# either way.
_STORAGE_URI = _os.getenv("REDIS_URL", "").strip() or "memory://"

limiter = Limiter(
    key_func=client_ip,
    default_limits=[] if _RATE_LIMIT_DISABLED else ["200/minute"],
    enabled=not _RATE_LIMIT_DISABLED,
    storage_uri=_STORAGE_URI,
)

# ── Per-endpoint limit strings (use with @limiter.limit()) ────────────────────

PUBLIC_LIMIT: str = "10/minute"
ANALYTICS_LIMIT: str = "30/minute"
CRM_LIMIT: str = "60/minute"
HEALTH_LIMIT: str = "300/minute"
ADMIN_LIMIT: str = "100/minute"

# Credential endpoints: PIN exchange, password login, registration. These had no
# limit at all, so the admin PIN — as few as 4 digits, i.e. 10,000 possibilities
# — could be walked as fast as the network allowed.
#
# Two clauses on purpose. The per-minute figure stops a burst; the per-hour
# figure stops a patient attacker who simply paces themselves under it. Someone
# who has forgotten a PIN tries a few times and stops, so this is far above
# ordinary use and far below anything that makes exhaustive search practical.
#
# This is per-IP only. Cross-source protection lives in app/core/bruteforce.py,
# because per-IP limits are worthless against an attacker who rotates addresses.
AUTH_LIMIT: str = "6/minute;40/hour"
