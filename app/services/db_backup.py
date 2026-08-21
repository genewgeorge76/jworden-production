"""
db_backup.py — take a backup, and be able to put it back.

A backup nobody has restored is a hypothesis. The failure mode is well worn:
the dump runs nightly for a year, the object count climbs, everybody relaxes,
and the first time it matters someone discovers the files are empty, or
truncated, or in a format the installed `pg_restore` will not read. So this
module is written so the restore path is exercisable, and the test suite
actually exercises it against a real PostgreSQL server rather than asserting
that a subprocess was invoked.

Shape
─────
`create_backup()` runs `pg_dump -Fc` into a temporary file, hands the bytes to
a `Destination`, and returns a manifest. `restore_backup()` takes those bytes
and replays them with `pg_restore`. Destinations are a seam with two
implementations: `LocalDestination` writes to a directory, `R2Destination`
PUTs to Cloudflare R2 over its S3-compatible API. The seam exists so the
dump/restore cycle can be tested for real without cloud credentials.

Format
──────
`-Fc` (custom) rather than plain SQL piped through gzip. It is already
compressed, `pg_restore` can list its contents without applying anything —
which is what makes a cheap integrity check possible — and it allows
selective restore of a single table, which is the realistic emergency: not
"the database is gone" but "the customer import overwrote the wrong rows".

What this module does not do
────────────────────────────
It does not claim delivery it has not confirmed. `verified` on the manifest
means the bytes were read back from the destination and `pg_restore --list`
parsed them — not merely that an upload returned 200.
"""

from __future__ import annotations

import gzip
import hashlib
import hmac
import logging
import os
import shutil
import subprocess
import tempfile
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterable, Optional, Protocol
from urllib.parse import quote, urlparse

logger = logging.getLogger(__name__)

# pg_dump refuses to run against a server newer than itself, and silently
# produces an archive an older pg_restore cannot read. Both binaries come from
# the same image here, but the version is recorded on every manifest so a
# future restore failure is diagnosable rather than mysterious.
BACKUP_PREFIX = "db-backups"
DUMP_TIMEOUT_SECONDS = int(os.getenv("BACKUP_DUMP_TIMEOUT", "1800"))
RETENTION_DAYS = int(os.getenv("BACKUP_RETENTION_DAYS", "30"))
# Never prune below this many backups regardless of age. A retention window
# alone will happily empty the bucket if the scheduler stops running for
# longer than the window.
RETENTION_MIN_KEEP = int(os.getenv("BACKUP_RETENTION_MIN_KEEP", "7"))


class BackupError(RuntimeError):
    """A backup or restore could not be completed."""


# ── Connection handling ───────────────────────────────────────────────────────


def libpq_url(database_url: Optional[str] = None) -> str:
    """
    The DATABASE_URL as libpq wants it.

    SQLAlchemy spells its driver into the scheme (`postgresql+psycopg://`),
    which `pg_dump` rejects. It also accepts `postgres://`, which libpq takes
    but which we normalise for consistency with the rest of the app.
    """
    url = database_url or os.getenv("DATABASE_URL", "")
    if not url:
        raise BackupError("DATABASE_URL is not set — nothing to back up")
    if "+" in url.split("://", 1)[0]:
        scheme, rest = url.split("://", 1)
        url = f"{scheme.split('+', 1)[0]}://{rest}"
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    if not url.startswith("postgresql://"):
        raise BackupError(
            f"backups require PostgreSQL, got {url.split('://', 1)[0]!r}"
        )
    return url


def _redacted(url: str) -> str:
    """A connection string safe to log — host and database only."""
    parsed = urlparse(url)
    return f"{parsed.hostname or '?'}/{(parsed.path or '/').lstrip('/') or '?'}"


def _tool(name: str) -> str:
    path = shutil.which(name)
    if not path:
        raise BackupError(
            f"{name} is not installed in this image — backups cannot run without it"
        )
    return path


# ── Destinations ──────────────────────────────────────────────────────────────


class Destination(Protocol):
    """Somewhere a backup can be written, listed and read back."""

    def put(self, key: str, data: bytes) -> None: ...

    def get(self, key: str) -> bytes: ...

    def list(self, prefix: str) -> list[dict[str, Any]]: ...

    def delete(self, key: str) -> None: ...


