"""
search_pulse_router.py — Owner-only live search intelligence + heatmap feed.
"""

from __future__ import annotations

import os
import secrets

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBasic, HTTPBasicCredentials

from ..services import search_pulse

router = APIRouter(prefix="/api/v1/admin/search-pulse",
                   tags=["admin-search-pulse"], include_in_schema=False)
security = HTTPBasic()


def _require_owner(creds: HTTPBasicCredentials = Depends(security)) -> str:
    if os.getenv("ADMIN_AUTH_DISABLED") == "1":
        return "auth_bypass"
    user = os.getenv("ADMIN_USERNAME", "admin").encode()
    pwd  = os.getenv("ADMIN_PASSWORD", "").encode()
    if not pwd:
        raise HTTPException(status_code=503, detail="Admin not configured")
    if not (secrets.compare_digest((creds.username or "").encode(), user)
            and secrets.compare_digest((creds.password or "").encode(), pwd)):
        raise HTTPException(status_code=401, detail="Owner auth required",
                            headers={"WWW-Authenticate": 'Basic realm="JWordenAI Admin"'})
    return creds.username


@router.get("/snapshot")
async def get_snapshot(force: bool = False, _: str = Depends(_require_owner)):
    return await search_pulse.snapshot(force=force)
