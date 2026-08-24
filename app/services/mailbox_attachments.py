"""
mailbox_attachments.py — take the photographs and the paperwork out of the mail.

WHY THIS IS THE MISSING PIECE
─────────────────────────────
`gmail_ingest.py` already walks a mailbox and already knows how to pull one
attachment's bytes (`fetch_attachment`). What it does with attachments during a
scan is record their NAMES — deliberately, and its own header says why: a decade
of mail holds a great many megabytes, and dragging all of it down to find the
invoices would cost hours and a disk.

That reasoning is right for a scan whose job is to grade evidence. It is wrong
for the operator, whose photographs of finished work and whose signed contracts
exist in exactly one place — inside messages sent years ago from accounts that
are one password reset away from being unreachable. A filename in a table is a
memory of a document. This module fetches the document.

WHAT MAKES A PHOTOGRAPH EVIDENCE RATHER THAN A PICTURE
──────────────────────────────────────────────────────
Provenance, and nothing else. A jpeg on a disk proves nothing. The same jpeg
with the message it arrived in — who sent it, on what date, under what subject
— is checkable, and this system's whole grading ladder runs on that. So every
file this module stores carries its message id, thread id, sender, subject and
date, and a file that cannot carry them is not stored.

That is also what lets a photograph reach a page later. `photo_email.py` grades
a jobsite email from its subject line — "KFC(195) 2722 S Main St, High Point NC
(After Pictures)" is a store number, an address and a phase. The attachment
saved from that message inherits that subject, so it can be matched to the
graded record instead of being an anonymous image somebody has to identify.

DEDUPLICATION, AND WHY IT IS BY CONTENT
───────────────────────────────────────
Every message in a corporate thread carries the sender's signature graphic.
`image001.png` appears in this archive dozens of times across the Plaza Street
correspondence alone. Deduplicating by FILENAME would be wrong in both
directions: it would collapse two different photographs that a phone happened to
name identically, and it would keep forty copies of one logo that arrived under
forty different names.

So the key is the SHA-256 of the bytes. Identical content is stored once, and
every message it appeared in is recorded against that one copy. The signature
logo collapses to a single row that names its forty sightings, and two genuinely
different photographs stay two files even when both are called IMG_0001.jpg.

WHAT IS NOT DROPPED
───────────────────
Nothing, except parts that are not attachments at all — a message body, or a
part with no filename and no data. There is no cleverness here that decides a
file is uninteresting. A rule that skips "small images" throws away a phone
photograph of a cracked kerb along with the logos, and the operator would never
know which. Everything is fetched; what is a logo becomes obvious from its forty
sightings rather than from a guess made at download time.
"""

import base64
import hashlib
import logging
import os
import re
from datetime import datetime, timezone
from typing import Any, Callable, Iterable, Optional

logger = logging.getLogger(__name__)

#: Extensions grouped the way the operator thinks about them, not the way MIME
#: does. `file_type` on MediaFile is one of these.
IMAGE = "image"
PDF = "pdf"
DOCUMENT = "document"
SPREADSHEET = "spreadsheet"
VIDEO = "video"
DRAWING = "drawing"
ARCHIVE = "archive"
OTHER = "other"

_BY_EXTENSION = {
    "jpg": IMAGE, "jpeg": IMAGE, "png": IMAGE, "gif": IMAGE, "heic": IMAGE,
    "heif": IMAGE, "webp": IMAGE, "bmp": IMAGE, "tif": IMAGE, "tiff": IMAGE,
    "pdf": PDF,
    "doc": DOCUMENT, "docx": DOCUMENT, "rtf": DOCUMENT, "txt": DOCUMENT,
    "odt": DOCUMENT, "pages": DOCUMENT,
    "xls": SPREADSHEET, "xlsx": SPREADSHEET, "csv": SPREADSHEET,
    "ods": SPREADSHEET, "numbers": SPREADSHEET,
    "mp4": VIDEO, "mov": VIDEO, "m4v": VIDEO, "avi": VIDEO, "3gp": VIDEO,
    "dwg": DRAWING, "dxf": DRAWING, "dwf": DRAWING,
    "zip": ARCHIVE, "rar": ARCHIVE, "7z": ARCHIVE,
}

