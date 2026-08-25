"""
Reading the Joist workbook without turning bids into a portfolio.

52 documents recovered from a cancelled account, covering the years every other
record in this repository is missing. That makes them valuable and therefore
tempting to overstate, and there are two specific ways this import goes wrong.

THE EXPENSIVE ONE
The workbook has a sheet of "other invoices/bills — RV park, gravel, hauling,
equipment". Those are things the business BOUGHT. A reader that sees the word
`invoice` and sums the amount column reports a revenue figure inflated by every
load of gravel the company ever paid for.

THE DISHONEST ONE
The leads sheet holds Shakerag WRF, Greenville County speed humps, Hull Street
Self Storage. Impressive names, almost none of them work performed. The KBP
tracker made this mistake available once already: 246 of its 262 rows said
"Not Started".
"""

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from app.services import joist_import as ji  # noqa: E402


# ── Direction: money in vs money out ─────────────────────────────────────────


def test_other_invoices_are_money_going_OUT_not_coming_in():
    """
    The regression that would cost the most. 'Other invoices/bills' contains
    the word 'invoice'; matching that first classifies gravel as revenue.
    """
    for name in ("Other invoices/bills", "Other Invoices & Bills", "OTHER INVOICES"):
        direction, _ = ji.direction_and_grade(name)
        assert direction == ji.PAYABLE, f"{name!r} was read as money earned"


def test_ordinary_invoice_sheets_are_still_receivable():
    direction, grade = ji.direction_and_grade("Joist Invoices & Receipts")
    assert direction == ji.RECEIVABLE
    assert grade == ji.INVOICED


def test_the_earned_total_excludes_everything_payable():
    records = ji.read_rows(
        [{"Number": "1", "Client": "A Church", "Total": "10000"}], "Joist Invoices & Receipts"
    ) + ji.read_rows(
        [{"Number": "G-1", "Client": "Quarry", "Amount": "4000"}], "Other invoices/bills"
    )
    s = ji.summarise(records)
    assert s["invoiced_cents"] == 1_000_000, "gravel got added to revenue"
    assert s["payable_cents"] == 400_000
    assert s["invoiced_cents"] != s["invoiced_cents"] + s["payable_cents"]


def test_no_combined_total_is_ever_reported():
    """
    A single number mixing what was billed out with what was paid for gravel
    means nothing and looks authoritative — the worst combination.
    """
    s = ji.summarise(ji.read_rows([{"Total": "1"}], "Joist Invoices"))
    assert "total_cents" not in s
    assert "net_cents" not in s


# ── A bid is not a job ───────────────────────────────────────────────────────


def test_leads_and_bids_are_not_publishable():
    for name in ("Paving Jobs & Leads", "Bid invites", "Job leads"):
        _, grade = ji.direction_and_grade(name)
        assert grade not in ji.PUBLISHABLE, f"{name!r} would publish unwon bids"


def test_an_estimate_is_quoted_not_completed():
    _, grade = ji.direction_and_grade("Joist Estimates")
    assert grade == ji.QUOTED
    assert grade not in ji.PUBLISHABLE


def test_an_accepted_estimate_becomes_contracted():
    assert ji.grade_row("Joist Estimates", status="Accepted") == ji.CONTRACTED
    assert ji.grade_row("Joist Estimates", note="signed and returned") == ji.CONTRACTED


def test_a_lost_bid_drops_to_requested_whatever_the_sheet_says():
    """A price nobody took is not a price the market paid."""
    assert ji.grade_row("Joist Estimates", status="Lost") == ji.REQUESTED
    assert ji.grade_row("Joist Invoices", status="cancelled") == ji.REQUESTED
    assert ji.grade_row("Paving Jobs & Leads", status="not awarded") == ji.REQUESTED


def test_an_unrecognised_sheet_defaults_to_unpublishable():
    """A tab nobody anticipated must not default to counting as work."""
    _, grade = ji.direction_and_grade("Sheet1")
    assert grade == ji.REQUESTED


