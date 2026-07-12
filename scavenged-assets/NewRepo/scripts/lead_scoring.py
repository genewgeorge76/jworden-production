"""
Hourly lead scoring — run by GitHub Actions on cron.
Fetches unscored leads from the API, scores them via Claude, patches back.
"""
import os
import sys
import httpx
import anthropic

API_BASE = os.environ.get('JWORDEN_API_URL', 'https://api.jwordenasphaltpaving.com')
ANTHROPIC_API_KEY = os.environ['ANTHROPIC_API_KEY']

WHALE_SIGNALS = ['federal', 'usace', 'highway', 'dot', 'vdot', 'airport', 'state contract']
SHARK_SIGNALS = ['commercial', 'parking lot', 'shopping center', 'municipality', 'county', 'school']


def score_lead(lead: dict) -> tuple[str, str, int]:
    """Returns (tier, icon, score 0-100)."""
    text = ' '.join(filter(None, [lead.get('service', ''), lead.get('description', ''), lead.get('address', '')])).lower()
    val = lead.get('estimated_value', 0) or 0

    whale = sum(1 for s in WHALE_SIGNALS if s in text)
    shark = sum(1 for s in SHARK_SIGNALS if s in text)

    if whale or val >= 500_000:
        tier, icon = 'whale', '🐋'
        score = min(95, 70 + whale * 8)
    elif shark or val >= 50_000:
        tier, icon = 'shark', '🦈'
        score = min(80, 55 + shark * 8)
    else:
        tier, icon = 'fish', '🐟'
        score = 40

    return tier, icon, score


def main():
    client = httpx.Client(timeout=30)
    headers = {'X-API-Key': os.environ.get('JWORDEN_MASTER_KEY', '')}

    # Fetch new/unscored leads
    resp = client.get(f'{API_BASE}/api/v1/leads/?status=new&limit=100', headers=headers)
    if resp.status_code != 200:
        print(f'ERROR fetching leads: {resp.status_code}', file=sys.stderr)
        sys.exit(1)

    leads = resp.json()
    scored = 0
    for lead in leads:
        if lead.get('score') is not None:
            continue
        tier, icon, score = score_lead(lead)
        patch = client.patch(
            f'{API_BASE}/api/v1/leads/{lead["id"]}',
            json={'tier': tier, 'score': score},
            headers=headers,
        )
        if patch.status_code == 200:
            scored += 1
            print(f'  {icon}  {lead["id"]} → {tier} (score {score})')
        else:
            print(f'  WARN: patch failed for {lead["id"]}', file=sys.stderr)

    print(f'Done: {scored}/{len(leads)} leads scored.')


if __name__ == '__main__':
    main()
