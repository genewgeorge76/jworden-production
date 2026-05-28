# JWordenAI — Master Environment Keys Reference

**Send to:** j.wordenandsonspaving@gmail.com
**Generated:** 2026-05-04
**Repo:** github.com/jwordenaii/codexbuildfreeofbase44

This is the complete list of environment variables the entire stack reads, grouped by purpose.
**Bold = required for that feature to work at all.** *Italic = optional with a sensible default.*

> **Where to set these:**
> - **Backend (Railway):** Project → Variables tab. Add, then redeploy.
> - **Frontend (Netlify):** Site → Site configuration → Environment variables.
> - **Local dev:** create `.env` at repo root (gitignored).

---

## 0 · Just-shipped Jarvis premium features

These three unlock everything we built today. Get them first.

| Variable | Where | Get it from | Why |
|---|---|---|---|
| **`ANTHROPIC_API_KEY`** | Railway | https://console.anthropic.com/ | Gives Jarvis a real brain (Claude 3.5 Sonnet). Without this, he runs on heuristic fallback. |
| *`ANTHROPIC_MODEL`* | Railway | (default `claude-3-5-sonnet-latest`) | Override to use opus or haiku if you want. |
| **`TAVILY_API_KEY`** | Railway | https://app.tavily.com/ (free tier = 1,000 searches/month, no card) | Enables Jarvis web search tool. |
| *`TAVILY_MAX_RESULTS`* | Railway | (default `5`) | Results returned per search. |
| **`VAPI_API_KEY`** | Railway | https://dashboard.vapi.ai/ → Account → API Keys → **Private Key** | Lets Jarvis place real outbound phone calls. |
| **`VAPI_PHONE_NUMBER_ID`** | Railway | Vapi dashboard → Phone Numbers → buy/import → copy the UUID | The number Jarvis dials FROM. |
| **`VAPI_ASSISTANT_ID`** | Railway | Vapi dashboard → Assistants → Create from `/public/vapi-assistant.json` → copy UUID | The voice persona that handles the conversation. |
| *`JARVIS_AUTONOMY_STATE_PATH`* | Railway | (default `/tmp/jarvis_autonomy.json`) | Override if you want kill-switch state on a persistent volume. |

---

## 1 · Core platform (backend, required)

| Variable | Required | Notes |
|---|---|---|
| **`DATABASE_URL`** | ✅ | Postgres URL. Railway provides automatically when you add a Postgres plugin. SQLite fallback exists for dev. |
| **`REDIS_URL`** | ✅ | Used by Celery, cache, conversation memory. Railway Redis plugin sets this. |
| **`JWT_SECRET_KEY`** | ✅ | Long random string. Generate: `openssl rand -hex 32` |
| **`JWORDEN_MASTER_KEY`** | ✅ | Your top-level master token (admin override). Long random string. |
| **`ADMIN_PIN`** | ✅ | The 4-8 digit PIN your Command Center prompts for. |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | optional | Alternative to `ADMIN_PIN`. |
| `AUTH_MODE` | optional | `required` (default) or `optional`. Leave alone in prod. |
| `AUTO_CREATE_TABLES` | optional | `true` (default) on first boot. |
| `WEB_CONCURRENCY` | optional | Gunicorn workers. Default auto. |

---

## 2 · AI providers

| Variable | Required for | Get it from |
|---|---|---|
| **`OPENAI_API_KEY`** | Lead qualifier, document intelligence, ai_engine, analytics_ai, vision | https://platform.openai.com/api-keys |
| **`ANTHROPIC_API_KEY`** | Jarvis brain (NEW) | https://console.anthropic.com/ |
| `LANGSMITH_API_KEY` | LLM tracing (optional) | https://smith.langchain.com/ |
| `LANGSMITH_PROJECT` | optional | default `jworden-ai` |
| `LANGSMITH_TRACING_V2` | optional | `true` to enable |
| `HUMAN_REVIEW_THRESHOLD` | optional | default `0.75` confidence floor |

---

## 3 · Voice / phone (Vapi — NEW)

| Variable | Notes |
|---|---|
| **`VAPI_API_KEY`** | Private key from dashboard |
| **`VAPI_PHONE_NUMBER_ID`** | UUID of the phone number Jarvis dials FROM |
| **`VAPI_ASSISTANT_ID`** | UUID of the assistant voice/persona |

---

## 4 · Web search (Tavily — NEW)

| Variable | Notes |
|---|---|
| **`TAVILY_API_KEY`** | Free tier 1k/mo at https://app.tavily.com/ |
| `TAVILY_MAX_RESULTS` | Default 5 |

---

## 4.5 · SMS verification (Twilio Verify — NEW)

| Variable | Notes |
|---|---|
| **`TWILIO_ACCOUNT_SID`** | Starts with `AC…`. https://console.twilio.com/ |
| **`TWILIO_AUTH_TOKEN`** | 32-char hex. **Treat like a password — rotate if leaked.** |
| **`TWILIO_VERIFY_SERVICE_SID`** | Starts with `VA…`. Twilio Console → Verify → Services. |
| `ADMIN_2FA_PHONE` | Optional. E.164 phone for the `/admin/start` shortcut, e.g. `+18044461296`. |

Endpoints exposed: `POST /api/v1/twilio/verify/start`, `POST /api/v1/twilio/verify/check`, `POST /api/v1/twilio/verify/admin/start`, `GET /api/v1/twilio/verify/status`.

---

## 5 · Email (SendGrid)

