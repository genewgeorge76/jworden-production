"""
"Are all my secrets working" has to be answerable for all of them.

The spec table stopped at the model providers, so that question could only be
answered for six credentials out of the dozens this deployment holds. The rest
were assumed — and assumption has already cost twice: a Grok key set under a
name nothing read, and a Gemini key set and rejected. Both looked fine from
outside, because nothing ever asked.
"""

import httpx
import pytest

from app.services import provider_health as ph


def test_the_integrations_that_matter_are_all_covered():
    """
    Named individually rather than counted. A count passes when someone
    removes SendGrid and adds something else, and the point is that each of
    these specific credentials can be verified.
    """
    covered = set(ph.provider_ids())
    for required in (
        "openai", "anthropic", "google", "xai",     # the brains
        "sendgrid", "twilio",                        # reaching customers
        "stripe",                                    # taking money
        "tavily",                                    # Jarvis web search
        "elevenlabs", "vapi",                        # voice
        "eia", "sam_gov", "regrid",                  # real-world data
        "google_maps",                               # geocoding
    ):
        assert required in covered, f"{required} cannot be verified"


def test_every_spec_can_build_a_request():
    """A spec that cannot form a URL is a provider that silently never probes."""
    for pid in ph.provider_ids():
        spec = ph._spec(pid)
        url = spec.request_url("a-test-key")
        assert url.startswith("https://"), pid
        assert "{companion}" not in url, f"{pid} left an unsubstituted placeholder"


def test_a_two_part_credential_needs_both_parts(monkeypatch):
    """
    Twilio with an auth token and no account SID cannot be probed and cannot be
    used. Reporting it configured because one half is set would be reporting a
    working integration that is not one.
    """
    monkeypatch.setenv("TWILIO_AUTH_TOKEN", "a-token")
    monkeypatch.delenv("TWILIO_ACCOUNT_SID", raising=False)
    assert ph._spec("twilio").configured() is False

    monkeypatch.setenv("TWILIO_ACCOUNT_SID", "AC123")
    assert ph._spec("twilio").configured() is True


def test_basic_auth_pairs_the_sid_with_the_token(monkeypatch):
    monkeypatch.setenv("TWILIO_ACCOUNT_SID", "AC123")
    monkeypatch.setenv("TWILIO_AUTH_TOKEN", "the-token")
    spec = ph._spec("twilio")

    assert spec.auth_tuple("the-token") == ("AC123", "the-token")
    assert "AC123" in spec.request_url("the-token")
    # The secret must not also be pasted into a header.
    assert "Authorization" not in spec.headers("the-token")


def test_a_query_credential_lands_on_the_url_and_not_in_a_header():
    spec = ph._spec("serpapi")
    url = spec.request_url("secret-value")
    assert "api_key=secret-value" in url
    assert spec.headers("secret-value") == {}


def test_a_query_credential_respects_an_existing_query_string():
    """sam_gov and regrid already carry parameters; a second '?' breaks them."""
    for pid in ("sam_gov", "regrid", "pagespeed"):
        url = ph._spec(pid).request_url("k")
        assert url.count("?") == 1, f"{pid} produced a malformed URL"


def test_the_tavily_key_goes_in_the_body():
    """It has no GET that authenticates, and reads the key from the payload."""
    spec = ph._spec("tavily")
    payload = ph._payload_for(spec, "tvly-secret")
    assert payload["api_key"] == "tvly-secret"
    assert spec.method == "POST"
    # Not held on the spec itself, so a live key never sits in a module-level
    # structure.
    assert "api_key" not in (spec.payload or {})


def test_no_probe_writes_sends_or_charges():
    """
    Every endpoint must be a read. A health check that sends an email or opens
    a charge is worse than no health check.
    """
    for pid in ph.provider_ids():
        spec = ph._spec(pid)
        url = spec.url.lower()
        for forbidden in ("/mail/send", "/messages", "/charges", "/payment_intents", "/localposts"):
            assert forbidden not in url, f"{pid} probes a side-effecting endpoint"
        assert spec.method in {"GET", "POST"}, pid
    # The one POST is a search, which is a read in everything but HTTP verb.
    assert ph._spec("tavily").method == "POST"


@pytest.mark.anyio
async def test_a_rejected_key_is_not_reported_as_missing():
    """
    The distinction that matters most on this list. "Not configured" sends an
    operator to add a secret they already added; "rejected" sends them to fix
    the one they have — which is the Gemini situation exactly.
    """
    def _handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(403, json={"error": "forbidden"})

    transport = httpx.MockTransport(_handler)
    async with httpx.AsyncClient(transport=transport) as client:
        result = await ph.probe(
            client, method="GET", url="https://example.invalid/x", configured=True
        )

    assert result["status"] == ph.INVALID_CREDENTIALS
    assert result["status"] != ph.NOT_CONFIGURED
    assert result["up"] is False


@pytest.mark.anyio
async def test_rate_limiting_proves_the_key_works():
    def _handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(429)

    transport = httpx.MockTransport(_handler)
    async with httpx.AsyncClient(transport=transport) as client:
        result = await ph.probe(
            client, method="GET", url="https://example.invalid/x", configured=True
        )

    # Reporting this as a bad key sends someone to rotate a working secret.
    assert result["status"] == ph.DEGRADED
    assert "credentials accepted" in result["detail"]


def test_a_credential_value_never_reaches_the_report(monkeypatch):
    monkeypatch.setenv("SERPAPI_KEY", "serp-a-real-looking-secret")
    assert "serp-a-real-looking-secret" not in ph.redact(
        "failed calling https://serpapi.com/account?api_key=serp-a-real-looking-secret"
    )


def test_every_provider_is_categorised():
    """An operator reading "what is dead" wants payments separate from models."""
    for pid in ph.provider_ids():
        assert ph._spec(pid).category in {
            "ai", "voice", "search", "messaging", "payments", "google", "data"
        }, pid
