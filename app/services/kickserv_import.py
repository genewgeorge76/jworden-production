"""
kickserv_import.py — read the export of the system the business actually ran on.

WHAT IS IN IT
─────────────
2,610 jobs from April 2013, 2,419 charge lines, 2,263 customers, 424 payments.
This is not a spreadsheet somebody kept alongside the work; it is the job book.

WHAT THE TOTAL MEANS, AND WHAT IT DOES NOT
──────────────────────────────────────────
Summing every charge line gives $41,295,234.93. That number is real arithmetic
over real rows and it is the wrong number to publish, for two reasons the file
states itself:

  * 66 jobs carry estimate_type "lost" — $162,675.37 of work that was bid and
    not won. Counting a lost bid as revenue is not an overstatement, it is a
    different thing entirely.
  * 1,333 jobs have no completed_on date at all — $27.9M of it. Some were
    certainly performed (the KFC new builds among them) and simply never had
    the box ticked; others are estimates that went nowhere. The file cannot
    tell those apart, so neither can this.

What the file DOES support is 1,135 jobs carrying a completion date, worth
$12,967,927.18. That is a floor and not a ceiling — it undercounts real work
whose box was never ticked — and a floor with a document behind it is worth
more than a ceiling with an argument behind it.

Charge lines reconcile: quantity x price equals total on every one of the
2,419, and their sum per job equals that job's own subtotal. Job #2491 is a
ground-up build broken into eleven CSI divisions — site work, pavement,
masonry, openings, plumbing and HVAC, electrical, roofing, landscaping,
mobilization, overhead and profit — totalling $2,945,607.60. Those are not
duplicated draws; they are one contract, itemised.

WHAT IS DELIBERATELY NOT IMPORTED
─────────────────────────────────
customers.csv holds 2,263 names, addresses and phone numbers, most of them
private individuals at their home addresses. None of it is needed to evidence
that work happened at a place, so none of it is read here. A commercial
customer's business name is taken where a job needs a client; a residential
customer contributes a town and nothing else.
"""

import csv
import io
import logging
import zipfile
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from typing import Any, Optional

from . import job_ledger

logger = logging.getLogger(__name__)

# The files this reads. Everything else in the export — login_log_entries,
# task_assignments, employees — is operational history with no bearing on
# whether work happened at a place.
JOBS = "jobs.csv"
CHARGES = "job_charges.csv"
CUSTOMERS = "customers.csv"
PAYMENTS = "payments.csv"

LOST = "lost"


def _decimal(value: Any) -> Decimal:
    try:
        return Decimal(str(value or "0"))
    except (InvalidOperation, ValueError):
        return Decimal("0")


def to_cents(value: Any) -> Optional[int]:
    amount = _decimal(value)
    return int((amount * 100).to_integral_value())


def _date(value: Any) -> Optional[datetime]:
    text = str(value or "").strip()
    if not text:
        return None
    # "2013-04-10 10:26:01 -0400" and "2013-04-25" both appear in one column.
    for fmt in ("%Y-%m-%d %H:%M:%S %z", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            parsed = datetime.strptime(text[: len(fmt) + 6 if "%z" in fmt else len(text)], fmt)
            return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return None


def _rows(archive: zipfile.ZipFile, name: str) -> list[dict]:
    if name not in archive.namelist():
        return []
    with archive.open(name) as handle:
        text = io.TextIOWrapper(handle, encoding="utf-8", errors="replace")
        return list(csv.DictReader(text))


def is_business(customer: dict) -> bool:
    """
    Commercial or residential, from the column that actually says so.

    NOT company_name. Kickserv fills that for everybody — a private homeowner's
    row carries their own name in it — so testing it classified all 2,610 jobs
    as residential and would have hidden every commercial job in the archive
    behind the residential privacy rule. `company` is the boolean the software
    itself uses.
    """
    return str(customer.get("company") or "").strip().lower() == "true"


def _coordinates(customer: dict) -> tuple:
    """
    The coordinates Kickserv already geocoded, where it has them.

    804 of the 2,263 customers carry a latitude and longitude, and 472 carry a
    Google place_id as well. That is a real, already-paid-for geocode of the
    operator's own customer base — the pin data, without a single API call.
    """
    try:
        lat = float(customer.get("latitude") or customer.get("street_latitude") or "")
        lon = float(customer.get("longitude") or customer.get("street_longitude") or "")
    except (TypeError, ValueError):
        return (None, None)
    if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lon <= 180.0):
        return (None, None)
    return (lat, lon)


def grade_for(job: dict, charge_total_cents: int) -> str:
    """
    What this job's own row establishes.

    A completion date is the strongest thing Kickserv records: somebody marked
    the work done on a date. It is not an invoice, and this system's own rule
    is that a completion record and an invoice are equally good evidence that
    work happened — so a completed job grades `completed`.

    A job explicitly marked lost grades `requested`: it is work that was asked
    about and never performed, which is exactly what that grade means.
    """
    if (job.get("estimate_type") or "").strip().lower() == LOST:
        return job_ledger.REQUESTED
    if job.get("completed_on"):
        return job_ledger.COMPLETED
    if charge_total_cents:
        # Priced but never marked done. Our own number, not their acceptance.
        return job_ledger.QUOTED
    return job_ledger.LISTED


