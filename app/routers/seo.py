"""
seo.py — SERP engine: programmatic page generation and a sourced keyword store.

Two halves, deliberately separate.

Generation (`/landing-page`, `/silo`) is pure and deterministic. It needs no
external data and is correct with nothing connected, so it works today.

Metrics (`/keywords`, `/keywords.csv`, `/status`) report only what has been
imported, and every row records where its numbers came from. Nothing here
invents a figure: an empty store returns an empty list and says so, which is
the correct answer when nothing has been measured yet.

Two import paths, both real:

  * /keywords/import      — your own export (Ahrefs, Keyword Planner, a CSV
                            you keep by hand). `source` is required.
  * /keywords/import-gsc  — pulls live from Search Console via the existing
                            gsc_client, which fails closed with
                            `not_configured` when the credentials are absent
                            rather than substituting anything.

Search Console gives impressions, clicks and average position for the site's
own queries. It does not report search volume or CPC, so those columns stay
empty on GSC-imported rows instead of being filled from a model.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..core.security import verify_premium_security
from ..database import get_db
from ..models import SeoKeyword
from ..services import serp_engine
from ..services.tenancy import scope, tenant_of

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/seo", tags=["seo"])


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _row(k: SeoKeyword) -> dict[str, Any]:
    return {
        "id": k.id,
        "keyword": k.keyword,
        "vertical": k.vertical,
        "category": k.category,
        "country": k.country,
        "volume_monthly": k.volume_monthly,
        "cpc_usd": k.cpc_usd,
        "difficulty": k.difficulty,
        "current_position": k.current_position,
        "impressions": k.impressions,
        "clicks": k.clicks,
        "intent": k.intent,
        "target_domain": k.target_domain,
        "source": k.source,
        "source_captured_at": k.source_captured_at.isoformat() if k.source_captured_at else None,
    }


# ── Status ────────────────────────────────────────────────────────────────────


@router.get("/status", summary="What keyword data exists, and where it came from")
def seo_status(db: Session = Depends(get_db), auth: dict = Depends(verify_premium_security)):
    """
    Whether a real keyword source is connected, and what is stored.

    Reports emptiness plainly. A dashboard that renders plausible rows when
    nothing is connected teaches you to trust a number that was never
    measured — which is exactly what the hardcoded keyword array did.
    """
    rows = scope(db.query(SeoKeyword), SeoKeyword, tenant_of(auth)).all()
    by_source: dict[str, int] = {}
    for r in rows:
        by_source[r.source] = by_source.get(r.source, 0) + 1

    gsc = {"configured": False, "reason": "gsc_client unavailable"}
    try:
        from ..services import gsc_client  # noqa: PLC0415

        data = gsc_client.get_gsc_data(days=1)
        if data.get("not_configured"):
            gsc = {"configured": False, "reason": data.get("message")}
        else:
            gsc = {"configured": True, "reason": None}
    except Exception as exc:  # noqa: BLE001
        logger.warning("seo: gsc probe failed: %s", exc)
        gsc = {"configured": False, "reason": f"probe_failed: {exc}"}

    return {
        "success": True,
        "keywords_stored": len(rows),
        "by_source": by_source,
        "verticals": sorted({r.vertical for r in rows}),
        "search_console": gsc,
        # Generation needs no data source, so it is available regardless.
        "generation_available": True,
    }


# ── Keyword store ─────────────────────────────────────────────────────────────


class KeywordIn(BaseModel):
    keyword: str = Field(..., min_length=1, max_length=300)
    vertical: str = Field("pavement", max_length=60)
    category: Optional[str] = Field(None, max_length=60)
    country: str = Field("us", min_length=2, max_length=2)
    volume_monthly: Optional[int] = Field(None, ge=0)
    cpc_usd: Optional[float] = Field(None, ge=0)
    difficulty: Optional[int] = Field(None, ge=0, le=100)
    current_position: Optional[float] = Field(None, ge=0)
    impressions: Optional[int] = Field(None, ge=0)
    clicks: Optional[int] = Field(None, ge=0)
    intent: Optional[str] = Field(None, max_length=60)
    target_domain: Optional[str] = Field(None, max_length=200)


class KeywordImport(BaseModel):
    # Required, and with no default. A default would let an unsourced import
    # through under a generic label, which is the hole this closes.
    source: str = Field(..., min_length=2, max_length=120,
                        description="Where these numbers came from, e.g. 'ahrefs-export-2026-08-19'")
    source_captured_at: Optional[datetime] = None
    keywords: list[KeywordIn] = Field(..., min_length=1, max_length=1000)


def _upsert_keyword(db: Session, item: KeywordIn, source: str, captured: Optional[datetime],
                    tenant_id: str) -> bool:
    existing = scope(
        db.query(SeoKeyword)
        .filter(
            SeoKeyword.keyword == item.keyword,
            SeoKeyword.vertical == item.vertical,
            SeoKeyword.country == item.country.lower(),
        ),
        SeoKeyword, tenant_id,
    ).one_or_none()
    created = existing is None
    row = existing or SeoKeyword(
        keyword=item.keyword, vertical=item.vertical, country=item.country.lower()
    )
    if created:
        db.add(row)

    # Only overwrite a metric the import actually carries. A GSC import must
    # not blank the CPC an Ahrefs import supplied earlier — each source knows
    # some columns and nothing about the others.
    for field in ("category", "volume_monthly", "cpc_usd", "difficulty",
                  "current_position", "impressions", "clicks", "intent", "target_domain"):
        value = getattr(item, field)
        if value is not None:
            setattr(row, field, value)

    row.source = source
    row.source_captured_at = captured or _utcnow()
    row.tenant_id = tenant_id
    return created


@router.post("/keywords/import", summary="Import keywords from your own export")
def import_keywords(
    body: KeywordImport,
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    tenant_id = auth.get("tenant_id") or "default"
    created = updated = 0
    for item in body.keywords:
        if _upsert_keyword(db, item, body.source, body.source_captured_at, tenant_id):
            created += 1
        else:
            updated += 1
    db.commit()
    return {"success": True, "source": body.source, "created": created, "updated": updated}


@router.post("/keywords/import-gsc", summary="Import live Search Console queries")
def import_from_search_console(
    vertical: str = Query("pavement", max_length=60),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    """
    Pull the site's own queries from Search Console and store them.

    GSC reports impressions, clicks and average position — real measurements of
    how the site actually ranks. It does not report search volume or CPC, so
    those columns are left empty rather than modelled. A 503 here means the
    credentials are not set; it never falls back to sample data.
    """
    try:
        from ..services import gsc_client  # noqa: PLC0415
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=503, detail=f"Search Console client unavailable: {exc}")

    probe = gsc_client.get_gsc_data(days=1)
    if probe.get("not_configured"):
        raise HTTPException(
            status_code=503,
            detail=probe.get("message") or "Search Console is not configured.",
        )

    rows = gsc_client.get_top_keywords(limit=limit)
    if not rows:
        return {
            "success": True,
            "source": "search-console",
            "created": 0,
            "updated": 0,
            "note": "Search Console returned no queries for the configured site and date range.",
        }

    tenant_id = auth.get("tenant_id") or "default"
    captured = _utcnow()
    created = updated = 0
    for r in rows:
        query = (r.get("query") or "").strip()
        if not query:
            continue
        item = KeywordIn(
            keyword=query[:300],
            vertical=vertical,
            impressions=r.get("impressions"),
            clicks=r.get("clicks"),
            current_position=r.get("position"),
        )
        if _upsert_keyword(db, item, "search-console", captured, tenant_id):
            created += 1
        else:
            updated += 1
    db.commit()
    return {"success": True, "source": "search-console", "created": created, "updated": updated}


@router.get("/keywords", summary="Stored keywords with a coverage-aware summary")
def list_keywords(
    vertical: Optional[str] = None,
    category: Optional[str] = None,
    assumed_ctr: Optional[float] = Query(
        None, ge=0.0, le=1.0,
        description="Supply a click-through rate to get a modelled monthly value. "
                    "It is returned beside the figure so the assumption stays visible.",
    ),
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    q = scope(db.query(SeoKeyword), SeoKeyword, tenant_of(auth))
    if vertical:
        q = q.filter(SeoKeyword.vertical == vertical)
    if category:
        q = q.filter(SeoKeyword.category == category)
    total = q.count()
    rows = [
        _row(k)
        for k in q.order_by(SeoKeyword.volume_monthly.desc().nullslast(), SeoKeyword.keyword)
        .limit(limit)
        .offset(offset)
        .all()
    ]
    return {
        "success": True,
        "total": total,
        "limit": limit,
        "offset": offset,
        "keywords": rows,
        "summary": serp_engine.summarise_keywords(rows, assumed_ctr=assumed_ctr),
    }


@router.get("/keywords.csv", summary="Export stored keywords, provenance included",
            response_class=PlainTextResponse)
def export_keywords_csv(
    vertical: Optional[str] = None,
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    q = scope(db.query(SeoKeyword), SeoKeyword, tenant_of(auth))
    if vertical:
        q = q.filter(SeoKeyword.vertical == vertical)
    rows = [_row(k) for k in q.order_by(SeoKeyword.keyword).all()]
    return PlainTextResponse(
        serp_engine.keywords_to_csv(rows),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="worden_keywords.csv"'},
    )


# ── Generation (no data source required) ──────────────────────────────────────


@router.get("/landing-page", summary="Deterministic landing page + JSON-LD for one city")
def landing_page(
    domain: str = Query(..., min_length=4, max_length=200),
    city: str = Query(..., min_length=1, max_length=120),
    state: str = Query("", max_length=60),
    vertical: str = Query("pavement", max_length=60),
    _: dict = Depends(verify_premium_security),
):
    return {"success": True, **serp_engine.build_landing_page(domain, city, state, vertical)}


class SiloRequest(BaseModel):
    domain: str = Field(..., min_length=4, max_length=200)
    vertical: str = Field("pavement", max_length=60)
    cities: list[tuple[str, str]] = Field(..., min_length=1, max_length=500,
                                          description="(city, state) pairs")
    path_template: str = Field("/{state}/{city}/commercial-contractor", max_length=200)


@router.post("/silo", summary="Build a programmatic city silo")
def build_silo(body: SiloRequest, _: dict = Depends(verify_premium_security)):
    """
    One page per city, duplicates dropped by path.

    The count returned is the number of pages actually built, not the number
    of cities submitted — two spellings of one city collapse to one page, and
    saying otherwise would overstate the silo.
    """
    pages = serp_engine.build_city_silo(
        body.domain, body.cities, body.vertical, body.path_template
    )
    return {
        "success": True,
        "cities_submitted": len(body.cities),
        "pages_built": len(pages),
        "pages": pages,
    }