@dataclass
class LocalDestination:
    """
    A directory on disk.

    Useful for development and, more importantly, for tests: the dump/restore
    cycle is the part worth proving and it should not require cloud
    credentials to prove it.

    On its own this is not a backup — a copy on the same machine as the
    database dies with the machine. It is a destination, not a strategy.
    """

    root: Path

    def _path(self, key: str) -> Path:
        # Keys are generated internally, but a traversal here would write
        # outside the backup root, so it is checked rather than assumed.
        target = (self.root / key).resolve()
        root = self.root.resolve()
        if root != target and root not in target.parents:
            raise BackupError(f"refusing to write outside the backup root: {key!r}")
        return target

    def put(self, key: str, data: bytes) -> None:
        path = self._path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)

    def get(self, key: str) -> bytes:
        return self._path(key).read_bytes()

    def list(self, prefix: str) -> list[dict[str, Any]]:
        base = self._path(prefix)
        if not base.exists():
            return []
        out: list[dict[str, Any]] = []
        for p in sorted(base.rglob("*")):
            if p.is_file():
                stat = p.stat()
                out.append(
                    {
                        "key": str(p.relative_to(self.root)),
                        "size": stat.st_size,
                        "last_modified": datetime.fromtimestamp(
                            stat.st_mtime, tz=timezone.utc
                        ),
                    }
                )
        return out

    def delete(self, key: str) -> None:
        self._path(key).unlink(missing_ok=True)


# ── S3 / R2 ───────────────────────────────────────────────────────────────────


def _sign(key: bytes, msg: str) -> bytes:
    return hmac.new(key, msg.encode("utf-8"), hashlib.sha256).digest()


