"""
blog.py — Blog CMS router.

Routes (all under /api/v1/blog):
  GET    /             list published posts (paginated)
  GET    /{slug}       single post by slug
  POST   /draft        AI-generate a blog draft (admin)
  POST   /             create post (admin)
  PUT    /{slug}       update post (admin)
  POST   /{slug}/publish  publish/unpublish (admin)
  DELETE /{slug}       delete post (admin)
"""
from __future__ import annotations

import logging
import re
import unicodedata
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.cache import BLOG_TTL, cache_get, cache_set, invalidate_blog_caches
from ..core.limiter import BLOG_LIMIT, limiter
from ..core.security import verify_premium_security
from ..database import get_db
from ..models import BlogPost

logger = logging.getLogger(__name__)

router = APIRouter(prefix='/blog', tags=['blog'])


# ── Helpers ──────────────────────────────────────────────────────────────────

def _slugify(text: str) -> str:
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode()
    text = re.sub(r'[^\w\s-]', '', text).strip().lower()
    return re.sub(r'[-\s]+', '-', text)


def _estimate_read_time(body: str) -> int:
    words = len((body or '').split())
    return max(1, round(words / 200))


def _serialize(post: BlogPost) -> dict:
    return {
        'id': post.id,
        'slug': post.slug,
        'title': post.title,
        'excerpt': post.excerpt,
        'body': post.body,
        'meta_description': post.meta_description,
        'author': post.author,
        'status': post.status,
        'read_time_minutes': post.read_time_minutes,
        'tags': post.tags,
        'published_at': post.published_at.isoformat() if post.published_at else None,
        'created_at': post.created_at.isoformat(),
        'updated_at': post.updated_at.isoformat(),
    }


# ── Schemas ───────────────────────────────────────────────────────────────────

class BlogPostCreate(BaseModel):
    title: str
    slug: Optional[str] = None
    excerpt: Optional[str] = None
    body: Optional[str] = None
    meta_description: Optional[str] = None
    author: str = 'J. Worden & Sons'
    tags: Optional[str] = None
    status: str = 'draft'


class BlogDraftRequest(BaseModel):
    topic: str
    keywords: Optional[str] = None
    word_count: int = 600


