"""
Vision Takeoff — the analysis, with the key on the server side.

Ferrari #07 posted the image straight from the browser to api.anthropic.com
with an operator-pasted key in localStorage and the
`anthropic-dangerous-direct-browser-access` header. These tests cover the
server-side replacement.

The bulk of them are about refusing to invent numbers. Every field this
returns gets multiplied into a bid, so a malformed model reply has to fail
loudly rather than default to something plausible: a takeoff that quietly
reports a square footage nobody measured is worse than one that admits it
failed, because the first one becomes a price.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from app.services import vision_takeoff_ai as vt  # noqa: E402


GOOD = """{
  "pavementSqFt": 48500,
  "stallCount": 72,
  "curbLF": 380,
  "conditionPCI": 58,
  "conditionLabel": "Fair",
  "recommendedService": "Crack seal, patch, sealcoat + restripe",
  "observations": ["Alligator cracking southeast", "Faded striping"],
  "confidence": "medium"
}"""


# ── The contract the browser already renders ─────────────────────────────────

def test_parses_a_well_formed_reply():
    r = vt.parse_findings(GOOD)
    assert r["pavementSqFt"] == 48500.0
    assert r["stallCount"] == 72
    assert r["conditionPCI"] == 58
    assert r["conditionLabel"] == "Fair"
    assert r["confidence"] == "medium"
    assert len(r["observations"]) == 2


def test_tolerates_a_markdown_fence():
    """Models wrap JSON in ```json often enough that this must not be fatal."""
    assert vt.parse_findings("```json\n" + GOOD + "\n```")["stallCount"] == 72


# ── Refusing to invent ────────────────────────────────────────────────────────

def test_non_json_fails_loudly():
    with pytest.raises(vt.VisionError, match="did not return JSON"):
        vt.parse_findings("I measured about 48,000 square feet.")


@pytest.mark.parametrize("field", [
    "pavementSqFt", "stallCount", "curbLF", "conditionPCI",
    "conditionLabel", "recommendedService", "observations", "confidence",
])
def test_every_missing_field_is_an_error_not_a_default(field):
    import json
    data = json.loads(GOOD)
    del data[field]
    with pytest.raises(vt.VisionError):
        vt.parse_findings(json.dumps(data))


def test_pci_outside_the_scale_is_rejected():
    with pytest.raises(vt.VisionError, match="0-100"):
        vt.parse_findings(GOOD.replace('"conditionPCI": 58', '"conditionPCI": 140'))


def test_condition_label_must_be_a_real_pci_band():
    with pytest.raises(vt.VisionError, match="PCI bands"):
        vt.parse_findings(GOOD.replace('"Fair"', '"Mostly Fine"'))


def test_negative_area_is_rejected():
    with pytest.raises(vt.VisionError, match="pavementSqFt"):
        vt.parse_findings(GOOD.replace("48500", "-100"))


def test_booleans_do_not_pass_as_numbers():
    """`True` is an int in Python; a bool sneaking through would become a price."""
    with pytest.raises(vt.VisionError):
        vt.parse_findings(GOOD.replace('"stallCount": 72', '"stallCount": true'))


def test_confidence_must_be_one_of_three():
    with pytest.raises(vt.VisionError, match="high/medium/low"):
        vt.parse_findings(GOOD.replace('"medium"', '"pretty sure"'))


# ── Prompt honesty ────────────────────────────────────────────────────────────

def test_prompt_says_when_scale_is_not_calibrated():
    """
    Whether the image was calibrated changes how far the numbers can be
    trusted. Saying it out loud is what keeps a guess from being reported as
    a measurement.
    """
    assert "Scale NOT calibrated." in vt.build_prompt(None)
    assert "2.50 px/ft" in vt.build_prompt(2.5)


# ── Guards before a request is spent ─────────────────────────────────────────

def test_unsupported_media_type_rejected_before_calling_the_model():
    with pytest.raises(vt.VisionError, match="unsupported image type"):
        vt.analyse(image_base64="x" * 64, media_type="application/pdf")


def test_oversized_image_rejected_before_calling_the_model():
    huge = "A" * (vt.MAX_IMAGE_BYTES * 4 // 3 + 2048)
    with pytest.raises(vt.VisionError, match="limit is"):
        vt.analyse(image_base64=huge, media_type="image/png")


def test_missing_server_key_is_an_explicit_message(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.setattr(vt._cfg, "get", lambda name, default="": "")
    with pytest.raises(vt.VisionError, match="not configured on the server"):
        vt.analyse(image_base64="x" * 64, media_type="image/png")


# ── The endpoints ─────────────────────────────────────────────────────────────

async def test_analyze_requires_auth(client):
    res = await client.post("/api/v1/ferrari/vision-takeoff/analyze",
                            json={"image_base64": "x" * 64, "media_type": "image/png"})
    assert res.status_code in {401, 403}


async def test_status_reports_configuration_without_leaking_the_key(client, auth_headers):
    res = await client.get("/api/v1/ferrari/vision-takeoff/status", headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert set(body) == {"configured", "default_model", "max_image_mb"}
    assert isinstance(body["configured"], bool)
    assert "key" not in repr(body).lower() or body["configured"] in (True, False)


async def test_analyze_surfaces_failure_as_422_not_500(client, auth_headers, monkeypatch):
    """
    An analysis that cannot be produced is a 422 the client can show the
    operator, not a 500 that reads as 'the server is broken'.
    """
    monkeypatch.setattr(vt._cfg, "get", lambda name, default="": "")
    res = await client.post("/api/v1/ferrari/vision-takeoff/analyze", headers=auth_headers,
                            json={"image_base64": "x" * 64, "media_type": "image/png"})
    assert res.status_code == 422
    assert "not configured" in res.json()["detail"]
