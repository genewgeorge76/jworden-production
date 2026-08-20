"""
Tests for social publishing.

Two properties carry this feature, and both are about what the system refuses
to do:

  1. Content is composed from a record or not at all — and the record's
     private parts (the customer's street address, what they paid) never
     reach the copy.
  2. A factual claim without a live attestation cannot be published. Not
     "is warned about" — cannot, with no override, and re-checked at send
     time so a lapsed certificate stops its own posts.
"""
from __future__ import annotations

import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from types import SimpleNamespace

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from app.services import social_claims, social_content, social_publish  # noqa: E402

# The master key maps to this tenant; rows inserted directly must carry it or
# tenant scoping correctly hides them from the client that created them.
MASTER_KEY_TENANT = "JWORDEN_HQ"


def _job(**kw):
    base = dict(
        id=41, job_number="J-2026-041", status="completed",
        service_type="asphalt paving",
        site_address="412 Oakmont Lane, Charlottesville, VA 22903",
        state_code="VA",
        completed_at=datetime(2026, 8, 14, tzinfo=timezone.utc),
        price=8400.00, pictures_json=["img1.jpg"],
    )
    base.update(kw)
    return SimpleNamespace(**base)


# ── Privacy: what must never reach a public post ─────────────────────────────


def test_street_address_is_reduced_to_city_and_state():
    assert social_content.public_place(
        "412 Oakmont Lane, Charlottesville, VA 22903", "VA"
    ) == "Charlottesville, VA"


def test_an_address_with_no_recoverable_city_falls_back_to_state_not_the_street():
    """Returning the input would publish the customer's street. It must not."""
    out = social_content.public_place("77 Sunset Ct", "VA")
    assert out == "VA"
    assert "Sunset" not in (out or "")


def test_composed_post_contains_neither_the_street_nor_the_price():
    c = social_content.compose_from_job(_job())
    assert "Oakmont" not in c.body
    assert "412" not in c.body
    assert "8400" not in c.body and "8,400" not in c.body
    assert "Charlottesville, VA" in c.body


def test_post_carries_provenance_back_to_the_job_row():
    c = social_content.compose_from_job(_job())
    assert c.source_kind == "job"
    assert c.source_id == "41"
    assert "J-2026-041" in c.source_note


# ── Refusal rather than invention ────────────────────────────────────────────


def test_unfinished_job_cannot_become_a_finished_work_post():
    with pytest.raises(social_content.NotPostable):
        social_content.compose_from_job(
            _job(status="in_progress", completed_at=None)
        )


def test_missing_job_refuses_rather_than_composing_a_generic_post():
    with pytest.raises(social_content.NotPostable):
        social_content.compose_from_job(None)


# ── The claim guardrail ──────────────────────────────────────────────────────


@pytest.mark.parametrize(
    "copy,expect_key",
    [
        ("Licensed and insured.",              "licensed"),
        ("$5M liability coverage.",            "insurance_liability"),
        ("4.9 stars on Google.",               "rating"),
        ("#1 rated paving contractor.",        "rank"),
        ("Lifetime guarantee on every job.",   "warranty"),
        ("Since 1984, family owned.",          "years_in_business"),
        ("Save 20% this month.",               "price_claim"),
        ("Over 5,000 driveways paved.",        "volume"),
        ("VDOT certified crews.",              "certification"),
    ],
)
def test_factual_claims_are_detected(copy, expect_key):
    keys = {f.key for f in social_claims.scan(copy).findings}
    assert expect_key in keys, f"{copy!r} did not trip {expect_key}"


def test_clean_copy_is_publishable():
    report = social_claims.scan(
        "Wrapped up asphalt paving in Richmond, VA. Free estimates."
    )
    assert report.publishable
    assert not report.blocking


def test_a_live_attestation_clears_its_claim():
    report = social_claims.scan("Licensed contractor.")
    assert not report.publishable
    cleared = social_claims.resolve(report, [
        SimpleNamespace(key="licensed", effective_from=date(2020, 1, 1),
                        expires_on=date(2099, 1, 1)),
    ])
    assert cleared.publishable


def test_an_expired_attestation_clears_nothing():
    """
    The reason expiry is a column. A certificate of insurance lapses and the
    posts leaning on it must stop, without anyone remembering to check.
    """
    report = social_claims.scan("Fully insured crews.")
    cleared = social_claims.resolve(report, [
        SimpleNamespace(key="insured", effective_from=date(2025, 1, 1),
                        expires_on=date(2026, 3, 1)),
    ], on=date(2026, 8, 20))
    assert not cleared.publishable
    assert {f.key for f in cleared.blocking} == {"insured"}


