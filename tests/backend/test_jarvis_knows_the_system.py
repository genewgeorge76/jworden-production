"""
Jarvis's self-knowledge, and its memory.

Two gaps this pins shut.

The prompt asserted "a library of 162 specialized AI engines". The registry
holds 109 and 23 of those are real, so the model would quote 162 to a customer
with total confidence. A number written into a prompt stops being true and the
model cannot notice.

And Jarvis had nowhere to record an issue or a reminder. Asked to note either,
it could only answer as though it had — short memory holds a few turns of one
session and nothing survives a restart.
"""

import pytest

from app.services import jarvis, jarvis_inventory, jarvis_notes


OWNER = "JWORDEN_HQ"
CUSTOMER = "a-customer-tenant"


@pytest.fixture()
def db_session(app_modules):
    _, dbmod = app_modules
    session = dbmod.SessionLocal()
    try:
        yield session
    finally:
        session.close()


# ── The prompt tells the truth about the ability library ────────────────────

def test_the_prompt_no_longer_claims_162_engines():
    assert "162" not in jarvis.JARVIS_SYSTEM_PROMPT


def test_the_ability_count_in_the_prompt_is_measured():
    from app.services.os_ability_service import _load_registry

    registry = _load_registry()
    implemented = sum(1 for e in registry if e.get("implemented"))

    assert f"{len(registry)} registered abilities" in jarvis._ABILITY_SUMMARY
    assert f"{implemented} are really implemented" in jarvis._ABILITY_SUMMARY
    assert f"{len(registry) - implemented} are gated" in jarvis._ABILITY_SUMMARY


def test_the_prompt_carries_the_worden_standards():
    """
    Asked in production what compaction standard the Worden Standard requires,
    Jarvis said it could not answer without risking making up numbers. Correct
    behaviour, and a gap: the figures are in this repository and the model had
    never seen them.
    """
    prompt = jarvis.JARVIS_SYSTEM_PROMPT
    assert "96% Marshall Unit Weight" in prompt
    assert "VDOT Section 315" in prompt
    assert "$9 per ton" in prompt
    assert "Zero-Downtime DOT Medical" in prompt


def test_the_prompt_still_forbids_inventing_every_other_number():
    """The standards are stated as fact; nothing else may be."""
    assert "must come from a tool call or from the operator" in jarvis.JARVIS_SYSTEM_PROMPT


# ── system_inventory ────────────────────────────────────────────────────────

def test_inventory_counts_abilities_from_the_registry(db_session):
    snapshot = jarvis_inventory.snapshot(db_session, tenant_id=OWNER)
    abilities = snapshot["abilities"]

    from app.services.os_ability_service import _load_registry

    registry = _load_registry()
    assert abilities["registered"] == len(registry)
    assert abilities["implemented"] + abilities["gated"] == abilities["registered"]


def test_the_operator_sees_the_platform(db_session):
    snapshot = jarvis_inventory.snapshot(db_session, tenant_id=OWNER)
    assert snapshot["viewer"] == "operator"
    for section in ("api", "providers", "tenancy", "backups"):
        assert section in snapshot


def test_a_customer_does_not_see_the_platform(db_session):
    """
    The provider list, the tenant roster and the backup destination describe
    the platform a customer rents, not the business they run on it.
    """
    snapshot = jarvis_inventory.snapshot(db_session, tenant_id=CUSTOMER)
    assert snapshot["viewer"] == "customer"
    for section in ("providers", "tenancy", "backups", "api"):
        assert section not in snapshot
    assert snapshot["account"]["tenant_id"] == CUSTOMER


def test_inventory_never_returns_a_secret_value(db_session, monkeypatch):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-a-real-looking-secret-value")
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_live_another_real_looking_one")

    blob = repr(jarvis_inventory.snapshot(db_session, tenant_id=OWNER))
    assert "sk-ant-a-real-looking-secret-value" not in blob
    assert "sk_live_another_real_looking_one" not in blob


def test_a_placeholder_key_does_not_count_as_configured(db_session, monkeypatch):
    """
    Counting "sk_test_mock" as Stripe being ready is exactly how checkout came
    to fabricate a sale.
    """
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_mock")
    providers = jarvis_inventory.snapshot(db_session, tenant_id=OWNER)["providers"]
    assert "stripe" in providers["missing"]
    assert "stripe" not in providers["configured"]


# ── Issues and reminders ────────────────────────────────────────────────────

def test_an_issue_survives_the_conversation(db_session):
    created = jarvis_notes.record(
        db_session,
        tenant_id=OWNER,
        kind=jarvis_notes.KIND_ISSUE,
        title="Sealcoat estimator rounds tonnage down",
        detail="Reported on a 12,000 sq ft lot.",
        severity="high",
    )
    assert created["ok"] is True

    found = jarvis_notes.listing(db_session, tenant_id=OWNER, kind="issue")
    assert any(n["id"] == created["id"] for n in found["notes"])


def test_a_reminder_without_a_time_is_refused(db_session):
    """A reminder nobody will ever be shown is worse than a refusal."""
    result = jarvis_notes.record(
        db_session,
        tenant_id=OWNER,
        kind=jarvis_notes.KIND_REMINDER,
        title="Chase the Fairfax bid",
    )
    assert result["ok"] is False
    assert "due_in_minutes" in result["error"]


