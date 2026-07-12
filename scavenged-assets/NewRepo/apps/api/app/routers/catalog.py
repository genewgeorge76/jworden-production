"""Houzz-killer catalog — SelectableItem CRUD + CatalogProject management.

Every item carries: real price, real availability / lead time, and install labour.
Swapping a finish in a project re-computes total + timeline live.
Full demo-mode when no tenant key is set — seed data ships with the API.
"""
from __future__ import annotations

import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from ..core.security import verify_premium_security
from ..database import get_db
from ..models import CatalogProject, CatalogSelection, SelectableItem

router = APIRouter(prefix='/catalog', tags=['catalog'])

# ── Seed data — premium catalog shipped with demo mode ───────────────────────

_SEED_ITEMS: list[dict] = [
    # ── Pavers ───────────────────────────────────────────────────────────────
    {'sku': 'PAV-001', 'category': 'pavers', 'subcategory': 'concrete', 'name': 'Cambridge Paving Stone — Charcoal',
     'manufacturer': 'Cambridge', 'unit': 'sqft', 'price_usd': 8.50, 'install_labor_usd': 12.50,
     'lead_time_days': 3, 'in_stock': True, 'color': 'charcoal', 'dimensions': '6x6x2.375 in',
     'tags': '["permeable","residential","commercial"]', 'seasonal_note': None},
    {'sku': 'PAV-002', 'category': 'pavers', 'subcategory': 'concrete', 'name': 'Unilock Holland Stone — Sandstone',
     'manufacturer': 'Unilock', 'unit': 'sqft', 'price_usd': 9.25, 'install_labor_usd': 13.00,
     'lead_time_days': 5, 'in_stock': True, 'color': 'sandstone', 'dimensions': '7.72x3.86x2.375 in',
     'tags': '["ADA","residential"]'},
    {'sku': 'PAV-003', 'category': 'pavers', 'subcategory': 'natural_stone', 'name': 'Bluestone Thermal Paver — Irregular',
     'manufacturer': 'Natural Stone Veneers', 'unit': 'sqft', 'price_usd': 22.00, 'install_labor_usd': 28.00,
     'lead_time_days': 14, 'in_stock': True, 'color': 'blue-grey', 'dimensions': 'varies',
     'tags': '["premium","natural","commercial"]', 'seasonal_note': 'Quarry lead time may vary Mar-May'},
    {'sku': 'PAV-004', 'category': 'pavers', 'subcategory': 'permeable', 'name': 'VAST Permeable Paver — Charcoal',
     'manufacturer': 'VAST Enterprises', 'unit': 'sqft', 'price_usd': 11.75, 'install_labor_usd': 15.50,
     'lead_time_days': 7, 'in_stock': True, 'color': 'charcoal', 'dimensions': '7.87x3.94x3.15 in',
     'tags': '["permeable","stormwater","recycled"]'},

    # ── Asphalt surfaces ─────────────────────────────────────────────────────
    {'sku': 'ASP-001', 'category': 'surfaces', 'subcategory': 'asphalt', 'name': 'Standard HMA — 2″ Surface Course',
     'manufacturer': 'J. Worden & Sons', 'unit': 'sqft', 'price_usd': 3.85, 'install_labor_usd': 2.20,
     'lead_time_days': 0, 'in_stock': True, 'color': 'black',
     'tags': '["standard","residential","commercial"]'},
    {'sku': 'ASP-002', 'category': 'surfaces', 'subcategory': 'asphalt', 'name': 'Premium HMA — 3″ Heavy-Duty',
     'manufacturer': 'J. Worden & Sons', 'unit': 'sqft', 'price_usd': 5.25, 'install_labor_usd': 2.80,
     'lead_time_days': 0, 'in_stock': True, 'color': 'black',
     'tags': '["heavy-duty","commercial","trucks"]'},
    {'sku': 'ASP-003', 'category': 'surfaces', 'subcategory': 'sealcoat', 'name': 'Gilsonite Sealcoat + Sand',
     'manufacturer': 'SealMaster', 'unit': 'sqft', 'price_usd': 0.28, 'install_labor_usd': 0.18,
     'lead_time_days': 0, 'in_stock': True, 'color': 'black',
     'tags': '["maintenance","UV-protection"]', 'seasonal_note': 'Apply when temps above 55°F, no rain 24h'},

    # ── Concrete ─────────────────────────────────────────────────────────────
    {'sku': 'CON-001', 'category': 'concrete', 'subcategory': 'flatwork', 'name': 'Standard Broom-Finish Concrete — 4″',
     'manufacturer': 'Local Ready-Mix', 'unit': 'sqft', 'price_usd': 7.50, 'install_labor_usd': 5.50,
     'lead_time_days': 2, 'in_stock': True, 'tags': '["residential","walkway","driveway"]'},
    {'sku': 'CON-002', 'category': 'concrete', 'subcategory': 'decorative', 'name': 'Exposed Aggregate Concrete',
     'manufacturer': 'Local Ready-Mix', 'unit': 'sqft', 'price_usd': 10.00, 'install_labor_usd': 8.00,
     'lead_time_days': 2, 'in_stock': True, 'tags': '["decorative","premium"]'},
    {'sku': 'CON-003', 'category': 'concrete', 'subcategory': 'decorative', 'name': 'Stamped Concrete — Cobblestone Pattern',
     'unit': 'sqft', 'price_usd': 13.00, 'install_labor_usd': 10.00,
     'lead_time_days': 3, 'in_stock': True, 'tags': '["decorative","premium","pattern"]'},

    # ── Edging & borders ─────────────────────────────────────────────────────
    {'sku': 'EDG-001', 'category': 'edging', 'subcategory': 'aluminum', 'name': 'Pro-Flex Aluminum Paver Edge',
     'manufacturer': 'EasyFlex', 'unit': 'lnft', 'price_usd': 1.25, 'install_labor_usd': 1.80,
     'lead_time_days': 1, 'in_stock': True, 'tags': '["residential","commercial"]'},
    {'sku': 'EDG-002', 'category': 'edging', 'subcategory': 'cobble', 'name': 'Tumbled Cobblestone Border — Granite',
     'unit': 'lnft', 'price_usd': 18.50, 'install_labor_usd': 22.00,
     'lead_time_days': 10, 'in_stock': False,
     'tags': '["premium","natural","border"]', 'seasonal_note': 'Check stock mid-season — high demand Apr-Sep'},

    # ── Striping & markings ──────────────────────────────────────────────────
    {'sku': 'STR-001', 'category': 'striping', 'subcategory': 'parking', 'name': 'Standard White Parking Stripe',
     'unit': 'ea', 'price_usd': 8.00, 'install_labor_usd': 4.00,
     'lead_time_days': 0, 'in_stock': True, 'tags': '["ADA","commercial","parking"]'},
    {'sku': 'STR-002', 'category': 'striping', 'subcategory': 'handicap', 'name': 'ADA Handicap Stall w/ Symbol',
     'unit': 'ea', 'price_usd': 65.00, 'install_labor_usd': 35.00,
     'lead_time_days': 0, 'in_stock': True, 'tags': '["ADA","compliance","commercial"]'},

    # ── Plantings ────────────────────────────────────────────────────────────
    {'sku': 'PLT-001', 'category': 'plantings', 'subcategory': 'ornamental_grass', 'name': 'Karl Foerster Feather Reed Grass',
     'manufacturer': 'VA Nursery', 'unit': 'ea', 'price_usd': 18.00, 'install_labor_usd': 12.00,
     'lead_time_days': 5, 'in_stock': True, 'tags': '["low-maintenance","native-adjacent","border"]',
     'seasonal_note': 'Plant spring or fall for best establishment'},
    {'sku': 'PLT-002', 'category': 'plantings', 'subcategory': 'shrub', 'name': "Knock Out Rose — Red 3-gal",
     'manufacturer': 'Star Roses', 'unit': 'ea', 'price_usd': 24.00, 'install_labor_usd': 15.00,
     'lead_time_days': 3, 'in_stock': True, 'tags': '["flowering","low-maintenance"]'},
]

