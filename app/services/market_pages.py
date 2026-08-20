"""
market_pages.py — Programmatic county pages, with no invented numbers.

Generates the URL, headings, meta and JSON-LD for a per-county service page
across Virginia's 95 counties. Two rules shape the whole module.

Only citable specifications
───────────────────────────
Every technical claim in the output comes from `SPECIFICATIONS` below, each
entry carrying the document it is drawn from. Copy cannot name a spec that
is not in that table. The point is not tidiness: a page that cites "VDOT
Section 315" for a mix design is worse than one that cites nothing, because
it reads as expertise to a customer and as sloppiness to an engineer, and
seven citations in this codebase were already wrong once.

No search metrics
─────────────────
Nothing here emits a search volume, a CPC, a difficulty score or a traffic
estimate, and `PageSpec` has no field to carry one. The source document for
this work listed a table of them — "320 / mo", "$58.00 CPC" — and no such
measurement exists: the Ahrefs plan has no API access and Search Console is
not connected. A number with no measurement behind it is not a forecast, it
is a decoration that gets budgeted against.

If real keyword data arrives later it belongs in `seo_keywords` with its
source, the way material prices carry `source_note`, and pages can read it
from there.

Schema type
───────────
`GeneralContractor`, which is a real schema.org subtype of
HomeAndConstructionBusiness. The source document used `PavingContractor`,
which **is not a schema.org type at all** — the eight subtypes are
Electrician, GeneralContractor, HVACBusiness, HousePainter, Locksmith,
MovingCompany, Plumber, RoofingContractor. An unrecognised @type is not a
rich result; it is markup Google ignores.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any, Optional

from app.services.va_market_geo import District, district_for

SCHEMA_TYPE = "GeneralContractor"


@dataclass(frozen=True)
class Specification:
    code: str
    description: str
    source: str


# Every technical string the generator may emit, with its provenance.
SPECIFICATIONS: dict[str, Specification] = {
    "sm_9_5a": Specification(
        "VDOT SM-9.5A",
        "9.5 mm nominal maximum aggregate surface mix",
        "VDOT Road and Bridge Specifications, Section 211 (Asphalt Concrete)",
    ),
    "sm_12_5a": Specification(
        "VDOT SM-12.5A",
        "12.5 mm nominal maximum aggregate surface mix",
        "VDOT Road and Bridge Specifications, Section 211 (Asphalt Concrete)",
    ),
    "bm_25_0a": Specification(
        "VDOT BM-25.0A",
        "25.0 mm nominal maximum aggregate base mix",
        "VDOT Road and Bridge Specifications, Section 211 (Asphalt Concrete)",
    ),
    "entrance_permit": Specification(
        "24VAC30-151",
        "Land Use Permit Regulations, which govern commercial entrances onto "
        "state-maintained roads",
        "Virginia Administrative Code, Title 24, Agency 30, Chapter 151",
    ),
}

SERVICES: dict[str, dict[str, Any]] = {
    "commercial-asphalt-paving": {
        "label": "Commercial Asphalt Paving",
        "specs": ("sm_12_5a", "bm_25_0a"),
    },
    "asphalt-overlay": {
        "label": "Asphalt Overlay and Resurfacing",
        "specs": ("sm_9_5a",),
    },
    "parking-lot-paving": {
        "label": "Parking Lot Paving",
        "specs": ("sm_9_5a", "bm_25_0a"),
    },
    "commercial-entrance": {
        "label": "VDOT Commercial Entrance Construction",
        "specs": ("entrance_permit", "sm_12_5a"),
    },
    "sealcoating": {
        "label": "Sealcoating and Pavement Preservation",
        "specs": (),
    },
}


class UnknownService(Exception):
    pass


class UnknownCounty(Exception):
    pass


def slug(value: str) -> str:
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", value.lower())).strip("-")


@dataclass
class PageSpec:
    """
    One generated page.

    Deliberately has no field for search volume, CPC, difficulty or traffic
    estimate. There is no measurement available for any of them, and a
    struct with the field invites something to fill it in.
    """
    url: str
    path: str
    county: str
    district: str
    service: str
    service_label: str
    h1: str
    meta_title: str
    meta_description: str
    specifications: list[dict[str, str]] = field(default_factory=list)
    schema_jsonld: dict[str, Any] = field(default_factory=dict)

    def as_dict(self) -> dict[str, Any]:
        return {
            "url": self.url, "path": self.path, "county": self.county,
            "district": self.district, "service": self.service,
            "service_label": self.service_label, "h1": self.h1,
            "meta_title": self.meta_title,
            "meta_description": self.meta_description,
            "specifications": self.specifications,
            "schema_jsonld": self.schema_jsonld,
        }


def _truncate(text: str, limit: int) -> str:
    """Trim on a word boundary; a meta description cut mid-word reads broken."""
    if len(text) <= limit:
        return text
    cut = text[:limit].rsplit(" ", 1)[0]
    return cut.rstrip(".,;: ") + "."


def generate_page(
    *,
    domain: str,
    county: str,
    service: str,
    business_name: str,
    telephone: Optional[str] = None,
    district: Optional[District] = None,
) -> PageSpec:
    if service not in SERVICES:
        raise UnknownService(
            f"unknown service {service!r}. Known: {sorted(SERVICES)}"
        )

    district = district or district_for(county)
    if district is None:
        raise UnknownCounty(
            f"{county!r} is not one of Virginia's 95 counties. Independent "
            "cities are not counties and need their own pages."
        )

    entry = SERVICES[service]
    label = entry["label"]
    specs = [SPECIFICATIONS[k] for k in entry["specs"]]
    county_name = county if county.endswith("County") else f"{county} County"

    path = f"/virginia/{slug(county)}-county/{service}"
    url = f"https://{domain.rstrip('/')}{path}"

    spec_sentence = ""
    if specs:
        codes = ", ".join(s.code for s in specs)
        spec_sentence = f" Built to {codes}."

    meta_description = _truncate(
        f"{label} in {county_name}, Virginia, in VDOT's "
        f"{district.name}.{spec_sentence} Request an estimate.",
        155,
    )

    schema: dict[str, Any] = {
        "@context": "https://schema.org",
        "@type": SCHEMA_TYPE,
        "name": f"{business_name} — {county_name}",
        "url": url,
        "areaServed": {
            "@type": "AdministrativeArea",
            "name": f"{county_name}, Virginia",
        },
        "knowsAbout": [f"{s.code} — {s.description}" for s in specs] or [label],
    }
    if telephone:
        schema["telephone"] = telephone

    return PageSpec(
        url=url,
        path=path,
        county=county_name,
        district=district.name,
        service=service,
        service_label=label,
        h1=f"{label} in {county_name}, Virginia",
        meta_title=_truncate(f"{label} | {county_name}, VA", 60),
        meta_description=meta_description,
        specifications=[
            {"code": s.code, "description": s.description, "source": s.source}
            for s in specs
        ],
        schema_jsonld=schema,
    )


def plan(
    *,
    domain: str,
    business_name: str,
    services: Optional[list[str]] = None,
    districts: Optional[list[str]] = None,
    telephone: Optional[str] = None,
) -> dict[str, Any]:
    """
    Every page the chosen services and districts would produce.

    Returns counts and the full URL list. No projected traffic, no projected
    revenue — the number of pages is knowable, and what they would earn is
    not.
    """
    from app.services.va_market_geo import DISTRICTS

    chosen_services = services or list(SERVICES)
    for s in chosen_services:
        if s not in SERVICES:
            raise UnknownService(f"unknown service {s!r}. Known: {sorted(SERVICES)}")

    chosen = [d for d in DISTRICTS if not districts or d.key in districts]
    if districts and not chosen:
        raise UnknownCounty(f"no districts matched {districts!r}")

    pages: list[PageSpec] = []
    for d in chosen:
        for county in d.counties:
            for service in chosen_services:
                pages.append(generate_page(
                    domain=domain, county=county, service=service,
                    business_name=business_name, telephone=telephone,
                    district=d,
                ))

    return {
        "domain": domain,
        "districts": [d.name for d in chosen],
        "counties": sum(len(d.counties) for d in chosen),
        "services": chosen_services,
        "page_count": len(pages),
        "urls": [p.url for p in pages],
        "note": "Page count only. No traffic or revenue projection is included "
                "because no measurement exists for either.",
    }
