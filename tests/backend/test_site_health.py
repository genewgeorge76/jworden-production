"""
Tests for site health.

Built from failures this system actually had, not a generic checklist. Each
test below reproduces something that was live and undetected:

  a primary domain replaced by a Sedo parking page, reporting 200 for days
  a live site canonicalizing to that parked domain
  two domains serving one identical page
  a deployed site whose HTML contains no visible text at all

The through-line: a status code is not health. Every one of these returns 200.
"""
from __future__ import annotations

import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from app.services import site_health as sh  # noqa: E402

MASTER_KEY_TENANT = "JWORDEN_HQ"

# Trimmed from the real response at jwordenasphaltpaving.com.
PARKED_HTML = """<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>jwordenasphaltpaving.com - jwordenasphaltpaving Resources and Information.</title>
<link rel="icon" href="//img.sedoparking.com/templates/logos/sedo_logo.png"/></head>
<body><img src="https://img.sedoparking.com/images/js_preloader.gif" alt=""/></body></html>"""

HEALTHY_HTML = """<!DOCTYPE html><html><head><title>Richmond Asphalt Paving</title>
<link rel="canonical" href="https://www.richmondasphaltpaving.com"></head><body>
<main><h1>Commercial asphalt paving in Richmond, Virginia</h1>
<p>Parking lots, drive lanes and truck entrances built to Virginia Department of
Transportation mix specifications. Crews working across the Richmond District
since the company was founded, with milling, overlay, sealcoating and striping
handled in house rather than subcontracted out to a third party crew.</p>
</main></body></html>"""


def _analyse(domain, html, *, status=200, headers=None):
    return sh.analyse(domain, f"https://{domain}/", status_code=status,
                      headers=headers or {}, html=html)


# ── The failure that hid for days ────────────────────────────────────────────


def test_a_parking_page_is_critical_even_though_it_returns_200():
    """
    The whole reason this module exists. A four-hourly check watched this
    domain go green every cycle while it served somebody else's ads.
    """
    r = _analyse("jwordenasphaltpaving.com", PARKED_HTML,
                 headers={"server": "Parking/1.0"})
    assert r.status_code == 200
    assert r.severity == "critical"
    assert r.serving_site is False
    assert [f.check for f in r.findings] == ["parked"]
    assert "sedoparking" in r.findings[0].detail


def test_the_parking_finding_says_what_to_do():
    r = _analyse("example.com", PARKED_HTML, headers={"server": "Parking/1.0"})
    assert "DNS" in r.findings[0].remedy or "hosting" in r.findings[0].remedy


@pytest.mark.parametrize("marker", [
    "sedoparking.com", "parkingcrew.net", "bodis.com",
    "this domain is for sale", "buy this domain",
])
def test_every_parking_signature_is_caught(marker):
    html = f"<html><body><p>{marker}</p></body></html>"
    assert _analyse("x.com", html).severity == "critical"


def test_a_parked_page_is_detected_from_headers_alone():
    """Some parking services serve a near-empty body."""
    r = _analyse("x.com", "<html><body></body></html>",
                 headers={"server": "Parking/1.0"})
    assert [f.check for f in r.findings] == ["parked"]


# ── The other live failures ──────────────────────────────────────────────────


def test_an_unrendered_spa_is_critical_not_ok():
    shell = ('<html><head><title>OBX Paving</title>'
             '<link rel="canonical" href="https://www.obxpaving.com/"></head>'
             '<body><div id="root"></div><script src="/a.js"></script></body></html>')
    r = _analyse("obxpaving.com", shell)
    assert r.visible_words < sh.MIN_VISIBLE_WORDS
    assert "empty_shell" in [f.check for f in r.findings]
    assert r.severity == "critical"


def test_canonical_pointing_at_another_host_is_critical():
    """
    jwordenuniversity.com was telling Google the real version of its homepage
    lived on a domain that serves a parking page.
    """
    html = HEALTHY_HTML.replace(
        "https://www.richmondasphaltpaving.com",
        "https://www.jwordenasphaltpaving.com")
    r = _analyse("jwordenuniversity.com", html)
    drift = [f for f in r.findings if f.check == "canonical_drift"]
    assert drift, [f.check for f in r.findings]
    assert "jwordenasphaltpaving.com" in drift[0].detail
    assert r.severity == "critical"


def test_a_www_canonical_on_the_bare_host_is_not_drift():
    """www and apex are the same site; flagging that would cry wolf hourly."""
    r = _analyse("richmondasphaltpaving.com", HEALTHY_HTML)
    assert "canonical_drift" not in [f.check for f in r.findings]
    assert r.severity == "ok"


def test_a_missing_canonical_warns_but_does_not_alarm():
    html = HEALTHY_HTML.replace(
        '<link rel="canonical" href="https://www.richmondasphaltpaving.com">', '')
    r = _analyse("x.com", html)
    assert "no_canonical" in [f.check for f in r.findings]
    assert r.severity == "warning"


