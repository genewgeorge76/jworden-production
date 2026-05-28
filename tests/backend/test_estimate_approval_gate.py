"""
Tests for the human approval gate on outbound estimate sends.

Behavior under test:
  • POST /api/v1/proposals/{lead_id}/send no longer auto-emails. It stages
    the rendered estimate into HumanReviewQueue with decision_type='proposal_send'
    and returns status='pending_approval'.
  • POST /api/v1/review/queue/{id}/approve dispatches the staged email.
  • Setting ESTIMATE_REQUIRES_APPROVAL=false restores the legacy auto-send path.
"""
from __future__ import annotations


def _quote_payload(**overrides):
    payload = {
        'name': 'Approval Test',
        'email': 'approval@example.com',
        'phone': '5551239999',
        'service_type': 'paving',
        'property_type': 'residential',
        'urgency': 'within_1_month',
        'project_size_sqft': 3000,
        'address': '500 Approval Ln',
        'message': 'Estimate please',
    }
    payload.update(overrides)
    return payload


async def _create_lead(client, email='approval@example.com'):
    res = await client.post('/api/v1/leads/quote', json=_quote_payload(email=email))
    assert res.status_code == 200, res.text
    return res


def _get_lead_id(dbmod, email):
    from app.models import Lead
    with dbmod.SessionLocal() as db:
        lead = db.query(Lead).filter(Lead.email == email).first()
        assert lead is not None
        return lead.id


# ── 1. Send is gated by default ───────────────────────────────────────────────


async def test_send_proposal_stages_for_approval_by_default(
    client, auth_headers, monkeypatch, app_modules,
):
    """Default: /send returns pending_approval and creates a HumanReviewQueue row."""
    _, dbmod = app_modules

    monkeypatch.setattr('app.routers.proposals.generate_proposal_text',
                        lambda lead: 'Mock proposal text with $X pricing')
    monkeypatch.setattr('app.routers.proposals.generate_proposal_pdf',
                        lambda lead: b'%PDF-1.4 mock pdf bytes')
    monkeypatch.delenv('ESTIMATE_REQUIRES_APPROVAL', raising=False)
    monkeypatch.delenv('JWORDEN_DASHBOARD_PIN', raising=False)
    monkeypatch.delenv('ESTIMATE_APPROVAL_PIN', raising=False)

    # Critical: send_transactional_email must NOT be called by /send under approval gate.
    sends: list = []
    monkeypatch.setattr(
        'app.services.estimate_approval.send_transactional_email',
        lambda **kw: (sends.append(kw), True)[1],
    )

    await _create_lead(client, email='gate1@example.com')
    lead_id = _get_lead_id(dbmod, 'gate1@example.com')

    resp = await client.post(f'/api/v1/proposals/{lead_id}/send', headers=auth_headers)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body['status'] == 'pending_approval'
    assert body['recipient'] == 'gate1@example.com'
    assert body['lead_id'] == lead_id
    review_item_id = body['review_item_id']
    assert isinstance(review_item_id, int) and review_item_id > 0
    # No customer email may have been sent yet
    assert sends == [], f"send_transactional_email was called before approval: {sends}"

    # The queue should now hold the staged item
    from app.models import HumanReviewQueue
    with dbmod.SessionLocal() as db:
        item = db.get(HumanReviewQueue, review_item_id)
        assert item is not None
        assert item.decision_type == 'proposal_send'
        assert item.status == 'pending'
        assert 'gate1@example.com' in item.ai_answer  # payload serialized in
        assert 'Mock proposal text' in item.ai_answer


# ── 2. Approval dispatches the staged send ────────────────────────────────────


