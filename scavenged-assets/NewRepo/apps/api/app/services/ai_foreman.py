"""
ai_foreman.py — Authority content engine.

Generates hyper-local, equipment-specific "Verified Proof" content for city
pages. Routes through llm_client → Gemini 2.5 Flash (primary) → GPT-4o fallback.

Tenant-aware: every call carries a `tenant` key so the same engine serves
J. Worden's own city grid AND any enterprise customer sites spun up via the
Website Factory. Brand descriptors change per tenant; prompt structure does not.

Required env (for real generation):
  GOOGLE_API_KEY or GEMINI_API_KEY  — Gemini 2.5 Flash (primary for city_authority task)
  OPENAI_API_KEY                    — GPT-4o fallback

Both absent → RuntimeError (catch in router and return 503).
"""
from __future__ import annotations

import logging
import time
from dataclasses import dataclass

from ..core.tenant_contract import infer_default_state, profiles_by_key
from . import llm_client

logger = logging.getLogger(__name__)


# ── Tenant brand presets ─────────────────────────────────────────────────────

_TENANT_BRANDS: dict[str, dict[str, str]] = {
    "jworden": {
        "brand_descriptor": (
            "J. Worden | Authority, the digital foreman for a 4th-generation "
            "Virginia Class A asphalt paving contractor based in Chester, VA"
        ),
        "default_state": "VA",
    },
}

_DEFAULT_TENANT = "jworden"


def _load_manifest_brands() -> dict[str, dict[str, str]]:
    try:
        brands: dict[str, dict[str, str]] = {}
        for key, profile in profiles_by_key().items():
            if not key:
                continue
            label = (profile.get("label") or key).strip()
            brands[key] = {
                "brand_descriptor": (
                    f"{label}, an enterprise asphalt and operations platform "
                    "focused on technically credible project documentation"
                ),
                "default_state": infer_default_state(profile),
            }
        return brands
    except Exception as exc:  # noqa: BLE001
        logger.warning("Could not load tenant brands from manifest: %s", exc)
        return {}


# Merge manifest brands at import; hardcoded jworden entry always wins if duplicated
_TENANT_BRANDS = {**_load_manifest_brands(), **_TENANT_BRANDS}


def _brand_for(tenant: str) -> dict[str, str]:
    return _TENANT_BRANDS.get(tenant) or _TENANT_BRANDS[_DEFAULT_TENANT]


# ── Response dataclass ───────────────────────────────────────────────────────

@dataclass
class AuthorityProof:
    text: str
    tenant: str
    city: str
    model: str           # actual model used (resolved by llm_client)
    provider: str        # "google" | "openai" | ...
    fallback_used: bool  # True if primary provider failed
    latency_ms: int


# ── Public API ───────────────────────────────────────────────────────────────

def generate_city_proof(
    city_name: str,
    equipment_used: list[str],
    project_type: str = "commercial parking lot repaving",
    *,
    tenant: str = _DEFAULT_TENANT,
    state: str | None = None,
) -> AuthorityProof:
    """
    Generate a 3-sentence technical proof statement for one city page.

    Output is suitable for prerendering into city-page HTML for SEO.
    Raises RuntimeError if all providers fail (caller should return 503).
    """
    brand = _brand_for(tenant)
    state_code = state or brand.get("default_state", "VA")
    equipment_str = ", ".join(equipment_used) if equipment_used else "standard paving equipment"

    system_prompt = (
        f"You are {brand['brand_descriptor']}. "
        "Write highly technical, strictly factual project descriptions emphasizing heavy machinery, "
        "structural durability, and local zoning compliance. Do not use generic marketing fluff."
    )
    user_prompt = (
        f"Write a 3-sentence technical summary for a {project_type} completed in {city_name}, {state_code}. "
        f"You must specifically mention the deployment of the following equipment: {equipment_str}. "
        "Emphasize the operational efficiency and minimal disruption to the client."
    )

    start = time.monotonic()
    response = llm_client.chat(
        task="city_authority",
        system=system_prompt,
        user=user_prompt,
        max_tokens=200,
        temperature=0.2,
    )
    latency_ms = int((time.monotonic() - start) * 1000)

    if response.error or not response.text:
        logger.error(
            "Authority engine failed for tenant=%s city=%s: %s",
            tenant, city_name, response.error_detail,
        )
        raise RuntimeError(
            f"Authority engine unavailable: {response.error_detail or 'no providers responded'}"
        )

    return AuthorityProof(
        text=response.text.strip(),
        tenant=tenant,
        city=city_name,
        model=response.model,
        provider=response.provider,
        fallback_used=response.fallback_used,
        latency_ms=latency_ms,
    )
