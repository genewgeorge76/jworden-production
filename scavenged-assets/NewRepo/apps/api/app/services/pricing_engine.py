"""Materials pricing engine — $/sqft rates with state multipliers and mobilization floors."""
from __future__ import annotations

# $/sqft rate table: {service: {property_type: (low, high)}}
_RATES: dict[str, dict[str, tuple[float, float]]] = {
    'paving':              {'residential': (3.50, 8.00),  'commercial': (2.50, 6.00)},
    'sealcoating':         {'residential': (0.15, 0.35),  'commercial': (0.12, 0.30)},
    'crack_filling':       {'residential': (0.40, 1.00),  'commercial': (0.35, 0.90)},
    'parking_lot':         {'residential': (3.00, 7.00),  'commercial': (3.00, 7.00)},
    'driveway':            {'residential': (3.50, 7.50),  'commercial': (3.00, 6.50)},
    'maintenance':         {'residential': (0.20, 0.40),  'commercial': (0.18, 0.40)},
    'general_contracting': {'residential': (85.0, 250.0), 'commercial': (75.0, 200.0)},
    'cobblestone_pavers':  {'residential': (15.0, 55.0),  'commercial': (18.0, 60.0)},
    'stone_masonry':       {'residential': (30.0, 85.0),  'commercial': (35.0, 100.0)},
    'concrete':            {'residential': (6.0,  14.0),  'commercial': (7.0,  16.0)},
    'resurfacing':         {'residential': (2.50, 5.50),  'commercial': (2.00, 4.50)},
    'line_striping':       {'residential': (0.10, 0.25),  'commercial': (0.08, 0.20)},
    'chip_seal':           {'residential': (1.50, 3.50),  'commercial': (1.25, 3.00)},
    'milling':             {'residential': (1.00, 2.50),  'commercial': (0.80, 2.00)},
    # ── Interior remodeling ($/sqft of remodeled area) ────────────────────────
    'kitchen_remodel':     {'residential': (75.0, 250.0), 'commercial': (60.0, 200.0)},
    'bathroom_remodel':    {'residential': (120.0, 400.0),'commercial': (100.0, 300.0)},
    'basement_finish':     {'residential': (30.0, 75.0),  'commercial': (25.0, 60.0)},
    'home_addition':       {'residential': (110.0, 300.0),'commercial': (100.0, 250.0)},
    'garage_build':        {'residential': (35.0, 70.0),  'commercial': (30.0, 65.0)},
    'interior_demolition': {'residential': (2.0, 8.0),    'commercial': (2.0, 7.0)},
    'drywall':             {'residential': (1.50, 3.50),  'commercial': (1.40, 3.00)},
    'flooring':            {'residential': (4.0, 15.0),   'commercial': (3.50, 12.0)},
    'interior_painting':   {'residential': (2.0, 6.0),    'commercial': (1.50, 5.0)},
    'insulation':          {'residential': (1.0, 4.50),   'commercial': (1.0, 4.0)},
    # ── Exterior remodeling ($/sqft unless noted) ─────────────────────────────
    'roofing':             {'residential': (4.50, 12.0),  'commercial': (4.0, 10.0)},
    'siding':              {'residential': (3.0, 12.0),   'commercial': (3.0, 10.0)},
    'exterior_painting':   {'residential': (1.50, 4.50),  'commercial': (1.25, 4.0)},
    'deck_construction':   {'residential': (25.0, 65.0),  'commercial': (30.0, 70.0)},
}

