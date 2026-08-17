"""
Guards for the background-work topology (fly.toml process groups).

Seven periodic jobs and thirteen background tasks had never executed, because
every Fly machine ran the Dockerfile CMD (the web server) and no process
consumed the Celery queue. The most expensive one is silent:

    scrape-vdot-bids-daily — the VDOT bid board scraper for a Virginia paving
    contractor. It does not error when absent; the bids simply never arrive.

Two failure modes are worth pinning:

  1. No worker/beat process -> nothing runs, and health reports "skipped",
     which reads like "fine" rather than "absent".
  2. More than one beat -> every cron entry double-fires. For the VDOT
     scraper that means duplicate bid rows; for email tasks, duplicate sends
     to real customers. Worse than not running at all.
"""

import tomllib
from pathlib import Path

import pytest

FLY_TOML = Path(__file__).resolve().parent.parent / "fly.toml"


@pytest.fixture(scope="module")
def cfg():
    assert FLY_TOML.is_file(), "fly.toml is required for worker/beat process groups"
    return tomllib.loads(FLY_TOML.read_text())


def test_all_three_process_groups_are_defined(cfg):
    assert set(cfg["processes"]) == {"app", "worker", "beat"}


def test_worker_consumes_the_queue(cfg):
    cmd = cfg["processes"]["worker"]
    assert "celery" in cmd and "worker" in cmd
    assert "app.celery_app" in cmd, "worker must point at the real Celery app"


def test_beat_emits_the_schedule(cfg):
    cmd = cfg["processes"]["beat"]
    assert "celery" in cmd and "beat" in cmd
    assert "app.celery_app" in cmd


def test_exactly_one_beat_instance(cfg):
    """Two beat schedulers double-fire every cron entry — duplicate bids and
    duplicate customer emails. This is the guard against that.

    This repo's fly.toml uses one shared [[vm]] block for all groups rather
    than the per-process blocks this test originally asserted (it was ported
    from the luxury-paving fork, where each group had its own [[vm]] with a
    count). Here the beat machine count lives in Fly's machine state, not the
    config file — so the config-level promise this test CAN hold is that
    "beat" is declared exactly once in [processes], and that no [[vm]] block
    tries to scale it. If beat ever gains its own [[vm]], the count pin below
    starts applying again automatically.
    """
    assert list(cfg["processes"]).count("beat") == 1
    for vm in cfg.get("vm", []):
        if "beat" in vm.get("processes", []):
            assert vm.get("count", 1) == 1, "beat must be pinned to count = 1"


def test_only_the_web_process_serves_http(cfg):
    """Routing HTTP to a worker would send live traffic to a machine with no
    server listening on the port."""
    assert cfg["http_service"]["processes"] == ["app"]


def test_web_process_binds_a_literal_port(cfg):
    """The app command must bind a literal port — never a shell substitution.

    This test is the OPPOSITE of the one it was ported from. The
    luxury-paving fork runs its process command through a shell, so there
    `${PORT:-8000}` expands and the fork's test asserts it is present. In
    this repo fly.toml [processes] commands are exec'd directly — no shell —
    so that exact string reached gunicorn literally:

        Error: '${PORT' is not a valid port number.

    Every app machine crash-looped to Fly's restart ceiling and the API went
    down (fixed in #70). Asserting the fork's version here would REQUIRE the
    outage bug. Instead: no shell syntax anywhere in any process command, and
    the app binds the same literal port http_service routes to.
    """
    import re

    for name, cmd in cfg["processes"].items():
        assert not re.search(r"\$\{|\$[A-Za-z_]|`|\|\||&&", cmd), (
            f"[processes].{name} contains shell syntax; these commands are "
            f"exec'd directly and nothing will expand it: {cmd}"
        )
    internal = str(cfg["http_service"]["internal_port"])
    assert f":{internal}" in cfg["processes"]["app"], (
        "app must bind the same literal port http_service.internal_port routes to"
    )


def test_every_scheduled_task_resolves_to_real_code(cfg):
    """A beat entry naming a task that no longer exists fails at runtime, on a
    schedule, where nobody is watching."""
    import importlib

    from app.celery_app import celery_app

    schedule = celery_app.conf.beat_schedule
    assert schedule, "beat schedule is empty — nothing would ever run"

    for name, entry in schedule.items():
        dotted = entry["task"]
        module_path, func = dotted.rsplit(".", 1)
        module = importlib.import_module(module_path)
        assert hasattr(module, func), f"beat job {name!r} -> missing {dotted}"


def test_the_revenue_bearing_scraper_is_scheduled():
    """Explicit guard: this is the job whose absence costs real money."""
    from app.celery_app import celery_app

    tasks = {e["task"] for e in celery_app.conf.beat_schedule.values()}
    assert any("vdot" in t.lower() for t in tasks), "VDOT bid scraper is not scheduled"
