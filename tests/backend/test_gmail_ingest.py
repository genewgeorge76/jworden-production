"""
Reading a mailbox, and the things that must not go wrong while doing it.

Five addresses, roughly a decade of mail. Read through a conversation it costs
a search per page and forgets everything between sessions; here it is a
scheduled job with a cursor that starts where it stopped.

Three properties this holds:

  * it never writes to Gmail — the scope is readonly and there is no send,
    label or delete path anywhere in the module;
  * a refresh token is a long-lived key to somebody's entire mail, so it is
    encrypted at rest and never leaves the process through any endpoint;
  * a mailbox Google has stopped accepting says so, because a broken
    connection that returns nothing looks exactly like a mailbox with no work
    in it.
"""

import base64
from datetime import datetime, timedelta, timezone

import httpx
import pytest

from app.services import gmail_ingest, job_ledger, mailbox_auth


def _b64(text: str) -> str:
    return base64.urlsafe_b64encode(text.encode("utf-8")).decode("ascii").rstrip("=")


def _message(subject, sender="jhworden1@gmail.com", body="", parts=None, internal="1492735000000"):
    payload = {
        "headers": [
            {"name": "From", "value": sender},
            {"name": "Subject", "value": subject},
            {"name": "To", "value": "dlarsen@kbp-foods.com"},
            {"name": "Date", "value": "Fri, 21 Apr 2017 01:36:40 +0000"},
        ],
        "mimeType": "text/plain",
        "body": {"data": _b64(body)} if body else {},
    }
    if parts:
        payload["parts"] = parts
        payload["mimeType"] = "multipart/mixed"
    return {"id": "m1", "threadId": "t1", "internalDate": internal, "payload": payload}


# ── The body, however the phone sent it ─────────────────────────────────────

def test_a_plain_text_body_is_read():
    message = _message("190 Route 46 Rockaway NJ", body="Lot is sealed and striped.")

    assert "sealed and striped" in gmail_ingest.plain_body(message["payload"])


def test_an_html_only_body_is_read_with_its_tags_stripped():
    """
    A reply typed on a phone is often HTML only — and those are exactly the
    messages that say "finished, here are the pictures".
    """
    payload = {
        "mimeType": "multipart/alternative",
        "parts": [{"mimeType": "text/html", "body": {"data": _b64("<div><b>Job complete</b></div>")}}],
    }

    body = gmail_ingest.plain_body(payload)

    assert "Job complete" in body
    assert "<b>" not in body


def test_plain_text_wins_over_html_when_both_are_present():
    payload = {
        "mimeType": "multipart/alternative",
        "parts": [
            {"mimeType": "text/plain", "body": {"data": _b64("the plain one")}},
            {"mimeType": "text/html", "body": {"data": _b64("<p>the html one</p>")}},
        ],
    }

    assert gmail_ingest.plain_body(payload).strip() == "the plain one"


def test_attachment_names_are_listed_without_fetching_the_bytes():
    """
    The names alone are informative — "JWS Paving - Sub Agreement - CO
    36330-06.pdf" — and cost nothing. Pulling a decade of attachments down to
    find the invoices would cost hours and a disk.
    """
    payload = {
        "mimeType": "multipart/mixed",
        "parts": [
            {"mimeType": "text/plain", "body": {"data": _b64("see attached")}},
            {"filename": "JWS Paving - Sub Agreement - CO 36330-06.pdf", "body": {"attachmentId": "a1"}},
            {"filename": "Contact Sheet-Q2 P5 May 2016.xls", "body": {"attachmentId": "a2"}},
        ],
    }

    assert gmail_ingest.attachment_names(payload) == [
        "JWS Paving - Sub Agreement - CO 36330-06.pdf",
        "Contact Sheet-Q2 P5 May 2016.xls",
    ]


# ── Noise, and the cost of getting the filter wrong ─────────────────────────

@pytest.mark.parametrize(
    "sender,subject",
    [
        ("targetnews@em.target.com", "Your New Weekly Ad is here."),
        ("no-reply@account.blink.com", "You're now subscribed to Blink Plus"),
        ("notifications@mailer.kickserv.com", "Magic Link Login"),
        ("mailer-daemon@googlemail.com", "Delivery Status Notification (Failure)"),
    ],
)
def test_a_mailbox_full_of_someones_life_is_filtered_out(sender, subject):
    assert gmail_ingest._looks_like_work(sender, subject, "") is False


