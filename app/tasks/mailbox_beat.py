"""
mailbox_beat.py — read a little of every connected mailbox, on a schedule.

WHY A WINDOW AT A TIME
──────────────────────
There is roughly a decade of mail across five addresses. A job that tries to
read it in one pass times out, and a job that times out has read nothing and
recorded nothing about where it got to. So each run takes one window per
mailbox, moves that mailbox's cursor, and stops. Interrupt it and the cost is
one window.

Backwards through history, newest first: recent work is the work most likely to
still matter, and a scan that began in 2013 would spend its opening runs on
a decade-old circular before reaching anything useful.

WHY IT NEVER RAISES
───────────────────
One mailbox whose consent has been withdrawn must not stop the other four. Each
is attempted independently, its failure is written to its own row, and the beat
carries on — a broken mailbox that silently returns nothing is indistinguishable
from a mailbox with no work in it, which is the failure worth avoiding here.
"""

import asyncio
import logging
from datetime import datetime, timezone

from ..celery_app import celery_app
from ..database import SessionLocal
from ..models import ClientJobRecord, MailboxConnection
from ..services import gmail_ingest, job_ledger, mailbox_auth

logger = logging.getLogger(__name__)

# The earliest mail worth reading. The company was formed in April 2015 and the
# KBP work starts in December 2015; a cursor that runs past this is finished
# rather than grinding backwards through a decade of nothing.
EARLIEST = datetime(2013, 1, 1, tzinfo=timezone.utc)


@celery_app.task(name="app.tasks.mailbox_beat.scan_connected_mailboxes")
def scan_connected_mailboxes(window_days: int = gmail_ingest.BACKFILL_WINDOW_DAYS) -> dict:
    """One window from each connected mailbox."""
    if not mailbox_auth.configured():
        return {"ok": False, "reason": "Gmail OAuth is not configured", "scanned": 0}

    session = SessionLocal()
    results = []
    try:
        mailboxes = (
            session.query(MailboxConnection)
            .filter(
                MailboxConnection.is_active == 1,
                MailboxConnection.backfill_complete == 0,
                MailboxConnection.refresh_token_encrypted.isnot(None),
            )
            .all()
        )
        our_addresses = [
            m.email_address
            for m in session.query(MailboxConnection).all()
            if m.email_address
        ]

        for mailbox in mailboxes:
            results.append(_scan_one(session, mailbox, our_addresses, window_days))
        session.commit()
    finally:
        session.close()

    return {"ok": True, "scanned": len(results), "mailboxes": results}


def _scan_one(session, mailbox: MailboxConnection, our_addresses: list, window_days: int) -> dict:
    try:
        refresh_token = mailbox_auth.decrypt_token(mailbox.refresh_token_encrypted)
        result = asyncio.run(
            gmail_ingest.scan_window(
                refresh_token,
                before=mailbox.backfill_before,
                days=window_days,
                our_addresses=our_addresses,
            )
        )
    except Exception as exc:  # noqa: BLE001
        # Written to the row, not raised: one withdrawn consent must not stop
        # the other four mailboxes.
        logger.warning("Mailbox %s failed to scan: %s", mailbox.email_address, exc)
        mailbox.last_error = str(exc)[:1000]
        mailbox.last_error_at = datetime.now(timezone.utc)
        return {"mailbox": mailbox.email_address, "ok": False, "error": str(exc)[:200]}

    created = 0
    for record in result["records"]:
        source = record.get("source_document")
        existing = (
            session.query(ClientJobRecord)
            .filter(
                ClientJobRecord.tenant_id == mailbox.tenant_id,
                ClientJobRecord.source_document == source,
            )
            .first()
            if source
            else None
        )
        if existing is None:
            db_record = {k: v for k, v in record.items()}
            session.add(ClientJobRecord(tenant_id=mailbox.tenant_id, **db_record))
            created += 1
        elif job_ledger.rank(record["evidence"]) > job_ledger.rank(existing.evidence):
            existing.evidence = record["evidence"]

    mailbox.backfill_before = result["next_before"]
    mailbox.last_scan_at = datetime.now(timezone.utc)
    mailbox.messages_seen = (mailbox.messages_seen or 0) + result["messages_seen"]
    mailbox.records_created = (mailbox.records_created or 0) + created
    mailbox.last_error = None
    mailbox.last_error_at = None
    if result["next_before"] <= EARLIEST:
        mailbox.backfill_complete = 1

    return {
        "mailbox": mailbox.email_address,
        "ok": True,
        "messages_seen": result["messages_seen"],
        "records_created": created,
        "reached": result["next_before"].date().isoformat(),
        "complete": bool(mailbox.backfill_complete),
    }
