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
EVIDENCE_ORDER = (
    "requested", "listed", "quoted", "authorized", "contracted", "completed", "invoiced",
)

REQUESTED = "requested"
LISTED = "listed"
QUOTED = "quoted"
AUTHORIZED = "authorized"
CONTRACTED = "contracted"
COMPLETED = "completed"
INVOICED = "invoiced"

# What may back a public claim of work performed.
#
# This was {invoiced} alone through several revisions, and widening it is a
# decision rather than a slip — the test that pins this set exists precisely to
# force the argument, so here it is.
#
# An invoice is a claim for payment. A completion email is a claim of
# performance: "KFC Hackettstown NJ Finished Pictures", sent from this company
# to the client's facilities director on a dated message, with the photographs
# attached, and never disputed. For the question a portfolio actually asks —
# was this work done — the second is at least as good as the first, and often
# better, because an invoice can be raised for work that was later disputed
# while nobody sends finished pictures of a job that does not exist.
#
# It also matters practically. The invoice tracker's NJ tab records two
# invoiced jobs; the mailbox shows nine New Jersey sites. Excluding completion
# emails does not make the portfolio more honest, it makes it wrong in the
# other direction — understating real work is still a false picture.
#
# `completed` is granted only where the subject line SAYS the work is finished.
# An email that merely names a site proves contact about it, grades `listed`,
# and waits for a person.
PUBLISHABLE = frozenset({COMPLETED, INVOICED})

EVIDENCE_MEANING = {
    REQUESTED: (
        "The client asked — a punch list, or a request to quote. Work wanted, "
        "explicitly not work performed and not yet even priced."
    ),
    LISTED: "An address on a programme list. A site, not a job.",
    QUOTED: "An estimate we issued. Our price for work at a named site — not proof they accepted it.",
    AUTHORIZED: "The client approved the work in writing. Agreed, not yet proof it was finished.",
    COMPLETED: (
        "A dated message to the client saying the work was finished, with the "
        "photographs. A contemporaneous claim of performance, not disputed."
    ),
    CONTRACTED: (
        "A formal contract naming a sum and a scope. The strongest record short of "
        "an invoice — and still not proof the work was completed."
    ),
    INVOICED: "An invoice number, submitted date or amount. Work that was billed.",
}

# KBP uses at least two store-numbering systems and both appear in the
# paperwork, so recognising only one silently loses half the archive:
#
#   G135211            the new-build / Project Red programme sheets
#   KFC (142)          the maintenance estimates — estimate #2228 names its
#                      service address as "KFC (142), 9300 Midlothian Turnpike"
#
# The G form is matched on a word boundary so a longer code is not truncated
# into a valid-looking one. The parenthesised form requires the brand word in
# front of it, because a bare "(142)" in a sentence is a number, not a store.
_STORE_NUMBER = re.compile(r"\b(G\d{6})\b", re.IGNORECASE)
# "KFC(369)" and "KFC (142)" — the parenthesised form, and "KFC #189",
# which is the same identifier written the way the crew wrote it in a
# subject line. Both appear in the KBP photo mail; only the first was
# recognised, so every #-form store number was silently dropped.
_BRAND_STORE_NUMBER = re.compile(
    r"\b(KFC|Taco\s*Bell|Rite\s*Aid)\s*(?:\(\s*(\d{1,5})\s*\)|#\s*(\d{1,5})\b)",
    re.IGNORECASE,
)
# A third form, from the facilities-management side. KleenCo's quote requests
# head their store block "RIT11262 / Rite Aid / 4245 Holland Road, Virginia
# Beach VA" — the prefix is the brand, so this one is already unambiguous and
# is kept verbatim.
_PREFIXED_STORE_NUMBER = re.compile(r"\b(RIT\d{4,6})\b", re.IGNORECASE)


def rank(evidence: str) -> int:
    try:
        return EVIDENCE_ORDER.index(evidence)
    except ValueError:
        return -1


def is_publishable(evidence: str) -> bool:
    return evidence in PUBLISHABLE


def store_numbers_in(text: str) -> list[str]:
    """
    Every store identifier in a block of free text, normalised and deduplicated.

    Two forms, both real. The parenthesised one is normalised with its brand —
    "KFC 142" rather than "142" — because a bare number is not an identifier:
    KBP operate more than one brand and a Taco Bell 142 would collide with it.
    """
    seen: dict[str, None] = {}
    body = text or ""
    for match in _STORE_NUMBER.finditer(body):
        seen.setdefault(match.group(1).upper(), None)
    for match in _BRAND_STORE_NUMBER.finditer(body):
        brand = re.sub(r"\s+", " ", match.group(1)).strip().upper()
        # group(2) is the "(369)" form, group(3) the "#189" form; exactly one
        # of them matched.
        number = match.group(2) or match.group(3)
        seen.setdefault(f"{brand} {number}", None)
    for match in _PREFIXED_STORE_NUMBER.finditer(body):
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
    contracted: bool = False,
    quoted: bool = False,
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
    if contracted:
        # An AIA A105 naming a contract sum and a scope. Stronger than an email
        # saying go ahead, and still short of an invoice: a contract is what
        # both sides agreed to do, not a record that it was done.
        return CONTRACTED
    if authorized:
        return AUTHORIZED
    if quoted:
        # Our own estimate. It proves what we offered and at what price; it
        # does not prove the client said yes, and the gap between the two is
        # where a portfolio quietly inflates.
        return QUOTED
    return LISTED


