"""Permits — permit lead CRUD + Virginia Permit Transparency scraping."""
from __future__ import annotations

from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..config import settings
from ..core.security import verify_premium_security
from ..database import get_db
from ..models import PermitLead

router = APIRouter(prefix='/permits', tags=['permits'])

VPT_BASE = 'https://permits.virginiatransparency.gov/api'


def _score_permit(permit: dict) -> tuple[int, str]:
    """HOT/WARM/COOL scoring for a permit lead."""
    score = 50
    value = permit.get('projectValue') or permit.get('project_value') or 0
    if isinstance(value, (int, float)):
        if value >= 100_000:
            score += 30
        elif value >= 25_000:
            score += 15
        elif value >= 5_000:
            score += 5
    permit_type = str(permit.get('permitType', '')).lower()
    if any(k in permit_type for k in ['pav', 'asphalt', 'driveway', 'parking', 'road']):
        score += 20
    if not permit.get('contractorName') or not permit.get('contractorLicense'):
        score += 10  # no contractor yet = warm lead

    score = min(100, score)
    label = 'HOT' if score >= 75 else 'WARM' if score >= 50 else 'COOL'
    return score, label


def _scrape_vpt(db: Session, max_results: int = 100) -> int:
    """Fetch Virginia Permit Transparency permits and upsert."""
    try:
        resp = httpx.get(
            f'{VPT_BASE}/permits',
            params={'pageSize': max_results, 'permitType': 'construction'},
            timeout=30,
            follow_redirects=True,
        )
        resp.raise_for_status()
        permits = resp.json().get('data', [])
    except Exception:
        permits = []

    new_count = 0
    for p in permits:
        pnum = p.get('permitNumber') or p.get('permit_number')
        if not pnum:
            continue
        existing = db.query(PermitLead).filter(PermitLead.permit_number == str(pnum)).first()
        if existing:
            continue
        score, label = _score_permit(p)
        lead = PermitLead(
            source='vpt',
            permit_number=str(pnum),
            permit_type=p.get('permitType'),
            permit_status=p.get('status'),
            contractor_name=p.get('contractorName'),
            contractor_license=p.get('contractorLicense'),
            property_address=p.get('address'),
            property_city=p.get('city'),
            property_state=p.get('state', 'VA'),
            property_zip=p.get('zip'),
            project_value=p.get('projectValue'),
            permit_date=datetime.fromisoformat(p['issuedDate']).replace(tzinfo=timezone.utc)
            if p.get('issuedDate') else None,
            priority_score=score,
            priority_label=label,
            raw_json=str(p),
        )
        db.add(lead)
        new_count += 1

    if new_count:
        db.commit()
    return new_count


@router.get('/', dependencies=[Depends(verify_premium_security)])
async def list_permits(
    priority: str | None = None,
    state: str | None = None,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    q = db.query(PermitLead)
    if priority:
        q = q.filter(PermitLead.priority_label == priority.upper())
    if state:
        q = q.filter(PermitLead.property_state == state.upper())
    leads = q.order_by(PermitLead.priority_score.desc()).limit(limit).all()
    return {
        'permits': [
            {
                'id': l.id,
                'permit_number': l.permit_number,
                'permit_type': l.permit_type,
                'property_address': l.property_address,
                'property_city': l.property_city,
                'property_state': l.property_state,
                'contractor_name': l.contractor_name,
                'project_value': l.project_value,
                'priority_score': l.priority_score,
                'priority_label': l.priority_label,
                'permit_date': l.permit_date.isoformat() if l.permit_date else None,
            }
            for l in leads
        ],
        'total': len(leads),
    }


@router.get('/stats', dependencies=[Depends(verify_premium_security)])
async def permit_stats(db: Session = Depends(get_db)):
    total = db.query(PermitLead).count()
    hot = db.query(PermitLead).filter(PermitLead.priority_label == 'HOT').count()
    warm = db.query(PermitLead).filter(PermitLead.priority_label == 'WARM').count()
    cool = db.query(PermitLead).filter(PermitLead.priority_label == 'COOL').count()
    return {'total': total, 'hot': hot, 'warm': warm, 'cool': cool}


@router.get('/{permit_id}', dependencies=[Depends(verify_premium_security)])
async def get_permit(permit_id: int, db: Session = Depends(get_db)):
    lead = db.query(PermitLead).filter(PermitLead.id == permit_id).first()
    if not lead:
        raise HTTPException(404, 'Permit lead not found')
    return {
        'id': lead.id,
        'source': lead.source,
        'permit_number': lead.permit_number,
        'permit_type': lead.permit_type,
        'permit_status': lead.permit_status,
        'contractor_name': lead.contractor_name,
        'contractor_license': lead.contractor_license,
        'property_address': lead.property_address,
        'property_city': lead.property_city,
        'property_state': lead.property_state,
        'project_value': lead.project_value,
        'estimated_sqft': lead.estimated_sqft,
        'priority_score': lead.priority_score,
        'priority_label': lead.priority_label,
        'permit_date': lead.permit_date.isoformat() if lead.permit_date else None,
        'created_at': lead.created_at.isoformat(),
    }


@router.post('/scan', dependencies=[Depends(verify_premium_security)])
async def trigger_scan(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Trigger a background Virginia permit scrape."""
    background_tasks.add_task(_scrape_vpt, db, 100)
    return {'status': 'scan_started', 'source': 'vpt'}