_seeded: bool = False


def _seed_if_empty(db: Session) -> None:
    global _seeded
    if _seeded:
        return
    existing = db.query(SelectableItem).count()
    if existing == 0:
        for row in _SEED_ITEMS:
            db.add(SelectableItem(**row))
        db.commit()
    _seeded = True


# ── Schemas ───────────────────────────────────────────────────────────────────

class ItemOut(BaseModel):
    id: int
    sku: str
    category: str
    subcategory: Optional[str]
    name: str
    description: Optional[str]
    manufacturer: Optional[str]
    unit: str
    price_usd: float
    install_labor_usd: float
    lead_time_days: int
    in_stock: bool
    available_qty: Optional[float]
    seasonal_note: Optional[str]
    tags: Optional[list[str]]
    color: Optional[str]
    texture: Optional[str]
    dimensions: Optional[str]
    thumbnail_url: Optional[str]

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_item(cls, item: SelectableItem) -> 'ItemOut':
        d = {c.name: getattr(item, c.name) for c in item.__table__.columns}
        raw_tags = d.pop('tags', None)
        d['tags'] = json.loads(raw_tags) if raw_tags else []
        return cls(**d)


class SelectionIn(BaseModel):
    item_id: int
    quantity: float = Field(gt=0)
    area_sqft: Optional[float] = None
    zone_label: Optional[str] = None
    override_price_usd: Optional[float] = None