# ── Columns that look like money and are not our money ──────────────────────
#
# KBP's construction pipeline carries "20% CONFIDENCE AUV" and "80% CONFIDENCE
# AUV" per store. AUV is Average Unit Volume: the restaurant's projected ANNUAL
# SALES. Across 20 stores those two columns total $26,194,220 and $22,862,940.
#
# Nothing in that is money paid to a paving contractor. It is the client's
# revenue forecast for the restaurant that will stand on the lot. A reader that
# maps "a numeric column near an address" to an invoice amount turns a real
# document into a claim of twenty-six million dollars of work, and the figure
# is large enough and specific enough that nobody would question it.
#
# So these are matched and dropped by name before any column mapping happens.
# Refusing a column that might be money costs an import; accepting one that is
# not costs the credibility of every number on the site.
_NEVER_AN_AMOUNT = (
    "auv",              # average unit volume — the restaurant's sales
    "confidence",       # "20% CONFIDENCE AUV"
    "sales",
    "revenue",
    "rent",
    "square feet",
    "sq ft",
    "phone",            # a phone number parses as a number perfectly well
    "zip",              # so does a postal code
)


def is_never_an_amount(header: str) -> bool:
    """True when a column must never be read as money owed for work."""
    label = str(header or "").strip().lower()
    return any(token in label for token in _NEVER_AN_AMOUNT)


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
    # "$ Amount Invoiced" is the QUADS tab's spelling of the same column the
    # other five tabs write as "$ Amount of Invoice". Missing it did not fail —
    # it silently reported eleven invoiced jobs carrying no money at all.
    # THE ADVANCE. These sheets bill in two stages and head the first one a
    # different way on every tab: "$ amount of Invoice" (TX), "$ Amount of
    # deposit Invoice" (NJ), "$ Amount Invoiced" (QUADS).
    "invoice_amount": (
        "$ amount of invoice", "amount of invoice", "invoice amount",
        "$ amount invoiced", "amount invoiced",
        "$ amount of deposit invoice", "amount of deposit invoice",
        "deposit invoice", "$ deposit money", "deposit money",
    ),
    # THE FINAL. Kept in its own field and NEVER added to the advance.
    #
    # Greenville TX G135209 reads advance 17,949, final 17,949, total 17,949 —
    # one job billed in two stages, not two jobs and not $35,898. Adding the
    # two columns would roughly double the value of every staged job on the
    # sheet, and the result would look entirely plausible.
    "final_invoice": (
        "final invoice", "final invoice of job", "invoice amount",
        "final invoice amount",
    ),
    # The authoritative number. Where a row states it, this is the job.
    "job_total": ("total amount of job", "job total"),
    "amount_paid": ("$ amount paid", "amount paid"),
    # Payment, tracked apart from invoicing. An unpaid invoice is still proof
    # the work was performed — it is a receivable, not a doubt about the job.
    "paid_date": ("date received", "date paid"),
    "check_number": ("check #", "check number", "cheque #"),
    "outstanding_balance": ("outstanding balance", "balance"),
    "job_status": ("job status", "status"),
    "outstanding_issues": ("outstanding issues", "oustanding issues", "issues", "notes"),
}


_AMOUNT_FIELDS = ("invoice_amount", "job_total", "amount_paid")


def _header_map(row: tuple) -> dict[str, int]:
    found: dict[str, int] = {}
    for index, cell in enumerate(row):
        label = str(cell or "").strip().lower()
        if not label:
            continue
        # Checked before the mapping, not after: a header that is forbidden as
        # money is skipped entirely rather than mapped and then filtered, so
        # there is no path by which it reaches an amount field.
        forbidden = is_never_an_amount(label)
        for field, names in _COLUMNS.items():
            if forbidden and field in _AMOUNT_FIELDS:
                continue
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


# Tabs in the KFC tracker are named GA, TX, NJ, MI, NY — states, not
# categories. Naming a record's category "ga" is not wrong so much as useless,
# and it loses the state, which is the field a regional page filters on.
US_STATES = frozenset(
    "AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO "
    "MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC".split()
)


def state_from_sheet_name(name: str) -> Optional[str]:
    """The two-letter state a worksheet is named for, or None."""
    candidate = (name or "").strip().upper()
    return candidate if candidate in US_STATES else None


def read_program_sheet(
    rows: list[tuple],
    *,
    client: Optional[str] = None,
    program: Optional[str] = None,
    category: Optional[str] = None,
    state: Optional[str] = None,
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

        advance_cents = to_cents(cell(row, "invoice_amount"))
        final_cents = to_cents(cell(row, "final_invoice"))
        total_cents = to_cents(cell(row, "job_total"))
        # The final supersedes the advance; they are two views of one job, so
        # the larger-looking arithmetic of adding them is simply wrong.
        invoice_cents = final_cents or advance_cents
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
                # The row's own state column wins; the sheet's name is the
                # fallback, because the tracker's GA/TX/NJ tabs carry no state
                # column at all.
                "state": (str(cell(row, "state")).strip() if cell(row, "state") else None) or state,
                "postal_code": str(cell(row, "postal_code")).strip()
                if cell(row, "postal_code") else None,
                "invoice_number": str(invoice_number) if invoice_number else None,
                "date_submitted": submitted,
                "invoice_amount_cents": invoice_cents,
                "job_total_cents": total_cents or invoice_cents,
                "amount_paid_cents": to_cents(cell(row, "amount_paid")),
                "paid_date": _to_datetime(cell(row, "paid_date")),
                "check_number": str(cell(row, "check_number")).strip()
                if cell(row, "check_number") else None,
                "job_status": str(cell(row, "job_status")).strip()
                if cell(row, "job_status") else None,
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
