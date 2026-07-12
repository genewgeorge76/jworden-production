"""Materials pricing — $/sqft rate engine, state multipliers, service catalog."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..core.security import verify_premium_security
from ..services.pricing_engine import estimate_price, list_services, get_state_multiplier

router = APIRouter(prefix='/pricing', tags=['pricing'])


class PriceRequest(BaseModel):
    service_type: str
    property_type: str = 'residential'
    project_size_sqft: float = 0.0
    state_code: str = 'VA'
    material_cost_adjustment: float = 1.0


@router.post('/estimate', dependencies=[Depends(verify_premium_security)])
async def price_estimate(body: PriceRequest):
    """Return a low/high price range for any supported service."""
    return estimate_price(
        service_type=body.service_type,
        property_type=body.property_type,
        project_size_sqft=body.project_size_sqft,
        state_code=body.state_code,
        material_cost_adjustment=body.material_cost_adjustment,
    )


@router.get('/services')
async def get_services():
    """List all service types with their residential and commercial rate ranges."""
    from ..services.pricing_engine import _RATES
    return {
        'services': [
            {
                'service': svc,
                'residential': {'low': rates['residential'][0], 'high': rates['residential'][1]},
                'commercial': {'low': rates.get('commercial', rates['residential'])[0],
                               'high': rates.get('commercial', rates['residential'])[1]},
                'unit': '$/sqft',
            }
            for svc, rates in _RATES.items()
        ]
    }


@router.get('/state-multiplier/{state_code}')
async def state_multiplier(state_code: str):
    """Return the cost-of-market multiplier for a given state."""
    mult = get_state_multiplier(state_code)
    tier = 'high' if mult > 1.15 else 'medium' if mult > 0.95 else 'low'
    return {'state_code': state_code.upper(), 'multiplier': mult, 'tier': tier}


@router.get('/quick-quote')
async def quick_quote(
    service: str = 'paving',
    sqft: float = 500.0,
    state: str = 'VA',
    type_: str = 'residential',
):
    """Convenience endpoint for quick frontend quote widgets."""
    result = estimate_price(service, type_, sqft, state)
    if 'error' in result:
        return result
    return {
        'service': service,
        'sqft': sqft,
        'state': state.upper(),
        'low_fmt': result['low_fmt'],
        'high_fmt': result['high_fmt'],
        'disclaimer': result['disclaimer'],
    }
