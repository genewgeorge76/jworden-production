"""
The photo archive produces places, and a person decides what they are.

This exists because of a specific near-miss. Photographs already committed to
this repository sit in folders named store_04_atlanta_peachtree,
store_07_orlando_idrive and store_10_neworleans_veterans — and 118 of them
carry ONE coordinate. The folder names record what somebody meant to file.
Publishing them as jobsites would have claimed work in six cities that the
photographs themselves disprove.

So the rule these tests hold is narrow and absolute:

  * coordinates cluster, names never do;
  * a photograph with no coordinate is dropped, not parked at (0, 0);
  * nothing is publishable until a person confirms it, because personal
    photographs share these accounts and no coordinate separates a customer's
    car park from a family holiday;
  * a decision already made survives the next scan.
"""

from datetime import datetime, timezone

import httpx
import pytest

from app.services import photo_archive


# ── One listing entry to a photograph ───────────────────────────────────────

def _entry(path="/jobs/a.jpg", lat=37.5407, lon=-77.4360, taken="2019-06-01T14:03:00Z"):
    metadata = {".tag": "photo", "dimensions": {"height": 3024, "width": 4032}}
    if lat is not None:
        metadata["location"] = {"latitude": lat, "longitude": lon}
    if taken:
        metadata["time_taken"] = taken
    return {
        ".tag": "file",
        "name": path.rsplit("/", 1)[-1],
        "path_display": path,
        "media_info": {"metadata": metadata},
    }


def test_a_geotagged_photograph_yields_its_place_and_time():
    found = photo_archive._photo_from_entry(_entry())

    assert found is not None
    assert (found["lat"], found["lon"]) == (37.5407, -77.4360)
    assert found["taken_at"] == datetime(2019, 6, 1, 14, 3, tzinfo=timezone.utc)


def test_a_photograph_without_a_coordinate_is_dropped_not_parked_at_null_island():
    """
    (0, 0) is a real place in the Gulf of Guinea. Carrying an unlocated
    photograph forward as zero would gather every one of them into a single
    phantom jobsite off the coast of Africa, with a photo count large enough
    to sort to the top of the review queue.
    """
    assert photo_archive._photo_from_entry(_entry(lat=None, lon=None)) is None


def test_folders_and_non_images_are_not_photographs():
    assert photo_archive._photo_from_entry({".tag": "folder", "name": "2019"}) is None
    assert photo_archive._photo_from_entry(_entry(path="/jobs/invoice.pdf")) is None


def test_a_file_with_no_media_info_is_dropped():
    """Dropbox omits media_info entirely for files it has not processed."""
    assert photo_archive._photo_from_entry(
        {".tag": "file", "name": "a.jpg", "path_display": "/a.jpg"}
    ) is None


# ── Clustering is on coordinates, and only on coordinates ───────────────────

def test_one_coordinate_in_six_city_folders_is_one_place():
    """
    The exact shape of the near-miss, in miniature. Six folder names, six
    cities, one camera position. Six clusters here would have become six
    "completed jobs" on six regional landing pages.
    """
    photos = [
        {"path": f"/store_{i:02d}_{city}/img.jpg", "lat": 42.3231, "lon": -83.4527, "taken_at": None}
        for i, city in enumerate(
            ["atlanta", "marietta", "savannah", "orlando", "houston", "neworleans"], start=4
        )
    ]

    clusters = photo_archive.cluster(photos)

    assert len(clusters) == 1
    assert clusters[0]["photo_count"] == 6


def test_genuinely_separate_jobsites_stay_separate():
    photos = [
        {"path": "/a.jpg", "lat": 37.5407, "lon": -77.4360, "taken_at": None},   # Richmond
        {"path": "/b.jpg", "lat": 33.7490, "lon": -84.3880, "taken_at": None},   # Atlanta
        {"path": "/c.jpg", "lat": 29.7604, "lon": -95.3698, "taken_at": None},   # Houston
    ]

    assert len(photo_archive.cluster(photos)) == 3


def test_a_drifting_gps_fix_across_one_car_park_is_one_place():
    """
    A phone's fix moves between shots. Roughly 0.1 mile of drift is the same
    lot, not two jobs — and counting it as two would inflate every total
    derived from this.
    """
    photos = [
        {"path": "/1.jpg", "lat": 37.54070, "lon": -77.43600, "taken_at": None},
        {"path": "/2.jpg", "lat": 37.54210, "lon": -77.43640, "taken_at": None},
    ]

    clusters = photo_archive.cluster(photos)

    assert len(clusters) == 1
    assert clusters[0]["photo_count"] == 2


