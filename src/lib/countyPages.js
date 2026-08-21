/**
 * countyPages.js — Virginia county service pages, generated from shared data.
 *
 * The roster, the specification table and the service list all come from
 * src/data/virginiaMarketPages.json, which app/services/va_market_geo.py and
 * app/services/market_pages.py read too. One file, both sides. Two copies of
 * a 95-county roster drift, and the drift is silent in the worst way: a county
 * on one side and not the other yields a URL the sitemap advertises and the
 * router 404s, or a page nothing links to.
 *
 * The output shape here matches market_pages.generate_page exactly, and
 * tests/unit/county-pages.test.mjs compares this against a fixture generated
 * by the Python. If the two ever disagree, that test fails.
 *
 * No search volume, CPC or traffic estimate appears anywhere, and there is no
 * field to hold one. Nothing measures them.
 */

// Import attribute so this module loads identically under Vite and under
// plain `node --test`, which is what lets the unit test exercise the real
// module rather than a copy of it.
import data from '../data/virginiaMarketPages.json' with { type: 'json' };

export const SCHEMA_TYPE = data.schemaType;
export const DISTRICTS = data.districts;
export const SPECIFICATIONS = data.specifications;
export const SERVICES = data.services;
export const VIRGINIA_COUNTY_COUNT = data.virginiaCountyCount;

export function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function allCounties() {
  const out = [];
  for (const d of DISTRICTS) {
    for (const county of d.counties) out.push({ county, district: d });
  }
  return out;
}

export function districtFor(county) {
  const target = String(county).trim().replace(/\s+County$/i, '').trim().toLowerCase();
  for (const d of DISTRICTS) {
    for (const name of d.counties) {
      if (name.toLowerCase() === target) return d;
    }
  }
  return null;
}

/** County slug -> the county name as it appears in the roster. */
export function countyFromSlug(countySlug) {
  const bare = String(countySlug).replace(/-county$/i, '');
  for (const { county } of allCounties()) {
    if (slug(county) === bare) return county;
  }
  return null;
}

/** Trim on a word boundary — a meta description cut mid-word reads broken. */
function truncate(text, limit) {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit).replace(/\s+\S*$/, '');
  return cut.replace(/[.,;: ]+$/, '') + '.';
}

export function generatePage({ domain, county, service, businessName, telephone = null }) {
  const entry = SERVICES[service];
  if (!entry) throw new Error(`unknown service ${service}`);

  const district = districtFor(county);
  if (!district) {
    throw new Error(
      `${county} is not one of Virginia's 95 counties. Independent cities are ` +
      'not counties and need their own pages.',
    );
  }

  const specs = entry.specs.map((k) => SPECIFICATIONS[k]);
  const countyName = /County$/.test(county) ? county : `${county} County`;
  const path = `/virginia/${slug(county)}-county/${service}`;
  const url = `https://${String(domain).replace(/\/+$/, '')}${path}`;

  const specSentence = specs.length
    ? ` Built to ${specs.map((s) => s.code).join(', ')}.`
    : '';

  const metaDescription = truncate(
    `${entry.label} in ${countyName}, Virginia, in VDOT's ${district.name}.` +
    `${specSentence} Request an estimate.`,
    155,
  );

  const schema = {
    '@context': 'https://schema.org',
    '@type': SCHEMA_TYPE,
    name: `${businessName} — ${countyName}`,
    url,
    areaServed: { '@type': 'AdministrativeArea', name: `${countyName}, Virginia` },
    knowsAbout: specs.length
      ? specs.map((s) => `${s.code} — ${s.description}`)
      : [entry.label],
  };
  if (telephone) schema.telephone = telephone;

  return {
    url,
    path,
    county: countyName,
    district: district.name,
    service,
    service_label: entry.label,
    h1: `${entry.label} in ${countyName}, Virginia`,
    meta_title: truncate(`${entry.label} | ${countyName}, VA`, 60),
    meta_description: metaDescription,
    specifications: specs.map((s) => ({
      code: s.code, description: s.description, source: s.source,
    })),
    schema_jsonld: schema,
  };
}

/** Every page the full build would produce. Count only — nothing projected. */
export function planPages({ domain, businessName, telephone = null }) {
  const pages = [];
  for (const { county } of allCounties()) {
    for (const service of Object.keys(SERVICES)) {
      pages.push(generatePage({ domain, county, service, businessName, telephone }));
    }
  }
  return pages;
}
