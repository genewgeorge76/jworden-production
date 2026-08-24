"""
Taking the photographs and the paperwork out of the mail.

The operator's evidence of eight years of work is inside messages sent from
accounts he is one password reset away from losing. `gmail_ingest.py` records
attachment NAMES during a scan, on purpose and for good reasons. This module
fetches the files.

What these tests are careful about:

  * A file with no message behind it is not evidence and must not be stored.
  * Deduplication by filename would be wrong in both directions. Two different
    photographs are routinely both called IMG_0001.jpg; one signature logo
    routinely arrives under a dozen names.
  * Nothing may be dropped silently. A rule that skips "small images" throws
    away a phone photograph of a cracked kerb along with the logos.
"""

import asyncio
import hashlib
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from app.services import mailbox_attachments as ma  # noqa: E402


def _message(msg_id, parts, *, subject="After Pictures", sender="crew@example.com"):
    return {
        "id": msg_id,
        "thread_id": f"t-{msg_id}",
        "subject": subject,
        "from": sender,
        "internal_date": "1500000000000",
        "payload": {"parts": parts},
    }


def _part(filename, attachment_id, *, mime="image/jpeg", size=1000):
    return {
        "filename": filename,
        "mimeType": mime,
        "body": {"attachmentId": attachment_id, "size": size},
    }


def _run(messages, blobs, **kwargs):
    written = {}

    async def fetch(_token, _message_id, attachment_id):
        return blobs[attachment_id]

    def write(digest, filename, data):
        path = f"/store/{digest[:16]}-{filename}"
        written[path] = data
        return path

    result = asyncio.run(ma.harvest("token", messages, fetch=fetch, write=write, **kwargs))
    return result, written


# ── Classification ───────────────────────────────────────────────────────────


def test_files_are_classified_the_way_the_operator_thinks_about_them():
    assert ma.classify("IMG_0001.jpg") == ma.IMAGE
    assert ma.classify("KFC_DeRidder_GeoReport.pdf") == ma.PDF
    assert ma.classify("KBP Pipeline & Calendar.xlsx") == ma.SPREADSHEET
    assert ma.classify("subcontract.docx") == ma.DOCUMENT
    assert ma.classify("site.mov") == ma.VIDEO
    assert ma.classify("grading.dwg") == ma.DRAWING


def test_an_unknown_extension_falls_back_to_the_mime_type():
    assert ma.classify("photo.heic2", "image/heic") == ma.IMAGE
    assert ma.classify("thing", "application/pdf") == ma.PDF
    assert ma.classify("thing", "application/x-unknown") == ma.OTHER


def test_a_filename_cannot_become_a_path():
    # The basename, with everything that could be a path removed.
    assert ma.safe_filename("../../etc/passwd") == "passwd"
    assert ma.safe_filename(r"C:\\Users\\gene\\contract.pdf") == "contract.pdf"
    assert "/" not in ma.safe_filename("a/b/c.jpg")
    assert ma.safe_filename("") == "attachment"
    assert ma.safe_filename("..") == "attachment"


# ── Finding the files ────────────────────────────────────────────────────────


def test_attachments_are_found_however_deeply_the_message_nests_them():
    """A forwarded message with a contract is a part inside a part."""
    payload = {
        "parts": [
            {"filename": "", "mimeType": "text/plain", "body": {"size": 10}},
            {
                "mimeType": "message/rfc822",
                "parts": [
                    {"mimeType": "multipart/mixed", "parts": [_part("subcontract.pdf", "a1", mime="application/pdf")]}
                ],
            },
        ]
    }
    found = ma.attachment_parts(payload)
    assert [f["filename"] for f in found] == ["subcontract.pdf"]


def test_a_message_body_is_not_an_attachment():
    payload = {"parts": [{"filename": "", "mimeType": "text/html", "body": {"data": "abc"}}]}
    assert ma.attachment_parts(payload) == []


def test_calendar_invitations_and_contact_cards_are_not_files():
    payload = {
        "parts": [
            {"filename": "invite.ics", "mimeType": "text/calendar", "body": {"attachmentId": "a"}},
            {"filename": "card.vcf", "mimeType": "text/x-vcard", "body": {"attachmentId": "b"}},
        ]
    }
    assert ma.attachment_parts(payload) == []


def test_a_signature_graphic_is_still_a_file():
    """
    NOT filtered at download time. A rule that drops small images drops
    jobsite photographs too, and nobody would ever know which.
    """
    payload = {"parts": [_part("image001.png", "a", mime="image/png", size=4000)]}
    assert len(ma.attachment_parts(payload)) == 1


# ── Provenance ───────────────────────────────────────────────────────────────


def test_every_stored_file_carries_the_message_it_came_from():
    blobs = {"a1": b"photo-bytes"}
    result, _ = _run([_message("m1", [_part("after.jpg", "a1")])], blobs)
    (record,) = result["stored"]
    sighting = record["sightings"][0]
    assert sighting["message_id"] == "m1"
    assert sighting["thread_id"] == "t-m1"
    assert sighting["subject"] == "After Pictures"
    assert sighting["sent_on"] == "2017-07-14"


def test_a_message_with_no_id_stores_nothing():
    """A file with no message behind it is a picture, not evidence."""
    orphan = _message("m1", [_part("after.jpg", "a1")])
    orphan["id"] = None
    result, written = _run([orphan], {"a1": b"x"})
    assert result["stored"] == []
    assert written == {}
    assert result["counts"]["no_provenance"] == 1


