"""
VDOT bid opportunity scraper.
Checks VDOT eVA procurement portal for new paving/asphalt solicitations
and posts them to Slack or the ops dashboard.
Run manually or via cron.
"""
import os
import sys
import re
import httpx

SLACK_WEBHOOK = os.environ.get('SLACK_WEBHOOK_URL', '')
JWORDEN_API_URL = os.environ.get('JWORDEN_API_URL', '')

VDOT_SEARCH_URL = 'https://eva.virginia.gov/index.html'

KEYWORDS = ['asphalt', 'paving', 'milling', 'overlay', 'resurfacing', 'chip seal', 'microsurfacing', 'pavement']


def fetch_opportunities() -> list[dict]:
    """
    Placeholder — eVA requires a logged-in session for full results.
    Replace with Selenium/Playwright scrape or eVA API when credentials available.
    """
    print('INFO: VDOT eVA scraper is a stub — implement with eVA credentials or API access.')
    return [
        {
            'id': 'STUB-001',
            'title': 'Route 1 Overlay — Chesterfield County',
            'issuer': 'VDOT Richmond District',
            'due': '2026-07-15',
            'estimated_value': 850_000,
            'url': VDOT_SEARCH_URL,
        }
    ]


def notify_slack(opp: dict):
    if not SLACK_WEBHOOK:
        return
    text = f"🐋 *New VDOT Opportunity*\n*{opp['title']}*\nIssuer: {opp['issuer']}\nDue: {opp['due']}\nEst. Value: ${opp['estimated_value']:,.0f}\n{opp['url']}"
    httpx.post(SLACK_WEBHOOK, json={'text': text})


def main():
    opps = fetch_opportunities()
    for opp in opps:
        print(f"  🔍 {opp['id']}: {opp['title']} — ${opp['estimated_value']:,.0f}")
        notify_slack(opp)


if __name__ == '__main__':
    main()