def read_export(path: str, *, tenant_hint: Optional[str] = None) -> dict[str, Any]:
    """
    A Kickserv export archive to ledger records and a summary of what is in it.
    """
    with zipfile.ZipFile(path) as archive:
        jobs = _rows(archive, JOBS)
        charges = _rows(archive, CHARGES)
        customers = {c["id"]: c for c in _rows(archive, CUSTOMERS) if c.get("id")}
        payments = _rows(archive, PAYMENTS)

    charge_cents: dict[str, int] = {}
    scope_lines: dict[str, list[str]] = {}
    for charge in charges:
        job_id = charge.get("job_id") or ""
        charge_cents[job_id] = charge_cents.get(job_id, 0) + (to_cents(charge.get("total")) or 0)
        description = (charge.get("description") or "").strip()
        detail = (charge.get("details") or "").strip()
        line = detail or description
        if line:
            scope_lines.setdefault(job_id, []).append(line)

    paid_cents: dict[str, int] = {}
    for payment in payments:
        if payment.get("deleted_at"):
            continue
        customer_id = payment.get("customer_id") or ""
        paid_cents[customer_id] = paid_cents.get(customer_id, 0) + (to_cents(payment.get("amount")) or 0)

    records: list[dict] = []
    counts = {"lost": 0, "completed": 0, "priced_not_completed": 0, "bare": 0,
              "commercial": 0, "residential": 0, "with_coordinates": 0}
    completed_cents = 0
    all_cents = 0
    lost_cents = 0

    for job in jobs:
        job_id = job.get("id") or ""
        # The import key. It has to be None, not "kickserv:job:", when the job
        # carries no number: an f-string over a blank job_number yields a
        # truthy key that EVERY unnumbered job shares, so the first one gets
        # written and each one after it silently merges onto that same row.
        # Callers key their upserts on this, so an empty key loses jobs.
        job_number = (job.get("job_number") or "").strip()
        job_key = f"kickserv:job:{job_number}" if job_number else None
        total_cents = to_cents(job.get("total")) or charge_cents.get(job_id, 0)
        all_cents += total_cents
        grade = grade_for(job, charge_cents.get(job_id, 0))

        if grade == job_ledger.REQUESTED:
            counts["lost"] += 1
            lost_cents += total_cents
        elif grade == job_ledger.COMPLETED:
            counts["completed"] += 1
            completed_cents += total_cents
        elif grade == job_ledger.QUOTED:
            counts["priced_not_completed"] += 1
        else:
            counts["bare"] += 1

        customer = customers.get(job.get("customer_id") or "", {})
        commercial = is_business(customer)
        residential = not commercial
        business = (customer.get("company_name") or customer.get("name") or "").strip()
        latitude, longitude = _coordinates(customer)

        counts["commercial" if commercial else "residential"] += 1
        if commercial and latitude is not None:
            counts["with_coordinates"] += 1

        records.append(
            {
                "store_number": None,
                "client": (business or None) if commercial else None,
                "program": None,
                # Kickserv's own word for the work, which is a real scope
                # statement: "residential paving", "parking lot rehab".
                "category": "residential" if residential else "commercial",
                # A residential job never carries its street. A homeowner who
                # hired a paving crew did not agree to a public address.
                "address": None if residential else (customer.get("service_address") or "").strip() or None,
                "city": (customer.get("service_city") or "").strip() or None,
                "state": (customer.get("service_state") or "").strip().upper() or None,
                "postal_code": None if residential else (customer.get("service_zip_code") or "").strip() or None,
                # A residential job gets no coordinate either. A pin on a house
                # is the address by another name.
                "latitude": None if residential else latitude,
                "longitude": None if residential else longitude,
                "invoice_number": job_number or None,
                "date_submitted": None,
                "invoice_amount_cents": total_cents or None,
                "job_total_cents": total_cents or None,
                "amount_paid_cents": None,
                "paid_date": None,
                "check_number": None,
                "job_status": (job.get("estimate_type") or "").strip() or None,
                "completed_on": _date(job.get("completed_on")),
                "scope": "; ".join(dict.fromkeys(scope_lines.get(job_id, [])))[:2000] or None,
                "scope_source": job_key,
                "role": None,
                "role_source": None,
                "source_document": job_key,
                "outstanding_issues": None,
                "notes": (job.get("name") or "").strip() or None,
                "evidence": grade,
            }
        )

    return {
        "ok": True,
        "jobs": len(jobs),
        "charge_lines": len(charges),
        "customers": len(customers),
        "payments": len(payments),
        "counts": counts,
        # Reported apart, never as one figure. The completed total is the one
        # with a document behind it.
        "completed_value": job_ledger.to_dollars(completed_cents),
        "lost_value": job_ledger.to_dollars(lost_cents),
        "all_jobs_value": job_ledger.to_dollars(all_cents),
        "records": records,
        "note": (
            "The completed figure is a floor. Jobs whose completion box was "
            "never ticked are excluded from it even where the work is known to "
            "have happened."
        ),
    }
