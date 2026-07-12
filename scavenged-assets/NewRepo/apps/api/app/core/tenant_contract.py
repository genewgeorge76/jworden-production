"""
tenant_contract.py — Python-side tenant profile registry.

Mirrors the TypeScript TenantConfig in packages/core/src/tenant.ts.
Used by ai_foreman.py to build tenant-aware brand descriptors.

Loading order:
  1. TENANT_MANIFEST_PATH env → load JSON file
  2. Otherwise → return empty dict (ai_foreman falls back to _TENANT_BRANDS dict)
"""
from __future__ import annotations

import json
import logging
import os

logger = logging.getLogger(__name__)


def profiles_by_key() -> dict[str, dict]:
    """Load tenant profiles from TENANT_MANIFEST_PATH or return {}."""
    path = os.environ.get("TENANT_MANIFEST_PATH", "").strip()
    if not path:
        return {}
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, list):
            return {p.get("key", ""): p for p in data if isinstance(p, dict) and p.get("key")}
        if isinstance(data, dict):
            return data
        return {}
    except FileNotFoundError:
        return {}
    except Exception as exc:  # noqa: BLE001
        logger.warning("Could not load tenant manifest at %s: %s", path, exc)
        return {}


def infer_default_state(profile: dict) -> str:
    """Return the best state code for this profile, default 'VA'."""
    return (
        profile.get("default_state")
        or profile.get("state")
        or profile.get("hq_state")
        or "VA"
    )
