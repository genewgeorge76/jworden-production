"""Cash-flow — 13-week rolling forecast, entry CRUD, alert thresholds."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.security import verify_premium_security
from ..database import get_db
from ..models import CashFlowEntry, CashFlowAlert

router = APIRouter(prefix='/cashflow', tags=['cashflow'])

VALID_CATEGORIES = {
    'revenue', 'labor', 'materials', 'equipment', 'overhead', 'subcontractor', 'tax', 'other',
}


class EntryCreate(BaseModel):
    week_start: str                     # ISO date string for the week
    category: str
    label: str
    amount: float                       # positive = inflow, negative = outflow
    is_actual: bool = False             # False = projected, True = actual
    notes: str | None = None


class AlertCreate(BaseModel):
    threshold_amount: float             # alert when balance drops below this
    alert_email: str | None = None


@router.post('/entries', dependencies=[Depends(verify_premium_security)])
async def create_entry(body: EntryCreate, db: Session = Depends(get_db)):
    if body.category not in VALID_CATEGORIES:
        raise HTTPException(status_code=422, detail=f'category must be one of {VALID_CATEGORIES}')
    entry = CashFlowEntry(
        week_start=datetime.fromisoformat(body.week_start.replace('Z', '+00:00')),
        category=body.category,
        label=body.label,
        amount=body.amount,
        is_actual=body.is_actual,
        notes=body.notes,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {
        'id': entry.id,
        'week_start': entry.week_start.isoformat(),
        'category': entry.category,
        'label': entry.label,
        'amount': entry.amount,
        'is_actual': entry.is_actual,
    }


@router.get('/entries', dependencies=[Depends(verify_premium_security)])
async def list_entries(
    category: str | None = None,
    is_actual: bool | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    limit: int = 200,
    db: Session = Depends(get_db),
):
    q = db.query(CashFlowEntry)
    if category:
        q = q.filter(CashFlowEntry.category == category)
    if is_actual is not None:
        q = q.filter(CashFlowEntry.is_actual == is_actual)
    if start_date:
        q = q.filter(CashFlowEntry.week_start >= datetime.fromisoformat(start_date))
    if end_date:
        q = q.filter(CashFlowEntry.week_start <= datetime.fromisoformat(end_date))
    entries = q.order_by(CashFlowEntry.week_start.desc()).limit(limit).all()
    return {
        'entries': [
            {'id': e.id, 'week_start': e.week_start.isoformat(), 'category': e.category,
             'label': e.label, 'amount': e.amount, 'is_actual': e.is_actual, 'notes': e.notes}
            for e in entries
        ],
        'total': len(entries),
    }


@router.delete('/entries/{entry_id}', dependencies=[Depends(verify_premium_security)])
async def delete_entry(entry_id: int, db: Session = Depends(get_db)):
    e = db.query(CashFlowEntry).filter(CashFlowEntry.id == entry_id).first()
    if not e:
        raise HTTPException(status_code=404, detail='Entry not found')
    db.delete(e)
    db.commit()
    return {'deleted': entry_id}


@router.get('/forecast', dependencies=[Depends(verify_premium_security)])
async def thirteen_week_forecast(db: Session = Depends(get_db)):
    """13-week rolling cash-flow forecast using actuals + projections from the DB."""
    now = datetime.now(timezone.utc)
    four_weeks_ago = now - timedelta(weeks=4)

    # Use recent actuals to derive weekly run-rate
    recent_actuals = db.query(CashFlowEntry).filter(
        CashFlowEntry.week_start >= four_weeks_ago,
        CashFlowEntry.is_actual == True,
    ).all()

    avg_weekly_inflow = sum(e.amount for e in recent_actuals if e.amount > 0) / 4
    avg_weekly_outflow = abs(sum(e.amount for e in recent_actuals if e.amount < 0)) / 4

    # Seed balance from all actuals in last 30 days
    last_30 = now - timedelta(days=30)
    actuals_30 = db.query(CashFlowEntry).filter(
        CashFlowEntry.week_start >= last_30, CashFlowEntry.is_actual == True
    ).all()
    balance = sum(e.amount for e in actuals_30)

    weeks = []
    for i in range(13):
        week_start = now + timedelta(weeks=i)
        month = week_start.month
        # Seasonal factor — paving off-season Nov–Feb
        season_factor = 0.80 if month in {11, 12, 1, 2} else 1.0
        proj_inflow = round(avg_weekly_inflow * season_factor, 2)
        proj_outflow = round(avg_weekly_outflow, 2)
        net = proj_inflow - proj_outflow
        balance = round(balance + net, 2)
        weeks.append({
            'week': i + 1,
            'start': week_start.strftime('%Y-%m-%d'),
            'end': (week_start + timedelta(days=7)).strftime('%Y-%m-%d'),
            'projected_inflow': proj_inflow,
            'projected_outflow': proj_outflow,
            'net': round(net, 2),
            'running_balance': balance,
            'alert': balance < 0,
        })

    alerts = [w for w in weeks if w['alert']]
    return {
        'forecast': weeks,
        'negative_weeks': len(alerts),
        'first_negative_week': alerts[0] if alerts else None,
        'current_balance_estimate': round(sum(e.amount for e in actuals_30), 2),
    }


@router.post('/alerts', dependencies=[Depends(verify_premium_security)])
async def create_alert(body: AlertCreate, db: Session = Depends(get_db)):
    alert = CashFlowAlert(
        threshold_amount=body.threshold_amount,
        alert_email=body.alert_email,
        is_active=True,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return {'id': alert.id, 'threshold_amount': alert.threshold_amount, 'alert_email': alert.alert_email}


@router.get('/alerts', dependencies=[Depends(verify_premium_security)])
async def list_alerts(db: Session = Depends(get_db)):
    alerts = db.query(CashFlowAlert).filter(CashFlowAlert.is_active == True).all()
    return {
        'alerts': [
            {'id': a.id, 'threshold_amount': a.threshold_amount,
             'alert_email': a.alert_email, 'triggered_at': a.triggered_at.isoformat() if a.triggered_at else None}
            for a in alerts
        ]
    }
