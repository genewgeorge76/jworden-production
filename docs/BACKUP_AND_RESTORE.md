# Database backup and restore

A backup nobody has restored is a hypothesis. This document exists so the
restore is a procedure somebody has run, not a plan somebody has written.

Every command below was executed against PostgreSQL 16.13 and the output is
reproduced as it appeared. The automated equivalents live in
`tests/backend/test_db_backup_restore.py`, which dumps a populated database,
restores it into an empty one, and compares the rows — not the exit codes.

---

## What runs on its own

| Schedule | Task | What it does |
|---|---|---|
| 07:30 UTC daily | `app.tasks.backup_beat.run_nightly_backup` | `pg_dump -Fc`, store, verify the stored copy, prune old ones |
| 13:00 UTC daily | `app.tasks.backup_beat.check_backup_freshness` | Asks whether a recent backup exists at all |

The freshness check is separate on purpose. If the backup task stops being
scheduled — a broker outage, a beat container that never came back, a typo in
the crontab — it raises no errors, because it does nothing. A schedule that
has quietly stopped looks exactly like a schedule that is working. The only
way to notice is to ask the question from outside the thing that failed.

### Retention

`BACKUP_RETENTION_DAYS` (default 30) with a floor of `BACKUP_RETENTION_MIN_KEEP`
(default 7). The floor is the part that matters: a pure age rule empties the
bucket if the scheduler stops for longer than the window, deleting the last
copies of the data at exactly the moment nothing new is being written.

---

## Checking the state

```
GET /api/v1/ops/backups          # newest backup, its age, whether it is stale
POST /api/v1/ops/backups/run     # take one right now, synchronously
```

Both require the admin bearer token.

`"latest": null` means **nothing has ever been stored for this database**. That
is the answer that matters most, and it is the one a `backups: enabled` flag
would have hidden.

Take a manual backup before anything risky — a bulk customer import, a
migration. A backup from last night is not the same as a backup from before
the thing you are about to do.

---

## Where backups go

`R2Destination` when all four of `R2_ENDPOINT`, `R2_BUCKET`,
`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` are set; a local directory
otherwise.

**The local fallback is not a backup.** A copy on the same ephemeral host as
the database dies with the machine. The service logs a warning when it falls
back for exactly this reason — do not treat a green backup log as protection
until `GET /api/v1/ops/backups` shows objects landing in R2.

> **Not yet verified in production.** The dump, the restore, the integrity
> check and the retention logic are all covered by tests against a real
> PostgreSQL server. The R2 upload path is *not* — no R2 credentials were
> available when it was written, so its SigV4 signing has never been exercised
> against Cloudflare. The first real run must be confirmed by hand with
> `POST /api/v1/ops/backups/run` and then `GET /api/v1/ops/backups`.

---

## Restoring

### Format

Archives are `pg_dump --format=custom`. Already compressed; `pg_restore` can
list the contents without applying anything, which is what makes the integrity
check cheap; and a single table can be restored on its own, which is the
realistic emergency — not "the database is gone" but "the import overwrote the
wrong rows".

### The full procedure

Restore into a **new** database first and check it, then cut over. Restoring
straight over a live database turns a recoverable mistake into an unrecoverable
one.

```bash
# 1. Fetch the archive. Key comes from GET /api/v1/ops/backups.
#    (Any S3 client against the R2 endpoint, or the admin API.)

# 2. Confirm it is a readable archive BEFORE touching any database.
pg_restore --list backup.dump | head

# 3. Create a scratch database and restore into it.
psql "$BASE/postgres" -c 'create database restore_check'
pg_restore --no-owner --no-privileges --dbname "$BASE/restore_check" backup.dump

# 4. Verify contents — row counts AND values.
psql -tA "$BASE/restore_check" -c 'select count(*) from customers'
psql -tA "$BASE/restore_check" -c 'select count(*) from leads'
psql -tA "$BASE/restore_check" -c "select email from customers limit 1"

# 5. Only then cut over.
```

`$BASE` is the connection string **without** the database name, e.g.
`postgresql://user:pass@host:5432`. Append `/dbname` per command — do not
append a database to a URL that already names one, which produces the
confusing `database "postgres/foo" does not exist`.

### Verified transcript

Run on PostgreSQL 16.13, 2026-08-21:

```
rows before ....... 2
dump bytes ........ 2852
archive readable .. 2 TOC entries
rows restored ..... 2
value check ....... f@example.com
tenant preserved .. default
```

The last line matters. `tenant_id` has to survive the round trip — a restore
that dropped it would silently collapse every customer into one bucket, which
is worse than an obvious failure because the database would look fine.

### Restoring a single table

```bash
pg_restore --no-owner --no-privileges \
  --table=customers \
  --dbname "$BASE/production" backup.dump
```

### Notes on exit codes

`pg_restore` exits non-zero for warnings as well as errors — a missing role, an
extension that already exists. `restore_backup()` reports these rather than
raising, because treating every warning as a failed restore trains people to
ignore the exit code entirely. Read the warnings; do not assume non-zero means
the data did not land.

---

## What is deliberately not automatic

`restore_backup()` requires an explicit `database_url` and has no default. A
restore that picks up the ambient `DATABASE_URL` is one mistyped shell command
away from overwriting production with a staging snapshot. `clean=True` (drop
before recreate) is likewise off by default.

There is no scheduled restore drill. There should be: the tests prove the code
path, not that *this* deployment's stored archives are restorable. Until one
exists, run step 2–4 above by hand against a real stored backup periodically.
