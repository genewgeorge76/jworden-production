"""
staff_auth.py — Password hashing + JWT utilities for the Staff Portal (Ship I).

Password storage: PBKDF2-HMAC-SHA256 (stdlib), 32-byte salt, 310,000 iterations.
JWT: python-jose[cryptography] RS256-or-HS256 via STAFF_JWT_SECRET env.
Token lifetime: STAFF_JWT_EXPIRE_HOURS (default 12).
"""

from __future__ import annotations

import hashlib
import os
import secrets
import time
from typing import Optional

from jose import JWTError, jwt

_SECRET = os.getenv("STAFF_JWT_SECRET", "CHANGE_ME_staff_jwt_secret_not_for_prod")
_ALGO = "HS256"
_EXPIRE_SEC = int(os.getenv("STAFF_JWT_EXPIRE_HOURS", "12")) * 3600
_ITERS = 310_000


def hash_password(password: str) -> str:
    """Return '<hex_salt>$<hex_dk>' suitable for DB storage."""
    salt = secrets.token_bytes(32)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, _ITERS)
    return f"{salt.hex()}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    """Constant-time comparison against stored hash."""
    try:
        salt_hex, dk_hex = stored.split("$", 1)
    except ValueError:
        return False
    salt = bytes.fromhex(salt_hex)
    dk_expected = bytes.fromhex(dk_hex)
    dk_given = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, _ITERS)
    return secrets.compare_digest(dk_given, dk_expected)


def create_token(user_id: int, username: str, role: str) -> str:
    payload = {
        "sub": str(user_id),
        "username": username,
        "role": role,
        "exp": int(time.time()) + _EXPIRE_SEC,
    }
    return jwt.encode(payload, _SECRET, algorithm=_ALGO)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, _SECRET, algorithms=[_ALGO])
    except JWTError:
        return None
