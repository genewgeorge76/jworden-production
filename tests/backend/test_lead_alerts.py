"""
Whether anybody was actually told.

The notifier was fire-and-forget from every intake path: the router queued a
background task and returned 200. When the send failed — no provider
configured, a bad key, Twilio down — it went to the application log and nowhere
else. The form said thank you, the row was saved, and nobody was on the way.

That is the worst failure a lead pipeline can have, because the symptom is
silence and silence is also what success looks like from the outside. An
unconfigured pipeline is indistinguishable from a quiet week.

Two more things this covers:

  * social.py created Lead rows and called nothing at all;
  * email_sync.py called a DIFFERENT notifier reading a DIFFERENT environment
    variable (ADMIN_NOTIFY_EMAIL against NOTIFY_TO_EMAIL), email only, no SMS.
    Setting one variable and not the other meant half the pipeline was
    announced and half was silent, with nothing to say which half.
"""

import pytest

from app.services import lead_alerts, notifications


class _Row:
    """Stands in for a Lead or a ContactMessage."""

    def __init__(self, **kwargs):
        self.id = 1
        self.name = "Gene George"
        self.email = "someone@example.test"
        self.phone = "804-822-7715"
        self.service_type = "paving"
        self.property_type = "commercial"
        self.urgency = "asap"
        self.address = None
        self.state_code = "VA"
        self.message = "Parking lot needs resurfacing"
        self.source = "website"
        self.score_label = "HOT"
        self.score_priority = 1
        self.score_value = 92
        self.notified_at = None
        self.notify_delivered = None
        self.notify_failed = None
        self.notify_error = None
        self.__dict__.update(kwargs)


class _Session:
    def __init__(self, fail_commit=False):
        self.commits = 0
        self.rollbacks = 0
        self.fail_commit = fail_commit

    def commit(self):
        self.commits += 1
        if self.fail_commit:
            raise RuntimeError("database is away")

    def rollback(self):
        self.rollbacks += 1


# ── The receipt ─────────────────────────────────────────────────────────────

def test_a_delivered_alert_is_recorded_on_the_row(monkeypatch):
    monkeypatch.setattr(
        lead_alerts, "send_lead_notification",
        lambda data: {"attempted": ["email", "sms"], "delivered": ["email", "sms"],
                      "failed": [], "error": None},
    )
    row, db = _Row(), _Session()

    receipt = lead_alerts.notify_and_record(db, row)

    assert row.notified_at is not None
    assert row.notify_delivered == "email,sms"
    assert row.notify_failed is None
    assert receipt["delivered"] == ["email", "sms"]
    assert lead_alerts.was_delivered(row) is True


def test_a_failed_alert_is_recorded_rather_than_left_in_the_log(monkeypatch):
    """
    The whole point. Before this, the only trace of a failed alert was a log
    line nobody reads at the moment it matters.
    """
    monkeypatch.setattr(
        lead_alerts, "send_lead_notification",
        lambda data: {"attempted": ["email"], "delivered": [], "failed": ["email"],
                      "error": "no email provider accepted the message"},
    )
    row, db = _Row(), _Session()

    lead_alerts.notify_and_record(db, row)

    assert row.notify_delivered is None
    assert row.notify_failed == "email"
    assert "no email provider" in row.notify_error
    assert lead_alerts.was_delivered(row) is False


def test_a_notifier_that_raises_never_costs_the_lead(monkeypatch):
    """
    Losing the row because the SMS provider is down is strictly worse than
    losing the alert: an alert can be re-sent from a stored row, and a row that
    was never written is gone.
    """
    def explode(_data):
        raise ConnectionError("twilio unreachable")

    monkeypatch.setattr(lead_alerts, "send_lead_notification", explode)
    row, db = _Row(), _Session()

    receipt = lead_alerts.notify_and_record(db, row)

    assert receipt["failed"] == ["exception"]
    assert "ConnectionError" in row.notify_error
    assert row.notified_at is not None, "the attempt is still recorded"


def test_a_failed_receipt_write_does_not_raise_either(monkeypatch):
    """The receipt is a convenience; the lead is the asset."""
    monkeypatch.setattr(
        lead_alerts, "send_lead_notification",
        lambda data: {"attempted": ["email"], "delivered": ["email"], "failed": [], "error": None},
    )
    db = _Session(fail_commit=True)

    receipt = lead_alerts.notify_and_record(db, _Row())

    assert receipt["delivered"] == ["email"]
    assert db.rollbacks == 1


# ── What goes in the alert ──────────────────────────────────────────────────