def test_a_relative_reminder_works_without_the_model_knowing_the_time(db_session):
    result = jarvis_notes.record(
        db_session,
        tenant_id=OWNER,
        kind=jarvis_notes.KIND_REMINDER,
        title="Call the plant about Monday's mix",
        due_in_minutes=120,
    )
    assert result["ok"] is True
    assert result["due_at"] is not None


def test_a_reminder_cannot_be_due_in_the_past(db_session):
    result = jarvis_notes.record(
        db_session,
        tenant_id=OWNER,
        kind=jarvis_notes.KIND_REMINDER,
        title="Yesterday",
        due_in_minutes=-30,
    )
    assert result["ok"] is False


def test_an_absurd_due_date_is_refused(db_session):
    """A model computing minutes from a vague phrase can be off by orders of magnitude."""
    result = jarvis_notes.record(
        db_session,
        tenant_id=OWNER,
        kind=jarvis_notes.KIND_REMINDER,
        title="In nine hundred years",
        due_in_minutes=60 * 24 * 365 * 900,
    )
    assert result["ok"] is False


def test_due_soonest_first(db_session):
    jarvis_notes.record(
        db_session, tenant_id=OWNER, kind=jarvis_notes.KIND_REMINDER,
        title="Later", due_in_minutes=600,
    )
    jarvis_notes.record(
        db_session, tenant_id=OWNER, kind=jarvis_notes.KIND_REMINDER,
        title="Sooner", due_in_minutes=10,
    )
    notes = jarvis_notes.listing(db_session, tenant_id=OWNER, kind="reminder")["notes"]
    assert notes[0]["title"] == "Sooner"


def test_one_tenant_cannot_read_or_close_anothers_notes(db_session):
    mine = jarvis_notes.record(
        db_session, tenant_id=CUSTOMER, kind=jarvis_notes.KIND_ISSUE, title="Private problem",
    )

    other = jarvis_notes.listing(db_session, tenant_id="a-different-tenant", kind="issue")
    assert all(n["id"] != mine["id"] for n in other["notes"])

    blocked = jarvis_notes.set_status(
        db_session, tenant_id="a-different-tenant", note_id=mine["id"], status="done"
    )
    assert blocked["ok"] is False


def test_closing_a_note_records_when(db_session):
    created = jarvis_notes.record(
        db_session, tenant_id=OWNER, kind=jarvis_notes.KIND_ISSUE, title="Fixed since",
    )
    closed = jarvis_notes.set_status(
        db_session, tenant_id=OWNER, note_id=created["id"], status="done"
    )
    assert closed["status"] == "done"
    assert closed["resolved_at"] is not None

    still_open = jarvis_notes.listing(db_session, tenant_id=OWNER, status="open")
    assert all(n["id"] != created["id"] for n in still_open["notes"])


# ── Role gating ─────────────────────────────────────────────────────────────

def test_an_anonymous_visitor_cannot_write_notes_or_read_the_inventory():
    public = jarvis._ROLE_TOOLS[jarvis.ROLE_PUBLIC_CONCIERGE]
    for tool in ("system_inventory", "report_issue", "create_reminder", "close_note"):
        assert tool not in public


def test_a_signed_in_operator_has_all_of_them():
    staff = jarvis._ROLE_TOOLS[jarvis.ROLE_STAFF_OPERATOR]
    for tool in ("system_inventory", "report_issue", "create_reminder", "list_notes", "close_note"):
        assert tool in staff


@pytest.mark.anyio
async def test_the_dispatcher_refuses_a_tool_the_role_lacks():
    result = await jarvis._run_tool(
        "report_issue", {"title": "x"}, role=jarvis.ROLE_PUBLIC_CONCIERGE
    )
    assert result["ok"] is False
    assert "Role policy" in result["error"]


# ── Every lane, not just the one that was edited ────────────────────────────

def test_the_standards_reach_the_conversational_lane():
    """
    _ask_chat_brain builds its own system prompt and does not include
    JARVIS_SYSTEM_PROMPT, so adding the standards there left this lane without
    them — and this is the lane that answers most conversation.

    In production, asked what compaction standard the Worden Standard requires,
    Jarvis answered that it did not have it on hand. The ops lane knew; the
    conversational one had never been told.
    """
    import inspect

    source = inspect.getsource(jarvis._ask_chat_brain)
    assert "WORDEN_STANDARDS" in source


def test_every_lane_that_builds_its_own_prompt_carries_the_standards():
    """
    The general form of the bug, so a fourth lane cannot be added without them.

    A lane is any coroutine that assembles a `system` string and calls the
    router. Each one either composes JARVIS_SYSTEM_PROMPT or names
    WORDEN_STANDARDS directly; a lane doing neither answers as though the
    company had no standards.
    """
    import inspect

    lanes = [
        jarvis._ask_fast_ops_brain,
        jarvis._ask_chat_brain,
        jarvis._ask_claude_internal,
    ]

    missing = []
    for lane in lanes:
        source = inspect.getsource(lane)
        if "system" not in source:
            continue
        if "JARVIS_SYSTEM_PROMPT" not in source and "WORDEN_STANDARDS" not in source:
            missing.append(lane.__name__)

    assert not missing, (
        "these lanes build a system prompt carrying neither the standards nor "
        f"the prompt that contains them: {missing}"
    )


def test_the_standards_block_states_all_four():
    """The four are non-negotiable, so the block is asserted whole."""
    for fact in (
        "96% Marshall Unit Weight",
        "VDOT Section 315",
        "$9 per ton",
        "Zero-Downtime DOT Medical",
    ):
        assert fact in jarvis.WORDEN_STANDARDS, fact
