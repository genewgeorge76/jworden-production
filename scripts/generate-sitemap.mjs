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
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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
  { path: '/request-estimate.html',                  priority: '0.95', changefreq: 'monthly' },
  { path: '/residential-asphalt-paving.html',        priority: '0.9',  changefreq: 'monthly' },
  { path: '/sealcoating.html',                       priority: '0.9',  changefreq: 'monthly' },
  { path: '/service-areas.html',                     priority: '0.85', changefreq: 'monthly' },
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

// ── 3. Build URL list ─────────────────────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10);
const DOMAINS = [
  'richmondasphaltpaving.com',
  'blueridgeasphaltpaving.com',
  'minnesotaasphaltpaving.com',
  'obxpaving.com',
  'atlantaasphaltpavingpros.com',
  'michiganasphaltpavingpros.com',
  'asphaltpavingkansascity.com',
  'savannahasphaltpaving.com',
  'carolinablacktop.com',
  'www.jwordenasphaltpaving.com',
  'thewordenstandard.com'
];

try { mkdirSync(resolve(ROOT, 'public/sitemaps'), { recursive: true }); } catch (e) {}

let totalUrls = 0;

for (const domain of DOMAINS) {
  const SITE = `https://${domain}`;
  const urls = [];

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

  const stateCodesForSitemap = INCLUDE_ALL_STATES ? Object.keys(STATE_MAP).sort() : WORDEN_ACTIVE_STATES;
  for (const abbr of stateCodesForSitemap) {
    const st = STATE_MAP[abbr];
    if (!st) continue;
    urls.push({ loc: `${SITE}/states/${stateSlug(st)}`, lastmod: today, changefreq: 'monthly', priority: '0.7' });
  }

  const seen = new Set();
  const deduped = urls.filter((u) => {
    if (seen.has(u.loc)) return false;
    seen.add(u.loc);
    return true;
  });
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
Disallow: /netlify.toml
Disallow: /replace.js
Disallow: /fix_links.js
Disallow: /fix_newlines.js
Disallow: /update_site.js
Disallow: /add_new_pages.js
Disallow: /add_remaining_pages.js
Disallow: /pull_request_23_status.txt
Allow: /.netlify/images
Disallow: /.netlify/

Sitemap: ${SITE}/sitemap.xml
`;
  writeFileSync(resolve(ROOT, `public/sitemaps/robots-${domain}.txt`), robots, 'utf8');

  totalUrls += deduped.length;
}

console.log(`[sitemap] wrote ${totalUrls} URLs across ${DOMAINS.length} domains`);