#: Parts that are structurally not attachments. Calendar invitations and
#: contact cards are message plumbing; a signature graphic is NOT on this list,
#: because it is a real file and content-deduplication handles it honestly.
_NOT_A_FILE = {"text/calendar", "application/ics", "text/x-vcard", "text/vcard"}


def classify(filename: Any, mime_type: Any = None) -> str:
    """What kind of thing this is, from its extension, then its MIME type."""
    name = str(filename or "").strip().lower()
    extension = name.rsplit(".", 1)[-1] if "." in name else ""
    if extension in _BY_EXTENSION:
        return _BY_EXTENSION[extension]
    mime = str(mime_type or "").strip().lower()
    if mime.startswith("image/"):
        return IMAGE
    if mime.startswith("video/"):
        return VIDEO
    if mime == "application/pdf":
        return PDF
    return OTHER


def safe_filename(filename: Any) -> str:
    """
    A name that cannot escape the storage directory or collide by accident.

    Mail attachments arrive named by whatever produced them, and that includes
    names with slashes, names that are entirely non-ASCII, and names that are
    "..". None of those may become a path.
    """
    name = str(filename or "").strip().replace("\\", "/").rsplit("/", 1)[-1]
    name = re.sub(r"[^A-Za-z0-9._-]+", "_", name).strip("._-")
    return (name or "attachment")[:120]


def attachment_parts(payload: dict) -> list[dict]:
    """
    Every part of a message that is a file, flattened out of the MIME tree.

    Gmail nests parts arbitrarily deep — a forwarded message with an attachment
    is a part inside a part inside a part — so this recurses rather than reading
    the top level, which is how a forwarded contract goes missing.
    """
    found: list[dict] = []

    def walk(part: dict) -> None:
        filename = (part.get("filename") or "").strip()
        body = part.get("body") or {}
        mime = (part.get("mimeType") or "").strip()
        attachment_id = body.get("attachmentId")
        if filename and (attachment_id or body.get("data")) and mime.lower() not in _NOT_A_FILE:
            found.append(
                {
                    "filename": filename,
                    "mime_type": mime or None,
                    "size_bytes": body.get("size") or None,
                    "attachment_id": attachment_id,
                    # Small parts arrive inline rather than by reference.
                    "inline_data": body.get("data"),
                }
            )
        for child in part.get("parts") or []:
            walk(child)

    walk(payload or {})
    return found


def _decode(data: str) -> bytes:
    return base64.urlsafe_b64decode(data + "=" * (-len(data) % 4))


def _message_context(message: dict) -> dict:
    """
    The provenance that turns a file into evidence. Nothing is stored without it.
    """
    stamped = message.get("date")
    if isinstance(stamped, datetime):
        when = stamped
    else:
        raw = message.get("internal_date")
        try:
            when = datetime.fromtimestamp(int(raw) / 1000, tz=timezone.utc)
        except (TypeError, ValueError, OSError):
            when = None
    return {
        "message_id": message.get("id"),
        "thread_id": message.get("thread_id") or message.get("threadId"),
        "sender": (message.get("from") or message.get("sender") or "").strip() or None,
        "subject": (message.get("subject") or "").strip() or None,
        "sent_on": when.date().isoformat() if when else None,
    }


