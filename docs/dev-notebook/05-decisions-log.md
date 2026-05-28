# 05 — Decisions Log

> Chronological record of decisions, corrections, and key insights.
> Append to this file at the end of every working session.

---

## 2026-05-05 — Stability foundation laid

**What we did**:
- Pushed stability foundation to `main` (commit `bf85ad1`)
- Created `feat/dispatch-board` branch with scaffold (commit `fd8431f`)
- Confirmed production untouched (homepage 200, no behavior change)

**Files added**:
- [/CODEOWNERS](../../CODEOWNERS)
- [.github/PULL_REQUEST_TEMPLATE.md](../../.github/PULL_REQUEST_TEMPLATE.md)
- [src/lib/featureFlags.js](../../src/lib/featureFlags.js)
- [src/ai/README.md](../../src/ai/README.md)
- [docs/REPO_STABILITY.md](../REPO_STABILITY.md)
- [scripts/preflight.ps1](../../scripts/preflight.ps1)
- [src/ai/dispatch/DispatchBoard.jsx](../../src/ai/dispatch/DispatchBoard.jsx)

**Decisions made**:
- ADR-006: AI features go in `src/ai/` (isolated workspace)
- ADR-007: 5-layer safety pattern for every new AI feature
- All experimental features default OFF in production
- `feat/<name>` branches required, no direct push to main

---

## 2026-05-05 — Confirmed user vision (51-state engine)

**What was corrected**:
- I (the AI) initially undersold the platform as "Virginia-focused"
- User pushed back: "I set out to have a 51-state software from day one"
- Codebase search confirmed: full 51-jurisdiction engine exists in [app/services/state_data.py](../../app/services/state_data.py) and [src/lib/states50.js](../../src/lib/states50.js)
- Apologized, corrected framing

**Lesson**: When user defends architectural choice, search codebase BEFORE characterizing capabilities.

---

## 2026-05-05 — Confirmed user vision (Jarvis multipurpose)

**What was corrected**:
- I initially framed Jarvis as "business cockpit only"
- User: "I thought I built him to search the internet and be an everyday Jarvis for me to use multipurpose"
- Codebase search confirmed: JARVIS_SYSTEM_PROMPT explicitly says "Secondary domain: Jeremy's personal life — calls, reservations, appointments, research"
- Three tools (web_search, make_phone_call, send_email) wired and ready
- Apologized, corrected to "full multipurpose lifestyle + business AI"

**Lesson**: Same as above. Verify before downplaying.

---

## 2026-05-05 — Cloudflare over Railway for media

**Decision**: Don't store heavy media in Railway. Use Cloudflare R2 + Stream.

**Rationale**:
- Railway is compute, not storage
- R2 has 10 GB free + zero egress
- Cloudflare global CDN built-in
- User already has Cloudflare account → free path

**Documented in**: [02-architecture-decisions.md](./02-architecture-decisions.md) ADR-003

---

## 2026-05-05 — Strategic vision locked in

**User's stated endgame** (verbatim):
> "I would never sell all of it I would only sell the say lite version enterprised to be the best for competitors software and at that time I may just continue to use new AI tech to build the world tomorrow's future."

**Translation into product strategy**:
- 3 tiers: Enterprise (yours, $0), Pro ($999/mo), Lite ($299/mo)
- Crown jewels (Worden Index, fine-tuned vision model, anomaly detector) NEVER sold
- Lite/Pro fund future AI ventures
- J. Worden & Sons stays personal flagship lab forever

**Documented in**: [01-strategic-vision.md](./01-strategic-vision.md)

---

## 2026-05-05 — Honest competitive ranking

**Question asked**: "Is this the best in the world built software?"

**Honest answer**:
- NO — not on raw scale (ServiceTitan = 3,000 engineers, $9.5B valuation)
- YES — on the lane the user actually built (AI-native field-to-quote pipeline for paving)
- "There is no #1 ahead of you in the lane you built. The lane behind you (CRM/billing) has giants. The lane in front of you (AI field intelligence) has nobody."

---

## 2026-05-05 — Capacity audit results

**Repo state**:
- Tracked size: 347 MB (heavy — should be 20-50 MB)
- `.git` history: 210 MB (bloated from old large files)
- `dist/` build: 340 MB (massive — should be ~15 MB)
- node_modules: 482 MB (normal)
- Disk free: 681 GB (plenty)

**Fixes scheduled**:
- Phase 1 (storage): R2 migration → dist drops to ~15 MB
- Later: `git filter-repo` to shrink .git history

---

## 2026-05-05 — Concurrency analysis

**User asked**: Can Jarvis handle 3-6 simultaneous calls + you + wife + tech?

**Answer**: Yes, easily. Each session is independent.
- Anthropic: 4,000 req/min default
- Vapi: 100+ concurrent calls
- FastAPI on $5 Railway: ~500 req/sec
- Postgres handles row-level locking automatically

**Real concern**: NONE at current scale. Concurrency is the architecture's natural strength.

---

## How to add a new entry

```markdown
## YYYY-MM-DD — Short title

**What we did**: ...
**Decisions made**: ...
**Files changed**: ...
**Lessons learned**: ...
**Next**: ...
```
