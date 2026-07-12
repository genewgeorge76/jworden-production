"""
factory.py - The SaaS Site Factory Engine

Routes:
  GET  /api/v1/factory/resolve?hostname=...  - Fast client-side resolution of tenant config
  POST /api/v1/factory/sites                 - Create a new MarketSite
"""
import logging
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..core.limiter import limiter
from ..core.security import verify_premium_security
from ..database import get_db
from ..models import Tenant, MarketSite

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/factory", tags=["factory"])

class SiteResolution(BaseModel):
    tenant_id: str
    company_name: str
    subscription_tier: str
    hostname: str
    route_mode: str
    site_title: Optional[str]
    site_description: Optional[str]
    primary_color: Optional[str]
    accent_color: Optional[str]
    hero_headline: Optional[str]
    hero_subheadline: Optional[str]
    local_weather_copy: Optional[str]
    phone_override: Optional[str]

MARKET_PROFILES = {
    "asphaltpavingkansascity.com": {
        "marketName": "Kansas City Asphalt",
        "primaryRegion": "Greater Kansas City",
        "primaryMetro": "KC Metro Area",
        "heroKicker": "Logistics & Industrial Paving",
        "heroHeadline": "Heavy-Duty Asphalt Engineered For Kansas City",
        "primary_color": "#dc2626" # Heartland Crimson
    },
    "atlantaasphaltpavingpros.com": {
        "marketName": "Atlanta Asphalt Pros",
        "primaryRegion": "Metro Atlanta",
        "primaryMetro": "Atlanta",
        "heroKicker": "High-Volume Commercial Delivery",
        "heroHeadline": "Premium Asphalt Construction Built For Atlanta Traffic",
        "primary_color": "#f97316" # Georgia Peach
    },
    "blueridgeasphaltpaving.com": {
        "marketName": "Blue Ridge Asphalt",
        "primaryRegion": "Blue Ridge & Appalachia",
        "primaryMetro": "Roanoke / Asheville",
        "heroKicker": "Elevation & Grade Certified",
        "heroHeadline": "Mountain-Resilient Paving For The Blue Ridge",
        "primary_color": "#475569" # Mountain Slate
    },
    "jwordenuniversity.com": {
        "marketName": "J. Worden University",
        "primaryRegion": "Global Infrastructure",
        "primaryMetro": "Starbase Campus",
        "heroKicker": "Next-Generation Training & Certification",
        "heroHeadline": "The Launchpad For Asphalt Engineering Excellence",
        "primary_color": "#000000" # SpaceX Deep Space Black
    },
    "carolinablacktop.com": {
        "marketName": "Carolina Blacktop",
        "primaryRegion": "North & South Carolina",
        "primaryMetro": "Charlotte & Raleigh",
        "heroKicker": "Generational Paving Standards",
        "heroHeadline": "Premium Asphalt Construction Across The Carolinas",
        "primary_color": "#3b82f6" # Tarheel Blue
    },
    "michiganasphaltpavingpros": { # Pattern match
        "marketName": "Michigan Asphalt Pros",
        "primaryRegion": "State of Michigan",
        "primaryMetro": "Detroit / Grand Rapids",
        "heroKicker": "Freeze-Thaw Certified Delivery",
        "heroHeadline": "Winter-Tested Asphalt Built For Michigan Weather",
        "primary_color": "#64748b" # Industrial Steel
    },
    "minnesotaasphaltpaving.com": {
        "marketName": "Minnesota Asphalt Paving",
        "primaryRegion": "Twin Cities & Greater MN",
        "primaryMetro": "Minneapolis / St. Paul",
        "heroKicker": "Deep-Freeze Resilience",
        "heroHeadline": "Heavy-Duty Asphalt Engineered For Minnesota Winters",
        "primary_color": "#0ea5e9" # Frost Blue
    },
    "obxpaving.com": {
        "marketName": "OBX Paving",
        "primaryRegion": "Outer Banks & Dare County",
        "primaryMetro": "Kitty Hawk / Nags Head",
        "heroKicker": "Coastal Grade Construction",
        "heroHeadline": "Saltwater-Resistant Asphalt Paving For The Outer Banks",
        "primary_color": "#14b8a6" # Coastal Teal
    },
    "richmondasphalt": { # Pattern match
        "marketName": "Richmond Asphalt",
        "primaryRegion": "Central Virginia",
        "primaryMetro": "Richmond Metro",
        "heroKicker": "Verified Field Documentation",
        "heroHeadline": "Premium Asphalt Construction Built For Local Conditions",
        "primary_color": "#f59e0b" # Classic Amber
    },
    "savannah": { # Pattern match
        "marketName": "Savannah Paving",
        "primaryRegion": "Coastal Empire",
        "primaryMetro": "Savannah",
        "heroKicker": "High-Humidity Drainage Control",
        "heroHeadline": "Coastal Asphalt Engineering For Savannah",
        "primary_color": "#22c55e" # Coastal Green
    }
}

