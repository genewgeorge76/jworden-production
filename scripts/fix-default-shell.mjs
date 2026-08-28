/**
 * fix-default-shell.mjs — the last word on dist/index.html.
 *
 * dist/index.html is the catch-all: every domain without its own host
 * rewrite in vercel.json serves it (the michigan* and savannahpaving*
 * satellites today; any newly attached domain tomorrow). Two bugs lived
 * here (task #45):
 *
 *  1. The prerender step runs after the meta normalizer and captures
 *     whatever route the prerender host resolved to — which is the Worden
 *     Standard OS marketing home. Result: paving satellites served "AI
 *     Software for Blue-Collar Empires" to paving customers.
 *  2. The base template hardcoded a canonical to www.jwordenasphaltpaving
 *     .com — a parked domain — so every fall-through satellite told Google
 *     its real address was a Sedo ad page.
 *
 * This script runs LAST in postbuild and rewrites only the <head> identity
 * of dist/index.html: the neutral J. Worden & Sons paving title and
 * description, and NO rel=canonical at all — one file serving twenty hosts
 * cannot truthfully declare a single address; each host's runtime SEO
 * component sets the right one after hydration, and domains that matter
 * have their own static shells.
 */
import fs from 'node:fs';
import path from 'node:path';

const p = path.resolve('dist/index.html');
if (!fs.existsSync(p)) {
  console.log('[fix-default-shell] dist/index.html not found, skipping.');
  process.exit(0);
}
let html = fs.readFileSync(p, 'utf8');

const TITLE = 'Virginia Asphalt Paving Contractor | J. Worden & Sons';
const DESC =
  'Fourth-generation asphalt paving: driveways, commercial lots, sealcoating and striping. Family-owned since 1984. Free estimates: (804) 446-1296.';

html = html.replace(/<title>[^<]*<\/title>/i, `<title>${TITLE}</title>`);
html = html.replace(
  /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
  `<meta name="description" content="${DESC}" />`,
);
// Strip every canonical — the SPA sets the per-host one at runtime.
html = html.replace(/\s*<link\s+rel="canonical"[^>]*\/?>/gi, '');
// og tags follow the same identity; og:url is removed with the canonical logic.
html = html.replace(/(<meta\s+property="og:title"\s+content=")[^"]*(")/i, `$1${TITLE}$2`);
html = html.replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/i, `$1${DESC}$2`);
html = html.replace(/\s*<meta\s+property="og:url"[^>]*\/?>/gi, '');

fs.writeFileSync(p, html);
const check = fs.readFileSync(p, 'utf8');
const ok = check.includes(TITLE) && !/rel="canonical"/i.test(check);
console.log(`[fix-default-shell] title reset, canonicals stripped — ${ok ? 'OK' : 'CHECK FAILED'}`);
if (!ok) process.exit(1);
