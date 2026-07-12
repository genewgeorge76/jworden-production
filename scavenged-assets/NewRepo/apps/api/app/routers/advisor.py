"""Advisor — 51-state legal strategy, contractor ranking, and license optimization.

Advisory outputs only — not legal advice. Every response carries a disclaimer.
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Request
from pydantic import BaseModel, Field

from ..core.limiter import limiter
from ..services.contractor_ranker import (
    ContractorBid,
    optimize_license_states,
    rank_contractor_bids,
)
from ..services.lawyer_recommender import (
    find_strongest_states,
    rank_states_by_reciprocity,
    recommend_legal_strategy,
)

router = APIRouter(prefix='/advisor', tags=['advisor'])

ADVISOR_LIMIT = '30/minute'
_DISCLAIMER = 'Advisory analysis only — not legal advice. Confirm with a licensed construction attorney in the project state.'


# ── Legal strategy ────────────────────────────────────────────────────────────

class LegalStrategyRequest(BaseModel):
    state: str = Field(..., min_length=2, max_length=2, description='2-letter state abbreviation')
    dispute_type: str = Field(default='general', description='lien | payment | contract_breach | general')
    role: str = Field(default='gc', description='gc | sub | supplier | owner')


@router.post('/legal-strategy', summary='Negotiation strength analysis and legal strategy recommendation')
@limiter.limit(ADVISOR_LIMIT)
async def legal_strategy(request: Request, req: LegalStrategyRequest):
    rec = recommend_legal_strategy(state=req.state, dispute_type=req.dispute_type, role=req.role)
    return {
        'state': rec.state,
        'state_name': rec.state_name,
        'dispute_type': rec.dispute_type,
        'role': rec.role,
        'scores': {
            'lien': rec.lien_score,
            'payment': rec.payment_score,
            'contract': rec.contract_score,
            'composite': rec.composite_score,
            'label': rec.strength_label,
            'color': rec.strength_color,
        },
        'strategy': {
            'title': rec.strategy_title,
            'description': rec.strategy_description,
            'key_actions': rec.key_actions,
            'role_leverage': rec.role_leverage,
            'state_specific_note': rec.state_specific_note,
            'weak_position_advice': rec.weak_position_advice,
            'citation_note': rec.citation_note,
        },
        'top_states_for_dispute': rec.top_states,
        'disclaimer': _DISCLAIMER,
    }


@router.get('/top-states', summary='Top states by contractor-favorability for a dispute type')
@limiter.limit(ADVISOR_LIMIT)
async def top_states(request: Request, dispute_type: str = 'general', top_n: int = 10):
    results = find_strongest_states(dispute_type, top_n=min(top_n, 51))
    return {'dispute_type': dispute_type, 'states': results, 'disclaimer': _DISCLAIMER}


@router.get('/reciprocity-ranking', summary='Rank states by license reciprocity breadth')
@limiter.limit(ADVISOR_LIMIT)
async def reciprocity_ranking(request: Request, home_state: str = 'VA', top_n: int = 10):
    results = rank_states_by_reciprocity(home_state, top_n=min(top_n, 51))
    return {'home_state': home_state.upper(), 'states': results, 'disclaimer': _DISCLAIMER}


@router.get('/license-optimizer', summary='Rank states by optimal base license for multi-state work')
@limiter.limit(ADVISOR_LIMIT)
async def license_optimizer(request: Request, top_n: int = 10):
    results = optimize_license_states(top_n=min(top_n, 51))
    return {
        'results': [
            {
                'rank': i + 1,
                'abbr': s.abbr,
                'state': s.state_name,
                'reciprocity_count': s.reciprocity_count,
                'class_scope_score': s.class_scope_score,
                'bond_min_commercial': s.bond_min_commercial,
                'optimizer_score': s.optimizer_score,
                'optimizer_label': s.optimizer_label,
                'notes': s.notes,
            }
            for i, s in enumerate(results)
        ],
        'disclaimer': _DISCLAIMER,
    }


# ── Contractor bid ranking ────────────────────────────────────────────────────

class ContractorBidInput(BaseModel):
    name: str = Field(..., max_length=200)
    bid_amount: float = Field(..., gt=0)
    license_state: str = Field(default='', max_length=2)
    license_classes: list[str] = Field(default_factory=list)
    bond_amount: float = Field(default=0.0, ge=0)
    years_experience: int = Field(default=0, ge=0)
    has_insurance: bool = True
    workers_comp: bool = True
    reciprocity_states: list[str] = Field(default_factory=list)
    notes: str = Field(default='', max_length=500)


class RankContractorsRequest(BaseModel):
    bids: list[ContractorBidInput] = Field(..., min_length=1, max_length=20)
    estimate_low: Optional[float] = Field(default=None, ge=0)
    estimate_high: Optional[float] = Field(default=None, ge=0)


@router.post('/rank-contractors', summary='Score and rank contractor bids by quality, licensing, bonding, and value')
@limiter.limit(ADVISOR_LIMIT)
async def rank_contractors(request: Request, req: RankContractorsRequest):
    bids = [ContractorBid(**b.model_dump()) for b in req.bids]
    est_low = req.estimate_low or 0.0
    est_high = req.estimate_high or 0.0
    ranked = rank_contractor_bids(bids, est_low, est_high)
    return {
        'estimate_range': {'low': est_low, 'high': est_high} if est_low or est_high else None,
        'ranked': [
            {
                'rank': r.rank,
                'name': r.contractor.name,
                'bid_amount': r.contractor.bid_amount,
                'scores': {
                    'bid': r.bid_score,
                    'license': r.license_score,
                    'bond': r.bond_score,
                    'experience': r.experience_score,
                    'compliance': r.compliance_score,
                    'composite': r.composite_score,
                },
                'rank_label': r.rank_label,
                'recommendation': r.recommendation,
                'flags': r.flags,
            }
            for r in ranked
        ],
    }


# ── 811 private-utility risk advisory ─────────────────────────────────────────

class UtilityCheckRequest(BaseModel):
    has_septic: bool = False
    has_well: bool = False
    has_detached_structures: bool = False
    has_pool: bool = False


@router.post('/utility-risk', summary='811 private-utility risk advisory')
@limiter.limit(ADVISOR_LIMIT)
async def evaluate_utility_risk(request: Request, req: UtilityCheckRequest):
    """Advisory scoring for sites with private utilities that 811 will NOT mark."""
    has_private = req.has_septic or req.has_well or req.has_detached_structures or req.has_pool

    recommendations = ['Contact 811 at least 3 business days before digging.']
    if has_private:
        recommendations += [
            'HIGH RISK: private lines likely present — 811 will NOT mark these.',
            'Hire a private utility locating service before excavation.',
        ]
    recommendations.append('Use white lining (white paint/flags) to outline the work area before locators arrive.')

    return {
        'risk_level': 'High' if has_private else 'Low',
        'advisory_notes': recommendations,
        'legal_notice': (
            'Every person must provide their own notice of excavation. '
            'Subcontractors cannot work under another party\'s ticket.'
        ),
        'disclaimer': _DISCLAIMER,
    }
