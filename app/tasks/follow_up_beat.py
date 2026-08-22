"""
follow_up_beat.py — lead follow-up checks, registered on the app that runs.

THIS EXISTS BECAUSE THE FOLLOW-UP PIPELINE HAD NEVER FIRED.

app/services/follow_up_tasks.py built its own Celery app — Celery("jworden_
followups") — gave it a beat_schedule running the hot/warm/cool checks every
fifteen minutes, and registered the three tasks against it.

Nothing runs that app. fly.toml starts exactly two Celery processes:

    worker = celery -A app.celery_app:celery_app worker
    beat   = celery -A app.celery_app:celery_app beat

Neither is `jworden_followups`, and `app.services.follow_up_tasks` was not in
app.celery_app's include list, so the main worker had never even registered
the task names. The schedule looked complete in the source and had produced
nothing: a HOT lead going uncontacted for over an hour was supposed to raise
a notification, and never once did.

Task registration is per-app, so importing the module from the main worker
would not have been enough on its own — the decorators bound to the other
app. These shims re-register the same three checks against the app that is
actually running, calling the existing implementations unchanged.

The `_run_*_check` functions in follow_up_tasks.py remain the single source
of the logic; this file is wiring, exactly like backup_beat.py next to it.
"""

from __future__ import annotations

import logging

from ..celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(
    name="app.tasks.follow_up_beat.check_hot_leads",
    bind=True,
    max_retries=2,
    default_retry_delay=120,
)
def check_hot_leads(self) -> dict:
    """HOT leads with no follow-up inside the SLA window."""
    from ..services.follow_up_tasks import _run_hot_check  # noqa: PLC0415

    try:
        _run_hot_check()
        return {"ok": True, "check": "hot"}
    except Exception as exc:  # noqa: BLE001
        # Logged and reported, not swallowed. A follow-up sweep that fails
        # silently is indistinguishable from a quiet hour, which is the exact
        # confusion that let this pipeline sit dead.
        logger.exception("hot lead follow-up check failed")
        return {"ok": False, "check": "hot", "error": f"{exc.__class__.__name__}: {exc}"}


@celery_app.task(
    name="app.tasks.follow_up_beat.check_warm_leads",
    bind=True,
    max_retries=2,
    default_retry_delay=120,
)
def check_warm_leads(self) -> dict:
    from ..services.follow_up_tasks import _run_warm_check  # noqa: PLC0415

    try:
        _run_warm_check()
        return {"ok": True, "check": "warm"}
    except Exception as exc:  # noqa: BLE001
        logger.exception("warm lead follow-up check failed")
        return {"ok": False, "check": "warm", "error": f"{exc.__class__.__name__}: {exc}"}


@celery_app.task(
    name="app.tasks.follow_up_beat.check_cool_leads",
    bind=True,
    max_retries=2,
    default_retry_delay=120,
)
def check_cool_leads(self) -> dict:
    from ..services.follow_up_tasks import _run_cool_check  # noqa: PLC0415

    try:
        _run_cool_check()
        return {"ok": True, "check": "cool"}
    except Exception as exc:  # noqa: BLE001
        logger.exception("cool lead follow-up check failed")
        return {"ok": False, "check": "cool", "error": f"{exc.__class__.__name__}: {exc}"}
