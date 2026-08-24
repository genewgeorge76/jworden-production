#!/usr/bin/env python3
"""
Import a Google Takeout mail archive into the job ledger.

    python scripts/import_mailbox_archive.py "All mail Including Spam and Trash.mbox" \
        --our jhworden1@gmail.com --our wordenpaving@gmail.com \
        --client "KBP Foods" --dry-run

Run with --dry-run first. It prints what the archive contains and what grade
each record would land at, without writing anything — which is the only way to
see that a 40,000-message export yields 200 records before those 200 are in the
database.

WHY THIS EXISTS RATHER THAN THE OAUTH PATH
──────────────────────────────────────────
gmail.readonly is a restricted scope. An unverified app's refresh tokens expire
after seven days, so connecting five mailboxes would mean reconnecting all five
weekly, forever. A Takeout export has no credential, no expiry and includes the
attachments.
"""

import argparse
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from app.services import job_ledger, mbox_reader  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    parser.add_argument(
        "--our", action="append", default=[],
        help="An address this company sends FROM. Repeatable. Only mail sent "
             "by one of these is read as our record of performance.",
    )
    parser.add_argument("--client", default=None)
    parser.add_argument("--program", default=None)
    parser.add_argument("--tenant", default="default")
    parser.add_argument("--max-messages", type=int, default=None)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not args.our:
        print(
            "--our is required: without it every message in the archive is read "
            "as ours, including the client's own mail, and a leaking roof "
            "becomes a completed job.",
            file=sys.stderr,
        )
        return 2

    try:
        result = mbox_reader.read_archive(
            str(args.archive),
            our_addresses=[a.lower() for a in args.our],
            client=args.client,
            program=args.program,
            max_messages=args.max_messages,
        )
    except FileNotFoundError as exc:
        print(exc, file=sys.stderr)
        return 2

    print(f"\n  {result['archive']}")
    print(f"    messages read          {result['messages_seen']:>8,}")
    print(f"    unparseable            {result['messages_unparseable']:>8,}")
    print(f"    skipped (spam/promos)  {result['messages_skipped_by_label']:>8,}")
    print(f"    about work             {result['messages_about_work']:>8,}")
    print(f"    attachments seen       {result['attachments_seen']:>8,}")

    summary = job_ledger.summarise(result["records"])
    print(f"\n    {summary['records']} records, {summary['publishable']} publishable")
    for grade in reversed(job_ledger.EVIDENCE_ORDER):
        bucket = summary["by_evidence"].get(grade)
        if not bucket:
            continue
        mark = "publishable" if bucket["publishable"] else "NOT publishable"
        print(f"      {grade:<12} {bucket['count']:>5}  ({mark})")

    if result["attachment_names"]:
        print("\n    most common attachments (a map of where the paperwork is):")
        for name, count in result["attachment_names"][:15]:
            print(f"      {count:>4}x  {name[:70]}")

    if args.dry_run:
        print("\n  --dry-run: nothing written.")
        return 0

    from app.database import SessionLocal  # noqa: PLC0415
    from app.models import ClientJobRecord  # noqa: PLC0415

    session = SessionLocal()
    created = strengthened = 0
    try:
        for record in result["records"]:
            source = record.get("source_document")
            existing = (
                session.query(ClientJobRecord)
                .filter(
                    ClientJobRecord.tenant_id == args.tenant,
                    ClientJobRecord.source_document == source,
                )
                .first()
                if source
                else None
            )
            if existing is None:
                session.add(ClientJobRecord(tenant_id=args.tenant, **record))
                created += 1
                continue
            # A re-import may only strengthen a record, never demote one.
            if job_ledger.rank(record["evidence"]) > job_ledger.rank(existing.evidence):
                existing.evidence = record["evidence"]
                strengthened += 1
            for field, value in record.items():
                if field == "evidence" or value in (None, ""):
                    continue
                if getattr(existing, field, None) in (None, ""):
                    setattr(existing, field, value)
        session.commit()
    finally:
        session.close()

    print(f"\n  Written: {created} new, {strengthened} strengthened.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
