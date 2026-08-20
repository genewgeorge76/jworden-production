"""
Structural tests for the multi-provider LLM router.

The bug these exist to prevent: a provider can look wired without being
reachable. `xai` had a routing lane, a client factory and a dispatch branch,
so every grep said "Grok is wired" — but XAI_API_KEY was not a managed key,
so the only way to supply it was a platform secret, which costs a redeploy.
A lane you cannot supply a key to is decoration.

The model-id test catches the other half of the same class of rot: routes
naming models that were retired out from under them.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from app.services import runtime_config  # noqa: E402
from app.services.llm_client import _ROUTES, provider_status  # noqa: E402

# The env var each provider authenticates with. Google accepts either name.
PROVIDER_KEYS: dict[str, tuple[str, ...]] = {
    "openai":     ("OPENAI_API_KEY",),
    "anthropic":  ("ANTHROPIC_API_KEY",),
    "google":     ("GOOGLE_API_KEY", "GEMINI_API_KEY"),
    "perplexity": ("PERPLEXITY_API_KEY",),
    "xai":        ("XAI_API_KEY",),
}


def _routed_providers() -> set[str]:
    return {provider for chain in _ROUTES.values() for provider, _ in chain}


def test_every_routed_provider_has_a_known_key():
    """A provider the router can select must have a documented credential."""
    unknown = _routed_providers() - set(PROVIDER_KEYS)
    assert not unknown, f"routed providers with no known API key: {sorted(unknown)}"


@pytest.mark.parametrize("provider", sorted(_routed_providers()))
def test_routed_provider_key_is_settable_without_a_redeploy(provider):
    """
    Every routed provider's key must be in MANAGED_KEYS.

    Otherwise the lane is unreachable in practice: runtime_config.set_value
    refuses keys outside the whitelist, so the credential could only arrive
    as a platform secret — and that means a redeploy to turn on a provider
    the routing table already claims to support.
    """
    names = PROVIDER_KEYS[provider]
    assert any(n in runtime_config.MANAGED_KEYS for n in names), (
        f"{provider} is routed to but none of {names} is in MANAGED_KEYS, "
        f"so its key cannot be set live"
    )


def test_provider_status_covers_every_routed_provider():
    """The health readout must not silently omit a provider the router uses."""
    missing = _routed_providers() - set(provider_status())
    assert not missing, f"provider_status() omits routed providers: {sorted(missing)}"


def test_no_retired_grok_4_model_id():
    """
    xAI retired the bare `grok-4` id; the current family is grok-4.x.

    Asserted against the parsed routing table rather than the file text so a
    mention of grok-4 in a comment or docstring cannot fail the test, and a
    real route cannot pass it.
    """
    for task, chain in _ROUTES.items():
        for provider, model in chain:
            if provider == "xai":
                assert model != "grok-4", (
                    f"task {task!r} routes to the retired id 'grok-4'"
                )
                assert model.startswith("grok-"), f"task {task!r}: odd xai model {model!r}"


def test_social_signal_lane_prefers_grok():
    """Grok's reason to exist here is X access — it must lead that lane."""
    chain = _ROUTES["social_signal"]
    assert chain[0][0] == "xai", "social_signal must try xAI first"
    assert len(chain) > 1, "social_signal needs a fallback for when xAI is down"


async def test_xai_probe_reports_missing_key_rather_than_failing():
    """
    An unset key is a configuration answer, not an exception.

    Declared async so pytest-asyncio (asyncio_mode=auto) supplies the loop.
    Driving it by hand passed alone and failed in the full suite, because an
    earlier test had already closed the default loop.
    """
    from app.routers.admin_integrations import _test_xai

    if runtime_config.get("XAI_API_KEY"):
        pytest.skip("XAI_API_KEY is configured in this environment")

    result = await _test_xai()
    assert result["ok"] is False
    assert "XAI_API_KEY" in result["error"]
