"""
saved_places.py — read a Google Maps pin export.

WHY AN EXPORT AND NOT THE MAP LINK
──────────────────────────────────
A maps.google.com/maps/@lat,lng,altitude/data=!3m1!1e3 URL carries a camera
position and a layer flag. That is all it carries. The pins a person sees on
top of it are their own saved places, rendered from their Google account after
they sign in — they are not in the link, and anyone opening that URL sees the
same empty satellite view of the same patch of the Mississippi Delta.

So the pins have to be exported. Two formats cover every way Google hands them
over, and both are read here:

  * GeoJSON  — Takeout, "Saved Places.json" and "Maps (your places)".
  * KML/KMZ  — My Maps, "Export to KML"; also a shared list's export.

WHAT A PIN IS WORTH
───────────────────
The same as a photograph's coordinate: it says a person marked a spot, not what
happened there. Pins are jobs mixed with everything else a person saves — a
supplier's yard, a plant, somewhere to eat on the way back. The pin's own title
is the best clue and it is still only a clue, so these land in the same pending
queue as the photo clusters and wait for the same confirmation.
"""

import json
import logging
import re
import xml.etree.ElementTree as ET
import zipfile
from typing import Any, Optional

logger = logging.getLogger(__name__)

_KML_NS = {"kml": "http://www.opengis.net/kml/2.2"}


def _coordinate(lat: Any, lon: Any) -> Optional[tuple[float, float]]:
    try:
        lat_f, lon_f = float(lat), float(lon)
    except (TypeError, ValueError):
        return None
    # Out-of-range values are a parse that went wrong — longitude read as
    # latitude, most often — and are dropped rather than stored as a place that
    # cannot exist.
    if not (-90.0 <= lat_f <= 90.0) or not (-180.0 <= lon_f <= 180.0):
        return None
    return lat_f, lon_f


def from_geojson(payload: Any) -> list[dict]:
    """
    Takeout's saved places.

    Google writes the location name under properties.Location.Name or
    properties.name depending on which export produced the file, and the
    geometry is [longitude, latitude] — GeoJSON's order, which is the reverse
    of every other coordinate in this codebase and the single easiest thing to
    get backwards here.
    """
    if isinstance(payload, (str, bytes)):
        payload = json.loads(payload)

    features = payload.get("features") if isinstance(payload, dict) else None
    if not isinstance(features, list):
        return []

    places: list[dict] = []
    for feature in features:
        if not isinstance(feature, dict):
            continue
        geometry = feature.get("geometry") or {}
        coordinates = geometry.get("coordinates")
        if not isinstance(coordinates, (list, tuple)) or len(coordinates) < 2:
            continue
        point = _coordinate(coordinates[1], coordinates[0])  # lat, lon — reversed
        if point is None:
            continue

        properties = feature.get("properties") or {}
        location = properties.get("Location") or {}
        places.append(
            {
                "lat": point[0],
                "lon": point[1],
                "title": (
                    location.get("Name")
                    or properties.get("name")
                    or properties.get("Title")
                    or ""
                ).strip() or None,
                "address": (location.get("Address") or properties.get("address") or "").strip()
                or None,
                "note": (properties.get("Comment") or properties.get("description") or "").strip()
                or None,
                "source": "google_saved_places",
            }
        )
    return places


def _strip_html(text: str) -> str:
    """My Maps descriptions come back as HTML fragments."""
    return re.sub(r"<[^>]+>", " ", text or "").replace("&amp;", "&").strip()


