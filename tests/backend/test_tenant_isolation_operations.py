"""
One tenant must not read another tenant's operations data.

app/services/tenancy.py has said this since it was written: "Writes were never
the problem -- the column was always set. Reads are, and a read that forgets
the filter fails silently: it returns more rows, not an error."

operations.py is the largest offender and the one that matters most, because
it holds the leads, estimates, jobs, work orders and project documents. Every
list endpoint read globally, and -- worse -- every by-id endpoint fetched with
db.get(Model, id), which hands over exactly the row an attacker names.

The by-id shape is invisible to scripts/audit_tenant_isolation.py, which
matches `db.query(Model)`; a primary-key fetch usually is not written that way.
Its own docstring says so. 41 such lookups sit behind tenant auth across the
routers, and they are the more dangerous half.

get_scoped() returns None rather than raising, so the caller's existing 404
path is reused. "Not yours" and "not there" must look identical from outside:
a 403 would confirm the row exists.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

RIVAL = "rival-paving-co"


@pytest.fixture()
def two_tenants(app_modules):
    """A job, a lead and a document owned by a hosted client that is not us."""
    _, dbmod = app_modules
    from app.models import Job, Lead, ProjectDocument

    session = dbmod.SessionLocal()
    try:
        lead = Lead(
            name="Rival Lead", email="buyer@rival.example", phone="555-0100",
            service_type="paving", property_type="commercial", urgency="normal",
            tenant_id=RIVAL,
        )
        session.add(lead)
        session.flush()

        job = Job(
            job_number="RIVAL-001", name="Rival lot resurfacing",
            lead_id=lead.id, status="active", tenant_id=RIVAL,
        )
        session.add(job)
        session.flush()

        doc = ProjectDocument(
            id="rival-doc-1", job_id=job.id, title="Rival scope of work",
            filename="rival-scope.pdf", file_url="/files/rival-scope.pdf",
            document_type="other", tenant_id=RIVAL,
        )
        session.add(doc)
        session.commit()
        return {"lead_id": lead.id, "job_id": job.id, "doc_id": doc.id}
    finally:
        session.close()


# ── Lists ─────────────────────────────────────────────────────────────────────


async def test_recent_leads_excludes_another_tenants_lead(client, auth_headers, two_tenants):
    res = await client.get("/api/v1/operations/leads/recent", headers=auth_headers)
    assert res.status_code == 200, res.text
    emails = {row.get("email") for row in res.json()["leads"]}
    assert "buyer@rival.example" not in emails


async def test_job_list_excludes_another_tenants_job(client, auth_headers, two_tenants):
    res = await client.get("/api/v1/operations/jobs", headers=auth_headers)
    assert res.status_code == 200, res.text
    numbers = {row.get("job_number") for row in res.json()["jobs"]}
    assert "RIVAL-001" not in numbers


async def test_document_list_excludes_another_tenants_document(
    client, auth_headers, two_tenants
):
    res = await client.get("/api/v1/operations/job-documents", headers=auth_headers)
    assert res.status_code == 200, res.text
    titles = {row.get("title") for row in res.json().get("documents", [])}
    assert "Rival scope of work" not in titles


# ── By id: the dangerous half ─────────────────────────────────────────────────


async def test_cannot_fetch_another_tenants_job_by_id(client, auth_headers, two_tenants):
    """
    The IDOR. db.get(Job, job_id) returned the row to whoever asked.
    """
    res = await client.get(
        f"/api/v1/operations/jobs/{two_tenants['job_id']}", headers=auth_headers
    )
    assert res.status_code == 404, (
        "another tenant's job was returned by id — this is the shape the query "
        "audit cannot see"
    )


async def test_cannot_read_another_tenants_document_by_id(
    client, auth_headers, two_tenants
):
    res = await client.get(
        f"/api/v1/operations/job-documents/{two_tenants['doc_id']}", headers=auth_headers
    )
    assert res.status_code in (404, 405), res.text


async def test_cannot_delete_another_tenants_document(client, auth_headers, two_tenants):
    """A write is worse than a read: this destroyed someone else's record."""
    res = await client.delete(
        f"/api/v1/operations/job-documents/{two_tenants['doc_id']}", headers=auth_headers
    )
    assert res.status_code == 404, res.text

    _, dbmod = None, None
    from app.models import ProjectDocument
    import app.database as db

    session = db.SessionLocal()
    try:
        assert session.get(ProjectDocument, two_tenants["doc_id"]) is not None, (
            "another tenant's document was deleted"
        )
    finally:
        session.close()


async def test_not_yours_is_indistinguishable_from_not_there(
    client, auth_headers, two_tenants
):
    """
    Both must be 404. A 403 on the rival's id and a 404 on a nonexistent one
    would let a caller enumerate which job ids exist.
    """
    theirs = await client.get(
        f"/api/v1/operations/jobs/{two_tenants['job_id']}", headers=auth_headers
    )
    nobody = await client.get("/api/v1/operations/jobs/99999999", headers=auth_headers)
    assert theirs.status_code == nobody.status_code == 404


# ── The owner still sees his own ──────────────────────────────────────────────


