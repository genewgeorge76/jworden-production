"""
photo_archive.py — read where and when photographs were taken, from the
operator's cloud storage.

WHY DROPBOX AND NOT GOOGLE PHOTOS
─────────────────────────────────
Google Photos cannot answer the question. Its API returns, for a photograph:
width, height, creationTime, and a camera block of make, model, aperture,
exposure, ISO and focal length. There is no latitude, no longitude, no
location field of any kind — checked against Google's own discovery document,
not assumed. Enabling that API buys nothing here regardless of OAuth or the
2025 restrictions on third-party access.

Dropbox returns `media_info.metadata.location` with real coordinates and
`time_taken`, in the FILE LISTING. So the whole archive can be surveyed from
metadata alone, without downloading a single image — which matters when the
archive runs to thousands of photographs.

Microsoft Graph exposes the same thing for OneDrive via the `location` facet
and `photo.takenDateTime`. A second provider slots in beside this one; the
listing shape below is deliberately provider-neutral for that reason.

WHAT THIS DOES NOT DECIDE
─────────────────────────
Whether a coordinate is a jobsite. It cannot: personal photographs share these
accounts, and no coordinate distinguishes a customer's car park from a family
holiday. This produces clusters; a person confirms them. That review is what
makes every number derived from it defensible.
"""

from __future__ import annotations

import logging
import math
from datetime import datetime, timezone
from typing import Any, Iterable, Optional

import httpx

from . import runtime_config as _cfg

logger = logging.getLogger(__name__)

_LIST_URL = "https://api.dropboxapi.com/2/files/list_folder"
_CONTINUE_URL = "https://api.dropboxapi.com/2/files/list_folder/continue"

_IMAGE_SUFFIXES = (".jpg", ".jpeg", ".png", ".heic", ".heif", ".tif", ".tiff")

# Two photographs within this distance are treated as one place. A phone's fix
# drifts between shots, and a wider radius merges neighbouring properties on
# the same street — this is about the length of a large car park.
CLUSTER_RADIUS_MILES = 0.3

# Dropbox caps a page at 2000 entries; asking for more is an error rather than
# a larger page.
_PAGE_LIMIT = 2000

# A survey of a large archive should not run forever inside one request. The
# caller resumes with the returned cursor.
DEFAULT_MAX_PAGES = 20

EARTH_RADIUS_MILES = 3958.8


class ArchiveNotConfigured(RuntimeError):
    """No credential for this provider."""


def _token() -> str:
    return (_cfg.get("DROPBOX_ACCESS_TOKEN") or "").strip()


def configured() -> bool:
    return bool(_token())


def distance_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    )
    return 2 * EARTH_RADIUS_MILES * math.asin(math.sqrt(a))


def _parse_time(raw: Any) -> Optional[datetime]:
    if not raw:
        return None
    try:
        return datetime.fromisoformat(str(raw).replace("Z", "+00:00"))
    except ValueError:
        return None


def _photo_from_entry(entry: dict) -> Optional[dict]:
    """
    One listing entry to a photograph with a place and a time, or None.

    Dropbox nests this three deep and uses a tagged union, so an entry without
    location looks structurally identical to one with it until the last step.
    Anything missing a coordinate is dropped here rather than carried forward
    as a null island at (0, 0) — which is a real place in the Atlantic and
    would cluster every unlocated photo into one phantom jobsite.
    """
    if entry.get(".tag") != "file":
        return None

    path = entry.get("path_display") or entry.get("path_lower") or ""
    if not path.lower().endswith(_IMAGE_SUFFIXES):
        return None

    media = (entry.get("media_info") or {}).get("metadata") or {}
    photo = media.get("dimensions") is not None or media.get(".tag") == "photo"
    if not photo and media.get(".tag") not in {"photo", "video"}:
        return None

    location = media.get("location") or {}
    lat = location.get("latitude")
    lon = location.get("longitude")
    if lat is None or lon is None:
        return None
    try:
        lat = float(lat)
        lon = float(lon)
    except (TypeError, ValueError):
        return None

    return {
        "path": path,
        "name": entry.get("name") or path.rsplit("/", 1)[-1],
        "lat": lat,
        "lon": lon,
        "taken_at": _parse_time(media.get("time_taken")) or _parse_time(entry.get("client_modified")),
    }


