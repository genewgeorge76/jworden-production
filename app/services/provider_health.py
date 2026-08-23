"""
provider_health.py — Is a provider actually reachable, or is the key merely set.

Every status surface in this backend used to answer the second question and
print the first one's word. `bool(os.getenv("OPENAI_API_KEY"))` is true for a
revoked key, a typo, a key belonging to a deleted org, and a key that has been
rotated everywhere except here. The SDK does not validate at construction, so
the client builds cleanly and the 401 arrives at call time — long past the
check that already told the operator "connected".

That is exactly how a dead OPENAI_API_KEY went unnoticed: /api/v1/system/apis
reported `"status": "connected"`, /api/v1/metrics/ai reported
`openai_configured: true`, and the AI features quietly served their fallbacks.

So this module answers by asking the provider. Results are cached with a TTL
because a status page should not cost a round trip per widget, and callers who
cannot afford a network call at all get `unverified` — an honest "nobody has
checked" rather than a guess dressed as a fact.

Six states, and the distinctions between them are the whole point:

  not_configured       no key in the environment
  live                 the provider answered 2xx to a real request
  invalid_credentials  the provider answered 401/403 — the key is bad
  degraded             the provider answered, but not with success
  unreachable          the request never got an answer
  unverified           no probe has run yet in this process

`unverified` is deliberately not merged into `degraded`. "We have not looked"
and "we looked and it is broken" call for different responses from whoever is
reading the dashboard.
"""

from __future__ import annotations

import logging
import os
import time
from datetime import datetime, timezone
from typing import Any, Iterable, Optional

import httpx

logger = logging.getLogger(__name__)

# ── States ────────────────────────────────────────────────────────────────────

def _xai_env_names() -> tuple[str, ...]:
    """
    The names the router accepts for the xAI credential, taken from
    runtime_config rather than restated here.

    Two lists of the same aliases is one list that will eventually be wrong,
    and the failure is silent in both directions: a probe that reports "not
    configured" for a working key, or one that reports configured for a name
    nothing reads.
    """
    try:
        from .runtime_config import KEY_ALIASES  # noqa: PLC0415

        return KEY_ALIASES.get("XAI_API_KEY", ("XAI_API_KEY",))
    except Exception:  # noqa: BLE001
        return ("XAI_API_KEY",)


NOT_CONFIGURED = "not_configured"
LIVE = "live"
INVALID_CREDENTIALS = "invalid_credentials"
DEGRADED = "degraded"
UNREACHABLE = "unreachable"
UNVERIFIED = "unverified"

#: Statuses in which a real call to the provider can be expected to work.
HEALTHY = frozenset({LIVE})

DEFAULT_TTL_SECONDS = 300.0

_TIMEOUT = httpx.Timeout(connect=3.0, read=4.0, write=4.0, pool=4.0)


# ── Provider registry ─────────────────────────────────────────────────────────


class _Spec:
    """How to find a provider's key and how to ask it whether the key works."""

    def __init__(
        self,
        pid: str,
        label: str,
        env: tuple[str, ...],
        url: str,
        *,
        method: str = "GET",
        auth: str = "bearer",
        extra_headers: Optional[dict[str, str]] = None,
    ) -> None:
        self.id = pid
        self.label = label
        self.env = env
        self.url = url
        self.method = method
        self.auth = auth
        self.extra_headers = extra_headers or {}

    def key(self) -> str:
        for name in self.env:
            if (value := self._lookup(name)):
                return value
        return ""

    def key_name(self) -> Optional[str]:
        """Which env name supplied the credential, or None when unset."""
        for name in self.env:
            if self._lookup(name):
                return name
        return None

    @staticmethod
    def _lookup(name: str) -> str:
        """
        Runtime store first, then the process environment.

        Several of these are MANAGED_KEYS, settable live through the admin
        integrations endpoint without a redeploy. Reading os.environ alone
        would report a key as absent moments after an operator set it, and
        send them to debug a provider that is already working.
        """
        from .runtime_config import get as _cfg_get  # noqa: PLC0415

        return (_cfg_get(name) or "").strip()

    def headers(self, key: str) -> dict[str, str]:
        headers = dict(self.extra_headers)
        if self.auth == "bearer":
            headers["Authorization"] = f"Bearer {key}"
        elif self.auth == "x-api-key":
            headers["x-api-key"] = key
        elif self.auth == "x-goog-api-key":
            # Header rather than ?key= on the URL. Google accepts both, but a
            # key in a query string ends up in exception text, access logs and
            # anything that echoes a failing URL back to a dashboard.
            headers["x-goog-api-key"] = key
        return headers