@router.get("/resolve", response_model=SiteResolution, summary="Resolve tenant by hostname")
@limiter.limit("200/minute")
async def resolve_hostname(request: Request, hostname: str, db: Session = Depends(get_db)):
    """Fast resolution for Vite SPA on Vercel."""
    safe_hostname = hostname.lower().strip()
    
    # Internal routing overrides
    if "wordenstandard" in safe_hostname or "localhost" in safe_hostname or "127.0.0.1" in safe_hostname:
        return {
            "tenant_id": "default",
            "company_name": "J. Worden & Sons",
            "subscription_tier": "pro",
            "hostname": safe_hostname,
            "route_mode": "operations", # Operations dashboard
            "site_title": "The Worden Standard",
            "site_description": "Asphalt Paving Command Center",
            "primary_color": "#050810",
            "accent_color": "#f59e0b",
            "hero_headline": None,
            "hero_subheadline": None,
            "local_weather_copy": None,
            "phone_override": None
        }

    # Match regional market profiles
    profile = None
    for key, val in MARKET_PROFILES.items():
        if key in safe_hostname:
            profile = val
            break
            
    site = db.query(MarketSite).filter(MarketSite.hostname == safe_hostname).first()
    
    if not site:
        # If not in DB, but we have a hardcoded profile, serve the gorgeous market site
        if profile:
            return {
                "tenant_id": "default",
                "company_name": profile["marketName"],
                "subscription_tier": "pro",
                "hostname": safe_hostname,
                "route_mode": "university" if "jwordenuniversity" in safe_hostname else "market-landing",
                "site_title": f"{profile['marketName']} | Asphalt Paving",
                "site_description": f"Premium asphalt paving serving {profile['primaryRegion']}.",
                "primary_color": profile["primary_color"],
                "accent_color": None,
                "hero_headline": profile["heroHeadline"],
                "hero_subheadline": profile["heroKicker"],
                "local_weather_copy": profile["primaryMetro"],
                "phone_override": None,
                "market": profile # Inject full payload for MarketLanding.jsx
            }
        
        # Absolute fallback
        return {
            "tenant_id": "default",
            "company_name": "Local Asphalt Paving",
            "subscription_tier": "lite",
            "hostname": safe_hostname,
            "route_mode": "full-site",
            "site_title": "Premium Asphalt Paving",
            "site_description": "Premium Asphalt Paving",
            "primary_color": "#f59e0b",
            "accent_color": None,
            "hero_headline": None,
            "hero_subheadline": None,
            "local_weather_copy": None,
            "phone_override": None
        }
        
    # Get Tenant associated with the MarketSite
    tenant = db.query(Tenant).filter(Tenant.tenant_id == site.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=500, detail="Tenant data missing")
        
    # If in DB and we have a hardcoded rich profile, merge them
    return {
        "tenant_id": tenant.tenant_id,
        "company_name": tenant.company_name,
        "subscription_tier": getattr(tenant, "subscription_tier", "lite"),
        "hostname": site.hostname,
        "route_mode": site.route_mode,
        "site_title": site.site_title,
        "site_description": site.site_description,
        "primary_color": site.primary_color or (profile["primary_color"] if profile else tenant.primary_color),
        "accent_color": site.accent_color,
        "hero_headline": site.hero_headline or (profile["heroHeadline"] if profile else None),
        "hero_subheadline": site.hero_subheadline or (profile["heroKicker"] if profile else None),
        "local_weather_copy": site.local_weather_copy or (profile["primaryMetro"] if profile else None),
        "phone_override": site.phone_override or tenant.contact_phone,
        "market": profile if profile else None
    }

