import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'

import { GA, QUADS } from '../../src/data/kfcProgrammeTracker.js'
import { KBP_INVOICE_EVIDENCE } from '../../src/data/georgiaStores.js'
import { KBP_STORES, tally } from '../../src/data/kbpStoreMap.js'

const RAW = readFileSync('src/components/DocumentedRecord.jsx', 'utf8')

/**
 * Comments are stripped before the hard-coding check. The first version of
 * this test scanned the whole file and flagged its own doc comment, which
 * quotes the figures precisely in order to explain why the section exists.
 * Documentation quoting a number is not the same as rendering one, and a test
 * that cannot tell them apart trains people to ignore it.
 */
const SRC = RAW.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

/**
 * The whole point of this component is that a figure on the page cannot drift
 * from the document behind it. If a number gets typed in literally, that
 * guarantee is gone and nobody would notice for months.
 */
test('no figure is hard-coded into the component', () => {
  // Only figures long enough to be unambiguous. A bare "29" collides with
  // spacing utilities and line numbers; a formatted currency string does not.
  const literals = [
    String(KBP_INVOICE_EVIDENCE.totalUsd),
    '4,082,440',
    String(GA.paidUsd),
    '453,311',
  ]
  for (const lit of literals) {
    assert.equal(SRC.includes(lit), false, `${lit} is typed into the component instead of imported`)
  }
  // And it must actually import from the graded sources.
  assert.match(SRC, /kfcProgrammeTracker/)
  assert.match(SRC, /kbpStoreMap/)
})

test('only paid and invoiced stores are counted as work', () => {
  const t = tally()
  const worked = t.paid + t.invoiced
  assert.ok(worked < KBP_STORES.length, 'every store was counted as work')
  // The roster must be shown, and shown as assigned rather than finished.
  assert.match(SRC, /counts\.listed/, 'the roster count was dropped from the page')
  assert.match(SRC, /assigned/i, 'the roster is no longer labelled as assigned')
})

test('the claims made are the ones the record supports', () => {
  assert.equal(GA.matchesClientTotal, true, 'the reconciliation claim on the page rests on this')
  assert.match(SRC, /reconcile/i)
  assert.ok(QUADS.iowa > 0)
})

/**
 * The copy this replaced is the failure mode: unfalsifiable superlatives that
 * every competitor can also write. They must not come back.
 */
test('the unfalsifiable claims are gone from the section it fronts', () => {
  const authority = readFileSync('src/components/CommercialClientAuthority.jsx', 'utf8')
  assert.equal(/Fortune 500/i.test(authority), false, 'the Fortune 500 claim returned')
  assert.equal(
    /Trusted Paving Partner for America/i.test(authority),
    false,
    'the premier-brands headline returned',
  )
})

test('the component is rendered on the homepage', () => {
  const home = readFileSync('src/pages/Home.jsx', 'utf8')
  assert.match(home, /import DocumentedRecord/)
  assert.match(home, /<DocumentedRecord \/>/)
})
