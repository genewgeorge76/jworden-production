"""
Traffic per website, for the operator across every site and for a customer
across their own.

Both Google clients were written for exactly one property. gsc_client reads a
single GSC_SITE_URL and ga4_client a single GA4_PROPERTY_ID, and every public
function in each is hardwired to it. That answers "how is the flagship doing"
and cannot answer "how is each of the sites in the programme doing", which is
the question a website factory exists to answer.

WHAT THIS ASKS OF THE OPERATOR: almost nothing
──────────────────────────────────────────────
No per-site configuration, no mapping table, no rows to keep in sync.

  Search Console — the property is derived from the hostname.
                   richmondasphaltpaving.com → sc-domain:richmondasphaltpaving.com
                   A domain property covers www and every subdomain, so one
                   grant per domain is the whole job. GSC has no cross-property
                   query, so a service account must be added as a user on each
                   one; that is Google's constraint, not this module's.

  Analytics      — one property, filtered by the hostName dimension. GA4 does
                   support a property per domain, but that is a great deal of
                   administration for the same numbers, and a shared property
                   with a hostname filter is the arrangement most multi-site
                   operators actually run.

So the setup is one service account, granted on each Search Console property
and on the one GA4 property. Nothing in the database changes.

WHAT IT REPORTS WHEN IT CANNOT ANSWER
─────────────────────────────────────
Absent numbers, and the reason. Never a zero. A zero is a measurement — it
means nobody visited — and rendering "not connected" as 0 clicks tells the
operator his site is dead when in truth nothing was asked.
"""

from __future__ import annotations

import logging
from typing import Any, Optional

from sqlalchemy.orm import Session

from ..models import MarketSite
from . import ga4_client, gsc_client
from .tenancy import is_owner, scope

logger = logging.getLogger(__name__)

#: Reasons a site has no numbers. Each is a different thing to go and do.
NOT_CONFIGURED = "not_configured"
NO_ACCESS = "no_access"
NO_DATA = "no_data"
OK = "ok"


def _gsc_property_for(hostname: str) -> str:
    """
    The Search Console property that covers a hostname.

    A domain property covers the apex, www, and every subdomain in one, which
    is why it is preferred over a URL-prefix property here: the alternative
    needs a separate grant for https://, http://, and www, and misses any the
    operator forgets.
    """
    host = (hostname or "").strip().lower()
    for prefix in ("https://", "http://"):
        if host.startswith(prefix):
            host = host[len(prefix) :]
    host = host.rstrip("/")
    if host.startswith("www."):
        host = host[4:]
    return f"sc-domain:{host}"