class MarketSiteCreate(BaseModel):
    hostname: str
    route_mode: str = "market-landing"
    site_title: Optional[str] = None
    city_target: Optional[str] = None
    state_target: Optional[str] = None

@router.post("/sites", summary="Launch a new Market Site")
@limiter.limit("10/minute")
async def create_market_site(
    request: Request,
    req: MarketSiteCreate,
    db: Session = Depends(get_db),
    auth_data: dict = Depends(verify_premium_security),
):
    """
    Launch a new SEO Market Site.
    Enforces subscription tier (Pro/Max required).
    """
    tenant_id = auth_data.get("tenant_id", "default")
    
    tenant = db.query(Tenant).filter(Tenant.tenant_id == tenant_id).first()
    if not tenant or getattr(tenant, "subscription_tier", "lite") == "lite":
        raise HTTPException(status_code=403, detail="Upgrade to PRO to launch unlimited Market Sites.")
        
    safe_host = req.hostname.lower().strip()
    exists = db.query(MarketSite).filter(MarketSite.hostname == safe_host).first()
    if exists:
        raise HTTPException(status_code=409, detail="Hostname already registered")
        
    site = MarketSite(
        tenant_id=tenant_id,
        hostname=safe_host,
        route_mode=req.route_mode,
        site_title=req.site_title,
        city_target=req.city_target,
        state_target=req.state_target,
    )
    db.add(site)
    db.commit()
    db.refresh(site)
    
    return {"status": "success", "site_id": site.id, "hostname": site.hostname}

class GenerateBlogRequest(BaseModel):
    hostname: str
    topic: str
    keywords: List[str]

@router.post("/blog/generate", summary="AI Blog Generator")
@limiter.limit("5/minute")
async def generate_seo_blog(
    request: Request,
    req: GenerateBlogRequest,
    db: Session = Depends(get_db),
    auth_data: dict = Depends(verify_premium_security),
):
    """
    Generate an SEO optimized blog post for a specific Market Site.
    """
    tenant_id = auth_data.get("tenant_id", "default")
    
    # 1. Verify Entitlement
    tenant = db.query(Tenant).filter(Tenant.tenant_id == tenant_id).first()
    if not tenant or getattr(tenant, "subscription_tier", "lite") == "lite":
        raise HTTPException(status_code=403, detail="Upgrade to PRO to access the AI Content Engine.")
        
    # 2. Get Site Context
    safe_host = req.hostname.lower().strip()
    site = db.query(MarketSite).filter(MarketSite.hostname == safe_host).first()
    if not site or site.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Market Site not found or unauthorized.")
        
    # 3. Call AI to Generate Content (Placeholder for Gemini Integration)
    generated_title = f"{req.topic.title()} in {site.city_target or 'Your Area'}"
    generated_body = f"<p>This is a highly optimized post about {req.topic} targeting {site.city_target or 'your area'}. It includes semantic HTML and covers keywords like {', '.join(req.keywords)}.</p>"
    
    # 4. Save to DB
    from ..models import BlogPost
    import uuid
    from datetime import datetime, timezone
    
    slug = generated_title.lower().replace(" ", "-") + "-" + str(uuid.uuid4())[:8]
    
    post = BlogPost(
        tenant_id=tenant_id,
        market_site_id=site.id,
        slug=slug,
        title=generated_title,
        body=generated_body,
        status="published",
        published_at=datetime.now(timezone.utc)
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    
    return {"status": "success", "post_id": post.id, "slug": post.slug}
