"""
Reading the pins off a Google map, and remembering what a pin is.

A maps.google.com/maps/@34.6017761,-90.3406959,3055141m/data=!3m1!1e3 link
carries a latitude, a longitude, an eye altitude and a flag for the satellite
layer. That is the whole payload. The pins a person sees on it come from their
own Google account after they sign in; anyone else opening that exact link gets
an empty satellite view of the same patch of the Mississippi Delta. So the pins
have to be exported — Takeout writes GeoJSON, My Maps writes KML — and this
reads both.

What a pin then establishes is the same as what a photograph's coordinate
establishes: somebody marked a spot. Saved places are jobs mixed with
suppliers, asphalt plants, and somewhere to eat on the drive home. So pins land
in the same pending queue and wait for the same person to confirm them.
"""

import json

import pytest

from app.services import saved_places


TAKEOUT = json.dumps(
    {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [-83.4822, 42.3086]},
                "properties": {
                    "Location": {
                        "Name": "KFC Canton",
                        "Address": "41670 Ford Rd, Canton, MI 48187",
                    },
                    "Comment": "Roof, Project Red",
                },
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [-77.4360, 37.5407]},
                "properties": {"name": "Boxley Quarry"},
            },
        ],
    }
)

MY_MAPS_KML = """<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"><Document>
  <Placemark>
    <name>KFC Harlingen G135211</name>
    <address>201 S 77 Sunshine Strip, Harlingen, TX</address>
    <description><![CDATA[<b>Parking</b> resurfaced]]></description>
    <Point><coordinates>-97.6961,26.1906,0</coordinates></Point>
  </Placemark>
  <Placemark>
    <name>A route, not a pin</name>
    <LineString><coordinates>-97.6,26.1 -97.5,26.2</coordinates></LineString>
  </Placemark>
</Document></kml>
"""


# ── Longitude first is the one thing to get wrong here ──────────────────────

def test_geojson_coordinates_are_read_longitude_first():
    """
    GeoJSON writes [longitude, latitude] — the reverse of every other
    coordinate in this codebase. Read in the wrong order, the Canton KFC lands
    at 42°E of Somalia and the pin looks plausible until someone opens the map.
    """
    pins = saved_places.from_geojson(TAKEOUT)

    assert (round(pins[0]["lat"], 4), round(pins[0]["lon"], 4)) == (42.3086, -83.4822)


def test_kml_coordinates_are_read_longitude_first_too():
    pins = saved_places.from_kml(MY_MAPS_KML)

    assert (round(pins[0]["lat"], 4), round(pins[0]["lon"], 4)) == (26.1906, -97.6961)


def test_a_pin_carries_its_title_and_address_because_a_coordinate_cannot():
    """
    "KFC Canton" is the thing the coordinate could never say, and it is why
    importing pins is worth doing at all.
    """
    pins = saved_places.from_geojson(TAKEOUT)

    assert pins[0]["title"] == "KFC Canton"
    assert pins[0]["address"] == "41670 Ford Rd, Canton, MI 48187"
    assert pins[0]["note"] == "Roof, Project Red"


def test_the_two_export_shapes_of_a_name_are_both_read():
    """Takeout writes Location.Name; some exports write a bare properties.name."""
    pins = saved_places.from_geojson(TAKEOUT)

    assert pins[1]["title"] == "Boxley Quarry"


def test_html_is_stripped_from_a_my_maps_description():
    pins = saved_places.from_kml(MY_MAPS_KML)

    assert "<b>" not in (pins[0]["note"] or "")
    assert "Parking" in pins[0]["note"]


def test_a_route_is_not_a_pin():
    pins = saved_places.from_kml(MY_MAPS_KML)

    assert len(pins) == 1
    assert pins[0]["title"] == "KFC Harlingen G135211"


@pytest.mark.parametrize(
    "lat,lon",
    [(91.0, 0.0), (0.0, 181.0), ("north", "west"), (None, None)],
)
def test_a_coordinate_that_cannot_exist_is_dropped(lat, lon):
    """
    A latitude of 91 is a parse that went wrong, most often longitude read as
    latitude. Storing it makes a place that is not anywhere, and it sits in the
    review queue looking exactly like the real ones.
    """
    payload = {
        "type": "FeatureCollection",
        "features": [{"geometry": {"type": "Point", "coordinates": [lon, lat]}, "properties": {}}],
    }

    assert saved_places.from_geojson(payload) == []


def test_the_format_is_detected_rather_than_declared():
    assert len(saved_places.read(TAKEOUT)) == 2
    assert len(saved_places.read(MY_MAPS_KML)) == 1


def test_something_that_is_neither_reads_as_no_pins():
    assert saved_places.read("<html><body>a maps page</body></html>") == []


# ── Through the API ─────────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_a_pin_export_lands_in_the_same_review_queue(client, auth_headers):
    response = await client.post(
        "/api/v1/photo-proof/import-pins", json={"content": TAKEOUT}, headers=auth_headers
    )

    assert response.status_code == 200, response.text
    assert response.json()["clusters_created"] == 2

    queue = (await client.get("/api/v1/photo-proof/clusters", headers=auth_headers)).json()
    assert queue["counts"]["pending"] == 2
    assert {c["label"] for c in queue["clusters"]} == {"KFC Canton", "Boxley Quarry"}
    assert all(c["status"] == "pending" for c in queue["clusters"]), (
        "a quarry is a saved place too; nothing here is a job until someone says so"
    )


@pytest.mark.anyio
async def test_a_maps_link_is_refused_with_the_reason(client, auth_headers):
    """
    The failure a person will actually hit. Telling them "no pins found" is
    useless; telling them the link never contained the pins is the whole answer.
    """
    response = await client.post(
        "/api/v1/photo-proof/import-pins",
        json={"content": "https://www.google.com/maps/@34.6017761,-90.3406959,3055141m/data=!3m1!1e3"},
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert "camera position" in response.json()["detail"]


@pytest.mark.anyio
async def test_a_pin_over_a_place_the_photographs_found_names_it(client, auth_headers):
    """
    The best case. The photographs prove a camera was in Canton; the pin says
    which KFC it was. The pin fills the gap and overwrites nothing.
    """
    await client.post(
        "/api/v1/photo-proof/import-pins", json={"content": TAKEOUT}, headers=auth_headers
    )
    second = await client.post(
        "/api/v1/photo-proof/import-pins", json={"content": TAKEOUT}, headers=auth_headers
    )

    assert second.json()["clusters_created"] == 0
    assert second.json()["matched_existing_places"] == 2

    queue = (await client.get("/api/v1/photo-proof/clusters", headers=auth_headers)).json()
    assert len(queue["clusters"]) == 2, "no duplicates from a re-import"


@pytest.mark.anyio
async def test_a_hosted_customer_cannot_import_or_read_the_operators_pins(client):
    registration = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "pins-gate-probe@example.example",
            "password": "a-long-enough-password",
            "companyName": "Probe Paving",
            "industry": "paving",
            "state": "VA",
            "city": "Richmond",
            "plan": "lite",
        },
    )
    headers = {"Authorization": f"Bearer {registration.json()['access_token']}"}

    response = await client.post(
        "/api/v1/photo-proof/import-pins", json={"content": TAKEOUT}, headers=headers
    )

    assert response.status_code == 403