def test_an_attestation_not_yet_in_effect_clears_nothing():
    report = social_claims.scan("Fully insured crews.")
    cleared = social_claims.resolve(report, [
        SimpleNamespace(key="insured", effective_from=date(2027, 1, 1),
                        expires_on=None),
    ], on=date(2026, 8, 20))
    assert not cleared.publishable


def test_the_default_composed_post_makes_no_claim_needing_attestation():
    """
    The composer's own output must clear the guardrail unaided. If the default
    template needed an attestation, every user would hit a wall on their first
    post and learn to route around the check.
    """
    body = social_content.compose_from_job(_job()).body
    assert social_claims.scan(body).publishable, body


# ── Drivers ──────────────────────────────────────────────────────────────────


def test_export_driver_needs_no_credentials():
    status = social_publish.status_for("export")
    assert status.available and status.configured


def test_every_driver_explains_what_it_needs():
    for platform in social_publish.PLATFORMS:
        status = social_publish.status_for(platform)
        assert status.requires, f"{platform} gives no reason"


def test_tiktok_is_unavailable_because_it_needs_video_not_a_credential():
    """
    The distinction matters. Every other platform is one token away; TikTok
    publishes video and nothing here produces video, so listing it as merely
    unconfigured would send someone off to get a credential that cannot help.
    """
    status = social_publish.status_for("tiktok")
    assert status.available is False
    assert "video" in status.requires.lower()
    assert status.missing_keys == []


def test_no_driver_claims_to_be_verified_against_a_live_account():
    """
    Except export, which transmits nothing and therefore has nothing to prove.
    Flipping one of these to True requires an actual successful send.
    """
    for platform in social_publish.PLATFORMS:
        status = social_publish.status_for(platform)
        if platform == "export":
            assert status.verified_live is True
        else:
            assert status.verified_live is False, (
                f"{platform} claims live verification that has not happened"
            )


@pytest.mark.parametrize("platform,key", [
    ("gbp",       "GBP_OAUTH_TOKEN"),
    ("facebook",  "META_PAGE_ACCESS_TOKEN"),
    ("instagram", "IG_ACCESS_TOKEN"),
    ("linkedin",  "LINKEDIN_ACCESS_TOKEN"),
    ("x",         "X_ACCESS_TOKEN"),
])
async def test_a_driver_without_its_key_names_the_key_rather_than_failing_vaguely(
    platform, key
):
    post = SimpleNamespace(platform=platform, body="hi", media_json=None,
                           link_url=None)
    result = await social_publish.publish(post)
    assert result.ok is False
    assert key in result.reason, result.reason


async def test_instagram_refuses_a_post_with_no_public_image(monkeypatch):
    """
    Instagram fetches the image itself, so a local filename is not a candidate.
    Refusing here beats creating a container the platform cannot resolve.
    """
    from app.services import runtime_config as cfg
    monkeypatch.setattr(cfg, "get", lambda name, default="": {
        "IG_ACCESS_TOKEN": "t", "IG_USER_ID": "123",
    }.get(name, default))

    post = SimpleNamespace(platform="instagram", body="hi",
                           media_json=["local-photo.jpg"], link_url=None)
    result = await social_publish.publish(post)
    assert result.ok is False
    assert "image" in result.reason.lower()


async def test_x_refuses_copy_over_the_character_limit_without_calling_out(monkeypatch):
    from app.services import runtime_config as cfg
    monkeypatch.setattr(cfg, "get", lambda name, default="": {
        "X_ACCESS_TOKEN": "t",
    }.get(name, default))

    post = SimpleNamespace(platform="x", body="a" * 281, media_json=None,
                           link_url=None)
    result = await social_publish.publish(post)
    assert result.ok is False
    assert "280" in result.reason


async def test_linkedin_rejects_an_author_that_is_not_a_urn(monkeypatch):
    from app.services import runtime_config as cfg
    monkeypatch.setattr(cfg, "get", lambda name, default="": {
        "LINKEDIN_ACCESS_TOKEN": "t", "LINKEDIN_ORG_URN": "5515715",
    }.get(name, default))

    post = SimpleNamespace(platform="linkedin", body="hi", media_json=None,
                           link_url=None)
    result = await social_publish.publish(post)
    assert result.ok is False
    assert "urn:li:" in result.reason


def test_composing_for_x_respects_the_platform_limit():
    body = social_content.compose_from_job(_job(), platform="x").body
    assert len(body) <= 280


# ── End to end through the API ───────────────────────────────────────────────


