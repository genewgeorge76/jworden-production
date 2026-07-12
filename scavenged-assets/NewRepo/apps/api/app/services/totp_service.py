"""TOTP-based two-factor authentication service."""
from __future__ import annotations

import base64
import io
import json
import os
import secrets

import pyotp
import qrcode
import qrcode.image.pil

from ..config import settings


def generate_secret(username: str) -> dict:
    """Generate a new TOTP secret for a user. Returns secret + QR code data URI."""
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret, issuer=settings.totp_issuer)
    otpauth_url = totp.provisioning_uri(name=username, issuer_name=settings.totp_issuer)

    img = qrcode.make(otpauth_url)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    b64 = base64.b64encode(buf.getvalue()).decode()
    qr_data_uri = f'data:image/png;base64,{b64}'

    backup_codes = _generate_backup_codes()

    return {
        'secret': secret,
        'otpauth_url': otpauth_url,
        'qr_code_uri': qr_data_uri,
        'backup_codes': backup_codes,
        'message': 'Scan the QR code with your authenticator app. Store backup codes securely.',
    }


def verify_token(secret: str, token: str) -> bool:
    """Validate a TOTP token with ±1 time-window tolerance."""
    totp = pyotp.TOTP(secret)
    return totp.verify(token, valid_window=1)


def _generate_backup_codes(count: int = 10) -> list[str]:
    """Generate 10 one-time recovery codes in XXXXX-XXXXX format."""
    return [f'{secrets.token_hex(3).upper()}-{secrets.token_hex(3).upper()}' for _ in range(count)]


def verify_backup_code(stored_json: str, presented: str) -> tuple[bool, str]:
    """
    Check a backup code against stored JSON list.
    Returns (valid, updated_json) — caller must persist updated_json to consume the code.
    """
    codes: list[str] = json.loads(stored_json or '[]')
    normalized = presented.upper().strip()
    if normalized in codes:
        codes.remove(normalized)
        return True, json.dumps(codes)
    return False, stored_json


def remaining_backup_count(stored_json: str) -> int:
    return len(json.loads(stored_json or '[]'))
