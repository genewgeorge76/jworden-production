# 00 — Master Roadmap (THE ORDER)

> The single source of truth for what to do next, in what order, and why.
> Updated: May 5, 2026.

## Guiding principle

**Foundation before features. Stability before speed. Defense before offense.**

Each phase only starts when the prior phase is stable. We never move forward on broken ground.

---

## Phase 0 — Stability Foundation ✅ DONE

| # | Item | Status | Where |
|---|------|--------|-------|
| 1 | `.gitignore` cleaned (debug logs, .DS_Store) | ✅ | commit `bf85ad1` |
| 2 | Stray `.txt` debug files deleted | ✅ | working tree clean |
| 3 | `CODEOWNERS` for required reviewers | ✅ | [/CODEOWNERS](../../CODEOWNERS) |
| 4 | PR template with safety checklist | ✅ | [.github/PULL_REQUEST_TEMPLATE.md](../../.github/PULL_REQUEST_TEMPLATE.md) |
| 5 | Feature flag registry | ✅ | [src/lib/featureFlags.js](../../src/lib/featureFlags.js) |
| 6 | `src/ai/` workspace folder for safe AI dev | ✅ | [src/ai/README.md](../../src/ai/README.md) |
| 7 | Repo stability guide | ✅ | [docs/REPO_STABILITY.md](../REPO_STABILITY.md) |
| 8 | Local preflight script (lint + build + secret scan) | ✅ | [scripts/preflight.ps1](../../scripts/preflight.ps1) |
| 9 | Dispatch board scaffold on `feat/dispatch-board` branch | ✅ | gated behind `VITE_FEATURE_DISPATCH` |

---

## Phase 1 — Storage + Performance (NEXT) 🟡

**Goal**: Move heavy media off the repo and onto Cloudflare. Fixes 340 MB `dist/`, faster deploys, faster mobile load.

| Order | Item | Owner | Notes |
|-------|------|-------|-------|
| 1 | Create Cloudflare R2 bucket `jworden-media` | **You** | Cloudflare dashboard → R2 → Create Bucket |
| 2 | Connect custom domain `media.jwordenasphaltpaving.com` to bucket | **You** | Cloudflare auto-creates DNS |
| 3 | Create R2 API token (Object Read & Write) | **You** | Save Access Key ID + Secret to `.env.local` (NEVER commit) |
| 4 | Build upload script `scripts/upload-to-r2.mjs` | **Me** | S3-compatible API |
| 5 | Move 2 large `.MOV` files to YouTube unlisted | **You + Me** | Quick win — saves 17 MB immediately |
| 6 | Migrate `public/work/kfc/*.jpg` (~150 MB) to R2 | **Me** | Update React refs to CDN URL |
| 7 | Verify build, dist size drops to ~15 MB | **Me** | Should be visible in Netlify deploy logs |
| 8 | Add R2 env vars to Netlify production | **You** | For future build-time scripts |

**Acceptance**: `dist/` total size < 25 MB. Production site visually identical. Lighthouse mobile score up.

---

## Phase 2 — Activate Dormant AI 🟡

**Goal**: Turn ON the AI features that are already built but waiting for keys.

| Order | Item | Owner | Cost |
|-------|------|-------|------|
| 1 | Add `ANTHROPIC_API_KEY` to Railway env | **You** | $0 baseline + usage |
| 2 | Add `TAVILY_API_KEY` (web search) | **You** | Free 1K searches/mo |
| 3 | Add `VAPI_API_KEY` + assistant ID (voice calls) | **You** | $0 baseline |
| 4 | Add `SENDGRID_API_KEY` + from email | **You** | Free 100 emails/day |
| 5 | Add `OPENAI_API_KEY` (proposals, SEO city pages) | **You** | $0 baseline |
| 6 | Verify `/api/v1/jarvis/status` shows all tools=true | **Me** | Quick curl check |
| 7 | Add `GOOGLE_PSI_API_KEY` (Lighthouse audits) | **You** | Free |
| 8 | Add `GSC_SERVICE_ACCOUNT_JSON` (sitemap auto-submit) | **You** | Free — code already pushed |

**Acceptance**: Jarvis answers in Claude voice, makes a test call, sends a test email, runs a web search.

---

## Phase 3 — Smart Dispatch Board 🟡

**Goal**: Match ServiceTitan's flagship feature + add 4 things they CAN'T do.

Branch: `feat/dispatch-board` (already created, scaffold pushed)

