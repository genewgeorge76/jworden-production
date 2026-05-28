"""Lightweight RAG skeleton for repo/docs ingestion and retrieval.

This is a minimal, safe scaffold: real production should use Pinecone, Weaviate,
or a managed vector DB and an embeddings provider. Implemented here so the
rest of the codebase can import `rag.index_repo()` and `rag.query()`.
"""
import logging
import os
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


def index_repo(path: str = ".", namespace: str = "jarvis-repo-v1") -> Dict[str, Any]:
    """Index repo using Pinecone when configured, otherwise a no-op stub.
    """
    if os.environ.get('PINECONE_API_KEY'):
        try:
            from app.services import pinecone_client
            return pinecone_client.index_repo(path=path, namespace=namespace)
        except Exception as e:
            logger.exception('pinecone index_repo failed: %s', e)
            return {"ok": False, "error": str(e)}
    logger.info("RAG stub: index_repo called path=%s namespace=%s (pinecone not configured)", path, namespace)
    return {"ok": True, "indexed": 0, "namespace": namespace}


def query(query_text: str, namespace: str = "jarvis-repo-v1", top_k: int = 5) -> List[Dict[str, Any]]:
    if os.environ.get('PINECONE_API_KEY'):
        try:
            from app.services import pinecone_client
            return pinecone_client.query(query_text=query_text, namespace=namespace, top_k=top_k)
        except Exception as e:
            logger.exception('pinecone query failed: %s', e)
            return []
    logger.debug("RAG stub: query text=%s namespace=%s top_k=%d (pinecone not configured)", query_text, namespace, top_k)
    return []
