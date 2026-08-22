"""
The bucket was there the whole time. The code was looking for other names.

R2Destination.from_env() read only R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID and
R2_SECRET_ACCESS_KEY. The deployment has S3-compatible object storage
provisioned and configured under Fly's Tigris naming:

    AWS_ENDPOINT_URL_S3, BUCKET_NAME, AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY, AWS_REGION

So from_env() raised "R2 is not configured", _destination() fell back to
LocalDestination, and every nightly backup was written to /tmp on the same
ephemeral machine as the database it was backing up. The fallback logs a
warning saying exactly that -- "on an ephemeral host this copy dies with the
machine and protects nothing" -- and it was correct.

Nothing was missing except agreement about what the variables are called.

This is the same failure as the xAI key earlier: a capability that exists,
credentials that exist, and a name mismatch in between that produces silence
rather than an error. The fix is the same too -- accept both spellings and
report which one answered.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from app.services.db_backup import BackupError, R2Destination  # noqa: E402

ALL_NAMES = (
    "R2_ENDPOINT", "R2_BUCKET", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY",
    "R2_REGION", "AWS_ENDPOINT_URL_S3", "BUCKET_NAME", "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY", "AWS_REGION", "S3_ENDPOINT_URL", "S3_BUCKET",
)

TIGRIS = {
    "AWS_ENDPOINT_URL_S3": "https://fly.storage.tigris.dev/",
    "BUCKET_NAME": "jworden-backups",
    "AWS_ACCESS_KEY_ID": "tid_example",
    "AWS_SECRET_ACCESS_KEY": "tsec_example",
    "AWS_REGION": "auto",
}

R2 = {
    "R2_ENDPOINT": "https://acct.r2.cloudflarestorage.com",
    "R2_BUCKET": "r2-bucket",
    "R2_ACCESS_KEY_ID": "r2-key",
    "R2_SECRET_ACCESS_KEY": "r2-secret",
}


@pytest.fixture(autouse=True)
def clean_env(monkeypatch):
    for name in ALL_NAMES:
        monkeypatch.delenv(name, raising=False)


def test_the_tigris_names_are_accepted(monkeypatch):
    """The exact configuration that was live and unused."""
    for k, v in TIGRIS.items():
        monkeypatch.setenv(k, v)

    dest = R2Destination.from_env()
    assert dest.bucket == "jworden-backups"
    assert dest.endpoint == "https://fly.storage.tigris.dev"  # trailing / stripped
    assert dest.access_key_id == "tid_example"
    assert dest.region == "auto"


def test_the_r2_names_still_work(monkeypatch):
    for k, v in R2.items():
        monkeypatch.setenv(k, v)
    dest = R2Destination.from_env()
    assert dest.bucket == "r2-bucket"


def test_explicit_r2_names_win_over_the_aws_fallbacks(monkeypatch):
    """
    An operator who sets R2_* deliberately must not be overridden by whatever
    AWS_* happens to be in the environment for an unrelated reason.
    """
    for k, v in {**TIGRIS, **R2}.items():
        monkeypatch.setenv(k, v)
    dest = R2Destination.from_env()
    assert dest.bucket == "r2-bucket"
    assert dest.endpoint == "https://acct.r2.cloudflarestorage.com"


def test_nothing_configured_still_raises(monkeypatch):
    """
    The fallback to local disk must stay reachable, and must stay loud. This is
    a real state — it just was not the state production was in.
    """
    with pytest.raises(BackupError) as exc:
        R2Destination.from_env()
    message = str(exc.value)
    assert "endpoint" in message
    # The error has to name every spelling it tried, or the next person hits
    # exactly this bug again.
    assert "AWS_ENDPOINT_URL_S3" in message
    assert "R2_ENDPOINT" in message


def test_a_partial_configuration_is_refused(monkeypatch):
    """Credentials without a bucket is not a destination."""
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "tid")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "tsec")
    with pytest.raises(BackupError) as exc:
        R2Destination.from_env()
    assert "bucket" in str(exc.value)


def test_blank_values_do_not_count_as_configured(monkeypatch):
    for k, v in TIGRIS.items():
        monkeypatch.setenv(k, v)
    monkeypatch.setenv("BUCKET_NAME", "   ")
    with pytest.raises(BackupError) as exc:
        R2Destination.from_env()
    assert "bucket" in str(exc.value)


def test_configured_from_reports_names_not_values(monkeypatch):
    for k, v in TIGRIS.items():
        monkeypatch.setenv(k, v)
    sources = R2Destination.configured_from()
    assert sources["bucket"] == "BUCKET_NAME"
    assert sources["access_key_id"] == "AWS_ACCESS_KEY_ID"
    assert "tid_example" not in str(sources)
    assert "tsec_example" not in str(sources)


def test_unset_is_reportable(monkeypatch):
    assert R2Destination.configured_from()["bucket"] == "unset"
