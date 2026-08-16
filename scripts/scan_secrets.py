#!/usr/bin/env python3
"""
scan_secrets.py — block credentials from being committed to this PUBLIC repo.

Written after three separate live-credential exposures were found already
committed here:

  1. email_accounts.json  — five Gmail app passwords in plaintext
  2. email_service.py, check_emails.py, sync_diamond_jobs_auto.py
                          — the same app password hardcoded in source
  3. a .env in a sibling repo with six provider API keys

Every one of those was readable by anyone on the internet, and each was also
baked into any Docker image built from the tree (the Dockerfile does COPY . .).

Usage:
    python scripts/scan_secrets.py            # scan tracked files, exit 1 on find
    python scripts/scan_secrets.py --staged   # scan staged changes (pre-commit)
    python scripts/scan_secrets.py --all      # scan the working tree

Design notes:
  * Only high-confidence, provider-specific patterns are ERRORs. Generic
    "password = ..." matching produces noise, and a scanner people ignore is
    worse than no scanner.
  * Findings are reported with a redacted preview. The point is to name the
    file, not to reprint the secret into CI logs that may themselves be public.
  * Files whose whole purpose is to show the shape of a credential
    (*.example.*, docs) are skipped, as are vendored and generated trees.
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

# ── Patterns ────────────────────────────────────────────────────────────────
# (name, regex, note). Anchored to provider-specific prefixes and lengths so a
# match is nearly always a real credential rather than a lookalike.

PATTERNS: list[tuple[str, re.Pattern[str], str]] = [
    ("Anthropic API key", re.compile(r"sk-ant-api\d{2}-[A-Za-z0-9_-]{20,}"), "console.anthropic.com"),
    ("OpenAI API key", re.compile(r"sk-(?:proj-)?[A-Za-z0-9]{20,}T3BlbkFJ[A-Za-z0-9]{20,}"), "platform.openai.com"),
    ("Google API key", re.compile(r"AIzaSy[A-Za-z0-9_-]{33}"), "console.cloud.google.com"),
    ("GitHub token", re.compile(r"gh[pousr]_[A-Za-z0-9]{36,}"), "github.com/settings/tokens"),
    ("Slack bot token", re.compile(r"xox[baprs]-[A-Za-z0-9-]{10,}"), "api.slack.com"),
    ("SendGrid API key", re.compile(r"SG\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}"), "app.sendgrid.com"),
    ("Stripe live secret key", re.compile(r"sk_live_[A-Za-z0-9]{20,}"), "dashboard.stripe.com"),
    ("AWS access key id", re.compile(r"AKIA[0-9A-Z]{16}"), "console.aws.amazon.com"),
    ("Private key block", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----"), "key material"),
    (
        "Gmail app password",
        # Google issues these as 16 lowercase letters. Only flagged when bound
        # to a credential-shaped name, since 16 bare letters alone is a common
        # substring in minified assets.
        # The case-insensitive flag is scoped to the key name only. Applied
        # globally it would also fold [a-z]{16}, letting SHOUTY placeholder
        # constants match the value and defeating the check.
        re.compile(
            r"(?i:app_?password|gmail_?app_?pass|smtp_?pass\w*)"
            # optional closing quote so JSON keys ("app_password": "...") match
            r"[\"']?\s*[:=]\s*[\"'][a-z]{16}[\"']"
        ),
        "myaccount.google.com/apppasswords",
    ),
    (
        "Database URL with inline password",
        re.compile(r"(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?)://[^\s:/@]+:(?!\s)[^\s@/]{8,}@"),
        "connection string",
    ),
]

# Values that match a pattern's shape but are placeholders or third-party
# public keys, verified individually. Kept explicit so the list stays auditable.
ALLOWLIST_SUBSTRINGS = {
    "ENTER_16_LETTER_PASSWORD_HERE",
    "jworden_dev_pass",  # docker-compose local-only, host is the compose service "db"
    "your-password",
    "changeme",
    "postgres:postgres@",
}

SKIP_DIR_PARTS = {
    ".git", "node_modules", "dist", "build", ".next", ".venv", "venv",
    "__pycache__", ".mypy_cache", ".pytest_cache", ".ruff_cache", "vendor",
    "site-packages", "coverage",
}

SKIP_NAME_PATTERNS = [
    re.compile(r"\.example\.", re.I),
    re.compile(r"\.sample\.", re.I),
    re.compile(r"(?:^|[./])package-lock\.json$", re.I),
    re.compile(r"\.min\.(?:js|css)$", re.I),
    re.compile(r"\.(?:map|lock)$", re.I),
    re.compile(r"\.js\.download$", re.I),
    re.compile(r"^scripts/scan_secrets\.py$"),  # this file names the patterns
]

BINARY_SUFFIXES = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".pdf", ".zip", ".gz",
    ".woff", ".woff2", ".ttf", ".eot", ".mp4", ".mov", ".db", ".sqlite",
    ".sqlite3", ".pyc", ".so", ".dylib", ".dll",
}


def should_skip(rel_path: str) -> bool:
    parts = set(Path(rel_path).parts)
    if parts & SKIP_DIR_PARTS:
        return True
    if Path(rel_path).suffix.lower() in BINARY_SUFFIXES:
        return True
    return any(p.search(rel_path) for p in SKIP_NAME_PATTERNS)


def redact(value: str) -> str:
    """
    Show enough to locate the secret, never any of its trailing characters.

    CI logs for a public repository can themselves be public, so no tail is
    printed. The file:line already identifies the finding precisely.
    """
    value = value.strip()
    head = value[:8]
    return f"{head}... ({len(value)} chars)"


def git_files(mode: str) -> list[str]:
    if mode == "staged":
        cmd = ["git", "diff", "--cached", "--name-only", "--diff-filter=ACM"]
    elif mode == "all":
        cmd = ["git", "ls-files", "--cached", "--others", "--exclude-standard"]
    else:
        cmd = ["git", "ls-files"]
    out = subprocess.run(cmd, capture_output=True, text=True, check=True).stdout
    return [line for line in out.splitlines() if line.strip()]


def scan_file(rel_path: str) -> list[tuple[int, str, str, str]]:
    """Return (line_no, pattern_name, redacted_match, note) for each finding."""
    path = Path(rel_path)
    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except (OSError, UnicodeDecodeError):
        return []

    findings: list[tuple[int, str, str, str]] = []
    for line_no, line in enumerate(text.splitlines(), start=1):
        if len(line) > 4000:  # minified bundle; not hand-authored source
            continue
        for name, pattern, note in PATTERNS:
            for match in pattern.finditer(line):
                hit = match.group(0)
                if any(alw in hit for alw in ALLOWLIST_SUBSTRINGS):
                    continue
                findings.append((line_no, name, redact(hit), note))
    return findings


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--staged", action="store_true", help="scan staged changes only")
    group.add_argument("--all", action="store_true", help="scan tracked + untracked files")
    args = parser.parse_args()

    mode = "staged" if args.staged else "all" if args.all else "tracked"

    try:
        files = git_files(mode)
    except subprocess.CalledProcessError as exc:
        print(f"scan_secrets: git failed: {exc}", file=sys.stderr)
        return 2

    total = 0
    scanned = 0
    for rel_path in files:
        if should_skip(rel_path):
            continue
        if not Path(rel_path).is_file():
            continue
        scanned += 1
        for line_no, name, preview, note in scan_file(rel_path):
            if total == 0:
                print("Potential credentials found:\n", file=sys.stderr)
            total += 1
            print(f"  {rel_path}:{line_no}", file=sys.stderr)
            print(f"    {name}: {preview}   [{note}]\n", file=sys.stderr)

    if total:
        print(
            f"{total} potential credential(s) across {scanned} scanned file(s).\n"
            "\n"
            "This repository is PUBLIC. Do not commit these.\n"
            "  - Move the value to an environment variable.\n"
            "  - If it was ever committed, ROTATE it: removing the file does not\n"
            "    revoke a credential that is already in git history.\n"
            "  - If this is a false positive, add it to ALLOWLIST_SUBSTRINGS in\n"
            "    scripts/scan_secrets.py with a note on why it is safe.\n",
            file=sys.stderr,
        )
        return 1

    print(f"scan_secrets: clean ({scanned} files scanned, mode={mode}).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
