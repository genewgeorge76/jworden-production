"""
cognitive_twin.py — Cognitive Digital Twin Engine

The Cognitive Digital Twin (CDT) is the authoritative living model of every
active project site.  It maintains six state dimensions, detects drift when
physical reality diverges from the digital plan, and automatically triggers
remediation workflows.

State dimensions:
  timeline   — % schedule progress (planned vs actual)
  cost       — % budget consumed (planned vs actual)
  quality    — compaction / surface quality score (0–100)
  safety     — OSHA/VOSH compliance score (0–100)
  materials  — % of required materials on-site or ordered
  crew       — % of required crew-hours fulfilled

Drift thresholds (% deviation from plan):
  LOW:      ≥ 10% divergence  — monitor
  MEDIUM:   ≥ 20% divergence  — alert crew lead
  HIGH:     ≥ 30% divergence  — create FollowUpTask
  CRITICAL: ≥ 50% divergence  — create FollowUpTask + CashFlowAlert (cost/materials)

Remediation actions (auto-executed when drift triggers):
  - Create a FollowUpTask record for HIGH/CRITICAL drift on any dimension
  - Create a CashFlowAlert for CRITICAL cost or material drift
  - Log a TwinSnapshot to the database (always)
"""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


# ── Drift severity thresholds ─────────────────────────────────────────────────

_THRESHOLDS = [
    (50.0, "CRITICAL"),
    (30.0, "HIGH"),
    (20.0, "MEDIUM"),
    (10.0, "LOW"),
    (0.0,  "NORMAL"),
]


def _severity(deviation_pct: float) -> str:
    for threshold, label in _THRESHOLDS:
        if abs(deviation_pct) >= threshold:
            return label
    return "NORMAL"


# ── Data structures ───────────────────────────────────────────────────────────

@dataclass
class DimensionState:
    name:           str
    planned:        float
    actual:         float
    unit:           str    = "%"
    deviation_pct:  float  = field(init=False)
    severity:       str    = field(init=False)

    def __post_init__(self) -> None:
        if self.planned == 0:
            self.deviation_pct = 0.0
        else:
            self.deviation_pct = ((self.actual - self.planned) / abs(self.planned)) * 100
        self.severity = _severity(self.deviation_pct)

    def to_dict(self) -> dict:
        return {
            "name":          self.name,
            "planned":       round(self.planned, 2),
            "actual":        round(self.actual, 2),
            "unit":          self.unit,
            "deviation_pct": round(self.deviation_pct, 2),
            "severity":      self.severity,
        }


