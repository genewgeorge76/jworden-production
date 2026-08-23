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
from sqlalchemy import func
from sqlalchemy.orm import Session
import bcrypt

from ..core import bruteforce, jwt_secrets
from ..core.bruteforce import identity_from_request
from ..core.limiter import AUTH_LIMIT, limiter
from ..core.security import verify_premium_security
from ..database import get_db
from ..models import Tenant, User
from ..services.audit import write_audit_event
from ..services import entitlements, owner_account
from ..services.tenancy import is_owner, scope, tenant_of

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
    # Whether the operator can sign in with email and password at all. A failed
    # owner login and a non-existent owner account return the same 401 by
    # design — that stops address enumeration, and it also made "my login
    # doesn't work" impossible to diagnose from outside. This is the boolean
    # that closes that gap. The reason is sanitised here; the specific one is
    # behind auth at GET /api/v1/auth/owner-account.
    owner_account_ready: bool = False
    owner_account_reason: str = "unknown"


# Reasons safe to hand an unauthenticated caller. "the password is too short"
# is a real hint to anyone who can read it, so anything not on this list is
# reported as "misconfigured" until the caller proves they are the operator.
_PUBLIC_OWNER_REASONS = frozenset(
    {owner_account.READY, owner_account.NOT_CONFIGURED, owner_account.NOT_SEEDED}
)


@router.get("/status", summary="Check authentication requirements")
def auth_status(db: Session = Depends(get_db)) -> AuthStatusResponse:
    master_key = os.getenv("JWORDEN_MASTER_KEY", "").strip()
    admin_pin = os.getenv("ADMIN_PIN", "").strip()
    auth_required = bool(master_key or admin_pin)
    admin_configured = bool(
        admin_pin
        or (os.getenv("ADMIN_USERNAME") and os.getenv("ADMIN_PASSWORD"))
    )
    try:
        owner_state = owner_account.status(db)
    except Exception:
        # A diagnostic must never be the reason the app cannot report its own
        # auth status.
        logger.exception("Could not read operator account status.")
        owner_state = {"ready": False, "reason": "unknown"}

    reason = owner_state["reason"]
    return AuthStatusResponse(
        auth_required=auth_required,
        auth_mode="required" if auth_required else "open",
        token_endpoint="/api/v1/auth/pin-token" if auth_required else None,
        admin_configured=admin_configured,
        owner_account_ready=owner_state["ready"],
        owner_account_reason=reason if reason in _PUBLIC_OWNER_REASONS else "misconfigured",
    )


