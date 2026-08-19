"""
Live telematics snapshot for the cockpit command centre.

WHY THIS ROUTER EXISTS

apps/cockpit polls GET /api/v1/telematics/live every three seconds and, until
now, gated its *entire* UI on the response — while the call failed it rendered
"INITIALIZING SYSTEM ARCHITECTURE..." and nothing else. The endpoint did not
exist (404, absent from all 348 documented paths), so that condition never
cleared and all eleven modules sat behind a loading screen forever.

WHY IT DOES NOT USE TelematicsEngine

app/jarvis_os/abilities/FleetAndLogistics/telematics.py already produces a
payload in exactly this shape, and wiring it up would have been a one-line
import. It is a simulator: it imports `random`, describes itself as
"Simulates real-time V2X telemetry", carries a hardcoded fleet of units
101/44/45 and a hardcoded crew at 82 and 140 bpm, and jitters every figure
through `_fluctuate()` on each call.

Feeding that to the dashboard would put invented truck IDs, invented crew
heart rates and a random walk labelled "asphalt price" in front of an operator
who has no way to tell them from measurements. A number on a command screen is
read as a fact about the world. So every value below comes from a real source,
and anything without one is reported absent rather than filled in:

    fleet   → truck_positions rows (the same table /api/v1/geo/trucks serves)
    price   → material_prices.fetch_asphalt_price_index() (BLS PPI, carries
              its own `source` field so a fallback is visible as a fallback)
    scans   → ground_scan_reports rows
    crew    → crew_wearables webhook store
    escrow  → payment_transactions rows

Each section carries `available`. A section with no data returns
available=false and null values — never a placeholder that reads like a
reading. `fuel_saved_pct` has no telemetry source at all and is reported as
null; there is nothing in the schema that measures it.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..core.security import verify_premium_security
from ..database import get_db
from ..models import GroundScanReport, PaymentTransaction, TruckPosition

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/telematics", tags=["telematics"])


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _fleet(db: Session) -> dict[str, Any]:
    """Live truck positions. Same rows /api/v1/geo/trucks returns."""
    try:
        trucks = db.query(TruckPosition).order_by(TruckPosition.truck_id).all()
    except Exception as exc:  # noqa: BLE001
        logger.warning("telematics: truck_positions unavailable: %s", exc)
        return {"available": False, "reason": "query_failed", "units": []}

    return {
        "available": bool(trucks),
        "reason": None if trucks else "no_truck_positions_recorded",
        "units": [
            {
                "id": t.truck_id,
                "driver": t.driver_name,
                "lat": t.lat,
                "lng": t.lng,
                "speed_mph": t.speed_mph,
                "heading_deg": t.heading_deg,
                "asphalt_temp_f": t.asphalt_temp_f,
                "mix_type": t.mix_type,
                "plant_departed_at": t.plant_departed_at.isoformat() if t.plant_departed_at else None,
            }
            for t in trucks
        ],
    }


def _asphalt_price() -> dict[str, Any]:
    """
    Commodity index. Keeps the upstream `source` so a fallback stays visible.

    `available` is False when the feed fell back to its baseline constant.
    A baseline is a reference level, not an observation — reporting it as a
    live index would put a hardcoded number on the dashboard under a
    "current price" label.
    """
    try:
        from ..services.material_prices import fetch_asphalt_price_index  # noqa: PLC0415

        idx = fetch_asphalt_price_index()
        live = idx.get("source") not in (None, "fallback")
        return {
            "available": live,
            "index_value": idx.get("index_value") if live else None,
            "unit": idx.get("unit"),
            "label": idx.get("label"),
            "pct_change": idx.get("pct_change") if live else None,
            "as_of_date": idx.get("as_of_date"),
            "source": idx.get("source"),
            "reason": None if live else idx.get("status_message"),
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("telematics: price index unavailable: %s", exc)
        return {"available": False, "index_value": None, "unit": None, "source": None,
                "reason": "price_feed_unreachable"}


def _scans(db: Session) -> dict[str, Any]:
    """Ground scan reports filed in the trailing 24h, and lifetime total."""
    try:
        since = _utcnow() - timedelta(hours=24)
        total = db.query(GroundScanReport).count()
        recent = (
            db.query(GroundScanReport)
            .filter(GroundScanReport.created_at >= since)
            .count()
            if hasattr(GroundScanReport, "created_at")
            else None
        )
        return {"available": True, "total": total, "last_24h": recent}
    except Exception as exc:  # noqa: BLE001
        logger.warning("telematics: ground_scan_reports unavailable: %s", exc)
        return {"available": False, "total": None, "last_24h": None}


def _crew() -> dict[str, Any]:
    """Wearable readings, only if a device has actually reported."""
    try:
        from ..services import crew_wearables as cw  # noqa: PLC0415

        snap = cw.snapshot()
        crews = {cid: c for cid, c in (snap.get("crews") or {}).items() if c.get("latest")}
        return {
            "available": bool(crews),
            "reason": None if crews else "no_wearable_data_received",
            "crews": crews,
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("telematics: crew wearables unavailable: %s", exc)
        return {"available": False, "reason": "service_unavailable", "crews": {}}


def _escrow(db: Session) -> dict[str, Any]:
    """Cleared vs pending payment totals."""
    try:
        rows = db.query(PaymentTransaction.status, PaymentTransaction.amount_usd).all()
        cleared = sum(a or 0 for s, a in rows if (s or "").lower() in {"paid", "succeeded", "complete", "completed"})
        pending = sum(a or 0 for s, a in rows if (s or "").lower() in {"pending", "open", "processing", "requires_payment_method"})
        return {"available": True, "cleared_usd": round(cleared, 2), "pending_usd": round(pending, 2), "transactions": len(rows)}
    except Exception as exc:  # noqa: BLE001
        logger.warning("telematics: payment_transactions unavailable: %s", exc)
        return {"available": False, "cleared_usd": None, "pending_usd": None, "transactions": None}


@router.get("/live", summary="Live operational snapshot from recorded sources")
def live_snapshot(
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
) -> dict[str, Any]:
    fleet = _fleet(db)
    price = _asphalt_price()
    scans = _scans(db)
    crew = _crew()
    escrow = _escrow(db)

    return {
        "status": "success",
        "generated_at": _utcnow().isoformat(),
        # Every figure traces to a stored row or a priced feed. Nothing here is
        # generated, and no field is populated to avoid looking empty.
        "simulated": False,
        "kpi": {
            "active_trucks": len(fleet["units"]) if fleet["available"] else None,
            "asphalt_index": price["index_value"],
            "asphalt_index_unit": price.get("unit"),
            "asphalt_index_source": price.get("source"),
            "scans_total": scans["total"],
            "scans_last_24h": scans["last_24h"],
            # No telemetry in the schema measures fuel savings. Reported as
            # absent rather than estimated — an invented efficiency figure is
            # exactly the kind of number that gets quoted back in a bid.
            "fuel_saved_pct": None,
        },
        "fleet": fleet,
        "crew": crew,
        "escrow": escrow,
        "price": price,
    }
