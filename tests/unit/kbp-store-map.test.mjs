import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'

import { KBP_STORES, PAID, INVOICED, COMPLETED, LISTED, SHOWABLE_AS_WORK, MISFILED_BY_STATE, tally, workStores, byState } from '../../src/data/kbpStoreMap.js'
import { GA, QUADS, MI, NJ } from '../../src/data/kfcProgrammeTracker.js'

test('every store carries a grade the vocabulary recognises', () => {
  for (const s of KBP_STORES) {
    assert.ok([PAID, INVOICED, COMPLETED, LISTED].includes(s.grade), `${s.store} has grade ${s.grade}`)
    // Every grade names whose document it rests on, so nobody has to infer it.
    if (s.grade === COMPLETED) assert.equal(s.source, 'kickserv', `${s.store} is completed but cites no source`)
    if (s.grade === PAID || s.grade === INVOICED) assert.equal(s.source, 'kbp-tracker')
    assert.ok(s.address && s.city && s.state, `${s.store} is not mappable`)
  }
})

/**
 * The load-bearing one. A map that draws every pin the same claims 138
 * completed jobs on evidence that ranges from a cleared payment to a name on
 * a list. Only graded-as-work rows may be shown, and `listed` is never one.
 */
test('listed stores are never showable as work', () => {
  assert.equal(SHOWABLE_AS_WORK.has(LISTED), false)
  const shown = workStores()
  assert.equal(shown.some((s) => s.grade === LISTED), false)
  assert.ok(shown.length < KBP_STORES.length, 'every store became showable, which cannot be right')
})

test('the store counts agree with the tracker they came from', () => {
  const t = tally()
  const st = byState()
  // Georgia paid is the figure that reconciles to KBP's own outstanding total.
  assert.equal(st.GA.paid, GA.storesPaid)
  // Michigan splits across two evidence sources now: six in KBP's tracker,
  // twenty-one in this company's own Kickserv record, three with neither.
  assert.equal(st.MI.invoiced, MI.storesInvoiced)
  assert.equal(st.MI.completed, 21)
  assert.equal(st.MI.listed, 3)
  assert.equal(st.NJ.invoiced, NJ.storesInvoiced)
  assert.equal(st.IA.invoiced, QUADS.iowa, 'Iowa must stay at the four the tracker shows')
  assert.equal(t.paid + t.invoiced + t.completed + t.listed, KBP_STORES.length)
})

test('no listed store was given a dollar figure', () => {
  // A figure on a roster row is an invented invoice.
  for (const s of KBP_STORES) {
    if (s.grade === LISTED) assert.equal(s.usd, null, `${s.store} is listed but carries a value`)
  }
})

test('paid stores all carry what the client settled', () => {
  for (const s of KBP_STORES.filter((x) => x.grade === PAID)) {
    assert.ok(typeof s.usd === 'number' && s.usd > 0, `${s.store} is paid with no amount`)
  }
})

test('store numbers stay out of the generated map', () => {
  // KBP's internal identifiers. They are the join key to invoices and photo
  // clusters; they do not belong on a map that may be shared.
  const gen = readFileSync('scripts/build-kbp-map.mjs', 'utf8')
  assert.equal(/s\.store/.test(gen), false, 'the generator writes store numbers into the CSV')
  assert.match(gen, /Evidence/, 'the generator dropped the evidence column')
})

test('the Quad Cities keep a real municipality, not the sheet shorthand', () => {
  // The tracker writes "Quads" in the city column. It is a regional nickname
  // and no geocoder will find it, so a pin would land nowhere or anywhere.
  const quadStates = KBP_STORES.filter((s) => ['IL', 'IA'].includes(s.state))
  assert.ok(quadStates.length > 0)
  for (const s of quadStates) {
    assert.notEqual(s.city.toLowerCase(), 'quads', `${s.store} still says Quads`)
  }
})


/**
 * `completed` rests on this company's own Kickserv record, not KBP's tracker.
 * It is showable as work — a completed job with revenue is documentary — but
 * it must never be silently merged into `invoiced`, which means the CLIENT
 * wrote the bill down.
 */
test('completed is showable, sourced, and distinct from invoiced', () => {
  assert.ok(SHOWABLE_AS_WORK.has(COMPLETED))
  assert.notEqual(COMPLETED, INVOICED)
  const done = KBP_STORES.filter((s) => s.grade === COMPLETED)
  assert.ok(done.length > 0)
  for (const s of done) {
    assert.equal(s.source, 'kickserv')
    assert.ok(typeof s.usd === 'number' && s.usd > 0, `${s.store} is completed with no revenue`)
  }
})

/**
 * The three Michigan stores with neither a KBP invoice nor a Kickserv job.
 * Pinned by name: the owner states he did every KFC KBP owned in Michigan, and
 * these are precisely the ones no document has yet been found for. If evidence
 * turns up they move; they must not drift up a grade without it.
 */
test('the three unevidenced Michigan stores stay listed', () => {
  const stillListed = KBP_STORES.filter((s) => s.state === 'MI' && s.grade === LISTED)
    .map((s) => s.store)
    .sort()
  assert.deepEqual(stillListed, ['G135357', 'G135365', 'G135371'])
  for (const s of KBP_STORES) {
    if (s.state === 'MI' && s.grade === LISTED) assert.equal(s.usd, null)
  }
})

/**
 * A $351,576 Burger King in Columbia, Mississippi arrived labelled `MI` and
 * would have become the largest job in the Michigan pile. Its zip, its
 * coordinates and its address all say Mississippi.
 */
test('the misfiled job is recorded in the state it is actually in', () => {
  assert.equal(MISFILED_BY_STATE.length, 1)
  const [bk] = MISFILED_BY_STATE
  assert.equal(bk.recordedState, 'MI')
  assert.equal(bk.actualState, 'MS')
  assert.equal(bk.county, 'Marion')
  assert.match(bk.verifiedBy, /Census/)
  // It is not a KBP store and must never be counted as one.
  assert.equal(KBP_STORES.some((s) => s.state === 'MS'), false)
  assert.equal(KBP_STORES.some((s) => s.usd === bk.usd), false)
})
