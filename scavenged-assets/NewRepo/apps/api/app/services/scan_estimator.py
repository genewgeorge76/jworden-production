"""Estimate generator for scan campaign properties.

Maps recommended services → pricing_engine.estimate_price(),
accounting for lot size and state multiplier.
"""
from __future__ import annotations

from dataclasses import dataclass

from .pricing_engine import estimate_price

# Map service label → (pricing_engine service_type, property_type, driveway_fraction)
# driveway_fraction: portion of lot_size_sqft assumed to be the target surface
_SERVICE_MAP: dict[str, tuple[str, str, float]] = {
    'driveway resurfacing':    ('paving',            'residential', 0.30),
    'crack filling':           ('crack_filling',     'residential', 0.30),
    'sealcoating':             ('sealcoating',       'residential', 0.30),
    'parking lot paving':      ('parking_lot',       'commercial',  0.60),
    'milling and overlay':     ('milling',           'commercial',  0.50),
    'concrete repair':         ('concrete',          'residential', 0.25),
    'drainage correction':     ('grading',           'residential', 0.35),
    'maintenance inspection':  ('maintenance',       'residential', 0.30),
    'chip seal':               ('chip_seal',         'residential', 0.30),
    'line striping':           ('line_striping',     'commercial',  0.60),
}

_DEFAULT_SERVICE = ('sealcoating', 'residential', 0.30)
_MIN_SQFT = 400.0


@dataclass
class PropertyEstimate:
    service_label: str
    service_type: str
    property_type: str
    sqft: float
    estimate_low: float
    estimate_high: float
    state_code: str
    multiplier: float


def estimate_for_property(
    services_recommended: list[str],
    lot_size_sqft: float,
    state_code: str,
) -> PropertyEstimate:
    """Generate a price estimate for the top recommended service on a parcel."""
    # Pick first recognisable service from recommendations
    service_label = ''
    mapping = _DEFAULT_SERVICE
    for svc in services_recommended:
        key = svc.lower().strip()
        if key in _SERVICE_MAP:
            service_label = svc
            mapping = _SERVICE_MAP[key]
            break

    if not service_label:
        service_label = services_recommended[0] if services_recommended else 'sealcoating'
        mapping = _SERVICE_MAP.get(service_label.lower(), _DEFAULT_SERVICE)

    service_type, property_type, fraction = mapping
    sqft = max(lot_size_sqft * fraction, _MIN_SQFT)

    result = estimate_price(
        service_type=service_type,
        property_type=property_type,
        project_size_sqft=sqft,
        state_code=state_code or 'VA',
    )

    return PropertyEstimate(
        service_label=service_label,
        service_type=service_type,
        property_type=property_type,
        sqft=sqft,
        estimate_low=result.get('low_usd', 300.0),
        estimate_high=result.get('high_usd', 600.0),
        state_code=state_code or 'VA',
        multiplier=result.get('state_multiplier', 1.0),
    )