def test_a_cluster_spans_the_dates_of_its_photographs():
    photos = [
        {"path": "/1.jpg", "lat": 37.5407, "lon": -77.4360,
         "taken_at": datetime(2021, 5, 4, tzinfo=timezone.utc)},
        {"path": "/2.jpg", "lat": 37.5407, "lon": -77.4360,
         "taken_at": datetime(2019, 6, 1, tzinfo=timezone.utc)},
        {"path": "/3.jpg", "lat": 37.5407, "lon": -77.4360,
         "taken_at": datetime(2023, 8, 9, tzinfo=timezone.utc)},
    ]

    cluster = photo_archive.cluster(photos)[0]

    assert cluster["first_seen"].year == 2019
    assert cluster["last_seen"].year == 2023


def test_sample_paths_are_a_handful_for_recognition_not_the_whole_cluster():
    photos = [
        {"path": f"/{i}.jpg", "lat": 37.5407, "lon": -77.4360, "taken_at": None}
        for i in range(50)
    ]

    cluster = photo_archive.cluster(photos)[0]

    assert cluster["photo_count"] == 50
    assert len(cluster["sample_paths"]) == 8


def test_the_busiest_place_is_reviewed_first():
    photos = [{"path": "/lone.jpg", "lat": 29.7604, "lon": -95.3698, "taken_at": None}]
    photos += [
        {"path": f"/many{i}.jpg", "lat": 37.5407, "lon": -77.4360, "taken_at": None}
        for i in range(5)
    ]

    clusters = photo_archive.cluster(photos)

    assert [c["photo_count"] for c in clusters] == [5, 1]


# ── Reading the archive ─────────────────────────────────────────────────────

@pytest.fixture()
def dropbox(monkeypatch):
    """Stand in for Dropbox, so the whole pipeline runs without a token."""
    pages: list[dict] = []

    def handler(request: httpx.Request) -> httpx.Response:
        page = pages.pop(0)
        status = page.pop("_status", 200)
        return httpx.Response(status, json=page)

    # The real class is captured before the patch goes on, or the factory calls
    # itself.
    real_client = httpx.AsyncClient

    def factory(*args, **kwargs):
        return real_client(transport=httpx.MockTransport(handler))

    monkeypatch.setattr(photo_archive.httpx, "AsyncClient", factory)
    monkeypatch.setattr(photo_archive, "_token", lambda: "a-test-token")
    return pages


@pytest.mark.anyio
async def test_a_scan_returns_only_the_photographs_that_carry_a_place(dropbox):
    dropbox.append(
        {
            "entries": [
                _entry("/jobs/located.jpg"),
                _entry("/jobs/unlocated.jpg", lat=None, lon=None),
                {".tag": "folder", "name": "2019"},
            ],
            "cursor": "c1",
            "has_more": False,
        }
    )

    result = await photo_archive.scan()

    assert result["ok"] is True
    assert result["scanned"] == 3, "every entry looked at"
    assert len(result["photos"]) == 1, "only the one that can be placed"
    assert result["has_more"] is False


@pytest.mark.anyio
async def test_a_long_archive_pauses_and_hands_back_a_cursor_to_resume(dropbox):
    dropbox.append({"entries": [_entry("/1.jpg")], "cursor": "page-2", "has_more": True})

    result = await photo_archive.scan(max_pages=1)

    assert result["ok"] is True
    assert result["has_more"] is True
    assert result["cursor"] == "page-2", "so the next request continues rather than restarts"


@pytest.mark.anyio
async def test_a_rejected_token_is_reported_as_unconfigured_not_as_an_empty_archive(dropbox):
    """
    An expired token returning "no photographs found" would read as "there is
    no proof", and the operator would go looking for photographs that are
    sitting safely in Dropbox.
    """
    dropbox.append({"_status": 401, "error_summary": "expired_access_token/"})

    with pytest.raises(photo_archive.ArchiveNotConfigured):
        await photo_archive.scan()


@pytest.mark.anyio
async def test_no_token_configured_is_refused_before_any_request_is_made(monkeypatch):
    monkeypatch.setattr(photo_archive, "_token", lambda: "")

    assert photo_archive.configured() is False
    with pytest.raises(photo_archive.ArchiveNotConfigured):
        await photo_archive.scan()


# ── The review gate ─────────────────────────────────────────────────────────

