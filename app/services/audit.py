import json
import logging
from typing import Any

from sqlalchemy.orm import Session

from ..models import AuditEvent

logger = logging.getLogger(__name__)


def write_audit_event(
    db: Session,
    *,
    event_type: str,
    summary: str,
    actor_type: str = "system",
    actor_id: str | None = None,
    entity_type: str | None = None,
    entity_id: str | int | None = None,
    tenant_id: str | None = "default",
    detail: dict[str, Any] | None = None,
) -> AuditEvent | None:
    try:
        event = AuditEvent(
            event_type=event_type,
            actor_type=actor_type,
            actor_id=str(actor_id) if actor_id is not None else None,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id is not None else None,
            tenant_id=tenant_id,
            summary=summary,
            detail_json=json.dumps(detail) if detail else None,
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        logger.warning("Could not persist audit event %s: %s", event_type, exc)
        return None