class ProjectIn(BaseModel):
    customer_name: str
    lead_id: Optional[str] = None
    property_address: Optional[str] = None
    project_date: Optional[str] = None
    total_sqft: Optional[float] = None
    budget_usd: Optional[float] = None
    notes: Optional[str] = None


class ProjectSummary(BaseModel):
    id: int
    customer_name: str
    property_address: Optional[str]
    status: str
    total_material_usd: float
    total_labor_usd: float
    total_usd: float
    item_count: int
    estimated_days_to_start: int      # max lead time across selections
    created_at: str


# ── Helpers ───────────────────────────────────────────────────────────────────

def _project_summary(project: CatalogProject) -> ProjectSummary:
    mat = 0.0
    labor = 0.0
    max_lt = 0
    count = 0
    for sel in project.selections:
        item = sel.item
        if item is None:
            continue
        qty = sel.quantity
        price = sel.override_price_usd if sel.override_price_usd is not None else item.price_usd
        mat += price * qty
        labor += item.install_labor_usd * qty
        max_lt = max(max_lt, item.lead_time_days)
        count += 1
    return ProjectSummary(
        id=project.id,
        customer_name=project.customer_name,
        property_address=project.property_address,
        status=project.status,
        total_material_usd=round(mat, 2),
        total_labor_usd=round(labor, 2),
        total_usd=round(mat + labor, 2),
        item_count=count,
        estimated_days_to_start=max_lt,
        created_at=project.created_at.isoformat() if project.created_at else '',
    )


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get('/items', dependencies=[Depends(verify_premium_security)])
def list_items(
    category: Optional[str] = Query(None),
    in_stock_only: bool = Query(False),
    q: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
):
    _seed_if_empty(db)
    qs = db.query(SelectableItem).filter(SelectableItem.is_active == True)
    if category:
        qs = qs.filter(SelectableItem.category == category)
    if in_stock_only:
        qs = qs.filter(SelectableItem.in_stock == True)
    if q:
        term = f'%{q.lower()}%'
        qs = qs.filter(
            (SelectableItem.name.ilike(term)) |
            (SelectableItem.sku.ilike(term)) |
            (SelectableItem.tags.ilike(term))
        )
    items = qs.limit(limit).all()
    return {'items': [ItemOut.from_orm_item(i) for i in items], 'total': len(items)}


@router.get('/items/{item_id}', dependencies=[Depends(verify_premium_security)])
def get_item(item_id: int, db: Session = Depends(get_db)):
    _seed_if_empty(db)
    item = db.query(SelectableItem).filter(SelectableItem.id == item_id).first()
    if not item:
        raise HTTPException(404, 'Item not found')
    return ItemOut.from_orm_item(item)


@router.post('/projects', dependencies=[Depends(verify_premium_security)])
def create_project(body: ProjectIn, db: Session = Depends(get_db)):
    project = CatalogProject(**body.model_dump(exclude_none=True))
    db.add(project)
    db.commit()
    db.refresh(project)
    return _project_summary(project)


@router.get('/projects', dependencies=[Depends(verify_premium_security)])
def list_projects(
    status: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
):
    qs = db.query(CatalogProject)
    if status:
        qs = qs.filter(CatalogProject.status == status)
    projects = qs.order_by(CatalogProject.id.desc()).limit(limit).all()
    return {'projects': [_project_summary(p) for p in projects], 'total': len(projects)}


@router.get('/projects/{project_id}', dependencies=[Depends(verify_premium_security)])
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(CatalogProject).filter(CatalogProject.id == project_id).first()
    if not project:
        raise HTTPException(404, 'Project not found')
    summary = _project_summary(project)
    selections = []
    for sel in project.selections:
        item = sel.item
        selections.append({
            'id': sel.id,
            'zone_label': sel.zone_label,
            'quantity': sel.quantity,
            'area_sqft': sel.area_sqft,
            'approved': sel.approved,
            'item': ItemOut.from_orm_item(item).model_dump() if item else None,
            'line_total_material': round((sel.override_price_usd or (item.price_usd if item else 0)) * sel.quantity, 2),
            'line_total_labor': round((item.install_labor_usd if item else 0) * sel.quantity, 2),
        })
    return {'project': summary, 'selections': selections}


