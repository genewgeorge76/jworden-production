def _quote_payload(**overrides):
    payload = {
        'name': 'Test User',
        'email': 'test@example.com',
        'phone': '5551234567',
        'service_type': 'paving',
        'property_type': 'residential',
        'urgency': 'within_1_week',
        'project_size_sqft': 2000,
        'address': '123 Main St',
        'message': 'Need quote soon',
    }
    payload.update(overrides)
    return payload


async def test_health_route(client):
    res = await client.get('/health')
    assert res.status_code == 200
    assert res.json()['status'] == 'ok'


async def test_quote_submission_and_crm_listing(client, auth_headers):
    res = await client.post('/api/v1/leads/quote', json=_quote_payload())
    assert res.status_code == 200
    body = res.json()
    assert body['status'] == 'received'
    assert body['lead_score'] in {'HOT', 'WARM', 'COOL'}

    crm = await client.get('/api/v1/crm/leads', headers=auth_headers)
    assert crm.status_code == 200
    data = crm.json()
    assert data['total'] >= 1
    assert any(l['email'] == 'test@example.com' for l in data['leads'])


async def test_proposal_generation_flow(client, auth_headers, monkeypatch, app_modules):
    _, dbmod = app_modules

    monkeypatch.setattr('app.routers.proposals.generate_proposal_text', lambda lead: 'Mock proposal text')
    monkeypatch.setattr('app.routers.proposals.generate_proposal_pdf', lambda lead: b'%PDF-1.4 mock')

    quote = await client.post('/api/v1/leads/quote', json=_quote_payload(email='proposal@example.com'))
    assert quote.status_code == 200

    from app.models import Lead

    with dbmod.SessionLocal() as db:
        lead = db.query(Lead).filter(Lead.email == 'proposal@example.com').first()
        assert lead is not None
        lead_id = lead.id

    gen = await client.post('/api/v1/proposals/generate', json={'lead_id': lead_id, 'include_pdf': True}, headers=auth_headers)
    assert gen.status_code == 200
    data = gen.json()
    assert data['proposal_text'] == 'Mock proposal text'
    assert data['proposal_id'] == lead_id
    assert data['pdf_b64']

    status = await client.get(f'/api/v1/payments/status/{lead_id}', headers=auth_headers)
    assert status.status_code == 200
    assert status.json()['lead_id'] == lead_id


# ── 51-state wiring tests ──────────────────────────────────────────────────────

async def test_quote_persists_validated_state_code(client, app_modules):
    """state_code is canonicalized to upper-case and persisted on the Lead row."""
    _, dbmod = app_modules
    res = await client.post(
        '/api/v1/leads/quote',
        json=_quote_payload(email='va@example.com', state_code='va'),
    )
    assert res.status_code == 200, res.text

    from app.models import Lead
    with dbmod.SessionLocal() as db:
        lead = db.query(Lead).filter(Lead.email == 'va@example.com').first()
        assert lead is not None
        assert lead.state_code == 'VA'


async def test_quote_rejects_unknown_state_code(client):
    """A syntactically valid (2-letter) but unknown state returns 422."""
    res = await client.post(
        '/api/v1/leads/quote',
        json=_quote_payload(email='zz@example.com', state_code='ZZ'),
    )
    assert res.status_code == 422
    assert 'ZZ' in res.text


async def test_estimate_endpoint_applies_state_multiplier(client):
    """CA pricing should run higher than VA pricing for the same job."""
    base = {
        'service_type': 'paving',
        'property_type': 'commercial',
        'project_size_sqft': 5000,
    }
    va = await client.post('/api/v1/leads/estimate', json={**base, 'state_code': 'VA'})
    ca = await client.post('/api/v1/leads/estimate', json={**base, 'state_code': 'CA'})
    assert va.status_code == 200 and ca.status_code == 200
    va_body, ca_body = va.json(), ca.json()
    assert va_body['estimate_available'] and ca_body['estimate_available']
    assert va_body['state_code'] == 'VA' and ca_body['state_code'] == 'CA'
    # CA labor + material premium must outpace VA for the same scope
    assert ca_body['high_usd'] > va_body['high_usd']


async def test_estimate_endpoint_rejects_unknown_state(client):
    res = await client.post(
        '/api/v1/leads/estimate',
        json={
            'service_type': 'paving',
            'property_type': 'commercial',
            'project_size_sqft': 5000,
            'state_code': 'ZZ',
        },
    )
    assert res.status_code == 422


async def test_lead_scorer_compliance_warning_for_unlicensed_state():
    """
    A licensed-required state outside Worden's active territory should
    surface a compliance_warning without changing the score band.
    """
    from app.services.lead_scorer import score_lead

    # CA: hasStateLicensing=True and not in WORDEN_ACTIVE_STATES
    flagged = score_lead({
        'project_size_sqft': 5000,
        'property_type': 'commercial',
        'urgency': 'within_1_week',
        'service_type': 'paving',
        'state_code': 'CA',
    })
    assert 'compliance_warning' in flagged
    assert 'CA' in flagged['compliance_warning']

    # VA: in WORDEN_ACTIVE_STATES → no warning
    clean = score_lead({
        'project_size_sqft': 5000,
        'property_type': 'commercial',
        'urgency': 'within_1_week',
        'service_type': 'paving',
        'state_code': 'VA',
    })
    assert 'compliance_warning' not in clean


def test_normalize_state_code_helper():
    """Single source of truth for state validation: 50 states + DC, case-insensitive."""
    from app.services.state_data import normalize_state_code
    assert normalize_state_code('va') == 'VA'
    assert normalize_state_code('  ca ') == 'CA'
    assert normalize_state_code('DC') == 'DC'
    assert normalize_state_code('ZZ') is None
    assert normalize_state_code('') is None
    assert normalize_state_code(None) is None

