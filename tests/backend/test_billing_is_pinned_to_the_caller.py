"""
A tenant must not be able to manage another tenant's billing.

Both billing endpoints took `tenant_id` from the request body and looked that
tenant up. The comment above the router names the risk in as many words — "for
an arbitrary tenant_id" — and the guard added for it was router-level
AUTHENTICATION. That proves the caller is *a* known caller. It does nothing
about a known caller passing somebody else's tenant_id.

/portal is the one that matters. It mints a Stripe Customer Portal session:
invoices, payment methods, and a cancel button. Handing tenant A a portal link
for tenant B's subscription is not a data leak, it is control of their billing.

The operator may still act on behalf of a tenant — that is a real support need,
and removing it would be a regression. Everybody else is pinned to their own.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

RIVAL = "rival-paving-co"


def _auth(tenant: str) -> dict:
    return {"user": "someone", "tenant_id": tenant}


def test_a_client_cannot_name_another_tenant():
    from fastapi import HTTPException

    from app.routers.billing import _resolve_billing_tenant

    with pytest.raises(HTTPException) as exc:
        _resolve_billing_tenant(_auth("client-uuid-1"), RIVAL)
    assert exc.value.status_code == 403


def test_a_client_naming_itself_is_fine():
    from app.routers.billing import _resolve_billing_tenant

    assert _resolve_billing_tenant(_auth("client-uuid-1"), "client-uuid-1") == "client-uuid-1"


def test_a_client_naming_nothing_gets_its_own():
    from app.routers.billing import _resolve_billing_tenant

    assert _resolve_billing_tenant(_auth("client-uuid-1"), "") == "client-uuid-1"


def test_the_operator_may_act_on_behalf_of_a_tenant():
    """
    Support needs this. Removing it to close the hole would have been a
    regression dressed as a fix.
    """
    from app.routers.billing import _resolve_billing_tenant

    assert _resolve_billing_tenant(_auth("JWORDEN_HQ"), RIVAL) == RIVAL
    assert _resolve_billing_tenant(_auth("default"), RIVAL) == RIVAL


def test_the_operator_naming_nothing_gets_its_own():
    from app.routers.billing import _resolve_billing_tenant

    assert _resolve_billing_tenant(_auth("JWORDEN_HQ"), "") == "JWORDEN_HQ"


def test_stripe_metadata_carries_the_resolved_tenant_not_the_requested_one():
    """
    The webhook reads metadata.tenant_id back to decide whose subscription was
    paid for. Leaving the caller-supplied value there would put the
    authorization check in front of a door that was already open.
    """
    source = (REPO_ROOT / "app" / "routers" / "billing.py").read_text(encoding="utf-8")
    assert '"tenant_id": tenant_id,' in source
    assert '"tenant_id": request.tenant_id,' not in source