@dataclass
class R2Destination:
    """
    Cloudflare R2 over its S3-compatible API, signed with SigV4.

    Hand-rolled rather than pulling in boto3: the surface used here is three
    verbs against one bucket, and the signing is a well-specified sixty lines.
    A dependency that exists only to sign a PUT is a dependency to maintain,
    audit and keep in step with the rest of the image.
    """

    endpoint: str
    bucket: str
    access_key_id: str
    secret_access_key: str
    region: str = "auto"
    timeout: float = 300.0

    @classmethod
    def from_env(cls) -> "R2Destination":
        missing = [
            name
            for name in (
                "R2_ENDPOINT",
                "R2_BUCKET",
                "R2_ACCESS_KEY_ID",
                "R2_SECRET_ACCESS_KEY",
            )
            if not (os.getenv(name) or "").strip()
        ]
        if missing:
            raise BackupError(
                "R2 is not configured — missing " + ", ".join(missing)
            )
        return cls(
            endpoint=os.environ["R2_ENDPOINT"].rstrip("/"),
            bucket=os.environ["R2_BUCKET"],
            access_key_id=os.environ["R2_ACCESS_KEY_ID"],
            secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
            region=os.getenv("R2_REGION", "auto"),
        )

    # ── signing ──────────────────────────────────────────────────────────────

    def _headers(
        self,
        method: str,
        key: str,
        *,
        payload: bytes = b"",
        query: str = "",
        now: Optional[datetime] = None,
    ) -> dict[str, str]:
        now = now or datetime.now(timezone.utc)
        amz_date = now.strftime("%Y%m%dT%H%M%SZ")
        datestamp = now.strftime("%Y%m%d")

        host = urlparse(self.endpoint).netloc
        payload_hash = hashlib.sha256(payload).hexdigest()
        canonical_uri = "/" + quote(f"{self.bucket}/{key}".lstrip("/"), safe="/~")

        canonical_headers = (
            f"host:{host}\n"
            f"x-amz-content-sha256:{payload_hash}\n"
            f"x-amz-date:{amz_date}\n"
        )
        signed_headers = "host;x-amz-content-sha256;x-amz-date"

        canonical_request = "\n".join(
            [
                method,
                canonical_uri,
                query,
                canonical_headers,
                signed_headers,
                payload_hash,
            ]
        )

        scope = f"{datestamp}/{self.region}/s3/aws4_request"
        string_to_sign = "\n".join(
            [
                "AWS4-HMAC-SHA256",
                amz_date,
                scope,
                hashlib.sha256(canonical_request.encode("utf-8")).hexdigest(),
            ]
        )

        k_date = _sign(f"AWS4{self.secret_access_key}".encode("utf-8"), datestamp)
        k_region = _sign(k_date, self.region)
        k_service = _sign(k_region, "s3")
        k_signing = _sign(k_service, "aws4_request")
        signature = hmac.new(
            k_signing, string_to_sign.encode("utf-8"), hashlib.sha256
        ).hexdigest()

        return {
            "Authorization": (
                f"AWS4-HMAC-SHA256 Credential={self.access_key_id}/{scope}, "
                f"SignedHeaders={signed_headers}, Signature={signature}"
            ),
            "x-amz-content-sha256": payload_hash,
            "x-amz-date": amz_date,
        }

    def _url(self, key: str, query: str = "") -> str:
        url = f"{self.endpoint}/{self.bucket}/{key}".rstrip("/")
        return f"{url}?{query}" if query else url

    # ── verbs ────────────────────────────────────────────────────────────────

    def put(self, key: str, data: bytes) -> None:
        import httpx  # noqa: PLC0415

        resp = httpx.put(
            self._url(key),
            content=data,
            headers={
                **self._headers("PUT", key, payload=data),
                "content-type": "application/octet-stream",
            },
            timeout=self.timeout,
        )
        if resp.status_code >= 300:
            raise BackupError(
                f"R2 rejected the upload of {key}: {resp.status_code} {resp.text[:300]}"
            )

    def get(self, key: str) -> bytes:
        import httpx  # noqa: PLC0415

        resp = httpx.get(
            self._url(key),
            headers=self._headers("GET", key),
            timeout=self.timeout,
        )
        if resp.status_code >= 300:
            raise BackupError(
                f"R2 could not return {key}: {resp.status_code} {resp.text[:300]}"
            )
        return resp.content

    def list(self, prefix: str) -> list[dict[str, Any]]:
        import xml.etree.ElementTree as ET  # noqa: PLC0415

        import httpx  # noqa: PLC0415

        # list-objects-v2 is a GET on the bucket, so the signed resource is the
        # bucket itself and the prefix travels in the (signed) query string.
        query = f"list-type=2&prefix={quote(prefix, safe='')}"
        headers = self._headers("GET", "", query=query)
        resp = httpx.get(
            f"{self.endpoint}/{self.bucket}?{query}",
            headers=headers,
            timeout=self.timeout,
        )
        if resp.status_code >= 300:
            raise BackupError(
                f"R2 could not list {prefix}: {resp.status_code} {resp.text[:300]}"
            )

        ns = {"s3": "http://s3.amazonaws.com/doc/2006-03-01/"}
        root = ET.fromstring(resp.text)
        out: list[dict[str, Any]] = []
        for item in root.findall("s3:Contents", ns):
            key = item.findtext("s3:Key", default="", namespaces=ns)
            size = int(item.findtext("s3:Size", default="0", namespaces=ns))
            modified = item.findtext("s3:LastModified", default="", namespaces=ns)
            out.append(
                {
                    "key": key,
                    "size": size,
                    "last_modified": _parse_iso(modified),
                }
            )
        return out

    def delete(self, key: str) -> None:
        import httpx  # noqa: PLC0415

        resp = httpx.delete(
            self._url(key),
            headers=self._headers("DELETE", key),
            timeout=self.timeout,
        )
        if resp.status_code >= 300 and resp.status_code != 404:
            raise BackupError(
                f"R2 could not delete {key}: {resp.status_code} {resp.text[:300]}"
            )


def _parse_iso(value: str) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def default_destination() -> Destination:
    """
    R2 when it is configured, a local directory otherwise.

    The local fallback is explicitly *not* silent — it logs a warning, because
    a backup sitting on the same ephemeral machine as the database is not a
    backup and an operator who thinks it is has a worse problem than one who
    knows there are none.
    """
    try:
        return R2Destination.from_env()
    except BackupError as exc:
        root = Path(os.getenv("BACKUP_LOCAL_DIR", "/tmp/jworden-backups"))
        logger.warning(
            "Backups are being written to local disk at %s — %s. On an "
            "ephemeral host this copy dies with the machine and protects "
            "nothing.",
            root,
            exc,
        )
        return LocalDestination(root=root)


# ── Manifest ──────────────────────────────────────────────────────────────────


