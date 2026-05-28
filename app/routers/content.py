"""
Public read-only API for CMS content blocks managed through the admin dashboard.

Endpoints:
  GET /api/v1/content        → all published blocks as a key→object map
  GET /api/v1/content/{key}  → single block by key

These endpoints are intentionally read-only and require no authentication.
They serve only the title, body, and meta_json — no admin data, lead scores,
or internal fields are ever exposed.
"""

import json
import logging

from fastapi import APIRouter, HTTPException, Request
from sqlalchemy.orm import Session
from fastapi import Depends

from ..core.limiter import limiter
from ..database import get_db
from ..models import PageContent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/content", tags=["content"])


def _serialize_block(block: PageContent) -> dict:
    meta = None
    if block.meta_json:
        try:
            meta = json.loads(block.meta_json)
        except json.JSONDecodeError:
            logger.warning("Invalid meta_json on content block key=%s", block.key)
    return {
        "key": block.key,
        "title": block.title,
        "body": block.body,
        "meta": meta,
        "updated_at": block.updated_at.isoformat() if block.updated_at else None,
    }


@router.get("", summary="List all content blocks")
@limiter.limit("60/minute")
def list_content(request: Request, db: Session = Depends(get_db)):
    """
    Returns all content blocks as a map of { key: { title, body, meta, updated_at } }.
    The frontend can fetch this once per page load and cache it locally.
    """
    blocks = db.query(PageContent).order_by(PageContent.key).all()
    return {block.key: _serialize_block(block) for block in blocks}


@router.get("/{key}", summary="Get a single content block by key")
@limiter.limit("120/minute")
def get_content(key: str, request: Request, db: Session = Depends(get_db)):
    """
    Returns a single content block by its key.
    Returns 404 if the block does not exist — the frontend should fall back
    to its hardcoded default in that case.
    """
    block = db.query(PageContent).filter(PageContent.key == key).first()
    if not block:
        raise HTTPException(status_code=404, detail=f"Content block '{key}' not found")
    return _serialize_block(block)
