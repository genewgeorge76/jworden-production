"""
google_sheets.py — Google Sheets integration.

This module was referenced but never committed. Two modules import it:

    app/routers/leads.py:17               (module level)  -> sync_lead_to_sheets
    app/routers/admin_integrations.py:236 (function level) -> sync_pricing_sheet

The module-level import in leads.py meant `app.routers.leads` raised
ModuleNotFoundError at import time, so every endpoint under /api/v1/leads —
the path the public lead-capture forms post to — was unreachable. Same failure
mode as the missing geocoding module and the one owner_auth.py documents: the
backend landed in a commit that referenced files which were never created.

STATUS: the Sheets sync itself is NOT IMPLEMENTED.

`sync_lead_to_sheets` has zero call sites in the codebase — leads.py imports the
name but never invokes it. `sync_pricing_sheet` is called from one owner-gated
admin endpoint.

Both return an explicit not-implemented result rather than a success shape. That
is deliberate: an admin panel showing "synced" for a sync that never happened is
worse than one showing "not configured". Callers already handle a dict result.

TO IMPLEMENT: this needs a service-account JSON with the Sheets scope
(https://www.googleapis.com/auth/spreadsheets), the target spreadsheet id, and a
decision about the column schema for each sheet. None of those exist yet, and
guessing at a column layout would silently write rows into the wrong columns.

Return shape matches google_suite.py: {ok, configured, detail, ...}.
"""
from __future__ import annotations

import logging
from typing import Any, Optional

from . import runtime_config as _cfg

logger = logging.getLogger(__name__)

# Read but not yet used — present so an admin status panel can already show
# whether the operator has supplied credentials.
_SCOPE = "https://www.googleapis.com/auth/spreadsheets"

_NOT_IMPLEMENTED = (
    "Google Sheets sync is not implemented. The module was referenced by the "
    "routers but never written. Implementing it requires a service-account JSON "
    "with the Sheets scope, a target spreadsheet id, and an agreed column schema."
)


def _status() -> dict:
    """Report whether credentials are present, without claiming a sync occurred."""
    sa = (_cfg.get("GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON") or "").strip()
    sheet = (_cfg.get("GOOGLE_SHEETS_ID") or "").strip()
    missing = [n for n, v in (
        ("GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON", sa),
        ("GOOGLE_SHEETS_ID", sheet),
    ) if not v]
    return {
        "ok": False,
        "configured": not missing,
        "implemented": False,
        "detail": _NOT_IMPLEMENTED,
        "missing_keys": missing,
    }


def sync_lead_to_sheets(lead: Any = None, **kwargs) -> dict:
    """
    Append a lead row to the configured spreadsheet.

    Not implemented. Never raises — a lead must still be saved to the database
    even when an optional downstream sync is unavailable.
    """
    logger.info("[SHEETS] sync_lead_to_sheets called but not implemented")
    return _status()


def sync_pricing_sheet(sheet_id: Optional[str] = None, **kwargs) -> dict:
    """
    Push the live pricing table to the configured spreadsheet.

    Not implemented. Returns a not-implemented result so the admin endpoint
    reports the truth rather than a false success.
    """
    logger.info("[SHEETS] sync_pricing_sheet called but not implemented (sheet_id=%s)", sheet_id)
    result = _status()
    if sheet_id:
        result["requested_sheet_id"] = sheet_id
    return result
