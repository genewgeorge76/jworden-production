"""
Backups — proved by restoring them, not by asserting a subprocess ran.

The point of these tests is the round trip. A backup suite that mocks
`pg_dump` and checks the argument list verifies that we know how to spell a
command; it says nothing about whether the resulting file can be turned back
into a database, which is the only property anybody cares about.

So these run against a real PostgreSQL server, dump a real schema with real
rows, drop the data, restore from the stored archive, and compare what came
back. If PostgreSQL is not reachable the module skips rather than passing —
a green suite that silently stopped testing the restore path would recreate
exactly the false confidence this is meant to remove.

Point `TEST_PG_URL` at a throwaway server to run them. The restore tests
create and drop their own databases, so the URL must not be a database
anybody minds losing.
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from app.services import db_backup  # noqa: E402

PG_URL = os.getenv("TEST_PG_URL", "").strip()


def _server_reachable(url: str) -> bool:
    if not url or not shutil.which("psql"):
        return False
    return (
        subprocess.run(
            [shutil.which("psql"), url, "-c", "select 1"],
            capture_output=True,
            timeout=30,
        ).returncode
        == 0
    )


pytestmark = pytest.mark.skipif(
    not _server_reachable(PG_URL),
    reason="set TEST_PG_URL to a disposable PostgreSQL server to run backup tests",
)


def _psql(url: str, sql: str) -> str:
    proc = subprocess.run(
        [shutil.which("psql"), url, "-tAc", sql],
        capture_output=True,
        text=True,
        timeout=60,
    )
    assert proc.returncode == 0, proc.stderr
    return proc.stdout.strip()


@pytest.fixture()
def source_db():
    """A database with a schema and rows worth losing."""
    name = f"wb_src_{uuid.uuid4().hex[:10]}"
    admin = PG_URL
    _psql(admin, f'create database "{name}"')
    url = _database_url(admin, name)
    _psql(
        url,
        """
        create table customers (
            id serial primary key,
            name text not null,
            email text,
            tenant_id text,
            total_revenue numeric default 0
        );
        create table leads (
            id serial primary key,
            name text not null,
            phone text,
            tenant_id text
        );
        insert into customers (name, email, tenant_id, total_revenue) values
            ('Kroger Store 412', 'facilities@example.com', 'default', 48250.00),
            ('Chesterfield County', 'pw@example.com', 'default', 191000.00),
            ('Rival Client', 'rival@example.com', 'RIVAL_PAVING', 1200.00);
        insert into leads (name, phone, tenant_id) values
            ('Jane Homeowner', '5555550188', 'richmondasphaltpaving.com'),
            ('Bob Commercial', '5555550199', 'default');
        """,
    )
    try:
        yield url
    finally:
        _drop(admin, name)


def _database_url(admin_url: str, database: str) -> str:
    base, _, _ = admin_url.rpartition("/")
    return f"{base}/{database}"


def _drop(admin_url: str, name: str) -> None:
    _psql(
        admin_url,
        f"select pg_terminate_backend(pid) from pg_stat_activity where datname = '{name}'",
    )
    _psql(admin_url, f'drop database if exists "{name}"')


@pytest.fixture()
def target_db():
    """An empty database to restore into."""
    name = f"wb_dst_{uuid.uuid4().hex[:10]}"
    _psql(PG_URL, f'create database "{name}"')
    try:
        yield _database_url(PG_URL, name)
    finally:
        _drop(PG_URL, name)


@pytest.fixture()
def store(tmp_path):
    return db_backup.LocalDestination(root=tmp_path / "backups")


# ── The round trip ────────────────────────────────────────────────────────────


def test_backup_then_restore_reproduces_every_row(source_db, target_db, store):
    """
    The whole point. Dump a populated database, restore it into an empty one,
    and compare the contents rather than the exit codes.
    """
    manifest = db_backup.create_backup(destination=store, database_url=source_db)

    assert manifest.verified is True
    assert manifest.size_bytes > 0
    assert "customers" in manifest.tables
    assert "leads" in manifest.tables

    result = db_backup.restore_backup(
        store.get(manifest.key), database_url=target_db
    )
    assert result["exit_code"] == 0, result["warnings"]

    assert _psql(target_db, "select count(*) from customers") == "3"
    assert _psql(target_db, "select count(*) from leads") == "2"

    # Values, not just cardinality — a restore that produces the right number
    # of empty rows is still a lost database.
    assert (
        _psql(target_db, "select email from customers where name = 'Kroger Store 412'")
        == "facilities@example.com"
    )
    assert (
        _psql(
            target_db,
            "select total_revenue from customers where name = 'Chesterfield County'",
        )
        == "191000.00"
    )


def test_restore_preserves_tenant_columns(source_db, target_db, store):
    """
    Tenant ownership has to survive the round trip. A restore that drops
    tenant_id would silently collapse every customer into one bucket.
    """
    manifest = db_backup.create_backup(destination=store, database_url=source_db)
    db_backup.restore_backup(store.get(manifest.key), database_url=target_db)

    assert (
        _psql(
            target_db,
            "select tenant_id from customers where name = 'Rival Client'",
        )
        == "RIVAL_PAVING"
    )
    assert (
        _psql(
            target_db,
            "select tenant_id from leads where name = 'Jane Homeowner'",
        )
        == "richmondasphaltpaving.com"
    )


def test_restore_recovers_a_table_someone_emptied(source_db, target_db, store):
    """
    The realistic emergency is not a dead server, it is a bad import that
    wiped the customer table on a live one.
    """
    manifest = db_backup.create_backup(destination=store, database_url=source_db)

    _psql(source_db, "delete from customers")
    assert _psql(source_db, "select count(*) from customers") == "0"

    db_backup.restore_backup(store.get(manifest.key), database_url=target_db)
    assert _psql(target_db, "select count(*) from customers") == "3"


# ── Integrity ─────────────────────────────────────────────────────────────────


def test_verification_rejects_a_truncated_archive(source_db, store, monkeypatch):
    """
    A half-written upload must fail loudly at backup time, not at restore
    time. This is the failure the sha256 check and the pg_restore --list parse
    exist to catch.
    """
    real_get = store.get

    def truncating_get(key: str) -> bytes:
        return real_get(key)[: 128]

    monkeypatch.setattr(store, "get", truncating_get)

    with pytest.raises(db_backup.BackupError, match="corrupt|not readable"):
        db_backup.create_backup(destination=store, database_url=source_db)


def test_a_non_archive_is_not_mistaken_for_a_backup():
    with pytest.raises(db_backup.BackupError, match="not readable"):
        db_backup.list_archive_tables(b"this is not a pg_dump archive")


def test_backup_of_a_missing_database_raises(store):
    missing = _database_url(PG_URL, "database_that_does_not_exist_9f2a")
    with pytest.raises(db_backup.BackupError, match="pg_dump failed"):
        db_backup.create_backup(destination=store, database_url=missing)


# ── Connection string handling ────────────────────────────────────────────────


def test_sqlalchemy_driver_scheme_is_stripped_for_libpq():
    """
    The app's DATABASE_URL carries the SQLAlchemy driver in the scheme.
    pg_dump rejects it, so this normalisation is what stands between a
    configured backup and one that has never once run.
    """
    assert db_backup.libpq_url(
        "postgresql+psycopg://u:p@host:5432/db"
    ) == "postgresql://u:p@host:5432/db"
    assert db_backup.libpq_url(
        "postgres://u:p@host:5432/db"
    ) == "postgresql://u:p@host:5432/db"


def test_sqlite_is_refused_rather_than_silently_skipped():
    with pytest.raises(db_backup.BackupError, match="require PostgreSQL"):
        db_backup.libpq_url("sqlite:///./local.db")


def test_missing_database_url_is_an_error():
    with pytest.raises(db_backup.BackupError, match="DATABASE_URL is not set"):
        db_backup.libpq_url("")


def test_credentials_never_appear_in_the_manifest(source_db, store):
    manifest = db_backup.create_backup(destination=store, database_url=source_db)
    blob = repr(manifest.to_dict())
    assert "postgres:" not in blob
    assert "@" not in manifest.database


# ── Retention ─────────────────────────────────────────────────────────────────


def _seed(store, keys_and_ages: list[tuple[str, int]]) -> datetime:
    """
    Write objects backdated by whole days, and return the reference instant.

    Callers pass that instant back into `prune`. Letting prune read its own
    clock makes the boundary case a race: prune's "now" is microseconds later
    than the seed's, which drags the cutoff past an object aged exactly at the
    window and deletes it. The behaviour is fine; a test that flips on
    scheduler jitter is not.
    """
    now = datetime.now(timezone.utc)
    for key, age_days in keys_and_ages:
        store.put(key, b"archive-bytes")
        path = (store.root / key).resolve()
        stamp = (now - timedelta(days=age_days)).timestamp()
        os.utime(path, (stamp, stamp))
    return now


def test_prune_deletes_only_what_is_past_the_window(tmp_path):
    store = db_backup.LocalDestination(root=tmp_path / "b")
    now = _seed(
        store,
        [(f"{db_backup.BACKUP_PREFIX}/2026/01/{i:02d}/old-{i}.dump", i) for i in range(1, 41)],
    )

    result = db_backup.prune(
        destination=store, retention_days=30, min_keep=7, now=now
    )

    # Ages 31–40 are past a 30-day window; ages 1–30 are inside it.
    assert result["deleted_count"] == 10
    assert result["retained"] == 30
    deleted_ages = {int(k.rsplit("old-", 1)[1].split(".")[0]) for k in result["deleted"]}
    assert deleted_ages == set(range(31, 41))


def test_prune_keeps_a_floor_when_every_backup_is_stale(tmp_path):
    """
    If the scheduler stops for two months, every object is past the window.
    An age-only rule would empty the bucket — deleting the last copies of the
    data at the exact moment nothing new is being written.
    """
    store = db_backup.LocalDestination(root=tmp_path / "b")
    now = _seed(
        store,
        [(f"{db_backup.BACKUP_PREFIX}/2025/12/{i:02d}/stale-{i}.dump", 200 + i) for i in range(1, 11)],
    )

    result = db_backup.prune(
        destination=store, retention_days=30, min_keep=7, now=now
    )

    assert result["deleted_count"] == 3
    assert result["retained"] == 7
    assert len(store.list(db_backup.BACKUP_PREFIX)) == 7


def test_prune_on_an_empty_store_is_not_an_error(tmp_path):
    store = db_backup.LocalDestination(root=tmp_path / "b")
    result = db_backup.prune(destination=store, retention_days=30)
    assert result["deleted_count"] == 0
    assert result["examined"] == 0


def test_latest_reports_none_when_there_are_no_backups(tmp_path):
    """
    The honest answer to "when was the last backup" when there are none is
    None — not a zero age, which reads as "just now".
    """
    store = db_backup.LocalDestination(root=tmp_path / "b")
    assert db_backup.latest(store) is None


def test_latest_reports_the_newest_with_its_age(tmp_path):
    store = db_backup.LocalDestination(root=tmp_path / "b")
    _seed(
        store,
        [
            (f"{db_backup.BACKUP_PREFIX}/2026/01/01/older.dump", 5),
            (f"{db_backup.BACKUP_PREFIX}/2026/01/06/newest.dump", 1),
        ],
    )
    found = db_backup.latest(store)
    assert found is not None
    assert found["key"].endswith("newest.dump")
    assert 20 < found["age_hours"] < 30


def test_destination_refuses_path_traversal(tmp_path):
    store = db_backup.LocalDestination(root=tmp_path / "b")
    with pytest.raises(db_backup.BackupError, match="outside the backup root"):
        store.put("../../escaped.dump", b"x")
