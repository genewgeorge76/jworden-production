"""Wave 9 — auth hardening (M2/M3/M4), payments money-path, monitoring."""
import hashlib
import hmac as hmac_mod
import json
import time

import pyotp
from fastapi.testclient import TestClient

from app import main
from tests.conftest import MASTER_KEY


# ── M2: JWT revocation ────────────────────────────────────────────────────────

class TestTokenRevocation:
    def _get_token(self, client: TestClient) -> str:
        resp = client.post('/api/v1/auth/token', json={'master_key': MASTER_KEY})
        assert resp.status_code == 200
        return resp.json()['access_token']

    def test_revoked_token_fails_status(self, client: TestClient):
        token = self._get_token(client)
        headers = {'Authorization': f'Bearer {token}'}

        assert client.get('/api/v1/auth/status', headers=headers).json()['authenticated'] is True

        revoke = client.post('/api/v1/auth/revoke', json={}, headers=headers)
        assert revoke.status_code == 200
        assert revoke.json()['revoked'] is True

        after = client.get('/api/v1/auth/status', headers=headers).json()
        assert after['authenticated'] is False
        assert after['reason'] == 'revoked'

    def test_revoke_is_idempotent(self, client: TestClient):
        token = self._get_token(client)
        headers = {'Authorization': f'Bearer {token}'}
        first = client.post('/api/v1/auth/revoke', json={}, headers=headers)
        second = client.post('/api/v1/auth/revoke', json={}, headers=headers)
        assert first.status_code == 200 and second.status_code == 200
        assert first.json()['jti'] == second.json()['jti']

    def test_revoke_without_token_400(self, client: TestClient):
        resp = client.post('/api/v1/auth/revoke', json={})
        assert resp.status_code == 400

    def test_revoke_garbage_token_401(self, client: TestClient):
        resp = client.post('/api/v1/auth/revoke', json={'token': 'not-a-jwt'})
        assert resp.status_code == 401

    def test_other_tokens_unaffected(self, client: TestClient):
        t1 = self._get_token(client)
        t2 = self._get_token(client)
        client.post('/api/v1/auth/revoke', json={}, headers={'Authorization': f'Bearer {t1}'})
        still_ok = client.get('/api/v1/auth/status', headers={'Authorization': f'Bearer {t2}'})
        assert still_ok.json()['authenticated'] is True


# ── M4: 2FA enforcement on token issuance ─────────────────────────────────────

class TestTwoFactorEnforcement:
    def _enroll_2fa(self, authed: TestClient) -> str:
        setup = authed.post('/api/v1/admin/2fa/setup?username=admin')
        assert setup.status_code == 200
        secret = setup.json()['secret']
        code = pyotp.TOTP(secret).now()
        verify = authed.post('/api/v1/admin/2fa/verify', json={'username': 'admin', 'token': code})
        assert verify.status_code == 200
        return secret

    def test_no_2fa_enrolled_token_works_without_code(self, client: TestClient):
        resp = client.post('/api/v1/auth/token', json={'master_key': MASTER_KEY})
        assert resp.status_code == 200

    def test_2fa_enrolled_requires_code(self, client: TestClient, authed: TestClient):
        self._enroll_2fa(authed)
        resp = client.post('/api/v1/auth/token', json={'master_key': MASTER_KEY})
        assert resp.status_code == 401
        assert '2FA' in resp.json()['detail']

    def test_2fa_enrolled_valid_code_succeeds(self, client: TestClient, authed: TestClient):
        secret = self._enroll_2fa(authed)
        resp = client.post('/api/v1/auth/token', json={
            'master_key': MASTER_KEY,
            'totp_code': pyotp.TOTP(secret).now(),
        })
        assert resp.status_code == 200
        assert 'access_token' in resp.json()

    def test_2fa_enrolled_wrong_code_fails(self, client: TestClient, authed: TestClient):
        self._enroll_2fa(authed)
        resp = client.post('/api/v1/auth/token', json={
            'master_key': MASTER_KEY, 'totp_code': '000000',
        })
        assert resp.status_code == 401


