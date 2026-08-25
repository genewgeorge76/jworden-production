import assert from 'node:assert/strict'
import { test } from 'node:test'

import * as K from '../../src/data/kfcProgrammeTracker.js'
import { DEPOSIT_RATIO } from '../../src/data/projectRedTracker.js'

/**
 * The reconciliation that licenses every other figure in the file. If Georgia
 * ever stops matching the client's own outstanding total, the reading method
 * is wrong and nothing derived from it should be trusted.
 */
test('Georgia reconciles to the client’s own outstanding figure', () => {
  assert.equal(K.GA.invoicedUsd - K.GA.paidUsd, K.GA.outstandingUsd)
  assert.equal(K.GA.outstandingUsd, 123270.0)
  assert.equal(K.GA.matchesClientTotal, true)
  // The match only holds because a re-invoiced balance was removed. If that
  // correction is ever dropped, the arithmetic above breaks loudly.
  assert.equal(K.GA.reInvoicedBalanceRemovedUsd, 3400.0)
})

test('the deposit ratio agrees with the control tracker', () => {
  // Three independent confirmations: Texas parking, Quad Cities, New Jersey.
  assert.equal(K.QUADS.depositRatio, DEPOSIT_RATIO)
  assert.equal(K.NJ.depositRatio, DEPOSIT_RATIO)
  // New Jersey doubles exactly. The Quad Cities miss by a dollar because the
  // client's own sheet rounded one row down, and that dollar is recorded
  // rather than corrected — see QUADS.jobValueRoundingUsd.
  assert.equal(K.NJ.depositsUsd * 2, K.NJ.jobValueUsd)
  assert.equal(
    K.QUADS.depositsUsd * 2 - K.QUADS.jobValueUsd,
    K.QUADS.jobValueRoundingUsd,
    'the rounding in the source sheet changed, or was silently absorbed',
  )
  assert.equal(K.QUADS.jobValueRoundingRow, 'G135006')
})

/**
 * Iowa is the sharpest corroboration in the file: the owner said four, and the
 * client's own sheet carries exactly four, with schedule notes.
 */
test('Iowa carries exactly four stores, with figures', () => {
  assert.equal(K.QUADS.iowa, 4)
  assert.equal(K.QUADS.iowaStores.length, 4)
  assert.equal(K.QUADS.iowaDepositsUsd * 2, K.QUADS.iowaJobValueUsd)
  // The rounding row is in Illinois, so Iowa doubles cleanly.
  // A bid list does not say "at location currently".
  assert.ok(K.QUADS.iowaStatusNotes.some((n) => /at location/i.test(n)))
})

test('paid, invoiced and listed stay three different claims', () => {
  const keys = Object.keys(K.COLUMN_MEANINGS)
  assert.deepEqual(keys.sort(), ['invoiced', 'listed', 'paid'])
  for (const k of keys) assert.ok(K.COLUMN_MEANINGS[k].length > 0)
  // Michigan is the live example: invoiced with no payment column completed.
  assert.equal(K.MI.paidUsd, null, 'a null payment column became a number')
  assert.ok(K.MI.storesInvoiced < K.MI.storesListed)
})

test('no state claims more invoiced stores than it lists', () => {
  for (const [name, s] of Object.entries({ MI: K.MI, NJ: K.NJ, NY: K.NY })) {
    assert.ok(
      s.storesInvoiced <= s.storesListed,
      `${name} invoiced more stores than the tracker lists`,
    )
  }
})

test('the never-sum rules survive as text, not just as arithmetic', () => {
  assert.ok(K.NEVER_SUM.length >= 3)
  assert.ok(K.NEVER_SUM.some((r) => /deposit/i.test(r)))
  assert.ok(K.NEVER_SUM.some((r) => /re-invoiced/i.test(r)))
})
