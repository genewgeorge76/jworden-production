# PORTING — Moving Off GitHub

This repo is **mostly host-agnostic**. It only depends on git itself, plus Netlify
and Railway (which both support multiple git hosts). The notes below cover what
to change, in what order, and which alternatives are worth considering.

---

## Recommended new host

| Host | Verdict | Why |
|---|---|---|
| **GitLab.com** | ✅ Best overall | Free private repos, mature CI, native Netlify + Railway support, easy to import an existing GitHub repo via UI in ~3 clicks. |
| **Codeberg** | ✅ If you want a non-corporate option | Free, fast, Forgejo-based, EU-hosted, no AI training on your code. Netlify/Railway can connect via webhook. |
| **Bitbucket Cloud** | ⚠️ Workable | Free for ≤5 users, native Netlify/Railway support, but UI is dated. |
| **Self-hosted Forgejo / Gitea** | ⚠️ Only if you want full control | Run on your own VPS; you own everything but you maintain it. |
| **Sourcehut (sr.ht)** | ⚠️ Power-user | Email-based workflow, no PR UI in the github sense. |

**My pick: GitLab.com.** Cheapest path with the least operational change. Both
Netlify and Railway already support GitLab as a first-class git provider.

---

## What changes when you move

### 1. Git remote (one command)

```pwsh
git remote set-url origin https://gitlab.com/<your-user>/<repo>.git
git push -u origin main
```

If using GitLab, also push the workflow tags:

```pwsh
git push --tags origin
```

### 2. Netlify build hook
- Netlify → Site settings → Build & deploy → **Continuous deployment**
- Click **Manage repository** → **Disconnect**
- Reconnect using GitLab (or whichever) provider.
- Confirm site env vars survived (they should — they live on Netlify, not GitHub).

### 3. Railway build hook
- Railway → backend service → Settings → **Source**
- Disconnect GitHub.
- Connect new git provider, point at the same repo + branch (`main`).
- Verify env vars are still set (they should be — they live on Railway).

### 4. CI / Actions (the big one)

GitHub Actions YAML in `.github/workflows/` will **not run** on GitLab/Codeberg/Bitbucket.

Three options, ranked by effort:

**A. Skip CI entirely (simplest)**
- Delete `.github/` after migration.
- Rely on Netlify and Railway build-time checks.
- Run `npm run lint && npm run build && npm test` locally before pushing.
- *Loss:* automated nightly tasks (sitemap submit, AI tech radar, vector reindex,
  reliability monitor).

**B. Port to GitLab CI**
- Translate each `.github/workflows/*.yml` into a `.gitlab-ci.yml` job.
- Workflows to port (in priority order):
  1. `ci.yml` — lint + build + test (most important)
  2. `deploy.yml` — only needed if you don't use Netlify's git auto-deploy
  3. `seo-guardrails.yml` — sitemap + meta validation
  4. `codeql.yml` — replace with GitLab SAST (built-in, free)
  5. `vector-reindex.yml`, `ai-tech-radar.yml`, `legal-advisory-monitor.yml`,
     `reliability-synthetic-monitor.yml` — schedule with `rules: - if: $CI_PIPELINE_SOURCE == "schedule"`
- Estimate: ~2–3 hours of YAML translation.

**C. Move scheduled jobs to Railway cron**
- For the periodic monitors (reliability, vector reindex, AI tech radar), spin
  them up as Railway cron services that hit your existing scripts in `scripts/`.
- This decouples CI from periodic work.

### 5. Repo-identity references (cosmetic)

These files still reference `github.com/jwordenaii/codexbuildfreeofbase44` for
documentation / preflight gating. None block the build:

- `scripts/repo-preflight.ps1` — already reads `$Env:EXPECTED_GIT_REMOTE` to
  override the default. After migration set:
  ```pwsh
  setx EXPECTED_GIT_REMOTE "https://gitlab.com/<you>/<repo>.git"
  ```
- `scripts/ai-tech-radar.mjs` — already reads `process.env.REPO_URL`. Set
  `REPO_URL=https://jwordenasphaltpaving.com` (already the default).
- Docs (`README.md`, `ENV_KEYS_MASTER.md`, `BACKGROUND_POSSIBILITIES_RESEARCH.md`,
  `JARVIS_AUTONOMY.md`, `SOURCE_OF_TRUTH_GUARDRAILS.md`,
  `DEPLOY_STATUS_2026-05-01.md`, `docs/dev-notebook/*.md`) — search-and-replace
  the string `github.com/jwordenaii/codexbuildfreeofbase44` → your new URL when
  you're settled.
- `.vscode/tasks.json` — has a few tasks that hit the GitHub REST API
  (`github-actions-run-list`, `github-actions-api-public`, etc). Delete those
  tasks or rewrite them to call the new host's API.
- `JARVIS_AUTONOMY.md` env var `JARVIS_GITHUB_REPO` — rename to
  `JARVIS_GIT_REPO` if you implement Jarvis's PR-opening feature on the new host.

### 6. Auto-generated snapshots (do nothing)

Files under `docs/logic-preservation/history/` and `docs/clean-house/latest.json`
contain `remoteOrigin` strings. They're regenerated each run by the local
preservation scripts and will pick up the new origin automatically.

### 7. Secrets

Your build/runtime secrets are **on Netlify and Railway, not GitHub**. They
survive the move. The only GitHub-specific secrets to retire (in the old repo
settings before you delete it):

- `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` (if set as Actions secrets)
- Any deploy-keys or PATs you minted for the old repo

Generate new equivalents on the new host only if you port CI (step 4B).

---

## Pre-flight checklist before you push the trigger

- [ ] Local `npm run build` is green.
- [ ] Local `npm run lint` is green.
- [ ] All env vars confirmed set on Netlify and Railway (already verified live).
- [ ] You've decided which CI option (A / B / C) you want.
- [ ] You have the new repo URL ready.
- [ ] Working tree is clean (`git status`).

## Post-flight checklist after you push

- [ ] `git remote -v` shows the new origin.
- [ ] Netlify build triggered automatically by a test commit.
- [ ] Railway build triggered automatically by a test commit.
- [ ] Live site loads at https://www.jwordenasphaltpaving.com.
- [ ] Backend `/health` returns 200 at the Railway URL.
- [ ] If you ported CI: first pipeline runs green.

---

## What to leave behind

- `.github/workflows/*` (only matters if you don't port CI)
- `.github/PULL_REQUEST_TEMPLATE.md` — translates 1:1 to `.gitlab/merge_request_templates/Default.md` (GitLab) or `docs/PULL_REQUEST_TEMPLATE.md` (Bitbucket).
- `CODEOWNERS` — GitLab honors `CODEOWNERS` natively; Bitbucket and Codeberg do not.
