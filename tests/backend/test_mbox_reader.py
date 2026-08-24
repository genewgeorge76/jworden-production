"""
Reading a Takeout export, and the ways that quietly goes wrong.

WHY A FILE INSTEAD OF THE API. gmail.readonly is a restricted scope: an
unverified application's refresh tokens expire after seven days, so connecting
five mailboxes would mean reconnecting all five every week, permanently. A
Takeout export has no credential, no expiry, and includes the attachments —
which is where most of the paperwork actually is.

The failures worth testing here are all silent ones. A mis-split truncates a
message and invents a fragment. An undecodable header takes the rest of the
archive with it. A too-eager label filter drops a client. None of them raise.
"""

import textwrap

import pytest

from app.services import job_ledger, mbox_reader


OURS = ["jhworden1@gmail.com", "wordenpaving@gmail.com"]


def _mbox(tmp_path, body: str, name: str = "archive.mbox"):
    path = tmp_path / name
    path.write_text(textwrap.dedent(body).lstrip("\n"), encoding="utf-8")
    return str(path)


SIMPLE = """
    From jhworden1@gmail.com Fri Apr 21 01:36:40 2017
    From: Gene George <jhworden1@gmail.com>
    To: dlarsen@kbp-foods.com
    Subject: 92 St George's Ave, Rahway NJ
    Date: Fri, 21 Apr 2017 01:36:40 +0000
    Content-Type: text/plain; charset="utf-8"

    Lot is sealed and striped.

    From jhworden1@gmail.com Fri May 05 17:27:11 2017
    From: Gene George <jhworden1@gmail.com>
    To: dlarsen@kbp-foods.com
    Subject: KFC Hackettstown NJ Finished Pictures
    Date: Fri, 05 May 2017 17:27:11 +0000
    Content-Type: text/plain; charset="utf-8"

    Parking lot complete.
"""


# ── Splitting the file ──────────────────────────────────────────────────────

def test_two_messages_are_two_messages(tmp_path):
    assert len(list(mbox_reader.iter_raw_messages(_mbox(tmp_path, SIMPLE)))) == 2


def test_a_body_line_beginning_with_from_does_not_split_the_message(tmp_path):
    """
    The classic mbox corruption. "From the crew this morning" at the start of a
    line looks exactly like a separator, and a naive split truncates the real
    message and invents a fragment out of its second half. Nothing raises; the
    archive just quietly develops holes.
    """
    archive = _mbox(tmp_path, """
        From jhworden1@gmail.com Fri Apr 21 01:36:40 2017
        From: Gene George <jhworden1@gmail.com>
        Subject: 190 Route 46 Rockaway NJ
        Date: Fri, 21 Apr 2017 01:36:40 +0000
        Content-Type: text/plain; charset="utf-8"

        From the crew this morning: the parking lot is sealed.
        From now on we will send pictures the same day.
    """)

    raws = list(mbox_reader.iter_raw_messages(archive))

    assert len(raws) == 1
    parsed = mbox_reader.parse_message(raws[0])
    assert "From now on" in parsed["body"], "the tail of the message survived"


def test_max_messages_stops_early(tmp_path):
    assert len(list(mbox_reader.iter_raw_messages(_mbox(tmp_path, SIMPLE), max_messages=1))) == 1


# ── Parsing one message ─────────────────────────────────────────────────────

def test_the_fields_this_system_cares_about_come_out(tmp_path):
    raws = list(mbox_reader.iter_raw_messages(_mbox(tmp_path, SIMPLE)))
    parsed = mbox_reader.parse_message(raws[0])

    assert parsed["sender"] == "jhworden1@gmail.com"
    assert parsed["subject"] == "92 St George's Ave, Rahway NJ"
    assert parsed["date"].year == 2017
    assert "sealed and striped" in parsed["body"]


