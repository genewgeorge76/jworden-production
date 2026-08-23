"""
A site on a list is not a job that was done.

The Project Red workbook holds 58 KFC sites: 28 Texas parking lots and 30
Michigan roofs. Eleven carry an invoice date or amount. Forty-seven carry an
address and nothing else. A naive import of that one file produces "58 completed
jobs", of which 47 are a claim with no paperwork behind them — and it produces
them from a document that is entirely genuine, which is what makes the failure
easy to miss.

(Those counts are from the file itself, read by scripts/import_job_ledger.py
--dry-run, not from reading down the first screenful of it.)

The punch lists are the sharper version of the same trap. "Riverdale G135101 —
15 parking blocks need replacing" reads exactly like a job record and means the
reverse: it is work the client is ASKING for. Imported as work performed, a
real document manufactures a false claim.

So every record carries the grade of its own evidence, only 'invoiced' may be
published, and the endpoint that would publish anything else refuses. These
tests exist to keep that refusal reachable.
"""

from datetime import datetime, timezone

import pytest

from app.services import job_ledger


# Rows taken verbatim from the Texas parking tab, including its title row and
# the blank invoice columns — the shape that has to be read correctly, not a
# tidied-up version of it.
TEXAS_ROWS = [
    ("Project Red", 'Category "Parking"', None, None, None, None, None, None, None, None, None),
    ("Store #", "Store Address", "City ", "State", "Zip", "Invoice #", "Date Submitted",
     "$ amount of Invoice ", "Total amount of job", "$ amount paid", "Outstanding Issues"),
    ("G135209", "6010 Wesley Street ", "Greenville", "TX", "75402",
     None, None, None, None, None, None),
    ("G135211", "201 S 77 Sunshine Strip", "Harlingen ", "TX", "78550",
     None, datetime(2016, 11, 9), 24336, 48672, None, None),
    ("G135213", "421 W Highway 83", "Weslaco", "TX", "78596",
     None, datetime(2016, 11, 9), 14400, 28800, None, None),
    ("G135217", "3201 Padre Blvd", "S Padre Island", "TX", "78597",
     None, datetime(2016, 11, 9), None, None, None, None),
    ("G135221", "2303 Business 190", "Copperas Cove ", "TX", "76522",
     None, None, None, None, None, None),
]


# ── Reading the sheet ───────────────────────────────────────────────────────

def test_the_header_is_found_below_the_title_row():
    """
    These sheets open with 'Project Red | Category "Parking"'. Assuming row 1
    is the header reads the title as column names, every lookup misses, and the
    import comes back empty from a file that is full.
    """
    records = job_ledger.read_program_sheet(TEXAS_ROWS)

    assert len(records) == 5
    assert records[0]["store_number"] == "G135209"
    assert records[0]["address"] == "6010 Wesley Street"


def test_a_row_with_an_invoice_is_graded_invoiced():
    records = {r["store_number"]: r for r in job_ledger.read_program_sheet(TEXAS_ROWS)}

    assert records["G135211"]["evidence"] == job_ledger.INVOICED
    assert records["G135211"]["invoice_amount_cents"] == 2433600
    assert records["G135211"]["job_total_cents"] == 4867200


def test_a_row_with_an_address_and_nothing_else_is_listed_not_invoiced():
    """The forty-seven. This is the whole reason the grade exists."""
    records = {r["store_number"]: r for r in job_ledger.read_program_sheet(TEXAS_ROWS)}

    assert records["G135209"]["evidence"] == job_ledger.LISTED
    assert job_ledger.is_publishable(records["G135209"]["evidence"]) is False


def test_a_submitted_date_alone_is_enough_to_be_invoiced():
    """
    G135217 has a submitted date and no amount. The work was billed; somebody
    just did not fill in the column. That is a bookkeeping gap, not an absence
    of evidence.
    """
    records = {r["store_number"]: r for r in job_ledger.read_program_sheet(TEXAS_ROWS)}

    assert records["G135217"]["evidence"] == job_ledger.INVOICED
    assert records["G135217"]["invoice_amount_cents"] is None


def test_the_metadata_the_sheet_does_not_carry_is_supplied_not_invented():
    records = job_ledger.read_program_sheet(
        TEXAS_ROWS, client="KBP Foods", program="Project Red", category="parking",
        source_document="Texas_Invoice_Tracker_deposits.xlsx",
    )

    assert records[0]["client"] == "KBP Foods"
    assert records[0]["category"] == "parking"
    assert records[0]["source_document"] == "Texas_Invoice_Tracker_deposits.xlsx"


