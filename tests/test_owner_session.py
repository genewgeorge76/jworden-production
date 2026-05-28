import os
from fastapi.testclient import TestClient

os.environ.setdefault('OWNER_TOKEN', 'testtoken')

from app.main import app


def test_unlock_owner_session():
    client = TestClient(app)
    resp = client.post('/api/v1/admin/owner/unlock', json={'owner_token': 'testtoken', 'pin': '1234'})
    assert resp.status_code == 200
    body = resp.json()
    assert body.get('ok') is True
    assert 'session_id' in body
