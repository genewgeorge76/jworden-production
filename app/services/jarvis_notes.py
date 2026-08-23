"""
Issues and reminders Jarvis can actually keep.

Jarvis had nowhere to put either. Asked to note a problem or to remind the
operator of something, the model could only answer as though it had — short
memory holds the last few turns of one session, and nothing survives a restart.
An assistant that says "I'll remind you" and does not is worse than one that
says it cannot.

Everything here is tenant-scoped through services/tenancy. A hosted customer's
Jarvis records into their own bucket, and cannot read the operator's.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from sqlalchemy.orm import Session

from ..models import OperatorNote
from .tenancy import get_scoped, scope, stamp_for

logger = logging.getLogger(__name__)

KIND_ISSUE = "issue"
KIND_REMINDER = "reminder"
KINDS = frozenset({KIND_ISSUE, KIND_REMINDER})

SEVERITIES = ("low", "normal", "high", "critical")
OPEN = "open"
DONE = "done"
DISMISSED = "dismissed"
STATUSES = frozenset({OPEN, DONE, DISMISSED})

# A reminder further out than this is almost always a parsing mistake rather
# than an intention — a model computing minutes from a vague phrase can be off
# by orders of magnitude, and the failure is silent until the reminder never
# fires.
MAX_DUE_MINUTES = 60 * 24 * 366


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _resolve_due(
    due_in_minutes: Optional[int], due_at: Optional[str]
) -> tuple[Optional[datetime], Optional[str]]:
    """
    When a reminder comes due, as (timestamp, error).

    Two ways in, because the model has neither a clock nor a calendar:
    `due_in_minutes` for "in two hours", which it can compute without knowing
    the time, and `due_at` for an absolute instant it was given.
    """
    if due_in_minutes is not None:
        try:
            minutes = int(due_in_minutes)
        except (TypeError, ValueError):
            return None, "due_in_minutes must be a whole number of minutes."
        if minutes <= 0:
            return None, "due_in_minutes must be positive; a reminder cannot be due in the past."
        if minutes > MAX_DUE_MINUTES:
            return None, f"due_in_minutes cannot exceed {MAX_DUE_MINUTES} (about a year)."
        return _utcnow() + timedelta(minutes=minutes), None

    if due_at:
        try:
            parsed = datetime.fromisoformat(str(due_at).replace("Z", "+00:00"))
        except ValueError:
            return None, "due_at must be an ISO 8601 timestamp, e.g. 2026-09-01T14:00:00Z."
        if parsed.tzinfo is None:
            # A naive timestamp is ambiguous, and guessing the operator's zone
            # is how a reminder fires five hours early.
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed, None

    return None, None


def record(
    db: Session,
    *,
    tenant_id: str,
    kind: str,
    title: str,
    detail: Optional[str] = None,
    severity: str = "normal",
    due_in_minutes: Optional[int] = None,
    due_at: Optional[str] = None,
    source: str = "jarvis",
) -> dict[str, Any]:
    """Write an issue or a reminder. Returns the stored row, or an error."""
    kind = (kind or "").strip().lower()
    if kind not in KINDS:
        return {"ok": False, "error": f"kind must be one of {sorted(KINDS)}."}

    title = (title or "").strip()
    if not title:
        return {"ok": False, "error": "A title is required."}

    severity = (severity or "normal").strip().lower()
    if severity not in SEVERITIES:
        severity = "normal"

    resolved_due, error = _resolve_due(due_in_minutes, due_at)
    if error:
        return {"ok": False, "error": error}

    if kind == KIND_REMINDER and resolved_due is None:
        # A reminder with no time is a note nobody will ever be shown. Refuse
        # rather than store something that silently does nothing.
        return {
            "ok": False,
            "error": "A reminder needs a time: pass due_in_minutes, or due_at as ISO 8601.",
        }

    note = OperatorNote(
        tenant_id=stamp_for(tenant_id),
        kind=kind,
        title=title[:300],
        detail=(detail or None),
        severity=severity,
        status=OPEN,
        due_at=resolved_due,
        source=source[:60],
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    logger.info(
        "Jarvis recorded a %s for tenant %s: %s", kind, note.tenant_id, note.title
    )
    return {"ok": True, **_as_dict(note)}


def listing(
    db: Session,
    *,
    tenant_id: str,
    kind: Optional[str] = None,
    status: Optional[str] = OPEN,
    due_within_minutes: Optional[int] = None,
    limit: int = 25,
) -> dict[str, Any]:
    """Read issues or reminders back. Open ones by default — that is the question being asked."""
    query = scope(db.query(OperatorNote), OperatorNote, tenant_id)

    if kind:
        kind = kind.strip().lower()
        if kind not in KINDS:
            return {"ok": False, "error": f"kind must be one of {sorted(KINDS)}."}
        query = query.filter(OperatorNote.kind == kind)

    if status:
        status = status.strip().lower()
        if status not in STATUSES:
            return {"ok": False, "error": f"status must be one of {sorted(STATUSES)}."}
        query = query.filter(OperatorNote.status == status)

    if due_within_minutes is not None:
        cutoff = _utcnow() + timedelta(minutes=int(due_within_minutes))
        query = query.filter(
            OperatorNote.due_at.isnot(None), OperatorNote.due_at <= cutoff
        )

    limit = max(1, min(int(limit or 25), 100))
    rows = (
        query.order_by(
            # Anything with a due date first and soonest-first among those, then
            # newest. Reading a reminder list is asking "what is next".
            OperatorNote.due_at.is_(None),
            OperatorNote.due_at.asc(),
            OperatorNote.created_at.desc(),
        )
        .limit(limit)
        .all()
    )
    return {"ok": True, "count": len(rows), "notes": [_as_dict(r) for r in rows]}


def set_status(
    db: Session, *, tenant_id: str, note_id: int, status: str
) -> dict[str, Any]:
    """Close one out. Scoped, so one tenant cannot resolve another's."""
    status = (status or "").strip().lower()
    if status not in STATUSES:
        return {"ok": False, "error": f"status must be one of {sorted(STATUSES)}."}

    note = get_scoped(db, OperatorNote, note_id, tenant_id)
    if note is None:
        return {"ok": False, "error": f"No note {note_id} for this account."}

    note.status = status
    note.resolved_at = _utcnow() if status != OPEN else None
    db.commit()
    db.refresh(note)
    return {"ok": True, **_as_dict(note)}


def _as_dict(note: OperatorNote) -> dict[str, Any]:
    return {
        "id": note.id,
        "kind": note.kind,
        "title": note.title,
        "detail": note.detail,
        "severity": note.severity,
        "status": note.status,
        "due_at": note.due_at.isoformat() if note.due_at else None,
        "source": note.source,
        "created_at": note.created_at.isoformat() if note.created_at else None,
        "resolved_at": note.resolved_at.isoformat() if note.resolved_at else None,
    }
