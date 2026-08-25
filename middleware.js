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
import ROUTES from './route-manifest.generated.js';
import BRAND_ROUTES from './brand-routes.generated.js';

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

// Hosts whose homepage is a DIRECTORY under /brands/<host>/, not a flat
// <host>.html file. The two mechanisms coexist: the older regional brands are
// prerendered into <host>.html by normalize-meta-quality.mjs, while the newer
// ones are written whole by build-brand-sites.mjs.
//
// Without this, `/` fell through to next(), the filesystem served the SPA's
// dist/index.html, and texaspavementgroup.com answered its own homepage with
// "The J. Worden Standard OS | AI Software for Blue-Collar Empires". Every
// other path on that domain was already correct, which is what made it easy to
// miss: /commercial and /texas/waco resolved through the vercel.json host
// rewrite, and only the root was wrong.
const BRAND_DIR_HOSTS = new Set(Object.keys(BRAND_ROUTES));

// Hosts that must not serve anything of their own, and where each one goes.
//
// WHY A 301 RATHER THAN A PAGE
// ────────────────────────────
// Every entry here is a domain that was serving the WRONG thing, and in two
// cases something that should never have been public at all:
//
//   carolinapavementgroup.com   Served an internal "Competitive Intelligence
//   nationalpavmentgroup.com    Dossier" — unit rates at $1.35 and $4.80 per
//                               linear foot, job values, margin figures. That
//                               is this company's own pricing, on a public
//                               indexable domain, readable by every competitor
//                               who finds it. It is not a duplicate-content
//                               problem; it is a disclosure problem.
//
//   atlantapavingandsealing.com The second Atlanta domain. Two domains serving
//                               Atlanta paving content is cross-domain
//                               duplicate content, and it splits whatever
//                               authority either has. One canonical, one 301.
//
// A 301 rather than a 404 because these domains have age and inbound links,
// and a permanent redirect passes that to the canonical host instead of
// throwing it away. A 404 would be safe and wasteful.
//
// WHICH ATLANTA DOMAIN IS CANONICAL, AND HOW TO SWAP IT
// ─────────────────────────────────────────────────────
// atlantaasphaltpavingpros.com wins by default, and the reason is mechanical
// rather than aesthetic: it is the key in REGIONAL_MARKET_PROFILES, it is what
// build-brand-sites.mjs writes the 18 Georgia pages under, and it is what
// vercel.json's host rewrite points at. atlantapavingandsealing.com is the
// better NAME — shorter, and "sealing" is a service people search for.
//
// THIS REDIRECT IS NOT CURRENTLY REACHED, AND THAT IS A DNS FACT
// ──────────────────────────────────────────────────────────────
// Checked 2026-08-25: atlantapavingandsealing.com resolves to Netlify
// (atlasphaltpaving.netlify.app), not to Vercel. Traffic for that host never
// arrives at this file, so the entry below has never fired. The domain
// returns 200 and serves a separate Atlanta site.
//
// That matters more than a stale redirect usually would, because three
// findings in ownedProperties.js all live on the site this redirect was
// supposed to retire: a claim of "over 40 years serving Atlanta" that the
// Georgia record does not support, a South Carolina 843 number on a Georgia
// page, and a testimonial with no attribution. None of them needs editing.
// They stop being served the moment the domain points here.
//
// The canonical target is already right on both counts the duplicate gets
// wrong: atlantaasphaltpavingpros.com states the company operates from
// Chester, Virginia and mobilises crews to Metro Atlanta, and it carries a
// 470 number that is actually in Georgia.
//
// So the fix is one DNS change, not a copy edit — repoint the domain at
// Vercel and the decision recorded above finally takes effect.
//
// To swap them, three things change together and none of them is this file
// alone: the profile key in src/data/regionalMarketProfiles.js, the host
// rewrite in vercel.json, and the direction of the entry below. Do all three
// or the domain 301s to a host that has no pages.
//
// jwordenandsonspaving.com is the company's literal trading name and the
// closest thing it has to a brand-protection domain. It is NOT a second site.
// Two domains both serving the main brand would split its authority exactly
// the way the two Atlanta domains do, so it consolidates onto the canonical
// host that every canonical tag, sitemap and schema block in this repository
// already points at.
//
// Same caveat as Atlanta, and it is a real one: jwordenandsonspaving.com is
// arguably the MORE correct domain for the entity — it is the name on the
// licence. The direction below follows SITE_URL in
// src/lib/businessInfo.canonical.js rather than a judgement about which name
// reads better. Flipping it means changing SITE_URL, the sitemap host list and
// this entry together; doing one alone points the site at itself.
const HOST_REDIRECTS = new Map([
  ['carolinapavementgroup.com', 'https://carolinablacktop.com'],
  ['nationalpavmentgroup.com', 'https://www.jwordenasphaltpaving.com'],
  ['atlantapavingandsealing.com', 'https://atlantaasphaltpavingpros.com'],
  ['jwordenandsonspaving.com', 'https://www.jwordenasphaltpaving.com'],
]);

