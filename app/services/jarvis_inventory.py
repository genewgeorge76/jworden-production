"""
What this platform actually is, measured at the moment of asking.

Jarvis was told in its system prompt that it had "a library of 162 specialized
AI engines". The registry holds 109, and 23 of those are real. A number written
into a prompt is a number that stops being true, and the model has no way to
notice — it will quote 162 to a customer with complete confidence.

So nothing here is written down. Every figure is counted from the running
application, the registry, or the database at call time. Where something cannot
be measured, it is reported as unknown rather than estimated: an inventory that
guesses is worse than no inventory, because it is quoted as fact.

Reads only. Nothing in this module writes, sends, or changes anything.
"""

from __future__ import annotations

import logging
import os
from typing import Any

from sqlalchemy.orm import Session

from .tenancy import is_owner

logger = logging.getLogger(__name__)


def _abilities() -> dict[str, Any]:
    try:
        from .os_ability_service import _load_registry  # noqa: PLC0415

        registry = _load_registry()
        implemented = sum(1 for entry in registry if entry.get("implemented"))
        categories: dict[str, int] = {}
        for entry in registry:
            categories[entry.get("category") or "uncategorised"] = (
                categories.get(entry.get("category") or "uncategorised", 0) + 1
            )
        return {
            "registered": len(registry),
            "implemented": implemented,
            "gated": len(registry) - implemented,
            "gated_reason": (
                "They manufactured their answer with a random draw instead of "
                "computing it. They refuse when called."
            ),
            "categories": dict(sorted(categories.items(), key=lambda kv: -kv[1])),
        }
    except Exception:  # noqa: BLE001
        logger.exception("Could not read the ability registry.")
        return {"error": "The ability registry could not be read."}


def _api_surface() -> dict[str, Any]:
    """Endpoint counts straight off the mounted FastAPI app."""
    try:
        from ..main import app  # noqa: PLC0415

        paths: set[str] = set()
        authed = 0
        for route in app.routes:
            path = getattr(route, "path", None)
            if not path:
                continue
            paths.add(path)
            # A dependency named for the security scheme is how this codebase
            # spells "authenticated"; counted rather than assumed.
            deps = getattr(getattr(route, "dependant", None), "dependencies", []) or []
            if any("verify_premium" in str(getattr(d, "call", "")) for d in deps):
                authed += 1
        return {"routes": len(paths), "routes_requiring_auth": authed}
    except Exception:  # noqa: BLE001
        logger.exception("Could not enumerate the API surface.")
        return {"error": "The API surface could not be enumerated."}


def _providers() -> dict[str, Any]:
    """
    Which AI and integration providers are configured, by NAME of the variable
    only. No key, and no prefix of a key, ever appears here.
    """
    watched = {
        "anthropic": "ANTHROPIC_API_KEY",
        "openai": "OPENAI_API_KEY",
        "google": "GOOGLE_API_KEY",
        "perplexity": "PERPLEXITY_API_KEY",
        "xai": "XAI_API_KEY",
        "stripe": "STRIPE_SECRET_KEY",
        "sendgrid": "SENDGRID_API_KEY",
        "twilio": "TWILIO_AUTH_TOKEN",
        "elevenlabs": "ELEVENLABS_API_KEY",
        "eia": "EIA_API_KEY",
    }
    configured = {}
    for name, var in watched.items():
        value = (os.getenv(var) or "").strip()
        # A placeholder is not configuration. Counting "sk_test_mock" as Stripe
        # being ready is exactly how checkout came to fabricate a sale.
        configured[name] = bool(value) and "mock" not in value.lower()
    return {
        "configured": {k: v for k, v in configured.items() if v},
        "missing": sorted(k for k, v in configured.items() if not v),
    }


def _tenancy(db: Session) -> dict[str, Any]:
    try:
        from ..models import MarketSite, Tenant, User  # noqa: PLC0415

        tenants = db.query(Tenant).count()
        paying = (
            db.query(Tenant)
            .filter(Tenant.subscription_status.in_(("active", "trialing", "past_due")))
            .count()
        )
        return {
            "tenants": tenants,
            "tenants_with_a_settled_subscription": paying,
            "tenants_awaiting_payment": tenants - paying,
            "users": db.query(User).count(),
            "market_sites": db.query(MarketSite).count(),
        }
    except Exception:  # noqa: BLE001
        logger.exception("Could not read tenancy counts.")
        return {"error": "Tenancy counts could not be read."}


def _backups() -> dict[str, Any]:
    try:
        from .db_backup import configured_from  # noqa: PLC0415

        # Reports which variable NAMES supplied the destination, never values.
        return {"destination_from": configured_from()}
    except Exception:  # noqa: BLE001
        return {"error": "Backup configuration could not be read."}


def snapshot(db: Session, *, tenant_id: str) -> dict[str, Any]:
    """
    The platform as it stands.

    The operator gets the whole picture. A hosted customer gets their own
    account and the ability library, and not the provider list, the tenant
    roster, or the backup configuration — those describe the platform they rent,
    not the business they run on it.
    """
    owner = is_owner(tenant_id)

    result: dict[str, Any] = {
        "ok": True,
        "measured_at_call_time": True,
        "viewer": "operator" if owner else "customer",
        "abilities": _abilities(),
    }

    if not owner:
        try:
            from ..models import MarketSite, Tenant  # noqa: PLC0415
            from .tenancy import scope  # noqa: PLC0415

            tenant = db.query(Tenant).filter(Tenant.tenant_id == tenant_id).first()
            result["account"] = {
                "tenant_id": tenant_id,
                "plan": getattr(tenant, "subscription_tier", None),
                "subscription_status": getattr(tenant, "subscription_status", None),
                "market_sites": scope(
                    db.query(MarketSite), MarketSite, tenant_id
                ).count(),
            }
        except Exception:  # noqa: BLE001
            logger.exception("Could not read the customer's own account.")
            result["account"] = {"error": "Account details could not be read."}
        return result

    result["api"] = _api_surface()
    result["providers"] = _providers()
    result["tenancy"] = _tenancy(db)
    result["backups"] = _backups()
    return result
