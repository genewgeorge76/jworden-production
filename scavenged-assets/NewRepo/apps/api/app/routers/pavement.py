"""Pavement intelligence — PCI scoring, decay forecasting, 811 ground scans, civil stack."""
from __future__ import annotations

import json
from typing import Literal, Optional

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..core.limiter import limiter
from ..core.security import verify_premium_security
from ..database import get_db
from ..models import GroundScanReport
from ..services import pavement_intel

router = APIRouter(prefix='/pavement', tags=['pavement'])

PAVEMENT_LIMIT = '30/minute'


# ── PCI score (public — customer-facing tools) ────────────────────────────────

class PavementScoreRequest(BaseModel):
    age: float = Field(..., ge=0, le=100, description='Pavement age in years')
    cracks: float = Field(..., ge=0, le=100, description='% of surface showing cracking')
    potholes: int = Field(..., ge=0, le=500, description='Potholes per 1,000 sqft')
    traffic: Literal['low', 'medium', 'high', 'very_high'] = 'medium'


@router.post('/score', summary='Score pavement condition (PCI 0-100)')
@limiter.limit(PAVEMENT_LIMIT)
async def pavement_score(request: Request, req: PavementScoreRequest):
    return pavement_intel.score_pavement_condition(
        age=req.age, cracks=req.cracks, potholes=req.potholes, traffic=req.traffic,
    )


# ── Maintenance forecast (public) ─────────────────────────────────────────────

class MaintenanceForecastRequest(BaseModel):
    pavement_age: float = Field(..., ge=0, le=80)
    condition: float = Field(..., ge=0, le=100, description='Current PCI (use /pavement/score first)')


@router.post('/forecast', summary='Forecast maintenance schedule from PCI decay curve')
@limiter.limit(PAVEMENT_LIMIT)
async def maintenance_forecast(request: Request, req: MaintenanceForecastRequest):
    return pavement_intel.forecast_maintenance_schedule(
        pavement_age=req.pavement_age, condition=req.condition,
    )


# ── Ground scan (auth — internal field ops) ───────────────────────────────────

class UtilityFinding(BaseModel):
    utility_type: str = Field(..., max_length=60, description='gas | electric | water | sewer | fiber | storm | unknown')
    depth_inches: Optional[float] = Field(default=None, ge=0, le=240)
    confidence: Optional[float] = Field(default=None, ge=0, le=1)
    marked: bool = False
    notes: Optional[str] = Field(default=None, max_length=500)


class GroundScanRequest(BaseModel):
    address: Optional[str] = Field(default=None, max_length=300)
    scan_area_sqft: Optional[float] = Field(default=None, ge=0, le=20_000_000)
    ticket_811: Optional[str] = Field(default=None, max_length=100)
    ticket_status: Optional[str] = Field(default=None, max_length=40, description='not_started | requested | clear | conflict | expired')
    technologies: list[str] = Field(default_factory=list)
    utilities: list[UtilityFinding] = Field(default_factory=list)
    soil_moisture: Optional[str] = Field(default=None, max_length=40, description='dry | normal | saturated')
    anomalies_detected: bool = False
    notes: Optional[str] = Field(default=None, max_length=5000)


