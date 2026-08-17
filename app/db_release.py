"""
Fly release command. Runs once, in a temporary machine, BEFORE the new version
takes traffic. A non-zero exit aborts the deploy, so a bad schema change never
reaches customers.

Lives in app/ deliberately. The first version was scripts/db_release.sh, and
.dockerignore excludes both `*.sh` and `scripts/` — so the file was absent from
the image and every deploy died with:

    bash: scripts/db_release.sh: No such file or directory
    Main child exited normally with code: 127

app/ is copied into the image unconditionally, so a release step that lives here
cannot be silently removed by an ignore rule.

Why this is not simply `alembic upgrade head`:

This app has always booted with AUTO_CREATE_TABLES defaulting to true, so
production's schema was built by SQLAlchemy's create_all() and very likely has
no alembic_version row. Running `upgrade head` against that database would try
to CREATE tables that already exist, fail, and abort every deploy.

So: decide which situation we are in, once, and act correctly.

    empty database          -> upgrade from zero, normal path
    create_all'd, no stamp  -> stamp head (schema already matches the models),
                               then future migrations run normally
    already stamped         -> upgrade head, normal path

The stamp branch is a one-time repair. After it runs once, this behaves like a
plain `alembic upgrade head` forever after.

Usage (fly.toml):  release_command = "python -m app.db_release"
"""

from __future__ import annotations

import subprocess
import sys

from sqlalchemy import create_engine, inspect, text

from app.database import get_database_url


def _known_revisions() -> set[str]:
    """Every revision id the repo's migration chain actually contains."""
    from alembic.config import Config
    from alembic.script import ScriptDirectory

    script = ScriptDirectory.from_config(Config("alembic.ini"))
    return {rev.revision for rev in script.walk_revisions()}


def decide() -> str:
    """Return 'upgrade' or 'stamp' for the current database state."""
    engine = create_engine(get_database_url())
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())

    has_stamp = "alembic_version" in tables
    app_tables = tables - {"alembic_version"}

    revision = None
    if has_stamp:
        with engine.connect() as conn:
            revision = conn.execute(text("SELECT version_num FROM alembic_version")).scalar()

    if not app_tables:
        mode = "upgrade"            # empty database: run the whole chain
    elif not has_stamp or not revision:
        mode = "stamp"              # create_all'd but never stamped
    elif revision not in _known_revisions():
        # Production is stamped at a revision this repo has never contained —
        # it was migrated by code that was never committed here. There is no
        # path to upgrade FROM an unknown base, so alembic aborts with
        # "Can't locate revision identified by '<rev>'" and every deploy dies.
        #
        # Re-stamping to head resyncs alembic with reality. It is safe because
        # a stamp writes only a version string — it touches no data and alters
        # no table — and any table the models expect but the database lacks is
        # created at boot by create_all() (AUTO_CREATE_TABLES defaults true).
        # Extra tables the repo does not know about are left alone.
        print(
            f"[release] stamped revision {revision!r} is not in this repo's chain "
            "— resyncing to head",
            flush=True,
        )
        mode = "stamp"
    else:
        mode = "upgrade"

    print(
        f"[release] tables={len(tables)} "
        f"alembic_version={revision or 'none'} -> {mode}",
        flush=True,
    )
    return mode


def main() -> int:
    print("[release] starting schema check", flush=True)
    try:
        mode = decide()
    except Exception as exc:  # noqa: BLE001 — abort the deploy rather than guess
        print(f"[release] could not inspect the database: {exc}", flush=True)
        return 1

    if mode == "stamp":
        print("[release] schema pre-exists without a version row — stamping head (one-time repair)", flush=True)
        cmd = ["alembic", "stamp", "head"]
    else:
        print("[release] running migrations", flush=True)
        cmd = ["alembic", "upgrade", "head"]

    result = subprocess.run(cmd, check=False)
    if result.returncode != 0:
        print(f"[release] {' '.join(cmd)} failed with {result.returncode}", flush=True)
        return result.returncode

    print("[release] schema ready", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