async def _customer_token(client) -> str:
    registration = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "photo-gate-probe@example.example",
            "password": "a-long-enough-password",
            "companyName": "Probe Paving",
            "industry": "paving",
            "state": "VA",
            "city": "Richmond",
            "plan": "lite",
        },
    )
    assert registration.status_code == 200, registration.text
    return registration.json()["access_token"]


@pytest.mark.anyio
async def test_a_hosted_customer_cannot_see_the_operators_photographs(client):
    """
    This archive is the operator's personal cloud storage. It is not a tenant
    resource and does not become one — a paying customer has no business
    knowing where these photographs were taken, and some of them are family.
    """
    token = await _customer_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    listing = await client.get("/api/v1/photo-proof/clusters", headers=headers)
    scan = await client.post("/api/v1/photo-proof/scan", json={}, headers=headers)

    assert listing.status_code == 403
    assert scan.status_code == 403


@pytest.mark.anyio
async def test_an_anonymous_caller_cannot_see_them_either(client):
    assert (await client.get("/api/v1/photo-proof/clusters")).status_code == 403


@pytest.mark.anyio
async def test_the_operator_sees_an_empty_queue_before_any_scan(client, auth_headers):
    response = await client.get("/api/v1/photo-proof/clusters", headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["clusters"] == []
    assert body["counts"]["pending"] == 0


@pytest.mark.anyio
async def test_a_scan_without_a_dropbox_token_says_so_rather_than_finding_nothing(
    client, auth_headers, monkeypatch
):
    monkeypatch.setattr(photo_archive, "_token", lambda: "")

    response = await client.post("/api/v1/photo-proof/scan", json={}, headers=auth_headers)

    assert response.status_code == 503
    assert "DROPBOX_ACCESS_TOKEN" in response.json()["detail"]


@pytest.mark.anyio
async def test_a_scan_files_every_place_as_pending(client, auth_headers, dropbox):
    dropbox.append(
        {
            "entries": [
                _entry("/store_04_atlanta/a.jpg", lat=42.3231, lon=-83.4527),
                _entry("/store_07_orlando/b.jpg", lat=42.3231, lon=-83.4527),
                _entry("/richmond/c.jpg", lat=37.5407, lon=-77.4360),
            ],
            "has_more": False,
        }
    )

    response = await client.post("/api/v1/photo-proof/scan", json={}, headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["places_found"] == 2, "two coordinates, not three folder names"
    assert body["clusters_created"] == 2

    queue = (await client.get("/api/v1/photo-proof/clusters", headers=auth_headers)).json()
    assert queue["counts"]["pending"] == 2
    assert all(c["status"] == "pending" for c in queue["clusters"])
    assert all(c["kind"] is None for c in queue["clusters"]), "nothing is claimed yet"


@pytest.mark.anyio
async def test_nothing_is_publishable_straight_off_a_scan(client, auth_headers, dropbox):
    dropbox.append({"entries": [_entry("/a.jpg")], "has_more": False})
    await client.post("/api/v1/photo-proof/scan", json={}, headers=auth_headers)

    confirmed = await client.get(
        "/api/v1/photo-proof/clusters?status=confirmed", headers=auth_headers
    )

    assert confirmed.json()["clusters"] == []


@pytest.mark.anyio
async def test_confirming_a_place_needs_to_say_which_kind_it_is(client, auth_headers, dropbox):
    """
    Commercial and residential publish differently: commercial carries a venue
    name and street address, residential is shown by city only, because a
    homeowner who let a crew photograph their driveway did not agree to have
    their address on a website. A coordinate cannot tell the two apart, so the
    person confirming has to.
    """
    dropbox.append({"entries": [_entry("/a.jpg")], "has_more": False})
    await client.post("/api/v1/photo-proof/scan", json={}, headers=auth_headers)
    cluster_id = (
        await client.get("/api/v1/photo-proof/clusters", headers=auth_headers)
    ).json()["clusters"][0]["id"]

    response = await client.post(
        f"/api/v1/photo-proof/clusters/{cluster_id}/review",
        json={"status": "confirmed"},
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert "commercial" in response.json()["detail"]


@pytest.mark.anyio
async def test_a_confirmed_place_keeps_what_the_operator_said_about_it(
    client, auth_headers, dropbox
):
    dropbox.append({"entries": [_entry("/a.jpg")], "has_more": False})
    await client.post("/api/v1/photo-proof/scan", json={}, headers=auth_headers)
    cluster_id = (
        await client.get("/api/v1/photo-proof/clusters", headers=auth_headers)
    ).json()["clusters"][0]["id"]

    response = await client.post(
        f"/api/v1/photo-proof/clusters/{cluster_id}/review",
        json={
            "status": "confirmed",
            "kind": "commercial",
            "label": "KFC",
            "city": "Richmond",
            "state": "VA",
            "evidence": "both",
            "evidence_note": "Invoiced to KBP Foods.",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200
    cluster = response.json()["cluster"]
    assert cluster["status"] == "confirmed"
    assert cluster["kind"] == "commercial"
    assert cluster["evidence"] == "both"
    assert cluster["reviewed_at"] is not None


@pytest.mark.anyio
async def test_evidence_is_one_of_the_three_things_it_can_actually_be(
    client, auth_headers, dropbox
):
    """
    photo_gps, invoice, or both. An invoice to KBP Foods is stronger evidence
    of a KFC job than a GPS fix is, and the two are worth telling apart when
    somebody later asks how a claim on a public page is supported.
    """
    dropbox.append({"entries": [_entry("/a.jpg")], "has_more": False})
    await client.post("/api/v1/photo-proof/scan", json={}, headers=auth_headers)
    cluster_id = (
        await client.get("/api/v1/photo-proof/clusters", headers=auth_headers)
    ).json()["clusters"][0]["id"]

    response = await client.post(
        f"/api/v1/photo-proof/clusters/{cluster_id}/review",
        json={"status": "confirmed", "kind": "commercial", "evidence": "somebody-said-so"},
        headers=auth_headers,
    )

    assert response.status_code == 400


@pytest.mark.anyio
async def test_rescanning_updates_a_place_rather_than_offering_it_again(
    client, auth_headers, dropbox
):
    """
    The second scan of a car park lands a few metres off the first. Matching on
    exact equality would file a duplicate, and the operator would review the
    same place every time the scan ran.
    """
    dropbox.append({"entries": [_entry("/a.jpg", lat=37.54070, lon=-77.43600)], "has_more": False})
    await client.post("/api/v1/photo-proof/scan", json={}, headers=auth_headers)

    dropbox.append(
        {
            "entries": [
                _entry("/a.jpg", lat=37.54070, lon=-77.43600),
                _entry("/b.jpg", lat=37.54085, lon=-77.43615),
            ],
            "has_more": False,
        }
    )
    second = await client.post("/api/v1/photo-proof/scan", json={}, headers=auth_headers)

    assert second.json()["clusters_created"] == 0
    assert second.json()["clusters_updated"] == 1

    queue = (await client.get("/api/v1/photo-proof/clusters", headers=auth_headers)).json()
    assert len(queue["clusters"]) == 1
    assert queue["clusters"][0]["photo_count"] == 2, "the count is refreshed"


@pytest.mark.anyio
async def test_a_rejected_place_stays_rejected_when_the_scan_runs_again(
    client, auth_headers, dropbox
):
    """
    The family holiday is rejected once. If a rescan reopened it, the review
    would never end and the rejection would carry no weight.
    """
    dropbox.append({"entries": [_entry("/holiday.jpg")], "has_more": False})
    await client.post("/api/v1/photo-proof/scan", json={}, headers=auth_headers)
    cluster_id = (
        await client.get("/api/v1/photo-proof/clusters", headers=auth_headers)
    ).json()["clusters"][0]["id"]
    await client.post(
        f"/api/v1/photo-proof/clusters/{cluster_id}/review",
        json={"status": "rejected", "evidence_note": "Not a jobsite."},
        headers=auth_headers,
    )

    dropbox.append({"entries": [_entry("/holiday.jpg")], "has_more": False})
    await client.post("/api/v1/photo-proof/scan", json={}, headers=auth_headers)

    queue = (await client.get("/api/v1/photo-proof/clusters?status=all", headers=auth_headers)).json()
    assert len(queue["clusters"]) == 1
    assert queue["clusters"][0]["status"] == "rejected"
    assert queue["counts"]["pending"] == 0


@pytest.mark.anyio
async def test_every_cluster_carries_a_pin_the_reviewer_can_open(client, auth_headers, dropbox):
    """
    Looking at the place on a map is the fastest way to tell a customer's car
    park from a family holiday, which is the judgement this whole queue exists
    to collect.
    """
    dropbox.append({"entries": [_entry("/a.jpg")], "has_more": False})
    await client.post("/api/v1/photo-proof/scan", json={}, headers=auth_headers)

    cluster = (
        await client.get("/api/v1/photo-proof/clusters", headers=auth_headers)
    ).json()["clusters"][0]

    assert "37.5407" in cluster["map_url"]
    assert cluster["sample_paths"] == ["/a.jpg"]
