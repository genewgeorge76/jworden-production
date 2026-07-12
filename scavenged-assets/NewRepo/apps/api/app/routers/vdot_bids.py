"""VDOT bid scraper — list, get, trigger scan, stats."""
from __future__ import annotations

import re
from datetime import datetime, timezone

import httpx
from bs4 import BeautifulSoup
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import func as sqlfunc
from sqlalchemy.orm import Session

from ..core.security import verify_premium_security
from ..database import get_db
from ..models import VdotBid

router = APIRouter(prefix='/vdot-bids', tags=['vdot-bids'])

VDOT_URL = 'https://www.vdot.virginia.gov/business/construction-division/advertisement/'


def _parse_dollar(text: str) -> float | None:
    clean = re.sub(r'[^\d.]', '', (text or '').strip())
    try:
        return float(clean) if clean else None
    except ValueError:
        return None


def _scrape_vdot(db: Session) -> int:
    try:
        resp = httpx.get(VDOT_URL, timeout=30, follow_redirects=True)
        resp.raise_for_status()
    except Exception:
        return 0

    soup = BeautifulSoup(resp.text, 'html.parser')
    new_count = 0

    for row in soup.select('table tr'):
        cells = [c.get_text(strip=True) for c in row.find_all(['td', 'th'])]
        if len(cells) < 3:
            continue

        project_number = cells[0] if cells else None
        project_name = cells[1] if len(cells) > 1 else 'Unnamed Project'
        bid_date_str = cells[2] if len(cells) > 2 else None
        est_str = cells[3] if len(cells) > 3 else None
        district = cells[4] if len(cells) > 4 else None

        if not project_number or project_number.lower() in {'project', 'project number', '#', ''}:
            continue

        existing = db.query(VdotBid).filter(VdotBid.project_number == project_number).first()
        if existing:
            continue

        bid_date = None
        if bid_date_str:
            for fmt in ('%m/%d/%Y', '%Y-%m-%d', '%B %d, %Y'):
                try:
                    bid_date = datetime.strptime(bid_date_str, fmt).replace(tzinfo=timezone.utc)
                    break
                except ValueError:
                    pass

        estimated_cost = _parse_dollar(est_str or '')
        tier = None
        if estimated_cost:
            if estimated_cost >= 5_000_000:
                tier = 'WHALE'
            elif estimated_cost >= 500_000:
                tier = 'SHARK'
            else:
                tier = 'FISH'

        bid = VdotBid(
            project_number=project_number,
            project_name=project_name,
            district=district,
            bid_date=bid_date,
            estimated_cost=estimated_cost,
            tier=tier,
            url=VDOT_URL,
            status='open',
        )
        db.add(bid)
        new_count += 1

    if new_count:
        db.commit()
    return new_count


@router.get('/', dependencies=[Depends(verify_premium_security)])
async def list_bids(
    status: str | None = None,
    tier: str | None = None,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    q = db.query(VdotBid)
    if status:
        q = q.filter(VdotBid.status == status)
    if tier:
        q = q.filter(VdotBid.tier == tier)
    bids = q.order_by(VdotBid.bid_date).limit(limit).all()
    return {
        'bids': [
            {
                'id': b.id,
                'project_number': b.project_number,
                'project_name': b.project_name,
                'district': b.district,
                'bid_date': b.bid_date.isoformat() if b.bid_date else None,
                'estimated_cost': b.estimated_cost,
                'tier': b.tier,
                'status': b.status,
            }
            for b in bids
        ],
        'total': len(bids),
    }


@router.get('/stats', dependencies=[Depends(verify_premium_security)])
async def bid_stats(db: Session = Depends(get_db)):
    total = db.query(VdotBid).count()
    open_count = db.query(VdotBid).filter(VdotBid.status == 'open').count()
    avg_est = db.query(sqlfunc.avg(VdotBid.estimated_cost)).filter(VdotBid.estimated_cost.isnot(None)).scalar()
    whale = db.query(VdotBid).filter(VdotBid.tier == 'WHALE').count()
    shark = db.query(VdotBid).filter(VdotBid.tier == 'SHARK').count()
    fish = db.query(VdotBid).filter(VdotBid.tier == 'FISH').count()
    return {
        'total': total,
        'open': open_count,
        'awarded': db.query(VdotBid).filter(VdotBid.status == 'awarded').count(),
        'avg_estimated_cost': round(float(avg_est or 0), 2),
        'by_tier': {'WHALE': whale, 'SHARK': shark, 'FISH': fish},
    }


@router.get('/{bid_id}', dependencies=[Depends(verify_premium_security)])
async def get_bid(bid_id: int, db: Session = Depends(get_db)):
    bid = db.query(VdotBid).filter(VdotBid.id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=404, detail='Bid not found')
    return {
        'id': bid.id,
        'project_number': bid.project_number,
        'project_name': bid.project_name,
        'district': bid.district,
        'county': bid.county,
        'state_route': bid.state_route,
        'bid_date': bid.bid_date.isoformat() if bid.bid_date else None,
        'estimated_cost': bid.estimated_cost,
        'project_type': bid.project_type,
        'tier': bid.tier,
        'url': bid.url,
        'status': bid.status,
        'scraped_at': bid.scraped_at.isoformat() if bid.scraped_at else None,
    }


@router.post('/scan', dependencies=[Depends(verify_premium_security)])
async def trigger_scan(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    background_tasks.add_task(_scrape_vdot, db)
    return {'status': 'scan_started', 'source': VDOT_URL}
