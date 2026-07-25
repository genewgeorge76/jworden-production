// middleware.js — host-based routing for the multi-domain money sites.
//
// WHY THIS EXISTS (do not delete without reading):
// vercel.json already contains `rewrites` with `has: [{type: "host"}]` rules
// that map each regional domain to its own prebuilt HTML page, and each
// domain to its own robots.txt / sitemap. Those rules are correct and they
// DO work — but only for paths that have no file behind them.
//
// Vercel checks the filesystem BEFORE applying vercel.json `rewrites`. The
// four paths below all exist as real static files in the build output
// (`index.html`, `robots.txt`, `sitemap.xml`, `sitemap.txt`), so Vercel
// served those files directly and the host rules were never consulted.
//
// Net effect before this file existed: every regional domain served the
// generic J. Worden homepage, with a canonical tag pointing at
// www.jwordenasphaltpaving.com — i.e. 5 money domains publishing duplicate
// content that pointed Google at a different site. Deep paths were fine;
// only the filesystem-backed paths were broken, which is why it looked
// intermittent.
//
// Routing Middleware runs BEFORE the filesystem check, so handling exactly
// those four paths here closes the gap. Everything else is left alone and
// continues to be served by vercel.json (proven working — e.g. the
// /api/* proxy).
//
// Verified 2026-07-25: `curl https://richmondasphaltpaving.com/any-missing-path`
// already returned the correct Richmond page (host rule matching), while
// `curl https://richmondasphaltpaving.com/` returned the generic page.

import { next, rewrite } from '@vercel/functions';

// The main site's sitemap/robots files are named with the `www.` prefix;
// the regional ones are not. This map is derived from the real filenames in
// public/sitemaps/ — do not "simplify" it into a rule, the two conventions
// genuinely differ.
const MAIN_HOST = 'www.jwordenasphaltpaving.com';

// Hosts that have their own prebuilt homepage HTML in the build output.
// Must stay in sync with the `has.host` rewrite rules in vercel.json and
// with the actual <domain>.html files produced by the build.
const HOMEPAGE_BY_HOST = new Set([
  'richmondasphaltpaving.com',
  'atlantaasphaltpavingpros.com',
  'asphaltpavingkansascity.com',
  'savannahasphaltpaving.com',
  'carolinablacktop.com',
  'thewordenstandard.com',
]);

// Hosts that have their own robots-<host>.txt / sitemap-<host>.{xml,txt}
// in public/sitemaps/. Includes domains currently served by other Vercel
// projects — harmless if they never reach this deployment, correct if they do.
const SITEMAP_HOSTS = new Set([
  MAIN_HOST,
  'richmondasphaltpaving.com',
  'atlantaasphaltpavingpros.com',
  'asphaltpavingkansascity.com',
  'savannahasphaltpaving.com',
  'carolinablacktop.com',
  'thewordenstandard.com',
  'blueridgeasphaltpaving.com',
  'michiganasphaltpavingpros.com',
  'minnesotaasphaltpaving.com',
  'obxpaving.com',
]);

/**
 * Normalise the incoming Host header to the token used in filenames.
 * - strips any :port
 * - lowercases
 * - collapses www.<regional> -> <regional>
 * - but keeps the main site as its canonical www. form, because its
 *   sitemap/robots files are named that way
 */
function canonicalHost(rawHost) {
  const host = String(rawHost || '').toLowerCase().split(':')[0];
  if (host === 'jwordenasphaltpaving.com' || host === MAIN_HOST) return MAIN_HOST;
  return host.startsWith('www.') ? host.slice(4) : host;
}

export const config = {
  // Deliberately narrow: only the paths that collide with a real static
  // file. Everything else already routes correctly via vercel.json, and a
  // wider matcher would add cost and latency to every asset request.
  //
  // `/index.html` is included because it is the same static file as `/`:
  // without it, requesting https://<regional-domain>/index.html directly
  // would still be served the generic main-site page carrying the wrong
  // canonical, re-opening the duplicate-content hole this fix closes.
  matcher: ['/', '/index.html', '/robots.txt', '/sitemap.xml', '/sitemap.txt'],
};

export default function middleware(request) {
  try {
    const url = new URL(request.url);
    const host = canonicalHost(request.headers.get('host') || url.hostname);
    const pathname = url.pathname;

    // `/index.html` resolves to the same static file as `/`, so both must be
    // handled identically or the bare filename becomes a duplicate-content
    // back door on every regional domain.
    if (pathname === '/' || pathname === '/index.html') {
      // The main site's homepage is index.html, which is what the
      // filesystem already serves — leave it alone.
      if (HOMEPAGE_BY_HOST.has(host)) {
        return rewrite(new URL(`/${host}.html`, request.url));
      }
      return next();
    }

    if (!SITEMAP_HOSTS.has(host)) return next();

    if (pathname === '/robots.txt') {
      return rewrite(new URL(`/sitemaps/robots-${host}.txt`, request.url));
    }
    if (pathname === '/sitemap.xml') {
      return rewrite(new URL(`/sitemaps/sitemap-${host}.xml`, request.url));
    }
    if (pathname === '/sitemap.txt') {
      return rewrite(new URL(`/sitemaps/sitemap-${host}.txt`, request.url));
    }

    return next();
  } catch {
    // Never let a middleware bug take down the homepage of a live money
    // site — on any unexpected error, fall through to existing behaviour.
    return next();
  }
}