async def test_status_reports_no_sources_when_there_are_no_completed_jobs(
    client, auth_headers
):
    r = await client.get("/api/v1/social/status", headers=auth_headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["completed_jobs_available_as_sources"] == 0
    assert any("no completed jobs" in b for b in body["blockers"])


async def test_compose_refuses_for_a_job_that_does_not_exist(client, auth_headers):
    r = await client.post("/api/v1/social/compose",
                          headers=auth_headers,
                          json={"source_kind": "job", "source_id": "99999"})
    assert r.status_code == 409


async def test_compose_rejects_an_unsupported_source_kind(client, auth_headers):
    r = await client.post("/api/v1/social/compose",
                          headers=auth_headers,
                          json={"source_kind": "vibes", "source_id": "1"})
    assert r.status_code == 422


async def test_check_endpoint_blocks_unsubstantiated_copy(client, auth_headers):
    r = await client.post("/api/v1/social/check", headers=auth_headers,
                          json={"body": "We are the #1 rated, fully insured pavers."})
    assert r.status_code == 200
    report = r.json()["claim_report"]
    assert report["publishable"] is False
    assert report["blocking_count"] >= 2


async def test_attesting_a_claim_makes_that_copy_publishable(client, auth_headers):
    r = await client.post("/api/v1/social/check", headers=auth_headers,
                          json={"body": "Fully insured crews."})
    assert r.json()["claim_report"]["publishable"] is False

    future = (date.today() + timedelta(days=200)).isoformat()
    r = await client.post("/api/v1/social/claims", headers=auth_headers, json={
        "key": "insured",
        "claim_text": "General liability in force.",
        "source_note": "COI on file from the carrier.",
        "expires_on": future,
    })
    assert r.status_code == 200, r.text

    r = await client.post("/api/v1/social/check", headers=auth_headers,
                          json={"body": "Fully insured crews."})
    assert r.json()["claim_report"]["publishable"] is True


async def test_an_expired_attestation_does_not_make_copy_publishable(
    client, auth_headers
):
    past = (date.today() - timedelta(days=5)).isoformat()
    r = await client.post("/api/v1/social/claims", headers=auth_headers, json={
        "key": "licensed",
        "claim_text": "Class A contractor licence.",
        "source_note": "DPOR record.",
        "expires_on": past,
    })
    assert r.status_code == 200, r.text

    r = await client.post("/api/v1/social/check", headers=auth_headers,
                          json={"body": "Licensed and ready."})
    assert r.json()["claim_report"]["publishable"] is False


async def test_a_claim_key_the_guardrail_does_not_know_is_rejected(
    client, auth_headers
):
    """Otherwise an attestation could be filed that clears nothing, silently."""
    r = await client.post("/api/v1/social/claims", headers=auth_headers, json={
        "key": "we_are_great",
        "claim_text": "We are great.",
        "source_note": "Vibes.",
    })
    assert r.status_code == 422


async def test_attestation_requires_a_source_note(client, auth_headers):
    r = await client.post("/api/v1/social/claims", headers=auth_headers, json={
        "key": "insured", "claim_text": "Insured.", "source_note": "",
    })
    assert r.status_code == 422


async def test_publishing_a_post_with_unsubstantiated_claims_is_409_not_a_warning(
    client, auth_headers, app_modules
):
    _, dbmod = app_modules
    from app.models import SocialPost

    db = dbmod.SessionLocal()
    try:
        post = SocialPost(
            tenant_id=MASTER_KEY_TENANT, platform="export", status="queued",
            body="We are the #1 paving contractor in Virginia.",
            source_kind="job", source_id="1",
        )
        db.add(post)
        db.commit()
        post_id = post.id
    finally:
        db.close()

    r = await client.post(f"/api/v1/social/posts/{post_id}/publish",
                          headers=auth_headers)
    assert r.status_code == 409
    detail = r.json()["detail"]
    assert detail["error"] == "unsubstantiated claims"
    assert detail["claim_report"]["blocking_count"] >= 1


async def test_a_clean_post_publishes_through_the_export_driver(
    client, auth_headers, app_modules
):
    _, dbmod = app_modules
    from app.models import SocialPost

    db = dbmod.SessionLocal()
    try:
        post = SocialPost(
            tenant_id=MASTER_KEY_TENANT, platform="export", status="queued",
            body="Wrapped up asphalt paving in Richmond, VA. Free estimates.",
            source_kind="job", source_id="1",
        )
        db.add(post)
        db.commit()
        post_id = post.id
    finally:
        db.close()

    r = await client.post(f"/api/v1/social/posts/{post_id}/publish",
                          headers=auth_headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["ok"] is True
    assert body["post"]["status"] == "published"
    # The export driver transmits nothing; it hands the copy back.
    assert "Richmond" in body["payload"]["body"]


async def test_publishing_is_gated(client):
    """No bearer token, no publishing surface."""
    r = await client.get("/api/v1/social/status")
    assert r.status_code in (401, 403)
