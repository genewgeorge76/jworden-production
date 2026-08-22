"""
An integration that did not run must not report that it did.

Three abilities in the registry returned confident, hardcoded results when
their backing service was absent — and they were counted among the "109 real
implementations".

  OperationalAndDispatch.foreman_ai_client
      Made no HTTP request anywhere in the file. Every method returned
      {"status": "success"} with invented receipt ids (MSG-99882, REC-7732).
      The host it was written against, api.foremanai.co, does not resolve, so
      FOREMAN_API_KEY changed nothing — configured and unconfigured produced
      identical fabricated output.

  OperationalAndDispatch.ai_foreman
      Put the client's canned "Vendor notified. AI negotiating schedule shift."
      straight into a dispatch command. A foreman read that as confirmation the
      concrete sub had been told to pull the pour forward two days. Nobody had
      been told anything. On a live job that is a crew waiting on a sub who was
      never called — which is why this one is tested hardest.

  SalesAndEstimation.commercial_bid_hunter
      _simulate_hunt() returned two fabricated opportunities with dollar values
      and margins, fired on missing key AND on any error. The live path was no
      better: estimated_value and ai_margin_prediction were computed from the
      loop index, so the first search hit was always worth $250,000 at 30%.

The shared rule: no numbers, no ids, no success claims that were not obtained.
"""
from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))


# ── The Foreman AI client ─────────────────────────────────────────────────────


def test_foreman_client_never_reports_success():
    from app.jarvis_os.abilities.OperationalAndDispatch.foreman_ai_client import (
        ForemanAIClient,
    )

    client = ForemanAIClient()
    for result in (
        client.get_project_schedules("PRJ-1"),
        client.trigger_vendor_communication("VEND-1", "pull the pour forward"),
        client.update_bid_pipeline({"bid_id": "B-1"}),
    ):
        assert result["ok"] is False
        assert result["status"] != "success"
        assert result["performed"] is False
        assert result["error"]


def test_foreman_client_invents_no_receipt_ids():
    """
    "communication_id": "MSG-99882" and "foreman_record_id": "REC-7732" were
    constants that read as proof the work happened.
    """
    from app.jarvis_os.abilities.OperationalAndDispatch.foreman_ai_client import (
        ForemanAIClient,
    )

    client = ForemanAIClient()
    sent = client.trigger_vendor_communication("VEND-1", "hello")
    synced = client.update_bid_pipeline({"bid_id": "B-1"})

    assert "communication_id" not in sent
    assert "foreman_record_id" not in synced
    assert "MSG-99882" not in str(sent)
    assert "REC-7732" not in str(synced)


def test_foreman_client_returns_no_schedule_rather_than_an_empty_one():
    """
    An empty list renders as "this project has no tasks". An absent key forces
    the caller past the ok flag first.
    """
    from app.jarvis_os.abilities.OperationalAndDispatch.foreman_ai_client import (
        ForemanAIClient,
    )

    result = ForemanAIClient().get_project_schedules("PRJ-1")
    assert "schedule" not in result


def test_setting_the_key_does_not_manufacture_availability(monkeypatch):
    """The key was never used. Setting it must not start claiming success."""
    from app.jarvis_os.abilities.OperationalAndDispatch.foreman_ai_client import (
        ForemanAIClient,
    )

    monkeypatch.setenv("FOREMAN_API_KEY", "any-value-at-all")
    client = ForemanAIClient()
    assert client.available is False
    assert client.trigger_vendor_communication("V", "m")["performed"] is False


# ── The dispatch board ────────────────────────────────────────────────────────


def test_dispatch_never_claims_a_vendor_was_contacted():
    """
    The one that could strand a crew. With vendor dispatch unavailable, the
    command must tell the foreman to make the call himself.
    """
    from app.jarvis_os.abilities.OperationalAndDispatch.ai_foreman import AIForeman

    result = AIForeman().evaluate_telematics(
        {"intelligence": {"grading_completed_early": True}}
    )
    assessment = result["assessment"]

    assert "Vendor notified" not in assessment
    assert "AI negotiating" not in assessment
    assert "ACTION REQUIRED" in assessment
    assert "NOT sent automatically" in assessment


