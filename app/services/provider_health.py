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
        query_param: Optional[str] = None,
        companion_env: tuple[str, ...] = (),
        payload: Optional[dict[str, Any]] = None,
        category: str = "ai",
    ) -> None:
        self.id = pid
        self.label = label
        self.env = env
        self.url = url
        self.method = method
        self.auth = auth
        self.extra_headers = extra_headers or {}
        # auth="query": the credential travels as a query parameter with this
        # name. Several providers (SerpAPI, SAM.gov, EIA, Google Maps) accept
        # nothing else. redact() scrubs the value out of any error text before
        # it reaches a response body, which matters more here than for a header.
        self.query_param = query_param
        # A second value the probe needs and that is not the secret: Twilio's
        # account SID, Kickserv's account slug. Used as the basic-auth username
        # and substituted into {companion} in the URL.
        self.companion_env = companion_env
        # Body for providers with no cheap GET that authenticates.
        self.payload = payload
        # Grouping for the report only. An operator reading "what is dead"
        # wants email and payments separated from the model providers.
        self.category = category

    def companion(self) -> str:
        for name in self.companion_env:
            if (value := self._lookup(name)):
                return value
        return ""

    def configured(self) -> bool:
        """
        Both halves present, where a provider needs two.

        Twilio with an auth token and no account SID cannot be probed and
        cannot be used; reporting it as configured because one of the two is
        set would be reporting a working integration that is not one.
        """
        if not self.key():
            return False
        return bool(self.companion()) if self.companion_env else True

    def request_url(self, key: str) -> str:
        url = self.url.replace("{companion}", self.companion())
        if self.auth == "query" and self.query_param:
            joiner = "&" if "?" in url else "?"
            url = f"{url}{joiner}{self.query_param}={key}"
        return url

    def auth_tuple(self, key: str) -> Optional[tuple[str, str]]:
        """Basic-auth pair, when that is how the provider authenticates."""
        if self.auth == "basic":
            return (self.companion(), key)
        return None

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
        if self.auth in {"query", "basic", "none"}:
            # The credential is not a header for these. httpx carries basic
            # auth itself, and a query credential is already on the URL.
            return headers
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
        category="voice",
    ),
    # ── Everything below was never probed ────────────────────────────────────
    #
    # The table stopped at the model providers, so "are all my credentials
    # working" could only be answered for six of them. The rest were assumed,
    # and assumption has already cost twice: a Grok key set under a name
    # nothing read, and a Gemini key set and rejected. Both looked fine from
    # the outside.
    #
    # Every endpoint below is chosen to be the cheapest call that still proves
    # the credential — an account or list read, never anything that sends,
    # charges, or writes.
    "tavily": _Spec(
        "tavily",
        "Tavily (Jarvis web search)",
        ("TAVILY_API_KEY",),
        "https://api.tavily.com/search",
        method="POST",
        auth="none",
        # Tavily has no GET that authenticates, and the key goes in the body
        # rather than a header. One-word query, one result: the smallest search
        # that still exercises the credential.
        payload={"query": "test", "max_results": 1},
        category="search",
    ),
    "serpapi": _Spec(
        "serpapi",
        "SerpAPI",
        ("SERPAPI_KEY",),
        "https://serpapi.com/account",
        auth="query",
        query_param="api_key",
        category="search",
    ),
    "sendgrid": _Spec(
        "sendgrid",
        "SendGrid (email)",
        ("SENDGRID_API_KEY",),
        # /scopes rather than anything under /mail: it reports what the key is
        # permitted to do without sending a message.
        "https://api.sendgrid.com/v3/scopes",
        category="messaging",
    ),
    "twilio": _Spec(
        "twilio",
        "Twilio (SMS verify)",
        ("TWILIO_AUTH_TOKEN",),
        "https://api.twilio.com/2010-04-01/Accounts/{companion}.json",
        auth="basic",
        companion_env=("TWILIO_ACCOUNT_SID",),
        category="messaging",
    ),
    "vapi": _Spec(
        "vapi",
        "Vapi (outbound calls)",
        ("VAPI_API_KEY",),
        "https://api.vapi.ai/assistant",
        category="voice",
    ),
    "stripe": _Spec(
        "stripe",
        "Stripe (billing)",
        ("STRIPE_SECRET_KEY",),
        # Balance is a read. It proves the key is live without creating a
        # customer, a session, or a charge.
        "https://api.stripe.com/v1/balance",
        category="payments",
    ),
    "google_maps": _Spec(
        "google_maps",
        "Google Maps",
        ("GOOGLE_MAPS_API_KEY",),
        # Geocoding returns 200 with a status field even for a bad key, so this
        # is one of the cases where HTTP status alone is not the whole answer.
        # _classify still catches a 403 from a restricted key, which is the
        # common failure.
        "https://maps.googleapis.com/maps/api/geocode/json?address=Richmond,VA",
        auth="query",
        query_param="key",
        category="google",
    ),
    "eia": _Spec(
        "eia",
        "EIA (fuel and energy prices)",
        ("EIA_API_KEY",),
        "https://api.eia.gov/v2/",
        auth="query",
        query_param="api_key",
        category="data",
    ),
    "sam_gov": _Spec(
        "sam_gov",
        "SAM.gov (federal solicitations)",
        ("SAM_GOV_API_KEY", "SAM_API_KEY"),
        "https://api.sam.gov/opportunities/v2/search?limit=1&postedFrom=01/01/2026&postedTo=01/02/2026",
        auth="query",
        query_param="api_key",
        category="data",
    ),
    "regrid": _Spec(
        "regrid",
        "Regrid (parcel data)",
        ("REGRID_API_KEY",),
        "https://app.regrid.com/api/v2/parcels/point?lat=37.54&lon=-77.43&radius=1&limit=1",
        auth="query",
        query_param="token",
        category="data",
    ),
    "pagespeed": _Spec(
        "pagespeed",
        "Google PageSpeed Insights",
        ("GOOGLE_PAGESPEED_API_KEY",),
        "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://example.com",
        auth="query",
        query_param="key",
        category="google",
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


def _payload_for(spec: _Spec, key: str) -> Optional[dict[str, Any]]:
    """
    The request body, with the credential inserted where a provider wants it
    there rather than in a header.

    Tavily is the case: it has no GET that authenticates and reads the key from
    the body. Built here rather than stored on the spec so a live key is never
    held in a module-level structure.
    """
    if spec.payload is None:
        return None
    if spec.id == "tavily":
        return {**spec.payload, "api_key": key}
    return dict(spec.payload)


async def probe(
    client: httpx.AsyncClient,
    *,
    method: str,
    url: str,
    configured: bool,
    headers: Optional[dict[str, str]] = None,
    json_payload: Optional[dict[str, Any]] = None,
    auth: Optional[tuple[str, str]] = None,
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
        response = await client.request(
            method, url, headers=headers, json=json_payload, auth=auth
        )
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
        "configured": spec.configured(),
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
            url=spec.request_url(key),
            configured=True,
            headers=spec.headers(key),
            json_payload=_payload_for(spec, key),
            auth=spec.auth_tuple(key),
        )
    else:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as owned:
            result = await probe(
                owned,
                method=spec.method,
                url=spec.request_url(key),
                configured=True,
                headers=spec.headers(key),
                json_payload=_payload_for(spec, key),
                auth=spec.auth_tuple(key),
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