async def test_approve_dispatches_proposal_email(
    client, auth_headers, monkeypatch, app_modules,
):
    """Approving a staged proposal_send item triggers send_transactional_email."""
    _, dbmod = app_modules

    monkeypatch.setattr('app.routers.proposals.generate_proposal_text',
                        lambda lead: 'PROPOSAL BODY')
    monkeypatch.setattr('app.routers.proposals.generate_proposal_pdf',
                        lambda lead: b'%PDF mockpdf')
    monkeypatch.delenv('ESTIMATE_REQUIRES_APPROVAL', raising=False)
    monkeypatch.delenv('JWORDEN_DASHBOARD_PIN', raising=False)
    monkeypatch.delenv('ESTIMATE_APPROVAL_PIN', raising=False)

    sends: list = []
    def fake_send(**kw):
        sends.append(kw)
        return True
    monkeypatch.setattr('app.services.estimate_approval.send_transactional_email', fake_send)

    await _create_lead(client, email='gate2@example.com')
    lead_id = _get_lead_id(dbmod, 'gate2@example.com')

    staged = await client.post(f'/api/v1/proposals/{lead_id}/send', headers=auth_headers)
    assert staged.status_code == 200
    review_item_id = staged.json()['review_item_id']
    assert sends == []  # confirmed: not sent yet

    approve = await client.post(
        f'/api/v1/review/queue/{review_item_id}/approve',
        headers=auth_headers,
        json={'reviewer_notes': 'looks good — release'},
    )
    assert approve.status_code == 200, approve.text
    body = approve.json()
    assert body['status'] == 'approved'
    assert body.get('dispatch') == 'sent'

    # Exactly one email was sent, to the right recipient, with the PDF attachment
    assert len(sends) == 1
    sent = sends[0]
    assert sent['to_addresses'] == ['gate2@example.com']
    assert sent['attachment_name'].endswith('.pdf')
    assert sent['attachment_bytes'] == b'%PDF mockpdf'
    assert 'PROPOSAL BODY' in sent['html_body']

    # Item should now be marked approved + audit-noted
    from app.models import HumanReviewQueue
    with dbmod.SessionLocal() as db:
        item = db.get(HumanReviewQueue, review_item_id)
        assert item.status == 'approved'
        assert item.resolved_at is not None
        assert 'dispatch: sent' in (item.reviewer_note or '')


# ── 2b. Dashboard 4-digit PIN gate ────────────────────────────────────────────


async def test_approve_requires_correct_dashboard_pin(
    client, auth_headers, monkeypatch, app_modules,
):
    """When JWORDEN_DASHBOARD_PIN is set, approval requires the matching 4-digit PIN."""
    _, dbmod = app_modules
    monkeypatch.setattr('app.routers.proposals.generate_proposal_text', lambda lead: 'X')
    monkeypatch.setattr('app.routers.proposals.generate_proposal_pdf', lambda lead: b'%PDF X')
    monkeypatch.delenv('ESTIMATE_REQUIRES_APPROVAL', raising=False)
    monkeypatch.setenv('JWORDEN_DASHBOARD_PIN', '1947')

    sends: list = []
    monkeypatch.setattr(
        'app.services.estimate_approval.send_transactional_email',
        lambda **kw: sends.append(kw) or True,
    )

    await _create_lead(client, email='pin@example.com')
    lead_id = _get_lead_id(dbmod, 'pin@example.com')
    review_item_id = (await client.post(
        f'/api/v1/proposals/{lead_id}/send', headers=auth_headers)).json()['review_item_id']

    # Wrong PIN → 403
    bad = await client.post(
        f'/api/v1/review/queue/{review_item_id}/approve',
        headers=auth_headers, json={'pin': '0000'},
    )
    assert bad.status_code == 403
    assert sends == []

    # Missing PIN → 403
    missing = await client.post(
        f'/api/v1/review/queue/{review_item_id}/approve',
        headers=auth_headers, json={},
    )
    assert missing.status_code == 403
    assert sends == []

    # Non-4-digit PIN → 403
    bad_format = await client.post(
        f'/api/v1/review/queue/{review_item_id}/approve',
        headers=auth_headers, json={'pin': '19470'},
    )
    assert bad_format.status_code == 403
    assert sends == []

    # Correct PIN → approved + dispatched
    ok = await client.post(
        f'/api/v1/review/queue/{review_item_id}/approve',
        headers=auth_headers, json={'pin': '1947'},
    )
    assert ok.status_code == 200, ok.text
    assert ok.json()['status'] == 'approved'
    assert len(sends) == 1


async def test_legacy_pin_env_var_still_works(monkeypatch):
    """ESTIMATE_APPROVAL_PIN is still honored as a fallback."""
    from app.services.estimate_approval import pin_required, verify_pin
    monkeypatch.delenv('JWORDEN_DASHBOARD_PIN', raising=False)
    monkeypatch.setenv('ESTIMATE_APPROVAL_PIN', '4242')
    assert pin_required() is True
    assert verify_pin('4242') is True
    assert verify_pin('4243') is False


def test_pin_helpers_invalid_pin_format_in_env_means_no_pin(monkeypatch):
    """A non-4-digit env value silently disables the PIN gate (open)."""
    from app.services.estimate_approval import pin_required, verify_pin
    monkeypatch.delenv('ESTIMATE_APPROVAL_PIN', raising=False)
    monkeypatch.setenv('JWORDEN_DASHBOARD_PIN', 'abcd')
    assert pin_required() is False
    assert verify_pin(None) is True  # no gate


