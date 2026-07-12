"""Leads router — happy path + validation tests."""
import pytest
from fastapi.testclient import TestClient


def test_create_lead_happy_path(client: TestClient):
    resp = client.post('/api/v1/leads/contact', json={
        'name': 'Jane Smith',
        'email': 'jane@example.com',
        'phone': '555-0100',
        'service': 'paving',
        'city': 'Richmond',
        'state': 'VA',
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data['name'] == 'Jane Smith'
    assert data['status'] == 'new'
    assert data['id'].startswith('WEB-')


def test_create_lead_name_required(client: TestClient):
    resp = client.post('/api/v1/leads/contact', json={'email': 'x@x.com'})
    assert resp.status_code == 422


def test_create_lead_name_empty_string(client: TestClient):
    resp = client.post('/api/v1/leads/contact', json={'name': ''})
    assert resp.status_code == 422


def test_list_leads(authed: TestClient):
    authed.post('/api/v1/leads/contact', json={'name': 'Alice'})
    authed.post('/api/v1/leads/contact', json={'name': 'Bob'})
    resp = authed.get('/api/v1/leads/')
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_get_lead_not_found(authed: TestClient):
    resp = authed.get('/api/v1/leads/DOESNOTEXIST')
    assert resp.status_code == 404


def test_update_lead_status(authed: TestClient):
    create = authed.post('/api/v1/leads/contact', json={'name': 'Carol'})
    lead_id = create.json()['id']
    resp = authed.patch(f'/api/v1/leads/{lead_id}', json={'status': 'contacted'})
    assert resp.status_code == 200
    assert resp.json()['status'] == 'contacted'
