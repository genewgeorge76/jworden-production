"""
Status surfaces must report what they observed, not what is configured.

A revoked OPENAI_API_KEY is still a non-empty string. Every status endpoint in
this backend used to answer `bool(os.getenv("OPENAI_API_KEY"))` and print the
word "connected", so a dead key showed a green tick on the Super Admin
dashboard while every call behind it returned 401. The SDK does not validate at
construction, so nothing between the check and the failure noticed either.

These tests pin the distinction that fix rests on:

  * a key that is present but rejected reports `invalid_credentials`, never
    anything a dashboard would paint green;
  * a key nobody has probed reports `unverified`, which is not the same claim
    as `degraded` — "we have not looked" and "we looked and it is broken" call
    for different responses;
  * engine labels name what actually ran.

The probes are stubbed. The point under test is the classification and the
reporting, not OpenAI's uptime.
"""
from __future__ import annotations

import sys
from pathlib import Path

import httpx
import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from app.services import provider_health  # noqa: E402


@pytest.fixture(autouse=True)
def clean_cache():
    provider_health.reset_cache()
    yield
    provider_health.reset_cache()


def _transport(status_code: int, *, capture: list | None = None):
    def handler(request: httpx.Request) -> httpx.Response:
        if capture is not None:
            capture.append(request)
        return httpx.Response(status_code, json={"data": []})

    return httpx.MockTransport(handler)


async def _check(monkeypatch, pid: str, status_code: int, **kwargs):
    transport = _transport(status_code)
    async with httpx.AsyncClient(transport=transport) as client:
        return await provider_health.check(pid, client=client, force=True, **kwargs)


# ── Classification ────────────────────────────────────────────────────────────


async def test_a_working_key_reports_live(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "sk-live-key")
    result = await _check(monkeypatch, "openai", 200)
    assert result["status"] == provider_health.LIVE
    assert result["up"] is True


async def test_a_rejected_key_is_not_reported_as_configured_and_fine(monkeypatch):
    """
    The exact production condition: the key is set, so every presence check
    passes, and OpenAI answers 401.
    """
    monkeypatch.setenv("OPENAI_API_KEY", "sk-proj-revoked")
    result = await _check(monkeypatch, "openai", 401)

    assert result["configured"] is True, "the key is present — that part was never in doubt"
    assert result["status"] == provider_health.INVALID_CREDENTIALS
    assert result["up"] is False
    assert "401" in result["detail"]


async def test_rate_limiting_is_not_mistaken_for_a_bad_key(monkeypatch):
    """
    429 proves the credential was accepted. Reporting it as invalid sends
    somebody to rotate a working secret in the middle of an outage.
    """
    monkeypatch.setenv("OPENAI_API_KEY", "sk-live-key")
    result = await _check(monkeypatch, "openai", 429)
    assert result["status"] == provider_health.DEGRADED
    assert "credentials accepted" in result["detail"]