@dataclass
class BackupManifest:
    key: str
    size_bytes: int
    sha256: str
    started_at: datetime
    finished_at: datetime
    database: str
    pg_dump_version: str
    verified: bool = False
    tables: list[str] = field(default_factory=list)

    @property
    def duration_seconds(self) -> float:
        return (self.finished_at - self.started_at).total_seconds()

    def to_dict(self) -> dict[str, Any]:
        return {
            "key": self.key,
            "size_bytes": self.size_bytes,
            "sha256": self.sha256,
            "started_at": self.started_at.isoformat(),
            "finished_at": self.finished_at.isoformat(),
            "duration_seconds": round(self.duration_seconds, 2),
            "database": self.database,
            "pg_dump_version": self.pg_dump_version,
            "verified": self.verified,
            "table_count": len(self.tables),
        }


# ── Dump ──────────────────────────────────────────────────────────────────────


def _pg_dump_version() -> str:
    out = subprocess.run(
        [_tool("pg_dump"), "--version"], capture_output=True, text=True, timeout=30
    )
    return (out.stdout or out.stderr).strip()


def backup_key(now: Optional[datetime] = None) -> str:
    now = now or datetime.now(timezone.utc)
    # Sorts chronologically as a string, which is what makes retention a
    # simple sort rather than a parse of every key.
    return f"{BACKUP_PREFIX}/{now.strftime('%Y/%m/%d')}/jworden-{now.strftime('%Y%m%dT%H%M%SZ')}.dump"


def create_backup(
    *,
    destination: Optional[Destination] = None,
    database_url: Optional[str] = None,
    verify: bool = True,
) -> BackupManifest:
    """
    Dump the database, store it, and read it back to confirm it is usable.

    `verify=True` is the default on purpose. An upload that returns 200 has
    proved that a request succeeded, not that the object is a restorable
    archive; the only cheap way to know is to fetch it and let `pg_restore`
    parse the table of contents.
    """
    dest = destination or default_destination()
    url = libpq_url(database_url)
    started = datetime.now(timezone.utc)
    key = backup_key(started)

    with tempfile.TemporaryDirectory(prefix="jworden-dump-") as tmp:
        dump_path = Path(tmp) / "db.dump"
        proc = subprocess.run(
            [
                _tool("pg_dump"),
                "--format=custom",
                "--no-owner",
                "--no-privileges",
                f"--file={dump_path}",
                url,
            ],
            capture_output=True,
            text=True,
            timeout=DUMP_TIMEOUT_SECONDS,
        )
        if proc.returncode != 0:
            raise BackupError(
                f"pg_dump failed for {_redacted(url)}: {proc.stderr.strip()[:500]}"
            )

        data = dump_path.read_bytes()

    if not data:
        raise BackupError("pg_dump produced an empty file")

    digest = hashlib.sha256(data).hexdigest()
    dest.put(key, data)

    manifest = BackupManifest(
        key=key,
        size_bytes=len(data),
        sha256=digest,
        started_at=started,
        finished_at=datetime.now(timezone.utc),
        database=_redacted(url),
        pg_dump_version=_pg_dump_version(),
    )

    if verify:
        stored = dest.get(key)
        if hashlib.sha256(stored).hexdigest() != digest:
            raise BackupError(
                f"{key} does not match what was uploaded — the stored copy is corrupt"
            )
        manifest.tables = list_archive_tables(stored)
        manifest.verified = True

    logger.info(
        "Backup complete: %s (%.1f MiB, %d tables, verified=%s)",
        key,
        len(data) / 1048576,
        len(manifest.tables),
        manifest.verified,
    )
    return manifest


def list_archive_tables(data: bytes) -> list[str]:
    """
    The tables inside a custom-format archive, via `pg_restore --list`.

    This is the integrity check: `pg_restore` parses the archive header and
    table of contents, so a truncated or non-archive file fails here rather
    than at 3am during an actual restore.
    """
    with tempfile.TemporaryDirectory(prefix="jworden-verify-") as tmp:
        path = Path(tmp) / "archive.dump"
        path.write_bytes(data)
        proc = subprocess.run(
            [_tool("pg_restore"), "--list", str(path)],
            capture_output=True,
            text=True,
            timeout=300,
        )
        if proc.returncode != 0:
            raise BackupError(
                f"the archive is not readable by pg_restore: {proc.stderr.strip()[:400]}"
            )

    tables: list[str] = []
    for line in proc.stdout.splitlines():
        if line.startswith(";"):
            continue
        # "…; 1259 16igit TABLE public customers postgres"
        parts = line.split()
        if "TABLE" in parts:
            idx = parts.index("TABLE")
            if idx + 2 < len(parts) and parts[idx + 1] != "DATA":
                tables.append(parts[idx + 2])
    return sorted(set(tables))


