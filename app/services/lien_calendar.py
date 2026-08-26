"""
lien_calendar.py — Mechanics lien deadline calculator for JWordenAI.

Covers all 51 jurisdictions, reading the generated tables in legal_tables.py
rather than a table kept here. Tracks projects in LienCalendarEntry and sends
reminders.

WHAT CHANGED, AND WHY IT MATTERED
─────────────────────────────────
This module used to carry its own hand-written lien table of 13 states. The
other 38 jurisdictions fell through to a "default" of 90 days to file and 180
to foreclose, flagged only by a `used_default_rules` boolean that the caller
had to notice. A default is a guess with a timestamp on it.

Three specific corrections came out of moving to the cited data:

  TEXAS was the worst. The rule is "affidavit filed by the 15th day of the 4th
  calendar month after the day work was completed". The old table stored
  `lien_filing_days: 15` and computed last furnishing plus fifteen days — a
  deadline roughly three and a half months early, on the state where this
  company has more documented work than anywhere outside Virginia. Early is not
  harmless when it is presented as the deadline.

  ANCHORS were assumed. Every filing deadline was counted from last furnishing
  and every preliminary notice from the project start date. Nine states count
  filing from completion, and Virginia's preliminary notice runs from LAST
  furnishing — anchoring it to project start makes it look due at the beginning
  of a job when it is due at the end.

  KENTUCKY states no foreclosure period in the source. It now returns None with
  a reason rather than inheriting 180 days from a default.

WHAT IS NOT COMPUTED
────────────────────
A deadline the source does not state is returned as None alongside the reason.
A plausible date carries the same authority as a correct one and is
indistinguishable to the person relying on it, so this module would rather
answer "the source does not say" than answer confidently and be wrong.

Public API
──────────
  calculate_deadlines(state_code, project_start_date, last_furnishing_date, *,
                      completion_date=None, residential=False) -> dict
  get_upcoming_deadlines(db, days_ahead=30) -> list
  send_lien_reminders(db) -> int
"""

from __future__ import annotations

import logging
from calendar import monthrange
from datetime import datetime, timedelta, timezone
from typing import Optional

from .legal_tables import LIEN_LAWS

logger = logging.getLogger(__name__)

_DISCLAIMER = (
    "Deadlines are calculated from a dataset with a statute citation and a "
    "verification date per jurisdiction. Verify with a licensed attorney in "
    "that state before relying on them — statutes change and facts vary."
)


def _add_months(when: datetime, months: int) -> datetime:
    """Same day in a later month, clamped to that month's length."""
    month_index = when.month - 1 + months
    year = when.year + month_index // 12
    month = month_index % 12 + 1
    day = min(when.day, monthrange(year, month)[1])
    return when.replace(year=year, month=month, day=day)


def _anchor_date(
    anchor: Optional[str],
    project_start_date: datetime,
    last_furnishing_date: datetime,
    completion_date: Optional[datetime],
) -> Optional[datetime]:
    """
    The date a deadline counts from, or None when the source did not say.

    `completion` falls back to last furnishing only when no completion date was
    supplied — for a general contractor those usually coincide. The returned
    dict records which was used, so a subcontractor whose completion date
    differs can see that the fallback was taken and supply the real one.
    """
    if anchor == "last_furnishing":
        return last_furnishing_date
    if anchor == "first_furnishing":
        return project_start_date
    if anchor == "completion":
        return completion_date or last_furnishing_date
    return None


