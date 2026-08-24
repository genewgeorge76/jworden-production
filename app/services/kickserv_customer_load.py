"""
kickserv_customer_load.py — put the preserved customer register into the CRM.

WHY THIS IS SEPARATE FROM kickserv_customers.py
───────────────────────────────────────────────
Same reason kickserv_load.py is separate from kickserv_import.py: reading is
pure and testable against a fixture archive; writing needs a session, a tenant
and an idempotency rule. Keeping them apart also means the register on disk is
the durable artefact and the database is a *copy* of it — so a rebuilt, restored
or lost database costs nothing. That ordering is the whole point. The customer
base is not preserved because it is in a database; it is preserved because it is
in a file, and the database is loaded from the file.

IDEMPOTENCY
───────────
`external_id = "kickserv:customer:<id>"` is unique inside one Kickserv account,
so `(tenant_id, external_id)` is the natural key. Re-running must not double the
book.

WHAT A RE-RUN MAY AND MAY NOT OVERWRITE
───────────────────────────────────────
Contact details refresh: an address or phone corrected in the export should win,
because the export is the system of record for those.

Anything the operator has since typed into the CRM himself does NOT get
clobbered. `notes` and `tags` are his, written after the fact, and a re-import
that wipes them destroys the only data in the row that the archive never had.
So they are filled when empty and left alone when not.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Optional

from app.models import Customer

logger = logging.getLogger(__name__)

#: Refreshed from the export on every run — the export is the record for these.
REFRESHABLE = (
    "name", "email", "phone", "company", "address", "city",
    "state_code", "zip_code", "customer_type", "is_franchise", "brand",
    "total_jobs", "total_revenue", "last_job_date",
)


def _as_datetime(value: Any) -> Optional[datetime]:
    text = str(value or "").strip()
    if not text:
        return None
    try:
        return datetime.strptime(text[:10], "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def _to_row(record: dict, tenant_id: str) -> dict[str, Any]:
    """One register record to Customer column values."""
    return {
        "external_id": record["external_id"],
        "source": "kickserv",
        "tenant_id": tenant_id,
        "name": (record.get("name") or "")[:120],
        "email": (record.get("email") or None),
        "phone": record.get("phone") or record.get("mobile") or None,
        # `company` on the model is the business name. Only a business has one:
        # for a residential row Kickserv's company_name is just the person's
        # own name again, and copying it here would state that a private
        # individual is a company.
        "company": (record["name"][:120] if record.get("is_business") else None),
        "address": (record.get("address") or None),
        "city": record.get("city") or None,
        "state_code": record.get("state") or None,
        "zip_code": record.get("zip") or None,
        "customer_type": "franchise" if record.get("brand") else record.get("customer_type"),
        "is_franchise": 1 if record.get("brand") else 0,
        "brand": record.get("brand") or None,
        "total_jobs": int(record.get("jobs") or 0),
        # A FLOOR, not a total. Completed jobs only — see kickserv_customers.py.
        "total_revenue": round((record.get("completed_revenue_cents") or 0) / 100.0, 2),
        # The column is a timestamp; the register holds a date. Parsed rather
        # than assigned as a string, because SQLite will happily store the
        # string and then hand back something that is not a datetime.
        "last_job_date": _as_datetime(record.get("last_completed_on")),
    }


def load_customers(
    session,
    records: list[dict],
    *,
    tenant_id: str = "default",
    dry_run: bool = False,
) -> dict[str, int]:
    """
    Upsert the register into `customers`. Returns counts, writes nothing on a
    dry run.
    """
    counts = {"read": len(records), "created": 0, "updated": 0, "unchanged": 0}

    existing: dict[str, Customer] = {}
    for row in session.query(Customer).filter(Customer.tenant_id == tenant_id).all():
        if row.external_id:
            existing[row.external_id] = row

    for record in records:
        values = _to_row(record, tenant_id)
        current: Optional[Customer] = existing.get(values["external_id"])

        if current is None:
            if not dry_run:
                session.add(Customer(**values))
            counts["created"] += 1
            continue

        changed = False
        for field in REFRESHABLE:
            new = values.get(field)
            if new is None:
                # Absent in the export is not "delete what is there". A blank
                # cell means Kickserv never held the value, not that the value
                # is now known to be empty.
                continue
            if getattr(current, field, None) != new:
                if not dry_run:
                    setattr(current, field, new)
                changed = True
        counts["updated" if changed else "unchanged"] += 1

    if not dry_run:
        session.commit()
    return counts
