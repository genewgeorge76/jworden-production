"""
kickserv_customers.py — preserve the customer base itself.

WHY THIS EXISTS, AND WHY IT IS NOT kickserv_import.py
─────────────────────────────────────────────────────
`kickserv_import.py` reads the same archive and says, in its own header, that
it deliberately does NOT read customers.csv. That decision was right and it
stands: that module answers "did work happen at this place?", and for that
question a private homeowner's name and phone number are not evidence of
anything. Reading them there would have put 2,263 people's details into a
pipeline whose output feeds public pages.

This module answers a different question — "who are this company's customers?"
— and the answer is an asset the business owns and is about to lose. Kickserv
is the system the company ran on from March 2013. When that account lapses,
2,263 customer records, 683 named contacts and eleven years of who-called-whom
go with it. Nothing else in this repository holds them.

So: same file, opposite purpose, and the boundary between the two purposes is
enforced rather than trusted.

THE BOUNDARY
────────────
What this module produces is CRM data. It is for the operator's own cockpit —
looking a customer up, calling them back, seeing what was done for them last
time. It is NOT page content, and the difference is not a matter of taste:

    PUBLISHABLE     a town. a commercial client's business name, where the
                    client is a company and the work is evidenced.
    NEVER PUBLISHED a person's name, street address, phone, or email.

`tests/backend/test_kickserv_customers.py` asserts that no value this module
emits for a residential customer appears in any built page, and the API
boundary that governs who may read these rows at all is already covered by
`test_crm_pii_boundary.py`. Preservation and publication are different acts.

WHAT THE COLUMNS ACTUALLY SAY
─────────────────────────────
Three of them are easy to read wrong, and each one was checked against the
file rather than assumed:

  `company`       The software's own commercial/residential boolean. 478 true,
                  1,785 false. This is the field to trust — NOT `company_name`,
                  which Kickserv fills for everybody, a private homeowner's row
                  included, and which therefore classifies the entire book as
                  commercial if you believe it.

  `opt_out_reason` Not a marketing consent withdrawal. All 177 values are SMS
                  deliverability failures — "Invalid number" (159), "Landline
                  or unreachable carrier" (10), "Destination number unknown"
                  (8). Recording these as opt-outs would silently mark 177
                  reachable customers as having refused contact. They are
                  preserved as what they are: a bad mobile number.

  `service_city`  Frequently carries the state jammed onto the end — "Richmond
                  va", "henrico virginia". Split rather than left alone,
                  because a city column that sometimes contains a state is
                  worthless for the lookup this exists to serve.

WHAT IS NOT DERIVED HERE
────────────────────────
No revenue figure that the archive does not support. `kickserv_import.py`
established that summing every charge line gives $41,295,234.93 and that this
is the wrong number — 66 jobs are lost bids and 1,333 carry no completion date
at all. The same restraint applies per customer: `completed_revenue_cents`
counts only jobs Kickserv itself marked completed, which undercounts real work
whose box was never ticked. It is a floor, it is labelled a floor, and no
default is applied to flatter it.
"""

import csv
import io
import re
import zipfile
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from typing import Any, Optional

CUSTOMERS = "customers.csv"
CONTACTS = "contacts.csv"
JOBS = "jobs.csv"

LOST = "lost"

#: Two-letter codes, and the long forms that appear in the same column.
#: 'VA' (1,544), 'VIRGINIA' (161), 'VA - VIRGINIA' (7) and 'VA.' (6) are all
#: one state; treating them as four is how a state filter loses a sixth of the
#: home market.
_STATE_NAMES = {
    "ALABAMA": "AL", "ALASKA": "AK", "ARIZONA": "AZ", "ARKANSAS": "AR",
    "CALIFORNIA": "CA", "COLORADO": "CO", "CONNECTICUT": "CT", "DELAWARE": "DE",
    "FLORIDA": "FL", "GEORGIA": "GA", "HAWAII": "HI", "IDAHO": "ID",
    "ILLINOIS": "IL", "INDIANA": "IN", "IOWA": "IA", "KANSAS": "KS",
    "KENTUCKY": "KY", "LOUISIANA": "LA", "MAINE": "ME", "MARYLAND": "MD",
    "MASSACHUSETTS": "MA", "MICHIGAN": "MI", "MINNESOTA": "MN",
    "MISSISSIPPI": "MS", "MISSOURI": "MO", "MONTANA": "MT", "NEBRASKA": "NE",
    "NEVADA": "NV", "NEW HAMPSHIRE": "NH", "NEW JERSEY": "NJ",
    "NEW MEXICO": "NM", "NEW YORK": "NY", "NORTH CAROLINA": "NC",
    "NORTH DAKOTA": "ND", "OHIO": "OH", "OKLAHOMA": "OK", "OREGON": "OR",
    "PENNSYLVANIA": "PA", "RHODE ISLAND": "RI", "SOUTH CAROLINA": "SC",
    "SOUTH DAKOTA": "SD", "TENNESSEE": "TN", "TEXAS": "TX", "UTAH": "UT",
    "VERMONT": "VT", "VIRGINIA": "VA", "WASHINGTON": "WA",
    "WEST VIRGINIA": "WV", "WISCONSIN": "WI", "WYOMING": "WY",
    "DISTRICT OF COLUMBIA": "DC",
}
STATE_CODES = frozenset(_STATE_NAMES.values())