# ── 3. Reject does NOT dispatch ───────────────────────────────────────────────


async def test_reject_does_not_dispatch(
    client, auth_headers, monkeypatch, app_modules,
):
    _, dbmod = app_modules

    monkeypatch.setattr('app.routers.proposals.generate_proposal_text', lambda lead: 'X')
    monkeypatch.setattr('app.routers.proposals.generate_proposal_pdf', lambda lead: b'%PDF X')
    monkeypatch.delenv('ESTIMATE_REQUIRES_APPROVAL', raising=False)
    monkeypatch.delenv('JWORDEN_DASHBOARD_PIN', raising=False)
    monkeypatch.delenv('ESTIMATE_APPROVAL_PIN', raising=False)

    sends: list = []
    monkeypatch.setattr(
        'app.services.estimate_approval.send_transactional_email',
        lambda **kw: (sends.append(kw), True)[1],
    )

    await _create_lead(client, email='gate3@example.com')
    lead_id = _get_lead_id(dbmod, 'gate3@example.com')

    staged = await client.post(f'/api/v1/proposals/{lead_id}/send', headers=auth_headers)
    review_item_id = staged.json()['review_item_id']

    reject = await client.post(
        f'/api/v1/review/queue/{review_item_id}/reject',
        headers=auth_headers,
        json={'reviewer_notes': 'price is too low, redo'},
    )
    assert reject.status_code == 200
    assert reject.json()['status'] == 'rejected'
    assert sends == []  # never sent

    from app.models import HumanReviewQueue
    with dbmod.SessionLocal() as db:
        item = db.get(HumanReviewQueue, review_item_id)
        assert item.status == 'rejected'
        assert item.reviewer_note == 'price is too low, redo'


# ── 4. Auto-send override (kill switch) ───────────────────────────────────────


async def test_auto_send_override_when_approval_disabled(
    client, auth_headers, monkeypatch, app_modules,
):
    """ESTIMATE_REQUIRES_APPROVAL=false restores the legacy auto-send behavior."""
    _, _dbmod = app_modules

    monkeypatch.setattr('app.routers.proposals.generate_proposal_text', lambda lead: 'X')
    monkeypatch.setattr('app.routers.proposals.generate_proposal_pdf', lambda lead: b'%PDF X')
    monkeypatch.setenv('ESTIMATE_REQUIRES_APPROVAL', 'false')

    await _create_lead(client, email='gate4@example.com')
    lead_id = _get_lead_id(_dbmod, 'gate4@example.com')

    resp = await client.post(f'/api/v1/proposals/{lead_id}/send', headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()['status'] == 'queued'  # legacy auto-send response


# ── 5. Pure-unit tests for the approval helpers ───────────────────────────────


def test_estimate_requires_approval_default_true(monkeypatch):
    from app.services.estimate_approval import estimate_requires_approval
    monkeypatch.delenv('ESTIMATE_REQUIRES_APPROVAL', raising=False)
    assert estimate_requires_approval() is True


def test_estimate_requires_approval_can_be_disabled(monkeypatch):
    from app.services.estimate_approval import estimate_requires_approval
    for v in ('false', 'False', '0', 'no', 'OFF'):
        monkeypatch.setenv('ESTIMATE_REQUIRES_APPROVAL', v)
        assert estimate_requires_approval() is False, f"value {v!r} should disable"


def test_dispatch_approved_proposal_skips_non_proposal_items(monkeypatch):
    """The dispatcher must be a no-op for items that aren't proposal_send."""
    from app.services.estimate_approval import dispatch_approved_proposal

    class FakeItem:
        id = 1
        decision_type = 'lead_score'
        ai_answer = '{}'

    sends = []
    monkeypatch.setattr(
        'app.services.estimate_approval.send_transactional_email',
        lambda **kw: sends.append(kw) or True,
    )
    assert dispatch_approved_proposal(FakeItem()) is False
    assert sends == []


def test_dispatch_approved_proposal_skips_invalid_recipient(monkeypatch):
    from app.services.estimate_approval import dispatch_approved_proposal
    import json

    class FakeItem:
        id = 2
        decision_type = 'proposal_send'
        ai_answer = json.dumps({'recipient': 'not-an-email'})

    sends = []
    monkeypatch.setattr(
        'app.services.estimate_approval.send_transactional_email',
        lambda **kw: sends.append(kw) or True,
    )
    assert dispatch_approved_proposal(FakeItem()) is False
    assert sends == []
