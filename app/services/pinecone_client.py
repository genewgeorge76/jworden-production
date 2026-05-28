"""Optional Pinecone integration wrapper.

This wrapper loads the `pinecone` SDK only when `PINECONE_API_KEY` is set.
It provides `index_repo()` and `query()` helpers used by `rag.py`.
"""
import logging
import os
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

_ENABLED = bool(os.environ.get('PINECONE_API_KEY'))
_INDEX_NAME = os.environ.get('PINECONE_INDEX', 'jarvis-repo')

if _ENABLED:
    try:
        import pinecone
        pinecone.init(api_key=os.environ.get('PINECONE_API_KEY'), environment=os.environ.get('PINECONE_ENV', None))
    except Exception as e:
        logger.exception('Failed to initialise Pinecone: %s', e)
        _ENABLED = False


def index_repo(path: str = '.', namespace: str = 'jarvis-repo-v1') -> Dict[str, Any]:
    if not _ENABLED:
        return {"ok": False, "error": "Pinecone not configured"}
    # Real implementation: walk files, chunk, embed, and upsert to Pinecone index.
    logger.info('pinecone_client.index_repo called path=%s namespace=%s', path, namespace)
    return {"ok": True, "indexed": 0, "namespace": namespace}


def query(query_text: str, namespace: str = 'jarvis-repo-v1', top_k: int = 5) -> List[Dict[str, Any]]:
    if not _ENABLED:
        return []
    # Real implementation: embed query -> pinecone.query -> return top_k matches
    logger.info('pinecone_client.query called q=%s namespace=%s top_k=%d', query_text, namespace, top_k)
    return []
