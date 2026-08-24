#!/usr/bin/env node
/**
 * generate-sitemap.mjs
 * ---------------------------------------------------------------
 * Builds public/sitemap.xml + public/sitemap.txt from real route
 * data so the sitemap can never drift from what the app serves.
 *
 * Sources:
 *   - STATIC_ROUTES (below) for hand-curated public pages
 *   - src/lib/locations.js          (LOCATIONS array)
 *   - src/data/serviceAreas.js      (SERVICE_AREAS array)
 *   - src/lib/states50.js           (WORDEN_ACTIVE_STATES + stateSlug)
 *
 * Run:  node scripts/generate-sitemap.mjs
 * Hooked into npm run build via "prebuild" in package.json.
 * ---------------------------------------------------------------
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { canonicalOrigin } from './lib/site-hosts.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const DEFAULT_SITE = 'https://www.jwordenasphaltpaving.com';
const GENERATED_BLOGS_DIR = resolve(ROOT, 'src/pages/generated-blogs');
const SITE = String(process.env.SITEMAP_SITE_URL || process.env.VITE_SITE_URL || DEFAULT_SITE)
  .trim()
  .replace(/\/$/, '');
const INCLUDE_ALL_STATES =
  process.argv.includes('--all-states') ||
  /^(1|true|yes)$/i.test(String(process.env.SITEMAP_INCLUDE_ALL_STATES || '').trim());

const VALID_CHANGEFREQ = new Set(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']);
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// ── Paths vercel.json permanently redirects away from ────────────────────────
//
// A URL that 308s does not belong in a sitemap: Google files it under
// "Page with redirect — not indexed" and it burns crawl budget on a page that
// resolves somewhere else.
//
// This mattered in practice. vercel.json redirects 11 /states/* paths to
// /service-areas — Florida, Georgia, Iowa, Kansas, Michigan, Minnesota,
// Missouri, New Jersey, New York, North Carolina and Texas — states the
// company does not serve. But the sitemap was built from WORDEN_ACTIVE_STATES,
// which is every state in the union despite a docstring claiming it is only
// states with "verified completed work". So the sitemap advertised all 51 and
// the site redirected 11 of them. Google noticed before we did.
//
// Reading the redirect table rather than hand-keeping a second list is the
// point: the two can no longer disagree. Any future redirect added to
// vercel.json drops out of the sitemap automatically, whatever it is for.
function loadRedirectSources() {
  try {
    const cfg = JSON.parse(readFileSync(resolve(ROOT, 'vercel.json'), 'utf8'));
    const sources = new Set();
    for (const r of cfg.redirects || []) {
      const src = typeof r?.source === 'string' ? r.source.trim() : '';
      // Only literal paths. Vercel patterns (:param, (regex), *) cannot be
      // matched reliably here, and guessing wrong would silently drop real
      // pages out of the sitemap — a far worse failure than leaving one in.
      if (src.startsWith('/') && !/[:*()\[\]{}?]/.test(src)) {
        sources.add(src.replace(/\/$/, '') || '/');
      }
    }
    return sources;
  } catch (e) {
    console.warn('[sitemap] could not read vercel.json redirects:', e.message);
    return new Set();
  }
}

const REDIRECT_SOURCES = loadRedirectSources();

/** True when `loc` points at a path vercel.json permanently redirects. */
function isRedirected(loc) {
  try {
    const path = new URL(loc).pathname.replace(/\/$/, '') || '/';
    return REDIRECT_SOURCES.has(path);
  } catch {
    return false;
  }
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function assertValidSitemapEntries(entries) {
  const seenLocs = new Set();

  for (const entry of entries) {
    if (!entry?.loc) throw new Error('[sitemap] missing <loc> value');
    if (seenLocs.has(entry.loc)) throw new Error(`[sitemap] duplicate URL: ${entry.loc}`);
    seenLocs.add(entry.loc);

    let parsed;
    try {
      parsed = new URL(entry.loc);
    } catch {
      throw new Error(`[sitemap] invalid URL: ${entry.loc}`);
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error(`[sitemap] unsupported URL protocol: ${entry.loc}`);
    }
    if (entry.loc.length > 2048) {
      throw new Error(`[sitemap] URL exceeds 2048 characters: ${entry.loc}`);
    }
    if (!DATE_ONLY.test(String(entry.lastmod || ''))) {
      throw new Error(`[sitemap] invalid lastmod for ${entry.loc}: ${entry.lastmod}`);
    }
    if (!VALID_CHANGEFREQ.has(entry.changefreq)) {
      throw new Error(`[sitemap] invalid changefreq for ${entry.loc}: ${entry.changefreq}`);
    }

    const priority = Number(entry.priority);
    if (!Number.isFinite(priority) || priority < 0 || priority > 1) {
      throw new Error(`[sitemap] invalid priority for ${entry.loc}: ${entry.priority}`);
    }
  }
}

function collectGeneratedBlogPaths() {
  try {
    const files = readdirSync(GENERATED_BLOGS_DIR).filter((name) => name.endsWith('.jsx'));
    const paths = new Set();

    for (const file of files) {
      const source = readFileSync(resolve(GENERATED_BLOGS_DIR, file), 'utf8');
      const match = source.match(/canonicalPath=(?:\{'([^']+)'\}|"([^"]+)")/);
      if (match) { match[1] = match[1] || match[2]; }
      if (match?.[1]?.startsWith('/')) {
        paths.add(match[1]);
      }
    }

    return [...paths].sort();
  } catch (e) {
    console.warn('[sitemap] could not read generated blogs directory:', e.message);
    return [];
  }
}

// ── 1. Hand-curated public routes (priority + changefreq tuned for local-pack) ─
const STATIC_ROUTES = [
  { path: '/',                              priority: '1.0', changefreq: 'weekly' },
  { path: '/contact',                       priority: '0.95', changefreq: 'monthly' },
  { path: '/quote',                         priority: '0.95', changefreq: 'monthly' },
  { path: '/services',                      priority: '0.9',  changefreq: 'monthly' },
  { path: '/paving',                        priority: '0.9',  changefreq: 'monthly' },
  { path: '/sealcoating',                   priority: '0.9',  changefreq: 'monthly' },
  { path: '/concrete',                      priority: '0.85', changefreq: 'monthly' },
  { path: '/crack-repair',                  priority: '0.85', changefreq: 'monthly' },
  { path: '/parking-lots',                  priority: '0.9',  changefreq: 'monthly' },
  { path: '/residential',                   priority: '0.9',  changefreq: 'monthly' },
  { path: '/general-contracting',           priority: '0.8',  changefreq: 'monthly' },
  { path: '/hardscapes',                    priority: '0.8',  changefreq: 'monthly' },
  { path: '/shingles',                      priority: '0.8',  changefreq: 'monthly' },
  { path: '/tar-and-chip',                  priority: '0.8',  changefreq: 'monthly' },
  { path: '/millings-fines',                priority: '0.75', changefreq: 'monthly' },
  { path: '/about',                         priority: '0.85', changefreq: 'monthly' },
  // The prerenderer takes its route list from this sitemap, so a page absent
  // here is never prerendered and ships Google an empty SPA shell. /footprint
  // carries 560 documented job sites across eleven states with real addresses
  // and dates — the most link-worthy proof on the site, and worthless to
  // search if it is invisible. High priority for the same reason.
  { path: '/footprint',                     priority: '0.9',  changefreq: 'monthly' },
  // Both self-canonical and both were absent. Deliberately NOT added:
  // /commercial and /richmond-commercial canonicalise to /commercial/richmond-va,
  // and /residential-asphalt canonicalises to /residential — all three targets
  // are already listed, so adding the aliases would put URLs in the sitemap
  // whose canonical points elsewhere and muddy pages that already rank.
  { path: '/home-services',                 priority: '0.85', changefreq: 'monthly' },
  { path: '/request-estimate',              priority: '0.95', changefreq: 'monthly' },
  { path: '/richmond-va-asphalt-paving.html',        priority: '0.95', changefreq: 'weekly' },
  { path: '/asphalt-driveway-paving.html',           priority: '0.9',  changefreq: 'monthly' },
  { path: '/asphalt-paving-cost-virginia.html',      priority: '0.9',  changefreq: 'monthly' },
  { path: '/asphalt-repair.html',                    priority: '0.9',  changefreq: 'monthly' },
  { path: '/charlottesville-residential-paving.html',priority: '0.85', changefreq: 'monthly' },
  { path: '/chester-va-paving.html',                 priority: '0.85', changefreq: 'monthly' },
  { path: '/chesterfield-asphalt-paving.html',        priority: '0.85', changefreq: 'monthly' },
  { path: '/chip-and-tar.html',                      priority: '0.85', changefreq: 'monthly' },
  { path: '/cobblestone-paving.html',                 priority: '0.85', changefreq: 'monthly' },
  { path: '/colonial-heights-va-paving.html',         priority: '0.85', changefreq: 'monthly' },
  { path: '/commercial-paving.html',                 priority: '0.9',  changefreq: 'monthly' },
  { path: '/concrete-paving.html',                   priority: '0.85', changefreq: 'monthly' },
  { path: '/dinwiddie-county-paving.html',           priority: '0.85', changefreq: 'monthly' },
  { path: '/downtown-richmond-driveway-paving.html', priority: '0.85', changefreq: 'monthly' },
  { path: '/driveway-paving.html',                   priority: '0.9',  changefreq: 'monthly' },
  { path: '/fairfax-county-driveway-paving.html',    priority: '0.85', changefreq: 'monthly' },
  { path: '/fredericksburg-va-paving.html',           priority: '0.85', changefreq: 'monthly' },
  { path: '/glen-allen-asphalt-paving.html',         priority: '0.85', changefreq: 'monthly' },
  { path: '/goochland-county-paving.html',           priority: '0.85', changefreq: 'monthly' },
  { path: '/grading-excavation.html',                priority: '0.85', changefreq: 'monthly' },
  { path: '/hampton-va-paving.html',                 priority: '0.85', changefreq: 'monthly' },
  { path: '/hanover-county-paving.html',             priority: '0.85', changefreq: 'monthly' },
  { path: '/henrico-asphalt-paving.html',            priority: '0.85', changefreq: 'monthly' },
  { path: '/hopewell-va-paving.html',                priority: '0.85', changefreq: 'monthly' },
  { path: '/line-striping.html',                     priority: '0.85', changefreq: 'monthly' },
  { path: '/mclean-residential-paving.html',          priority: '0.85', changefreq: 'monthly' },
  { path: '/mechanicsville-asphalt-paving.html',     priority: '0.85', changefreq: 'monthly' },
  { path: '/midlothian-asphalt-paving.html',         priority: '0.85', changefreq: 'monthly' },
  { path: '/new-kent-asphalt-paving.html',           priority: '0.85', changefreq: 'monthly' },
  { path: '/newport-news-va-paving.html',            priority: '0.85', changefreq: 'monthly' },
  { path: '/parking-lot-paving.html',                priority: '0.9',  changefreq: 'monthly' },
  { path: '/petersburg-va-paving.html',               priority: '0.85', changefreq: 'monthly' },
  { path: '/powhatan-county-paving.html',             priority: '0.85', changefreq: 'monthly' },
  { path: '/prince-george-county-paving.html',        priority: '0.85', changefreq: 'monthly' },
  { path: '/residential-asphalt-paving.html',        priority: '0.9',  changefreq: 'monthly' },
  { path: '/sealcoating.html',                       priority: '0.9',  changefreq: 'monthly' },
  { path: '/short-pump-asphalt-paving.html',         priority: '0.85', changefreq: 'monthly' },
  { path: '/sleepy-hollow-driveway-paving.html',     priority: '0.85', changefreq: 'monthly' },
  { path: '/stone-masonry-paving.html',              priority: '0.85', changefreq: 'monthly' },
  { path: '/suffolk-va-paving.html',                 priority: '0.85', changefreq: 'monthly' },
  { path: '/tuckahoe-driveway-paving.html',          priority: '0.85', changefreq: 'monthly' },
  { path: '/virginia-beach-driveway-paving.html',     priority: '0.85', changefreq: 'monthly' },
  { path: '/williamsburg-asphalt-paving.html',        priority: '0.85', changefreq: 'monthly' },
  { path: '/gallery',                       priority: '0.75', changefreq: 'monthly' },
  { path: '/projects',                      priority: '0.75', changefreq: 'monthly' },
  { path: '/reviews',                       priority: '0.85', changefreq: 'weekly' },
  { path: '/blog',                          priority: '0.85', changefreq: 'weekly' },
  { path: '/locations',                     priority: '0.9',  changefreq: 'monthly' },
  { path: '/service-areas',                 priority: '0.9',  changefreq: 'monthly' },
  // Regional landing pages (high local-pack value)
  { path: '/richmond-paving',               priority: '0.95', changefreq: 'monthly' },
  { path: '/chesterfield-paving',           priority: '0.95', changefreq: 'monthly' },
  { path: '/hampton-roads-paving',          priority: '0.9',  changefreq: 'monthly' },
  { path: '/fredericksburg-paving',         priority: '0.9',  changefreq: 'monthly' },
  { path: '/northern-virginia-paving',      priority: '0.9',  changefreq: 'monthly' },
  { path: '/shenandoah-valley-paving',      priority: '0.9',  changefreq: 'monthly' },
  { path: '/commercial/richmond-va',        priority: '0.9',  changefreq: 'monthly' },
];

// ── 2. Pull dynamic city / location / state slugs from the actual data ────────
async function importDataModule(relPath) {
  const url = pathToFileURL(resolve(ROOT, relPath)).href;
  return import(url);
}

let LOCATIONS = [];
let SERVICE_AREAS = [];
let WORDEN_ACTIVE_STATES = [];
let STATE_MAP = {};
let LANDING_PAGES = [];
let BLOG_POSTS = [];
let GENERATED_BLOG_PATHS = [];
let RICHMOND_ZIP_PAGES = {};
let stateSlug = (s) => s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

try {
  ({ LOCATIONS } = await importDataModule('src/lib/locations.js'));
} catch (e) {
  console.warn('[sitemap] could not load src/lib/locations.js:', e.message);
}
try {
  ({ SERVICE_AREAS } = await importDataModule('src/data/serviceAreas.js'));
} catch (e) {
  console.warn('[sitemap] could not load src/data/serviceAreas.js:', e.message);
}
try {
  const mod = await importDataModule('src/lib/states50.js');
  WORDEN_ACTIVE_STATES = mod.WORDEN_ACTIVE_STATES || [];
  STATE_MAP = mod.STATE_MAP || {};
  if (mod.stateSlug) stateSlug = mod.stateSlug;
} catch (e) {
  console.warn('[sitemap] could not load src/lib/states50.js:', e.message);
}
try {
  ({ LANDING_PAGES } = await importDataModule('src/lib/landingPages.js'));
} catch (e) {
  console.warn('[sitemap] could not load src/lib/landingPages.js:', e.message);
}
try {
  const blogsMod = await importDataModule('src/data/blogPosts.js');
  BLOG_POSTS = blogsMod.default || [];
} catch (e) {
  console.warn('[sitemap] could not load src/data/blogPosts.js:', e.message);
}
GENERATED_BLOG_PATHS = collectGeneratedBlogPaths();
try {
  const zipMod = await importDataModule('src/data/richmondZipPages.js');
  RICHMOND_ZIP_PAGES = zipMod.RICHMOND_ZIP_PAGES || {};
} catch (e) {
  console.warn('[sitemap] could not load src/data/richmondZipPages.js:', e.message);
}

// Domains that vercel.json rewrites to a single pre-rendered <domain>.html
// for every path (see normalize-meta-quality.mjs) serve identical content
// with the same root canonical no matter which sitemap URL is requested.
// Advertising the full deep-URL set for those domains tells Google about
// hundreds of "distinct" pages that all collapse to one canonical — so
// their sitemap is restricted to just the root URL until real per-path
// generation exists.
let SINGLE_PAGE_DOMAINS = new Set();
try {
  const profilesMod = await importDataModule('src/data/regionalMarketProfiles.js');
  SINGLE_PAGE_DOMAINS = new Set(Object.keys(profilesMod.REGIONAL_MARKET_PROFILES || {}));
} catch (e) {
  console.warn('[sitemap] could not load src/data/regionalMarketProfiles.js:', e.message);
}

// ── Virginia county pages ────────────────────────────────────────────────────
const COUNTY_DOMAIN = 'richmondasphaltpaving.com';
let COUNTY_INDEXABLE_PATHS = [];
try {
  const policy = await import(pathToFileURL(resolve(ROOT, 'scripts/lib/county-index-policy.mjs')).href);
  const marketPages = JSON.parse(readFileSync(resolve(ROOT, 'src/data/virginiaMarketPages.json'), 'utf8'));
  const factsPath = resolve(ROOT, 'src/data/virginiaCountyFacts.json');
  const facts = existsSync(factsPath) ? JSON.parse(readFileSync(factsPath, 'utf8')) : { counties: [] };
  const factCounties = policy.factCountiesFrom(facts);
  COUNTY_INDEXABLE_PATHS = policy.allCountyRoutes(marketPages)
    .filter((r) => policy.isIndexable(r, factCounties))
    .map((r) => policy.countyPath(r.county, r.service));
  console.log(`[sitemap] ${COUNTY_INDEXABLE_PATHS.length} county pages qualify for ${COUNTY_DOMAIN}`);
} catch (e) {
  // A missing facts file means the county set has not been built. That is a
  // reason to advertise nothing, not a reason to fail the whole sitemap.
  console.warn('[sitemap] county pages skipped:', e.message);
}

// ── Texas city pages ─────────────────────────────────────────────────────────
// Every one is backed by an invoiced job, so unlike the county pages there is
// no indexability filter — a city with no invoiced work simply gets no page.
// Read from the same module the brand builder uses, for the same reason given
// above: this script runs in `prebuild`, before the manifest exists.
const TEXAS_DOMAIN = 'texaspavementgroup.com';
let TEXAS_CITY_PATHS = [];
try {
  const mod = await import(pathToFileURL(resolve(ROOT, 'src/data/texasCityPages.js')).href);
  TEXAS_CITY_PATHS = mod.texasCityPages().map((c) => c.path);
  console.log(`[sitemap] ${TEXAS_CITY_PATHS.length} Texas city pages for ${TEXAS_DOMAIN}`);
} catch (e) {
  console.warn('[sitemap] Texas city pages skipped:', e.message);
}

// ── 3. Build URL list ─────────────────────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10);
// ONLY domains this project actually serves. Generating sitemaps here for
// sites hosted by other projects invents URLs from THIS repo's route table
// and then submits them to IndexNow on every production deploy.
//
// Removed 2026-07-26, each verified live:
//   blueridgeasphaltpaving.com   separate Next.js project -> hard 404s
//                                (e.g. /quote -> 404)
//   minnesotaasphaltpaving.com   separate project -> hard 404s
//   michiganasphaltpavingpros.com  DNS does not resolve (NXDOMAIN)
//   obxpaving.com                separate SPA whose catch-all returns 200 for
//                                ANY path, so invented routes became soft 404s
//                                all rendering the homepage — worse than a 404
//                                because Google sees mass duplicate content
//
// If one of these should be part of this network, add it back only once this
// project actually serves it and its routes resolve.
const DOMAINS = [
  'richmondasphaltpaving.com',
  'atlantaasphaltpavingpros.com',
  'asphaltpavingkansascity.com',
  'savannahasphaltpaving.com',
  'carolinablacktop.com',
  'www.jwordenasphaltpaving.com',
  'thewordenstandard.com',
  // The training site. Its own domain, its own content, its own sitemap —
  // previously it had none, so /robots.txt and /sitemap.xml both 404'd and the
  // shell it served named the parked flagship as its canonical.
  'jwordenuniversity.com',
];

// texaspavementgroup.com is now served by THIS project — the domain was moved
// off worden-pavement-group on 2026-08-24, which also took down the
// competitive-intelligence dossier that was published at its root.
//
// This was previously behind a TEXAS_DOMAIN_LIVE env flag, because advertising
// URLs that 404 and pushing them to IndexNow is the harm the list above exists
// to prevent. That condition no longer holds: the domain resolves to this
// deployment, so the flag has been removed rather than left as a switch nobody
// would remember to throw.
DOMAINS.push(TEXAS_DOMAIN);

try { mkdirSync(resolve(ROOT, 'public/sitemaps'), { recursive: true }); } catch (e) {}

let totalUrls = 0;

// thewordenstandard.com is the public SaaS storefront ("built for the
// blue-collar man"). Its "/" is the marketing home and SHOULD be indexed,
// but the owner/staff Command Center and every other authed surface on the
// same host must never be crawled. So it emits a single-URL sitemap for "/"
// and a robots file that allows the storefront while disallowing every
// private path. Those Disallow paths must stay in sync with the noindex
// X-Robots-Tag header sources in vercel.json.
const STOREFRONT_DOMAINS = new Map([
  ['thewordenstandard.com', {
    urls: ['/'],
    disallow: [
      '/command-center', '/leads', '/portal', '/staff', '/dashboard',
      '/admin', '/super-admin', '/diamond', '/jarvis', '/scanner',
      '/estimate', '/consultant', '/autonomy', '/mobile', '/register',
      '/login', '/advisory/',
    ],
  }],
  // jwordenuniversity.com — the training and certification site. Only "/" is
  // public marketing; the course player, exams and every authed surface behind
  // it must stay out of the index. Same shape as the storefront above, and the
  // Disallow list must stay in sync with the noindex header sources in
  // vercel.json.
  ['jwordenuniversity.com', {
    urls: ['/'],
    disallow: [
      '/lms', '/command-center', '/leads', '/portal', '/staff', '/dashboard',
      '/admin', '/super-admin', '/jarvis', '/login', '/register',
    ],
  }],
]);
// Only the primary domain ships an image sitemap, so only its robots file
// should advertise one — pointing crawlers at a 404 on the other six hurts.
// Was www.jwordenasphaltpaving.com, which is currently serving a Sedo ad
// parking page (Netlify account past due) — so the one domain advertising an
// image sitemap was a domain that does not serve the site. Richmond is the
// flagship and is live, prerendered and self-canonical. Move this back when
// jwordenasphaltpaving.com is restored.
const PRIMARY_DOMAIN = 'richmondasphaltpaving.com';

for (const domain of DOMAINS) {
  // The canonical host for this domain, from the same module that stamps the
  // canonical onto the page itself. Advertising a URL whose page then names a
  // different hostname is the contradiction Search Console reports as
  // "Alternate page with proper canonical tag" — every submitted URL dropped
  // in favour of a host the sitemap never mentioned.
  const SITE = canonicalOrigin(domain);

  if (STOREFRONT_DOMAINS.has(domain)) {
    const { urls: storefrontPaths, disallow } = STOREFRONT_DOMAINS.get(domain);
    const body = storefrontPaths
      .map((p) => `  <url>\n    <loc>${SITE}${p}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>`)
      .join('\n');
    writeFileSync(resolve(ROOT, `public/sitemaps/sitemap-${domain}.xml`),
      `<?xml version="1.0" encoding="utf-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`, 'utf8');
    writeFileSync(resolve(ROOT, `public/sitemaps/sitemap-${domain}.txt`),
      storefrontPaths.map((p) => `${SITE}${p}`).join('\n') + '\n', 'utf8');
    writeFileSync(resolve(ROOT, `public/sitemaps/robots-${domain}.txt`),
      `User-agent: *\nAllow: /\n${disallow.map((d) => `Disallow: ${d}`).join('\n')}\n\nSitemap: ${SITE}/sitemap.xml\n`, 'utf8');
    totalUrls += storefrontPaths.length;
    continue;
  }

  const urls = [];

  if (SINGLE_PAGE_DOMAINS.has(domain)) {
    // These brands now have REAL per-route pages generated by
    // scripts/build-brand-sites.mjs into dist/brands/<domain>/, each with its
    // own self-referencing canonical. They are no longer one page wearing many
    // URLs, so the single-URL cap is lifted and the real route set is
    // advertised. Keep this list in sync with ROUTES in build-brand-sites.mjs.
    for (const path of ['/', '/commercial', '/residential', '/services', '/service-areas', '/contact']) {
      urls.push({
        loc: SITE + path,
        lastmod: today,
        changefreq: path === '/' ? 'weekly' : 'monthly',
        priority: path === '/' ? '1.0' : '0.8',
      });
    }

    // Virginia county pages, for the Virginia brand only.
    //
    // Which URLs qualify is decided by scripts/lib/county-index-policy.mjs,
    // the same module build-brand-sites.mjs uses to stamp the robots meta.
    // It cannot be read from the brand manifest here: this script runs in
    // `prebuild` and the brand build runs in `postbuild`, so the manifest does
    // not exist yet. Sharing the rule rather than restating it is what keeps a
    // sitemap entry from ever pointing at a page that says noindex.
    if (COUNTY_INDEXABLE_PATHS.length && domain === COUNTY_DOMAIN) {
      for (const path of COUNTY_INDEXABLE_PATHS) {
        urls.push({ loc: SITE + path, lastmod: today, changefreq: 'monthly', priority: '0.8' });
      }
    }

    // Texas city pages, for the Texas brand only.
    if (TEXAS_CITY_PATHS.length && domain === TEXAS_DOMAIN) {
      for (const path of TEXAS_CITY_PATHS) {
        urls.push({ loc: SITE + path, lastmod: today, changefreq: 'monthly', priority: '0.85' });
      }
    }
  } else {
  for (const r of STATIC_ROUTES) {
    urls.push({ loc: SITE + r.path, lastmod: today, changefreq: r.changefreq, priority: r.priority });
  }

  for (const loc of LOCATIONS) {
    if (!loc?.slug) continue;
    urls.push({ loc: `${SITE}/locations/${loc.slug}`, lastmod: today, changefreq: 'monthly', priority: '0.9' });
  }

  for (const a of SERVICE_AREAS) {
    if (!a?.slug) continue;
    urls.push({ loc: `${SITE}/service-areas/${a.slug}`, lastmod: today, changefreq: 'monthly', priority: '0.85' });
  }

  for (const lp of LANDING_PAGES) {
    if (!lp?.slug) continue;
    urls.push({ loc: `${SITE}/lp/${lp.slug}`, lastmod: today, changefreq: 'monthly', priority: '0.9' });
  }

  for (const bp of BLOG_POSTS) {
    if (!bp?.slug) continue;
    urls.push({ loc: `${SITE}/blog/${bp.slug}`, lastmod: bp.date || today, changefreq: 'monthly', priority: '0.75' });
  }

  for (const blogPath of GENERATED_BLOG_PATHS) {
    urls.push({ loc: `${SITE}${blogPath}`, lastmod: today, changefreq: 'monthly', priority: '0.72' });
  }

  for (const zip of Object.keys(RICHMOND_ZIP_PAGES)) {
    urls.push({ loc: `${SITE}/locations/richmond-va/${zip}`, lastmod: today, changefreq: 'monthly', priority: '0.88' });
  }
  }

  // ── /states/* is not paving inventory ──────────────────────────────────────
  //
  // The 50-state pages were built to advertise the thewordenstandard.com SaaS
  // product, not J. Worden's paving service area. They leaked into the paving
  // sitemap because WORDEN_ACTIVE_STATES is `STATES.map(s => s.abbr)` — every
  // state in the union — despite a docstring claiming it holds only states with
  // verified completed work.
  //
  // What shipped was 40 indexable pages, ~80% identical to each other, each
  // asserting local presence the company does not have ("our specialized crews
  // understand local zoning laws", "we strictly adhere to Alaska's 4-month
  // seasonal paving window"), carrying the Virginia homepage meta description,
  // and every one canonicalising to the homepage. That is the doorway-page
  // pattern with a false-locality claim on top, on a contractor site whose
  // credibility is its 40 years in one place.
  //
  // vercel.json now redirects /states/(.*) to /service-areas. That is a pattern,
  // and loadRedirectSources() deliberately refuses to interpret patterns, so
  // these have to stop being emitted here rather than being filtered out later.
  //
  // --all-states (or SITEMAP_INCLUDE_ALL_STATES) still forces them, but note it
  // cannot produce these for thewordenstandard.com itself: that domain is a
  // STOREFRONT_DOMAIN and returns above with just its "/" URL. The flag is an
  // escape hatch for a future paving domain that genuinely serves multiple
  // states, not a way to restore the SaaS pages here.
  if (!SINGLE_PAGE_DOMAINS.has(domain) && INCLUDE_ALL_STATES) {
    for (const abbr of Object.keys(STATE_MAP).sort()) {
      const st = STATE_MAP[abbr];
      if (!st) continue;
      urls.push({ loc: `${SITE}/states/${stateSlug(st)}`, lastmod: today, changefreq: 'monthly', priority: '0.7' });
    }
  }

  const seen = new Set();
  let redirectedOut = 0;
  const deduped = urls.filter((u) => {
    if (seen.has(u.loc)) return false;
    seen.add(u.loc);
    // Applied here rather than at each push site so it covers every URL kind —
    // states, locations, service areas, blogs — including ones added later.
    if (isRedirected(u.loc)) {
      redirectedOut += 1;
      return false;
    }
    return true;
  });
  if (redirectedOut > 0) {
    console.log(`[sitemap] ${domain}: excluded ${redirectedOut} URL(s) that vercel.json redirects`);
  }
  assertValidSitemapEntries(deduped);

  // ── 4. Emit sitemap.xml & robots.txt ──────────────────────────────────────────
  const xmlBody = deduped
    .map(
      (u) => `  <url>
      <loc>${escapeXml(u.loc)}</loc>
      <lastmod>${escapeXml(u.lastmod)}</lastmod>
      <changefreq>${escapeXml(u.changefreq)}</changefreq>
      <priority>${escapeXml(u.priority)}</priority>
    </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlBody}
</urlset>\n`;

  writeFileSync(resolve(ROOT, `public/sitemaps/sitemap-${domain}.xml`), xml, 'utf8');
  writeFileSync(resolve(ROOT, `public/sitemaps/sitemap-${domain}.txt`), deduped.map((u) => u.loc).join('\n') + '\n', 'utf8');
  
  const robots = `User-agent: *
Allow: /
Disallow: /package.json
Disallow: /package-lock.json
Disallow: /replace.js
Disallow: /fix_links.js
Disallow: /fix_newlines.js
Disallow: /update_site.js
Disallow: /add_new_pages.js
Disallow: /add_remaining_pages.js
Disallow: /pull_request_23_status.txt

Sitemap: ${SITE}/sitemap.xml${domain === PRIMARY_DOMAIN ? `\nSitemap: ${SITE}/image-sitemap.xml` : ''}
`;
  writeFileSync(resolve(ROOT, `public/sitemaps/robots-${domain}.txt`), robots, 'utf8');

  totalUrls += deduped.length;
}

console.log(`[sitemap] wrote ${totalUrls} URLs across ${DOMAINS.length} domains`);
