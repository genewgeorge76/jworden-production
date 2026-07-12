"""BIM / Site Plan Markup router.

Stores plan uploads (file URL or demo SVG), click-to-annotate zone JSON,
and converts approved zones into CatalogSelections + GanttTasks.

Demo mode: works fully without any file storage — uses a bundled SVG demo plan.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.security import verify_premium_security
from ..database import get_db
from ..models import (
    CatalogProject, CatalogSelection, GanttTask, PlanMarkup, SelectableItem, utcnow,
)

router = APIRouter(prefix='/bim', tags=['bim'])

# ── Demo plan ─────────────────────────────────────────────────────────────────

_DEMO_ZONES = [
    {
        'id': 'z1', 'label': 'North Parking Lot', 'type': 'pavers',
        'area_sqft': 8400.0, 'catalog_item_id': None,
        'x_pct': 8.0, 'y_pct': 8.0, 'w_pct': 45.0, 'h_pct': 22.0,
        'color': '#EAB308', 'notes': 'Cambridge Charcoal paver preferred',
    },
    {
        'id': 'z2', 'label': 'Drive Lane', 'type': 'surfaces',
        'area_sqft': 2100.0, 'catalog_item_id': None,
        'x_pct': 55.0, 'y_pct': 30.0, 'w_pct': 38.0, 'h_pct': 12.0,
        'color': '#3B82F6', 'notes': 'Standard HMA 2-inch surface course',
    },
    {
        'id': 'z3', 'label': 'ADA Stalls', 'type': 'striping',
        'area_sqft': 0.0, 'catalog_item_id': None,
        'x_pct': 8.0, 'y_pct': 33.0, 'w_pct': 14.0, 'h_pct': 15.0,
        'color': '#22C55E', 'notes': '4 ADA stalls required per VDOT spec',
    },
    {
        'id': 'z4', 'label': 'Detention Pond', 'type': 'plantings',
        'area_sqft': 380.0, 'catalog_item_id': None,
        'x_pct': 63.0, 'y_pct': 5.0, 'w_pct': 24.0, 'h_pct': 16.0,
        'color': '#6366F1', 'notes': 'Stormwater BMP — ornamental grass edge',
    },
]

_DEMO_SVG_URL = 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDU2IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHg9IjUiIHk9IjUiIHdpZHRoPSI5MCIgaGVpZ2h0PSI0NiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNTI1MjViIiBzdHJva2Utd2lkdGg9IjAuNSIvPjwvc3ZnPg=='


# ── Schemas ───────────────────────────────────────────────────────────────────

class ZoneIn(BaseModel):
    id: str
    label: str
    type: str              # pavers | surfaces | concrete | edging | striping | plantings
    area_sqft: float = 0.0
    catalog_item_id: Optional[int] = None
    x_pct: float = 0.0
    y_pct: float = 0.0
    w_pct: float = 10.0
    h_pct: float = 10.0
    color: str = '#EAB308'
    notes: Optional[str] = None


class PlanIn(BaseModel):
    title: str
    catalog_project_id: Optional[int] = None
    file_url: Optional[str] = None
    file_type: Optional[str] = 'svg'
    zones: Optional[list[ZoneIn]] = None
    notes: Optional[str] = None


class PlanOut(BaseModel):
    id: int
    title: str
    catalog_project_id: Optional[int]
    file_url: Optional[str]
    file_type: Optional[str]
    zones: list[dict]
    total_area_sqft: Optional[float]
    version: int
    is_approved: bool
    notes: Optional[str]
    created_at: str
    demo: bool


def _plan_out(plan: PlanMarkup, is_demo: bool = False) -> PlanOut:
    zones = json.loads(plan.zones) if plan.zones else []
    return PlanOut(
        id=plan.id,
        title=plan.title,
        catalog_project_id=plan.catalog_project_id,
        file_url=plan.file_url or _DEMO_SVG_URL,
        file_type=plan.file_type or 'svg',
        zones=zones,
        total_area_sqft=plan.total_area_sqft,
        version=plan.version,
        is_approved=plan.is_approved,
        notes=plan.notes,
        created_at=plan.created_at.isoformat() if plan.created_at else '',
        demo=is_demo,
    )


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get('/demo', dependencies=[Depends(verify_premium_security)])
def get_demo_plan(db: Session = Depends(get_db)):
    """Return (or seed) the demo Chesterfield parking lot plan."""
    existing = db.query(PlanMarkup).filter(PlanMarkup.title == 'Chesterfield Lot #7 — Demo').first()
    if not existing:
        total = sum(z['area_sqft'] for z in _DEMO_ZONES)
        existing = PlanMarkup(
            title='Chesterfield Lot #7 — Demo',
            file_type='svg',
            zones=json.dumps(_DEMO_ZONES),
            total_area_sqft=total,
            notes='Auto-generated demo plan. Zones linked to live catalog items.',
        )
        db.add(existing)
        db.commit()
        db.refresh(existing)
    return _plan_out(existing, is_demo=True)


@router.get('/', dependencies=[Depends(verify_premium_security)])
def list_plans(
    catalog_project_id: Optional[int] = Query(None),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
):
    qs = db.query(PlanMarkup)
    if catalog_project_id is not None:
        qs = qs.filter(PlanMarkup.catalog_project_id == catalog_project_id)
    plans = qs.order_by(PlanMarkup.id.desc()).limit(limit).all()
    return {'plans': [_plan_out(p) for p in plans], 'total': len(plans)}


@router.post('/', dependencies=[Depends(verify_premium_security)])
def create_plan(body: PlanIn, db: Session = Depends(get_db)):
    zones_data = [z.model_dump() for z in body.zones] if body.zones else _DEMO_ZONES
    total_area = sum(z.get('area_sqft', 0) for z in zones_data)
    plan = PlanMarkup(
        title=body.title,
        catalog_project_id=body.catalog_project_id,
        file_url=body.file_url,
        file_type=body.file_type or 'svg',
        zones=json.dumps(zones_data),
        total_area_sqft=total_area,
        notes=body.notes,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return _plan_out(plan)


@router.get('/{plan_id}', dependencies=[Depends(verify_premium_security)])
def get_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(PlanMarkup).filter(PlanMarkup.id == plan_id).first()
    if not plan:
        raise HTTPException(404, 'Plan not found')
    return _plan_out(plan)


@router.put('/{plan_id}/zones', dependencies=[Depends(verify_premium_security)])
def update_zones(plan_id: int, zones: list[ZoneIn] = Body(...), db: Session = Depends(get_db)):
    plan = db.query(PlanMarkup).filter(PlanMarkup.id == plan_id).first()
    if not plan:
        raise HTTPException(404, 'Plan not found')
    zones_data = [z.model_dump() for z in zones]
    plan.zones = json.dumps(zones_data)
    plan.total_area_sqft = sum(z.area_sqft for z in zones)
    plan.version = (plan.version or 1) + 1
    plan.updated_at = utcnow()
    db.commit()
    return _plan_out(plan)


@router.post('/{plan_id}/approve', dependencies=[Depends(verify_premium_security)])
def approve_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(PlanMarkup).filter(PlanMarkup.id == plan_id).first()
    if not plan:
        raise HTTPException(404, 'Plan not found')
    plan.is_approved = True
    plan.approved_at = utcnow()
    db.commit()
    return _plan_out(plan)


@router.post('/{plan_id}/generate-selections', dependencies=[Depends(verify_premium_security)])
def generate_selections(
    plan_id: int,
    project_id: int = Body(..., embed=True),
    db: Session = Depends(get_db),
):
    """Convert approved zones → CatalogSelections + skeleton GanttTasks.

    Each zone with a catalog_item_id gets a CatalogSelection.
    Zones with area_sqft > 0 also get a GanttTask in the project schedule.
    """
    plan = db.query(PlanMarkup).filter(PlanMarkup.id == plan_id).first()
    if not plan:
        raise HTTPException(404, 'Plan not found')
    project = db.query(CatalogProject).filter(CatalogProject.id == project_id).first()
    if not project:
        raise HTTPException(404, 'Catalog project not found')

    zones = json.loads(plan.zones) if plan.zones else []
    selections_created = 0
    tasks_created = 0

    import datetime as dt
    base_start = dt.datetime.now(dt.timezone.utc).replace(hour=7, minute=0, second=0, microsecond=0)

    for i, zone in enumerate(zones):
        item_id = zone.get('catalog_item_id')
        area = zone.get('area_sqft', 0)

        # Create CatalogSelection if item is linked
        if item_id:
            item = db.query(SelectableItem).filter(SelectableItem.id == item_id).first()
            if item:
                sel = CatalogSelection(
                    project_id=project_id,
                    item_id=item_id,
                    quantity=area if area > 0 else 1.0,
                    area_sqft=area or None,
                    zone_label=zone.get('label'),
                )
                db.add(sel)
                selections_created += 1

        # Create skeleton GanttTask for zones with area
        if area and area > 0:
            zone_type = zone.get('type', 'work')
            dur = max(4, round(area / 1000 * 8))  # ~8h per 1000 sqft
            task_start = base_start + dt.timedelta(hours=i * dur)
            task_end = task_start + dt.timedelta(hours=dur)
            task = GanttTask(
                project_name=project.customer_name,
                task_name=zone.get('label', f'Zone {i+1}'),
                phase=zone_type,
                planned_start=task_start,
                planned_end=task_end,
                duration_hours=float(dur),
                notes=zone.get('notes'),
            )
            db.add(task)
            tasks_created += 1

    db.commit()
    return {
        'plan_id': plan_id,
        'project_id': project_id,
        'selections_created': selections_created,
        'gantt_tasks_created': tasks_created,
        'message': f'Generated {selections_created} selections and {tasks_created} Gantt tasks from {len(zones)} zones.',
    }


@router.get('/{plan_id}/estimate', dependencies=[Depends(verify_premium_security)])
def plan_estimate(plan_id: int, db: Session = Depends(get_db)):
    """Compute cost estimate from zone areas × catalog item pricing."""
    plan = db.query(PlanMarkup).filter(PlanMarkup.id == plan_id).first()
    if not plan:
        raise HTTPException(404, 'Plan not found')

    zones = json.loads(plan.zones) if plan.zones else []
    line_items = []
    total_material = 0.0
    total_labor = 0.0

    for zone in zones:
        item_id = zone.get('catalog_item_id')
        area = zone.get('area_sqft', 0)
        if not item_id or not area:
            continue
        item = db.query(SelectableItem).filter(SelectableItem.id == item_id).first()
        if not item:
            continue
        mat = item.price_usd * area
        labor = item.install_labor_usd * area
        total_material += mat
        total_labor += labor
        line_items.append({
            'zone': zone.get('label'),
            'item': item.name,
            'unit': item.unit,
            'qty': area,
            'price_per_unit': item.price_usd,
            'labor_per_unit': item.install_labor_usd,
            'material_total': round(mat, 2),
            'labor_total': round(labor, 2),
            'line_total': round(mat + labor, 2),
        })

    return {
        'plan_id': plan_id,
        'title': plan.title,
        'total_area_sqft': plan.total_area_sqft,
        'line_items': line_items,
        'total_material_usd': round(total_material, 2),
        'total_labor_usd': round(total_labor, 2),
        'grand_total_usd': round(total_material + total_labor, 2),
        'unlinked_zones': [z['label'] for z in zones if not z.get('catalog_item_id')],
    }
