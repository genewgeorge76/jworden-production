"""
Tests for X listening.

The property that carries this feature: a finding is a post someone can click
through and read, or it is not a finding.

A model asked "what are people saying about potholes in Richmond" will write a
fluent, specific, entirely plausible paragraph whether or not the search
returned anything — naming accounts that do not exist, quoting complaints
nobody made. Prose is not evidence. Only a citation is.
"""
from __future__ import annotations

import sys
from datetime import date
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from app.services import social_listening as sl  # noqa: E402

MASTER_KEY_TENANT = "JWORDEN_HQ"


def _cited(text, annotations, citations=None, model="grok-4.6"):
    return {
        "model": model,
        "citations": citations or [],
        "output": [{"content": [{"type": "output_text", "text": text,
                                 "annotations": annotations}]}],
    }


# ── The guard ────────────────────────────────────────────────────────────────


def test_a_cited_post_becomes_a_signal():
    body = _cited(
        "Residents flagged potholes on Broad Street.",
        [{"type": "url_citation", "url": "https://x.com/a/status/1",
          "title": "1", "start_index": 0, "end_index": 43}],
    )
    result = sl.parse(body, kind="road_complaints", query="q")
    assert len(result.signals) == 1
    assert result.signals[0].url == "https://x.com/a/status/1"
    assert "potholes" in result.signals[0].excerpt


def test_fluent_prose_with_no_citations_yields_no_signals():
    """The core guard. Convincing text naming real-looking handles, zero sources."""
    body = _cited(
        "@RVAdriver complained about a massive pothole on Cary St, and "
        "@jsmith804 says their parking lot is crumbling after the storm.",
        [],
    )
    result = sl.parse(body, kind="road_complaints", query="q")
    assert result.signals == []
    assert "uncited" in result.reason or "no cited" in result.reason


def test_the_uncited_narrative_is_still_returned_for_a_human_to_read():
    """Kept, but never promoted to a finding."""
    body = _cited("Nothing much is being said this week.", [])
    result = sl.parse(body, kind="road_complaints", query="q")
    assert result.narrative
    assert result.as_dict()["count"] == 0


def test_an_annotation_with_no_url_is_not_a_signal():
    body = _cited("Something happened.",
                  [{"type": "url_citation", "title": "1",
                    "start_index": 0, "end_index": 5}])
    assert sl.parse(body, kind="road_complaints", query="q").signals == []


def test_non_url_annotations_are_ignored():
    body = _cited("Something happened.",
                  [{"type": "file_citation", "url": "https://x.com/a/1"}])
    assert sl.parse(body, kind="road_complaints", query="q").signals == []


def test_duplicate_urls_collapse_to_one_signal():
    ann = {"type": "url_citation", "url": "https://x.com/a/status/1",
           "title": "1", "start_index": 0, "end_index": 4}
    body = _cited("Some text here.", [ann, dict(ann)])
    assert len(sl.parse(body, kind="road_complaints", query="q").signals) == 1


def test_searched_sources_that_support_no_span_are_reported_separately():
    """
    Touched but uncited URLs are leads to read, not findings. Folding them in
    would let anything the search brushed past count as evidence.
    """
    body = _cited(
        "Residents flagged potholes.",
        [{"type": "url_citation", "url": "https://x.com/a/status/1",
          "title": "1", "start_index": 0, "end_index": 27}],
        citations=["https://x.com/a/status/1", "https://example.com/unrelated"],
    )
    result = sl.parse(body, kind="road_complaints", query="q")
    assert [s.url for s in result.signals] == ["https://x.com/a/status/1"]
    assert result.uncited_sources == ["https://example.com/unrelated"]


# ── Request construction ─────────────────────────────────────────────────────


def test_payload_targets_the_responses_endpoint_shape_not_chat_completions():
    """
    x_search is documented on /v1/responses, which takes `input`. Sending a
    tool block to /v1/chat/completions with `messages` would be rejected.
    """
    payload = sl.build_payload("road_complaints", place="Richmond, VA")
    assert "input" in payload and "messages" not in payload
    assert payload["tools"][0]["type"] == "x_search"


def test_date_filters_are_iso8601():
    payload = sl.build_payload("storm_damage", place="Norfolk, VA",
                               from_date=date(2026, 8, 1), to_date=date(2026, 8, 20))
    tool = payload["tools"][0]
    assert tool["from_date"] == "2026-08-01"
    assert tool["to_date"] == "2026-08-20"


def test_handles_are_normalised_without_the_at_sign():
    payload = sl.build_payload("brand_mentions", place="Richmond, VA",
                               allowed_handles=["@VaDOT", "cityofrichmond"])
    assert payload["tools"][0]["allowed_x_handles"] == ["VaDOT", "cityofrichmond"]


def test_allowed_and_excluded_handles_together_is_rejected_locally():
    """x_search refuses the combination; better a clear local error than a 400."""
    with pytest.raises(ValueError, match="cannot both be set"):
        sl.build_payload("brand_mentions", place="Richmond, VA",
                         allowed_handles=["a"], excluded_handles=["b"])


def test_more_than_twenty_handles_is_rejected_locally():
    with pytest.raises(ValueError, match="20"):
        sl.build_payload("brand_mentions", place="Richmond, VA",
                         allowed_handles=[f"h{i}" for i in range(21)])


def test_unknown_signal_kind_is_rejected():
    with pytest.raises(ValueError, match="unknown signal kind"):
        sl.build_payload("vibes", place="Richmond, VA")


def test_the_prompt_tells_the_model_to_report_nothing_when_it_finds_nothing():
    prompt = sl.build_prompt("road_complaints", place="Richmond, VA")
    assert "actually found" in prompt
    assert "list nothing" in prompt