@pytest.mark.parametrize(
    "subject,body",
    [
        ("92 St George's Ave, Rahway NJ", "parking lot sealed"),
        ("KFC Hackettstown NJ Finished Pictures", ""),
        ("Re: Subcontractor Payments", "we were working on the stores as contracted"),
        ("FW: G135267", "roof leaking"),
        ("Rite Aid asphalt patch Fredericksburg", ""),
    ],
)
def test_work_is_kept(subject, body):
    assert gmail_ingest._looks_like_work("jhworden1@gmail.com", subject, body) is True


def test_a_store_number_alone_is_enough_to_keep_a_message():
    """
    "Del Rio G135231 water leak!!!!" contains no paving word. The store number
    is what makes it a record of a site, and dropping it would lose the site.
    """
    assert gmail_ingest._looks_like_work("dlarsen@kbp-foods.com", "Del Rio G135231", "") is True


def test_the_sender_address_is_taken_out_of_a_display_name():
    assert gmail_ingest._address_only("Gene George <jhworden1@gmail.com>") == "jhworden1@gmail.com"
    assert gmail_ingest._address_only("dlarsen@kbp-foods.com") == "dlarsen@kbp-foods.com"


# ── The cursor ──────────────────────────────────────────────────────────────

def test_a_window_is_expressed_in_gmails_own_query_syntax():
    end = datetime(2018, 6, 1, tzinfo=timezone.utc)

    query = gmail_ingest.window_query(end, days=30)

    assert "after:2018/05/02" in query
    assert "before:2018/06/01" in query
    assert "-in:chats" in query


def test_windows_walk_backwards_without_a_gap_or_an_overlap():
    """
    An overlap re-reads mail and a gap loses it silently. The next window ends
    exactly where this one began.
    """
    first_end = datetime(2018, 6, 1, tzinfo=timezone.utc)
    second_end = first_end - timedelta(days=30)

    assert "before:2018/05/02" in gmail_ingest.window_query(second_end, days=30)


def test_gmails_own_timestamp_is_preferred_over_the_date_header():
    """
    The Date header is free text written by whatever client sent the message.
    internalDate is epoch milliseconds and is the same for every message ever
    sent.
    """
    stamped = gmail_ingest._with_internal_date(
        {"date": "Fri, 21 Apr 2017 01:36:40 +0000", "internal_date": "1492738600000"}
    )

    assert isinstance(stamped["date"], datetime)
    assert stamped["date"].year == 2017


def test_a_missing_or_broken_timestamp_leaves_the_header_alone():
    for bad in ({"date": "x", "internal_date": None}, {"date": "x", "internal_date": "banana"}):
        assert gmail_ingest._with_internal_date(bad)["date"] == "x"


# ── Reading a window end to end ─────────────────────────────────────────────

@pytest.fixture()
def gmail(monkeypatch):
    """Stand in for Gmail, so the whole path runs without a token."""
    state = {"messages": [], "listing_calls": 0, "status": 200}
    real_client = httpx.AsyncClient

    def handler(request: httpx.Request) -> httpx.Response:
        if state["status"] != 200:
            return httpx.Response(state["status"], json={})
        if "/messages/" in request.url.path:
            index = int(request.url.path.rsplit("/", 1)[-1].replace("m", "")) - 1
            return httpx.Response(200, json=state["messages"][index])
        state["listing_calls"] += 1
        return httpx.Response(
            200,
            json={"messages": [{"id": f"m{i + 1}"} for i in range(len(state["messages"]))]},
        )

    def factory(*args, **kwargs):
        return real_client(transport=httpx.MockTransport(handler))

    monkeypatch.setattr(gmail_ingest.httpx, "AsyncClient", factory)

    async def fake_token(*args, **kwargs):
        return "an-access-token"

    monkeypatch.setattr(gmail_ingest.mailbox_auth, "access_token", fake_token)
    return state


@pytest.mark.anyio
async def test_a_scan_files_completion_emails_and_drops_the_circulars(gmail):
    gmail["messages"] = [
        {**_message("92 St George's Ave, Rahway NJ", body="sealed and striped"), "id": "m1"},
        {**_message("KFC Hackettstown NJ Finished Pictures", body="parking lot done"), "id": "m2"},
        {**_message("Your New Weekly Ad is here.", sender="targetnews@em.target.com"), "id": "m3"},
    ]

    result = await gmail_ingest.scan_window(
        "a-refresh-token", days=30, our_addresses=["jhworden1@gmail.com"]
    )

    assert result["messages_seen"] == 3
    assert result["messages_kept"] == 2, "the circular is not work"

    grades = {r["evidence"] for r in result["records"]}
    assert job_ledger.COMPLETED in grades
    assert job_ledger.LISTED in grades


