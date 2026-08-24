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


# ── The column that is not our money ────────────────────────────────────────

KBP_PIPELINE_ROWS = [
    (None, None, "ROW", "DMA", "PROJECT STATUS", "STORE #", "Store Address", "CITY",
     "STATE", "ZIP", "PHONE #", "20% CONFIDENCE\nAUV", "80% CONFIDENCE\nAUV"),
    (None, None, 1, 642, "COMPLETE", "G135603", "1830 W Laurel Ave", "Eunice",
     "LA", "70535", "337-466-7219", 1170000, 1080000),
    (None, None, 2, 518, "UC", "G135595", "3105 Sands Boulevard", "Greensboro",
     "NC", "27405", "336-285-5839", 1300000, 1192500),
]


@pytest.mark.parametrize(
    "header",
    ["20% CONFIDENCE\nAUV", "80% CONFIDENCE AUV", "Projected Sales", "Annual Revenue",
     "Monthly Rent", "PHONE #", "Zip"],
)
def test_a_column_that_is_not_money_owed_can_never_become_an_amount(header):
    """
    AUV is Average Unit Volume — the restaurant's projected ANNUAL SALES. On
    KBP's pipeline those two columns total $26,194,220 and $22,862,940 across
    twenty stores, and not a cent of it is money paid to a paving contractor.

    A reader that treats "a number near an address" as an invoice amount turns
    a genuine document into a claim of twenty-six million dollars of work — and
    the figure is specific enough that nobody would think to question it.
    """
    assert job_ledger.is_never_an_amount(header) is True


@pytest.mark.parametrize("header", ["$ amount of Invoice", "Total amount of job", "$ amount paid"])
def test_the_real_money_columns_are_still_money(header):
    assert job_ledger.is_never_an_amount(header) is False


def test_the_pipeline_sheet_yields_sites_with_no_money_attached():
    """
    KBP's pipeline is the client's own construction schedule. It establishes
    that a site was on the programme. It does not establish that we invoiced
    it, and its only large numbers are the restaurant's sales forecast.
    """
    records = job_ledger.read_program_sheet(
        KBP_PIPELINE_ROWS, client="KBP Foods", source_document="KBP_Pipeline__Calendar.xlsx"
    )

    assert len(records) == 2
    assert {r["evidence"] for r in records} == {job_ledger.LISTED}
    assert all(r["invoice_amount_cents"] is None for r in records), (
        "the AUV column must not have been read as an invoice"
    )
    assert all(r["job_total_cents"] is None for r in records)


def test_the_pipeline_summary_reports_no_money_at_all():
    summary = job_ledger.summarise(job_ledger.read_program_sheet(KBP_PIPELINE_ROWS))

    assert summary["publishable"] == 0
    assert summary["by_evidence"]["listed"]["invoiced_cents"] == 0


def test_a_status_of_complete_on_the_clients_schedule_is_not_our_invoice():
    """
    "COMPLETE" there means the restaurant was built and opened. It is KBP's
    milestone, not our receipt, and the two are one careless mapping apart.
    """
    records = job_ledger.read_program_sheet(KBP_PIPELINE_ROWS)
    eunice = [r for r in records if r["store_number"] == "G135603"][0]

    assert eunice["evidence"] == job_ledger.LISTED
    assert job_ledger.is_publishable(eunice["evidence"]) is False


# ── Two store-numbering systems, both real ──────────────────────────────────

@pytest.mark.parametrize(
    "text,expected",
    [
        # The new-build programme sheets.
        ("Riverdale G135101- 15 parking blocks", ["G135101"]),
        # Estimate #2228 names its service address as "KFC (142), 9300
        # Midlothian Turnpike, Richmond VA". Recognising only the G form would
        # silently lose every maintenance estimate in the archive.
        ("KFC (142)\n9300 Midlothian Turnpike", ["KFC 142"]),
        ("Taco Bell (3311) Colonial Heights", ["TACO BELL 3311"]),
        ("kfc(142) lowercase and tight", ["KFC 142"]),
        # A bare number in a sentence is a number.
        ("we ran (142) tons that week", []),
        ("no store here", []),
    ],
)
def test_both_store_numbering_systems_are_recognised(text, expected):
    assert job_ledger.store_numbers_in(text) == expected


