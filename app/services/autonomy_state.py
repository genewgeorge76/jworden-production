"""
autonomy_state.py — Single source of truth for the Jarvis kill switch.

Defense-in-depth layer 2: even if the frontend is compromised or bypassed,
the backend will refuse autonomous action when frozen.

Design:
  - Persisted to a JSON file (path from env JARVIS_AUTONOMY_STATE_PATH,
    default /tmp/jarvis_autonomy.json) so freeze survives process restart.
  - Thread-safe via a single module-level lock.
  - Read is cheap; check before any autonomous side-effect.
  - "frozen" forces master=False and disables all per-domain switches.
"""
from __future__ import annotations
import json
import os
import threading
from datetime import datetime, timezone
from typing import Any

_STATE_PATH = os.environ.get("JARVIS_AUTONOMY_STATE_PATH", "/tmp/jarvis_autonomy.json")
_LOCK = threading.Lock()

_DEFAULT: dict[str, Any] = {
    "master":   False,
    "domains":  {},
    "frozen":   False,
    "frozenAt": None,
    "reason":   None,
    "updatedAt": None,
}


def _read_disk() -> dict[str, Any]:
    try:
        with open(_STATE_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, dict):
            return dict(_DEFAULT)
        merged = dict(_DEFAULT)
        merged.update(data)
        return merged
    except FileNotFoundError:
        return dict(_DEFAULT)
    except (OSError, json.JSONDecodeError):
        return dict(_DEFAULT)


def _write_disk(state: dict[str, Any]) -> None:
    try:
        os.makedirs(os.path.dirname(_STATE_PATH) or ".", exist_ok=True)
        tmp = _STATE_PATH + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(state, f)
        os.replace(tmp, _STATE_PATH)
    except OSError:
        # Persistence failed — state still lives in-memory for this process.
        pass


def get_state() -> dict[str, Any]:
    with _LOCK:
        return _read_disk()


def is_frozen() -> bool:
    return bool(get_state().get("frozen"))


def freeze(reason: str = "manual") -> dict[str, Any]:
    with _LOCK:
        state = _read_disk()
        state["master"]    = False
        state["domains"]   = {}
        state["frozen"]    = True
        state["frozenAt"]  = datetime.now(timezone.utc).isoformat()
        state["reason"]    = str(reason)[:200]
        state["updatedAt"] = state["frozenAt"]
        _write_disk(state)
        return state


def unfreeze() -> dict[str, Any]:
    with _LOCK:
        state = _read_disk()
        state["frozen"]    = False
        state["frozenAt"]  = None
        state["reason"]    = None
        state["updatedAt"] = datetime.now(timezone.utc).isoformat()
        _write_disk(state)
        return state


def set_master(enabled: bool) -> dict[str, Any]:
    with _LOCK:
        state = _read_disk()
        if state.get("frozen"):
            return state  # cannot toggle while frozen
        state["master"]    = bool(enabled)
        state["updatedAt"] = datetime.now(timezone.utc).isoformat()
        _write_disk(state)
        return state


def set_domain(domain_id: str, enabled: bool) -> dict[str, Any]:
    with _LOCK:
        state = _read_disk()
        if state.get("frozen") or not state.get("master"):
            return state
        domains = dict(state.get("domains") or {})
        domains[str(domain_id)] = bool(enabled)
        state["domains"]   = domains
        state["updatedAt"] = datetime.now(timezone.utc).isoformat()
        _write_disk(state)
        return state