def _search_console_for(hostname: str, days: int) -> dict[str, Any]:
    """Clicks, impressions and average position for one site."""
    service = gsc_client._build_service()
    if service is None:
        return {
            "status": NOT_CONFIGURED,
            "detail": (
                "Search Console is not connected. Set GSC_SERVICE_ACCOUNT_JSON "
                "to a base64 service-account key."
            ),
        }

    site = _gsc_property_for(hostname)
    start, end = gsc_client._date_range(days)

    try:
        rows = gsc_client._run_query(
            service, site, start, end, dimensions=[], row_limit=1
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("GSC query failed for %s: %s", site, exc)
        return {"status": NO_ACCESS, "detail": str(exc)[:200], "property": site}

    if not rows:
        # Two very different situations arrive here identically: the service
        # account cannot see the property, and the property has no traffic.
        # _run_query swallows the API error, so this cannot tell them apart and
        # does not pretend to.
        return {
            "status": NO_DATA,
            "property": site,
            "detail": (
                "No rows returned. Either the service account has not been "
                f"added as a user on {site}, or the site had no impressions "
                "in this window."
            ),
        }

    row = rows[0]
    return {
        "status": OK,
        "property": site,
        "clicks": row.get("clicks", 0),
        "impressions": row.get("impressions", 0),
        "ctr_percent": row.get("ctr", 0),
        "average_position": row.get("position", 0),
    }


def _analytics_for(hostname: str, days: int) -> dict[str, Any]:
    """Sessions and users for one site, out of the shared GA4 property."""
    client = ga4_client._build_client()
    property_id = ga4_client._property_id()

    if client is None or not property_id:
        return {
            "status": NOT_CONFIGURED,
            "detail": (
                "Analytics is not connected. Set GA4_SERVICE_ACCOUNT_JSON and "
                "GA4_PROPERTY_ID."
            ),
        }

    host = (hostname or "").strip().lower().rstrip("/")
    start, end = ga4_client._date_range(days)

    try:
        from google.analytics.data_v1beta.types import (  # noqa: PLC0415
            Filter,
            FilterExpression,
        )

        # CONTAINS rather than EXACT: GA4 records the hostname the browser
        # actually used, so a site reachable at both example.com and
        # www.example.com produces two values and an exact match silently drops
        # half the traffic.
        host_filter = FilterExpression(
            filter=Filter(
                field_name="hostName",
                string_filter=Filter.StringFilter(
                    value=host.removeprefix("www."),
                    match_type=Filter.StringFilter.MatchType.CONTAINS,
                ),
            )
        )
        rows = ga4_client._run_report(
            client,
            property_id,
            start,
            end,
            dimensions=[],
            metrics=["sessions", "totalUsers", "screenPageViews"],
            dimension_filter=host_filter,
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("GA4 query failed for %s: %s", host, exc)
        return {"status": NO_ACCESS, "detail": str(exc)[:200]}

    if not rows:
        return {
            "status": NO_DATA,
            "detail": (
                f"No sessions recorded for {host} in this window. If the site "
                "is live, check that its GA4 tag reports into property "
                f"{property_id}."
            ),
        }

    row = rows[0]
    return {
        "status": OK,
        "property_id": property_id,
        "sessions": _as_int(row.get("sessions")),
        "users": _as_int(row.get("totalUsers")),
        "page_views": _as_int(row.get("screenPageViews")),
    }


def _as_int(value: Any) -> Optional[int]:
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def for_tenant(
    db: Session, *, tenant_id: str, days: int = 28, hostname: Optional[str] = None
) -> dict[str, Any]:
    """
    Every site this caller may see, with its traffic.

    Scoped through services/tenancy: the operator gets his whole bucket, a
    customer gets exactly their own sites. A customer cannot read another
    tenant's numbers by asking for their hostname, because the site list is
    filtered before any Google call is made.
    """
    query = scope(db.query(MarketSite), MarketSite, tenant_id)
    if hostname:
        query = query.filter(MarketSite.hostname == hostname.strip().lower())

    sites = query.order_by(MarketSite.hostname.asc()).all()

    results = []
    for site in sites:
        results.append(
            {
                "hostname": site.hostname,
                "site_title": site.site_title,
                "city_target": site.city_target,
                "state_target": site.state_target,
                "is_active": bool(site.is_active),
                "search_console": _search_console_for(site.hostname, days),
                "analytics": _analytics_for(site.hostname, days),
            }
        )

    connected = sum(1 for r in results if r["search_console"]["status"] == OK)

    return {
        "ok": True,
        "window_days": days,
        "viewer": "operator" if is_owner(tenant_id) else "customer",
        "site_count": len(results),
        "sites_reporting": connected,
        # Totals cover only the sites that actually answered. Summing across a
        # set where half returned "not connected" produces a number that looks
        # like a measurement and is not one.
        "totals": _totals(results),
        "sites": results,
    }


def _totals(results: list[dict]) -> dict[str, Any]:
    answering = [r for r in results if r["search_console"]["status"] == OK]
    if not answering:
        return {
            "status": NO_DATA,
            "detail": "No site returned Search Console data, so there is nothing to total.",
        }

    clicks = sum(r["search_console"].get("clicks") or 0 for r in answering)
    impressions = sum(r["search_console"].get("impressions") or 0 for r in answering)
    sessions = sum(
        r["analytics"].get("sessions") or 0
        for r in results
        if r["analytics"]["status"] == OK
    )
    return {
        "status": OK,
        "across_sites": len(answering),
        "clicks": clicks,
        "impressions": impressions,
        "sessions": sessions,
    }
