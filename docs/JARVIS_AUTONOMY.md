# JARVIS_AUTONOMY.md

**Status:** Design draft — not yet implemented. Awaiting owner approval.
**Owner:** J. Worden
**Last updated:** 2026-05-04
**Goal:** Make Jarvis "everyday smart" — able to read the codebase, propose changes, and (optionally) ship them — without ever risking a broken site.

---

## 1. Why this exists

Today Jarvis is a **read-only ops officer**: he answers questions, summarizes data, and makes recommendations in the Command Center. He cannot change code.

The user requirement: *"Jarvis should be able to work on the front end and back. The problem is we keep changing things, so Jarvis would have to be everyday smart and very high intelligence."*

Two real problems that drive this design:

1. **Knowledge freshness** — code changes daily. A static prompt or stale embeddings means Jarvis recommends things that no longer exist. He must re-index after every push.
2. **Safety** — letting any LLM commit directly to `main` is how production breaks. Every code change must travel through a pull request the human approves.

---

## 2. Three capability levels

| Level | Capability | Risk | Status |
|---|---|---|---|
| **L1 — Read & Recommend** | Chat, summarize live data, propose edits in plain English | Zero | ✅ Live (commit `bf9400c`) |
| **L2 — Open PRs** | Jarvis writes a branch + commits + opens a GitHub PR. Human taps merge. | Low — every change is reviewed. | 🟡 Designed below |
| **L3 — Auto-Merge Safe Classes** | For pre-approved change classes (copy, SEO meta, sitemap), Jarvis merges + deploys + monitors + auto-rolls-back on error. | Medium — needs strict allowlist + kill switch. | 🔴 Future |

**Recommendation:** Build L2 in full. Gate L3 behind the existing Autonomy master switch + a per-class allowlist. Never go beyond L3.

---

## 3. L2 architecture — "Open PRs from chat"

### 3.1 Data flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  COMMAND CENTER (browser)                                           │
│  ┌─────────────────────┐                                            │
│  │ Jarvis chat panel   │  user: "Add a TikTok link to the footer"   │
│  └──────────┬──────────┘                                            │
└─────────────┼───────────────────────────────────────────────────────┘
              │  POST /api/v1/jarvis/code-change
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  RAILWAY BACKEND  (FastAPI)                                         │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ jarvis_code_router.py                                          │ │
│  │   1. Verify autonomy.code_edits == ON                          │ │
│  │   2. Check rate limit (max 5 open Jarvis PRs)                  │ │
│  │   3. Pinecone: retrieve top-K relevant files                   │ │
│  │   4. LLM: generate unified diff + commit message               │ │
│  │   5. Lint/syntax-check the diff locally                        │ │
│  │   6. GitHub API: create branch + commit + PR                   │ │
│  │   7. Audit log the request + response                          │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────┬──────────────────────────────────────────────────┘
                   │  PR opened on jwordenaii/codexbuildfreeofbase44
                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  GITHUB                                                             │
│   - Branch:  jarvis/2026-05-04-tiktok-footer                        │
│   - PR #N:   "Jarvis: add TikTok link to footer"                    │
│   - Labels:  jarvis-generated, scope:frontend                       │
│   - CI:      Netlify deploy preview + ESLint + Vitest               │
└──────────────────┬──────────────────────────────────────────────────┘
                   │  Webhook → backend → Command Center
                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  COMMAND CENTER → Jarvis Tab → "Pending Changes" panel              │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │ PR #N · Add TikTok link to footer  [View Diff] [Merge] [Close]│ │
│   │   3 files changed · CI: passing · preview: ready              │ │
│   └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 New backend modules

| File | Responsibility |
|---|---|
| `app/services/repo_indexer.py` | Walk repo, chunk files, embed via OpenAI, upsert to Pinecone (existing namespace `jarvis-repo-v1`). Run on push via GitHub Action. |
| `app/services/jarvis_coder.py` | Given an intent + retrieved context, call LLM to produce a unified diff. Validate diff parses. Run `eslint`/`pyflakes` against changed files in tmp dir. |
| `app/services/github_client.py` | Thin wrapper around PyGithub for branch create / commit / PR open / status check. Single repo, scoped PAT. |
| `app/routers/jarvis_code.py` | New router at `/api/v1/jarvis/code/*`. Endpoints: `propose-change`, `list-pending-prs`, `pr/{n}/refresh`. |

