"""Scan campaign router — CRUD + pipeline smoke in mock mode."""
import pytest
from fastapi.testclient import TestClient

BASE = '/api/v1/scan-campaigns'


def test_create_campaign_requires_auth(client: TestClient):
    resp = client.post(BASE + '/', json={'zip_code': '23220'})
    assert resp.status_code == 403


def test_create_campaign_happy_path(authed: TestClient):
    resp = authed.post(BASE + '/', json={
        'zip_code': '23220',
        'label': 'Richmond Test',
        'max_properties': 10,
        'auto_mail': False,
    })
    assert resp.status_code == 201
    data = resp.json()['campaign']
    assert data['zip_code'] == '23220'
    assert data['label'] == 'Richmond Test'
    assert data['status'] == 'pending'
    assert data['id'] is not None


def test_create_campaign_default_label(authed: TestClient):
    resp = authed.post(BASE + '/', json={'zip_code': '90210'})
    assert resp.status_code == 201
    assert resp.json()['campaign']['label'] == 'Campaign 90210'


def test_list_campaigns_empty(authed: TestClient):
    resp = authed.get(BASE + '/')
    assert resp.status_code == 200
    assert resp.json() == {'campaigns': [], 'total': 0}


def test_list_campaigns_after_create(authed: TestClient):
    authed.post(BASE + '/', json={'zip_code': '23220'})
    authed.post(BASE + '/', json={'zip_code': '22301'})
    resp = authed.get(BASE + '/')
    assert resp.json()['total'] == 2


def test_get_campaign_not_found(authed: TestClient):
    resp = authed.get(BASE + '/9999')
    assert resp.status_code == 404


def test_get_campaign_detail(authed: TestClient):
    cid = authed.post(BASE + '/', json={'zip_code': '23220'}).json()['campaign']['id']
    resp = authed.get(f'{BASE}/{cid}')
    assert resp.status_code == 200
    assert resp.json()['campaign']['id'] == cid
    assert resp.json()['properties'] == []


def test_delete_campaign(authed: TestClient):
    cid = authed.post(BASE + '/', json={'zip_code': '23220'}).json()['campaign']['id']
    resp = authed.delete(f'{BASE}/{cid}')
    assert resp.status_code == 204
    assert authed.get(f'{BASE}/{cid}').status_code == 404


def test_delete_running_campaign_blocked(authed: TestClient):
    from app.database import Base
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.models import ScanCampaign

    # Create campaign then forcibly set it to running in the test DB
    cid = authed.post(BASE + '/', json={'zip_code': '23220'}).json()['campaign']['id']

    # Update status via the dependency-overridden DB
    from app.database import get_db
    from app.main import app as _app
    override = _app.dependency_overrides.get(get_db)
    if override:
        db = next(override())
        c = db.query(ScanCampaign).filter(ScanCampaign.id == cid).first()
        c.status = 'running'
        db.commit()
        db.close()

    resp = authed.delete(f'{BASE}/{cid}')
    assert resp.status_code == 409


def test_run_campaign_mock_mode(authed: TestClient):
    """Full pipeline runs synchronously in mock mode (no Celery, no real APIs)."""
    cid = authed.post(BASE + '/', json={
        'zip_code': '23220',
        'max_properties': 5,
        'auto_mail': False,
    }).json()['campaign']['id']

    resp = authed.post(f'{BASE}/{cid}/run')
    assert resp.status_code == 200
    data = resp.json()
    # Celery absent in test → synchronous fallback → status=done
    assert data['status'] == 'done'
    assert 'summary' in data


def test_run_already_done_blocked(authed: TestClient):
    cid = authed.post(BASE + '/', json={'zip_code': '23220'}).json()['campaign']['id']
    authed.post(f'{BASE}/{cid}/run')   # first run completes synchronously
    resp = authed.post(f'{BASE}/{cid}/run')
    assert resp.status_code == 409


def test_export_campaign(authed: TestClient):
    cid = authed.post(BASE + '/', json={'zip_code': '23220'}).json()['campaign']['id']
    authed.post(f'{BASE}/{cid}/run')
    resp = authed.get(f'{BASE}/{cid}/export')
    assert resp.status_code == 200
    assert resp.headers['content-type'] == 'application/zip'
    assert len(resp.content) > 0


def test_campaign_detail_after_run(authed: TestClient):
    """After a mock run, campaign detail should include scanned properties."""
    cid = authed.post(BASE + '/', json={
        'zip_code': '23220', 'max_properties': 5,
    }).json()['campaign']['id']
    authed.post(f'{BASE}/{cid}/run')
    detail = authed.get(f'{BASE}/{cid}').json()
    assert detail['campaign']['status'] == 'done'
    assert len(detail['properties']) > 0
    prop = detail['properties'][0]
    assert prop['address'] is not None
