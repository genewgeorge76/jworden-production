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

function upsertSchema(html, tenant, canonicalBase) {
  if (/@context"\s*:\s*"https:\/\/schema\.org"/i.test(html)) return html;
  
  const brand = tenant?.marketName || tenant?.label || defaultTenant.label;
  
  const schemaObj = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": brand,
    "url": canonicalBase,
    "telephone": tenant?.phoneDisplay || "+1-804-830-7933",
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": tenant?.primaryMetro?.split(',')[0] || "Richmond",
      "addressRegion": "VA",
      "postalCode": "23230",
      "addressCountry": "US"
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      "opens": "07:00",
      "closes": "19:00"
    }
  };
  const schemaScript = `\n<script type="application/ld+json">\n${JSON.stringify(schemaObj, null, 2)}\n</script>`;
  return html.replace(/<\/head>/i, `${schemaScript}\n</head>`);
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
  
  // Update index.html for jwordenasphaltpaving.com
  const defaultCanonical = 'https://www.jwordenasphaltpaving.com';
  let defaultHtml = upsertTitle(rawHtml, 'J. Worden Asphalt Paving | Premium Asphalt Services');
  defaultHtml = upsertDescription(defaultHtml, 'Premium asphalt paving, sealcoating, and repair in Virginia. Contact J. Worden Asphalt Paving today.');
  defaultHtml = upsertCanonical(defaultHtml, defaultCanonical);
  defaultHtml = upsertSchema(defaultHtml, defaultTenant, defaultCanonical);
  fs.writeFileSync(indexHtmlPath, defaultHtml, 'utf8');
  generatedCount++;

  console.log(`[meta-normalizer] generated ${generatedCount} domain-specific HTML files for multi-tenant SEO.`);
}

run();
