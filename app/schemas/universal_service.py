from __future__ import annotations
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field

class ServiceVerification(BaseModel):
    """
    Universal Verification standard for any home or business service.
    Whether it's Paving, HVAC, Roofing, or Landscaping.
    """
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    gps_lat: float
    gps_lng: float
    biometric_health_score: float # 0.0 - 1.0 (Personnel safety rating)
    ai_vision_score: float        # 0.0 - 1.0 (Quality of work rating)
    asset_id: str                 # The machine or tool used
    worker_id: str                # The authenticated service provider

class UniversalServiceLedger(BaseModel):
    """
    The 'Digital Passport' for a service event.
    This is what makes your platform the 'Best in the World'.
    """
    service_id: str
    service_type: str             # 'asphalt', 'hvac', 'electrical', 'delivery'
    status: str                   # 'transit', 'active', 'inspected', 'ledgered'
    
    # The Core Triage
    location_verified: bool
    safety_verified: bool
    quality_verified: bool
    
    # Evidence Vault
    vision_logs: List[dict]       # AI Vision inspection results
    telemetry_logs: List[dict]    # Equipment/Logistics data
    environmental_data: dict      # Weather/Ambient conditions during work
    
    # Financial Link
    settlement_status: str        # 'pending', 'escrow', 'released'
    trust_score: float            # Aggregated platform confidence score
