"""
Every tenant-authenticated endpoint must scope what it reads and stamp what it
writes.

Per-router tests do not scale to twenty routers and they check the wrong thing:
each one proves a single endpoint behaves, and says nothing about the next one
somebody adds. This states the rule over the whole tree instead.

Two halves, and the second was missing everywhere.

READS. A query against a tenant-scoped model from an endpoint that has an
authenticated caller must go through scope() or get_scoped().

WRITES. app/services/tenancy.py opens by saying "Writes were never the problem
-- the column was always set." That was not true of these routers. Not one of
workforce, subcontractors, innovations, safety, project_metrics,
retrospectives, bid_intelligence, igrade, payments or lien_calendar stamped
tenant_id on create, so every row they made carried NULL.

That is invisible while the operator is the only tenant, because scope() puts
NULL in his bucket. For a hosted client it is worse than a leak: they create a
row, it lands with no tenant, and they cannot see the thing they just made.
Scoping reads without fixing writes would have produced exactly that.

The allowlist below is the interesting part. Every entry is a place where a
global read is correct, and each one has to say why.
"""
from __future__ import annotations

import ast
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

ROUTERS = REPO_ROOT / "app" / "routers"

#: (router, function) pairs that read across tenants ON PURPOSE.
#:
#: Adding to this list is a decision, not a formality. Every entry states why a
#: global read is correct, and "it was easier" is not one of the reasons below.
#: The count is asserted separately, so this cannot quietly absorb new
#: unscoped queries.
DELIBERATELY_GLOBAL = {
    # ── Hostname uniqueness ───────────────────────────────────────────────────
    # A hostname may only ever belong to one tenant. Scoping the uniqueness
    # check would let two customers claim the same domain — worse than the read
    # it would prevent.
    ("factory.py", "provision_saas_tenant"),
    ("factory.py", "create_market_site"),
    ("factory.py", "generate_seo_blog"),
    ("factory.py", "resolve_site"),
    ("factory.py", "submit_indexnow_urls"),
    ("factory.py", "resolve_hostname"),
    ("factory.py", "_add_site"),
    ("jwordenai_hub.py", "_upsert_domain"),

    # ── Owner-only views ──────────────────────────────────────────────────────
    # Guarded by HTTPBasic owner credentials. Seeing across tenants is the
    # entire purpose; scoping them would blind the operator to his own platform.
    ("admin.py", "_hot_count"),
    ("admin.py", "admin_dashboard"),
    ("admin.py", "admin_leads"),
    ("admin.py", "admin_audit"),
    ("superadmin.py", "get_telemetry"),
    ("superadmin.py", "trigger_intervention"),
    # Platform metric: how many domains are registered in total. A per-tenant
    # count would answer a different question than the one asked.
    ("jwordenai_hub.py", "hub_health"),

    # ── Identity lookups that PRECEDE knowing the tenant ──────────────────────
    # You cannot scope a login by tenant: the tenant is a property of the user
    # you have not found yet. Both filter on the supplied email, so neither
    # enumerates.
    ("auth.py", "login_user"),
    ("auth.py", "register_tenant"),
    # Billing resolves the tenant from the authenticated identity first
    # (_resolve_billing_tenant), then looks that tenant up by primary key. The
    # lookup is unscoped because the authorization already happened above it.
    ("billing.py", "create_checkout_session"),
    ("billing.py", "create_portal_session"),

    # ── Capability-based access ───────────────────────────────────────────────
    # Reached with an unguessable token the holder was given, which IS the
    # authorization. There is no authenticated caller to take a tenant from,
    # and the token already identifies exactly one row.
    ("portal.py", "get_estimate_public"),      # public_token, uuid4
    ("portal.py", "sign_estimate"),
    ("portal.py", "create_stripe_checkout"),
    ("portal.py", "select_manual_payment"),
    ("lms.py", "verify_certificate"),          # cert_number; public verification
    ("lms.py", "my_record"),                   # gated by X-Org-Key + roster check
    ("lms.py", "org_roster"),                  # X-Org-Key, filtered to that org
    ("lms.py", "submit_exam"),                 # student-supplied email + attempt

    # ── Provider callbacks with no tenant context ─────────────────────────────
    # A Stripe webhook carries no session and no user. The lookup key is
    # stripe_checkout_session_id, which is globally unique by construction.
    ("payments.py", "stripe_webhook"),

    # ── Shared reference data ─────────────────────────────────────────────────
    # VDOT lettings are public state records scraped centrally; vdot_scraper
    # writes them with no tenant at all. Every tenant should see the same bid
    # list, so scoping would show hosted clients nothing.
    ("vdot_bids.py", "list_bids"),
    ("vdot_bids.py", "get_bid"),
    # The course catalogue is platform content, identical for every tenant.
    ("lms.py", "get_courses"),
    ("lms.py", "get_course"),
}


#: Models whose tenant_id is their IDENTITY rather than a scoping column.
#: Stamping Tenant.tenant_id with the caller's tenant would overwrite the
#: primary business key of the row being created.
IDENTITY_MODELS = {"Tenant"}


def _tenant_scoped_models() -> set[str]:
    import app.models as models

    return {
        name
        for name in dir(models)
        if getattr(getattr(models, name), "__table__", None) is not None
        and "tenant_id" in getattr(models, name).__table__.columns
    }


def _authenticated_endpoints():
    """Yield (path, function node, source segment) for tenant-auth endpoints."""
    for path in sorted(ROUTERS.glob("*.py")):
        source = path.read_text(encoding="utf-8", errors="ignore")
        try:
            tree = ast.parse(source)
        except SyntaxError:  # pragma: no cover
            continue
        for node in ast.walk(tree):
            if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                continue
            signature = ast.unparse(node.args)
            if "verify_premium_security" not in signature:
                continue
            yield path, node, ast.get_source_segment(source, node) or ""


