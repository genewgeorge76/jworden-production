"""
social_scheduler.py — Dispatch posts whose time has come.

Three things make this harder than "select where due and send", and each is a
way to embarrass the company in public:

Double sending. Two beat processes, or a retry landing on top of a slow run,
and the same post goes out twice. Claiming is therefore a conditional update —
`SET status='publishing' WHERE id=? AND status='scheduled'` — and only the
caller whose UPDATE touched exactly one row proceeds. The database decides,
not the application.

Unknown outcomes. A worker killed between "POST accepted" and "row updated"
leaves a post in `publishing` forever. Sweeping those back into `scheduled`
would republish anything that actually succeeded, so they are moved to
`failed` with the outcome stated as unknown and left for a person to check on
the platform. A possibly-published post is never retried automatically.

Stale claims. Attestations expire. A post scheduled on Monday quoting an
insurance certificate that lapses on Wednesday must not go out on Friday, so
the claim guardrail runs again at dispatch — the queued verdict is a record of
what was true then, never a licence for now.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.models import CompanyClaim, SocialAccount, SocialPost, SchedulerHeartbeat
from app.services import social_claims, social_publish

logger = logging.getLogger(__name__)

DISPATCH_TASK = "app.tasks.social_dispatch.dispatch_due_social_posts"

# Beat runs this every 5 minutes; anything past three intervals with no stamp
# is stalled rather than idle.
DISPATCH_INTERVAL_SECONDS = 300
STALE_AFTER_SECONDS = DISPATCH_INTERVAL_SECONDS * 3

# How long a claim may sit in `publishing` before it is treated as abandoned.
# Generous, because the alternative to waiting is guessing about a post that
# may already be public.
CLAIM_TIMEOUT = timedelta(minutes=15)

MAX_PER_RUN = 25


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _aware(value: Optional[datetime]) -> Optional[datetime]:
    """SQLite hands back naive datetimes; compare in UTC regardless."""
    if value is None:
        return None
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


# ── Heartbeat ────────────────────────────────────────────────────────────────

def record_heartbeat(db: Session, task_name: str, *, status: str = "ok",
                     detail: str = "") -> SchedulerHeartbeat:
    row = db.query(SchedulerHeartbeat).filter(
        SchedulerHeartbeat.task_name == task_name
    ).first()
    if row is None:
        row = SchedulerHeartbeat(task_name=task_name, runs=0)
        db.add(row)
    row.last_run_at = utcnow()
    row.last_status = status
    row.detail = detail[:2000] or None
    row.runs = (row.runs or 0) + 1
    db.commit()
    return row


def heartbeat_status(db: Session, task_name: str = DISPATCH_TASK,
                     *, stale_after_seconds: int = STALE_AFTER_SECONDS,
                     now: Optional[datetime] = None) -> dict[str, Any]:
    """
    Report whether the dispatcher is running — never merely whether it errored.

    "never_run" and "stalled" both mean scheduled posts are not going out.
    They read as quiet success from every other angle, which is exactly why
    they are named here.
    """
    now = now or utcnow()
    row = db.query(SchedulerHeartbeat).filter(
        SchedulerHeartbeat.task_name == task_name
    ).first()

    if row is None:
        return {
            "state": "never_run",
            "last_run_at": None,
            "message": "The dispatcher has never run. Scheduled posts will not "
                       "go out. Check that the Celery beat process is alive.",
        }

    last = _aware(row.last_run_at)
    age = (now - last).total_seconds()
    stalled = age > stale_after_seconds
    return {
        "state": "stalled" if stalled else "ok",
        "last_run_at": last.isoformat(),
        "seconds_since_last_run": int(age),
        "last_status": row.last_status,
        "runs": row.runs,
        "message": (
            f"No dispatch in {int(age)}s (expected every "
            f"{DISPATCH_INTERVAL_SECONDS}s). Scheduled posts are not going out."
            if stalled else ""
        ),
    }


# ── Claiming ─────────────────────────────────────────────────────────────────

def due_post_ids(db: Session, *, now: Optional[datetime] = None,
                 limit: int = MAX_PER_RUN) -> list[int]:
    now = now or utcnow()
    rows = (
        db.query(SocialPost.id)
        .filter(SocialPost.status == "scheduled")
        .filter(SocialPost.scheduled_for.isnot(None))
        .filter(SocialPost.scheduled_for <= now)
        .order_by(SocialPost.scheduled_for.asc())
        .limit(limit)
        .all()
    )
    return [r[0] for r in rows]


def claim(db: Session, post_id: int) -> Optional[SocialPost]:
    """
    Take exclusive ownership of a post, or return None.

    The WHERE clause carries the precondition, so two racing dispatchers
    cannot both win: whichever UPDATE lands first changes the status, and the
    second matches zero rows.
    """
    updated = (
        db.query(SocialPost)
        .filter(SocialPost.id == post_id, SocialPost.status == "scheduled")
        .update({"status": "publishing"}, synchronize_session=False)
    )
    db.commit()
    if updated != 1:
        return None
    return db.query(SocialPost).filter(SocialPost.id == post_id).first()


def reclaim_abandoned(db: Session, *, now: Optional[datetime] = None,
                      timeout: timedelta = CLAIM_TIMEOUT) -> int:
    """
    Resolve posts stuck in `publishing` — as failures, never as retries.

    The worker died at an unknown point. It may have sent. Returning these to
    the queue would republish anything that succeeded, so they are surfaced for
    a person to check rather than guessed at.
    """
    now = now or utcnow()
    cutoff = now - timeout
    stuck = (
        db.query(SocialPost)
        .filter(SocialPost.status == "publishing")
        .filter(SocialPost.updated_at.isnot(None))
        .all()
    )
    resolved = 0
    for post in stuck:
        if (_aware(post.updated_at) or now) > cutoff:
            continue
        post.status = "failed"
        post.last_error = (
            "Dispatch was interrupted and the outcome is unknown — this post "
            "may or may not have been published. Check the platform before "
            "requeueing; it is not retried automatically, because retrying a "
            "post that did go out publishes it twice."
        )
        resolved += 1
    if resolved:
        db.commit()
    return resolved


# ── Dispatch ─────────────────────────────────────────────────────────────────

def _recheck_claims(db: Session, post: SocialPost) -> social_claims.ClaimReport:
    tenant = post.tenant_id
    query = db.query(CompanyClaim)
    if tenant:
        query = query.filter(CompanyClaim.tenant_id == tenant)
    else:
        query = query.filter(CompanyClaim.tenant_id.is_(None))
    return social_claims.resolve(social_claims.scan(post.body), query.all())


async def dispatch_due(db: Session, *, now: Optional[datetime] = None,
                       limit: int = MAX_PER_RUN) -> dict[str, Any]:
    now = now or utcnow()
    reclaimed = reclaim_abandoned(db, now=now)

    published, blocked, failed, skipped = 0, 0, 0, 0
    details: list[dict[str, Any]] = []

    for post_id in due_post_ids(db, now=now, limit=limit):
        post = claim(db, post_id)
        if post is None:
            skipped += 1
            continue

        report = _recheck_claims(db, post)
        post.claim_report_json = report.as_dict()
        if not report.publishable:
            post.status = "draft"
            post.claims_cleared_at = None
            post.last_error = (
                "Held at dispatch: "
                f"{len(report.blocking)} claim(s) no longer have a live "
                "attestation. Scheduling does not grant permission the copy "
                "did not have."
            )
            db.commit()
            blocked += 1
            details.append({"id": post.id, "outcome": "blocked",
                            "claims": [f.text for f in report.blocking]})
            continue

        post.claims_cleared_at = now
        account = None
        if post.account_id:
            account = db.query(SocialAccount).filter(
                SocialAccount.id == post.account_id
            ).first()

        try:
            result = await social_publish.publish(post, account)
        except Exception as exc:  # noqa: BLE001
            result = social_publish.PublishResult(ok=False, reason=str(exc)[:400])

        post.attempts = (post.attempts or 0) + 1
        if result.ok:
            post.status = "published"
            post.published_at = now
            post.external_post_id = result.external_post_id
            post.external_url = result.external_url
            post.last_error = None
            published += 1
            details.append({"id": post.id, "outcome": "published",
                            "platform": post.platform})
        else:
            post.status = "failed"
            post.last_error = result.reason[:1000]
            failed += 1
            details.append({"id": post.id, "outcome": "failed",
                            "reason": result.reason[:200]})
        db.commit()

    summary = {
        "published": published, "blocked": blocked, "failed": failed,
        "skipped_already_claimed": skipped, "reclaimed_abandoned": reclaimed,
        "details": details,
    }
    record_heartbeat(
        db, DISPATCH_TASK,
        status="ok" if not failed else "partial",
        detail=f"published={published} blocked={blocked} failed={failed} "
               f"reclaimed={reclaimed}",
    )
    return summary
