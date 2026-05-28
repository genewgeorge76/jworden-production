"""
web_search.py — Tavily-backed web search tool for Jarvis.

Set env:
  TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxxxxxx
  (Optional) TAVILY_MAX_RESULTS=5

Tavily free tier = 1,000 searches/month, no card required.
Get a key at https://app.tavily.com/.

Returns a compact dict:
  { "query": str, "answer": str | None, "results": [ {title, url, snippet} ], "engine": "tavily" }

Falls back to a stub when no key is set so callers can still test the path.
"""
from __future__ import annotations
import os
import logging
from typing import Any

from app.services import runtime_config as _cfg

logger = logging.getLogger(__name__)

def _key() -> str:        return _cfg.get("TAVILY_API_KEY")
def _max_results() -> int:
    raw = _cfg.get("TAVILY_MAX_RESULTS") or "5"
    try:    return int(raw)
    except (TypeError, ValueError): return 5
_TAVILY_URL = "https://api.tavily.com/search"


def is_available() -> bool:
    return bool(_key())


async def search(query: str, *, max_results: int | None = None, deep: bool = False) -> dict[str, Any]:
    """
    Run a web search. Safe for any caller — never raises.
    deep=True triggers Tavily's 'advanced' search depth (slower, richer).
    """
    q = (query or "").strip()
    if not q:
        return {"query": "", "answer": None, "results": [], "engine": "tavily", "error": "empty query"}

    if not _key():
        return {
            "query": q,
            "answer": None,
            "results": [],
            "engine": "tavily",
            "error": "TAVILY_API_KEY not set \u2014 add it in Command Center → Integrations to enable live web search.",
        }

    try:
        import httpx  # type: ignore
    except ImportError:
        return {"query": q, "answer": None, "results": [], "engine": "tavily", "error": "httpx not installed"}

    payload = {
        "api_key":            _key(),
        "query":              q,
        "search_depth":       "advanced" if deep else "basic",
        "include_answer":     True,
        "include_raw_content": False,
        "max_results":        int(max_results or _max_results()),
    }
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(_TAVILY_URL, json=payload)
        if r.status_code != 200:
            logger.warning("[WEB_SEARCH] Tavily non-200: %s %s", r.status_code, r.text[:200])
            return {"query": q, "answer": None, "results": [], "engine": "tavily", "error": f"http {r.status_code}"}
        data = r.json()
        return {
            "query":   q,
            "answer":  data.get("answer"),
            "results": [
                {
                    "title":   item.get("title", ""),
                    "url":     item.get("url", ""),
                    "snippet": (item.get("content") or "")[:500],
                    "score":   item.get("score"),
                }
                for item in (data.get("results") or [])[:int(max_results or _max_results())]
            ],
            "engine": "tavily",
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("[WEB_SEARCH] Tavily call failed: %s", exc)
        return {"query": q, "answer": None, "results": [], "engine": "tavily", "error": str(exc)[:200]}
