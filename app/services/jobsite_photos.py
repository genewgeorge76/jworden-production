"""jobsite_photos.py — turn a Google Photos export into per-site evidence.

WHY THIS EXISTS, AND WHAT IT REFUSES TO DO
──────────────────────────────────────────
georgiaStores.py records 146 KFC/KBP invoices worth $4,082,440.23 and notes
that not one of them names a store or a city. That is why individual stores
cannot be graded `completed`: no invoice can be tied to any particular site.

The owner reports that every invoice had photographs, held in Google Photos.
If those photographs carry location data, they solve the problem — but NOT by
the route that first suggests itself.

The tempting move is to match a photograph to an invoice because they share a
date. That is forbidden here and the code refuses it. A crew can work three
sites in a day and invoice none of them that week; same-day is not same-job,
and a match made on date proximity is a fabricated link dressed as a finding.
texasProgram.js and carolinaBlacktopRecord.js both carry the scar of counting
documents that merely looked related.

The route that does work needs no invoice at all. A geotagged photograph is a
camera at a coordinate on a date. That is a first-hand record of presence, and
where the subject is finished asphalt it is a record of completed work at a
named place. It stands on its own, and it is stronger than an invoice, which
only proves somebody was billed.

So this module answers "where was the crew, and when", and stops there.
Attaching a site to a client, a store number or a dollar figure is a separate
act requiring a separate document.

WHY THE SIDECAR IS READ BEFORE THE EXIF
───────────────────────────────────────
Google Photos re-encodes uploads made in "Storage saver" and the EXIF block
does not always survive. Takeout ships a JSON sidecar next to every file —
`photo.jpg.json`, or `photo.jpg.supplemental-metadata.json` in newer exports —
carrying `photoTakenTime` and `geoData` regardless of what happened to the
embedded tags. The sidecar is therefore primary and EXIF is the fallback, which
is the opposite of the usual instinct.

THE ZERO-ISLAND TRAP
────────────────────
Takeout writes `geoData: {latitude: 0.0, longitude: 0.0}` when a photograph has
no location. Read literally that is a point in the Gulf of Guinea, and a
clustering pass will happily group every un-located photograph in the archive
into one confident jobsite off the coast of Africa. Exactly (0, 0) is treated
as absent.
"""

from __future__ import annotations

import json
import math
import os
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Iterable, Iterator, Optional

try:
    from PIL import Image
    from PIL.ExifTags import GPSTAGS, TAGS
except ImportError:  # pragma: no cover - PIL is present in this environment
    Image = None

#: Photographs within this many metres are treated as one jobsite. A parking
#: lot is tens of metres across and consumer GPS drifts by a similar amount, so
#: a tighter radius splits one lot into several sites and a looser one merges
#: neighbouring businesses in the same retail strip.
SITE_RADIUS_M = 75.0

#: Exactly (0, 0) means "no location recorded". See the module docstring.
NULL_ISLAND = (0.0, 0.0)

IMAGE_SUFFIXES = (".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp")

#: Rough state boxes, used only to say which state a coordinate falls in
#: without a network call or an API key.
#:
#: THESE OVERLAP, AND THAT IS HANDLED RATHER THAN IGNORED
#: State borders are not rectangles, so the boxes for neighbours overlap badly.
#: Lancaster, South Carolina — the W Meeting Street job in
#: carolinaBlacktopRecord.js — falls inside both the NC and the SC box. A
#: lookup that returned the first match would file a real South Carolina job
#: under North Carolina and never say so.
#:
#: So `state_for` returns a state only when exactly ONE box contains the point,
#: and None when several do. `states_for` exposes the candidates. An ambiguous
#: coordinate is reported as ambiguous; it is never resolved by dictionary
#: order. joist_import.py takes the same line with AMBIGUOUS_CITIES, for the
#: same reason: a plausible wrong answer is worse than an admitted unknown.
STATE_BOXES = {
    "VA": (36.54, 39.47, -83.68, -75.24),
    "NC": (33.84, 36.59, -84.32, -75.46),
    "SC": (32.03, 35.22, -83.35, -78.54),
    "GA": (30.36, 35.00, -85.61, -80.84),
    "FL": (24.40, 31.00, -87.63, -80.03),
    "TX": (25.84, 36.50, -106.65, -93.51),
    "TN": (34.98, 36.68, -90.31, -81.65),
    "MD": (37.91, 39.72, -79.49, -75.05),
    "MN": (43.50, 49.38, -97.24, -89.49),
    "IL": (36.97, 42.51, -91.51, -87.02),
    "MI": (41.70, 48.31, -90.42, -82.41),
    "MO": (35.99, 40.61, -95.77, -89.10),
    "KS": (36.99, 40.00, -102.05, -94.59),
    "NJ": (38.93, 41.36, -75.56, -73.89),
    "NY": (40.50, 45.02, -79.76, -71.86),
    "AL": (30.22, 35.01, -88.47, -84.89),
    "LA": (28.93, 33.02, -94.04, -88.76),
    "OH": (38.40, 41.98, -84.82, -80.52),
    "IA": (40.38, 43.50, -96.64, -90.14),
}