async def scan(
    *,
    folder: str = "",
    cursor: Optional[str] = None,
    max_pages: int = DEFAULT_MAX_PAGES,
    timeout_seconds: float = 30.0,
) -> dict[str, Any]:
    """
    Walk the archive and return every photograph that carries a coordinate.

    `include_media_info` is what makes this cheap: Dropbox returns the location
    and capture time in the listing, so nothing is downloaded. Resume a large
    archive with the returned cursor.
    """
    token = _token()
    if not token:
        raise ArchiveNotConfigured(
            "DROPBOX_ACCESS_TOKEN is not set, so the archive cannot be read."
        )

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    photos: list[dict] = []
    scanned = 0
    pages = 0

    async with httpx.AsyncClient(timeout=timeout_seconds) as client:
        while pages < max_pages:
            if cursor:
                response = await client.post(_CONTINUE_URL, headers=headers, json={"cursor": cursor})
            else:
                response = await client.post(
                    _LIST_URL,
                    headers=headers,
                    json={
                        "path": folder or "",
                        "recursive": True,
                        "include_media_info": True,
                        "limit": _PAGE_LIMIT,
                    },
                )

            if response.status_code == 401:
                raise ArchiveNotConfigured("Dropbox rejected the token.")
            if response.status_code >= 400:
                logger.error("Dropbox listing failed: HTTP %s", response.status_code)
                return {
                    "ok": False,
                    "error": f"Dropbox returned HTTP {response.status_code}",
                    "photos": photos,
                    "scanned": scanned,
                    "cursor": cursor,
                    "has_more": bool(cursor),
                }

            body = response.json()
            entries = body.get("entries") or []
            scanned += len(entries)
            for entry in entries:
                found = _photo_from_entry(entry)
                if found:
                    photos.append(found)

            pages += 1
            cursor = body.get("cursor")
            if not body.get("has_more"):
                return {
                    "ok": True,
                    "photos": photos,
                    "scanned": scanned,
                    "cursor": None,
                    "has_more": False,
                }

    return {
        "ok": True,
        "photos": photos,
        "scanned": scanned,
        "cursor": cursor,
        "has_more": True,
    }


def cluster(photos: Iterable[dict], *, radius_miles: float = CLUSTER_RADIUS_MILES) -> list[dict]:
    """
    Group photographs into places.

    Clustered on the coordinates themselves, never on folder or file names.
    That is not a stylistic choice: in this repository 118 of 158 geotagged
    images share one coordinate while sitting in folders named for six
    different cities. Names record what someone meant to file; coordinates
    record where the camera was.
    """
    clusters: list[dict] = []

    for photo in photos:
        for existing in clusters:
            if distance_miles(existing["lat"], existing["lon"], photo["lat"], photo["lon"]) <= radius_miles:
                existing["photo_count"] += 1
                existing["_paths"].append(photo["path"])
                taken = photo.get("taken_at")
                if taken:
                    if not existing["first_seen"] or taken < existing["first_seen"]:
                        existing["first_seen"] = taken
                    if not existing["last_seen"] or taken > existing["last_seen"]:
                        existing["last_seen"] = taken
                break
        else:
            clusters.append(
                {
                    # Rounded to five places, about a metre. The centre is the
                    # first photograph's fix rather than a running mean: a mean
                    # drifts as photographs are added and the cluster would
                    # stop matching itself on a later scan.
                    "lat": round(photo["lat"], 5),
                    "lon": round(photo["lon"], 5),
                    "photo_count": 1,
                    "first_seen": photo.get("taken_at"),
                    "last_seen": photo.get("taken_at"),
                    "_paths": [photo["path"]],
                }
            )

    for entry in clusters:
        # A handful of paths, so a reviewer can go and look. Not all of them:
        # a cluster can hold hundreds and the list is for recognition, not
        # completeness.
        entry["sample_paths"] = entry.pop("_paths")[:8]

    clusters.sort(key=lambda c: -c["photo_count"])
    return clusters


def utcnow() -> datetime:
    return datetime.now(timezone.utc)