# ── Restore ───────────────────────────────────────────────────────────────────


def restore_backup(
    data: bytes,
    *,
    database_url: str,
    clean: bool = False,
    jobs: int = 1,
) -> dict[str, Any]:
    """
    Replay an archive into `database_url`.

    `database_url` is required and has no default. A restore that picks up the
    ambient DATABASE_URL is one mistyped shell command away from overwriting
    production with a staging snapshot, so the caller has to name the target.

    `clean=True` drops objects before recreating them. Off by default for the
    same reason.
    """
    url = libpq_url(database_url)

    with tempfile.TemporaryDirectory(prefix="jworden-restore-") as tmp:
        path = Path(tmp) / "archive.dump"
        path.write_bytes(data)

        cmd = [
            _tool("pg_restore"),
            "--no-owner",
            "--no-privileges",
            f"--jobs={max(1, jobs)}",
            "--dbname",
            url,
        ]
        if clean:
            cmd.insert(1, "--clean")
            cmd.insert(2, "--if-exists")
        cmd.append(str(path))

        proc = subprocess.run(
            cmd, capture_output=True, text=True, timeout=DUMP_TIMEOUT_SECONDS
        )

    # pg_restore exits non-zero for warnings too (a missing role, an extension
    # that already exists). Those are reported rather than raised, because
    # treating every warning as a failed restore trains people to ignore the
    # exit code entirely.
    warnings = [
        line for line in proc.stderr.splitlines() if line.strip()
    ]
    if proc.returncode != 0 and not warnings:
        raise BackupError("pg_restore failed with no diagnostic output")

    return {
        "target": _redacted(url),
        "exit_code": proc.returncode,
        "warnings": warnings[:50],
        "warning_count": len(warnings),
    }


# ── Retention ─────────────────────────────────────────────────────────────────


def prune(
    *,
    destination: Optional[Destination] = None,
    retention_days: int = RETENTION_DAYS,
    min_keep: int = RETENTION_MIN_KEEP,
    now: Optional[datetime] = None,
) -> dict[str, Any]:
    """
    Delete backups older than the retention window, keeping a floor.

    The floor is the important half. A pure age rule empties the bucket if the
    scheduler stops for longer than the window — precisely when backups are
    most needed and least likely to be noticed missing.
    """
    dest = destination or default_destination()
    now = now or datetime.now(timezone.utc)
    cutoff = now - timedelta(days=retention_days)

    objects = [o for o in dest.list(BACKUP_PREFIX) if o.get("key")]
    objects.sort(key=lambda o: o.get("last_modified") or datetime.min.replace(tzinfo=timezone.utc), reverse=True)

    kept = objects[:min_keep]
    candidates = objects[min_keep:]

    deleted: list[str] = []
    for obj in candidates:
        modified = obj.get("last_modified")
        if modified is not None and modified < cutoff:
            dest.delete(obj["key"])
            deleted.append(obj["key"])

    return {
        "examined": len(objects),
        "deleted": deleted,
        "deleted_count": len(deleted),
        "retained": len(objects) - len(deleted),
        "floor_protected": len(kept),
        "retention_days": retention_days,
        "cutoff": cutoff.isoformat(),
    }


def latest(destination: Optional[Destination] = None) -> Optional[dict[str, Any]]:
    """The most recent stored backup, or None when there are none at all."""
    dest = destination or default_destination()
    objects = [o for o in dest.list(BACKUP_PREFIX) if o.get("key")]
    if not objects:
        return None
    newest = max(
        objects,
        key=lambda o: o.get("last_modified") or datetime.min.replace(tzinfo=timezone.utc),
    )
    modified = newest.get("last_modified")
    age_hours = (
        (datetime.now(timezone.utc) - modified).total_seconds() / 3600.0
        if modified
        else None
    )
    return {
        "key": newest["key"],
        "size_bytes": newest.get("size"),
        "last_modified": modified.isoformat() if modified else None,
        "age_hours": round(age_hours, 2) if age_hours is not None else None,
    }
