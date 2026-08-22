"""
Owner access is granted by header token, not by an unlock endpoint.

This replaces tests/test_owner_session.py, which POSTed to
/api/v1/admin/owner/unlock and asserted a 200 with a session_id. No such route
exists anywhere in the app — owner access was reworked to a stateless
X-Owner-Token header (app/services/jarvis_access.py) and the test was never
updated. It sat outside pytest.ini's testpaths, and CI ran no tests at all, so
it failed nowhere and nobody learned the endpoint it guarded had gone.

Lives in tests/backend/ so it is inside testpaths and actually runs.

What matters about the real mechanism: an empty or absent token must never be
treated as an owner. OWNER_TOKENS is read with .split(","), and splitting an
empty string yields [""] — so a blank entry could have matched a blank header
if the empty values were not filtered out. They are, and that is worth pinning
down.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from app.services.jarvis_access import (  # noqa: E402
    ROLE_OWNER_ROOT,
    is_owner_token,
    resolve_access_context,
)


@pytest.fixture(autouse=True)
def clean_owner_env(monkeypatch):
    monkeypatch.delenv("OWNER_TOKEN", raising=False)
    monkeypatch.delenv("OWNER_TOKENS", raising=False)


def test_a_matching_token_grants_owner_root(monkeypatch):
    monkeypatch.setenv("OWNER_TOKEN", "s3cret-owner-token")
    assert is_owner_token("s3cret-owner-token") is True

    ctx = resolve_access_context(x_owner_token="s3cret-owner-token")
    assert ctx.owner is True
    assert ctx.authenticated is True
    assert ctx.role == ROLE_OWNER_ROOT


def test_owner_tokens_plural_takes_precedence_and_accepts_a_list(monkeypatch):
    monkeypatch.setenv("OWNER_TOKEN", "old-single")
    monkeypatch.setenv("OWNER_TOKENS", "first-token, second-token ")
    assert is_owner_token("first-token") is True
    assert is_owner_token("second-token") is True
    assert is_owner_token("old-single") is False, (
        "OWNER_TOKENS is set, so the singular variable must not also be honoured"
    )


def test_a_wrong_token_is_not_an_owner(monkeypatch):
    monkeypatch.setenv("OWNER_TOKEN", "s3cret-owner-token")
    assert is_owner_token("guessed") is False
    assert resolve_access_context(x_owner_token="guessed").owner is False


@pytest.mark.parametrize("presented", ["", "   ", None])
def test_a_blank_token_is_never_an_owner(monkeypatch, presented):
    """
    "".split(",") returns [""], so an unfiltered allow-list would contain one
    empty string and a blank header would match it.
    """
    monkeypatch.setenv("OWNER_TOKENS", "")
    assert is_owner_token(presented) is False
    assert resolve_access_context(x_owner_token=presented).owner is False


def test_a_blank_entry_in_the_list_does_not_become_a_skeleton_key(monkeypatch):
    monkeypatch.setenv("OWNER_TOKENS", "real-token,,  ,")
    assert is_owner_token("real-token") is True
    for blank in ("", " ", ","):
        assert is_owner_token(blank) is False


def test_no_owner_token_configured_grants_nothing(monkeypatch):
    assert is_owner_token("anything") is False
    assert resolve_access_context(x_owner_token="anything").owner is False


def test_unauthenticated_context_is_not_an_owner():
    ctx = resolve_access_context()
    assert ctx.owner is False
    assert ctx.authenticated is False
