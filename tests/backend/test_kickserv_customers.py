"""
Preserving the customer base, and keeping it out of the websites.

Two separate jobs, and the second is why the first is allowed to exist.

PRESERVATION. 2,263 customers live only inside a Kickserv account that is
going away. Reading them out is the point of app/services/kickserv_customers.py.

CONTAINMENT. 1,785 of those are private individuals at their home addresses.
The convention throughout this repository is that a residential customer
contributes a town and nothing else. A convention that nothing checks is a
convention that eventually gets broken by a well-meaning page that wants to
show "recent projects near you", so this file checks it against the real built
output — not against a promise.
"""

import json
import re
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from app.services import kickserv_customers as kc  # noqa: E402

# Gitignored on purpose — see scripts/preserve_kickserv_customers.py. Tests
# that need real people skip when it is absent, which is the honest outcome on
# a fresh clone or in CI.
REGISTER = REPO_ROOT / "private" / "kickserv_customers.json"
SUMMARY = REPO_ROOT / "data" / "reference" / "kickserv_customers.summary.json"


@pytest.fixture(scope="module")
def register():
    if not REGISTER.exists():
        pytest.skip("customer register not generated in this checkout")
    return json.loads(REGISTER.read_text(encoding="utf-8"))


# ── Normalisation: the columns that are easy to read wrong ───────────────────


def test_virginia_is_one_state_not_four():
    """
    'VA', 'VIRGINIA', 'VA - VIRGINIA' and 'VA.' all appear in the same column.
    Treating them as distinct loses a sixth of the home market from any filter.
    """
    for spelling in ("VA", "va", "Virginia", "VIRGINIA", "VA.", "VA - VIRGINIA", " va "):
        assert kc.normalize_state(spelling) == "VA", spelling


def test_an_unrecognised_state_is_none_rather_than_a_guess():
    assert kc.normalize_state("") is None
    assert kc.normalize_state("Ontario") is None
    assert kc.normalize_state("???") is None


def test_the_state_is_stripped_off_the_city():
    """'Richmond va' is one city and one state sharing a cell."""
    assert kc.normalize_city("Richmond va", "VA") == "Richmond"
    assert kc.normalize_city("henrico virginia", "VA") == "Henrico"
    assert kc.normalize_city("North Chesterfield VA", "VA") == "North Chesterfield"


def test_a_city_that_is_only_a_city_survives_intact():
    assert kc.normalize_city("Charleston", "SC") == "Charleston"
    assert kc.normalize_city("Mount Pleasant", "SC") == "Mount Pleasant"


def test_commercial_comes_from_the_company_boolean_not_company_name():
    """
    Kickserv fills company_name for everybody — a homeowner's row carries their
    own name in it. Believing it classifies the entire book as commercial.
    """
    homeowner = {"company": "false", "company_name": "Mark and Jennifer pounders"}
    business = {"company": "true", "company_name": "Meckley Services Inc."}
    assert kc.is_business(homeowner) is False
    assert kc.is_business(business) is True


def test_phone_normalisation_refuses_a_number_that_is_not_one():
    assert kc.normalize_phone("(804) 446-1296") == "8044461296"
    assert kc.normalize_phone("18044461296") == "8044461296"
    assert kc.normalize_phone("123") is None
    assert kc.normalize_phone("") is None


def test_brand_is_only_claimed_when_the_name_says_it():
    assert kc.brand_in("KFC (195)") == "KFC"
    assert kc.brand_in("Taco Bell") == "Taco Bell"
    assert kc.brand_in("Meckley Services Inc.") is None


# ── The register itself ──────────────────────────────────────────────────────


def test_the_register_holds_the_whole_book(register):
    assert register["summary"]["total"] == len(register["customers"])
    assert register["summary"]["total"] > 2000, "the export holds 2,263 customers"


def test_every_record_has_a_stable_key(register):
    keys = [c["external_id"] for c in register["customers"]]
    assert all(k.startswith("kickserv:customer:") for k in keys)
    assert len(set(keys)) == len(keys), "external_id must be unique — it is the upsert key"


def test_revenue_is_a_floor_and_never_exceeds_the_completed_jobs(register):
    """No customer may carry money against zero completed jobs."""
    for c in register["customers"]:
        if c["completed_revenue_cents"]:
            assert c["completed_jobs"] > 0, f"{c['external_id']} has revenue but no completed job"


def test_sms_failures_are_not_recorded_as_opt_outs(register):
    """
    All 177 values in that column are delivery failures. Naming the field
    `opt_out` would mark 177 reachable customers as having refused contact.
    """
    for c in register["customers"]:
        assert "opt_out" not in c, "an SMS delivery failure is not a consent withdrawal"


# ── Containment: none of this may reach a page ───────────────────────────────


def _built_pages() -> list[Path]:
    dist = REPO_ROOT / "dist"
    return list(dist.rglob("*.html")) if dist.exists() else []


def _own_contact_details() -> str:
    """
    Everything the sites deliberately publish about THIS business.

    The company is a customer of itself in Kickserv — j.wordenandsonspaving@
    gmail.com sits in the register on a row like any other. Its own published
    address turning up on its own website is not a leak, and a test that calls
    it one gets muted, which is worse than having no test. So the comparison
    excludes any value the repository's own source data already publishes.
    """
    sources = list((REPO_ROOT / "src" / "data").rglob("*")) + list(
        (REPO_ROOT / "src" / "lib").glob("businessInfo*.js")
    )
    # Deliberately NOT the whole of src/. A contact detail belongs in the
    # business-info modules or in src/data; one hardcoded into a component is
    # exactly the leak this test exists to catch, so components are not
    # treated as permission.
    return "\n".join(
        f.read_text(encoding="utf-8", errors="replace")
        for f in sources
        if f.is_file() and f.suffix in {".js", ".json", ".mjs"}
    )


def test_no_residential_customer_email_or_phone_is_in_any_built_page(register):
    """
    The one that matters. Runs against dist/ if it has been built; skips if not,
    because a skipped test is honest and a test that silently passes on an empty
    directory is not.
    """
    pages = _built_pages()
    if not pages:
        pytest.skip("no dist/ build in this checkout — run the site build first")

    published = _own_contact_details()
    secrets: dict[str, str] = {}
    for c in register["customers"]:
        if c["is_business"]:
            continue
        for field in ("email", "phone", "mobile"):
            value = c.get(field)
            if value and value not in published:
                secrets[value] = c["external_id"]

    haystack = "\n".join(p.read_text(encoding="utf-8", errors="replace") for p in pages)
    leaked = [(v, owner) for v, owner in secrets.items() if v in haystack]
    assert not leaked, f"{len(leaked)} residential contact details reached built pages: {leaked[:5]}"


def test_no_residential_customer_street_address_is_in_any_built_page(register):
    pages = _built_pages()
    if not pages:
        pytest.skip("no dist/ build in this checkout — run the site build first")

    haystack = "\n".join(p.read_text(encoding="utf-8", errors="replace") for p in pages).lower()
    leaked = []
    for c in register["customers"]:
        if c["is_business"] or not c.get("address"):
            continue
        address = re.sub(r"\s+", " ", c["address"].strip().lower())
        # A bare number is not an address; require a number and a street word.
        if len(address) < 8 or not re.search(r"\d", address):
            continue
        if address in haystack:
            leaked.append((c["external_id"], address))
    assert not leaked, f"{len(leaked)} residential street addresses reached built pages: {leaked[:5]}"
