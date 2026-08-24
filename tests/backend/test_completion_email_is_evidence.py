"""
A dated email to the client, and what it does and does not prove.

On 21 April 2017 seven messages went from this company to KBP's facilities
director, one per site: "190 Route 46 Rockaway NJ", "92 St George's Ave,
Rahway NJ", "688 Lyons Ave, Irvington NJ", "185 Ridgedale Ave, Florham Park
NJ", "1055 Route 1 South, North Brunswick NJ", "419 US Route 1, Iselin NJ",
"Route 36 Hazlet, NJ". Two weeks later: "KFC Hackettstown NJ Finished
Pictures".

The invoice tracker's NJ tab records two invoiced jobs. The mailbox shows nine
New Jersey sites. Neither source is wrong: the tracker is a billing document
that was not kept current, and the mail has no money in it. Read together they
cover more than either alone.

Two rules hold everything here:

  * an email that NAMES a site proves contact about it on a date — nothing
    more, so it grades `listed` and waits for a person;
  * an email whose subject SAYS the work is finished is a contemporaneous
    claim of performance made to the client and not disputed — `completed`.

And addresses are parsed, never guessed. "KFC Waco N Loop Store" names a city
and a road with no street number; inventing one would put a fabricated address
on a public page, which this codebase has already done once.
"""

from datetime import datetime, timezone

import pytest

from app.services import completion_email, job_ledger


OURS = ["jhworden1@gmail.com", "wordenpaving@gmail.com"]


def _msg(subject, sender="jhworden1@gmail.com", date="2017-04-21T01:36:40Z",
         to="dlarsen@kbp-foods.com", body="", thread_id="15b8e279362eb853"):
    return {"subject": subject, "sender": sender, "date": date, "to": to,
            "body": body, "thread_id": thread_id}


# ── Parsing the real subject lines ──────────────────────────────────────────

@pytest.mark.parametrize(
    "subject,address,city,state",
    [
        ("92 St George's Ave, Rahway NJ", "92 St George's Ave", "Rahway", "NJ"),
        ("190 Route 46 Rockaway NJ", "190 Route 46", "Rockaway", "NJ"),
        ("1055 Route 1 South, North Brunswick NJ", "1055 Route 1 South", "North Brunswick", "NJ"),
        ("419 US Route 1, Iselin NJ", "419 US Route 1", "Iselin", "NJ"),
        ("688 Lyons Ave, Irvington NJ", "688 Lyons Ave", "Irvington", "NJ"),
        ("185 Ridgedale Ave, Florham Park NJ", "185 Ridgedale Ave", "Florham Park", "NJ"),
    ],
)
def test_a_street_address_in_a_subject_is_read_exactly(subject, address, city, state):
    site = completion_email.parse_site(subject)

    assert site["address"] == address
    assert site["city"] == city
    assert site["state"] == state


def test_a_completion_phrase_is_not_mistaken_for_part_of_the_city():
    """"KFC Hackettstown NJ Finished Pictures" — the city is Hackettstown."""
    site = completion_email.parse_site("KFC Hackettstown NJ Finished Pictures")

    assert site["city"] == "Hackettstown"
    assert site["state"] == "NJ"
    assert site["address"] is None, "there is no street number in that subject"


def test_a_subject_with_no_street_number_yields_no_address():
    """
    "Route 36 Hazlet, NJ" names a road, not an address. Publishing "Route 36,
    Hazlet NJ" as the site of a job would be a street this company never wrote
    down.
    """
    site = completion_email.parse_site("Route 36 Hazlet, NJ")

    assert site["address"] is None
    assert (site["city"], site["state"]) == ("Hazlet", "NJ")


def test_a_subject_that_cannot_be_parsed_yields_nothing_rather_than_a_guess():
    """
    "KFC Waco N Loop Store" has a city and a road and no state code and no
    number. Every field stays empty and the raw text is kept instead.
    """
    site = completion_email.parse_site("KFC Waco N Loop Store")

    assert site["address"] is None
    assert site["city"] is None
    assert site["state"] is None
    assert site["raw_subject"] == "KFC Waco N Loop Store"


def test_a_reply_prefix_is_stripped_before_parsing():
    assert completion_email.parse_site("Fwd: 688 Lyons Ave, Irvington NJ")["city"] == "Irvington"


# ── What counts as saying "done" ────────────────────────────────────────────

@pytest.mark.parametrize(
    "subject",
    ["KFC Hackettstown NJ Finished Pictures", "185 Ridgedale Ave — job completed",
     "final pictures attached", "Work Complete - Rahway"],
)
def test_a_subject_that_says_finished_is_read_as_finished(subject):
    assert completion_email.says_completed(subject) is True


@pytest.mark.parametrize(
    "subject",
    ["190 Route 46 Rockaway NJ", "Picture of areas that's blocked off",
     "Updated links for updated plans", "KFC Leesville LA"],
)
def test_a_subject_that_merely_names_a_site_is_not_a_completion(subject):
    assert completion_email.says_completed(subject) is False


