"""
job_ledger.py — what was agreed, billed and paid, graded by how well it is
evidenced.

WHY THIS SITS BESIDE THE PHOTO ARCHIVE RATHER THAN INSIDE IT
────────────────────────────────────────────────────────────
photo_archive answers "where was a camera". This answers "what does the
paperwork say". The second is the stronger record and the two are keyed
differently: photographs cluster on coordinates, paperwork keys on the client's
own store number. A KFC parking lot in Harlingen is proved by an invoice to KBP
Foods carrying G135211, the address and the amount; a GPS fix only proves
somebody stood there.

The store number is the spine. KBP's G-numbers appear on the programme
spreadsheets, on the punch lists, on the invoices and in the mail thread — the
one identifier that joins all four, and the client's identifier rather than
ours, so it does not drift.

THE GRADE IS THE WHOLE POINT
────────────────────────────
A row on a programme spreadsheet is a site somebody put on a list. It is not
proof the work happened. Of the 28 Texas parking lots on Project Red, 11 carry
an invoice date or amount and 17 carry an address and nothing else. The roof tab
adds 30 more, none of them invoiced — so the workbook holds 58 sites of which 11
are evidenced, and a naive import produces 58 "completed jobs" with nothing
behind 47 of them.

A punch list is worse, because it reads like a job list and means the reverse.
"Riverdale G135101 — 15 parking blocks need replacing" is work REQUESTED. Import
it as work performed and a genuine document has manufactured a false claim.

So nothing is graded by where it came from being convenient. It is graded by
what the document actually establishes, and only INVOICED may be published.
"""

import logging
import re
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from typing import Any, Optional

logger = logging.getLogger(__name__)

# Ordered weakest to strongest. Comparisons use the index, so a re-import can
# upgrade a listed site to an invoiced one and can never silently downgrade it.
EVIDENCE_ORDER = ("requested", "listed", "authorized", "invoiced")

REQUESTED = "requested"
LISTED = "listed"
AUTHORIZED = "authorized"
INVOICED = "invoiced"

# The single rule everything else exists to serve.
PUBLISHABLE = frozenset({INVOICED})

EVIDENCE_MEANING = {
    REQUESTED: "On a punch list. Work the client asked for — explicitly not work performed.",
    LISTED: "An address on a programme list. A site, not a job.",
    AUTHORIZED: "A signed authorization to proceed, up to an amount. Agreed, not yet finished.",
    INVOICED: "An invoice number, submitted date or amount. Work that was billed.",
}

# KBP's store identifiers: a G and six digits. Matched with a boundary so a
# longer code is not silently truncated into a valid-looking one.
_STORE_NUMBER = re.compile(r"\b(G\d{6})\b", re.IGNORECASE)


def rank(evidence: str) -> int:
    try:
        return EVIDENCE_ORDER.index(evidence)
    except ValueError:
        return -1


def is_publishable(evidence: str) -> bool:
    return evidence in PUBLISHABLE


def store_numbers_in(text: str) -> list[str]:
    """Every store number in a block of free text, uppercased and deduplicated."""
    seen: dict[str, None] = {}
    for match in _STORE_NUMBER.finditer(text or ""):
        seen.setdefault(match.group(1).upper(), None)
    return list(seen)


def to_cents(value: Any) -> Optional[int]:
    """
    A money column to whole cents, or None.

    Through Decimal rather than float. `int(24336.0 * 100)` is 2433600 today and
    a cent short on some other value, and a total that disagrees with the
    invoice is worse than no total at all on a page that exists to be trusted.
    """
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        return None
    text = str(value).strip().replace("$", "").replace(",", "")
    if not text:
        return None
    negative = text.startswith("(") and text.endswith(")")  # accounting negatives
    if negative:
        text = text[1:-1]
    try:
        amount = Decimal(text)
    except (InvalidOperation, ValueError):
        return None
    cents = int((amount * 100).to_integral_value())
    return -cents if negative else cents


def to_dollars(cents: Optional[int]) -> Optional[str]:
    """Cents back to a string for display, never to a float."""
    if cents is None:
        return None
    return f"{Decimal(cents) / 100:.2f}"


