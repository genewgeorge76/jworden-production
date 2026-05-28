"""
quotes.py — Automated quote generation from PavingEvaluation records.

Routes:
  POST /api/v1/quotes/generate/{evaluation_id}
        Generate a priced asphalt quote from a stored site evaluation.

Requires premium security (internal quoting engine — not the public
POST /api/v1/leads/quote customer-facing endpoint).

2026 Virginia Market Benchmarks
  Standard pave:      $5.25/sq ft  ($3–$15 range based on thickness)
  Sealcoating:        $0.25/sq ft  ($0.15–$0.30 historical regional rate)
  Patching minimum:   $850.00      (Minimum project profitability floor)
  Base rehab markup:  1.4×         (Structural failure / alligator cracking)
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..core.security import verify_premium_security
from ..database import get_db
from ..models import PavingEvaluation  # noqa: PLC0415

router = APIRouter(
    prefix="/api/v1/quotes",
    tags=["quotes"],
    dependencies=[Depends(verify_premium_security)],
)

# ── 2026 Virginia Market Benchmarks ──────────────────────────────────────────
_VA_PRICE_PER_SQFT: dict[str, float] = {
    "standard_pave":         5.25,   # $3–$15 range based on thickness
    "sealcoating":           0.25,   # $0.15–$0.30 historical regional rate
    "patching_min":        850.0,    # Minimum project value
    "base_rehab_multiplier": 1.4,    # Added cost for structural failure
}

# Damage types that indicate structural failure requiring base rehabilitation
_DAMAGE_NEEDS_BASE_REHAB: frozenset[str] = frozenset({"alligator_cracking"})


@router.post("/generate/{evaluation_id}")
def generate_automated_quote(
    evaluation_id: int,
    db: Session = Depends(get_db),
) -> dict:
    """
    Generate a priced asphalt quote from an existing PavingEvaluation record.

    Pricing rules:
    - Alligator cracking (structural failure) applies a 1.4× base-rehab
      multiplier on top of the standard $5.25/sq ft rate.
    - A $850 minimum is enforced to ensure project profitability.
    - All quotes are valid for 7 days (liquid asphalt market volatility).
    - All jobs quoted to VDOT 6-inch base standards.
    """
    eval_record = (
        db.query(PavingEvaluation)
        .filter(PavingEvaluation.id == evaluation_id)
        .first()
    )
    if eval_record is None:
        raise HTTPException(
            status_code=404,
            detail=f"PavingEvaluation {evaluation_id} not found",
        )

    unit_price       = _VA_PRICE_PER_SQFT["standard_pave"]
    needs_base_rehab = eval_record.damage_type in _DAMAGE_NEEDS_BASE_REHAB

    if needs_base_rehab:
        unit_price *= _VA_PRICE_PER_SQFT["base_rehab_multiplier"]

    subtotal    = eval_record.calculated_sqft * unit_price
    final_total = max(subtotal, _VA_PRICE_PER_SQFT["patching_min"])

    return {
        "quote_id":            f"JW-{evaluation_id}",
        "evaluation_id":       evaluation_id,
        "site":                eval_record.region,
        "sqft":                eval_record.calculated_sqft,
        "damage_type":         eval_record.damage_type,
        "recommended_service": (
            "Full Repave + Base Rehab" if needs_base_rehab else "Standard Resurface"
        ),
        "unit_price_per_sqft": round(unit_price, 4),
        "subtotal":            round(subtotal, 2),
        "estimated_total":     round(final_total, 2),
        "minimum_applied":     subtotal < _VA_PRICE_PER_SQFT["patching_min"],
        "valid_until":         "7 Days (Due to liquid asphalt market volatility)",
        "virginia_compliance": "Includes VDOT 6-inch base standards",
    }
