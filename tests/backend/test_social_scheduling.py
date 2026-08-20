"""
Tests for scheduled dispatch.

Three properties, each guarding a way to embarrass the company in public:

  1. A post cannot be sent twice. Claiming is a conditional UPDATE, so two
     racing dispatchers cannot both win.
  2. A post whose attestation lapsed between scheduling and its send time
     does not go out. Scheduling is not permission.
  3. A dispatcher that is not running is reported as stalled, not idle. Those
     look identical from every other angle and only one of them is fine.
"""
from __future__ import annotations

import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from app.services import social_scheduler as sched  # noqa: E402

MASTER_KEY_TENANT = "JWORDEN_HQ"


def _mk(db, models, **kw):
    base = dict(
        tenant_id=MASTER_KEY_TENANT, platform="export", status="scheduled",
        body="Wrapped up asphalt paving in Richmond, VA. Free estimates.",
        source_kind="job", source_id="1",
        scheduled_for=datetime.now(timezone.utc) - timedelta(minutes=1),
    )
    base.update(kw)
    row = models.SocialPost(**base)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


# ── Double-send guard ────────────────────────────────────────────────────────


def test_a_post_can_only_be_claimed_once(app_modules):
    """The property that stops the same post going out twice."""
    mainmod, dbmod = app_modules
    import app.models as models

    db = dbmod.SessionLocal()
    try:
        post = _mk(db, models)
        first = sched.claim(db, post.id)
        second = sched.claim(db, post.id)
        assert first is not None, "the first claim must succeed"
        assert second is None, "a second claim must find nothing to take"
        assert first.status == "publishing"
    finally:
        db.close()


def test_only_due_posts_are_picked_up(app_modules):
    mainmod, dbmod = app_modules
    import app.models as models

    db = dbmod.SessionLocal()
    try:
        due = _mk(db, models)
        future = _mk(db, models,
                     scheduled_for=datetime.now(timezone.utc) + timedelta(hours=3))
        draft = _mk(db, models, status="draft")
        ids = sched.due_post_ids(db)
        assert due.id in ids
        assert future.id not in ids
        assert draft.id not in ids
    finally:
        db.close()


def test_a_post_with_no_scheduled_time_is_never_due(app_modules):
    mainmod, dbmod = app_modules
    import app.models as models

    db = dbmod.SessionLocal()
    try:
        orphan = _mk(db, models, scheduled_for=None)
        assert orphan.id not in sched.due_post_ids(db)
    finally:
        db.close()


# ── Interrupted dispatch ─────────────────────────────────────────────────────


def test_an_abandoned_claim_becomes_failed_not_requeued(app_modules):
    """
    The worker died at an unknown point; the post may already be public.
    Requeueing would publish it twice, so it is surfaced for a human instead.
    """
    mainmod, dbmod = app_modules
    import app.models as models

    db = dbmod.SessionLocal()
    try:
        post = _mk(db, models, status="publishing")
        post.updated_at = datetime.now(timezone.utc) - timedelta(hours=2)
        db.commit()

        assert sched.reclaim_abandoned(db) == 1
        db.refresh(post)
        assert post.status == "failed"
        assert post.status != "scheduled", "must not be retried automatically"
        assert "unknown" in (post.last_error or "").lower()
    finally:
        db.close()


def test_a_recent_claim_is_left_alone(app_modules):
    mainmod, dbmod = app_modules
    import app.models as models

    db = dbmod.SessionLocal()
    try:
        post = _mk(db, models, status="publishing")
        assert sched.reclaim_abandoned(db) == 0
        db.refresh(post)
        assert post.status == "publishing"
    finally:
        db.close()


# ── Claims are rechecked at send time ────────────────────────────────────────


async def test_a_lapsed_attestation_holds_the_post_at_dispatch(app_modules):
    """
    Scheduled Monday quoting a certificate that expired Wednesday. Friday's
    dispatch must not send it.
    """
    mainmod, dbmod = app_modules
    import app.models as models

    db = dbmod.SessionLocal()
    try:
        db.add(models.CompanyClaim(
            tenant_id=MASTER_KEY_TENANT, key="insured",
            claim_text="General liability in force.",
            source_note="COI on file.",
            expires_on=date.today() - timedelta(days=1),
        ))
        db.commit()

        post = _mk(db, models, body="Fully insured crews. Free estimates.")
        summary = await sched.dispatch_due(db)

        assert summary["published"] == 0
        assert summary["blocked"] == 1
        db.refresh(post)
        assert post.status == "draft"
        assert "no longer have a live attestation" in (post.last_error or "")
    finally:
        db.close()


async def test_a_live_attestation_lets_the_post_through(app_modules):
    mainmod, dbmod = app_modules
    import app.models as models

    db = dbmod.SessionLocal()
    try:
        db.add(models.CompanyClaim(
            tenant_id=MASTER_KEY_TENANT, key="insured",
            claim_text="General liability in force.",
            source_note="COI on file.",
            expires_on=date.today() + timedelta(days=200),
        ))
        db.commit()

        post = _mk(db, models, body="Fully insured crews. Free estimates.")
        summary = await sched.dispatch_due(db)

        assert summary["published"] == 1, summary
        db.refresh(post)
        assert post.status == "published"
        assert post.published_at is not None
    finally:
        db.close()


async def test_dispatch_runs_the_export_driver_and_marks_published(app_modules):
    mainmod, dbmod = app_modules
    import app.models as models

    db = dbmod.SessionLocal()
    try:
        post = _mk(db, models)
        summary = await sched.dispatch_due(db)
        assert summary["published"] == 1
        db.refresh(post)
        assert post.status == "published"
        assert post.attempts == 1
    finally:
        db.close()


