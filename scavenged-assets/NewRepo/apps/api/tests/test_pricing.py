"""Pricing router + engine tests."""
import pytest
from fastapi.testclient import TestClient


def test_services_list_public(client: TestClient):
    resp = client.get('/api/v1/pricing/services')
    assert resp.status_code == 200
    services = resp.json()['services']
    names = {s['service'] for s in services}
    assert 'paving' in names
    assert 'sealcoating' in names
    assert 'crack_filling' in names


def test_state_multiplier_va(client: TestClient):
    resp = client.get('/api/v1/pricing/state-multiplier/VA')
    assert resp.status_code == 200
    data = resp.json()
    assert data['state_code'] == 'VA'
    assert data['multiplier'] == 1.08
    assert data['tier'] == 'medium'


def test_state_multiplier_ca_high_cost(client: TestClient):
    resp = client.get('/api/v1/pricing/state-multiplier/CA')
    assert resp.status_code == 200
    assert resp.json()['tier'] == 'high'


def test_estimate_requires_master_key(client: TestClient):
    resp = client.post('/api/v1/pricing/estimate', json={
        'service_type': 'paving',
        'project_size_sqft': 1000.0,
        'state_code': 'VA',
    })
    assert resp.status_code == 403


def test_estimate_happy_path(authed: TestClient):
    resp = authed.post('/api/v1/pricing/estimate', json={
        'service_type': 'paving',
        'property_type': 'residential',
        'project_size_sqft': 1000.0,
        'state_code': 'VA',
    })
    assert resp.status_code == 200
    data = resp.json()
    assert 'low_usd' in data
    assert 'high_usd' in data
    assert data['low_usd'] <= data['high_usd']
    assert data['low_usd'] > 0


def test_estimate_unknown_service(authed: TestClient):
    resp = authed.post('/api/v1/pricing/estimate', json={
        'service_type': 'moon_paving',
        'project_size_sqft': 500.0,
        'state_code': 'VA',
    })
    assert resp.status_code == 200
    assert 'error' in resp.json()


def test_estimate_commercial_lower_rate(authed: TestClient):
    res_resp = authed.post('/api/v1/pricing/estimate', json={
        'service_type': 'paving', 'property_type': 'residential',
        'project_size_sqft': 5000.0, 'state_code': 'VA',
    })
    com_resp = authed.post('/api/v1/pricing/estimate', json={
        'service_type': 'paving', 'property_type': 'commercial',
        'project_size_sqft': 5000.0, 'state_code': 'VA',
    })
    assert com_resp.json()['low_usd'] < res_resp.json()['low_usd']


def test_quick_quote_public(client: TestClient):
    resp = client.get('/api/v1/pricing/quick-quote?service=sealcoating&sqft=2000&state=VA')
    assert resp.status_code == 200
    data = resp.json()
    assert 'low_fmt' in data
    assert '$' in data['low_fmt']


def test_mobilization_floor_applied(authed: TestClient):
    """Tiny jobs should hit the minimum floor ($300 low / $600 high)."""
    resp = authed.post('/api/v1/pricing/estimate', json={
        'service_type': 'sealcoating', 'project_size_sqft': 1.0, 'state_code': 'VA',
    })
    data = resp.json()
    assert data['low_usd'] >= 300
    assert data['high_usd'] >= 600
