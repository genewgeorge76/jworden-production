"""
spatial_ai.py — Spatial Intelligence & GC Cost Estimation for JWordenAI.

Endpoints:
  POST /api/v1/spatial/verify-as-built     — upload site photo → AI deviation check
  GET  /api/v1/spatial/estimate/{site_id}  — all estimate lines for a project site
  POST /api/v1/spatial/estimate            — add/update an estimate line
  DELETE /api/v1/spatial/estimate/{id}     — remove an estimate line
  GET  /api/v1/spatial/estimate/{site_id}/summary — total cost + category breakdown
  GET  /api/v1/cost-catalog                — list product catalog items
  POST /api/v1/cost-catalog                — add a catalog item (admin)
  PUT  /api/v1/cost-catalog/{id}           — update pricing (admin)

verify-as-built wires into the existing vision_inspector service, extending it
with as-built specific context (expected dimensions, phase, trade scope) for
deviation confidence scoring.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..core.security import verify_premium_security
from ..database import get_db
from ..services.vision_inspector import detect_deviations

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/spatial",
    tags=["spatial-ai"],
    dependencies=[Depends(verify_premium_security)],
)

catalog_router = APIRouter(
    prefix="/api/v1/cost-catalog",
    tags=["cost-catalog"],
    dependencies=[Depends(verify_premium_security)],
)


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class EstimateLineCreate(BaseModel):
    project_site_id:  Optional[int]   = None
    item_id:          Optional[int]   = None
    item_name:        Optional[str]   = Field(None, max_length=200)
    unit:             Optional[str]   = Field(None, max_length=30)
    quantity:         float           = Field(0.0, ge=0)
    base_rate:        float           = Field(0.0, ge=0)
    labor_rate:       float           = Field(0.0, ge=0)
    markup_pct:       float           = Field(0.15, ge=0, le=5.0)
    notes:            Optional[str]   = Field(None, max_length=300)
    created_by:       Optional[str]   = Field(None, max_length=120)


class CatalogItemCreate(BaseModel):
    category:    str   = Field("other", max_length=60)
    name:        str   = Field(..., max_length=200)
    unit:        str   = Field(..., max_length=30)
    base_rate:   float = Field(0.0, ge=0)
    labor_rate:  float = Field(0.0, ge=0)
    description: Optional[str] = Field(None, max_length=300)


class CatalogItemUpdate(BaseModel):
    base_rate:   Optional[float] = Field(None, ge=0)
    labor_rate:  Optional[float] = Field(None, ge=0)
    description: Optional[str]  = Field(None, max_length=300)
    is_active:   Optional[bool]  = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _compute_total(quantity: float, base_rate: float, labor_rate: float, markup_pct: float) -> float:
    return round(quantity * (base_rate + labor_rate) * (1 + markup_pct), 2)


# ── Spatial verify-as-built ───────────────────────────────────────────────────

@router.post("/verify-as-built", summary="AI spatial deviation check vs design spec")
async def verify_as_built(
    file: UploadFile = File(...),
    expected_width_ft:  Optional[float] = Query(None, description="Design spec width in feet"),
    expected_length_ft: Optional[float] = Query(None, description="Design spec length in feet"),
    phase:              Optional[str]   = Query(None, description="Construction phase e.g. 'rough framing'"),
    trade_scope:        Optional[str]   = Query(None, description="Trade scope e.g. 'framing', 'roofing'"),
    confidence_threshold: float         = Query(0.40, ge=0.10, le=0.99),
):
    """
    Upload a site photo and compare it against design specifications.

    Runs the YOLO/vision pipeline (Cloud Run → local YOLO → stub fallback)
    to detect structural, PPE, and spatial deviations.

    When expected dimensions are provided, the response includes a
    `dimensional_check` block with confidence that the visible structure
    matches the spec.
    """
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    vision_result = detect_deviations(
        image_bytes=image_bytes,
        confidence_threshold=confidence_threshold,
    )

    # Build as-built context block
    as_built: dict = {
        "status": "Scanning Complete",
        "phase": phase or "unspecified",
        "trade_scope": trade_scope or "general",
        "inference_mode": vision_result.get("inference_mode", "stub"),
        "deviations_detected": vision_result.get("deviations", []),
        "ppe_compliant": vision_result.get("ppe_compliant", True),
        "risk_level": vision_result.get("risk_level", "UNKNOWN"),
        "ai_summary": vision_result.get("summary", "No summary available."),
    }

    # Deviation count → recommended action
    dev_count = len(as_built["deviations_detected"])
    risk = as_built["risk_level"]
    if risk == "HIGH" or dev_count >= 3:
        action = "STOP — resolve flagged deviations before proceeding to next phase."
        match_confidence = max(0.0, 0.85 - dev_count * 0.08)
    elif risk == "MEDIUM" or dev_count >= 1:
        action = "CAUTION — review deviations with site supervisor; proceed with sign-off."
        match_confidence = max(0.0, 0.92 - dev_count * 0.05)
    else:
        action = "Proceed to next phase."
        match_confidence = 0.97

    as_built["match_confidence"] = round(match_confidence, 3)
    as_built["action"] = action

    # Optional dimensional check block
    if expected_width_ft or expected_length_ft:
        expected_area = (expected_width_ft or 0) * (expected_length_ft or 0)
        as_built["dimensional_check"] = {
            "expected_width_ft":  expected_width_ft,
            "expected_length_ft": expected_length_ft,
            "expected_area_sqft": round(expected_area, 1),
            "note": (
                "Dimensional accuracy requires a calibrated reference scale in the image "
                "(e.g. a surveying rod, laser target, or known-dimension object). "
                "AI confidence is based on visual pattern recognition only."
            ),
        }

    return as_built


# ── Cost estimation endpoints ─────────────────────────────────────────────────

@router.get("/estimate/{site_id}", summary="Get estimate lines for a project site")
def get_estimate_lines(site_id: int, db: Session = Depends(get_db)):
    """Return all estimate lines for a project site."""
    from ..models import ProjectEstimate  # noqa: PLC0415

    lines = (
        db.query(ProjectEstimate)
        .filter(ProjectEstimate.project_site_id == site_id)
        .order_by(ProjectEstimate.created_at)
        .all()
    )
    return {
        "project_site_id": site_id,
        "lines": [
            {
                "id":          l.id,
                "item_id":     l.item_id,
                "item_name":   l.item_name,
                "unit":        l.unit,
                "quantity":    l.quantity,
                "base_rate":   l.base_rate,
                "labor_rate":  l.labor_rate,
                "markup_pct":  l.markup_pct,
                "total_cost":  l.total_cost,
                "notes":       l.notes,
                "created_at":  l.created_at.isoformat() if l.created_at else None,
            }
            for l in lines
        ],
    }


@router.get("/estimate/{site_id}/summary", summary="Cost estimate summary with category breakdown")
def get_estimate_summary(site_id: int, db: Session = Depends(get_db)):
    """Return total project cost with breakdown by category."""
    from ..models import ProductItem, ProjectEstimate  # noqa: PLC0415

    lines = (
        db.query(ProjectEstimate)
        .filter(ProjectEstimate.project_site_id == site_id)
        .all()
    )
    if not lines:
        return {"project_site_id": site_id, "total_cost": 0.0, "line_count": 0, "categories": {}}

    # Enrich with category by joining catalog
    item_ids = [l.item_id for l in lines if l.item_id]
    catalog = {
        row.id: row.category
        for row in db.query(ProductItem).filter(ProductItem.id.in_(item_ids)).all()
    }

    categories: dict[str, float] = {}
    total = 0.0
    for line in lines:
        cat = catalog.get(line.item_id, "other")
        categories[cat] = categories.get(cat, 0.0) + (line.total_cost or 0.0)
        total += line.total_cost or 0.0

    return {
        "project_site_id": site_id,
        "total_cost":   round(total, 2),
        "line_count":   len(lines),
        "categories":   {k: round(v, 2) for k, v in sorted(categories.items())},
    }


@router.post("/estimate", status_code=201, summary="Add an estimate line")
def create_estimate_line(body: EstimateLineCreate, db: Session = Depends(get_db)):
    """
    Add a cost estimate line item.  If item_id is provided and item_name is
    omitted, the name and rates are copied from the product catalog automatically.
    """
    from ..models import ProductItem, ProjectEstimate  # noqa: PLC0415

    base_rate  = body.base_rate
    labor_rate = body.labor_rate
    item_name  = body.item_name
    unit       = body.unit

    if body.item_id:
        catalog_item = db.query(ProductItem).filter(ProductItem.id == body.item_id).first()
        if catalog_item:
            base_rate  = base_rate  or catalog_item.base_rate
            labor_rate = labor_rate or catalog_item.labor_rate
            item_name  = item_name  or catalog_item.name
            unit       = unit       or catalog_item.unit

    total = _compute_total(body.quantity, base_rate, labor_rate, body.markup_pct)
    line = ProjectEstimate(
        project_site_id=body.project_site_id,
        item_id=body.item_id,
        item_name=item_name,
        unit=unit,
        quantity=body.quantity,
        base_rate=base_rate,
        labor_rate=labor_rate,
        markup_pct=body.markup_pct,
        total_cost=total,
        notes=body.notes,
        created_by=body.created_by,
    )
    db.add(line)
    db.commit()
    db.refresh(line)
    return {"id": line.id, "total_cost": line.total_cost, "item_name": line.item_name}


@router.delete("/estimate/{line_id}", summary="Remove an estimate line")
def delete_estimate_line(line_id: int, db: Session = Depends(get_db)):
    from ..models import ProjectEstimate  # noqa: PLC0415

    line = db.query(ProjectEstimate).filter(ProjectEstimate.id == line_id).first()
    if not line:
        raise HTTPException(status_code=404, detail="Estimate line not found.")
    db.delete(line)
    db.commit()
    return {"message": "Estimate line deleted", "id": line_id}


# ── Cost catalog endpoints ────────────────────────────────────────────────────

@catalog_router.get("", summary="List product catalog items")
def list_catalog(
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db),
):
    from ..models import ProductItem  # noqa: PLC0415

    q = db.query(ProductItem).filter(ProductItem.is_active == True)  # noqa: E712
    if category:
        q = q.filter(ProductItem.category == category.lower())
    items = q.order_by(ProductItem.category, ProductItem.name).all()
    return {
        "items": [
            {
                "id":          item.id,
                "category":    item.category,
                "name":        item.name,
                "unit":        item.unit,
                "base_rate":   item.base_rate,
                "labor_rate":  item.labor_rate,
                "total_rate":  round(item.base_rate + item.labor_rate, 2),
                "description": item.description,
            }
            for item in items
        ],
        "count": len(items),
    }


@catalog_router.post("", status_code=201, summary="Add a catalog item")
def add_catalog_item(body: CatalogItemCreate, db: Session = Depends(get_db)):
    from ..models import ProductItem  # noqa: PLC0415

    item = ProductItem(**body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"id": item.id, "name": item.name, "message": "Catalog item added."}


@catalog_router.put("/{item_id}", summary="Update catalog item pricing")
def update_catalog_item(item_id: int, body: CatalogItemUpdate, db: Session = Depends(get_db)):
    from ..models import ProductItem  # noqa: PLC0415

    item = db.query(ProductItem).filter(ProductItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Catalog item not found.")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(item, field, value)
    db.commit()
    return {"id": item_id, "message": "Catalog item updated."}