def test_real_telematics_logic_still_works():
    """
    The evaluation thresholds are genuine and stay. Only the claim about the
    vendor call was false.
    """
    from app.jarvis_os.abilities.OperationalAndDispatch.ai_foreman import AIForeman

    hot = AIForeman().evaluate_telematics(
        {"crew": {"raker": {"temp": 102.5, "bpm": 158}}}
    )
    assert hot["status"] == "intervention_required"
    assert "Heat stroke risk" in hot["assessment"]

    clear = AIForeman().evaluate_telematics({})
    assert clear["status"] == "nominal"
    assert clear["issues_detected"] == 0


# ── The bid hunter ────────────────────────────────────────────────────────────


def test_bid_hunter_returns_no_rows_when_it_cannot_search(monkeypatch):
    from app.jarvis_os.abilities.SalesAndEstimation.commercial_bid_hunter import (
        CommercialBidHunter,
    )

    monkeypatch.delenv("EXA_API_KEY", raising=False)
    result = CommercialBidHunter().hunt_for_rfps()

    assert result["ok"] is False
    assert result["results"] == []
    assert result["count"] == 0
    assert "EXA_API_KEY" in result["error"]


def test_the_simulated_pipeline_is_gone(monkeypatch):
    """
    "Mercy Hospital Logistics Wing Paving — $1,450,000, 32% margin" and
    "Amazon Fulfillment Center Phase 3 — $3,200,000" reached the executive
    pipeline as live opportunities whenever the key was missing or the API
    errored.
    """
    from app.jarvis_os.abilities.SalesAndEstimation import commercial_bid_hunter

    monkeypatch.delenv("EXA_API_KEY", raising=False)
    blob = str(commercial_bid_hunter.CommercialBidHunter().hunt_for_rfps())

    for invented in ("Mercy Hospital", "Amazon Fulfillment", "1,450,000",
                     "3,200,000", "B2B-SIM", "example.com"):
        assert invented not in blob, f"{invented!r} is still being returned"

    assert not hasattr(commercial_bid_hunter.CommercialBidHunter, "_simulate_hunt")


def test_search_results_carry_no_invented_money(monkeypatch):
    """
    The live path's own fabrication: value and margin came from the loop
    index, so hit #1 was always $250,000 at 30% and hit #2 always $500,000 at
    31% — determined by array position, not by the document.
    """
    import json
    from contextlib import contextmanager

    from app.jarvis_os.abilities.SalesAndEstimation import commercial_bid_hunter

    payload = {
        "results": [
            {"title": "Warehouse repaving RFP", "url": "https://sub.example.org/rfp/1",
             "publishedDate": "2026-08-01"},
            {"title": "Hospital lot expansion", "url": "https://city.gov/bids/2"},
        ]
    }

    class _Resp:
        def read(self):
            return json.dumps(payload).encode()

    @contextmanager
    def fake_urlopen(*args, **kwargs):
        yield _Resp()

    monkeypatch.setenv("EXA_API_KEY", "exa-test-key")
    monkeypatch.setattr(commercial_bid_hunter.urllib.request, "urlopen", fake_urlopen)

    result = commercial_bid_hunter.CommercialBidHunter().hunt_for_rfps()

    assert result["ok"] is True
    assert result["count"] == 2
    for row in result["results"]:
        assert "estimated_value" not in row
        assert "ai_margin_prediction" not in row
        assert "risk_score" not in row
        assert row["status"] == "unqualified — needs review"

    # What the search genuinely returned is preserved, untruncated.
    assert result["results"][0]["title"] == "Warehouse repaving RFP"
    assert result["results"][0]["source_domain"] == "sub.example.org"
    assert result["results"][1]["published_date"] is None


def test_an_api_error_yields_a_failure_not_a_pipeline(monkeypatch):
    from app.jarvis_os.abilities.SalesAndEstimation import commercial_bid_hunter

    def boom(*args, **kwargs):
        raise ConnectionResetError("connection reset")

    monkeypatch.setenv("EXA_API_KEY", "exa-test-key")
    monkeypatch.setattr(commercial_bid_hunter.urllib.request, "urlopen", boom)

    result = commercial_bid_hunter.CommercialBidHunter().hunt_for_rfps()
    assert result["ok"] is False
    assert result["results"] == []
    assert "ConnectionResetError" in result["error"]