def _to_datetime(value: Any) -> Optional[datetime]:
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    text = str(value).strip()
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y"):
        try:
            return datetime.strptime(text, fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return None


def grade(
    *,
    invoice_number: Any = None,
    date_submitted: Any = None,
    invoice_amount_cents: Optional[int] = None,
    authorized: bool = False,
    from_punch_list: bool = False,
) -> str:
    """
    What this record's own contents establish.

    Deliberately not "where did the row come from". The Texas sheet holds both
    invoiced and merely-listed rows in the same table under the same heading;
    grading by source would mark all 28 invoiced and 19 of them would be a
    claim with nothing behind it.
    """
    if from_punch_list:
        # An entry on a punch list can never be evidence of completed work,
        # whatever else the row happens to carry. It is the request.
        return REQUESTED
    if invoice_number or date_submitted is not None or invoice_amount_cents:
        return INVOICED
    if authorized:
        return AUTHORIZED
    return LISTED


# ── Reading a programme spreadsheet ─────────────────────────────────────────

# The header row names vary between tabs ("Date Received" on the roof tab where
# the parking tab says "Total amount of job"), so columns are found by name
# rather than by position.
_COLUMNS = {
    "store_number": ("store #", "store number", "store"),
    "address": ("store address", "address"),
    "city": ("city",),
    "state": ("state",),
    "postal_code": ("zip", "zip code", "postal code"),
    "invoice_number": ("invoice #", "invoice number"),
    "date_submitted": ("date submitted", "date"),
    "invoice_amount": ("$ amount of invoice", "amount of invoice", "invoice amount"),
    "job_total": ("total amount of job", "job total"),
    "amount_paid": ("$ amount paid", "amount paid"),
    "outstanding_issues": ("outstanding issues", "issues", "notes"),
}


def _header_map(row: tuple) -> dict[str, int]:
    found: dict[str, int] = {}
    for index, cell in enumerate(row):
        label = str(cell or "").strip().lower()
        if not label:
            continue
        for field, names in _COLUMNS.items():
            if field not in found and label in names:
                found[field] = index
    return found


def _find_header(rows: list[tuple]) -> tuple[int, dict[str, int]]:
    """
    The header row and its column positions.

    Not assumed to be row 1: these sheets open with a title row
    ("Project Red | Category "Parking""), so a positional assumption reads the
    title as headers and every column comes back empty.
    """
    for index, row in enumerate(rows):
        mapping = _header_map(row)
        if "store_number" in mapping and "address" in mapping:
            return index, mapping
    return -1, {}


def read_program_sheet(
    rows: list[tuple],
    *,
    client: Optional[str] = None,
    program: Optional[str] = None,
    category: Optional[str] = None,
    source_document: Optional[str] = None,
) -> list[dict]:
    """
    A worksheet's rows to graded records.

    `rows` is whatever the caller got out of the file — this takes plain tuples
    so the parsing is testable without a spreadsheet library or a real file.
    """
    header_index, columns = _find_header(rows)
    if header_index < 0:
        return []

    def cell(row: tuple, field: str):
        index = columns.get(field)
        if index is None or index >= len(row):
            return None
        value = row[index]
        return value.strip() if isinstance(value, str) else value

    records: list[dict] = []
    for row in rows[header_index + 1:]:
        store = cell(row, "store_number")
        address = cell(row, "address")
        if not store and not address:
            continue

        invoice_cents = to_cents(cell(row, "invoice_amount"))
        submitted = _to_datetime(cell(row, "date_submitted"))
        invoice_number = cell(row, "invoice_number")

        records.append(
            {
                "store_number": str(store).strip().upper() if store else None,
                "client": client,
                "program": program,
                "category": category,
                "address": str(address) if address else None,
                "city": str(cell(row, "city")).strip() if cell(row, "city") else None,
                "state": str(cell(row, "state")).strip() if cell(row, "state") else None,
                "postal_code": str(cell(row, "postal_code")).strip()
                if cell(row, "postal_code") else None,
                "invoice_number": str(invoice_number) if invoice_number else None,
                "date_submitted": submitted,
                "invoice_amount_cents": invoice_cents,
                "job_total_cents": to_cents(cell(row, "job_total")),
                "amount_paid_cents": to_cents(cell(row, "amount_paid")),
                "outstanding_issues": str(cell(row, "outstanding_issues"))
                if cell(row, "outstanding_issues") else None,
                "source_document": source_document,
                "evidence": grade(
                    invoice_number=invoice_number,
                    date_submitted=submitted,
                    invoice_amount_cents=invoice_cents,
                ),
            }
        )
    return records


def read_punch_list(
    text: str,
    *,
    client: Optional[str] = None,
    source_document: Optional[str] = None,
) -> list[dict]:
    """
    A punch list to records graded REQUESTED, keyed by store number.

    Every line without a store number is dropped rather than guessed at. The
    lists name plenty of stores only by their local name — "Chamblee",
    "Sugarloaf", "Pleasant Hill" — and matching those to an address would mean
    inventing the link. A record that cannot be keyed is not a record.
    """
    records: list[dict] = []
    current: Optional[dict] = None

    for raw in (text or "").splitlines():
        line = raw.strip()
        if not line:
            continue
        found = store_numbers_in(line)
        if found:
            store = found[0]
            if current is None or current["store_number"] != store:
                current = {
                    "store_number": store,
                    "client": client,
                    "program": None,
                    "category": None,
                    "address": None,
                    "city": None,
                    "state": None,
                    "postal_code": None,
                    "invoice_number": None,
                    "date_submitted": None,
                    "invoice_amount_cents": None,
                    "job_total_cents": None,
                    "amount_paid_cents": None,
                    "outstanding_issues": "",
                    "source_document": source_document,
                    # from_punch_list wins over everything the line contains.
                    "evidence": grade(from_punch_list=True),
                }
                records.append(current)
            current["outstanding_issues"] = (
                current["outstanding_issues"] + ("\n" if current["outstanding_issues"] else "") + line
            )
        elif current is not None:
            # A continuation line under the store it follows.
            current["outstanding_issues"] += "\n" + line

    return records


def summarise(records: list[dict]) -> dict:
    """
    Counts and money by grade, so a caller can see at a glance how much of a
    document is actually evidence.

    Totals are per grade and never rolled into one figure. A single "total value
    of work" summing invoiced and listed rows is the exact number that would be
    wrong, and it is the number a dashboard reaches for first.
    """
    by_grade: dict[str, dict] = {}
    for record in records:
        bucket = by_grade.setdefault(
            record.get("evidence", LISTED),
            {"count": 0, "invoiced_cents": 0, "with_an_amount": 0},
        )
        bucket["count"] += 1
        cents = record.get("invoice_amount_cents")
        if cents:
            bucket["invoiced_cents"] += cents
            bucket["with_an_amount"] += 1

    for grade_name, bucket in by_grade.items():
        bucket["invoiced_dollars"] = to_dollars(bucket["invoiced_cents"])
        bucket["means"] = EVIDENCE_MEANING.get(grade_name, "")
        bucket["publishable"] = is_publishable(grade_name)

    return {
        "records": len(records),
        "publishable": sum(1 for r in records if is_publishable(r.get("evidence", LISTED))),
        "by_evidence": by_grade,
    }
