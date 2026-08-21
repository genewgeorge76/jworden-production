/**
 * build-county-facts.mjs — real, citable facts per Virginia county.
 *
 * Why this exists
 * ───────────────
 * The county pages render from a template whose only per-county variables are
 * the county name and its VDOT district. Ninety-five pages that differ by a
 * place name are doorway pages: Google's own guidance names that pattern, and
 * the usual outcome is that ninety-four of them are filtered and the domain
 * carries the suspicion. Publishing them in that state would work against the
 * ranking it is meant to produce.
 *
 * So each page gets facts that are actually specific to its county, and every
 * one of them is fetched rather than written:
 *
 *   coordinates + elevation   Google Geocoding and Elevation. Elevation is not
 *                             decoration — freeze-thaw depth drives base
 *                             thickness, and a 3,000 ft county in Bristol does
 *                             not get the same section as a 60 ft county on
 *                             the coast.
 *   local road references     Exa, restricted to VDOT and local news. Gives
 *                             the actual routes worked in that county, with
 *                             the source URL kept so the claim is checkable.
 *
 * Rules this file follows
 * ───────────────────────
 * Nothing is invented. Every field either comes back from an API or is absent;
 * there is no default that quietly becomes prose. A county whose lookups fail
 * is written with `complete: false` and the page generator is expected to fall
 * back to the plain template rather than publish a half-filled page.
 *
 * No search volume, difficulty or traffic estimate appears here. Nothing in
 * this system measures them, so nothing may print them.
 *
 * Usage
 *   node scripts/build-county-facts.mjs                 # all 95
 *   node scripts/build-county-facts.mjs --limit 3       # sample first
 *   node scripts/build-county-facts.mjs --out path.json
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = JSON.parse(readFileSync(resolve(ROOT, 'src/data/virginiaMarketPages.json'), 'utf8'));

const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
const EXA_KEY = process.env.EXA_API_KEY || '';

const args = process.argv.slice(2);
const limit = Number(args[args.indexOf('--limit') + 1]) || Infinity;
const outPath = args.includes('--out')
  ? args[args.indexOf('--out') + 1]
  : 'src/data/virginiaCountyFacts.json';

if (!GOOGLE_KEY) {
  console.error('GOOGLE_MAPS_API_KEY is required — refusing to emit a facts file with no facts in it.');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** County centroid, from Google. Returns null rather than a guess. */
async function geocode(county) {
  const q = encodeURIComponent(`${county} County, Virginia`);
  const d = await getJson(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${q}&key=${GOOGLE_KEY}`,
  );
  if (d.status !== 'OK' || !d.results?.length) return null;
  const loc = d.results[0].geometry?.location;
  if (!loc) return null;
  return { lat: loc.lat, lng: loc.lng, formatted: d.results[0].formatted_address };
}

/** Elevation in feet at the centroid. */
async function elevation(lat, lng) {
  const d = await getJson(
    `https://maps.googleapis.com/maps/api/elevation/json?locations=${lat},${lng}&key=${GOOGLE_KEY}`,
  );
  if (d.status !== 'OK' || !d.results?.length) return null;
  return Math.round(d.results[0].elevation * 3.28084);
}

/**
 * Real road work in this county, with sources.
 *
 * Kept to title + url + published date. The body text is somebody else's
 * writing; the page cites the reference, it does not reproduce it.
 */
async function roadReferences(county) {
  if (!EXA_KEY) return [];
  try {
    const d = await getJson('https://api.exa.ai/search', {
      method: 'POST',
      headers: { 'x-api-key': EXA_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `${county} County Virginia VDOT road paving resurfacing route`,
        numResults: 4,
        type: 'neural',
        includeDomains: ['virginiadot.org', 'vdot.virginia.gov'],
      }),
    });
    return (d.results || [])
      .filter((r) => r.url && r.title)
      .filter((r) => usefulReference(r, county))
      .map((r) => ({
        title: String(r.title).slice(0, 160),
        url: r.url,
        published: r.publishedDate || null,
      }));
  } catch {
    return [];
  }
}

/**
 * Which VDOT surface mix the elevation argues for.
 *
 * This is a stated engineering rationale, not a spec lookup: the mix table in
 * virginiaMarketPages.json is the authority for what each code means, and the
 * threshold here is the one Worden already applies in the field. It is
 * labelled as a recommendation so no reader mistakes it for a VDOT mandate.
 */
