"""
anomaly_detector.py — Continuous anomaly detection for JWordenAI business metrics.

Monitors rolling-window statistics for hidden correlations and irregularities,
identifying business shifts faster than human review.

Metrics monitored:
  lead_volume_24h    — today's leads vs 7-day rolling average
  hot_lead_rate      — HOT% vs expected 20-40% band
  cool_lead_surge    — sudden spike in COOL leads (bad ad targeting signal)
  zero_lead_gap      — no leads in a 6-hour business-hours window

Algorithm:
  Z-score on 7-day daily rolling window.
  |z| ≥ 3.0 → CRITICAL  |z| ≥ 2.5 → HIGH  |z| ≥ 1.8 → MEDIUM  |z| ≥ 1.2 → LOW

No heavy ML dependencies — pure Python + SQLAlchemy.
"""

from __future__ import annotations

import logging
import math
from datetime import datetime, timedelta, timezone
from typing import NamedTuple

from sqlalchemy import func
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

Severity = str  # "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "NORMAL"


class AnomalyResult(NamedTuple):
    metric_name:    str
    current_value:  float
    baseline_value: float
    z_score:        float
    severity:       Severity
    message:        str


# ── Statistics helpers ────────────────────────────────────────────────────────

def _stdev(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0
    mean = sum(values) / len(values)
    variance = sum((v - mean) ** 2 for v in values) / len(values)
    return math.sqrt(variance)


def _zscore(current: float, baseline: float, std: float) -> float:
    return (current - baseline) / std if std > 0 else 0.0


def _severity(z: float) -> Severity:
    az = abs(z)
    if az >= 3.0:
        return "CRITICAL"
    if az >= 2.5:
        return "HIGH"
    if az >= 1.8:
        return "MEDIUM"
    if az >= 1.2:
        return "LOW"
    return "NORMAL"


# ── Individual checks ─────────────────────────────────────────────────────────

def check_lead_volume(db: Session) -> AnomalyResult | None:
    """Detect abnormal daily lead volume vs 7-day rolling average."""
    from ..models import Lead  # noqa: PLC0415

    today = datetime.now(timezone.utc).date()
    today_count = float(
        db.query(func.count(Lead.id))
        .filter(func.date(Lead.created_at) == today, Lead.tenant_id == "default")
        .scalar() or 0
    )

    history = [
        float(
            db.query(func.count(Lead.id))
            .filter(
                func.date(Lead.created_at) == (today - timedelta(days=d)),
                Lead.tenant_id == "default",
            )
            .scalar() or 0
        )
        for d in range(1, 8)
    ]

    if not history:
        return None

    baseline = sum(history) / len(history)
    std = _stdev(history)
    z = _zscore(today_count, baseline, std)
    sev = _severity(z)

    if sev == "NORMAL":
        return None

    direction = "spike" if z > 0 else "drop"
    advice = (
        "Possible downtime or ad campaign pause — check site uptime and campaign status immediately."
        if z < -2.0
        else "Traffic surge detected — verify lead quality before scaling budget further."
    )
    return AnomalyResult(
        metric_name="lead_volume_24h",
        current_value=today_count,
        baseline_value=round(baseline, 2),
        z_score=round(z, 2),
        severity=sev,
        message=f"Lead volume {direction}: {int(today_count)} today vs {baseline:.1f} daily average (z={z:+.2f}). {advice}",
    )


def check_hot_lead_rate(db: Session) -> AnomalyResult | None:
    """Alert when HOT lead % falls outside the expected 20-40% band."""
    from ..models import Lead  # noqa: PLC0415

    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    total = db.query(func.count(Lead.id)).filter(
        Lead.created_at >= cutoff, Lead.tenant_id == "default"
    ).scalar() or 0

    if total < 5:
        return None

    hot = db.query(func.count(Lead.id)).filter(
        Lead.created_at >= cutoff,
        Lead.score_label == "HOT",
        Lead.tenant_id == "default",
    ).scalar() or 0

    rate = hot / total
    expected = 0.28   # midpoint of 20-40% historical band
    std = 0.08

    z = _zscore(rate, expected, std)
    sev = _severity(z)
    if sev == "NORMAL":
        return None

    if rate < 0.15:
        msg = (
            f"HOT lead rate critically low ({rate:.0%} of last-7-day leads). "
            "AI Max may be driving high volume but low-intent traffic — "
            "review URL expansion targets and tighten exclusion list."
        )
        sev = "HIGH"
    elif rate > 0.55:
        msg = (
            f"HOT lead rate unusually high ({rate:.0%}). "
            "Validate scoring model thresholds — possible miscalibration."
        )
    else:
        msg = f"HOT lead rate ({rate:.0%}) outside normal 20-40% band (z={z:+.2f})."

    return AnomalyResult(
        metric_name="hot_lead_rate",
        current_value=round(rate, 4),
        baseline_value=expected,
        z_score=round(z, 2),
        severity=sev,
        message=msg,
    )


def check_cool_surge(db: Session) -> AnomalyResult | None:
    """Detect sudden spike in COOL leads — signals bad AI Max ad targeting."""
    from ..models import Lead  # noqa: PLC0415

    today = datetime.now(timezone.utc).date()

    def _cool_rate_for_day(d) -> float:
        t = db.query(func.count(Lead.id)).filter(func.date(Lead.created_at) == d).scalar() or 0
        if t == 0:
            return 0.0
        c = db.query(func.count(Lead.id)).filter(
            func.date(Lead.created_at) == d, Lead.score_label == "COOL"
        ).scalar() or 0
        return c / t

    today_cool = _cool_rate_for_day(today)
    prior_rates = [_cool_rate_for_day(today - timedelta(days=i)) for i in range(2, 8)]
    baseline = sum(prior_rates) / len(prior_rates) if prior_rates else 0.30
    std = _stdev(prior_rates) or 0.10

    z = _zscore(today_cool, baseline, std)
    sev = _severity(z)

    if sev == "NORMAL" or today_cool < 0.40:
        return None

    return AnomalyResult(
        metric_name="cool_lead_surge",
        current_value=round(today_cool, 4),
        baseline_value=round(baseline, 4),
        z_score=round(z, 2),
        severity=sev,
        message=(
            f"COOL lead surge: {today_cool:.0%} of today's leads are low-intent "
            f"(6-day baseline {baseline:.0%}, z={z:+.2f}). "
            "Review AI Max URL expansion — consider tightening exclusion list or "
            "switching broad-match ad groups to phrase match."
        ),
    )


def check_zero_lead_gap(db: Session) -> AnomalyResult | None:
    """Alert when no leads arrive in a 6-hour window during business hours."""
    from ..models import Lead  # noqa: PLC0415

    now = datetime.now(timezone.utc)
    # Only trigger Mon-Fri 09:00-22:00 UTC (approximately 05:00-18:00 ET)
    if now.weekday() >= 5 or not (9 <= now.hour <= 22):
        return None

    cutoff = now - timedelta(hours=6)
    recent = db.query(func.count(Lead.id)).filter(
        Lead.created_at >= cutoff, Lead.tenant_id == "default"
    ).scalar() or 0

    if recent > 0:
        return None

    return AnomalyResult(
        metric_name="zero_lead_gap",
        current_value=0.0,
        baseline_value=1.0,
        z_score=-3.5,
        severity="CRITICAL",
        message=(
            "Zero leads in the last 6 hours during business hours. "
            "Possible causes: site is down, quote form endpoint error, "
            "all campaigns paused, or Netlify function failure. "
            "Check site uptime and form endpoint immediately."
        ),
    )


# ── Orchestrator ──────────────────────────────────────────────────────────────

def run_all_checks(db: Session) -> list[AnomalyResult]:
    """Run all anomaly checks. Returns list of detected anomalies (excludes NORMAL)."""
    results: list[AnomalyResult] = []
    for check in (check_lead_volume, check_hot_lead_rate, check_cool_surge, check_zero_lead_gap):
        try:
            result = check(db)
            if result is not None:
                results.append(result)
        except Exception as exc:  # noqa: BLE001
            logger.error("Anomaly check %s failed: %s", check.__name__, exc)
    return results


def persist_anomalies(db: Session, results: list[AnomalyResult]) -> int:
    """
    Persist new anomaly results to anomaly_alerts table.
    Deduplicates: skips metrics already alerted within the last 2 hours.
    Returns count of new rows written.
    """
    if not results:
        return 0

    from ..models import AnomalyAlert  # noqa: PLC0415

    now = datetime.now(timezone.utc)
    recent_names: set[str] = {
        row.metric_name
        for row in db.query(AnomalyAlert.metric_name).filter(
            AnomalyAlert.detected_at >= now - timedelta(hours=2),
            AnomalyAlert.resolved_at == None,  # noqa: E711
        ).all()
    }

    written = 0
    for r in results:
        if r.metric_name in recent_names:
            continue
        db.add(AnomalyAlert(
            metric_name=r.metric_name,
            current_value=r.current_value,
            baseline_value=r.baseline_value,
            z_score=r.z_score,
            severity=r.severity,
            message=r.message,
            detected_at=now,
        ))
        written += 1

    if written:
        db.commit()
    return written
