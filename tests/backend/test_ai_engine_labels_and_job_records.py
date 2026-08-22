"""
When the AI does not answer, the system has to say so.

Three places reported an AI engine that had not run, or reported nothing at
all, and all three shared one root: the decision was made from
`bool(os.getenv("OPENAI_API_KEY"))` before any call happened. A revoked key
satisfies that check, so the fallback ran and the label kept naming the model.

  * /api/v1/system/apis painted a green "connected" tick per provider.
  * /api/v1/foreman/chat returned canned answers tagged `langchain_rag`. The
    stub speaks in specifics — "a weather hold today will affect the Broad
    Street job timeline" — so the tag is the only thing separating a hint from
    a false report out of the field.
  * /api/v1/reviews/respond tagged template drafts `gpt-4o`.

And POST /lms/ai-generate reported nothing at all: generation runs in a
background task whose failure handler was a bare `print`, with the course row
written only on success. A failed generation left no error, no row, and no way
for the person who asked for a course to learn that none was coming.

Every test here drives a *rejected* key rather than an absent one, because an
absent key was never the case that broke.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))


@pytest.fixture(autouse=True)
def clean_provider_cache():
    from app.services import provider_health

    provider_health.reset_cache()
    yield
    provider_health.reset_cache()


@pytest.fixture()
def dead_openai_key(monkeypatch):
    """A key that is set and does not work — the production condition."""
    monkeypatch.setenv("OPENAI_API_KEY", "sk-proj-revoked-but-present")


def _stub_probe(monkeypatch, status: str):
    """Pin the probe result without going near the network."""
    from app.services import provider_health

    async def fake_check(pid, **kwargs):
        return {
            "id": pid,
            "label": pid,
            "configured": True,
            "status": status,
            "up": status == provider_health.LIVE,
            "status_code": 401 if status == provider_health.INVALID_CREDENTIALS else 200,
            "latency_ms": 12.0,
            "detail": "stubbed",
            "checked_at": "2026-08-22T00:00:00+00:00",
            "age_seconds": 0.0,
        }

    async def fake_check_all(ids=None, **kwargs):
        return {pid: await fake_check(pid) for pid in (ids or ())}

    monkeypatch.setattr(provider_health, "check", fake_check)
    monkeypatch.setattr(provider_health, "check_all", fake_check_all)


# ── The Super Admin dashboard ─────────────────────────────────────────────────


async def test_system_apis_never_reports_connected_from_a_key_being_set(
    client, dead_openai_key, monkeypatch
):
    from app.services import provider_health

    _stub_probe(monkeypatch, provider_health.INVALID_CREDENTIALS)

    res = await client.get("/api/v1/system/apis")
    assert res.status_code == 200, res.text
    rows = {row["id"]: row for row in res.json()["apis"]}

    assert rows["openai"]["status"] == provider_health.INVALID_CREDENTIALS
    assert rows["openai"]["configured"] is True
    assert rows["openai"]["status"] != "connected"


async def test_system_apis_reports_live_only_after_a_successful_probe(
    client, dead_openai_key, monkeypatch
):
    from app.services import provider_health

    _stub_probe(monkeypatch, provider_health.LIVE)

    res = await client.get("/api/v1/system/apis")
    rows = {row["id"]: row for row in res.json()["apis"]}
    assert rows["openai"]["status"] == provider_health.LIVE
    assert rows["openai"]["checked"] == "live probe"


async def test_infrastructure_rows_are_no_longer_hardcoded_connected(client):
    """
    GoDaddy and Vercel were literals in the source — `"status": "connected"`
    with no check of any kind, rendered on the dashboard as a live status.
    """
    res = await client.get("/api/v1/system/apis")
    rows = {row["id"]: row for row in res.json()["apis"]}

    for pid in ("godaddy", "vercel"):
        assert rows[pid]["status"] in ("configured", "not_configured"), (
            f"{pid} is asserting a status nobody measured"
        )
        assert rows[pid]["checked"] == "credential presence only — reachability not probed"


async def test_dashboard_no_longer_publishes_invented_spend(client):
    """
    Every row carried a hand-authored `monthly_estimate`, and the dashboard
    summed them into an "EST. MONTHLY SPEND" figure that had never been read
    from a billing API.
    """
    body = (await client.get("/api/v1/system/apis")).json()
    assert body["spend"]["monthly_usd"] is None
    assert all(row.get("monthly_estimate_usd") is None for row in body["apis"])


# ── The 4D Foreman ────────────────────────────────────────────────────────────


async def test_foreman_reports_stub_when_the_rag_pipeline_cannot_run(
    client, auth_headers, dead_openai_key
):
    """
    With a key present but the pipeline unable to complete, the answer is the
    curated stub. It must be labelled as one.
    """
    res = await client.post(
        "/api/v1/foreman/chat",
        headers=auth_headers,
        json={"question": "What is the weather hold policy?"},
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["answer"], "the foreman still answers"
    assert body["engine"] == "stub", (
        "a canned answer was reported as langchain_rag — the label is the only "
        "thing distinguishing it from a real retrieval"
    )


# ── Review drafting ───────────────────────────────────────────────────────────


async def test_review_response_reports_template_when_openai_fails(
    client, auth_headers, dead_openai_key, monkeypatch
):
    from app.services import review_responder

    def explode(*args, **kwargs):
        raise RuntimeError("401 invalid_api_key")

    # Force the call path to fail the way a revoked key does, without a network
    # round trip.
    monkeypatch.setattr(
        review_responder, "generate_review_response_detailed",
        lambda **kw: (
            review_responder._template_response(
                kw["review_text"], kw.get("reviewer_name"), kw.get("rating", 5), kw.get("tone", "grateful")
            ),
            "template",
        ),
    )

    res = await client.post(
        "/api/v1/reviews/respond",
        headers=auth_headers,
        json={"review_text": "Great work on the lot!", "rating": 5, "tone": "grateful"},
    )
    assert res.status_code == 200, res.text
    assert res.json()["engine"] == "template"


def test_review_responder_reports_template_when_no_key_is_set(monkeypatch):
    from app.services import review_responder

    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    draft, engine = review_responder.generate_review_response_detailed(
        review_text="Fast and tidy.", rating=5
    )
    assert draft
    assert engine == "template"


# ── LMS course generation ─────────────────────────────────────────────────────


async def test_failed_course_generation_is_recorded_not_swallowed(
    client, app_modules, monkeypatch
):
    """
    The whole point of the job row. Ask for a course with no engine available;
    the request still succeeds, and the failure is retrievable afterwards
    instead of vanishing into a background task.
    """
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    res = await client.post(
        "/lms/ai-generate",
        json={"topic": "Compaction QA", "category": "Engineering", "difficulty": "advanced"},
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["status"] == "queued", "the endpoint no longer implies success"
    job_id = body["job_id"]

    status = await client.get(f"/lms/ai-generate/{job_id}")
    assert status.status_code == 200, status.text
    record = status.json()

    assert record["status"] == "failed"
    assert record["error"], "a failed generation with no stated reason is the bug"
    assert "OPENAI_API_KEY" in record["error"]
    assert record["course_id"] is None
    assert record["finished_at"] is not None


async def test_course_generation_status_404s_for_an_unknown_job(client):
    res = await client.get("/lms/ai-generate/987654")
    assert res.status_code == 404


async def test_generation_job_survives_as_a_record_of_the_attempt(
    client, app_modules, monkeypatch
):
    """
    Even the queued state is written before anything runs, so an attempt that
    dies mid-flight leaves a row rather than nothing.
    """
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    _, dbmod = app_modules
    from app.models import CourseGenerationJob

    await client.post(
        "/lms/ai-generate",
        json={"topic": "Sealcoating Basics", "category": "Field", "difficulty": "beginner"},
    )

    session = dbmod.SessionLocal()
    try:
        jobs = session.query(CourseGenerationJob).all()
        assert len(jobs) == 1
        assert jobs[0].topic == "Sealcoating Basics"
    finally:
        session.close()
