"""
photo_email.py — the subject line of a jobsite photo email is the job index.

WHAT THIS IS FOR
────────────────
When the crew sent progress photographs to KBP, they wrote the whole record
into the subject line before pressing send:

    KFC(369) 12721 Michigan Ave, Dearborn MI After/During Pictures w/ Final Invoice
    KFC(356) 8939 W Seven Mile Rd, Detroit MI Before Pics
    KFC(195) 2722 S Main St, High Point NC (After Pictures)
    KFC(149)10151 Hull street Rd, Midlothian VA Finished Pictures
    KFC #189 4623 W Market St, Greensboro NC Before Pictures

Store number, street, city, state, and which phase of the work the attachments
show. That is the link between a photograph and a job — written by the person
who took it, at the time, to the client. Nothing has to be inferred from a
coordinate, and nothing has to be dealt out by array slice.

WHY THE PHASE MATTERS MORE THAN ANYTHING ELSE HERE
──────────────────────────────────────────────────
A "Before Pictures" email is not evidence the work was done. It is evidence the
company was standing on the site with a camera before starting. Reading it as
completion would turn every job that was photographed and then cancelled into a
finished job — which is exactly the failure this system exists to prevent.

So the phase is parsed explicitly and graded:

    before                  -> listed     (we were there; nothing is claimed)
    during                  -> listed     (work in progress is not work finished)
    after / finished/final  -> completed
    ...with an invoice      -> invoiced

A subject carrying more than one phase ("During-After Pics", "Before/During")
grades on the STRONGEST phase present, because the attachments include it.

WHAT IT DOES NOT DO
───────────────────
It does not fetch attachments and it does not claim a photograph exists. It
reads a subject line. Whether the images are still attached to the message is a
separate question with a separate answer, and pretending otherwise would be the
same mistake as before.
"""

import re
from typing import Optional

from . import job_ledger

#: Phase words, longest first so "before/during" is not eaten by "before".
#: Each maps to what the attachments actually show.
BEFORE = "before"
DURING = "during"
AFTER = "after"

_PHASE_WORDS = (
    ("finished", AFTER),
    ("completed", AFTER),
    ("completion", AFTER),
    ("final", AFTER),
    ("after", AFTER),
    ("during", DURING),
    ("progress", DURING),
    ("before", BEFORE),
)

#: Evidence grade per phase. `before` and `during` deliberately land on
#: `listed`, not on anything stronger.
_PHASE_GRADE = {
    BEFORE: job_ledger.LISTED,
    DURING: job_ledger.LISTED,
    AFTER: job_ledger.COMPLETED,
}

_PHASE_RANK = {BEFORE: 0, DURING: 1, AFTER: 2}

#: "w/ Final Invoice", "with final invoice", "and invoice". An invoice named in
#: the subject of a photo mail is the invoice going out with the photographs.
_INVOICE = re.compile(r"\b(?:w/|with|and|\+)\s*(?:the\s+)?(?:final\s+)?invoice\b", re.I)

#: The trailing photo phrase, which must come off before the address is read or
#: "Pictures" ends up as the city. Covers "Before Pics", "(After Pictures)",
#: "During-After Pics", "After/During Pictures w/ Final Invoice".
_PHOTO_TAIL = re.compile(
    r"[\s(]*"
    r"(?:before|during|after|finished|final|completed|completion|progress)"
    r"(?:\s*[/&-]\s*(?:before|during|after|finished|final|completed|progress))*"
    r"\s*(?:pic|pics|picture|pictures|photo|photos)"
    r"[\s)]*"
    r"(?:\s*(?:w/|with|and|\+)\s*(?:the\s+)?(?:final\s+)?invoice)?"
    r"\s*$",
    re.I,
)

#: A trailing "Pictures" with no phase word in front of it. "KFC Alpharetta GA
#: Pictures" says a photograph exists and nothing about the work, but the word
#: still has to come off or it is read as part of the city.
_BARE_PHOTO_TAIL = re.compile(
    r"[\s(]*(?:pic|pics|picture|pictures|photo|photos)[\s)]*$", re.I
)

#: "Pictures of KFC Stockbridge" — the same noun, on the front.
_LEADING_PHOTO = re.compile(
    r"^\s*(?:pic|pics|picture|pictures|photo|photos)\s+of\s+", re.I
)

_LEADING_RE = re.compile(r"^\s*(?:fwd|re)\s*:\s*", re.I)
#: "KFC(369)", "KFC (142)", "KFC #189", or a bare brand at the front.
_LEADING_BRAND = re.compile(
    r"^\s*(KFC|Taco\s*Bell|Rite\s*Aid|Arby'?s|Pizza\s*Hut)\s*"
    r"(?:\(\s*\d{1,5}\s*\)|#\s*\d{1,5})?\s*",
    re.I,
)

_STATE = re.compile(r",?\s+([A-Z]{2})\s*$")
_STREET = re.compile(r"^\s*(\d+[A-Za-z]?\s+.+)$")


def _clean(text) -> str:
    return re.sub(r"\s+", " ", str(text or "")).strip()


