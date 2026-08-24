"""
mbox_reader.py — read a Google Takeout mail archive.

WHY A FILE AND NOT AN API
────────────────────────
gmail.readonly is one of Google's restricted scopes. An application using it
stays in "Testing" publishing status unless it passes a security assessment,
and in Testing status a refresh token EXPIRES AFTER SEVEN DAYS. Connecting five
mailboxes would mean reconnecting all five every week, permanently, or paying
for a verification process sized for a consumer product.

Takeout has none of that. One export per mailbox, no credential to store, no
expiry, nothing to revoke — and the export contains the attachments, which is
where most of the actual paperwork lives.

The OAuth path in gmail_ingest.py stays for anyone who does verify. This is the
one that works this week.

READING A FILE THAT DOES NOT FIT IN MEMORY
──────────────────────────────────────────
A decade of one mailbox is measured in gigabytes. `mailbox.mbox` from the
standard library builds an index of the whole file before yielding anything and
holds message objects live; on an export this size that is a machine running
out of memory an hour into a job.

So this streams. Messages are split on the mbox "From " separator at the start
of a line, parsed one at a time, and released. Memory stays flat whatever the
file weighs.

THE SEPARATOR PROBLEM
─────────────────────
"From " at the start of a line separates messages, and it also appears inside
bodies — "From the crew this morning", a quoted reply. mbox format escapes
those as ">From ", but not every producer does it and a mis-split silently
truncates a message and invents a fragment. So a line only starts a new message
if it looks like a real separator: "From " followed by something address-like
and a date.
"""

import email
import logging
import os
import re
from datetime import datetime, timezone
from email import policy
from email.header import decode_header, make_header
from email.utils import parsedate_to_datetime
from typing import Any, Iterator, Optional

from . import completion_email, job_ledger

logger = logging.getLogger(__name__)

# "From gene@example.com Fri Apr 21 01:36:40 2017" — an address-shaped token
# and a date. A body line reading "From the crew this morning" does not match.
_SEPARATOR = re.compile(rb"^From \S+@?\S* +\w{3} \w{3} +\d{1,2} \d{2}:\d{2}:\d{2} \d{4}")

# A looser form some exporters produce: "From ???@???" with no parsable date.
_SEPARATOR_LOOSE = re.compile(rb"^From \S+@\S+ ")

_MAX_BODY = 20000


def _looks_like_separator(line: bytes) -> bool:
    if not line.startswith(b"From "):
        return False
    return bool(_SEPARATOR.match(line) or _SEPARATOR_LOOSE.match(line))


def iter_raw_messages(path: str, *, max_messages: Optional[int] = None) -> Iterator[bytes]:
    """
    Yield each message's raw bytes, holding one at a time.

    Opened in binary. Mail archives contain every encoding anyone has ever
    used and several that are simply broken; decoding at this level would
    raise on a message from 2014 and take the rest of the archive with it.
    """
    buffer: list[bytes] = []
    produced = 0

    with open(path, "rb") as handle:
        for line in handle:
            if _looks_like_separator(line) and buffer:
                yield b"".join(buffer)
                produced += 1
                buffer = []
                if max_messages is not None and produced >= max_messages:
                    return
                continue
            if _looks_like_separator(line) and not buffer:
                # The first separator in the file: start, do not emit.
                continue
            buffer.append(line)

    if buffer:
        yield b"".join(buffer)


def _decode_header(value: Any) -> str:
    if not value:
        return ""
    try:
        return str(make_header(decode_header(str(value))))
    except (UnicodeDecodeError, LookupError, ValueError):
        # A header this system cannot decode is still worth its raw text —
        # a mangled subject line usually still contains the address.
        return str(value)


def _body_and_attachments(message) -> tuple[str, list[dict]]:
    """
    The plain text, and what was attached.

    text/plain wins; text/html is stripped as a fallback, because a reply typed
    on a phone is often HTML only and those are exactly the messages that say
    "finished, here are the pictures".
    """
    plain: list[str] = []
    html: list[str] = []
    attachments: list[dict] = []

    for part in message.walk():
        if part.is_multipart():
            continue
        filename = part.get_filename()
        if filename:
            payload = part.get_payload(decode=True) or b""
            attachments.append(
                {
                    "filename": _decode_header(filename),
                    "content_type": part.get_content_type(),
                    "size": len(payload),
                }
            )
            continue

        content_type = part.get_content_type()
        if content_type not in ("text/plain", "text/html"):
            continue
        try:
            payload = part.get_payload(decode=True) or b""
            text = payload.decode(part.get_content_charset() or "utf-8", errors="replace")
        except (LookupError, ValueError):
            continue
        (plain if content_type == "text/plain" else html).append(text)

    if plain:
        return "\n".join(plain)[:_MAX_BODY], attachments
    stripped = re.sub(r"<[^>]+>", " ", "\n".join(html))
    return re.sub(r"\s+", " ", stripped)[:_MAX_BODY], attachments