# ── Without a key ────────────────────────────────────────────────────────────


async def test_listen_refuses_without_a_key_rather_than_returning_nothing(monkeypatch):
    from app.services import runtime_config as cfg
    monkeypatch.setattr(cfg, "get", lambda name, default="": "")
    with pytest.raises(sl.ListeningUnavailable, match="XAI_API_KEY"):
        await sl.listen("road_complaints", place="Richmond, VA")


# ── Through the API ──────────────────────────────────────────────────────────


async def test_kinds_endpoint_lists_what_can_be_watched(client, auth_headers):
    r = await client.get("/api/v1/social/listen/kinds", headers=auth_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["configured"] is False
    kinds = {k["kind"] for k in body["kinds"]}
    assert {"road_complaints", "municipal_projects", "storm_damage"} <= kinds


async def test_run_returns_503_when_unconfigured_not_an_empty_result(
    client, auth_headers
):
    """
    503 with the missing key named. An empty 200 would read as "nothing is
    happening in Richmond" when the truth is "nothing was searched".
    """
    r = await client.post("/api/v1/social/listen/run", headers=auth_headers,
                          json={"kind": "road_complaints", "place": "Richmond, VA"})
    assert r.status_code == 503
    assert "XAI_API_KEY" in r.json()["detail"]


async def test_status_reports_listening_as_unconfigured(client, auth_headers):
    r = await client.get("/api/v1/social/status", headers=auth_headers)
    assert r.status_code == 200
    listening = r.json()["listening"]
    assert listening["configured"] is False
    assert listening["missing_key"] == "XAI_API_KEY"


async def test_a_signal_converts_to_a_lead_only_when_a_person_says_so(
    client, auth_headers, app_modules
):
    _, dbmod = app_modules
    from app.models import SocialSignal

    db = dbmod.SessionLocal()
    try:
        sig = SocialSignal(
            tenant_id=MASTER_KEY_TENANT, kind="road_complaints",
            url="https://x.com/a/status/1", title="1",
            excerpt="Pothole on Broad St", place="Richmond, VA",
            provider="xai_x_search",
        )
        db.add(sig)
        db.commit()
        sig_id = sig.id
    finally:
        db.close()

    r = await client.get("/api/v1/social/listen/signals", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["count"] == 1
    assert r.json()["signals"][0]["review_status"] == "new"
    assert r.json()["signals"][0]["lead_id"] is None

    r = await client.post(f"/api/v1/social/listen/signals/{sig_id}/convert",
                          headers=auth_headers,
                          json={"name": "Broad St property owner",
                                "email": "owner@example.com",
                                "phone": "804-555-0100",
                                "service_type": "patching", "state_code": "VA"})
    assert r.status_code == 200, r.text
    assert r.json()["signal"]["review_status"] == "converted"
    assert r.json()["lead_id"]


async def test_converting_twice_is_refused(client, auth_headers, app_modules):
    _, dbmod = app_modules
    from app.models import SocialSignal

    db = dbmod.SessionLocal()
    try:
        sig = SocialSignal(tenant_id=MASTER_KEY_TENANT, kind="storm_damage",
                           url="https://x.com/b/status/2", provider="xai_x_search")
        db.add(sig)
        db.commit()
        sig_id = sig.id
    finally:
        db.close()

    payload = {"name": "Someone", "email": "someone@example.com",
               "phone": "804-555-0101", "service_type": "paving"}
    first = await client.post(f"/api/v1/social/listen/signals/{sig_id}/convert",
                              headers=auth_headers, json=payload)
    assert first.status_code == 200
    second = await client.post(f"/api/v1/social/listen/signals/{sig_id}/convert",
                               headers=auth_headers, json=payload)
    assert second.status_code == 409


async def test_dismissing_requires_a_reason(client, auth_headers, app_modules):
    _, dbmod = app_modules
    from app.models import SocialSignal

    db = dbmod.SessionLocal()
    try:
        sig = SocialSignal(tenant_id=MASTER_KEY_TENANT, kind="storm_damage",
                           url="https://x.com/c/status/3", provider="xai_x_search")
        db.add(sig)
        db.commit()
        sig_id = sig.id
    finally:
        db.close()

    r = await client.post(f"/api/v1/social/listen/signals/{sig_id}/dismiss",
                          headers=auth_headers, json={"reason": ""})
    assert r.status_code == 422

    r = await client.post(f"/api/v1/social/listen/signals/{sig_id}/dismiss",
                          headers=auth_headers, json={"reason": "Out of our area."})
    assert r.status_code == 200
    assert r.json()["signal"]["review_status"] == "dismissed"


async def test_listening_is_gated(client):
    r = await client.get("/api/v1/social/listen/kinds")
    assert r.status_code in (401, 403)


async def test_converting_without_a_contact_is_refused_not_invented(
    client, auth_headers, app_modules
):
    """
    leads.email is NOT NULL. The tempting fix is to synthesise something from
    the handle; that would put a contact in the pipeline that reaches nobody.
    """
    _, dbmod = app_modules
    from app.models import SocialSignal

    db = dbmod.SessionLocal()
    try:
        sig = SocialSignal(tenant_id=MASTER_KEY_TENANT, kind="development",
                           url="https://x.com/d/status/4", provider="xai_x_search")
        db.add(sig)
        db.commit()
        sig_id = sig.id
    finally:
        db.close()

    r = await client.post(f"/api/v1/social/listen/signals/{sig_id}/convert",
                          headers=auth_headers, json={"name": "Someone"})
    assert r.status_code == 422

    r = await client.get("/api/v1/social/listen/signals", headers=auth_headers)
    assert r.json()["signals"][0]["review_status"] == "new"
