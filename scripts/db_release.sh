#!/usr/bin/env bash
# db_release.sh — the Fly release_command. Runs once, in a temporary machine,
# BEFORE the new version takes traffic. A non-zero exit aborts the deploy, so
# a bad schema change never reaches customers.
#
# Why this is not just `alembic upgrade head`:
#
# This app has always booted with AUTO_CREATE_TABLES defaulting to true, so
# production's schema was built by SQLAlchemy's create_all() and there is very
# likely no alembic_version row. Running `upgrade head` against that database
# would try to CREATE tables that already exist, fail, and abort every deploy.
#
# So: decide which situation we are in, once, and act correctly.
#
#   fresh database        -> upgrade from zero, normal path
#   create_all'd, no stamp-> stamp head (schema already matches the models),
#                            then future migrations run normally
#   already stamped       -> upgrade head, normal path
#
# The stamp branch is the one-time repair. After it runs once, this script
# behaves like a plain `alembic upgrade head` forever after.

set -euo pipefail

echo "[release] starting schema check"

python3 - <<'PY'
import os, sys
from sqlalchemy import create_engine, inspect, text

sys.path.insert(0, os.getcwd())
from app.database import get_database_url  # noqa: E402

url = get_database_url()
engine = create_engine(url)
insp = inspect(engine)
tables = set(insp.get_table_names())

has_stamp = "alembic_version" in tables
# any real application table means the schema was built already
app_tables = tables - {"alembic_version"}

if not app_tables:
    mode = "upgrade"          # empty database: run the full chain
elif has_stamp:
    with engine.connect() as c:
        rev = c.execute(text("SELECT version_num FROM alembic_version")).scalar()
    mode = "upgrade" if rev else "stamp"
else:
    mode = "stamp"            # create_all'd but never stamped: the repair case

print(f"[release] tables={len(tables)} alembic_version={'yes' if has_stamp else 'no'} -> {mode}")
with open("/tmp/release_mode", "w") as f:
    f.write(mode)
PY

MODE="$(cat /tmp/release_mode)"

if [ "$MODE" = "stamp" ]; then
  echo "[release] schema pre-exists without a version row — stamping head (one-time repair)"
  alembic stamp head
  echo "[release] stamped. subsequent deploys will run migrations normally."
else
  echo "[release] running migrations"
  alembic upgrade head
fi

echo "[release] schema ready"
