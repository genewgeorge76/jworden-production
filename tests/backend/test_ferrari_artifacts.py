"""
Ferrari artifact store — saved work belongs to a tenant, not a browser.

This is the persistence layer the Ferrari tools move onto when they stop
keeping bids and boards in localStorage. The whole point is tenant isolation:
J. Worden's command center and a hosted contractor's are the same tool over
different rows, so the one thing that must never happen is one tenant seeing —
or overwriting — another's saved work.

These tests attack that boundary the same way the customer-PII tests do: two
tenants, the same ids, and an assertion that neither can reach the other's
rows. A by-id read that forgets the scope returns a row instead of a 404, so
the only way to know is to check.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))


def _token(tenant: str, secret: str = "test-jwt-secret") -> str:
    from jose import jwt
    return jwt.encode({"sub": f"u@{tenant}", "tenant_id": tenant}, secret, algorithm="HS256")


@pytest.fixture()
def rival(app_modules):
    return {"Authorization": f"Bearer {_token('RIVAL_PAVING')}"}


async def _save(client, headers, ferrari="vision-takeoff", **body):
    res = await client.post(f"/api/v1/ferrari/{ferrari}/artifacts", headers=headers, json=body)
    return res


# ── Auth + validation ─────────────────────────────────────────────────────────

async def test_saving_requires_auth(client):
    res = await client.post("/api/v1/ferrari/vision-takeoff/artifacts", json={"payload": {"x": 1}})
    assert res.status_code in {401, 403}


async def test_unknown_ferrari_is_404(client, auth_headers):
    res = await client.post("/api/v1/ferrari/hovercraft/artifacts", headers=auth_headers,
                            json={"payload": {}})
    assert res.status_code == 404


# ── Round trip ──────────────────────────────────────────────────────────────

async def test_save_then_read_back(client, auth_headers):
    saved = await _save(client, auth_headers, kind="bid", ref="BID-100",
                        title="Kroger lot", payload={"sqft": 48000, "total": 92000})
    assert saved.status_code == 200, saved.text
    aid = saved.json()["id"]

    got = await client.get(f"/api/v1/ferrari/vision-takeoff/artifacts/{aid}", headers=auth_headers)
    assert got.status_code == 200
    assert got.json()["payload"]["total"] == 92000


async def test_ref_upserts_rather_than_duplicating(client, auth_headers):
    a = await _save(client, auth_headers, kind="bid", ref="BID-7", payload={"v": 1})
    b = await _save(client, auth_headers, kind="bid", ref="BID-7", payload={"v": 2})
    assert a.json()["id"] == b.json()["id"], "same ref should update the same row"

    lst = await client.get("/api/v1/ferrari/vision-takeoff/artifacts?kind=bid", headers=auth_headers)
    refs = [i for i in lst.json()["items"] if i["ref"] == "BID-7"]
    assert len(refs) == 1
    assert refs[0]["payload"]["v"] == 2


async def test_list_is_scoped_to_the_ferrari(client, auth_headers):
    await _save(client, auth_headers, ferrari="vision-takeoff", payload={"a": 1})
    await _save(client, auth_headers, ferrari="dispatch", payload={"b": 2})
    vt = await client.get("/api/v1/ferrari/vision-takeoff/artifacts", headers=auth_headers)
    ds = await client.get("/api/v1/ferrari/dispatch/artifacts", headers=auth_headers)
    assert vt.json()["count"] == 1 and ds.json()["count"] == 1


# ── The isolation boundary ────────────────────────────────────────────────────

async def test_rival_cannot_read_operator_artifact_by_id(client, auth_headers, rival):
    saved = await _save(client, auth_headers, ref="BID-OP", payload={"secret": "price"})
    aid = saved.json()["id"]
    res = await client.get(f"/api/v1/ferrari/vision-takeoff/artifacts/{aid}", headers=rival)
    assert res.status_code == 404, "another tenant read a saved bid by its id"


async def test_rival_cannot_delete_operator_artifact(client, auth_headers, rival):
    saved = await _save(client, auth_headers, ref="BID-OP2", payload={"x": 1})
    aid = saved.json()["id"]
    res = await client.delete(f"/api/v1/ferrari/vision-takeoff/artifacts/{aid}", headers=rival)
    assert res.status_code == 404
    # still there for the owner
    still = await client.get(f"/api/v1/ferrari/vision-takeoff/artifacts/{aid}", headers=auth_headers)
    assert still.status_code == 200


async def test_lists_do_not_cross_tenants(client, auth_headers, rival):
    await _save(client, auth_headers, ref="OP", title="operator", payload={})
    await _save(client, rival, ref="RV", title="rival", payload={})
    op = await client.get("/api/v1/ferrari/vision-takeoff/artifacts", headers=auth_headers)
    rv = await client.get("/api/v1/ferrari/vision-takeoff/artifacts", headers=rival)
    op_titles = {i["title"] for i in op.json()["items"]}
    rv_titles = {i["title"] for i in rv.json()["items"]}
    assert "operator" in op_titles and "rival" not in op_titles
    assert "rival" in rv_titles and "operator" not in rv_titles


async def test_rival_upsert_ref_does_not_hijack_operator_row(client, auth_headers, rival):
    """
    Same ref, two tenants — must be two independent rows, not one the second
    tenant overwrites. The upsert match is tenant-scoped, so this proves the
    ref namespace is per-tenant.
    """
    op = await _save(client, auth_headers, kind="bid", ref="SHARED", payload={"owner": "op"})
    rv = await _save(client, rival, kind="bid", ref="SHARED", payload={"owner": "rival"})
    assert op.json()["id"] != rv.json()["id"]
    check = await client.get(f"/api/v1/ferrari/vision-takeoff/artifacts/{op.json()['id']}",
                             headers=auth_headers)
    assert check.json()["payload"]["owner"] == "op"