# Per-state cost multiplier (1.0 = national baseline; >1.0 = higher cost market)
_STATE_MULTIPLIERS: dict[str, float] = {
    'AK': 1.45, 'HI': 1.40, 'CA': 1.30, 'NY': 1.28, 'MA': 1.25, 'CT': 1.22,
    'NJ': 1.22, 'WA': 1.20, 'OR': 1.18, 'IL': 1.15, 'MD': 1.12, 'CO': 1.12,
    'VA': 1.08, 'PA': 1.07, 'FL': 1.05, 'TX': 1.02, 'NC': 1.00, 'GA': 1.00,
    'OH': 0.98, 'MI': 0.97, 'TN': 0.96, 'SC': 0.96, 'IN': 0.95, 'WI': 0.95,
    'MN': 0.95, 'MO': 0.93, 'KY': 0.93, 'AL': 0.92, 'AR': 0.91, 'MS': 0.91,
    'IA': 0.92, 'NE': 0.91, 'KS': 0.90, 'OK': 0.90, 'LA': 0.90, 'SD': 0.89,
    'ND': 0.89, 'MT': 0.90, 'WY': 0.89, 'ID': 0.91, 'NM': 0.92, 'AZ': 1.00,
    'UT': 1.00, 'NV': 1.08, 'DE': 1.10, 'RI': 1.18, 'NH': 1.12, 'VT': 1.10,
    'ME': 1.05, 'WV': 0.93, 'DC': 1.30,
}

_MOB_FLOOR_LOW = 300.0    # minimum job low price
_MOB_FLOOR_HIGH = 600.0   # minimum job high price
_ROUND_TO = 50            # round to nearest $50


def _round50(v: float) -> float:
    return round(v / _ROUND_TO) * _ROUND_TO


def estimate_price(
    service_type: str,
    property_type: str = 'residential',
    project_size_sqft: float = 0.0,
    state_code: str = 'VA',
    material_cost_adjustment: float = 1.0,   # 1.0 = no adjustment; >1 = higher material cost
) -> dict:
    """
    Return low/high price estimate for a paving/contracting service.

    Returns {low_usd, high_usd, low_fmt, high_fmt, per_sqft_low, per_sqft_high,
             multiplier, material_note, disclaimer, service_type, property_type}
    """
    service_type = service_type.lower().replace(' ', '_')
    property_type = property_type.lower()
    state_code = state_code.upper()

    rates = _RATES.get(service_type)
    if not rates:
        available = list(_RATES.keys())
        return {'error': f'Unknown service type: {service_type}', 'available': available}

    prop_rates = rates.get(property_type) or rates.get('residential', (3.0, 7.0))
    per_sqft_low, per_sqft_high = prop_rates

    state_mult = _STATE_MULTIPLIERS.get(state_code, 1.0)
    effective_mult = state_mult * material_cost_adjustment

    if project_size_sqft > 0:
        raw_low = per_sqft_low * project_size_sqft * effective_mult
        raw_high = per_sqft_high * project_size_sqft * effective_mult
    else:
        raw_low = per_sqft_low * effective_mult * 500   # assume 500 sqft baseline
        raw_high = per_sqft_high * effective_mult * 500

    low_usd = _round50(max(raw_low, _MOB_FLOOR_LOW))
    high_usd = _round50(max(raw_high, _MOB_FLOOR_HIGH))

    material_note = ''
    if material_cost_adjustment > 1.05:
        material_note = f'Adjusted +{round((material_cost_adjustment - 1) * 100)}% for elevated material costs.'
    elif material_cost_adjustment < 0.95:
        material_note = f'Adjusted {round((material_cost_adjustment - 1) * 100)}% for favorable material market.'

    return {
        'low_usd': low_usd,
        'high_usd': high_usd,
        'low_fmt': f'${low_usd:,.0f}',
        'high_fmt': f'${high_usd:,.0f}',
        'per_sqft_low': per_sqft_low,
        'per_sqft_high': per_sqft_high,
        'project_size_sqft': project_size_sqft,
        'state_code': state_code,
        'state_multiplier': state_mult,
        'material_adjustment': material_cost_adjustment,
        'effective_multiplier': round(effective_mult, 3),
        'material_note': material_note,
        'service_type': service_type,
        'property_type': property_type,
        'disclaimer': 'Estimates are guidance only. Final pricing requires site inspection.',
    }


def list_services() -> list[str]:
    return list(_RATES.keys())


def get_state_multiplier(state_code: str) -> float:
    return _STATE_MULTIPLIERS.get(state_code.upper(), 1.0)
