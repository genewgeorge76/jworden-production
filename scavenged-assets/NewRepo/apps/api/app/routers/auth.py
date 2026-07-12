"""Auth — JWT token issuance, master-key exchange, PIN fallback, revocation, 2FA enforcement."""
from __future__ import annotations

import hmac
import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..config import settings
from ..core.limiter import limiter
from ..database import get_db
from ..models import AuditEvent, RevokedToken, TwoFactorSecret

router = APIRouter(prefix='/auth', tags=['auth'])

_TOKEN_EXPIRE_HOURS = 24


def _issue_jwt(sub: str, tenant_id: str = 'JWORDEN_HQ') -> str:
    now = datetime.now(timezone.utc)
    payload = {
        'sub': sub,
        'tenant_id': tenant_id,
        'jti': uuid.uuid4().hex,
        'iat': int(now.timestamp()),
        'exp': int((now + timedelta(hours=_TOKEN_EXPIRE_HOURS)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_jwt(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])


def is_token_revoked(db: Session, jti: Optional[str]) -> bool:
    """True if the token's jti is on the blocklist. Tokens without jti (pre-Wave-9) can't be revoked."""
    if not jti:
        return False
    return db.query(RevokedToken).filter(RevokedToken.jti == jti).first() is not None


def _log_audit(db: Session, actor: str, action: str, ip: str | None = None, detail: dict | None = None) -> None:
    try:
        db.add(AuditEvent(actor=actor, action=action, ip_address=ip, detail=json.dumps(detail or {})))
        db.commit()
    except Exception:
        pass


def _enforce_2fa(db: Session, username: str, totp_code: Optional[str]) -> None:
    """If a 2FA secret is enrolled and enabled for this user, a valid TOTP code is mandatory."""
    record = (
        db.query(TwoFactorSecret)
        .filter(TwoFactorSecret.username == username, TwoFactorSecret.enabled.is_(True))
        .first()
    )
    if record is None:
        return
    if not totp_code:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='2FA code required')
    from ..services.totp_service import verify_backup_code, verify_token
    if verify_token(record.secret, totp_code):
        return
    ok, remaining_json = verify_backup_code(record.backup_codes or '[]', totp_code)
    if ok:
        record.backup_codes = remaining_json
        db.commit()
        return
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid 2FA code')


class TokenRequest(BaseModel):
    master_key: str
    totp_code: Optional[str] = None


class PinTokenRequest(BaseModel):
    pin: str
    totp_code: Optional[str] = None


class RevokeRequest(BaseModel):
    token: Optional[str] = None  # revoke this token; defaults to the bearer token used


@router.post('/token')
@limiter.limit('10/minute')
async def issue_token(request: Request, body: TokenRequest, db: Session = Depends(get_db)):
    """Exchange master key for a 24-hour JWT. Requires TOTP when 2FA is enrolled."""
    if not hmac.compare_digest(body.master_key.encode(), settings.jworden_master_key.encode()):
        _log_audit(db, 'anonymous', 'auth.token.failed', request.client.host if request.client else None)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid master key')
    _enforce_2fa(db, 'admin', body.totp_code)
    token = _issue_jwt('Admin')
    _log_audit(db, 'Admin', 'auth.token.issued', request.client.host if request.client else None)
    return {'access_token': token, 'token_type': 'bearer', 'expires_in': _TOKEN_EXPIRE_HOURS * 3600}


@router.post('/pin-token')
@limiter.limit('5/minute')
async def issue_pin_token(request: Request, body: PinTokenRequest, db: Session = Depends(get_db)):
    """PIN-based auth fallback (4-digit PIN stored in ADMIN_PIN env var). Requires TOTP when 2FA is enrolled."""
    if not settings.admin_pin or not hmac.compare_digest(body.pin.encode(), settings.admin_pin.encode()):
        _log_audit(db, 'anonymous', 'auth.pin.failed', request.client.host if request.client else None)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid PIN')
    _enforce_2fa(db, 'admin', body.totp_code)
    token = _issue_jwt('Admin-PIN')
    _log_audit(db, 'Admin-PIN', 'auth.pin.issued', request.client.host if request.client else None)
    return {'access_token': token, 'token_type': 'bearer', 'expires_in': _TOKEN_EXPIRE_HOURS * 3600}


@router.post('/revoke')
@limiter.limit('10/minute')
async def revoke_token(request: Request, body: RevokeRequest, db: Session = Depends(get_db)):
    """Revoke a JWT (the bearer token by default). Revoked tokens fail /auth/status immediately."""
    auth_header = request.headers.get('Authorization', '')
    bearer = auth_header.split(' ', 1)[1] if auth_header.startswith('Bearer ') else None
    target = body.token or bearer
    if not target:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='No token supplied')
    try:
        payload = decode_jwt(target)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token')
    jti = payload.get('jti')
    if not jti:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Token has no jti and cannot be revoked; rotate JWT_SECRET_KEY instead')
    if not is_token_revoked(db, jti):
        db.add(RevokedToken(
            jti=jti,
            token_type='portal' if payload.get('type') == 'portal' else 'admin',
            expires_at=datetime.fromtimestamp(payload['exp'], tz=timezone.utc) if payload.get('exp') else None,
        ))
        db.commit()
    _log_audit(db, str(payload.get('sub', 'unknown')), 'auth.token.revoked', request.client.host if request.client else None, {'jti': jti})
    return {'revoked': True, 'jti': jti}


@router.get('/status')
async def auth_status(request: Request, db: Session = Depends(get_db)):
    """Check whether auth is configured (for client-side gating)."""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return {'authenticated': False, 'reason': 'no_token'}
    token = auth_header.split(' ', 1)[1]
    try:
        payload = decode_jwt(token)
    except Exception:
        return {'authenticated': False, 'reason': 'invalid_token'}
    if is_token_revoked(db, payload.get('jti')):
        return {'authenticated': False, 'reason': 'revoked'}
    return {'authenticated': True, 'sub': payload.get('sub'), 'tenant_id': payload.get('tenant_id')}