**Note:** Jarvis never calls `merge` — only the human does, via the GitHub UI or the Command Center button (which calls the GitHub API as the *user*, not as Jarvis).

### 3.3 New endpoints

```
POST /api/v1/jarvis/code/propose-change
  body: { intent: str, hint_files?: [str], scope?: 'frontend'|'backend'|'docs' }
  resp: { pr_url, pr_number, branch, files_changed: [...], summary }

GET  /api/v1/jarvis/code/pending-prs
  resp: [{ number, title, url, files, ci_status, preview_url, created_at }]

POST /api/v1/jarvis/code/index-repo
  body: { commit_sha?: str }
  resp: { indexed_files, chunks, took_ms }

GET  /api/v1/jarvis/code/audit
  resp: [{ ts, intent, pr_number, outcome }]
```

All four require:
- `Depends(verify_premium_security)` (same gate as autonomy router)
- `autonomy.code_edits` toggle ON in the user's master settings (mirrored on backend)

### 3.4 New frontend pieces

In `src/pages/CommandCenter.jsx`:

1. **`JarvisChangesPanel`** (new) — under the Jarvis tab, below the chat. Lists open Jarvis PRs with diff/merge/close buttons.
2. **Slash commands in `JarvisChat`**:
   - `/change <description>` → calls `propose-change`, streams progress
   - `/index` → manually re-index the repo
   - `/prs` → focus the changes panel
3. **New autonomy toggle**: `code_edits` (separate from operational autonomy). OFF by default. Master switch must also be ON.

### 3.5 Required env vars (Railway)

| Var | Purpose | Scope |
|---|---|---|
| `JARVIS_GITHUB_PAT` | Open PRs as Jarvis bot user | repo `contents:write`, `pull-requests:write` only |
| `JARVIS_GITHUB_REPO` | `jwordenaii/codexbuildfreeofbase44` | one repo only |
| `JARVIS_GITHUB_BASE_BRANCH` | `main` | branches PR'd into this |
| `JARVIS_BRANCH_PREFIX` | `jarvis/` | identifies bot branches |
| `JARVIS_MAX_OPEN_PRS` | `5` | hard cap |
| `PINECONE_NAMESPACE_REPO` | `jarvis-repo-v1` | already exists |
| `OPENAI_API_KEY` | already set | for embeddings + diff generation |

### 3.6 Required GitHub setup

- Create a fine-grained PAT scoped to **only** `jwordenaii/codexbuildfreeofbase44`
- Permissions: **Contents: Read & write**, **Pull requests: Read & write**, **Metadata: Read** — nothing else
- **Explicitly denied**: Administration, Workflows, Webhooks, Secrets, force-push to `main`
- Branch protection on `main` (already in place via Netlify auto-deploy): no force push, no delete

---

## 4. Repo indexer — keeps Jarvis sharp every day

**Trigger:** GitHub Action `index-repo.yml` runs on every push to `main` and nightly at 03:00 UTC.

**What it does:**
1. Clones the repo
2. Walks files (skips `node_modules`, `dist`, `.git`, lockfiles, binary assets)
3. Chunks each file (200 lines or function/class boundary, whichever first)
4. Embeds each chunk via OpenAI `text-embedding-3-small`
5. Upserts to Pinecone namespace `jarvis-repo-v1` with metadata `{ path, language, sha, lines_start, lines_end, indexed_at }`
6. Deletes vectors whose `sha` no longer matches HEAD

**Result:** Jarvis answers about code reflect the current state of `main` within ~2 min of any merge.

---

## 5. Safety guarantees (non-negotiable)

