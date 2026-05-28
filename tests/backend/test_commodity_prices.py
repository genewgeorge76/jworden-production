"""
Tests for the live commodity price feed (asphalt, WTI crude, diesel, natgas).

Network is stubbed via monkeypatching httpx.get so tests are deterministic
and the EIA API is never actually called.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))


@pytest.fixture(autouse=True)
def _isolate_caches(monkeypatch):
    """Reset in-process cache between tests so prior runs don't leak."""
    from app.services import material_prices as mp
    mp._in_process_cache.clear()
    monkeypatch.setenv("REDIS_URL", "")  # force in-process cache path
    yield
    mp._in_process_cache.clear()


# ── Stub builders ─────────────────────────────────────────────────────────────


class _FakeResponse:
    def __init__(self, payload):
        self._payload = payload

    def raise_for_status(self):  # pragma: no cover - happy path only
        return None

    def json(self):
        return self._payload


def _eia_payload(value: float, period: str = "2026-04-25") -> dict:
    return {"response": {"data": [{"value": value, "period": period}]}}


def _bls_payload(value: float, year: str = "2026", period: str = "M03") -> dict:
    return {
        "status": "REQUEST_SUCCEEDED",
        "Results": {
            "series": [
                {
                    "seriesID": "WPU1321",
                    "data": [{"year": year, "period": period, "value": str(value)}],
                }
            ]
        },
    }


# ── Tests ─────────────────────────────────────────────────────────────────────


def test_fetch_commodity_prices_no_api_key_uses_fallback(monkeypatch):
    """Without API keys every commodity falls back cleanly to multiplier=1.0."""
    from app.services import material_prices as mp
    monkeypatch.setattr(mp, "_EIA_API_KEY", "")
    monkeypatch.setattr(mp, "_BLS_API_KEY", "")
    # Stub out BLS network call too (unauthenticated GET still hits the wire)
    def _no_net(*_a, **_kw):
        raise RuntimeError("network disabled in test")
    monkeypatch.setattr(mp.httpx, "get", _no_net)
    monkeypatch.setattr(mp.httpx, "post", _no_net)

    feed = mp.fetch_commodity_prices()
    assert set(feed["commodities"].keys()) == {"asphalt", "wti_crude", "diesel", "natgas", "gravel"}
    for code, c in feed["commodities"].items():
        assert c["multiplier"] == 1.0, f"{code} should fall back to 1.0"
        assert c["source"] == "fallback"


def test_fetch_commodity_prices_live_path(monkeypatch):
    """With a key + stubbed httpx, every commodity computes its multiplier from EIA values."""
    from app.services import material_prices as mp
    monkeypatch.setattr(mp, "_EIA_API_KEY", "test-key")
    monkeypatch.setattr(mp, "_BLS_API_KEY", "")  # use unauthenticated GET path for BLS

    # Map each commodity URL to a fake EIA payload that yields a known price.
    eia_payloads = {
        "https://api.eia.gov/v2/petroleum/pri/wfr/data/":      _eia_payload(3.135),   # asphalt: 3.135 / 2.85 = 1.10
        "https://api.eia.gov/v2/petroleum/pri/spt/data/":      _eia_payload(82.50),   # wti:     82.50 / 75.00 = 1.10
        "https://api.eia.gov/v2/petroleum/pri/gnd/data/":      _eia_payload(4.18),    # diesel:  4.18  / 3.80  = 1.10
        "https://api.eia.gov/v2/natural-gas/pri/fut/data/":    _eia_payload(2.70),    # natgas:  2.70  / 3.00  = 0.90
    }
    bls_payload = _bls_payload(308.0)  # gravel: 308.0 / 280.0 = 1.10

    calls: list[str] = []

    def fake_get(url, params=None, timeout=None):  # noqa: ARG001
        calls.append(url)
        if url in eia_payloads:
            return _FakeResponse(eia_payloads[url])
        if "bls.gov" in url:
            return _FakeResponse(bls_payload)
        raise AssertionError(f"unexpected url {url}")

    monkeypatch.setattr(mp.httpx, "get", fake_get)

    feed = mp.fetch_commodity_prices()
    cs = feed["commodities"]
    assert pytest.approx(cs["asphalt"]["multiplier"],   abs=1e-3) == 1.10
    assert pytest.approx(cs["wti_crude"]["multiplier"], abs=1e-3) == 1.10
    assert pytest.approx(cs["diesel"]["multiplier"],    abs=1e-3) == 1.10
    assert pytest.approx(cs["natgas"]["multiplier"],    abs=1e-3) == 0.90
    assert pytest.approx(cs["gravel"]["multiplier"],    abs=1e-3) == 1.10
    assert cs["asphalt"]["source"] == "EIA API v2"
    assert cs["gravel"]["source"] == "BLS PPI API v2"
    assert len(calls) == 5  # one HTTP call per commodity (4 EIA + 1 BLS)


