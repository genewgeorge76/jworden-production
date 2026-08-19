"""
Tests for the SERP engine.

The properties worth pinning are the ones the hardcoded JavaScript version got
wrong: no invented rows, no unsourced numbers, aggregates that state their own
coverage, and a generator that is deterministic.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))


# ── Empty is empty ───────────────────────────────────────────────────────────


async def test_empty_store_returns_no_rows_rather_than_samples(client, auth_headers):
    r = await client.get("/api/v1/seo/keywords", headers=auth_headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["total"] == 0
    assert body["keywords"] == []
    s = body["summary"]
    assert s["keywords"] == 0
    # Absent, not zero: nothing was measured, so there is no total.
    assert s["total_monthly_volume"] is None
    assert s["avg_cpc_usd"] is None


async def test_status_reports_emptiness_and_gsc_state(client, auth_headers):
    r = await client.get("/api/v1/seo/status", headers=auth_headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["keywords_stored"] == 0
    assert body["by_source"] == {}
    assert body["search_console"]["configured"] is False
    assert body["search_console"]["reason"]
    # Page generation needs no data source.
    assert body["generation_available"] is True


# ── Provenance is mandatory ──────────────────────────────────────────────────


async def test_import_without_a_source_is_rejected(client, auth_headers):
    r = await client.post(
        "/api/v1/seo/keywords/import",
        headers=auth_headers,
        json={"keywords": [{"keyword": "commercial asphalt paving contractor",
                            "volume_monthly": 2400, "cpc_usd": 58.5}]},
    )
    assert r.status_code == 422


async def test_imported_rows_carry_their_source(client, auth_headers):
    r = await client.post(
        "/api/v1/seo/keywords/import",
        headers=auth_headers,
        json={"source": "ahrefs-export-2026-08-19",
              "keywords": [{"keyword": "commercial asphalt paving contractor",
                            "volume_monthly": 2400, "cpc_usd": 58.5, "category": "milling"}]},
    )
    assert r.status_code == 200, r.text
    assert r.json()["created"] == 1

    listing = await client.get("/api/v1/seo/keywords", headers=auth_headers)
    row = listing.json()["keywords"][0]
    assert row["source"] == "ahrefs-export-2026-08-19"
    assert row["source_captured_at"]
    assert listing.json()["summary"]["sources"] == ["ahrefs-export-2026-08-19"]


async def test_reimport_updates_in_place(client, auth_headers):
    payload = {"source": "s1", "keywords": [{"keyword": "kw one", "volume_monthly": 100}]}
    first = await client.post("/api/v1/seo/keywords/import", headers=auth_headers, json=payload)
    second = await client.post(
        "/api/v1/seo/keywords/import",
        headers=auth_headers,
        json={"source": "s2", "keywords": [{"keyword": "kw one", "volume_monthly": 250}]},
    )
    assert first.json()["created"] == 1
    assert second.json()["updated"] == 1

    listing = await client.get("/api/v1/seo/keywords", headers=auth_headers)
    assert listing.json()["total"] == 1
    assert listing.json()["keywords"][0]["volume_monthly"] == 250
    assert listing.json()["keywords"][0]["source"] == "s2"


async def test_a_partial_import_does_not_blank_another_source_columns(client, auth_headers):
    """
    GSC knows position and impressions; a keyword tool knows volume and CPC.
    Neither may erase what the other supplied.
    """
    await client.post("/api/v1/seo/keywords/import", headers=auth_headers,
                      json={"source": "ahrefs", "keywords": [
                          {"keyword": "kw", "volume_monthly": 900, "cpc_usd": 42.0}]})
    await client.post("/api/v1/seo/keywords/import", headers=auth_headers,
                      json={"source": "search-console", "keywords": [
                          {"keyword": "kw", "impressions": 1200, "clicks": 40,
                           "current_position": 6.2}]})

    row = (await client.get("/api/v1/seo/keywords", headers=auth_headers)).json()["keywords"][0]
    assert row["volume_monthly"] == 900   # survived
    assert row["cpc_usd"] == 42.0         # survived
    assert row["impressions"] == 1200
    assert row["current_position"] == 6.2


# ── Aggregates state their coverage ──────────────────────────────────────────


async def test_summary_reports_how_many_rows_backed_each_figure(client, auth_headers):
    await client.post("/api/v1/seo/keywords/import", headers=auth_headers,
                      json={"source": "mixed", "keywords": [
                          {"keyword": "a", "volume_monthly": 1000, "cpc_usd": 50.0},
                          {"keyword": "b", "volume_monthly": 500},
                          {"keyword": "c"},
                      ]})
    s = (await client.get("/api/v1/seo/keywords", headers=auth_headers)).json()["summary"]
    assert s["keywords"] == 3
    assert s["with_volume"] == 2      # an average over 2 of 3 is a different claim
    assert s["with_cpc"] == 1
    assert s["total_monthly_volume"] == 1500
    assert s["avg_cpc_usd"] == 50.0


async def test_modelled_value_requires_an_explicit_ctr_and_shows_it(client, auth_headers):
    await client.post("/api/v1/seo/keywords/import", headers=auth_headers,
                      json={"source": "ahrefs-2026-08", "keywords": [
                          {"keyword": "a", "volume_monthly": 1000, "cpc_usd": 50.0}]})

    without = (await client.get("/api/v1/seo/keywords", headers=auth_headers)).json()["summary"]
    assert without["modelled_monthly_value_usd"] is None
    assert without["assumed_ctr"] is None

    with_ctr = (await client.get(
        "/api/v1/seo/keywords?assumed_ctr=0.05", headers=auth_headers)).json()["summary"]
    assert with_ctr["assumed_ctr"] == 0.05
    assert with_ctr["modelled_monthly_value_usd"] == 2500.0
    assert with_ctr["modelled_from_keywords"] == 1


# ── Export ───────────────────────────────────────────────────────────────────


async def test_csv_export_includes_source_and_leaves_gaps_empty(client, auth_headers):
    await client.post("/api/v1/seo/keywords/import", headers=auth_headers,
                      json={"source": "ahrefs-2026-08", "keywords": [
                          {"keyword": "measured", "volume_monthly": 800, "cpc_usd": 12.5},
                          {"keyword": "unmeasured"},
                      ]})
    r = await client.get("/api/v1/seo/keywords.csv", headers=auth_headers)
    assert r.status_code == 200
    text = r.text
    assert "source" in text.splitlines()[0]
    assert "ahrefs-2026-08" in text
    # An unmeasured metric is blank, never 0 — 0 would read as a measurement.
    unmeasured = [ln for ln in text.splitlines() if ln.startswith("unmeasured")][0]
    assert ",0," not in unmeasured


# ── Search Console import fails closed ───────────────────────────────────────


async def test_gsc_import_fails_closed_when_unconfigured(client, auth_headers):
    r = await client.post("/api/v1/seo/keywords/import-gsc", headers=auth_headers)
    assert r.status_code == 503
    assert "GSC" in r.json()["detail"] or "Search Console" in r.json()["detail"]


# ── Generation is deterministic and needs no data ────────────────────────────


async def test_landing_page_is_deterministic(client, auth_headers):
    url = "/api/v1/seo/landing-page?domain=TexasPavementGroup.com&city=Dallas&state=TX&vertical=pavement"
    a = await client.get(url, headers=auth_headers)
    b = await client.get(url, headers=auth_headers)
    assert a.status_code == 200, a.text
    assert a.json() == b.json()

    body = a.json()
    assert body["url"] == "https://texaspavementgroup.com/tx/dallas/commercial-contractor"
    assert body["json_ld"]["@type"] == "PavingContractor"
    assert body["json_ld"]["areaServed"]["name"] == "Dallas, TX"
    # Not "Commercial PAVEMENT Contractor" — the label is looked up, not upcased.
    assert body["h1"] == "Commercial Paving Contractor in Dallas, TX"


async def test_silo_counts_pages_built_not_cities_submitted(client, auth_headers):
    r = await client.post(
        "/api/v1/seo/silo",
        headers=auth_headers,
        json={"domain": "texaspavementgroup.com", "vertical": "pavement",
              "cities": [["Dallas", "TX"], ["dallas", "tx"], ["Houston", "TX"]]},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["cities_submitted"] == 3
    assert body["pages_built"] == 2   # the two Dallas spellings collapse
    assert {p["path"] for p in body["pages"]} == {
        "/tx/dallas/commercial-contractor", "/tx/houston/commercial-contractor"
    }


async def test_seo_routes_require_auth(client):
    for path in ("/api/v1/seo/status", "/api/v1/seo/keywords", "/api/v1/seo/keywords.csv"):
        r = await client.get(path)
        assert r.status_code == 403, path


def test_schema_type_falls_back_rather_than_guessing():
    from app.services.serp_engine import schema_type_for
    assert schema_type_for("pavement") == "PavingContractor"
    assert schema_type_for("roofing") == "RoofingContractor"
    # Unknown vertical gets a type true of any contractor, not an invented one.
    assert schema_type_for("underwater_basket_weaving") == "GeneralContractor"
