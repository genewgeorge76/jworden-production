"""
"Is the key set" is not "can a lead reach anybody".

notification_health.check() reported

    {"configured": true, "provider": "sendgrid"}

whenever SENDGRID_API_KEY held a value. It never contacted SendGrid. So a
revoked key, a key without the mail.send scope, or — much more commonly — a
From address that is not a verified sender identity all reported healthy while
every send was rejected 403 and no lead notification arrived.

That is the same failure the LLM provider dashboard had before it was fixed:
presence reported as health. It matters more here, because the send happens in
a background task after the endpoint has already returned 200. The lead saves,
the customer sees success, and nothing reaches anybody.

probe() answers the real question by calling the provider. These tests stub the
HTTP layer — the point is the interpretation of each response, not SendGrid's
uptime.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))


class _Resp:
    def __init__(self, status, payload=None, text=""):
        self.status_code = status
        self._payload = payload or {}
        self.text = text

    def json(self):
        return self._payload


def _stub(monkeypatch, by_url):
    """Route each probed URL to a canned response."""
    import httpx

    from app.services import notification_health as nh

    class _Client:
        def __init__(self, *a, **k):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *a):
            return False

        def get(self, url, headers=None):
            for fragment, resp in by_url.items():
                if fragment in url:
                    return resp
            raise AssertionError(f"unexpected probe URL: {url}")

    monkeypatch.setattr(nh, "_PROBE_TIMEOUT", 0.1)
    monkeypatch.setattr(httpx, "Client", _Client)


@pytest.fixture(autouse=True)
def env(monkeypatch):
    monkeypatch.setenv("SENDGRID_API_KEY", "SG.test")
    monkeypatch.setenv("SENDGRID_FROM_EMAIL", "leads@jwordenasphaltpaving.com")


def test_no_key_is_reported_as_unconfigured(monkeypatch):
    from app.services.notification_health import probe

    monkeypatch.delenv("SENDGRID_API_KEY", raising=False)
    result = probe()["email"]
    assert result["configured"] is False
    assert "SENDGRID_API_KEY" in result["error"]


def test_a_revoked_key_is_named_as_rejected(monkeypatch):
    from app.services.notification_health import probe

    _stub(monkeypatch, {"/v3/scopes": _Resp(401)})
    result = probe()["email"]
    assert result["credential"] == "rejected"
    assert "401" in result["error"]


def test_a_key_without_send_scope_is_caught(monkeypatch):
    """
    Authenticates perfectly and cannot send. Presence-checking calls this
    healthy.
    """
    from app.services.notification_health import probe

    _stub(monkeypatch, {
        "/v3/scopes": _Resp(200, {"scopes": ["alerts.read", "stats.read"]}),
        "/v3/verified_senders": _Resp(200, {"results": []}),
    })
    result = probe()["email"]
    assert result["credential"] == "accepted"
    assert result["can_send"] is False
    # Two problems in this fixture: no send scope AND an unverified sender.
    # Both must be reported — fixing one and rediscovering the other on the
    # next run is the slowest possible way to learn there were two.
    joined = " ".join(result["errors"])
    assert "mail.send" in joined
    assert "not a verified sender" in joined


def test_an_unverified_sender_is_the_headline(monkeypatch):
    """
    The most common cause of a working key that delivers nothing.
    """
    from app.services.notification_health import probe

    _stub(monkeypatch, {
        "/v3/scopes": _Resp(200, {"scopes": ["mail.send"]}),
        "/v3/verified_senders": _Resp(200, {"results": [
            {"from_email": "someone-else@example.com", "verified": True},
        ]}),
    })
    result = probe()["email"]
    assert result["credential"] == "accepted"
    assert result["sender_verified"] is False
    assert "not a verified sender" in result["error"]
    assert "403" in result["error"]
    assert result["verified_senders"] == ["someone-else@example.com"]


def test_a_healthy_configuration_reports_no_error(monkeypatch):
    from app.services.notification_health import probe

    _stub(monkeypatch, {
        "/v3/scopes": _Resp(200, {"scopes": ["mail.send"]}),
        "/v3/verified_senders": _Resp(200, {"results": [
            {"from_email": "leads@jwordenasphaltpaving.com", "verified": True},
        ]}),
    })
    result = probe()["email"]
    assert result["credential"] == "accepted"
    assert result["can_send"] is True
    assert result["sender_verified"] is True
    assert "error" not in result


def test_a_sender_check_failure_does_not_condemn_the_key(monkeypatch):
    """
    /v3/verified_senders needs its own scope, and a domain-authenticated sender
    never appears there. An inconclusive check must report None, not False —
    otherwise a working setup gets declared broken.
    """
    from app.services.notification_health import probe

    _stub(monkeypatch, {
        "/v3/scopes": _Resp(200, {"scopes": ["mail.send"]}),
        "/v3/verified_senders": _Resp(403),
    })
    result = probe()["email"]
    assert result["sender_verified"] is None
    assert "403" in result["sender_check"]


def test_the_probe_never_returns_key_material(monkeypatch):
    from app.services.notification_health import probe

    _stub(monkeypatch, {"/v3/scopes": _Resp(401)})
    assert "SG.test" not in str(probe())
