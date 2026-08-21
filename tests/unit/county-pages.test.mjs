/**
 * The frontend county-page generator must agree with the backend, exactly.
 *
 * Both read src/data/virginiaMarketPages.json, so the data cannot drift — but
 * the generation logic exists twice, once in Python and once in JS, because
 * the pages must render without a live API call. That duplication is the risk
 * this file exists to hold down.
 *
 * The fixture is written by the Python (app/services/market_pages.py) for all
 * 475 pages. If either side changes how a title, a URL or a schema block is
 * built, this fails and names the field.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import {
  DISTRICTS, SERVICES, SCHEMA_TYPE, VIRGINIA_COUNTY_COUNT,
  allCounties, countyFromSlug, districtFor, generatePage, planPages, slug,
} from '../../src/lib/countyPages.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const expected = JSON.parse(
  readFileSync(resolve(__dirname, '../fixtures/county-pages.expected.json'), 'utf8'),
);

const OPTS = {
  domain: 'www.jwordenasphaltpaving.com',
  businessName: 'J. Worden & Sons',
  telephone: '+1-804-577-4200',
};

test('the roster is nine districts and ninety-five counties', () => {
  assert.equal(DISTRICTS.length, 9);
  assert.equal(allCounties().length, VIRGINIA_COUNTY_COUNT);
  assert.equal(new Set(allCounties().map((c) => c.county)).size, 95,
    'a county appears in two districts');
});

test('every page matches what the backend generates', () => {
  const actual = planPages(OPTS);
  assert.equal(actual.length, expected.length,
    `frontend produced ${actual.length} pages, backend ${expected.length}`);

  for (let i = 0; i < expected.length; i += 1) {
    const want = expected[i];
    const got = actual[i];
    for (const key of ['url', 'path', 'county', 'district', 'service',
                       'service_label', 'h1', 'meta_title', 'meta_description']) {
      assert.equal(got[key], want[key],
        `${want.path} — ${key} differs between frontend and backend`);
    }
    assert.deepEqual(got.specifications, want.specifications, `${want.path} — specifications`);
    assert.deepEqual(got.schema_jsonld, want.schema_jsonld, `${want.path} — JSON-LD`);
  }
});

test('the schema type is one schema.org actually defines', () => {
  // "PavingContractor" is not a schema.org type; markup using it is discarded.
  const valid = new Set(['Electrician', 'GeneralContractor', 'HVACBusiness',
    'HousePainter', 'Locksmith', 'MovingCompany', 'Plumber', 'RoofingContractor',
    'HomeAndConstructionBusiness']);
  assert.ok(valid.has(SCHEMA_TYPE), `${SCHEMA_TYPE} is not a schema.org type`);
});

test('no page carries a search metric', () => {
  const blob = JSON.stringify(generatePage({ ...OPTS, county: 'Augusta',
    service: 'commercial-asphalt-paving' })).toLowerCase();
  for (const token of ['volume', 'cpc', 'difficulty', 'traffic', 'monthly_searches']) {
    assert.ok(!blob.includes(token), `page output mentions ${token}`);
  }
});

test('a slug round-trips back to its county', () => {
  for (const { county } of allCounties()) {
    assert.equal(countyFromSlug(`${slug(county)}-county`), county);
  }
});

test('an unknown slug resolves to nothing rather than a guess', () => {
  assert.equal(countyFromSlug('atlantis-county'), null);
});

test('an independent city is refused, not filed under a neighbour', () => {
  assert.equal(districtFor('Virginia Beach'), null);
  assert.throws(
    () => generatePage({ ...OPTS, county: 'Virginia Beach', service: 'sealcoating' }),
    /Independent cities/,
  );
});

test('Richmond the county resolves to Fredericksburg, not the city', () => {
  assert.equal(districtFor('Richmond').key, 'fredericksburg');
});

test('an unknown service throws', () => {
  assert.throws(
    () => generatePage({ ...OPTS, county: 'Augusta', service: 'hovercraft-repair' }),
    /unknown service/,
  );
});

test('meta stays inside display limits on every page', () => {
  for (const page of planPages(OPTS)) {
    assert.ok(page.meta_title.length <= 60, `${page.path}: title ${page.meta_title.length}`);
    assert.ok(page.meta_description.length <= 155,
      `${page.path}: description ${page.meta_description.length}`);
    assert.ok(page.meta_description.endsWith('.'), `${page.path}: description cut mid-word`);
  }
});

test('every service is reachable', () => {
  assert.ok(Object.keys(SERVICES).length > 0);
  const paths = new Set(planPages(OPTS).map((p) => p.path));
  assert.equal(paths.size, 95 * Object.keys(SERVICES).length, 'duplicate URLs');
});
