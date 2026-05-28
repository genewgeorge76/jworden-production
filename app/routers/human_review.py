"""
human_review.py — Human-in-the-loop verification queue.

When the AI engine's confidence falls below HUMAN_REVIEW_THRESHOLD (default 0.75),
the decision is saved to HumanReviewQueue for Mr. Worden or an admin to review.

Endpoints
─────────
GET    /api/v1/review/queue             List pending items (newest first)
GET    /api/v1/review/queue/{id}        Get a single item
POST   /api/v1/review/queue/{id}/approve  Approve + optional corrected answer
POST   /api/v1/review/queue/{id}/reject   Reject with notes
GET    /api/v1/review/stats             Queue statistics

All endpoints require premium security header.
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.security import verify_premium_security
from ..core.limiter import limiter
from ..database import get_db
from ..models import HumanReviewQueue

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/review", tags=["human-review"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class ReviewDecision(BaseModel):
    reviewer_notes:   Optional[str] = None
    corrected_answer: Optional[str] = None
    pin:              Optional[str] = None  # 4-digit operator PIN (required when ESTIMATE_APPROVAL_PIN is set)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_item_or_404(db: Session, item_id: int) -> HumanReviewQueue:
    item = db.get(HumanReviewQueue, item_id)
    if not item:
        raise HTTPException(404, "Review item not found")
    return item


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/queue", summary="List items pending human review")
@limiter.limit("60/minute")
async def list_queue(
    request:       Request,
    status:        str           = Query(default="pending", max_length=20),
    decision_type: Optional[str] = Query(default=None, max_length=60),
    limit:         int           = Query(default=50, ge=1, le=200),
    offset:        int           = Query(default=0,  ge=0),
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    q = db.query(HumanReviewQueue).filter(HumanReviewQueue.status == status)
    if decision_type:
        q = q.filter(HumanReviewQueue.decision_type == decision_type)
    total = q.count()
    items = q.order_by(HumanReviewQueue.created_at.desc()).offset(offset).limit(limit).all()
    return {"total": total, "status": status, "items": items}


@router.get("/queue/{item_id}", summary="Get a single review item")
async def get_item(
    item_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    return _get_item_or_404(db, item_id)


@router.post("/queue/{item_id}/approve", summary="Approve an AI decision")
async def approve_item(
    item_id: int,
    body: ReviewDecision,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    item = _get_item_or_404(db, item_id)
    if item.status != "pending":
        raise HTTPException(400, f"Item is already '{item.status}'")

    # Dashboard PIN gate: when JWORDEN_DASHBOARD_PIN / ESTIMATE_APPROVAL_PIN
    # is configured, the 4-digit code must accompany every approval.
    from ..services.estimate_approval import (  # noqa: PLC0415
        PROPOSAL_DECISION_TYPE, dispatch_approved_proposal, pin_required, verify_pin,
    )
    if pin_required() and not verify_pin(body.pin):
        raise HTTPException(403, "Invalid or missing 4-digit dashboard PIN")

    item.status           = "approved"
    item.reviewer_note    = body.reviewer_notes
    item.resolved_at      = datetime.now(timezone.utc)
    db.commit()

    # If this approval represents a staged customer-facing send (proposal /
    # estimate), dispatch it now. Failure of dispatch must not roll back
    # the approval — operator can use a re-send endpoint.
    dispatch_result = None
    try:
        if item.decision_type == PROPOSAL_DECISION_TYPE:
            dispatch_ok = dispatch_approved_proposal(item)
            dispatch_result = "sent" if dispatch_ok else "send_failed"
            # Annotate review item with dispatch outcome for audit
            existing_note = item.reviewer_note or ""
            item.reviewer_note = (existing_note + f"\n[dispatch: {dispatch_result}]").strip()
            db.commit()
    except Exception as exc:  # noqa: BLE001
        logger.warning("Approved-proposal dispatch hook failed: %s", exc)
        dispatch_result = "dispatch_error"

    # Feature 2: Save correction to learning loop
    if body.corrected_answer:
        try:
            from ..services.corrections_engine import save_correction  # noqa: PLC0415
            save_correction(
                decision_type=item.decision_type,
                input_summary=item.input_summary or "",
                corrected_answer=body.corrected_answer,
                reviewer_notes=body.reviewer_notes,
                db=db,
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("Could not save correction: %s", exc)

    logger.info("Review item %d approved (dispatch=%s)", item_id, dispatch_result)
    response = {"status": "approved", "id": item_id}
    if dispatch_result is not None:
        response["dispatch"] = dispatch_result
    return response


@router.post("/queue/{item_id}/reject", summary="Reject an AI decision")
async def reject_item(
    item_id: int,
    body: ReviewDecision,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    item = _get_item_or_404(db, item_id)
    if item.status != "pending":
        raise HTTPException(400, f"Item is already '{item.status}'")

    # Dashboard PIN gate also applies to rejection — only the operator can clear items.
    from ..services.estimate_approval import pin_required, verify_pin  # noqa: PLC0415
    if pin_required() and not verify_pin(body.pin):
        raise HTTPException(403, "Invalid or missing 4-digit dashboard PIN")

    item.status         = "rejected"
    item.reviewer_note  = body.reviewer_notes
    item.resolved_at    = datetime.now(timezone.utc)
    db.commit()
    logger.info("Review item %d rejected", item_id)
    return {"status": "rejected", "id": item_id}


@router.get("/stats", summary="Human review queue statistics")
async def review_stats(
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    pending  = db.query(HumanReviewQueue).filter(HumanReviewQueue.status == "pending").count()
    approved = db.query(HumanReviewQueue).filter(HumanReviewQueue.status == "approved").count()
    rejected = db.query(HumanReviewQueue).filter(HumanReviewQueue.status == "rejected").count()
    total    = pending + approved + rejected

    avg_conf = (
        db.query(
            __import__("sqlalchemy", fromlist=["func"]).func.avg(HumanReviewQueue.confidence)
        ).scalar() or 0.0
    )

    return {
        "total":           total,
        "pending":         pending,
        "approved":        approved,
        "rejected":        rejected,
        "avg_confidence":  round(float(avg_conf), 3),
        "review_rate_pct": round(pending / total * 100, 1) if total else 0.0,
    }