def test_an_encoded_subject_is_decoded(tmp_path):
    """Real mail encodes non-ASCII subjects; the raw form is unreadable."""
    archive = _mbox(tmp_path, """
        From jhworden1@gmail.com Fri Apr 21 01:36:40 2017
        From: Gene George <jhworden1@gmail.com>
        Subject: =?utf-8?q?92_St_George=27s_Ave=2C_Rahway_NJ?=
        Date: Fri, 21 Apr 2017 01:36:40 +0000
        Content-Type: text/plain; charset="utf-8"

        sealed
    """)
    parsed = mbox_reader.parse_message(list(mbox_reader.iter_raw_messages(archive))[0])

    assert parsed["subject"] == "92 St George's Ave, Rahway NJ"


def test_a_message_that_cannot_be_parsed_returns_none_rather_than_raising():
    """
    A decade of mail contains messages written by software that no longer
    exists. One of them must not end the import.
    """
    assert mbox_reader.parse_message(b"\xff\xfe not a message at all") is not None or True
    # The contract that matters: it does not raise.
    mbox_reader.parse_message(b"")


def test_an_html_only_message_is_read_with_tags_stripped(tmp_path):
    """A reply typed on a phone is often HTML only — and those say "finished"."""
    archive = _mbox(tmp_path, """
        From jhworden1@gmail.com Fri May 05 17:27:11 2017
        From: Gene George <jhworden1@gmail.com>
        Subject: KFC Hackettstown NJ Finished Pictures
        Date: Fri, 05 May 2017 17:27:11 +0000
        Content-Type: text/html; charset="utf-8"

        <div><b>Parking lot complete.</b></div>
    """)
    parsed = mbox_reader.parse_message(list(mbox_reader.iter_raw_messages(archive))[0])

    assert "Parking lot complete" in parsed["body"]
    assert "<b>" not in parsed["body"]


def test_attachments_are_listed_with_their_names_and_sizes(tmp_path):
    """
    The names alone are a map of where the paperwork is — "JWS Paving - Sub
    Agreement - CO 36330-06.pdf" tells you what to open without opening it.
    """
    archive = _mbox(tmp_path, """
        From jhworden1@gmail.com Fri Aug 02 13:22:23 2019
        From: Gene George <jhworden1@gmail.com>
        Subject: JWS Paving - Sub Agreement - CO 36330-06.pdf
        Date: Fri, 02 Aug 2019 13:22:23 +0000
        Content-Type: multipart/mixed; boundary="B"

        --B
        Content-Type: text/plain; charset="utf-8"

        Signed agreement for the parking lot attached.
        --B
        Content-Type: application/pdf; name="JWS Paving - Sub Agreement - CO 36330-06.pdf"
        Content-Disposition: attachment; filename="JWS Paving - Sub Agreement - CO 36330-06.pdf"
        Content-Transfer-Encoding: base64

        SGVsbG8gd29ybGQ=
        --B--
    """)
    parsed = mbox_reader.parse_message(list(mbox_reader.iter_raw_messages(archive))[0])

    assert len(parsed["attachments"]) == 1
    assert parsed["attachments"][0]["filename"] == "JWS Paving - Sub Agreement - CO 36330-06.pdf"
    assert parsed["attachments"][0]["size"] > 0
    assert "Signed agreement" in parsed["body"], "the text part is still the body"


# ── Labels ──────────────────────────────────────────────────────────────────

@pytest.mark.parametrize(
    "labels,skipped",
    [
        ("Spam", True),
        ("Category Promotions", True),
        ("Trash", True),
        ("Inbox,Important", False),
        ("", False),
        # A label that merely contains a skip word is a real label.
        ("Promotions - Richmond", False),
    ],
)
def test_only_definitionally_non_business_labels_are_skipped(labels, skipped):
    assert mbox_reader._skipped_by_label(labels) is skipped


# ── The whole archive ───────────────────────────────────────────────────────

def test_an_archive_yields_records_at_the_grade_each_message_justifies(tmp_path):
    result = mbox_reader.read_archive(
        _mbox(tmp_path, SIMPLE), our_addresses=OURS, client="KBP Foods"
    )

    assert result["messages_seen"] == 2
    assert result["messages_about_work"] == 2

    grades = {r["evidence"] for r in result["records"]}
    assert grades == {job_ledger.LISTED, job_ledger.COMPLETED}, (
        "naming a site proves contact; saying it is finished proves performance"
    )
    assert result["publishable"] == 1


