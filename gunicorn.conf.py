"""Gunicorn production configuration for the JWordenAI FastAPI backend.

Usage:
    gunicorn app.main:app --config gunicorn.conf.py

Uvicorn worker class bridges Gunicorn's process management with ASGI.
"""

import multiprocessing  # noqa: F401  — kept for operators who want to switch back to a CPU-based formula
import os

# ── Server socket ─────────────────────────────────────────────────────────────
# Honour the platform-injected ``PORT`` env var (Railway, Render, Heroku, Fly,
# Cloud Run all set this).  Falls back to 8000 for local development and the
# Dockerfile's documented EXPOSE.  Without this, Railway's health check hits
# the wrong port and marks the deploy as failed even though the container is
# running.
_port = os.getenv("PORT", "8000").strip() or "8000"
bind = f"0.0.0.0:{_port}"

# ── Workers ───────────────────────────────────────────────────────────────────
# IMPORTANT: keep the *default* worker count low.  Each worker forks the full
# FastAPI app (sentry, sqlalchemy, openai, langchain, socket.io, etc.) and
# easily occupies 150-300 MB resident memory.  On a typical Railway container
# (512 MB - 1 GB), the historical formula `(2 × cpu_count) + 1` produced 17+
# workers on shared 8-vCPU hosts → multi-GB RSS → instant OOM kill → crash
# loop.  We default to 2 workers (safe everywhere) and let operators raise it
# via WEB_CONCURRENCY when they have explicit memory headroom.
#
# Each worker also opens its own SQLAlchemy connection pool (DB_POOL_SIZE),
# so (workers × pool_size) must stay below the managed Postgres connection
# limit (Railway: ~100, Render Hobby: ~97).
_DEFAULT_WORKERS = 2
try:
    workers = int(os.getenv("WEB_CONCURRENCY", "").strip() or _DEFAULT_WORKERS)
except ValueError:
    workers = _DEFAULT_WORKERS
if workers < 1:
    workers = 1
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
threads = 1

# ── Timeouts ──────────────────────────────────────────────────────────────────
timeout = 120          # seconds before a worker is killed and restarted
graceful_timeout = 30  # seconds to finish in-flight requests on shutdown
keepalive = 5          # seconds to wait for the next request on a keep-alive connection

# ── Restart workers periodically to prevent memory leaks ─────────────────────
max_requests = 1000
max_requests_jitter = 100

# ── Logging ───────────────────────────────────────────────────────────────────
accesslog = "-"   # stdout
errorlog = "-"    # stderr
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# ── Performance ───────────────────────────────────────────────────────────────
preload_app = False  # load app in each worker after forking so slow init doesn't block the master
