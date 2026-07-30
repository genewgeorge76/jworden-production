import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { renderRegionalBody } from './regional-content.mjs';

// TWO-PASS DESIGN — read this before changing the call order in package.json.
//
// This script runs twice per build, and the two passes do different jobs:
//
//   pass 1 (before prerender)  stamps title/description/canonical onto
//                              dist/index.html. prerender.mjs renders all ~209
//                              sitemap routes FROM that file, so the canonical
//                              stamped here is inherited by every prerendered
//                              page. verify-seo-readiness.mjs fails the build if
//                              any prerendered route lacks one, so this pass is
//                              load-bearing for the main site's indexed routes.
//
//   pass 2 (--domains-only)    regenerates only the regional dist/<domain>.html
//                              files, now that index.html actually contains
//                              prerendered markup. Without this pass those files
//                              are copied from the empty pre-prerender shell and
//                              every regional domain ships a blank page to
//                              Google — which is exactly what was happening.
//
// Pass 2 deliberately does NOT rewrite index.html: by then it holds the
// prerendered homepage, and overwriting it would undo prerender's work on the
// main money site.
const DOMAINS_ONLY = process.argv.includes('--domains-only');

const root = process.cwd();
const distDir = path.join(root, 'dist');

/**
 * Replace everything inside <div id="root"> with `inner`, keeping the wrapper
 * and everything after it (the module script tags that boot React).
 *
 * Depth counting rather than a regex, because the prerendered homepage nests
 * hundreds of divs and no regular expression can find a matching close tag. A
 * non-greedy `[\s\S]*?</div>` stops at the FIRST close and leaves the rest of
 * the page in place — which silently produced a Carolina domain mentioning
 * Richmond 22 times.
 *
 * Returns null when the subtree cannot be located, so the caller can warn
 * instead of shipping a file it did not actually change.
 */
function replaceRootSubtree(html, inner) {
  const openMatch = /<div[^>]+id="root"[^>]*>/.exec(html);
  if (!openMatch) return null;

  const contentStart = openMatch.index + openMatch[0].length;
  const tag = /<div\b[^>]*>|<\/div>/gi;
  tag.lastIndex = contentStart;

  let depth = 1;
  let m;
  while ((m = tag.exec(html)) !== null) {
    depth += m[0][1] === '/' ? -1 : 1;
    if (depth === 0) {
      return html.slice(0, contentStart) + inner + html.slice(m.index);
    }
  }
  return null; // unbalanced markup — do not guess
}
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

/**
 * og:url must point at the domain being generated.
 *
 * The base index.html hardcodes og:url to www.jwordenasphaltpaving.com. Copied
 * unchanged into every regional file, that told crawlers and social scrapers
 * the canonical entity for Savannah, Richmond and Carolina Blacktop was the
 * main J. Worden site — a cross-domain signal working directly against the
 * per-domain canonical tag sitting a few lines above it.
 */
function upsertOgUrl(html, canonicalBase) {
  const tag = `<meta property="og:url" content="${canonicalBase}">`;
  const regex = /<meta[^>]+property=["']og:url["'][^>]*>/i;
  if (regex.test(html)) {
    return html.replace(regex, tag);
  }
  return html.replace(/<head[^>]*>/i, (m) => `${m}\n${tag}`);
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
    html = upsertOgUrl(html, canonicalBase);
    html = upsertSchema(html, tenant, canonicalBase);

    // Give the domain its OWN body.
    //
    // Without this every regional file carries the Virginia homepage, so six
    // domains serve one page under six names — each canonicalising to itself.
    // Content-wise that is a doorway network, and the rewritten <head> does not
    // change it: Google compares bodies.
    //
    // Only done on pass 2, when index.html has been prerendered and the body
    // markers we splice between actually exist. On pass 1 the file is still a
    // template and there is nothing to replace.
    if (DOMAINS_ONLY) {
      const regional = renderRegionalBody(domain, tenant, root);
      const replaced = replaceRootSubtree(html, regional);
      if (replaced === null) {
        console.warn(
          `[meta-normalizer] ${domain}: could not locate the #root subtree — ` +
            'file keeps the shared body. Check the prerender output before shipping.',
        );
      } else {
        html = replaced;
      }
    }

    fs.writeFileSync(path.join(distDir, `${domain}.html`), html, 'utf8');
    generatedCount++;
  }
  
  // thewordenstandard.com — the PUBLIC SaaS storefront ("built for the
  // blue-collar man"). "/" is the marketing home and MUST be indexable. The
  // private Command Center lives at /command-center on this host and is kept
  // out of the index by (a) the X-Robots-Tag noindex header in vercel.json and
  // (b) the robots.txt Disallow list — both server-side and authoritative, so
  // the storefront shell does NOT need a blanket noindex (which previously made
  // the whole domain un-indexable).
  //
  // This static shell mirrors MarketingHome's <head> so that if the shell is
  // ever served for "/" (a root rewrite, an edge fallback), a crawler that does
  // not run JS still gets correct, indexable storefront metadata rather than an
  // empty SPA shell with the paving site's title.
  const opsTitle = 'The J. Worden Standard OS | AI Software for Blue-Collar Empires';
  const opsCanonical = 'https://thewordenstandard.com/';
  let opsHtml = upsertTitle(rawHtml, opsTitle);
  opsHtml = upsertDescription(opsHtml, 'Field software for asphalt, roofing and concrete contractors — built inside a paving company running crews since 1984. Drone takeoffs, weather-aware scheduling, and an AI dispatcher that never misses a lead.');
  opsHtml = upsertCanonical(opsHtml, opsCanonical);
  opsHtml = upsertRobotsMeta(opsHtml, 'index, follow');
  fs.writeFileSync(path.join(distDir, 'thewordenstandard.com.html'), opsHtml, 'utf8');
  generatedCount++;

  // Update index.html for jwordenasphaltpaving.com
  // Pass 2 stops here: index.html is the prerendered homepage at this point and
  // must not be rewritten from a template.
  if (DOMAINS_ONLY) {
    console.log(`[meta-normalizer] --domains-only: regenerated ${generatedCount} regional files from prerendered index.html; left index.html untouched.`);
    return;
  }

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
