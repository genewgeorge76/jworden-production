"""
Tests for programmatic county pages.

Two properties, both about what the generator refuses to emit:

  1. No search metric appears anywhere in the output. Volume and CPC are the
     first thing asked of a programmatic SEO tool and the easiest thing to
     fabricate convincingly; nothing measures them here.
  2. Every technical string traces to a cited specification. Seven citations
     in this codebase were already wrong once, and a page citing the wrong
     VDOT section reads as expertise to a customer and as sloppiness to an
     engineer.

Plus the geography, which the source document got wrong twice.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from app.services import market_pages as mp  # noqa: E402
from app.services import va_market_geo as geo  # noqa: E402


# ── Geography ────────────────────────────────────────────────────────────────


def test_there_are_exactly_nine_vdot_districts():
    assert len(geo.DISTRICTS) == 9


def test_northern_virginia_is_a_district():
    """The source document omitted it and listed eight."""
    assert "northern_virginia" in geo.BY_KEY
    assert geo.district_for("Fairfax").key == "northern_virginia"


def test_there_is_no_eastern_shore_district():
    """
    The source document invented one. Accomack and Northampton are in the
    Hampton Roads District.
    """
    assert "eastern_shore" not in geo.BY_KEY
    assert geo.district_for("Accomack").key == "hampton_roads"
    assert geo.district_for("Northampton").key == "hampton_roads"


def test_all_ninety_five_counties_are_covered_exactly_once():
    counties = [c for c, _ in geo.all_counties()]
    assert len(counties) == 95
    assert len(set(counties)) == 95, "a county appears in two districts"


def test_validate_rejects_an_incomplete_roster(monkeypatch):
    """The invariant must actually fail when broken, not just pass today."""
    trimmed = tuple(
        geo.District(d.key, d.name, d.counties[:-1]) if d.key == "bristol" else d
        for d in geo.DISTRICTS
    )
    monkeypatch.setattr(geo, "DISTRICTS", trimmed)
    with pytest.raises(ValueError, match="incomplete"):
        geo.validate()


def test_county_lookup_tolerates_the_county_suffix():
    assert geo.district_for("Augusta") is geo.district_for("Augusta County")


def test_an_independent_city_is_not_a_county():
    """
    Virginia has 38 independent cities belonging to no county. Filing them
    under a neighbour would put a page on the wrong administrative area.
    """
    assert geo.district_for("Virginia Beach") is None
    with pytest.raises(mp.UnknownCounty, match="Independent cities"):
        mp.generate_page(domain="example.com", county="Virginia Beach",
                         service="sealcoating", business_name="X")


# ── No fabricated metrics ────────────────────────────────────────────────────


FORBIDDEN = ("volume", "cpc", "search_volume", "difficulty", "traffic",
             "monthly_searches", "estimated_traffic")


def test_a_generated_page_carries_no_search_metric():
    page = mp.generate_page(domain="example.com", county="Augusta",
                            service="commercial-asphalt-paving",
                            business_name="X").as_dict()
    blob = json.dumps(page).lower()
    for token in FORBIDDEN:
        assert token not in blob, f"page output mentions {token!r}"


def test_pagespec_has_no_field_that_could_hold_a_volume():
    """A struct with the field invites something to fill it in."""
    fields = set(mp.PageSpec.__dataclass_fields__)
    for token in FORBIDDEN:
        assert not any(token in f for f in fields), f"PageSpec has a {token} field"


def test_a_plan_reports_page_count_but_not_projected_traffic():
    result = mp.plan(domain="example.com", business_name="X")
    assert result["page_count"] == 95 * len(mp.SERVICES)
    blob = json.dumps(result).lower()
    for token in ("projected", "estimated traffic", "cpc", "search volume"):
        assert token not in blob


# ── Citations ────────────────────────────────────────────────────────────────


def test_every_specification_names_its_source():
    for key, spec in mp.SPECIFICATIONS.items():
        assert spec.source, f"{key} has no source"
        assert spec.code


def test_asphalt_mixes_cite_section_211_not_315():
    """
    Section 211 is Asphalt Concrete. Citing the wrong section for a mix design
    is the exact class of error already corrected seven times here.
    """
    for key in ("sm_9_5a", "sm_12_5a", "bm_25_0a"):
        assert "Section 211" in mp.SPECIFICATIONS[key].source


def test_the_entrance_permit_cites_the_administrative_code_chapter():
    spec = mp.SPECIFICATIONS["entrance_permit"]
    assert spec.code == "24VAC30-151"
    assert "Chapter 151" in spec.source


def test_a_page_only_emits_specifications_from_the_table():
    known = {s.code for s in mp.SPECIFICATIONS.values()}
    for service in mp.SERVICES:
        page = mp.generate_page(domain="example.com", county="Augusta",
                                service=service, business_name="X")
        for spec in page.specifications:
            assert spec["code"] in known


# ── Schema ───────────────────────────────────────────────────────────────────


def test_the_schema_type_is_a_real_schema_org_type():
    """
    The source document used "PavingContractor", which schema.org does not
    define. The eight HomeAndConstructionBusiness subtypes are Electrician,
    GeneralContractor, HVACBusiness, HousePainter, Locksmith, MovingCompany,
    Plumber, RoofingContractor. An unrecognised @type is markup Google ignores.
    """
    valid = {"Electrician", "GeneralContractor", "HVACBusiness", "HousePainter",
             "Locksmith", "MovingCompany", "Plumber", "RoofingContractor",
             "HomeAndConstructionBusiness"}
    assert mp.SCHEMA_TYPE in valid
    assert mp.SCHEMA_TYPE != "PavingContractor"

    page = mp.generate_page(domain="example.com", county="Augusta",
                            service="sealcoating", business_name="X")
    assert page.schema_jsonld["@type"] in valid


def test_schema_area_served_is_an_administrative_area():
    page = mp.generate_page(domain="example.com", county="Bath",
                            service="sealcoating", business_name="X")
    area = page.schema_jsonld["areaServed"]
    assert area["@type"] == "AdministrativeArea"
    assert area["name"] == "Bath County, Virginia"


def test_telephone_is_omitted_when_not_supplied():
    page = mp.generate_page(domain="example.com", county="Bath",
                            service="sealcoating", business_name="X")
    assert "telephone" not in page.schema_jsonld


# ── Output shape ─────────────────────────────────────────────────────────────


def test_meta_lengths_stay_within_what_search_engines_display():
    for county, _ in geo.all_counties():
        for service in mp.SERVICES:
            page = mp.generate_page(domain="thewordenstandard.com", county=county,
                                    service=service, business_name="The Worden Standard")
            assert len(page.meta_title) <= 60, page.meta_title
            assert len(page.meta_description) <= 155, page.meta_description


def test_descriptions_are_not_cut_mid_word():
    for county, _ in geo.all_counties():
        page = mp.generate_page(domain="thewordenstandard.com", county=county,
                                service="commercial-entrance",
                                business_name="The Worden Standard")
        assert not page.meta_description.endswith(" ")
        assert page.meta_description.endswith(".")


def test_every_generated_url_is_unique():
    result = mp.plan(domain="example.com", business_name="X")
    assert len(set(result["urls"])) == len(result["urls"])


def test_unknown_service_is_rejected():
    with pytest.raises(mp.UnknownService):
        mp.generate_page(domain="example.com", county="Augusta",
                         service="hovercraft-repair", business_name="X")


# ── Through the API ──────────────────────────────────────────────────────────


async def test_districts_endpoint_reports_nine_and_ninetyfive(client, auth_headers):
    r = await client.get("/api/v1/market/districts", headers=auth_headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["district_count"] == 9
    assert body["county_count"] == 95
    assert "vdot.virginia.gov" in body["source"]


async def test_counties_can_be_filtered_by_district(client, auth_headers):
    r = await client.get("/api/v1/market/counties?district=northern_virginia",
                         headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["count"] == 4


async def test_an_unknown_district_filter_is_404(client, auth_headers):
    r = await client.get("/api/v1/market/counties?district=eastern_shore",
                         headers=auth_headers)
    assert r.status_code == 404


async def test_preview_returns_a_page_with_cited_specs(client, auth_headers):
    r = await client.post("/api/v1/market/pages/preview", headers=auth_headers,
                          json={"domain": "thewordenstandard.com",
                                "county": "Augusta",
                                "service": "commercial-asphalt-paving",
                                "business_name": "The Worden Standard"})
    assert r.status_code == 200, r.text
    page = r.json()["page"]
    assert page["district"] == "Staunton District"
    assert all(s["source"] for s in page["specifications"])


async def test_the_keywords_endpoint_returns_no_numbers_and_says_why(
    client, auth_headers
):
    """
    The question that will keep being asked. It gets the truth, not a table.
    """
    r = await client.get("/api/v1/market/keywords", headers=auth_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["keywords"] == []
    assert "no keyword volume" in body["reason"].lower()
    assert body["sources"]["ahrefs"]["connected"] is False
    assert body["sources"]["google_search_console"]["connected"] is False


async def test_market_endpoints_are_gated(client):
    r = await client.get("/api/v1/market/districts")
    assert r.status_code in (401, 403)
