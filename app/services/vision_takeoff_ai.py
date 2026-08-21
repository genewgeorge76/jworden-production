"""
vision_takeoff_ai.py — Ferrari #07's aerial analysis, with the key on this side.

Distinct from services/vision_takeoff.py, which is the geometry side of the
same problem: Google Solar and Aerial View lookups plus polygon area
measurement. That module measures what it is told to measure. This one asks a
vision model to find the pavement in the first place and grade its condition.
They compose rather than overlap, and are kept apart so neither has to know
about the other's provider or failure modes.

Ferrari #07 sent the image straight from the browser to api.anthropic.com,
using an Anthropic key the operator pasted into Settings and the
`anthropic-dangerous-direct-browser-access` header. That header is named
honestly: the key sits in localStorage, travels with every request, and is
readable by anything running on the page. Workable for one owner on one
laptop; unusable the moment a customer logs in, because the key they would be
holding is not theirs.

This module is the same analysis with the call moved server-side. The key is
read from the runtime config, never leaves the backend, and the caller sends
only the image.

The output contract is unchanged, deliberately. The browser app already knows
how to render `pavementSqFt / stallCount / curbLF / conditionPCI /
conditionLabel / recommendedService / observations / confidence`, so keeping
that exact shape means the frontend swaps one fetch URL and nothing else.

What this module will not do is invent numbers. If the model returns something
that is not valid JSON, or omits a field, or gives a PCI outside 0-100, that
is raised as a failure rather than smoothed over with a default — a takeoff
that quietly reports a plausible-looking square footage nobody measured is
worse than one that admits it failed, because the first becomes a bid.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any, Optional

from . import runtime_config as _cfg

logger = logging.getLogger(__name__)

# Matches the model list the browser app offered in Settings.
DEFAULT_MODEL = "claude-opus-5"
MAX_TOKENS = 1500

CONDITION_LABELS = {"Excellent", "Good", "Fair", "Poor", "Very Poor", "Failed"}

# Accepted inline image types. Anything else is rejected before a request is
# spent on it.
ALLOWED_MEDIA = {"image/png", "image/jpeg", "image/webp", "image/gif"}

# 5 MB of raw image. Anthropic's own limit is higher, but a browser sending a
# 40 MB screenshot is a mistake worth catching here rather than after upload.
MAX_IMAGE_BYTES = 5 * 1024 * 1024


class VisionError(RuntimeError):
    """Analysis could not be completed. The message is safe to show a user."""


def is_configured() -> bool:
    return bool(_cfg.get("ANTHROPIC_API_KEY").strip())


def build_prompt(px_per_ft: Optional[float] = None) -> str:
    """
    The estimator prompt.

    Carried over from the browser app verbatim in substance, including the
    scale line: whether the image was calibrated changes how much the model
    should trust its own dimensions, and saying "NOT calibrated" out loud is
    what keeps a guess from being reported as a measurement.
    """
    ratio = (
        f"Scale: {px_per_ft:.2f} px/ft."
        if px_per_ft
        else "Scale NOT calibrated."
    )
    return f"""You are a veteran asphalt-paving estimator analyzing an aerial image for J. Worden & Sons Asphalt Paving.

{ratio}

Respond ONLY with valid JSON (no markdown):
{{
  "pavementSqFt": <number>,
  "stallCount": <integer>,
  "curbLF": <number>,
  "conditionPCI": <integer 0-100>,
  "conditionLabel": "<Excellent|Good|Fair|Poor|Very Poor|Failed>",
  "recommendedService": "<short>",
  "observations": ["<string>", ...],
  "confidence": "<high|medium|low>"
}}

