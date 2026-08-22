"""
RFP estimator — reads a commercial paving RFP and proposes a bid.

Reachable as SalesAndEstimation.openai_rfp_estimator through
POST /api/v1/abilities/execute.

TWO THINGS WERE WRONG HERE, AND THE SECOND ONE COULD COST MONEY.

1. It built its own AsyncOpenAI client, so a revoked OPENAI_API_KEY meant no
   estimate at all rather than one from Claude. It now goes through
   llm_client, which walks the whole provider chain.

2. Far worse: every failure path returned `_mock_analysis()` — a hardcoded
   dict claiming 150,000 sqft, 1,875.5 tons, $1,125,300 of materials and a
   **$1,850,000 recommended bid**, with a win probability of "HIGH". The same
   numbers for every RFP, whatever the document said, returned in exactly the
   shape a real estimate takes.

   That fired when the key was missing AND on any exception. A bid is a
   number somebody acts on. Inventing one and labelling it "Fallback
   calculation" is worse than returning nothing, because nothing is obviously
   nothing and a confident $1.85M is not.

   There is no mock any more. When no provider answers, or the response
   cannot be parsed, or a required field is missing, this returns
   `ok: False` with a reason and NO numbers.
"""

import json
import logging

from app.services import llm_client

logger = logging.getLogger(__name__)

#: Every field a caller is entitled to treat as an estimate. If the model does
#: not return all of them, the result is not an estimate and is refused.
REQUIRED_FIELDS = (
    "estimated_sqft",
    "estimated_asphalt_tons",
    "materials_cost",
    "recommended_bid_price",
)

_SYSTEM = "You are a highly advanced estimation AI that only outputs valid JSON."


def _unavailable(reason: str) -> dict:
    """
    The honest answer when no estimate could be produced.

    Deliberately carries no numeric fields at all — not zeros, not nulls
    beside a plausible-looking total. A caller that reads this and renders a
    bid has to notice `ok: False` first.
    """
    return {
        "ok": False,
        "error": reason,
        "estimate": None,
        "note": (
            "No estimate was produced. This response contains no figures on "
            "purpose: a fabricated bid is worse than an absent one."
        ),
    }


class OpenAIRFPEstimator:
    """
    Deep-reasoning RFP estimator.

    Named for the provider it was originally written against; it now routes
    through llm_client and may be answered by any configured provider.
    """

    def execute(self, params: dict = None) -> dict:
        params = params or {}
        rfp_text = (
            params.get("rfp_text")
            or params.get("query")
            or params.get("prompt")
            or ""
        ).strip()
        # No silent default RFP. The previous version substituted "Standard
        # commercial parking lot asphalt paving RFP" for a missing argument
        # and then priced it, so a caller who forgot the parameter got a bid
        # for a document that does not exist.
        if not rfp_text:
            return _unavailable("No RFP text supplied (expected 'rfp_text').")

        import asyncio  # noqa: PLC0415

        try:
            return asyncio.run(self.analyze_commercial_rfp(rfp_text))
        except RuntimeError:
            # Already inside a running loop — the ability registry calls
            # execute() synchronously, so this is the caller's problem to fix
            # rather than something to paper over with a fake number.
            return _unavailable(
                "Estimator invoked from inside a running event loop; "
                "await analyze_commercial_rfp() directly."
            )
        except Exception as exc:  # noqa: BLE001
            logger.exception("RFP estimation failed")
            return _unavailable(f"{exc.__class__.__name__}: {exc}")

    async def analyze_commercial_rfp(self, rfp_text: str) -> dict:
        """Read an RFP and return a costed bid, or an explicit refusal."""
        if not any(llm_client.configured_providers().values()):
            return _unavailable("No LLM provider is configured.")

        prompt = f"""
You are the elite Chief Estimator for a multi-million dollar paving company.
Use deep reasoning to analyze the following commercial RFP and calculate our bid.
Assume liquid asphalt costs $600/ton.
Return your final reasoning and estimates STRICTLY in this JSON format:
{{
    "estimated_sqft": <int>,
    "estimated_asphalt_tons": <float>,
    "materials_cost": <int>,
    "recommended_bid_price": <int>,
    "win_probability_score": "<string (e.g., HIGH, MEDIUM, LOW)>",
    "reasoning": "<string summarizing your mathematical breakdown>"
}}

--- RFP TEXT ---
{rfp_text}
"""
        # ajson_chat: async, because this is awaited from request handlers, and
        # JSON-contracted across every provider rather than via OpenAI's
        # response_format, which only one provider implements.
        reply = await llm_client.ajson_chat(
            task="reasoning",
            system=_SYSTEM,
            user=prompt,
            temperature=0.2,
            max_tokens=1500,
        )
        if reply.error or not reply.data:
            return _unavailable(reply.error_detail or "No provider answered.")

        data = reply.data
        missing = [f for f in REQUIRED_FIELDS if data.get(f) is None]
        if missing:
            return _unavailable(
                f"Model response was missing required field(s): {', '.join(missing)}."
            )

        # Booleans are ints in Python, so `True` would sail through a numeric
        # check and price as 1. Reject anything that is not a real number.
        for field in REQUIRED_FIELDS:
            value = data[field]
            if isinstance(value, bool) or not isinstance(value, (int, float)):
                return _unavailable(f"Field {field!r} was not a number: {value!r}")
            if value < 0:
                return _unavailable(f"Field {field!r} was negative: {value!r}")

        return {
            "ok": True,
            "estimate": data,
            # The model that actually answered, not the one the routing table
            # lists first.
            "engine": reply.model or reply.provider,
            "fallback_used": reply.fallback_used,
        }
