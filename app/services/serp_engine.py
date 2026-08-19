"""
serp_engine.py — Programmatic SEO generation and keyword-set arithmetic.

Two halves, kept apart on purpose.

The generative half — JSON-LD schema, city-silo URLs, titles and meta
descriptions — is pure and deterministic. Nothing external is consulted and
nothing is estimated, so it is correct today with no data source connected at
all. That half of the drafted engine was already sound and is preserved.

The metrics half only reports what has been imported. The drafted version
carried fifteen hardcoded keyword rows with figures nothing produced — volume
2400, CPC $58.50 — multiplied them by an assumed 5% click-through, and printed
the result as a monthly pipeline value. Three invented numbers compounded into
a fourth that read like revenue. Here, aggregates are computed only over rows
that actually carry a metric, every aggregate reports its own coverage, and
the click-through assumption is returned alongside any modelled figure rather
than baked into it.

An empty keyword table therefore produces an empty table in the UI, not
plausible rows. That is the correct output when nothing has been measured.
"""

from __future__ import annotations

import csv
import io
import re
from typing import Any, Iterable, Optional

# Schema.org types by vertical. Anything unlisted falls back to a type that is
# true of every contractor rather than guessing a more specific one.
_SCHEMA_TYPES = {
    "pavement": "PavingContractor",
    "roofing": "RoofingContractor",
    "concrete": "GeneralContractor",
    "facility": "ProfessionalService",
    "saas": "SoftwareApplication",
}

_VERTICAL_LABELS = {
    "pavement": "Commercial Paving",
    "roofing": "Commercial Roofing",
    "concrete": "Commercial Concrete",
    "facility": "Facility Maintenance",
    "saas": "Construction Software",
}

_SLUG_RE = re.compile(r"[^a-z0-9]+")


def slugify(value: str) -> str:
    return _SLUG_RE.sub("-", (value or "").strip().lower()).strip("-")


def vertical_label(vertical: str) -> str:
    return _VERTICAL_LABELS.get(vertical, vertical.replace("_", " ").title())


def schema_type_for(vertical: str) -> str:
    return _SCHEMA_TYPES.get(vertical, "GeneralContractor")


def build_landing_page(
    domain: str,
    city: str,
    state: str,
    vertical: str = "pavement",
    path_template: str = "/{state}/{city}/commercial-contractor",
) -> dict[str, Any]:
    """
    URL, H1, title, meta description and JSON-LD for one city page.

    Deterministic: the same inputs always produce the same page, which is what
    makes a programmatic silo auditable. The drafted version rendered the
    vertical through `.toUpperCase()`, giving headings like "Commercial
    PAVEMENT Contractor in Dallas" — shouting a word mid-sentence. Labels are
    looked up instead.
    """
    host = (domain or "").strip().lower().removeprefix("https://").removeprefix("http://").strip("/")
    city_name = (city or "").strip()
    state_name = (state or "").strip()
    label = vertical_label(vertical)

    path = path_template.format(state=slugify(state_name), city=slugify(city_name))
    url = f"https://{host}{path}"

    location = f"{city_name}, {state_name}" if state_name else city_name
    return {
        "url": url,
        "path": path,
        "h1": f"{label} Contractor in {location}",
        "title": f"{label} — {location} | Direct Self-Perform",
        "meta_description": (
            f"Direct {label.lower()} services in {location}. Plant-direct pricing, "
            f"certified engineering QA, and a single-source warranty."
        ),
        "json_ld": {
            "@context": "https://schema.org",
            "@type": schema_type_for(vertical),
            "name": f"{host.split('.')[0]} — {city_name}" if city_name else host,
            "url": url,
            "description": (
                f"Direct {label.lower()} infrastructure, asset preservation and "
                f"certified QA engineering in {location}."
            ),
            "areaServed": {"@type": "AdministrativeArea", "name": location},
        },
    }


def build_city_silo(
    domain: str,
    cities: Iterable[tuple[str, str]],
    vertical: str = "pavement",
    path_template: str = "/{state}/{city}/commercial-contractor",
) -> list[dict[str, Any]]:
    """Build one landing page per (city, state). Duplicate paths are dropped."""
    seen: set[str] = set()
    pages: list[dict[str, Any]] = []
    for city, state in cities:
        page = build_landing_page(domain, city, state, vertical, path_template)
        if page["path"] in seen:
            continue
        seen.add(page["path"])
        pages.append(page)
    return pages


def summarise_keywords(
    rows: list[dict[str, Any]],
    assumed_ctr: Optional[float] = None,
) -> dict[str, Any]:
    """
    Aggregate a keyword set, reporting coverage for every figure.

    `with_volume` and `with_cpc` say how many of the rows actually carried the
    metric being averaged. An average CPC over 3 of 15 rows is a different
    claim from one over all 15, and a summary that does not say which is
    inviting the reader to assume the second.

    `modelled_monthly_value` is returned only when a click-through rate is
    supplied by the caller, and always beside the assumption that produced it.
    The drafted engine hardcoded 0.05 and printed the product as a dollar
    figure with no assumption visible — for its fifteen invented rows that came
    to roughly $243,000 a month of imaginary pipeline.
    """
    with_volume = [r for r in rows if r.get("volume_monthly") is not None]
    with_cpc = [r for r in rows if r.get("cpc_usd") is not None]
    with_both = [r for r in rows if r.get("volume_monthly") is not None and r.get("cpc_usd") is not None]

    summary: dict[str, Any] = {
        "keywords": len(rows),
        "with_volume": len(with_volume),
        "with_cpc": len(with_cpc),
        "total_monthly_volume": sum(r["volume_monthly"] for r in with_volume) if with_volume else None,
        "avg_cpc_usd": (
            round(sum(r["cpc_usd"] for r in with_cpc) / len(with_cpc), 2) if with_cpc else None
        ),
        "sources": sorted({r["source"] for r in rows if r.get("source")}),
        "modelled_monthly_value_usd": None,
        "assumed_ctr": assumed_ctr,
        "modelled_from_keywords": len(with_both) if assumed_ctr is not None else None,
    }

    if assumed_ctr is not None and with_both:
        summary["modelled_monthly_value_usd"] = round(
            sum(r["volume_monthly"] * r["cpc_usd"] * assumed_ctr for r in with_both), 2
        )
    return summary


_CSV_COLUMNS = [
    "keyword", "vertical", "category", "country", "volume_monthly", "cpc_usd",
    "difficulty", "current_position", "impressions", "clicks", "intent",
    "target_domain", "source", "source_captured_at",
]


def keywords_to_csv(rows: list[dict[str, Any]]) -> str:
    """
    Export, with `source` as a column rather than an omission.

    The drafted export wrote "Target Keyword, Monthly Searches, Estimated CPC"
    and nothing about origin, so a client opening the file had no way to tell
    measured figures from invented ones. Empty cells here mean unmeasured and
    are left empty rather than filled with 0, which would read as a measurement
    of zero.
    """
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=_CSV_COLUMNS, extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        writer.writerow({c: ("" if row.get(c) is None else row.get(c)) for c in _CSV_COLUMNS})
    return buf.getvalue()
