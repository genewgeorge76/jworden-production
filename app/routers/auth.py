"""
auth.py — JWT token issuance endpoint for JWordenAI.

Routes:
  POST /api/v1/auth/token — exchange master key for a short-lived JWT
"""

import base64
import hashlib
import logging
import os
import secrets
from datetime import datetime, timedelta, timezone

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from jose import jwt, JWTError
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
import bcrypt

from ..core import bruteforce, jwt_secrets
from ..core.bruteforce import identity_from_request
from ..core.limiter import AUTH_LIMIT, limiter
from ..database import get_db
from ..models import Tenant, User
from ..services.audit import write_audit_event

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

_ALGORITHM = "HS256"
_TOKEN_EXPIRE_SECONDS = 86_400  # 24 hours


def _secret_fingerprint(value: str) -> str:
    if not value:
        return "unset"
    digest = hashlib.sha256(value.encode("utf-8")).hexdigest()[:12]
    return f"len={len(value)} sha256={digest}"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = _TOKEN_EXPIRE_SECONDS


class PinTokenRequest(BaseModel):
    pin: str


class AuthStatusResponse(BaseModel):
    auth_required: bool
    auth_mode: str
    token_endpoint: str | None = None
    admin_configured: bool = False


@router.get("/status", summary="Check authentication requirements")
def auth_status() -> AuthStatusResponse:
    master_key = os.getenv("JWORDEN_MASTER_KEY", "").strip()
    admin_pin = os.getenv("ADMIN_PIN", "").strip()
    auth_required = bool(master_key or admin_pin)
    admin_configured = bool(
        admin_pin
        or (os.getenv("ADMIN_USERNAME") and os.getenv("ADMIN_PASSWORD"))
    )
    return AuthStatusResponse(
        auth_required=auth_required,
        auth_mode="required" if auth_required else "open",
        token_endpoint="/api/v1/auth/pin-token" if auth_required else None,
        admin_configured=admin_configured,
    )


def _signing_secret() -> str:
    """
    Resolve the platform signing secret, or refuse to issue a token.

    Refusing is the point. The previous default meant "unconfigured" and
    "configured" produced tokens that were indistinguishable to the caller,
    and only one of them was secret.
    """
    try:
        return jwt_secrets.platform_secret()
    except jwt_secrets.SigningSecretUnavailable as exc:
        raise HTTPException(
            status_code=503,
            detail=(
                "Cannot issue a token: no JWT signing secret is configured. "
                "Set one of: " + ", ".join(jwt_secrets.PLATFORM_VARS)
            ),
        ) from exc


