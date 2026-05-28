from __future__ import annotations
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel, Field

class MaintenanceNode(BaseModel):
    """
    A single service event in a global maintenance lifecycle.
    Can be an oil change, a sealcoat, a roof inspection, or a software patch.
    """
    node_id: str
    service_title: str
    frequency_days: int
    critical_threshold: int   # Days past due before high-risk
    ai_validation_required: bool
    estimated_cost: float
    service_category: str     # 'mechanical', 'structural', 'digital', 'safety'

class GlobalMaintenancePlan(BaseModel):
    """
    The blueprint for the 'Universal Service Platform'.
    This allows JWordenAI to scale beyond paving into any home or business service.
    """
    plan_id: str
    owner_id: str             # Customer or Business ID
    asset_id: str             # Home address, Vehicle VIN, or Server ID
    asset_type: str           # 'property', 'fleet', 'infrastructure'
    
    # The Lifecycle nodes
    nodes: List[MaintenanceNode]
    
    # Global AI Intelligence
    predictive_modeling: bool = True
    auto_dispatch_enabled: bool = False
    trust_ledger_integration: bool = True # Links to UniversalServiceLedger
    
    # Status
    health_score: float       # 0.0 - 100.0 (Asset condition)
    next_event_date: datetime
    last_validated_at: datetime

class PlatformTriage(BaseModel):
    """
    Scales the platform by categorizing any global service request.
    """
    request_id: str
    global_category: str      # 'home_repair', 'logistics', 'wellness', 'it'
    specific_service: str     # 'paving', 'hvac', 'delivery', 'biometrics'
    priority: int             # 1-5
    verification_standard: str # 'standard', 'premium_ai', 'government_grade'
