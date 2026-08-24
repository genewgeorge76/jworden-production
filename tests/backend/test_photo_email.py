"""
The photo-email parser, tested against the real subject lines.

Every subject in this file is a verbatim subject from the KBP photo mail. They
are the test data because they are the only test data that matters: the parser
exists to read what the crew actually typed, not a tidied-up version of it.

THE RULE WORTH BREAKING THE BUILD OVER
A "Before Pictures" email must never grade as completed. It is evidence the
company stood on the site with a camera before starting work. Read it as
completion and every job that was photographed and then cancelled becomes a
finished job on a public page.
"""

import pytest

from app.services import job_ledger, photo_email


# (subject, store, address, city, state, evidence)
REAL_SUBJECTS = [
    (
        "KFC(369) 12721 Michigan Ave, Dearborn MI After/During Pictures w/ Final Invoice",
        "KFC 369", "12721 Michigan Ave", "Dearborn", "MI", job_ledger.INVOICED,
    ),
    (
        "KFC(356) 8939 W Seven Mile Rd, Detroit MI Before Pics",
        "KFC 356", "8939 W Seven Mile Rd", "Detroit", "MI", job_ledger.LISTED,
    ),
    (
        "KFC(195) 2722 S Main St, High Point NC (After Pictures)",
        "KFC 195", "2722 S Main St", "High Point", "NC", job_ledger.COMPLETED,
    ),
    (
        "KFC(149)10151 Hull street Rd, Midlothian VA Finished Pictures",
        "KFC 149", "10151 Hull street Rd", "Midlothian", "VA", job_ledger.COMPLETED,
    ),
    (
        "KFC(184) 2304 Maple Ave, Burlington NC During-After Pics",
        "KFC 184", "2304 Maple Ave", "Burlington", "NC", job_ledger.COMPLETED,
    ),
    (
        "KFC(135) 5010 Mercury Blvd, Newport News VA During-After pictures",
        "KFC 135", "5010 Mercury Blvd", "Newport News", "VA", job_ledger.COMPLETED,
    ),
    (
        "KFC #189 4623 W Market St, Greensboro NC Before Pictures",
        "KFC 189", "4623 W Market St", "Greensboro", "NC", job_ledger.LISTED,
    ),
    (
        "KFC Hackettstown NJ Finished Pictures",
        None, None, "Hackettstown", "NJ", job_ledger.COMPLETED,
    ),
]


@pytest.mark.parametrize("subject,store,address,city,state,evidence", REAL_SUBJECTS)
def test_a_real_subject_line_parses_to_the_job_it_names(
    subject, store, address, city, state, evidence
):
    parsed = photo_email.parse_photo_subject(subject)
    assert parsed["store"] == store
    assert parsed["address"] == address
    assert parsed["city"] == city
    assert parsed["state"] == state
    assert parsed["evidence"] == evidence


def test_before_pictures_never_grade_as_completed():
    """The one that would put cancelled jobs on a public page."""
    for subject in (
        "KFC(356) 8939 W Seven Mile Rd, Detroit MI Before Pics",
        "KFC(184) 2304 Maple Ave Burlington NC Before Pictures",
        "KFC 2340 Randleman Rd, Greensboro NC before pictures",
        "KFC(186) N Church St Burlington, NC Before Pictures",
    ):
        grade = photo_email.grade_for(subject)
        assert grade == job_ledger.LISTED
        assert not job_ledger.is_publishable(grade), (
            f"{subject!r} would have been published as finished work"
        )


def test_during_alone_is_not_completion_either():
    assert photo_email.grade_for("KFC(162) 1010 Independence Blvd Before/During Pictures") == (
        job_ledger.LISTED
    )


def test_a_mixed_phase_subject_grades_on_the_strongest_phase_present():
    """"During-After" includes the after photographs, so it is completion."""
    parsed = photo_email.parse_photo_subject(
        "KFC(186) N Church St, Burlington NC During-After Pictures"
    )
    assert parsed["phases"] == ["during", "after"]
    assert parsed["evidence"] == job_ledger.COMPLETED