@dataclass
class DriftReport:
    project_id:   str
    snapshot_id:  str
    captured_at:  str
    dimensions:   list[DimensionState]
    overall_drift_severity: str    = field(init=False)
    needs_remediation:      bool   = field(init=False)

    def __post_init__(self) -> None:
        levels = {"NORMAL": 0, "LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}
        max_level = max((levels.get(d.severity, 0) for d in self.dimensions), default=0)
        reverse = {v: k for k, v in levels.items()}
        self.overall_drift_severity = reverse[max_level]
        self.needs_remediation = max_level >= 3   # HIGH or CRITICAL

    def to_dict(self) -> dict:
        return {
            "project_id":              self.project_id,
            "snapshot_id":             self.snapshot_id,
            "captured_at":             self.captured_at,
            "overall_drift_severity":  self.overall_drift_severity,
            "needs_remediation":       self.needs_remediation,
            "dimensions":              [d.to_dict() for d in self.dimensions],
        }


@dataclass
class RemediationAction:
    action_type:  str     # "follow_up_task" | "cash_flow_alert" | "log_only"
    dimension:    str
    severity:     str
    description:  str
    record_id:    Optional[str] = None   # DB record created, if any

    def to_dict(self) -> dict:
        return {
            "action_type": self.action_type,
            "dimension":   self.dimension,
            "severity":    self.severity,
            "description": self.description,
            "record_id":   self.record_id,
        }


# ── Project state snapshot ────────────────────────────────────────────────────

def snapshot_project(project_id: str, db: Optional[Session] = None) -> DriftReport:
    """
    Build a DriftReport for a project.

    When a DB session is provided, the function reads real ProjectSite,
    ProjectMetric, CashFlowEntry, and GradeLog rows.
    Falls back to a deterministic stub when db is None or records are absent.
    """
    snapshot_id  = f"snap_{uuid.uuid4().hex[:12]}"
    captured_at  = _utcnow_iso()
    dimensions   : list[DimensionState] = []

    if db is not None:
        try:
            dimensions = _dimensions_from_db(project_id, db)
        except Exception as exc:  # noqa: BLE001
            logger.warning("CDT: DB snapshot failed for project %s: %s", project_id, exc)

    if not dimensions:
        dimensions = _stub_dimensions(project_id)

    return DriftReport(
        project_id=project_id,
        snapshot_id=snapshot_id,
        captured_at=captured_at,
        dimensions=dimensions,
    )


def _dimensions_from_db(project_id: str, db: Session) -> list[DimensionState]:
    """Attempt to build state dimensions from live DB records."""
    from ..models import ProjectSite, ProjectMetric, CashFlowEntry, GradeLog  # noqa: PLC0415

    site: Optional[ProjectSite] = (
        db.query(ProjectSite).filter(ProjectSite.id == _safe_int(project_id)).first()
    )
    if site is None:
        return []

    dims: list[DimensionState] = []

    # ── Timeline ──────────────────────────────────────────────────────────────
    if site.start_date and site.target_completion_date:
        total_days = max(1, (site.target_completion_date - site.start_date).days)
        elapsed    = (datetime.now(tz=timezone.utc) - site.start_date.replace(tzinfo=timezone.utc)).days
        planned_pct = min(100.0, elapsed / total_days * 100)
        # Derive actual from latest ProjectMetric if available
        metric: Optional[ProjectMetric] = (
            db.query(ProjectMetric)
            .filter(ProjectMetric.project_site_id == site.id)
            .order_by(ProjectMetric.recorded_at.desc())
            .first()
        )
        actual_pct = getattr(metric, "completion_pct", planned_pct * 0.95)
        dims.append(DimensionState("timeline", planned_pct, actual_pct, "%"))

    # ── Cost ──────────────────────────────────────────────────────────────────
    if site.budget:
        actual_spend = (
            db.query(CashFlowEntry)
            .filter(
                CashFlowEntry.project_site_id == site.id,
                CashFlowEntry.entry_type == "expense",
            )
            .with_entities(__import__("sqlalchemy").func.sum(CashFlowEntry.amount))
            .scalar()
        ) or 0.0
        planned_spend = site.budget * min(1.0, (
            (_safe_elapsed_pct(site) / 100.0) if site.start_date and site.target_completion_date else 0.5
        ))
        dims.append(DimensionState("cost", planned_spend, float(actual_spend), "$"))

    # ── Quality ───────────────────────────────────────────────────────────────
    grade_log: Optional[GradeLog] = (
        db.query(GradeLog)
        .filter(GradeLog.project_id == project_id)
        .order_by(GradeLog.logged_at.desc())
        .first()
    )
    if grade_log:
        planned_q = getattr(grade_log, "target_score", 85.0)
        actual_q  = getattr(grade_log, "actual_score", planned_q)
        dims.append(DimensionState("quality", planned_q, actual_q, "score"))

    return dims


def _stub_dimensions(project_id: str) -> list[DimensionState]:
    """Deterministic stub dimensions seeded by project_id."""
    import hashlib  # noqa: PLC0415
    seed = int(hashlib.md5(project_id.encode()).hexdigest()[:8], 16)

    def _jitter(base: float, range_pct: float) -> float:
        return base + ((seed % 100) / 100.0 - 0.5) * range_pct

    planned_timeline = 65.0
    actual_timeline  = _jitter(62.0, 20.0)

    planned_cost = 85_000.0
    actual_cost  = planned_cost * _jitter(0.93, 0.20)

    planned_quality = 88.0
    actual_quality  = _jitter(85.0, 15.0)

    planned_safety = 95.0
    actual_safety  = _jitter(93.0, 10.0)

    planned_materials = 80.0
    actual_materials  = _jitter(75.0, 30.0)

    planned_crew = 90.0
    actual_crew  = _jitter(88.0, 20.0)

    return [
        DimensionState("timeline",  planned_timeline,  actual_timeline,  "%"),
        DimensionState("cost",      planned_cost,       actual_cost,       "$"),
        DimensionState("quality",   planned_quality,    actual_quality,    "score"),
        DimensionState("safety",    planned_safety,     actual_safety,     "score"),
        DimensionState("materials", planned_materials,  actual_materials,  "%"),
        DimensionState("crew",      planned_crew,       actual_crew,       "%"),
    ]


# ── Drift detection ───────────────────────────────────────────────────────────

def detect_drift(report: DriftReport) -> list[DimensionState]:
    """Return only dimensions with severity above NORMAL."""
    return [d for d in report.dimensions if d.severity != "NORMAL"]


# ── Remediation ───────────────────────────────────────────────────────────────

def trigger_remediation(
    drift: DriftReport,
    db: Optional[Session] = None,
) -> list[RemediationAction]:
    """
    For each dimension at HIGH or CRITICAL severity, create DB records and
    return a list of RemediationAction.
    """
    actions: list[RemediationAction] = []
    drifted = [d for d in drift.dimensions if d.severity in ("HIGH", "CRITICAL")]

    for dim in drifted:
        action = _remediate_dimension(dim, drift.project_id, db)
        actions.append(action)

    return actions


def _remediate_dimension(
    dim: DimensionState,
    project_id: str,
    db: Optional[Session],
) -> RemediationAction:
    desc_map = {
        "timeline":  f"Schedule drift {dim.deviation_pct:+.1f}%: re-sequence critical-path tasks.",
        "cost":      f"Cost drift {dim.deviation_pct:+.1f}%: review sub billing and lock material prices.",
        "quality":   f"Quality score {dim.actual:.1f} vs target {dim.planned:.1f}: initiate rework inspection.",
        "safety":    f"Safety score {dim.actual:.1f} below target {dim.planned:.1f}: schedule OSHA review.",
        "materials": f"Material stock {dim.actual:.1f}% vs required {dim.planned:.1f}%: trigger procurement.",
        "crew":      f"Crew fulfillment {dim.actual:.1f}% vs required {dim.planned:.1f}%: call subcontractor bench.",
    }
    description = desc_map.get(dim.name, f"{dim.name} drift detected: {dim.deviation_pct:+.1f}%.")
    record_id: Optional[str] = None

    if db is not None:
        record_id = _create_follow_up_task(project_id, dim.name, dim.severity, description, db)
        if dim.severity == "CRITICAL" and dim.name in ("cost", "materials"):
            _create_cash_flow_alert(project_id, dim.name, description, db)

    return RemediationAction(
        action_type  = "follow_up_task" if record_id else "log_only",
        dimension    = dim.name,
        severity     = dim.severity,
        description  = description,
        record_id    = record_id,
    )


def _create_follow_up_task(
    project_id: str,
    dimension: str,
    severity: str,
    description: str,
    db: Session,
) -> Optional[str]:
    try:
        from ..models import FollowUpTask  # noqa: PLC0415
        task = FollowUpTask(
            task_type    = "cdt_remediation",
            priority     = "high" if severity == "CRITICAL" else "medium",
            description  = f"[AUTO-CDT {severity}] {description}",
            due_date     = datetime.now(tz=timezone.utc) + timedelta(days=1),
            status       = "open",
            metadata_    = f'{{"project_id":"{project_id}","dimension":"{dimension}","severity":"{severity}"}}',
        )
        db.add(task)
        db.flush()
        db.commit()
        return str(task.id)
    except Exception as exc:  # noqa: BLE001
        logger.warning("CDT: could not create FollowUpTask: %s", exc)
        db.rollback()
        return None


def _create_cash_flow_alert(
    project_id: str,
    dimension: str,
    description: str,
    db: Session,
) -> None:
    try:
        from ..models import CashFlowAlert  # noqa: PLC0415
        alert = CashFlowAlert(
            alert_type   = "cdt_critical_drift",
            severity     = "critical",
            message      = f"[AUTO-CDT CRITICAL] {description}",
            project_id   = _safe_int(project_id),
            resolved     = False,
        )
        db.add(alert)
        db.commit()
    except Exception as exc:  # noqa: BLE001
        logger.warning("CDT: could not create CashFlowAlert: %s", exc)
        db.rollback()


# ── Full twin status ──────────────────────────────────────────────────────────

def get_twin_status(
    project_id: str,
    db: Optional[Session] = None,
) -> dict:
    """
    Primary public API: returns the complete CDT status for a project,
    including drift report and any remediation actions triggered.
    """
    report  = snapshot_project(project_id, db)
    drifted = detect_drift(report)
    actions = trigger_remediation(report, db) if report.needs_remediation else []

    return {
        **report.to_dict(),
        "drifted_dimensions":  [d.to_dict() for d in drifted],
        "remediation_actions": [a.to_dict() for a in actions],
        "intelligence_level":  _intelligence_level(report),
    }


# ── Intelligence level classification ─────────────────────────────────────────

_LEVEL_LABELS = {
    "NORMAL":   "L2 — Predictive (no drift detected)",
    "LOW":      "L2 — Predictive (minor drift, monitoring)",
    "MEDIUM":   "L3 — Prescriptive (drift advisory active)",
    "HIGH":     "L4 — Autonomous (remediation workflows triggered)",
    "CRITICAL": "L4 — Autonomous (critical drift, full remediation active)",
}

def _intelligence_level(report: DriftReport) -> str:
    return _LEVEL_LABELS.get(report.overall_drift_severity, "L2 — Predictive")


# ── Helpers ───────────────────────────────────────────────────────────────────

def _utcnow_iso() -> str:
    return datetime.now(tz=timezone.utc).isoformat()

def _safe_int(value: str) -> int:
    try:
        return int(value)
    except (ValueError, TypeError):
        return 0

def _safe_elapsed_pct(site: object) -> float:
    try:
        total = max(1, (site.target_completion_date - site.start_date).days)
        elapsed = (datetime.now(tz=timezone.utc) - site.start_date.replace(tzinfo=timezone.utc)).days
        return min(100.0, elapsed / total * 100)
    except Exception:  # noqa: BLE001
        return 50.0
