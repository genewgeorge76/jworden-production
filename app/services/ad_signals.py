"""
ad_signals.py — Google Ads AI Max signal intelligence for JWordenAI.

Two subsystems:

  1. URL Exclusion Manager — Tracks which URL paths should be excluded from
     Google Ads AI Max URL expansion (careers, blog, FAQ, legal, admin).
     Returns structured payloads ready to paste into Google Ads or feed
     into the Google Ads API UrlExpansionOptOut resource.

  2. First-Party CRM Export — Pulls closed-deal leads from the database and
     exports them in Google Ads Customer Match format (SHA256-hashed emails +
     phones) for Google Ads Data Manager.  Gives the bidding AI a "closed sale"
     signal rather than just "form fill", dramatically improving tROAS accuracy.

Environment (optional):
  GOOGLE_ADS_SITE_DOMAIN — canonical domain for building absolute exclusion URLs
                           (default: jworden.com)
"""

from __future__ import annotations

import hashlib
import logging
import os
import re
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

_DOMAIN = os.getenv("GOOGLE_ADS_SITE_DOMAIN", "jworden.com")

# ── Default paths that should NEVER receive paid AI Max traffic ───────────────
# Follows Google Ads URL expansion exclusion syntax (prefix match).
_DEFAULT_EXCLUSIONS: list[dict] = [
    {"path_pattern": "/blog/",      "reason": "Content marketing — not lead gen"},
    {"path_pattern": "/blog",       "reason": "Content marketing root"},
    {"path_pattern": "/careers/",   "reason": "Recruitment — irrelevant queries"},
    {"path_pattern": "/careers",    "reason": "Recruitment root"},
    {"path_pattern": "/jobs/",      "reason": "Job listings — irrelevant queries"},
    {"path_pattern": "/faq/",       "reason": "FAQ — research intent, not conversion"},
    {"path_pattern": "/faq",        "reason": "FAQ root"},
    {"path_pattern": "/privacy",    "reason": "Legal / privacy policy"},
    {"path_pattern": "/terms",      "reason": "Legal / terms of service"},
    {"path_pattern": "/legal",      "reason": "Legal section"},
    {"path_pattern": "/admin/",     "reason": "Admin panel — never expose to ads"},
    {"path_pattern": "/api/",       "reason": "API routes — not user-facing"},
    {"path_pattern": "/login",      "reason": "Auth page — wasted clicks"},
    {"path_pattern": "/register",   "reason": "Auth page — wasted clicks"},
    {"path_pattern": "/404",        "reason": "Error page"},
    {"path_pattern": "/500",        "reason": "Error page"},
    {"path_pattern": "/sitemap",    "reason": "Technical / SEO tooling"},
    {"path_pattern": "/work/",      "reason": "Portfolio — awareness, not conversion"},
    {"path_pattern": "/work",       "reason": "Portfolio root"},
]

# ── High-converting pages that SHOULD receive AI Max traffic ──────────────────
PREFERRED_LANDING_PATHS: list[str] = [
    "/",
    "/quote",
    "/contact",
    "/asphalt-paving",
    "/parking-lot-paving",
    "/driveway-paving",
    "/sealcoating",
    "/commercial-paving",
    "/regional/",
]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _sha256(value: str) -> str:
    """Normalize and SHA256-hash a string per Google Ads Customer Match spec."""
    return hashlib.sha256(value.strip().lower().encode("utf-8")).hexdigest()


def _normalize_phone(phone: str) -> str:
    """Strip non-digits; prepend +1 for 10-digit US numbers."""
    digits = re.sub(r"\D", "", phone or "")
    if len(digits) == 10:
        digits = "1" + digits
    return f"+{digits}"


# ── URL exclusion functions ───────────────────────────────────────────────────

def get_default_exclusions() -> list[dict]:
    """Return the hardcoded default exclusion patterns (no DB required)."""
    return [{**ex, "source": "default", "is_active": True} for ex in _DEFAULT_EXCLUSIONS]