def test_an_unexpected_noindex_is_critical():
    html = HEALTHY_HTML.replace(
        "</head>", '<meta name="robots" content="noindex, nofollow"></head>')
    r = _analyse("richmondasphaltpaving.com", html)
    assert "unexpected_noindex" in [f.check for f in r.findings]


def test_two_domains_serving_one_page_are_reported_as_duplicates():
    a = _analyse("thewordenstandard.com", HEALTHY_HTML)
    b = _analyse("jwordenuniversity.com", HEALTHY_HTML)
    dupes = sh.find_duplicates([a, b])
    assert len(dupes) == 1
    assert dupes[0]["domains"] == ["jwordenuniversity.com", "thewordenstandard.com"]


def test_distinct_pages_are_not_reported_as_duplicates():
    a = _analyse("a.com", HEALTHY_HTML)
    b = _analyse("b.com", HEALTHY_HTML.replace("Richmond", "Savannah")
                                      .replace("Virginia", "Georgia"))
    assert sh.find_duplicates([a, b]) == []


def test_a_healthy_page_reports_ok_with_no_findings():
    r = _analyse("richmondasphaltpaving.com", HEALTHY_HTML)
    assert r.severity == "ok"
    assert r.findings == []
    assert r.visible_words >= sh.MIN_VISIBLE_WORDS


# ── Text extraction ──────────────────────────────────────────────────────────


def test_head_and_comments_do_not_count_as_visible_text():
    """
    They are byte-identical across every page in this build. Counting them
    scores unrelated pages as near-duplicates and hides the real ones — a bug
    the build-time uniqueness gate hit before this module existed.
    """
    noise = ("<!-- " + "boilerplate " * 60 + "-->"
             "<head><title>t</title><style>.a{color:red}</style></head>"
             "<nav>Home Services Contact</nav><footer>All rights reserved</footer>")
    r = _analyse("x.com", f"<html>{noise}<body>{noise}<main>Two words</main></body></html>")
    assert r.visible_words < 10, r.visible_words


def test_an_error_response_is_critical():
    r = _analyse("x.com", "<html><body>Not found</body></html>", status=503)
    assert r.severity == "critical"
    assert "unreachable" in [f.check for f in r.findings]


# ── Persistence and alerting ─────────────────────────────────────────────────


def test_only_severity_changes_are_reported(app_modules):
    """
    A check repeating the same critical finding hourly is one people filter
    out. The signal is the transition.
    """
    _, dbmod = app_modules
    db = dbmod.SessionLocal()
    try:
        ok = _analyse("richmondasphaltpaving.com", HEALTHY_HTML).as_dict()
        parked = _analyse("richmondasphaltpaving.com", PARKED_HTML,
                          headers={"server": "Parking/1.0"}).as_dict()

        first = sh.persist(db, [ok])
        assert first == {"degraded": [], "recovered": []}, "first sight is not a change"

        again = sh.persist(db, [ok])
        assert again == {"degraded": [], "recovered": []}, "steady state is silent"

        broke = sh.persist(db, [parked])
        assert broke["degraded"] == ["richmondasphaltpaving.com: ok -> critical"]

        fixed = sh.persist(db, [ok])
        assert fixed["recovered"] == ["richmondasphaltpaving.com: critical -> ok"]
    finally:
        db.close()


def test_severity_since_records_when_it_broke_not_when_it_was_checked(app_modules):
    _, dbmod = app_modules
    from app.models import SiteHealthCheck

    db = dbmod.SessionLocal()
    try:
        ok = _analyse("x.com", HEALTHY_HTML).as_dict()
        sh.persist(db, [ok])
        row = db.query(SiteHealthCheck).filter(SiteHealthCheck.domain == "x.com").first()
        first_seen = row.severity_since

        sh.persist(db, [ok])
        db.refresh(row)
        assert row.severity_since == first_seen, "unchanged severity must not restamp"
        assert row.checked_at >= first_seen
    finally:
        db.close()


# ── Through the API ──────────────────────────────────────────────────────────


async def test_status_says_nothing_has_run_rather_than_reporting_healthy(
    client, auth_headers
):
    """An empty table must not read as 'all clear'."""
    r = await client.get("/api/v1/site-health/status", headers=auth_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["checked"] == 0
    assert "No check has run yet" in body["message"]
    assert len(body["monitored_domains"]) >= 10


async def test_monitored_lists_every_check_and_what_it_catches(client, auth_headers):
    r = await client.get("/api/v1/site-health/monitored", headers=auth_headers)
    assert r.status_code == 200
    checks = {c["check"] for c in r.json()["checks"]}
    assert {"parked", "empty_shell", "canonical_drift", "duplicate_body"} <= checks


async def test_site_health_is_gated(client):
    r = await client.get("/api/v1/site-health/status")
    assert r.status_code in (401, 403)
