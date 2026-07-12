"""Virginia permit scraper task — runs every 6 hours via Celery Beat."""
from __future__ import annotations

import logging
from datetime import datetime, timezone

import httpx

from ..celery_app import celery_app
from ..database import SessionLocal
from ..models import PermitLead

log = logging.getLogger(__name__)

VPT_BASE = 'https://permits.virginiatransparency.gov/api'


def _score(p: dict) -> tuple[int, str]:
    score = 50
    value = p.get('projectValue') or 0
    if isinstance(value, (int, float)):
        if value >= 100_000:
            score += 30
        elif value >= 25_000:
            score += 15
        elif value >= 5_000:
            score += 5
    permit_type = str(p.get('permitType', '')).lower()
    if any(k in permit_type for k in ['pav', 'asphalt', 'driveway', 'parking', 'road']):
        score += 20
    if not p.get('contractorName') or not p.get('contractorLicense'):
        score += 10
    score = min(100, score)
    label = 'HOT' if score >= 75 else 'WARM' if score >= 50 else 'COOL'
    return score, label


@celery_app.task(
    name='app.tasks.permit_scraper.scrape_permits_task',
    bind=True,
    max_retries=3,
    default_retry_delay=600,
    queue='scrapers',
)
def scrape_permits_task(self, max_results: int = 200):
    """Fetch VPT permits and upsert new PermitLead rows."""
    db = SessionLocal()
    new_count = 0
    try:
        resp = httpx.get(
            f'{VPT_BASE}/permits',
            params={'pageSize': max_results, 'permitType': 'construction'},
            timeout=30,
            follow_redirects=True,
        )
        resp.raise_for_status()
        permits = resp.json().get('data', [])
    except Exception as exc:
        log.warning('VPT scrape request failed: %s', exc)
        permits = []

    try:
        for p in permits:
            pnum = p.get('permitNumber') or p.get('permit_number')
            if not pnum:
                continue
            if db.query(PermitLead).filter(PermitLead.permit_number == str(pnum)).first():
                continue
            score, label = _score(p)
            issued = p.get('issuedDate')
            lead = PermitLead(
                source='vpt',
                permit_number=str(pnum),
                permit_type=p.get('permitType'),
                permit_status=p.get('status'),
                contractor_name=p.get('contractorName'),
                contractor_license=p.get('contractorLicense'),
                property_address=p.get('address'),
                property_city=p.get('city'),
                property_state=p.get('state', 'VA'),
                property_zip=p.get('zip'),
                project_value=p.get('projectValue'),
                permit_date=datetime.fromisoformat(issued).replace(tzinfo=timezone.utc) if issued else None,
                priority_score=score,
                priority_label=label,
                raw_json=str(p),
            )
            db.add(lead)
            new_count += 1

        if new_count:
            db.commit()
        log.info('Permit scrape: %d new leads', new_count)
        return {'new_permits': new_count}
    except Exception as exc:
        db.rollback()
        log.error('Permit scrape DB error: %s', exc)
        raise self.retry(exc=exc)
    finally:
        db.close()
