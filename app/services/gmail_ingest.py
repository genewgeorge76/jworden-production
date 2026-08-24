"""
gmail_ingest.py — walk a mailbox, and take out what can be evidenced.

WHY THIS RUNS IN THE APPLICATION AND NOT IN A CONVERSATION
──────────────────────────────────────────────────────────
There are five mailboxes and roughly a decade of mail in them. Reading that
through an assistant costs a search per page and forgets everything between
sessions. Here it is a scheduled job with a cursor: it starts where it stopped,
it survives a restart, and what it extracts lands in a table rather than in a
transcript.

It also gets something the conversational route does not: ATTACHMENTS. The
Gmail API serves message parts, so an invoice PDF or a store list spreadsheet
can be pulled down and read. That is where most of the actual paperwork is.

WHAT IT TAKES AND WHAT IT LEAVES
────────────────────────────────
It reads the FROM, the DATE, the SUBJECT, the plain-text body and the names of
attachments. It writes ledger records at the grade those things justify — which
is usually `listed`, sometimes `completed`, and never higher on the strength of
a mail alone.

It leaves everything else. A mailbox this size is mostly a person's life:
Target circulars, a magic-link email, a doctor. `_looks_like_work` is a filter
against noise, not a judgement — a message it drops produces no record, and a
message it keeps still has to earn its grade from its own contents.

THE ONE-WAY RULE
────────────────
Nothing in here writes to Gmail. The scope is readonly and the code has no send
path, no label path and no delete path, so a bug cannot cost the archive it is
reading.
"""

import base64
import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Iterable, Optional

import httpx

from . import completion_email, job_ledger, mailbox_auth

logger = logging.getLogger(__name__)

_API = "https://gmail.googleapis.com/gmail/v1/users/me"

# A page of ids, then one fetch per message. 100 is Gmail's comfortable page
# and keeps a single scan's memory bounded on a small machine.
PAGE_SIZE = 100

# How far back one scheduled run reaches. A decade in one request would time
# out; a month per run finishes and the cursor makes it resumable.
BACKFILL_WINDOW_DAYS = 30

# Senders whose mail is never work, however it is worded. Kept small and
# specific: an over-eager blocklist silently loses a client.
_NOISE_SENDERS = (
    "targetnews@", "no-reply@", "noreply@", "notifications@mailer.",
    "@em.target.com", "@account.blink.com", "mailer-daemon@",
)

# Words that mark a message as being about work at a place. A message needs one
# of these OR a recognisable store number to be looked at at all.
_WORK_WORDS = (
    "paving", "paved", "parking lot", "asphalt", "seal", "sealcoat", "stripe",
    "striping", "overlay", "milling", "mill down", "concrete", "curb", "kerb",
    "drive thru", "drive-thru", "invoice", "estimate", "proposal", "punch",
    "change order", "work order", "lien waiver", "pay application", "sq ft",
    "resurface", "patch", "pothole", "grading", "sub grade", "subgrade",
    "jobsite", "job site", "crew", "roof", "store",
    # The completion vocabulary. Without these, "KFC Hackettstown NJ Finished
    # Pictures" — an empty-bodied message that is the single best piece of
    # evidence in the archive — is dropped by the noise filter before grading
    # ever sees it. A test caught exactly that.
    "finished picture", "final picture", "completed picture", "after picture",
    "job complete", "work complete", "punch list", "walk through", "walkthrough",
    # Brands whose sites this company worked on. A subject naming one is about
    # a place, whatever else it says.
    "kfc", "taco bell", "rite aid", "harris teeter", "denny", "cvs",
)


class MailboxUnavailable(RuntimeError):
    """Google would not serve this mailbox."""


