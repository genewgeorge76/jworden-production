"""
factory.py - The SaaS Site Factory Engine

Routes:
  GET  /api/v1/factory/resolve?hostname=...  - Fast client-side resolution of tenant config
  POST /api/v1/factory/sites                 - Create a new MarketSite
"""
import json
import logging
import re
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..core.limiter import limiter
from ..core.security import verify_premium_security
from ..database import get_db
from ..models import Tenant, MarketSite
from ..services import llm_client
from ..services.entitlements import require_tier
from ..services.tenancy import get_scoped, scope, tenant_of

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/factory", tags=["factory"])

class SiteResolution(BaseModel):
    tenant_id: str
    company_name: str
    subscription_tier: str
    hostname: str
    route_mode: str
    site_title: Optional[str] = None
    site_description: Optional[str] = None
    primary_color: Optional[str] = None
    accent_color: Optional[str] = None
    hero_headline: Optional[str] = None
    hero_subheadline: Optional[str] = None
    local_weather_copy: Optional[str] = None
    phone_override: Optional[str] = None
    branding_tier: Optional[str] = None   # 'jarvis' | 'worden_standard' | 'white_label'
    logo_url: Optional[str] = None
    market: Optional[dict] = None

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
        "marketName": "Blue Ridge Estate & Mountain Paving",
        "primaryRegion": "Blue Ridge, Shenandoah Valley & Appalachian Highlands",
        "primaryMetro": "Roanoke / Charlottesville / Winchester",
        "heroKicker": "Deep Highland Access & Elevation Certified",
        "heroHeadline": "Premium Asphalt Engineered To Survive The Mountains",
        "heroBody": "Flawless structural-grade driveways and commercial parking lots engineered to eliminate drainage issues, prevent washouts, and easily withstand extreme Appalachian freeze-thaw cycles. Serving Monterey to Charlottesville, and Roanoke to Winchester, VA.",
        "primary_color": "#dc2626", # Powerhouse Red
        "phoneDisplay": "(804) 446-1296",
        "proofHeadline": "Paved 100+ KFC Locations & Deep Mountain Estates"
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
            "route_mode": "operations",
            "site_title": "The Worden Standard",
            "site_description": "Asphalt Paving Command Center",
            "primary_color": "#050810",
            "accent_color": "#f59e0b",
            "hero_headline": None,
            "hero_subheadline": None,
            "local_weather_copy": None,
            "phone_override": None,
            "branding_tier": None,
            "logo_url": None,
        }

    # Check for SaaS subdomain pattern: <slug>.thewordenstandard.com
    if safe_hostname.endswith(".thewordenstandard.com") and safe_hostname != "thewordenstandard.com":
        subdomain_slug = safe_hostname.replace(".thewordenstandard.com", "")
        saas_tenant = db.query(Tenant).filter(
            Tenant.subdomain_slug == subdomain_slug
        ).first() if hasattr(Tenant, 'subdomain_slug') else None
        if saas_tenant:
            return {
                "tenant_id": saas_tenant.tenant_id,
                "company_name": saas_tenant.company_name,
                "subscription_tier": getattr(saas_tenant, "subscription_tier", "pro"),
                "hostname": safe_hostname,
                "route_mode": "saas-client",
                "site_title": saas_tenant.company_name,
                "site_description": f"{saas_tenant.company_name} — Powered by Jarvis",
                "primary_color": getattr(saas_tenant, "primary_color", "#f59e0b"),
                "accent_color": None,
                "hero_headline": None,
                "hero_subheadline": None,
                "local_weather_copy": None,
                "phone_override": getattr(saas_tenant, "contact_phone", None),
                "branding_tier": getattr(saas_tenant, "branding_tier", "jarvis"),
                "logo_url": getattr(saas_tenant, "logo_url", None),
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
        "market": profile if profile else None,
        "branding_tier": None,
        "logo_url": None,
    }


# ── SaaS Tenant Provisioning ──────────────────────────────────────────────────

