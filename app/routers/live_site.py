"""
live_site.py — Server-Sent Events (SSE) stream for live site state.

Routes:
  GET /api/v1/live/site-stream        — SSE stream: all trucks + latest compaction
  GET /api/v1/live/site-snapshot      — One-shot JSON snapshot (same data, no stream)

The SSE stream pushes a JSON payload every 5 seconds containing:
  - All current truck positions (from TruckPosition table)
  - Latest compaction ping per roller per site (last 30 minutes)

Clients connect with EventSource:
  const es = new EventSource('/api/v1/live/site-stream', {
    headers: { 'X-API-Key': key }
  });
  es.onmessage = (e) => { const data = JSON.parse(e.data); ... };

No extra dependencies — uses FastAPI StreamingResponse with text/event-stream.
Requires premium security via query param or header (checked once at connect).
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..core.security import verify_premium_security
from ..database import get_db
from ..models import CompactionLog, TruckPosition

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/live", tags=["live-site"])

_PUSH_INTERVAL_SECONDS = 5
_COMPACTION_LOOKBACK_MINUTES = 30


# ── Snapshot builder ──────────────────────────────────────────────────────────

def _build_snapshot(db: Session) -> dict:
    """Collect current truck positions + recent compaction pings."""
    trucks = db.query(TruckPosition).all()
    cutoff = datetime.now(tz=timezone.utc) - timedelta(minutes=_COMPACTION_LOOKBACK_MINUTES)
    compaction = (
        db.query(CompactionLog)
        .filter(CompactionLog.logged_at >= cutoff)
        .order_by(CompactionLog.logged_at.desc())
        .limit(500)
        .all()
    )

    # Latest ping per roller (already ordered desc so first match wins)
    seen_rollers: set[str] = set()
    latest_compaction = []
    for c in compaction:
        key = f"{c.roller_id}:{c.project_site_id}"
        if key not in seen_rollers:
            seen_rollers.add(key)
            latest_compaction.append({
                "roller_id":      c.roller_id,
                "project_site_id": c.project_site_id,
                "lat":            c.lat,
                "lng":            c.lng,
                "density_pct":    c.density_pct,
                "pass_number":    c.pass_number,
                "mat_temp_f":     c.mat_temp_f,
                "logged_at":      c.logged_at.isoformat() if c.logged_at else None,
            })

    return {
        "ts": datetime.now(tz=timezone.utc).isoformat(),
        "trucks": [
            {
                "truck_id":       t.truck_id,
                "driver":         t.driver_name,
                "lat":            t.lat,
                "lng":            t.lng,
                "speed_mph":      t.speed_mph,
                "asphalt_temp_f": t.asphalt_temp_f,
                "mix_type":       t.mix_type,
                "status":         t.status,
                "site_id":        t.site_id,
                "eta_min":        t.estimated_arrival_minutes,
                "updated_at":     t.updated_at.isoformat() if t.updated_at else None,
            }
            for t in trucks
        ],
        "compaction": latest_compaction,
    }


# ── SSE generator ─────────────────────────────────────────────────────────────

async def _event_generator(request: Request, db: Session) -> AsyncGenerator[str, None]:
    """Yield SSE-formatted events until the client disconnects."""
    logger.info("SSE client connected: %s", request.client)
    try:
        while True:
            if await request.is_disconnected():
                logger.info("SSE client disconnected: %s", request.client)
                break

            snapshot = _build_snapshot(db)
            payload = json.dumps(snapshot, default=str)
            yield f"data: {payload}\n\n"

            await asyncio.sleep(_PUSH_INTERVAL_SECONDS)
    except asyncio.CancelledError:
        logger.info("SSE stream cancelled for %s", request.client)
    finally:
        db.close()


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/site-stream")
async def live_site_stream(
    request: Request,
    _: dict = Depends(verify_premium_security),
    db: Session = Depends(get_db),
):
    """
    Server-Sent Events stream.  Pushes truck positions + compaction every 5 s.

    Connect with the browser EventSource API:
      const es = new EventSource('/api/v1/live/site-stream?api_key=YOUR_KEY');
    """
    return StreamingResponse(
        _event_generator(request, db),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",     # disable Nginx buffering
            "Connection": "keep-alive",
        },
    )


@router.get("/site-snapshot", dependencies=[Depends(verify_premium_security)])
def live_site_snapshot(db: Session = Depends(get_db)):
    """
    One-shot JSON snapshot of current trucks + recent compaction pings.

    Useful for initial page load before the SSE connection is established,
    or for polling clients that cannot use EventSource.
    """
    return _build_snapshot(db)