@router.post('/ground-scan', summary='Analyze 811 / subsurface utility locate package before digging')
@limiter.limit(PAVEMENT_LIMIT)
async def ground_scan(
    request: Request,
    req: GroundScanRequest,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    analysis = pavement_intel.analyze_ground_scan(
        ticket_status=req.ticket_status,
        technologies=req.technologies,
        utilities=[u.model_dump() for u in req.utilities],
        soil_moisture=req.soil_moisture,
        anomalies_detected=req.anomalies_detected,
    )
    report = GroundScanReport(
        address=req.address,
        scan_area_sqft=req.scan_area_sqft,
        ticket_811=req.ticket_811,
        ticket_status=req.ticket_status,
        technologies=json.dumps(req.technologies),
        utilities=json.dumps([u.model_dump() for u in req.utilities]),
        risk_level=analysis['risk_level'],
        confidence=analysis['confidence'],
        recommendation=analysis['recommendation'],
        notes=req.notes,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return {'report_id': report.id, **analysis}


@router.get('/ground-scans', summary='List saved ground scan reports')
@limiter.limit(PAVEMENT_LIMIT)
async def list_ground_scans(
    request: Request,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    rows = (
        db.query(GroundScanReport)
        .order_by(GroundScanReport.created_at.desc())
        .limit(min(limit, 200))
        .all()
    )
    return {
        'reports': [
            {
                'id': r.id,
                'address': r.address,
                'ticket_811': r.ticket_811,
                'ticket_status': r.ticket_status,
                'risk_level': r.risk_level,
                'confidence': r.confidence,
                'recommendation': r.recommendation,
                'created_at': r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ],
    }


# ── Age-decay simulation (public) ─────────────────────────────────────────────

class PavementDecayRequest(BaseModel):
    pavement_type: str = Field(..., max_length=40, description='residential_driveway | commercial_parking_lot | road')
    age_years: float = Field(..., ge=0, le=80)
    current_condition_score: Optional[float] = Field(default=None, ge=0, le=100)
    traffic_level: str = Field(default='medium', max_length=30, description='low | medium | high | heavy_truck')
    drainage_quality: str = Field(default='fair', max_length=30, description='good | fair | poor')
    crack_severity: str = Field(default='none', max_length=30, description='none | low | medium | high')
    potholes: int = Field(default=0, ge=0, le=10000)
    rutting_inches: float = Field(default=0, ge=0, le=12)
    last_sealcoat_years: Optional[float] = Field(default=None, ge=0, le=30)
    freeze_thaw: bool = True


@router.post('/decay', summary='Road, parking lot, and driveway age-decay simulation')
@limiter.limit(PAVEMENT_LIMIT)
async def pavement_decay(request: Request, req: PavementDecayRequest):
    return pavement_intel.simulate_pavement_decay(
        pavement_type=req.pavement_type,
        age_years=req.age_years,
        current_condition_score=req.current_condition_score,
        traffic_level=req.traffic_level,
        drainage_quality=req.drainage_quality,
        crack_severity=req.crack_severity,
        potholes=req.potholes,
        rutting_inches=req.rutting_inches,
        last_sealcoat_years=req.last_sealcoat_years,
        freeze_thaw=req.freeze_thaw,
    )


# ── Premium civil stack (auth — internal production decision) ─────────────────

class PremiumCivilStackRequest(BaseModel):
    ticket_status: Optional[str] = Field(default='requested', max_length=40)
    technologies: list[str] = Field(default_factory=list)
    utilities: list[UtilityFinding] = Field(default_factory=list)
    soil_moisture: Optional[str] = Field(default='normal', max_length=40)
    anomalies_detected: bool = False
    pavement_type: str = Field(default='commercial_parking_lot', max_length=40)
    age_years: float = Field(default=8, ge=0, le=80)
    current_condition_score: Optional[float] = Field(default=None, ge=0, le=100)
    traffic_level: str = Field(default='high', max_length=30)
    drainage_quality: str = Field(default='fair', max_length=30)
    crack_severity: str = Field(default='medium', max_length=30)
    potholes: int = Field(default=2, ge=0, le=10000)
    rutting_inches: float = Field(default=0.25, ge=0, le=12)
    last_sealcoat_years: Optional[float] = Field(default=4, ge=0, le=30)
    freeze_thaw: bool = True
    asphalt_temp_f: Optional[float] = Field(default=None, ge=0, le=600)
    target_delivery_temp_f: float = Field(default=275, ge=0, le=600)
    estimated_arrival_minutes: Optional[float] = Field(default=None, ge=0, le=24 * 60)


@router.post('/civil-stack', summary='Seven-module civil-tech scan with GO / CONDITIONAL / HOLD decision')
@limiter.limit(PAVEMENT_LIMIT)
async def civil_stack(
    request: Request,
    req: PremiumCivilStackRequest,
    _: dict = Depends(verify_premium_security),
):
    return pavement_intel.premium_civil_stack(
        ticket_status=req.ticket_status,
        technologies=req.technologies,
        utilities=[u.model_dump() for u in req.utilities],
        soil_moisture=req.soil_moisture,
        anomalies_detected=req.anomalies_detected,
        pavement_type=req.pavement_type,
        age_years=req.age_years,
        current_condition_score=req.current_condition_score,
        traffic_level=req.traffic_level,
        drainage_quality=req.drainage_quality,
        crack_severity=req.crack_severity,
        potholes=req.potholes,
        rutting_inches=req.rutting_inches,
        last_sealcoat_years=req.last_sealcoat_years,
        freeze_thaw=req.freeze_thaw,
        asphalt_temp_f=req.asphalt_temp_f,
        target_delivery_temp_f=req.target_delivery_temp_f,
        estimated_arrival_minutes=req.estimated_arrival_minutes,
    )
