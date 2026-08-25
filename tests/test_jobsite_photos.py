"""Tests for the jobsite photo indexer.

The load-bearing ones are the refusals: the zero island, and the invoice match
that must never be implemented on a date.
"""

import json
import os
from datetime import datetime, timezone

import pytest

from app.services import jobsite_photos as jp


def test_null_island_is_treated_as_no_location():
    # Takeout writes 0,0 for un-located photographs. Read literally, every one
    # of them clusters into a single confident jobsite in the Gulf of Guinea.
    assert jp._clean_coords(0.0, 0.0) == (None, None)
    assert jp._clean_coords("0", "0") == (None, None)
    # A real coordinate near zero must still survive.
    lat, lon = jp._clean_coords(0.0001, 0.0)
    assert lat == pytest.approx(0.0001)


def test_impossible_coordinates_are_rejected():
    assert jp._clean_coords(91.0, 0.0) == (None, None)
    assert jp._clean_coords(0.0, 181.0) == (None, None)
    assert jp._clean_coords("north", "west") == (None, None)


def test_matching_photos_to_invoices_is_refused():
    # A shared date is not a shared job. This is the fabrication this module
    # was written to avoid, and it must stay unimplemented.
    with pytest.raises(NotImplementedError) as err:
        jp.match_to_invoices([], [])
    assert "shared date" in str(err.value)


def test_state_lookup_covers_the_states_in_the_record():
    assert jp.state_for(33.9526, -84.5499) == "GA"   # Marietta
    assert jp.state_for(27.3364, -82.5307) == "FL"   # Sarasota
    assert jp.state_for(37.3529, -77.4326) == "VA"   # Chester
    # Lancaster SC is NOT asserted here — it sits in both the NC and SC boxes.
    # See test_border_coordinates_are_admitted_not_guessed.


def test_border_coordinates_are_admitted_not_guessed():
    """Lancaster SC falls inside both the NC and the SC box.

    The W Meeting Street job is real and it is in South Carolina. A lookup that
    returned whichever box came first would file it under North Carolina and
    say nothing. Ambiguous must read as ambiguous.
    """
    lat, lon = 34.7204, -80.7712
    candidates = jp.states_for(lat, lon)
    assert set(candidates) >= {"NC", "SC"}
    assert jp.state_for(lat, lon) is None, "a border coordinate was resolved by dictionary order"


def test_ambiguous_sites_are_reported_separately_from_unknown(tmp_path):
    img = tmp_path / "border.jpg"
    img.write_bytes(b"x")
    (tmp_path / "border.jpg.json").write_text(json.dumps({
        "photoTakenTime": {"timestamp": "1490000000"},
        "geoData": {"latitude": 34.7204, "longitude": -80.7712},
    }))
    report = jp.index_export(str(tmp_path))
    assert report["sites_ambiguous_state"] == 1
    assert report["sites_by_state"] == {"ambiguous": 1}


def test_state_lookup_returns_none_outside_the_boxes():
    assert jp.state_for(51.5074, -0.1278) is None    # London
    assert jp.state_for(-33.8688, 151.2093) is None  # Sydney


def test_sidecar_is_preferred_over_exif(tmp_path):
    # Google re-encodes "Storage saver" uploads and EXIF may not survive, but
    # the sidecar always carries the location. Sidecar must win.
    img = tmp_path / "jobsite.jpg"
    img.write_bytes(b"not a real jpeg")
    sidecar = tmp_path / "jobsite.jpg.json"
    sidecar.write_text(json.dumps({
        "photoTakenTime": {"timestamp": "1490000000"},
        "geoDataExif": {"latitude": 33.9526, "longitude": -84.5499},
    }))

    photo = jp.read_photo(str(img))
    assert photo.source == "sidecar"
    assert photo.located
    assert photo.lat == pytest.approx(33.9526)


def test_camera_geodata_beats_user_edited_geodata(tmp_path):
    img = tmp_path / "a.jpg"
    img.write_bytes(b"x")
    (tmp_path / "a.jpg.json").write_text(json.dumps({
        "photoTakenTime": {"timestamp": "1490000000"},
        "geoDataExif": {"latitude": 33.9526, "longitude": -84.5499},
        "geoData": {"latitude": 40.0, "longitude": -80.0},
    }))
    photo = jp.read_photo(str(img))
    assert photo.lat == pytest.approx(33.9526)


def test_newer_supplemental_sidecar_name_is_found(tmp_path):
    img = tmp_path / "b.jpg"
    img.write_bytes(b"x")
    (tmp_path / "b.jpg.supplemental-metadata.json").write_text(json.dumps({
        "photoTakenTime": {"timestamp": "1490000000"},
        "geoData": {"latitude": 27.3364, "longitude": -82.5307},
    }))
    photo = jp.read_photo(str(img))
    assert photo.located
    assert jp.state_for(photo.lat, photo.lon) == "FL"


def _photo(lat, lon, day):
    return jp.Photo(
        path=f"{lat},{lon},{day}",
        taken=datetime(2017, 3, day, 12, 0, tzinfo=timezone.utc),
        lat=lat, lon=lon, source="sidecar",
    )


def test_photos_at_one_lot_cluster_into_one_site():
    # Three frames across a parking lot, tens of metres apart.
    photos = [
        _photo(33.95260, -84.54990, 1),
        _photo(33.95280, -84.54990, 1),
        _photo(33.95250, -84.55010, 1),
    ]
    sites = jp.cluster(photos)
    assert len(sites) == 1
    assert sites[0].state == "GA"


def test_distinct_jobsites_do_not_merge():
    photos = [_photo(33.9526, -84.5499, 1), _photo(33.7490, -84.3880, 2)]  # Marietta, Atlanta
    assert len(jp.cluster(photos)) == 2


def test_visits_counts_days_not_frames():
    # A burst of frames is one visit. Separate days is the honest measure, and
    # a site photographed twice is a stronger record than one photographed once.
    photos = [
        _photo(33.9526, -84.5499, 1),
        _photo(33.9526, -84.5499, 1),
        _photo(33.9526, -84.5499, 1),
        _photo(33.9527, -84.5499, 8),
    ]
    site = jp.cluster(photos)[0]
    assert len(site.photos) == 4
    assert site.visits == 2


def test_unlocated_photos_are_counted_not_silently_dropped(tmp_path):
    # A run that quietly discards half the archive reads as a complete index.
    located = tmp_path / "y.jpg"
    located.write_bytes(b"x")
    (tmp_path / "y.jpg.json").write_text(json.dumps({
        "photoTakenTime": {"timestamp": "1490000000"},
        "geoData": {"latitude": 33.9526, "longitude": -84.5499},
    }))
    blind = tmp_path / "n.jpg"
    blind.write_bytes(b"x")
    (tmp_path / "n.jpg.json").write_text(json.dumps({
        "photoTakenTime": {"timestamp": "1490000000"},
        "geoData": {"latitude": 0.0, "longitude": 0.0},
    }))

    report = jp.index_export(str(tmp_path))
    assert report["photos_read"] == 2
    assert report["photos_located"] == 1
    assert report["photos_unlocated"] == 1
    assert report["sites_by_state"] == {"GA": 1}
