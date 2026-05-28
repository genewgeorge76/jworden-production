"""
features.py — Public, read-only feature/tier flags for the frontend.

Returns the boolean enabled-state of each named feature based on the current
LICENSE_TIER. NO secrets, NO key values — only true/false flags. Safe to call
without authentication.
"""

from fastapi import APIRouter

from ..services import runtime_config

router = APIRouter(prefix="/api/v1", tags=["features"])


@router.get("/features", summary="Tier-based feature flags (public)")
def get_features():
    return {
        "tier":     runtime_config.current_tier(),
        "features": runtime_config.enabled_features(),
    }
