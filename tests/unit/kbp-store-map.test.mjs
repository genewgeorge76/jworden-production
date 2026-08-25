import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'

import { KBP_STORES, PAID, INVOICED, LISTED, SHOWABLE_AS_WORK, tally, workStores, byState } from '../../src/data/kbpStoreMap.js'
import { GA, QUADS, MI, NJ } from '../../src/data/kfcProgrammeTracker.js'

test('every store carries a grade the vocabulary recognises', () => {
  for (const s of KBP_STORES) {
    assert.ok([PAID, INVOICED, LISTED].includes(s.grade), `${s.store} has grade ${s.grade}`)
    assert.ok(s.address && s.city && s.state, `${s.store} is not mappable`)
  }
})

/**
 * The load-bearing one. A map that draws every pin the same claims 138
 * completed jobs on evidence that ranges from a cleared payment to a name on
 * a list. Only two grades may be shown as work.
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
  assert.equal(st.MI.invoiced, MI.storesInvoiced)
  assert.equal(st.NJ.invoiced, NJ.storesInvoiced)
  assert.equal(st.IA.invoiced, QUADS.iowa, 'Iowa must stay at the four the tracker shows')
  assert.equal(t.paid + t.invoiced + t.listed, KBP_STORES.length)
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