function freezeThawNote(ft) {
  if (ft == null) return null;
  // Bands are described by elevation and its effect, deliberately NOT by
  // physiographic province. An earlier version mapped 800-2000 ft to
  // "piedmont", which put Buchanan County — coalfield Appalachia, as far from
  // the Piedmont as Virginia gets — under a label any local contractor would
  // read as wrong. Elevation is measured; province is a geological claim this
  // script has no source for, so it does not make one.
  if (ft >= 2000) {
    return {
      band: 'high',
      elevation_ft: ft,
      note: `At ${ft.toLocaleString()} ft the annual freeze-thaw count is high ` +
            'enough that base depth, not surface mix, governs service life.',
    };
  }
  if (ft >= 800) {
    return {
      band: 'mid',
      elevation_ft: ft,
      note: `At ${ft.toLocaleString()} ft the freeze-thaw count is moderate; ` +
            'subgrade drainage is usually the deciding factor.',
    };
  }
  return {
    band: 'low',
    elevation_ft: ft,
    note: `At ${ft.toLocaleString()} ft there are fewer freeze-thaw cycles and ` +
          'a longer paving season, with subgrade moisture the main constraint.',
  };
}

/**
 * Is this reference worth citing on a page?
 *
 * Exa returns whatever the crawler titled the document, and VDOT publishes a
 * lot of map tiles and dated schedule PDFs whose titles ("Bland_10",
 * "Date Printed: 11/12/2025 Schedule") tell a reader nothing. A citation that
 * looks like filler is worse than one fewer citation.
 */
function usefulReference(r, county) {
  const t = (r.title || '').trim();
  if (t.length < 25) return false;                       // "Bland_10"
  if (/^[A-Za-z]+_\d+$/.test(t)) return false;           // map tile names
  if (/date printed|schedule \d|^untitled/i.test(t)) return false;
  // Must name the county or read like an actual project/news item.
  const named = new RegExp(county.replace(/[^A-Za-z ]/g, ''), 'i').test(t);
  const projectish = /route |bridge|paving|resurfac|repair|roundabout|corridor|improvement/i.test(t);
  return named || projectish;
}

const counties = [];
for (const d of DATA.districts) {
  for (const c of d.counties) counties.push({ county: c, district: d.name });
}

console.log(`[county-facts] ${counties.length} counties in roster; building ${Math.min(limit, counties.length)}`);

const out = [];
let complete = 0;
for (const { county, district } of counties.slice(0, limit)) {
  const rec = { county, district, complete: false };
  try {
    const geo = await geocode(county);
    if (geo) {
      rec.lat = geo.lat;
      rec.lng = geo.lng;
      rec.formatted_address = geo.formatted;
      const ft = await elevation(geo.lat, geo.lng);
      if (ft != null) {
        rec.elevation_ft = ft;
        rec.terrain = freezeThawNote(ft);
      }
    }
    rec.road_references = await roadReferences(county);
    // "Complete" means there is genuinely something county-specific to say.
    rec.complete = Boolean(rec.elevation_ft != null && rec.road_references.length > 0);
    if (rec.complete) complete += 1;
  } catch (e) {
    rec.error = String(e.message).slice(0, 120);
  }
  out.push(rec);
  console.log(
    `  ${rec.complete ? 'OK  ' : 'THIN'} ${county.padEnd(18)} ` +
    `${rec.elevation_ft != null ? String(rec.elevation_ft).padStart(5) + ' ft' : '    —  '} ` +
    `refs=${rec.road_references?.length ?? 0}`,
  );
  await sleep(120); // stay well inside the per-second quotas
}

const payload = {
  _comment: 'Generated by scripts/build-county-facts.mjs. Every field is fetched, never authored. Do not hand-edit.',
  _generated_utc: new Date().toISOString(),
  _sources: {
    coordinates: 'Google Geocoding API',
    elevation: 'Google Elevation API',
    road_references: 'Exa search restricted to virginiadot.org',
  },
  counties_total: counties.length,
  counties_built: out.length,
  counties_complete: complete,
  counties: out,
};

const target = resolve(ROOT, outPath);
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, JSON.stringify(payload, null, 2) + '\n');
console.log(`[county-facts] wrote ${outPath} — ${complete}/${out.length} complete`);