| Order | Item | What it does |
|-------|------|--------------|
| 1 | Crew swim-lane timeline (read-only) | See whole day at a glance |
| 2 | Job status tag system (EN-ROUTE, ON-SITE, LAYING, COMPLETE, BLOCKED, RECALL) | Instant visual status |
| 3 | Drag-and-drop rescheduling | Move jobs between crews/times |
| 4 | Vapi auto-call customer on reschedule | "Your appointment shifted to..." |
| 5 | Live GPS map view (Mapbox free tier) | Truck pins + jobsite pins |
| 6 | AI Route Optimizer with **asphalt cooling** logic | ServiceTitan can't do this |
| 7 | Live revenue tracker per crew ($/day, $/hr, vs goal) | Board-level dashboard |
| 8 | **Jarvis "Plan Tomorrow"** (overnight auto-plan) | Killer feature — fully autonomous |

**Acceptance**: Local preview at `/dispatch` shows working board with mock data. Promote to prod with feature flag flip.

---

## Phase 4 — Jarvis Command Surface 🔵

**Goal**: The Iron-Man-style live visual UI. Liquid, glass, particles, real-time.

Branch (future): `feat/jarvis-surface`

| Order | Item | Tech |
|-------|------|------|
| 1 | Static visual prototype (orbs, glass panels, particle bg, mock data) | React Three Fiber + Framer Motion + Tailwind |
| 2 | Wire to Jarvis WebSocket for live session feed | Existing `WEBSOCKET_CHAT.md` infra |
| 3 | Live voice waveform during Vapi calls | Web Audio API + Canvas |
| 4 | Photo upload progress orbs (you/wife/tech all see same screen) | Pusher or Supabase Realtime |
| 5 | AI compaction verification card (tech photos roller) | Claude Vision |
| 6 | Multi-session view (3-6 concurrent calls + you + wife + tech) | Real-time grid |

**Acceptance**: Open `/jarvis-live` on iPad. See all active sessions in real time. Looks futuristic. Doesn't lag.

---

## Phase 5 — Multi-Tenant Refactor 🔵

**Goal**: Architect the codebase so the "Lite" white-label product can split off cleanly.

| Order | Item | Why |
|-------|------|-----|
| 1 | Add `organization_id` column to every table in `app/models.py` | Tenant isolation foundation |
| 2 | Tenant-scoped queries in every router | No cross-tenant leakage |
| 3 | Tier tagging system: `@tier("lite")`, `@tier("pro")`, `@tier("enterprise_only")` | Pricing wall in code |
| 4 | Stripe billing integration | Take payments |
| 5 | Tenant onboarding flow (invite → org → first scan) | First customer experience |
| 6 | "Crown jewels" stay enterprise-only: Worden Index, anomaly detector, fine-tuned vision model | Your moat |

**Acceptance**: Can spin up a 2nd tenant locally that sees a stripped feature set.

---

## Phase 6 — Customer #2 + Beyond 🔵

| Phase | Goal | Outcome |
|-------|------|---------|
| 6a | First paying contractor (TX/FL/NC) | $24K ARR — proof of multi-tenancy |
| 6b | Worden Pavement Index quarterly report (free PR) | Industry credibility |
| 6c | SOC2 Type I via Vanta/Drata | Unlocks municipal contracts |
| 6d | Train paving-specific vision model on accumulated scans | Mathematical moat |
| 6e | 50 paying contractors | $500K-$1.2M ARR |
| 6f | Lite tier launch ($299/mo white-label) | Scales to $3-6M ARR |

**Long-term endgame**: Keep crown for J. Worden & Sons. Sell stripped Lite/Pro versions to competitors. Use proceeds to fund next AI ventures.

---

## Quick rules of the road

1. **Never push directly to main without a green PR** (after we enable branch protection).
2. **Every new AI feature gets a feature flag**, default OFF.
3. **Every new media file goes to R2**, never to `public/`.
4. **Every long session ends with an update to** [05-decisions-log.md](./05-decisions-log.md).
5. **If we're unsure, default to safer / smaller / reversible.**

---

## What's blocking right now

| Blocker | Resolves when |
|---------|---------------|
| R2 bucket doesn't exist | You create it (~10 min) |
| AI keys not in Railway | You add them (~15 min total) |
| GitHub branch protection not enabled | You toggle in GitHub UI (~2 min) |

Everything else is unblocked.
