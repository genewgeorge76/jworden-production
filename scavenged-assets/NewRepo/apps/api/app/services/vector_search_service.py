"""Pinecone vector search + OpenAI embedding service."""
from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


def _get_client():
    """Lazy Pinecone client — returns None if not configured."""
    from ..config import settings
    if not settings.pinecone_api_key:
        return None, None
    try:
        from pinecone import Pinecone
        pc = Pinecone(api_key=settings.pinecone_api_key)
        idx = pc.Index(settings.pinecone_index_name)
        return pc, idx
    except Exception as e:
        logger.warning('Pinecone unavailable: %s', e)
        return None, None


def _embed(text: str) -> list[float] | None:
    """Embed text with OpenAI text-embedding-3-small (1536 dims)."""
    from ..config import settings
    if not settings.openai_api_key:
        return None
    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.openai_api_key)
        resp = client.embeddings.create(model='text-embedding-3-small', input=text[:8000])
        return resp.data[0].embedding
    except Exception as e:
        logger.warning('Embedding failed: %s', e)
        return None


def _build_document_text(title: str, excerpt: str | None, body: str | None) -> str:
    parts = [title]
    if excerpt:
        parts.append(excerpt)
    if body:
        parts.append(body[:4000])
    return '\n\n'.join(parts)


def index_blog_post(
    post_id: int,
    title: str,
    body: str | None,
    excerpt: str | None,
    slug: str,
    tags: str | None = None,
    status: str = 'published',
) -> bool:
    """Embed and upsert a blog post into Pinecone. Returns True on success."""
    _, idx = _get_client()
    if idx is None:
        logger.debug('Pinecone not configured — skipping index_blog_post(%s)', post_id)
        return False
    embedding = _embed(_build_document_text(title, excerpt, body))
    if embedding is None:
        return False
    try:
        idx.upsert(vectors=[{
            'id': f'blog-{post_id}',
            'values': embedding,
            'metadata': {
                'post_id': post_id,
                'title': title,
                'excerpt': excerpt or '',
                'slug': slug,
                'tags': tags or '',
                'status': status,
                'type': 'blog_post',
            },
        }])
        return True
    except Exception as e:
        logger.error('Pinecone upsert failed: %s', e)
        return False


def delete_blog_post(post_id: int) -> bool:
    _, idx = _get_client()
    if idx is None:
        return False
    try:
        idx.delete(ids=[f'blog-{post_id}'])
        return True
    except Exception as e:
        logger.error('Pinecone delete failed: %s', e)
        return False


def search_semantic(query: str, limit: int = 10, filter_status: str = 'published') -> list[dict]:
    """Semantic search over indexed documents. Returns list of {post_id, title, excerpt, slug, score}."""
    _, idx = _get_client()
    if idx is None:
        return []
    embedding = _embed(query)
    if embedding is None:
        return []
    try:
        result = idx.query(
            vector=embedding,
            top_k=limit,
            filter={'status': filter_status},
            include_metadata=True,
        )
        return [
            {
                'post_id': m.metadata.get('post_id'),
                'title': m.metadata.get('title', ''),
                'excerpt': m.metadata.get('excerpt', ''),
                'slug': m.metadata.get('slug', ''),
                'tags': m.metadata.get('tags', ''),
                'score': round(m.score, 4),
            }
            for m in (result.matches or [])
        ]
    except Exception as e:
        logger.error('Pinecone query failed: %s', e)
        return []


def reindex_all_blog_posts(db: Any) -> dict:
    """Full reindex of all published blog posts. Returns {total, indexed, failed, skipped}."""
    from ..models import BlogPost
    posts = db.query(BlogPost).filter(BlogPost.status == 'published').all()
    total = len(posts)
    indexed = 0
    failed = 0
    skipped = 0
    for p in posts:
        ok = index_blog_post(p.id, p.title, p.body, p.excerpt, p.slug, p.tags, p.status)
        if ok:
            indexed += 1
        elif ok is False and _get_client()[1] is None:
            skipped += 1
        else:
            failed += 1
    return {'total': total, 'indexed': indexed, 'failed': failed, 'skipped': skipped}


def get_index_status() -> dict:
    _, idx = _get_client()
    if idx is None:
        return {'status': 'not_configured', 'message': 'Set PINECONE_API_KEY to enable vector search'}
    try:
        stats = idx.describe_index_stats()
        return {
            'status': 'ok',
            'total_vectors': stats.total_vector_count,
            'dimension': stats.dimension,
            'namespaces': dict(stats.namespaces or {}),
        }
    except Exception as e:
        return {'status': 'error', 'message': str(e)}
