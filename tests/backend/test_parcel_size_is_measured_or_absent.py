"""
An unmeasured parcel must not arrive as a number that gets priced.

_estimate_parcel_sqft() returned sqft_estimated=8500 for every address it could
not look up, labelled source="default_estimate", confidence="low". The label was
honest and made no difference, because Visualizer.jsx does

    sqft: result.sqft_estimated || prev.sqft

so 8500 landed in the sqft field and was priced — the same figure for a
townhouse driveway and a distribution yard.

Returning None is what makes that `||` correct instead of dangerous: it falls
through to whatever the operator actually typed. The fix is in the backend
precisely because the frontend expression was already right for a null.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))


@pytest.fixture(autouse=True)
def no_regrid(monkeypatch):
    monkeypatch.delenv("REGRID_API_KEY", raising=False)


def test_no_key_yields_no_number(monkeypatch):
    from app.routers.visualizer import _estimate_parcel_sqft

    result = _estimate_parcel_sqft("1 Any Street, Richmond VA")
    assert result["sqft_estimated"] is None
    assert result["source"] == "unavailable"
    assert result["confidence"] == "none"


def test_the_old_default_is_gone(monkeypatch):
    from app.routers.visualizer import _estimate_parcel_sqft

    assert 8500 not in _estimate_parcel_sqft("anywhere").values()


def test_the_reason_names_the_missing_key(monkeypatch):
    from app.routers.visualizer import _estimate_parcel_sqft

    message = _estimate_parcel_sqft("anywhere")["message"]
    assert "REGRID_API_KEY" in message
    assert "manually" in message


def test_a_failed_lookup_with_a_key_set_still_returns_no_number(monkeypatch):
    """
    A configured key that errors must not fall back to a figure either — that
    was the second path into the same 8500.
    """
    from app.routers import visualizer

    monkeypatch.setattr(visualizer._cfg, "get", lambda k, d="": "a-real-looking-key" if k == "REGRID_API_KEY" else d)

    def boom(*args, **kwargs):
        raise TimeoutError("regrid unreachable")

    import urllib.request
    monkeypatch.setattr(urllib.request, "urlopen", boom)

    result = visualizer._estimate_parcel_sqft("anywhere")
    assert result["sqft_estimated"] is None
    assert "REGRID_API_KEY" not in result["message"], (
        "the key IS set here — blaming it would send the reader the wrong way"
    )


def test_a_real_regrid_answer_is_passed_through(monkeypatch):
    """The measured path must still work, and must be labelled as measured."""
    import json
    from contextlib import contextmanager

    from app.routers import visualizer

    monkeypatch.setattr(visualizer._cfg, "get", lambda k, d="": "key" if k == "REGRID_API_KEY" else d)

    payload = {
        "results": {"parcels": {"features": [
            {"properties": {"fields": {"ll_gisacre": "0.25", "parcelnumb": "P-1"}}}
        ]}}
    }

    class _R:
        def read(self):
            return json.dumps(payload).encode()

    @contextmanager
    def fake_urlopen(*args, **kwargs):
        yield _R()

    import urllib.request
    monkeypatch.setattr(urllib.request, "urlopen", fake_urlopen)

    result = visualizer._estimate_parcel_sqft("1 Any Street")
    assert result["source"] == "regrid"
    assert result["confidence"] == "high"
    assert result["sqft_estimated"] == round(0.25 * 43560)
    assert result["parcel_id"] == "P-1"