def _issue_admin_jwt() -> str:
    # Same resolver the verifying side uses. Previously this chain ended in
    # "fallback_secret", so an unconfigured deployment minted admin tokens
    # signed with a literal from this repository.
    jwt_secret = _signing_secret()
    payload = {
        "sub": "admin",
        "tenant_id": "JWORDEN_HQ",
        "role": "system_admin",
        "exp": datetime.now(timezone.utc) + timedelta(seconds=_TOKEN_EXPIRE_SECONDS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, jwt_secret, algorithm=_ALGORITHM)


@router.post(
    "/token",
    summary="Exchange master key for a 24-hour JWT",
    response_model=TokenResponse,
)
def issue_token(
    request: Request,
    db: Session = Depends(get_db),
):
    master_key = os.getenv("JWORDEN_MASTER_KEY", "").strip()
    if not master_key:
        return TokenResponse(access_token="unauthenticated_mode_active")

    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(
            status_code=401,
            detail="Authorization header missing. Must provide Bearer or Basic token.",
            headers={"WWW-Authenticate": "Bearer, Basic"},
        )

    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        if token != master_key:
            # Only the presented value is fingerprinted. Logging the EXPECTED
            # secret's length and hash prefix hands a log reader everything they
            # need to confirm a guess offline, for no diagnostic benefit.
            logger.warning(
                "Failed token exchange — invalid Bearer key presented (presented=%s)",
                _secret_fingerprint(token),
            )
            raise HTTPException(
                status_code=403,
                detail="Invalid master key",
                headers={"WWW-Authenticate": 'Bearer realm="Auth Token"'},
            )

    elif auth_header.startswith("Basic "):
        encoded_credentials = auth_header[6:]
        try:
            decoded_bytes = base64.b64decode(encoded_credentials)
            decoded_str = decoded_bytes.decode("utf-8")
            provided_username, provided_password = decoded_str.split(":", 1)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid Basic auth format")

        admin_username = os.getenv("ADMIN_USERNAME", "admin")
        admin_password = os.getenv("ADMIN_PASSWORD", master_key)
        if provided_username != admin_username or provided_password != admin_password:
            logger.warning(
                "Failed token exchange — invalid Basic credentials (user=%s)",
                provided_username or "<empty>",
            )
            raise HTTPException(
                status_code=403,
                detail="Invalid admin credentials",
                headers={"WWW-Authenticate": 'Basic realm="Auth Token"'},
            )

    else:
        raise HTTPException(
            status_code=401,
            detail="Unsupported auth scheme. Use Bearer or Basic.",
            headers={"WWW-Authenticate": "Bearer, Basic"},
        )

    token = _issue_admin_jwt()
    logger.info(
        "JWT issued for Admin (tenant=JWORDEN_HQ, expires_in=%ds)",
        _TOKEN_EXPIRE_SECONDS,
    )

    write_audit_event(
        db,
        event_type="auth.token_issued",
        actor_type="service",
        actor_id="auth_router",
        entity_type="auth_token",
        entity_id="Admin",
        summary="Issued backend JWT for admin client bootstrap.",
        detail={"tenant_id": "JWORDEN_HQ", "expires_in": _TOKEN_EXPIRE_SECONDS},
    )

    return TokenResponse(access_token=token)


@router.post(
    "/pin-token",
    summary="Exchange the configured admin PIN for a 24-hour JWT",
    response_model=TokenResponse,
)
@limiter.limit(AUTH_LIMIT)
def issue_pin_token(
    request: Request,
    payload: PinTokenRequest,
    db: Session = Depends(get_db),
):
    # The body model moved to `payload`: SlowAPI resolves the client address
    # from a parameter that is literally named `request` and typed Request, and
    # this endpoint had bound that name to the JSON body — which is why it could
    # not carry a limit before.
    admin_pin = os.getenv("ADMIN_PIN", "")
    if not admin_pin:
        raise HTTPException(
            status_code=500,
            detail="PIN authentication is not configured. Set ADMIN_PIN.",
        )

    identity = identity_from_request(request)
    bruteforce.check("pin", identity)

    if not payload.pin or not payload.pin.isdigit() or len(payload.pin) < 4 or len(payload.pin) > 8:
        raise HTTPException(status_code=400, detail="A 4 to 8 digit PIN is required.")

    # compare_digest, not ==. A plain string compare returns as soon as it finds
    # a differing character, so response time leaks how many leading digits were
    # right and turns 10,000 guesses into about 40.
    if not secrets.compare_digest(payload.pin, admin_pin):
        bruteforce.record_failure("pin", identity)
        # The expected PIN's fingerprint used to be logged here beside the
        # presented one. len= plus 12 hex of sha256 is not anonymised for a
        # secret drawn from 10,000 candidates: hash all of them, match the
        # prefix, recover the PIN. Anyone who could read the logs had the PIN.
        logger.warning(
            "PIN token issuance rejected — incorrect PIN from identity=%s", identity
        )
        raise HTTPException(status_code=403, detail="Incorrect PIN")

    bruteforce.record_success("pin", identity)
    token = _issue_admin_jwt()
    logger.info(
        "JWT issued for Admin via PIN auth (tenant=JWORDEN_HQ, expires_in=%ds)",
        _TOKEN_EXPIRE_SECONDS,
    )

    write_audit_event(
        db,
        event_type="auth.pin_token_issued",
        actor_type="admin",
        actor_id="pin_auth",
        entity_type="auth_token",
        entity_id="Admin",
        summary="Issued backend JWT after admin PIN verification.",
        detail={"tenant_id": "JWORDEN_HQ", "expires_in": _TOKEN_EXPIRE_SECONDS},
    )

    return TokenResponse(access_token=token)


class RegisterRequest(BaseModel):
    companyName: str
    industry: str
    email: EmailStr
    password: str
    state: str
    city: str
    plan: str


@router.post("/register", summary="Register a new Tenant and User")
@limiter.limit(AUTH_LIMIT)
def register_tenant(
    request: Request,
    payload: RegisterRequest,
    db: Session = Depends(get_db),
):
    # Rate limited because it was not: registration writes a tenant and a user
    # on every call, so an unlimited endpoint is a way to fill the database and
    # to farm which email addresses are already taken via the 400 below.
    # 1. Check if user already exists
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # 2. Create Tenant
    tenant_id = secrets.token_urlsafe(12)
    new_tenant = Tenant(
        tenant_id=tenant_id,
        company_name=payload.companyName,
        industry=payload.industry,
        subscription_tier=payload.plan.lower(),
        contact_email=payload.email,
        is_active=1
    )
    db.add(new_tenant)
    db.flush()
    
    # 3. Create User
    new_user = User(
        tenant_id=tenant_id,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        role="admin"
    )
    db.add(new_user)
    db.commit()
    
    logger.info(f"New SaaS Tenant Registered: {tenant_id} ({payload.companyName})")
    return {"status": "success", "tenant_id": tenant_id}


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/login", summary="Login with Email and Password", response_model=TokenResponse)
@limiter.limit(AUTH_LIMIT)
def login_user(
    request: Request,
    payload: LoginRequest,
    db: Session = Depends(get_db),
):
    identity = identity_from_request(request)
    # Counted per email as well as per IP: a password-spray tries one common
    # password against many accounts, so an IP-only counter never trips while a
    # single account is still being hammered from everywhere.
    bruteforce.check("login", identity)
    bruteforce.check("login-user", payload.email.lower())

    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        bruteforce.record_failure("login", identity)
        bruteforce.record_failure("login-user", payload.email.lower())
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    bruteforce.record_success("login", identity)
    bruteforce.record_success("login-user", payload.email.lower())

    # Issue JWT containing tenant_id and role. Named `claims`, not `payload`:
    # the request body is `payload` now, and rebinding it here would leave a
    # trap for the next edit that reads payload.email below this line.
    jwt_secret = _signing_secret()
    claims = {
        "sub": user.email,
        "tenant_id": user.tenant_id,
        "role": user.role,
        "exp": datetime.now(timezone.utc) + timedelta(seconds=_TOKEN_EXPIRE_SECONDS),
        "iat": datetime.now(timezone.utc),
    }

    token = jwt.encode(claims, jwt_secret, algorithm=_ALGORITHM)
    return TokenResponse(access_token=token)
