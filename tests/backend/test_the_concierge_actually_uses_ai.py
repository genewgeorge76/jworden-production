"""
The founder concierge on the front page had never once called a model.

_call_openai passed `messages=` to llm_client.chat() and unpacked a two-tuple:

    reply, err = llm_client.chat(messages=messages, task="fast", ...)

chat() takes `system=` and `user=` and returns an LLMResponse. So every call
raised TypeError, the except swallowed it as a provider failure, the function
returned "", and public_chat fell through to _stub_response — a rule table.
Every answer the front page has ever given came from that table, which is
exactly what it looked like to anyone who used it.

The bug was invisible because the failure path was indistinguishable from
"no provider configured", and both ended in a plausible-sounding reply.
"""

import pytest

from app.routers import public_chat
from app.services.llm_client import LLMResponse


def _messages(user: str = "How much to seal a 6,000 sq ft lot in Roanoke?"):
    return [
        {"role": "system", "content": "You are Mr. Worden."},
        {"role": "user", "content": "Hi"},
        {"role": "assistant", "content": "Good afternoon."},
        {"role": "user", "content": user},
    ]


def test_the_model_is_actually_called(monkeypatch):
    seen = {}

    def _fake_chat(**kwargs):
        seen.update(kwargs)
        return LLMResponse(text="  A real answer.  ", provider="anthropic", model="claude-opus-5")

    monkeypatch.setattr(public_chat.llm_client, "chat", _fake_chat)

    assert public_chat._call_openai(_messages()) == "A real answer."
    # The arguments chat() actually takes — the whole bug in one assertion.
    assert "messages" not in seen
    assert seen["system"] == "You are Mr. Worden."
    assert seen["user"].startswith("How much to seal")


def test_prior_turns_are_passed_as_history(monkeypatch):
    seen = {}

    def _fake_chat(**kwargs):
        seen.update(kwargs)
        return LLMResponse(text="ok", provider="anthropic", model="claude-opus-5")

    monkeypatch.setattr(public_chat.llm_client, "chat", _fake_chat)
    public_chat._call_openai(_messages())

    # The final user turn is the prompt; everything before it is context.
    assert [m["role"] for m in seen["history"]] == ["user", "assistant"]
    assert all(m["role"] != "system" for m in seen["history"])


def test_a_provider_failure_still_returns_empty(monkeypatch):
    """
    The caller falls back to the rule table, which is the honest end of the
    chain for a public page. That behaviour was correct; it was just being
    reached every single time.
    """
    monkeypatch.setattr(
        public_chat.llm_client,
        "chat",
        lambda **_: LLMResponse(
            text="", provider="none", model="", error=True, error_detail="no providers"
        ),
    )
    assert public_chat._call_openai(_messages()) == ""


def test_an_exception_is_contained(monkeypatch):
    def _boom(**_):
        raise RuntimeError("provider exploded")

    monkeypatch.setattr(public_chat.llm_client, "chat", _boom)
    assert public_chat._call_openai(_messages()) == ""


def test_no_user_turn_means_no_call(monkeypatch):
    called = []
    monkeypatch.setattr(
        public_chat.llm_client,
        "chat",
        lambda **k: called.append(k) or LLMResponse(text="x", provider="p", model="m"),
    )
    assert public_chat._call_openai([{"role": "system", "content": "prompt only"}]) == ""
    assert not called


# ── The lane ────────────────────────────────────────────────────────────────

def test_the_concierge_runs_on_the_top_lane_by_default(monkeypatch):
    """
    It was "fast" — gpt-4o-mini. This is the founder persona on the front page
    and the thing that turns a visit into a lead.
    """
    monkeypatch.delenv("CONCIERGE_TASK", raising=False)
    lane = public_chat._concierge_task()
    assert lane == "persona"

    primary_provider, primary_model = public_chat.llm_client._ROUTES[lane][0]
    assert primary_provider == "anthropic"
    assert primary_model == "claude-opus-5"


def test_the_lane_can_be_dialled_back_without_a_deploy(monkeypatch):
    monkeypatch.setenv("CONCIERGE_TASK", "fast")
    assert public_chat._concierge_task() == "fast"


def test_a_typo_in_the_lane_does_not_silence_the_concierge(monkeypatch):
    """
    An unknown lane resolves to no provider chain, which would send the
    concierge straight back to the rule table — the exact failure this change
    exists to end.
    """
    monkeypatch.setenv("CONCIERGE_TASK", "persoan")
    assert public_chat._concierge_task() == "persona"


@pytest.mark.anyio
async def test_the_endpoint_returns_the_model_answer(client, monkeypatch):
    monkeypatch.setattr(
        public_chat.llm_client,
        "chat",
        lambda **_: LLMResponse(
            text="Roanoke sealcoating runs by the square foot; send dimensions.",
            provider="anthropic",
            model="claude-opus-5",
        ),
    )

    response = await client.post(
        "/api/v1/public/chat",
        json={"message": "How much to seal a lot in Roanoke?"},
    )
    assert response.status_code == 200, response.text
    assert "Roanoke sealcoating runs by the square foot" in response.json()["message"]