#: Franchise brands, matched only where the brand actually appears in the
#: customer's own name. Nothing is inferred from a store number alone.
_BRANDS = ("KFC", "Taco Bell", "Burger King", "Rite Aid", "Long John Silver")


def normalize_state(value: Any) -> Optional[str]:
    """A two-letter code, or None. Never a guess at an unrecognised string."""
    text = re.sub(r"[^A-Za-z ]", " ", str(value or "")).strip().upper()
    if not text:
        return None
    # "VA - VIRGINIA" arrives here as "VA   VIRGINIA": take whichever half
    # resolves, preferring the explicit code.
    parts = [p for p in text.split() if p]
    for part in parts:
        if part in STATE_CODES:
            return part
    for length in (3, 2, 1):
        for start in range(len(parts) - length + 1):
            candidate = " ".join(parts[start : start + length])
            if candidate in _STATE_NAMES:
                return _STATE_NAMES[candidate]
    return None


def normalize_city(value: Any, state: Optional[str] = None) -> Optional[str]:
    """
    The town, with a trailing state token removed.

    "Richmond va" is one city and one state in one cell. Left alone it becomes
    a distinct city from "Richmond", and the operator looking up his Richmond
    customers finds two thirds of them.
    """
    text = re.sub(r"\s+", " ", str(value or "").strip())
    if not text:
        return None
    tokens = text.replace(",", " ").split()
    # Only a trailing STATE token comes off, and only the shortest one that
    # resolves. Matching greedily strips "North Chesterfield VA" down to
    # "North", because "Chesterfield VA" also contains a state.
    for width in (1, 2):
        if len(tokens) <= width:
            break
        tail = normalize_state(" ".join(tokens[-width:]))
        if tail and (state is None or tail == state):
            tokens = tokens[:-width]
            break
    text = " ".join(tokens).strip(" ,.")
    if not text:
        return None
    return text.title() if text.isupper() or text.islower() else text


def normalize_phone(value: Any) -> Optional[str]:
    """Digits only, and only when there are enough of them to be a number."""
    digits = re.sub(r"\D", "", str(value or ""))
    if len(digits) == 11 and digits.startswith("1"):
        digits = digits[1:]
    return digits if len(digits) == 10 else None


def normalize_email(value: Any) -> Optional[str]:
    text = str(value or "").strip().lower()
    return text if "@" in text and "." in text.split("@")[-1] else None


def to_cents(value: Any) -> int:
    try:
        return int((Decimal(str(value or "0")) * 100).to_integral_value())
    except (InvalidOperation, ValueError):
        return 0


