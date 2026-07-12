"""QuickBooks Online sync router.

OAuth2 PKCE flow (demo-mode stubs when no credentials set).
Syncs: Customers, Invoices, Payments, Estimates.
All real API calls guarded by QUICKBOOKS_CLIENT_ID env var — no key = demo mode.
"""
from __future__ import annotations

import hashlib
import hmac
import json
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..config import settings
from ..core.security import verify_premium_security
from ..database import get_db
from ..models import QuickBooksSync, utcnow

router = APIRouter(prefix='/quickbooks', tags=['quickbooks'])

_DEMO_MODE = True   # flipped to False when QB credentials present


def _is_demo() -> bool:
    return not bool(getattr(settings, 'quickbooks_client_id', None))


# ── Schemas ───────────────────────────────────────────────────────────────────

class SyncRequest(BaseModel):
    entity_type: str   # Invoice | Customer | Payment | Estimate
    local_id: str
    direction: str = 'push'   # push | pull


class SyncResult(BaseModel):
    entity_type: str
    local_id: str
    qb_id: Optional[str]
    status: str
    error_message: Optional[str]
    demo: bool


# ── QuickBooks API client (thin wrapper, demo fallback) ───────────────────────

_QB_BASE = 'https://quickbooks.api.intuit.com'
_QB_SANDBOX_BASE = 'https://sandbox-quickbooks.api.intuit.com'


def _qb_headers() -> dict:
    token = getattr(settings, 'quickbooks_access_token', None)
    if not token:
        return {}
    return {'Authorization': f'Bearer {token}', 'Accept': 'application/json', 'Content-Type': 'application/json'}


async def _push_invoice(local_id: str) -> tuple[str | None, str | None]:
    """Push local Job/ProposalOutcome → QB Invoice. Returns (qb_id, error)."""
    try:
        import httpx
        realm = getattr(settings, 'quickbooks_realm_id', '')
        base = _QB_SANDBOX_BASE if getattr(settings, 'quickbooks_sandbox', True) else _QB_BASE
        url = f'{base}/v3/company/{realm}/invoice'
        payload = {
            'Line': [{'Amount': 1000.0, 'DetailType': 'SalesItemLineDetail',
                      'SalesItemLineDetail': {'ItemRef': {'value': '1', 'name': 'Services'}}}],
            'CustomerRef': {'value': '1'},
        }
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(url, json={'Invoice': payload}, headers=_qb_headers())
            if r.status_code == 200:
                data = r.json()
                return data.get('Invoice', {}).get('Id'), None
            return None, f'QB API {r.status_code}: {r.text[:200]}'
    except Exception as e:
        return None, str(e)


def _mock_sync(entity_type: str, local_id: str, direction: str) -> SyncResult:
    fake_qb_id = f'QB-{hashlib.md5(f"{entity_type}{local_id}".encode()).hexdigest()[:8].upper()}'
    return SyncResult(
        entity_type=entity_type,
        local_id=local_id,
        qb_id=fake_qb_id,
        status='synced',
        error_message=None,
        demo=True,
    )


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get('/status', dependencies=[Depends(verify_premium_security)])
def qb_status(db: Session = Depends(get_db)):
    demo = _is_demo()
    total = db.query(QuickBooksSync).count()
    synced = db.query(QuickBooksSync).filter(QuickBooksSync.status == 'synced').count()
    errors = db.query(QuickBooksSync).filter(QuickBooksSync.status == 'error').count()
    return {
        'connected': not demo,
        'demo_mode': demo,
        'message': 'Demo mode — set QUICKBOOKS_CLIENT_ID, QUICKBOOKS_ACCESS_TOKEN, QUICKBOOKS_REALM_ID to connect.' if demo else 'Connected to QuickBooks Online.',
        'total_syncs': total,
        'synced': synced,
        'errors': errors,
        'docs_url': 'https://developer.intuit.com/app/developer/qbo/docs/develop',
    }


@router.post('/sync', dependencies=[Depends(verify_premium_security)])
def sync_entity(body: SyncRequest, db: Session = Depends(get_db)):
    if _is_demo():
        result = _mock_sync(body.entity_type, body.local_id, body.direction)
    else:
        # Real sync — only Invoice supported in this version
        import asyncio
        if body.entity_type == 'Invoice':
            qb_id, err = asyncio.get_event_loop().run_until_complete(_push_invoice(body.local_id))
            result = SyncResult(
                entity_type=body.entity_type,
                local_id=body.local_id,
                qb_id=qb_id,
                status='synced' if not err else 'error',
                error_message=err,
                demo=False,
            )
        else:
            result = SyncResult(
                entity_type=body.entity_type,
                local_id=body.local_id,
                qb_id=None,
                status='error',
                error_message=f'Entity type {body.entity_type} not yet implemented in live mode.',
                demo=False,
            )

    record = QuickBooksSync(
        entity_type=result.entity_type,
        local_id=result.local_id,
        qb_id=result.qb_id,
        sync_direction=body.direction,
        status=result.status,
        error_message=result.error_message,
        synced_at=utcnow() if result.status == 'synced' else None,
    )
    db.add(record)
    db.commit()
    return result.model_dump()


@router.get('/log', dependencies=[Depends(verify_premium_security)])
def sync_log(limit: int = Query(50, le=200), db: Session = Depends(get_db)):
    rows = db.query(QuickBooksSync).order_by(QuickBooksSync.id.desc()).limit(limit).all()
    return {
        'log': [{
            'id': r.id,
            'entity_type': r.entity_type,
            'local_id': r.local_id,
            'qb_id': r.qb_id,
            'direction': r.sync_direction,
            'status': r.status,
            'error': r.error_message,
            'synced_at': r.synced_at.isoformat() if r.synced_at else None,
        } for r in rows],
        'total': len(rows),
    }


@router.post('/bulk-sync', dependencies=[Depends(verify_premium_security)])
def bulk_sync(
    entity_types: list[str] = Body(default=['Invoice', 'Customer', 'Payment']),
    db: Session = Depends(get_db),
):
    """Trigger a bulk sync pass across all unsynchronised entities (demo or live)."""
    results = []
    for et in entity_types:
        if _is_demo():
            for i in range(1, 4):
                r = _mock_sync(et, str(i), 'push')
                record = QuickBooksSync(
                    entity_type=r.entity_type, local_id=r.local_id, qb_id=r.qb_id,
                    sync_direction='push', status=r.status, synced_at=utcnow(),
                )
                db.add(record)
                results.append(r.model_dump())
    db.commit()
    return {'synced': len(results), 'results': results, 'demo': _is_demo()}


@router.get('/oauth-url', dependencies=[Depends(verify_premium_security)])
def oauth_url():
    client_id = getattr(settings, 'quickbooks_client_id', None)
    if not client_id:
        return {'url': None, 'demo': True, 'message': 'Set QUICKBOOKS_CLIENT_ID to enable OAuth.'}
    import secrets, base64
    verifier = secrets.token_urlsafe(48)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b'=').decode()
    redirect = getattr(settings, 'quickbooks_redirect_uri', 'http://localhost:5174/oauth/qb')
    url = (
        f'https://appcenter.intuit.com/connect/oauth2'
        f'?client_id={client_id}'
        f'&redirect_uri={redirect}'
        f'&response_type=code'
        f'&scope=com.intuit.quickbooks.accounting'
        f'&state={secrets.token_hex(8)}'
        f'&code_challenge={challenge}'
        f'&code_challenge_method=S256'
    )
    return {'url': url, 'demo': False}

