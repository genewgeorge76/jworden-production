from datetime import datetime, timezone
from fastapi import APIRouter

router = APIRouter(tags=['health'])


@router.get('/health')
def health():
    return {'status': 'ok', 'ts': datetime.now(timezone.utc).isoformat(), 'service': 'jworden-api'}


@router.get('/health/db')
def health_db(db=None):
    try:
        db.execute('SELECT 1')
        return {'status': 'ok', 'db': 'connected'}
    except Exception as e:
        return {'status': 'error', 'db': str(e)}