| # | Rule | How enforced |
|---|---|---|
| 1 | Jarvis never pushes to `main`. | PAT permissions only allow non-default branches. Branch protection on `main`. |
| 2 | Jarvis never force-pushes. | PAT has no force-push grant. Branch protection denies force-push. |
| 3 | Jarvis never deletes branches. | PAT lacks delete permission. |
| 4 | Jarvis never modifies `.github/workflows/`. | `jarvis_coder.py` denylist + GitHub Action permission scope. |
| 5 | Jarvis never modifies `JARVIS_AUTONOMY.md` itself. | Denylist in `jarvis_coder.py`. |
| 6 | Jarvis never modifies env files, secrets, or `netlify.toml`. | Denylist. |
| 7 | Max 5 open Jarvis PRs at a time. | `JARVIS_MAX_OPEN_PRS` checked before opening. |
| 8 | Every code-change request is audit-logged. | Append-only log in DB + admin-readable via `/audit`. |
| 9 | Kill switch in Command Center: "Disable Jarvis code edits". | Frontend + backend autonomy mirror. |
| 10 | Every Jarvis PR runs full CI before merge button enables. | Netlify build + ESLint + Vitest gate the Merge button. |

---

## 6. L3 — Auto-merge (future, opt-in only)

Only enabled per change-class. Default: all classes OFF.

| Class | Auto-merge eligible? | Why |
|---|---|---|
| Copy edits in `src/pages/**.jsx` (text only, no JSX structure changes) | ✅ Yes | Low blast radius, easy rollback |
| SEO meta updates (`<title>`, `<meta>`, JSON-LD) | ✅ Yes | Low risk |
| Sitemap regen | ✅ Yes | Already automated |
| Style tweaks (Tailwind classes only) | ⚠️ Behind toggle | Visual regression risk |
| New component files | ❌ Never | Needs human design review |
| Backend route changes | ❌ Never | Affects API surface |
| Migrations / models | ❌ Never | Data integrity |
| Dependency bumps | ❌ Never | Supply-chain risk |

Auto-merge requires:
- Master autonomy ON
- `code_edits` toggle ON
- Class allowlist for the specific change class
- All CI green
- No conflicts
- Diff matches its declared class (regex/AST-validated)
- 5-minute cool-off where the human can still intervene from the Command Center

If post-merge Netlify build fails or Sentry detects a new error within 10 min → auto-revert by opening a counter-PR and merging it.

---

## 7. Build order if owner approves

1. **Add `code_edits` autonomy toggle** to existing CommandCenter Autonomy panel (frontend only, ~30 min)
2. **`github_client.py` + `jarvis_code.py` router** with `propose-change` + `list-pending-prs` only (no merge endpoint) (~half day)
3. **`JarvisChangesPanel`** in Command Center fetching `pending-prs` (~1 hour)
4. **`repo_indexer.py` + GitHub Action** for nightly + on-push indexing (~half day)
5. **`jarvis_coder.py`** that uses retrieval + LLM to produce diffs, with denylist + lint check (~half day)
6. **End-to-end test:** ask Jarvis to change the footer year. Verify PR opens, CI runs, you merge from GitHub manually.
7. **L3 allowlist + auto-merge logic** — only after L2 has run safely for ≥1 week with ≥10 successful PRs.

Total to L2 production: ~2 working days. Total to L3 first class: +1 day after the soak period.

---

## 8. What this design does NOT do

- ❌ Does not let Jarvis run arbitrary shell commands
- ❌ Does not let Jarvis read or modify secrets / env vars
- ❌ Does not let Jarvis trigger deploys directly (Netlify deploys on `main` push, which only humans cause)
- ❌ Does not let Jarvis change CI workflows or branch protection
- ❌ Does not let Jarvis call external APIs that cost money without explicit per-call user approval (ads spend, SMS sends, etc. — these stay in the operational autonomy layer)
- ❌ Does not give Jarvis cross-repo or org-level access

---

## 9. Open questions for owner

1. ✅ / ❌ Do you accept the L2 design as-is (PR-only, you tap merge)?
2. ✅ / ❌ OK to use a single-repo PAT (vs. a GitHub App, which is more robust but requires a webhook listener)?
3. ✅ / ❌ Should Jarvis-opened PRs trigger a Slack/email alert to you, or only show in the Command Center?
4. First test intent (e.g. "change the footer copyright year to 2026")?
5. Auto-revert on post-merge failure: opt-in, or default ON for L3?

---

## 10. Decision log

- 2026-05-04 — Document drafted by Copilot at owner's request. Awaiting review.
