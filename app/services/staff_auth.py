"""
staff_auth.py — Password hashing + JWT utilities for the Staff Portal (Ship I).

Password storage: PBKDF2-HMAC-SHA256 (stdlib), 32-byte salt, 310,000 iterations.
JWT: python-jose[cryptography] HS256. The signing key comes from
core/jwt_secrets.staff_secret() — STAFF_JWT_SECRET when set, otherwise derived
from the platform secret.

It used to be `os.getenv("STAFF_JWT_SECRET", "CHANGE_ME_staff_jwt_secret_not_for_prod")`.
STAFF_JWT_SECRET was in neither .env.example nor the managed-key list, so
nobody had ever been told to set it, and an unset variable did not disable
staff auth — it signed and accepted every staff token with a string printed
in this file. Forging an admin staff session required only the source.

Token lifetime: STAFF_JWT_EXPIRE_HOURS (default 12).
"""

from __future__ import annotations

import hashlib
import os
import secrets
import time
from typing import Optional

from jose import JWTError, jwt

from ..core import jwt_secrets

# Resolved per call rather than bound at import: the derived form depends on
# the platform secret, and a module-level constant would freeze whatever was
# in the environment when this module first happened to be imported.
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
    return jwt.encode(payload, jwt_secrets.staff_secret(), algorithm=_ALGO)


def decode_token(token: str) -> Optional[dict]:
    try:
        secret = jwt_secrets.staff_secret()
    except jwt_secrets.SigningSecretUnavailable:
        # Nothing configured anywhere. Reject rather than fall back to a
        # constant — an unverifiable token is not a valid one.
        return None
    try:
        return jwt.decode(token, secret, algorithms=[_ALGO])
    except JWTError:
        return None