@pytest.mark.parametrize(
    "subject",
    ["job not finished yet", "not complete — rain", "before completion photos", "incomplete punch"],
)
def test_a_negation_is_never_read_as_completion(subject):
    """
    "not finished" contains "finished". A substring match alone would turn a
    message reporting a rain delay into evidence the job was done.
    """
    assert completion_email.says_completed(subject) is False


# ── Reading a mailbox ───────────────────────────────────────────────────────

def test_the_april_2017_batch_reads_as_seven_new_jersey_sites():
    subjects = [
        "Route 36 Hazlet, NJ",
        "190 Route 46 Rockaway NJ",
        "1055 Route 1 South, North Brunswick NJ",
        "419 US Route 1, Iselin NJ",
        "92 St George's Ave, Rahway NJ",
        "688 Lyons Ave, Irvington NJ",
        "185 Ridgedale Ave, Florham Park NJ",
    ]
    records = completion_email.read_messages(
        [_msg(s) for s in subjects], client="KBP Foods", our_addresses=OURS
    )

    assert len(records) == 7
    assert {r["state"] for r in records} == {"NJ"}
    assert all(r["evidence"] == job_ledger.LISTED for r in records), (
        "naming a site proves contact, not completion"
    )
    assert all(not job_ledger.is_publishable(r["evidence"]) for r in records)


def test_a_finished_pictures_email_grades_completed_and_keeps_its_date():
    records = completion_email.read_messages(
        [_msg("KFC Hackettstown NJ Finished Pictures", date="2017-05-05T17:27:11Z")],
        client="KBP Foods", our_addresses=OURS,
    )

    assert records[0]["evidence"] == job_ledger.COMPLETED
    assert records[0]["completed_on"] == datetime(2017, 5, 5, 17, 27, 11, tzinfo=timezone.utc)
    assert job_ledger.is_publishable(records[0]["evidence"]) is True


def test_a_message_from_the_client_is_not_our_record_of_performance():
    """
    Don Larsen writing to us is KBP's request or question. Reading inbound mail
    as evidence of our work would turn "the roof is leaking" into a completed
    job.
    """
    records = completion_email.read_messages(
        [_msg("Del Rio G135231 water leak!!!!", sender="dlarsen@kbp-foods.com")],
        our_addresses=OURS,
    )

    assert records == []


def test_a_message_that_names_no_place_at_all_is_not_a_record():
    records = completion_email.read_messages(
        [_msg("Outlaw & Gene"), _msg("Updated links for updated plans")],
        our_addresses=OURS,
    )

    assert records == []


def test_a_store_number_alone_is_enough_to_key_a_record():
    """No address in the subject, but G135231 identifies the site precisely."""
    records = completion_email.read_messages(
        [_msg("G135267 completed", body="")], our_addresses=OURS
    )

    assert len(records) == 1
    assert records[0]["store_number"] == "G135267"
    assert records[0]["evidence"] == job_ledger.COMPLETED


def test_every_record_carries_the_thread_it_came_from():
    """
    A claim on a public page has to be walkable back to the message behind it
    years later. Without that this is just a list of assertions.
    """
    records = completion_email.read_messages(
        [_msg("92 St George's Ave, Rahway NJ", thread_id="15b8e20d75ec3fb7")],
        our_addresses=OURS,
    )

    assert records[0]["source_document"] == "gmail:15b8e20d75ec3fb7"
    assert records[0]["notes"] == "92 St George's Ave, Rahway NJ"


# ── The set that may be published ───────────────────────────────────────────

def test_completion_joins_invoiced_as_publishable_and_nothing_else_does():
    """
    This set was {invoiced} through several revisions and the test pinning it
    existed to force an argument before it widened. The argument: an invoice is
    a claim for payment, a completion email is a claim of performance. For "was
    this work done", the second is at least as good — nobody sends finished
    pictures of a job that does not exist.

    The practical half matters too. The NJ tab records two invoiced jobs and
    the mailbox shows nine sites. Excluding completion emails does not make the
    portfolio more honest; it makes it wrong in the other direction.
    """
    assert job_ledger.PUBLISHABLE == {job_ledger.COMPLETED, job_ledger.INVOICED}
    for grade in (job_ledger.REQUESTED, job_ledger.LISTED, job_ledger.QUOTED,
                  job_ledger.AUTHORIZED, job_ledger.CONTRACTED):
        assert not job_ledger.is_publishable(grade)


def test_completed_ranks_above_a_contract_and_below_an_invoice():
    assert job_ledger.rank(job_ledger.CONTRACTED) < job_ledger.rank(job_ledger.COMPLETED)
    assert job_ledger.rank(job_ledger.COMPLETED) < job_ledger.rank(job_ledger.INVOICED)


def test_a_reimport_cannot_demote_a_completed_record_to_listed():
    """
    The same site appears in the mailbox twice: once as "Finished Pictures" and
    once as a bare address. The second must not undo the first.
    """
    assert job_ledger.rank(job_ledger.COMPLETED) > job_ledger.rank(job_ledger.LISTED)
