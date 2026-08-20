"""
social_claims.py — Deterministic claim guardrail for outbound social content.

A paving contractor's social post is advertising, and advertising carries
liability that a blog post does not. "Licensed and insured", "$5M coverage",
"4.9 stars", "#1 in Virginia", "lifetime warranty" are all factual assertions
to a regulator and to a plaintiff's attorney. Some are true. The problem is
that nothing in the pipeline could tell the difference, so an AI-drafted post
could assert any of them and go out over the company's name.

This module is the check. Two rules:

  1. Flagged spans must resolve to an attested company claim, or the post
     cannot be published. Not "should" — publish returns 409.
  2. The check is deterministic — lexicon and regex, not a model call.
     A model asked "is this claim supported?" can answer yes for the same
     reason it can invent the claim in the first place. A guardrail that
     shares a failure mode with the thing it guards is decoration.

Attestation lives in `company_claims`: the owner states the fact once, with a
source note and an expiry. Insurance certificates and licenses expire, so an
attestation expires with them — a post claiming coverage that lapsed last
month stops being publishable on its own, without anyone remembering to go
look. That is the whole point of dating them.

Severities:
  BLOCK — factual assertion about the business. Needs attestation.
  WARN  — puffery or a soft claim. Surfaced, does not stop publication.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date
from typing import Iterable, Optional

BLOCK = "block"
WARN = "warn"


@dataclass(frozen=True)
class ClaimRule:
    key: str            # the company_claims.key that satisfies this
    severity: str
    pattern: re.Pattern
    why: str            # shown to the operator, so the block is actionable


def _p(expr: str) -> re.Pattern:
    return re.compile(expr, re.IGNORECASE)


# ── Rules ────────────────────────────────────────────────────────────────────
# Ordered most specific first; every match is reported, so order is only for
# readability. Each BLOCK rule names the attestation key that clears it.

RULES: tuple[ClaimRule, ...] = (
    ClaimRule(
        key="insurance_liability",
        severity=BLOCK,
        pattern=_p(r"\$\s?\d+(?:\.\d+)?\s?(?:m|mm|million)\b[^.]{0,40}"
                   r"(?:liability|insured|insurance|coverage|policy)"
                   r"|(?:liability|insured|insurance|coverage|policy)"
                   r"[^.]{0,40}\$\s?\d+(?:\.\d+)?\s?(?:m|mm|million)\b"),
        why="States a coverage amount. Must match the certificate of insurance "
            "on file, and that certificate must not have expired.",
    ),
    ClaimRule(
        key="insured",
        severity=BLOCK,
        pattern=_p(r"\b(?:fully\s+)?insured\b|\bbonded\b"),
        why="Asserts active coverage. Attest with the policy and its expiry.",
    ),
    ClaimRule(
        key="licensed",
        severity=BLOCK,
        pattern=_p(r"\blicen[sc]ed\b|\bclass\s+[abc]\s+contractor\b"
                   r"|\b(?:VA|DPOR)\s?#?\s?\d{6,}\b"),
        why="Asserts a contractor licence. Attest with the licence number and "
            "its renewal date.",
    ),
    ClaimRule(
        key="certification",
        severity=BLOCK,
        pattern=_p(r"\bcertified\b|\baccredited\b|\bapproved contractor\b"
                   r"|\bfactory[-\s]authoriz(?:ed|er)\b"),
        why="Asserts a certification held. Name the certifying body in the "
            "attestation.",
    ),
    ClaimRule(
        key="rating",
        severity=BLOCK,
        pattern=_p(r"\b\d(?:\.\d)?\s?(?:⭐|star|stars)\b"
                   r"|\b(?:rated|rating)\s+\d(?:\.\d)?\b"
                   r"|\b[A-F][+-]?\s+rated\b"),
        why="Quotes a review score. Must match what the platform actually "
            "shows today, not a screenshot from last year.",
    ),
    ClaimRule(
        key="rank",
        severity=BLOCK,
        pattern=_p(r"#\s?1\b|\bnumber one\b|\btop[-\s]rated\b|\bhighest[-\s]rated\b"
                   r"|\bbest\s+(?:paving|contractor|asphalt|company|in\s+\w+)"
                   r"|\baward[-\s]winning\b|\bvoted\b"),
        why="Asserts a ranking or award. Needs the award, the year and who "
            "gave it — or cut the line.",
    ),
    ClaimRule(
        key="warranty",
        severity=BLOCK,
        pattern=_p(r"\b(?:lifetime|\d+[-\s]year)\s+(?:warrant(?:y|ies)|guarantee)\b"
                   r"|\bguarantee[d]?\b"),
        why="A published warranty term is enforceable. Attest with the actual "
            "written terms.",
    ),
    ClaimRule(
        key="years_in_business",
        severity=BLOCK,
        pattern=_p(r"\bsince\s+(?:18|19|20)\d{2}\b"
                   r"|\b\d+\+?\s+years\b[^.]{0,25}\b(?:experience|business|paving)\b"
                   r"|\b\d+(?:st|nd|rd|th)[-\s]generation\b"),
        why="A founding date or tenure claim. Attest once; it does not change.",
    ),
    ClaimRule(
        key="volume",
        severity=BLOCK,
        pattern=_p(r"\b\d{2,},?\d*\+?\s+(?:driveways|lots|projects|jobs|customers|"
                   r"clients|tons|miles|square feet|sq\.?\s?ft)\b"),
        why="A volume figure. Must be countable from records, not estimated "
            "upward for a caption.",
    ),
    ClaimRule(
        key="price_claim",
        severity=BLOCK,
        pattern=_p(r"\b\d+\s?%\s+(?:off|savings?|cheaper|less|lower)\b"
                   r"|\bsave\s+(?:up\s+to\s+)?\$?\d+"
                   r"|\blowest\s+price\b|\bbeat\s+any\s+(?:price|quote|bid)\b"),
        why="A price or savings claim. Needs the baseline it is measured "
            "against, or it is unsubstantiated.",
    ),
    # Puffery — legally tolerated, still worth showing the operator.
    ClaimRule(
        key="",
        severity=WARN,
        pattern=_p(r"\bunbeatable\b|\bworld[-\s]class\b|\bunmatched\b"
                   r"|\bsecond to none\b|\bthe only\b"),
        why="Puffery. Legal, but it reads as filler and invites a competitor "
            "to make a sharper claim.",
    ),
)


@dataclass
class Finding:
    severity: str
    key: str
    text: str            # the literal matched span
    start: int
    end: int
    why: str
    satisfied_by: Optional[str] = None   # company_claims.key that cleared it


@dataclass
class ClaimReport:
    findings: list[Finding] = field(default_factory=list)

    @property
    def blocking(self) -> list[Finding]:
        return [f for f in self.findings
                if f.severity == BLOCK and not f.satisfied_by]

    @property
    def publishable(self) -> bool:
        return not self.blocking

    def as_dict(self) -> dict:
        return {
            "publishable": self.publishable,
            "blocking_count": len(self.blocking),
            "findings": [
                {
                    "severity":     f.severity,
                    "claim_key":    f.key or None,
                    "text":         f.text,
                    "span":         [f.start, f.end],
                    "why":          f.why,
                    "satisfied_by": f.satisfied_by,
                }
                for f in self.findings
            ],
        }


def scan(body: str) -> ClaimReport:
    """Find every claim span in `body`. No attestation lookup — pure detection."""
    report = ClaimReport()
    for rule in RULES:
        for m in rule.pattern.finditer(body or ""):
            report.findings.append(
                Finding(
                    severity=rule.severity,
                    key=rule.key,
                    text=m.group(0).strip(),
                    start=m.start(),
                    end=m.end(),
                    why=rule.why,
                )
            )
    report.findings.sort(key=lambda f: f.start)
    return report


def resolve(report: ClaimReport, attested: Iterable, *, on: Optional[date] = None) -> ClaimReport:
    """
    Clear findings that a live attestation covers.

    `attested` is any iterable of objects with .key, .effective_from and
    .expires_on. An attestation that has expired, or has not taken effect,
    does not clear anything — that is the mechanism by which a lapsed
    insurance certificate quietly makes its own posts unpublishable.
    """
    today = on or date.today()
    live: set[str] = set()
    for a in attested:
        starts = getattr(a, "effective_from", None)
        ends = getattr(a, "expires_on", None)
        if starts and starts > today:
            continue
        if ends and ends < today:
            continue
        key = getattr(a, "key", None)
        if key:
            live.add(key)

    for f in report.findings:
        if f.severity == BLOCK and f.key in live:
            f.satisfied_by = f.key
    return report
