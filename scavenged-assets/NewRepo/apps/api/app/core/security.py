import hmac

from fastapi import Header, HTTPException
from ..config import settings


async def verify_premium_security(
    x_master_key: str = Header(default='', alias='X-Master-Key'),
) -> dict:
    # Constant-time comparison prevents timing-oracle attacks on the master key.
    expected = settings.jworden_master_key
    if not x_master_key or not hmac.compare_digest(
        x_master_key.encode('utf-8'),
        expected.encode('utf-8'),
    ):
        raise HTTPException(status_code=403, detail='Forbidden')
    return {'authenticated': True}
