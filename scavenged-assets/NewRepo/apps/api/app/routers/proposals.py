"""Proposals — AI-generated professional proposals + win/loss tracking."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.limiter import limiter, AI_LIMIT
from ..core.security import verify_premium_security
from ..database import get_db
from ..models import Lead, Estimate, ProposalOutcome
from ..services.proposal_engine import generate_proposal

router = APIRouter(prefix='/proposals', tags=['proposals'])


class GenerateProposalRequest(BaseModel):
    lead_id: str | None = None
    estimate_id: str | None = None
    customer_name: str
    project_address: str
    scope: str
    notes: str | None = None


class OutcomeUpdateRequest(BaseModel):
    outcome: str  # won, lost, pending, expired
    lost_reason: str | None = None
    competitor_won: str | None = None


@router.post('/', dependencies=[Depends(verify_premium_security)])
@limiter.limit(AI_LIMIT)
async def create_proposal(
    request: Request,
    body: GenerateProposalRequest,
    db: Session = Depends(get_db),
):
    """Generate an AI proposal from a lead/estimate and store the outcome record."""
    estimate_data: dict = {}

    if body.estimate_id:
        est = db.query(Estimate).filter(Estimate.id == body.estimate_id).first()
        if est:
            estimate_data = {
                'trade_label': est.trade_label,
                'quantity': est.quantity,
                'material_cost': est.material_cost,
                'final_bid': est.final_bid,
                'is_large_job': est.is_large_job,
            }

    if body.lead_id and not estimate_data:
        lead = db.query(Lead).filter(Lead.id == body.lead_id).first()
        if lead:
            estimate_data = {
                'trade_label': lead.service_type or lead.service or 'Paving',
                'quantity': 0,
                'material_cost': 0,
                'final_bid': lead.estimated_value or 0,
                'is_large_job': (lead.estimated_value or 0) > 50000,
            }

    markdown = generate_proposal(
        customer_name=body.customer_name,
        project_address=body.project_address,
        scope=body.scope,
        estimate_data=estimate_data,
    )

    outcome = ProposalOutcome(
        lead_id=body.lead_id,
        proposal_title=f'Proposal — {body.scope} — {body.customer_name}',
        proposal_body=markdown,
        estimated_value=estimate_data.get('final_bid'),
        outcome='pending',
    )
    db.add(outcome)
    db.commit()
    db.refresh(outcome)

    return {
        'id': outcome.id,
        'markdown': markdown,
        'estimated_value': outcome.estimated_value,
        'outcome': outcome.outcome,
        'generated_at': outcome.generated_at.isoformat(),
    }


@router.get('/', dependencies=[Depends(verify_premium_security)])
async def list_proposals(
    lead_id: str | None = None,
    outcome: str | None = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    q = db.query(ProposalOutcome)
    if lead_id:
        q = q.filter(ProposalOutcome.lead_id == lead_id)
    if outcome:
        q = q.filter(ProposalOutcome.outcome == outcome)
    items = q.order_by(ProposalOutcome.generated_at.desc()).limit(limit).all()
    return {
        'proposals': [
            {
                'id': p.id,
                'lead_id': p.lead_id,
                'proposal_title': p.proposal_title,
                'estimated_value': p.estimated_value,
                'outcome': p.outcome,
                'lost_reason': p.lost_reason,
                'competitor_won': p.competitor_won,
                'generated_at': p.generated_at.isoformat() if p.generated_at else None,
                'decided_at': p.decided_at.isoformat() if p.decided_at else None,
            }
            for p in items
        ]
    }


@router.get('/{proposal_id}', dependencies=[Depends(verify_premium_security)])
async def get_proposal(proposal_id: int, db: Session = Depends(get_db)):
    p = db.query(ProposalOutcome).filter(ProposalOutcome.id == proposal_id).first()
    if not p:
        raise HTTPException(status_code=404, detail='Proposal not found')
    return {
        'id': p.id,
        'lead_id': p.lead_id,
        'proposal_title': p.proposal_title,
        'proposal_body': p.proposal_body,
        'estimated_value': p.estimated_value,
        'outcome': p.outcome,
        'lost_reason': p.lost_reason,
        'competitor_won': p.competitor_won,
        'generated_at': p.generated_at.isoformat() if p.generated_at else None,
        'decided_at': p.decided_at.isoformat() if p.decided_at else None,
    }


@router.patch('/{proposal_id}/outcome', dependencies=[Depends(verify_premium_security)])
async def update_outcome(
    proposal_id: int,
    body: OutcomeUpdateRequest,
    db: Session = Depends(get_db),
):
    valid = {'won', 'lost', 'pending', 'expired'}
    if body.outcome not in valid:
        raise HTTPException(status_code=422, detail=f'outcome must be one of {valid}')

    p = db.query(ProposalOutcome).filter(ProposalOutcome.id == proposal_id).first()
    if not p:
        raise HTTPException(status_code=404, detail='Proposal not found')

    p.outcome = body.outcome
    p.lost_reason = body.lost_reason
    p.competitor_won = body.competitor_won
    p.decided_at = datetime.now(timezone.utc)
    db.commit()

    # If won, update the lead pipeline stage
    if body.outcome == 'won' and p.lead_id:
        lead = db.query(Lead).filter(Lead.id == p.lead_id).first()
        if lead:
            lead.pipeline_stage = 'won'
            lead.closed_at = datetime.now(timezone.utc)
            db.commit()

    return {'id': p.id, 'outcome': p.outcome, 'decided_at': p.decided_at.isoformat()}


@router.get('/stats/win-rate', dependencies=[Depends(verify_premium_security)])
async def win_rate_stats(db: Session = Depends(get_db)):
    total = db.query(ProposalOutcome).count()
    won = db.query(ProposalOutcome).filter(ProposalOutcome.outcome == 'won').count()
    lost = db.query(ProposalOutcome).filter(ProposalOutcome.outcome == 'lost').count()
    pending = db.query(ProposalOutcome).filter(ProposalOutcome.outcome == 'pending').count()
    total_value = db.query(ProposalOutcome).filter(ProposalOutcome.outcome == 'won').all()
    won_value = sum(p.estimated_value or 0 for p in total_value)
    return {
        'total': total,
        'won': won,
        'lost': lost,
        'pending': pending,
        'win_rate': round(won / (won + lost), 3) if (won + lost) > 0 else None,
        'won_value': won_value,
    }