def test_a_parenthesised_number_keeps_its_brand():
    """
    "142" alone is not an identifier. KBP operate more than one brand, so a
    Taco Bell 142 and a KFC 142 would collapse into one record and one of the
    two invoices would vanish.
    """
    both = job_ledger.store_numbers_in("KFC (142) and Taco Bell (142)")

    assert both == ["KFC 142", "TACO BELL 142"]


# ── An estimate is not an acceptance ────────────────────────────────────────

def test_our_own_estimate_grades_quoted_and_is_not_publishable():
    """
    Estimate #2228 — KBP Foods, KFC (142), 9300 Midlothian Turnpike, Richmond
    VA, 16 May 2017, $25,589.39. It is a complete and genuine document, and it
    proves what we offered, not that they accepted. The gap between those two
    is where a portfolio quietly inflates.
    """
    assert job_ledger.grade(quoted=True) == job_ledger.QUOTED
    assert job_ledger.is_publishable(job_ledger.QUOTED) is False


def test_a_written_approval_grades_authorized():
    """
    Meckley Services, 27 September 2013: "I am approving the work you verbally
    quoted for me $1500.00", with the address of the patch. Stronger than our
    own estimate — the client has committed — and still not evidence the work
    was finished.
    """
    assert job_ledger.grade(authorized=True) == job_ledger.AUTHORIZED
    assert job_ledger.is_publishable(job_ledger.AUTHORIZED) is False


def test_the_five_grades_rank_in_the_order_the_paperwork_gets_stronger():
    order = [
        job_ledger.REQUESTED,
        job_ledger.LISTED,
        job_ledger.QUOTED,
        job_ledger.AUTHORIZED,
        job_ledger.INVOICED,
    ]
    ranks = [job_ledger.rank(g) for g in order]

    assert ranks == sorted(ranks), "a re-import must never be able to demote a record"
    assert job_ledger.PUBLISHABLE == {job_ledger.INVOICED}, (
        "adding grades must not widen what may be published"
    )


def test_an_invoice_still_beats_a_quote_when_both_are_present():
    """A row carrying both is billed work, not a proposal."""
    assert job_ledger.grade(quoted=True, invoice_amount_cents=2558939) == job_ledger.INVOICED


def test_a_punch_list_line_still_grades_requested_even_with_a_price_on_it():
    assert job_ledger.grade(
        from_punch_list=True, quoted=True, authorized=True, invoice_amount_cents=150000
    ) == job_ledger.REQUESTED


def test_the_estimate_total_survives_as_exact_cents():
    """$25,589.39 — a float round-trip is where a figure stops matching the PDF."""
    assert job_ledger.to_cents("$25,589.39") == 2558939
    assert job_ledger.to_dollars(2558939) == "25589.39"


# ── A contract, and an area somebody actually signed up to ──────────────────

def test_a_formal_contract_grades_contracted_and_still_does_not_publish():
    """
    AIA A105-2007, 31 March 2016: First States Investors 5200, LLC (Gramercy
    Property Trust) and J Worden & Sons Paving — parking lot overlay at
    Robinson & Broad, 2601 West Broad Street, Richmond VA. Contract sum
    $32,500.00.

    Stronger than an email saying go ahead: a contract names a sum and a scope
    and binds both sides. Still not proof the work was completed — that is what
    the invoice and the lien waiver are for, which is precisely what the owner's
    covering letter demanded within 30 days of completion.
    """
    assert job_ledger.grade(contracted=True) == job_ledger.CONTRACTED
    assert job_ledger.is_publishable(job_ledger.CONTRACTED) is False


def test_a_contract_outranks_an_approval_and_an_estimate():
    ranks = [
        job_ledger.rank(job_ledger.QUOTED),
        job_ledger.rank(job_ledger.AUTHORIZED),
        job_ledger.rank(job_ledger.CONTRACTED),
        job_ledger.rank(job_ledger.INVOICED),
    ]
    assert ranks == sorted(ranks)


def test_an_invoice_still_outranks_a_contract():
    assert job_ledger.grade(contracted=True, invoice_amount_cents=3250000) == job_ledger.INVOICED


def test_six_grades_and_still_only_one_of_them_publishes():
    """
    The count has gone from four to six across two changes. Each time, the
    temptation is to let the second-strongest grade through as well. It does
    not, and this test is here to make that a deliberate decision rather than
    an oversight.
    """
    assert len(job_ledger.EVIDENCE_ORDER) == 6
    assert job_ledger.PUBLISHABLE == {job_ledger.INVOICED}