@dataclass
class Photo:
    """One photograph, reduced to what can be used as evidence."""

    path: str
    taken: Optional[datetime]
    lat: Optional[float]
    lon: Optional[float]
    source: str  # "sidecar" or "exif" — which one supplied the location

    @property
    def located(self) -> bool:
        return self.lat is not None and self.lon is not None


@dataclass
class Site:
    """A cluster of photographs taken in one place."""

    lat: float
    lon: float
    photos: list = field(default_factory=list)

    @property
    def state(self) -> Optional[str]:
        """The state, or None where the boxes cannot tell. See `states_for`."""
        return state_for(self.lat, self.lon)

    @property
    def candidate_states(self) -> list:
        """Every state this site might be in. Length > 1 means a border."""
        return states_for(self.lat, self.lon)

    @property
    def first_seen(self) -> Optional[datetime]:
        dates = [p.taken for p in self.photos if p.taken]
        return min(dates) if dates else None

    @property
    def last_seen(self) -> Optional[datetime]:
        dates = [p.taken for p in self.photos if p.taken]
        return max(dates) if dates else None

    @property
    def visits(self) -> int:
        """Distinct calendar days on which photographs were taken here.

        A single visit produces a burst of frames. Distinct days is the honest
        measure of how often a crew was present, and a site photographed on
        several separate days is a stronger record than one photographed once.
        """
        return len({p.taken.date() for p in self.photos if p.taken})


def states_for(lat: float, lon: float) -> list:
    """Every state box containing this point. More than one means a border."""
    return sorted(
        code
        for code, (south, north, west, east) in STATE_BOXES.items()
        if south <= lat <= north and west <= lon <= east
    )