def from_kml(data: bytes | str) -> list[dict]:
    """My Maps placemarks. A .kmz is a zip with the .kml inside it."""
    if isinstance(data, bytes) and data[:2] == b"PK":
        with zipfile.ZipFile(__import__("io").BytesIO(data)) as archive:
            name = next((n for n in archive.namelist() if n.lower().endswith(".kml")), None)
            if name is None:
                return []
            data = archive.read(name)

    if isinstance(data, str):
        # An XML declaration carrying encoding="UTF-8" cannot be parsed from a
        # str — ElementTree refuses rather than ignoring the declaration — and
        # every export Google produces has one.
        data = data.encode("utf-8")

    try:
        root = ET.fromstring(data)
    except ET.ParseError as exc:
        logger.warning("Not readable as KML: %s", exc)
        return []

    places: list[dict] = []
    # findall with the namespace, then without: Google emits both the
    # namespaced 2.2 document and, for some exports, a bare one.
    placemarks = root.findall(".//kml:Placemark", _KML_NS) or root.findall(".//Placemark")
    for placemark in placemarks:
        # `or` cannot be used to fall back here. An Element with no children
        # is FALSY in ElementTree, so a perfectly good <coordinates> node —
        # which never has children — tests as False and the fallback replaces
        # it with None. Every placemark then looks like a route.
        coordinates_node = placemark.find(".//kml:Point/kml:coordinates", _KML_NS)
        if coordinates_node is None:
            coordinates_node = placemark.find(".//Point/coordinates")
        if coordinates_node is None or not (coordinates_node.text or "").strip():
            # A line or a polygon, not a pin.
            continue
        parts = coordinates_node.text.strip().split(",")
        if len(parts) < 2:
            continue
        point = _coordinate(parts[1], parts[0])  # lon,lat,alt in KML
        if point is None:
            continue

        def text_of(tag: str) -> str:
            node = placemark.find(f"kml:{tag}", _KML_NS)
            if node is None:
                node = placemark.find(tag)
            return (node.text or "") if node is not None else ""

        places.append(
            {
                "lat": point[0],
                "lon": point[1],
                "title": text_of("name").strip() or None,
                "address": (text_of("address") or "").strip() or None,
                "note": _strip_html(text_of("description")) or None,
                "source": "google_my_maps",
            }
        )
    return places


def read(data: bytes | str) -> list[dict]:
    """Whichever of the two formats this happens to be."""
    if isinstance(data, str):
        probe = data.lstrip()[:1]
        if probe == "{":
            return from_geojson(data)
        return from_kml(data)
    if data[:2] == b"PK" or data.lstrip()[:1] == b"<":
        return from_kml(data)
    return from_geojson(data.decode("utf-8", errors="replace"))


# ── Writing pins, not just reading them ─────────────────────────────────────

def _xml_escape(text: str) -> str:
    return (
        str(text or "")
        .replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def to_kml(sites: list[dict], *, title: str = "J. Worden & Sons — verified jobsites") -> str:
    """
    Verified jobsites as a KML document, ready to import into Google My Maps.

    WHY KML AND NOT A RENDERED MAP
    ──────────────────────────────
    A file the operator imports becomes a map he owns, on his own account, that
    he can restyle, share and keep. A picture of a map is a picture.

    WHAT GOES ON IT
    ───────────────
    Only sites whose evidence may be published, and each pin carries its own
    grade and source in the description — so anyone looking at the map can see
    what backs the pin without leaving it. A pin with no provenance is exactly
    the shape of the fabricated store database this replaced.

    A RESIDENTIAL SITE NEVER CARRIES ITS ADDRESS
    ────────────────────────────────────────────
    A homeowner who let a crew photograph their driveway did not agree to a pin
    on a public map with their street on it. Residential entries are named for
    their town and nothing else, and the coordinate is the one the caller
    supplied — so a residential pin should be given a town centre, not a
    doorstep. That is the caller's responsibility and this docstring is where
    it is written down.
    """
    parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<kml xmlns="http://www.opengis.net/kml/2.2"><Document>',
        f"<name>{_xml_escape(title)}</name>",
    ]

    for site in sites:
        lat, lon = site.get("lat"), site.get("lon")
        if lat is None or lon is None:
            continue
        point = _coordinate(lat, lon)
        if point is None:
            continue

        residential = (site.get("kind") or "").strip().lower() == "residential"
        if residential:
            label = " ".join(x for x in [site.get("city"), site.get("state")] if x) or "Residential"
            address = None
        else:
            label = site.get("label") or site.get("address") or "Jobsite"
            address = ", ".join(
                x for x in [site.get("address"), site.get("city"), site.get("state")] if x
            )

        detail = []
        if site.get("evidence"):
            detail.append(f"Evidence: {site['evidence']}")
        if site.get("completed_on"):
            detail.append(f"Completed: {site['completed_on']}")
        if site.get("store_number") and not residential:
            detail.append(f"Store: {site['store_number']}")
        if site.get("client") and not residential:
            detail.append(f"Client: {site['client']}")
        if site.get("source_document"):
            detail.append(f"Source: {site['source_document']}")

        parts.append("<Placemark>")
        parts.append(f"<name>{_xml_escape(label)}</name>")
        if address:
            parts.append(f"<address>{_xml_escape(address)}</address>")
        if detail:
            parts.append(f"<description>{_xml_escape(' | '.join(detail))}</description>")
        parts.append(f"<Point><coordinates>{point[1]:.6f},{point[0]:.6f},0</coordinates></Point>")
        parts.append("</Placemark>")

    parts.append("</Document></kml>")
    return "\n".join(parts)