// Hosts that have their own robots-<host>.txt / sitemap-<host>.{xml,txt} in
// public/sitemaps/. Must stay in sync with DOMAINS in
// scripts/generate-sitemap.mjs — rewriting to a file the build no longer
// produces turns a working page into a 404.
//
// blueridge / minnesota / michigan / obxpaving were removed on 2026-07-26
// along with their generated files: they are served by other projects, so
// this repo was inventing their URLs from its own route table. Unknown hosts
// fall through to next(), which is the correct behaviour for them.
const SITEMAP_HOSTS = new Set([
  MAIN_HOST,
  // Added 2026-08-24 with the domain move onto this project. Its
  // sitemap-/robots- files are generated unconditionally now that
  // generate-sitemap.mjs carries the domain, so this no longer risks
  // rewriting to a file the build does not produce.
  'texaspavementgroup.com',
  'richmondasphaltpaving.com',
  'atlantaasphaltpavingpros.com',
  'asphaltpavingkansascity.com',
  'savannahasphaltpaving.com',
  'carolinablacktop.com',
  'thewordenstandard.com',
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

// ── Soft-404 suppression ─────────────────────────────────────────────────────
//
// Every unknown URL used to return 200 with the full homepage, because
// vercel.json ends in a catch-all rewrite to /index.html. To a crawler that is
// an infinite supply of duplicate pages, and it dilutes the 217 real pages the
// prerenderer now publishes.
//
// The rule is deliberately lopsided: return 404 ONLY when the path matches
// nothing we know about. Anything uncertain keeps serving the SPA. A false 404
// on a live money page costs far more than a soft 200 on a junk URL, so every
// ambiguous case fails open.
//
// ROUTES is generated from src/App.jsx on every build, so it cannot drift out
// of sync with the router the way a hand-kept list would.
function isKnownRoute(pathname) {
  // Anything file-like (.html, .txt, .xml, .png …) is left to the filesystem,
  // which answers correctly on its own. This is load-bearing: 45 prebuilt
  // .html landing pages are in the sitemaps and are NOT React routes, so
  // running them through the manifest would 404 real indexed pages.
  const lastSegment = pathname.slice(pathname.lastIndexOf('/') + 1);
  if (lastSegment.includes('.')) return true;

  const p = pathname.length > 1 && pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname;

  if (ROUTES.exact.includes(p)) return true;
  return ROUTES.prefixes.some((prefix) => pathname.startsWith(prefix));
}

const NOT_FOUND_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,follow">
<title>Page Not Found | J. Worden &amp; Sons</title>
<style>
:root{color-scheme:light dark}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
font:16px/1.6 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0d0d0f;color:#f2f2f2;
text-align:center;padding:2rem}
main{max-width:34rem}h1{font-size:clamp(1.6rem,5vw,2.4rem);margin:0 0 .5rem}
p{opacity:.75;margin:0 0 1.75rem}
a{display:inline-block;padding:.75rem 1.5rem;border-radius:.5rem;background:#f2b705;color:#0d0d0f;
font-weight:600;text-decoration:none}
</style></head>
<body><main>
<h1>That page isn't here</h1>
<p>The link may be out of date. Everything we do &mdash; paving, sealcoating, parking lots
and concrete &mdash; is a click away.</p>
<a href="/">Back to J. Worden &amp; Sons</a>
</main></body></html>`;

export const config = {
  // Deliberately narrow: only the paths that collide with a real static
  // file. Everything else already routes correctly via vercel.json, and a
  // wider matcher would add cost and latency to every asset request.
  //
  // `/index.html` is included because it is the same static file as `/`:
  // without it, requesting https://<regional-domain>/index.html directly
  // would still be served the generic main-site page carrying the wrong
  // canonical, re-opening the duplicate-content hole this fix closes.
  // The four filesystem-colliding paths above, PLUS every extensionless path,
  // which is what the soft-404 check needs to see.
  //
  // Excluded from the catch-all, so static assets never pay for a middleware
  // invocation: anything containing a file extension, /api/*, /assets/*,
  // /work/*, /images/*, /sitemaps/* and Vercel internals (/_vercel/*). Keep
  // this list and the pattern below in step — dropping an exclusion silently
  // adds a middleware call to every request for that prefix.
  matcher: [
    '/', '/index.html', '/robots.txt', '/sitemap.xml', '/sitemap.txt',
    '/((?!api/|assets/|_vercel/|work/|images/|sitemaps/|.*\\.).*)',
  ],
};

export default function middleware(request) {
  try {
    const url = new URL(request.url);
    const host = canonicalHost(request.headers.get('host') || url.hostname);
    const pathname = url.pathname;

    // Retired hosts go first, before any rewrite. A redirect that runs after
    // the homepage rewrite never runs at all for `/`, which is the one path
    // these domains actually get traffic on.
    const redirectTo = HOST_REDIRECTS.get(host);
    if (redirectTo) {
      // Path and query preserved: an inbound link to a deep path on a retired
      // domain should land on the same path of the canonical one, not on its
      // homepage. Google treats a redirect to the homepage as a soft 404 and
      // passes nothing.
      return Response.redirect(new URL(pathname + url.search, redirectTo), 301);
    }

    // `/index.html` resolves to the same static file as `/`, so both must be
    // handled identically or the bare filename becomes a duplicate-content
    // back door on every regional domain.
    if (pathname === '/' || pathname === '/index.html') {
      // The main site's homepage is index.html, which is what the
      // filesystem already serves — leave it alone.
      if (HOMEPAGE_BY_HOST.has(host)) {
        return rewrite(new URL(`/${host}.html`, request.url));
      }
      if (BRAND_DIR_HOSTS.has(host)) {
        return rewrite(new URL(`/brands/${host}/index.html`, request.url));
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

    // Brand-directory hosts are served out of /brands/<host>/. Their paths are
    // NOT React routes, so the SPA manifest below has no business judging them.
    //
    // The rewrite is EXPLICIT rather than left to the host rule in vercel.json,
    // because Vercel checks the filesystem first: the SPA prerenders
    // /residential, /services, /service-areas and /contact into the deploy
    // root, and those four were being served as VIRGINIA pages on the Texas
    // domain. /commercial only worked because no file of that name exists at
    // the root.
    //
    // Anything not in the brand's own path list gets a real 404. Left to fall
    // through it would hit the SPA catch-all and return 200 with the software
    // storefront, which is the soft-404 this whole file exists to prevent.
    if (BRAND_DIR_HOSTS.has(host)) {
      const clean = pathname.length > 1 && pathname.endsWith('/')
        ? pathname.slice(0, -1)
        : pathname;
      if (BRAND_ROUTES[host].includes(clean)) {
        return rewrite(new URL(`/brands/${host}${clean === '/' ? '' : clean}/index.html`, request.url));
      }
      return new Response(NOT_FOUND_HTML, {
        status: 404,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'x-robots-tag': 'noindex, follow',
          'cache-control': 'public, max-age=0, must-revalidate',
        },
      });
    }

    // Everything below here is an ordinary page request. Unknown paths get a
    // real 404 instead of the homepage with a 200.
    if (!isKnownRoute(pathname)) {
      return new Response(NOT_FOUND_HTML, {
        status: 404,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'x-robots-tag': 'noindex, follow',
          'cache-control': 'public, max-age=0, must-revalidate',
        },
      });
    }

    return next();
  } catch {
    // Never let a middleware bug take down the homepage of a live money
    // site — on any unexpected error, fall through to existing behaviour.
    return next();
  }
}
