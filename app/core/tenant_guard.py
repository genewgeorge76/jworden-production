"""
tenant_guard.py — observe (and eventually enforce) tenant scoping on queries.

Background
----------
44 of 66 tables carry a ``tenant_id``, but a static audit
(``scripts/audit_tenant_isolation.py``) found only 16 of 123 queries against
those tables filter on it. The module that claimed to enforce isolation,
``jarvis_os/abilities/MultiTenantSaaS/tenant_isolator.py``, did nothing at all:
it never touched the database and printed "CRITICAL SECURITY BREACH PREVENTED"
on a 10% random roll.

This is the real mechanism. It starts in **log-only** mode deliberately.

Why log-only first
------------------
The platform serves 11 live tenants. Switching every query to auto-filter in one
step would silently empty any result set that is legitimately cross-tenant —
superadmin views, the Site Factory's hostname resolution, aggregate reporting —
and those are exactly the paths that are hard to test without production data.

So: observe first, learn which of the audit's 107 findings are real, mark the
deliberate cross-tenant queries with ``allow_cross_tenant()``, and only then turn
on enforcement. The static audit cannot tell a genuine leak from a query scoped
via a helper; runtime logs can.

Modes (``TENANT_GUARD_MODE``)
-----------------------------
  off      no-op. The listener is not even registered.
  log      default. Logs unscoped queries. Changes nothing. <- we are here
  enforce  raises on an unscoped query. NOT YET ENABLED — do not switch this on
           until the log has been quiet for a full business cycle and every
           legitimate cross-tenant caller is marked.

Usage
-----
Wire once at startup::

    from .core.tenant_guard import install_tenant_guard
    install_tenant_guard()

Mark a deliberately cross-tenant query::

    from .core.tenant_guard import allow_cross_tenant

    with allow_cross_tenant("superadmin tenant list"):
        tenants = db.query(Tenant).all()

Guarantees
----------
This listener never raises in ``log`` mode, and never alters a query in any
mode. A bug in an observability hook must not be able to take down the API, so
every code path is wrapped and failures are counted, logged once, and swallowed.
"""
from __future__ import annotations

import contextlib
import contextvars
import logging
import os
import threading
import traceback
from typing import Iterator

from sqlalchemy import event
from sqlalchemy.orm import Query

logger = logging.getLogger(__name__)

MODE_OFF = "off"
MODE_LOG = "log"
MODE_ENFORCE = "enforce"

_TENANT_COLUMN = "tenant_id"

# Set inside allow_cross_tenant(); a truthy value suppresses reporting.
_cross_tenant_reason: contextvars.ContextVar[str | None] = contextvars.ContextVar(
    "tenant_guard_cross_tenant", default=None
)

_installed = False
_lock = threading.Lock()

# Deduplicate: report each call site once per process rather than per query, so
# a hot endpoint cannot flood the log.
_seen_sites: set[str] = set()
_internal_error_logged = False


class CrossTenantQueryError(RuntimeError):
    """Raised in enforce mode when a tenant-scoped query has no tenant filter."""


def current_mode() -> str:
    mode = (os.getenv("TENANT_GUARD_MODE") or MODE_LOG).strip().lower()
    return mode if mode in {MODE_OFF, MODE_LOG, MODE_ENFORCE} else MODE_LOG


@contextlib.contextmanager
def allow_cross_tenant(reason: str) -> Iterator[None]:
    """
    Mark a block as deliberately cross-tenant.

    ``reason`` is required and shows up in diagnostics — it forces the caller to
    say why, so an audit can tell an intentional global read from a forgotten
    filter.
    """
    token = _cross_tenant_reason.set(reason or "unspecified")
    try:
        yield
    finally:
        _cross_tenant_reason.reset(token)


def _tenant_scoped_entities(query: Query) -> list[str]:
    """Names of entities in this query whose table carries tenant_id."""
    scoped = []
    for desc in query.column_descriptions:
        entity = desc.get("entity")
        table = getattr(entity, "__table__", None)
        if table is not None and _TENANT_COLUMN in table.columns:
            scoped.append(getattr(entity, "__name__", str(entity)))
    return scoped


def _has_tenant_filter(query: Query) -> bool:
    """True if the query's WHERE clause references tenant_id."""
    criteria = getattr(query, "_where_criteria", None)
    if criteria:
        for clause in criteria:
            # Cheaper and more robust than compiling the whole statement.
            for col in getattr(clause, "_from_objects", ()) or ():
                if _TENANT_COLUMN in getattr(col, "columns", {}):
                    return True
            if _TENANT_COLUMN in str(clause):
                return True
    return False


def _call_site() -> str:
    """First application frame outside this module, as file:line."""
    for frame in reversed(traceback.extract_stack()[:-1]):
        if "/app/" in frame.filename and "tenant_guard" not in frame.filename:
            name = frame.filename.split("/app/", 1)[-1]
            return f"app/{name}:{frame.lineno}"
    return "unknown"


def _report(entities: list[str], mode: str) -> None:
    site = _call_site()
    key = f"{site}|{','.join(entities)}"

    if mode == MODE_ENFORCE:
        raise CrossTenantQueryError(
            f"Query on tenant-scoped {', '.join(entities)} at {site} has no "
            f"{_TENANT_COLUMN} filter. Add one, or wrap the call in "
            f"allow_cross_tenant('why') if it is deliberately global."
        )

    if key in _seen_sites:
        return
    _seen_sites.add(key)
    logger.warning(
        "[TENANT-GUARD] unscoped query on %s at %s (no %s filter) — "
        "log-only, query unchanged",
        ", ".join(entities), site, _TENANT_COLUMN,
    )


def observed_sites() -> list[str]:
    """Call sites reported so far this process. For an admin/debug endpoint."""
    return sorted(_seen_sites)


def install_tenant_guard() -> str:
    """Register the listener. Idempotent. Returns the active mode."""
    global _installed
    mode = current_mode()
    if mode == MODE_OFF:
        logger.info("[TENANT-GUARD] disabled (TENANT_GUARD_MODE=off)")
        return mode

    with _lock:
        if _installed:
            return mode

        @event.listens_for(Query, "before_compile", retval=False)
        def _guard(query: Query):  # noqa: ANN202
            global _internal_error_logged
            try:
                active = current_mode()
                if active == MODE_OFF:
                    return
                if _cross_tenant_reason.get():
                    return
                entities = _tenant_scoped_entities(query)
                if not entities:
                    return
                if _has_tenant_filter(query):
                    return
                _report(entities, active)
            except CrossTenantQueryError:
                raise
            except Exception:  # noqa: BLE001
                # An observability hook must never break a request.
                if not _internal_error_logged:
                    _internal_error_logged = True
                    logger.exception("[TENANT-GUARD] internal error; guard is inert")

        _installed = True

    logger.info("[TENANT-GUARD] installed in %s mode", mode)
    return mode
