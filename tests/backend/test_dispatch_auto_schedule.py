"""
Tests for dispatch_engine.auto_schedule() — Foreman AI: wires
weather_service.get_paving_forecast() + assign() + reschedule_job() together
so that approving a job finds the next paving-suitable day and assigns the
best-ranked truck/driver to it in one step.
"""
from __future__ import annotations

import pytest


@pytest.fixture()
def engine(tmp_path, monkeypatch):
    """A dispatch_engine module instance with isolated file-backed state."""
    monkeypatch.setenv("DISPATCH_STATE_PATH", str(tmp_path / "dispatch_state.json"))
    import importlib
    from app.services import dispatch_engine as mod
    importlib.reload(mod)
    return mod


def _fake_forecast_with_window(window_date: str):
    def _fake(address: str) -> dict:
        return {
            "address": address,
            "next_optimal_window": window_date,
            "risk_score": 1,
            "recommendation": "Optimal paving streak detected.",
            "source": "test-fake",
        }
    return _fake


def _fake_forecast_no_window():
    def _fake(address: str) -> dict:
        return {
            "address": address,
            "next_optimal_window": None,
            "risk_score": 9,
            "recommendation": "No suitable window in the next 8 days.",
            "source": "test-fake",
        }
    return _fake


async def test_auto_schedule_missing_job_raises_keyerror(engine):
    with pytest.raises(KeyError):
        await engine.auto_schedule("job_does_not_exist")


async def test_auto_schedule_job_without_address_skips_weather(engine):
    job = engine.upsert_job({"site_name": "No Address Job", "tons_needed": 20})
    result = await engine.auto_schedule(job["id"])
    assert result["auto_scheduled"] is False
    assert result["scheduled_date"] is None


async def test_auto_schedule_no_suitable_window_does_not_assign(engine, monkeypatch):
    monkeypatch.setattr(engine.weather_service, "get_paving_forecast", _fake_forecast_no_window())
    engine.upsert_truck({"name": "Truck 1", "capacity_tons": 20, "lat": 37.38, "lng": -77.45})
    job = engine.upsert_job({
        "site_name": "Rainy Site", "address": "123 Main St, Chester, VA",
        "tons_needed": 15, "lat": 37.4, "lng": -77.5,
    })

    result = await engine.auto_schedule(job["id"])

    assert result["auto_scheduled"] is False
    assert result["scheduled_date"] is None
    assert result["weather"]["risk_score"] == 9


async def test_auto_schedule_no_available_truck_does_not_assign(engine, monkeypatch):
    monkeypatch.setattr(engine.weather_service, "get_paving_forecast", _fake_forecast_with_window("2026-07-20"))
    job = engine.upsert_job({
        "site_name": "No Truck Site", "address": "1 Empty Rd", "tons_needed": 15,
    })

    result = await engine.auto_schedule(job["id"])

    assert result["auto_scheduled"] is False
    assert result["scheduled_date"] == "2026-07-20"
    assert result["assignment"] is None


async def test_auto_schedule_happy_path_assigns_truck_and_updates_job(engine, monkeypatch):
    monkeypatch.setattr(engine.weather_service, "get_paving_forecast", _fake_forecast_with_window("2026-07-21"))
    truck = engine.upsert_truck({"name": "Truck Alpha", "capacity_tons": 20, "lat": 37.38, "lng": -77.45})
    driver = engine.upsert_driver({"name": "Driver A", "preferred_truck_id": truck["id"]})
    job = engine.upsert_job({
        "site_name": "Sunny Lot", "address": "456 Sunny Ave, Chester, VA",
        "tons_needed": 15, "lat": 37.39, "lng": -77.46,
    })

    result = await engine.auto_schedule(job["id"])

    assert result["auto_scheduled"] is True
    assert result["scheduled_date"] == "2026-07-21"
    assert result["assignment"]["truck"]["id"] == truck["id"]
    assert result["job"]["assigned_truck_id"] == truck["id"]
    assert result["job"]["assigned_driver_id"] == driver["id"]
    assert result["job"]["status"] == "scheduled"
    assert result["job"]["scheduled_start"].startswith("2026-07-21")

    # Confirm persisted, not just returned
    persisted = {j["id"]: j for j in engine.list_jobs()}[job["id"]]
    assert persisted["assigned_truck_id"] == truck["id"]
    assert persisted["status"] == "scheduled"
