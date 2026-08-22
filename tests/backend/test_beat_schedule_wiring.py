"""
Every scheduled task must live on the app that actually runs.

The lead follow-up pipeline had never fired. app/services/follow_up_tasks.py
built a second Celery app — Celery("jworden_followups") — gave it a
beat_schedule running the hot/warm/cool checks every fifteen minutes, and
registered the three tasks against it.

Nothing starts that app. fly.toml runs exactly two Celery processes, both
against `app.celery_app`. So the schedule read as complete in the source and
produced nothing: a HOT lead going uncontacted past its SLA was supposed to
raise a notification, and never once did.

Nothing failed. There was no error to find, because from Celery's point of
view nobody had ever asked for the work.

These are source-level checks on purpose. Celery is not installed in every
environment that runs this suite, and the property under test is a wiring
fact — which tasks are scheduled, and whether the worker can resolve them —
not runtime behaviour. A test that needs a broker would skip in CI, and a
skipped test is how this class of bug survives.

The general rule below is the one that matters: a beat entry naming a module
that is not in the include list is a job that will never run.
"""
from __future__ import annotations

import ast
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

CELERY_APP = REPO_ROOT / "app" / "celery_app.py"
FOLLOW_UPS = REPO_ROOT / "app" / "services" / "follow_up_tasks.py"
FLY_TOML = REPO_ROOT / "fly.toml"


def _source(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _include_list() -> set[str]:
    """Modules app.celery_app imports so the worker can register their tasks."""
    tree = ast.parse(_source(CELERY_APP))
    for node in ast.walk(tree):
        if not isinstance(node, ast.Call):
            continue
        func = node.func
        name = getattr(func, "id", None) or getattr(func, "attr", None)
        if name != "Celery":
            continue
        for kw in node.keywords:
            if kw.arg == "include" and isinstance(kw.value, ast.List):
                return {
                    el.value for el in kw.value.elts
                    if isinstance(el, ast.Constant) and isinstance(el.value, str)
                }
    raise AssertionError("could not find the Celery(include=[...]) list")


def _scheduled_tasks() -> set[str]:
    """Every dotted task path named in the beat schedule."""
    return set(re.findall(r'"task":\s*"([^"]+)"', _source(CELERY_APP)))


# ── The general rule ──────────────────────────────────────────────────────────


def test_every_scheduled_task_lives_in_an_included_module():
    """
    The check that would have caught the dead follow-up pipeline.

    A beat entry pointing at a module the worker never imports is a job that
    is scheduled and unrunnable: beat dispatches the name, no worker has it
    registered, and the only symptom is silence.
    """
    included = _include_list()
    for task in sorted(_scheduled_tasks()):
        module = task.rsplit(".", 1)[0]
        assert module in included, (
            f"beat schedules {task!r} but {module!r} is not in the Celery "
            f"include list — no worker will ever have that task registered"
        )


def test_beat_runs_the_app_the_schedule_belongs_to():
    """
    fly.toml is authoritative for process commands. If beat is pointed at a
    different app than the one holding the schedule, nothing periodic runs.
    """
    fly = _source(FLY_TOML)
    beat = re.search(r'^\s*beat\s*=\s*"([^"]+)"', fly, re.M)
    assert beat, "fly.toml defines no beat process"
    assert "app.celery_app:celery_app" in beat.group(1), (
        f"beat runs {beat.group(1)!r}, which is not the app that owns the "
        "beat_schedule"
    )


# ── The specific regression ───────────────────────────────────────────────────


def test_follow_up_checks_are_scheduled():
    scheduled = _scheduled_tasks()
    for check in ("check_hot_leads", "check_warm_leads", "check_cool_leads"):
        assert any(t.endswith(check) for t in scheduled), (
            f"{check} is not in the beat schedule — lead follow-up does not run"
        )


def test_follow_up_tasks_does_not_build_a_second_celery_app():
    """
    A second Celery instance here is what detached these tasks from the
    running worker. Task registration is per-app, so reintroducing one would
    silently strand them again — and it would look correct in the source.
    """
    # AST, not a string search: the module carries a comment explaining what
    # was removed and why, and a text match would trip on the explanation
    # rather than on code. The property is "does this module construct a
    # Celery app or declare a schedule", which only the tree can answer.
    tree = ast.parse(_source(FOLLOW_UPS))

    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            name = getattr(node.func, "id", None) or getattr(node.func, "attr", None)
            assert name != "Celery", (
                "follow_up_tasks.py constructs its own Celery app again; task "
                "registration is per-app, so its tasks would not be registered "
                "on the worker that actually runs"
            )
            for kw in node.keywords:
                assert kw.arg != "beat_schedule", (
                    "follow_up_tasks.py declares a beat_schedule; the only "
                    "schedule beat reads is the one in app/celery_app.py"
                )


def test_the_follow_up_implementations_are_still_reachable():
    """
    The wiring moved; the logic did not. These three remain the single
    implementation, called by the task shims in app/tasks/follow_up_beat.py.
    """
    src = _source(FOLLOW_UPS)
    for fn in ("_run_hot_check", "_run_warm_check", "_run_cool_check"):
        assert f"def {fn}(" in src, f"{fn} disappeared from follow_up_tasks.py"

    shims = _source(REPO_ROOT / "app" / "tasks" / "follow_up_beat.py")
    for fn in ("_run_hot_check", "_run_warm_check", "_run_cool_check"):
        assert fn in shims, f"the task shim no longer calls {fn}"


def test_backup_is_scheduled_and_its_freshness_is_checked():
    """
    The backup task and the question "did a backup actually happen" are two
    different jobs. A schedule that stops firing reports no failures, because
    it reports nothing.
    """
    scheduled = _scheduled_tasks()
    assert any("run_nightly_backup" in t for t in scheduled)
    assert any("check_backup_freshness" in t for t in scheduled)
