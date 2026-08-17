"""
google_photos.py — Google Photos integration.

This module was referenced but never committed. Two modules import it:

    app/routers/gallery.py:25             (module level)  -> sync_photo_to_google_photos
    app/routers/admin_integrations.py:229 (function level) -> list_albums

The module-level import in gallery.py meant `app.routers.gallery` raised
ModuleNotFoundError at import time. Same failure mode as the missing geocoding
and google_sheets modules: the backend landed in a commit that referenced files
which were never created.

STATUS: the Photos integration itself is NOT IMPLEMENTED.

`sync_photo_to_google_photos` has zero call sites — gallery.py imports the name
but never invokes it. `list_albums` is called from one owner-gated admin endpoint.

Both return an explicit not-implemented result rather than an empty-but-successful
one. An admin panel showing "0 albums" is indistinguishable from a working
integration with no albums; showing "not implemented" is not.

TO IMPLEMENT: the Google Photos Library API requires OAuth 2.0 user consent —
a service account cannot access a personal library. That means a stored refresh
token for the account that owns the photos, plus the
https://www.googleapis.com/auth/photoslibrary scope. Note also that since the
2025 API changes, third-party apps can only read media they themselves created,
which may make this integration unviable for an existing library — worth
confirming before building it.

Return shape matches google_suite.py: {ok, configured, detail, ...}.
"""
from __future__ import annotations

import logging
from typing import Any, Optional

from . import runtime_config as _cfg

logger = logging.getLogger(__name__)

_SCOPE = "https://www.googleapis.com/auth/photoslibrary"

_NOT_IMPLEMENTED = (
    "Google Photos integration is not implemented. The module was referenced by "
    "the routers but never written. It requires OAuth 2.0 user consent with a "
    "stored refresh token — a service account cannot reach a personal library."
)


def _status() -> dict:
    refresh = (_cfg.get("GOOGLE_PHOTOS_REFRESH_TOKEN") or "").strip()
    client_id = (_cfg.get("GOOGLE_OAUTH_CLIENT_ID") or "").strip()
    secret = (_cfg.get("GOOGLE_OAUTH_CLIENT_SECRET") or "").strip()
    missing = [n for n, v in (
        ("GOOGLE_PHOTOS_REFRESH_TOKEN", refresh),
        ("GOOGLE_OAUTH_CLIENT_ID", client_id),
        ("GOOGLE_OAUTH_CLIENT_SECRET", secret),
    ) if not v]
    return {
        "ok": False,
        "configured": not missing,
        "implemented": False,
        "detail": _NOT_IMPLEMENTED,
        "missing_keys": missing,
    }


def list_albums(**kwargs) -> list:
    """
    List albums in the connected Google Photos library.

    Not implemented. Returns a single-element list carrying the status rather
    than an empty list, so the admin panel cannot render "no albums" for what is
    actually "never built". The caller wraps this as {"ok": True, "albums": ...}.
    """
    logger.info("[PHOTOS] list_albums called but not implemented")
    return [_status()]


def sync_photo_to_google_photos(*args: Any, **kwargs: Any) -> dict:
    """
    Upload a gallery photo to the connected library.

    Not implemented. Never raises — a gallery upload must still succeed locally
    even when an optional downstream sync is unavailable.

    The signature is deliberately open. gallery.py:108 hands this to
    BackgroundTasks with THREE positional arguments (data, filename,
    description); the previous `(photo=None, **kwargs)` accepted one, because
    **kwargs absorbs keywords but not extra positionals. Every gallery upload's
    downstream sync therefore raised TypeError before the body ran — breaking
    the never-raises contract above in the exact place it was written to hold.
    """
    logger.info("[PHOTOS] sync_photo_to_google_photos called but not implemented")
    return _status()
