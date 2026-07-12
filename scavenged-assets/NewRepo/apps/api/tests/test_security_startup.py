"""M1 — production startup must refuse default secrets (GO_LIVE_CHECKLIST §4)."""
import asyncio

import pytest

from app import main


def _enter_lifespan():
    asyncio.run(main.lifespan(main.app).__aenter__())


def test_production_refuses_default_master_key(monkeypatch):
    monkeypatch.setattr(main.settings, 'environment', 'production')
    monkeypatch.setattr(main.settings, 'jworden_master_key', 'change-me')
    with pytest.raises(RuntimeError, match='JWORDEN_MASTER_KEY'):
        _enter_lifespan()


def test_production_refuses_default_jwt_secret(monkeypatch):
    monkeypatch.setattr(main.settings, 'environment', 'production')
    monkeypatch.setattr(main.settings, 'jworden_master_key', 'a' * 64)
    monkeypatch.setattr(main.settings, 'jwt_secret_key', 'change-me-jwt')
    with pytest.raises(RuntimeError, match='JWT_SECRET_KEY'):
        _enter_lifespan()


def test_production_starts_with_real_secrets(monkeypatch):
    monkeypatch.setattr(main.settings, 'environment', 'production')
    monkeypatch.setattr(main.settings, 'jworden_master_key', 'a' * 64)
    monkeypatch.setattr(main.settings, 'jwt_secret_key', 'b' * 64)
    _enter_lifespan()  # must not raise


def test_non_production_allows_defaults(monkeypatch):
    monkeypatch.setattr(main.settings, 'environment', 'development')
    monkeypatch.setattr(main.settings, 'jworden_master_key', 'change-me')
    monkeypatch.setattr(main.settings, 'jwt_secret_key', 'change-me-jwt')
    _enter_lifespan()  # must not raise