_SPECS: dict[str, _Spec] = {
    "openai": _Spec(
        "openai",
        "OpenAI",
        ("OPENAI_API_KEY",),
        "https://api.openai.com/v1/models",
    ),
    "anthropic": _Spec(
        "anthropic",
        "Anthropic",
        ("ANTHROPIC_API_KEY",),
        "https://api.anthropic.com/v1/models",
        auth="x-api-key",
        extra_headers={"anthropic-version": "2023-06-01"},
    ),
    "google": _Spec(
        "google",
        "Google Gemini",
        ("GEMINI_API_KEY", "GOOGLE_AI_API_KEY", "GOOGLE_API_KEY"),
        "https://generativelanguage.googleapis.com/v1beta/models",
        auth="x-goog-api-key",
    ),
    "perplexity": _Spec(
        "perplexity",
        "Perplexity",
        ("PERPLEXITY_API_KEY",),
        "https://api.perplexity.ai/models",
    ),
    "xai": _Spec(
        "xai",
        "xAI (Grok)",
        # Mirrors runtime_config.KEY_ALIASES["XAI_API_KEY"] rather than
        # repeating it — the two drifting apart is how a probe comes to report
        # "not configured" for a key the router happily uses, sending an
        # operator hunting for a problem that is not there.
        _xai_env_names(),
        "https://api.x.ai/v1/models",
    ),
    "elevenlabs": _Spec(
        "elevenlabs",
        "ElevenLabs",
        ("ELEVENLABS_API_KEY",),
        "https://api.elevenlabs.io/v1/user",
        auth="x-api-key",
    ),
}

#: Aliases kept so existing dashboards keep resolving. "gemini" and "claude"
#: are what the metrics endpoint has always called these two.
_ALIASES = {"gemini": "google", "claude": "anthropic", "grok": "xai"}


def provider_ids() -> tuple[str, ...]:
    return tuple(_SPECS)


def _spec(pid: str) -> _Spec:
    resolved = _ALIASES.get(pid, pid)
    if resolved not in _SPECS:
        raise KeyError(f"unknown provider: {pid}")
    return _SPECS[resolved]


def is_configured(pid: str) -> bool:
    """True when a key is present. Says nothing about whether it works."""
    try:
        return bool(_spec(pid).key())
    except KeyError:
        return False


# ── Secret hygiene ────────────────────────────────────────────────────────────


def redact(text: str) -> str:
    """
    Strip anything key-shaped out of text bound for a response body.

    Probe failures are reported verbatim to an operator, and httpx puts the
    request URL into several of its exception messages. A provider that wants
    its key in a query string would otherwise leak it into a dashboard, a log
    line, and every screenshot of either.
    """
    out = text
    for spec in _SPECS.values():
        key = spec.key()
        if key and len(key) >= 8:
            out = out.replace(key, "***")
    return out


# ── Probe ─────────────────────────────────────────────────────────────────────


def _classify(status_code: int) -> tuple[str, str]:
    if 200 <= status_code < 300:
        return LIVE, "ok"
    if status_code in (401, 403):
        return INVALID_CREDENTIALS, f"HTTP {status_code} — the key was rejected"
    if status_code == 429:
        # Rate limiting proves the credential was accepted; the provider is
        # simply busy. Reporting that as a bad key sends someone to rotate a
        # working secret.
        return DEGRADED, "HTTP 429 — rate limited (credentials accepted)"
    return DEGRADED, f"HTTP {status_code}"


