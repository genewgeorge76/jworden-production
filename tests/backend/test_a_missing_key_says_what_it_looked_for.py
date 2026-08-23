"""
"not_configured" has to be actionable.

The operator's Grok key was set on Fly the whole time, under a name none of
the aliases matched. The health report said `status: not_configured` and
`key_name: null` — true, and a dead end. There was no way to see which names
had been tried without reading provider_health.py.

Naming them turns "it says not configured" into "rename the secret to one of
these".
"""

import importlib

import pytest

from app.services import provider_health, runtime_config


def test_the_report_names_what_it_searched(monkeypatch):
    for name in runtime_config.KEY_ALIASES["XAI_API_KEY"]:
        monkeypatch.delenv(name, raising=False)

    snapshot = provider_health.cached("xai")
    assert snapshot["configured"] is False
    assert snapshot["key_name"] is None

    searched = snapshot["searched_env_names"]
    assert "XAI_API_KEY" in searched
    assert "SPACEX" in searched, "the operator's key is stored under this name"


def test_nothing_is_searched_once_it_is_found(monkeypatch):
    """A configured provider does not need to advertise its alias list."""
    monkeypatch.setenv("XAI_API_KEY", "a-value")
    snapshot = provider_health.cached("xai")
    assert snapshot["configured"] is True
    assert snapshot["searched_env_names"] is None


@pytest.mark.parametrize(
    "name", ["XAI_API_KEY", "SPACEX_API_KEY", "SPACEX", "GROK_API_KEY", "GROK"]
)
def test_each_reasonable_spelling_resolves(monkeypatch, name):
    """
    Grok, xAI and SpaceX are all reasonable names for the same secret depending
    on whether you mean the model, the company, or the other company.
    """
    for other in runtime_config.KEY_ALIASES["XAI_API_KEY"]:
        monkeypatch.delenv(other, raising=False)
    monkeypatch.setenv(name, "a-value")

    assert provider_health._SPECS["xai"].key_name() == name


def test_the_probe_and_the_router_agree_on_the_alias_list():
    """
    Two lists of the same aliases is one list that will eventually be wrong,
    and it fails silently in both directions: a probe reporting "not
    configured" for a working key, or reporting configured for a name nothing
    reads.
    """
    assert tuple(provider_health._SPECS["xai"].env) == runtime_config.KEY_ALIASES["XAI_API_KEY"]


def test_no_credential_value_appears_in_the_report(monkeypatch):
    monkeypatch.setenv("SPACEX", "xai-a-real-looking-secret-value")
    blob = repr(provider_health.cached("xai"))
    assert "xai-a-real-looking-secret-value" not in blob
    # The NAME is reported; the value never is.
    assert "SPACEX" in blob