# ── Deduplication ────────────────────────────────────────────────────────────


def test_identical_bytes_are_stored_once_and_record_every_sighting():
    """One signature logo across three messages is one file, three sightings."""
    logo = b"the-same-logo-bytes"
    messages = [_message(f"m{i}", [_part("image001.png", f"a{i}", mime="image/png")]) for i in (1, 2, 3)]
    result, written = _run(messages, {"a1": logo, "a2": logo, "a3": logo})

    assert len(written) == 1, "identical content must be written once"
    assert len(result["stored"]) == 1
    assert len(result["stored"][0]["sightings"]) == 3
    assert result["counts"]["duplicates"] == 2


def test_two_different_photographs_with_the_same_name_are_both_kept():
    """
    The failure this guards against. A phone names every photograph
    IMG_0001.jpg; deduplicating by name loses one of two real jobsite photos.
    """
    messages = [
        _message("m1", [_part("IMG_0001.jpg", "a1")]),
        _message("m2", [_part("IMG_0001.jpg", "a2")]),
    ]
    result, written = _run(messages, {"a1": b"before-photo", "a2": b"after-photo"})
    assert len(written) == 2, "different bytes are different files, whatever they are called"
    assert len(result["stored"]) == 2
    assert len({r["digest"] for r in result["stored"]}) == 2


def test_a_resumed_run_does_not_refetch_what_is_already_held():
    logo = b"held-already"
    seen = {}
    first, _ = _run([_message("m1", [_part("a.png", "a1", mime="image/png")])], {"a1": logo}, seen=seen)
    assert first["counts"]["stored"] == 1

    second, written = _run([_message("m2", [_part("a.png", "a2", mime="image/png")])], {"a2": logo}, seen=seen)
    assert second["stored"] == [], "already held — nothing new to store"
    assert written == {}, "and nothing written a second time"
    assert second["counts"]["already_held"] == 1
    assert len(seen[hashlib.sha256(logo).hexdigest()]["sightings"]) == 2


# ── Failure is counted, never silent ─────────────────────────────────────────


def test_one_unfetchable_attachment_does_not_end_the_run():
    async def fetch(_t, _m, attachment_id):
        if attachment_id == "bad":
            raise RuntimeError("Gmail said no")
        return b"good-bytes"

    def write(digest, filename, data):
        return f"/store/{digest[:16]}-{filename}"

    messages = [
        _message("m1", [_part("broken.jpg", "bad")]),
        _message("m2", [_part("fine.jpg", "ok")]),
    ]
    result = asyncio.run(ma.harvest("token", messages, fetch=fetch, write=write))
    assert result["counts"]["failed"] == 1
    assert result["counts"]["stored"] == 1


def test_an_oversized_attachment_is_reported_rather_than_dropped_quietly():
    messages = [_message("m1", [_part("huge.mov", "a1", mime="video/quicktime", size=200 * 1024 * 1024)])]
    result, written = _run(messages, {"a1": b"x"}, max_bytes=1024)
    assert result["counts"]["too_large"] == 1
    assert written == {}


# ── The CRM rows ─────────────────────────────────────────────────────────────


def test_media_rows_carry_the_subject_so_a_photo_can_be_matched_to_its_job():
    """
    photo_email.py grades a jobsite email from its subject line. The file saved
    from that message inherits the subject, which is what lets it be matched to
    the graded record instead of being an anonymous image.
    """
    blobs = {"a1": b"photo"}
    subject = "KFC(195) 2722 S Main St, High Point NC (After Pictures)"
    result, _ = _run([_message("m1", [_part("after.jpg", "a1")], subject=subject)], blobs)
    (row,) = ma.media_rows(result["stored"])
    assert row["project_name"] == subject
    assert row["file_type"] == "image"
    assert row["file_size_bytes"] == len(b"photo")
    assert "sha256:" in row["tags"]


def test_a_file_seen_in_many_messages_says_so_on_its_row():
    logo = b"logo"
    messages = [_message(f"m{i}", [_part("image001.png", f"a{i}", mime="image/png")]) for i in range(1, 5)]
    result, _ = _run(messages, {f"a{i}": logo for i in range(1, 5)})
    (row,) = ma.media_rows(result["stored"])
    assert "seen-in-4-messages" in row["tags"]


def test_the_local_writer_keeps_two_same_named_files_apart(tmp_path):
    write = ma.local_writer(str(tmp_path))
    a = write("a" * 64, "IMG_0001.jpg", b"before")
    b = write("b" * 64, "IMG_0001.jpg", b"after")
    assert a != b
    assert Path(a).read_bytes() == b"before"
    assert Path(b).read_bytes() == b"after"
    assert Path(a).parent.name == "image"


def test_the_stored_tag_carries_the_full_digest_so_a_resume_can_match_it():
    """
    The resume path reads `sha256:` back out of the tag and compares it to the
    hash of freshly downloaded bytes. A truncated tag matches nothing, and the
    entire archive downloads again on every run — silently, and only visible as
    a bill.
    """
    blobs = {"a1": b"photo"}
    result, _ = _run([_message("m1", [_part("after.jpg", "a1")])], blobs)
    (row,) = ma.media_rows(result["stored"])
    tag = next(t for t in row["tags"].split(",") if t.startswith("sha256:"))
    assert tag.split(":", 1)[1] == hashlib.sha256(b"photo").hexdigest()
    assert len(tag.split(":", 1)[1]) == 64