def test_a_payload_is_built_from_a_row_that_has_no_dict_of_its_own():
    """social.py and email_sync.py both build a Lead directly."""
    payload = lead_alerts.payload_from(_Row())

    assert payload["name"] == "Gene George"
    assert payload["phone"] == "804-822-7715"
    assert payload["score"]["label"] == "HOT"
    assert payload["state_code"] == "VA"


def test_the_payload_carries_only_fields_the_notifier_formats():
    """
    A row picking up new columns later must not start posting internal state
    into an email — notify_error and notify_delivered among them.
    """
    payload = lead_alerts.payload_from(_Row(notify_error="twilio down", secret_token="abc"))

    for leaked in ("notify_error", "notify_delivered", "secret_token", "notified_at"):
        assert leaked not in payload


# ── The counts ──────────────────────────────────────────────────────────────

def test_the_summary_separates_a_failure_from_a_never_attempted():
    """
    Reported as three numbers rather than a percentage. "94% delivered" reads
    as healthy while the six per cent nobody was told about is the whole
    problem.
    """
    leads = [
        _Row(notified_at="now", notify_delivered="email"),
        _Row(notified_at="now", notify_delivered="email,sms"),
        _Row(notified_at="now", notify_delivered=None, notify_failed="email"),
        _Row(notified_at=None),
    ]

    summary = lead_alerts.summarise(leads)

    assert summary == {
        "leads": 4, "someone_was_told": 2, "alert_failed": 1, "never_attempted": 1,
    }
    assert "percent" not in summary and "rate" not in summary


# ── One notifier, every configured recipient ────────────────────────────────

def test_both_recipient_variables_are_honoured(monkeypatch):
    """
    There were two independent notifiers reading different variables:
    NOTIFY_TO_EMAIL here and ADMIN_NOTIFY_EMAIL in email_service. Leads from
    the web form used the first and leads from the mail sync the second, so
    setting only one meant half the pipeline was silent.
    """
    seen = {}

    monkeypatch.setenv("NOTIFY_TO_EMAIL", "office@example.test")
    monkeypatch.setenv("ADMIN_NOTIFY_EMAIL", "gene@example.test")
    monkeypatch.delenv("NOTIFY_TO_PHONE", raising=False)
    monkeypatch.setattr(
        notifications, "send_transactional_email",
        lambda **kw: seen.update(kw) or True,
    )

    notifications.send_lead_notification({"name": "Test", "score": {"label": "HOT"}})

    assert "office@example.test" in seen["to_addresses"]
    assert "gene@example.test" in seen["to_addresses"]
    assert len(seen["to_addresses"]) == len(set(seen["to_addresses"])), "deduplicated"


def test_no_configured_recipient_is_reported_as_its_own_condition(monkeypatch):
    """
    Nobody being asked is not the same as a delivery failure, and a pipeline
    with no channel configured should say so in those words.
    """
    monkeypatch.delenv("NOTIFY_TO_EMAIL", raising=False)
    monkeypatch.delenv("ADMIN_NOTIFY_EMAIL", raising=False)
    monkeypatch.delenv("NOTIFY_TO_PHONE", raising=False)
    monkeypatch.setattr(notifications, "send_transactional_email", lambda **kw: False)

    receipt = notifications.send_lead_notification({"name": "Test"})

    assert receipt["delivered"] == []
    assert receipt["error"]


def test_the_sms_sender_says_why_it_did_not_send(monkeypatch):
    """It used to return None and log. The caller cannot record what it is not told."""
    monkeypatch.delenv("TWILIO_ACCOUNT_SID", raising=False)
    monkeypatch.delenv("TWILIO_AUTH_TOKEN", raising=False)
    monkeypatch.delenv("TWILIO_FROM_NUMBER", raising=False)

    sent, reason = notifications._send_twilio_sms("hello", ["+15551234567"])

    assert sent is False
    assert reason == "twilio not configured"


# ── Every source is wired ───────────────────────────────────────────────────

@pytest.mark.parametrize(
    "module,path",
    [
        ("app/routers/leads.py", "notify_and_record"),
        ("app/routers/social.py", "notify_and_record"),
        ("app/services/email_sync.py", "notify_and_record"),
        ("app/routers/visualizer.py", "send_lead_notification"),
        ("app/services/voice_intake.py", "send_lead_notification"),
    ],
)
def test_every_path_that_creates_a_lead_tells_somebody(module, path):
    """
    A structural check. social.py created Lead rows and called nothing at all;
    a new intake path added next year would be just as easy to forget.
    """
    from pathlib import Path

    source = Path(module).read_text(encoding="utf-8")
    assert "Lead(" in source, f"{module} no longer creates leads — update this test"
    assert path in source, f"{module} creates a lead and notifies nobody"
