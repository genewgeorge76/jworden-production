"""
The job book, and the two rules its screens exist to hold.

The business ran on Kickserv for a decade and nearly lost the lot twice — the
account was cancelled over a failed card in January 2019 and the magic-link
logins were failing again in 2023. 2,610 jobs, 2,263 customers and the whole
billing history sat behind somebody else's subscription. This is the same job
book on our own database.

  1. THERE IS NO TOTAL. The export sums to $41,295,234.93 and that figure
     includes 66 bids the company LOST. One big number assembled entirely from
     true rows is the easiest lie a dashboard can tell, so completed, quoted and
     lost are three separate figures and the API never adds them.

  2. A RESIDENTIAL JOB IS A TOWN. 1,955 of the jobs are private driveways.
     Those customers hired a paving crew, not a listing — so no street, no
     postcode and no pin, in the list, the detail or the map.
"""

import pytest

from app.services import job_ledger


async def _customer_headers(client) -> dict:
    registration = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "jobbook-gate@example.example",
            "password": "a-long-enough-password",
            "companyName": "Probe Paving",
            "industry": "paving",
            "state": "VA",
            "city": "Richmond",
            "plan": "lite",
        },
    )
    assert registration.status_code == 200, registration.text
    return {"Authorization": f"Bearer {registration.json()['access_token']}"}


COMMERCIAL = {
    "client": "Meckley Services Inc.",
    "category": "commercial",
    "address": "5215 Plank Rd",
    "city": "Fredericksburg",
    "state": "va",
    "postal_code": "22407",
    "amount": "1500.00",
    "scope": "Asphalt patch at the drive-thru entrance",
    "latitude": 38.2657,
    "longitude": -77.5236,
}

RESIDENTIAL = {
    "client": "Lina Hinderliter",
    "category": "residential",
    "address": "Broad Axe Rd",
    "city": "Charlottesville",
    "state": "VA",
    "postal_code": "22901",
    "amount": "15500.00",
    "latitude": 38.0293,
    "longitude": -78.4767,
}


# ── The gate ────────────────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_a_hosted_customer_cannot_open_the_job_book(client):
    headers = await _customer_headers(client)

    assert (await client.get("/api/v1/jobbook/summary", headers=headers)).status_code == 403
    assert (await client.get("/api/v1/jobbook/jobs", headers=headers)).status_code == 403
    assert (await client.post("/api/v1/jobbook/jobs", json=COMMERCIAL, headers=headers)).status_code == 403


@pytest.mark.anyio
async def test_an_anonymous_caller_cannot_either(client):
    assert (await client.get("/api/v1/jobbook/jobs")).status_code == 403


# ── A residential job is a town ─────────────────────────────────────────────

@pytest.mark.anyio
async def test_a_residential_street_is_not_stored_even_when_sent(client, auth_headers):
    """
    The Hinderliter proposal names Broad Axe Rd, Charlottesville and a private
    phone number. That address must not survive a round trip: the request can
    carry it, the record must not.
    """
    created = await client.post("/api/v1/jobbook/jobs", json=RESIDENTIAL, headers=auth_headers)
    assert created.status_code == 200, created.text
    job = created.json()["job"]

    assert job["address"] is None
    assert job["postal_code"] is None
    assert job["latitude"] is None
    assert job["longitude"] is None
    assert job["city"] == "Charlottesville", "the town is kept — it is not private"
    assert job["has_pin"] is False


@pytest.mark.anyio
async def test_a_commercial_job_keeps_its_address_and_its_pin(client, auth_headers):
    created = await client.post("/api/v1/jobbook/jobs", json=COMMERCIAL, headers=auth_headers)
    job = created.json()["job"]

    assert job["address"] == "5215 Plank Rd"
    assert job["state"] == "VA", "normalised to upper case"
    assert job["has_pin"] is True
    assert job["amount"] == "1500.00"


@pytest.mark.anyio
async def test_a_residential_job_never_reaches_the_map(client, auth_headers):
    await client.post("/api/v1/jobbook/jobs", json=RESIDENTIAL, headers=auth_headers)
    await client.post("/api/v1/jobbook/jobs", json=COMMERCIAL, headers=auth_headers)

    pins = (await client.get("/api/v1/jobbook/map?evidence=all", headers=auth_headers)).json()

    assert pins["count"] == 1
    assert pins["pins"][0]["client"] == "Meckley Services Inc."


@pytest.mark.anyio
async def test_editing_cannot_smuggle_a_street_onto_a_residential_job(client, auth_headers):
    """The privacy rule has to hold on the second write as well as the first."""
    created = await client.post("/api/v1/jobbook/jobs", json=RESIDENTIAL, headers=auth_headers)
    job_id = created.json()["job"]["id"]

    patched = await client.patch(
        f"/api/v1/jobbook/jobs/{job_id}",
        json={"address": "1 Broad Axe Rd", "postal_code": "22901", "latitude": 38.0293},
        headers=auth_headers,
    )

    assert patched.status_code == 200
    assert patched.json()["job"]["address"] is None
    assert patched.json()["job"]["latitude"] is None


# ── Nothing grades itself ───────────────────────────────────────────────────