def _date(value: Any) -> Optional[datetime]:
    text = str(value or "").strip()
    if not text:
        return None
    for fmt in ("%Y-%m-%d %H:%M:%S %z", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            width = len(fmt) + 6 if "%z" in fmt else len(text)
            parsed = datetime.strptime(text[:width], fmt)
            return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return None


def is_business(customer: dict) -> bool:
    """The software's own boolean. See the header on why not `company_name`."""
    return str(customer.get("company") or "").strip().lower() == "true"


def brand_in(name: Any) -> Optional[str]:
    text = str(name or "")
    for brand in _BRANDS:
        if re.search(rf"\b{re.escape(brand)}\b", text, re.IGNORECASE):
            return brand
    return None


def _rows(archive: zipfile.ZipFile, name: str) -> list[dict]:
    if name not in archive.namelist():
        return []
    with archive.open(name) as handle:
        return list(csv.DictReader(io.TextIOWrapper(handle, encoding="utf-8", errors="replace")))


def _job_rollup(jobs: list[dict]) -> dict[str, dict]:
    """
    Per customer: how many jobs, how many completed, and the completed value.

    Completed only. A job with no completion date may well have been done —
    the owner's account is that plenty were finished and never closed out — but
    this module cannot tell those from estimates that went nowhere, so it
    counts what the file states and calls the result a floor.
    """
    rollup: dict[str, dict] = {}
    for job in jobs:
        customer_id = (job.get("customer_id") or "").strip()
        if not customer_id:
            continue
        entry = rollup.setdefault(
            customer_id,
            {"jobs": 0, "lost": 0, "completed": 0, "completed_cents": 0,
             "last_completed": None, "first_seen": None},
        )
        created = _date(job.get("created_at"))
        if created and (entry["first_seen"] is None or created < entry["first_seen"]):
            entry["first_seen"] = created

        if (job.get("estimate_type") or "").strip().lower() == LOST:
            entry["lost"] += 1
            continue

        entry["jobs"] += 1
        completed = _date(job.get("completed_on"))
        if completed:
            entry["completed"] += 1
            entry["completed_cents"] += to_cents(job.get("total"))
            if entry["last_completed"] is None or completed > entry["last_completed"]:
                entry["last_completed"] = completed
    return rollup


def _contacts_by_customer(contacts: list[dict]) -> dict[str, list[dict]]:
    grouped: dict[str, list[dict]] = {}
    for contact in contacts:
        customer_id = (contact.get("customer_id") or "").strip()
        if not customer_id or contact.get("deleted_at"):
            continue
        name = " ".join(
            p for p in ((contact.get("first_name") or "").strip(),
                        (contact.get("last_name") or "").strip()) if p
        )
        record = {
            "name": name or None,
            "title": (contact.get("title") or "").strip() or None,
            "phone": normalize_phone(contact.get("phone1")) or normalize_phone(contact.get("phone2")),
            "email": normalize_email(contact.get("email1")) or normalize_email(contact.get("email2")),
            "is_primary": str(contact.get("is_primary") or "").strip().lower() == "true",
        }
        if any(record[k] for k in ("name", "phone", "email")):
            grouped.setdefault(customer_id, []).append(record)
    return grouped


def read_customers(path: str) -> dict[str, Any]:
    """
    The archive to a preserved customer register plus a summary of what is in it.

    Returns {"customers": [...], "summary": {...}}. Pure: opens the file, reads
    it, writes nothing. The database side lives in kickserv_customer_load.py
    for the same reason kickserv_load.py is separate from kickserv_import.py —
    reading is testable against a fixture, writing needs a session and a tenant.
    """
    with zipfile.ZipFile(path) as archive:
        raw = _rows(archive, CUSTOMERS)
        contacts = _contacts_by_customer(_rows(archive, CONTACTS))
        rollup = _job_rollup(_rows(archive, JOBS))

    records: list[dict] = []
    summary = {
        "total": 0, "commercial": 0, "residential": 0, "franchise": 0,
        "with_email": 0, "with_phone": 0, "with_address": 0,
        "with_coordinates": 0, "with_completed_job": 0,
        "sms_unreachable": 0, "states": {},
    }

    for row in raw:
        customer_id = (row.get("id") or "").strip()
        name = (row.get("name") or "").strip()
        if not customer_id or not name:
            continue
        if row.get("deleted_at"):
            continue

        state = normalize_state(row.get("service_state")) or normalize_state(row.get("billing_state"))
        city = normalize_city(row.get("service_city"), state) or normalize_city(row.get("billing_city"), state)
        business = is_business(row)
        stats = rollup.get(customer_id, {})

        try:
            lat = float(row.get("latitude") or row.get("street_latitude") or "")
            lon = float(row.get("longitude") or row.get("street_longitude") or "")
            if not (-90 <= lat <= 90 and -180 <= lon <= 180):
                lat = lon = None
        except (TypeError, ValueError):
            lat = lon = None

        last_completed = stats.get("last_completed")
        first_seen = stats.get("first_seen") or _date(row.get("created_at"))
        record = {
            "external_id": f"kickserv:customer:{customer_id}",
            "customer_number": (row.get("customer_number") or "").strip() or None,
            "name": name,
            "is_business": business,
            "customer_type": "commercial" if business else "residential",
            "brand": brand_in(name),
            "email": normalize_email(row.get("email_address")) or normalize_email(row.get("email")),
            "phone": normalize_phone(row.get("phone_number")),
            "mobile": normalize_phone(row.get("mobile")),
            "address": (row.get("service_address") or "").strip() or None,
            "city": city,
            "state": state,
            "zip": (row.get("service_zip_code") or "").strip()[:10] or None,
            "latitude": lat,
            "longitude": lon,
            # See the header: these are SMS delivery failures, not consent
            # withdrawals. Named for what they are so nobody reads them as a
            # do-not-contact flag.
            "sms_unreachable": (row.get("opt_out_reason") or "").strip() or None,
            "jobs": stats.get("jobs", 0),
            "lost_bids": stats.get("lost", 0),
            "completed_jobs": stats.get("completed", 0),
            # A FLOOR. Completed jobs only — see the header.
            "completed_revenue_cents": stats.get("completed_cents", 0),
            "last_completed_on": last_completed.date().isoformat() if last_completed else None,
            "first_seen_on": first_seen.date().isoformat() if first_seen else None,
            "contacts": contacts.get(customer_id, []),
        }
        records.append(record)

        summary["total"] += 1
        summary["commercial" if business else "residential"] += 1
        if record["brand"]:
            summary["franchise"] += 1
        if record["email"]:
            summary["with_email"] += 1
        if record["phone"] or record["mobile"]:
            summary["with_phone"] += 1
        if record["address"]:
            summary["with_address"] += 1
        if record["latitude"] is not None:
            summary["with_coordinates"] += 1
        if record["completed_jobs"]:
            summary["with_completed_job"] += 1
        if record["sms_unreachable"]:
            summary["sms_unreachable"] += 1
        if state:
            summary["states"][state] = summary["states"].get(state, 0) + 1

    records.sort(key=lambda r: int(r["customer_number"] or 0))
    summary["states"] = dict(sorted(summary["states"].items(), key=lambda kv: (-kv[1], kv[0])))
    return {"customers": records, "summary": summary}
