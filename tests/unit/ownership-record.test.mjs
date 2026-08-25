import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'

import {
  TAKEOVER_DATE,
  TAKEOVER_EVIDENCE,
  UNEVIDENCED_HERITAGE_CLAIMS,
  THIRD_PARTY_CORROBORATED,
} from '../../src/data/ownershipRecord.js'

test('the takeover date is the one the prior principal gave', () => {
  assert.equal(TAKEOVER_DATE, '2015-03-15')
  assert.equal(TAKEOVER_EVIDENCE.thirdParty, true)
  assert.ok(TAKEOVER_EVIDENCE.corroboration, 'a third-party claim without the corroborating words')
})

test('the record admits the letter was never recovered', () => {
  // The exchange about a document is not the document. Saying so here stops a
  // later reader citing a filing that may never have been made.
  assert.equal(TAKEOVER_EVIDENCE.letterInHand, false)
  assert.equal(TAKEOVER_EVIDENCE.filingConfirmed, false)
})

test('the heritage claims stay owner-stated', () => {
  assert.ok(UNEVIDENCED_HERITAGE_CLAIMS.length >= 3)
  for (const c of UNEVIDENCED_HERITAGE_CLAIMS) {
    assert.equal(c.basis, 'owner-stated', `${c.claim} was quietly promoted`)
  }
  const claims = UNEVIDENCED_HERITAGE_CLAIMS.map((c) => c.claim).join(' ')
  assert.match(claims, /1984/, 'the founding year must stay listed as unevidenced')
  assert.match(claims, /4th generation/, 'the generation count must stay listed as unevidenced')
})

/**
 * The load-bearing one. One document proved one fact, and it sits beside fifty
 * pages of claims it does not cover. That adjacency is the risk.
 */
test('only the takeover date is marked third-party corroborated', () => {
  assert.deepEqual([...THIRD_PARTY_CORROBORATED], ['takeover-date'])
  for (const c of UNEVIDENCED_HERITAGE_CLAIMS) {
    assert.equal(
      THIRD_PARTY_CORROBORATED.has(c.claim),
      false,
      `${c.claim} was folded into the corroborated set`,
    )
  }
})

test('the founding year on the pages is not the takeover year', () => {
  // 1984 and 2015 are different facts about different events. A file that
  // conflated them would make the company 30 years younger or the evidence
  // 30 years stronger, and both are wrong.
  const info = readFileSync('src/lib/businessInfo.canonical.js', 'utf8')
  assert.match(info, /BUSINESS_FOUNDING_YEAR = '1984'/)
  assert.notEqual(TAKEOVER_DATE.slice(0, 4), '1984')
})