# ── M3: portal magic link ─────────────────────────────────────────────────────

class TestPortalMagicLink:
    def _make_customer(self, authed: TestClient, email: str = 'client@example.com') -> int:
        resp = authed.post('/api/v1/customers/', json={'name': 'Portal Client', 'email': email})
        assert resp.status_code in (200, 201)
        return resp.json()['id']

    def test_dev_mode_returns_token_directly(self, client: TestClient, authed: TestClient):
        self._make_customer(authed)
        resp = client.post('/api/v1/portal/auth', json={'email': 'client@example.com'})
        assert resp.status_code == 200
        assert 'access_token' in resp.json()

    def test_unknown_email_generic_response(self, client: TestClient):
        resp = client.post('/api/v1/portal/auth', json={'email': 'nobody@example.com'})
        assert resp.status_code == 200
        assert 'access_token' not in resp.json()

    def test_production_without_sendgrid_503(self, client: TestClient, authed: TestClient, monkeypatch):
        self._make_customer(authed)
        monkeypatch.setattr(main.settings, 'environment', 'production')
        monkeypatch.setattr(main.settings, 'sendgrid_api_key', '')
        resp = client.post('/api/v1/portal/auth', json={'email': 'client@example.com'})
        assert resp.status_code == 503

    def test_production_sends_email_never_token(self, client: TestClient, authed: TestClient, monkeypatch):
        self._make_customer(authed)
        monkeypatch.setattr(main.settings, 'environment', 'production')
        monkeypatch.setattr(main.settings, 'sendgrid_api_key', 'SG.test-key')
        sent = {}

        from app.routers import client_portal

        def fake_send(to_email, subject, html_content, plain_text=None):
            sent['to'] = to_email
            sent['html'] = html_content
            return True

        monkeypatch.setattr(client_portal, 'send_email', fake_send)
        resp = client.post('/api/v1/portal/auth', json={'email': 'client@example.com'})
        assert resp.status_code == 200
        assert 'access_token' not in resp.json()
        assert sent['to'] == 'client@example.com'
        assert 'token=' in sent['html']

    def test_revoked_portal_token_rejected(self, client: TestClient, authed: TestClient):
        self._make_customer(authed)
        token = client.post('/api/v1/portal/auth', json={'email': 'client@example.com'}).json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}
        assert client.get('/api/v1/portal/me', headers=headers).status_code == 200
        client.post('/api/v1/auth/revoke', json={'token': token})
        assert client.get('/api/v1/portal/me', headers=headers).status_code == 401


# ── Payments money path ───────────────────────────────────────────────────────