async def test_the_operator_still_sees_his_own_records(client, auth_headers, app_modules):
    """
    Scoping is worthless if it locks the operator out of his own cockpit.
    Legacy rows carry tenant_id NULL or "default"; both are his.
    """
    _, dbmod = app_modules
    from app.models import Job

    session = dbmod.SessionLocal()
    try:
        session.add(Job(job_number="MINE-001", name="My lot A", status="active", tenant_id=None))
        session.add(Job(job_number="MINE-002", name="My lot B", status="active", tenant_id="default"))
        session.commit()
    finally:
        session.close()

    res = await client.get("/api/v1/operations/jobs", headers=auth_headers)
    assert res.status_code == 200, res.text
    numbers = {row.get("job_number") for row in res.json()["jobs"]}
    assert {"MINE-001", "MINE-002"} <= numbers, (
        "the operator lost sight of his own jobs — legacy NULL and 'default' "
        "rows are his bucket"
    )


# ── Lead intake tenancy ───────────────────────────────────────────────────────
#
# Scoping the cockpit's reads exposed a second bug underneath. Public lead
# intake stamped tenant_id with the request's hostname, and no tenant is ever
# named after a hostname: the operator is "default"/"JWORDEN_HQ" and a
# provisioned client gets str(uuid.uuid4()). So every public lead carried a
# tenant_id belonging to nobody.
#
# That was invisible while the cockpit read every row. The moment reads are
# scoped, every lead the marketing sites produce vanishes from the pipeline
# while the forms keep returning 200 — silent lead loss, which for this
# business is worse than the leak that was being closed. Two existing tests
# caught it, and they were right to.


async def test_a_lead_from_an_unregistered_host_belongs_to_the_operator(
    client, app_modules
):
    """
    The regression that matters. A quote submitted from any host the operator
    has not registered must still land in his pipeline.
    """
    from app.models import Lead

    res = await client.post(
        "/api/v1/leads/quote",
        headers={"Origin": "https://a-brand-new-site.example"},
        json={
            "name": "Walk-in", "email": "walkin@example.com", "phone": "555-0111",
            "service_type": "paving", "property_type": "commercial",
            "urgency": "asap",
        },
    )
    assert res.status_code in (200, 201), res.text

    _, dbmod = app_modules
    session = dbmod.SessionLocal()
    try:
        lead = session.query(Lead).filter(Lead.email == "walkin@example.com").first()
        assert lead is not None
        assert lead.tenant_id == "default", (
            f"stamped {lead.tenant_id!r} — a hostname is not a tenant, and this "
            "lead would be invisible to the operator"
        )
    finally:
        session.close()


async def test_a_lead_from_a_registered_client_domain_belongs_to_that_client(
    client, app_modules
):
    """
    The other half: a hosted client's own domain resolves to their tenant, so
    tenancy is real rather than everything collapsing onto the operator.
    """
    from app.models import Lead, MarketSite

    _, dbmod = app_modules
    session = dbmod.SessionLocal()
    try:
        session.add(MarketSite(
            tenant_id="client-uuid-1234", hostname="smithpaving.example",
            route_mode="saas-client", site_title="Smith Paving",
        ))
        session.commit()
    finally:
        session.close()

    res = await client.post(
        "/api/v1/leads/quote",
        headers={"Origin": "https://smithpaving.example"},
        json={
            "name": "Smith Customer", "email": "cust@smithpaving.example",
            "phone": "555-0122", "service_type": "sealcoating",
            "property_type": "residential", "urgency": "flexible",
        },
    )
    assert res.status_code in (200, 201), res.text

    session = dbmod.SessionLocal()
    try:
        lead = session.query(Lead).filter(
            Lead.email == "cust@smithpaving.example"
        ).first()
        assert lead is not None
        assert lead.tenant_id == "client-uuid-1234"
    finally:
        session.close()


async def test_www_and_apex_resolve_to_the_same_tenant(client, app_modules):
    """
    A client registered as the apex must not have their www leads land in a
    different bucket, and vice versa.
    """
    from app.services.tenancy import tenant_for_hostname
    from app.models import MarketSite

    _, dbmod = app_modules
    session = dbmod.SessionLocal()
    try:
        session.add(MarketSite(
            tenant_id="client-uuid-www", hostname="apexonly.example",
            route_mode="saas-client", site_title="Apex Only",
        ))
        session.commit()

        assert tenant_for_hostname(session, "apexonly.example") == "client-uuid-www"
        assert tenant_for_hostname(session, "www.apexonly.example") == "client-uuid-www"
        assert tenant_for_hostname(session, "APEXONLY.EXAMPLE:443") == "client-uuid-www"
    finally:
        session.close()


async def test_no_hostname_at_all_belongs_to_the_operator(app_modules):
    from app.services.tenancy import tenant_for_hostname

    _, dbmod = app_modules
    session = dbmod.SessionLocal()
    try:
        assert tenant_for_hostname(session, None) == "default"
        assert tenant_for_hostname(session, "") == "default"
        assert tenant_for_hostname(session, "   ") == "default"
    finally:
        session.close()
