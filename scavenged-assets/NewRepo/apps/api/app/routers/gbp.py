"""Google Business Profile — post drafting, push, reviews, review request SMS."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..core.security import verify_premium_security
from ..services.gbp_service import (
    draft_gbp_post, push_gbp_post, fetch_gbp_reviews, send_review_request_sms,
)

router = APIRouter(prefix='/gbp', tags=['gbp'])


class DraftRequest(BaseModel):
    topic: str
    tenant_name: str = 'J. Worden & Sons'


class PushRequest(BaseModel):
    content: str
    location_id: str | None = None


class ReviewRequestBody(BaseModel):
    phone: str
    customer_name: str
    job_type: str = 'paving'
    review_url: str = 'https://g.page/r/YOUR_REVIEW_LINK/review'


@router.post('/draft', dependencies=[Depends(verify_premium_security)])
async def draft_post(body: DraftRequest):
    """Generate an SEO-optimized GBP post via Google Gemini."""
    content = draft_gbp_post(body.topic, body.tenant_name)
    return {'content': content, 'word_count': len(content.split())}


@router.post('/push', dependencies=[Depends(verify_premium_security)])
async def push_post(body: PushRequest):
    """Push a post to Google Business Profile. Requires GBP_OAUTH_TOKEN + GBP_LOCATION_ID."""
    result = push_gbp_post(body.content, body.location_id)
    if result.get('status') == 'error':
        raise HTTPException(502, result.get('message', 'GBP push failed'))
    return result


@router.get('/reviews', dependencies=[Depends(verify_premium_security)])
async def get_reviews(location_id: str | None = None):
    """Fetch recent GBP reviews."""
    reviews = fetch_gbp_reviews(location_id)
    return {'reviews': reviews, 'count': len(reviews)}


@router.post('/request-review', dependencies=[Depends(verify_premium_security)])
async def request_review(body: ReviewRequestBody):
    """Send an SMS review request via Twilio."""
    sent = send_review_request_sms(body.phone, body.customer_name, body.job_type, body.review_url)
    return {'sent': sent, 'phone': body.phone}
