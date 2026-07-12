"""
anomaly_detector.py — Z-score business metrics monitoring.

Checks 4 metrics on a 7-day rolling window:
  1. lead_velocity   — daily new leads vs 7d baseline
  2. proposal_rate   — fraction of leads with proposals vs 7d average
  3. conversion_rate — closed-won / total-received vs 7d average
  4. revenue_pace    — estimated_value of won leads vs 7d average

Individual check failures are caught and logged so one bad query never
blocks the rest. Anomalies persist to AnomalyAlert with a 2-hour dedup
window (no duplicate per metric_name within 2 hours).
"""
from __future__ import annotations

import logging
import statistics
from datetime import datetime, timedelta, timezone
from typing import NamedTuple

from sqlalchemy.orm import Session

from ..models import AnomalyAlert, Lead

logger = logging.getLogger(__name__)

WINDOW_DAYS = 7
Z_CRITICAL = 2.5
Z_HIGH = 2.0
Z_MEDIUM = 1.5
DEDUP_HOURS = 2
TENANT = "default"


class AnomalyResult(NamedTuple):
    metric_name: str
    current_value: float
    baseline_value: float
    z_score: float
    severity: str       # CRITICAL | HIGH | MEDIUM | INFO
    message: str
    is_anomaly: bool


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _severity(z: float) -> str:
    az = abs(z)
    if az >= Z_CRITICAL:
        return "CRITICAL"
    if az >= Z_HIGH:
        return "HIGH"
    if az >= Z_MEDIUM:
        return "MEDIUM"
    return "INFO"


def _z_score(sample: list[float], current: float) -> float:
    if len(sample) < 2:
        return 0.0
    try:
        mean = statistics.mean(sample)
        stdev = statistics.stdev(sample)
        if stdev < 1e-9:
            return 0.0
        return (current - mean) / stdev
    except Exception:
        return 0.0


def _check_lead_velocity(db: Session) -> AnomalyResult:
    now = _utcnow()
    counts: list[float] = []
    for days_back in range(1, WINDOW_DAYS + 1):
        day_start = now - timedelta(days=days_back)
        day_end = day_start + timedelta(days=1)
        count = (
            db.query(Lead)
            .filter(Lead.tenant_id == TENANT)
            .filter(Lead.created_at >= day_start, Lead.created_at < day_end)
            .count()
        )
        counts.append(float(count))

    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_count = float(
        db.query(Lead)
        .filter(Lead.tenant_id == TENANT)
        .filter(Lead.created_at >= today_start)
        .count()
    )
    baseline = statistics.mean(counts) if counts else 0.0
    z = _z_score(counts, today_count)
    return AnomalyResult(
        metric_name="lead_velocity",
        current_value=today_count,
        baseline_value=round(baseline, 2),
        z_score=round(z, 3),
        severity=_severity(z),
        message=f"Today: {today_count:.0f} leads (baseline {baseline:.1f}/day, z={z:.2f})",
        is_anomaly=abs(z) >= Z_MEDIUM,
    )


def _check_proposal_rate(db: Session) -> AnomalyResult:
    now = _utcnow()
    daily_rates: list[float] = []
    for days_back in range(1, WINDOW_DAYS + 1):
        day_start = now - timedelta(days=days_back)
        day_end = day_start + timedelta(days=1)
        base = db.query(Lead).filter(Lead.tenant_id == TENANT).filter(
            Lead.created_at >= day_start, Lead.created_at < day_end
        )
        total = base.count()
        with_prop = base.filter(Lead.proposal_sent_at.isnot(None)).count()
        daily_rates.append(float(with_prop) / max(float(total), 1))

    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_base = db.query(Lead).filter(Lead.tenant_id == TENANT).filter(Lead.created_at >= today_start)
    total_today = today_base.count()
    prop_today = today_base.filter(Lead.proposal_sent_at.isnot(None)).count()
    current_rate = float(prop_today) / max(float(total_today), 1)

    baseline = statistics.mean(daily_rates) if daily_rates else 0.0
    z = _z_score(daily_rates, current_rate)
    return AnomalyResult(
        metric_name="proposal_rate",
        current_value=round(current_rate, 3),
        baseline_value=round(baseline, 3),
        z_score=round(z, 3),
        severity=_severity(z),
        message=f"Proposal rate today: {current_rate:.1%} (baseline {baseline:.1%}, z={z:.2f})",
        is_anomaly=abs(z) >= Z_MEDIUM,
    )


