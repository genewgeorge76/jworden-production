"""
crew_wearables.py — Crew + owner wearable health-vitals ingest + alert engine.

Supports (via runtime_config-managed keys):
  • Apple HealthKit  (iPhone Shortcut → POST webhook)
  • Fitbit           (subscriber webhook)
  • Garmin Connect   (push notifications)
  • Whoop            (webhook)
  • Oura             (webhook)

Vitals tracked:
    heart_rate (bpm)
    spo2       (% O2 saturation)
    skin_temp  (°F)         — heat-stress proxy
    hrv        (ms)         — recovery
    steps      (cumulative day)
    calories   (cumulative day)

Alerts (per-crew thresholds, owner-tunable via runtime_config):
    HR_SPIKE_BPM          default 165   → critical
    HR_SUSTAINED_BPM      default 145   → 5-min sustained = warning
    SPO2_LOW              default 92    → warning  (<88 = critical)
    SKIN_TEMP_HIGH_F      default 100.4 → heat-stress warning
    HRV_LOW_MS            default 25    → fatigue warning

Storage is in-memory (rolling 4h window per crew) — survives a single Railway
worker. For multi-worker deploys we'd swap to Redis; documented in OPERATIONS.

Public API
──────────
    record(crew_id, source, vitals: dict)   → list of triggered alerts
    snapshot(crew_id=None)                  → latest vitals + alert summary
    crew_list()                             → known crew_ids with last-seen
    config_status()                         → which providers are configured
"""

from __future__ import annotations

import hashlib
import hmac
import logging
import time
from collections import defaultdict, deque
from typing import Any, Deque

from . import runtime_config as _cfg

logger = logging.getLogger(__name__)

# ── Config helpers ────────────────────────────────────────────────────────────

def _f(key: str, default: float) -> float:
    raw = _cfg.get(key)
    if not raw:
        return default
    try:
        return float(raw)
    except (TypeError, ValueError):
        return default


def _thresholds() -> dict[str, float]:
    return {
        "hr_spike":       _f("WEARABLE_HR_SPIKE_BPM",      165.0),
        "hr_sustained":   _f("WEARABLE_HR_SUSTAINED_BPM",  145.0),
        "spo2_low":       _f("WEARABLE_SPO2_LOW",           92.0),
        "spo2_critical":  _f("WEARABLE_SPO2_CRITICAL",      88.0),
        "skin_high_f":    _f("WEARABLE_SKIN_TEMP_HIGH_F",  100.4),
        "hrv_low":        _f("WEARABLE_HRV_LOW_MS",         25.0),
    }


# ── In-memory rolling store (4h per crew) ────────────────────────────────────

_WINDOW_SECS = 4 * 3600
_MAX_PER_CREW = 4096
_STORE: dict[str, Deque[dict]] = defaultdict(lambda: deque(maxlen=_MAX_PER_CREW))
_ALERTS: dict[str, Deque[dict]] = defaultdict(lambda: deque(maxlen=256))


def _prune(crew_id: str) -> None:
    cutoff = time.time() - _WINDOW_SECS
    dq = _STORE[crew_id]
    while dq and dq[0]["ts"] < cutoff:
        dq.popleft()


# ── Alert evaluation ──────────────────────────────────────────────────────────