def _looks_like_work(sender: str, subject: str, body: str) -> bool:
    """
    Whether a message is plausibly about a job, before anything is extracted.

    Deliberately generous. This is a noise filter and a false negative here
    loses a record permanently, while a false positive only means the grading
    below gets a chance to reject it.
    """
    address = (sender or "").lower()
    if any(marker in address for marker in _NOISE_SENDERS):
        return False
    haystack = f"{subject} {body}".lower()
    if any(word in haystack for word in _WORK_WORDS):
        return True
    return bool(job_ledger.store_numbers_in(f"{subject} {body}"))


def _header(message: dict, name: str) -> str:
    headers = ((message.get("payload") or {}).get("headers")) or []
    lowered = name.lower()
    for header in headers:
        if (header.get("name") or "").lower() == lowered:
            return header.get("value") or ""
    return ""


def _address_only(value: str) -> str:
    """"Gene George <jhworden1@gmail.com>" -> "jhworden1@gmail.com"."""
    match = re.search(r"<([^>]+)>", value or "")
    return (match.group(1) if match else (value or "")).strip().lower()


def _decode(data: str) -> str:
    try:
        return base64.urlsafe_b64decode(data + "=" * (-len(data) % 4)).decode(
            "utf-8", errors="replace"
        )
    except (ValueError, TypeError):
        return ""


def plain_body(payload: dict, *, limit: int = 20000) -> str:
    """
    The plain-text body, walking the MIME tree.

    text/plain is preferred and text/html is a fallback with its tags stripped:
    a phone-composed reply is often HTML only, and those are exactly the
    messages that say "finished, here are the pictures".
    """
    plain: list[str] = []
    html: list[str] = []

    def walk(part: dict) -> None:
        mime = (part.get("mimeType") or "").lower()
        data = ((part.get("body") or {}).get("data")) or ""
        if data:
            if mime == "text/plain":
                plain.append(_decode(data))
            elif mime == "text/html":
                html.append(_decode(data))
        for child in part.get("parts") or []:
            walk(child)

    walk(payload or {})
    if plain:
        return "\n".join(plain)[:limit]
    stripped = re.sub(r"<[^>]+>", " ", "\n".join(html))
    return re.sub(r"\s+", " ", stripped)[:limit]


def attachment_names(payload: dict) -> list[str]:
    """
    Filenames of the attachments, without fetching them.

    The names alone are informative — "JWS Paving - Sub Agreement - CO
    36330-06.pdf", "Contact Sheet-Q2 P5 May 2016.xls" — and cheap. Fetching the
    bytes is a second, deliberate step.
    """
    found: list[str] = []

    def walk(part: dict) -> None:
        name = (part.get("filename") or "").strip()
        if name:
            found.append(name)
        for child in part.get("parts") or []:
            walk(child)

    walk(payload or {})
    return found


async def _get(client: httpx.AsyncClient, token: str, path: str, **params) -> dict:
    response = await client.get(
        f"{_API}{path}", headers={"Authorization": f"Bearer {token}"}, params=params or None
    )
    if response.status_code in (401, 403):
        raise MailboxUnavailable(
            f"Google refused this mailbox (HTTP {response.status_code}). Consent may have "
            "been withdrawn, or the Gmail API is not enabled on the project."
        )
    if response.status_code >= 400:
        raise MailboxUnavailable(f"Gmail returned HTTP {response.status_code} for {path}")
    return response.json()


def window_query(before: Optional[datetime], *, days: int = BACKFILL_WINDOW_DAYS) -> str:
    """
    One backfill window, expressed in Gmail's own query syntax.

    Walking BACKWARDS from the newest mail. Recent work is the work most likely
    to still matter, so an interrupted backfill has already covered the useful
    end — and a scan that started in 2013 would spend its first several runs on
    a decade-old Target circular.
    """
    end = before or datetime.now(timezone.utc)
    start = end - timedelta(days=days)
    return f"after:{start:%Y/%m/%d} before:{end:%Y/%m/%d} -in:chats"


