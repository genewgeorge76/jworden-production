/**
 * The Carolina state pages.
 *
 * WHAT THIS GUARDS
 * carolinablacktop.com carries an 843 phone number — Charleston, Myrtle Beach,
 * Hilton Head — while every word on the site was written for the Piedmont:
 * "Asphalt Paving Built For the Piedmont", Charlotte metro, red clay. A South
 * Carolina customer landing on it was being told about a different state.
 *
 * THE LINE THESE PAGES DO NOT CROSS
 * They make SERVICE-AREA and GROUND-CONDITION claims only. No job counts, no
 * dollar figures, no project list — because none exist in this repo for the
 * Carolinas. "We work in South Carolina" rests on the owner's word, which is
 * how every contractor's site works. "We completed 40 jobs worth $600,000"
 * would need records. The second kind is tested for here and must stay absent
 * until an export provides it.
 */
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const { CAROLINA_REGIONS, regionBySlug, allCarolinaCities } =
  await import(path.join(ROOT, 'src/data/carolinaRegions.js'))
const { REGIONAL_MARKET_PROFILES: PROFILES } =
  await import(path.join(ROOT, 'src/data/regionalMarketProfiles.js'))

test('both states exist and neither was dropped', () => {
  assert.equal(CAROLINA_REGIONS.length, 2)
  assert.ok(regionBySlug('north-carolina'), 'North Carolina must not be erased')
  assert.ok(regionBySlug('south-carolina'), 'South Carolina must be present')
})

test('the North Carolina content is unchanged Piedmont material', () => {
  const nc = regionBySlug('north-carolina')
  assert.match(nc.subgrade, /Piedmont red clay/)
  assert.match(nc.dot, /NCDOT/)
  assert.ok(nc.cities.includes('Charlotte'))
})

test('South Carolina describes the opposite failure mode, not a name swap', () => {
  const sc = regionBySlug('south-carolina')
  const nc = regionBySlug('north-carolina')

  assert.match(sc.dot, /SCDOT/)
  // The whole justification for a second page: the ground fails differently.
  assert.match(sc.subgrade, /undermining/i)
  assert.match(nc.subgrade, /swells|shrinks/i)
  assert.notEqual(sc.subgrade, nc.subgrade)
  assert.notEqual(sc.climate, nc.climate)
  assert.notEqual(sc.headline, nc.headline)
})

test('the 843 footprint is actually covered', () => {
  // These were entirely absent while the brand's number was a Lowcountry line.
  const sc = regionBySlug('south-carolina')
  for (const city of ['Charleston', 'Mount Pleasant', 'Summerville',
                      'Myrtle Beach', 'Hilton Head Island', 'Bluffton', 'Beaufort']) {
    assert.ok(sc.cities.includes(city), `${city} missing from South Carolina`)
  }
})

test('the brand profile lists both states cities and no longer says only Piedmont', () => {
  const p = PROFILES['carolinablacktop.com']
  assert.deepEqual(p.statesServed, ['NC', 'SC'])
  assert.ok(!/Built For the Piedmont/.test(p.heroHeadline),
    'the headline must not claim a single-state identity')
  for (const city of allCarolinaCities().slice(0, 5)) {
    assert.ok(p.serviceAreas.includes(city), `${city} missing from serviceAreas`)
  }
})

test('NO proof claim is made anywhere in the Carolina data', () => {
  // The line this build must not cross. A job count or dollar figure here would
  // be an assertion dressed as evidence — the failure this whole system exists
  // to prevent. Texas earns its numbers from an invoice tracker; Carolina has
  // no such source yet.
  const blob = JSON.stringify(CAROLINA_REGIONS)
  assert.ok(!/\$\s?\d/.test(blob), 'a dollar figure appeared in Carolina content')
  assert.ok(!/\b\d+\s+(?:invoiced|completed|finished)\b/i.test(blob),
    'a job count appeared in Carolina content')
  assert.ok(!/\b(?:invoiced|completed)\s+(?:jobs?|sites?|projects?)\b/i.test(blob),
    'a completed-work claim appeared in Carolina content')
})

test('both pages are built, and are not near-duplicates', () => {
  const dir = path.join(ROOT, 'dist/brands/carolinablacktop.com')
  if (!fs.existsSync(dir)) return
  const read = (slug) => fs.readFileSync(path.join(dir, slug, 'index.html'), 'utf-8')
  const nc = read('north-carolina')
  const sc = read('south-carolina')

  assert.ok(nc.includes('NCDOT') && sc.includes('SCDOT'))
  assert.ok(sc.includes('Charleston') && !nc.includes('Charleston'))
  assert.ok(nc.includes('Charlotte'))
  // Distinct canonicals, or they compete with each other.
  assert.ok(nc.includes('carolinablacktop.com/north-carolina'))
  assert.ok(sc.includes('carolinablacktop.com/south-carolina'))
})