def _address(value: str) -> str:
    match = re.search(r"<([^>]+)>", value or "")
    return (match.group(1) if match else (value or "")).strip().lower()


def parse_message(raw: bytes) -> Optional[dict]:
    """One message's bytes to the fields this system cares about, or None."""
    try:
        message = email.message_from_bytes(raw, policy=policy.default)
    except Exception as exc:  # noqa: BLE001
        # One unparseable message must not end the archive. There are a decade
        # of them and some were written by software that no longer exists.
        logger.debug("Skipping an unparseable message: %s", exc)
        return None

    subject = _decode_header(message.get("Subject"))
    sender = _address(_decode_header(message.get("From")))
    body, attachments = _body_and_attachments(message)

    when: Optional[datetime] = None
    raw_date = message.get("Date")
    if raw_date:
        try:
            when = parsedate_to_datetime(raw_date)
            if when is not None and when.tzinfo is None:
                when = when.replace(tzinfo=timezone.utc)
        except (TypeError, ValueError):
            when = None

    return {
        "subject": subject,
        "sender": sender,
        "to": _decode_header(message.get("To")),
        "date": when,
        "body": body,
        # Gmail writes its own thread id into the export, which keeps a record
        # traceable back to the live mailbox after import.
        "thread_id": (message.get("X-GM-THRID") or message.get("Message-ID") or "").strip("<> "),
        "attachments": attachments,
        "labels": _decode_header(message.get("X-Gmail-Labels")),
    }


# Labels Gmail applies to mail that is definitionally not business
# correspondence. Checked as whole labels, so "Promotions" does not also
# discard a thread somebody labelled "Promotions - Richmond".
_SKIP_LABELS = {"spam", "trash", "category promotions", "category social", "category forums"}


def _skipped_by_label(labels: str) -> bool:
    present = {part.strip().lower() for part in (labels or "").split(",") if part.strip()}
    return bool(present & _SKIP_LABELS)


def read_archive(
    path: str,
    *,
    our_addresses: list[str],
    client: Optional[str] = None,
    program: Optional[str] = None,
    max_messages: Optional[int] = None,
) -> dict[str, Any]:
    """
    Walk a Takeout mbox and return the records it justifies.

    The counts matter as much as the records: an archive of 40,000 messages
    that yields 200 records should say so, because "200 found" alone gives no
    way to tell a thorough read from a broken filter.
    """
    from . import gmail_ingest  # noqa: PLC0415  (shares the work-vocabulary filter)

    if not os.path.exists(path):
        raise FileNotFoundError(f"No archive at {path}")

    seen = 0
    unparseable = 0
    skipped_by_label = 0
    about_work = 0
    attachments_seen = 0
    attachment_names: dict[str, int] = {}
    messages: list[dict] = []

    for raw in iter_raw_messages(path, max_messages=max_messages):
        seen += 1
        parsed = parse_message(raw)
        if parsed is None:
            unparseable += 1
            continue
        if _skipped_by_label(parsed["labels"]):
            skipped_by_label += 1
            continue
        if not gmail_ingest._looks_like_work(parsed["sender"], parsed["subject"], parsed["body"]):
            continue

        about_work += 1
        for attachment in parsed["attachments"]:
            attachments_seen += 1
            name = attachment["filename"]
            if name:
                attachment_names[name] = attachment_names.get(name, 0) + 1
        messages.append(parsed)

    records = completion_email.read_messages(
        messages, client=client, program=program, our_addresses=our_addresses
    )

    return {
        "ok": True,
        "archive": os.path.basename(path),
        "messages_seen": seen,
        "messages_unparseable": unparseable,
        "messages_skipped_by_label": skipped_by_label,
        "messages_about_work": about_work,
        "attachments_seen": attachments_seen,
        "records": records,
        "publishable": sum(
            1 for r in records if job_ledger.is_publishable(r.get("evidence", ""))
        ),
        # The attachment names alone are a map of where the paperwork is:
        # "JWS Paving - Sub Agreement - CO 36330-06.pdf" tells you what to open
        # without opening anything.
        "attachment_names": sorted(
            attachment_names.items(), key=lambda kv: -kv[1]
        )[:200],
        "messages": messages,
    }
