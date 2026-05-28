"""
license_service.py — 50-State contractor license verification for JWordenAI.

Verification priority:
  1. Apify Professional License Lookup API (when LICENSE_VERIFY_API_KEY is set)
  2. Shovels.ai permit/contractor API (when SHOVELS_API_KEY is set)
  3. Static 50-state reference data (always available, no key needed)

Environment variables:
  LICENSE_VERIFY_API_KEY   — Apify API token
  SHOVELS_API_KEY          — Shovels.ai API key (alternative provider)
  LICENSE_VERIFY_PROVIDER  — "apify" | "shovels" | "static" (default: auto)

The static reference layer contains:
  - Licensing authority per state
  - Minimum project thresholds (when a license is required)
  - NASCLA reciprocity map
  - 45-day temporary license availability
  - Key classification codes relevant to asphalt/paving
"""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

_APIFY_KEY  = os.getenv("LICENSE_VERIFY_API_KEY", "")
_SHOVELS_KEY = os.getenv("SHOVELS_API_KEY", "")
_PROVIDER   = os.getenv("LICENSE_VERIFY_PROVIDER", "auto").lower()

# ── 50-State static reference layer ──────────────────────────────────────────
# Each entry: authority, threshold ($ project value requiring license),
# asphalt_class (key license classification), nascla_reciprocity, temp_license_days
STATE_MATRIX: dict[str, dict] = {
    "AL": {"authority": "ASLBC",      "threshold": 100_000, "fee_prime": 300,  "fee_sub": 150,  "asphalt_class": "General Contractor",          "nascla": True,  "temp_days": None, "notes": "Projects ≥$100k require license; NASCLA accepted."},
    "AK": {"authority": "DCCED",      "threshold": 10_000,  "fee_prime": None, "fee_sub": None, "asphalt_class": "General Contractor",          "nascla": False, "temp_days": None, "notes": ""},
    "AZ": {"authority": "AZROC",      "threshold": 1_000,   "fee_prime": None, "fee_sub": None, "asphalt_class": "CR-37 Asphalt/Concrete",      "nascla": False, "temp_days": None, "notes": ""},
    "AR": {"authority": "ACLB",       "threshold": 20_000,  "fee_prime": None, "fee_sub": None, "asphalt_class": "Commercial Contractor",       "nascla": True,  "temp_days": None, "notes": ""},
    "CA": {"authority": "CSLB",       "threshold": 500,     "fee_prime": None, "fee_sub": None, "asphalt_class": "C-32 Parking & Highway",      "nascla": False, "temp_days": None, "notes": "C-32 requires 4 yrs journey-level experience within last 10 yrs."},
    "CO": {"authority": "DORA",       "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "Local jurisdiction",          "nascla": False, "temp_days": None, "notes": "State issues no general contractor license; most counties regulate locally."},
    "CT": {"authority": "CTDCP",      "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "Home Improvement / Major",    "nascla": False, "temp_days": None, "notes": ""},
    "DE": {"authority": "DSPRO",      "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "General Contractor",          "nascla": False, "temp_days": None, "notes": ""},
    "FL": {"authority": "DBPR/CILB",  "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "Class A CGC",                 "nascla": False, "temp_days": None, "notes": ""},
    "GA": {"authority": "GCOC",       "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "General Contractor",          "nascla": True,  "temp_days": None, "notes": "NASCLA accepted."},
    "HI": {"authority": "DCCA",       "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "C-26 Paving",                 "nascla": False, "temp_days": None, "notes": ""},
    "ID": {"authority": "IPWC",       "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "Public Works Contractor",     "nascla": False, "temp_days": None, "notes": ""},
    "IL": {"authority": "Local",      "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "Local jurisdiction",          "nascla": False, "temp_days": None, "notes": "No state GC license; Chicago/Cook County regulate locally."},
    "IN": {"authority": "Local",      "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "Local jurisdiction",          "nascla": False, "temp_days": None, "notes": ""},
    "IA": {"authority": "IWD",        "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "Contractor Registration",     "nascla": False, "temp_days": None, "notes": ""},
    "KS": {"authority": "Local",      "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "Local jurisdiction",          "nascla": False, "temp_days": None, "notes": ""},
    "KY": {"authority": "KYBC",       "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "Class A General Contractor",  "nascla": False, "temp_days": None, "notes": ""},
    "LA": {"authority": "LSLBC",      "threshold": 50_000,  "fee_prime": None, "fee_sub": None, "asphalt_class": "Heavy Construction (Paving)", "nascla": False, "temp_days": None, "notes": "JWordenAI holds: Asphalt Paving + Concrete/Masonry/Asphalt Rehabilitation."},
    "ME": {"authority": "MEPRO",      "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "General Contractor",          "nascla": False, "temp_days": None, "notes": ""},
    "MD": {"authority": "MHIC",       "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "Home Improvement/Commercial", "nascla": False, "temp_days": None, "notes": ""},
    "MA": {"authority": "OCABR",      "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "CS-1 Home Improvement",       "nascla": False, "temp_days": None, "notes": ""},
    "MI": {"authority": "LARA",       "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "Residential Builder / GC",    "nascla": False, "temp_days": None, "notes": ""},
    "MN": {"authority": "DLI",        "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "Residential Contractor",      "nascla": False, "temp_days": None, "notes": ""},
    "MS": {"authority": "MSBOC",      "threshold": 50_000,  "fee_prime": None, "fee_sub": None, "asphalt_class": "General Contractor",          "nascla": False, "temp_days": None, "notes": ""},
    "MO": {"authority": "Local",      "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "Local jurisdiction",          "nascla": False, "temp_days": None, "notes": ""},
    "MT": {"authority": "MTDLI",      "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "General Contractor",          "nascla": False, "temp_days": None, "notes": ""},
    "NE": {"authority": "NDOL",       "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "Local jurisdiction",          "nascla": False, "temp_days": None, "notes": ""},
    "NV": {"authority": "NSCB",       "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "C-10 Paving",                 "nascla": False, "temp_days": None, "notes": ""},
    "NH": {"authority": "NHBC",       "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "General Contractor",          "nascla": False, "temp_days": None, "notes": ""},
    "NJ": {"authority": "NJDCA",      "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "Home Improvement Contractor", "nascla": False, "temp_days": None, "notes": ""},
    "NM": {"authority": "NMCID",      "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "GB-2 General Building",       "nascla": False, "temp_days": None, "notes": ""},
    "NY": {"authority": "Local",      "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "Local jurisdiction",          "nascla": False, "temp_days": None, "notes": "NYC requires separate Home Improvement Contractor license."},
    "NC": {"authority": "NCLBGC",     "threshold": 30_000,  "fee_prime": None, "fee_sub": None, "asphalt_class": "General Contractor",          "nascla": True,  "temp_days": None, "notes": "NASCLA accepted."},
    "ND": {"authority": "NDSPB",      "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "General Contractor",          "nascla": False, "temp_days": None, "notes": ""},
    "OH": {"authority": "Local",      "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "Local jurisdiction (HIC)",    "nascla": False, "temp_days": None, "notes": "Ohio regulates at city/county level."},
    "OK": {"authority": "OCCA",       "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "General Contractor",          "nascla": False, "temp_days": None, "notes": ""},
    "OR": {"authority": "CCB",        "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "General Contractor",          "nascla": False, "temp_days": None, "notes": ""},
    "PA": {"authority": "Local",      "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "Home Improvement Contractor", "nascla": False, "temp_days": None, "notes": ""},
    "RI": {"authority": "RIDLT",      "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "Contractor Registration",     "nascla": False, "temp_days": None, "notes": ""},
    "SC": {"authority": "SCLLR",      "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "General Contractor",          "nascla": True,  "temp_days": None, "notes": "NASCLA accepted."},
    "SD": {"authority": "SDDLR",      "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "Contractor Registration",     "nascla": False, "temp_days": None, "notes": ""},
    "TN": {"authority": "TNCSLB",     "threshold": 25_000,  "fee_prime": None, "fee_sub": None, "asphalt_class": "BC-A Asphalt Paving",         "nascla": True,  "temp_days": None, "notes": "NASCLA accepted."},
    "TX": {"authority": "Local",      "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "Local jurisdiction",          "nascla": False, "temp_days": None, "notes": "Texas regulates at city/county level for most trades."},
    "UT": {"authority": "DOPL",       "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "General Contractor",          "nascla": False, "temp_days": None, "notes": ""},
    "VT": {"authority": "VTDOL",      "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "Contractor Registration",     "nascla": False, "temp_days": None, "notes": ""},
    "VA": {"authority": "DPOR",       "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "Class A/B/C + CEM/Asphalt",   "nascla": True,  "temp_days": 45,   "notes": "8 hrs pre-license education required. 45-day temp license available. NASCLA accepted."},
    "WA": {"authority": "L&I",        "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "General Contractor",          "nascla": False, "temp_days": None, "notes": ""},
    "WV": {"authority": "WVDOLIR",    "threshold": 2_500,   "fee_prime": None, "fee_sub": None, "asphalt_class": "General Contractor",          "nascla": True,  "temp_days": None, "notes": "NASCLA accepted."},
    "WI": {"authority": "DSPS",       "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "Contractor Certification",    "nascla": False, "temp_days": None, "notes": ""},
    "WY": {"authority": "Local",      "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "Local jurisdiction",          "nascla": False, "temp_days": None, "notes": ""},
    "DC": {"authority": "DCRA",       "threshold": None,    "fee_prime": None, "fee_sub": None, "asphalt_class": "General Contractor",          "nascla": False, "temp_days": None, "notes": ""},
}

# States in the NASCLA reciprocity network (as of 2026)
NASCLA_STATES = {s for s, d in STATE_MATRIX.items() if d["nascla"]}


# ── Verifier class ────────────────────────────────────────────────────────────

class LicenseVerifier:
    """
    Verify contractor licenses across all 50 US states.

    Priority: Apify live API → Shovels.ai → static reference data.
    Always returns a standardised dict regardless of the data source.
    """

    def __init__(self) -> None:
        self._provider = _PROVIDER
        if self._provider == "auto":
            if _APIFY_KEY:
                self._provider = "apify"
            elif _SHOVELS_KEY:
                self._provider = "shovels"
            else:
                self._provider = "static"

    # ── Public API ────────────────────────────────────────────────────────────

    def verify_contractor(self, state_code: str, license_number: str) -> dict:
        """
        Verify a contractor license.  Returns a standardised result dict:
          {
            "entity_name":    str | None,
            "state_code":     "VA",
            "license_number": "2705...",
            "license_type":   str | None,
            "status":         "Active" | "Expired" | "Suspended" | "Unknown",
            "expiration":     "2026-12-31" | None,
            "days_until_exp": int | None,
            "is_compliant":   bool,
            "api_source":     "apify" | "shovels" | "static",
            "raw_json":       str | None,
          }
        """
        state = state_code.upper().strip()
        if state not in STATE_MATRIX:
            return self._error_result(state, license_number, f"Unknown state code: {state}")

        if self._provider == "apify" and _APIFY_KEY:
            return self._verify_apify(state, license_number)
        if self._provider == "shovels" and _SHOVELS_KEY:
            return self._verify_shovels(state, license_number)
        return self._static_result(state, license_number)

    def get_state_info(self, state_code: str) -> dict:
        """Return the static reference data for a state (no API call)."""
        state = state_code.upper().strip()
        entry = STATE_MATRIX.get(state)
        if not entry:
            return {"error": f"Unknown state: {state}"}
        return {"state_code": state, **entry, "nascla_network": sorted(NASCLA_STATES)}

    def get_matrix(self) -> list[dict]:
        """Return the full 50-state matrix for the dashboard reference panel."""
        return [
            {"state_code": s, **d, "nascla_network_size": len(NASCLA_STATES)}
            for s, d in sorted(STATE_MATRIX.items())
        ]

    # ── Provider implementations ──────────────────────────────────────────────

    def _verify_apify(self, state: str, license_number: str) -> dict:
        """Call Apify Professional License Lookup actor."""
        try:
            resp = httpx.get(
                "https://api.apify.com/v2/acts/apify~professional-license-lookup/runs",
                params={"token": _APIFY_KEY},
                json={"state": state, "licenseNumber": license_number},
                timeout=15.0,
            )
            resp.raise_for_status()
            data = resp.json()
            result = data.get("results", [{}])
            if isinstance(result, list):
                result = result[0] if result else {}

            status = result.get("licenseStatus", "Unknown")
            exp_str = result.get("expirationDate")
            days = self._days_until(exp_str)
            return {
                "entity_name":    result.get("businessName"),
                "state_code":     state,
                "license_number": license_number,
                "license_type":   result.get("licenseType"),
                "status":         status,
                "expiration":     exp_str,
                "days_until_exp": days,
                "is_compliant":   status == "Active" and (days is None or days > 7),
                "api_source":     "apify",
                "raw_json":       json.dumps(result),
            }
        except Exception as exc:
            logger.warning("Apify license lookup failed (%s/%s): %s", state, license_number, exc)
            return self._static_result(state, license_number, fallback_reason=str(exc))

    def _verify_shovels(self, state: str, license_number: str) -> dict:
        """Call Shovels.ai contractor lookup API."""
        try:
            resp = httpx.get(
                "https://api.shovels.ai/v1/contractors/license",
                headers={"X-API-Key": _SHOVELS_KEY},
                params={"state": state, "license_number": license_number},
                timeout=15.0,
            )
            resp.raise_for_status()
            data = resp.json()
            status = data.get("status", "Unknown")
            exp_str = data.get("expiration_date")
            days = self._days_until(exp_str)
            return {
                "entity_name":    data.get("business_name"),
                "state_code":     state,
                "license_number": license_number,
                "license_type":   data.get("license_type"),
                "status":         status,
                "expiration":     exp_str,
                "days_until_exp": days,
                "is_compliant":   status == "Active" and (days is None or days > 7),
                "api_source":     "shovels",
                "raw_json":       json.dumps(data),
            }
        except Exception as exc:
            logger.warning("Shovels license lookup failed (%s/%s): %s", state, license_number, exc)
            return self._static_result(state, license_number, fallback_reason=str(exc))

    def _static_result(self, state: str, license_number: str, fallback_reason: Optional[str] = None) -> dict:
        """
        Return a static/stub result using the reference matrix.
        No expiration data is available without a live API.
        """
        entry = STATE_MATRIX.get(state, {})
        note = f"Static reference only — no live API key set. {fallback_reason or ''}".strip()
        return {
            "entity_name":    None,
            "state_code":     state,
            "license_number": license_number,
            "license_type":   entry.get("asphalt_class"),
            "status":         "Unknown",
            "expiration":     None,
            "days_until_exp": None,
            "is_compliant":   False,
            "api_source":     "static",
            "raw_json":       None,
            "note":           note,
        }

    @staticmethod
    def _error_result(state: str, license_number: str, error: str) -> dict:
        return {
            "entity_name": None, "state_code": state, "license_number": license_number,
            "license_type": None, "status": "Unknown", "expiration": None,
            "days_until_exp": None, "is_compliant": False, "api_source": "error",
            "raw_json": None, "error": error,
        }

    @staticmethod
    def _days_until(date_str: Optional[str]) -> Optional[int]:
        if not date_str:
            return None
        try:
            for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%Y-%m-%dT%H:%M:%S"):
                try:
                    dt = datetime.strptime(date_str, fmt).replace(tzinfo=timezone.utc)
                    return (dt - datetime.now(timezone.utc)).days
                except ValueError:
                    continue
        except Exception:
            pass
        return None


# Singleton
verifier = LicenseVerifier()