def state_for(lat: float, lon: float) -> Optional[str]:
    """The state, when a rectangle can actually tell. None when it cannot.

    Returns None both for a point outside every box and for one inside several
    — the two are different unknowns, and `states_for` distinguishes them.
    Resolving a border coordinate needs real polygons or a geocoder, and
    guessing between neighbours would put real jobs in the wrong state.
    """
    hits = states_for(lat, lon)
    return hits[0] if len(hits) == 1 else None


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in metres."""
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _clean_coords(lat, lon) -> tuple:
    """Reject the zero island and anything outside the possible range."""
    try:
        lat, lon = float(lat), float(lon)
    except (TypeError, ValueError):
        return (None, None)
    if (lat, lon) == NULL_ISLAND:
        return (None, None)
    if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lon <= 180.0):
        return (None, None)
    return (lat, lon)


def sidecar_for(path: str) -> Optional[str]:
    """Find the Takeout JSON beside a photograph, across export vintages."""
    candidates = [
        path + ".json",
        path + ".supplemental-metadata.json",
        os.path.splitext(path)[0] + ".json",
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return None


def read_sidecar(path: str) -> tuple:
    """(taken, lat, lon) from a Takeout sidecar. Primary source — see docstring."""
    try:
        with open(path, "r", encoding="utf-8") as fh:
            meta = json.load(fh)
    except (OSError, json.JSONDecodeError):
        return (None, None, None)

    taken = None
    ts = (meta.get("photoTakenTime") or {}).get("timestamp")
    if ts is not None:
        try:
            taken = datetime.fromtimestamp(int(ts), tz=timezone.utc)
        except (TypeError, ValueError, OSError):
            taken = None

    # geoDataExif is the camera's own reading; geoData may have been edited by
    # the user in the Photos UI. Prefer the camera.
    lat = lon = None
    for key in ("geoDataExif", "geoData"):
        block = meta.get(key) or {}
        lat, lon = _clean_coords(block.get("latitude"), block.get("longitude"))
        if lat is not None:
            break

    return (taken, lat, lon)


def _dms_to_deg(value) -> Optional[float]:
    try:
        d, m, s = (float(x) for x in value)
    except (TypeError, ValueError):
        return None
    return d + m / 60.0 + s / 3600.0


def read_exif(path: str) -> tuple:
    """(taken, lat, lon) from embedded EXIF. Fallback only."""
    if Image is None:
        return (None, None, None)
    try:
        with Image.open(path) as img:
            raw = img._getexif() or {}
    except Exception:
        return (None, None, None)

    tags = {TAGS.get(k, k): v for k, v in raw.items()}

    taken = None
    stamp = tags.get("DateTimeOriginal") or tags.get("DateTime")
    if stamp:
        try:
            taken = datetime.strptime(str(stamp), "%Y:%m:%d %H:%M:%S").replace(tzinfo=timezone.utc)
        except ValueError:
            taken = None

    gps = {GPSTAGS.get(k, k): v for k, v in (tags.get("GPSInfo") or {}).items()}
    lat = _dms_to_deg(gps.get("GPSLatitude"))
    lon = _dms_to_deg(gps.get("GPSLongitude"))
    if lat is not None and str(gps.get("GPSLatitudeRef", "N")).upper() != "N":
        lat = -lat
    if lon is not None and str(gps.get("GPSLongitudeRef", "E")).upper() != "E":
        lon = -lon
    lat, lon = _clean_coords(lat, lon)
    return (taken, lat, lon)


def read_photo(path: str) -> Photo:
    """Read one photograph, sidecar first and EXIF second."""
    sidecar = sidecar_for(path)
    if sidecar:
        taken, lat, lon = read_sidecar(sidecar)
        if lat is not None:
            return Photo(path, taken, lat, lon, source="sidecar")
    else:
        taken = None

    e_taken, e_lat, e_lon = read_exif(path)
    return Photo(path, taken or e_taken, e_lat, e_lon, source="exif")


def walk_export(root: str) -> Iterator[str]:
    """Every image file under a Takeout export, sidecars excluded."""
    for dirpath, _dirs, files in os.walk(root):
        for name in sorted(files):
            if name.lower().endswith(IMAGE_SUFFIXES):
                yield os.path.join(dirpath, name)


def cluster(photos: Iterable, radius_m: float = SITE_RADIUS_M) -> list:
    """Group located photographs into sites by proximity.

    Single-pass nearest-centroid assignment. Good enough for jobsites, which
    are far apart relative to the radius; it is not a general clustering
    algorithm and does not pretend to be.
    """
    sites: list = []
    for photo in photos:
        if not photo.located:
            continue
        best = None
        best_d = radius_m
        for site in sites:
            d = haversine_m(photo.lat, photo.lon, site.lat, site.lon)
            if d <= best_d:
                best, best_d = site, d
        if best is None:
            sites.append(Site(lat=photo.lat, lon=photo.lon, photos=[photo]))
        else:
            n = len(best.photos)
            best.lat = (best.lat * n + photo.lat) / (n + 1)
            best.lon = (best.lon * n + photo.lon) / (n + 1)
            best.photos.append(photo)
    return sites


def index_export(root: str) -> dict:
    """Read an export and return sites, plus an honest account of what was lost."""
    photos = [read_photo(p) for p in walk_export(root)]
    located = [p for p in photos if p.located]
    sites = cluster(located)

    by_state: dict = {}
    ambiguous = 0
    for site in sites:
        code = site.state
        if code is None and len(states_for(site.lat, site.lon)) > 1:
            code = "ambiguous"
            ambiguous += 1
        by_state.setdefault(code or "unknown", []).append(site)

    return {
        "photos_read": len(photos),
        "photos_located": len(located),
        "photos_unlocated": len(photos) - len(located),
        "sites": sites,
        "sites_by_state": {k: len(v) for k, v in sorted(by_state.items())},
        "from_sidecar": sum(1 for p in located if p.source == "sidecar"),
        "from_exif": sum(1 for p in located if p.source == "exif"),
        # Sites on a state border that a rectangle cannot resolve. Reported so
        # a run that could not place them does not read as one that did.
        "sites_ambiguous_state": ambiguous,
    }


def match_to_invoices(*_args, **_kwargs):
    """Deliberately not implemented. See the module docstring.

    Matching a photograph to an invoice because they share a date invents a
    link the records do not contain. If invoices ever carry a store number or
    an address, match on THAT and delete this function.
    """
    raise NotImplementedError(
        "Photographs are not matched to invoices by date. A shared date is not "
        "a shared job. Match on a store number or an address, or not at all."
    )
