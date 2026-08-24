"""
preserve_kickserv_customers.py — write the customer base to a file that outlives
the Kickserv account.

Usage:
    python scripts/preserve_kickserv_customers.py <export.zip> [--out data/reference]

Produces `kickserv_customers.json`: every customer, their contacts, and what
each one's job history states. This is the preservation artefact. Loading it
into the running CRM is a separate step (app/services/kickserv_customer_load.py)
so that the register survives a database being rebuilt, restored or lost —
which is the entire point of writing it down.
"""

import argparse
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from app.services import kickserv_customers  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", help="Kickserv export .zip")
    # private/ is gitignored. The register holds 1,785 private individuals at
    # their home addresses with their phone numbers beside them; it is
    # preserved deliberately and it does not belong on a git remote. Only the
    # summary — counts, no people — is committed.
    parser.add_argument("--out", default="private", help="output directory for the register")
    args = parser.parse_args()

    result = kickserv_customers.read_customers(args.archive)
    out_dir = REPO_ROOT / args.out
    out_dir.mkdir(parents=True, exist_ok=True)
    target = out_dir / "kickserv_customers.json"
    target.write_text(
        json.dumps(
            {"source": Path(args.archive).name, **result},
            indent=1,
            ensure_ascii=False,
            sort_keys=False,
        )
        + "\n",
        encoding="utf-8",
    )

    # The shape of the book, with nobody in it. Safe to commit, and the thing
    # the tests and the README are checked against.
    summary_path = REPO_ROOT / "data" / "reference" / "kickserv_customers.summary.json"
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.write_text(
        json.dumps(
            {"source": Path(args.archive).name, "summary": result["summary"]},
            indent=1,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )

    s = result["summary"]
    print(f"wrote {target.relative_to(REPO_ROOT)}  (gitignored — keep a copy off this machine)")
    print(f"wrote {summary_path.relative_to(REPO_ROOT)}")
    print(f"  {s['total']} customers — {s['commercial']} commercial, {s['residential']} residential")
    print(f"  {s['with_email']} with email, {s['with_phone']} with phone, {s['with_address']} with address")
    print(f"  {s['with_coordinates']} already geocoded, {s['with_completed_job']} with a completed job")
    print(f"  {s['franchise']} franchise-branded, {s['sms_unreachable']} with an unreachable mobile")
    top = list(s["states"].items())[:12]
    print("  states: " + ", ".join(f"{k} {v}" for k, v in top))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
