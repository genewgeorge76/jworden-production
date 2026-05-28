"""
Tests covering the 51-state logic completeness for internal-ops touchpoints:
  - math_ai_service._STATE_COST_MULTIPLIERS parity (51 entries incl. DC)
  - proposal_generator injects state compliance into both GPT prompt and template
  - email_templates.admin_new_lead surfaces state context to the operator
  - notifications.send_lead_notification SMS body includes state tag
"""
from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))


# ── 1. Cost-multiplier parity ──────────────────────────────────────────────────


def test_state_cost_multipliers_include_dc_and_all_states():
    from app.services.math_ai_service import _STATE_COST_MULTIPLIERS
    from app.services.state_data import STATE_MAP

    # Every state in the canonical map must have a cost multiplier
    missing = sorted(set(STATE_MAP.keys()) - set(_STATE_COST_MULTIPLIERS.keys()))
    assert missing == [], f"_STATE_COST_MULTIPLIERS missing entries for: {missing}"

    # DC must be present (this was the documented gap)
    assert "DC" in _STATE_COST_MULTIPLIERS
    assert _STATE_COST_MULTIPLIERS["DC"] > 1.0, "DC should reflect above-average labor/material costs"


# ── 2. Proposal generator injects state context ───────────────────────────────


def test_state_proposal_block_includes_compliance_facts():
    from app.services.proposal_generator import _state_proposal_block

    block_ca = _state_proposal_block("CA")
    assert "California" in block_ca
    assert "license required: yes" in block_ca.lower()
    assert "prevailing wage" in block_ca.lower()
    assert "season" in block_ca.lower()
    assert "price index" in block_ca.lower()


def test_state_proposal_block_handles_unknown_and_empty():
    from app.services.proposal_generator import _state_proposal_block

    assert "national" in _state_proposal_block("").lower()
    assert "not recognized" in _state_proposal_block("XX").lower()


def test_template_proposal_includes_state_compliance_section():
    from app.services.proposal_generator import _template_proposal

    proposal = _template_proposal({
        "name": "Acme Corp",
        "address": "123 Main St",
        "service_type": "paving",
        "project_size_sqft": 25000,
        "price_low": 100000,
        "price_high": 140000,
        "state_code": "VA",
    })
    assert "STATE COMPLIANCE & MARKET CONTEXT" in proposal
    assert "Virginia" in proposal
    # VA has prevailing wage + state OSHA + state licensing
    assert "Prevailing wage" in proposal
    assert "OSHA" in proposal


def test_template_proposal_without_state_still_renders():
    from app.services.proposal_generator import _template_proposal

    proposal = _template_proposal({
        "name": "Acme Corp",
        "service_type": "paving",
        "project_size_sqft": 1000,
    })
    # Should mention defaulting to national baseline rather than crashing
    assert "national" in proposal.lower()


def test_gpt_prompt_includes_state_block():
    from app.services.proposal_generator import _build_gpt_prompt

    prompt = _build_gpt_prompt({
        "name": "Test Client",
        "service_type": "parking_lot",
        "state_code": "NY",
        "project_size_sqft": 10000,
    })
    assert "STATE-SPECIFIC COMPLIANCE CONTEXT" in prompt
    assert "New York" in prompt


# ── 3. Admin lead email surfaces state context ────────────────────────────────


def test_admin_new_lead_email_includes_state_context():
    from app.services.email_templates import admin_new_lead

    lead = {
        "id": 42,
        "name": "Northrop Test",
        "email": "ops@example.com",
        "phone": "+15551234567",
        "service_type": "parking_lot",
        "property_type": "commercial",
        "urgency": "asap",
        "address": "1 Park Ave",
        "project_size_sqft": 50000,
        "score_label": "HOT",
        "score_value": 92,
        "message": "Need quote",
        "state_code": "NY",
    }
    subject, html, text = admin_new_lead(lead)

    assert "[HOT]" in subject
    # HTML body shows state name + price index + flags row
    assert "New York" in html
    assert "price index" in html.lower()
    assert "License" in html
    # Plain-text version also carries the state line
    assert "State:" in text
    assert "New York" in text
    assert "License" in text


def test_admin_new_lead_email_handles_missing_state():
    from app.services.email_templates import admin_new_lead

    lead = {
        "id": 7,
        "name": "No State",
        "email": "x@y.com",
        "phone": "+15550001111",
        "service_type": "paving",
        "property_type": "residential",
        "urgency": "flexible",
        "address": "",
        "project_size_sqft": 0,
        "score_label": "COOL",
        "score_value": 30,
        "message": "",
    }
    subject, html, text = admin_new_lead(lead)
    assert "—" in html  # state placeholder
    assert "State:" in text


# ── 4. Lead-notification SMS includes state tag ───────────────────────────────


def test_lead_notification_sms_includes_state_tag(monkeypatch):
    """SMS body should append state code, price multiplier, and compliance flags."""
    from app.services import notifications

    captured: dict = {}

    def fake_sms(message: str, to_numbers: list[str]) -> None:
        captured["message"] = message
        captured["to"] = to_numbers

    monkeypatch.setattr(notifications, "_send_twilio_sms", fake_sms)
    monkeypatch.setenv("NOTIFY_TO_PHONE", "+15555550100")
    monkeypatch.setenv("NOTIFY_TO_EMAIL", "")  # skip email path
    monkeypatch.setenv("RESEND_API_KEY", "")
    monkeypatch.setenv("SMTP_HOST", "")

    notifications.send_lead_notification({
        "type": "lead",
        "name": "Jane Doe",
        "phone": "+18045551234",
        "service_type": "parking_lot",
        "urgency": "asap",
        "state_code": "CA",
        "score": {"label": "HOT", "priority": 1},
    })

    assert "message" in captured, "SMS was not dispatched"
    msg = captured["message"]
    assert "[HOT]" in msg
    assert "Jane Doe" in msg
    # State context appended: "CA <multiplier>x/<flags>"
    assert "CA" in msg
    assert "x" in msg  # price multiplier marker
    # CA has license + prevailing wage + state OSHA → all three flags present
    assert "LIC" in msg and "PW" in msg and "OSHA" in msg


def test_lead_notification_sms_without_state(monkeypatch):
    """SMS still sends cleanly when no state is provided."""
    from app.services import notifications

    captured: dict = {}
    monkeypatch.setattr(notifications, "_send_twilio_sms",
                        lambda m, n: captured.update(message=m, to=n))
    monkeypatch.setenv("NOTIFY_TO_PHONE", "+15555550100")
    monkeypatch.setenv("NOTIFY_TO_EMAIL", "")
    monkeypatch.setenv("RESEND_API_KEY", "")
    monkeypatch.setenv("SMTP_HOST", "")

    notifications.send_lead_notification({
        "type": "lead",
        "name": "No State",
        "phone": "+15550001111",
        "service_type": "paving",
        "urgency": "flexible",
        "score": {"label": "COOL"},
    })
    assert "[COOL]" in captured["message"]
    assert "No State" in captured["message"]
