from contextlib import asynccontextmanager

import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from .config import settings
from .core.limiter import limiter
from .database import Base, engine
from .routers import (
    health, leads, ai, analytics, blog, payments, voice,
    lien_calendar, customers, crm,
    # Wave 2
    proposals, operations, dispatch, foreman, workforce, subcontractors,
    safety, cashflow, kpi, vdot_bids, market_intelligence, gallery,
    # Wave 3
    auth, admin_2fa, pricing, permits, vector_search, client_portal, gbp,
    # Wave 4
    scan_campaign,
    # Wave 6
    voice_ai,
    seo,
    anomalies,
    # Jarvis OS — new capabilities
    catalog,
    gantt,
    quickbooks,
    saas_billing,
    jarvis_modes,
    bim,
    weather,
    # Wave 8 — advisor + road-scanning stack
    advisor,
    pavement,
    # Wave 9 — production hardening
    monitoring,
)


_DEFAULT_SECRETS = {'change-me', 'change-me-jwt'}


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.environment == 'production':
        if settings.jworden_master_key in _DEFAULT_SECRETS:
            raise RuntimeError('JWORDEN_MASTER_KEY is still the default value — refusing to start in production. Generate one with: openssl rand -hex 32')
        if settings.jwt_secret_key in _DEFAULT_SECRETS:
            raise RuntimeError('JWT_SECRET_KEY is still the default value — refusing to start in production. Generate one with: openssl rand -hex 32')
    Base.metadata.create_all(bind=engine)
    yield


if settings.sentry_dsn:
    sentry_sdk.init(dsn=settings.sentry_dsn, environment=settings.environment, traces_sample_rate=0.1)

app = FastAPI(
    title='J. Worden & Sons API',
    description='Platform API for jwordenasphaltpaving.com',
    version='2.0.0',
    lifespan=lifespan,
    docs_url='/docs' if settings.debug else None,
    redoc_url=None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        'https://www.jwordenasphaltpaving.com',
        'https://jwordenasphaltpaving.com',
        'http://localhost:5173',
        'http://localhost:5174',
    ],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Core
app.include_router(health.router)
app.include_router(leads.router, prefix='/api/v1')
app.include_router(ai.router, prefix='/api/v1')
app.include_router(analytics.router, prefix='/api/v1')

# Wave 1
app.include_router(blog.router, prefix='/api/v1')
app.include_router(payments.router, prefix='/api/v1')
app.include_router(voice.router, prefix='/api/v1')
app.include_router(lien_calendar.router, prefix='/api/v1')
app.include_router(advisor.router, prefix='/api/v1')
app.include_router(pavement.router, prefix='/api/v1')
app.include_router(monitoring.router, prefix='/api/v1')
app.include_router(customers.router, prefix='/api/v1')
app.include_router(crm.router, prefix='/api/v1')

# Wave 2
app.include_router(proposals.router, prefix='/api/v1')
app.include_router(operations.router, prefix='/api/v1')
app.include_router(dispatch.router, prefix='/api/v1')
app.include_router(foreman.router, prefix='/api/v1')
app.include_router(workforce.router, prefix='/api/v1')
app.include_router(subcontractors.router, prefix='/api/v1')
app.include_router(safety.router, prefix='/api/v1')
app.include_router(cashflow.router, prefix='/api/v1')
app.include_router(kpi.router, prefix='/api/v1')
app.include_router(vdot_bids.router, prefix='/api/v1')
app.include_router(market_intelligence.router, prefix='/api/v1')
app.include_router(gallery.router, prefix='/api/v1')

# Wave 3
app.include_router(auth.router, prefix='/api/v1')
app.include_router(admin_2fa.router, prefix='/api/v1')
app.include_router(pricing.router, prefix='/api/v1')
app.include_router(permits.router, prefix='/api/v1')
app.include_router(vector_search.router, prefix='/api/v1')
app.include_router(client_portal.router, prefix='/api/v1')
app.include_router(gbp.router, prefix='/api/v1')

# Wave 4
app.include_router(scan_campaign.router, prefix='/api/v1')

# Wave 6
app.include_router(voice_ai.router, prefix='/api/v1')
app.include_router(seo.router, prefix='/api/v1')
app.include_router(anomalies.router, prefix='/api/v1')

# Jarvis OS — Catalog, Gantt, QuickBooks, SaaS billing, Jarvis three-faces
app.include_router(catalog.router, prefix='/api/v1')
app.include_router(gantt.router, prefix='/api/v1')
app.include_router(quickbooks.router, prefix='/api/v1')
app.include_router(saas_billing.router, prefix='/api/v1')
app.include_router(jarvis_modes.router, prefix='/api/v1')
app.include_router(bim.router, prefix='/api/v1')
app.include_router(weather.router, prefix='/api/v1')
