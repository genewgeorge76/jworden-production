"""
rfp_hunter.py — B2B Neural Hunter: general commercial RFP discovery via Exa.

Complements `app/tasks/vdot_scraper.py`, which is Virginia/VDOT-specific.
This module searches the live web for commercial paving/construction RFPs
across any state or agency (hospitals, warehouses, school districts,
municipalities, GSA/SAM.gov postings, etc.) via the Exa search API.

When EXA_API_KEY is not configured, falls back to a deterministic stub
result set (clearly labeled) so the feature is testable and demoable
without a live key — matching the vdot_scraper.py stub convention.

Public API
──────────
  search_rfps(query, num_results=10)        → list[dict]  (does not persist)
  search_and_persist(db_session, query, ..)  → dict         (persists new leads)
"""

from __future__ import annotations

import hashlib
import logging
import os
from datetime import date, datetime, timezone
from typing import Optional
from urllib.parse import urlparse

import httpx

logger = logging.getLogger(__name__)

_EXA_KEY = os.getenv("EXA_API_KEY", "")
_EXA_URL = "https://api.exa.ai/search"
_TIMEOUT = 15.0

_STUB_AGENCIES = [
    "Regional Medical Center", "County School District", "Municipal Water Authority",
    "Logistics & Distribution Park", "State University Facilities", "Metro Transit Authority",
]
_STUB_CITIES = [
    "Richmond, VA", "Charlotte, NC", "Columbia, SC", "Raleigh, NC",
    "Baltimore, MD", "Atlanta, GA", "Nashville, TN", "Norfolk, VA",
]


def _domain(url: str) -> str:
    try:
        return urlparse(url).netloc.replace("www.", "")
    except Exception:  # noqa: BLE001
        return ""


def _stub_results(query: str, num_results: int) -> list[dict]:
    """Deterministic, clearly-labeled fake results for demo/dev without an Exa key."""
    today = date.today()
    results = []
    for i in range(min(num_results, 10)):
        seed = f"rfp-{query}-{today.isoformat()}-{i}".encode()
        h = int(hashlib.md5(seed).hexdigest(), 16)  # noqa: S324
        agency = _STUB_AGENCIES[h % len(_STUB_AGENCIES)]
        city = _STUB_CITIES[h % len(_STUB_CITIES)]
        sqft = ((h % 40) + 5) * 1000
        results.append({
            "title": f"[DEMO] {agency} — {sqft:,} sqft paving/resurfacing RFP ({city})",
            "url": f"https://example.com/rfp/demo-{h % 100000}",
            "source_domain": "example.com",
            "published_date": None,
            "summary": (
                f"Simulated result — configure EXA_API_KEY for live commercial RFP search. "
                f"Query: {query!r}."
            ),
            "provider": "stub",
        })
    return results


def _live_search(query: str, num_results: int) -> list[dict]:
    headers = {"x-api-key": _EXA_KEY, "content-type": "application/json"}
    payload = {"query": query, "numResults": num_results, "type": "auto"}
    with httpx.Client(timeout=_TIMEOUT) as client:
        r = client.post(_EXA_URL, headers=headers, json=payload)
        r.raise_for_status()
        data = r.json()

    results = []
    for item in data.get("results", [])[:num_results]:
        url = item.get("url") or ""
        results.append({
            "title": item.get("title") or url or "Untitled RFP",
            "url": url,
            "source_domain": _domain(url),
            "published_date": item.get("publishedDate"),
            "summary": (item.get("text") or "")[:500] or None,
            "provider": "exa",
        })
    return results


def search_rfps(query: str, num_results: int = 10) -> list[dict]:
    """
    Search for commercial RFPs matching `query`. Falls back to stub results
    if EXA_API_KEY is not configured or the live call fails.
    """
    if not query or not query.strip():
        raise ValueError("query is required")
    num_results = max(1, min(int(num_results or 10), 25))

    if _EXA_KEY:
        try:
            return _live_search(query, num_results)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Exa RFP search failed, falling back to stub: %s", exc)

    return _stub_results(query, num_results)


def search_and_persist(db_session, query: str, num_results: int = 10) -> dict:
    """Search for RFPs and upsert new ones (by URL) into commercial_rfp_leads."""
    from ..models import CommercialRfpLead  # noqa: PLC0415

    results = search_rfps(query, num_results)
    new_count = 0
    skipped = 0

    for r in results:
        url = r.get("url") or ""
        if not url:
            skipped += 1
            continue
        existing = (
            db_session.query(CommercialRfpLead)
            .filter(CommercialRfpLead.url == url)
            .first()
        )
        if existing:
            skipped += 1
            continue
        db_session.add(CommercialRfpLead(
            title=r["title"],
            url=url,
            source_domain=r.get("source_domain"),
            query=query,
            published_date=_parse_dt(r.get("published_date")),
            summary=r.get("summary"),
            status="new",
            provider=r.get("provider", "stub"),
        ))
        new_count += 1

    db_session.commit()
    logger.info("RFP hunt %r: %d new, %d skipped (dup/no-url)", query, new_count, skipped)
    return {"new": new_count, "skipped": skipped, "total_fetched": len(results), "query": query}


def _parse_dt(val: Optional[str]) -> Optional[datetime]:
    if not val:
        return None
    try:
        return datetime.fromisoformat(val.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        return None
