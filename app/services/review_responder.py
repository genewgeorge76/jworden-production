"""
review_responder.py — AI-powered review response generator.

Generates professional, on-brand responses to customer Google reviews.
Mr. Worden reviews all AI drafts before publishing — responses are saved
as drafts until approved.

Supports tone modes:
  grateful   — warm, personal, thankful
  professional — formal, concise, business-appropriate
  apologetic  — empathetic, resolution-focused (for negative reviews)
"""

from __future__ import annotations

import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

_COMPANY_NAME = "J. Worden & Sons Asphalt Paving"
_OWNER_NAME   = "Mr. Worden"

_SYSTEM_PROMPT = f"""You are a professional review response writer for {_COMPANY_NAME}.

Company context:
• Family-owned, 4th-generation asphalt paving contractor since 1984
• Headquarters: Chester, Virginia
• Owner: {_OWNER_NAME} (took over in 2016)
• Services: asphalt paving, sealcoating, crack filling, parking lots, driveways
• KFC national franchise paving vendor — 12+ states
• Awards: Pavement Magazine Top 75, Best of Houzz, 2026 Top Contractor Nominee
• Google rating: 4.9 stars across 87 reviews

RESPONSE RULES:
1. Always thank the reviewer by name if provided
2. Be warm, genuine, and specific — never generic "thank you for your feedback" filler
3. Mention a specific detail from the review if possible
4. Keep responses 2–4 sentences (50–120 words) — concise is professional
5. For negative reviews: acknowledge the concern, apologize sincerely, offer resolution
6. End positive responses with an invitation to work together again or refer others
7. Sign as "{_OWNER_NAME} and the Worden & Sons team" or similar
8. Do NOT use exclamation marks more than once per response
9. Match the tone mode requested
10. Return ONLY the response text — no markdown, no quotes, no preamble
"""


def generate_review_response(
    review_text: str,
    reviewer_name: Optional[str] = None,
    rating: int = 5,
    tone: str = "grateful",
) -> str:
    """
    Generate a professional response to a customer review.

    Args:
        review_text:   The full text of the customer's review.
        reviewer_name: Customer's name if available.
        rating:        Star rating 1–5.
        tone:          'grateful' | 'professional' | 'apologetic'

    Returns:
        A draft response string, or a fallback template on OpenAI error.

    Prefer `generate_review_response_detailed` — it returns the same draft
    alongside the name of the engine that actually produced it. Callers that
    infer the engine from `os.getenv("OPENAI_API_KEY")` label a template
    response "gpt-4o" whenever the key is set but not working.
    """
    return generate_review_response_detailed(
        review_text=review_text,
        reviewer_name=reviewer_name,
        rating=rating,
        tone=tone,
    )[0]


def generate_review_response_detailed(
    review_text: str,
    reviewer_name: str | None = None,
    rating: int = 5,
    tone: str = "grateful",
) -> tuple[str, str]:
    """
    Generate a review response and report which engine produced it.

    Returns (draft, engine) where engine is "gpt-4o" or "template". The engine
    is determined by what ran, not by what is configured, so a revoked key
    shows up as "template" instead of being reported as a model response.
    """
    openai_key = os.getenv("OPENAI_API_KEY", "")
    if not openai_key:
        return _template_response(review_text, reviewer_name, rating, tone), "template"

    try:
        from openai import OpenAI  # type: ignore

        client = OpenAI(api_key=openai_key)

        # Build context message
        name_str = f"Reviewer name: {reviewer_name}" if reviewer_name else "Reviewer name: not provided"
        tone_instructions = {
            "grateful":     "Write a warm, personal, genuinely thankful response. Highlight something specific from their review.",
            "professional": "Write a concise, formal, business-appropriate response. Keep it brief and professional.",
            "apologetic":   "Write an empathetic response that acknowledges the issue, apologizes sincerely, and offers a path to resolution. Include contact information: (804) 446-1296.",
        }.get(tone, "Write a warm, professional response.")

        user_message = f"""
{name_str}
Star rating: {rating}/5
Review text: "{review_text}"

Tone instruction: {tone_instructions}

Write the review response now:
"""

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            max_tokens=200,
            temperature=0.6,
        )
        draft = (response.choices[0].message.content or "").strip()
        if not draft:
            # An empty completion is a failure with a 200 attached. Falling
            # through to the template is right; calling it "gpt-4o" is not.
            logger.warning("OpenAI review response returned empty content")
            return _template_response(review_text, reviewer_name, rating, tone), "template"
        return draft, "gpt-4o"

    except Exception as exc:  # noqa: BLE001
        logger.error("OpenAI review response (tone=%s, rating=%d) failed: %s", tone, rating, exc)
        return _template_response(review_text, reviewer_name, rating, tone), "template"


def _template_response(
    review_text: str,
    reviewer_name: Optional[str],
    rating: int,
    tone: str,
) -> str:
    """Fallback template when OpenAI is unavailable."""
    name = reviewer_name or "for your kind words"

    if rating >= 4:
        return (
            f"Thank you so much, {name}! We're truly grateful for your trust in J. Worden & Sons. "
            f"Hearing that the work met your expectations means everything to our team. "
            f"We look forward to serving you again — and please don't hesitate to send anyone our way. "
            f"— {_OWNER_NAME} and the Worden & Sons team"
        )
    elif rating == 3:
        return (
            f"Thank you for the honest feedback, {name}. We're glad you chose J. Worden & Sons and "
            f"we appreciate you taking the time to share your experience. "
            f"We'd love to understand what we can improve — please give us a call at (804) 446-1296 "
            f"so we can make it right. — {_OWNER_NAME}"
        )
    else:
        return (
            f"We sincerely apologize, {name}. This is not the experience we strive to deliver "
            f"and we take your feedback seriously. Please contact us directly at (804) 446-1296 — "
            f"{_OWNER_NAME} would like to discuss this personally and find a resolution. "
            f"We stand behind our work and want the chance to make this right."
        )
