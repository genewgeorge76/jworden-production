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


def _bls_payload(
    value: float,
    year: str = "2026",
    period: str = "M03",
    series_id: str = "WPU1321",
) -> dict:
    return {
        "status": "REQUEST_SUCCEEDED",
        "Results": {
            "series": [
                {
                    "seriesID": series_id,
                    "data": [{"year": year, "period": period, "value": str(value)}],
                }
            ]
        },
    }


def _fake_transport(ratios: dict[str, float]):
    """
    Build `(fake_get, calls)` answering every commodity at
    `baseline * ratios.get(code, 1.0)`.

    Prices are derived from `_COMMODITIES` rather than hardcoded. The earlier
    version of these tests pinned the literal baselines, so when the gravel
    baseline drifted 79% away from the level it claimed to represent, every
    test still passed — the stub and the bug moved together. Deriving the
    stub from the registry keeps these tests about the multiplier math and
    the backend dispatch, which is all they can honestly assert offline.
    """
    from app.services import material_prices as mp

    by_eia_url: dict[str, dict] = {}
    by_bls_series: dict[str, dict] = {}
    for code, spec in mp._COMMODITIES.items():
        price = spec["baseline"] * ratios.get(code, 1.0)
        if spec.get("backend", "eia") == "eia":
            by_eia_url[spec["url"]] = _eia_payload(price)
        else:
            by_bls_series[spec["series_id"]] = _bls_payload(price, series_id=spec["series_id"])

    calls: list[str] = []

    def fake_get(url, params=None, timeout=None):  # noqa: ARG001
        calls.append(url)
        if url in by_eia_url:
            return _FakeResponse(by_eia_url[url])
        if "bls.gov" in url:
            series_id = url.rstrip("/").rsplit("/", 1)[-1]
            if series_id in by_bls_series:
                return _FakeResponse(by_bls_series[series_id])
            raise AssertionError(f"unexpected BLS series {series_id}")
        raise AssertionError(f"unexpected url {url}")

    return fake_get, calls


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
    """With stubbed httpx, every commodity computes its multiplier from its own feed."""
    from app.services import material_prices as mp
    monkeypatch.setattr(mp, "_EIA_API_KEY", "test-key")
    monkeypatch.setattr(mp, "_BLS_API_KEY", "")  # use unauthenticated GET path for BLS

    fake_get, calls = _fake_transport({
        "asphalt": 1.10, "wti_crude": 1.10, "diesel": 1.10, "natgas": 0.90, "gravel": 1.10,
    })
    monkeypatch.setattr(mp.httpx, "get", fake_get)

    feed = mp.fetch_commodity_prices()
    cs = feed["commodities"]
    assert pytest.approx(cs["asphalt"]["multiplier"],   abs=1e-3) == 1.10
    assert pytest.approx(cs["wti_crude"]["multiplier"], abs=1e-3) == 1.10
    assert pytest.approx(cs["diesel"]["multiplier"],    abs=1e-3) == 1.10
    assert pytest.approx(cs["natgas"]["multiplier"],    abs=1e-3) == 0.90
    assert pytest.approx(cs["gravel"]["multiplier"],    abs=1e-3) == 1.10
    assert cs["asphalt"]["source"] == "BLS PPI API v2"
    assert cs["gravel"]["source"] == "BLS PPI API v2"
    assert cs["diesel"]["source"] == "EIA API v2"
    assert len(calls) == 5  # one HTTP call per commodity (3 EIA + 2 BLS)


def test_one_commodity_failure_does_not_break_feed(monkeypatch):
    """If a single commodity's API call blows up, the others still resolve."""
    from app.services import material_prices as mp
    monkeypatch.setattr(mp, "_EIA_API_KEY", "test-key")
    monkeypatch.setattr(mp, "_BLS_API_KEY", "")

    healthy, _ = _fake_transport({})

    def fake_get(url, params=None, timeout=None):  # noqa: ARG001
        if "natural-gas" in url:
            raise RuntimeError("EIA natgas endpoint down")
        return healthy(url, params=params, timeout=timeout)

    monkeypatch.setattr(mp.httpx, "get", fake_get)

    feed = mp.fetch_commodity_prices()
    assert feed["commodities"]["natgas"]["source"] == "fallback"
    assert feed["commodities"]["asphalt"]["source"] == "BLS PPI API v2"
    assert feed["commodities"]["diesel"]["source"] == "EIA API v2"
    assert feed["commodities"]["wti_crude"]["source"] == "EIA API v2"
    assert feed["commodities"]["gravel"]["source"] == "BLS PPI API v2"