def calculate_deadlines(
    state_code: str,
    project_start_date: datetime,
    last_furnishing_date: datetime,
    *,
    completion_date: Optional[datetime] = None,
    residential: bool = False,
) -> dict:
    """
    Lien deadlines for one project, from the cited table for that jurisdiction.

    An unknown state code returns `known=False` and no dates. The previous
    version substituted a 90/180 default here; a state this calculator has
    never heard of is not a state whose deadlines it can guess.
    """
    code = state_code.upper()
    law = LIEN_LAWS.get(code)

    if law is None:
        return {
            "state_code": code,
            "known": False,
            "reason": f"{code} is not one of the {len(LIEN_LAWS)} jurisdictions in the cited dataset.",
            "preliminary_notice_deadline": None,
            "lien_filing_deadline": None,
            "foreclosure_deadline": None,
            "disclaimer": _DISCLAIMER,
        }

    unresolved: list[str] = []

    # ── Preliminary notice ────────────────────────────────────────────────
    prelim_deadline: Optional[datetime] = None
    prelim_from = _anchor_date(
        law["preliminary_notice_anchor"], project_start_date, last_furnishing_date, completion_date
    )
    if law["preliminary_notice_days"] is not None and prelim_from is not None:
        prelim_deadline = prelim_from + timedelta(days=law["preliminary_notice_days"])
    elif law["preliminary_notice_required"]:
        # Required, but the source states it in words this table could not
        # reduce to a count — "before or within 5 days after first furnishing",
        # for instance. The wording is handed back rather than approximated.
        unresolved.append(
            f"preliminary notice is required but not reducible to a date here: "
            f"{law['preliminary_notice_note'] or 'see citation'}"
        )

    # ── Lien filing ───────────────────────────────────────────────────────
    lien_deadline: Optional[datetime] = None
    rule = law["lien_filing_rule"]
    if rule and rule["kind"] == "calendar_month_day":
        # Texas: the 15th day of the Nth calendar month after the month in
        # which work was completed. Walking months, not adding days.
        base = _anchor_date(rule["anchor"], project_start_date, last_furnishing_date, completion_date)
        months = rule["months_after"]
        if residential and rule["residential_months_after"]:
            months = rule["residential_months_after"]
        if base is not None:
            month_start = base.replace(day=1)
            target = _add_months(month_start, months)
            day = min(rule["day_of_month"], monthrange(target.year, target.month)[1])
            lien_deadline = target.replace(day=day)
    elif law["lien_filing_days"] is not None:
        filing_from = _anchor_date(
            law["lien_filing_anchor"], project_start_date, last_furnishing_date, completion_date
        )
        if filing_from is not None:
            lien_deadline = filing_from + timedelta(days=law["lien_filing_days"])
        else:
            unresolved.append("the source does not state what the filing period runs from")
    else:
        unresolved.append("the source states no filing period")

    # ── Foreclosure ───────────────────────────────────────────────────────
    foreclosure_deadline: Optional[datetime] = None
    if law["foreclosure_days"] is not None and lien_deadline is not None:
        foreclosure_deadline = lien_deadline + timedelta(days=law["foreclosure_days"])
    elif law["foreclosure_days"] is None:
        # Kentucky. Stated as absent in the source, so absent here.
        unresolved.append("the source states no foreclosure period for this jurisdiction")

    now = datetime.now(timezone.utc)

    def _days_until(when: Optional[datetime]) -> Optional[int]:
        return (when - now).days if when else None

    used_completion_fallback = (
        completion_date is None
        and "completion" in {law["lien_filing_anchor"], (rule or {}).get("anchor")}
    )

    return {
        "state_code": code,
        "known": True,
        "preliminary_notice_deadline": prelim_deadline.isoformat() if prelim_deadline else None,
        "preliminary_notice_required": law["preliminary_notice_required"],
        "preliminary_notice_note": law["preliminary_notice_note"],
        "lien_filing_deadline": lien_deadline.isoformat() if lien_deadline else None,
        "lien_filing_note": law["lien_filing_note"],
        "foreclosure_deadline": foreclosure_deadline.isoformat() if foreclosure_deadline else None,
        "days_until_lien_deadline": _days_until(lien_deadline),
        "days_until_foreclosure_deadline": _days_until(foreclosure_deadline),
        "state_notes": law["notes"],
        "citation": law["citation"],
        "source_last_verified": law["last_verified"],
        # Named so a caller can tell "we could not work this out" from "there is
        # nothing to work out". Empty means every deadline below was computed.
        "unresolved": unresolved,
        "used_last_furnishing_as_completion": used_completion_fallback,
        "disclaimer": _DISCLAIMER,
    }


def get_upcoming_deadlines(db, days_ahead: int = 30) -> list[dict]:
    """Return LienCalendarEntry records with deadlines within days_ahead."""
    try:
        from ..models import LienCalendarEntry  # noqa: PLC0415

        now = datetime.now(timezone.utc)
        cutoff = now + timedelta(days=days_ahead)

        entries = (
            db.query(LienCalendarEntry)
            .filter(
                (LienCalendarEntry.lien_filing_deadline <= cutoff) |
                (LienCalendarEntry.preliminary_notice_deadline <= cutoff)
            )
            .order_by(LienCalendarEntry.lien_filing_deadline.asc())
            .all()
        )

        results = []
        for e in entries:
            lien_days = (
                (e.lien_filing_deadline - now).days
                if e.lien_filing_deadline
                else None
            )
            prelim_days = (
                (e.preliminary_notice_deadline - now).days
                if e.preliminary_notice_deadline
                else None
            )
            results.append({
                "id": e.id,
                "customer_name": e.customer_name,
                "project_address": e.project_address,
                "state_code": e.state_code,
                "lien_filing_deadline": e.lien_filing_deadline.isoformat() if e.lien_filing_deadline else None,
                "preliminary_notice_deadline": e.preliminary_notice_deadline.isoformat() if e.preliminary_notice_deadline else None,
                "foreclosure_deadline": e.foreclosure_deadline.isoformat() if e.foreclosure_deadline else None,
                "days_until_lien": lien_days,
                "days_until_prelim": prelim_days,
                "is_urgent": (lien_days is not None and lien_days <= 7) or (prelim_days is not None and prelim_days <= 7),
            })

        return results
    except Exception as exc:  # noqa: BLE001
        logger.error("get_upcoming_deadlines error: %s", exc)
        return []


def send_lien_reminders(db) -> int:
    """Send notifications for entries with deadlines within 7 days. Returns count sent."""
    try:
        from ..services.notifications import send_lead_notification  # noqa: PLC0415
        from ..models import LienCalendarEntry  # noqa: PLC0415

        upcoming = get_upcoming_deadlines(db, days_ahead=7)
        sent = 0

        for entry in upcoming:
            if not entry.get("is_urgent"):
                continue

            # Check if reminder already sent
            db_entry = db.get(LienCalendarEntry, entry["id"])
            if db_entry and db_entry.reminder_sent_at:
                continue

            send_lead_notification({
                "type": "LIEN_DEADLINE_REMINDER",
                "name": entry["customer_name"],
                "project_address": entry["project_address"],
                "state_code": entry["state_code"],
                "lien_filing_deadline": entry["lien_filing_deadline"],
                "days_until_lien": entry["days_until_lien"],
                "score": {"label": "URGENT", "priority": 1},
                "note": f"⚠️ Mechanics lien deadline in {entry['days_until_lien']} days!",
            })

            if db_entry:
                db_entry.reminder_sent_at = datetime.now(timezone.utc)
                db.commit()

            sent += 1

        return sent
    except Exception as exc:  # noqa: BLE001
        logger.error("send_lien_reminders error: %s", exc)
        return 0
