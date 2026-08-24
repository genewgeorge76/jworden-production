/**
 * build-brand-sites.mjs — real multi-page sites for every regional brand.
 *
 * THE PROBLEM THIS SOLVES
 * ----------------------
 * Each regional brand domain (carolinablacktop.com, savannahasphaltpaving.com,
 * …) was rewritten by vercel.json to a single pre-rendered <domain>.html for
 * every path. That looked fine until you actually requested a sub-path:
 *
 *   carolinablacktop.com/services -> served J. WORDEN's services page, with
 *                                    canonical=jwordenasphaltpaving.com
 *   carolinablacktop.com/contact  -> served <h1>404</h1> with a 200 status
 *
 * The cause is that Vercel serves a matching STATIC FILE before it applies a
 * host rewrite. The main site prerenders dist/services/index.html, so that file
 * won every request for /services on every domain. Each brand was handing its
 * ranking signal to another domain and serving soft-404s to Google.
 *
 * Because of that, the sitemap generator deliberately capped these domains at a
 * single URL (see SINGLE_PAGE_DOMAINS) — correctly, since advertising deep URLs
 * that all collapse to one canonical is worse than advertising none.
 *
 * THE FIX
 * -------
 * Give every brand a real, self-contained site under a path that cannot be
 * shadowed: dist/brands/<domain>/<route>/index.html. vercel.json then rewrites
 * host -> /brands/<domain>/$1, so nothing on the main site can intercept it.
 *
 * Every generated page has:
 *   - its own canonical, on the domain's canonical host (see
 *     scripts/lib/site-hosts.mjs) — no cross-domain leakage, and no
 *     disagreement with the hostname the sitemap advertises
 *   - a unique, length-tuned title + meta description
 *   - genuinely market-specific copy from regionalMarketProfiles (state DOT
 *     spec, subgrade behaviour, climate failure mode) rather than spun filler
 *   - LocalBusiness JSON-LD with the correct state code and service area
 *   - a lead form posting to the same protected endpoint as the main site
 *   - a link back to the hub, which is what makes the spoke-and-wheel real
 *
 * Content honesty note: several profiles carry a `travelNote` stating plainly
 * that this is a Virginia contractor that mobilises to the market rather than a
 * local storefront. That note is rendered on every page on purpose. Claiming a
 * local address we do not have would be both dishonest and a Google Business
 * Profile violation.
 *
 * Usage:  node scripts/build-brand-sites.mjs        (writes into dist/)
 */

import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Which hostname is canonical for a domain. Shared with generate-sitemap.mjs
// so a page's canonical and the <loc> advertising it cannot disagree — they
// did, and the mismatch quietly nullified every sitemap on the network.
import { canonicalUrl } from './lib/site-hosts.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(ROOT, 'dist');

// ── State code map (full name -> USPS). Same fix as the Footer: never derive an
// abbreviation by truncating the state name. "Virginia".slice(0,2) === "VI".
const STATE_ABBR = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
  hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA',
  kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS',
  missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH', oklahoma: 'OK',
  oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT',
  virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI',
  wyoming: 'WY',
};

const stateFromPlacename = (placename = '') => {
  const part = String(placename).split(',')[1]?.trim() || '';
  if (!part) return '';
  if (/^[A-Za-z]{2}$/.test(part)) return part.toUpperCase();
  return STATE_ABBR[part.toLowerCase()] || '';
};

const HUB = 'https://www.jwordenasphaltpaving.com';

// The fallback number, from the ONE place that defines it. It used to be the
// string '804-822-7715' typed into three separate template literals — a number
// that had been disconnected for years. Any brand without an explicit
// phoneDisplay inherited a dead line, on every page and in the JSON-LD.
const { PHONE_DISPLAY: FALLBACK_PHONE } = await import(
  pathToFileURL(resolve(ROOT, 'src/lib/businessInfo.canonical.js')).href
);
const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ── Routes every brand gets. Each is a real page with its own content and
// canonical — not an alias of the homepage.
const ROUTES = [
  { path: '/',             key: 'home',        priority: '1.0', changefreq: 'weekly' },
  { path: '/commercial',   key: 'commercial',  priority: '0.9', changefreq: 'monthly' },
  { path: '/residential',  key: 'residential', priority: '0.9', changefreq: 'monthly' },
  { path: '/services',     key: 'services',    priority: '0.8', changefreq: 'monthly' },
  { path: '/service-areas',key: 'areas',       priority: '0.8', changefreq: 'monthly' },
  { path: '/contact',      key: 'contact',     priority: '0.7', changefreq: 'monthly' },
];

// ── Per-route copy. Written per market so no two pages are near-duplicates.
// Hoisted to module scope: this was declared INSIDE copyFor, so the Texas
// city pages could not call it and every one of their meta descriptions
// threw at build time. It is a pure string utility and belongs out here.
/**
 * A meta description cut to length WITHOUT slicing through a word.
 *
 * This was `.slice(0, 155)`, which ended one brand's description on
 * "...23 invoiced restaurant sites acro". Google shows the description it is
 * given; a sentence that stops mid-word reads as a broken page to the one
 * person who was about to click.
 *
 * Cut at the last space before the limit, strip any trailing punctuation the
 * cut left dangling, and close with an ellipsis so it reads as deliberate.
 */
