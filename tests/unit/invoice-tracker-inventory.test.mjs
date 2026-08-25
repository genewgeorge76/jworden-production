import assert from 'node:assert/strict'
import { test } from 'node:test'

import { TRACKERS, ANY_TRACKER_READ, CONTROL, FURTHER_MAILBOXES } from '../../src/data/invoiceTrackerInventory.js'
import { TX_INVOICED_VALUE_USD, TX_INVOICED_JOBS } from '../../src/data/texasProgram.js'
import { KBP_INVOICE_EVIDENCE } from '../../src/data/georgiaStores.js'

/**
 * The whole file is a list of documents nobody has opened. Until one is read,
 * no figure anywhere may move on the strength of its existence.
 */
test('locating a tracker has changed no figure', () => {
  assert.equal(ANY_TRACKER_READ, false)
  assert.equal(KBP_INVOICE_EVIDENCE.totalUsd, 4082440.23)
  assert.equal(KBP_INVOICE_EVIDENCE.namesStores, false)
})

test('no tracker claims to contain anything', () => {
  for (const t of TRACKERS) {
    assert.equal('totalUsd' in t, false, `${t.market} was given a total before being opened`)
    assert.equal('sites' in t, false, `${t.market} was given a site count before being opened`)
    assert.ok(t.wouldSettle, `${t.market} has no stated reason to be read`)
    assert.ok(t.date && t.subject, `${t.market} cannot be found again`)
  }
})

/**
 * Read the known answer first. Reaching for Atlanta before Texas is how the
 * $51,750 and the $17,949 errors happened — a method trusted before it was
 * tested.
 */
test('the control is the market whose answer is already known', () => {
  assert.equal(CONTROL.market, 'Texas')
  // Pinned to texasProgram.js so the control cannot drift from the answer
  // it is meant to validate against.
  assert.equal(CONTROL.expectedTotalUsd, TX_INVOICED_VALUE_USD)
  assert.equal(CONTROL.expectedSites, TX_INVOICED_JOBS)

  const texas = TRACKERS.filter((t) => t.market === 'Texas')
  assert.ok(texas.length > 0)
  for (const t of texas) {
    assert.ok(t.priority >= 3, 'Texas is the control; it is read to validate, not to discover')
  }
})

test('the roster is flagged, because it is the denominator', () => {
  const roster = TRACKERS.find((t) => t.isRoster)
  assert.ok(roster, 'the master store list lost its flag')
  assert.equal(roster.priority, 1)
  assert.match(roster.filename, /MASTER LIST/i)
})

test('further mailboxes are recorded with why they matter', () => {
  assert.ok(FURTHER_MAILBOXES.length > 0)
  for (const m of FURTHER_MAILBOXES) {
    assert.match(m.address, /@/)
    assert.ok(m.note, `${m.address} recorded with no reason`)
  }
})