async def test_an_unconfigured_platform_fails_the_post_rather_than_losing_it(
    app_modules
):
    mainmod, dbmod = app_modules
    import app.models as models

    db = dbmod.SessionLocal()
    try:
        post = _mk(db, models, platform="facebook")
        summary = await sched.dispatch_due(db)
        assert summary["failed"] == 1
        db.refresh(post)
        assert post.status == "failed"
        assert "META_PAGE_ACCESS_TOKEN" in (post.last_error or "")
    finally:
        db.close()


# ── Heartbeat ────────────────────────────────────────────────────────────────


def test_a_dispatcher_that_never_ran_is_reported_as_such(app_modules):
    mainmod, dbmod = app_modules
    db = dbmod.SessionLocal()
    try:
        state = sched.heartbeat_status(db)
        assert state["state"] == "never_run"
        assert "will not go out" in state["message"]
    finally:
        db.close()


async def test_dispatch_stamps_a_heartbeat_even_with_an_empty_queue(app_modules):
    """
    The reason the heartbeat exists. An idle dispatcher and a dead one produce
    identical output otherwise.
    """
    mainmod, dbmod = app_modules
    db = dbmod.SessionLocal()
    try:
        summary = await sched.dispatch_due(db)
        assert summary["published"] == 0
        assert sched.heartbeat_status(db)["state"] == "ok"
    finally:
        db.close()


def test_an_old_heartbeat_reads_as_stalled_not_ok(app_modules):
    mainmod, dbmod = app_modules
    import app.models as models

    db = dbmod.SessionLocal()
    try:
        sched.record_heartbeat(db, sched.DISPATCH_TASK)
        row = db.query(models.SchedulerHeartbeat).filter(
            models.SchedulerHeartbeat.task_name == sched.DISPATCH_TASK
        ).first()
        row.last_run_at = datetime.now(timezone.utc) - timedelta(hours=4)
        db.commit()

        state = sched.heartbeat_status(db)
        assert state["state"] == "stalled"
        assert "not going out" in state["message"]
    finally:
        db.close()


# ── Through the API ──────────────────────────────────────────────────────────


async def test_scheduling_rejects_a_naive_timestamp(client, auth_headers, app_modules):
    _, dbmod = app_modules
    import app.models as models

    db = dbmod.SessionLocal()
    try:
        post = _mk(db, models, status="draft", scheduled_for=None)
        post_id = post.id
    finally:
        db.close()

    r = await client.post(f"/api/v1/social/posts/{post_id}/schedule",
                          headers=auth_headers,
                          json={"scheduled_for": "2027-01-01T09:00:00"})
    assert r.status_code == 422
    assert "timezone" in r.json()["detail"]


async def test_scheduling_rejects_a_past_time(client, auth_headers, app_modules):
    _, dbmod = app_modules
    import app.models as models

    db = dbmod.SessionLocal()
    try:
        post = _mk(db, models, status="draft", scheduled_for=None)
        post_id = post.id
    finally:
        db.close()

    r = await client.post(f"/api/v1/social/posts/{post_id}/schedule",
                          headers=auth_headers,
                          json={"scheduled_for": "2020-01-01T09:00:00Z"})
    assert r.status_code == 422


async def test_scheduling_does_not_defer_the_claim_check(
    client, auth_headers, app_modules
):
    _, dbmod = app_modules
    import app.models as models

    db = dbmod.SessionLocal()
    try:
        post = _mk(db, models, status="draft", scheduled_for=None,
                   body="We are the #1 rated paving contractor in Virginia.")
        post_id = post.id
    finally:
        db.close()

    r = await client.post(f"/api/v1/social/posts/{post_id}/schedule",
                          headers=auth_headers,
                          json={"scheduled_for": "2027-01-01T09:00:00Z"})
    assert r.status_code == 409
    assert r.json()["detail"]["error"] == "unsubstantiated claims"


async def test_scheduling_a_clean_post_succeeds(client, auth_headers, app_modules):
    _, dbmod = app_modules
    import app.models as models

    db = dbmod.SessionLocal()
    try:
        post = _mk(db, models, status="draft", scheduled_for=None)
        post_id = post.id
    finally:
        db.close()

    r = await client.post(f"/api/v1/social/posts/{post_id}/schedule",
                          headers=auth_headers,
                          json={"scheduled_for": "2027-01-01T09:00:00Z"})
    assert r.status_code == 200, r.text
    assert r.json()["post"]["status"] == "scheduled"


async def test_status_flags_scheduled_posts_when_the_dispatcher_is_not_running(
    client, auth_headers, app_modules
):
    """
    The failure this whole heartbeat exists for: a queue that looks healthy
    while nothing is being sent.
    """
    _, dbmod = app_modules
    import app.models as models

    db = dbmod.SessionLocal()
    try:
        _mk(db, models, scheduled_for=datetime.now(timezone.utc) + timedelta(days=1))
    finally:
        db.close()

    r = await client.get("/api/v1/social/status", headers=auth_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["scheduler"]["state"] == "never_run"
    assert any("will not go out" in b for b in body["blockers"])


async def test_manual_run_is_available_when_beat_is_down(
    client, auth_headers, app_modules
):
    _, dbmod = app_modules
    import app.models as models

    db = dbmod.SessionLocal()
    try:
        post = _mk(db, models)
        post_id = post.id
    finally:
        db.close()

    r = await client.post("/api/v1/social/scheduler/run", headers=auth_headers)
    assert r.status_code == 200, r.text
    assert r.json()["published"] == 1

    r = await client.get("/api/v1/social/scheduler", headers=auth_headers)
    assert r.json()["dispatcher"]["state"] == "ok"
    assert r.json()["due_now"] == 0


async def test_scheduler_endpoints_are_gated(client):
    r = await client.get("/api/v1/social/scheduler")
    assert r.status_code in (401, 403)