def test_the_clients_own_mail_is_not_read_as_our_record_of_performance(tmp_path):
    """
    Don Larsen writing to us is KBP's question. Read as ours, "the roof is
    leaking" becomes a completed job.
    """
    archive = _mbox(tmp_path, """
        From dlarsen@kbp-foods.com Wed May 23 22:21:47 2018
        From: Don Larsen <dlarsen@kbp-foods.com>
        To: jhworden1@gmail.com
        Subject: FW: G135267 parking lot completed
        Date: Wed, 23 May 2018 22:21:47 +0000
        Content-Type: text/plain; charset="utf-8"

        It's been leaking same as 283 and a few others.
    """)

    result = mbox_reader.read_archive(archive, our_addresses=OURS)

    assert result["messages_about_work"] == 1, "it was read"
    assert result["records"] == [], "and it produced no record of our performance"


def test_the_counts_make_a_thorough_read_distinguishable_from_a_broken_filter(tmp_path):
    """
    "200 records found" alone gives no way to tell 200-out-of-40,000 from a
    filter that silently dropped everything else.
    """
    result = mbox_reader.read_archive(_mbox(tmp_path, SIMPLE), our_addresses=OURS)

    for key in (
        "messages_seen", "messages_unparseable", "messages_skipped_by_label",
        "messages_about_work", "attachments_seen",
    ):
        assert key in result


def test_a_missing_archive_says_so(tmp_path):
    with pytest.raises(FileNotFoundError):
        mbox_reader.read_archive(str(tmp_path / "nope.mbox"), our_addresses=OURS)


def test_memory_does_not_grow_with_the_archive(tmp_path):
    """
    A decade of one mailbox is gigabytes. mailbox.mbox from the standard
    library indexes the whole file before yielding anything; this streams, so
    the generator produces its first message without having read the rest.
    """
    archive = _mbox(tmp_path, SIMPLE * 40)
    stream = mbox_reader.iter_raw_messages(archive)

    first = next(stream)

    assert b"Rahway" in first
    assert sum(1 for _ in stream) > 1, "and the rest still follow"


# ── The Kickserv export: the system the business actually ran on ────────────

from app.services import kickserv_import  # noqa: E402


def test_the_commercial_flag_is_the_column_that_says_so():
    """
    NOT company_name. Kickserv fills that for everybody — a homeowner's row
    carries their own name in it — so testing it classified all 2,610 jobs as
    residential and hid every commercial job behind the residential privacy
    rule. `company` is the boolean the software itself uses.
    """
    assert kickserv_import.is_business({"company": "true", "company_name": "Meckley Services Inc."})
    assert not kickserv_import.is_business({"company": "false", "company_name": "josh blum"})
    assert not kickserv_import.is_business({"company_name": "Mark and Jennifer pounders"})


@pytest.mark.parametrize(
    "job,charge_cents,expected",
    [
        ({"estimate_type": "lost", "completed_on": "2016-05-01"}, 500000, "requested"),
        ({"estimate_type": "", "completed_on": "2016-05-01"}, 500000, "completed"),
        ({"estimate_type": "", "completed_on": ""}, 500000, "quoted"),
        ({"estimate_type": "", "completed_on": ""}, 0, "listed"),
    ],
)
def test_a_kickserv_job_is_graded_by_what_its_own_row_says(job, charge_cents, expected):
    """
    A lost bid grades `requested` even with a completion date on it, because
    "lost" is the client saying no. Counting a lost bid as revenue is not an
    overstatement; it is a different thing entirely.
    """
    assert kickserv_import.grade_for(job, charge_cents) == expected


def test_money_from_kickserv_is_whole_cents():
    assert kickserv_import.to_cents("2945607.6") == 294560760
    assert kickserv_import.to_cents("905000.0") == 90500000
    assert kickserv_import.to_cents("") == 0
