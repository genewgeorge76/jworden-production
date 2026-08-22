"""
commercial_bid_hunter.py — Exa AI search for private commercial paving RFPs.

TWO KINDS OF INVENTED DATA CAME OUT OF THIS FILE.

1. A MOCK PIPELINE ON EVERY FAILURE.

   _simulate_hunt() returned two fabricated opportunities — "Mercy Hospital
   Logistics Wing Paving, Private Healthcare Dev, $1,450,000, 32% margin, LOW
   risk" and "Amazon Fulfillment Center Phase 3, $3,200,000, 28%, MED" — in
   exactly the shape real results take, pointing at example.com. It fired when
   EXA_API_KEY was unset, on any HTTP error, and on any exception, and the
   results fed the executive pipeline as live bid opportunities.

2. THE LIVE PATH INVENTED NUMBERS TOO.

   Even with a working key, every result got

       "estimated_value":       f"${(i+1) * 250000:,}"
       "ai_margin_prediction":  f"{30 + i}%"
       "risk_score":            "LOW"

   computed from the loop index. The first hit was worth $250,000 at 30%
   margin, the second $500,000 at 31%, and so on — determined by array
   position, not by the document. A search result carries a title and a URL;
   it does not carry a contract value, and nothing here read one.

   The source comment said "We estimate a margin just to feed the pipeline
   visualizer." Filling a visualiser is not a reason to publish a number
   somebody bids against.

Now: the search returns what the search actually found. No value, no margin,
no risk score, because none of those are known at this stage. When the search
cannot run, it returns an explicit failure and no rows.
"""

import json
import logging
import os
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

ENDPOINT = "https://api.exa.ai/search"

DEFAULT_QUERY = (
    "Private commercial construction paving RFPs, hospital expansions, and "
    "warehouse paving bids posted in the last 7 days"
)


def _failed(reason: str) -> dict:
    """
    An explicit failure carrying no rows.

    Returned as a dict rather than an empty list so a caller cannot mistake
    "the search did not run" for "the search found nothing" — those call for
    different responses, and the old code made them identical.
    """
    return {
        "ok": False,
        "error": reason,
        "results": [],
        "count": 0,
        "note": (
            "No opportunities are listed because none were retrieved. This "
            "response contains no example rows on purpose."
        ),
    }


class CommercialBidHunter:
    """
    Exa AI integration — meaning-based search for private commercial bids.

    Returns leads to qualify, not priced opportunities. Value, margin and risk
    are produced downstream by the estimator against an actual solicitation.
    """

    def __init__(self):
        self.api_key = os.getenv("EXA_API_KEY")
        self.endpoint = ENDPOINT
        if not self.api_key:
            logger.info(
                "EXA_API_KEY is not set — commercial bid hunting is disabled. "
                "Set it to enable the Exa search."
            )

    def hunt_for_rfps(self, query: str = DEFAULT_QUERY, num_results: int = 5) -> dict:
        """
        Search for commercial paving solicitations.

        Returns {"ok": True, "results": [...], "count": n} on success, or
        {"ok": False, "error": ...} with an empty result list on any failure.
        """
        if not self.api_key:
            return _failed(
                "EXA_API_KEY is not configured, so no search was performed."
            )

        payload = {
            "query": query,
            "useAutoprompt": True,
            "numResults": num_results,
            "type": "neural",
        }
        req = urllib.request.Request(
            self.endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers={"x-api-key": self.api_key, "Content-Type": "application/json"},
        )

        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                result = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")[:200]
            logger.error("Exa API HTTP %s: %s", exc.code, detail)
            return _failed(f"Exa API returned HTTP {exc.code}.")
        except Exception as exc:  # noqa: BLE001
            logger.error("Exa API connection failed: %s", exc)
            return _failed(f"Exa search failed: {exc.__class__.__name__}: {exc}")

        found = result.get("results") or []
        retrieved_at = datetime.now(timezone.utc).isoformat()
        results = []
        for res in found:
            url = res.get("url") or ""
            results.append(
                {
                    # Identified by the thing itself, not a generated counter.
                    # The old B2B-{mmdd}-{index} ids collided across runs and
                    # said nothing about the opportunity.
                    "url": url,
                    "source_domain": urllib.parse.urlparse(url).netloc or None,
                    # Untruncated. The previous version cut titles to 50
                    # characters and appended "...", which cost the reader the
                    # scope of the job for no benefit.
                    "title": res.get("title") or None,
                    "published_date": res.get("publishedDate") or None,
                    "author": res.get("author") or None,
                    "retrieved_at": retrieved_at,
                    # Deliberately absent: estimated_value, margin, risk_score.
                    # A search hit does not carry them, and inventing them here
                    # is how a $250,000 figure with no source reached a
                    # pipeline board.
                    "status": "unqualified — needs review",
                }
            )

        return {
            "ok": True,
            "query": query,
            "results": results,
            "count": len(results),
            "retrieved_at": retrieved_at,
        }

    def execute(self, params: dict = None) -> dict:
        """Ability-registry entry point."""
        params = params or {}
        return self.hunt_for_rfps(
            query=params.get("query") or DEFAULT_QUERY,
            num_results=int(params.get("num_results") or 5),
        )