class TestPaymentsMoneyPath:
    def _lead_with_value(self, authed: TestClient, value: float = 10_000.0) -> str:
        lead = authed.post('/api/v1/leads/contact', json={'name': 'Payer', 'service': 'paving'}).json()
        patched = authed.patch(f"/api/v1/leads/{lead['id']}", json={'estimated_value': value})
        assert patched.status_code == 200
        return lead['id']

    def test_checkout_requires_auth(self, client: TestClient):
        resp = client.post('/api/v1/payments/checkout-session', json={
            'lead_id': 'WEB-1', 'success_url': 'https://x/s', 'cancel_url': 'https://x/c',
        })
        assert resp.status_code in (401, 403)

    def test_checkout_lead_not_found(self, authed: TestClient):
        resp = authed.post('/api/v1/payments/checkout-session', json={
            'lead_id': 'WEB-999', 'success_url': 'https://x/s', 'cancel_url': 'https://x/c',
        })
        assert resp.status_code == 404

    def test_checkout_requires_estimated_value(self, authed: TestClient):
        lead = authed.post('/api/v1/leads/contact', json={'name': 'No Value'}).json()
        resp = authed.post('/api/v1/payments/checkout-session', json={
            'lead_id': lead['id'], 'success_url': 'https://x/s', 'cancel_url': 'https://x/c',
        })
        assert resp.status_code == 422

    def test_checkout_demo_mode_creates_pending_txn(self, authed: TestClient):
        lead_id = self._lead_with_value(authed)
        resp = authed.post('/api/v1/payments/checkout-session', json={
            'lead_id': lead_id, 'success_url': 'https://x/s', 'cancel_url': 'https://x/c',
        })
        assert resp.status_code == 200
        body = resp.json()
        assert body['status'] == 'pending'
        assert body['amount_usd'] == 2000.0  # 20% of 10k
        status = authed.get(f'/api/v1/payments/status/{lead_id}')
        assert status.json()['status'] == 'pending'

    def test_webhook_unconfigured_501(self, client: TestClient):
        resp = client.post('/api/v1/payments/webhook', content=b'{}')
        assert resp.status_code == 501

    def test_webhook_bad_signature_400(self, client: TestClient, monkeypatch):
        monkeypatch.setattr(main.settings, 'stripe_webhook_secret', 'whsec_test')
        monkeypatch.setattr(main.settings, 'stripe_secret_key', 'sk_test_x')
        resp = client.post(
            '/api/v1/payments/webhook',
            content=b'{}',
            headers={'stripe-signature': 't=1,v1=bad'},
        )
        assert resp.status_code == 400

    def test_webhook_valid_signature_marks_paid(self, client: TestClient, authed: TestClient, monkeypatch):
        # Create the checkout in demo mode (no Stripe key) so no real API call happens,
        # THEN configure the webhook secret for signature verification.
        lead_id = self._lead_with_value(authed)
        checkout = authed.post('/api/v1/payments/checkout-session', json={
            'lead_id': lead_id, 'success_url': 'https://x/s', 'cancel_url': 'https://x/c',
        }).json()
        session_id = f'mock_cs_{lead_id}'
        assert checkout['status'] == 'pending'

        secret = 'whsec_test_secret'
        monkeypatch.setattr(main.settings, 'stripe_webhook_secret', secret)
        monkeypatch.setattr(main.settings, 'stripe_secret_key', 'sk_test_x')

        payload = json.dumps({
            'id': 'evt_test', 'object': 'event', 'type': 'checkout.session.completed',
            'data': {'object': {'id': session_id, 'payment_intent': 'pi_test_123'}},
            'api_version': '2024-06-20', 'created': int(time.time()),
        })
        ts = int(time.time())
        signed = hmac_mod.new(
            secret.encode(), f'{ts}.{payload}'.encode(), hashlib.sha256,
        ).hexdigest()

        resp = client.post(
            '/api/v1/payments/webhook',
            content=payload.encode(),
            headers={'stripe-signature': f't={ts},v1={signed}'},
        )
        assert resp.status_code == 200

        status = authed.get(f'/api/v1/payments/status/{lead_id}').json()
        assert status['status'] == 'paid'


# ── Monitoring ────────────────────────────────────────────────────────────────

class TestMonitoring:
    def test_status_requires_auth(self, client: TestClient):
        assert client.get('/api/v1/monitoring/status').status_code in (401, 403)

    def test_status_reports_health(self, authed: TestClient):
        resp = authed.get('/api/v1/monitoring/status')
        assert resp.status_code == 200
        body = resp.json()
        assert body['database']['ok'] is True
        assert 'providers_configured' in body
        assert body['uptime_seconds'] >= 0

    def test_heartbeat_collects_vitals(self, authed: TestClient):
        authed.post('/api/v1/leads/contact', json={'name': 'Heartbeat Lead'})
        resp = authed.post('/api/v1/monitoring/heartbeat')
        assert resp.status_code == 200
        body = resp.json()
        assert body['leads_24h'] >= 1
        assert body['email_sent'] is False  # no heartbeat_email configured in tests