function clampDescription(text, limit = 155) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= limit) return clean;
  const cut = clean.slice(0, limit - 1);
  const lastSpace = cut.lastIndexOf(' ');
  // A single word longer than the limit has no space to cut at; take the hard
  // slice rather than returning nothing.
  const body = lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${body.replace(/[\s,;:.\u2014-]+$/, '')}\u2026`;
}

function copyFor(key, p) {

  const { marketName, primaryMetro, primaryRegion, stateAbbr } = p;
  const where = primaryMetro || primaryRegion || marketName;
  switch (key) {
    case 'commercial':
      return {
        title: `Commercial Asphalt Paving in ${where} | ${marketName}`,
        desc: `Commercial parking lot paving, resurfacing and striping in ${where}. Built to ${p.stateDotShort} spec with documented compaction. Free site assessment.`,
        h1: `Commercial Paving in ${where}`,
        lede: `Parking lots, access drives and industrial pads engineered for real traffic loads — specified to ${p.stateDot}.`,
        body: p.climate,
        bullets: p.commercialFocus,
        bulletsTitle: 'Commercial work we take on',
      };
    case 'residential':
      return {
        title: `Residential Driveway Paving in ${where} | ${marketName}`,
        desc: `Residential driveway paving and resurfacing in ${where}. Proper subgrade prep and drainage — the difference between five years and twenty-five.`,
        h1: `Driveway Paving in ${where}`,
        lede: `Driveways built on prep that lasts, not a thicker mat over a bad base.`,
        body: p.subgrade,
        bullets: p.residentialServices || [
          'New driveway installation', 'Resurfacing and overlays', 'Remove and replace',
          'Widening and aprons', 'Drainage correction', 'Sealcoating and crack repair',
        ],
        bulletsTitle: 'Residential services',
      };
    case 'services':
      return {
        title: `Asphalt Paving Services in ${where} | ${marketName}`,
        desc: p.servicesDesc
          || `Full asphalt services in ${where}: paving, resurfacing, sealcoating, crack repair, striping and drainage correction. Documented specs, honest scope.`,
        h1: `Our Services in ${where}`,
        lede: `One crew, one standard — commercial lots through residential drives.`,
        body: p.subgrade,
        // A profile may state its own service mix. The default below is the
        // Virginia list, and it is wrong in markets that buy something else:
        // Texas ranch work is tar-and-chip and long unpaved runs, which no
        // amount of "parking lot construction" speaks to. A market that does
        // not override it keeps the default.
        bullets: p.services || [
          'Asphalt paving and resurfacing',
          'Parking lot construction',
          'Sealcoating',
          'Hot-pour crack repair',
          'Line striping and ADA layout',
          'Grading and drainage correction',
        ],
        bulletsTitle: 'What we do',
      };
    case 'areas':
      return {
        title: `Service Area — ${where} | ${marketName}`,
        desc: `Where ${marketName} works across ${primaryRegion}. Commercial and residential asphalt paving, sealcoating and repair throughout the region.`,
        h1: `Where We Work`,
        lede: `${marketName} serves ${primaryRegion} and the surrounding metro.`,
        body: p.travelNote || p.climate,
        bullets: p.serviceAreas,
        bulletsTitle: 'Communities we serve',
      };
    case 'contact':
      return {
        title: `Contact ${marketName} | Free Estimate in ${where}`,
        desc: `Get a free asphalt paving estimate in ${where}. Tell us about the project and we will come look at it — no obligation, honest scope.`,
        h1: `Get a Free Estimate`,
        lede: `Tell us about the project. We will look at it and give you a straight number.`,
        body: p.travelNote || '',
        bullets: null,
      };
    default:
      return {
        title: `${marketName} | Asphalt Paving in ${where}`,
        desc: clampDescription(
          p.heroBody || `Commercial and residential asphalt paving in ${where}.`,
        ),
        h1: p.heroHeadline || `Asphalt Paving in ${where}`,
        lede: p.heroBody || '',
        body: p.climate,
        bullets: p.commercialFocus,
        bulletsTitle: 'Commercial work we run',
        // THE HOMEPAGE MUST SHOW THE WHOLE RANGE, NOT JUST THE COMMERCIAL END.
        //
        // Google's AI Overview read texaspavementgroup.com and told a Richmond
        // homeowner we "may not accept small, standard suburban driveway
        // overlays", then recommended two competitors by name. It was not
        // hallucinating. The homepage rendered commercialFocus and nothing
        // else, and the single residential line in that list is qualified —
        // "estate and acreage driveways WHERE THE RUN IS LONG ENOUGH". With no
        // other residential signal on the page, the only available inference is
        // a minimum job size.
        //
        // The residential list already existed, in the owner's own words, one
        // click away on /residential. An AI reading the homepage never saw it.
        // Showing it here is not a new claim — it is the same true claim, put
        // where it is actually read.
        secondaryBullets: p.residentialServices,
        secondaryBulletsTitle: 'Residential and driveway work',
      };
  }
}

function schema(p, route, canonical) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'GeneralContractor',
    name: p.marketName,
    url: canonical,
    telephone: `+1${String(p.phoneDisplay || FALLBACK_PHONE).replace(/\D/g, '')}`,
    areaServed: (p.serviceAreas || []).slice(0, 12).map((c) => ({ '@type': 'City', name: c })),
    address: {
      '@type': 'PostalAddress',
      addressLocality: p.primaryMetro || p.marketName,
      addressRegion: p.stateAbbr,
      addressCountry: 'US',
    },
    priceRange: '$$',
    parentOrganization: { '@type': 'Organization', name: 'J. Worden & Sons Asphalt Paving', url: HUB },
  };
  if (p.geo?.position) {
    const [lat, lon] = String(p.geo.position).split(';').map(Number);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      data.geo = { '@type': 'GeoCoordinates', latitude: lat, longitude: lon };
    }
  }
  return JSON.stringify(data);
}

// The brand stylesheet. Inlined into the six main pages (they are landing
// pages and one round-trip matters), and ALSO written to dist/brand.css —
// which the county and city pages link. That file was referenced by every
// county page and never actually written, so all 95 of them have been
// shipping unstyled.
const BRAND_CSS = `:root{--bg:#0f1114;--surface:#191c21;--surface2:#22262d;--line:#333941;--ink:#f4f6f8;--soft:#aeb5bf;--faint:#7e8691;--amber:#f2a71b;--amber2:#cf8a0c;--ink-on-amber:#17110250}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--ink);font:16px/1.65 'Segoe UI',system-ui,-apple-system,Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
.wrap{max-width:1080px;margin:0 auto;padding:0 20px}
header{position:sticky;top:0;z-index:20;background:rgba(15,17,20,.94);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
.bar{display:flex;align-items:center;justify-content:space-between;gap:16px;height:64px;flex-wrap:wrap}
.brand{font-weight:800;letter-spacing:-.01em}
.brand span{color:var(--amber)}
nav{display:flex;gap:16px;flex-wrap:wrap;font-size:.9rem;color:var(--soft)}
nav a:hover{color:var(--amber)}
.tel{font-weight:800;color:var(--amber);white-space:nowrap}
.hero{padding:72px 0 60px;border-bottom:5px solid var(--amber);background:linear-gradient(180deg,#14171b,#0f1114)}
.kicker{font-size:.72rem;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:var(--amber)}
h1{font-size:clamp(1.9rem,5vw,3rem);font-weight:800;line-height:1.08;letter-spacing:-.02em;margin:12px 0 14px;max-width:18ch}
.lede{color:var(--soft);font-size:1.1rem;max-width:56ch}
.cta{display:inline-block;margin-top:24px;background:var(--amber);color:#17110a;font-weight:800;padding:14px 26px;border-radius:6px;border:0;cursor:pointer;font-size:1rem}
.cta:hover{background:var(--amber2)}
.pad{padding:56px 0;border-bottom:1px solid var(--line)}
h2{font-size:clamp(1.4rem,3vw,1.9rem);font-weight:800;letter-spacing:-.01em;margin-bottom:10px}
.sub{color:var(--soft);margin-bottom:22px;max-width:60ch}
p.body{color:var(--soft);max-width:66ch}
ul.grid{list-style:none;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin-top:18px}
ul.grid li{background:var(--surface);border:1px solid var(--line);border-left:3px solid var(--amber);border-radius:8px;padding:14px 16px;color:var(--soft)}
.spec{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:20px 22px;margin-top:20px}
.spec h3{font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;color:var(--amber);margin-bottom:8px}
.spec p{color:var(--soft);font-size:.96rem}
.note{background:var(--surface2);border:1px solid var(--line);border-radius:10px;padding:18px 20px;margin-top:20px;color:var(--soft);font-size:.95rem}
.quote{background:linear-gradient(180deg,#14171b,#0f1114)}
form{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:26px;max-width:620px}
label{display:block;font-size:.78rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--faint);margin-bottom:12px}
input,textarea{width:100%;margin-top:6px;background:#12151a;border:1px solid var(--line);border-radius:7px;color:var(--ink);padding:11px 13px;font:inherit;font-size:1rem}
input:focus,textarea:focus{outline:2px solid var(--amber);outline-offset:1px;border-color:var(--amber)}
.row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(max-width:560px){.row{grid-template-columns:1fr}}
form button{width:100%;margin-top:10px;background:var(--amber);color:#17110a;font-weight:800;padding:15px;border:0;border-radius:7px;font-size:1.02rem;cursor:pointer}
#msg{margin-top:14px;font-weight:600}
#msg.ok{color:#7ed4a4}#msg.err{color:#f0a48f}
footer{padding:40px 0 30px;color:var(--faint);font-size:.9rem}
footer a{color:var(--amber)}
.hublink{margin-top:14px;color:var(--soft)}
ul.sites{list-style:none;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:18px}
ul.sites li{display:flex;align-items:baseline;justify-content:space-between;gap:12px;background:var(--surface);border:1px solid var(--line);border-left:3px solid var(--amber);border-radius:8px;padding:14px 16px}
ul.sites li strong{font-variant-numeric:tabular-nums;letter-spacing:.02em}
ul.sites li span{color:var(--amber);font-weight:800;font-variant-numeric:tabular-nums}
.shots{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;margin-top:18px}
.shots figure{background:var(--surface);border:1px solid var(--line);border-radius:8px;overflow:hidden}
.shots img{display:block;width:100%;height:auto}
.shots figcaption{padding:10px 14px;color:var(--faint);font-size:.85rem}`;

function page(p, route) {
  const c = copyFor(route.key, p);
  const canonical = canonicalUrl(p.domain, route.path);
  const tel = `tel:+1${String(p.phoneDisplay || FALLBACK_PHONE).replace(/\D/g, '')}`;
  const nav = ROUTES.filter((r) => r.path !== route.path)
    .map((r) => `<a href="${r.path}">${esc(({ home: 'Home', commercial: 'Commercial', residential: 'Residential', services: 'Services', areas: 'Service Areas', contact: 'Contact' })[r.key])}</a>`)
    .join('');

  const bulletBlock = (title, items) => (items?.length
    ? `<section class="pad"><div class="wrap"><h2>${esc(title)}</h2><ul class="grid">${
        items.map((b) => `<li>${esc(b)}</li>`).join('')
      }</ul></div></section>`
    : '');

  const bullets = bulletBlock(c.bulletsTitle, c.bullets)
    + bulletBlock(c.secondaryBulletsTitle, c.secondaryBullets);

  const form = route.key === 'contact' || route.key === 'home'
    ? `<section class="pad quote" id="quote"><div class="wrap">
    <h2>Request a Free Estimate</h2>
    <p class="sub">We will call you back — usually within one business hour.</p>
    <form id="lf" novalidate>
      <div class="row"><label>First Name<input name="firstName" autocomplete="given-name" required></label><label>Last Name<input name="lastName" autocomplete="family-name"></label></div>
      <div class="row"><label>Phone<input name="phone" type="tel" autocomplete="tel" required></label><label>Email<input name="email" type="email" autocomplete="email"></label></div>
      <label>Project Address<input name="serviceAddress" autocomplete="street-address" placeholder="Street, City, ${esc(p.stateAbbr)}"></label>
      <label>What do you need done?<textarea name="jobDescription" rows="3" placeholder="e.g. resurface a 40-space lot"></textarea></label>
      <button type="submit">Request My Free Estimate</button>
      <p id="msg" role="status"></p>
    </form></div></section>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(c.title)}</title>
<meta name="description" content="${esc(c.desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${esc(c.title)}">
<meta property="og:description" content="${esc(c.desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="website">
<meta name="geo.region" content="${esc(p.geo?.region || '')}">
<meta name="geo.placename" content="${esc(p.geo?.placename || '')}">
<script type="application/ld+json">${schema(p, route, canonical)}</script>
<style>
${BRAND_CSS}
</style>
</head>
<body>
<header><div class="wrap bar">
  <div class="brand">${esc(p.marketName)}</div>
  <nav>${nav}</nav>
  <a class="tel" href="${tel}">${esc(p.phoneDisplay || FALLBACK_PHONE)}</a>
</div></header>

<section class="hero"><div class="wrap">
  <div class="kicker">${esc(p.heroKicker || p.primaryRegion || '')}</div>
  <h1>${esc(c.h1)}</h1>
  <p class="lede">${esc(c.lede)}</p>
  <a class="cta" href="${route.key === 'contact' ? '#quote' : '/contact'}">${esc(p.ctaLabel || 'Get a Free Estimate')}</a>
</div></section>

<section class="pad"><div class="wrap">
  <h2>Built for ${esc(p.primaryRegion || p.marketName)}</h2>
  <p class="body">${esc(c.body || '')}</p>
  <div class="spec"><h3>Specification</h3><p>${esc(p.stateDot || '')}</p></div>
  ${p.travelNote ? `<div class="note">${esc(p.travelNote)}</div>` : ''}
</div></section>

${bullets}
${form}

<footer><div class="wrap">
  <div><strong>${esc(p.marketName)}</strong> — ${esc(p.basedIn || '')}</div>
  <div>Call <a href="${tel}">${esc(p.phoneDisplay || FALLBACK_PHONE)}</a></div>
  <div class="hublink">Part of the <a href="${HUB}">J. Worden &amp; Sons</a> network — 4th generation, since 1984.</div>
  <div style="margin-top:10px">&copy; ${new Date().getFullYear()} ${esc(p.marketName)} &mdash; a brand of J. Worden &amp; Sons Paving LLC. All rights reserved. Serving ${esc(p.primaryMetro || p.primaryRegion || '')} and surrounding areas.</div>
  <div style="margin-top:6px">Licensed &middot; Bonded &middot; Insured &middot; Virginia Contractor</div>
</div></footer>

<script>
(function(){
  var f=document.getElementById('lf'); if(!f) return;
  var m=document.getElementById('msg');
  f.addEventListener('submit',async function(e){
    e.preventDefault(); m.className=''; m.textContent='';
    var fd=new FormData(f), d={}; fd.forEach(function(v,k){d[k]=String(v).trim()});
    if(!d.firstName||!d.phone){m.className='err';m.textContent='Please add your name and a phone number so we can call you back.';return}
    var b=f.querySelector('button'); b.disabled=true; var t=b.textContent; b.textContent='Sending…';
    try{
      var r=await fetch('/api/v1/leads/website',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});
      if(!r.ok) throw new Error('bad');
      m.className='ok'; m.textContent='Thank you, '+d.firstName+' — we have your request and will call you shortly.'; f.reset();
    }catch(err){
      try{ localStorage.setItem('worden_lead_backup_'+Date.now(), JSON.stringify(d)); }catch(_){}
      m.className='err'; m.innerHTML='We could not send that just now. Please call <a href="${tel}">${esc(p.phoneDisplay || FALLBACK_PHONE)}</a> — your details were saved on this device.';
    }finally{ b.disabled=false; b.textContent=t; }
  });
})();
</script>
</body>
</html>
`;
}

// ── Load the brand profiles ───────────────────────────────────────────────────
// Texas city pages, and the photo slot that stays empty until real Texas
// photographs exist. Imported by URL like the profiles above, because this
// script runs outside the Vite graph.
const texasCityMod = await import(pathToFileURL(resolve(ROOT, 'src/data/texasCityPages.js')).href);
const texasPhotoMod = await import(pathToFileURL(resolve(ROOT, 'src/data/texasPhotos.js')).href);
const TEXAS_CITY_PAGES = texasCityMod.texasCityPages();
const carolinaMod = await import(
  pathToFileURL(resolve(ROOT, 'src/data/carolinaRegions.js')).href
);
const CAROLINA_REGIONS = carolinaMod.CAROLINA_REGIONS;
const carolinaProgram = await import(
  pathToFileURL(resolve(ROOT, 'src/data/carolinaProgram.js')).href
);
const texasPhotosFor = texasPhotoMod.photosForCity;

const profilesPath = resolve(ROOT, 'src/data/regionalMarketProfiles.js');
if (!existsSync(profilesPath)) {
  console.error('[brand-sites] regionalMarketProfiles.js not found — nothing to build.');
  process.exit(0);
}
const mod = await import(pathToFileURL(profilesPath).href);
const PROFILES = mod.REGIONAL_MARKET_PROFILES || {};

// Rule 1-4 in scripts/lib/brand-identity-policy.mjs. Enforced at build time
// rather than reviewed by eye, because the site factory will apply whatever
// this repo does to every SaaS client's site, unattended.
const { auditProfiles } = await import(
  pathToFileURL(resolve(ROOT, 'scripts/lib/brand-identity-policy.mjs')).href
);
const identityProblems = auditProfiles(PROFILES);
if (identityProblems.length) {
  console.error('[brand-sites] brand identity policy violations:');
  for (const p of identityProblems) {
    console.error(`  ${p.domain} — rule ${p.rule}: ${p.detail}`);
  }
  throw new Error(
    `${identityProblems.length} brand identity violation(s). See scripts/lib/brand-identity-policy.mjs.`,
  );
}
console.log(`[brand-sites] identity policy: ${Object.keys(PROFILES).length} brands clean`);

// ── Virginia county pages ────────────────────────────────────────────────────
// These exist as a client route, which was not enough: richmondasphaltpaving.com
// resolves to market-landing mode, so the raw HTML served for /virginia/* was
// the generic SPA shell — the Worden Standard OS page, byte-identical across all
// ninety-five URLs. Emitting real static HTML here means the county pages are
// the same kind of artifact as the rest of the brand build: their own document,
// their own self canonical, their own content.
//
// Virginia only. The counties are Virginia counties; putting them on the
// Georgia or Carolina brands would be inventing a service area.
const { PRIMARY_SERVICE, countySlug, countyPath, isIndexable, factCountiesFrom, allCountyRoutes } =
  await import(pathToFileURL(resolve(ROOT, 'scripts/lib/county-index-policy.mjs')).href);

const countyData = JSON.parse(
  readFileSync(resolve(ROOT, 'src/data/virginiaMarketPages.json'), 'utf8'),
);
const countyFactsPath = resolve(ROOT, 'src/data/virginiaCountyFacts.json');
const countyFacts = existsSync(countyFactsPath)
  ? JSON.parse(readFileSync(countyFactsPath, 'utf8'))
  : { counties: [] };
const FACTS_BY_COUNTY = new Map(
  (countyFacts.counties || []).filter((c) => c.complete).map((c) => [c.county, c]),
);
const FACT_COUNTIES = factCountiesFrom(countyFacts);



/** One county page: full document, self canonical, facts when we have them. */
function countyPage(p, r) {
  const countyName = /County$/.test(r.county) ? r.county : `${r.county} County`;
  const path = countyPath(r.county, r.service);
  const canonical = canonicalUrl(p.domain, path);
  const facts = FACTS_BY_COUNTY.get(r.county) || null;
  const specs = r.specs.map((k) => countyData.specifications[k]).filter(Boolean);

  const specBlock = specs.length
    ? `<section class="pad"><div class="wrap"><h2>Specifications</h2><ul class="grid">${
        specs.map((sp) => `<li><strong>${esc(sp.code)}</strong> — ${esc(sp.description)}<br><small>${esc(sp.source)}</small></li>`).join('')
      }</ul></div></section>`
    : '';

  const terrainBlock = facts?.terrain
    ? `<section class="pad"><div class="wrap"><h2>Conditions in ${esc(countyName)}</h2>
<p><strong>${facts.terrain.elevation_ft.toLocaleString()} ft above sea level.</strong> ${esc(facts.terrain.note)}</p>
<p><small>Elevation at county centroid — Google Elevation API.</small></p></div></section>`
    : '';

  const refBlock = facts?.road_references?.length
    ? `<section class="pad"><div class="wrap"><h2>Recent VDOT work in ${esc(countyName)}</h2>
<p>Published by the Virginia Department of Transportation. Linked rather than reproduced.</p>
<ul class="grid">${facts.road_references.map((ref) =>
  `<li><a href="${esc(ref.url)}" rel="nofollow noopener">${esc(ref.title)}</a></li>`).join('')}</ul></div></section>`
    : '';

  const jsonld = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': countyData.schemaType,
    name: `J. Worden & Sons — ${countyName}`,
    url: canonical,
    areaServed: { '@type': 'AdministrativeArea', name: `${countyName}, Virginia` },
    knowsAbout: specs.length ? specs.map((sp) => `${sp.code} — ${sp.description}`) : [r.label],
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(`${r.label} | ${countyName}, VA`)}</title>
<meta name="description" content="${esc(`${r.label} in ${countyName}, Virginia, in VDOT's ${r.district}. Request an estimate.`)}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="${isIndexable(r, FACT_COUNTIES) ? 'index, follow' : 'noindex, follow'}">
<script type="application/ld+json">${jsonld}</script>
<link rel="stylesheet" href="/brand.css">
</head>
<body>
<main>
<section class="pad"><div class="wrap">
<p class="eyebrow">VDOT ${esc(r.district)}</p>
<h1>${esc(`${r.label} in ${countyName}, Virginia`)}</h1>
<p>${esc(`${r.label} across ${countyName} — parking lots, drive lanes and truck entrances built to Virginia Department of Transportation specifications.`)}</p>
</div></section>
${terrainBlock}
${specBlock}
${refBlock}
<section class="pad"><div class="wrap"><a href="/contact">Request an estimate</a></div></section>
</main>
</body>
</html>`;
}


// ── Texas city pages ─────────────────────────────────────────────────────────
// One page per Texas city with invoiced work. See src/data/texasCityPages.js
// for why each one is differentiated by real facts rather than spun from a
// template with the place name swapped — nineteen near-identical pages are
// doorway pages, and they do not rank.

/**
 * The photo strip, or nothing at all.
 *
 * There are no Texas photographs in this repository yet — see
 * src/data/texasPhotos.js. When the array is empty this returns an empty
 * string and the section does not exist. It does NOT render a placeholder,
 * a stock image, or a Virginia photograph with a Texas caption.
 */
function texasGallery(city, photos) {
  if (!photos.length) return '';
  return `<section class="pad"><div class="wrap"><h2>On site in ${esc(city)}</h2>
<p class="sub">Finished work, photographed on the job.</p>
<div class="shots">${photos.map((ph) =>
  `<figure><img src="/texas/${esc(ph.file)}" alt="${esc(ph.alt)}" width="${ph.width}" height="${ph.height}" loading="lazy">`
  + `<figcaption>${esc(ph.city)}, store ${esc(ph.store)} &mdash; ${esc(ph.taken)}</figcaption></figure>`
).join('')}</div></div></section>`;
}

function texasCityPageHtml(p, cityPage, photos) {
  const canonical = canonicalUrl(p.domain, cityPage.path);
  const tel = `tel:+1${String(p.phoneDisplay || FALLBACK_PHONE).replace(/\D/g, '')}`;

  // The stores, by number and value. This is the page's whole reason to exist:
  // a reader can take a store number to the client and check it.
  const siteRows = cityPage.sites.map((s) =>
    `<li><strong>${esc(s.store)}</strong><span>${esc(usdShort(s.value))}</span></li>`).join('');

  const ground = [
    cityPage.subgrade ? `<div class="spec"><h3>The ground in ${esc(cityPage.region)}</h3><p>${esc(cityPage.subgrade)}</p></div>` : '',
    cityPage.climate ? `<div class="spec"><h3>What fails here</h3><p>${esc(cityPage.climate)}</p></div>` : '',
  ].join('');

  const jsonld = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `Commercial asphalt paving in ${cityPage.city}, Texas`,
    url: canonical,
    provider: {
      '@type': 'GeneralContractor',
      name: p.marketName,
      telephone: p.phoneDisplay,
      parentOrganization: { '@type': 'Organization', name: 'J. Worden & Sons Paving LLC' },
    },
    areaServed: { '@type': 'City', name: `${cityPage.city}, Texas` },
    serviceType: [
      'Commercial asphalt paving', 'Parking lot resurfacing', 'Sealcoating',
      'Line striping', 'Tar-and-chip surfacing',
    ],
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(cityPage.title)}</title>
<meta name="description" content="${esc(clampDescription(cityPage.description))}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${esc(cityPage.title)}">
<meta property="og:description" content="${esc(clampDescription(cityPage.description))}">
<meta property="og:url" content="${canonical}">
<meta name="geo.region" content="US-TX">
<meta name="geo.placename" content="${esc(cityPage.city)}, Texas">
<script type="application/ld+json">${jsonld}</script>
<link rel="stylesheet" href="/brand.css">
</head>
<body>
<header><div class="wrap bar">
  <a class="brand" href="/">Texas <span>Pavement Group</span></a>
  <nav><a href="/">Home</a><a href="/commercial">Commercial</a><a href="/residential">Residential</a><a href="/services">Services</a><a href="/service-areas">Service Areas</a><a href="/contact">Contact</a></nav>
  <a class="tel" href="${tel}">${esc(p.phoneDisplay || FALLBACK_PHONE)}</a>
</div></header>

<section class="hero"><div class="wrap">
  <p class="kicker">${esc(cityPage.region || 'Texas')}</p>
  <h1>Asphalt Paving in ${esc(cityPage.city)}, Texas</h1>
  <p class="lede">${esc(cityPage.summary)}</p>
  <a class="cta" href="/contact">Request a ${esc(cityPage.city)} Estimate</a>
</div></section>

<section class="pad"><div class="wrap">
  <h2>What we invoiced in ${esc(cityPage.city)}</h2>
  <p class="sub">Store numbers and job values as invoiced. Nothing here is an estimate or a projection.</p>
  <ul class="sites">${siteRows}</ul>
  <p class="body">${esc(
    cityPage.siteCount > 1
      ? `${cityPage.siteCount} sites, ${cityPage.valueLabel} invoiced in ${cityPage.city} alone. The programme ran to 23 sites across 19 Texas cities on one contract, with one point of contact and one invoice per location.`
      : `${cityPage.valueLabel} invoiced in ${cityPage.city}, as part of a 23-site Texas programme across 19 cities — one contract, one point of contact, one invoice per location.`
  )}</p>
</div></section>

${ground ? `<section class="pad"><div class="wrap"><h2>Building for ${esc(cityPage.city)} conditions</h2>${ground}</div></section>` : ''}

${texasGallery(cityPage.city, photos)}

<section class="pad"><div class="wrap">
  <h2>Specification</h2>
  <ul class="grid">${(p.localSpecs || []).map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
</div></section>

<section class="pad"><div class="wrap">
  <h2>What we do in ${esc(cityPage.city)}</h2>
  <ul class="grid">${(p.services || []).map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
  <p style="margin-top:22px"><a class="cta" href="/contact">Call for a ${esc(cityPage.city)} estimate</a></p>
</div></section>

<footer><div class="wrap">
  <div><strong>${esc(p.marketName)}</strong> — ${esc(p.basedIn || '')}</div>
  <div>Call <a href="${tel}">${esc(p.phoneDisplay || FALLBACK_PHONE)}</a></div>
  <div class="hublink">Part of the <a href="${HUB}">J. Worden &amp; Sons</a> network — 4th generation, since 1984.</div>
  <div style="margin-top:10px">&copy; ${new Date().getFullYear()} ${esc(p.marketName)} &mdash; a brand of J. Worden &amp; Sons Paving LLC.</div>
</div></footer>
</body>
</html>`;
}

const usdShort = (v) => `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;



// ── Carolina state pages ─────────────────────────────────────────────────────
// carolinablacktop.com covers both Carolinas. The site was written entirely for
// the Piedmont while the brand's phone number is 843 — Charleston, Myrtle
// Beach, Hilton Head. A South Carolina customer was being told about a
// different state.
//
// These pages carry SERVICE-AREA and GROUND-CONDITION content only. No job
// counts, no dollar figures, no project list — see src/data/carolinaRegions.js
// for why that line is drawn where it is.

function carolinaRegionPage(p, region) {
  const path = `/${region.slug}`;
  const canonical = canonicalUrl(p.domain, path);
  const tel = `tel:+1${String(p.phoneDisplay || FALLBACK_PHONE).replace(/\D/g, '')}`;
  const title = `${region.headline} | ${p.marketName}`;
  const desc = clampDescription(
    `${region.lede} ${region.dot.split(' ')[0]} specifications, 96% Marshall compaction floor.`,
  );

  const services = region.services?.length ? region.services : (p.services || []);

  const jsonld = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `Asphalt paving in ${region.name}`,
    url: canonical,
    provider: {
      '@type': 'GeneralContractor',
      name: p.marketName,
      telephone: `+1${String(p.phoneDisplay || FALLBACK_PHONE).replace(/\D/g, '')}`,
      parentOrganization: { '@type': 'Organization', name: 'J. Worden & Sons Paving LLC' },
    },
    areaServed: region.cities.map((c) => ({ '@type': 'City', name: `${c}, ${region.state}` })),
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta name="geo.region" content="US-${esc(region.state)}">
<meta name="geo.placename" content="${esc(region.metro)}, ${esc(region.name)}">
<script type="application/ld+json">${jsonld}</script>
<link rel="stylesheet" href="/brand.css">
</head>
<body>
<header><div class="wrap bar">
  <a class="brand" href="/">Carolina <span>Blacktop</span></a>
  <nav><a href="/">Home</a><a href="/north-carolina">North Carolina</a><a href="/south-carolina">South Carolina</a><a href="/commercial">Commercial</a><a href="/residential">Residential</a><a href="/contact">Contact</a></nav>
  <a class="tel" href="${tel}">${esc(p.phoneDisplay || FALLBACK_PHONE)}</a>
</div></header>

<section class="hero"><div class="wrap">
  <p class="kicker">${esc(region.name)}</p>
  <h1>${esc(region.headline)}</h1>
  <p class="lede">${esc(region.lede)}</p>
  <a class="cta" href="/contact">Request a ${esc(region.name)} Estimate</a>
</div></section>

<section class="pad"><div class="wrap">
  <h2>The ground in ${esc(region.name)}</h2>
  <p class="body">${esc(region.subgrade)}</p>
  <div class="spec"><h3>What fails here</h3><p>${esc(region.climate)}</p></div>
  <div class="spec"><h3>Specification</h3><p>${esc(region.dot)} &mdash; over a base built to drain, with a 96% Marshall Unit Weight minimum compaction floor.</p></div>
</div></section>

${region.hasQsrProof ? `<section class="pad"><div class="wrap">
  <h2>Restaurant sites we finished in ${esc(region.name)}</h2>
  <p class="sub">Store numbers and addresses as they were photographed and sent to the client on completion. Checkable.</p>
  <ul class="sites">${carolinaProgram.publishableNcSites().map((site) =>
    `<li><strong>${esc(site.store)}</strong><span>${esc(site.address ? `${site.address}, ${site.city}` : site.city)}</span></li>`
  ).join('')}</ul>
  <p class="body">${esc(
    `Run for ${carolinaProgram.NC_CLIENT}, one of the largest ${carolinaProgram.NC_BRAND} franchise operators in the United States.`
  )}</p>
</div></section>` : ''}

<section class="pad"><div class="wrap">
  <h2>What we do in ${esc(region.name)}</h2>
  <ul class="grid">${services.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
</div></section>

<section class="pad"><div class="wrap">
  <h2>Where we work</h2>
  <ul class="grid">${region.cities.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
  <p style="margin-top:22px"><a class="cta" href="/contact">Call for a ${esc(region.metro)} estimate</a></p>
</div></section>

<footer><div class="wrap">
  <div><strong>${esc(p.marketName)}</strong> &mdash; serving ${esc(region.name)}</div>
  <div>Call <a href="${tel}">${esc(p.phoneDisplay || FALLBACK_PHONE)}</a></div>
  <div class="hublink">Part of the <a href="${HUB}">J. Worden &amp; Sons</a> network — 4th generation, since 1984.</div>
  <div style="margin-top:10px">&copy; ${new Date().getFullYear()} ${esc(p.marketName)} &mdash; a brand of J. Worden &amp; Sons Paving LLC.</div>
</div></footer>
</body>
</html>`;
}

let pagesWritten = 0;
const manifest = [];

for (const [domain, raw] of Object.entries(PROFILES)) {
  const stateAbbr = stateFromPlacename(raw.geo?.placename) || '';
  if (!stateAbbr) console.warn(`[brand-sites] ${domain}: could not resolve a state code from geo.placename`);

  const p = {
    ...raw,
    domain,
    stateAbbr,
    stateDotShort: (raw.stateDot || '').split(' ')[0] || 'state DOT',
    marketName: raw.marketName || domain,
  };

  for (const route of ROUTES) {
    const dir = resolve(DIST, 'brands', domain, route.path === '/' ? '' : route.path.slice(1));
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, 'index.html'), page(p, route), 'utf8');
    pagesWritten += 1;
  }
  // The stylesheet the county and city pages link. Written per brand so each
  // domain serves its own copy at /brand.css.
  writeFileSync(resolve(DIST, 'brands', domain, 'brand.css'), BRAND_CSS, 'utf8');

  // Carolina state pages belong only on the Carolina brand.
  let carolinaCount = 0;
  if (domain === 'carolinablacktop.com') {
    for (const region of CAROLINA_REGIONS) {
      const dir = resolve(DIST, 'brands', domain, region.slug);
      mkdirSync(dir, { recursive: true });
      writeFileSync(resolve(dir, 'index.html'), carolinaRegionPage(p, region), 'utf8');
      carolinaCount += 1;
      pagesWritten += 1;
    }
  }

  // Texas city pages belong only on the Texas brand.
  let cityCount = 0;
  if (domain === 'texaspavementgroup.com') {
    for (const cityPage of TEXAS_CITY_PAGES) {
      const dir = resolve(DIST, 'brands', domain, cityPage.path.slice(1));
      mkdirSync(dir, { recursive: true });
      const photos = texasPhotosFor(cityPage.city);
      writeFileSync(resolve(dir, 'index.html'), texasCityPageHtml(p, cityPage, photos), 'utf8');
      cityCount += 1;
      pagesWritten += 1;
    }
  }

  // Virginia counties belong only on the Virginia brand.
  let countyCount = 0;
  if (stateAbbr === 'VA') {
    for (const r of allCountyRoutes(countyData)) {
      const path = countyPath(r.county, r.service);
      const dir = resolve(DIST, 'brands', domain, path.slice(1));
      mkdirSync(dir, { recursive: true });
      writeFileSync(resolve(dir, 'index.html'), countyPage(p, r), 'utf8');
      countyCount += 1;
      pagesWritten += 1;
    }
  }

  manifest.push({
    domain,
    routes: ROUTES.map((r) => r.path),
    stateAbbr,
    countyPages: countyCount,
    cityPages: cityCount,
    carolinaPages: carolinaCount,
    // The Texas city URLs the sitemap may advertise. Every one is backed by an
    // invoiced job, so all of them are indexable — unlike the county pages,
    // where only those with real facts attached are.
    texasCityPaths: cityCount ? TEXAS_CITY_PAGES.map((c) => c.path) : [],
    // Exactly the county URLs the sitemap may advertise. Written here rather
    // than recomputed there so the two can never disagree — a page advertised
    // while noindexed is a contradiction Google reports as an error.
    indexableCountyPaths: stateAbbr === 'VA'
      ? allCountyRoutes(countyData).filter((r) => isIndexable(r, FACT_COUNTIES))
          .map((r) => countyPath(r.county, r.service))
      : [],
  });
  console.log(
    `[brand-sites] ${domain} (${stateAbbr}) — ${ROUTES.length} pages` +
    (countyCount ? ` + ${countyCount} county pages` : '') +
    (cityCount ? ` + ${cityCount} Texas city pages` : '') +
    (carolinaCount ? ` + ${carolinaCount} Carolina state pages` : ''),
  );
}

writeFileSync(resolve(DIST, 'brands', 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
console.log(`[brand-sites] wrote ${pagesWritten} pages across ${manifest.length} brands.`);
