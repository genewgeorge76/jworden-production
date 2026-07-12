"""KPI dashboard — aggregate metrics wall."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..core.security import verify_premium_security
from ..database import get_db
from ..models import (
    Lead, Job, WorkOrder, WorkforceMember, SubcontractorRoster,
    SafetyIncident, CashFlowEntry, ProposalOutcome, VdotBid, GalleryImage,
)

router = APIRouter(prefix='/kpi', tags=['kpi'])


@router.get('/', dependencies=[Depends(verify_premium_security)])
async def kpi_wall(db: Session = Depends(get_db)):
    """Single endpoint returning all KPIs for the command-center dashboard."""
    now = datetime.now(timezone.utc)
    ytd_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    mtd_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_30 = now - timedelta(days=30)

    # --- Leads / Pipeline ---
    total_leads = db.query(Lead).count()
    new_leads_mtd = db.query(Lead).filter(Lead.created_at >= mtd_start).count()
    open_leads = db.query(Lead).filter(Lead.pipeline_stage.notin_(['won', 'lost'])).count()
    won_leads_ytd = db.query(Lead).filter(
        Lead.pipeline_stage == 'won', Lead.created_at >= ytd_start
    ).count()

    # --- Jobs ---
    jobs_total = db.query(Job).count()
    jobs_active = db.query(Job).filter(Job.status.notin_(['Estimated', 'cancelled'])).count()

    # --- Work Orders ---
    wo_pending = db.query(WorkOrder).filter(WorkOrder.status == 'pending').count()
    wo_in_progress = db.query(WorkOrder).filter(WorkOrder.status == 'in_progress').count()
    wo_completed_mtd = db.query(WorkOrder).filter(
        WorkOrder.status == 'complete', WorkOrder.completed_at >= mtd_start
    ).count()

    # --- Workforce ---
    active_crew = db.query(WorkforceMember).filter(WorkforceMember.status == 'active').count()
    active_subs = db.query(SubcontractorRoster).filter(SubcontractorRoster.status == 'active').count()

    # --- Safety ---
    incidents_ytd = db.query(SafetyIncident).filter(SafetyIncident.incident_date >= ytd_start).count()
    recordables_ytd = db.query(SafetyIncident).filter(
        SafetyIncident.incident_date >= ytd_start, SafetyIncident.osha_recordable == True
    ).count()
    hours_est = max(active_crew * 2000, 1)
    trir = round((recordables_ytd * 200000) / hours_est, 2)

    # --- Cash flow (last 30 days actuals) ---
    cf_entries = db.query(CashFlowEntry).filter(
        CashFlowEntry.week_start >= last_30, CashFlowEntry.is_actual == True
    ).all()
    inflow_30d = sum(e.amount for e in cf_entries if e.amount > 0)
    outflow_30d = abs(sum(e.amount for e in cf_entries if e.amount < 0))
    net_30d = inflow_30d - outflow_30d

    # --- Proposals ---
    won_proposals = db.query(ProposalOutcome).filter(ProposalOutcome.outcome == 'won').count()
    total_proposals = db.query(ProposalOutcome).count()
    proposal_win_rate = round((won_proposals / total_proposals * 100), 1) if total_proposals > 0 else 0

    # --- VDOT ---
    vdot_open = db.query(VdotBid).filter(VdotBid.status == 'open').count()
    vdot_total = db.query(VdotBid).count()

    # --- Gallery ---
    photos_total = db.query(GalleryImage).count()

    return {
        'generated_at': now.isoformat(),
        'pipeline': {
            'total_leads': total_leads,
            'new_leads_mtd': new_leads_mtd,
            'open_leads': open_leads,
            'won_ytd': won_leads_ytd,
        },
        'jobs': {
            'total': jobs_total,
            'active': jobs_active,
        },
        'work_orders': {
            'pending': wo_pending,
            'in_progress': wo_in_progress,
            'completed_mtd': wo_completed_mtd,
        },
        'workforce': {
            'active_crew': active_crew,
            'active_subs': active_subs,
            'total_headcount': active_crew + active_subs,
        },
        'safety': {
            'incidents_ytd': incidents_ytd,
            'recordables_ytd': recordables_ytd,
            'trir': trir,
        },
        'cashflow': {
            'inflow_30d': round(inflow_30d, 2),
            'outflow_30d': round(outflow_30d, 2),
            'net_30d': round(net_30d, 2),
        },
        'proposals': {
            'total': total_proposals,
            'won': won_proposals,
            'win_rate_pct': proposal_win_rate,
        },
        'market': {
            'vdot_open_bids': vdot_open,
            'vdot_total_tracked': vdot_total,
        },
        'gallery': {
            'photos_total': photos_total,
        },
    }
