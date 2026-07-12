"""Google Business Profile — AI post drafting (Gemini) + GBP API push + review requests."""
from __future__ import annotations

import logging

import httpx

from ..config import settings

logger = logging.getLogger(__name__)

GBP_API_BASE = 'https://mybusinessposts.googleapis.com/v1'


def draft_gbp_post(topic: str, tenant_name: str = 'J. Worden & Sons') -> str:
    """Use Google Gemini to draft a GBP post (150 words, local SEO + CTA)."""
    if not settings.gemini_api_key:
        return _stub_post(topic, tenant_name)
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel('gemini-1.5-pro')
        prompt = (
            f'Write a 150-word Google Business Profile post for {tenant_name}, '
            f'a paving and general contracting company. Topic: {topic}. '
            'Requirements: local SEO focused (mention Virginia or specific city), '
            'one clear call-to-action ("Call us today" or "Get a free estimate"), '
            'friendly professional tone, no hashtags, no emojis, '
            'end with the phone number (804) 524-3000. Return only the post text.'
        )
        resp = model.generate_content(prompt)
        return resp.text.strip()
    except Exception as e:
        logger.error('Gemini draft_gbp_post failed: %s', e)
        return _stub_post(topic, tenant_name)


def _stub_post(topic: str, tenant_name: str) -> str:
    return (
        f'{tenant_name} specializes in {topic} for residential and commercial properties '
        f'across Virginia. With 40+ years of experience, our licensed crews deliver '
        f'durable results on time and on budget. Call us today for a free estimate: '
        f'(804) 524-3000.'
    )


def push_gbp_post(content: str, location_id: str | None = None) -> dict:
    """Push a drafted post to Google Business Profile API."""
    loc_id = location_id or settings.gbp_location_id
    if not settings.gbp_oauth_token or not loc_id:
        return {
            'status': 'skipped',
            'reason': 'GBP_OAUTH_TOKEN or GBP_LOCATION_ID not configured',
            'content_preview': content[:120],
        }
    url = f'{GBP_API_BASE}/{loc_id}/localPosts'
    try:
        resp = httpx.post(
            url,
            headers={
                'Authorization': f'Bearer {settings.gbp_oauth_token}',
                'Content-Type': 'application/json',
            },
            json={
                'languageCode': 'en-US',
                'summary': content,
                'topicType': 'STANDARD',
                'callToAction': {
                    'actionType': 'CALL',
                    'url': 'tel:+18045243000',
                },
            },
            timeout=15,
        )
        resp.raise_for_status()
        return {'status': 'published', 'post_name': resp.json().get('name', ''), 'location_id': loc_id}
    except Exception as e:
        logger.error('GBP push failed: %s', e)
        return {'status': 'error', 'message': str(e)}


def fetch_gbp_reviews(location_id: str | None = None) -> list[dict]:
    """Fetch recent GBP reviews."""
    loc_id = location_id or settings.gbp_location_id
    if not settings.gbp_oauth_token or not loc_id:
        return []
    try:
        url = f'https://mybusiness.googleapis.com/v4/{loc_id}/reviews'
        resp = httpx.get(
            url,
            headers={'Authorization': f'Bearer {settings.gbp_oauth_token}'},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        return [
            {
                'reviewer': r.get('reviewer', {}).get('displayName', 'Anonymous'),
                'rating': r.get('starRating', 'FIVE'),
                'comment': r.get('comment', ''),
                'create_time': r.get('createTime', ''),
            }
            for r in data.get('reviews', [])
        ]
    except Exception as e:
        logger.error('GBP reviews fetch failed: %s', e)
        return []


def send_review_request_sms(phone: str, customer_name: str, job_type: str, review_url: str) -> bool:
    """Send an SMS review request via Twilio."""
    if not settings.twilio_account_sid:
        logger.info('Twilio not configured — SMS review request suppressed for %s', phone)
        return False
    try:
        from twilio.rest import Client
        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        body = (
            f'Hi {customer_name}! Thank you for choosing J. Worden & Sons for your '
            f'{job_type} project. We\'d love a Google review — it takes 30 seconds '
            f'and means the world to our small business: {review_url}'
        )
        client.messages.create(
            body=body,
            from_=settings.twilio_from_number,
            to=phone,
        )
        return True
    except Exception as e:
        logger.error('Review request SMS failed: %s', e)
        return False