def get_all_exclusions(db: Session) -> list[dict]:
    """
    Merge default exclusions + active DB-persisted exclusions.
    Deduplicates by path_pattern; DB entries override defaults.
    """
    from ..models import AdUrlExclusion  # noqa: PLC0415

    db_rows = (
        db.query(AdUrlExclusion)
        .filter(AdUrlExclusion.is_active == True)  # noqa: E712
        .order_by(AdUrlExclusion.created_at)
        .all()
    )
    db_map: dict[str, dict] = {
        row.path_pattern: {
            "id": row.id,
            "path_pattern": row.path_pattern,
            "reason": row.reason or "",
            "source": "custom",
            "is_active": row.is_active,
            "created_by": row.created_by,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        }
        for row in db_rows
    }

    merged: dict[str, dict] = {}
    for item in get_default_exclusions():
        merged[item["path_pattern"]] = item
    merged.update(db_map)
    return list(merged.values())


def build_google_ads_exclusion_payload(db: Session) -> dict:
    """
    Build a structured payload for Google Ads → Campaign Settings →
    AI Max → URL Expansion → Excluded URLs.

    Returns absolute URLs for the Google Ads API UrlExpansionOptOut resource
    and preferred landing pages for high-intent ad groups.
    """
    exclusions = get_all_exclusions(db)
    active = [e for e in exclusions if e["is_active"]]
    absolute_urls = [f"https://{_DOMAIN}{e['path_pattern']}" for e in active]

    return {
        "domain": _DOMAIN,
        "preferred_landing_pages": [
            f"https://{_DOMAIN}{p}" for p in PREFERRED_LANDING_PATHS
        ],
        "excluded_url_count": len(absolute_urls),
        "excluded_urls": absolute_urls,
        "exclusion_patterns": active,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "instructions": (
            "Paste 'excluded_urls' into Google Ads → Campaign → Settings → "
            "AI Max → URL Expansion → Excluded URLs.  Set 'preferred_landing_pages' "
            "as final URLs in high-intent ad groups to anchor AI Max selection."
        ),
    }


# ── First-party CRM export ────────────────────────────────────────────────────

def export_customer_match(db: Session, limit: int = 5000) -> dict:
    """
    Export first-party closed-deal signals in Google Ads Customer Match format.

    Only exports leads where pipeline_stage='closed_won' OR closed_at IS NOT NULL,
    giving the bidding AI a "closed sale" signal rather than a raw form fill.
    This dramatically improves tROAS and tCPA optimization accuracy.

    Hashing conforms to Google Ads Data Manager SHA256 Customer Match spec:
    https://developers.google.com/google-ads/api/docs/remarketing/audience-types/customer-match
    """
    from ..models import Lead  # noqa: PLC0415

    rows = (
        db.query(Lead)
        .filter(
            (Lead.pipeline_stage == "closed_won") | (Lead.closed_at != None)  # noqa: E711
        )
        .order_by(Lead.closed_at.desc().nullslast())
        .limit(limit)
        .all()
    )

    records: list[dict] = []
    for lead in rows:
        record: dict[str, Any] = {}
        if lead.email:
            record["hashed_email"] = _sha256(lead.email)
        if lead.phone:
            normalized = _normalize_phone(lead.phone)
            if len(normalized) >= 12:
                record["hashed_phone"] = _sha256(normalized)
        if not record:
            continue

        record["segment"] = lead.score_label or "UNKNOWN"
        record["service_type"] = lead.service_type or ""
        record["state_code"] = lead.state_code or ""
        record["closed_at"] = lead.closed_at.isoformat() if lead.closed_at else None
        records.append(record)

    audiences: dict[str, list[dict]] = {"HOT": [], "WARM": [], "COOL": [], "UNKNOWN": []}
    for r in records:
        bucket = r.get("segment", "UNKNOWN")
        if bucket not in audiences:
            bucket = "UNKNOWN"
        hashed = {k: v for k, v in {
            "hashed_email": r.get("hashed_email"),
            "hashed_phone": r.get("hashed_phone"),
        }.items() if v}
        audiences[bucket].append(hashed)

    return {
        "total_records": len(records),
        "audiences": {
            "jworden_closed_sales_hot":     audiences["HOT"],
            "jworden_closed_sales_warm":    audiences["WARM"],
            "jworden_closed_sales_cool":    audiences["COOL"],
            "jworden_closed_sales_unknown": audiences["UNKNOWN"],
        },
        "note": (
            "Upload each audience list via Google Ads → Audience Manager → Customer Lists → "
            "Upload CSV.  Use SHA256 format with 'Email and Phone' match type for highest "
            "match rate.  Recommended bid adjustment: HOT +30%, WARM +15%, COOL +5%."
        ),
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
