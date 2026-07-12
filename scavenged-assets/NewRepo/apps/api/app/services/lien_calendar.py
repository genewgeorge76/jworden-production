"""
lien_calendar.py — Mechanics lien deadline calculator.

State-specific lien law data for all 51 U.S. jurisdictions (50 states + DC).
Provides calculate_deadlines() and get_upcoming_deadlines() for the lien
calendar router. Deadlines reflect the general original-contractor rule per
state; subcontractor/supplier variations are summarized in each entry's notes.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

logger = logging.getLogger(__name__)

_LIEN_LAWS: dict[str, dict] = {
    'VA': {
        'preliminary_notice_days': None,
        'lien_filing_days': 90,
        'foreclosure_days': 180,
        'notes': 'File lien within 90 days of last furnishing. No preliminary notice required.',
    },
    'TX': {
        'preliminary_notice_days': 15,
        'lien_filing_days': 15,
        'foreclosure_days': 180,
        'notes': 'Monthly notices required. File lien by 15th of 3rd month after last furnishing.',
    },
    'FL': {
        'preliminary_notice_days': 45,
        'lien_filing_days': 90,
        'foreclosure_days': 365,
        'notes': 'Notice to Owner required within 45 days of first furnishing.',
    },
    'NC': {
        'preliminary_notice_days': None,
        'lien_filing_days': 120,
        'foreclosure_days': 180,
        'notes': 'File lien within 120 days of last furnishing.',
    },
    'GA': {
        'preliminary_notice_days': None,
        'lien_filing_days': 90,
        'foreclosure_days': 365,
        'notes': 'File lien within 90 days of last furnishing.',
    },
    'NY': {
        'preliminary_notice_days': None,
        'lien_filing_days': 240,
        'foreclosure_days': 365,
        'notes': 'File lien within 8 months of last furnishing (public improvement: 30 days).',
    },
    'NJ': {
        'preliminary_notice_days': None,
        'lien_filing_days': 90,
        'foreclosure_days': 365,
        'notes': 'File lien within 90 days of last furnishing.',
    },
    'MI': {
        'preliminary_notice_days': 20,
        'lien_filing_days': 90,
        'foreclosure_days': 365,
        'notes': 'Notice of commencement required. File lien within 90 days.',
    },
    'CA': {
        'preliminary_notice_days': 20,
        'lien_filing_days': 90,
        'foreclosure_days': 90,
        'notes': 'Preliminary notice required within 20 days. File lien within 90 days.',
    },
    'MD': {
        'preliminary_notice_days': None,
        'lien_filing_days': 180,
        'foreclosure_days': 365,
        'notes': 'File lien within 180 days of last furnishing.',
    },
    'OH': {
        'preliminary_notice_days': None,
        'lien_filing_days': 75,
        'foreclosure_days': 365,
        'notes': 'File lien within 75 days of last furnishing.',
    },
    'PA': {
        'preliminary_notice_days': None,
        'lien_filing_days': 180,
        'foreclosure_days': 365,
        'notes': 'File lien within 6 months of last furnishing.',
    },
    'IL': {
        'preliminary_notice_days': None,
        'lien_filing_days': 120,
        'foreclosure_days': 730,
        'notes': 'File lien within 4 months of last furnishing.',
    },
    'AL': {
        'preliminary_notice_days': None,
        'lien_filing_days': 180,
        'foreclosure_days': 180,
        'notes': 'Original contractors: verified lien statement within 6 months of last work. Suppliers: 4 months.',
    },
    'AK': {
        'preliminary_notice_days': None,
        'lien_filing_days': 90,
        'foreclosure_days': 180,
        'notes': 'Claim of lien within 90 days of last furnishing (120 if no notice of completion recorded).',
    },
    'AZ': {
        'preliminary_notice_days': 20,
        'lien_filing_days': 120,
        'foreclosure_days': 180,
        'notes': '20-day preliminary notice required. File within 120 days of completion (60 if notice of completion recorded). Owner-occupied residential largely exempt.',
    },
    'AR': {
        'preliminary_notice_days': None,
        'lien_filing_days': 120,
        'foreclosure_days': 456,
        'notes': 'File within 120 days of last furnishing. Residential: pre-construction notice required; subs/suppliers give 75-day notice.',
    },
    'CO': {
        'preliminary_notice_days': None,
        'lien_filing_days': 120,
        'foreclosure_days': 180,
        'notes': 'File within 4 months of last work (labor-only: 2 months). Serve Notice of Intent 10 days before recording.',
    },
    'CT': {
        'preliminary_notice_days': None,
        'lien_filing_days': 90,
        'foreclosure_days': 365,
        'notes': 'File within 90 days of ceasing work; serve owner within 30 days of recording.',
    },
    'DE': {
        'preliminary_notice_days': None,
        'lien_filing_days': 180,
        'foreclosure_days': 180,
        'notes': 'Original contractors: statement of claim within 180 days after completion (subs: 120 days from last work).',
    },
    'DC': {
        'preliminary_notice_days': None,
        'lien_filing_days': 90,
        'foreclosure_days': 180,
        'notes': 'Record notice of lien within 90 days after completion or termination.',
    },
    'HI': {
        'preliminary_notice_days': None,
        'lien_filing_days': 45,
        'foreclosure_days': 90,
        'notes': 'Application for lien within 45 days after completion — shortest window in the U.S. Court hearing required.',
    },
    'ID': {
        'preliminary_notice_days': None,
        'lien_filing_days': 90,
        'foreclosure_days': 180,
        'notes': 'File within 90 days of last furnishing; serve owner within 5 business days.',
    },
    'IN': {
        'preliminary_notice_days': None,
        'lien_filing_days': 90,
        'foreclosure_days': 365,
        'notes': 'Notice of intention within 90 days of last work (owner-occupied residential: 60 days).',
    },
    'IA': {
        'preliminary_notice_days': None,
        'lien_filing_days': 90,
        'foreclosure_days': 730,
        'notes': 'Post via MNLR within 90 days of last furnishing for full priority. Residential requires early MNLR notices.',
    },
    'KS': {
        'preliminary_notice_days': None,
        'lien_filing_days': 120,
        'foreclosure_days': 365,
        'notes': 'File lien statement within 4 months of last furnishing (subs: 3 months + residential warning statement).',
    },
    'KY': {
        'preliminary_notice_days': None,
        'lien_filing_days': 180,
        'foreclosure_days': 365,
        'notes': 'File within 6 months of last work. Owner-occupied residential: written notice within 75 days.',
    },
    'LA': {
        'preliminary_notice_days': None,
        'lien_filing_days': 60,
        'foreclosure_days': 365,
        'notes': 'Statement of claim within 60 days after notice of termination or substantial completion (some residential sub claims: 70 days).',
    },
    'ME': {
        'preliminary_notice_days': None,
        'lien_filing_days': 90,
        'foreclosure_days': 120,
        'notes': 'File within 90 days of last furnishing; enforce within 120 days of last furnishing.',
    },
    'MA': {
        'preliminary_notice_days': None,
        'lien_filing_days': 90,
        'foreclosure_days': 90,
        'notes': 'Record notice of contract within 90 days of last furnishing; statement of account within 120 days. Strict statutory sequence.',
    },
    'MN': {
        'preliminary_notice_days': 45,
        'lien_filing_days': 120,
        'foreclosure_days': 365,
        'notes': 'Pre-lien notice within 45 days. File within 120 days of last furnishing.',
    },
    'MS': {
        'preliminary_notice_days': None,
        'lien_filing_days': 90,
        'foreclosure_days': 180,
        'notes': 'Claim of lien within 90 days of last work; subs/suppliers must have given pre-lien notice.',
    },
    'MO': {
        'preliminary_notice_days': None,
        'lien_filing_days': 180,
        'foreclosure_days': 180,
        'notes': 'File within 6 months of last work. Residential: consent-of-owner notice; subs give 10-day notice of intent.',
    },
    'MT': {
        'preliminary_notice_days': 20,
        'lien_filing_days': 90,
        'foreclosure_days': 730,
        'notes': 'Residential subs/suppliers: notice of right to claim within 20 days of first furnishing. File within 90 days.',
    },
    'NE': {
        'preliminary_notice_days': None,
        'lien_filing_days': 120,
        'foreclosure_days': 730,
        'notes': 'Record within 120 days of last furnishing. Residential protected-party rules limit lien amount.',
    },
    'NV': {
        'preliminary_notice_days': None,
        'lien_filing_days': 90,
        'foreclosure_days': 180,
        'notes': 'Record within 90 days after completion/last furnishing. Subs/suppliers: notice of right to lien required.',
    },
    'NH': {
        'preliminary_notice_days': None,
        'lien_filing_days': 120,
        'foreclosure_days': 120,
        'notes': 'Lien secured by court attachment within 120 days of last furnishing.',
    },
    'NM': {
        'preliminary_notice_days': None,
        'lien_filing_days': 120,
        'foreclosure_days': 730,
        'notes': 'Original contractors: file within 120 days of completion (subs/suppliers: 90 days + residential pre-lien notice).',
    },
    'ND': {
        'preliminary_notice_days': None,
        'lien_filing_days': 90,
        'foreclosure_days': 1095,
        'notes': 'Record within 90 days of last furnishing for full priority; serve 10-day notice of intent first.',
    },
    'OK': {
        'preliminary_notice_days': None,
        'lien_filing_days': 120,
        'foreclosure_days': 365,
        'notes': 'Original contractors: file within 4 months of last furnishing (subs: 90 days; >$10K claims need pre-lien notice).',
    },
    'OR': {
        'preliminary_notice_days': 8,
        'lien_filing_days': 75,
        'foreclosure_days': 120,
        'notes': 'Record within 75 days of last furnishing or completion, whichever first. Residential subs: 8-day notice of right to lien.',
    },
    'RI': {
        'preliminary_notice_days': None,
        'lien_filing_days': 200,
        'foreclosure_days': 40,
        'notes': 'Notice of intention within 200 days of doing work; enforce within 40 days after.',
    },
    'SC': {
        'preliminary_notice_days': None,
        'lien_filing_days': 90,
        'foreclosure_days': 180,
        'notes': 'File and serve within 90 days of last furnishing; enforce within 6 months.',
    },
    'SD': {
        'preliminary_notice_days': None,
        'lien_filing_days': 120,
        'foreclosure_days': 730,
        'notes': 'File lien statement within 120 days of last furnishing. Owner demand can compel suit in 30 days.',
    },
    'TN': {
        'preliminary_notice_days': None,
        'lien_filing_days': 90,
        'foreclosure_days': 365,
        'notes': 'Record within 90 days of completion for priority; subs serve monthly notices of nonpayment + 90-day notice of lien.',
    },
    'UT': {
        'preliminary_notice_days': 20,
        'lien_filing_days': 180,
        'foreclosure_days': 180,
        'notes': 'Preliminary notice via State Construction Registry within 20 days of starting. Notice of lien within 180 days of completion.',
    },
    'VT': {
        'preliminary_notice_days': None,
        'lien_filing_days': 180,
        'foreclosure_days': 180,
        'notes': 'Record memorandum of lien within 180 days of when payment became due for last work.',
    },
    'WA': {
        'preliminary_notice_days': 10,
        'lien_filing_days': 90,
        'foreclosure_days': 240,
        'notes': 'Record within 90 days of last furnishing; suppliers/subs give pre-claim notice (60/10-day rules). Enforce within 8 months.',
    },
    'WV': {
        'preliminary_notice_days': None,
        'lien_filing_days': 100,
        'foreclosure_days': 180,
        'notes': 'Record within 100 days of last furnishing (all tiers); serve owner within same window.',
    },
    'WI': {
        'preliminary_notice_days': 10,
        'lien_filing_days': 180,
        'foreclosure_days': 730,
        'notes': 'Residential primes: 2 statutory notices. Record within 6 months of last work; serve notice of intent ≥30 days before.',
    },
    'WY': {
        'preliminary_notice_days': 20,
        'lien_filing_days': 150,
        'foreclosure_days': 180,
        'notes': 'Contractors: record within 150 days of last work (subs/suppliers: 120). 20-day pre-lien notice + 10-day notice of intent.',
    },
}

_DEFAULT_LAW = {
    'preliminary_notice_days': None,
    'lien_filing_days': 90,
    'foreclosure_days': 180,
    'notes': 'Default rules applied — verify with a licensed attorney in your state.',
}

SUPPORTED_STATES = sorted(_LIEN_LAWS.keys())


def calculate_deadlines(
    state_code: str,
    project_start_date: datetime,
    last_furnishing_date: datetime,
) -> dict:
    """
    Calculate lien filing deadlines for a project.

    Returns a dict with all deadline dates, days-until counts, and disclaimers.
    """
    law = _LIEN_LAWS.get(state_code.upper(), _DEFAULT_LAW)
    used_default = state_code.upper() not in _LIEN_LAWS

    prelim_deadline: Optional[datetime] = None
    if law['preliminary_notice_days'] is not None:
        prelim_deadline = project_start_date + timedelta(days=law['preliminary_notice_days'])

    lien_deadline = last_furnishing_date + timedelta(days=law['lien_filing_days'])
    foreclosure_deadline = lien_deadline + timedelta(days=law['foreclosure_days'])

    now = datetime.now(timezone.utc)
    days_to_lien = (lien_deadline - now).days
    days_to_foreclose = (foreclosure_deadline - now).days

    return {
        'state_code': state_code.upper(),
        'preliminary_notice_deadline': prelim_deadline.isoformat() if prelim_deadline else None,
        'lien_filing_deadline': lien_deadline.isoformat(),
        'foreclosure_deadline': foreclosure_deadline.isoformat(),
        'days_until_lien_deadline': days_to_lien,
        'days_until_foreclosure_deadline': days_to_foreclose,
        'state_notes': law['notes'],
        'used_default_rules': used_default,
        'disclaimer': 'Verify all deadlines with a licensed attorney — laws change.',
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
                (LienCalendarEntry.lien_filing_deadline <= cutoff)
                | (LienCalendarEntry.preliminary_notice_deadline <= cutoff)
            )
            .order_by(LienCalendarEntry.lien_filing_deadline.asc())
            .all()
        )

        results = []
        for e in entries:
            lien_days = (e.lien_filing_deadline - now).days if e.lien_filing_deadline else None
            prelim_days = (
                (e.preliminary_notice_deadline - now).days
                if e.preliminary_notice_deadline
                else None
            )
            results.append({
                'id': e.id,
                'customer_name': e.customer_name,
                'project_address': e.project_address,
                'state_code': e.state_code,
                'lien_filing_deadline': e.lien_filing_deadline.isoformat() if e.lien_filing_deadline else None,
                'preliminary_notice_deadline': (
                    e.preliminary_notice_deadline.isoformat() if e.preliminary_notice_deadline else None
                ),
                'foreclosure_deadline': e.foreclosure_deadline.isoformat() if e.foreclosure_deadline else None,
                'days_until_lien': lien_days,
                'days_until_prelim': prelim_days,
                'notes': e.notes,
                'is_urgent': (lien_days is not None and lien_days <= 7)
                or (prelim_days is not None and prelim_days <= 7),
            })

        return results
    except Exception as exc:
        logger.error('get_upcoming_deadlines error: %s', exc)
        return []
