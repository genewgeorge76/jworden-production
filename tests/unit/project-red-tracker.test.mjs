import assert from 'node:assert/strict'
import { test } from 'node:test'

import * as T from '../../src/data/projectRedTracker.js'
import { STATE_EVIDENCE, PUBLISHABLE } from '../../src/data/stateEvidence.js'

/**
 * The deposit ratio is the mechanism behind a rule texasProgram.js has carried
 * since before anyone knew why. If it ever stops being exactly one half, the
 * explanation is wrong and the rule needs re-deriving rather than trusting.
 */
test('the deposit is exactly half, which is what makes the old rule true', () => {
  assert.equal(T.DEPOSIT_RATIO, 0.5)
  assert.equal(T.TX_DEPOSITS_INVOICED_USD * 2, T.TX_JOB_VALUE_USD)
  assert.ok(T.DEPOSIT_ROWS_VERIFIED >= 9, 'the ratio must rest on every row that carried figures')
})

test('the two totals are never summed', () => {
  // $151,696 + $303,392 = $455,088, which describes nine jobs counted one and
  // a half times and no work whatsoever.
  const nonsense = T.TX_DEPOSITS_INVOICED_USD + T.TX_JOB_VALUE_USD
  assert.equal(nonsense, 455088)
  assert.notEqual(T.TX_JOB_VALUE_USD, nonsense)
  assert.equal(T.NEVER_SUM.length, 2)
})

/**
 * The load-bearing one. A roster is a list of places to look, not proof that
 * anyone went. Michigan's figure columns are empty and its grade must not move.
 */
test('a roster does not promote the state it names', () => {
  assert.equal(T.MI_HAS_FIGURES, false)
  assert.equal(T.ROSTER_ENABLES.changesGrade, false)
  assert.equal(STATE_EVIDENCE.MI.grade, 'work', 'Michigan changed grade on the strength of a list')
  // The 30 listed stores are NOT 30 documented sites. If anything ever reads
  // MI_STORES_LISTED as evidence of completion, this is where it shows.
  assert.ok(T.MI_STORES_LISTED > 0)
  assert.equal('MI_STORES_COMPLETED' in T, false, 'a completion count appeared with nothing behind it')
})

test('Michigan is roofing here, not paving', () => {
  // Different trade. It widens the documented scope; it does not add paving.
  assert.equal(T.MI_CATEGORY, 'Roof')
  assert.ok(T.MI_CITIES.includes('Detroit'))
})

test('the client asset register is not committed', () => {
  assert.equal(T.FULL_ROSTER_COMMITTED, false)
})

test('Texas figures here do not disturb the reconciled Texas total', () => {
  // This is the deposits file, a November 2016 snapshot. texasProgram.js
  // reconciles a larger and later scope. Neither replaces the other.
  assert.ok(T.TX_STORES_WITH_FIGURES < T.TX_STORES_LISTED)
  assert.equal(PUBLISHABLE.has(STATE_EVIDENCE.TX.grade), true)
})