@router.get("/owner-account", summary="Why the operator account is or is not usable")
def owner_account_status(
    auth: dict = Depends(verify_premium_security),
    db: Session = Depends(get_db),
):
    """
    The specific reason, for a caller who has already proved they are the
    operator — via the admin PIN or the master key, both of which stamp
    JWORDEN_HQ.

    Neither OWNER_EMAIL nor OWNER_PASSWORD is returned; only what is wrong.
    """
    if not is_owner(tenant_of(auth)):
        raise HTTPException(status_code=403, detail="Operator only.")
    return owner_account.status(db)


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
    # users.email carries a UniqueConstraint spanning every tenant, so the
    # duplicate check below cannot be scoped to one and must read across all.
    # audit: global — email uniqueness is enforced across all tenants
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # 2. Create Tenant
    #
    # At LITE, always — never at payload.plan. The plan on this request is a
    # box the visitor ticked on a pricing page, not a payment. Writing it
    # straight to subscription_tier is what made every paid feature free:
    # pick "max", abandon checkout, and factory.py's `tier == "lite"` gate
    # waved you through forever, because tier said max and nothing consulted
    # subscription_status.
    #
    # The tier is granted by the Stripe webhook when checkout completes, from
    # the price that was actually charged. The requested plan still reaches
    # Stripe: the client passes it to POST /api/v1/billing/checkout, which
    # stamps it into the session metadata.
    tenant_id = secrets.token_urlsafe(12)
    new_tenant = Tenant(
        tenant_id=tenant_id,
        company_name=payload.companyName,
        industry=payload.industry,
        subscription_tier=entitlements.DEFAULT_TIER,
        subscription_status=entitlements.PENDING_STATUS,
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

    # Issue a token with the tenant, so registration hands back a usable
    # session rather than an id the caller cannot do anything with.
    #
    # WITHOUT THIS, NOBODY COULD SUBSCRIBE.
    #
    # The signup flow is: register, then POST /api/v1/billing/checkout to get a
    # Stripe URL. The billing router declares auth at router level, and
    # registration returned {"status", "tenant_id"} and no credential — so the
    # very next call in the flow was rejected and the customer saw "Failed to
    # create checkout session". A brand-new registrant has no other way to get
    # a token, and the endpoint that takes their money is behind one.
    claims = {
        "sub": new_user.email,
        "tenant_id": tenant_id,
        "role": getattr(new_user, "role", "owner"),
        "exp": datetime.now(timezone.utc) + timedelta(seconds=_TOKEN_EXPIRE_SECONDS),
        "iat": datetime.now(timezone.utc),
    }
    token = jwt.encode(claims, _signing_secret(), algorithm=_ALGORITHM)

    return {
        "status": "success",
        "tenant_id": tenant_id,
        "access_token": token,
        "token_type": "bearer",
        "expires_in": _TOKEN_EXPIRE_SECONDS,
    }


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

    # Case-insensitive, because every mail provider treats it that way and a
    # person typing their own address on a phone gets a capital first letter
    # from the keyboard. An exact match meant "Gene@..." and "gene@..." were
    # different accounts, one of which did not exist.
    user = (
        db.query(User)
        .filter(func.lower(User.email) == payload.email.strip().lower())
        .first()
    )
    if not user or not verify_password(payload.password, user.hashed_password):
        bruteforce.record_failure("login", identity)
        bruteforce.record_failure("login-user", payload.email.lower())
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    # is_active was never consulted, so deactivating a user did nothing: they
    # kept signing in and kept getting 24-hour tokens. Same 401 wording as a bad
    # password, so the response does not confirm that the address exists.
    if not user.is_active:
        bruteforce.record_failure("login", identity)
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


class IdentityResponse(BaseModel):
    """Who the caller actually is, as opposed to what the UI assumed."""

    email: str
    tenant_id: str
    role: str
    is_owner: bool
    subscription_tier: Optional[str] = None
    subscription_status: Optional[str] = None
    branding_tier: Optional[str] = None
    company_name: Optional[str] = None
    # The person's name, which this did not carry.
    #
    # CustomerPortal renders `user?.full_name?.split(' ')[0] || 'Client'`, so an
    # identity with no name falls through to the literal word "Client" — and
    # the operator, signed in correctly with is_owner true, was greeted as a
    # customer. The seeder sets full_name on his row; nothing ever sent it to
    # the browser.
    full_name: Optional[str] = None
    auth_mode: str


@router.get("/me", summary="Identity of the authenticated caller", response_model=IdentityResponse)
def read_identity(
    auth: dict = Depends(verify_premium_security),
    db: Session = Depends(get_db),
) -> IdentityResponse:
    """
    The single source of truth for "am I the operator or a paying customer?".

    The frontend previously answered this itself, with a literal:
    AuthContext.jsx set `{id: 'admin', role: 'admin'}` on every successful
    sign-in. That is not a claim from the token, and /auth/register stamps
    role="admin" on every self-serve signup too, so the operator and a
    subscriber were indistinguishable to every guard in the SPA.

    The axis that separates them is the tenant, not the role:
    tenancy.is_owner() is true only for the operator's own bucket, and
    /register mints `secrets.token_urlsafe(12)` for each new tenant, so a
    customer can never land in it. `role` is the *within-tenant* distinction
    (admin | dispatcher | foreman | pilot).

    Tier fields come from the tenants row, not from the token — a customer
    could otherwise present a stale token from before a downgrade.
    """
    email = auth.get("user") or "unknown"
    tenant_id = tenant_of(auth)
    owner = is_owner(tenant_id)

    tenant_row = (
        db.query(Tenant).filter(Tenant.tenant_id == tenant_id).first()
        if not owner
        else None
    )
    # Case-insensitive for the same reason /login is: the token's `sub` is
    # whatever case the account was created with.
    #
    # Scoped, though the email alone would find the row: a token carries both a
    # `sub` and a `tenant_id`, and nothing forces them to agree. Requiring the
    # user row to belong to the tenant the token claims means a token cannot
    # name one tenant and report another's account.
    user_row = (
        scope(db.query(User), User, tenant_id)
        .filter(func.lower(User.email) == email.strip().lower())
        .first()
    )

    # Prefer the stored role over the token's: the token is up to 24h stale and
    # a role change should take effect before it expires.
    role = (user_row.role if user_row else None) or auth.get("role") or "viewer"

    return IdentityResponse(
        email=email,
        tenant_id=tenant_id,
        role=role,
        is_owner=owner,
        subscription_tier=tenant_row.subscription_tier if tenant_row else None,
        subscription_status=tenant_row.subscription_status if tenant_row else None,
        branding_tier=tenant_row.branding_tier if tenant_row else None,
        company_name=tenant_row.company_name if tenant_row else None,
        full_name=getattr(user_row, "full_name", None),
        auth_mode=auth.get("auth_mode") or "token",
    )
