# JWordenAI Dev Notebook

This is the **master reference** for everything we've designed, decided, and planned.

**Read order matters** — start with `00-master-roadmap.md` and work down.

## Why this exists

- ✅ Persistent memory of every architectural decision
- ✅ The **correct order of operations** so we never lose the plan
- ✅ Reference at any time without searching old chats
- ✅ Onboarding doc if you ever bring on a developer
- ✅ **Zero impact on production** — these are markdown files only, never bundled, never deployed to the site

## Files

| # | File | What it covers |
|---|------|----------------|
| 00 | [00-master-roadmap.md](./00-master-roadmap.md) | **THE ORDER** — Phase 0-6 with priorities and dependencies |
| 01 | [01-strategic-vision.md](./01-strategic-vision.md) | Keep flagship + sell Lite/Pro endgame; never sell crown |
| 02 | [02-architecture-decisions.md](./02-architecture-decisions.md) | Why Cloudflare R2, Railway, Netlify split |
| 03 | [03-jarvis-capabilities.md](./03-jarvis-capabilities.md) | What Jarvis can do today + dormant features |
| 04 | [04-feature-backlog.md](./04-feature-backlog.md) | Dispatch board, Jarvis Surface, Worden Index, etc. |
| 05 | [05-decisions-log.md](./05-decisions-log.md) | Chronological record of decisions + corrections |
| 06 | [06-action-items.md](./06-action-items.md) | Open todos + who/what blocks each |
| 07 | [07-glossary.md](./07-glossary.md) | Terms, env vars, URLs, repo paths in one place |

## Conventions

- This folder is **doc-only**. Never imported by code. Safe to edit anytime.
- Update `05-decisions-log.md` whenever a new decision is made.
- Update `06-action-items.md` when a todo is completed or added.
- Major architecture changes get a new entry in `02-architecture-decisions.md`.

## Quick links to the live system

- Repo: https://github.com/jwordenaii/codexbuildfreeofbase44
- Production: https://www.jwordenasphaltpaving.com
- Backend: https://codexbuildfreeofbase44-production.up.railway.app
- Stability guide: [../REPO_STABILITY.md](../REPO_STABILITY.md)
- Feature flags: [../../src/lib/featureFlags.js](../../src/lib/featureFlags.js)
- AI workspace: [../../src/ai/](../../src/ai/)
