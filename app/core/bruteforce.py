"""
Brute-force guard for credential endpoints.

Per-IP rate limiting alone does not protect a short secret. The admin PIN is
4–8 digits; at the 4-digit floor that is 10,000 possibilities, and an attacker
with a few hundred IPs walks the whole space while every individual IP stays
comfortably under any per-IP cap. So this guard works on two tiers:

    per-identity  — tight. Stops the naive single-source attack outright.
    global        — loose but bounded. The only thing that actually costs a
                    distributed attacker anything, because it counts failures
                    across every source at once.

The global tier is deliberately generous. It is a ceiling on sustained abuse,
not a tripwire for ordinary fat-fingering, and it exists so that exhausting a
4-digit space takes many hours of obvious, logged traffic rather than minutes.

FAILURE MODE: this guard FAILS OPEN when Redis is unavailable.

That is a deliberate trade, and it is the same call any auth lockout has to
make. Failing closed turns a Redis outage into a total lockout of the owner —
which is not hypothetical here: this app's Redis quota was exhausted for real,
and had this guard been failing closed, nobody could have signed in to fix it.
Failing open is safe-ish because the SlowAPI per-IP limit on the endpoint is a
separate mechanism that keeps working, and every degraded call is logged.

State lives in Redis so the counters are shared across app machines. An
in-process fallback would count per-worker, which with N workers multiplies
every threshold by N and silently weakens the guard.
"""

from __future__ import annotations

import logging
import time
from typing import Optional

from fastapi import HTTPException

from .cache import get_redis

logger = logging.getLogger(__name__)

# Per-identity (usually per-IP). Tight: a human who has forgotten a PIN tries a
# handful of times, not dozens.
_IDENTITY_MAX = 8
_IDENTITY_WINDOW = 900          # 15 minutes

# Across all sources. At 400/hour a 4-digit space (10,000) needs ~25 hours of
# continuous, loudly logged failure to exhaust. A 6-digit PIN takes ~285 days,
# which is the real reason to prefer one.
_GLOBAL_MAX = 400
_GLOBAL_WINDOW = 3600           # 1 hour


def _key(scope: str, identity: str) -> str:
    return f"authfail:{scope}:{identity}"


def _global_key(scope: str) -> str:
    return f"authfail:{scope}:__global__"


def _incr(client, key: str, window: int) -> int:
    """Increment a counter and make sure it expires. Returns the new count."""
    pipe = client.pipeline()
    pipe.incr(key)
    pipe.ttl(key)
    count, ttl = pipe.execute()
    # Only (re)set the TTL when there is none, so the window is fixed from the
    # first failure rather than sliding forward with every new one — otherwise a
    # steady trickle of attempts keeps the key alive forever and the counter
    # never resets for a legitimate user.
    if ttl is None or ttl < 0:
        client.expire(key, window)
    return int(count)


def _retry_after(client, key: str, default: int) -> int:
    try:
        ttl = client.ttl(key)
        return int(ttl) if ttl and ttl > 0 else default
    except Exception:  # noqa: BLE001
        return default


def check(scope: str, identity: str) -> None:
    """
    Raise 429 if this identity — or the endpoint as a whole — is locked out.

    Call before verifying a credential. No-op when Redis is unavailable.
    """
    client = get_redis()
    if client is None:
        logger.warning(
            "bruteforce guard degraded for scope=%s: Redis unavailable, "
            "relying on the per-IP rate limit alone",
            scope,
        )
        return

    try:
        ikey, gkey = _key(scope, identity), _global_key(scope)
        pipe = client.pipeline()
        pipe.get(ikey)
        pipe.get(gkey)
        icount, gcount = pipe.execute()

        if icount is not None and int(icount) >= _IDENTITY_MAX:
            wait = _retry_after(client, ikey, _IDENTITY_WINDOW)
            logger.warning(
                "auth lockout: scope=%s identity=%s hit %s failures, %ss remaining",
                scope, identity, icount, wait,
            )
            raise HTTPException(
                status_code=429,
                detail="Too many failed attempts. Try again later.",
                headers={"Retry-After": str(wait)},
            )

        if gcount is not None and int(gcount) >= _GLOBAL_MAX:
            wait = _retry_after(client, gkey, _GLOBAL_WINDOW)
            # Critical, not warning: reaching this from ordinary use is close to
            # impossible, so it means the endpoint is under a distributed attack.
            logger.critical(
                "auth lockout GLOBAL: scope=%s reached %s failures in the window "
                "— endpoint is under distributed attack; %ss remaining",
                scope, gcount, wait,
            )
            raise HTTPException(
                status_code=429,
                detail="Too many failed attempts. Try again later.",
                headers={"Retry-After": str(wait)},
            )
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.warning("bruteforce guard check failed for scope=%s: %s", scope, exc)


def record_failure(scope: str, identity: str) -> None:
    """Count one failed attempt against both tiers."""
    client = get_redis()
    if client is None:
        return
    try:
        icount = _incr(client, _key(scope, identity), _IDENTITY_WINDOW)
        gcount = _incr(client, _global_key(scope), _GLOBAL_WINDOW)
        logger.warning(
            "auth failure: scope=%s identity=%s (%s/%s for this identity, "
            "%s/%s across all sources)",
            scope, identity, icount, _IDENTITY_MAX, gcount, _GLOBAL_MAX,
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("bruteforce guard could not record failure: %s", exc)


def record_success(scope: str, identity: str) -> None:
    """
    Clear this identity's failure count after a correct credential.

    The global counter is deliberately NOT cleared: one success does not mean
    the other sources hammering the endpoint have stopped, and letting a single
    correct login reset the global window would hand an attacker a trivial way
    to keep it permanently at zero.
    """
    client = get_redis()
    if client is None:
        return
    try:
        client.delete(_key(scope, identity))
    except Exception as exc:  # noqa: BLE001
        logger.warning("bruteforce guard could not clear failures: %s", exc)


def identity_from_request(request) -> str:
    """
    Best-effort client identity for counting.

    Delegates to limiter.client_ip so this guard and the SlowAPI limit key on
    exactly the same thing. When they disagree, one of them silently protects
    a different population than the operator believes, and behind Fly's proxy
    the naive answer buckets the whole internet together.

    That value is only as honest as the headers behind it, which is why the
    global tier exists and does not depend on it.
    """
    try:
        from .limiter import client_ip  # local import keeps the modules acyclic

        return client_ip(request)
    except Exception:  # noqa: BLE001
        return "unknown"