PCI: 86-100 Excellent · 71-85 Good · 56-70 Fair · 41-55 Poor · 26-40 Very Poor · 0-25 Failed."""


def _strip_fence(text: str) -> str:
    """Models wrap JSON in ```json fences often enough to handle it here."""
    return re.sub(r"^```(?:json)?\s*", "", text.strip(), flags=re.I).rstrip("`").strip()


def parse_findings(text: str) -> dict[str, Any]:
    """
    Turn the model's reply into findings, or raise.

    Every field is checked. A missing or out-of-range value fails loudly
    instead of defaulting, because each of these numbers ends up multiplied
    into a price.
    """
    try:
        data = json.loads(_strip_fence(text))
    except json.JSONDecodeError as exc:
        raise VisionError(f"model did not return JSON: {exc}") from exc

    if not isinstance(data, dict):
        raise VisionError("model returned JSON that is not an object")

    out: dict[str, Any] = {}

    for key in ("pavementSqFt", "curbLF"):
        v = data.get(key)
        if not isinstance(v, (int, float)) or isinstance(v, bool) or v < 0:
            raise VisionError(f"{key} missing or not a non-negative number")
        out[key] = float(v)

    stalls = data.get("stallCount")
    if not isinstance(stalls, int) or isinstance(stalls, bool) or stalls < 0:
        raise VisionError("stallCount missing or not a non-negative integer")
    out["stallCount"] = stalls

    pci = data.get("conditionPCI")
    if not isinstance(pci, int) or isinstance(pci, bool) or not 0 <= pci <= 100:
        raise VisionError("conditionPCI missing or outside 0-100")
    out["conditionPCI"] = pci

    label = data.get("conditionLabel")
    if label not in CONDITION_LABELS:
        raise VisionError(f"conditionLabel {label!r} is not one of the six PCI bands")
    out["conditionLabel"] = label

    service = data.get("recommendedService")
    if not isinstance(service, str) or not service.strip():
        raise VisionError("recommendedService missing")
    out["recommendedService"] = service.strip()

    obs = data.get("observations")
    if not isinstance(obs, list) or not all(isinstance(o, str) for o in obs):
        raise VisionError("observations missing or not a list of strings")
    out["observations"] = obs

    conf = data.get("confidence")
    if conf not in {"high", "medium", "low"}:
        raise VisionError(f"confidence {conf!r} is not high/medium/low")
    out["confidence"] = conf

    return out


def analyse(
    *,
    image_base64: str,
    media_type: str,
    px_per_ft: Optional[float] = None,
    model: Optional[str] = None,
) -> dict[str, Any]:
    """
    Run the takeoff. Raises VisionError with a user-safe message on failure.
    """
    if media_type not in ALLOWED_MEDIA:
        raise VisionError(f"unsupported image type {media_type!r}")

    # base64 inflates by ~4/3; check the decoded size without decoding it all.
    approx_bytes = (len(image_base64) * 3) // 4
    if approx_bytes > MAX_IMAGE_BYTES:
        raise VisionError(
            f"image is {approx_bytes // 1024 // 1024} MB; limit is "
            f"{MAX_IMAGE_BYTES // 1024 // 1024} MB"
        )

    key = _cfg.get("ANTHROPIC_API_KEY").strip()
    if not key:
        # Deliberately explicit: the old failure mode was a browser alert about
        # a missing key the operator had to fix. Now it is a server config
        # fact, and saying so is what stops someone hunting in Settings.
        raise VisionError(
            "ANTHROPIC_API_KEY is not configured on the server — vision "
            "takeoff cannot run until it is set"
        )

    try:
        from anthropic import Anthropic  # noqa: PLC0415
    except Exception as exc:  # noqa: BLE001
        raise VisionError(f"anthropic SDK unavailable: {exc}") from exc

    client = Anthropic(api_key=key)
    try:
        resp = client.messages.create(
            model=model or DEFAULT_MODEL,
            max_tokens=MAX_TOKENS,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image", "source": {
                        "type": "base64", "media_type": media_type, "data": image_base64}},
                    {"type": "text", "text": build_prompt(px_per_ft)},
                ],
            }],
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("Vision takeoff call failed: %s", exc)
        raise VisionError(f"vision request failed: {str(exc)[:200]}") from exc

    text = "".join(
        getattr(b, "text", "") for b in (resp.content or [])
        if getattr(b, "type", "") == "text"
    ).strip()
    if not text:
        raise VisionError("model returned no text content")

    findings = parse_findings(text)
    findings["model"] = model or DEFAULT_MODEL
    return findings
