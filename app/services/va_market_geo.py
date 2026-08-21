"""
va_market_geo.py — Virginia's 9 VDOT districts and all 95 counties.

Source: VDOT's own district listing (vdot.virginia.gov/about/districts),
checked 2026-08-20. The roster itself lives in
`src/data/virginiaMarketPages.json`, shared with the frontend. The Staunton and Culpeper rosters were read back
verbatim from that page and match; the counties across all nine districts
sum to exactly 95 with no duplicates, which is Virginia's actual county
count, and `validate()` asserts both properties at import time.

Two corrections to the strategy document this was built from:

  It omitted the **Northern Virginia District** entirely. VDOT has nine;
  the document listed eight and split Fredericksburg into "Fredericksburg
  & Northern Neck".

  It listed an **"Eastern Shore" district**. There is no such VDOT
  district. Accomack and Northampton are in the Hampton Roads District.

Independent cities are deliberately absent. Virginia has 38 of them and
they belong to no county, so a page keyed on "county" cannot describe
Richmond, Lynchburg or Staunton the cities. They need their own treatment
rather than being quietly filed under a neighbouring county.
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class District:
    key: str
    name: str
    counties: tuple[str, ...]


# The roster lives in src/data/virginiaMarketPages.json so the backend and the
# frontend read the same bytes. Two copies would drift, and the drift is silent:
# a county present on one side and not the other yields a URL the sitemap
# advertises and the router 404s, or a page nothing links to.
_DATA_PATH = (
    Path(__file__).resolve().parents[2] / "src" / "data" / "virginiaMarketPages.json"
)


def _load() -> tuple[District, ...]:
    with _DATA_PATH.open(encoding="utf-8") as fh:
        payload = json.load(fh)
    return tuple(
        District(d["key"], d["name"], tuple(d["counties"]))
        for d in payload["districts"]
    )


DISTRICTS: tuple[District, ...] = _load()

VIRGINIA_COUNTY_COUNT = 95

BY_KEY = {d.key: d for d in DISTRICTS}


def all_counties() -> list[tuple[str, District]]:
    return [(county, d) for d in DISTRICTS for county in d.counties]


def district_for(county: str) -> District | None:
    """
    Look up a county's district.

    Richmond is both a county (Fredericksburg District) and an independent
    city; this resolves the county. Callers meaning the city must say so.
    """
    target = county.strip().removesuffix(" County").strip().casefold()
    for d in DISTRICTS:
        for name in d.counties:
            if name.casefold() == target:
                return d
    return None


def validate() -> None:
    seen: set[str] = set()
    duplicates: list[str] = []
    for county, _ in all_counties():
        if county in seen:
            duplicates.append(county)
        seen.add(county)
    if duplicates:
        raise ValueError(f"county listed in more than one district: {duplicates}")
    if len(seen) != VIRGINIA_COUNTY_COUNT:
        raise ValueError(
            f"{len(seen)} counties across the districts; Virginia has "
            f"{VIRGINIA_COUNTY_COUNT}. The roster is incomplete."
        )
    if len(DISTRICTS) != 9:
        raise ValueError(f"{len(DISTRICTS)} districts; VDOT has 9.")


validate()
