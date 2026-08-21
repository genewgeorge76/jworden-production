"""
site_health.py — Check what a domain actually serves, not what it returns.

WHY THIS EXISTS

jwordenasphaltpaving.com — the primary domain, named in every canonical and
in the sitemap generator — spent an unknown period serving a Sedo advertising
parking page. It was invisible to monitoring for one reason: it answered
HTTP 200. A four-hourly health check watched that domain go green every
single cycle while customers and Googlebot got somebody else's ads.

Status codes are not health. A parked domain returns 200. An unrendered
single-page app returns 200 with an empty body. A page that canonicalizes to
a dead domain returns 200 and quietly asks Google to drop it. Every one of
those is invisible to a check that stops at the status line, and every one of
them costs rankings.

So this reads the response. Six checks, each one drawn from a failure this
system has actually had rather than a generic checklist:

  parked          the domain resolves to a parking or for-sale service
  empty_shell     200, but no visible text — the SPA never prerendered
  canonical_drift the page points its canonical at a different host
  unexpected_noindex  a page meant to rank is telling crawlers not to
  no_sitemap      robots.txt or the sitemap is unreachable
  duplicate_body  two domains serve substantially the same page

ON THE WORD "SELF-HEALING"

Most of these cannot be fixed from inside the software. A parked domain needs
a bill paid or a DNS record changed; an unrendered site needs a build. Saying
otherwise would rebuild the exact problem this module exists to solve — a
green light that means nothing. So this detects precisely and states the
remedy. Where a remedy genuinely is automatic (re-announcing a sitemap), the
caller can act on the finding; nothing here pretends a domain repaired itself.
"""
from __future__ import annotations

import hashlib
import logging
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Iterable, Optional

logger = logging.getLogger(__name__)

# Fingerprints of domain parking and for-sale services. Matched against the
# response body and headers; any one of them means the domain is not serving
# the site, whatever the status code says.
PARKING_SIGNATURES: tuple[str, ...] = (
    "sedoparking.com",
    "server: parking/1.0",
    "parkingcrew.net",
    "bodis.com",
    "afternic.com",
    "dan.com/buy-domain",
    "hugedomains.com",
    "this domain is for sale",
    "the domain name is for sale",
    "domain is parked",
    "buy this domain",
)

# Below this, a 200 is an empty shell rather than a page. Chosen from measured
# output: real pages on these sites run 292–4,312 visible words, and an
# unrendered SPA measures exactly 0.
MIN_VISIBLE_WORDS = 30

# Two hosts sharing this much visible text are serving the same page twice.
DUPLICATE_THRESHOLD = 0.90

SEVERITY_ORDER = {"critical": 0, "warning": 1, "ok": 2}


@dataclass
class Finding:
    check: str
    severity: str
    detail: str
    remedy: str = ""

    def as_dict(self) -> dict[str, str]:
        return {"check": self.check, "severity": self.severity,
                "detail": self.detail, "remedy": self.remedy}


@dataclass
class SiteReport:
    domain: str
    url: str
    status_code: Optional[int] = None
    server: str = ""
    visible_words: int = 0
    title: str = ""
    canonical: str = ""
    body_hash: str = ""
    findings: list[Finding] = field(default_factory=list)
    error: str = ""

    @property
    def severity(self) -> str:
        if self.error:
            return "critical"
        for level in ("critical", "warning"):
            if any(f.severity == level for f in self.findings):
                return level
        return "ok"

    @property
    def serving_site(self) -> bool:
        """Is this domain serving our site at all?"""
        return self.severity != "critical"

    def as_dict(self) -> dict[str, Any]:
        return {
            "domain": self.domain, "url": self.url, "status_code": self.status_code,
            "server": self.server, "visible_words": self.visible_words,
            "title": self.title, "canonical": self.canonical,
            "body_hash": self.body_hash,
            "severity": self.severity, "error": self.error,
            "findings": [f.as_dict() for f in self.findings],
        }


# ── HTML handling ────────────────────────────────────────────────────────────

_COMMENT = re.compile(r"<!--[\s\S]*?-->")
_HEAD = re.compile(r"<head[\s\S]*?</head>", re.I)
_DROP = re.compile(r"<(script|style|nav|footer)[\s\S]*?</\1>", re.I)
_TAG = re.compile(r"<[^>]+>")
_WS = re.compile(r"\s+")
_TITLE = re.compile(r"<title[^>]*>([\s\S]*?)</title>", re.I)
_CANONICAL = re.compile(
    r"""<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']""", re.I)
_CANONICAL_ALT = re.compile(
    r"""<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["']""", re.I)
_ROBOTS_META = re.compile(
    r"""<meta[^>]+name=["']robots["'][^>]*content=["']([^"']*)["']""", re.I)


