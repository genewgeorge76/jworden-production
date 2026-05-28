from __future__ import annotations
from datetime import datetime
from typing import List, Optional, Dict
from pydantic import BaseModel, Field

class PageRevenueNode(BaseModel):
    """
    Represents a specific webpage or tool's contribution to the core business.
    """
    page_id: str              # 'driveway-ai', 'visualizer', 'command-center'
    revenue_type: str         # 'lead_gen', 'saas_license', 'direct_sale'
    conversion_rate: float
    funding_allocation: float # Percentage of revenue sent to core paving operations

class GlobalRevenueLoop(BaseModel):
    """
    The financial engine that ensures all digital assets fund the JWORDENAI PROJECT.
    """
    total_ecosystem_revenue: float
    jwordenai_project_reserve: float
    
    # Active Revenue Streams
    nodes: List[PageRevenueNode]
    
    # The 'Circular Economy' logic
    reinvestment_rate: float  # For infrastructure/equipment upgrades
    saas_subscription_active: bool = True
    platform_fee_percent: float = 0.05
