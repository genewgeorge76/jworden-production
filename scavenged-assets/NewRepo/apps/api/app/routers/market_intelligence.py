"""Market intelligence — competitors, state demand signals, seasonal analysis."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..core.security import verify_premium_security
from ..database import get_db
from ..models import VdotBid, Job, Lead

router = APIRouter(prefix='/market-intelligence', tags=['market-intelligence'])

# Seasonal demand index by month for paving/asphalt (index 0-100)
SEASONAL_DEMAND = {
    1: 15, 2: 20, 3: 45, 4: 75, 5: 90,
    6: 95, 7: 95, 8: 90, 9: 85, 10: 65,
    11: 30, 12: 15,
}

# State-level paving market size estimates (relative index 0–100)
STATE_DEMAND = {
    'VA': 82, 'TX': 95, 'FL': 90, 'CA': 88, 'NY': 75,
    'PA': 72, 'OH': 70, 'GA': 80, 'NC': 78, 'IL': 68,
    'MI': 62, 'NJ': 65, 'WA': 60, 'AZ': 77, 'CO': 72,
    'TN': 75, 'MD': 68, 'MO': 58, 'IN': 55, 'WI': 52,
    'MN': 50, 'SC': 70, 'AL': 65, 'KY': 60, 'OR': 55,
    'OK': 60, 'CT': 55, 'UT': 65, 'NV': 68, 'AR': 55,
    'MS': 52, 'KS': 48, 'NM': 50, 'NE': 45, 'WV': 42,
    'ID': 42, 'HI': 45, 'NH': 40, 'ME': 38, 'MT': 38,
    'RI': 40, 'DE': 45, 'SD': 35, 'ND': 32, 'AK': 30,
    'DC': 60, 'VT': 35, 'WY': 32,
}


@router.get('/seasonal', dependencies=[Depends(verify_premium_security)])
async def seasonal_analysis(db: Session = Depends(get_db)):
    """Return seasonal demand curve + current-month position."""
    now = datetime.now(timezone.utc)
    current_month = now.month
    demand_now = SEASONAL_DEMAND[current_month]
    next_month = (current_month % 12) + 1
    trend = 'rising' if SEASONAL_DEMAND[next_month] > demand_now else (
        'falling' if SEASONAL_DEMAND[next_month] < demand_now else 'flat'
    )
    return {
        'current_month': current_month,
        'current_demand_index': demand_now,
        'next_month_demand_index': SEASONAL_DEMAND[next_month],
        'trend': trend,
        'peak_months': [6, 7],
        'slow_months': [1, 2, 12],
        'monthly_curve': [
            {'month': m, 'demand_index': idx} for m, idx in SEASONAL_DEMAND.items()
        ],
        'recommendation': (
            'Peak season — prioritize high-margin jobs and push capacity.'
            if demand_now >= 85 else
            'Build pipeline now for peak season.' if demand_now >= 50 else
            'Focus on maintenance contracts and crew retention during slow season.'
        ),
    }


@router.get('/state-demand', dependencies=[Depends(verify_premium_security)])
async def state_demand_signals(state: str | None = None):
    """Return paving market demand index by state (or all states)."""
    if state:
        abbr = state.upper()
        if abbr not in STATE_DEMAND:
            return {'error': f'Unknown state: {abbr}', 'valid_states': list(STATE_DEMAND.keys())}
        return {
            'state': abbr,
            'demand_index': STATE_DEMAND[abbr],
            'tier': 'high' if STATE_DEMAND[abbr] >= 80 else 'medium' if STATE_DEMAND[abbr] >= 55 else 'low',
        }
    ranked = sorted(STATE_DEMAND.items(), key=lambda x: x[1], reverse=True)
    return {
        'states': [
            {'state': s, 'demand_index': idx,
             'tier': 'high' if idx >= 80 else 'medium' if idx >= 55 else 'low'}
            for s, idx in ranked
        ],
        'top_5': [{'state': s, 'demand_index': idx} for s, idx in ranked[:5]],
    }


@router.get('/competitors', dependencies=[Depends(verify_premium_security)])
async def competitor_landscape(state: str = 'VA', db: Session = Depends(get_db)):
    """Return competitive landscape signals for a given state."""
    # Derive signals from our own job/lead data
    now = datetime.now(timezone.utc)
    from datetime import timedelta
    last_90 = now - timedelta(days=90)
    recent_leads = db.query(Lead).filter(Lead.created_at >= last_90).count()
    won = db.query(Lead).filter(Lead.pipeline_stage == 'won', Lead.created_at >= last_90).count()
    win_rate = round((won / recent_leads * 100), 1) if recent_leads > 0 else 0

    demand_idx = STATE_DEMAND.get(state.upper(), 50)
    # Estimate competitor density from demand index
    if demand_idx >= 85:
        density = 'high'
        est_competitors = '150+'
    elif demand_idx >= 65:
        density = 'medium'
        est_competitors = '50–150'
    else:
        density = 'low'
        est_competitors = '<50'

    return {
        'state': state.upper(),
        'demand_index': demand_idx,
        'competitor_density': density,
        'estimated_competitors': est_competitors,
        'our_win_rate_90d': win_rate,
        'our_leads_90d': recent_leads,
        'analysis': (
            f'High-competition market. Your {win_rate}% win rate indicates '
            f'{"strong positioning" if win_rate > 35 else "room to sharpen pricing or proposal quality"}.'
            if density == 'high' else
            f'Moderate market. {win_rate}% win rate. Growth opportunity with targeted marketing.'
        ),
        'vdot_activity': db.query(VdotBid).filter(VdotBid.status == 'open').count(),
    }
