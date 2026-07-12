"""Vector reindex task — full Pinecone reindex every Sunday at 02:00 UTC."""
from __future__ import annotations

import logging

from ..celery_app import celery_app
from ..database import SessionLocal
from ..services.vector_search_service import reindex_all_blog_posts

log = logging.getLogger(__name__)


@celery_app.task(
    name='app.tasks.vector_tasks.reindex_all_task',
    bind=True,
    max_retries=2,
    default_retry_delay=3600,
    queue='ai',
    time_limit=1800,      # 30-minute hard limit
    soft_time_limit=1500,
)
def reindex_all_task(self):
    """Reindex all published blog posts into Pinecone."""
    db = SessionLocal()
    try:
        result = reindex_all_blog_posts(db)
        log.info('Vector reindex complete: %s', result)
        return result
    except Exception as exc:
        log.error('Vector reindex failed: %s', exc)
        raise self.retry(exc=exc)
    finally:
        db.close()