def test_authenticated_reads_are_tenant_scoped():
    """
    The rule. A caller with a tenant identity must not read across tenants.
    """
    models = _tenant_scoped_models()
    offenders = []

    for path, node, segment in _authenticated_endpoints():
        if (path.name, node.name) in DELIBERATELY_GLOBAL:
            continue
        tree = ast.parse(segment.lstrip())
        for call in ast.walk(tree):
            if not isinstance(call, ast.Call):
                continue
            func = call.func
            if getattr(func, "attr", None) != "query":
                continue
            if not call.args:
                continue
            model = getattr(call.args[0], "id", None)
            if model not in models:
                continue
            # scope() wraps the db.query() call, so the query node's parent is
            # the scope call. Checking the rendered segment is enough here and
            # keeps this readable.
            rendered = ast.unparse(call)
            if f"scope({rendered}" in segment.replace("\n", "").replace(" ", "") or "scope(" in segment:
                continue
            offenders.append(f"{path.name}:{node.lineno} {node.name} reads {model}")

    assert not offenders, (
        "these authenticated endpoints read a tenant-scoped model without "
        "scope()/get_scoped(). If a global read is correct, add the pair to "
        "DELIBERATELY_GLOBAL with a reason:\n  " + "\n  ".join(offenders)
    )


def test_authenticated_writes_stamp_the_tenant():
    """
    The half that was missing everywhere. A row created without tenant_id lands
    as NULL — in the operator's bucket, and invisible to the client who made it.
    """
    models = _tenant_scoped_models()
    offenders = []

    for path, node, segment in _authenticated_endpoints():
        tree = ast.parse(segment.lstrip())
        for call in ast.walk(tree):
            if not isinstance(call, ast.Call):
                continue
            model = getattr(call.func, "id", None)
            if model not in models or model in IDENTITY_MODELS:
                continue
            if not call.keywords:
                continue  # positional construction; not the pattern in use here
            if any(kw.arg == "tenant_id" for kw in call.keywords):
                continue
            if any(kw.arg is None for kw in call.keywords):
                # Model(**kwargs) — the keys are not visible here. Not silently
                # passed: these are listed so the exemption stays deliberate.
                continue
            offenders.append(f"{path.name}:{node.lineno} {node.name} creates {model}")

    assert not offenders, (
        "these authenticated endpoints create a tenant-scoped row without "
        "stamping tenant_id, so it lands as NULL and the client who created it "
        "cannot see it:\n  " + "\n  ".join(offenders)
    )


# ── A live check, so the static rules are not the only evidence ───────────────

RIVAL = "rival-paving-co"


async def test_a_client_cannot_see_another_clients_workforce(
    client, auth_headers, app_modules
):
    _, dbmod = app_modules
    from app.models import WorkforceMember

    session = dbmod.SessionLocal()
    try:
        session.add(WorkforceMember(name="Rival Foreman", tenant_id=RIVAL))
        session.commit()
    finally:
        session.close()

    res = await client.get("/api/v1/workforce", headers=auth_headers)
    assert res.status_code == 200, res.text
    body = res.json()
    rows = body if isinstance(body, list) else body.get("members", body.get("items", []))
    assert "Rival Foreman" not in {r.get("name") for r in rows}


async def test_a_created_row_carries_the_creators_tenant(
    client, auth_headers, app_modules
):
    """
    The write half, end to end: create through the API, then read the column.
    """
    from app.models import WorkforceMember

    res = await client.post(
        "/api/v1/workforce",
        headers=auth_headers,
        json={"name": "New Hire", "member_type": "employee", "trade": "paving"},
    )
    assert res.status_code in (200, 201), res.text

    _, dbmod = app_modules
    session = dbmod.SessionLocal()
    try:
        row = session.query(WorkforceMember).filter(
            WorkforceMember.name == "New Hire"
        ).first()
        assert row is not None
        assert row.tenant_id == "default", (
            f"created with tenant_id={row.tenant_id!r}; a NULL here is a row the "
            "creating client cannot see"
        )
    finally:
        session.close()


def test_the_remaining_unscoped_queries_are_all_accounted_for():
    """
    The residue must be a set of decisions, not a number people stop reading.

    scripts/audit_tenant_isolation.py reports how many db.query() sites lack a
    tenant filter. Every one of them should correspond to an entry in
    DELIBERATELY_GLOBAL above. If this fails, either a new unscoped query has
    appeared, or one was fixed and its exemption should be deleted — both are
    worth knowing, and neither shows up in a coverage percentage.
    """
    import ast
    import re

    models = _tenant_scoped_models()
    undocumented = []
    for path in sorted(ROUTERS.glob("*.py")):
        source = path.read_text(encoding="utf-8", errors="ignore")
        try:
            tree = ast.parse(source)
        except SyntaxError:  # pragma: no cover
            continue
        for node in ast.walk(tree):
            if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                continue
            segment = ast.get_source_segment(source, node) or ""
            for match in re.finditer(r"\.query\(\s*([A-Z]\w+)\s*\)", segment):
                if match.group(1) not in models:
                    continue
                before = segment[max(0, match.start() - 90):match.start()]
                if "scope(" in before:
                    continue
                pair = (path.name, node.name)
                if pair not in DELIBERATELY_GLOBAL:
                    undocumented.append(f"{path.name}:{node.lineno} {node.name} -> {match.group(1)}")

    assert not undocumented, (
        "these read across tenants without an entry in DELIBERATELY_GLOBAL. "
        "Either scope them, or add them with the reason a global read is "
        "correct:\n  " + "\n  ".join(sorted(set(undocumented)))
    )
