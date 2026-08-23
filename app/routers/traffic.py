"""
traffic.py — per-site Search Console and Analytics.

GET /api/v1/traffic/sites — every site the caller may see, with its numbers.

The operator asked to see traffic for each individual website in the
programme, his own and his clients', so the work can be improved site by site.
Both Google clients were built for a single property, which answers "how is the
flagship doing" and cannot answer that.

Authorization is the ordinary one: services/tenancy filters the site list
before any Google call is made, so a customer cannot read another tenant's
numbers by naming their hostname.
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from ..core.limiter import limiter
from ..core.security import verify_premium_security
from ..database import get_db
from ..services import site_traffic
from ..services.tenancy import tenant_of

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/traffic", tags=["traffic"])

# Each site costs one Search Console call and one Analytics call, so a caller
# with thirty sites makes sixty upstream requests. Capped low for that reason
# rather than for abuse.
_WINDOW_MIN = 1
_WINDOW_MAX = 180


@router.get("/sites", summary="Search Console and Analytics per website")
@limiter.limit("20/minute")
def sites_traffic(
    request: Request,
    days: int = Query(28, ge=_WINDOW_MIN, le=_WINDOW_MAX),
    hostname: Optional[str] = Query(
        None, description="Limit to one site. Must be one the caller owns."
    ),
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_premium_security),
):
    """
    Traffic for every site in the caller's programme.

    A site with no numbers reports why — not connected, not granted, or
    genuinely no traffic — rather than zero. Zero is a measurement, and showing
    "not connected" as 0 clicks tells an operator his site is dead when nothing
    was actually asked.
    """
    return site_traffic.for_tenant(
        db, tenant_id=tenant_of(auth), days=days, hostname=hostname
    )
