"""
Asphalt cooling and lay-down window, delegated to the real thermal service.

This module used to manufacture its answer with `random`: it drew an ambient
temperature and a wind speed, ran them through a cooling curve, and returned a
haul-time verdict shaped exactly like a computed one. The registry gated it for
that reason, so it refused rather than answered — but the capability stayed
unreachable through JARVIS while a real implementation sat one directory away.

`app/services/asphalt_thermal.py` answers the same question properly: it pulls
the NOAA hourly forecast for the site, applies Newtonian cooling per hour
against the mix temperature and lift thickness, and returns the usable
lay-down window. This module is now a thin adapter onto it.
"""

from __future__ import annotations

import logging
from typing import Any

from app.services import asphalt_thermal as _thermal

logger = logging.getLogger(__name__)


class AsphaltThermalEngine:
    """Lay-down window for hot mix asphalt at a site, from live forecast data."""

    def __init__(self) -> None:
        self.module_id = "asphalt_thermal"

    async def execute(self, params: dict | None = None) -> dict[str, Any]:
        params = params or {}

        lat, lng = params.get("lat"), params.get("lng")
        if lat is None or lng is None:
            # Refuse rather than pick a site. A cooling window computed for
            # somewhere the crew is not is worse than no answer.
            return {
                "ok": False,
                "error": (
                    "asphalt_thermal requires 'lat' and 'lng' — the forecast is "
                    "site-specific and there is no sensible default."
                ),
            }

        try:
            return await _thermal.lay_down_window(
                float(lat),
                float(lng),
                mix_temp_f=float(params.get("mix_temp_f", 290.0)),
                lift_in=float(params.get("lift_in", 2.0)),
                target_breakdown_f=float(params.get("target_breakdown_f", 240.0)),
                target_finish_f=float(params.get("target_finish_f", 175.0)),
            )
        except (TypeError, ValueError) as exc:
            return {"ok": False, "error": f"asphalt_thermal: bad parameter — {exc}"}
