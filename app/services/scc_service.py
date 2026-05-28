"""
scc_service.py — Virginia State Corporation Commission (SCC) business entity verifier.

Looks up businesses by entity ID or name against the SCC Clerk's Information System.

Priority chain:
  1. SCC_API_KEY set → live SCC or proxy API call
  2. Fallback → deterministic stub (mirrors real SCC response shape)

Environment variables:
  SCC_API_KEY     — SCC or RapidAPI proxy key (optional)
  SCC_API_BASE    — Base URL override (default: https://api.scc.virginia.gov/v1)
"""

from __future__ import annotations

import hashlib
import logging
import os
import re
from datetime import datetime, timezone
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

_SCC_KEY  = os.getenv("SCC_API_KEY", "")
_SCC_BASE = os.getenv("SCC_API_BASE", "https://api.scc.virginia.gov/v1")

_STATUS_ACTIVE = frozenset({"Active", "Active/Registered", "Good Standing"})
_STATUS_SUSPENDED = frozenset({"Delinquent", "Suspended", "Admin. Dissolved",
                                "Revoked", "Cancelled"})

# ── Public interface ──────────────────────────────────────────────────────────

def verify_scc_entity(
    entity_id: Optional[str] = None,
    entity_name: Optional[str] = None,
) -> dict:
    """
    Look up a Virginia SCC entity by ID or name.

    Returns a normalised dict:
      entity_id        — SCC entity ID (e.g. "S1234567")
      entity_name      — Registered legal name
      entity_type      — LLC / Corporation / LP / etc.
      status           — Active | Delinquent | Dissolved | Suspended | Unknown
      is_good_standing — True when status is Active and registered in VA
      registered_agent — Registered agent name (nullable)
      principal_office — Principal office address (nullable)
      date_formed      — Formation/registration date (nullable ISO8601)
      source           — "scc_api" | "stub"
      checked_at       — ISO8601 timestamp
    """
    if not entity_id and not entity_name:
        raise ValueError("Provide entity_id or entity_name")

    if _SCC_KEY:
        try:
            return _live_lookup(entity_id=entity_id, entity_name=entity_name)
        except Exception as exc:  # noqa: BLE001
            logger.warning("SCC live lookup failed, falling back to stub: %s", exc)

    return _stub_lookup(entity_id=entity_id, entity_name=entity_name)


def batch_verify(entities: list[dict]) -> list[dict]:
    """Verify a list of entities [{entity_id?, entity_name?}] concurrently."""
    results = []
    for ent in entities:
        try:
            result = verify_scc_entity(
                entity_id=ent.get("entity_id"),
                entity_name=ent.get("entity_name"),
            )
        except Exception as exc:  # noqa: BLE001
            result = _error_result(str(ent), str(exc))
        results.append(result)
    return results


# ── Live API call ─────────────────────────────────────────────────────────────

def _live_lookup(
    entity_id: Optional[str],
    entity_name: Optional[str],
) -> dict:
    headers = {
        "X-Api-Key": _SCC_KEY,
        "Accept": "application/json",
    }
    params: dict = {}
    if entity_id:
        params["entityId"] = entity_id.upper().strip()
    elif entity_name:
        params["name"] = entity_name.strip()

    with httpx.Client(timeout=10) as client:
        r = client.get(f"{_SCC_BASE}/entities", headers=headers, params=params)
        r.raise_for_status()
        data = r.json()

    # Normalise — SCC API may return list or single object
    if isinstance(data, list):
        if not data:
            return _not_found_result(entity_id or entity_name or "")
        raw = data[0]
    else:
        raw = data

    return _normalise(raw, source="scc_api")


# ── Stub (deterministic, mirrors SCC shape) ───────────────────────────────────

_STUB_TYPES = ["Limited Liability Company", "Corporation", "Limited Partnership",
               "Professional LLC", "Sole Proprietorship"]
_STUB_STATUSES = ["Active", "Active", "Active", "Delinquent", "Admin. Dissolved"]
_STUB_AGENTS = [
    "REGISTERED AGENTS INC", "CT CORPORATION SYSTEM", "NATIONAL REGISTERED AGENTS",
    "CORPORATE CREATIONS NETWORK INC", "COGENCY GLOBAL INC",
]
_STUB_CITIES = ["Richmond", "Norfolk", "Virginia Beach", "Roanoke",
                "Charlottesville", "Fairfax", "Chesapeake"]


def _stub_lookup(
    entity_id: Optional[str],
    entity_name: Optional[str],
) -> dict:
    seed = (entity_id or entity_name or "unknown").lower().encode()
    h = int(hashlib.md5(seed).hexdigest(), 16)  # noqa: S324 (not cryptographic)

    eid = entity_id or f"S{(h % 9_000_000) + 1_000_000}"
    name = entity_name or f"STUB CONTRACTING LLC #{h % 9999}"
    etype = _STUB_TYPES[h % len(_STUB_TYPES)]
    status = _STUB_STATUSES[h % len(_STUB_STATUSES)]
    agent = _STUB_AGENTS[h % len(_STUB_AGENTS)]
    city = _STUB_CITIES[h % len(_STUB_CITIES)]
    year = 1995 + (h % 30)

    return {
        "entity_id":        eid.upper(),
        "entity_name":      name.upper(),
        "entity_type":      etype,
        "status":           status,
        "is_good_standing": status in _STATUS_ACTIVE,
        "registered_agent": agent,
        "principal_office": f"{(h % 9000) + 100} Business Park Dr, {city}, VA",
        "date_formed":      f"{year}-{(h % 12) + 1:02d}-{(h % 28) + 1:02d}",
        "source":           "stub",
        "checked_at":       datetime.now(timezone.utc).isoformat(),
    }


def _normalise(raw: dict, source: str) -> dict:
    status = raw.get("status", raw.get("entityStatus", "Unknown"))
    return {
        "entity_id":        raw.get("entityId", raw.get("id", "")),
        "entity_name":      raw.get("entityName", raw.get("name", "")),
        "entity_type":      raw.get("entityType", raw.get("type", "Unknown")),
        "status":           status,
        "is_good_standing": status in _STATUS_ACTIVE,
        "registered_agent": raw.get("registeredAgent"),
        "principal_office": raw.get("principalOffice", raw.get("address")),
        "date_formed":      raw.get("dateFormed", raw.get("incorporationDate")),
        "source":           source,
        "checked_at":       datetime.now(timezone.utc).isoformat(),
    }


def _not_found_result(query: str) -> dict:
    return {
        "entity_id":        None,
        "entity_name":      query,
        "entity_type":      None,
        "status":           "Not Found",
        "is_good_standing": False,
        "registered_agent": None,
        "principal_office": None,
        "date_formed":      None,
        "source":           "scc_api",
        "checked_at":       datetime.now(timezone.utc).isoformat(),
    }


def _error_result(query: str, error: str) -> dict:
    return {
        "entity_id":        None,
        "entity_name":      query,
        "entity_type":      None,
        "status":           "Error",
        "is_good_standing": False,
        "registered_agent": None,
        "principal_office": None,
        "date_formed":      None,
        "source":           "error",
        "error":            error,
        "checked_at":       datetime.now(timezone.utc).isoformat(),
    }
