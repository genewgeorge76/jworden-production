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
