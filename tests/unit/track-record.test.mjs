import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { FABRICATION_SOURCE } from '../../src/data/trackRecord.js'
import { KBP_STORES } from '../../src/data/kbpStoreMap.js'

/**
 * The fabricated dataset that started this repository's evidence discipline
 * was deleted from the repo but still exists in the owner's cloud storage.
 * These guard against it coming back in through a future ingest.
 */
/**
 * The first version of this guard matched any quoted four-digit string and
 * flagged invoice 2099 — a real invoice, $19,000 to the Pharr store, dated
 * 2016-11-09. Real invoice numbers are four digits and always will be.
 *
 * The invariant is not "these digits never appear". It is that no STORE is
 * identified by an invented number, and that the fabricated `#NNNN` form does
 * not return. A guard broad enough to catch true data is a guard that will be
 * switched off.
 */
test('no store is identified by a fabricated number', () => {
  const invented = FABRICATION_SOURCE.inventedStoreNumbers
  const dir = 'src/data'
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.js') && f !== 'trackRecord.js')) {
    const text = readFileSync(join(dir, file), 'utf8')
    for (const n of invented) {
      // The hash form is the fabrication's own notation. It has no other use.
      assert.equal(text.includes(n), false, `fabricated store ${n} appears in ${file}`)
      // And no store field may carry the bare number either.
      assert.equal(
        new RegExp(`store:\\s*['"\`]#?${n.replace('#', '')}['"\`]`).test(text),
        false,
        `a store in ${file} is identified as ${n}`,
      )
    }
  }
})

test('every store number in the record matches the client’s real format', () => {
  assert.equal(FABRICATION_SOURCE.realFormatIs, 'G135xxx')
  for (const s of KBP_STORES) {
    assert.match(s.store, /^G13\d{4,5}$/, `${s.store} does not look like a KBP identifier`)
  }
})

test('the located source keeps what makes it identifiable and actionable', () => {
  assert.equal(FABRICATION_SOURCE.stillInCloudStorage, true)
  assert.equal(FABRICATION_SOURCE.deletedFromRepo, true)
  assert.ok(FABRICATION_SOURCE.tells.length >= 4, 'the tells that identify it were dropped')
  assert.ok(FABRICATION_SOURCE.recommendation)
  // Not deleted by this repository, and the reason is stated.
  assert.ok(FABRICATION_SOURCE.whyNotDeletedHere)
})

test('the invented Savannah store has not entered the record', () => {
  // Savannah is the one market whose genuine records are lost, so a
  // fabrication there fills the gap nobody can check. See unrecoveredWork.js.
  const savannahKfc = KBP_STORES.filter((s) => /savannah/i.test(s.city))
  assert.deepEqual(savannahKfc, [], 'a Savannah KFC appeared with no client document behind it')
})
