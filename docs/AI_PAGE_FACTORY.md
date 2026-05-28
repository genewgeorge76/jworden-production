# AI Page Factory

Config-driven AI page generation for this repo.

## What It Does

`npm run ai:build-pages` will:

1. Read all blueprint JSON files in `ai-page-blueprints/`
2. Generate React pages in `src/pages/ai/`
3. Generate route registry in `src/generated/aiPageRegistry.jsx`
4. Update sitemap block in `public/sitemap.xml` between:
   - `<!-- AI_PAGE_FACTORY:START -->`
   - `<!-- AI_PAGE_FACTORY:END -->`

## Blueprint Fields

Required:

- `slug` (string)
- `title` (string)
- `description` (string)

Optional:

- `enabled` (boolean, default `true`)
- `public` (boolean, default `false`)
- `includeInSitemap` (boolean, default `true`)
- `h1` (string)
- `intro` (string)
- `ctaText` (string)
- `ctaHref` (string)
- `changefreq` (string, default `monthly`)
- `priority` (string, default `0.6`)
- `sections` (array of `{ heading, body }`)

## Public vs Internal

- `public: true` pages are mounted as public routes and can be included in sitemap.
- `public: false` pages are mounted as internal routes and wrapped with auth gate in `src/App.jsx`.

## Usage

1. Add a new JSON blueprint in `ai-page-blueprints/`
2. Run:

```bash
npm run ai:build-pages
```

3. Verify changes:

- Generated page file under `src/pages/ai/`
- Registry updates in `src/generated/aiPageRegistry.jsx`
- Sitemap block updates in `public/sitemap.xml`

## Notes

- This is deterministic generation from structured config.
- It is designed for high-speed repeatable page production with built-in SEO wiring.
