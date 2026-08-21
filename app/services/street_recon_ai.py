"""
street_recon_ai.py — Ferrari #11's written assessment, on the server side.

Street Recon's AI never worked. `callClaude()` posted to api.anthropic.com
with `{'Content-Type': 'application/json'}` and nothing else — no key, no
`anthropic-version`. Every call was rejected, every rejection was swallowed by
a `catch` that substituted canned text, and the operator read that fallback
believing a model had written it. Silent for months.

So this is not a security tidy-up like Vision Takeoff was. It is the feature
working for the first time.

Two things it deliberately is NOT:

  * Not a generic prompt proxy. The client sends structured findings — an
    address, an area, the four condition sliders — and the prompt is built
    here. An endpoint that forwards arbitrary text would be an open Claude
    account for anyone holding a tenant token.

  * Not a source of numbers. The PCI and the price are computed by the
    browser from the sliders and are passed in as facts. The model writes
    prose about them. It is explicitly told not to invent or restate figures,
    because a paragraph that quietly disagrees with the estimate beside it is
    worse than no paragraph.
"""

from __future__ import annotations

import logging
from typing import Any, Optional

from . import runtime_config as _cfg

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "claude-sonnet-5"
MAX_TOKENS = 1000

# The company voice, fixed here rather than accepted from the client.
COMPANY = "J. Worden & Sons"
COMPANY_LONG = "J. Worden & Sons Asphalt Paving"
COMPANY_PHONE = "(804) 446-1296"

KINDS = {"assessment", "mailer", "street_summary", "street_mailer"}


class ReconError(RuntimeError):
    """The text could not be produced. Message is safe to show an operator."""


def is_configured() -> bool:
    return bool(_cfg.get("ANTHROPIC_API_KEY").strip())


def _clean(value: Any, limit: int = 300) -> str:
    return str(value or "").strip()[:limit]


def build_assessment_prompt(f: dict[str, Any]) -> str:
    """
    The inspector's two sentences.

    The scores arrive already computed. The instruction not to restate them,
    and not to mention price, is what keeps the prose from drifting away from
    the estimate printed next to it.
    """
    notes = _clean(f.get("notes"), 500)
    photos = int(f.get("photo_count") or 0)
    return f"""You are an expert asphalt pavement inspector for {COMPANY}, a 4th-generation paving company.

Property: {_clean(f.get('address'))}
Type: {_clean(f.get('property_type'))}
Area: {f.get('sqft')} sq ft
PCI Score: {f.get('pci')}/100 ({_clean(f.get('pci_label'))})
Cracking: {f.get('cracking')}/10
Surface deterioration: {f.get('surface')}/10
Drainage issues: {f.get('drainage')}/10
Edge deterioration: {f.get('edge')}/10
{f'Additional notes: {notes}' if notes else ''}
{f'Photos provided: {photos}' if photos else ''}

Write a 2-sentence professional pavement assessment and recommendation for this property. Be specific and direct. Mention the service recommended ({_clean(f.get('service'))}). Do not mention pricing. Do not restate the numeric scores — they are shown beside your text."""


def build_mailer_prompt(f: dict[str, Any]) -> str:
    """A neighbourly postcard. No technical terms, no scores, no price."""
    return f"""Write a short, professional direct mail postcard message (max 60 words) from {COMPANY_LONG} to the homeowner at {_clean(f.get('address'))}. Mention we noticed their driveway may need attention. Offer a free estimate. Include our number {COMPANY_PHONE}. Be neighborly and professional, not pushy. Do not mention PCI scores or technical terms."""


def build_street_summary_prompt(f: dict[str, Any]) -> str:
    """
    The sales read on a whole street.

    Scores are passed in already computed. The model is told the average
    rather than asked to work it out, because arithmetic done in prose is
    arithmetic nobody checked.
    """
    scores = [int(x) for x in (f.get("pci_scores") or []) if isinstance(x, (int, float))]
    if not scores:
        raise ReconError("street_summary needs pci_scores")
    avg = round(sum(scores) / len(scores))
    return f"""You are a paving sales strategist for {COMPANY}. You just scanned {len(scores)} driveways on {_clean(f.get('street'))}, {_clean(f.get('city'))}. Here are the PCI scores: {', '.join(str(s) for s in scores)}. Average PCI: {avg}. Write 2 sentences: one about the overall street condition and one about the sales opportunity. Be direct and specific. Do not restate the individual scores."""


def build_street_mailer_prompt(f: dict[str, Any]) -> str:
    """A neighbourhood postcard, sent when several drives on one street scored badly."""
    return f"""Write a short direct mail postcard (max 70 words) from {COMPANY_LONG}. We are doing work in the neighborhood and noticed several driveways need attention. Offer a free estimate and neighborhood discount. Phone: {COMPANY_PHONE}. Friendly, professional, not pushy. Sign from Gene George, 4th-generation paving contractor."""


_PROMPTS = {
    "assessment": build_assessment_prompt,
    "mailer": build_mailer_prompt,
    "street_summary": build_street_summary_prompt,
    "street_mailer": build_street_mailer_prompt,
}


def generate(kind: str, findings: dict[str, Any], model: Optional[str] = None) -> dict[str, str]:
    """Produce the text, or raise ReconError with something worth showing."""
    if kind not in KINDS:
        raise ReconError(f"unknown kind {kind!r}")

    if kind in {"assessment", "mailer"} and not _clean(findings.get("address")):
        raise ReconError("an address is required")

    # Build the prompt first. Validating the caller's input before checking
    # server configuration means a request missing pci_scores is told exactly
    # that, instead of being handed "no API key" — an answer that sends
    # someone to fix the wrong thing.
    prompt = _PROMPTS[kind](findings)

    key = _cfg.get("ANTHROPIC_API_KEY").strip()
    if not key:
        raise ReconError(
            "ANTHROPIC_API_KEY is not configured on the server — Street Recon "
            "cannot generate text until it is set"
        )

    try:
        from anthropic import Anthropic  # noqa: PLC0415
    except Exception as exc:  # noqa: BLE001
        raise ReconError(f"anthropic SDK unavailable: {exc}") from exc

    try:
        resp = Anthropic(api_key=key).messages.create(
            model=model or DEFAULT_MODEL,
            max_tokens=MAX_TOKENS,
            messages=[{"role": "user", "content": [{"type": "text", "text": prompt}]}],
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("Street Recon %s failed: %s", kind, exc)
        raise ReconError(f"text generation failed: {str(exc)[:200]}") from exc

    text = "".join(
        getattr(b, "text", "") for b in (resp.content or [])
        if getattr(b, "type", "") == "text"
    ).strip()
    if not text:
        raise ReconError("model returned no text")

    return {"kind": kind, "text": text, "model": model or DEFAULT_MODEL}
