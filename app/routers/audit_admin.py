from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..core.security import verify_premium_security
from ..database import get_db
from ..models import AuditEvent

router = APIRouter(prefix="/api/v1/admin/audit", tags=["admin", "audit"])


@router.get("/events")
def list_audit_events(
    limit: int = 100,
    event_type: str | None = None,
    entity_type: str | None = None,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_premium_security),
):
    query = db.query(AuditEvent)
    if event_type:
        query = query.filter(AuditEvent.event_type == event_type)
    if entity_type:
        query = query.filter(AuditEvent.entity_type == entity_type)
    events = query.order_by(AuditEvent.created_at.desc()).limit(min(limit, 500)).all()
    return {
        "total": len(events),
        "events": [
            {
                "id": event.id,
                "event_type": event.event_type,
                "actor_type": event.actor_type,
                "actor_id": event.actor_id,
                "entity_type": event.entity_type,
                "entity_id": event.entity_id,
                "summary": event.summary,
                "detail_json": event.detail_json,
                "created_at": event.created_at.isoformat() if event.created_at else None,
            }
            for event in events
        ],
    }