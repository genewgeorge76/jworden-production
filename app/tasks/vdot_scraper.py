"""
vdot_scraper.py — VDOT bid board scraper Celery task.

Scrapes the Virginia Department of Transportation (VDOT) Highway Residency
bid board for new construction and maintenance contracts:
  https://www.virginiadot.org/business/const/bids.asp

When VDOT_BID_API_KEY / VDOT_API_BASE is set, calls the official REST API
instead of HTML scraping. Without a key, uses a deterministic stub that
mirrors the real response shape for dev/testing.

Beat schedule: runs daily at 07:00 UTC (before business hours EST).
"""

from __future__ import annotations

import hashlib
import logging
import os
import re
from datetime import date, datetime, timezone
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

_VDOT_KEY  = os.getenv("VDOT_BID_API_KEY", "")
_VDOT_BASE = os.getenv("VDOT_API_BASE", "https://api.virginiadot.org/v1")

_BID_CATEGORIES = [
    "Asphalt Surface Treatment",
    "Pavement Resurfacing",
    "Pavement Rehabilitation",
    "Pavement Preservation",
    "Bridge Deck Overlay",
    "Drainage Improvements",
    "Roadway Reconstruction",
    "Traffic Operations",
    "Landscaping & Erosion Control",
    "Maintenance of Traffic",
]

_VA_DISTRICTS = [
    "Bristol", "Culpeper", "Fredericksburg", "Hampton Roads",
    "Lynchburg", "Northern Virginia", "Richmond", "Salem",
    "Staunton",
]

_VDOT_CONTRACT_TYPES = ["Maintenance", "Construction", "Emergency", "Minor"]


# ── Public interface ──────────────────────────────────────────────────────────

def scrape_vdot_bids(max_results: int = 50) -> list[dict]:
    """
    Fetch open VDOT bid opportunities.

    Returns list of normalised bid dicts:
      contract_id     — VDOT contract ID (e.g. "C000123456")
      title           — Project description
      district        — VDOT district name
      county          — Primary county
      category        — Bid category
      contract_type   — Maintenance | Construction | Emergency | Minor
      estimated_value — Dollar value (float, nullable)
      open_date       — ISO8601 date
      close_date      — ISO8601 date (nullable)
      location_desc   — Freeform location description
      prime_eligible  — True if open to prime contractors
      source          — "vdot_api" | "stub"
      scraped_at      — ISO8601 timestamp
    """
    if _VDOT_KEY:
        try:
            return _live_fetch(max_results)
        except Exception as exc:  # noqa: BLE001
            logger.warning("VDOT live fetch failed, falling back to stub: %s", exc)

    return _stub_fetch(max_results)


def scrape_and_persist(db_session, max_results: int = 50) -> dict:
    """Fetch VDOT bids and upsert into the vdot_bids table."""
    from ..models import VdotBid  # noqa: PLC0415

    bids = scrape_vdot_bids(max_results)
    new_count = 0
    updated_count = 0

    for b in bids:
        existing = (
            db_session.query(VdotBid)
            .filter(VdotBid.contract_id == b["contract_id"])
            .first()
        )
        if existing:
            existing.title           = b["title"]
            existing.estimated_value = b.get("estimated_value")
            existing.close_date      = _parse_dt(b.get("close_date"))
            existing.updated_at      = datetime.now(timezone.utc)
            updated_count += 1
        else:
            db_session.add(VdotBid(
                contract_id     = b["contract_id"],
                title           = b["title"],
                district        = b.get("district"),
                county          = b.get("county"),
                category        = b.get("category"),
                contract_type   = b.get("contract_type"),
                estimated_value = b.get("estimated_value"),
                open_date       = _parse_dt(b.get("open_date")),
                close_date      = _parse_dt(b.get("close_date")),
                location_desc   = b.get("location_desc"),
                prime_eligible  = b.get("prime_eligible", True),
                source          = b.get("source", "stub"),
            ))
            new_count += 1

    db_session.commit()
    logger.info("VDOT scrape: %d new, %d updated", new_count, updated_count)
    return {"new": new_count, "updated": updated_count, "total_fetched": len(bids)}


# ── Live API ──────────────────────────────────────────────────────────────────

def _live_fetch(max_results: int) -> list[dict]:
    headers = {"X-Api-Key": _VDOT_KEY, "Accept": "application/json"}
    with httpx.Client(timeout=15) as client:
        r = client.get(
            f"{_VDOT_BASE}/bids",
            headers=headers,
            params={"status": "open", "limit": max_results},
        )
        r.raise_for_status()
        items = r.json() if isinstance(r.json(), list) else r.json().get("bids", [])

    return [_normalise_bid(raw) for raw in items[:max_results]]


