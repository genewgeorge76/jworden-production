/**
 * The Georgia pages — seventeen cities and one landmark.
 *
 * WHAT MAKES GEORGIA DIFFERENT FROM TEXAS, AND WHY IT SHOWS
 * ────────────────────────────────────────────────────────
 * The Texas pages carry a dollar figure per store, because the Texas evidence
 * is an invoice tracker that reconciles to the cent. The Georgia evidence is a
 * punch list the owner worked from and emails the crew sent to KBP area
 * coaches. Those establish that the work was done. They do not establish what
 * it was worth.
 *
 * So no Georgia page may carry a value, and that is not a gap waiting for an
 * estimate. A figure invented beside a real store number poisons the store
 * number — which is the checkable thing, and the only reason the page is worth
 * publishing.
 *
 * THE OTHER FAILURE THESE GUARD
 * ─────────────────────────────
 * Seventeen pages that swap a place name are duplicate content. Metro Atlanta
 * is not one paving market — the freight economy under the Hartsfield approach,
 * shallow granite at Kennesaw and Stone Mountain, and inside-perimeter parcels
 * built on a century of undocumented fill are genuinely different problems —
 * and each page has to say the one that applies to it.
 */
import assert from 'node:assert/strict'
import test from 'node:test'

const { georgiaCityPages, georgiaCityPaths, GA_CLIENT, GA_BRAND } = await import(
  '../../src/data/georgiaCityPages.js'
)
const { completedGeorgia, PUNCH_LIST_STORES, TRACKER_STORES } = await import(
  '../../src/data/georgiaStores.js'
)
const { BIG_CHICKEN, bigChickenSchema } = await import('../../src/data/georgiaProgram.js')

const PAGES = georgiaCityPages()

test('there is a page for every city with a completed store, and no others', () => {
  const completedCities = new Set(completedGeorgia().map((s) => s.city))
  const pageCities = new Set(PAGES.map((p) => p.city))
  for (const city of pageCities) {
    assert.ok(completedCities.has(city), `${city} has a page but no completed store`)
  }
})

test('no page is built from a store still at Design or Permitting', () => {
  /**
   * KBP's 2017 tracker holds 23 further Georgia stores that were never
   * finished. Pipeline is not work, and a page for one would be the fabricated
   * store database again, assembled out of true rows.
   */
  const publishable = new Set(completedGeorgia().map((s) => s.store))
  for (const page of PAGES) {
    for (const store of page.stores) {
      assert.ok(publishable.has(store.store), `${store.store} is not graded completed`)
    }
  }
})

// ── No invented value ────────────────────────────────────────────────────────

test('no Georgia page carries a dollar figure', () => {
  for (const page of PAGES) {
    assert.ok(!/\$\s?[\d,]/.test(JSON.stringify(page)), `${page.city} carries a value`)
  }
})

test('no store on any page carries a value field', () => {
  for (const page of PAGES) {
    for (const store of page.stores) {
      assert.equal(store.value, undefined, `${store.store} has a value the record does not support`)
      assert.equal(store.amount, undefined, `${store.store} has an amount`)
    }
  }
})

// ── Not duplicate content ────────────────────────────────────────────────────

function words(text) {
  return new Set(
    String(text).toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter((w) => w.length > 5),
  )
}

test('every city says something true about itself that no other city says', () => {
  const angles = PAGES.map((p) => p.angle)
  assert.equal(new Set(angles).size, angles.length, 'two cities share an angle verbatim')
  for (let i = 0; i < PAGES.length; i += 1) {
    for (let j = i + 1; j < PAGES.length; j += 1) {
      const A = words(PAGES[i].angle)
      const B = words(PAGES[j].angle)
      const shared = [...A].filter((w) => B.has(w)).length / Math.min(A.size, B.size)
      assert.ok(shared < 0.5, `${PAGES[i].city} and ${PAGES[j].city} say nearly the same thing`)
    }
  }
})

test('metro Atlanta is treated as several markets, not one', () => {
  const sectors = new Set(PAGES.map((p) => p.sector))
  assert.ok(sectors.size >= 4, `only ${sectors.size} sectors — that is a template with a place name in it`)
})

test('cities in different sectors describe different ground', () => {
  const kennesaw = PAGES.find((p) => p.city === 'Kennesaw')
  const riverdale = PAGES.find((p) => p.city === 'Riverdale')
  assert.notEqual(kennesaw.subgrade, riverdale.subgrade)
  assert.match(kennesaw.subgrade, /granite|bedrock/i, 'the shallow rock at Kennesaw is the point')
  assert.match(riverdale.climate, /load|freight|rutting|shoving/i, 'south metro is a loading problem')
})

test('every page has enough on it to be worth indexing', () => {
  for (const page of PAGES) {
    assert.ok(page.angle.length > 100, `${page.city} angle is a stub`)
    assert.ok(page.subgrade.length > 200, `${page.city} has no real ground content`)
    assert.ok(page.storeCount >= 1)
    assert.ok(page.path.startsWith('/') && !page.path.endsWith('/'))
  }
})

test('paths are unique and url-safe', () => {
  const paths = georgiaCityPaths()
  assert.equal(new Set(paths).size, paths.length)
  for (const path of paths) assert.match(path, /^\/[a-z0-9-]+$/)
})

// ── The landmark ─────────────────────────────────────────────────────────────

test('the Big Chicken keeps public record and the owner’s claim in separate fields', () => {
  /**
   * structureFacts are independently checkable — Wikipedia, the AJC, Explore
   * Georgia. ourWork is the owner's statement. Nothing may let the second
   * borrow the authority of the first.
   */
  assert.ok(BIG_CHICKEN.structureFacts.length >= 3)
  assert.ok(BIG_CHICKEN.sources.length >= 2)
  assert.match(BIG_CHICKEN.ourWork, /Among the Georgia/i)
  for (const fact of BIG_CHICKEN.structureFacts) {
    assert.ok(!/we |our |this company/i.test(fact), `a structure fact makes a claim about us: ${fact}`)
  }
})

test('the landmark schema resolves to a real place with coordinates', () => {
  const schema = bigChickenSchema()
  assert.equal(schema['@type'], 'LandmarksOrHistoricalBuildings')
  assert.equal(schema.geo['@type'], 'GeoCoordinates')
  assert.ok(schema.geo.latitude > 33 && schema.geo.latitude < 35, 'not in metro Atlanta')
  assert.ok(schema.geo.longitude < -84 && schema.geo.longitude > -85)
  assert.ok(Array.isArray(schema.sameAs) && schema.sameAs.length >= 2)
})

test('the client and brand are named consistently', () => {
  assert.equal(GA_CLIENT, 'KBP Foods')
  assert.equal(GA_BRAND, 'KFC')
})
