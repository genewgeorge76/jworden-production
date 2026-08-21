"""
Lead notifications — does an arriving lead actually reach anybody.

Two independent ways this pipeline went quiet, both of which look identical
from outside: the lead is in the database, the form returned 200, and no
notification arrives.

  1. The admin email template crashed. Most templates read their fields with
     ``getattr(lead, "address", None) or lead.get("address", "")``, which
     raises AttributeError for an ORM object whose attribute is present but
     empty. The router passes an ORM object and real customers routinely
     leave the address, square-footage and message boxes blank, so the
     notification for an ordinary lead raised before it could send. It raised
     inside a FastAPI background task, after the 200 had gone out, so nothing
     upstream noticed.

  2. No delivery channel is configured. That one is not a bug — it is a
     deployment fact — but it has to be *legible*, because "no email arrived"
     and "no email could ever have arrived" call for completely different
     responses from the operator.

These tests cover the first directly and assert the second is reportable.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))


@pytest.fixture()
def bare_lead(app_modules):
    """
    A lead with every optional field left empty — the common case, and the
    one that used to crash the notifier.
    """
    _, dbmod = app_modules
    from app.models import Lead

    session = dbmod.SessionLocal()
    try:
        lead = Lead(
            name="Jane Homeowner",
            email="jane@example.com",
            phone="5555550188",
            service_type="paving",
            property_type="residential",
            urgency="planning",
            address=None,
            message=None,
            project_size_sqft=None,
            state_code=None,
        )
        session.add(lead)
        session.commit()
        session.refresh(lead)
        yield lead
    finally:
        session.close()


def test_admin_template_renders_an_orm_lead_with_empty_fields(bare_lead):
    """The exact call that raised AttributeError in production."""
    from app.services import email_templates as tmpl

    subject, html, text = tmpl.admin_new_lead(bare_lead)

    assert "Jane Homeowner" in html
    assert "Jane Homeowner" in text
    assert subject


def test_admin_template_renders_a_dict_lead(app_modules):
    """The other caller shape — the background notifier passes a dict."""
    from app.services import email_templates as tmpl

    subject, html, _ = tmpl.admin_new_lead(
        {
            "name": "Dict Lead",
            "email": "dict@example.com",
            "phone": "5555550199",
            "service_type": "sealcoating",
        }
    )
    assert "Dict Lead" in html
    assert subject


def test_customer_facing_templates_render_an_orm_lead(bare_lead):
    """Same crash shape, same fix, for every template that takes a lead."""
    from app.services import email_templates as tmpl

    for render in (
        tmpl.quote_confirmation,
        tmpl.follow_up_hot,
        tmpl.follow_up_warm,
        tmpl.follow_up_cool,
    ):
        subject, html, text = render(bare_lead)
        assert subject and html and text, f"{render.__name__} produced an empty email"


def test_lead_field_prefers_real_values_over_the_default(bare_lead):
    from app.services.email_templates import lead_field

    assert lead_field(bare_lead, "name", "fallback") == "Jane Homeowner"
    assert lead_field(bare_lead, "address", "—") == "—"
    assert lead_field({"address": "12 Main St"}, "address", "—") == "12 Main St"
    assert lead_field({"address": None}, "address", "—") == "—"


async def test_submitting_a_bare_lead_does_not_raise_in_the_background(client):
    """
    End to end: the shape of lead that used to blow up the notifier now
    completes cleanly. httpx's ASGI transport runs background tasks, so an
    exception in one surfaces here rather than being swallowed.
    """
    res = await client.post(
        "/api/v1/leads/quote",
        json={
            "name": "Bare Lead",
            "email": "bare@example.com",
            "phone": "5555550177",
            "service_type": "paving",
            "property_type": "residential",
            "urgency": "planning",
        },
    )
    assert res.status_code == 200, res.text


# ── Reachability is reportable ────────────────────────────────────────────────


def test_notification_channels_report_their_configuration(monkeypatch):
    """
    With nothing configured the report must say so plainly rather than
    claiming health. An operator who is not receiving leads needs to be able
    to tell "nothing was sent" from "sending failed".
    """
    from app.services import notification_health

    for var in (
        "RESEND_API_KEY",
        "SENDGRID_API_KEY",
        "SMTP_HOST",
        "TWILIO_ACCOUNT_SID",
        "TWILIO_AUTH_TOKEN",
        "TWILIO_FROM_NUMBER",
        "NOTIFY_TO_PHONE",
    ):
        monkeypatch.delenv(var, raising=False)

    report = notification_health.check()

    assert report["can_notify"] is False
    assert report["email"]["configured"] is False
    assert report["sms"]["configured"] is False
    assert report["summary"], "an unreachable notifier must explain itself"


def test_a_configured_email_channel_reports_reachable(monkeypatch):
    from app.services import notification_health

    monkeypatch.setenv("RESEND_API_KEY", "re_test_key")
    monkeypatch.setenv("RESEND_FROM_EMAIL", "alerts@example.com")

    report = notification_health.check()

    assert report["email"]["configured"] is True
    assert report["email"]["provider"] == "resend"
    assert report["can_notify"] is True


def test_report_never_contains_secret_values(monkeypatch):
    """
    This endpoint exists to be read while debugging, sometimes pasted into a
    chat window. It reports which channels are configured, never the keys.
    """
    from app.services import notification_health

    monkeypatch.setenv("RESEND_API_KEY", "re_super_secret_value")
    monkeypatch.setenv("TWILIO_AUTH_TOKEN", "twilio_super_secret_value")

    blob = repr(notification_health.check())

    assert "re_super_secret_value" not in blob
    assert "twilio_super_secret_value" not in blob