async def test_a_missing_key_is_not_configured(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    result = await provider_health.check("openai", force=True)
    assert result["status"] == provider_health.NOT_CONFIGURED
    assert result["configured"] is False


async def test_a_network_failure_reports_unreachable(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "sk-live-key")

    def boom(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("connection refused", request=request)

    async with httpx.AsyncClient(transport=httpx.MockTransport(boom)) as client:
        result = await provider_health.check("openai", client=client, force=True)

    assert result["status"] == provider_health.UNREACHABLE
    assert result["up"] is False


# ── "Nobody has checked" is its own answer ────────────────────────────────────


def test_an_unprobed_key_is_unverified_not_live(monkeypatch):
    """
    The synchronous read must never invent health for a key it has not tested.
    This is the failure mode the whole module exists to prevent.
    """
    monkeypatch.setenv("OPENAI_API_KEY", "sk-who-knows")
    result = provider_health.cached("openai")
    assert result["status"] == provider_health.UNVERIFIED
    assert result["up"] is False
    assert result["configured"] is True


def test_unverified_is_distinct_from_degraded(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "sk-who-knows")
    assert provider_health.UNVERIFIED != provider_health.DEGRADED
    assert provider_health.cached("openai")["status"] != provider_health.DEGRADED


async def test_a_cached_result_is_reused_within_the_ttl(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "sk-live-key")
    calls: list = []
    async with httpx.AsyncClient(transport=_transport(200, capture=calls)) as client:
        await provider_health.check("openai", client=client, force=True)
        await provider_health.check("openai", client=client, max_age=300)
    assert len(calls) == 1, "a status page must not cost a round trip per widget"


# ── Secrets stay out of the report ────────────────────────────────────────────


async def test_a_probe_failure_never_echoes_the_key(monkeypatch):
    """
    httpx puts the request URL into several exception messages, and a provider
    that wants its key in a query string would leak it straight into a
    dashboard, a log line, and every screenshot of either.
    """
    secret = "AIzaSy-super-secret-google-key"
    monkeypatch.setenv("GEMINI_API_KEY", secret)

    def boom(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError(f"failed connecting to {request.url}", request=request)

    async with httpx.AsyncClient(transport=httpx.MockTransport(boom)) as client:
        result = await provider_health.check("google", client=client, force=True)

    assert secret not in repr(result)


async def test_google_credentials_travel_in_a_header_not_the_url(monkeypatch):
    secret = "AIzaSy-super-secret-google-key"
    monkeypatch.setenv("GEMINI_API_KEY", secret)
    calls: list[httpx.Request] = []

    async with httpx.AsyncClient(transport=_transport(200, capture=calls)) as client:
        await provider_health.check("google", client=client, force=True)

    assert secret not in str(calls[0].url)
    assert calls[0].headers.get("x-goog-api-key") == secret


# ── Engine labels ─────────────────────────────────────────────────────────────


async def test_engine_label_names_the_fallback_when_the_key_is_rejected(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "sk-proj-revoked")
    await _check(monkeypatch, "openai", 401)
    assert (
        provider_health.engine_label("openai", live="gpt-4o", fallback="rule-based")
        == "rule-based"
    )


async def test_engine_label_names_the_model_when_the_key_works(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "sk-live-key")
    await _check(monkeypatch, "openai", 200)
    assert (
        provider_health.engine_label("openai", live="gpt-4o", fallback="rule-based")
        == "gpt-4o"
    )


# ── Credential aliases ────────────────────────────────────────────────────────
#
# The operator's xAI key is stored on Fly under the name SPACEX. Read literally,
# XAI_API_KEY is unset and every xAI surface reports "not configured" — a paid,
# working credential sitting inert because of a spelling, and failing in the
# quietest way there is: no error anywhere, because from the code's point of
# view no key was ever set.


def test_a_key_stored_under_an_alias_is_found(monkeypatch):
    from app.services import runtime_config

    monkeypatch.delenv("XAI_API_KEY", raising=False)
    monkeypatch.setenv("SPACEX", "xai-real-key")

    assert runtime_config.key_for("XAI_API_KEY") == "xai-real-key"
    assert provider_health.is_configured("xai") is True


def test_the_canonical_name_wins_over_an_alias(monkeypatch):
    from app.services import runtime_config

    monkeypatch.setenv("XAI_API_KEY", "canonical")
    monkeypatch.setenv("SPACEX", "alias")
    assert runtime_config.key_for("XAI_API_KEY") == "canonical"
    assert runtime_config.alias_used("XAI_API_KEY") == "XAI_API_KEY"


def test_the_report_names_which_variable_supplied_the_key(monkeypatch):
    """
    A credential picked up from an alias looks identical to one from the
    canonical name until something needs renaming.
    """
    monkeypatch.delenv("XAI_API_KEY", raising=False)
    monkeypatch.setenv("SPACEX", "xai-real-key")
    assert provider_health.cached("xai")["key_name"] == "SPACEX"


def test_an_alias_does_not_leak_a_key_into_the_report(monkeypatch):
    monkeypatch.delenv("XAI_API_KEY", raising=False)
    monkeypatch.setenv("SPACEX", "xai-super-secret-value")
    assert "xai-super-secret-value" not in repr(provider_health.cached("xai"))


def test_the_router_and_the_probe_agree_about_an_aliased_key(monkeypatch):
    """
    The two must never disagree. A probe reporting "not configured" for a key
    the router happily uses sends an operator hunting a problem that is not
    there — and the reverse hides a real one.
    """
    from app.services import llm_client

    monkeypatch.delenv("XAI_API_KEY", raising=False)
    monkeypatch.setenv("SPACEX", "xai-real-key")

    assert llm_client.configured_providers()["xai"] is True
    assert provider_health.is_configured("xai") is True


def test_a_key_set_through_the_admin_store_is_seen_without_a_redeploy(monkeypatch):
    """
    XAI_API_KEY is a MANAGED_KEY — settable live via the admin integrations
    endpoint. Probing os.environ alone would report it absent moments after an
    operator set it.
    """
    from app.services import runtime_config

    monkeypatch.delenv("XAI_API_KEY", raising=False)
    monkeypatch.delenv("SPACEX", raising=False)
    monkeypatch.setattr(
        runtime_config, "get",
        lambda name, default="": "xai-from-store" if name == "XAI_API_KEY" else default,
    )
    assert provider_health.is_configured("xai") is True
