# Pull Request

## What changed
<!-- One-sentence summary -->

## Why
<!-- Business or technical reason -->

## Risk to production
- [ ] Public site behavior unchanged (or change is intentional)
- [ ] No new public route exposed without `noindex` (unless SEO intends it)
- [ ] No new dependency added (or note added below if so)
- [ ] No secret committed (verified `git diff` for `.env`, keys, tokens)

## Safety checklist
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Tests added/updated for new behavior
- [ ] Bundle size impact reviewed (target: index < 600 KB)
- [ ] If new AI feature: gated behind a `VITE_FEATURE_*` flag, default OFF
- [ ] If new back-office page: wrapped in `<RequireAuth>`

## Rollback plan
<!-- How to undo this in <5 minutes if it breaks production -->

## Screenshots / preview
<!-- Netlify deploy preview URL or screenshots -->
