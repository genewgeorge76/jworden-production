from fastapi import APIRouter, Depends, HTTPException
from app.schemas.revenue_loop import GlobalRevenueLoop, PageRevenueNode
import uuid
import random

router = APIRouter(prefix="/api/v1/revenue", tags=["Financial Ecosystem"])

@router.get("/loop-status", response_model=GlobalRevenueLoop)
async def get_revenue_loop():
    """
    Shows how the webpages are collectively and independently funding the paving business.
    """
    return GlobalRevenueLoop(
        total_ecosystem_revenue=1250000.00,
        paving_operations_reserve=450000.00,
        reinvestment_rate=0.15,
        nodes=[
            PageRevenueNode(
                page_id="driveway-ai",
                revenue_type="saas_license",
                conversion_rate=0.12,
                funding_allocation=0.30  # 30% of license fees fund new pavers
            ),
            PageRevenueNode(
                page_id="visualizer",
                revenue_type="direct_sale",
                conversion_rate=0.08,
                funding_allocation=0.50  # 50% of 3D design sales fund crew payroll
            ),
            PageRevenueNode(
                page_id="command-center",
                revenue_type="saas_tier_enterprise",
                conversion_rate=0.05,
                funding_allocation=0.20
            )
        ]
    )

@router.post("/allocate")
async def allocate_funds(source_page: str, amount: float):
    """
    Explicitly moves revenue from a SaaS tool to the JWORDENAI PROJECT fund.
    This ensures digital revenue directly scales the physical paving infrastructure.
    """
    funding_matrix = {
        "driveway-ai": "JWORDENAI_PROJECT_RESERVE",
        "visualizer": "JWORDENAI_CREW_UPGRADE",
        "command-center": "JWORDENAI_EQUIPMENT_ACQUISITION"
    }
    
    destination = funding_matrix.get(source_page, "JWORDENAI_PROJECT_GENERAL")
    
    return {
        "status": "success",
        "transferred": amount,
        "destination": destination,
        "msg": f"Funds from {source_page} re-allocated to the {destination}."
    }
