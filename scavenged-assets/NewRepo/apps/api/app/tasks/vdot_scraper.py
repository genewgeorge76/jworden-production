"""Daily VDOT bid scraper task — runs at 07:00 ET via Celery Beat."""
from __future__ import annotations

import logging
from datetime import datetime, timezone

import httpx
from bs4 import BeautifulSoup

from ..celery_app import celery_app
from ..database import SessionLocal
from ..models import VdotBid

log = logging.getLogger(__name__)

VDOT_LETTING_URL = 'https://www.virginiadot.org/business/const/bids.asp'
HEADERS = {'User-Agent': 'WordenStandard-BidScraper/1.0'}


def _tier(cost: float) -> str:
    if cost >= 5_000_000:
        return 'WHALE'
    if cost >= 500_000:
        return 'SHARK'
    return 'FISH'


@celery_app.task(
    name='app.tasks.vdot_scraper.scrape_vdot_bids_task',
    bind=True,
    max_retries=2,
    default_retry_delay=300,
    queue='scrapers',
)
def scrape_vdot_bids_task(self):
    """Scrape VDOT letting page and upsert new bids into the database."""
    db = SessionLocal()
    new_count = 0
    try:
        resp = httpx.get(VDOT_LETTING_URL, headers=HEADERS, timeout=30, follow_redirects=True)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')
        rows = soup.select('table tr')

        for row in rows[1:]:  # skip header row
            cells = row.find_all('td')
            if len(cells) < 3:
                continue
            project_name = cells[0].get_text(strip=True)
            link_tag = cells[0].find('a')
            url = link_tag['href'] if link_tag and link_tag.get('href') else ''
            bid_date_str = cells[1].get_text(strip=True) if len(cells) > 1 else ''
            cost_str = cells[2].get_text(strip=True).replace('$', '').replace(',', '') if len(cells) > 2 else '0'

            try:
                estimated_cost = float(cost_str)
            except ValueError:
                estimated_cost = 0.0

            try:
                bid_date = datetime.strptime(bid_date_str, '%m/%d/%Y').replace(tzinfo=timezone.utc)
            except ValueError:
                bid_date = None

            if not project_name:
                continue

            existing = db.query(VdotBid).filter(VdotBid.project_name == project_name).first()
            if existing:
                continue

            bid = VdotBid(
                project_name=project_name,
                bid_date=bid_date,
                estimated_cost=estimated_cost,
                tier=_tier(estimated_cost),
                url=url,
                status='active',
            )
            db.add(bid)
            new_count += 1

        if new_count:
            db.commit()
        log.info('VDOT scrape: %d new bids', new_count)
        return {'new_bids': new_count}
    except Exception as exc:
        db.rollback()
        log.error('VDOT scrape failed: %s', exc)
        raise self.retry(exc=exc)
    finally:
        db.close()
