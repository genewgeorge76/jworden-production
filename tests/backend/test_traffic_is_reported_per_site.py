"""
Traffic for each website, not just the flagship.

gsc_client reads one GSC_SITE_URL and ga4_client one GA4_PROPERTY_ID, and every
public function in each is hardwired to it. That answers "how is the flagship
doing" and cannot answer "how is each site in the programme doing" — which is
the question a website factory exists to answer, for the operator across all of
them and for a customer across their own.

The rule these tests exist to hold: a site with no numbers reports WHY, never
zero. Zero is a measurement. Rendering "not connected" as 0 clicks tells an
operator his site is dead when nothing was asked.
"""

import pytest

from app.services import site_traffic


OWNER = "JWORDEN_HQ"
CUSTOMER = "a-paying-tenant"


@pytest.fixture()
def sites(app_modules):
    _, dbmod = app_modules
    from app.models import MarketSite

    session = dbmod.SessionLocal()
    try:
        session.add_all(
            [
                MarketSite(tenant_id=OWNER, hostname="richmondasphaltpaving.com", city_target="Richmond"),
                MarketSite(tenant_id=OWNER, hostname="carolinablacktop.com", city_target="Charlotte"),
                MarketSite(tenant_id=CUSTOMER, hostname="clientpaving.example", city_target="Roanoke"),
            ]
        )
        session.commit()
        yield session
    finally:
        session.close()


# ── The property is derived, so there is nothing to configure per site ──────

@pytest.mark.parametrize(
    "hostname,expected",
    [
        ("richmondasphaltpaving.com", "sc-domain:richmondasphaltpaving.com"),
        ("www.richmondasphaltpaving.com", "sc-domain:richmondasphaltpaving.com"),
        ("https://richmondasphaltpaving.com/", "sc-domain:richmondasphaltpaving.com"),
        ("HTTPS://WWW.Example.COM", "sc-domain:example.com"),
    ],
)
def test_the_search_console_property_comes_from_the_hostname(hostname, expected):
    """
    A domain property covers apex, www and every subdomain in one grant. The
    alternative needs separate grants for https, http and www, and misses any
    the operator forgets.
    """
    assert site_traffic._gsc_property_for(hostname) == expected


# ── Absent numbers are absent, not zero ─────────────────────────────────────

def test_an_unconfigured_search_console_says_so(sites, monkeypatch):
    monkeypatch.setattr(site_traffic.gsc_client, "_build_service", lambda: None)
    result = site_traffic._search_console_for("example.com", 28)

    assert result["status"] == site_traffic.NOT_CONFIGURED
    assert "GSC_SERVICE_ACCOUNT_JSON" in result["detail"]
    # The distinction the whole module exists for.
    assert "clicks" not in result


def test_an_unconfigured_analytics_says_so(sites, monkeypatch):
    monkeypatch.setattr(site_traffic.ga4_client, "_build_client", lambda: None)
    result = site_traffic._analytics_for("example.com", 28)

    assert result["status"] == site_traffic.NOT_CONFIGURED
    assert "sessions" not in result


def test_no_rows_is_not_reported_as_no_traffic(sites, monkeypatch):
    """
    _run_query swallows API errors and returns []. So "the service account was
    never granted on this property" and "the site had no impressions" arrive
    here identically, and this must not pick one.
    """
    monkeypatch.setattr(site_traffic.gsc_client, "_build_service", lambda: object())
    monkeypatch.setattr(site_traffic.gsc_client, "_run_query", lambda *a, **k: [])

    result = site_traffic._search_console_for("example.com", 28)
    assert result["status"] == site_traffic.NO_DATA
    assert "added as a user" in result["detail"]
    assert "no impressions" in result["detail"]


def test_totals_only_cover_sites_that_answered(sites, monkeypatch):
    """
    Summing across a set where half returned "not connected" produces a number
    that looks like a measurement and is not one.
    """
    def _one_site_answers(hostname, _days):
        if hostname == "richmondasphaltpaving.com":
            return {"status": site_traffic.OK, "clicks": 120, "impressions": 4000}
        return {"status": site_traffic.NOT_CONFIGURED, "detail": "nope"}

    monkeypatch.setattr(site_traffic, "_search_console_for", _one_site_answers)
    monkeypatch.setattr(
        site_traffic, "_analytics_for", lambda *_: {"status": site_traffic.NOT_CONFIGURED}
    )

    report = site_traffic.for_tenant(sites, tenant_id=OWNER)
    assert report["site_count"] == 2
    assert report["sites_reporting"] == 1
    assert report["totals"]["across_sites"] == 1
    assert report["totals"]["clicks"] == 120


def test_totals_refuse_when_nothing_answered(sites, monkeypatch):
    monkeypatch.setattr(
        site_traffic, "_search_console_for", lambda *_: {"status": site_traffic.NOT_CONFIGURED}
    )
    monkeypatch.setattr(
        site_traffic, "_analytics_for", lambda *_: {"status": site_traffic.NOT_CONFIGURED}
    )

    totals = site_traffic.for_tenant(sites, tenant_id=OWNER)["totals"]
    assert totals["status"] == site_traffic.NO_DATA
    assert "clicks" not in totals


# ── Scoping ─────────────────────────────────────────────────────────────────

def _stub_google(monkeypatch):
    monkeypatch.setattr(
        site_traffic, "_search_console_for", lambda *_: {"status": site_traffic.NOT_CONFIGURED}
    )
    monkeypatch.setattr(
        site_traffic, "_analytics_for", lambda *_: {"status": site_traffic.NOT_CONFIGURED}
    )


def test_the_operator_sees_every_site(sites, monkeypatch):
    _stub_google(monkeypatch)
    report = site_traffic.for_tenant(sites, tenant_id=OWNER)
    assert report["viewer"] == "operator"
    assert {s["hostname"] for s in report["sites"]} == {
        "richmondasphaltpaving.com",
        "carolinablacktop.com",
    }


def test_a_customer_sees_only_their_own(sites, monkeypatch):
    _stub_google(monkeypatch)
    report = site_traffic.for_tenant(sites, tenant_id=CUSTOMER)
    assert report["viewer"] == "customer"
    assert [s["hostname"] for s in report["sites"]] == ["clientpaving.example"]


def test_naming_another_tenants_hostname_returns_nothing(sites, monkeypatch):
    """
    The site list is filtered before any Google call is made, so a customer
    cannot read another tenant's numbers by asking for their hostname.
    """
    _stub_google(monkeypatch)
    report = site_traffic.for_tenant(
        sites, tenant_id=CUSTOMER, hostname="richmondasphaltpaving.com"
    )
    assert report["site_count"] == 0
    assert report["sites"] == []


@pytest.mark.anyio
async def test_the_endpoint_requires_authentication(client):
    response = await client.get("/api/v1/traffic/sites")
    assert response.status_code in (401, 403)


@pytest.mark.anyio
async def test_the_endpoint_returns_the_report(client, auth_headers, sites, monkeypatch):
    _stub_google(monkeypatch)
    response = await client.get("/api/v1/traffic/sites?days=7", headers=auth_headers)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["window_days"] == 7
    assert body["viewer"] == "operator"