# ── Chester ──────────────────────────────────────────────────────────────────


def test_chester_without_a_state_does_not_become_home_market_work():
    """
    Chester SC is 350 miles from Chester VA and the company is headquartered
    in the second one.
    """
    got = ji.resolve_location("Chester")
    assert got["ambiguous"] is True
    assert got["state"] is None
    assert set(got["could_be"]) == {"VA", "SC"}


def test_chester_with_a_state_resolves_cleanly():
    got = ji.resolve_location("Chester", "SC")
    assert got == {"city": "Chester", "state": "SC", "ambiguous": False}


def test_the_other_traps_are_covered():
    for town in ("Lancaster", "Greenville", "Columbia", "Richmond", "Kansas City"):
        assert ji.resolve_location(town)["ambiguous"] is True


def test_an_unambiguous_town_is_left_alone():
    assert ji.resolve_location("Nellysford")["ambiguous"] is False
    assert ji.resolve_location("Hardeeville")["ambiguous"] is False


def test_beaufort_is_ambiguous_because_the_lead_list_contains_one():
    """
    "Holiday Inn Beaufort reseal" carries no state. Beaufort SC is the
    Lowcountry, where this company works; Beaufort NC is the Crystal Coast,
    350 miles away. Resolving it silently would invent a market.
    """
    assert ji.resolve_location("Beaufort")["ambiguous"] is True
    assert set(ji.resolve_location("Beaufort")["could_be"]) == {"SC", "NC"}
    assert ji.resolve_location("Beaufort", "SC")["ambiguous"] is False


def test_ambiguous_rows_are_surfaced_rather_than_dropped_silently():
    records = ji.read_rows(
        [{"Number": "7", "City": "Chester", "Total": "56300"}], "Joist Estimates"
    )
    flagged = ji.summarise(records)["ambiguous_locations"]
    assert len(flagged) == 1 and flagged[0]["ref"] == "7"


# ── Money and dates ──────────────────────────────────────────────────────────


def test_money_reads_the_shapes_a_spreadsheet_actually_produces():
    assert ji.to_cents("$36,800.00") == 3_680_000
    assert ji.to_cents(5500) == 550_000
    assert ji.to_cents("14,000") == 1_400_000
    assert ji.to_cents("(500)") == -50_000, "a credit is negative, not positive"


def test_an_empty_amount_is_none_rather_than_zero():
    """Zero is a real figure. A blank cell is an absent one."""
    assert ji.to_cents("") is None
    assert ji.to_cents(None) is None
    assert ji.to_cents("n/a") is None
    assert ji.to_cents(0) == 0


def test_an_unreadable_date_is_none_not_today():
    assert ji.to_date("") is None
    assert ji.to_date("whenever") is None
    assert ji.to_date("2025-02-22") == "2025-02-22"
    assert ji.to_date("2/22/2025") == "2025-02-22"


# ── The rows ─────────────────────────────────────────────────────────────────


def test_a_row_keeps_its_document_link_so_a_claim_can_be_checked():
    (row,) = ji.read_rows(
        [{"Number": "2832", "Client": "OS Steel PM", "Date": "2025-02-22",
          "Total": "1875", "Link": "https://joist.example/doc/2832"}],
        "Joist Estimates",
    )
    assert row["link"].startswith("https://")
    assert row["ref"] == "2832"
    assert row["amount_cents"] == 187_500


def test_the_summary_counts_publishable_separately_from_documents():
    records = (
        ji.read_rows([{"Number": "1", "Total": "100"}], "Joist Invoices")
        + ji.read_rows([{"Number": "2", "Total": "200"}], "Joist Estimates")
        + ji.read_rows([{"Number": "3", "Total": "300"}], "Paving Jobs & Leads")
    )
    s = ji.summarise(records)
    assert s["documents"] == 3
    assert s["publishable"] == 1, "only the invoice may reach a page"
    assert s["by_grade"][ji.REQUESTED] == 1
    assert s["by_grade"][ji.QUOTED] == 1