def test_a_sheet_with_no_recognisable_header_reads_as_nothing():
    """Better an empty import than a column read from the wrong position."""
    assert job_ledger.read_program_sheet([("some", "unrelated", "export")]) == []


# ── Money ───────────────────────────────────────────────────────────────────

@pytest.mark.parametrize(
    "raw,cents",
    [
        (24336, 2433600),
        ("24336", 2433600),
        ("$35,575.00", 3557500),
        ("35575.00", 3557500),
        (0, 0),
        ("", None),
        (None, None),
        ("n/a", None),
        ("(250.00)", -25000),
    ],
)
def test_money_is_whole_cents_through_decimal(raw, cents):
    """
    Not float. int(35575.00 * 100) happens to be right and the same expression
    is a cent short on other values — and a total that disagrees with the
    invoice is worse than no total at all on a page that exists to be trusted.
    """
    assert job_ledger.to_cents(raw) == cents


def test_the_authorization_letter_amount_survives_the_round_trip():
    """$35,575.00 — Don Larsen, KBP Foods, 1400 N Lewis Ave, Waukegan IL."""
    assert job_ledger.to_dollars(job_ledger.to_cents("$35,575.00")) == "35575.00"


# ── Punch lists ─────────────────────────────────────────────────────────────

PUNCH_LIST = """Riverdale G135101- 15 parking blocks need replacing. Building need repainting inside and the
outside of the back area.
G135101- need drive thru window push bar need replacing.
Riverdale have 3 cracked windows in the lobby

Union City G135115- ceiling need replacing above pack line.

Villa Rica- G135087 -need 4 parking blocks to be replace.

Chamblee
 New BOH floor
 Seal/Stripe Parking lot
"""


def test_a_punch_list_is_work_requested_and_can_never_grade_higher():
    """
    The trap, stated plainly. Every line here describes work that has NOT been
    done. A single record from this file graded 'invoiced' would put work on a
    public page that the document says is outstanding.
    """
    records = job_ledger.read_punch_list(PUNCH_LIST, client="KBP Foods")

    assert records, "the list is not empty"
    assert {r["evidence"] for r in records} == {job_ledger.REQUESTED}
    assert not any(job_ledger.is_publishable(r["evidence"]) for r in records)


def test_repeated_mentions_of_one_store_stay_one_record():
    records = job_ledger.read_punch_list(PUNCH_LIST)
    riverdale = [r for r in records if r["store_number"] == "G135101"]

    assert len(riverdale) == 1
    assert "15 parking blocks" in riverdale[0]["outstanding_issues"]
    assert "drive thru window push bar" in riverdale[0]["outstanding_issues"]


def test_a_store_named_only_by_its_local_name_is_dropped_rather_than_guessed():
    """
    "Chamblee", "Sugarloaf", "Pleasant Hill" appear with no store number.
    Matching them to an address would mean inventing the link, and an invented
    link is indistinguishable from a real one once it is in the table.
    """
    records = job_ledger.read_punch_list(PUNCH_LIST)

    assert all(r["store_number"] for r in records)
    assert not any((r["outstanding_issues"] or "").startswith("Chamblee") for r in records)


@pytest.mark.parametrize(
    "text,expected",
    [
        ("Riverdale G135101- 15 parking blocks", ["G135101"]),
        ("G135101 and G135115 both", ["G135101", "G135115"]),
        ("g135087 lowercase", ["G135087"]),
        ("G135101 G135101 twice", ["G135101"]),
        ("no store here", []),
        ("G13510 is too short", []),
    ],
)
def test_store_numbers_are_recognised_exactly(text, expected):
    assert job_ledger.store_numbers_in(text) == expected


# ── The summary never rolls the grades together ─────────────────────────────

def test_the_summary_keeps_invoiced_money_apart_from_listed_sites():
    """
    One "total value of work" summing invoiced and listed rows is exactly the
    number that would be wrong, and exactly the number a dashboard reaches for
    first. So there isn't one.
    """
    summary = job_ledger.summarise(job_ledger.read_program_sheet(TEXAS_ROWS))

    assert summary["records"] == 5
    assert summary["publishable"] == 3
    assert summary["by_evidence"]["listed"]["invoiced_cents"] == 0
    assert summary["by_evidence"]["invoiced"]["invoiced_dollars"] == "38736.00"
    assert "total" not in summary