@pytest.mark.anyio
async def test_a_scan_reports_the_boundary_so_the_next_run_can_resume(gmail):
    gmail["messages"] = [_message("92 St George's Ave, Rahway NJ", body="sealed")]
    end = datetime(2018, 6, 1, tzinfo=timezone.utc)

    result = await gmail_ingest.scan_window("t", before=end, days=30, our_addresses=["jhworden1@gmail.com"])

    assert result["next_before"] == end - timedelta(days=30), (
        "a scan that cannot say where it stopped has to start over"
    )


@pytest.mark.anyio
async def test_a_mailbox_google_refuses_says_so_rather_than_reading_as_empty(gmail):
    """
    Consent withdrawn, password changed, API disabled. Returning "no records
    found" would read as "there is no work in this mailbox", and the operator
    would go looking for jobs that are sitting safely in Gmail.
    """
    # Set on the fixture rather than re-patching httpx: the fixture already
    # replaced httpx.AsyncClient, so capturing it again here would capture the
    # FIXTURE'S factory and quietly go on returning 200s.
    gmail["status"] = 403

    with pytest.raises(gmail_ingest.MailboxUnavailable):
        await gmail_ingest.scan_window("t", our_addresses=["jhworden1@gmail.com"])


# ── The token ───────────────────────────────────────────────────────────────

def test_a_refresh_token_round_trips_through_encryption(monkeypatch):
    from cryptography.fernet import Fernet

    monkeypatch.setattr(mailbox_auth._cfg, "get", lambda k, d="": (
        Fernet.generate_key().decode() if k == "MAILBOX_TOKEN_KEY" else d
    ))
    # One key for the whole test, not a fresh one per call.
    key = Fernet.generate_key().decode()
    monkeypatch.setattr(mailbox_auth._cfg, "get", lambda k, d="": key if k == "MAILBOX_TOKEN_KEY" else d)

    blob = mailbox_auth.encrypt_token("1//0gRefreshTokenValue")

    assert "1//0gRefresh" not in blob, "the stored form must not contain the token"
    assert mailbox_auth.decrypt_token(blob) == "1//0gRefreshTokenValue"


def test_storing_a_token_without_a_key_is_refused_rather_than_stored_in_the_clear(monkeypatch):
    monkeypatch.setattr(mailbox_auth._cfg, "get", lambda k, d="": "")

    with pytest.raises(mailbox_auth.MailboxAuthNotConfigured):
        mailbox_auth.encrypt_token("1//0gRefreshTokenValue")


def test_a_fingerprint_identifies_a_token_without_revealing_it():
    token = "1//0gRefreshTokenValue"
    fingerprint = mailbox_auth.token_fingerprint(token)

    assert len(fingerprint) == 12
    assert token not in fingerprint
    assert fingerprint == mailbox_auth.token_fingerprint(token)


def test_the_consent_link_asks_for_read_only_and_forces_a_refresh_token(monkeypatch):
    """
    Without prompt=consent Google returns a refresh token only on a mailbox's
    FIRST ever authorisation and silently omits it every time after — so
    reconnecting appears to succeed and then cannot be used.
    """
    values = {
        "GMAIL_OAUTH_CLIENT_ID": "cid.apps.googleusercontent.com",
        "GMAIL_OAUTH_REDIRECT_URI": "https://example.test/callback",
    }
    monkeypatch.setattr(mailbox_auth._cfg, "get", lambda k, d="": values.get(k, d))

    url = mailbox_auth.consent_url(email_hint="wordenpaving@gmail.com")

    assert "gmail.readonly" in url
    assert "access_type=offline" in url
    assert "prompt=consent" in url
    assert "login_hint=wordenpaving%40gmail.com" in url
    for forbidden in ("gmail.send", "gmail.modify", "mail.google.com"):
        assert forbidden not in url, "this system has no reason to write to a mailbox"


def test_no_consent_link_without_a_client(monkeypatch):
    monkeypatch.setattr(mailbox_auth._cfg, "get", lambda k, d="": "")

    with pytest.raises(mailbox_auth.MailboxAuthNotConfigured):
        mailbox_auth.consent_url(email_hint="x@example.test")


def test_the_module_has_no_way_to_write_to_a_mailbox():
    """
    A structural check, not a behavioural one. The scope is readonly, and this
    asserts the code could not use a wider one if it were granted.
    """
    source = (
        __import__("pathlib").Path(gmail_ingest.__file__).read_text(encoding="utf-8").lower()
    )
    for verb in ("/messages/send", "batchmodify", "\"post\"", "client.post", ".delete(", "trash"):
        assert verb not in source, f"gmail_ingest must not be able to {verb}"
