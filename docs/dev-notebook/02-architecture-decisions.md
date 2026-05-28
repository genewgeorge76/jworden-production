# 02 — Architecture Decisions

> Each major technical decision and why we made it.

## ADR-001: Compute on Railway

**Decision**: FastAPI backend, Celery workers, Postgres, Redis all on Railway.

**Why**:
- Single-region is fine for one Virginia business + early multi-tenant
- $5-30/mo total — no premature multi-region cost
- One-click deploys from git
- Postgres + Redis as managed services (no ops work)

**When to revisit**: When we hit 99.5% uptime ceiling or 100+ tenants.

---

## ADR-002: Frontend on Netlify

**Decision**: React 18 + Vite SPA hosted on Netlify, custom domain `www.jwordenasphaltpaving.com`.

**Why**:
- Free tier covers our traffic
- Auto deploy previews per branch
- Edge functions for serverless logic
- Built-in CDN

**When to revisit**: If we need server-side rendering for SEO at scale.

---

## ADR-003: Cloudflare R2 for media (NOT Railway)

**Decision**: Move all media (images, videos, PDFs, scan uploads, AI training data) to Cloudflare R2.

**Why NOT Railway**:
- Railway is compute, not storage
- No global CDN — slow for users far from US East
- Pay for compute hours just to serve static MP4s
- No image transformations
- Bandwidth charges add up
- Volumes don't survive restarts cleanly

**Why R2**:
- 10 GB free + ZERO egress fees (S3 charges $0.09/GB)
- S3-compatible API (every library works)
- Cloudflare's global edge CDN
- Custom domain support: `media.jwordenasphaltpaving.com`
- ~$0.015/GB/mo after free tier

**Pattern**:
- Small static UI assets → still in `public/` (logos, icons, < 50 KB)
- Photos > 100 KB → R2
- Videos → Cloudflare Stream OR YouTube unlisted
- User-uploaded scans → R2 via signed URLs from FastAPI
- AI model weights → R2 or HuggingFace

---

## ADR-004: Anthropic Claude as Jarvis brain

**Decision**: `claude-3-5-sonnet-latest` via Anthropic SDK with two-round tool-use loop.

**Why**:
- Best-in-class reasoning + instruction-following
- Native tool-use API (function calling)
- Long context window (200K tokens)
- Same vendor as the GitHub Copilot model in this IDE — consistency

**Tools wired in `app/services/jarvis.py`**:
- `web_search(query, deep)` → Tavily
- `make_phone_call(to_number, purpose, script_hint)` → Vapi
- `send_email(to_email, subject, body)` → SendGrid

**Fallback**: heuristic responses when `ANTHROPIC_API_KEY` is missing — graceful degrade.

---

## ADR-005: Feature flags via env vars (not a database)

**Decision**: All experimental features gated through `import.meta.env.VITE_FEATURE_*` and read in [src/lib/featureFlags.js](../../src/lib/featureFlags.js).

**Why**:
- Zero runtime overhead
- Flip in seconds via Netlify env UI
- No new dependency
- Safe for build-time tree-shaking (off features get dead-code-eliminated)

**Trade-off**: Requires redeploy to flip. For sub-minute kill switch, would need a database flag — not worth it yet.

---

## ADR-006: AI feature isolation in `src/ai/`

**Decision**: All experimental AI features live in `src/ai/<feature-name>/` until graduation.

**Why**:
- One folder to grep when reviewing AI work
- Easy to extract for the Lite white-label product later
- Future ML team or AI agent can own it without touching public site
- Clear "this is experimental" signal

**Promotion process**: When stable, move to `src/pages/` + `src/components/`, drop the flag, optionally remove `noindex`.

---

## ADR-007: 5-Layer safety for new features

Every new AI feature ships with FIVE independent safeties:

1. **Feature branch** (git isolation)
2. **Runtime feature flag** (env var, default OFF)
3. **Auth gate** (`<RequireAuth>` wrapper)
4. **SEO `noindex` header** (in `netlify.toml`)
5. **Lazy code-split** (`React.lazy(() => import(...))`)

**Why**: Even if any ONE fails, the other four still protect production. No single point of failure for safety.

---

## ADR-008: Anthropic Claude tool-use over OpenAI function calling

**Decision**: Primary AI is Claude. OpenAI used as secondary for specific tasks (proposals, SEO city pages, lead scoring).

**Why**:
- Claude's tool-use is more reliable for multi-step agent tasks
- Better at refusing unsafe actions when autonomy is frozen
- Cheaper for the long-context use cases

---

## ADR-009: Vapi for outbound voice (not Twilio)

**Decision**: Vapi handles all outbound voice AI calls.

**Why**:
- Built specifically for AI voice agents
- Better latency than rolling Twilio + Whisper + ElevenLabs ourselves
- Per-minute pricing ~$0.05
- Handles barge-in, interruptions, retries

**When to revisit**: If we hit 1000+ calls/day and Twilio direct becomes cheaper.

---

## ADR-010: Tavily for web search (not SerpAPI)

**Decision**: Tavily for Jarvis live web search.

**Why**:
- Free tier 1,000 searches/mo
- Built specifically for LLM consumption (clean snippets, no scraping mess)
- Good enough quality for general queries
- SerpAPI kept for Google-specific SEO queries (rank tracking, etc.)

---

## ADR-011: SendGrid for transactional email

**Decision**: SendGrid for all outbound email.

**Why**:
- Free 100 emails/day forever
- Reliable deliverability
- Already wired in [app/services/email_service.py](../../app/services/email_service.py)
- Default sender: `j.wordenandsonspaving@gmail.com`

---

## ADR-012: 51-state engine, not 50

**Decision**: Always use **51** jurisdictions (50 states + DC).

**Why**:
- DC is a real legal jurisdiction with separate licensing/permits
- Federal contracts often require DC permits
- Constant `TOTAL_US_JURISDICTIONS = 51` enforces it across Python + JS
- Verified by `tests/backend/test_state_logic_51.py`

---

## ADR-013: Autonomy kill switch is disk-persisted

**Decision**: Jarvis autonomy state lives on disk (`/tmp/jarvis_autonomy.json`), not in memory.

**Why**:
- Survives container restarts
- Defense-in-depth — if Jarvis crashes mid-action, state is recoverable
- Operator can manually freeze with one shell command
- Audit trail of who froze/unfroze when

---

## ADR-014: Documentation in `docs/dev-notebook/`

**Decision**: All strategic + architectural notes in this folder. Markdown only, never imported by code.

**Why**:
- Zero impact on build/runtime/SEO
- Always up to date in git history
- Searchable (`grep` works)
- Survives all conversation context loss
- Onboarding doc if we hire someone

---

## Open architecture questions (TBD)

| Question | When to decide | Notes |
|----------|----------------|-------|
| Multi-region Postgres? | When uptime requirement > 99.9% | Probably Neon or Supabase read replicas |
| Self-host LLM for cost? | When monthly Claude bill > $500 | Probably Llama 3.1 70B on RunPod |
| Native mobile apps? | When 50+ contractor crews use field app daily | Capacitor is configured, just not shipped |
| GraphQL vs REST? | Probably never | REST is fine for our scale |
| Microservices split? | When team > 10 engineers | Current monolith is right-sized |
