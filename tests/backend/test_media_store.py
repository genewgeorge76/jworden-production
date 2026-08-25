"""
Where a jobsite photograph lives, and the boundary it must not cross by itself.

THE FAILURE THIS GUARDS AGAINST
───────────────────────────────
A photograph pulled out of a mailbox has not been seen by anybody. The archive
being mined is a decade of a family business's mail, and the owner has said
plainly it holds personal photographs alongside the work. A file arriving in a
public bucket the moment it is fetched publishes a customer's house, a vehicle
plate, or a person who never agreed to be on a website.

So the private/public split is not an organisational preference, and these
tests treat any automatic path across it as a defect.
"""

import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from app.services import media_store as ms  # noqa: E402


@pytest.fixture()
def configured(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_KEY", "service-key-value")


# ── The boundary ─────────────────────────────────────────────────────────────


def test_intake_and_public_are_different_buckets():
    assert ms.INTAKE_BUCKET != ms.PUBLIC_BUCKET


def test_nothing_promotes_a_file_automatically():
    """
    The safeguard is the ABSENCE of an automatic path. If someone later adds
    an auto-publish helper, this test is where the argument has to happen.
    """
    source = (REPO_ROOT / "app" / "services" / "media_store.py").read_text()
    body = source.split('"""', 2)[-1]  # skip the module docstring
    assert "promote(" in body, "promote should exist"
    calls = [
        line for line in body.splitlines()
        if "promote(" in line and not line.strip().startswith(("def ", "#", '"', "'"))
    ]
    assert not calls, f"something calls promote() on its own: {calls}"


def test_the_public_bucket_refuses_anything_a_browser_should_not_be_served(configured):
    for mime in ("application/pdf", "image/heic", "video/mp4", "text/html"):
        with pytest.raises(ValueError, match="not servable"):
            ms.promote("key.pdf", b"x", mime)


def test_the_public_bucket_accepts_the_three_web_image_types():
    assert ms.PUBLISHABLE_TYPES == {"image/jpeg", "image/png", "image/webp"}


# ── Keys and deduplication ───────────────────────────────────────────────────


def test_the_key_carries_the_digest_so_dedup_survives_the_move_off_disk():
    """
    Same scheme as mailbox_attachments.local_writer. A run that wrote to disk
    and a run that writes to Supabase must agree on what is already held, or
    the whole archive downloads again.
    """
    key = ms.object_key("a" * 64, "after.jpg")
    assert key.startswith("a" * 16)
    assert key.endswith("after.jpg")


def test_two_photographs_with_the_same_name_get_different_keys():
    a = ms.object_key("a" * 64, "IMG_0001.jpg")
    b = ms.object_key("b" * 64, "IMG_0001.jpg")
    assert a != b


# ── Configuration ────────────────────────────────────────────────────────────


def test_it_says_it_is_unconfigured_rather_than_failing_at_upload_time(monkeypatch):
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_SERVICE_KEY", raising=False)
    assert ms.configured() is False
    assert ms.describe()["configured"] is False


def test_a_missing_key_names_what_it_looked_for(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.delenv("SUPABASE_SERVICE_KEY", raising=False)
    with pytest.raises(ms.MediaStoreNotConfigured, match="SUPABASE_SERVICE_KEY"):
        ms.intake_writer()("a" * 64, "x.jpg", b"x")


def test_describe_never_returns_the_service_key(configured):
    assert "service-key-value" not in str(ms.describe())


def test_the_writer_matches_the_signature_harvest_expects(configured, monkeypatch):
    """
    mailbox_attachments.harvest calls write(digest, filename, data). A writer
    that takes different arguments fails only at run time, deep inside a walk
    of a decade of mail.
    """
    seen = {}

    def fake_put(bucket, key, data, **kwargs):
        seen.update(bucket=bucket, key=key, data=data)
        return f"{bucket}/{key}"

    monkeypatch.setattr(ms, "put", fake_put)
    path = ms.intake_writer()("f" * 64, "after.jpg", b"photo-bytes")

    assert seen["bucket"] == ms.INTAKE_BUCKET, "a harvested file must land in intake, never public"
    assert seen["data"] == b"photo-bytes"
    assert path == f"{ms.INTAKE_BUCKET}/{'f' * 16}-after.jpg"


def test_upsert_is_off_by_default(configured, monkeypatch):
    """
    An upload that would overwrite means either two files hashed identically —
    which cannot happen — or the same file arriving twice, which is worth
    knowing about rather than silently repeating.
    """
    captured = {}

    def fake_post(url, content, headers, timeout):
        captured.update(headers=headers)

        class R:
            status_code = 200
            text = ""

        return R()

    monkeypatch.setattr(ms.httpx, "post", fake_post)
    ms.put(ms.INTAKE_BUCKET, "k", b"x")
    assert captured["headers"]["x-upsert"] == "false"


def test_an_already_present_object_is_not_an_error(configured, monkeypatch):
    def fake_post(url, content, headers, timeout):
        class R:
            status_code = 409
            text = "Duplicate"

        return R()

    monkeypatch.setattr(ms.httpx, "post", fake_post)
    assert ms.put(ms.INTAKE_BUCKET, "k", b"x") == f"{ms.INTAKE_BUCKET}/k"


def test_a_real_failure_is_raised_rather_than_swallowed(configured, monkeypatch):
    def fake_post(url, content, headers, timeout):
        class R:
            status_code = 500
            text = "boom"

        return R()

    monkeypatch.setattr(ms.httpx, "post", fake_post)
    with pytest.raises(RuntimeError, match="500"):
        ms.put(ms.INTAKE_BUCKET, "k", b"x")


def test_the_public_url_points_at_the_public_bucket(configured):
    url = ms.public_url("abc-after.jpg")
    assert ms.PUBLIC_BUCKET in url
    assert ms.INTAKE_BUCKET not in url
    assert url.startswith("https://example.supabase.co/storage/v1/object/public/")
