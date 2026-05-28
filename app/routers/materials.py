"""
materials.py — Real-time commodity price index endpoints for JWordenAI.

Routes:
  GET /api/v1/materials/price-index — current asphalt price index (legacy, internal)
  GET /api/v1/materials/commodities — full commodity feed (asphalt, WTI, diesel, natgas)

Requires premium security — internal pricing intelligence.
"""

from fastapi import APIRouter, Depends, Request

from ..core.limiter import limiter
from ..core.security import verify_premium_security
from ..services.material_prices import fetch_asphalt_price_index, fetch_commodity_prices

router = APIRouter(prefix="/api/v1/materials", tags=["materials"])


@router.get("/price-index", summary="Current asphalt/petroleum price index")
@limiter.limit("30/minute")
async def asphalt_price_index(request: Request, _: dict = Depends(verify_premium_security)):
    """
    Return the current asphalt/road oil price from the EIA Weekly Petroleum Report.
    Includes baseline price, current multiplier, and pricing recommendation.
    Requires EIA_API_KEY env var; falls back gracefully if unavailable.
    """
    data = fetch_asphalt_price_index()
    return {"status": "ok", **data}


@router.get("/commodities", summary="Live multi-commodity price feed (asphalt, WTI, diesel, natgas)")
@limiter.limit("30/minute")
async def commodity_feed(request: Request, _: dict = Depends(verify_premium_security)):
    """
    Return the full live commodity price feed used by the pricing engine.
    Each commodity has its own baseline, multiplier, and graceful fallback.
    """
    data = fetch_commodity_prices()
    return {"status": "ok", **data}

