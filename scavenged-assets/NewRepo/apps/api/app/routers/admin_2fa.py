"""Admin 2FA — TOTP setup, verification, disable, status."""
from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.limiter import limiter
from ..core.security import verify_premium_security
from ..database import get_db
from ..models import TwoFactorSecret
from ..services.totp_service import (
    generate_secret, verify_token, verify_backup_code, remaining_backup_count,
)
from ..config import settings

router = APIRouter(prefix='/admin/2fa', tags=['admin-2fa'])

_2FA_LIMIT = '10/minute'   # guard TOTP verify against brute force


def _get_or_none(db: Session, username: str) -> TwoFactorSecret | None:
    return db.query(TwoFactorSecret).filter(TwoFactorSecret.username == username).first()


class VerifyRequest(BaseModel):
    token: str
    username: str = 'admin'


class BackupVerifyRequest(BaseModel):
    code: str
    username: str = 'admin'


@router.post('/setup', dependencies=[Depends(verify_premium_security)])
async def setup_2fa(username: str = 'admin', db: Session = Depends(get_db)):
    """Generate a new TOTP secret + QR code for the given admin username."""
    data = generate_secret(username)
    existing = _get_or_none(db, username)
    if existing:
        existing.secret = data['secret']
        existing.backup_codes = json.dumps(data['backup_codes'])
        existing.enabled = False
    else:
        db.add(TwoFactorSecret(
            username=username,
            secret=data['secret'],
            backup_codes=json.dumps(data['backup_codes']),
            enabled=False,
        ))
    db.commit()
    return {
        'secret': data['secret'],
        'qr_code_uri': data['qr_code_uri'],
        'otpauth_url': data['otpauth_url'],
        'backup_codes': data['backup_codes'],
        'message': 'Scan QR code, then call /verify to activate 2FA.',
    }


@router.post('/verify', dependencies=[Depends(verify_premium_security)])
@limiter.limit(_2FA_LIMIT)
async def verify_and_enable(request: Request, body: VerifyRequest, db: Session = Depends(get_db)):
    """Verify the first TOTP token and enable 2FA for this account."""
    rec = _get_or_none(db, body.username)
    if not rec:
        raise HTTPException(404, '2FA not set up — call /setup first')
    if not verify_token(rec.secret, body.token):
        raise HTTPException(401, 'Invalid TOTP token')
    rec.enabled = True
    db.commit()
    return {'enabled': True, 'username': body.username}


@router.post('/disable', dependencies=[Depends(verify_premium_security)])
@limiter.limit(_2FA_LIMIT)
async def disable_2fa(request: Request, body: VerifyRequest, db: Session = Depends(get_db)):
    """Disable 2FA (requires valid TOTP token to prevent lockout)."""
    rec = _get_or_none(db, body.username)
    if not rec or not rec.enabled:
        raise HTTPException(400, '2FA is not enabled for this user')
    if not verify_token(rec.secret, body.token):
        raise HTTPException(401, 'Invalid TOTP token')
    rec.enabled = False
    db.commit()
    return {'enabled': False, 'username': body.username}


@router.get('/status', dependencies=[Depends(verify_premium_security)])
async def totp_status(username: str = 'admin', db: Session = Depends(get_db)):
    """Return 2FA enrollment status."""
    rec = _get_or_none(db, username)
    if not rec:
        return {'username': username, 'enrolled': False, 'enabled': False}
    return {
        'username': username,
        'enrolled': True,
        'enabled': rec.enabled,
        'backup_codes_remaining': remaining_backup_count(rec.backup_codes or '[]'),
    }


@router.post('/backup-verify', dependencies=[Depends(verify_premium_security)])
@limiter.limit(_2FA_LIMIT)
async def use_backup_code(request: Request, body: BackupVerifyRequest, db: Session = Depends(get_db)):
    """Consume a backup recovery code (one-time use)."""
    rec = _get_or_none(db, body.username)
    if not rec or not rec.enabled:
        raise HTTPException(400, '2FA not enabled')
    valid, updated_json = verify_backup_code(rec.backup_codes or '[]', body.code)
    if not valid:
        raise HTTPException(401, 'Invalid or already-used backup code')
    rec.backup_codes = updated_json
    db.commit()
    return {'valid': True, 'codes_remaining': remaining_backup_count(updated_json)}