async def harvest(
    refresh_token: str,
    messages: Iterable[dict],
    *,
    fetch: Callable,
    write: Callable,
    seen: Optional[dict] = None,
    max_bytes: int = 25 * 1024 * 1024,
) -> dict[str, Any]:
    """
    Fetch every attachment in `messages`, deduplicate by content, store once.

    `fetch(refresh_token, message_id, attachment_id) -> bytes` and
    `write(digest, filename, data) -> str` are injected so this is testable
    without a network or a disk — and so the storage target can be a local
    directory now and object storage later without touching the walk.

    `seen` maps a content digest to the record already stored for it, so a
    resumed run does not re-download what it already has. It is mutated in
    place and is the caller's to persist.

    Returns the stored records plus a count of what was skipped and why.
    Nothing is dropped silently.
    """
    store: dict[str, dict] = seen if seen is not None else {}
    stored: list[dict] = []
    counts = {
        "messages": 0, "parts": 0, "fetched": 0, "duplicates": 0,
        "already_held": 0, "too_large": 0, "failed": 0, "no_provenance": 0,
    }

    for message in messages:
        counts["messages"] += 1
        context = _message_context(message)
        if not context["message_id"]:
            counts["no_provenance"] += 1
            continue

        for part in attachment_parts(message.get("payload") or {}):
            counts["parts"] += 1
            size = part.get("size_bytes") or 0
            if size and size > max_bytes:
                counts["too_large"] += 1
                logger.info(
                    "attachment %s in %s is %d bytes — above the %d limit, not fetched",
                    part["filename"], context["message_id"], size, max_bytes,
                )
                continue

            try:
                if part.get("inline_data"):
                    data = _decode(part["inline_data"])
                elif part.get("attachment_id"):
                    data = await fetch(refresh_token, context["message_id"], part["attachment_id"])
                    counts["fetched"] += 1
                else:
                    continue
            except Exception as exc:  # a single bad part must not end the run
                counts["failed"] += 1
                logger.warning(
                    "could not fetch %s from %s: %s", part["filename"], context["message_id"], exc
                )
                continue

            if not data:
                counts["failed"] += 1
                continue

            digest = hashlib.sha256(data).hexdigest()
            existing = store.get(digest)
            if existing is not None:
                # Same bytes, different message. One copy, both sightings.
                sightings = existing.setdefault("sightings", [])
                if context["message_id"] not in [s["message_id"] for s in sightings]:
                    sightings.append(context)
                counts["duplicates" if existing.get("_new") else "already_held"] += 1
                continue

            record = {
                "digest": digest,
                "filename": part["filename"],
                "stored_as": None,
                "file_type": classify(part["filename"], part.get("mime_type")),
                "mime_type": part.get("mime_type"),
                "size_bytes": len(data),
                "sightings": [context],
                "_new": True,
            }
            record["stored_as"] = write(digest, safe_filename(part["filename"]), data)
            store[digest] = record
            stored.append(record)

    for record in stored:
        record.pop("_new", None)
    counts["stored"] = len(stored)
    counts["unique_held"] = len(store)
    return {"stored": stored, "counts": counts}


def local_writer(root: str) -> Callable:
    """
    Store under `root/<type>/<digest[:16]>-<name>`.

    The digest prefix is the collision guard: two different photographs both
    called IMG_0001.jpg land beside each other rather than one overwriting the
    other, which is the quiet way an archive loses things.
    """
    def write(digest: str, filename: str, data: bytes) -> str:
        kind = classify(filename)
        directory = os.path.join(root, kind)
        os.makedirs(directory, exist_ok=True)
        path = os.path.join(directory, f"{digest[:16]}-{filename}")
        if not os.path.exists(path):
            with open(path, "wb") as handle:
                handle.write(data)
        return path

    return write


def media_rows(records: list[dict], *, tenant_id: str = "default") -> list[dict]:
    """
    Stored files to MediaFile column values.

    The first sighting supplies the provenance shown on the record; the rest are
    kept in `tags` so a file that arrived in six messages still says so.
    """
    rows = []
    for record in records:
        first = record["sightings"][0]
        # The FULL digest, not a prefix. The resume path reads this tag back to
        # decide what is already held, and it compares against the full hash —
        # a truncated tag matches nothing and the whole archive downloads again.
        tags = ["mailbox", f"sha256:{record['digest']}"]
        if first.get("sent_on"):
            tags.append(first["sent_on"])
        if len(record["sightings"]) > 1:
            tags.append(f"seen-in-{len(record['sightings'])}-messages")
        rows.append(
            {
                "filename": record["filename"][:300],
                "file_type": record["file_type"][:20],
                "mime_type": (record.get("mime_type") or None),
                "file_size_bytes": record["size_bytes"],
                "storage_url": record["stored_as"][:1000],
                "storage_provider": "local",
                "project_name": (first.get("subject") or None),
                "tags": ",".join(tags)[:500],
                "tenant_id": tenant_id,
            }
        )
    return rows