def test_one_commodity_failure_does_not_break_feed(monkeypatch):
    """If a single commodity's API call blows up, the others still resolve."""
    from app.services import material_prices as mp
    monkeypatch.setattr(mp, "_EIA_API_KEY", "test-key")
    monkeypatch.setattr(mp, "_BLS_API_KEY", "")

    def fake_get(url, params=None, timeout=None):  # noqa: ARG001
        if "natural-gas" in url:
            raise RuntimeError("EIA natgas endpoint down")
        if "bls.gov" in url:
            return _FakeResponse(_bls_payload(280.0))
        return _FakeResponse(_eia_payload(75.0 if "spt" in url else (2.85 if "wfr" in url else 3.80)))

    monkeypatch.setattr(mp.httpx, "get", fake_get)

    feed = mp.fetch_commodity_prices()
    assert feed["commodities"]["natgas"]["source"] == "fallback"
    assert feed["commodities"]["asphalt"]["source"] == "EIA API v2"
    assert feed["commodities"]["diesel"]["source"] == "EIA API v2"
    assert feed["commodities"]["wti_crude"]["source"] == "EIA API v2"
    assert feed["commodities"]["gravel"]["source"] == "BLS PPI API v2"


def test_backward_compat_asphalt_index_shape(monkeypatch):
    """fetch_asphalt_price_index keeps its original key shape for legacy callers."""
    from app.services import material_prices as mp
    monkeypatch.setattr(mp, "_EIA_API_KEY", "")  # fallback

    result = mp.fetch_asphalt_price_index()
    expected_keys = {
        "price_per_gallon", "baseline_price", "multiplier", "pct_change",
        "as_of_date", "status_message", "source",
    }
    assert expected_keys.issubset(result.keys())
    assert result["price_per_gallon"] == 2.85
    assert result["multiplier"] == 1.0


def test_get_price_multiplier_with_materials_legacy_keys_present(monkeypatch):
    """pricing.py reads `multiplier` and `note` — both must be present."""
    from app.services import material_prices as mp
    monkeypatch.setattr(mp, "_EIA_API_KEY", "")

    result = mp.get_price_multiplier_with_materials("VA", "paving")
    # Legacy keys consumed by app/services/pricing.py
    assert "multiplier" in result
    assert "note" in result
    # New canonical keys
    assert "combined_multiplier" in result
    assert "material_multiplier" in result
    assert "state_multiplier" in result
    assert "commodities" in result
    assert "weights" in result
    assert result["multiplier"] == result["combined_multiplier"]
    assert result["note"] == result["material_note"]


def test_service_aware_weighting_paving_vs_sealcoating(monkeypatch):
    """
    When asphalt spikes +20% and everything else is flat, paving (asphalt-heavy)
    should move more than sealcoating (lighter on asphalt).
    """
    from app.services import material_prices as mp
    monkeypatch.setattr(mp, "_EIA_API_KEY", "test-key")
    monkeypatch.setattr(mp, "_BLS_API_KEY", "")

    # Asphalt +20%, everything else at baseline.
    def fake_get(url, params=None, timeout=None):  # noqa: ARG001
        if "wfr" in url:                # asphalt
            return _FakeResponse(_eia_payload(2.85 * 1.20))
        if "spt" in url:                # WTI
            return _FakeResponse(_eia_payload(75.00))
        if "gnd" in url:                # diesel
            return _FakeResponse(_eia_payload(3.80))
        if "natural-gas" in url:        # natgas
            return _FakeResponse(_eia_payload(3.00))
        if "bls.gov" in url:            # gravel PPI
            return _FakeResponse(_bls_payload(280.0))
        raise AssertionError(f"unexpected url {url}")

    monkeypatch.setattr(mp.httpx, "get", fake_get)

    paving = mp.get_price_multiplier_with_materials(None, "paving")
    sealcoat = mp.get_price_multiplier_with_materials(None, "sealcoating")

    # paving weights asphalt at 0.55 → expect ~+11% material lift
    # sealcoating weights asphalt at 0.30 → expect ~+6%
    assert paving["material_multiplier"] > sealcoat["material_multiplier"]
    assert pytest.approx(paving["material_multiplier"],   abs=0.005) == 1.110
    assert pytest.approx(sealcoat["material_multiplier"], abs=0.005) == 1.060


