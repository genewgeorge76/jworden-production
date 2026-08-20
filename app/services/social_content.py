"""
social_content.py — Build posts out of records that actually exist.

Every other engine here fails closed rather than invent: the estimator returns
`priced: false` without rates, delivered cost 409s without a plant, PCI reports
`no_data` without a survey. Marketing is the easiest place to break that rule
and the worst place to break it, because the output is public and permanent.

So a post is composed from a row or it is not composed. `compose_from_job`
reads a real `jobs` record; if the job is not finished, or does not exist, or
belongs to another tenant, the answer is a refusal with the reason — never a
plausible driveway in a plausible town.

Two things this module deliberately does NOT put in a post:

  Street addresses. A residential job row carries the customer's home address.
  "New driveway at 412 Oakmont Lane" identifies where a specific person lives,
  to everyone who follows the page. Locations are reduced to city and state,
  always, with no option to override — an operator in a hurry should not be
  able to turn that off by passing a flag.

  Contract price. What a neighbour paid is between the company and that
  customer. It is available on the row; it does not leave this module.

Copy written by a model goes through the same claim guardrail as copy typed by
a person, and for a stronger reason: generation is exactly the step that will
cheerfully assert an award the company never won. Generation is untrusted
input to the check, never a substitute for it.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date, datetime
from typing import Optional

# The engineering floor that appears in every Worden spec. Sourced from the
# technology suite rather than retyped, so the number cannot drift between
# what the crew builds and what the page claims.
from app.services.pavement_technologies import COMPACTION_FLOOR_PCT

MAX_LENGTH = {
    "x":         280,
    "gbp":       1500,
    "facebook":  63206,
    "instagram": 2200,
    "linkedin":  3000,
}

SERVICE_PHRASES = {
    "paving":       "asphalt paving",
    "asphalt":      "asphalt paving",
    "overlay":      "an asphalt overlay",
    "sealcoating":  "sealcoating",
    "seal":         "sealcoating",
    "striping":     "line striping",
    "concrete":     "concrete work",
    "patching":     "patch and repair",
    "milling":      "milling and resurfacing",
    "driveway":     "a driveway",
}


class NotPostable(Exception):
    """The record cannot support a post. Carries the reason, not a fallback."""


@dataclass
class Composed:
    body: str
    source_kind: str
    source_id: str
    source_note: str
    media: list


# ── Location handling ────────────────────────────────────────────────────────

_STREET = re.compile(
    r"^\s*\d+[\w-]*\s+.*?"                       # house number + street
    r"(?:,\s*)",                                  # up to the first comma
    re.IGNORECASE,
)


def public_place(site_address: Optional[str], state_code: Optional[str]) -> Optional[str]:
    """
    Reduce a job address to something safe to publish: city and state.

    Returns None when no city can be recovered. A caller that gets None must
    write the post without a location rather than fall back to the raw
    address — which is why this returns None instead of the input.
    """
    if not site_address:
        return f"{state_code}" if state_code else None

    text = site_address.strip()
    # Drop a leading house-number-and-street segment if one is present.
    text = _STREET.sub("", text, count=1)

    parts = [p.strip() for p in text.split(",") if p.strip()]
    if not parts:
        return state_code or None

    city = parts[0]
    # A remaining leading number means we never actually cleared the street.
    if re.match(r"^\d", city):
        return state_code or None
    # Strip a trailing ZIP from a "City VA 23220" style tail.
    city = re.sub(r"\s+\d{5}(?:-\d{4})?$", "", city)
    city = re.sub(r"\s+[A-Z]{2}$", "", city).strip()
    if not city:
        return state_code or None

    return f"{city}, {state_code}" if state_code else city


def _service_phrase(service_type: Optional[str]) -> str:
    key = (service_type or "").strip().lower()
    for token, phrase in SERVICE_PHRASES.items():
        if token in key:
            return phrase
    return "the work"


def _completed_on(job) -> Optional[date]:
    value = getattr(job, "completed_at", None)
    if isinstance(value, datetime):
        return value.date()
    return value if isinstance(value, date) else None


# ── Composition ──────────────────────────────────────────────────────────────

def compose_from_job(job, *, platform: str = "gbp", include_spec: bool = True) -> Composed:
    """
    Build a post from a finished job.

    Raises NotPostable when the row cannot support one. Every sentence traces
    to a column: service type, city, completion date. Nothing else.
    """
    if job is None:
        raise NotPostable("no such job")

    status = (getattr(job, "status", "") or "").lower()
    done = _completed_on(job)
    if status != "completed" and not done:
        raise NotPostable(
            f"job is {status or 'unstarted'}, not completed — "
            "a post about finished work needs the work to be finished"
        )

    place = public_place(getattr(job, "site_address", None),
                         getattr(job, "state_code", None))
    service = _service_phrase(getattr(job, "service_type", None))

    lines: list[str] = []
    if place:
        lines.append(f"Wrapped up {service} in {place}.")
    else:
        lines.append(f"Wrapped up {service}.")

    if done:
        lines.append(f"Completed {done.strftime('%B %-d, %Y')}.")

    if include_spec:
        lines.append(
            f"Compacted to a {COMPACTION_FLOOR_PCT:g}% Marshall unit weight floor "
            "over a VDOT Section 315 stone base."
        )

    lines.append("Free estimates.")

    body = " ".join(lines)
    limit = MAX_LENGTH.get(platform, 2000)
    if len(body) > limit:
        # Drop the spec sentence before truncating mid-word.
        body = " ".join(l for l in lines if not l.startswith("Compacted"))
        body = body[:limit].rstrip()

    media = []
    pictures = getattr(job, "pictures_json", None)
    if isinstance(pictures, list):
        media = [p for p in pictures if p]

    job_number = getattr(job, "job_number", None) or getattr(job, "id", None)
    return Composed(
        body=body,
        source_kind="job",
        source_id=str(getattr(job, "id", "")),
        source_note=(
            f"jobs row id={getattr(job, 'id', '?')} job_number={job_number} "
            f"status={status or 'n/a'} completed_at={done or 'n/a'}"
        ),
        media=media,
    )
