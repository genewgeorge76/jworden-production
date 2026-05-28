# `src/ai/` — AI Feature Workspace

All experimental AI features live here, isolated from the public site.

## Why a dedicated folder

- ✅ One place to grep when reviewing AI work
- ✅ Easy to gate the entire folder behind a single bundle split
- ✅ Easy to extract later for the white-label "Lite" product
- ✅ Future ML team (or AI agent) can own this folder without touching public site
- ✅ Tests organized as `tests/ai/` — separate from public-page tests

## Conventions

1. **Every feature gets its own subfolder**: `src/ai/dispatch/`, `src/ai/route-optimizer/`, etc.
2. **Every page is gated behind a feature flag** in [`src/lib/featureFlags.js`](../lib/featureFlags.js).
3. **Every page is wrapped in `<RequireAuth>`** — no AI feature is ever public until explicitly graduated.
4. **Every new route gets a `noindex` header** in [`netlify.toml`](../../netlify.toml).
5. **Shared building blocks go in `src/ai/_shared/`**.

## Folder layout

```
src/ai/
├── README.md             ← this file
├── _shared/              ← components reused across AI features
├── dispatch/             ← Smart Dispatch Board (in progress)
├── route-optimizer/      ← AI route + asphalt-cooling optimizer (planned)
├── jarvis-planner/       ← Nightly auto-planner (planned)
└── worden-index/         ← Pavement pricing index (planned)
```

## Promoting a feature to "stable"

When a feature graduates from experimental to production:
1. Move files from `src/ai/<feature>/` to `src/pages/` and `src/components/`.
2. Remove the `VITE_FEATURE_*` flag (or keep as an emergency kill switch).
3. Update [`netlify.toml`](../../netlify.toml) header to remove `noindex` if SEO is desired.
4. Add the route to the public sitemap if appropriate.