def _check_conversion_rate(db: Session) -> AnomalyResult:
    now = _utcnow()
    daily_rates: list[float] = []
    for days_back in range(1, WINDOW_DAYS + 1):
        day_start = now - timedelta(days=days_back)
        day_end = day_start + timedelta(days=1)
        base = db.query(Lead).filter(Lead.tenant_id == TENANT).filter(
            Lead.created_at >= day_start, Lead.created_at < day_end
        )
        total = base.count()
        won = base.filter(Lead.status == "won").count()
        daily_rates.append(float(won) / max(float(total), 1))

    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_base = db.query(Lead).filter(Lead.tenant_id == TENANT).filter(Lead.created_at >= today_start)
    total_today = today_base.count()
    won_today = today_base.filter(Lead.status == "won").count()
    current_rate = float(won_today) / max(float(total_today), 1)

    baseline = statistics.mean(daily_rates) if daily_rates else 0.0
    z = _z_score(daily_rates, current_rate)
    return AnomalyResult(
        metric_name="conversion_rate",
        current_value=round(current_rate, 3),
        baseline_value=round(baseline, 3),
        z_score=round(z, 3),
        severity=_severity(z),
        message=f"Conversion today: {current_rate:.1%} (baseline {baseline:.1%}, z={z:.2f})",
        is_anomaly=abs(z) >= Z_MEDIUM,
    )


def _check_revenue_pace(db: Session) -> AnomalyResult:
    now = _utcnow()
    daily_rev: list[float] = []
    for days_back in range(1, WINDOW_DAYS + 1):
        day_start = now - timedelta(days=days_back)
        day_end = day_start + timedelta(days=1)
        rows = (
            db.query(Lead.estimated_value)
            .filter(Lead.tenant_id == TENANT)
            .filter(Lead.created_at >= day_start, Lead.created_at < day_end)
            .filter(Lead.status == "won")
            .all()
        )
        daily_rev.append(sum(r[0] or 0.0 for r in rows))

    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    rows_today = (
        db.query(Lead.estimated_value)
        .filter(Lead.tenant_id == TENANT)
        .filter(Lead.created_at >= today_start)
        .filter(Lead.status == "won")
        .all()
    )
    today_rev = sum(r[0] or 0.0 for r in rows_today)

    baseline = statistics.mean(daily_rev) if daily_rev else 0.0
    z = _z_score(daily_rev, today_rev)
    return AnomalyResult(
        metric_name="revenue_pace",
        current_value=round(today_rev, 2),
        baseline_value=round(baseline, 2),
        z_score=round(z, 3),
        severity=_severity(z),
        message=f"Won revenue today: ${today_rev:,.0f} (baseline ${baseline:,.0f}/day, z={z:.2f})",
        is_anomaly=abs(z) >= Z_MEDIUM,
    )


_CHECKS = (
    _check_lead_velocity,
    _check_proposal_rate,
    _check_conversion_rate,
    _check_revenue_pace,
)


def run_all_checks(db: Session) -> list[AnomalyResult]:
    """Run all 4 anomaly checks. Individual failures are logged and skipped."""
    results: list[AnomalyResult] = []
    for check in _CHECKS:
        try:
            results.append(check(db))
        except Exception as exc:
            logger.error("Anomaly check %s failed: %s", check.__name__, exc)
    return results


def persist_anomalies(db: Session, results: list[AnomalyResult]) -> int:
    """Persist anomalous results with 2-hour dedup. Returns count of new rows inserted."""
    saved = 0
    cutoff = _utcnow() - timedelta(hours=DEDUP_HOURS)
    for r in results:
        if not r.is_anomaly:
            continue
        exists = (
            db.query(AnomalyAlert)
            .filter(AnomalyAlert.metric_name == r.metric_name)
            .filter(AnomalyAlert.detected_at >= cutoff)
            .first()
        )
        if exists:
            continue
        alert = AnomalyAlert(
            metric_name=r.metric_name,
            current_value=r.current_value,
            baseline_value=r.baseline_value,
            z_score=r.z_score,
            severity=r.severity,
            message=r.message,
        )
        db.add(alert)
        saved += 1
    if saved:
        db.commit()
    return saved