def phases_in(subject: str) -> list[str]:
    """
    Every phase named in the subject, strongest last.

    "During-After Pics" -> ["during", "after"]. "Before Pics" -> ["before"].
    A subject with no phase word at all returns [] — "Pictures of KFC
    Stockbridge" says a photograph exists and says nothing about the work.
    """
    text = _clean(subject).lower()
    found: dict[str, None] = {}
    for word, phase in _PHASE_WORDS:
        if re.search(rf"\b{word}\b", text):
            found.setdefault(phase, None)
    return sorted(found, key=lambda p: _PHASE_RANK[p])


def names_an_invoice(subject: str) -> bool:
    """Whether the subject says an invoice went out with the photographs."""
    return bool(_INVOICE.search(_clean(subject)))


def grade_for(subject: str) -> Optional[str]:
    """
    What this subject line establishes, or None if it establishes nothing.

    `before` and `during` grade `listed` on purpose: standing on a site with a
    camera is not finishing the work, and a job photographed and then cancelled
    must not read as completed.
    """
    phases = phases_in(subject)
    if not phases:
        return None
    grade = _PHASE_GRADE[phases[-1]]
    if grade == job_ledger.COMPLETED and names_an_invoice(subject):
        return job_ledger.INVOICED
    return grade


def parse_photo_subject(subject: str) -> dict:
    """
    A jobsite photo subject to {store, address, city, state, phases, evidence}.

    Empty fields rather than guesses, throughout. "Pictures of KFC Stockbridge"
    yields a city and nothing else — there is no street in it, and inventing one
    is how a photograph ends up filed against an address the company never
    wrote down.
    """
    raw = _clean(subject)
    result = {
        "raw_subject": raw,
        "store": None,
        "address": None,
        "city": None,
        "state": None,
        "phases": phases_in(raw),
        "names_invoice": names_an_invoice(raw),
        "evidence": grade_for(raw),
    }
    if not raw:
        return result

    stores = job_ledger.store_numbers_in(raw)
    result["store"] = stores[0] if stores else None

    trimmed = _LEADING_RE.sub("", raw).strip()
    trimmed = _LEADING_PHOTO.sub("", trimmed).strip()
    # Take the photo phrase off the end first, or the address parse reads
    # "Pictures" as part of the city.
    trimmed = _PHOTO_TAIL.sub("", trimmed).strip().rstrip("-/&,").strip()
    trimmed = _BARE_PHOTO_TAIL.sub("", trimmed).strip().rstrip("-/&,").strip()
    # Then the brand and its store number off the front, leaving the location.
    trimmed = _LEADING_BRAND.sub("", trimmed).strip().lstrip(",").strip()

    state_match = _STATE.search(trimmed)
    if state_match:
        result["state"] = state_match.group(1).upper()
        remainder = trimmed[: state_match.start()].strip().rstrip(",").strip()
    else:
        remainder = trimmed

    if not remainder:
        return result

    if "," in remainder:
        street_part, city_part = remainder.rsplit(",", 1)
        street_part, city_part = street_part.strip(), city_part.strip()
    elif result["state"]:
        # No comma but a state was found, so what sits before the state is
        # "<street> <city>" run together: "2304 Maple Ave Burlington NC".
        # Only ONE trailing word is taken as the city — telling "Burlington"
        # from "High Point" needs a gazetteer, and a wrong city is worse than
        # a missing one.
        words = remainder.split()
        if len(words) < 2:
            street_part, city_part = "", remainder
        else:
            street_part, city_part = " ".join(words[:-1]), words[-1]
    else:
        # No comma and no state: "1010 Independence Blvd" is all street and no
        # city. Only a leading street NUMBER tells that from a bare place name.
        if _STREET.match(remainder):
            street_part, city_part = remainder, ""
        else:
            street_part, city_part = "", remainder

    street_match = _STREET.match(street_part) if street_part else None
    result["address"] = street_match.group(1).strip() if street_match else None
    result["city"] = city_part or None
    return result


def record_from(message: dict) -> Optional[dict]:
    """
    A ledger record from one photo email, or None if the subject grades nothing.

    `message` is the shape the Gmail reader already produces: at least
    `subject`, and optionally `id`, `date` and `attachments`.
    """
    subject = message.get("subject") or ""
    parsed = parse_photo_subject(subject)
    if parsed["evidence"] is None:
        return None

    message_id = message.get("id") or message.get("message_id")
    source = f"photo-email:{message_id}" if message_id else None

    return {
        "store_number": parsed["store"],
        "client": None,
        "program": None,
        "category": "commercial",
        "address": parsed["address"],
        "city": parsed["city"],
        "state": parsed["state"],
        "postal_code": None,
        "latitude": None,
        "longitude": None,
        "invoice_number": None,
        "date_submitted": None,
        "invoice_amount_cents": None,
        "job_total_cents": None,
        "amount_paid_cents": None,
        "paid_date": None,
        "check_number": None,
        "job_status": "/".join(parsed["phases"]) or None,
        "completed_on": None,
        "scope": None,
        "scope_source": source,
        "role": None,
        "role_source": None,
        "source_document": source,
        "outstanding_issues": None,
        # The subject verbatim. Anyone auditing this record can read exactly
        # what it was derived from without going back to the mailbox.
        "notes": parsed["raw_subject"][:2000] or None,
        "evidence": parsed["evidence"],
    }
