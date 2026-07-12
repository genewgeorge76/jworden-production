"""Shared test fixtures — in-memory SQLite DB + TestClient with master-key header."""
from __future__ import annotations

import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# ── Set env vars BEFORE any app import so pydantic-settings picks them up ──────
os.environ.setdefault('DATABASE_URL', 'sqlite://')       # in-memory SQLite
os.environ.setdefault('JWORDEN_MASTER_KEY', 'test-master-key')
os.environ.setdefault('JWT_SECRET_KEY', 'test-jwt-secret')
os.environ.setdefault('ADMIN_PIN', '1234')
os.environ.setdefault('ENVIRONMENT', 'test')

from app.database import Base, get_db       # noqa: E402 — must follow env-var setup
from app.main import app                     # noqa: E402

# ── Test database ─────────────────────────────────────────────────────────────

_engine = create_engine(
    'sqlite://',
    connect_args={'check_same_thread': False},
    poolclass=StaticPool,
)
_TestSession = sessionmaker(autocommit=False, autoflush=False, bind=_engine)

# ── Patch scan_tasks to use the test session so _run_pipeline hits the same DB ─
import app.tasks.scan_tasks as _scan_tasks          # noqa: E402
_scan_tasks.SessionLocal = _TestSession

# ── Disable rate limiting so tests don't bleed rate-limit state into each other ─
from app.core.limiter import limiter as _limiter    # noqa: E402
_limiter.enabled = False

MASTER_KEY = 'test-master-key'


@pytest.fixture(autouse=True)
def _reset_db():
    """Create all tables before each test, drop them after."""
    Base.metadata.create_all(bind=_engine)
    yield
    Base.metadata.drop_all(bind=_engine)


def _override_get_db():
    db = _TestSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture
def client() -> TestClient:
    return TestClient(app, raise_server_exceptions=True)


@pytest.fixture
def authed(client: TestClient) -> TestClient:
    """TestClient that automatically sends the master-key header."""
    client.headers.update({'X-Master-Key': MASTER_KEY})
    return client
