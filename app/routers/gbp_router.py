"""
gbp_router.py — Google Business Profile Admin Integration Routes
"""

from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Optional
from .search_pulse_router import _require_owner
from ..services import gbp_automation

router = APIRouter(prefix="/api/v1/admin/gbp", tags=["admin-gbp"], include_in_schema=False)

@router.post("/draft")
async def draft_post(topic: str = Body(embed=True), _: str = Depends(_require_owner)):
    """Generate a Gemini drafted SEO optimized GBP Post."""
    result = await gbp_automation.draft_gbp_post(topic)
    if not result["ok"]:
        raise HTTPException(status_code=500, detail=result.get("reason", "Unknown fail"))
    return result

@router.post("/push")
async def push_post(location_id: str = Body(embed=True), content: str = Body(embed=True), _: str = Depends(_require_owner)):
    """Push a draft post to GBP via Google APIs."""
    result = await gbp_automation.push_gbp_post(location_id, content)
    if not result["ok"]:
         raise HTTPException(status_code=500, detail=result.get("reason", "Push failed"))
    return result

@router.get("/reviews/{location_id}")
async def get_reviews(location_id: str, _: str = Depends(_require_owner)):
    """Fetch the latest Google reviews for a location."""
    result = await gbp_automation.fetch_gbp_reviews(location_id)
    if not result["ok"]:
         raise HTTPException(status_code=500, detail=result.get("reason", "Fetch failed"))
    return result

@router.post("/request-review")
async def request_review(
    phone: str = Body(embed=True),
    customer_name: str = Body(embed=True),
    job_type: str = Body(embed=True),
    location: str = Body(embed=True),
    _: str = Depends(_require_owner)
):
    """Send SMS review request via Twilio."""
    result = await gbp_automation.send_review_request_sms(phone, customer_name, job_type, location)
    if not result["ok"]:
        raise HTTPException(status_code=500, detail=result.get("reason", "SMS Request failed"))
    return result
