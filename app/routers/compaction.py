"""
compaction.py — Intelligent compaction telemetry for JWordenAI.

Routes:
  POST /api/v1/iot/compaction-ping          — ingest one compaction pass record
  GET  /api/v1/iot/compaction-heatmap/{id}  — return heatmap data for a site
  GET  /api/v1/iot/compaction-summary/{id}  — aggregate stats per roller for a site

Each ping represents one GPS-tagged compaction pass from a roller.
Aggregated across a project, these records build a density heat map that
shows over-compacted zones (too many passes) and under-compacted zones
(density below target) so foremen can redirect the roller in real time.

Requires premium security on read endpoints.
"""

import logging
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..core.security import verify_premium_security
from ..database import get_db
from ..models import CompactionLog

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/iot", tags=["compaction"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class CompactionPingRequest(BaseModel):
    roller_id:         str            = Field(..., min_length=1, max_length=60)
    lat:               float          = Field(..., ge=-90, le=90)
    lng:               float          = Field(..., ge=-180, le=180)
    project_site_id:   Optional[int]  = None
    operator_name:     Optional[str]  = Field(None, max_length=120)
    pass_number:       Optional[int]  = Field(None, ge=1)
    mat_temp_f:        Optional[float] = Field(None, ge=0, le=500)
    mat_thickness_in:  Optional[float] = Field(None, ge=0, le=24)
    density_pct:       Optional[float] = Field(None, ge=0, le=110)
    speed_mph:         Optional[float] = Field(None, ge=0, le=10)
    gps_accuracy_ft:   Optional[float] = Field(None, ge=0)
    notes:             Optional[str]  = None
    tenant_id:         Optional[str]  = Field(None, max_length=60)


class CompactionPingResponse(BaseModel):
    id:              int
    roller_id:       str
    project_site_id: Optional[int]
    lat:             float
    lng:             float
    density_pct:     Optional[float]
    pass_number:     Optional[int]
    logged_at:       datetime

    class Config:
        from_attributes = True


# ── Helpers ───────────────────────────────────────────────────────────────────

def _density_color(density_pct: Optional[float]) -> str:
    """Return a colour hint for frontend heatmap rendering."""
    if density_pct is None:
        return "grey"
    if density_pct >= 98:
        return "red"      # over-compacted
    if density_pct >= 92:
        return "green"    # in-spec
    if density_pct >= 85:
        return "yellow"   # marginal
    return "blue"         # under-compacted


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/compaction-ping", response_model=CompactionPingResponse, status_code=201)
def compaction_ping(req: CompactionPingRequest, db: Session = Depends(get_db)):
    """
    Ingest a single compaction pass record from a GPS-enabled roller.

    No auth required so field tablets and IoT gateways can POST without
    a user session.  The ``roller_id`` + ``project_site_id`` combination
    is the natural key for grouping heat-map cells.
    """
    record = CompactionLog(
        project_site_id  = req.project_site_id,
        roller_id        = req.roller_id,
        operator_name    = req.operator_name,
        lat              = req.lat,
        lng              = req.lng,
        pass_number      = req.pass_number,
        mat_temp_f       = req.mat_temp_f,
        mat_thickness_in = req.mat_thickness_in,
        density_pct      = req.density_pct,
        speed_mph        = req.speed_mph,
        gps_accuracy_ft  = req.gps_accuracy_ft,
        notes            = req.notes,
        tenant_id        = req.tenant_id or "default",
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    logger.info("Compaction ping stored: id=%s roller=%s site=%s density=%s%%",
                record.id, record.roller_id, record.project_site_id, record.density_pct)
    return record


@router.get(
    "/compaction-heatmap/{site_id}",
    dependencies=[Depends(verify_premium_security)],
)
def compaction_heatmap(
    site_id: int,
    limit: int = Query(2000, ge=1, le=10000),
    db: Session = Depends(get_db),
):
    """
    Return all compaction pings for a site as a GeoJSON-compatible array.

    Each item includes lat/lng, pass_number, density_pct, and a ``color``
    hint for direct use with Leaflet.heat or Deck.gl HeatmapLayer.

    Response shape:
      {
        "site_id": 42,
        "count": 312,
        "points": [
          { "lat": 37.54, "lng": -77.43, "pass": 3, "density": 94.1,
            "temp_f": 285.0, "color": "green" },
          ...
        ]
      }
    """
    records: List[CompactionLog] = (
        db.query(CompactionLog)
        .filter(CompactionLog.project_site_id == site_id)
        .order_by(CompactionLog.logged_at.desc())
        .limit(limit)
        .all()
    )
    return {
        "site_id": site_id,
        "count": len(records),
        "points": [
            {
                "lat":     r.lat,
                "lng":     r.lng,
                "pass":    r.pass_number,
                "density": r.density_pct,
                "temp_f":  r.mat_temp_f,
                "thickness_in": r.mat_thickness_in,
                "roller":  r.roller_id,
                "color":   _density_color(r.density_pct),
                "logged_at": r.logged_at.isoformat() if r.logged_at else None,
            }
            for r in records
        ],
    }


@router.get(
    "/compaction-summary/{site_id}",
    dependencies=[Depends(verify_premium_security)],
)
def compaction_summary(site_id: int, db: Session = Depends(get_db)):
    """
    Aggregate compaction stats per roller for a project site.

    Returns average density, max pass count, min mat temp, and a
    compliance flag (True when avg density >= 92% of target).
    """
    records: List[CompactionLog] = (
        db.query(CompactionLog)
        .filter(CompactionLog.project_site_id == site_id)
        .all()
    )
    if not records:
        raise HTTPException(status_code=404, detail="No compaction data for this site.")

    # Group by roller
    by_roller: dict[str, list[CompactionLog]] = {}
    for r in records:
        by_roller.setdefault(r.roller_id, []).append(r)

    summary = []
    for roller_id, pings in by_roller.items():
        densities = [p.density_pct for p in pings if p.density_pct is not None]
        temps     = [p.mat_temp_f  for p in pings if p.mat_temp_f  is not None]
        passes    = [p.pass_number for p in pings if p.pass_number  is not None]
        avg_density = round(sum(densities) / len(densities), 1) if densities else None
        summary.append({
            "roller_id":    roller_id,
            "total_pings":  len(pings),
            "avg_density":  avg_density,
            "max_pass":     max(passes) if passes else None,
            "min_temp_f":   round(min(temps), 1) if temps else None,
            "max_temp_f":   round(max(temps), 1) if temps else None,
            "compliant":    avg_density is not None and avg_density >= 92.0,
        })

    overall_densities = [r.density_pct for r in records if r.density_pct is not None]
    return {
        "site_id":       site_id,
        "total_pings":   len(records),
        "avg_density":   round(sum(overall_densities) / len(overall_densities), 1) if overall_densities else None,
        "by_roller":     summary,
    }