def test_the_contract_sum_survives_as_exact_cents():
    assert job_ledger.to_cents("$32,500.00") == 3250000
    assert job_ledger.to_dollars(3250000) == "32500.00"


@pytest.mark.anyio
async def test_a_sourced_area_is_carried_and_an_unsourced_one_stays_empty(client, auth_headers):
    """
    14,218 sq ft is in the contract. Every other row has no stated area, and it
    must stay null rather than being filled from a map measurement — the
    fabricated database's headline figures were invented square footages, so
    this is the exact field that has already gone wrong once.
    """
    from app.models import ClientJobRecord

    await client.post(
        "/api/v1/job-ledger/import",
        json=_rows_payload(category="parking"),
        headers=auth_headers,
    )
    records = (await client.get("/api/v1/job-ledger/records", headers=auth_headers)).json()

    assert all(r["area_sqft"] is None for r in records["records"]), (
        "a programme sheet states no area, so none is invented"
    )
    assert all(r["area_source"] is None for r in records["records"])
    assert hasattr(ClientJobRecord, "area_sqft")


# ── A third numbering system, and a request that is not a job ───────────────

RITE_AID_RFQ = """construct | preserve | maintain
Chelsea Copeland
STORE NAME:
RIT11262
Rite Aid
4245 Holland Road
Virginia Beach, VA 23452
VENDOR NAME: J Worden and Sons Paving, LLC
PR NO.: 83746   TR NO.: 1541442
Scope of Work
Resurface and restripe parking lot, over 50% alligatored include to repair in proposal as an
option.
Quote Request  Due Date: 6/20/2016
"""


@pytest.mark.parametrize(
    "text,expected",
    [
        ("RIT11262\nRite Aid\n4245 Holland Road", ["RIT11262"]),
        ("rit11262 lowercase", ["RIT11262"]),
        ("RIT112 is too short", []),
        # All three systems, one block of text.
        ("G135211 and KFC (142) and RIT11262", ["G135211", "KFC 142", "RIT11262"]),
    ],
)
def test_the_facilities_management_numbering_is_recognised_too(text, expected):
    """
    KleenCo's quote requests head their store block "RIT11262 / Rite Aid /
    4245 Holland Road". The prefix carries the brand, so unlike a bare "(142)"
    it needs nothing added to be unambiguous.
    """
    assert job_ledger.store_numbers_in(text) == expected


def test_a_quote_request_is_a_request_and_never_a_job():
    """
    KleenCo, 20 June 2016: a request for J Worden to price resurfacing at
    RIT11262. It proves we were on the vendor list and were invited to quote.
    It does not prove we quoted, that anyone accepted, or that a wheel turned —
    the document literally says "This will have to be approved by the client
    prior to commencement of work."

    An RFQ sitting in a folder of job paperwork reads like a job. It is the
    weakest thing in the archive.
    """
    assert job_ledger.grade(from_punch_list=True) == job_ledger.REQUESTED
    assert job_ledger.is_publishable(job_ledger.REQUESTED) is False
    assert "not work performed" in job_ledger.EVIDENCE_MEANING[job_ledger.REQUESTED]


def test_the_rfq_reads_as_one_requested_record_keyed_by_its_store_number():
    records = job_ledger.read_punch_list(RITE_AID_RFQ, client="KleenCo USA")

    assert len(records) == 1
    assert records[0]["store_number"] == "RIT11262"
    assert records[0]["evidence"] == job_ledger.REQUESTED
    assert "alligatored" in records[0]["outstanding_issues"]


def test_the_rfq_carries_no_money_even_though_numbers_are_all_over_it():
    """
    PR 83746 and TR 1541442 are reference numbers. A reader that treats a large
    integer near a store as money invents $83,746 of work from a document that
    records no price at all.
    """
    summary = job_ledger.summarise(job_ledger.read_punch_list(RITE_AID_RFQ))

    assert summary["publishable"] == 0
    assert summary["by_evidence"]["requested"]["invoiced_cents"] == 0


# ── The KFC invoice tracker: six tabs, three column spellings ───────────────

