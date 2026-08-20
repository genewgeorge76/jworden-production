"""
va_market_geo.py — Virginia's 9 VDOT districts and all 95 counties.

Source: VDOT's own district listing (vdot.virginia.gov/about/districts),
checked 2026-08-20. The Staunton and Culpeper rosters were read back
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

from dataclasses import dataclass


@dataclass(frozen=True)
class District:
    key: str
    name: str
    counties: tuple[str, ...]


DISTRICTS: tuple[District, ...] = (
    District("bristol", "Bristol District", (
        "Bland", "Buchanan", "Dickenson", "Grayson", "Lee", "Russell",
        "Scott", "Smyth", "Tazewell", "Washington", "Wise", "Wythe",
    )),
    District("salem", "Salem District", (
        "Bedford", "Botetourt", "Carroll", "Craig", "Floyd", "Franklin",
        "Giles", "Henry", "Montgomery", "Patrick", "Pulaski", "Roanoke",
    )),
    District("lynchburg", "Lynchburg District", (
        "Amherst", "Appomattox", "Buckingham", "Campbell", "Charlotte",
        "Cumberland", "Halifax", "Nelson", "Pittsylvania", "Prince Edward",
    )),
    District("richmond", "Richmond District", (
        "Amelia", "Brunswick", "Charles City", "Chesterfield", "Dinwiddie",
        "Goochland", "Hanover", "Henrico", "Lunenburg", "Mecklenburg",
        "New Kent", "Nottoway", "Powhatan", "Prince George",
    )),
    District("hampton_roads", "Hampton Roads District", (
        "Accomack", "Greensville", "Isle of Wight", "James City",
        "Northampton", "Southampton", "Surry", "Sussex", "York",
    )),
    District("fredericksburg", "Fredericksburg District", (
        "Caroline", "Essex", "Gloucester", "King and Queen", "King George",
        "King William", "Lancaster", "Mathews", "Middlesex",
        "Northumberland", "Richmond", "Spotsylvania", "Stafford",
        "Westmoreland",
    )),
    District("culpeper", "Culpeper District", (
        "Albemarle", "Culpeper", "Fauquier", "Fluvanna", "Greene", "Louisa",
        "Madison", "Orange", "Rappahannock",
    )),
    District("staunton", "Staunton District", (
        "Alleghany", "Augusta", "Bath", "Clarke", "Frederick", "Highland",
        "Page", "Rockbridge", "Rockingham", "Shenandoah", "Warren",
    )),
    District("northern_virginia", "Northern Virginia District", (
        "Arlington", "Fairfax", "Loudoun", "Prince William",
    )),
)

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
