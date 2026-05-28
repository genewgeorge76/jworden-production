"""
vision_inspector.py — YOLO-based site deviation detection for JWordenAI.

Wraps Ultralytics YOLO for detecting site hazards, PPE non-compliance,
and structural deviations from drone or site-camera images.

YOLO and torch are OPTIONAL dependencies — this module degrades gracefully
when they are not installed.  Install them on the Railway instance when
you're ready to enable GPU-accelerated inference:

  pip install ultralytics==8.3.0   # includes torch CPU wheels

For GPU (Railway Pro or a custom VM):
  pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
  pip install ultralytics

Environment variables:
  YOLO_MODEL_PATH    — Path to a custom .pt weights file; defaults to yolo11n.pt
                       (auto-downloaded on first use when ultralytics is installed)
  VISION_INFERENCE_URL — If set, this module skips local YOLO and delegates to
                         the Cloud Run PyTorch endpoint (same as tasks/vision.py)
"""

from __future__ import annotations

import base64
import json
import logging
import os
from pathlib import Path
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

_MODEL_PATH = os.getenv("YOLO_MODEL_PATH", "yolo11n.pt")
_INFERENCE_URL = os.getenv("VISION_INFERENCE_URL", "")

# Lazy-load YOLO so startup is not blocked when ultralytics is absent
_yolo_model = None
_yolo_available = False


def _load_yolo():
    global _yolo_model, _yolo_available
    if _yolo_available:
        return True
    try:
        from ultralytics import YOLO  # noqa: F401
        _yolo_model = YOLO(_MODEL_PATH)
        _yolo_available = True
        logger.info("YOLO model loaded: %s", _MODEL_PATH)
        return True
    except ImportError:
        logger.warning("ultralytics not installed — YOLO inference unavailable. "
                       "pip install ultralytics to enable local vision inspection.")
        return False
    except Exception as exc:
        logger.error("YOLO model load failed: %s", exc)
        return False


# ── Deviation labels that map to known site risks ─────────────────────────────
_RISK_LABELS: dict[str, str] = {
    "person":        "Worker detected — verify PPE compliance",
    "hard-hat":      "Hard hat visible",
    "no-hard-hat":   "PPE VIOLATION: No hard hat detected",
    "vest":          "Safety vest visible",
    "no-vest":       "PPE VIOLATION: No safety vest detected",
    "crack":         "Structural: Crack or surface defect detected",
    "pothole":       "Structural: Pothole or subsurface failure",
    "standing-water":"Drainage: Standing water detected",
    "joint-gap":     "ASPHALT AI: Cold joint gap detected (Re-roll required)",
    "uneven-mat":    "ASPHALT AI: Mat texture variation (Compaction check)",
    "equipment":     "Equipment on site",
    "vehicle":       "Vehicle on site",
}

_HIGH_RISK = {"no-hard-hat", "no-vest", "crack", "pothole", "joint-gap"}


def detect_deviations(
    image_path: Optional[str] = None,
    image_bytes: Optional[bytes] = None,
    confidence_threshold: float = 0.40,
) -> dict:
    """
    Detect site hazards and structural deviations in an image.

    Accepts either a local file path or raw bytes (e.g. from an upload).

    Returns:
      {
        "status":         "OK" | "Alert" | "High Risk",
        "deviations":     [{"label": ..., "confidence": ..., "risk": ..., "bbox": [...]}],
        "ppe_compliant":  bool,
        "risk_level":     "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
        "summary":        "string",
        "inference_mode": "yolo-local" | "cloud-run" | "stub",
      }
    """
    # 1. Delegate to Cloud Run if configured
    if _INFERENCE_URL:
        return _cloud_run_inference(image_path, image_bytes)

    # 2. Local YOLO
    if _load_yolo():
        return _yolo_inference(image_path, image_bytes, confidence_threshold)

    # 3. Stub fallback
    return _stub_result()


def _cloud_run_inference(
    image_path: Optional[str],
    image_bytes: Optional[bytes],
) -> dict:
    """Delegate to VISION_INFERENCE_URL (Cloud Run PyTorch endpoint)."""
    try:
        raw = image_bytes or Path(image_path).read_bytes()
        resp = httpx.post(
            _INFERENCE_URL,
            json={"image_b64": base64.b64encode(raw).decode()},
            timeout=30.0,
        )
        resp.raise_for_status()
        data = resp.json()
        data.setdefault("inference_mode", "cloud-run")
        return data
    except Exception as exc:
        logger.error("Cloud Run vision inference failed: %s", exc)
        return _stub_result(error=str(exc))


def _yolo_inference(
    image_path: Optional[str],
    image_bytes: Optional[bytes],
    confidence_threshold: float,
) -> dict:
    """Run local YOLO inference."""
    import tempfile
    import numpy as np

    try:
        if image_bytes and not image_path:
            with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
                tmp.write(image_bytes)
                image_path = tmp.name

        results = _yolo_model(image_path, conf=confidence_threshold, verbose=False)
        deviations = []
        ppe_violations = 0

        for r in results:
            for box in (r.boxes or []):
                label = _yolo_model.names.get(int(box.cls), "unknown")
                conf = float(box.conf)
                bbox = [round(float(x), 1) for x in box.xyxy[0].tolist()]
                risk_note = _RISK_LABELS.get(label, f"Detected: {label}")
                is_high = label in _HIGH_RISK
                if label in {"no-hard-hat", "no-vest"}:
                    ppe_violations += 1
                deviations.append({
                    "label":      label,
                    "confidence": round(conf, 3),
                    "risk":       risk_note,
                    "high_risk":  is_high,
                    "bbox":       bbox,
                })

        high_risk_count = sum(1 for d in deviations if d["high_risk"])
        if high_risk_count >= 3:
            risk_level = "CRITICAL"
        elif high_risk_count >= 1:
            risk_level = "HIGH"
        elif deviations:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        status = "High Risk" if high_risk_count else ("Alert" if deviations else "OK")
        summary = (
            f"{len(deviations)} detection(s). "
            f"{ppe_violations} PPE violation(s). "
            f"Risk: {risk_level}."
        )

        return {
            "status":         status,
            "deviations":     deviations,
            "ppe_compliant":  ppe_violations == 0,
            "risk_level":     risk_level,
            "summary":        summary,
            "inference_mode": "yolo-local",
        }
    except Exception as exc:
        logger.error("YOLO inference error: %s", exc)
        return _stub_result(error=str(exc))


def _stub_result(error: Optional[str] = None) -> dict:
    msg = error or "ultralytics not installed — pip install ultralytics to enable."
    return {
        "status":         "OK",
        "deviations":     [],
        "ppe_compliant":  True,
        "risk_level":     "LOW",
        "summary":        f"Vision inspection unavailable. {msg}",
        "inference_mode": "stub",
    }
