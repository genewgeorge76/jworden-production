# Repo Stability Guide

This is the playbook for keeping the repo healthy as AI features are added.
Read this before doing anything bigger than a typo fix.

## Current limits (as of last audit)

| Metric | Healthy | Current | Action threshold |
|---|---|---|---|
| Tracked source size | < 100 MB | ~347 MB | Reduce when > 500 MB |
| `.git` history | < 50 MB | ~210 MB | Schedule `git filter-repo` when > 300 MB |
| `dist/` build output | < 20 MB | ~340 MB | Move heavy media to CDN ASAP |
| Largest JS chunk | < 300 KB | 974 KB (FloorPlanCanvas) | Code-split internally |
| Initial bundle (index) | < 250 KB | 577 KB | Defer non-critical imports |
| Production deps | < 50 | 77 | Run `npx depcheck` quarterly |

## Branch strategy

- `main`                    — production. Auto-deploys to www.jwordenasphaltpaving.com
- `feat/<name>`             — feature branches. Get a Netlify deploy preview URL
- `fix/<name>`              — bug fixes
- `chore/<name>`            — maintenance (deps, gitignore, docs)

**Never push directly to `main` without an open PR + green CI.**

## Feature-flag protocol

Every experimental or AI feature MUST:
1. Be added to [`src/lib/featureFlags.js`](../src/lib/featureFlags.js).
2. Default to **OFF** in production.
3. Be enabled per-environment via `VITE_FEATURE_<NAME>=true` in Netlify env vars.
4. Be wrapped in `<RequireAuth>` if it touches business data.
5. Add a `noindex` header block in [`netlify.toml`](../netlify.toml).
6. Live under [`src/ai/<feature-name>/`](../src/ai/) until graduation.

## Pre-deploy checklist (run locally before every PR)

```powershell
.\scripts\preflight.ps1
```

Or manually:
```powershell
npm run lint
npm run build
npx playwright test --reporter=line
```

## Bundle size guardrails

If a build adds more than **50 KB** to the initial chunk, it must be:
- Lazy-loaded via `React.lazy(() => import(...))`, OR
- Code-split internally with dynamic `import()`, OR
- Justified in the PR description.

## Media policy

- ✅ Images < 200 KB → can live in `public/`
- ✅ Logos, icons, hero shots → `public/` is fine
- ❌ Videos (`.mp4`, `.mov`, `.webm`) → use YouTube/Vimeo embed or Cloudinary
- ❌ Photos > 500 KB → optimize first (`scripts/fix-base44-images.ps1` or convert to WebP)

## Secrets policy

Never commit:
- `.env`, `.env.local`, `.env.production`
- API keys, tokens, JWTs, service-account JSON
- `*.pem`, `*.key`

Verify before pushing:
```powershell
git diff --cached | Select-String -Pattern "API_KEY|SECRET|TOKEN|PASSWORD|sk-|AIza" -CaseSensitive:$false
```

## Recovery / rollback

| Scenario | Recovery |
|---|---|
| Bad deploy | Netlify UI → Deploys → click previous good deploy → "Publish" (instant) |
| Broken feature flag | Flip Netlify env var → trigger redeploy (~2 min) |
| Bad commit on `main` | `git revert <sha> && git push` (preserves history, safe) |
| Repo corruption | `git clone` from origin (your local is the cache, not the source of truth) |

## Quarterly maintenance (~30 min, do every 3 months)

1. `npx depcheck` — remove unused dependencies
2. `npm outdated` — review major version bumps
3. `npm audit` — apply security patches
4. Check Sentry / UptimeRobot dashboards for slow-burn issues
5. Review largest files: `git ls-files | xargs -I{} du -h {} | sort -h | tail -20`
6. Re-run this audit and update the table at top of this file
