# J. Worden & Sons - Standalone Netlify Build Notes

This repo runs as a plain Vite + React app on GitHub + Netlify without any third-party builder platform.

## Netlify settings

- Build command: `npm run build`
- Publish directory: `dist`
- Node version: `20`

## What was changed from the original

- `vite.config.js` uses plain Vite + React (no third-party vite plugin).
- `netlify.toml` has the React single-page-app fallback: `/* -> /index.html`.
- `tailwind.config.js` was converted to ES module format because `package.json` uses `type: module`.
- `src/lib/AuthContext.jsx` is a standalone public-site auth provider.
- `src/api/base44Client.js` is a local API client — all former third-party SDK call sites now receive safe no-op responses so pages degrade gracefully.

## What still needs a real backend later

These features exist in the code, but need the FastAPI backend to be production-real:

- AI photo inspection
- live Google reviews fetch
- quote PDF generation
- proposal PDF generation
- lead email/SMS automation
- admin dashboard auth
- calendar/job sync
- crew metrics and revenue reports
- voice-call/Vapi webhook logic

The static public site can go live first. Reconnect backend features one at a time later.