class PublishRequest(BaseModel):
    publish: bool = True


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get('/', summary='List published blog posts')
@limiter.limit(BLOG_LIMIT)
async def list_posts(
    request: Request,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    cache_key = f'blog:list:{limit}:{offset}'
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    q = db.query(BlogPost).filter(BlogPost.status == 'published')
    total = q.count()
    posts = q.order_by(BlogPost.published_at.desc()).offset(offset).limit(limit).all()

    result = {
        'total': total,
        'offset': offset,
        'limit': limit,
        'posts': [_serialize(p) for p in posts],
    }
    cache_set(cache_key, result, BLOG_TTL)
    return result


@router.get('/{slug}', summary='Get a blog post by slug')
@limiter.limit(BLOG_LIMIT)
async def get_post(
    request: Request,
    slug: str,
    db: Session = Depends(get_db),
):
    cache_key = f'blog:post:{slug}'
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    post = db.query(BlogPost).filter(BlogPost.slug == slug, BlogPost.status == 'published').first()
    if not post:
        raise HTTPException(status_code=404, detail='Post not found')

    result = _serialize(post)
    cache_set(cache_key, result, BLOG_TTL)
    return result


@router.post('/draft', summary='AI-generate a blog draft (admin)')
@limiter.limit('5/minute')
async def generate_draft(
    request: Request,
    body: BlogDraftRequest,
    _: dict = Depends(verify_premium_security),
):
    """Generate a blog post draft using GPT-4o."""
    from ..config import settings  # noqa: PLC0415

    if not settings.openai_api_key:
        raise HTTPException(503, 'OPENAI_API_KEY not configured')

    try:
        from openai import OpenAI  # noqa: PLC0415
        client = OpenAI(api_key=settings.openai_api_key)

        kw_line = f' Include these keywords naturally: {body.keywords}.' if body.keywords else ''
        prompt = (
            f'Write a {body.word_count}-word blog post for J. Worden & Sons Asphalt Paving '
            f'about: {body.topic}.{kw_line}\n\n'
            'Format the response EXACTLY as:\n'
            'TITLE: <title>\n'
            'META_DESCRIPTION: <155-char meta description>\n'
            'EXCERPT: <2-sentence excerpt>\n'
            '---\n'
            '<full body in markdown>\n'
        )

        response = client.chat.completions.create(
            model='gpt-4o',
            messages=[
                {
                    'role': 'system',
                    'content': (
                        'You are a content writer for a Virginia asphalt paving company. '
                        'Write informative, SEO-optimized content that demonstrates expertise '
                        'in asphalt paving, sealcoating, and pavement maintenance.'
                    ),
                },
                {'role': 'user', 'content': prompt},
            ],
            max_tokens=1200,
        )

        text = response.choices[0].message.content or ''
        lines = text.split('\n')

        title = body.topic
        meta_desc = ''
        excerpt = ''
        body_lines = []
        in_body = False

        for line in lines:
            if line.startswith('TITLE:'):
                title = line[6:].strip()
            elif line.startswith('META_DESCRIPTION:'):
                meta_desc = line[17:].strip()
            elif line.startswith('EXCERPT:'):
                excerpt = line[8:].strip()
            elif line.strip() == '---':
                in_body = True
            elif in_body:
                body_lines.append(line)

        body_text = '\n'.join(body_lines).strip()

        return {
            'title': title,
            'slug': _slugify(title),
            'excerpt': excerpt,
            'body': body_text,
            'meta_description': meta_desc,
            'read_time_minutes': _estimate_read_time(body_text),
            'engine': 'gpt-4o',
        }

    except Exception as exc:
        logger.error('Blog draft generation failed: %s', exc)
        raise HTTPException(503, f'Draft generation failed: {exc}') from exc


@router.post('/', summary='Create a blog post (admin)')
@limiter.limit('10/minute')
async def create_post(
    request: Request,
    body: BlogPostCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    slug = body.slug or _slugify(body.title)
    existing = db.query(BlogPost).filter(BlogPost.slug == slug).first()
    if existing:
        raise HTTPException(409, f'Slug already exists: {slug}')

    post = BlogPost(
        slug=slug,
        title=body.title,
        excerpt=body.excerpt,
        body=body.body,
        meta_description=body.meta_description,
        author=body.author,
        tags=body.tags,
        status=body.status,
        read_time_minutes=_estimate_read_time(body.body or ''),
    )
    if body.status == 'published':
        post.published_at = datetime.now(timezone.utc)

    db.add(post)
    db.commit()
    db.refresh(post)
    invalidate_blog_caches()
    return _serialize(post)


@router.put('/{slug}', summary='Update a blog post (admin)')
@limiter.limit('10/minute')
async def update_post(
    request: Request,
    slug: str,
    body: BlogPostCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    post = db.query(BlogPost).filter(BlogPost.slug == slug).first()
    if not post:
        raise HTTPException(404, 'Post not found')

    for field, value in body.model_dump(exclude_unset=True).items():
        if field == 'slug' and value:
            value = _slugify(value)
        setattr(post, field, value)

    if body.body:
        post.read_time_minutes = _estimate_read_time(body.body)
    post.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(post)
    invalidate_blog_caches(slug)
    return _serialize(post)


@router.post('/{slug}/publish', summary='Publish or unpublish a post (admin)')
async def publish_post(
    slug: str,
    body: PublishRequest,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    post = db.query(BlogPost).filter(BlogPost.slug == slug).first()
    if not post:
        raise HTTPException(404, 'Post not found')

    post.status = 'published' if body.publish else 'draft'
    if body.publish and not post.published_at:
        post.published_at = datetime.now(timezone.utc)
    post.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(post)
    invalidate_blog_caches(slug)
    return {'slug': post.slug, 'status': post.status, 'published_at': post.published_at}


@router.delete('/{slug}', summary='Delete a blog post (admin)')
async def delete_post(
    slug: str,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    post = db.query(BlogPost).filter(BlogPost.slug == slug).first()
    if not post:
        raise HTTPException(404, 'Post not found')
    db.delete(post)
    db.commit()
    invalidate_blog_caches(slug)
    return {'deleted': True, 'slug': slug}
