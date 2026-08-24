/**
 * The Georgia store record, and the line between scheduled and finished.
 *
 * TWO SOURCES, DIFFERENT WEIGHT
 *   The 2017 KBP tracker holds 23 Georgia stores at Design or Permitting.
 *   Both are PRE-CONSTRUCTION. Publishing them as completed work would be the
 *   same error as reading a "Before Pictures" email as proof of a finished job,
 *   which photo_email.py exists to prevent.
 *
 *   The punch list is issued at SUBSTANTIAL COMPLETION — it is the snagging
 *   list for work already on the ground. Stronger evidence, graded completed.
 */
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const {
  TRACKER_STORES, PUNCH_LIST_STORES, AREA_COACH_STORES, PRE_CONSTRUCTION,
  georgiaRecord, completedGeorgia, completedGeorgiaCities,
} = await import(path.join(ROOT, 'src/data/georgiaStores.js'))

test('no tracker store is ever graded completed', () => {
  // The load-bearing assertion. Design and Permitting are not finished work.
  const tracker = georgiaRecord().filter((s) => s.source === 'kbp-2017-tracker')
  assert.equal(tracker.length, 23)
  for (const s of tracker) {
    assert.equal(s.evidence, 'listed', `${s.store} graded ${s.evidence}`)
    assert.ok(PRE_CONSTRUCTION.has(s.stage), `${s.store} stage ${s.stage} is not pre-construction`)
  }
  const completedStores = completedGeorgia().map((s) => s.store).filter(Boolean)
  for (const s of TRACKER_STORES) {
    // G135108 appears on BOTH; the punch list entry is the completed one.
    if (s.store === 'G135108') continue
    assert.ok(!completedStores.includes(s.store),
      `${s.store} is tracker-only and must not appear as completed`)
  }
})

test('every tracker store carries a real address and postcode', () => {
  for (const s of TRACKER_STORES) {
    assert.match(s.store, /^G\d{6}$/, `${s.store} is not a KBP store id`)
    assert.ok(s.address && s.address.length > 5, `${s.store} has no address`)
    assert.ok(s.city, `${s.store} has no city`)
    assert.match(s.zip, /^3\d{4}$/, `${s.store} zip ${s.zip} is not Georgia`)
  }
})

test('the Big Chicken is in KBP\'s own tracker at the address we published', () => {
  // Independent corroboration: the address was written by the client.
  const bc = TRACKER_STORES.find((s) => s.store === 'G135094')
  assert.ok(bc, 'G135094 missing')
  assert.equal(bc.city, 'Marietta')
  assert.equal(bc.zip, '30062')
  assert.match(bc.address, /12 Cobb Pkwy/)
})

test('punch-list and area-coach entries grade completed', () => {
  for (const s of [...PUNCH_LIST_STORES, ...AREA_COACH_STORES]) {
    const rec = georgiaRecord().find((r) => r.city === s.city && r.evidence === 'completed')
    assert.ok(rec, `${s.city} should be completed`)
  }
  assert.equal(completedGeorgia().length, PUNCH_LIST_STORES.length + AREA_COACH_STORES.length)
})

test('a store number is never invented for a name-only punch entry', () => {
  const nameOnly = PUNCH_LIST_STORES.filter((s) => s.store === null)
  assert.ok(nameOnly.length >= 5, 'expected several name-only entries')
  for (const s of nameOnly) {
    assert.equal(s.store, null)
    assert.ok(s.city, 'a name-only entry still needs its city')
  }
})

test('the record makes no 100+ claim', () => {
  // That figure lives in georgiaProgram.js on the owner's authority and is
  // labelled there. Neither document in this file supports it, and a count
  // here would silently borrow authority the documents do not give.
  const blob = JSON.stringify(georgiaRecord())
  assert.ok(!/100\+/.test(blob))
  assert.ok(completedGeorgia().length < 100)
})

test('completed cities are deduplicated and sorted', () => {
  const cities = completedGeorgiaCities()
  assert.deepEqual(cities, [...new Set(cities)].sort())
  assert.ok(cities.includes('Riverdale') && cities.includes('Kennesaw'))
})