@router.post('/projects/{project_id}/selections', dependencies=[Depends(verify_premium_security)])
def add_selection(project_id: int, body: SelectionIn, db: Session = Depends(get_db)):
    project = db.query(CatalogProject).filter(CatalogProject.id == project_id).first()
    if not project:
        raise HTTPException(404, 'Project not found')
    item = db.query(SelectableItem).filter(SelectableItem.id == body.item_id, SelectableItem.is_active == True).first()
    if not item:
        raise HTTPException(404, 'Item not found')
    sel = CatalogSelection(project_id=project_id, **body.model_dump(exclude_none=True))
    db.add(sel)
    db.commit()
    db.refresh(project)
    return _project_summary(project)


@router.post('/projects/{project_id}/selections/{sel_id}/approve', dependencies=[Depends(verify_premium_security)])
def approve_selection(project_id: int, sel_id: int, db: Session = Depends(get_db)):
    sel = db.query(CatalogSelection).filter(
        CatalogSelection.id == sel_id,
        CatalogSelection.project_id == project_id,
    ).first()
    if not sel:
        raise HTTPException(404, 'Selection not found')
    sel.approved = True
    db.commit()
    return {'id': sel.id, 'approved': True}


@router.delete('/projects/{project_id}/selections/{sel_id}', dependencies=[Depends(verify_premium_security)])
def remove_selection(project_id: int, sel_id: int, db: Session = Depends(get_db)):
    sel = db.query(CatalogSelection).filter(
        CatalogSelection.id == sel_id,
        CatalogSelection.project_id == project_id,
    ).first()
    if not sel:
        raise HTTPException(404, 'Selection not found')
    db.delete(sel)
    db.commit()
    project = db.query(CatalogProject).filter(CatalogProject.id == project_id).first()
    return _project_summary(project)


@router.get('/categories', dependencies=[Depends(verify_premium_security)])
def list_categories(db: Session = Depends(get_db)):
    _seed_if_empty(db)
    from sqlalchemy import func
    rows = db.query(SelectableItem.category, func.count(SelectableItem.id)).filter(
        SelectableItem.is_active == True
    ).group_by(SelectableItem.category).all()
    return {'categories': [{'category': r[0], 'count': r[1]} for r in rows]}


@router.get('/swap-suggestions/{project_id}', dependencies=[Depends(verify_premium_security)])
def swap_suggestions(
    project_id: int,
    budget_usd: Optional[float] = Query(None, description='Target budget; omit to show all cheaper alternatives'),
    db: Session = Depends(get_db),
):
    """Jarvis suggests lower-cost items that preserve look, optionally constrained to a budget."""
    project = db.query(CatalogProject).filter(CatalogProject.id == project_id).first()
    if not project:
        raise HTTPException(404, 'Project not found')
    summary = _project_summary(project)
    effective_budget = budget_usd if budget_usd is not None else summary.total_usd
    over = summary.total_usd - effective_budget
    suggestions = []
    for sel in project.selections:
        item = sel.item
        if not item:
            continue
        alts = db.query(SelectableItem).filter(
            SelectableItem.category == item.category,
            SelectableItem.id != item.id,
            SelectableItem.is_active == True,
            SelectableItem.in_stock == True,
            SelectableItem.price_usd < item.price_usd,
        ).order_by(SelectableItem.price_usd.desc()).limit(2).all()
        for alt in alts:
            current_total = (item.price_usd + item.install_labor_usd) * sel.quantity
            suggestion_total = (alt.price_usd + alt.install_labor_usd) * sel.quantity
            savings = current_total - suggestion_total
            pct = (savings / current_total * 100) if current_total else 0
            suggestions.append({
                'current_item_id': item.id,
                'current_item_name': item.name,
                'suggestion_id': alt.id,
                'suggestion_name': alt.name,
                'suggestion_sku': alt.sku,
                'current_total_usd': round(current_total, 2),
                'suggestion_total_usd': round(suggestion_total, 2),
                'savings_usd': round(savings, 2),
                'pct_cheaper': round(pct, 1),
                'look_match': 'Similar profile, slightly different texture' if alt.subcategory == item.subcategory else 'Different material, compatible aesthetic',
                'in_stock': alt.in_stock,
                'lead_time_days': alt.lead_time_days,
            })
    suggestions.sort(key=lambda x: x['savings_usd'], reverse=True)
    return {
        'project_id': project_id,
        'current_total': summary.total_usd,
        'budget': effective_budget,
        'over_budget': round(over, 2),
        'suggestions': suggestions[:6],
    }

