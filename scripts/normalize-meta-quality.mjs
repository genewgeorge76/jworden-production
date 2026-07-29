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
  const defaultCanonical = 'https://www.jwordenasphaltpaving.com';
  let defaultHtml = upsertTitle(rawHtml, 'J. Worden Asphalt Paving | Premium Asphalt Services');
  defaultHtml = upsertDescription(defaultHtml, 'Premium asphalt paving, sealcoating, and repair in Virginia. Contact J. Worden Asphalt Paving today.');
  // KNOWN ISSUE — do not remove this call without reading scripts/verify-seo-readiness.mjs.
  //
  // dist/index.html is both the homepage and the SPA fallback that
  // scripts/prerender.mjs renders all ~209 sitemap routes from, so the canonical
  // stamped here rides along into every prerendered page. Pages using the SEO
  // component overwrite it in place and end up correct. Pages using SchemaMarkup
  // emit theirs through react-helmet, which cannot replace a tag helmet does not
  // manage, so they ship two — the homepage one first. Google ignores the signal
  // entirely when a page declares more than one, which currently affects /about,
  // /contact, /services and the 20 /service-areas/* pages.
  //
  // Simply dropping this call does NOT fix it and was tried: verify-seo-readiness
  // requires a canonical on index.html and on every prerendered route, and /contact
  // renders no react-helmet tags at all during prerender (full body, but the shell's
  // title and no canonical), so removing the fallback turns a duplicate-canonical
  // problem into a missing-canonical one on a money page.
  //
  // The real fix is to make SchemaMarkup replace the inherited tag rather than add
  // to it — and to work out why /contact's helmet output never lands. Both need
  // more care than a one-line change.
  defaultHtml = upsertCanonical(defaultHtml, defaultCanonical);
  // No upsertSchema call here — index.html already ships its own, richer
  // Virginia LocalBusiness schema (with @id, sameAs, aggregateRating, etc.)
  // that shouldn't be replaced by upsertSchema's smaller generated version.
  fs.writeFileSync(indexHtmlPath, defaultHtml, 'utf8');
  generatedCount++;

  console.log(`[meta-normalizer] generated ${generatedCount} domain-specific HTML files for multi-tenant SEO.`);
}

run();
