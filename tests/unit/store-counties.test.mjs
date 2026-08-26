import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'

import { sourceWithoutComments } from '../helpers/source.mjs'

const DATA = JSON.parse(readFileSync('src/data/kbpStoreCounties.json', 'utf8'))
const { KBP_STORES } = await import('../../src/data/kbpStoreMap.js')

/**
 * These coordinates decide two things: where a pin goes on a map, and which
 * counties get a page written about working in them. Both are claims about
 * where this company has been, so neither may rest on a value somebody typed.
 */
test('every store was queried, and none was dropped', () => {
  assert.equal(DATA.stores.length, KBP_STORES.length)
  const queried = new Set(DATA.stores.map((s) => s.address_queried))
  for (const s of KBP_STORES) {
    assert.ok(
      queried.has(`${s.address}, ${s.city}, ${s.state}`),
      `${s.address}, ${s.city} was never geocoded`,
    )
  }
})

test('a located store says which service located it', () => {
  for (const s of DATA.stores) {
    if (!s.county) {
      // An unmatched address holds nothing, not a partial guess.
      assert.equal(s.lat, null, `${s.address_queried} has a coordinate but no county`)
      assert.equal(s.lng, null)
      continue
    }
    assert.ok(
      ['census', 'openstreetmap'].includes(s.geocoder),
      `${s.address_queried} has a county from no stated source`,
    )
    assert.equal(typeof s.lat, 'number')
    assert.equal(typeof s.lng, 'number')
  }
})

/**
 * A coordinate in the wrong hemisphere is the null-island failure the photo
 * indexer already had once. The continental US is a box; anything outside it
 * is a parse error wearing six decimal places.
 */
test('coordinates land in the United States', () => {
  for (const s of DATA.stores) {
    if (s.lat === null) continue
    assert.ok(s.lat > 24 && s.lat < 50, `${s.address_queried} latitude ${s.lat} is not in the US`)
    assert.ok(s.lng > -125 && s.lng < -66, `${s.address_queried} longitude ${s.lng} is not in the US`)
  }
})

/**
 * The grade travels with the store. Without it, a roster entry and a settled
 * invoice look identical on a map, which is the fabricated store database
 * again — drawn in colour instead of typed in a table.
 */
test('the evidence grade survives geocoding', () => {
  const byQuery = new Map(DATA.stores.map((s) => [s.address_queried, s]))
  for (const s of KBP_STORES) {
    const row = byQuery.get(`${s.address}, ${s.city}, ${s.state}`)
    assert.equal(row.grade, s.grade, `${s.city}: grade changed in transit`)
  }
})

test('store numbers stay out of the geocoded file', () => {
  // KBP's internal identifiers are the join key to this company's invoices,
  // not something for a public map. Same rule as the CSVs.
  const raw = readFileSync('src/data/kbpStoreCounties.json', 'utf8')
  for (const s of KBP_STORES) {
    if (!s.store) continue
    assert.equal(raw.includes(s.store), false, `store number ${s.store} leaked into the map data`)
  }
})

/**
 * Atlanta spans Fulton and DeKalb. This is the reason the county is resolved
 * from the address rather than the city name — guessing "Atlanta is Fulton"
 * files DeKalb jobs under a county page read by people who know better.
 */
test('a city spanning two counties resolves to both', () => {
  const atlanta = DATA.stores.filter((s) => s.city === 'Atlanta' && s.county)
  assert.ok(atlanta.length > 1)
  const counties = new Set(atlanta.map((s) => s.county))
  assert.ok(counties.size > 1, 'every Atlanta store resolved to one county — the address was ignored')
})

test('the geocoder needs no API key and honours the published rate limit', () => {
  const src = sourceWithoutComments('scripts/geocode-stores.mjs')
  assert.equal(/API_KEY|api_key|key=/.test(src), false, 'the geocoder acquired a key dependency')
  assert.match(src, /OSM_PAUSE_MS/, 'the OpenStreetMap rate limit was removed')
  assert.match(src, /User-Agent/)
})

/**
 * What this file is for: deciding which counties get a page. `listed` is a
 * roster entry, not a job, so it must not put a county on that list.
 */
test('only documented work can put a county on the page list', () => {
  // `completed` joined the ladder on 2026-08-26: a completed job with revenue
  // in this company's own Kickserv record. It is documentary and publishable,
  // and it is what moved Michigan from two counties to four. `listed` is still
  // a roster entry and still cannot put a county on the list.
  const publishable = DATA.stores.filter((s) => s.grade !== 'listed' && s.county)
  assert.ok(publishable.length > 0)
  for (const s of publishable) assert.ok(['paid', 'invoiced', 'completed'].includes(s.grade))

  const gaCounties = new Set(publishable.filter((s) => s.state === 'GA').map((s) => s.county))
  // Eleven counties from 159. The gap between those numbers is the whole
  // point: a page per county because the county exists is the doorway-page
  // pattern, and it is the failure this file exists to prevent.
  assert.ok(gaCounties.size < 20, 'the Georgia page set grew past its evidence')
  assert.ok(gaCounties.has('Fulton') && gaCounties.has('DeKalb'))
})
