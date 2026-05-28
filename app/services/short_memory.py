"""A tiny short-term memory store for Jarvis.

Stores recent messages per session/key in-memory with a small FIFO buffer.
This is intentionally simple and ephemeral; replace with DB-backed store later.
"""

from collections import deque
from typing import Deque, Dict, List

_STORE: Dict[str, Deque[str]] = {}
_LIMIT = 12


def append(session_key: str, message: str) -> None:
    if session_key not in _STORE:
        _STORE[session_key] = deque(maxlen=_LIMIT)
    _STORE[session_key].append(message)


def get(session_key: str) -> List[str]:
    return list(_STORE.get(session_key, []))


def clear(session_key: str) -> None:
    _STORE.pop(session_key, None)