| Variable | Required | Notes |
|---|---|---|
| **`SENDGRID_API_KEY`** | for outbound email | https://app.sendgrid.com/ → Settings → API Keys |
| **`SENDGRID_FROM_EMAIL`** | ✅ | Verified sender address. |
| `SENDGRID_FROM_NAME` | optional | default `J. Worden & Sons Asphalt Paving` |
| `ADMIN_NOTIFY_EMAIL` | optional | default `j.wordenandsonspaving@gmail.com` |

---

## 6 · Company defaults (templates)

| Variable | Default |
|---|---|
| `COMPANY_PHONE` | `(804) 555-0100` |
| `COMPANY_EMAIL` | `j.wordenandsonspaving@gmail.com` |
| `COMPANY_WEBSITE` | `https://jwordenasphaltpaving.com` |
| `COMPANY_ADDRESS` | `Richmond, VA` |

---

## 7 · Google integrations

| Variable | Required for | Get it from |
|---|---|---|
| `GA4_SERVICE_ACCOUNT_JSON` | GA4 analytics in Command Center | GCP IAM → Service Account → JSON key (paste full JSON as one line) |
| `GA4_PROPERTY_ID` | GA4 | GA4 admin → Property settings |
| `GSC_SERVICE_ACCOUNT_JSON` | Search Console data | GCP IAM (same SA usually works) |
| `GSC_SITE_URL` | GSC | e.g. `https://www.jwordenasphaltpaving.com/` (with trailing slash) |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Ads intelligence | https://ads.google.com/ → Tools → API Center |
| `GOOGLE_ADS_SITE_DOMAIN` | optional | default `jworden.com` |

---

## 8 · Payments (Stripe)

| Variable | Required for | Notes |
|---|---|---|
| `STRIPE_SECRET_KEY` | checkout sessions | https://dashboard.stripe.com/apikeys |
| `STRIPE_WEBHOOK_SECRET` | webhook validation | Stripe → Developers → Webhooks |
| `STRIPE_PUBLIC_KEY` | frontend | Set on Netlify |

---

## 9 · Domain-specific data feeds

| Variable | Notes |
|---|---|
| `VDOT_BID_API_KEY` | Virginia DOT bid scraper (optional) |
| `VDOT_API_BASE` | default `https://api.virginiadot.org/v1` |
| `VISION_INFERENCE_URL` | Custom vision model endpoint (optional) |

---

## 10 · Observability

| Variable | Notes |
|---|---|
| `SENTRY_DSN` | Error monitoring — https://sentry.io/ |
| `SENTRY_TRACES_SAMPLE_RATE` | default `0.1` |
| `LOG_LEVEL` | default `INFO` |
| `LOG_FORMAT` | `text` (default) or `json` |

---

## 11 · Cache / scaling tunables (all optional)

`CACHE_TTL_CRM_LEADS` (30s), `CACHE_TTL_ANALYTICS` (60s), `CACHE_TTL_KPI_WALL` (300s), `CACHE_TTL_CUSTOMERS` (120s), `CACHE_TTL_BLOG` (3600s), `CACHE_TTL_ESTIMATES` (86400s), `DB_POOL_SIZE` (5), `DB_MAX_OVERFLOW` (10), `DB_POOL_RECYCLE` (1800), `DB_POOL_TIMEOUT` (30), `EXTRA_CORS_ORIGINS` (csv).

---

## 12 · Frontend (Netlify)

Vite-exposed variables must start with `VITE_`. The frontend currently mostly proxies through Netlify functions, but if you ever ship direct-from-browser keys, set them here:

| Variable | Notes |
|---|---|
| `VITE_API_BASE` | Override the Railway URL if needed |
| `VITE_STRIPE_PUBLIC_KEY` | Public Stripe key |

---

## Minimum viable launch (just to make today's features work)

If you only have time for the smallest possible setup, set these 5 keys on Railway:

```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxx
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxxxxxx
VAPI_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPI_PHONE_NUMBER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VAPI_ASSISTANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Then hit `https://www.jwordenasphaltpaving.com/api/v1/jarvis/status` — you should see:
```json
{
  "engine": "anthropic-claude",
  "tools": { "web_search": true, "make_phone_call": true },
  ...
}
```

That's the full Tony Stark loop, with the kill switch we shipped already protecting you.

---

## Cost ceiling estimate (light usage)

| Service | Free tier | Real-world starting cost |
|---|---|---|
| Anthropic Claude | None — pay per token | ~$5-20/mo for 100 conversations/day |
| Tavily | 1,000 searches/mo | $0 unless you exceed |
| Vapi | None | ~$0.05/min + Twilio number ~$1/mo |
| OpenAI | None | ~$5-15/mo for existing usage |
| SendGrid | 100/day | $0 |
| Sentry | 5k events/mo | $0 |
| Railway | $5 credit/mo | ~$10-25/mo for current size |
| Netlify | Generous free | $0 |

**Total floor: ~$15/mo. Active usage: ~$50-80/mo.**

---

## How to email this to yourself

From the repo root:
```powershell
# Once SENDGRID_API_KEY + SENDGRID_FROM_EMAIL are set on Railway, you can ask Jarvis directly:
# "Email this keys document to j.wordenandsonspaving@gmail.com"
# He will use the existing email_router.

# OR manually right now:
Get-Content .\ENV_KEYS_MASTER.md | Out-File -Encoding utf8 .\keys-export.md
# Then attach keys-export.md to an email in Gmail.
```
