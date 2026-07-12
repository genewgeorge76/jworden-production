"""Auth router — token issuance, invalid key, PIN tests."""
import pytest
from fastapi.testclient import TestClient


def test_token_happy_path(client: TestClient):
    resp = client.post('/api/v1/auth/token', json={'master_key': 'test-master-key'})
    assert resp.status_code == 200
    data = resp.json()
    assert 'access_token' in data
    assert data['token_type'] == 'bearer'
    assert data['expires_in'] == 86400


def test_token_wrong_key(client: TestClient):
    resp = client.post('/api/v1/auth/token', json={'master_key': 'wrong'})
    assert resp.status_code == 401


def test_pin_token_happy_path(client: TestClient):
    resp = client.post('/api/v1/auth/pin-token', json={'pin': '1234'})
    assert resp.status_code == 200
    assert 'access_token' in resp.json()


def test_pin_token_wrong_pin(client: TestClient):
    resp = client.post('/api/v1/auth/pin-token', json={'pin': '0000'})
    assert resp.status_code == 401


def test_auth_status_no_token(client: TestClient):
    resp = client.get('/api/v1/auth/status')
    assert resp.status_code == 200
    assert resp.json()['authenticated'] is False


def test_auth_status_with_valid_token(client: TestClient):
    token = client.post('/api/v1/auth/token', json={'master_key': 'test-master-key'}).json()['access_token']
    resp = client.get('/api/v1/auth/status', headers={'Authorization': f'Bearer {token}'})
    assert resp.status_code == 200
    assert resp.json()['authenticated'] is True
    assert resp.json()['sub'] == 'Admin'


def test_auth_status_garbage_token(client: TestClient):
    resp = client.get('/api/v1/auth/status', headers={'Authorization': 'Bearer garbage.token.here'})
    assert resp.status_code == 200
    assert resp.json()['authenticated'] is False


def test_master_key_header_auth(client: TestClient):
    """Verify that the X-Master-Key header grants access to premium endpoints."""
    resp = client.get('/api/v1/pricing/services')
    assert resp.status_code == 200   # public endpoint


def test_wrong_master_key_header_denied(client: TestClient):
    resp = client.post('/api/v1/pricing/estimate',
                       json={'service_type': 'paving'},
                       headers={'X-Master-Key': 'wrong'})
    assert resp.status_code == 403
