"""
GA4 could not work, for three independent reasons, and reported none of them.

1. google-analytics-data was never in requirements.backend.txt. ga4_client
   imports google.analytics.data_v1beta, so the import raised, _build_client()
   returned None, and the caller turned that into "Set GA4_SERVICE_ACCOUNT_JSON
   ...". Somebody could have set a perfect service account, been told it was
   not configured, and gone hunting through Google Cloud.

2. _property_id() and _load_credentials() referenced `_cfg` and the module
   never imported it. Every call raised NameError before reaching a credential.
   That was true in HEAD, not something a recent change introduced.

3. Credentials were read with os.getenv while the property id came from the
   runtime config store, so a value set through the admin UI configured half
   the client. gsc_client carries a comment about this exact split because it
   had already happened there.

The fix is a pinned dependency and an error that names itself. What is tested
here is the naming: "not configured" must never be the answer when the real
problem is a missing package, because the two have completely different fixes.
"""
from __future__ import annotations

import base64
import builtins
import json
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

CREDENTIAL_JSON = base64.b64encode(
    json.dumps(
        {
            "type": "service_account",
            "project_id": "p",
            "private_key_id": "k",
            "private_key": "x",
            "client_email": "a@b.iam.gserviceaccount.com",
            "client_id": "1",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    ).encode()
).decode()


@pytest.fixture(autouse=True)
def clean(monkeypatch):
    monkeypatch.delenv("GA4_SERVICE_ACCOUNT_JSON", raising=False)
    monkeypatch.delenv("GA4_PROPERTY_ID", raising=False)


def test_property_id_does_not_raise_nameerror(monkeypatch):
    """
    The bug that made everything else moot. _cfg was referenced and never
    imported, so this raised NameError on every call.
    """
    from app.services import ga4_client

    monkeypatch.setenv("GA4_PROPERTY_ID", "properties/123")
    assert ga4_client._property_id()  # must not raise


def test_missing_credentials_says_so(monkeypatch):
    from app.services.ga4_client import get_ga4_data

    monkeypatch.setenv("GA4_PROPERTY_ID", "123456")
    result = get_ga4_data()
    assert result["not_configured"] is True
    assert "GA4_SERVICE_ACCOUNT_JSON" in result["message"]


def test_a_missing_package_is_not_reported_as_missing_credentials(monkeypatch):
    """
    The heart of it. With credentials present and the library absent, the
    answer must point at the deployment, not at Google Cloud.
    """
    from app.services import ga4_client

    monkeypatch.setenv("GA4_PROPERTY_ID", "123456")
    # Stub the credential load rather than crafting a real RSA key: the branch
    # under test is what happens AFTER credentials are good, and a fixture key
    # that fails PEM parsing would exercise the wrong path entirely.
    monkeypatch.setattr(ga4_client, "_load_credentials", lambda: object())

    real_import = builtins.__import__

    def blocked(name, *args, **kwargs):
        if name.startswith("google.analytics"):
            raise ImportError("No module named 'google.analytics'")
        return real_import(name, *args, **kwargs)

    monkeypatch.setattr(builtins, "__import__", blocked)

    result = ga4_client.get_ga4_data()
    message = result["message"]
    assert "google-analytics-data" in message, (
        f"a missing package was reported as {message!r} — that sends the "
        "reader to the wrong place entirely"
    )
    assert "deployment problem" in message


def test_the_package_is_pinned():
    """
    The dependency itself. Without this the module cannot work however good the
    credentials are, and nothing else in the suite would notice.
    """
    text = (REPO_ROOT / "requirements.backend.txt").read_text(encoding="utf-8")
    assert "google-analytics-data==" in text, (
        "google-analytics-data is not pinned; ga4_client imports "
        "google.analytics.data_v1beta and will always fail"
    )


def test_credentials_and_property_id_use_the_same_lookup():
    """
    They used to disagree — os.getenv for one, the runtime store for the other
    — so a value set through the admin UI configured half the client. gsc_client
    already carried a note about this exact split.
    """
    source = (REPO_ROOT / "app" / "services" / "ga4_client.py").read_text(
        encoding="utf-8"
    )
    assert 'os.getenv("GA4_SERVICE_ACCOUNT_JSON"' not in source
    assert '_cfg.get("GA4_SERVICE_ACCOUNT_JSON"' in source
    assert '_cfg.get("GA4_PROPERTY_ID"' in source


def test_list_returning_helpers_degrade_to_empty_without_raising(monkeypatch):
    """
    Three helpers return a list and have nowhere to put a reason. They must not
    propagate the exception, and they log rather than returning [] in silence.
    """
    from app.services.ga4_client import get_top_pages

    monkeypatch.setenv("GA4_PROPERTY_ID", "123456")
    assert get_top_pages() == []