@pytest.mark.anyio
async def test_a_job_typed_in_by_hand_starts_at_listed(client, auth_headers):
    """
    However certain the person entering it is. Everything in this system earns
    its grade from a document and a job raised this morning has none.
    """
    created = await client.post("/api/v1/jobbook/jobs", json=COMMERCIAL, headers=auth_headers)
    job = created.json()["job"]

    assert job["evidence"] == job_ledger.LISTED
    assert job["publishable"] is False


@pytest.mark.anyio
async def test_a_grade_can_be_raised_by_hand_but_never_lowered(client, auth_headers):
    """
    Raising is legitimate — the operator has the invoice in front of him.
    Lowering by editing is how a completed job quietly becomes a maybe, so it
    is refused and the record it came from has to be corrected instead.
    """
    created = await client.post("/api/v1/jobbook/jobs", json=COMMERCIAL, headers=auth_headers)
    job_id = created.json()["job"]["id"]

    up = await client.patch(
        f"/api/v1/jobbook/jobs/{job_id}", json={"evidence": "invoiced"}, headers=auth_headers
    )
    assert up.status_code == 200
    assert up.json()["job"]["evidence"] == "invoiced"
    assert up.json()["job"]["publishable"] is True

    down = await client.patch(
        f"/api/v1/jobbook/jobs/{job_id}", json={"evidence": "listed"}, headers=auth_headers
    )
    assert down.status_code == 400
    assert "not lowered by editing" in down.json()["detail"]


@pytest.mark.anyio
async def test_an_unknown_grade_is_refused(client, auth_headers):
    created = await client.post("/api/v1/jobbook/jobs", json=COMMERCIAL, headers=auth_headers)
    job_id = created.json()["job"]["id"]

    response = await client.patch(
        f"/api/v1/jobbook/jobs/{job_id}", json={"evidence": "definitely-done"}, headers=auth_headers
    )
    assert response.status_code == 400


@pytest.mark.anyio
async def test_an_unknown_kind_is_refused(client, auth_headers):
    response = await client.post(
        "/api/v1/jobbook/jobs", json={**COMMERCIAL, "category": "industrial"}, headers=auth_headers
    )
    assert response.status_code == 400


# ── There is no total ───────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_the_summary_reports_each_grade_apart_and_never_a_combined_total(client, auth_headers):
    """
    The export sums to $41,295,234.93 including 66 lost bids. A tile reading
    "$41.3M" would be a lie built entirely out of true rows, so there is no key
    anywhere in this response that adds the grades together.
    """
    await client.post("/api/v1/jobbook/jobs", json=COMMERCIAL, headers=auth_headers)
    await client.post("/api/v1/jobbook/jobs", json=RESIDENTIAL, headers=auth_headers)

    summary = (await client.get("/api/v1/jobbook/summary", headers=auth_headers)).json()

    assert summary["total_jobs"] == 2, "a count of jobs is fine"
    for forbidden in ("total_value", "grand_total", "portfolio_value", "revenue", "all_value"):
        assert forbidden not in summary
    assert set(summary["by_evidence"]) == set(job_ledger.EVIDENCE_ORDER)
    assert summary["by_evidence"]["listed"]["publishable"] is False


@pytest.mark.anyio
async def test_the_summary_says_what_each_grade_means(client, auth_headers):
    await client.post("/api/v1/jobbook/jobs", json=COMMERCIAL, headers=auth_headers)

    summary = (await client.get("/api/v1/jobbook/summary", headers=auth_headers)).json()

    assert "not a job" in summary["by_evidence"]["listed"]["means"]
    assert summary["by_kind"]["commercial"] == 1


# ── The list ────────────────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_the_list_filters_by_kind_and_searches_the_fields_that_matter(client, auth_headers):
    await client.post("/api/v1/jobbook/jobs", json=COMMERCIAL, headers=auth_headers)
    await client.post("/api/v1/jobbook/jobs", json=RESIDENTIAL, headers=auth_headers)

    commercial = (
        await client.get("/api/v1/jobbook/jobs?category=commercial", headers=auth_headers)
    ).json()
    assert commercial["total"] == 1

    found = (await client.get("/api/v1/jobbook/jobs?q=Meckley", headers=auth_headers)).json()
    assert found["total"] == 1

    by_town = (await client.get("/api/v1/jobbook/jobs?q=Charlottesville", headers=auth_headers)).json()
    assert by_town["total"] == 1, "a residential job is findable by its town"


@pytest.mark.anyio
async def test_publishable_is_a_filter_of_its_own(client, auth_headers):
    created = await client.post("/api/v1/jobbook/jobs", json=COMMERCIAL, headers=auth_headers)
    await client.patch(
        f"/api/v1/jobbook/jobs/{created.json()['job']['id']}",
        json={"evidence": "completed"},
        headers=auth_headers,
    )
    await client.post("/api/v1/jobbook/jobs", json=RESIDENTIAL, headers=auth_headers)

    publishable = (
        await client.get("/api/v1/jobbook/jobs?evidence=publishable", headers=auth_headers)
    ).json()

    assert publishable["total"] == 1
    assert publishable["jobs"][0]["evidence"] == "completed"


@pytest.mark.anyio
async def test_a_missing_job_is_a_404_not_an_empty_shell(client, auth_headers):
    assert (await client.get("/api/v1/jobbook/jobs/999999", headers=auth_headers)).status_code == 404
