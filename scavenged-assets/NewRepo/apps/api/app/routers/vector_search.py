"""Vector search — semantic blog search + knowledge base reindex."""
from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.security import verify_premium_security
from ..database import get_db
from ..services.vector_search_service import (
    search_semantic, reindex_all_blog_posts, get_index_status, delete_blog_post,
)

router = APIRouter(prefix='/search', tags=['search'])


class SearchRequest(BaseModel):
    query: str
    limit: int = 10
    status_filter: str = 'published'


@router.post('/semantic')
async def semantic_search(body: SearchRequest):
    """Semantic search over indexed blog posts and knowledge base."""
    results = search_semantic(body.query, body.limit, body.status_filter)
    return {'query': body.query, 'results': results, 'count': len(results)}


@router.get('/status', dependencies=[Depends(verify_premium_security)])
async def index_status():
    """Return Pinecone index stats."""
    return get_index_status()


@router.post('/reindex', dependencies=[Depends(verify_premium_security)])
async def reindex(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Trigger a full reindex of all published blog posts in the background."""
    background_tasks.add_task(reindex_all_blog_posts, db)
    return {'status': 'reindex_started', 'message': 'Full reindex running in background'}


@router.delete('/post/{post_id}', dependencies=[Depends(verify_premium_security)])
async def remove_post_from_index(post_id: int):
    """Remove a single post from the vector index."""
    ok = delete_blog_post(post_id)
    return {'post_id': post_id, 'removed': ok}
