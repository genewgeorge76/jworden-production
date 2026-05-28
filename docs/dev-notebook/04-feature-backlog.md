# 04 — Feature Backlog

> Everything we've discussed building, ordered by ROI and dependency.

## Legend
- 🟢 = Foundation in place, ready to build
- 🟡 = Needs prereq (storage, keys, or another feature)
- 🔵 = Future / aspirational

---

## A. Smart Dispatch Board 🟢
Branch: `feat/dispatch-board` (scaffold pushed, commit `fd8431f`)

| Sub-feature | Status | Complexity |
|-------------|--------|------------|
| Page skeleton + flag-gated route | ✅ Done | — |
| Crew swim-lane timeline (read-only) | Not started | Medium |
| Job status tag system (6 statuses) | Not started | Easy |
| Drag-and-drop rescheduling | Not started | Medium |
| Vapi auto-call on reschedule | Not started | Easy (Vapi already wired) |
| Live revenue tracker per crew | Not started | Easy |

**Edge over ServiceTitan**: drag-drop triggers a **real human-sounding Vapi call** to the affected customer, not a generic SMS.

---

## B. Live GPS Map View 🟡
Depends on: Mapbox account (free tier)

| Sub-feature | Status | Notes |
|-------------|--------|-------|
| Mapbox integration | Not started | Free 50K loads/mo |
| Truck pins (real-time GPS) | Not started | Need crew device GPS feed |
| Job pins (color by status) | Not started | — |
| Click pin → call crew via Vapi | Not started | — |
| Geofence alerts | Not started | Mapbox geofencing |

---

## C. AI Route Optimizer 🟡
Depends on: Dispatch board basics + at least 1 day of real job data

| Sub-feature | Status | Notes |
|-------------|--------|-------|
| Google OR-tools integration (free) | Not started | Open source |
| **Asphalt cooling time constraint** | Not started | **THE moat — nobody else has this** |
| Truck capacity (tonnage) constraints | Not started | — |
| Crew skill matching | Not started | — |
| Live re-optimize on changes | Not started | — |

**Why this matters**: Hot mix asphalt has to be laid within ~2 hrs of pickup. Routes that ignore this = wasted material. ServiceTitan/Procore have no idea.

---

## D. Jarvis "Plan Tomorrow" Auto-Planner 🟡
Depends on: Dispatch board + Route optimizer

| Sub-feature | Status | Notes |
|-------------|--------|-------|
| Pull tomorrow's confirmed jobs | Not started | DB query |
| Check weather forecast | Not started | NOAA API or OpenWeather |
| Check asphalt plant hours | Not started | Configurable per region |
| Auto-assign crews | Not started | Calls Route Optimizer |
| Send preview to your phone | Not started | SMS via Twilio or Vapi |
| 1-tap approve → SMS to crews at 5am | Not started | Cron task |

**Edge over ServiceTitan**: theirs requires a human dispatcher every morning. Yours runs autonomously overnight.

---

## E. Jarvis Command Surface (Iron Man UI) 🟡
Branch (future): `feat/jarvis-surface`
Depends on: AI keys activated

| Sub-feature | Status | Tech |
|-------------|--------|------|
| Static visual prototype (orbs, glass, particles) | Not started | React Three Fiber + Framer Motion |
| Voice waveform during Vapi calls | Not started | Web Audio API + Canvas |
| Live session feed (you + wife + tech + 6 calls) | Not started | WebSocket (already exists) |
| Photo upload progress orbs | Not started | R2 + WebSocket |
| AI compaction verification card | Not started | Claude Vision |
| Multi-session grid | Not started | — |

**Vision**: Open `/jarvis-live` on iPad. See all active sessions in real time. Looks futuristic. Doesn't lag.

---

## F. Cloudflare R2 Media Migration 🟡
Depends on: You creating R2 bucket + token (~10 min)

| Sub-feature | Status | Notes |
|-------------|--------|-------|
| Create R2 bucket + custom domain | Blocked on you | Cloudflare dashboard |
| Upload script (S3-compatible) | Not started | `scripts/upload-to-r2.mjs` |
| Move 2 large `.MOV` to YouTube | Not started | Quick win |
| Migrate KFC photo set (~150 MB) to R2 | Not started | Auto-replace src refs |
| Verify dist drops to ~15 MB | Not started | — |

---

## G. Multi-Tenant Refactor 🔵
Depends on: First paying customer interest

| Sub-feature | Status | Notes |
|-------------|--------|-------|
| `organization_id` on every table | Not started | Alembic migration |
| Tenant-scoped queries everywhere | Not started | Code review pass |
| Tier tagging (`@tier("lite"/"pro"/"enterprise")`) | Not started | Decorator pattern |
| Stripe billing | Not started | Stripe handles it |
| Onboarding flow | Not started | New routes |

---

## H. Worden Pavement Index 🔵
Depends on: 100+ scans collected

| Sub-feature | Status | Notes |
|-------------|--------|-------|
| Aggregate pricing data (anonymized) | Not started | Postgres views |
| Quarterly report generator | Not started | Could be Claude-generated |
| Public landing page for the Index | Not started | SEO play |
| API for licensees (paid) | Not started | Pro/Enterprise tier |

---

## I. SOC2 Compliance Path 🔵
Depends on: Wanting municipal/enterprise customers

| Sub-feature | Status | Notes |
|-------------|--------|-------|
| Sign Vanta or Drata | Blocked on you | $5K-$15K |
| Wire automated controls | Not started | Vanta does most |
| 6-month observation window | — | Type II requires this |

---

## J. Quick Wins (do anytime)

| Item | Cost | Time |
|------|------|------|
| Add CSP header to `netlify.toml` | $0 | 10 min |
| Wire Sentry (already have setup doc) | $0 free tier | 30 min |
| Add UptimeRobot monitoring | $0 free | 15 min |
| Enable GitHub branch protection | $0 | 5 min (you click) |
| Run `npx depcheck`, remove unused deps | $0 | 30 min |
| Convert public images to WebP | $0 | 1 hr (script exists) |
| Add Renovate/Dependabot | $0 | 15 min |

---

## K. Dormant capabilities (already built, just need keys)

| Capability | Code | Needs |
|------------|------|-------|
| Jarvis Claude brain | ✅ Live | `ANTHROPIC_API_KEY` |
| Web search | ✅ Live | `TAVILY_API_KEY` |
| Outbound voice calls | ✅ Live | `VAPI_API_KEY` + assistant ID |
| Email automation | ✅ Live | `SENDGRID_API_KEY` |
| AI proposal generator | ✅ Live | `OPENAI_API_KEY` |
| SEO city page generator | ✅ Live | `OPENAI_API_KEY` |
| Lighthouse audits | ✅ Live | `GOOGLE_PSI_API_KEY` |
| Sitemap auto-submit to Google | ✅ Live | `GSC_SERVICE_ACCOUNT_JSON` |

**Lighting these up = biggest quality leap available, zero new code needed.**