def test_asphalt_series_is_the_paving_ppi():
    """
    Asphalt must not be pointed at EIA product code EPD2F.

    EPD2F is No. 2 fuel oil. The registry previously requested it under the
    label "Asphalt / Road Oil", so a working EIA_API_KEY would have put a
    distillate price into every asphalt-weighted estimate. EIA publishes no
    current asphalt price series; WPU1394 (BLS) tracks the paving mixture a
    contractor actually buys and needs no API key.
    """
    from app.services import material_prices as mp
    spec = mp._COMMODITIES["asphalt"]
    assert spec["backend"] == "bls"
    assert spec["series_id"] == "WPU1394"
    assert spec["unit"] == "PPI index"
    assert "EPD2F" not in str(spec)


def test_asphalt_index_wrapper_does_not_misstate_its_unit(monkeypatch):
    """
    The wrapper exposes `index_value` + `unit`, and leaves `price_per_gallon`
    empty unless the commodity really is priced per gallon. Asphalt is an
    index, so a per-gallon field would be a number in the wrong unit — worse
    than an absent one, because a dollar figure reads as a quotable price.
    """
    from app.services import material_prices as mp

    def _no_net(*_a, **_kw):
        raise RuntimeError("network disabled in test")

    monkeypatch.setattr(mp, "_EIA_API_KEY", "")
    monkeypatch.setattr(mp.httpx, "get", _no_net)
    monkeypatch.setattr(mp.httpx, "post", _no_net)

    result = mp.fetch_asphalt_price_index()
    expected_keys = {
        "index_value", "unit", "label", "price_per_gallon", "baseline_price",
        "multiplier", "pct_change", "as_of_date", "status_message", "source",
    }
    assert expected_keys.issubset(result.keys())
    assert result["unit"] == "PPI index"
    assert result["price_per_gallon"] is None
    assert result["index_value"] == mp._COMMODITIES["asphalt"]["baseline"]
    assert result["multiplier"] == 1.0
    assert result["source"] == "fallback"


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
    fake_get, _ = _fake_transport({"asphalt": 1.20})
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

    fake_get, _ = _fake_transport({"gravel": 1.20})
    monkeypatch.setattr(mp.httpx, "get", fake_get)

    civil = mp.get_price_multiplier_with_materials(None, "civil_site_work")
    paving = mp.get_price_multiplier_with_materials(None, "paving")
    assert civil["material_multiplier"] > paving["material_multiplier"]
    # civil_site_work gravel weight 0.30 → ~+6%
    assert pytest.approx(civil["material_multiplier"], abs=0.005) == 1.060
    # paving gravel weight 0.15 → ~+3%
    assert pytest.approx(paving["material_multiplier"], abs=0.005) == 1.030


def test_bls_uses_post_when_api_key_present(monkeypatch):
    """When BLS_API_KEY is set, every BLS commodity POSTs with the registration key."""
    from app.services import material_prices as mp
    monkeypatch.setattr(mp, "_EIA_API_KEY", "")  # EIA commodities stay on fallback
    monkeypatch.setattr(mp, "_BLS_API_KEY", "bls-test-key")

    captured: list[dict] = []
    baselines = {c: mp._COMMODITIES[c]["baseline"] for c in ("asphalt", "gravel")}

    def fake_post(url, json=None, timeout=None):  # noqa: ARG001, A002
        captured.append({"url": url, "json": json})
        series_id = json["seriesid"][0]
        code = next(c for c, b in baselines.items()
                    if mp._COMMODITIES[c]["series_id"] == series_id)
        return _FakeResponse(_bls_payload(baselines[code] * 1.10, series_id=series_id))

    def _no_get(*_a, **_kw):
        raise RuntimeError("network disabled")

    monkeypatch.setattr(mp.httpx, "post", fake_post)
    monkeypatch.setattr(mp.httpx, "get", _no_get)

    feed = mp.fetch_commodity_prices()
    for code in ("asphalt", "gravel"):
        entry = feed["commodities"][code]
        assert entry["source"] == "BLS PPI API v2"
        assert pytest.approx(entry["multiplier"], abs=1e-3) == 1.10

    assert {c["json"]["seriesid"][0] for c in captured} == {"WPU1394", "WPU1321"}
    for call in captured:
        assert "bls.gov" in call["url"]
        assert call["json"]["registrationkey"] == "bls-test-key"


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

    fake_get, calls = _fake_transport({})
    monkeypatch.setattr(mp.httpx, "get", fake_get)

    mp.fetch_commodity_prices()
    first = len(calls)
    mp.fetch_commodity_prices()  # cached
    assert len(calls) == first, "Second call should be served from cache"
