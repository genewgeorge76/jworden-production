#!/usr/bin/env python3
"""
Import a Kickserv export archive into the job ledger.

    python scripts/import_kickserv_export.py jwordenandsonspaving_20260823215614.zip --dry-run
    python scripts/import_kickserv_export.py jwordenandsonspaving_20260823215614.zip

Run --dry-run first. It reads the archive, grades every job and prints exactly
what a real run would write, without opening a database connection at all.

WHY A DRY RUN MATTERS MORE HERE THAN USUAL
──────────────────────────────────────────
The export holds every job the company ever entered, and the headline figure
over all rows is not a track record: some jobs are marked lost, and a large
share carry no completion date at all. The defensible number is the completed
subset. The dry run prints that breakdown — completed, priced-but-not-completed,
lost, and bare — so the distinction is visible before anything lands in a table
that feeds public pages.

Do not take the counts from any comment, including this one. Two figures for the
completed count are already written down in this repository and they disagree:
kickserv_import.py's own docstring says 1,135 completed jobs, while
src/data/trackRecord.js publishes COMPLETED_JOBS = 1132. Both cite the same
$12,967,927.18. One of them is wrong, and the export is the only thing that can
say which — so run this against the real archive and read the number it prints.

That completed figure is a FLOOR, not a ceiling. Per the owner's own account
the company finished work it never went back and closed out in Kickserv. This
importer does not correct for that, because the correction would be a guess.
The honest fix is a real completion record — an invoice, a completion email —
which is what the mailbox scanner is for.

IDEMPOTENCY
───────────
Safe to re-run. Rows are keyed on (tenant_id, source_document) where
source_document is "kickserv:job:<job_number>", and a re-import may only move a
job UP the evidence ladder. A job graded `invoiced` from a real invoice email
will not be knocked back to `quoted` because the export never closed it out.
"""

import argparse
import sys
from decimal import Decimal, InvalidOperation
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from app.services import job_ledger, kickserv_import  # noqa: E402


def _money(value) -> str:
    """
    job_ledger.to_dollars gives a bare "35575.00". Add the currency and the
    thousands separators for reading. Decimal throughout — never float, because
    these are the figures that end up on public pages.
    """
    if value is None:
        return "—"
    try:
        return f"${Decimal(str(value)):,.2f}"
    except InvalidOperation:
        return str(value)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path, help="The Kickserv export .zip")
    parser.add_argument(
        "--tenant",
        default="default",
        help="Tenant to write under. Owner tenants collapse onto 'default'.",
    )
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not args.archive.exists():
        print(f"No such archive: {args.archive}", file=sys.stderr)
        return 2

    try:
        parsed = kickserv_import.read_export(str(args.archive))
    except (KeyError, ValueError) as exc:
        print(
            f"Could not read {args.archive.name} as a Kickserv export: {exc}\n"
            "Expected jobs.csv, job_charges.csv, customers.csv and payments.csv "
            "inside the zip.",
            file=sys.stderr,
        )
        return 2

    counts = parsed["counts"]
    print(f"\n  {args.archive.name}")
    print(f"    jobs                   {parsed['jobs']:>8,}")
    print(f"    charge lines           {parsed['charge_lines']:>8,}")
    print(f"    customers              {parsed['customers']:>8,}")
    print(f"    payments               {parsed['payments']:>8,}")

    print("\n    how the jobs grade out:")
    print(f"      completed            {counts['completed']:>8,}")
    print(f"      priced, not completed{counts['priced_not_completed']:>8,}")
    print(f"      lost                 {counts['lost']:>8,}")
    print(f"      no price, no date    {counts['bare']:>8,}")

    print("\n    who they were for:")
    print(f"      commercial           {counts['commercial']:>8,}")
    print(f"      residential          {counts['residential']:>8,}")
    print(f"      with coordinates     {counts['with_coordinates']:>8,}")
    print(
        "      (a residential job carries no address and no pin — a homeowner\n"
        "       who hired a paving crew did not agree to a public map entry)"
    )

    print("\n    value, reported apart and never as one figure:")
    for label, key in (
        ("completed only — the one with a document behind it", "completed_value"),
        ("every row, including lost and unfinished", "all_jobs_value"),
        ("marked lost", "lost_value"),
    ):
        if parsed.get(key) is not None:
            print(f"      {label}\n        {_money(parsed[key])}")
    if parsed.get("note"):
        print(f"\n    {parsed['note']}")

    summary = job_ledger.summarise(parsed["records"])
    print(f"\n    {summary['records']} records, {summary['publishable']} publishable")
    for grade in reversed(job_ledger.EVIDENCE_ORDER):
        bucket = summary["by_evidence"].get(grade)
        if not bucket:
            continue
        mark = "publishable" if bucket["publishable"] else "NOT publishable"
        print(f"      {grade:<22} {bucket['count']:>5}  ({mark})")

    if args.dry_run:
        print("\n  --dry-run: no database connection opened, nothing written.\n")
        return 0

    # Imported here, not at module scope, so --dry-run needs no DATABASE_URL.
    from app.database import SessionLocal  # noqa: PLC0415
    from app.services import kickserv_load  # noqa: PLC0415

    session = SessionLocal()
    try:
        result = kickserv_load.load(session, str(args.archive), args.tenant)
    finally:
        session.close()

    print(f"\n  {kickserv_load.summarise_written(result)}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