class SaasProvisionRequest(BaseModel):
    company_name: str
    contact_email: str
    contact_phone: Optional[str] = None
    custom_domain: Optional[str] = None      # e.g. smithpaving.com
    subdomain_slug: Optional[str] = None     # e.g. smith  →  smith.thewordenstandard.com
    primary_color: Optional[str] = "#f59e0b"
    branding_tier: Optional[str] = "jarvis" # jarvis | worden_standard | white_label
    logo_url: Optional[str] = None
    subscription_tier: Optional[str] = "pro"

@router.post("/saas/provision", summary="Provision a new SaaS white-label tenant")
@limiter.limit("5/minute")
async def provision_saas_tenant(
    request: Request,
    req: SaasProvisionRequest,
    db: Session = Depends(get_db),
    auth_data: dict = Depends(verify_premium_security),
):
    """
    Provision a brand-new SaaS client.
    - Creates a Tenant row.
    - Registers their custom domain AND/OR subdomain as MarketSite rows
      with route_mode='saas-client'.
    - Returns the tenant_id and all registered hostnames.
    """
    import uuid
    from datetime import datetime, timezone

    caller_tenant_id = auth_data.get("tenant_id", "default")
    # Only the master Worden Standard account can provision SaaS tenants.
    if caller_tenant_id != "default":
        raise HTTPException(status_code=403, detail="Only the platform owner can provision tenants.")

    if not req.custom_domain and not req.subdomain_slug:
        raise HTTPException(status_code=422, detail="Provide at least one of: custom_domain or subdomain_slug.")

    # Slug validation
    slug = req.subdomain_slug or req.company_name.lower().replace(" ", "-")
    safe_slug = "".join(c for c in slug if c.isalnum() or c == "-")[:40]

    new_tenant_id = str(uuid.uuid4())

    tenant_kwargs = dict(
        tenant_id=new_tenant_id,
        company_name=req.company_name,
        contact_email=req.contact_email,
        contact_phone=req.contact_phone,
        subscription_tier=req.subscription_tier,
        primary_color=req.primary_color,
    )
    # Inject optional columns only if the model has them (future-safe)
    for col, val in [("branding_tier", req.branding_tier), ("logo_url", req.logo_url), ("subdomain_slug", safe_slug)]:
        if hasattr(Tenant, col):
            tenant_kwargs[col] = val

    tenant = Tenant(**tenant_kwargs)
    db.add(tenant)

    registered_hostnames = []

    def _add_site(hostname: str):
        existing = db.query(MarketSite).filter(MarketSite.hostname == hostname).first()
        if existing:
            return  # idempotent
        site = MarketSite(
            tenant_id=new_tenant_id,
            hostname=hostname,
            route_mode="saas-client",
            site_title=req.company_name,
            primary_color=req.primary_color,
        )
        db.add(site)
        registered_hostnames.append(hostname)

    # Custom domain
    if req.custom_domain:
        _add_site(req.custom_domain.lower().strip())

    # Subdomain on thewordenstandard.com
    subdomain_hostname = f"{safe_slug}.thewordenstandard.com"
    _add_site(subdomain_hostname)

    db.commit()

    logger.info(f"[SaaS] Provisioned tenant {new_tenant_id} ({req.company_name}) → {registered_hostnames}")

    return {
        "status": "provisioned",
        "tenant_id": new_tenant_id,
        "company_name": req.company_name,
        "subdomain": subdomain_hostname,
        "custom_domain": req.custom_domain,
        "registered_hostnames": registered_hostnames,
        "cockpit_url": f"https://{subdomain_hostname}/dashboard",
        "branding_tier": req.branding_tier,
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
    tenant_id = tenant_of(auth_data)

    # Was: `if not tenant or tier == "lite"`. Two problems with that. It read
    # only subscription_tier, which registration set from the signup form and
    # no payment ever verified — so ticking "pro" and abandoning checkout
    # bought this feature. And `not tenant` refused the operator, whose
    # tenant_id is JWORDEN_HQ and who has no tenants row at all.
    require_tier(db, tenant_id, "pro", "the Market Site factory")
        
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

def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", (value or "").lower()).strip("-")
    return slug[:150]


def _parse_article(raw: str) -> Optional[dict]:
    """
    Read the model's JSON answer, or return None.

    None means "refuse", never "use what we can salvage". A partially parsed
    article is exactly the kind of half-real content this endpoint exists to
    stop shipping.
    """
    text = (raw or "").strip()

    # Models commonly wrap JSON in a ```json fence despite being told not to.
    fence = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fence:
        text = fence.group(1)
    elif not text.startswith("{"):
        brace = text.find("{")
        if brace == -1:
            return None
        text = text[brace:text.rfind("}") + 1]

    try:
        data = json.loads(text)
    except (ValueError, TypeError):
        return None

    if not isinstance(data, dict):
        return None

    title = str(data.get("title") or "").strip()
    body = str(data.get("body") or "").strip()
    excerpt = str(data.get("excerpt") or "").strip()

    # A title and a body are the article. Without either, there is nothing to
    # save that a reader would recognise as a post.
    if not title or not body:
        return None

    return {
        "title": title,
        "body": body,
        "excerpt": excerpt or title,
        "meta_description": str(data.get("meta_description") or "").strip(),
    }


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
    tenant_id = tenant_of(auth_data)

    # 1. Verify Entitlement
    require_tier(db, tenant_id, "pro", "the AI Content Engine")
        
    # 2. Get Site Context
    safe_host = req.hostname.lower().strip()
    site = db.query(MarketSite).filter(MarketSite.hostname == safe_host).first()
    if not site or site.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Market Site not found or unauthorized.")
        
    # 3. Generate the content, for real.
    #
    # What stood here did not call any AI. It built a title and one sentence
    # with f-strings — "This is a highly optimized post about {topic}..." —
    # and saved them with status="published", live on the customer's domain,
    # under a comment reading "Placeholder for Gemini Integration". Every post
    # it produced was near-identical to every other one, so using the feature
    # as sold built a duplicate-content penalty across the customer's site.
    #
    # Three rules hold this honest now:
    #   * It goes through services/llm_client.chat(), the single LLM entry
    #     point for the backend. No provider SDK is touched directly here.
    #   * If the model fails, this refuses. There is no filler fallback,
    #     because a fallback that writes something is how the old version
    #     looked like it worked.
    #   * It saves a DRAFT. A generated post reaches a live domain only when a
    #     person publishes it, which is the step that was missing when the
    #     duplicate content was going out unreviewed.
    site_context = ", ".join(
        part for part in [
            site.site_title,
            f"serving {site.city_target}" if site.city_target else None,
            site.state_target,
        ] if part
    ) or site.hostname

    system_prompt = (
        "You write for a working paving and general contracting company. "
        "You are writing one article for one specific local market, and it "
        "must read as if written by someone who has been on that kind of "
        "jobsite.\n\n"
        "Hard rules:\n"
        "- Write about this market specifically. Do not produce copy that "
        "would read identically for another city.\n"
        "- Never invent a price, a statistic, a certification, a date, a "
        "customer, or a project. If a number would help and you do not have "
        "one, write the sentence without it.\n"
        "- No marketing filler. No 'in today's fast-paced world'. No claims "
        "about awards, years in business, or crew size.\n"
        "- Plain trade language a property manager would actually read.\n\n"
        "Return ONLY a JSON object with these keys and no prose around it:\n"
        '{"title": str, "excerpt": str (<=300 chars), "body": str (semantic '
        'HTML, <h2>/<h3>/<p>/<ul>, no <html> or <body> wrapper), '
        '"meta_description": str (<=155 chars)}'
    )

    user_prompt = (
        f"Market: {site_context}\n"
        f"Topic: {req.topic}\n"
        f"Keywords to cover naturally: {', '.join(req.keywords) or 'none supplied'}\n\n"
        "Write the article. 600-900 words."
    )

    result = llm_client.chat(
        task="content",
        system=system_prompt,
        user=user_prompt,
        max_tokens=2600,
        temperature=0.7,
    )

    if result.error or not result.text.strip():
        # Refuse. Saving anything here — a stub, a retry marker, an empty
        # draft — is how the previous version came to publish filler.
        raise HTTPException(
            status_code=502,
            detail=(
                "The content engine could not generate this post: "
                f"{result.error_detail or 'no response from any provider'}. "
                "Nothing was saved."
            ),
        )

    article = _parse_article(result.text)
    if article is None:
        raise HTTPException(
            status_code=502,
            detail=(
                "The content engine returned a response that could not be read "
                "as an article. Nothing was saved."
            ),
        )

    # 4. Save as a draft, scoped to the site that asked for it.
    from ..models import BlogPost
    import uuid
    from datetime import datetime, timezone

    base_slug = _slugify(article["title"]) or _slugify(req.topic) or "post"
    slug = f"{base_slug}-{uuid.uuid4().hex[:8]}"

    post = BlogPost(
        tenant_id=tenant_id,
        market_site_id=site.id,
        slug=slug,
        title=article["title"][:300],
        excerpt=article["excerpt"][:500],
        body=article["body"],
        meta_description=(article.get("meta_description") or article["excerpt"])[:320],
        focus_keyword=(req.keywords[0] if req.keywords else req.topic)[:120],
        # DRAFT. The old version published immediately, so nobody saw what went
        # out until it was already indexed.
        status="draft",
        published_at=None,
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    logger.info(
        "Generated draft post %s for %s via %s/%s.",
        post.slug, site.hostname, result.provider, result.model,
    )

    return {
        "status": "draft",
        "post_id": post.id,
        "slug": post.slug,
        "title": post.title,
        # Named honestly. The customer is paying for AI-written content and is
        # entitled to know which model wrote it and whether it was the primary
        # choice or a fallback.
        "generated_by": {
            "provider": result.provider,
            "model": result.model,
            "fallback_used": result.fallback_used,
        },
        "next_step": f"Review it, then POST /api/v1/factory/blog/{post.id}/publish.",
    }


@router.get("/sites", summary="List this tenant's Market Sites")
@limiter.limit("60/minute")
async def list_market_sites(
    request: Request,
    db: Session = Depends(get_db),
    auth_data: dict = Depends(verify_premium_security),
):
    """
    The tenant's own sites.

    POST /sites existed with no GET beside it, so a customer could create a
    Market Site and then had no way to see what they had created. Scoped
    through services/tenancy so the operator sees his bucket and a customer
    sees exactly their own.
    """
    tenant_id = tenant_of(auth_data)
    require_tier(db, tenant_id, "pro", "the Market Site factory")

    rows = (
        scope(db.query(MarketSite), MarketSite, tenant_id)
        .order_by(MarketSite.created_at.desc())
        .all()
    )
    return {
        "status": "ok",
        "count": len(rows),
        "sites": [
            {
                "id": row.id,
                "hostname": row.hostname,
                "site_title": row.site_title,
                "city_target": row.city_target,
                "state_target": row.state_target,
                "route_mode": row.route_mode,
                "is_active": bool(row.is_active),
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
            for row in rows
        ],
    }


@router.get("/blog", summary="List this tenant's generated posts")
@limiter.limit("60/minute")
async def list_blog_posts(
    request: Request,
    hostname: Optional[str] = None,
    db: Session = Depends(get_db),
    auth_data: dict = Depends(verify_premium_security),
):
    """
    Drafts and published posts, newest first.

    Without this there was no way to review a draft before publishing it,
    which made the review step unusable even once it existed.
    """
    from ..models import BlogPost

    tenant_id = tenant_of(auth_data)
    require_tier(db, tenant_id, "pro", "the AI Content Engine")

    query = scope(db.query(BlogPost), BlogPost, tenant_id)

    if hostname:
        site = (
            scope(db.query(MarketSite), MarketSite, tenant_id)
            .filter(MarketSite.hostname == hostname.lower().strip())
            .first()
        )
        if site is None:
            raise HTTPException(status_code=404, detail="Market Site not found")
        query = query.filter(BlogPost.market_site_id == site.id)

    rows = query.order_by(BlogPost.created_at.desc()).limit(200).all()
    return {
        "status": "ok",
        "count": len(rows),
        "posts": [
            {
                "id": row.id,
                "slug": row.slug,
                "title": row.title,
                "excerpt": row.excerpt,
                "status": row.status,
                "focus_keyword": row.focus_keyword,
                "market_site_id": row.market_site_id,
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "published_at": row.published_at.isoformat() if row.published_at else None,
            }
            for row in rows
        ],
    }


@router.get("/blog/{post_id}", summary="Read one generated post in full")
@limiter.limit("60/minute")
async def read_blog_post(
    request: Request,
    post_id: int,
    db: Session = Depends(get_db),
    auth_data: dict = Depends(verify_premium_security),
):
    """The full body, so a draft can actually be read before it goes live."""
    from ..models import BlogPost

    tenant_id = tenant_of(auth_data)
    require_tier(db, tenant_id, "pro", "the AI Content Engine")

    post = get_scoped(db, BlogPost, post_id, tenant_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    return {
        "status": "ok",
        "post": {
            "id": post.id,
            "slug": post.slug,
            "title": post.title,
            "excerpt": post.excerpt,
            "body": post.body,
            "meta_description": post.meta_description,
            "focus_keyword": post.focus_keyword,
            "status": post.status,
            "created_at": post.created_at.isoformat() if post.created_at else None,
            "published_at": post.published_at.isoformat() if post.published_at else None,
        },
    }


@router.post("/blog/{post_id}/publish", summary="Publish a generated draft")
@limiter.limit("20/minute")
async def publish_blog_post(
    request: Request,
    post_id: int,
    db: Session = Depends(get_db),
    auth_data: dict = Depends(verify_premium_security),
):
    """
    Put a reviewed draft live.

    This step did not exist: generation published straight to the customer's
    domain, so the first reader of a generated post was a search engine. The
    entitlement check is the same as generation's — publishing is part of the
    same paid feature.
    """
    from ..models import BlogPost
    from datetime import datetime, timezone

    tenant_id = tenant_of(auth_data)
    require_tier(db, tenant_id, "pro", "the AI Content Engine")

    post = get_scoped(db, BlogPost, post_id, tenant_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.status == "published":
        return {"status": "published", "post_id": post.id, "slug": post.slug}

    post.status = "published"
    post.published_at = datetime.now(timezone.utc)
    db.commit()

    logger.info("Published post %s for tenant %s.", post.slug, tenant_id)
    return {"status": "published", "post_id": post.id, "slug": post.slug}


class IndexNowSubmitRequest(BaseModel):
    host: str
    urls: List[str]

@router.post("/indexnow/submit", summary="Submit URLs to IndexNow for instant search engine indexing")
@limiter.limit("10/minute")
async def submit_indexnow_urls(
    request: Request,
    req: IndexNowSubmitRequest,
    auth_data: dict = Depends(verify_premium_security),
):
    """
    Submits newly generated pages to IndexNow API for immediate crawling by Bing, Yandex, and partners.
    """
    import httpx
    
    key = "7e492211ca9f4a95a8e0cb20e98031d2" # Standard IndexNow key
    endpoint = "https://api.indexnow.org/indexnow"
    
    payload = {
        "host": req.host,
        "key": key,
        "keyLocation": f"https://{req.host}/{key}.txt",
        "urlList": req.urls
    }
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.post(endpoint, json=payload)
        
    return {
        "status": "submitted",
        "http_code": res.status_code,
        "submitted_urls_count": len(req.urls),
        "host": req.host
    }

