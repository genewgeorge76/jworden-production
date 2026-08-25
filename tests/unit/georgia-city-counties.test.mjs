import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

import { sourceWithoutComments } from '../helpers/source.mjs'

const DATA = JSON.parse(readFileSync('src/data/georgiaCityCounties.json', 'utf8'))
const { georgiaCityPages } = await import('../../src/data/georgiaCityPages.js')

/**
 * WHAT THIS FILE IS FOR
 * ─────────────────────
 * Clarkston spent an unknown length of time published under "South Metro
 * Atlanta — Clayton, south Fulton and Fayette", with a paragraph about the
 * Hartsfield freight economy underneath it. Clarkston is in DeKalb County,
 * twenty-five miles away on the other side of the city.
 *
 * Nothing caught it, because nothing was checking. The sector groupings were
 * written by hand and believed. This checks them against the Census place
 * register, which states outright which county an incorporated place is in.
 */
test('every page is checked against the register, or says why it cannot be', () => {
  const pages = georgiaCityPages()
  assert.equal(DATA.cities.length, pages.length)
  for (const c of DATA.cities) {
    if (c.counties) {
      assert.ok(c.counties.length > 0)
      assert.ok(c.place_fips?.startsWith('13'), `${c.city} has no Georgia place code`)
    } else {
      // A blank must never read as an oversight.
      assert.ok(c.unresolved_reason, `${c.city} is unresolved and does not say why`)
    }
  }
})

test('a city is never placed in a county it is not in', () => {
  for (const c of DATA.cities) {
    if (!c.counties) continue
    // A sector may span counties; what it may not do is exclude the city's own.
    const claimed = c.sector_counties
    const found = c.counties.some((county) => claimed.includes(county))
    assert.ok(
      found,
      `${c.city} is in ${c.counties.join('/')} County but its page says "${claimed}"`,
    )
  }
})

test('Clarkston is in DeKalb, and the page says so', () => {
  // Named explicitly because this is the one that was wrong. A general rule
  // that passes is easy to weaken by accident; a named case is not.
  const row = DATA.cities.find((c) => c.city === 'Clarkston')
  assert.deepEqual(row.counties, ['DeKalb'])
  assert.ok(row.sector_counties.includes('DeKalb'))
  assert.equal(row.sector_counties.includes('Clayton'), false)
})

test('the four corridor names are not resolved to a county', () => {
  // Adamsville, Holcomb Bridge, Pleasant Hill and Sugarloaf are how the punch
  // list named stores — a neighbourhood and three roads. A gazetteer resolves
  // "Pleasant Hill, Georgia" to a community in Union County, ninety miles from
  // the I-85 intersection the page is about. Unresolved is the correct answer.
  const unresolved = DATA.cities.filter((c) => !c.counties).map((c) => c.city).sort()
  assert.deepEqual(unresolved, ['Adamsville', 'Holcomb Bridge', 'Pleasant Hill', 'Sugarloaf'])
})

test('the county comes from the federal register, not a geocoder', () => {
  const src = sourceWithoutComments('scripts/build-georgia-city-counties.mjs')
  assert.match(src, /national_place2020\.txt/)
  assert.match(src, /INCORPORATED PLACE/)
  // The first two attempts used a geocoder and both produced wrong answers —
  // one because the query carried the page's own guess, one because it matched
  // "Union City" against a store in New Jersey.
  assert.equal(/nominatim|geocoding\.geo\.census\.gov/i.test(src), false)
  assert.equal(/API_KEY/.test(src), false)
})