async def scan_window(
    refresh_token: str,
    *,
    before: Optional[datetime] = None,
    days: int = BACKFILL_WINDOW_DAYS,
    our_addresses: Iterable[str] = (),
    client_name: Optional[str] = None,
    max_messages: int = 400,
    timeout_seconds: float = 60.0,
) -> dict[str, Any]:
    """
    Read one window of a mailbox and return the records it justifies.

    Returns the window's own boundary so the caller can persist a cursor and
    resume; a scan that cannot say where it stopped has to start over.
    """
    token = await mailbox_auth.access_token(refresh_token, timeout_seconds=timeout_seconds)
    query = window_query(before, days=days)

    seen = 0
    kept: list[dict] = []
    attachments_found = 0

    async with httpx.AsyncClient(timeout=timeout_seconds) as client:
        page_token: Optional[str] = None
        while seen < max_messages:
            params = {"q": query, "maxResults": min(PAGE_SIZE, max_messages - seen)}
            if page_token:
                params["pageToken"] = page_token
            listing = await _get(client, token, "/messages", **params)

            ids = [m.get("id") for m in (listing.get("messages") or []) if m.get("id")]
            if not ids:
                break

            for message_id in ids:
                seen += 1
                message = await _get(client, token, f"/messages/{message_id}", format="full")
                payload = message.get("payload") or {}
                sender = _address_only(_header(message, "From"))
                subject = _header(message, "Subject")
                body = plain_body(payload)

                if not _looks_like_work(sender, subject, body):
                    continue

                names = attachment_names(payload)
                attachments_found += len(names)
                kept.append(
                    {
                        "subject": subject,
                        "sender": sender,
                        "to": _header(message, "To"),
                        "date": _header(message, "Date"),
                        "body": body,
                        "thread_id": message.get("threadId"),
                        "message_id": message_id,
                        "attachments": names,
                        # Gmail's own epoch-millis, which is unambiguous where
                        # the Date header is a free-text field that clients
                        # write in a dozen formats.
                        "internal_date": message.get("internalDate"),
                    }
                )

            page_token = listing.get("nextPageToken")
            if not page_token:
                break

    records = completion_email.read_messages(
        [_with_internal_date(m) for m in kept],
        client=client_name,
        our_addresses=our_addresses,
    )

    end = before or datetime.now(timezone.utc)
    return {
        "ok": True,
        "query": query,
        "messages_seen": seen,
        "messages_kept": len(kept),
        "attachments_seen": attachments_found,
        "records": records,
        # The next window starts where this one began.
        "next_before": end - timedelta(days=days),
        "messages": kept,
    }


def _with_internal_date(message: dict) -> dict:
    """
    Prefer Gmail's internalDate over the Date header.

    The header is free text written by whatever client sent the message and
    comes in a dozen formats; internalDate is epoch milliseconds and is the
    same for every message ever sent.
    """
    raw = message.get("internal_date")
    if not raw:
        return message
    try:
        stamped = datetime.fromtimestamp(int(raw) / 1000, tz=timezone.utc)
    except (TypeError, ValueError, OSError):
        return message
    return {**message, "date": stamped}


async def fetch_attachment(
    refresh_token: str, message_id: str, attachment_id: str, *, timeout_seconds: float = 60.0
) -> bytes:
    """
    One attachment's bytes.

    Separate from the scan on purpose: a decade of mail holds a great many
    megabytes of attachments, and pulling them all down to find the invoices
    would cost hours and a disk. The scan records what is there; this fetches
    what is wanted.
    """
    token = await mailbox_auth.access_token(refresh_token, timeout_seconds=timeout_seconds)
    async with httpx.AsyncClient(timeout=timeout_seconds) as client:
        body = await _get(
            client, token, f"/messages/{message_id}/attachments/{attachment_id}"
        )
    return base64.urlsafe_b64decode(
        (body.get("data") or "") + "=" * (-len(body.get("data") or "") % 4)
    )