def test_an_invoice_named_in_the_subject_lifts_completed_to_invoiced():
    with_invoice = "KFC(369) 12721 Michigan Ave, Dearborn MI After/During Pictures w/ Final Invoice"
    without = "KFC(369) 12721 Michigan Ave, Dearborn MI After/During Pictures"

    assert photo_email.grade_for(with_invoice) == job_ledger.INVOICED
    assert photo_email.grade_for(without) == job_ledger.COMPLETED
    assert photo_email.names_an_invoice(with_invoice)
    assert not photo_email.names_an_invoice(without)


def test_an_invoice_on_a_before_email_does_not_make_it_completed():
    """
    An invoice can accompany photographs of work not yet done — a deposit
    invoice does exactly that. Only the phase decides whether work happened.
    """
    grade = photo_email.grade_for("KFC(356) 8939 W Seven Mile Rd, Detroit MI Before Pics w/ Invoice")
    assert grade == job_ledger.LISTED


def test_a_subject_with_no_phase_word_grades_nothing_and_is_not_recorded():
    """
    "KFC Alpharetta GA Pictures" says a photograph exists. It does not say the
    work was done, so it must not enter the ledger at all.
    """
    for subject in ("Pictures of KFC Stockbridge", "KFC Alpharetta GA Pictures", "KFC ROOF PICTURES"):
        assert photo_email.grade_for(subject) is None
        assert photo_email.record_from({"id": "abc", "subject": subject}) is None


def test_the_photo_noun_never_ends_up_in_the_city():
    """The bug this guards: city == 'Alpharetta GA Pictures'."""
    for subject in ("KFC Alpharetta GA Pictures", "Pictures of KFC Stockbridge"):
        city = photo_email.parse_photo_subject(subject)["city"] or ""
        assert not any(
            word in city.lower() for word in ("picture", "pics", "photo")
        ), f"{subject!r} produced city {city!r}"


def test_a_subject_with_no_street_number_yields_no_address():
    """
    "N Church St" has no number. Producing an address from it would file a
    photograph against a street the company never wrote down.
    """
    parsed = photo_email.parse_photo_subject(
        "KFC(186) N Church St, Burlington NC During-After Pictures"
    )
    assert parsed["address"] is None
    assert parsed["city"] == "Burlington"
    assert parsed["state"] == "NC"


def test_a_run_together_street_and_city_still_splits():
    """No comma: '2304 Maple Ave Burlington NC'."""
    parsed = photo_email.parse_photo_subject(
        "KFC(184) 2304 Maple Ave Burlington NC Before Pictures"
    )
    assert parsed["address"] == "2304 Maple Ave"
    assert parsed["city"] == "Burlington"


def test_a_record_carries_the_subject_it_came_from():
    record = photo_email.record_from(
        {"id": "15d95ba54f30d5f6",
         "subject": "KFC(195) 2722 S Main St, High Point NC (After Pictures)"}
    )
    assert record["source_document"] == "photo-email:15d95ba54f30d5f6"
    assert record["evidence"] == job_ledger.COMPLETED
    assert record["store_number"] == "KFC 195"
    assert record["job_status"] == "after"
    # The subject verbatim, so the record can be audited without the mailbox.
    assert "2722 S Main St" in record["notes"]


def test_a_record_with_no_message_id_gets_no_source_and_cannot_duplicate():
    record = photo_email.record_from(
        {"subject": "KFC Hackettstown NJ Finished Pictures"}
    )
    assert record["source_document"] is None


def test_the_store_number_hash_form_is_recognised():
    """'KFC #189' was silently dropped before — only '(189)' was matched."""
    assert job_ledger.store_numbers_in("KFC #189 4623 W Market St") == ["KFC 189"]
    assert job_ledger.store_numbers_in("KFC(369) x") == ["KFC 369"]
    assert job_ledger.store_numbers_in("KFC (142) x") == ["KFC 142"]


def test_a_bare_number_is_still_not_a_store_number():
    """'KFC 2340 Randleman Rd' — 2340 is a street number, not a store."""
    assert job_ledger.store_numbers_in("KFC 2340 Randleman Rd, Greensboro NC") == []
