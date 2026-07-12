"""End-to-end smoke tests — full pipeline in demo/mock mode (no real API keys)."""
import pytest
from fastapi.testclient import TestClient


def test_health(client: TestClient):
    resp = client.get('/health')
    assert resp.status_code == 200


def test_lead_create_to_retrieve(client: TestClient, authed: TestClient):
    """Create a lead via the public endpoint, retrieve it via the ops endpoint."""
    create = client.post('/api/v1/leads/contact', json={
        'name': 'Smoke Test User',
        'email': 'smoke@test.com',
        'service': 'paving',
        'state': 'VA',
    })
    assert create.status_code == 201
    lead_id = create.json()['id']

    retrieve = authed.get(f'/api/v1/leads/{lead_id}')
    assert retrieve.status_code == 200
    assert retrieve.json()['name'] == 'Smoke Test User'


def test_pricing_pipeline(authed: TestClient):
    """Services list → estimate → quick quote all respond correctly."""
    services = authed.get('/api/v1/pricing/services').json()['services']
    assert len(services) > 0

    service_name = services[0]['service']
    estimate = authed.post('/api/v1/pricing/estimate', json={
        'service_type': service_name,
        'project_size_sqft': 2000.0,
        'state_code': 'VA',
    })
    assert estimate.status_code == 200
    assert estimate.json()['low_usd'] > 0

    quick = authed.get(f'/api/v1/pricing/quick-quote?service={service_name}&sqft=2000&state=VA')
    assert quick.status_code == 200
    assert '$' in quick.json()['low_fmt']


def test_auth_flow(client: TestClient):
    """Issue a token, then verify it with the status endpoint."""
    token_resp = client.post('/api/v1/auth/token', json={'master_key': 'test-master-key'})
    assert token_resp.status_code == 200
    token = token_resp.json()['access_token']

    status_resp = client.get('/api/v1/auth/status', headers={'Authorization': f'Bearer {token}'})
    assert status_resp.json()['authenticated'] is True


def test_scan_campaign_full_pipeline(authed: TestClient):
    """Create → Run → Detail → Export: full mock pipeline with zero real API keys."""
    # 1. Create
    create = authed.post('/api/v1/scan-campaigns/', json={
        'zip_code': '23220',
        'label': 'Smoke Test Campaign',
        'max_properties': 5,
        'auto_mail': False,
    })
    assert create.status_code == 201
    cid = create.json()['campaign']['id']

    # 2. Run (synchronous fallback — Celery unavailable in tests)
    run = authed.post(f'/api/v1/scan-campaigns/{cid}/run')
    assert run.status_code == 200
    assert run.json()['status'] == 'done'

    # 3. Detail — properties scanned, results present
    detail = authed.get(f'/api/v1/scan-campaigns/{cid}')
    assert detail.status_code == 200
    campaign = detail.json()['campaign']
    properties = detail.json()['properties']
    assert campaign['status'] == 'done'
    assert campaign['scanned'] > 0
    assert len(properties) > 0

    # Validate property shape
    prop = properties[0]
    assert prop['address']
    result = prop['result']
    assert result is not None
    assert result['roof'] in ('good', 'fair', 'poor')
    assert result['overall_score'] >= 0
    assert result['estimate_low'] > 0

    # 4. Export — valid ZIP download
    import io, zipfile
    export = authed.get(f'/api/v1/scan-campaigns/{cid}/export')
    assert export.status_code == 200
    assert export.headers['content-type'] == 'application/zip'
    with zipfile.ZipFile(io.BytesIO(export.content)) as zf:
        names = zf.namelist()
    assert 'addresses.csv' in names
    assert any('mailers/' in n for n in names), 'Mailer HTMLs should be in the ZIP'


def test_security_missing_key_denied(client: TestClient):
    """Premium endpoints must reject requests with no master key."""
    assert client.post('/api/v1/pricing/estimate', json={'service_type': 'paving'}).status_code == 403
    assert client.post('/api/v1/scan-campaigns/', json={'zip_code': '23220'}).status_code == 403
    assert client.get('/api/v1/scan-campaigns/').status_code == 403


def test_security_wrong_key_denied(client: TestClient):
    """Wrong key must return 403, not 500."""
    headers = {'X-Master-Key': 'not-the-right-key'}
    assert client.post('/api/v1/pricing/estimate', json={'service_type': 'paving'}, headers=headers).status_code == 403
