#!/usr/bin/env bash

set -euo pipefail

echo "[railway_start] Running Alembic migrations..."
alembic upgrade head
echo "[railway_start] Migrations complete."

PORT_BIND="${PORT:-8000}"
echo "[railway_start] Starting Gunicorn on 0.0.0.0:${PORT_BIND}..."

exec gunicorn -k uvicorn.workers.UvicornWorker -b "0.0.0.0:${PORT_BIND}" --config gunicorn.conf.py app.main:app
