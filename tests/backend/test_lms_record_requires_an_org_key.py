"""
A training record is personal data and required no credential to read.

GET /lms/record?email=<anything> returned that person's certifications and
their last 25 exam attempts — pass marks included — to any caller. No auth
header, no org key, nothing. Guess or harvest a company's email addresses and
you learn who holds which tickets and who has been failing exams.

The neighbouring endpoint, /lms/orgs/roster, already did this correctly with an
X-Org-Key header resolved through _org_from_key. This reuses that credential
rather than inventing a second scheme: an org key identifies a company, and the
address has to be on that company's active roster.

A missing record returns 404 rather than 403 on purpose. 403 would confirm the
address exists on some other organisation's roster, which is exactly the
enumeration being closed.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

CREW_EMAIL = "raker@example.com"
OUTSIDER = "someone-else@example.com"


@pytest.fixture()
def org_with_a_crew_member(app_modules):
    from app.models import Certification, OrgMember, Organization
    from app.routers.lms import _hash_key

    _, dbmod = app_modules
    session = dbmod.SessionLocal()
    try:
        org = Organization(
            name="Worden Crew", billing_email="office@example.com",
            key_hash=_hash_key("org-secret-key"), active=True,
        )
        session.add(org)
        session.flush()
        session.add(OrgMember(org_id=org.id, email=CREW_EMAIL, active=True))
        session.add(Certification(
            user_email=CREW_EMAIL, cert_number="CERT-1",
            course_slug="compaction-qa", course_title="Compaction QA",
            user_name="Raker Dave", score=92,
            revoked=False,
        ))
        session.commit()
        return {"key": "org-secret-key", "org_id": org.id}
    finally:
        session.close()


async def test_no_org_key_is_refused(client, org_with_a_crew_member):
    res = await client.get(f"/lms/record?email={CREW_EMAIL}")
    assert res.status_code == 401, (
        f"got {res.status_code} — an unauthenticated caller must not read a "
        "crew member's training record"
    )


async def test_a_wrong_org_key_is_refused(client, org_with_a_crew_member):
    res = await client.get(
        f"/lms/record?email={CREW_EMAIL}", headers={"X-Org-Key": "not-the-key"}
    )
    assert res.status_code == 403


async def test_the_right_org_key_reads_its_own_crew(client, org_with_a_crew_member):
    res = await client.get(
        f"/lms/record?email={CREW_EMAIL}",
        headers={"X-Org-Key": org_with_a_crew_member["key"]},
    )
    assert res.status_code == 200, res.text


async def test_an_address_off_the_roster_is_404_not_403(client, org_with_a_crew_member):
    """
    403 would confirm the address exists somewhere. 404 says nothing, which is
    the whole point of closing an enumeration endpoint.
    """
    res = await client.get(
        f"/lms/record?email={OUTSIDER}",
        headers={"X-Org-Key": org_with_a_crew_member["key"]},
    )
    assert res.status_code == 404


async def test_certificate_verification_stays_public(client, org_with_a_crew_member):
    """
    Deliberate contrast. /lms/verify/{cert_number} is capability-based — you
    need the certificate number, which the holder gives you — and public
    verification is the entire purpose of a credential. That one stays open.
    """
    res = await client.get("/lms/verify/CERT-1")
    assert res.status_code in (200, 404), res.text
