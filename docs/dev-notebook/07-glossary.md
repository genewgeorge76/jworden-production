# 07 — Glossary

> Terms, env vars, URLs, and repo paths in one searchable place.

## Live URLs

| What | URL |
|------|-----|
| Production frontend | https://www.jwordenasphaltpaving.com |
| Backend (Railway) | https://codexbuildfreeofbase44-production.up.railway.app |
| GitHub repo | https://github.com/jwordenaii/codexbuildfreeofbase44 |
| Future media CDN | https://media.jwordenasphaltpaving.com (after R2 setup) |

## Key files

| Path | Purpose |
|------|---------|
| [src/App.jsx](../../src/App.jsx) | Main React router, all routes defined here |
| [src/lib/featureFlags.js](../../src/lib/featureFlags.js) | Feature flag registry (all `VITE_FEATURE_*`) |
| [src/lib/AuthContext.jsx](../../src/lib/AuthContext.jsx) | Auth provider, `RequireAuth` source |
| [src/ai/](../../src/ai/) | Experimental AI feature workspace |
| [app/main.py](../../app/main.py) | FastAPI entry point |
| [app/services/jarvis.py](../../app/services/jarvis.py) | Jarvis AI brain + tool definitions |
| [app/services/autonomy_state.py](../../app/services/autonomy_state.py) | Kill switch state |
| [app/services/state_data.py](../../app/services/state_data.py) | 51-jurisdiction engine (Python) |
| [src/lib/states50.js](../../src/lib/states50.js) | 51-jurisdiction engine (JS mirror) |
| [netlify.toml](../../netlify.toml) | Netlify build + headers + redirects |
| [docs/REPO_STABILITY.md](../REPO_STABILITY.md) | Stability playbook |
| [docs/dev-notebook/](.) | THIS folder — strategic memory |

## Feature flags (env vars)

All read from `import.meta.env.VITE_FEATURE_<NAME>`. Default OFF.

| Flag | Controls |
|------|----------|
| `VITE_FEATURE_DISPATCH` | Smart Dispatch Board (`/dispatch`) |
| `VITE_FEATURE_CREW_MAP` | Live GPS map |
| `VITE_FEATURE_JARVIS_PLANNER` | Nightly auto-planner |
| `VITE_FEATURE_WORDEN_INDEX` | Pavement Index dashboard |
| `VITE_FEATURE_MULTI_TENANT` | Multi-tenant SaaS UI |

## Backend env vars (Railway)

| Var | Service | Where to get |
|-----|---------|--------------|
| `ANTHROPIC_API_KEY` | Claude AI | https://console.anthropic.com |
| `OPENAI_API_KEY` | OpenAI | https://platform.openai.com |
| `TAVILY_API_KEY` | Web search | https://tavily.com |
| `VAPI_API_KEY` | Voice AI | https://vapi.ai |
| `VAPI_ASSISTANT_ID` | Vapi assistant | Vapi dashboard |
| `SENDGRID_API_KEY` | Email | https://sendgrid.com |
| `SENDGRID_FROM_EMAIL` | Sender address | — |
| `GOOGLE_MAPS_API_KEY` | Maps | https://console.cloud.google.com |
| `SERPAPI_KEY` | SEO/SERP | https://serpapi.com |
| `GOOGLE_PAGESPEED_API_KEY` / `GOOGLE_PSI_API_KEY` | Lighthouse audits | Google Cloud Console |
| `R2_ACCOUNT_ID` | Cloudflare R2 | Cloudflare dashboard |
| `R2_ACCESS_KEY_ID` | R2 token | R2 → API tokens |
| `R2_SECRET_ACCESS_KEY` | R2 secret | R2 → API tokens |
| `R2_BUCKET` | R2 bucket name | Set when bucket created |
| `R2_PUBLIC_URL` | R2 custom domain | https://media.jwordenasphaltpaving.com |
| `DATABASE_URL` | Postgres | Auto-set by Railway |
| `REDIS_URL` | Redis | Auto-set by Railway |

## Frontend env vars (Netlify)

| Var | Purpose |
|-----|---------|
| `VITE_API_BASE_URL` | Railway backend URL |
| `VITE_SITE_URL` | https://www.jwordenasphaltpaving.com |
| `VITE_GA4_ID` | Google Analytics 4 ID |
| `VITE_FEATURE_*` | All feature flags |
| `GSC_SERVICE_ACCOUNT_JSON` | Google Search Console auto-submit (build-time) |

## Branches

| Branch | Purpose |
|--------|---------|
| `main` | Production. Auto-deploys to Netlify. |
| `feat/dispatch-board` | Dispatch board work in progress |
| `feat/jarvis-surface` | (future) Iron Man UI |
| `fix/<name>` | Bug fix branches |
| `chore/<name>` | Maintenance branches (deps, docs, etc.) |

## Acronyms / terms

| Term | Meaning |
|------|---------|
| ADR | Architecture Decision Record (in `02-architecture-decisions.md`) |
| ARR | Annual Recurring Revenue |
| CDN | Content Delivery Network (Cloudflare) |
| CSP | Content Security Policy (HTTP header) |
| GSC | Google Search Console |
| HUD | Heads-Up Display (Iron Man style) |
| LCP | Largest Contentful Paint (Lighthouse metric) |
| LLM | Large Language Model (Claude, GPT) |
| OAuth | Authorization protocol (used for GSC) |
| R2 | Cloudflare's S3-compatible object storage |
| RS256 | RSA SHA-256 signing (JWT) |
| SaaS | Software as a Service |
| SOC2 | Security audit certification |
| SPA | Single Page Application |
| SWPPP | Storm Water Pollution Prevention Plan |
| TAM | Total Addressable Market |
| TTI | Time To Interactive (Lighthouse metric) |
| WAF | Web Application Firewall (Cloudflare) |

## Key constants

| Constant | Value | Where |
|----------|-------|-------|
| `TOTAL_US_JURISDICTIONS` | 51 | `app/services/state_data.py` |
| `WORDEN_ACTIVE_STATES` | VA, NC, GA, FL, MI, TX, KS, MO, IA, MN, NY, NJ | `src/lib/states50.js` |
| Default Jarvis email | `j.wordenandsonspaving@gmail.com` | `app/services/jarvis.py` |
| Anthropic model | `claude-3-5-sonnet-latest` | `app/services/jarvis.py` |
