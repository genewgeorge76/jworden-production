"""Simple long-term memory persistence scaffold.

This stores short vector-like entries to disk as JSON files. Replace with a
vector DB (Pinecone/Weaviate) for production.
"""
import json
import logging
import os
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

_BASE = os.environ.get("LONG_MEMORY_PATH", "./data/long_memory")
os.makedirs(_BASE, exist_ok=True)


def persist(item_id: str, embeddings: List[float], metadata: Dict[str, Any]) -> bool:
    path = os.path.join(_BASE, f"{item_id}.json")
    payload = {"id": item_id, "embeddings": embeddings, "metadata": metadata}
    try:
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(payload, fh)
        logger.info("persisted long memory %s", item_id)
        return True
    except Exception as e:
        logger.exception("failed to persist long memory: %s", e)
        return False


def query(prefix: str = "", limit: int = 10) -> List[Dict[str, Any]]:
    out = []
    try:
        for fname in os.listdir(_BASE):
            if not fname.endswith(".json"):
                continue
            if prefix and not fname.startswith(prefix):
                continue
            with open(os.path.join(_BASE, fname), "r", encoding="utf-8") as fh:
                out.append(json.load(fh))
            if len(out) >= limit:
                break
    except Exception:
        logger.exception("long_memory query failed")
    return out
