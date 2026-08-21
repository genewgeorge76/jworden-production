"""
Files the backend reads at boot must actually be in the Docker image.

THE OUTAGE THIS PREVENTS

va_market_geo.py reads src/data/virginiaMarketPages.json at import time — the
shared county roster, one file for backend and frontend. .dockerignore
excludes src/ wholesale, the new file had no exception, and every app machine
crash-looped with FileNotFoundError while the API served 503 for forty
minutes.

CI stayed green the whole way through, because the test job imports app.main
from the repo checkout — where the file exists. The image is the only place
the exclusion bites, and nothing looked at the image. Worse, reverting the
suspect MR did not help, because the breaking commit was an earlier one on
the same branch; the diagnosis only landed when the machine logs finally
reached CI output.

So this test walks the backend source for open()/read_text/Path references
into src/, and asserts each referenced file survives .dockerignore. It runs
against the same checkout CI already has — no image build required — and
fails at test time instead of at machine-boot time.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

pathspec = pytest.importorskip(
    "pathspec",
    reason="pathspec parses .dockerignore with docker's own gitwildmatch rules",
)

DOCKERIGNORE = REPO_ROOT / ".dockerignore"
APP_DIR = REPO_ROOT / "app"

# Any string literal that names a path under src/ inside backend code.
SRC_REF = re.compile(r"""["']((?:\.\./)*src/[^"']+\.[a-z0-9]+)["']""")


def _spec():
    return pathspec.PathSpec.from_lines("gitwildmatch", DOCKERIGNORE.open())


def _backend_src_references() -> set[str]:
    refs: set[str] = set()
    for py in APP_DIR.rglob("*.py"):
        text = py.read_text(encoding="utf-8", errors="ignore")
        for m in SRC_REF.finditer(text):
            path = m.group(1)
            while path.startswith("../"):
                path = path[3:]
            refs.add(path)
    return refs


def test_every_src_file_the_backend_references_survives_dockerignore():
    spec = _spec()
    excluded = sorted(p for p in _backend_src_references() if spec.match_file(p))
    assert not excluded, (
        "Backend code references files under src/ that .dockerignore removes "
        f"from the image: {excluded}. These exist in the repo checkout — so "
        "CI imports succeed — and are absent at machine boot, which is a "
        "crash loop and a 503, not a test failure. Add a negation for each."
    )


def test_the_county_roster_specifically_is_in_the_image():
    """The named file from the outage, pinned so the general regex can never
    silently stop matching it."""
    spec = _spec()
    assert not spec.match_file("src/data/virginiaMarketPages.json"), (
        ".dockerignore excludes src/data/virginiaMarketPages.json — "
        "va_market_geo.py reads it at import, so every app machine will "
        "crash-loop exactly as in the 2026-08-21 outage."
    )


def test_the_roster_actually_loads_from_the_path_the_backend_uses():
    from app.services.va_market_geo import DISTRICTS, all_counties
    assert len(DISTRICTS) == 9
    assert len(all_counties()) == 95


def test_dockerignore_negations_are_not_defeated_by_a_later_blanket_rule():
    """
    Docker ignore rules are last-match-wins. A `!src/data/x.json` line means
    nothing if a later `src/` or `*.json` re-excludes it. Assert the composed
    result rather than the presence of the negation line.
    """
    spec = _spec()
    assert not spec.match_file("src/config/siteFactoryManifest.json")
    # And the filter still does its job on everything else:
    assert spec.match_file("src/App.jsx")
    assert spec.match_file("src/data/anything-else.json")