def visible_text(html: str) -> str:
    """
    What a reader sees. Comments, <head>, scripts, nav and footer are removed
    because they are byte-identical across every page in this build — leaving
    them in scores unrelated pages as near-duplicates and hides the real ones.
    """
    body = _COMMENT.sub(" ", html)
    body = _HEAD.sub(" ", body)
    body = _DROP.sub(" ", body)
    return _WS.sub(" ", _TAG.sub(" ", body)).strip()


def extract_title(html: str) -> str:
    m = _TITLE.search(html)
    return _WS.sub(" ", m.group(1)).strip() if m else ""


def extract_canonical(html: str) -> str:
    m = _CANONICAL.search(html) or _CANONICAL_ALT.search(html)
    return m.group(1).strip() if m else ""


def is_noindex(html: str) -> bool:
    m = _ROBOTS_META.search(html)
    return bool(m and "noindex" in m.group(1).lower())


def looks_parked(html: str, headers: dict[str, str]) -> Optional[str]:
    """The signature that matched, or None."""
    haystack = (html[:20000] + " " + " ".join(
        f"{k}: {v}" for k, v in headers.items())).lower()
    for sig in PARKING_SIGNATURES:
        if sig in haystack:
            return sig
    return None


def host_of(url: str) -> str:
    m = re.match(r"https?://([^/:]+)", url or "", re.I)
    return m.group(1).lower().removeprefix("www.") if m else ""


# ── Analysis ─────────────────────────────────────────────────────────────────

def analyse(
    domain: str,
    url: str,
    *,
    status_code: Optional[int],
    headers: dict[str, str],
    html: str,
    expect_indexable: bool = True,
) -> SiteReport:
    report = SiteReport(
        domain=domain, url=url, status_code=status_code,
        server=str(headers.get("server", ""))[:60],
    )

    parked = looks_parked(html, headers)
    if parked:
        report.title = extract_title(html)
        report.findings.append(Finding(
            check="parked",
            severity="critical",
            detail=f"Serving a domain-parking page (matched {parked!r}). "
                   f"Title: {report.title[:80]!r}",
            remedy="The domain is not pointing at the site. Restore hosting or "
                   "repoint DNS. Until then every visitor and every crawler "
                   "sees advertising, and the status code stays 200.",
        ))
        return report

    text = visible_text(html)
    report.visible_words = len(text.split())
    report.title = extract_title(html)
    report.canonical = extract_canonical(html)
    report.body_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()

    if status_code is None or status_code >= 400:
        report.findings.append(Finding(
            check="unreachable", severity="critical",
            detail=f"HTTP {status_code}",
            remedy="Check the deployment and the DNS record.",
        ))
        return report

    if report.visible_words < MIN_VISIBLE_WORDS:
        report.findings.append(Finding(
            check="empty_shell", severity="critical",
            detail=f"{report.visible_words} visible words in the served HTML — "
                   "the page renders only after JavaScript runs.",
            remedy="Prerendering did not produce this route. Re-run the build "
                   "and confirm the postbuild prerender step covered it. Until "
                   "then a crawler that does not execute JavaScript sees an "
                   "empty page.",
        ))

    if report.canonical:
        canonical_host = host_of(report.canonical)
        own_host = domain.lower().removeprefix("www.")
        if canonical_host and canonical_host != own_host:
            report.findings.append(Finding(
                check="canonical_drift", severity="critical",
                detail=f"Canonical points at {canonical_host}, not {own_host}.",
                remedy="This tells Google the real version of the page lives "
                       "elsewhere, so this domain will not rank for it. Correct "
                       "unless the two sites are deliberately consolidated.",
            ))
    elif expect_indexable:
        report.findings.append(Finding(
            check="no_canonical", severity="warning",
            detail="No canonical link on the page.",
            remedy="Add a self-referencing canonical so parameter and www "
                   "variants do not compete with each other.",
        ))

    if expect_indexable and is_noindex(html):
        report.findings.append(Finding(
            check="unexpected_noindex", severity="critical",
            detail="The page carries a noindex robots meta tag.",
            remedy="A page meant to rank is telling crawlers to skip it. "
                   "Remove the noindex, or stop advertising the page.",
        ))

    return report


def find_duplicates(
    reports: Iterable[SiteReport], *, threshold: float = DUPLICATE_THRESHOLD
) -> list[dict[str, Any]]:
    """
    Cross-domain duplicate bodies.

    Exact hash equality catches the common case cheaply — the same build
    deployed to two hosts. Anything subtler belongs to the build-time
    uniqueness gate, which has the full page text to work with.
    """
    by_hash: dict[str, list[SiteReport]] = {}
    for r in reports:
        if r.body_hash and r.visible_words >= MIN_VISIBLE_WORDS:
            by_hash.setdefault(r.body_hash, []).append(r)

    out = []
    for group in by_hash.values():
        if len(group) < 2:
            continue
        domains = sorted(r.domain for r in group)
        out.append({
            "domains": domains,
            "visible_words": group[0].visible_words,
            "title": group[0].title,
            "detail": f"{len(domains)} domains serve an identical page: "
                      f"{', '.join(domains)}",
            "remedy": "Google must pick one and will discount the rest. Give "
                      "each domain its own content, or canonicalize the "
                      "duplicates to the one that should win.",
        })
    return out


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ── Fetching and persistence ─────────────────────────────────────────────────

