"""
materials.py — Real-time commodity price index endpoints for JWordenAI.

Routes:
  GET /api/v1/materials/price-index — current asphalt price index (legacy, internal)
  GET /api/v1/materials/commodities — full commodity feed (asphalt, WTI, diesel, natgas)

This is the "Supply Chain Pricing API" the published price list sells on the
MAX plan. It was authenticated but not tier-gated, so every signed-in tenant
had it — including LITE customers at $199 who were not sold it. Authentication
answers "are you a customer"; the entitlement check answers "did you buy this".
"""

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from ..core.limiter import limiter
from ..core.security import verify_premium_security
from ..database import get_db
from ..services.entitlements import require_tier
from ..services.material_prices import fetch_asphalt_price_index, fetch_commodity_prices
from ..services.tenancy import tenant_of

router = APIRouter(prefix="/api/v1/materials", tags=["materials"])


@router.get("/price-index", summary="Current asphalt/petroleum price index")
@limiter.limit("30/minute")
async def asphalt_price_index(
    request: Request,
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    """
    Return the current asphalt/road oil price from the EIA Weekly Petroleum Report.
    Includes baseline price, current multiplier, and pricing recommendation.
    Requires EIA_API_KEY env var; falls back gracefully if unavailable.
    """
    require_tier(db, tenant_of(auth), "max", "Supply Chain Pricing")
    data = fetch_asphalt_price_index()
    return {"status": "ok", **data}


@router.get("/commodities", summary="Live multi-commodity price feed (asphalt, WTI, diesel, natgas)")
@limiter.limit("30/minute")
async def commodity_feed(
    request: Request,
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    """
    Return the full live commodity price feed used by the pricing engine.
    Each commodity has its own baseline, multiplier, and graceful fallback.
    """
    require_tier(db, tenant_of(auth), "max", "Supply Chain Pricing")
    data = fetch_commodity_prices()
    return {"status": "ok", **data}