async def probe(
    client: httpx.AsyncClient,
    *,
    method: str,
    url: str,
    configured: bool,
    headers: Optional[dict[str, str]] = None,
    json_payload: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    """
    One request, classified. Shared so every status surface agrees on what a
    given HTTP response means.
    """
    if not configured:
        return {
            "up": False,
            "status": NOT_CONFIGURED,
            "status_code": None,
            "latency_ms": None,
            "detail": "No credentials set in this environment",
        }

    t0 = time.monotonic()
    try:
        response = await client.request(method, url, headers=headers, json=json_payload)
        latency_ms = round((time.monotonic() - t0) * 1000, 2)
        status, detail = _classify(response.status_code)
        return {
            "up": status == LIVE,
            "status": status,
            "status_code": response.status_code,
            "latency_ms": latency_ms,
            "detail": detail,
        }
    except Exception as exc:  # noqa: BLE001
        latency_ms = round((time.monotonic() - t0) * 1000, 2)
        return {
            "up": False,
            "status": UNREACHABLE,
            "status_code": None,
            "latency_ms": latency_ms,
            "detail": redact(str(exc)) or exc.__class__.__name__,
        }


# ── Cache ─────────────────────────────────────────────────────────────────────

# provider id -> (result, monotonic timestamp)
_cache: dict[str, tuple[dict[str, Any], float]] = {}


def _shape(pid: str, result: dict[str, Any], *, checked_at: Optional[str], age: Optional[float]) -> dict[str, Any]:
    spec = _spec(pid)
    return {
        "id": spec.id,
        "label": spec.label,
        "configured": bool(spec.key()),
        # Which variable actually supplied it. Worth reporting: a credential
        # picked up from an alias looks identical to one from the canonical
        # name until something needs renaming.
        "key_name": spec.key_name(),
        # And, when nothing supplied it, which names were tried.
        #
        # "not_configured" with key_name: null is a dead end for whoever has to
        # fix it. The operator's Grok key IS set on Fly — under a name none of
        # the aliases match — and the report gave no way to see that without
        # reading this file. Listing the names turns "it says not configured"
        # into "rename the secret to one of these", which is a two-minute job
        # rather than an investigation.
        #
        # Names only. No value, and no prefix of one.
        "searched_env_names": list(spec.env) if not spec.key() else None,
        "checked_at": checked_at,
        "age_seconds": None if age is None else round(age, 1),
        **result,
    }


def cached(pid: str) -> dict[str, Any]:
    """
    The last known result without touching the network.

    For synchronous callers and for anything on a hot path. A cold cache
    reports `unverified`, never `live` — the whole failure this module exists
    to prevent is a status surface asserting health it has not observed.
    """
    try:
        spec = _spec(pid)
    except KeyError:
        return {
            "id": pid,
            "label": pid,
            "configured": False,
            "status": UNVERIFIED,
            "up": False,
            "status_code": None,
            "latency_ms": None,
            "detail": f"unknown provider: {pid}",
            "checked_at": None,
            "age_seconds": None,
        }

    entry = _cache.get(spec.id)
    if entry is None:
        return _shape(
            spec.id,
            {
                "up": False,
                "status": NOT_CONFIGURED if not spec.key() else UNVERIFIED,
                "status_code": None,
                "latency_ms": None,
                "detail": (
                    "No credentials set in this environment"
                    if not spec.key()
                    else "Not probed yet in this process"
                ),
            },
            checked_at=None,
            age=None,
        )

    result, stamped = entry
    return _shape(spec.id, dict(result), checked_at=result.get("_checked_at"), age=time.monotonic() - stamped)


async def check(
    pid: str,
    *,
    max_age: float = DEFAULT_TTL_SECONDS,
    force: bool = False,
    client: Optional[httpx.AsyncClient] = None,
) -> dict[str, Any]:
    """Probe `pid`, reusing a cached result younger than `max_age`."""
    spec = _spec(pid)

    if not force:
        entry = _cache.get(spec.id)
        if entry is not None and (time.monotonic() - entry[1]) <= max_age:
            return cached(spec.id)

    key = spec.key()
    if not key:
        result = {
            "up": False,
            "status": NOT_CONFIGURED,
            "status_code": None,
            "latency_ms": None,
            "detail": "No credentials set in this environment",
        }
    elif client is not None:
        result = await probe(
            client,
            method=spec.method,
            url=spec.url,
            configured=True,
            headers=spec.headers(key),
        )
    else:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as owned:
            result = await probe(
                owned,
                method=spec.method,
                url=spec.url,
                configured=True,
                headers=spec.headers(key),
            )

    result["_checked_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    _cache[spec.id] = (result, time.monotonic())
    return cached(spec.id)


async def check_all(
    ids: Optional[Iterable[str]] = None,
    *,
    max_age: float = DEFAULT_TTL_SECONDS,
    force: bool = False,
) -> dict[str, dict[str, Any]]:
    """Probe several providers over one connection pool."""
    wanted = tuple(ids) if ids is not None else provider_ids()
    out: dict[str, dict[str, Any]] = {}
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        for pid in wanted:
            try:
                out[_spec(pid).id] = await check(
                    pid, max_age=max_age, force=force, client=client
                )
            except KeyError:
                logger.warning("provider_health: unknown provider %s", pid)
    return out


def reset_cache() -> None:
    """Drop every cached probe. For tests and for a forced refresh."""
    _cache.clear()


# ── Engine labelling ──────────────────────────────────────────────────────────


def engine_label(pid: str, *, live: str, fallback: str) -> str:
    """
    What to call the engine on a status endpoint, based on evidence.

    A router that writes `"gpt-4o" if os.getenv("OPENAI_API_KEY") else
    "rule-based"` is asserting which engine answered from the fact that a
    string is non-empty. When the key is dead that label is simply false, and
    it is false on the response that an operator would use to decide whether
    the AI is working.

    Anything short of an observed `live` gets the fallback name, because the
    fallback is what the code will actually run.
    """
    return live if cached(pid).get("status") == LIVE else fallback
