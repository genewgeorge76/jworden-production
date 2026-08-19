"""
Tests for the JWordenAI master-node router.

The three properties worth pinning are the three that changed when the drafted
Express router was translated: registrations survive, writes are real, and the
compaction verdict comes from the measurement rather than the caller.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

NODE = {"X-JWordenAI-System-ID": "JWORDENAI-MASTER-AI-NODE"}


def _h(auth_headers: dict) -> dict:
    return {**auth_headers, **NODE}


# ── Auth and routing ─────────────────────────────────────────────────────────


async def test_hub_requires_bearer_token(client):
    r = await client.get("/api/v1/hub/domains", headers=NODE)
    assert r.status_code == 403


async def test_hub_rejects_a_call_addressed_to_another_node(client, auth_headers):
    r = await client.get(
        "/api/v1/hub/domains",
        headers={**auth_headers, "X-JWordenAI-System-ID": "SOME-OTHER-NODE"},
    )
    assert r.status_code == 400
    assert "JWORDENAI-MASTER-AI-NODE" in r.json()["detail"]


async def test_hub_requires_the_system_id_header(client, auth_headers):
    r = await client.get("/api/v1/hub/domains", headers=auth_headers)
    assert r.status_code == 422


# ── Domains ──────────────────────────────────────────────────────────────────


async def test_domains_start_empty_rather_than_preseeded(client, auth_headers):
    """
    The list reflects what is registered, not a hardcoded portfolio. A seeded
    list would report domains as Active before anything mounted them.
    """
    r = await client.get("/api/v1/hub/domains", headers=_h(auth_headers))
    assert r.status_code == 200
    body = r.json()
    assert body["count"] == 0
    assert body["domains"] == []
    assert body["node"] == "JWORDENAI-MASTER-AI-NODE"


async def test_register_domain_persists_and_is_readable(client, auth_headers):
    r = await client.post(
        "/api/v1/hub/domains/register",
        headers=_h(auth_headers),
        json={
            "domain": "https://TexasPavementGroup.com/",
            "name": "Texas Pavement Group",
            "type": "Regional Flagship",
            "region": "TX",
        },
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["created"] is True
    assert body["registered"]["domain"] == "texaspavementgroup.com"
    assert body["registered"]["region"] == "TX"

    listing = await client.get("/api/v1/hub/domains", headers=_h(auth_headers))
    assert listing.json()["count"] == 1
    assert listing.json()["domains"][0]["domain"] == "texaspavementgroup.com"


async def test_registering_the_same_domain_twice_updates_one_row(client, auth_headers):
    """`market_sites.hostname` is unique — a re-register must not fork the row."""
    for name in ("First Name", "Second Name"):
        r = await client.post(
            "/api/v1/hub/domains/register",
            headers=_h(auth_headers),
            json={"domain": "carolinapavementgroup.com", "name": name},
        )
        assert r.status_code == 200, r.text

    assert r.json()["created"] is False
    assert r.json()["action"] == "DOMAIN_UPDATED"

    listing = await client.get("/api/v1/hub/domains", headers=_h(auth_headers))
    assert listing.json()["count"] == 1
    assert listing.json()["domains"][0]["name"] == "Second Name"


@pytest.mark.parametrize("bad", ["", "not a domain", "http://", "localhost", "///"])
async def test_register_rejects_junk_without_a_500(client, auth_headers, bad):
    """
    The drafted handler called .replace() straight on the body, so a missing or
    malformed domain surfaced as a server error instead of a validation one.
    """
    r = await client.post(
        "/api/v1/hub/domains/register", headers=_h(auth_headers), json={"domain": bad}
    )
    assert r.status_code == 422, r.text


# ── Takeoffs ─────────────────────────────────────────────────────────────────


async def test_takeoff_sync_stores_a_row_and_returns_its_id(client, auth_headers, app_modules):
    _, dbmod = app_modules
    r = await client.post(
        "/api/v1/hub/takeoffs/sync",
        headers=_h(auth_headers),
        json={
            "takeoff_ref": "TKF-0001",
            "source_domain": "texaspavementgroup.com",
            "measured_area_sqft": 42500.0,
            "measured_depth_in": 3.0,
            "estimated_tons": 660.0,
            "confidence": 0.86,
            "method": "vision",
        },
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["action"] == "TAKEOFF_RECORDED"
    assert isinstance(body["id"], int)

    from app.models import HubTakeoff
    session = dbmod.SessionLocal()
    try:
        row = session.get(HubTakeoff, body["id"])
        assert row is not None
        assert row.takeoff_ref == "TKF-0001"
        assert row.measured_area_sqft == 42500.0
        assert row.source_domain == "texaspavementgroup.com"
    finally:
        session.close()


async def test_takeoff_sync_replay_updates_instead_of_duplicating(client, auth_headers, app_modules):
    _, dbmod = app_modules
    payload = {"takeoff_ref": "TKF-DUP", "measured_area_sqft": 100.0}
    first = await client.post("/api/v1/hub/takeoffs/sync", headers=_h(auth_headers), json=payload)
    second = await client.post(
        "/api/v1/hub/takeoffs/sync",
        headers=_h(auth_headers),
        json={**payload, "measured_area_sqft": 250.0},
    )
    assert first.json()["id"] == second.json()["id"]
    assert second.json()["action"] == "TAKEOFF_UPDATED"

    from app.models import HubTakeoff
    session = dbmod.SessionLocal()
    try:
        assert session.query(HubTakeoff).count() == 1
        assert session.query(HubTakeoff).one().measured_area_sqft == 250.0
    finally:
        session.close()


# ── Contracts ────────────────────────────────────────────────────────────────


async def test_contract_execution_is_stored_and_does_not_claim_a_foreign_erp(
    client, auth_headers, app_modules
):
    _, dbmod = app_modules
    r = await client.post(
        "/api/v1/hub/contracts/executed",
        headers=_h(auth_headers),
        json={
            "contract_ref": "CTR-2026-014",
            "customer_name": "KBP Foods",
            "contract_value": 185000.0,
            "signer_name": "J. Worden",
        },
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["contractRef"] == "CTR-2026-014"
    # The status describes this table. Nothing here called an external ERP.
    assert body["action"] == "CONTRACT_RECORDED"
    assert body["erp_status"] == "locked"

    from app.models import HubContractExecution
    session = dbmod.SessionLocal()
    try:
        row = session.get(HubContractExecution, body["id"])
        assert row is not None and row.contract_value == 185000.0
    finally:
        session.close()


# ── Field QA ─────────────────────────────────────────────────────────────────


async def test_field_qa_verdict_comes_from_the_measurement(client, auth_headers):
    """
    96% Marshall is the floor. The caller does not get to declare a pass — the
    drafted endpoint echoed the caller's own `compactionStandardPassed` back
    out, which makes the sender the judge of its own compaction.
    """
    below = await client.post(
        "/api/v1/hub/field-qa/log",
        headers=_h(auth_headers),
        json={"roller_id": "R-11", "lat": 37.54, "lng": -77.43, "density_pct": 94.2,
              "compactionStandardPassed": True},
    )
    assert below.status_code == 200, below.text
    assert below.json()["compaction_standard_passed"] is False
    assert below.json()["compaction_floor_pct"] == 96.0

    at_floor = await client.post(
        "/api/v1/hub/field-qa/log",
        headers=_h(auth_headers),
        json={"roller_id": "R-11", "lat": 37.54, "lng": -77.43, "density_pct": 96.0},
    )
    assert at_floor.json()["compaction_standard_passed"] is True


async def test_field_qa_without_a_density_reading_has_no_verdict(client, auth_headers):
    r = await client.post(
        "/api/v1/hub/field-qa/log",
        headers=_h(auth_headers),
        json={"roller_id": "R-12", "lat": 37.5, "lng": -77.4},
    )
    assert r.status_code == 200, r.text
    assert r.json()["compaction_standard_passed"] is None


async def test_field_qa_row_lands_in_compaction_logs(client, auth_headers, app_modules):
    _, dbmod = app_modules
    r = await client.post(
        "/api/v1/hub/field-qa/log",
        headers=_h(auth_headers),
        json={"roller_id": "R-13", "lat": 37.5, "lng": -77.4, "density_pct": 97.1,
              "pass_number": 4, "mat_temp_f": 285.0},
    )
    from app.models import CompactionLog
    session = dbmod.SessionLocal()
    try:
        row = session.get(CompactionLog, r.json()["id"])
        assert row is not None
        assert row.roller_id == "R-13"
        assert row.density_pct == 97.1
        assert row.pass_number == 4
    finally:
        session.close()


async def test_field_qa_rejects_out_of_range_coordinates(client, auth_headers):
    r = await client.post(
        "/api/v1/hub/field-qa/log",
        headers=_h(auth_headers),
        json={"roller_id": "R-14", "lat": 999.0, "lng": -77.4},
    )
    assert r.status_code == 422


# ── Wire-shape compatibility with the portfolio clients ──────────────────────


async def test_hub_health_reports_the_node_without_claiming_downstream_health(client):
    r = await client.get("/api/v1/hub/health")
    assert r.status_code == 200
    body = r.json()
    assert body["node"] == "JWORDENAI-MASTER-AI-NODE"
    assert body["compaction_floor_pct"] == 96.0
    # It says which node answered, not that everything downstream is well.
    assert body["status"] == "ok"


async def test_envelope_shape_is_accepted(client, auth_headers, app_modules):
    """Clients post `{systemId, data:{…}}`; a flat body must work too."""
    _, dbmod = app_modules
    r = await client.post(
        "/api/v1/hub/contracts/executed",
        headers=_h(auth_headers),
        json={
            "systemId": "JWORDENAI-MASTER-AI-NODE",
            "data": {"contractRef": "CTR-ENV-1", "contractValue": 42000.0},
        },
    )
    assert r.status_code == 200, r.text
    assert r.json()["contractRef"] == "CTR-ENV-1"

    from app.models import HubContractExecution
    session = dbmod.SessionLocal()
    try:
        row = session.query(HubContractExecution).one()
        assert row.contract_value == 42000.0
    finally:
        session.close()


async def test_envelope_with_a_foreign_system_id_is_rejected(client, auth_headers):
    r = await client.post(
        "/api/v1/hub/takeoffs/sync",
        headers=_h(auth_headers),
        json={"systemId": "SOME-OTHER-NODE", "data": {"takeoffRef": "TKF-X"}},
    )
    assert r.status_code == 422


async def test_camelcase_keys_are_accepted(client, auth_headers, app_modules):
    _, dbmod = app_modules
    r = await client.post(
        "/api/v1/hub/takeoffs/sync",
        headers=_h(auth_headers),
        json={"data": {
            "takeoffRef": "TKF-CAMEL",
            "sourceDomain": "https://TexasPavementGroup.com",
            "measuredAreaSqft": 1200.5,
            "estimatedTons": 18.4,
            "stateCode": "tx",
        }},
    )
    assert r.status_code == 200, r.text

    from app.models import HubTakeoff
    session = dbmod.SessionLocal()
    try:
        row = session.query(HubTakeoff).one()
        assert row.measured_area_sqft == 1200.5
        assert row.estimated_tons == 18.4
        assert row.state_code == "TX"
        assert row.source_domain == "texaspavementgroup.com"
    finally:
        session.close()


async def test_takeoff_without_a_ref_gets_one_that_resolves(client, auth_headers, app_modules):
    """
    A generated TKF-<timestamp> names nothing. When the caller supplies no ref,
    the row's own id becomes the ref, so the value in the response can be
    looked up.
    """
    _, dbmod = app_modules
    r = await client.post(
        "/api/v1/hub/takeoffs/sync",
        headers=_h(auth_headers),
        json={"data": {"measuredAreaSqft": 900.0}},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["takeoff_ref"] == f"TKF-{body['id']}"

    from app.models import HubTakeoff
    session = dbmod.SessionLocal()
    try:
        row = session.get(HubTakeoff, body["id"])
        assert row.takeoff_ref == body["takeoff_ref"]
    finally:
        session.close()


async def test_contract_without_a_ref_gets_one_that_resolves(client, auth_headers):
    r = await client.post(
        "/api/v1/hub/contracts/executed",
        headers=_h(auth_headers),
        json={"data": {"customerName": "Walk-in"}},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["contractRef"] == f"CTR-{body['id']}"


async def test_caller_claim_is_recorded_but_never_becomes_the_verdict(client, auth_headers):
    r = await client.post(
        "/api/v1/hub/field-qa/log",
        headers=_h(auth_headers),
        json={"data": {
            "rollerId": "R-20", "latitude": 37.5, "longitude": -77.4,
            "density": 91.0, "compactionStandardPassed": True,
        }},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["claimed_by_caller"] is True
    assert body["compaction_standard_passed"] is False
    assert body["density_pct"] == 91.0


async def test_unmodelled_keys_are_kept_rather_than_dropped(client, auth_headers, app_modules):
    _, dbmod = app_modules
    await client.post(
        "/api/v1/hub/takeoffs/sync",
        headers=_h(auth_headers),
        json={"data": {"takeoffRef": "TKF-EXTRA", "clientJobNumber": "JOB-778", "crew": "B"}},
    )
    from app.models import HubTakeoff
    session = dbmod.SessionLocal()
    try:
        row = session.query(HubTakeoff).one()
        assert row.raw_payload_json["clientJobNumber"] == "JOB-778"
        assert row.raw_payload_json["crew"] == "B"
    finally:
        session.close()


# ── Read-back ────────────────────────────────────────────────────────────────


async def test_recorded_rows_can_be_read_back(client, auth_headers):
    """
    The drafted router pushed into module arrays nothing could query. Storing
    without a way to read is the same as not storing.
    """
    await client.post("/api/v1/hub/takeoffs/sync", headers=_h(auth_headers),
                      json={"data": {"takeoffRef": "TKF-R1", "measuredAreaSqft": 100.0,
                                     "sourceDomain": "texaspavementgroup.com"}})
    await client.post("/api/v1/hub/takeoffs/sync", headers=_h(auth_headers),
                      json={"data": {"takeoffRef": "TKF-R2", "measuredAreaSqft": 200.0,
                                     "sourceDomain": "carolinapavementgroup.com"}})

    r = await client.get("/api/v1/hub/takeoffs", headers=_h(auth_headers))
    assert r.status_code == 200, r.text
    assert r.json()["total"] == 2

    filtered = await client.get(
        "/api/v1/hub/takeoffs?source_domain=https://TexasPavementGroup.com",
        headers=_h(auth_headers),
    )
    assert filtered.json()["total"] == 1
    assert filtered.json()["takeoffs"][0]["takeoff_ref"] == "TKF-R1"


async def test_contract_listing_does_not_roll_up_a_partial_total(client, auth_headers):
    """
    contract_value is nullable. A portfolio total summed over a column with
    holes in it reads as complete when it is not, so none is offered.
    """
    await client.post("/api/v1/hub/contracts/executed", headers=_h(auth_headers),
                      json={"data": {"contractRef": "C1", "contractValue": 1000.0}})
    await client.post("/api/v1/hub/contracts/executed", headers=_h(auth_headers),
                      json={"data": {"contractRef": "C2"}})

    r = await client.get("/api/v1/hub/contracts", headers=_h(auth_headers))
    body = r.json()
    assert body["total"] == 2
    assert "total_value" not in body and "contract_value_total" not in body
    assert {c["contract_value"] for c in body["contracts"]} == {1000.0, None}


async def test_field_qa_listing_recomputes_the_verdict(client, auth_headers):
    await client.post("/api/v1/hub/field-qa/log", headers=_h(auth_headers),
                      json={"data": {"rollerId": "R-1", "lat": 37.5, "lng": -77.4, "density": 95.9}})
    r = await client.get("/api/v1/hub/field-qa", headers=_h(auth_headers))
    body = r.json()
    assert body["compaction_floor_pct"] == 96.0
    assert body["readings"][0]["compaction_standard_passed"] is False


async def test_read_back_requires_auth(client):
    for path in ("/api/v1/hub/takeoffs", "/api/v1/hub/contracts", "/api/v1/hub/field-qa"):
        r = await client.get(path, headers=NODE)
        assert r.status_code == 403, path


async def test_bulk_register_reports_rejections_instead_of_aborting(client, auth_headers):
    r = await client.post(
        "/api/v1/hub/domains/bulk-register",
        headers=_h(auth_headers),
        json={"domains": [
            {"domain": "texaspavementgroup.com", "name": "Texas Pavement Group",
             "region": "Texas (DFW/HOU/ATX/SAT)"},
            {"domain": "not a domain", "name": "Junk"},
            {"domain": "carolinapavementgroup.com", "name": "Carolina Pavement Group"},
        ]},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["created"] == 2
    assert body["rejected"] == 1
    assert body["rejections"][0]["domain"] == "not a domain"

    listing = await client.get("/api/v1/hub/domains", headers=_h(auth_headers))
    assert listing.json()["count"] == 2
    # A long free-text region cannot fit CHAR(2); it is kept, not truncated.
    assert listing.json()["domains"][0]["region"] in (None, "TX")


async def test_health_counts_real_rows(client, auth_headers):
    before = await client.get("/api/v1/hub/health")
    assert before.json()["connected_domains"] == 0
    await client.post("/api/v1/hub/domains/register", headers=_h(auth_headers),
                      json={"domain": "texaspavementgroup.com"})
    after = await client.get("/api/v1/hub/health")
    assert after.json()["connected_domains"] == 1


# ── Verified technology suite ────────────────────────────────────────────────


async def test_capabilities_publishes_the_corrected_citations(client):
    r = await client.get("/api/v1/hub/capabilities")
    assert r.status_code == 200
    body = r.json()
    assert body["count"] == 6
    blob = str(body)
    # The corrected designations.
    for good in ("R 110-22", "Tex-244-F", "R 111-22", "D8395-23", "D7113", "T 343",
                 "T 321", "E1980", "HEC-22"):
        assert good in blob, good
    # The ones that did not check out must not appear as live citations.
    tech_only = str(body["technologies"])
    for bad in ("PP 108", "Item 344", "D698"):
        assert bad not in tech_only, bad
    assert body["acceptance"]["aramid_dose_oz_per_ton"] == 2.1
    assert body["acceptance"]["leed_v4_sr_aged_min"] == 0.28


async def test_capabilities_publishes_what_was_corrected(client):
    r = await client.get("/api/v1/hub/capabilities")
    corrections = r.json()["corrections"]
    claimed = {c["claimed"] for c in corrections}
    assert "AASHTO PP 108" in claimed
    assert "4.2 oz/ton dosage" in claimed
    assert "SRI >= 29 for LEED v4" in claimed
    for c in corrections:
        assert c["why_it_matters"]

    suppressed = await client.get("/api/v1/hub/capabilities?include_corrections=false")
    assert "corrections" not in suppressed.json()


async def test_vendor_claims_are_labelled_not_stated_as_standards(client):
    r = await client.get("/api/v1/hub/capabilities")
    aramid = next(t for t in r.json()["technologies"] if t["id"] == "aramid_fiber")
    assert any("+300%" in c for c in aramid["vendor_claims"])
    # …and never inside the verified list.
    assert not any("+300%" in p for p in aramid["verified_parameters"])


async def test_thermal_segregation_is_graded_on_differential(client, auth_headers):
    """Tex-244-F grades the spread across the mat, not an absolute temperature."""
    cases = {60.0: "severe", 30.0: "moderate", 10.0: "acceptable"}
    for differential, expected in cases.items():
        r = await client.post(
            "/api/v1/hub/field-qa/log",
            headers=_h(auth_headers),
            json={"data": {"rollerId": "R-T", "lat": 37.5, "lng": -77.4,
                           "thermalDifferentialF": differential, "matTempF": 240.0}},
        )
        assert r.status_code == 200, r.text
        assert r.json()["thermal_segregation"] == expected, differential


async def test_icmv_and_density_method_are_stored(client, auth_headers, app_modules):
    _, dbmod = app_modules
    r = await client.post(
        "/api/v1/hub/field-qa/log",
        headers=_h(auth_headers),
        json={"data": {"rollerId": "R-IC", "lat": 37.5, "lng": -77.4,
                       "ICMV": 42.5, "densityMethod": "electromagnetic", "density": 96.4}},
    )
    assert r.json()["icmv"] == 42.5
    assert r.json()["density_method"] == "electromagnetic"

    from app.models import CompactionLog
    session = dbmod.SessionLocal()
    try:
        row = session.get(CompactionLog, r.json()["id"])
        assert row.icmv == 42.5 and row.density_method == "electromagnetic"
    finally:
        session.close()


def test_knowledge_base_cites_only_verified_designations():
    from app.services.knowledge_base import assemble_context
    ctx = assemble_context("what thermal profiling and aramid fiber standards do you spec?")
    for good in ("R 110-22", "Tex-244-F", "D8395-23", "2.1 oz"):
        assert good in ctx, good
    for bad in ("PP 108", "4.2 oz"):
        assert bad not in ctx, bad