def test_evidence_ranks_so_a_reimport_can_only_strengthen_a_record():
    assert job_ledger.rank(job_ledger.INVOICED) > job_ledger.rank(job_ledger.AUTHORIZED)
    assert job_ledger.rank(job_ledger.AUTHORIZED) > job_ledger.rank(job_ledger.LISTED)
    assert job_ledger.rank(job_ledger.LISTED) > job_ledger.rank(job_ledger.REQUESTED)


def test_only_invoiced_is_publishable():
    assert job_ledger.PUBLISHABLE == {job_ledger.INVOICED}


# ── Through the API ─────────────────────────────────────────────────────────

async def _customer_headers(client) -> dict:
    registration = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "ledger-gate-probe@example.example",
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


def _jsonable(row):
    """JSON has no datetime, so a real client sends the date as a string."""
    return [c.strftime("%Y-%m-%d") if isinstance(c, datetime) else c for c in row]


def _rows_payload(**extra):
    return {"rows": [_jsonable(r) for r in TEXAS_ROWS], **extra}


@pytest.mark.anyio
async def test_a_hosted_customer_cannot_read_the_operators_client_invoices(client):
    headers = await _customer_headers(client)

    assert (await client.get("/api/v1/job-ledger/records", headers=headers)).status_code == 403
    assert (
        await client.post("/api/v1/job-ledger/import", json=_rows_payload(), headers=headers)
    ).status_code == 403


@pytest.mark.anyio
async def test_an_anonymous_caller_cannot_either(client):
    assert (await client.get("/api/v1/job-ledger/summary")).status_code == 403


