"""
media_store.py — where a jobsite photograph actually lives.

THE PROBLEM WITH THE LOCAL WRITER
─────────────────────────────────
`mailbox_attachments.local_writer` puts files on disk, and the disk it puts
them on belongs to an ephemeral container. Every photograph pulled out of a
mailbox by that path is gone the moment the container is reclaimed. That is
fine for a test and useless for the thing this was built to do, which is to get
eight years of jobsite photographs somewhere they survive.

Supabase Storage is that somewhere, and it is the same reasoning that put the
customer register in a file rather than a database: the artefact has to outlive
the process that made it.

TWO BUCKETS, AND WHY THE BOUNDARY IS NOT A FORMALITY
────────────────────────────────────────────────────
    media-intake    PRIVATE. Everything lands here. Service role only — no
                    anonymous read, no authenticated read.
    jobsite-photos  PUBLIC. Only what a person has looked at and graded.

A photograph pulled out of a mailbox has not been seen by anybody. It may show
a customer's house, a vehicle plate, a person who never agreed to be on a
website, or a job that was never finished. Landing everything straight into a
public bucket publishes all of that the moment it arrives — and the archive
being mined here is a decade of a family business's mail, which the owner has
already flagged contains personal photographs alongside the work.

So promotion is a separate, deliberate act. `promote()` exists; nothing calls
it automatically, and nothing in this module infers that a file is publishable
from its name, its size, or the folder it arrived in.

DEDUPLICATION CARRIES OVER
──────────────────────────
Object keys are `<sha256[:16]>-<safe filename>`, the same scheme the local
writer uses, so a run that previously wrote to disk and a run that writes here
agree on what is already held. The digest prefix is also the collision guard:
two different photographs both called IMG_0001.jpg get different keys instead
of one overwriting the other.
"""

import logging
import os
from typing import Any, Callable, Optional
from urllib.parse import quote

import httpx

logger = logging.getLogger(__name__)

INTAKE_BUCKET = "media-intake"
PUBLIC_BUCKET = "jobsite-photos"

#: Extensions the public bucket accepts. Deliberately narrower than intake:
#: a PDF or a HEIC has no business being served to a browser as page content.
PUBLISHABLE_TYPES = {"image/jpeg", "image/png", "image/webp"}


class MediaStoreNotConfigured(RuntimeError):
    """No project URL, or no service key to write with."""


def _project_url() -> str:
    url = (os.environ.get("SUPABASE_URL") or "").strip().rstrip("/")
    if not url:
        raise MediaStoreNotConfigured("SUPABASE_URL is not set")
    return url


def _service_key() -> str:
    """
    The SERVICE key, not the publishable one.

    Both buckets' write policies are scoped to `service_role`, so a publishable
    key cannot write to either — which is the point. This value must never
    reach the browser bundle; it lives in server environment only.
    """
    key = (os.environ.get("SUPABASE_SERVICE_KEY") or "").strip()
    if not key:
        raise MediaStoreNotConfigured("SUPABASE_SERVICE_KEY is not set")
    return key


def object_key(digest: str, filename: str) -> str:
    """`<digest[:16]>-<filename>`. Same scheme as the local writer."""
    return f"{digest[:16]}-{filename}"


def _headers(content_type: Optional[str] = None, *, upsert: bool = False) -> dict:
    headers = {"Authorization": f"Bearer {_service_key()}"}
    if content_type:
        headers["Content-Type"] = content_type
    # Off by default. An upload that would overwrite an existing object means
    # two different files hashed the same, which cannot happen, or the same
    # file arriving twice, which is a no-op worth knowing about rather than
    # silently repeating.
    headers["x-upsert"] = "true" if upsert else "false"
    return headers


def put(
    bucket: str,
    key: str,
    data: bytes,
    *,
    content_type: Optional[str] = None,
    upsert: bool = False,
    timeout_seconds: float = 120.0,
) -> str:
    """Upload one object. Returns the storage path. Raises on failure."""
    url = f"{_project_url()}/storage/v1/object/{bucket}/{quote(key)}"
    response = httpx.post(
        url, content=data, headers=_headers(content_type, upsert=upsert), timeout=timeout_seconds
    )
    if response.status_code == 409 and not upsert:
        # Already held. Not an error — the digest matched, so the bytes match.
        logger.info("%s/%s already present, not re-uploaded", bucket, key)
        return f"{bucket}/{key}"
    if response.status_code >= 400:
        raise RuntimeError(f"upload to {bucket}/{key} failed: HTTP {response.status_code} {response.text[:200]}")
    return f"{bucket}/{key}"


def public_url(key: str) -> str:
    """The URL a page uses. Only meaningful for the public bucket."""
    return f"{_project_url()}/storage/v1/object/public/{PUBLIC_BUCKET}/{quote(key)}"


def intake_writer(*, upsert: bool = False) -> Callable:
    """
    A `write(digest, filename, data)` for mailbox_attachments.harvest.

    Drop-in replacement for `local_writer`: same signature, same key scheme, so
    switching between them changes where files go and nothing else.
    """
    def write(digest: str, filename: str, data: bytes) -> str:
        key = object_key(digest, filename)
        return put(INTAKE_BUCKET, key, data, upsert=upsert)

    return write


def promote(key: str, data: bytes, content_type: str, *, upsert: bool = False) -> str:
    """
    Move one graded photograph from intake to the public bucket.

    Called by a person, or by code a person ran, having decided this specific
    file may be published. NOTHING in this module calls it on its own, and the
    absence of an automatic path is the safeguard rather than an oversight —
    there is no filename, size or folder that makes an unreviewed photograph
    safe to publish.
    """
    if content_type not in PUBLISHABLE_TYPES:
        raise ValueError(
            f"{content_type} is not servable as page content. "
            f"The public bucket takes {', '.join(sorted(PUBLISHABLE_TYPES))}."
        )
    put(PUBLIC_BUCKET, key, data, content_type=content_type, upsert=upsert)
    return public_url(key)


def configured() -> bool:
    """Whether uploads can happen at all, without raising to find out."""
    return bool((os.environ.get("SUPABASE_URL") or "").strip()) and bool(
        (os.environ.get("SUPABASE_SERVICE_KEY") or "").strip()
    )


def describe() -> dict[str, Any]:
    """What the cockpit shows about media storage. Never returns the key."""
    return {
        "configured": configured(),
        "intake_bucket": INTAKE_BUCKET,
        "public_bucket": PUBLIC_BUCKET,
        "publishable_types": sorted(PUBLISHABLE_TYPES),
        "note": (
            "Intake is private and takes everything. Promotion to the public "
            "bucket is a deliberate act, never automatic."
        ),
    }