# The QUADS tab, verbatim. Note "$ Amount Invoiced" — five of the six tabs
# spell the same column "$ Amount of Invoice".
QUADS_ROWS = [
    ("Store #", "Invoice #", "Store Address", "City", "State", "Date Submitted",
     "Job Status", "$ Amount Invoiced", "Total Amount of Job", "$ Amount Paid",
     "Outstanding Issues"),
    ("G135001", 2067, "2943 18th Avenue", "Quads", "IL", "2016-10-08",
     "permit", 18719.5, 37439, None, None),
    ("G135002", 2065, "3843 ElmoreAvenue", "Quads", "IA", "2016-10-08",
     "at location currently", 14417.5, 28835, None, None),
]

# The GA tab: no state column at all, and a typo in the issues header.
GA_ROWS = [
    ("Store #", "Invoice #", "Store Address", "City", "Date Submitted",
     "$ Amount of Invoice ", "Date Received", "$ Amount Paid",
     "Outstanding Balance", "Oustanding Issues", "Notes"),
    ("G135074", 1699, "3901 Buford Hwy NE", "Atlanta", "2016-02-01",
     26950, "2016-03-04", 26950, 0, None, None),
]


def test_the_other_spelling_of_the_invoice_column_is_read():
    """
    The failure this prevents was silent and expensive: the QUADS tab reported
    eleven invoiced jobs carrying no money at all, because its header reads
    "$ Amount Invoiced" and the reader only knew "$ Amount of Invoice". Nothing
    errored. The eleven jobs were simply worth nothing.
    """
    records = job_ledger.read_program_sheet(QUADS_ROWS)

    assert len(records) == 2
    assert records[0]["invoice_amount_cents"] == 1871950
    assert records[1]["invoice_amount_cents"] == 1441750
    assert all(r["evidence"] == job_ledger.INVOICED for r in records)


def test_a_half_dollar_survives_the_import():
    """$18,719.50 — the exact value that a naive int() truncation loses."""
    assert job_ledger.to_dollars(
        job_ledger.read_program_sheet(QUADS_ROWS)[0]["invoice_amount_cents"]
    ) == "18719.50"


def test_the_clients_own_job_status_is_kept_verbatim():
    records = job_ledger.read_program_sheet(QUADS_ROWS)

    assert records[0]["job_status"] == "permit"
    assert records[1]["job_status"] == "at location currently"


def test_payment_is_recorded_without_changing_the_grade():
    """
    An unpaid invoice still proves the work was performed — it is a receivable,
    not a doubt about the job. So payment lands in its own fields and the grade
    stays 'invoiced' either way.
    """
    paid = job_ledger.read_program_sheet(GA_ROWS)[0]

    assert paid["amount_paid_cents"] == 2695000
    assert paid["paid_date"] is not None
    assert paid["evidence"] == job_ledger.INVOICED


def test_the_misspelled_issues_header_is_still_read():
    """The GA tab says "Oustanding Issues". A real file has real typos."""
    rows = [
        list(GA_ROWS[0]),
        ["G135074", 1699, "3901 Buford Hwy NE", "Atlanta", "2016-02-01",
         26950, "2016-03-04", 26950, 0, "kerb damaged on the north side", None],
    ]
    assert "kerb damaged" in job_ledger.read_program_sheet(rows)[0]["outstanding_issues"]


# ── A tab named for a state is a state ──────────────────────────────────────

@pytest.mark.parametrize(
    "sheet,state",
    [("GA", "GA"), ("tx", "TX"), (" NJ ", "NJ"), ("QUADS", None),
     ("Parking Lots", None), ("Roof", None), ("", None)],
)
def test_a_state_tab_is_recognised_and_a_work_tab_is_not(sheet, state):
    assert job_ledger.state_from_sheet_name(sheet) == state


def test_the_sheet_name_supplies_the_state_the_rows_do_not_carry():
    """
    The GA, TX, NJ, MI and NY tabs have no state column. Filing them under
    category "ga" would be useless and would throw away the state, which is the
    field a regional page filters on.
    """
    records = job_ledger.read_program_sheet(GA_ROWS, state="GA")

    assert records[0]["state"] == "GA"
    assert records[0]["city"] == "Atlanta"


def test_a_rows_own_state_column_beats_the_sheet_name():
    """
    QUADS is the Quad Cities and straddles a state line — its rows carry IL and
    IA in their own column, and the tab name must not overwrite that.
    """
    records = job_ledger.read_program_sheet(QUADS_ROWS, state="XX")

    assert [r["state"] for r in records] == ["IL", "IA"]
