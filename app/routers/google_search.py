"""
google_search.py — web search endpoint for the Command Center.

This router was referenced but never committed. app/main.py imports it at line
278 and mounts it at line 611, so `from app.main import app` raised ImportError
at startup — the same failure mode as the missing geocoding, google_sheets and
google_photos services, and the one owner_auth.py documents in its own docstring.

Unlike owner_auth, this one has a verifiable contract on both sides, so it is
implemented rather than stubbed:

  caller   src/api/client.js:702
           searchGoogle: (q, num = 8) =>
             protectedRequest('GET', `/api/v1/google-search?q=${q}&num=${num}`)

  backing  app/services/web_search.py -> async search(query, *, max_results, deep)

`protectedRequest` sends `Authorization: Bearer <token>`, which is what
verify_premium_security reads, so auth is applied at router level to match.

Naming note: the endpoint is called "google-search" for historical reasons but
web_search.py is backed by Tavily, not Google. The response carries
`engine: "tavily"` so callers can see what actually served the result. Renaming
the route would break the existing frontend caller, so the name stays and this
comment records the discrepancy.

web_search.search() never raises and returns an `error` field when the provider
is unconfigured or failing, so this endpoint surfaces that verbatim rather than
converting it to a 5xx — an unconfigured TAVILY_API_KEY is a configuration state
the Command Center should display, not a server fault.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Query

from ..core.security import verify_premium_security
from ..services import web_search

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/google-search",
    tags=["search"],
    dependencies=[Depends(verify_premium_security)],
)


@router.get("", summary="Run a web search")
async def google_search(
    q: str = Query("", description="Search query"),
    num: int = Query(8, ge=1, le=25, description="Maximum results to return"),
    deep: bool = Query(False, description="Use the provider's advanced search depth"),
):
    """
    Search the web and return `{query, answer, results, engine, error?}`.

    Returns 200 with an `error` field rather than a 5xx when the provider is
    unconfigured, so the caller can distinguish "not set up" from "broken".
    """
    result = await web_search.search(q, max_results=num, deep=deep)
    result["configured"] = web_search.is_available()
    return result