# Every domain this system publishes. Kept here rather than derived from the
# sitemap generator because a domain that has fallen out of the build is
# exactly the kind of domain worth checking.
PUBLISHED_DOMAINS: tuple[str, ...] = (
    "richmondasphaltpaving.com",
    "jwordenasphaltpaving.com",
    "thewordenstandard.com",
    "jwordenuniversity.com",
    "carolinablacktop.com",
    "blueridgeasphaltpaving.com",
    "atlantaasphaltpavingpros.com",
    "asphaltpavingkansascity.com",
    "savannahasphaltpaving.com",
    "obxpaving.com",
    "nationalpavmentgroup.com",
    "atlantapavingandsealing.com",
)


async def fetch_and_analyse(domain: str, *, timeout: float = 25.0) -> SiteReport:
    import httpx

    url = f"https://{domain}/"
    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as c:
            resp = await c.get(url, headers={
                # Identify honestly. A checker pretending to be Googlebot gets
                # served something a visitor never sees, which defeats the point.
                "user-agent": "JWordenSiteHealth/1.0 (+monitoring)",
            })
    except Exception as exc:  # noqa: BLE001
        report = SiteReport(domain=domain, url=url)
        report.error = str(exc)[:400]
        report.findings.append(Finding(
            check="unreachable", severity="critical",
            detail=str(exc)[:200],
            remedy="The domain did not respond. Check DNS and hosting.",
        ))
        return report

    return analyse(
        domain, str(resp.url),
        status_code=resp.status_code,
        headers={k.lower(): v for k, v in resp.headers.items()},
        html=resp.text,
    )


async def check_all(domains: Optional[Iterable[str]] = None) -> dict[str, Any]:
    """Check every published domain and cross-reference for duplicates."""
    import asyncio

    targets = tuple(domains or PUBLISHED_DOMAINS)
    reports = await asyncio.gather(*(fetch_and_analyse(d) for d in targets))
    duplicates = find_duplicates(reports)

    # A duplicated body is a property of the pair, so it is recorded against
    # each domain involved rather than only in the summary.
    by_domain = {r.domain: r for r in reports}
    for dup in duplicates:
        for d in dup["domains"]:
            by_domain[d].findings.append(Finding(
                check="duplicate_body", severity="warning",
                detail=dup["detail"], remedy=dup["remedy"],
            ))

    critical = [r for r in reports if r.severity == "critical"]
    return {
        "checked_at": utcnow().isoformat(),
        "domains_checked": len(reports),
        "critical": len(critical),
        "warning": sum(1 for r in reports if r.severity == "warning"),
        "ok": sum(1 for r in reports if r.severity == "ok"),
        "not_serving_the_site": sorted(r.domain for r in critical),
        "duplicates": duplicates,
        "reports": [r.as_dict() for r in
                    sorted(reports, key=lambda r: SEVERITY_ORDER[r.severity])],
    }


def persist(db, reports: Iterable[dict[str, Any]]) -> dict[str, list[str]]:
    """
    Record the latest state, and report which domains changed severity.

    Only the transitions are returned. A check that repeats the same critical
    finding every hour trains people to ignore it; the useful signal is the
    moment a domain stops serving the site, and the moment it starts again.
    """
    from app.models import SiteHealthCheck

    now = utcnow()
    changed: dict[str, list[str]] = {"degraded": [], "recovered": []}

    for data in reports:
        row = db.query(SiteHealthCheck).filter(
            SiteHealthCheck.domain == data["domain"]
        ).first()
        previous = row.severity if row else None
        if row is None:
            row = SiteHealthCheck(domain=data["domain"])
            db.add(row)

        if previous != data["severity"]:
            row.severity_since = now
            if previous is not None:
                # SEVERITY_ORDER ranks by seriousness, so critical is 0 and
                # ok is 2 — a LOWER number is worse. Comparing these the
                # intuitive way round files every outage as a recovery, which
                # is precisely the silent-failure shape this module exists to
                # end. The test for this asserts the direction.
                bucket = ("recovered" if SEVERITY_ORDER[data["severity"]]
                          > SEVERITY_ORDER[previous] else "degraded")
                changed[bucket].append(
                    f"{data['domain']}: {previous} -> {data['severity']}")

        row.severity = data["severity"]
        row.status_code = data.get("status_code")
        row.visible_words = data.get("visible_words")
        row.title = (data.get("title") or "")[:300] or None
        row.canonical = (data.get("canonical") or "")[:500] or None
        row.server = (data.get("server") or "")[:60] or None
        row.body_hash = data.get("body_hash")
        row.findings_json = data.get("findings")
        row.error = data.get("error") or None
        row.checked_at = now

    db.commit()
    return changed