@pytest.mark.anyio
async def test_importing_the_sheet_records_each_row_at_its_own_grade(client, auth_headers):
    response = await client.post(
        "/api/v1/job-ledger/import",
        json=_rows_payload(client="KBP Foods", program="Project Red", category="parking"),
        headers=auth_headers,
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["created"] == 5
    assert body["summary"]["publishable"] == 3
    assert body["summary"]["by_evidence"]["listed"]["count"] == 2


@pytest.mark.anyio
async def test_the_body_model_is_read_as_a_body(client, auth_headers):
    """
    A 422 asking for a query parameter called "body" is the failure this
    router's missing __future__ import prevents. Worth asserting from the
    outside as well as statically, because the static rule only catches the one
    cause.
    """
    response = await client.post(
        "/api/v1/job-ledger/import", json=_rows_payload(), headers=auth_headers
    )

    assert response.status_code != 422, response.text


@pytest.mark.anyio
async def test_a_listed_site_cannot_be_published_as_completed_work(client, auth_headers):
    """The refusal everything upstream exists to make reachable."""
    await client.post(
        "/api/v1/job-ledger/import",
        json=_rows_payload(category="parking"),
        headers=auth_headers,
    )
    listed = (
        await client.get("/api/v1/job-ledger/records?evidence=listed", headers=auth_headers)
    ).json()["records"][0]

    response = await client.post(
        f"/api/v1/job-ledger/records/{listed['id']}/publish",
        json={"published": True},
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert "listed" in response.json()["detail"]


@pytest.mark.anyio
async def test_an_invoiced_job_can_be_published(client, auth_headers):
    await client.post(
        "/api/v1/job-ledger/import",
        json=_rows_payload(category="parking"),
        headers=auth_headers,
    )
    invoiced = (
        await client.get("/api/v1/job-ledger/records?evidence=invoiced", headers=auth_headers)
    ).json()["records"][0]

    response = await client.post(
        f"/api/v1/job-ledger/records/{invoiced['id']}/publish",
        json={"published": True},
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json()["record"]["published"] is True


@pytest.mark.anyio
async def test_a_reimport_upgrades_a_listed_site_once_the_invoice_arrives(client, auth_headers):
    """
    The sheet is sent once with addresses and again with the invoice columns
    filled in. The second import has to strengthen those rows rather than
    duplicate them.
    """
    addresses_only = [
        _jsonable(TEXAS_ROWS[0]), _jsonable(TEXAS_ROWS[1]),
        ["G135211", "201 S 77 Sunshine Strip", "Harlingen", "TX", "78550",
         None, None, None, None, None, None],
    ]
    await client.post(
        "/api/v1/job-ledger/import",
        json={"rows": addresses_only, "category": "parking"},
        headers=auth_headers,
    )

    with_invoice = [
        _jsonable(TEXAS_ROWS[0]), _jsonable(TEXAS_ROWS[1]),
        ["G135211", "201 S 77 Sunshine Strip", "Harlingen", "TX", "78550",
         None, "2016-11-09", 24336, 48672, None, None],
    ]
    second = await client.post(
        "/api/v1/job-ledger/import",
        json={"rows": with_invoice, "category": "parking"},
        headers=auth_headers,
    )

    assert second.json()["created"] == 0
    assert second.json()["evidence_upgraded"] == 1

    records = (await client.get("/api/v1/job-ledger/records", headers=auth_headers)).json()
    assert records["count"] == 1
    assert records["records"][0]["evidence"] == "invoiced"
    assert records["records"][0]["invoice_amount"] == "24336.00"


@pytest.mark.anyio
async def test_a_later_export_missing_a_column_cannot_demote_invoiced_work(client, auth_headers):
    """
    Somebody re-exports the sheet without the invoice columns. The work was
    still done and still billed; the export lost a column, and a record must
    never lose its grade because a later document was thinner.
    """
    await client.post(
        "/api/v1/job-ledger/import",
        json=_rows_payload(category="parking"),
        headers=auth_headers,
    )
    thin = [
        _jsonable(TEXAS_ROWS[0]), _jsonable(TEXAS_ROWS[1]),
        ["G135211", "201 S 77 Sunshine Strip", "Harlingen", "TX", "78550",
         None, None, None, None, None, None],
    ]
    await client.post(
        "/api/v1/job-ledger/import",
        json={"rows": thin, "category": "parking"},
        headers=auth_headers,
    )

    records = {
        r["store_number"]: r
        for r in (
            await client.get("/api/v1/job-ledger/records", headers=auth_headers)
        ).json()["records"]
    }
    assert records["G135211"]["evidence"] == "invoiced"


@pytest.mark.anyio
async def test_one_store_on_two_programmes_stays_two_records(client, auth_headers):
    """
    A store can be on the parking programme and the roof programme. Collapsing
    them onto the store number alone would lose one of the two invoices.
    """
    row = ["G135372", "41670 Ford Rd", "Canton", "MI", "48187", None,
           "2016-11-09", 5000, 10000, None, None]
    for category in ("parking", "roof"):
        await client.post(
            "/api/v1/job-ledger/import",
            json={"rows": [_jsonable(TEXAS_ROWS[1]), row], "category": category},
            headers=auth_headers,
        )

    records = (await client.get("/api/v1/job-ledger/records", headers=auth_headers)).json()
    assert records["count"] == 2
    assert {r["category"] for r in records["records"]} == {"parking", "roof"}


@pytest.mark.anyio
async def test_a_punch_list_import_publishes_nothing(client, auth_headers):
    response = await client.post(
        "/api/v1/job-ledger/import",
        json={"punch_list_text": PUNCH_LIST, "client": "KBP Foods"},
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json()["summary"]["publishable"] == 0

    publishable = await client.get(
        "/api/v1/job-ledger/records?evidence=publishable", headers=auth_headers
    )
    assert publishable.json()["records"] == []


@pytest.mark.anyio
async def test_rows_and_a_punch_list_in_one_call_are_refused(client, auth_headers):
    """They are graded by opposite rules; one call for both is how they mix."""
    response = await client.post(
        "/api/v1/job-ledger/import",
        json={"rows": [_jsonable(r) for r in TEXAS_ROWS], "punch_list_text": PUNCH_LIST},
        headers=auth_headers,
    )

    assert response.status_code == 400


@pytest.mark.anyio
async def test_the_summary_says_what_each_grade_means(client, auth_headers):
    """
    An operator reading "listed: 47" has to be able to see, without leaving the
    page, that those forty-seven are not jobs.
    """
    await client.post(
        "/api/v1/job-ledger/import",
        json=_rows_payload(category="parking"),
        headers=auth_headers,
    )

    summary = (await client.get("/api/v1/job-ledger/summary", headers=auth_headers)).json()

    assert summary["by_evidence"]["listed"]["publishable"] is False
    assert "not a job" in summary["evidence_meanings"]["listed"]
    assert summary["publishable_states"] == {"TX": 3}
