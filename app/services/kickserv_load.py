"""
kickserv_load.py — write a parsed Kickserv export into the job ledger.

WHY THIS IS SEPARATE FROM kickserv_import.py
--------------------------------------------
`kickserv_import.read_export` reads the archive and grades every job. It does
not touch the database, and that split is deliberate: reading is pure and
testable against a fixture zip, while writing needs a session, a tenant and an
idempotency rule. Keeping them apart means the grading logic can be tested
without a database, and the writing logic can be tested without a real export.

IDEMPOTENCY
-----------
Re-running an import must not double the ledger. Every record carries
`source_document = "kickserv:job:<job_number>"`, which is unique per job inside
one Kickserv account, so `(tenant_id, source_document)` is the natural key.

On a second run a row can only move *up* the evidence ladder, never down. That
matters because the ledger is fed from several places: a job imported here as
`quoted` may since have been graded `invoiced` by the mailbox scanner off a real
invoice email. Re-importing the same export must not undo that. The rule is the
same one `app/tasks/mailbox_beat.py` already applies, for the same reason.

WHAT IT DOES NOT DO
-------------------
It does not invent a completion date, an amount, or a grade. Every field comes
from `read_export`, which in turn comes from the archive. A job Kickserv never
marked completed stays un-completed here — per the owner's own account the
company finished work it never went back and closed out in Kickserv, so the
completed figure is a floor, and the fix for that is a real completion record
(an invoice, a completion email), not a default applied at import time.
"""

from __future__ import annotations

import logging
from typing import Any, Optional

from app.models import ClientJobRecord
from app.services import job_ledger, kickserv_import, tenancy

logger = logging.getLogger(__name__)

#: Fields on a read_export record that are safe to refresh on a re-import.
#: Deliberately excludes `evidence` (rank-guarded below) and every identity
#: field (`source_document`, `invoice_number`), which are the key itself.
REFRESHABLE = (
    "client",
    "category",
    "address",
    "city",
    "state",
    "postal_code",
    "latitude",
    "longitude",
    "invoice_amount_cents",
    "job_total_cents",
    "job_status",
    "completed_on",
    "scope",
    "scope_source",
    "notes",
)


def load(
    db,
    path: str,
    tenant: str,
    *,
    dry_run: bool = False,
) -> dict[str, Any]:
    """
    Import a Kickserv export archive into `ClientJobRecord` for one tenant.

    Returns the `read_export` summary plus what the write actually did. With
    `dry_run=True` nothing is added, flushed or committed — the counts still
    come back, so you can see what a real run would do before doing it.
    """
    parsed = kickserv_import.read_export(path)
    stamp = tenancy.stamp_for(tenant)

    created = 0
    upgraded = 0
    refreshed = 0
    unchanged = 0
    skipped_no_key = 0

    for record in parsed["records"]:
        source = record.get("source_document")
        if not source:
            # Without a stable key a re-import would duplicate the row on every
            # run. Counted and reported rather than silently written.
            skipped_no_key += 1
            continue

        existing = (
            tenancy.scope(db.query(ClientJobRecord), ClientJobRecord, tenant)
            .filter(ClientJobRecord.source_document == source)
            .first()
        )

        if existing is None:
            if not dry_run:
                db.add(ClientJobRecord(tenant_id=stamp, **record))
            created += 1
            continue

        touched = False

        incoming = record.get("evidence") or ""
        if job_ledger.rank(incoming) > job_ledger.rank(existing.evidence or ""):
            if not dry_run:
                existing.evidence = incoming
            upgraded += 1
            touched = True

        for field in REFRESHABLE:
            new = record.get(field)
            # Only fill and correct — never blank a populated field with a
            # None the export happens not to carry.
            if new is None or getattr(existing, field, None) == new:
                continue
            if not dry_run:
                setattr(existing, field, new)
            touched = True
            refreshed += 1

        if not touched:
            unchanged += 1

    if not dry_run:
        db.commit()

    written = {
        "tenant": stamp,
        "dry_run": dry_run,
        "created": created,
        "evidence_upgraded": upgraded,
        "fields_refreshed": refreshed,
        "unchanged": unchanged,
        "skipped_no_source_document": skipped_no_key,
    }

    logger.info(
        "Kickserv import (%s): %s jobs read, %s created, %s upgraded, %s unchanged",
        "dry run" if dry_run else stamp,
        parsed["jobs"],
        created,
        upgraded,
        unchanged,
    )

    return {
        "ok": True,
        "read": {
            "jobs": parsed["jobs"],
            "charge_lines": parsed["charge_lines"],
            "customers": parsed["customers"],
            "payments": parsed["payments"],
            "counts": parsed["counts"],
            **{
                k: v
                for k, v in parsed.items()
                if k not in {"ok", "records", "jobs", "charge_lines", "customers", "payments", "counts"}
            },
        },
        "written": written,
    }


def summarise_written(result: dict[str, Any]) -> str:
    """A one-paragraph, human-readable account of an import. No percentages."""
    w = result["written"]
    r = result["read"]
    verb = "would create" if w["dry_run"] else "created"
    lines = [
        f"{r['jobs']} jobs read from the export "
        f"({r['charge_lines']} charge lines, {r['customers']} customers, "
        f"{r['payments']} payments).",
        f"{verb} {w['created']}; "
        f"{w['evidence_upgraded']} evidence upgrades, "
        f"{w['fields_refreshed']} field refreshes, "
        f"{w['unchanged']} already current.",
    ]
    if w["skipped_no_source_document"]:
        lines.append(
            f"{w['skipped_no_source_document']} rows had no job number and were "
            "skipped — without one, a re-import would duplicate them."
        )
    return " ".join(lines)


def resolve_amount(record: dict) -> Optional[int]:
    """
    The invoice figure for a record, in whole cents.

    Exposed so callers do not re-derive it: advance and final are never summed,
    which is the rule `job_ledger` sets and the reason the Texas tracker's
    $200,730.50 went missing the first time it was read.
    """
    return record.get("invoice_amount_cents") or record.get("job_total_cents")
