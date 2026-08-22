#!/usr/bin/env python3
"""
audit_tenant_isolation.py — report queries that read tenant-scoped tables
without filtering by tenant_id.

Why this exists
---------------
`app/jarvis_os/abilities/MultiTenantSaaS/tenant_isolator.py` claimed to enforce
multi-tenant isolation. It enforced nothing: it never touched the database, it
rolled `random.random() < 0.1`, and on that roll printed "CRITICAL SECURITY
BREACH PREVENTED" regardless of what was happening. It has since been retired to
a loud NOT_IMPLEMENTED.

This script replaces that theatre with a measurement. It is read-only and
changes no behaviour — it reports, so the real number is visible and can be
tracked down over time instead of asserted.

What it checks
--------------
For every `db.query(Model)` in app/routers, if Model's table has a `tenant_id`
column, the following few lines (the query chain) are scanned for `tenant_id`.
Models without a tenant_id column are skipped as not applicable.

Limitations, stated plainly
---------------------------
This is static analysis over source text, not a proof.

  - A query scoped by a helper (e.g. a pre-filtered session, or a join that
    constrains tenancy indirectly) is reported as unfiltered. False positive.
  - A query mentioning `tenant_id` in a nearby unrelated line is counted as
    filtered. False negative.
  - `scope(...)` and `get_scoped(...)` from app/services/tenancy.py count as
    filtered, since that is what they do.
  - By-id lookups are largely invisible: `db.get(Model, pk)` is not a
    `db.query(...)` call and is not matched at all. 41 of those sit behind
    tenant auth across the routers, and they are the more dangerous shape --
    a leaky list returns rows the caller did not ask for, a leaky by-id hands
    over exactly the row an attacker names. Use tenancy.get_scoped() for them;
    this script will not tell you when you have missed one.
  - Only `db.query(...)` is matched. `session.execute(select(...))` and raw SQL
    are not seen at all.

So treat the output as a floor on the exposure, not an exact figure. It exists
to make the number visible and moving in the right direction.

Usage
-----
    python scripts/audit_tenant_isolation.py            # summary
    python scripts/audit_tenant_isolation.py --list     # every unfiltered site
    python scripts/audit_tenant_isolation.py --max 20   # fail if over threshold

Exit code is 0 unless --max is given and exceeded, so it is safe to run in CI as
a ratchet: set --max to today's count and lower it as sites are fixed.
"""
from __future__ import annotations

import argparse
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

ROUTERS = pathlib.Path(__file__).resolve().parents[1] / "app" / "routers"
CHAIN_LINES = 8  # how far a query chain is assumed to extend


def _load_tenant_scoped() -> tuple[set[str], dict[str, str]]:
    """Return (tables carrying tenant_id, {ClassName: tablename})."""
    from app.models import Base  # noqa: PLC0415
    import app.models as models  # noqa: PLC0415

    scoped = {
        name for name, table in Base.metadata.tables.items()
        if "tenant_id" in table.columns
    }
    cls_to_table = {
        name: obj.__tablename__
        for name in dir(models)
        if hasattr((obj := getattr(models, name)), "__tablename__")
    }
    return scoped, cls_to_table


def audit() -> tuple[int, int, int, list[str]]:
    scoped, cls_to_table = _load_tenant_scoped()
    filtered = unfiltered = not_applicable = 0
    sites: list[str] = []

    for path in sorted(ROUTERS.glob("*.py")):
        lines = path.read_text(encoding="utf-8", errors="ignore").split("\n")
        for i, line in enumerate(lines):
            for match in re.finditer(r"\bdb\.query\((\w+)\)", line):
                table = cls_to_table.get(match.group(1))
                if not table or table not in scoped:
                    not_applicable += 1
                    continue
                # The chain window starts a line EARLIER than the match, because
                # the canonical fix wraps the query:
                #     scope(db.query(Job), Job, tenant_of(auth))
                # and when that is split across lines the `scope(` sits above
                # the `db.query(` this loop found.
                chain = "\n".join(lines[max(0, i - 1) : i + CHAIN_LINES])
                # scope() and get_scoped() ARE the tenant filter -- they are how
                # app/services/tenancy.py expresses one. Matching only the
                # literal "tenant_id" counted every correctly-scoped query as
                # unfiltered, so fixing a site left the number unchanged and the
                # ratchet could never come down.
                if "tenant_id" in chain or "scope(" in chain:
                    filtered += 1
                else:
                    unfiltered += 1
                    sites.append(f"{path.name}:{i + 1}  db.query({match.group(1)})")

    return filtered, unfiltered, not_applicable, sites


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--list", action="store_true", help="print every unfiltered site")
    parser.add_argument("--max", type=int, default=None,
                        help="exit non-zero if unfiltered count exceeds this")
    args = parser.parse_args()

    filtered, unfiltered, not_applicable, sites = audit()
    total = filtered + unfiltered

    print("Tenant isolation audit")
    print("=" * 48)
    print(f"  queries against tenant-scoped models : {total}")
    print(f"    filtered by tenant_id              : {filtered}")
    print(f"    NOT filtered                       : {unfiltered}")
    print(f"  queries on models without tenant_id  : {not_applicable} (n/a)")
    if total:
        print(f"  coverage                             : {filtered / total:.0%}")

    if args.list and sites:
        print("\nUnfiltered sites:")
        for site in sites:
            print(f"  {site}")
    elif sites:
        print(f"\n  (run with --list to see all {len(sites)})")

    if args.max is not None and unfiltered > args.max:
        print(f"\nFAIL: {unfiltered} unfiltered queries exceeds --max {args.max}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