def test_gravel_drives_concrete_and_civil_pricing(monkeypatch):
    """
    Gravel (BLS WPU1321 PPI) should pull aggregate-heavy services.
    A +20% gravel move should lift civil_site_work (gravel weight 0.30)
    more than paving (gravel weight 0.15).
    """
    from app.services import material_prices as mp
    monkeypatch.setattr(mp, "_EIA_API_KEY", "test-key")
    monkeypatch.setattr(mp, "_BLS_API_KEY", "")

    def fake_get(url, params=None, timeout=None):  # noqa: ARG001
        if "bls.gov" in url:           # gravel +20%
            return _FakeResponse(_bls_payload(280.0 * 1.20))
        if "wfr" in url:               # asphalt flat
            return _FakeResponse(_eia_payload(2.85))
        if "spt" in url:               # WTI flat
            return _FakeResponse(_eia_payload(75.00))
        if "gnd" in url:               # diesel flat
            return _FakeResponse(_eia_payload(3.80))
        if "natural-gas" in url:       # natgas flat
            return _FakeResponse(_eia_payload(3.00))
        raise AssertionError(f"unexpected url {url}")

    monkeypatch.setattr(mp.httpx, "get", fake_get)

    civil = mp.get_price_multiplier_with_materials(None, "civil_site_work")
    paving = mp.get_price_multiplier_with_materials(None, "paving")
    assert civil["material_multiplier"] > paving["material_multiplier"]
    # civil_site_work gravel weight 0.30 → ~+6%
    assert pytest.approx(civil["material_multiplier"], abs=0.005) == 1.060
    # paving gravel weight 0.15 → ~+3%
    assert pytest.approx(paving["material_multiplier"], abs=0.005) == 1.030


def test_bls_uses_post_when_api_key_present(monkeypatch):
    """When BLS_API_KEY is set, the BLS backend POSTs with the registration key."""
    from app.services import material_prices as mp
    monkeypatch.setattr(mp, "_EIA_API_KEY", "")  # other commodities stay on fallback
    monkeypatch.setattr(mp, "_BLS_API_KEY", "bls-test-key")

    captured: dict = {}

    def fake_post(url, json=None, timeout=None):  # noqa: ARG001, A002
        captured["url"] = url
        captured["json"] = json
        return _FakeResponse(_bls_payload(308.0))

    def _no_get(*_a, **_kw):
        raise RuntimeError("network disabled")

    monkeypatch.setattr(mp.httpx, "post", fake_post)
    monkeypatch.setattr(mp.httpx, "get", _no_get)

    feed = mp.fetch_commodity_prices()
    gravel = feed["commodities"]["gravel"]
    assert gravel["source"] == "BLS PPI API v2"
    assert pytest.approx(gravel["multiplier"], abs=1e-3) == 1.10
    assert "bls.gov" in captured["url"]
    assert captured["json"]["registrationkey"] == "bls-test-key"
    assert captured["json"]["seriesid"] == ["WPU1321"]


def test_combined_multiplier_includes_state(monkeypatch):
    """combined = state_mult * material_mult."""
    from app.services import material_prices as mp
    monkeypatch.setattr(mp, "_EIA_API_KEY", "")

    result = mp.get_price_multiplier_with_materials("CA", "paving")
    expected = round(result["state_multiplier"] * result["material_multiplier"], 4)
    assert result["combined_multiplier"] == expected
    # CA is above-national-average, so combined should be > 1.0 even with flat materials
    assert result["combined_multiplier"] > 1.0


def test_unknown_service_uses_default_weights(monkeypatch):
    from app.services import material_prices as mp
    monkeypatch.setattr(mp, "_EIA_API_KEY", "")

    result = mp.get_price_multiplier_with_materials(None, "totally_unknown_service")
    assert result["weights"] == mp._DEFAULT_WEIGHTS


def test_caching_avoids_repeated_http_calls(monkeypatch):
    """A second call within TTL must not re-hit the EIA/BLS APIs."""
    from app.services import material_prices as mp
    monkeypatch.setattr(mp, "_EIA_API_KEY", "test-key")
    monkeypatch.setattr(mp, "_BLS_API_KEY", "")

    call_count = {"n": 0}

    def fake_get(url, params=None, timeout=None):  # noqa: ARG001
        call_count["n"] += 1
        if "spt" in url:
            return _FakeResponse(_eia_payload(75.0))
        if "wfr" in url:
            return _FakeResponse(_eia_payload(2.85))
        if "gnd" in url:
            return _FakeResponse(_eia_payload(3.80))
        if "natural-gas" in url:
            return _FakeResponse(_eia_payload(3.00))
        if "bls.gov" in url:
            return _FakeResponse(_bls_payload(280.0))
        raise AssertionError(f"unexpected url {url}")

    monkeypatch.setattr(mp.httpx, "get", fake_get)

    mp.fetch_commodity_prices()
    first = call_count["n"]
    mp.fetch_commodity_prices()  # cached
    assert call_count["n"] == first, "Second call should be served from cache"
