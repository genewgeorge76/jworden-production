import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const profilesPath = path.join(root, 'src', 'data', 'regionalMarketProfiles.js');

const defaultTenant = {
  key: 'jworden',
  label: 'J. Worden Asphalt Paving',
  canonicalUrl: 'https://www.jwordenasphaltpaving.com',
  market: { primaryRegion: 'Virginia' },
};

function normalizeWhitespace(s) {
  return String(s || '').replace(/\s+/g, ' ').trim();
}

function upsertTitle(html, nextTitle) {
  const titleTag = `<title>${nextTitle}</title>`;
  if (/<title>.*?<\/title>/i.test(html)) {
    return html.replace(/<title>.*?<\/title>/i, titleTag);
  }
  return html.replace(/<head[^>]*>/i, (m) => `${m}\n${titleTag}`);
}

function upsertDescription(html, nextDesc) {
  const descTag = `<meta name="description" content="${nextDesc}">`;
  const descRegex = /<meta[^>]+name=["']description["'][^>]*>/i;
  if (descRegex.test(html)) {
    return html.replace(descRegex, descTag);
  }
  return html.replace(/<head[^>]*>/i, (m) => `${m}\n${descTag}`);
}

function upsertCanonical(html, canonicalBase) {
  const canonicalTag = `<link rel="canonical" href="${canonicalBase}">`;
  const canonicalRegex = /<link[^>]+rel=["']canonical["'][^>]*>/i;
  if (canonicalRegex.test(html)) {
    return html.replace(canonicalRegex, canonicalTag);
  }
  return html.replace(/<head[^>]*>/i, (m) => `${m}\n${canonicalTag}`);
}

function upsertRobotsMeta(html, content) {
  const tag = `<meta id="robots-meta" name="robots" content="${content}">`;
  const regex = /<meta[^>]+name=["']robots["'][^>]*>/i;
  if (regex.test(html)) {
    return html.replace(regex, tag);
  }
  return html.replace(/<head[^>]*>/i, (m) => `${m}\n${tag}`);
}

function upsertSchema(html, tenant, canonicalBase) {
  const brand = tenant?.marketName || tenant?.label || defaultTenant.label;
  const [metroCity, metroRegion] = (tenant?.primaryMetro || 'Richmond, VA').split(',').map((s) => s.trim());

  const schemaObj = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": brand,
    "url": canonicalBase,
    "telephone": tenant?.phoneDisplay || "+1-804-830-7933",
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": metroCity || "Richmond",
      "addressRegion": metroRegion || "VA",
      "addressCountry": "US"
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      "opens": "07:00",
      "closes": "19:00"
    }
  };
  // Escape "</" so a tenant field (or a future data-entry typo) can never
  // prematurely close the <script> tag and break out into raw HTML.
  const safeJson = JSON.stringify(schemaObj, null, 2).replace(/<\//g, '<\\/');
  const schemaScript = `<script type="application/ld+json">\n${safeJson}\n</script>`;

  // Every domain-specific page needs its OWN schema (own city/region), so
  // strip whatever ld+json LocalBusiness schema the base index.html already
  // carries rather than skipping injection just because some schema block
  // is present — that previously left Atlanta/Kansas City/Savannah/Carolina
  // pages declaring a Richmond, VA address in their structured data. Only
  // ever one such block exists in the source index.html (verified), and
  // the id below scopes removal to exactly that block rather than a bare
  // "any <script>...</script>" scan.
  const strippedHtml = html.replace(
    /<script id="local-business-schema"[^>]*>[^<]*<\/script>\s*/i,
    ''
  );
  return strippedHtml.replace(/<\/head>/i, `${schemaScript}\n</head>`);
}

async function run() {
  if (!fs.existsSync(distDir)) {
    console.log('[meta-normalizer] dist not found, skipping.');
    process.exit(0);
  }
  
  const indexHtmlPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexHtmlPath)) {
    console.log('[meta-normalizer] dist/index.html not found, skipping.');
    process.exit(0);
  }
  
  const rawHtml = fs.readFileSync(indexHtmlPath, 'utf8');

  // Load regionalMarketProfiles
  let REGIONAL_MARKET_PROFILES = {};
  try {
      // Dynamic import
      const module = await import(pathToFileURL(profilesPath));
      REGIONAL_MARKET_PROFILES = module.REGIONAL_MARKET_PROFILES || {};
  } catch (err) {
      console.warn('[meta-normalizer] Error importing regionalMarketProfiles.js. Falling back to default.', err);
  }
  
  const domains = Object.keys(REGIONAL_MARKET_PROFILES);
  let generatedCount = 0;

  for (const domain of domains) {
    const tenant = REGIONAL_MARKET_PROFILES[domain];
    const canonicalBase = `https://www.${domain}`;
    const title = `${tenant.heroHeadline || tenant.marketName} | ${tenant.marketName}`;
    const desc = `${tenant.heroBody || ''} Contact us at ${tenant.phoneDisplay || ''}`.substring(0, 160).trim();

    let html = upsertTitle(rawHtml, title);
    html = upsertDescription(html, desc);
    html = upsertCanonical(html, canonicalBase);
    html = upsertSchema(html, tenant, canonicalBase);
    
    fs.writeFileSync(path.join(distDir, `${domain}.html`), html, 'utf8');
    generatedCount++;
  }
  
  // thewordenstandard.com — internal Operations/Command Center domain, not a
  // public marketing site. Give it its own static HTML with noindex baked in
  // (rather than relying on the client-side SEO component to set it after JS
  // runs) so crawlers never index or list internal admin URLs.
  const opsTitle = 'J. Worden & Sons — Command Center';
  const opsCanonical = 'https://thewordenstandard.com';
  let opsHtml = upsertTitle(rawHtml, opsTitle);
  opsHtml = upsertDescription(opsHtml, 'Internal operations dashboard. Not for public access.');
  opsHtml = upsertCanonical(opsHtml, opsCanonical);
  opsHtml = upsertRobotsMeta(opsHtml, 'noindex, nofollow');
  fs.writeFileSync(path.join(distDir, 'thewordenstandard.com.html'), opsHtml, 'utf8');
  generatedCount++;

  // Update index.html for jwordenasphaltpaving.com
  let defaultHtml = upsertTitle(rawHtml, 'J. Worden Asphalt Paving | Premium Asphalt Services');
  defaultHtml = upsertDescription(defaultHtml, 'Premium asphalt paving, sealcoating, and repair in Virginia. Contact J. Worden Asphalt Paving today.');
  // No upsertCanonical here, unlike the per-tenant files above.
  //
  // Those are single-page sites, so a canonical at their domain root is simply
  // true. dist/index.html is different: vercel.json rewrites every unmatched
  // path to it, and scripts/prerender.mjs renders each of the ~209 sitemap
  // routes from it. A canonical stamped in here is therefore not "the homepage
  // is the homepage" — it is every page on the site declaring itself the
  // homepage, which is what put a homepage canonical on /about, /contact,
  // /services and all 20 /service-areas/* pages.
  //
  // Per-route canonicals come from the SEO component (which sets the tag on the
  // live document) and from SchemaMarkup via react-helmet. Both create the tag
  // when none exists, so leaving it out here yields exactly one per page,
  // self-referential — including on the homepage itself, which the prerenderer
  // renders through React like any other route.
  //
  // Title and description are still upserted: those are genuine fallbacks for
  // the raw shell, and any route that renders SEO or SchemaMarkup overwrites
  // them. A wrong-but-present title degrades gracefully; a wrong canonical does
  // not.
  // No upsertSchema call here — index.html already ships its own, richer
  // Virginia LocalBusiness schema (with @id, sameAs, aggregateRating, etc.)
  // that shouldn't be replaced by upsertSchema's smaller generated version.
  fs.writeFileSync(indexHtmlPath, defaultHtml, 'utf8');
  generatedCount++;

  console.log(`[meta-normalizer] generated ${generatedCount} domain-specific HTML files for multi-tenant SEO.`);
}

run();
