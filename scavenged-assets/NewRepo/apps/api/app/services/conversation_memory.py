"""DB-backed conversation memory for Jarvis sessions."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from ..models import ChatSession, ChatMessage


def get_or_create_session(db: Session, session_id: str | None, context: str = 'jarvis') -> str:
    """Return session_id — create new session if not found."""
    if session_id:
        existing = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if existing:
            existing.last_active_at = datetime.now(timezone.utc)
            db.commit()
            return session_id

    new_id = str(uuid.uuid4())
    session = ChatSession(id=new_id, context=context)
    db.add(session)
    db.commit()
    return new_id


def append_message(db: Session, session_id: str, role: str, content: str) -> None:
    msg = ChatMessage(session_id=session_id, role=role, content=content)
    db.add(msg)
    db.commit()


def get_history(db: Session, session_id: str, limit: int = 20) -> list[dict]:
    """Return last N messages as {role, content} dicts for prompt injection."""
    msgs = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.id.desc())
        .limit(limit)
        .all()
    )
    return [{'role': m.role, 'content': m.content} for m in reversed(msgs)]


def delete_session(db: Session, session_id: str) -> bool:
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        return False
    db.query(ChatMessage).filter(ChatMessage.session_id == session_id).delete()
    db.delete(session)
    db.commit()
    return True
