"""
The environment running these tests must be the environment that ships.

Three ferrari endpoints were returning 422 to every caller in production while
the whole suite passed locally. The cause was not in the application code
alone: requirements.backend.txt pins fastapi==0.115.12 and pydantic==2.11.4,
which is what CI and the Docker image install, and the dev sandbox had fastapi
0.141 and pydantic 2.13, which resolve a forward-referenced body model that
0.115 does not.

So every local run all session was testing software that does not deploy. The
bug was found only because CI ran the suite for the first time -- until then
the CI job ran no tests at all.

That is a whole class, not one bug. Any behavioural difference between a
locally installed version and a pinned one is invisible until production finds
it. This test makes the divergence loud in whatever environment it happens.

Only packages whose version genuinely changes runtime behaviour are checked.
Pinning every transitive dependency here would produce a test that fails for
reasons nobody cares about, and a test people learn to ignore is worse than no
test.
"""
from __future__ import annotations

import importlib.metadata as metadata
import re
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
REQUIREMENTS = REPO_ROOT / "requirements.backend.txt"

#: Packages where a version difference has already cost us, or plausibly could.
#: fastapi/pydantic/starlette decide how requests are parsed and validated;
#: sqlalchemy decides how queries are built. Checked when a pin exists.
BEHAVIOURAL = ("fastapi", "pydantic", "starlette", "sqlalchemy")

#: The subset that must be pinned OUTRIGHT. starlette is deliberately absent:
#: it is not named in requirements.backend.txt and is constrained transitively
#: by fastapi's own dependency range. Pinning it directly here would fight that
#: range on the next fastapi bump. It stays in BEHAVIOURAL so that if a pin is
#: ever added, it is enforced.
MUST_BE_PINNED = ("fastapi", "pydantic", "sqlalchemy")

_LINE = re.compile(
    r"^(?P<name>[A-Za-z0-9_.\-]+)"
    r"(?:\[[^\]]+\])?"                       # extras: pydantic[email]
    r"==(?P<version>[^\s;]+)"
    r"(?:\s*;\s*(?P<marker>.+))?$"
)


def _pinned() -> dict[str, str]:
    """
    Parse the pins that apply to the running interpreter.

    Environment markers matter: the file pins different FastAPI versions either
    side of python_version 3.14, and reading the wrong branch would make this
    test assert against a version that was never meant to be installed.
    """
    pins: dict[str, str] = {}
    for raw in REQUIREMENTS.read_text(encoding="utf-8").splitlines():
        line = raw.split("#", 1)[0].strip()
        if not line:
            continue
        match = _LINE.match(line)
        if not match:
            continue
        marker = match.group("marker")
        if marker:
            try:
                from packaging.markers import Marker  # noqa: PLC0415

                if not Marker(marker).evaluate():
                    continue
            except ImportError:  # pragma: no cover
                pytest.skip("packaging is unavailable; cannot evaluate markers")
        pins[match.group("name").lower()] = match.group("version")
    return pins


@pytest.mark.parametrize("package", BEHAVIOURAL)
def test_installed_version_matches_the_pin(package: str):
    pins = _pinned()
    expected = pins.get(package)
    if expected is None:
        pytest.skip(f"{package} is not pinned for python {sys.version_info[:2]}")

    try:
        installed = metadata.version(package)
    except metadata.PackageNotFoundError:  # pragma: no cover
        pytest.fail(f"{package} is pinned to {expected} but is not installed")

    assert installed == expected, (
        f"{package} {installed} is installed but requirements.backend.txt pins "
        f"{expected} for this interpreter.\n"
        f"This environment is not testing what deploys. Three endpoints shipped "
        f"broken behind exactly this gap — the suite passed on a newer FastAPI "
        f"than the Docker image installs.\n"
        f"Fix the environment, not this test:\n"
        f"    pip install -r requirements.backend.txt"
    )


def test_every_behavioural_package_is_actually_pinned():
    """
    A package that drops out of the requirements file stops being checked
    above, silently. This notices.
    """
    pins = _pinned()
    missing = [p for p in MUST_BE_PINNED if p not in pins]
    assert not missing, (
        f"no pin found for {', '.join(missing)} at python "
        f"{'.'.join(map(str, sys.version_info[:2]))} — either the pin was "
        f"removed or its environment marker no longer matches this interpreter"
    )


def test_the_requirements_file_parses():
    """If nothing parses, every assertion above would vacuously skip."""
    assert len(_pinned()) > 10, "requirements.backend.txt yielded almost no pins"
