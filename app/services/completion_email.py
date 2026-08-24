"""
completion_email.py — a dated email to the client, read as evidence.

WHY THIS IS WORTH A MODULE
──────────────────────────
On 21 April 2017 seven emails went from this company to KBP's facilities
director, one per site, subjects reading "190 Route 46 Rockaway NJ",
"92 St George's Ave, Rahway NJ", "688 Lyons Ave, Irvington NJ". Two weeks
later: "KFC Hackettstown NJ Finished Pictures".

The invoice tracker's NJ tab records two invoiced jobs. The mailbox shows nine
New Jersey sites. Neither source is wrong — the tracker is a billing document
and it was not kept current, and the email archive has no money in it. Read
together they cover more than either does alone, which is the whole reason to
read the mail at all.

WHAT AN EMAIL ACTUALLY PROVES
─────────────────────────────
Two different things, and they are not the same strength:

  A dated message from us to the client naming a site proves CONTACT about
  that site on that date. It does not prove the work was finished. It grades
  `listed` and waits for a person, exactly like a photograph's coordinate.

  A message whose subject says the work is finished — "Finished Pictures",
  "completed", "final pictures" — is a contemporaneous claim of performance,
  made to the client, on a date, which the client did not dispute. That is
  what `completed` means here.

Nothing is inferred from an attachment count, a recipient, or a hunch. If the
subject does not say the work was done, this does not say it either.

ADDRESSES ARE PARSED, NOT GUESSED
─────────────────────────────────
"92 St George's Ave, Rahway NJ" parses. "KFC Waco N Loop Store" does not — it
names a city and a road and no street number, and inventing one would put a
fabricated address on a public page, which is the exact failure this codebase
has already had once. Unparseable subjects keep the raw text and set no
address at all.
"""

import re
from datetime import datetime, timezone
from typing import Any, Iterable, Optional

from . import job_ledger

# Subject words that assert the work is finished. Deliberately short: each one
# is an unambiguous claim of completion, not a hint.
_COMPLETION_MARKERS = (
    "finished picture",
    "finished pictures",
    "final picture",
    "completed picture",
    "completion picture",
    "after picture",
    "job complete",
    "job completed",
    "work complete",
    "work completed",
    "punch complete",
    "completed",
    "finished",
)

# Words that mean the opposite, and which contain a completion marker inside
# them often enough to matter. "not finished" and "before completion" must
# never read as done.
_NEGATIONS = ("not finished", "not complete", "before complete", "prior to complet", "incomplete")

_STATE = re.compile(r",?\s+([A-Z]{2})\s*$")
# A street line starts with a number: "190 Route 46", "92 St George's Ave",
# "1055 Route 1 South". A subject with no leading number has no street in it.
_STREET = re.compile(r"^\s*(\d+[A-Za-z]?\s+.+)$")


def _clean(text: Any) -> str:
    return re.sub(r"\s+", " ", str(text or "")).strip()


def says_completed(subject: str, body: str = "") -> bool:
    """Whether the message asserts, in words, that the work was finished."""
    text = f"{_clean(subject)} {_clean(body)}".lower()
    if any(negation in text for negation in _NEGATIONS):
        return False
    return any(marker in text for marker in _COMPLETION_MARKERS)


def parse_site(subject: str) -> dict:
    """
    A subject line to whatever of {address, city, state} it actually contains.

    Returns empty fields rather than guesses. "KFC Waco N Loop Store" names a
    city and a road with no street number; producing "N Loop, Waco TX" from it
    would be an address this company never wrote down.
    """
    raw = _clean(subject)
    # Strip a trailing completion phrase so it is not read as part of the city:
    # "KFC Hackettstown NJ Finished Pictures" -> "KFC Hackettstown NJ".
    trimmed = re.sub(
        r"\s+(finished|final|completed|completion|after)\s+pictures?\s*$", "", raw, flags=re.I
    )
    trimmed = re.sub(r"^\s*(fwd|re)\s*:\s*", "", trimmed, flags=re.I).strip()

    result = {"address": None, "city": None, "state": None, "raw_subject": raw}

    state_match = _STATE.search(trimmed)
    if not state_match:
        return result
    result["state"] = state_match.group(1)
    remainder = trimmed[: state_match.start()].strip().rstrip(",").strip()

    # "185 Ridgedale Ave, Florham Park" — the comma separates street from city.
    if "," in remainder:
        street_part, city_part = remainder.rsplit(",", 1)
        street_part, city_part = street_part.strip(), city_part.strip()
    else:
        # "190 Route 46 Rockaway" — no comma. The city is the trailing word or
        # two, and there is no reliable way to tell "Rockaway" from "North
        # Brunswick" without a gazetteer, so only a single trailing word is
        # taken. A wrong city is worse than a missing one.
        words = remainder.split()
        if len(words) < 2:
            return result
        street_part, city_part = " ".join(words[:-1]), words[-1]

    street_match = _STREET.match(street_part)
    result["address"] = street_match.group(1).strip() if street_match else None
    result["city"] = city_part or None
    if result["address"] is None and street_part:
        # No street number: the leading text is a brand or a descriptor, not an
        # address. Keep the city and state, drop the rest.
        result["city"] = city_part or None
    return result


def _to_datetime(value: Any) -> Optional[datetime]:
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    text = _clean(value)
    if not text:
        return None
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError:
        return None


def read_messages(
    messages: Iterable[dict],
    *,
    client: Optional[str] = None,
    program: Optional[str] = None,
    our_addresses: Iterable[str] = (),
) -> list[dict]:
    """
    Dated messages to ledger records.

    Each message is {subject, date, sender, to, body, thread_id}. Only messages
    sent BY this company are read: an email from the client to us is their
    request, not our record of performance, and the two grade at opposite ends.
    """
    ours = {a.strip().lower() for a in our_addresses if a and a.strip()}
    records: list[dict] = []

    for message in messages:
        sender = _clean(message.get("sender")).lower()
        if ours and sender not in ours:
            continue

        subject = _clean(message.get("subject"))
        body = _clean(message.get("body"))
        site = parse_site(subject)
        stores = job_ledger.store_numbers_in(f"{subject} {body}")
        if not site["state"] and not site["city"] and not stores:
            # Nothing identifies a place. An email that cannot be tied to a
            # site is not a record of one.
            continue

        completed = says_completed(subject, body)
        thread = _clean(message.get("thread_id")) or None

        records.append(
            {
                "store_number": stores[0] if stores else None,
                "client": client,
                "program": program,
                "category": None,
                "address": site["address"],
                "city": site["city"],
                "state": site["state"],
                "postal_code": None,
                "invoice_number": None,
                "date_submitted": None,
                "invoice_amount_cents": None,
                "job_total_cents": None,
                "amount_paid_cents": None,
                "paid_date": None,
                "check_number": None,
                "job_status": None,
                # The thread id, so a claim on a public page can be walked back
                # to the message it came from years later.
                "source_document": f"gmail:{thread}" if thread else None,
                "outstanding_issues": None,
                "notes": site["raw_subject"],
                "completed_on": _to_datetime(message.get("date")) if completed else None,
                "evidence": job_ledger.COMPLETED if completed else job_ledger.LISTED,
            }
        )

    return records