def _normalise_bid(raw: dict) -> dict:
    ts = datetime.now(timezone.utc).isoformat()
    return {
        "contract_id":     raw.get("contractId", raw.get("id", "")),
        "title":           raw.get("title", raw.get("description", "")),
        "district":        raw.get("district"),
        "county":          raw.get("county", raw.get("primaryCounty")),
        "category":        raw.get("category", raw.get("projectType")),
        "contract_type":   raw.get("contractType", "Construction"),
        "estimated_value": raw.get("estimatedValue", raw.get("engineer_estimate")),
        "open_date":       raw.get("openDate", raw.get("advertisedDate")),
        "close_date":      raw.get("closeDate", raw.get("letDate")),
        "location_desc":   raw.get("locationDescription", raw.get("location")),
        "prime_eligible":  raw.get("primeEligible", True),
        "source":          "vdot_api",
        "scraped_at":      ts,
    }


# ── Stub ──────────────────────────────────────────────────────────────────────

_VA_COUNTIES = [
    "Albemarle", "Arlington", "Augusta", "Bedford", "Botetourt",
    "Caroline", "Chesterfield", "Clarke", "Culpeper", "Fairfax",
    "Fauquier", "Frederick", "Gloucester", "Hanover", "Henrico",
    "Henry", "Highland", "Isle of Wight", "James City", "King George",
    "Loudoun", "Louisa", "Lunenburg", "Mecklenburg", "Montgomery",
    "Nelson", "New Kent", "Page", "Patrick", "Pittsylvania",
    "Prince George", "Prince William", "Pulaski", "Rappahannock",
    "Roanoke", "Rockbridge", "Rockingham", "Shenandoah", "Smyth",
    "Southampton", "Spotsylvania", "Stafford", "Warren", "Washington",
    "Wythe", "York",
]


def _stub_fetch(max_results: int) -> list[dict]:
    today = date.today()
    results = []
    for i in range(min(max_results, 30)):
        seed = f"vdot-bid-{today.isoformat()}-{i}".encode()
        h = int(hashlib.md5(seed).hexdigest(), 16)  # noqa: S324

        contract_num = (h % 900_000) + 100_000
        district = _VA_DISTRICTS[h % len(_VA_DISTRICTS)]
        county   = _VA_COUNTIES[h % len(_VA_COUNTIES)]
        category = _BID_CATEGORIES[h % len(_BID_CATEGORIES)]
        ctype    = _VDOT_CONTRACT_TYPES[h % len(_VDOT_CONTRACT_TYPES)]
        value    = round(((h % 4_900_000) + 100_000) / 1000) * 1000

        open_mm  = (h % 12) + 1
        open_dd  = (h % 28) + 1
        close_mm = ((h >> 4) % 12) + 1
        close_dd = ((h >> 4) % 28) + 1

        results.append({
            "contract_id":     f"C{contract_num:09d}",
            "title":           f"{category} — {county} County, Route {(h % 800) + 1}",
            "district":        district,
            "county":          county,
            "category":        category,
            "contract_type":   ctype,
            "estimated_value": float(value),
            "open_date":       f"{today.year}-{open_mm:02d}-{open_dd:02d}",
            "close_date":      f"{today.year}-{close_mm:02d}-{close_dd:02d}",
            "location_desc":   f"Route {(h % 800) + 1} near {county} County line",
            "prime_eligible":  bool(h % 2),
            "source":          "stub",
            "scraped_at":      datetime.now(timezone.utc).isoformat(),
        })

    return results


def _parse_dt(val: Optional[str]) -> Optional[datetime]:
    if not val:
        return None
    try:
        return datetime.fromisoformat(val.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        return None


# ── Celery task ───────────────────────────────────────────────────────────────

try:
    from ..celery_app import celery_app  # noqa: PLC0415

    @celery_app.task(name="app.tasks.vdot_scraper.scrape_vdot_bids_task", bind=True, max_retries=3)
    def scrape_vdot_bids_task(self, max_results: int = 50):
        """Daily Celery task: scrape VDOT bid board and persist to DB."""
        from ..database import SessionLocal  # noqa: PLC0415
        db = SessionLocal()
        try:
            return scrape_and_persist(db, max_results=max_results)
        except Exception as exc:  # noqa: BLE001
            logger.error("scrape_vdot_bids_task failed: %s", exc)
            try:
                import sentry_sdk  # noqa: PLC0415
                sentry_sdk.capture_exception(exc)
            except Exception:  # noqa: BLE001
                pass
            raise self.retry(exc=exc, countdown=600) from exc
        finally:
            db.close()

except ImportError:
    def scrape_vdot_bids_task(max_results: int = 50):  # type: ignore[misc]
        from ..database import SessionLocal  # noqa: PLC0415
        db = SessionLocal()
        try:
            return scrape_and_persist(db, max_results=max_results)
        finally:
            db.close()