def _evaluate(crew_id: str, sample: dict) -> list[dict]:
    th = _thresholds()
    fired: list[dict] = []

    hr = sample.get("heart_rate")
    if isinstance(hr, (int, float)):
        if hr >= th["hr_spike"]:
            fired.append({"level": "critical", "code": "hr_spike",
                          "msg": f"Heart rate {hr:.0f} bpm ≥ spike threshold {th['hr_spike']:.0f}"})
        else:
            # 5-min sustained check
            cutoff = sample["ts"] - 300
            recent_hr = [s.get("heart_rate") for s in _STORE[crew_id]
                         if s["ts"] >= cutoff and isinstance(s.get("heart_rate"), (int, float))]
            if recent_hr and len(recent_hr) >= 3 and (sum(recent_hr) / len(recent_hr)) >= th["hr_sustained"]:
                fired.append({"level": "warning", "code": "hr_sustained",
                              "msg": f"Sustained HR {sum(recent_hr)/len(recent_hr):.0f} bpm ≥ {th['hr_sustained']:.0f} for 5+ min"})

    spo2 = sample.get("spo2")
    if isinstance(spo2, (int, float)):
        if spo2 <= th["spo2_critical"]:
            fired.append({"level": "critical", "code": "spo2_critical",
                          "msg": f"SpO₂ {spo2:.0f}% ≤ {th['spo2_critical']:.0f}% — pull crew member"})
        elif spo2 <= th["spo2_low"]:
            fired.append({"level": "warning", "code": "spo2_low",
                          "msg": f"SpO₂ {spo2:.0f}% ≤ {th['spo2_low']:.0f}%"})

    skin = sample.get("skin_temp")
    if isinstance(skin, (int, float)) and skin >= th["skin_high_f"]:
        fired.append({"level": "warning", "code": "heat_stress",
                      "msg": f"Skin temp {skin:.1f}°F ≥ {th['skin_high_f']:.1f}°F — hydration break"})

    hrv = sample.get("hrv")
    if isinstance(hrv, (int, float)) and hrv > 0 and hrv <= th["hrv_low"]:
        fired.append({"level": "info", "code": "hrv_low",
                      "msg": f"HRV {hrv:.0f}ms ≤ {th['hrv_low']:.0f}ms — fatigue marker"})

    for a in fired:
        a.update({"ts": sample["ts"], "crew_id": crew_id, "source": sample.get("source")})
        _ALERTS[crew_id].append(a)
        if a["level"] == "critical":
            logger.warning("CREW WEARABLE CRITICAL crew=%s code=%s msg=%s",
                           crew_id, a["code"], a["msg"])
    return fired


# ── Webhook HMAC verification (per-provider shared secret) ────────────────────

def verify_signature(provider: str, body: bytes, signature: str) -> bool:
    """
    Returns True if signature matches the shared secret for the provider.
    Provider secret key in runtime_config: WEARABLE_<PROVIDER>_SECRET (uppercased).
    If the secret isn't set, we DENY (fail-closed) unless WEARABLE_DEV_OPEN=1.
    """
    secret = _cfg.get(f"WEARABLE_{provider.upper()}_SECRET")
    if not secret:
        return _cfg.get("WEARABLE_DEV_OPEN") == "1"
    if not signature:
        return False
    mac = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(mac, signature.lower().removeprefix("sha256="))


# ── Public API ────────────────────────────────────────────────────────────────

def record(crew_id: str, source: str, vitals: dict[str, Any]) -> list[dict]:
    if not crew_id:
        crew_id = "unknown"
    sample = {"ts": time.time(), "source": (source or "unknown").lower(),
              **{k: vitals.get(k) for k in
                 ("heart_rate", "spo2", "skin_temp", "hrv", "steps", "calories")
                 if vitals.get(k) is not None}}
    _STORE[crew_id].append(sample)
    _prune(crew_id)
    return _evaluate(crew_id, sample)


def snapshot(crew_id: str | None = None) -> dict[str, Any]:
    if crew_id:
        crews = [crew_id]
    else:
        crews = list(_STORE.keys())
    out = {}
    for cid in crews:
        _prune(cid)
        dq = _STORE[cid]
        latest = dq[-1] if dq else None
        out[cid] = {
            "latest": latest,
            "samples_4h": len(dq),
            "alerts_recent": list(_ALERTS[cid])[-10:],
        }
    return {"crews": out, "thresholds": _thresholds()}


def crew_list() -> list[dict]:
    items = []
    for cid, dq in _STORE.items():
        if not dq: continue
        items.append({"crew_id": cid, "last_seen": dq[-1]["ts"], "samples_4h": len(dq)})
    items.sort(key=lambda r: r["last_seen"], reverse=True)
    return items


PROVIDERS = ("apple_health", "fitbit", "garmin", "whoop", "oura")


def config_status() -> dict[str, dict]:
    out = {}
    for p in PROVIDERS:
        secret = _cfg.get(f"WEARABLE_{p.upper()}_SECRET")
        out[p] = {"configured": bool(secret), "fail_closed": True}
    out["_dev_open"] = _cfg.get("WEARABLE_DEV_OPEN") == "1"
    return out
