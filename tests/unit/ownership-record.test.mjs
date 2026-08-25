import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import {
  TAKEOVER_DATE,
  TAKEOVER_EVIDENCE,
  UNEVIDENCED_HERITAGE_CLAIMS,
  THIRD_PARTY_CORROBORATED,
  TRADE_EXPERIENCE,
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

/**
 * Three facts, three evidence levels. The estate ended up claiming four
 * different company ages by collapsing them, so these guard the separation.
 */
test('trade experience is not company tenure', () => {
  assert.notEqual(TRADE_EXPERIENCE.startedApprox, 1984, 'the founding year and the trade start are different facts')
  assert.equal(TRADE_EXPERIENCE.basis, 'owner-stated')
  assert.ok(TRADE_EXPERIENCE.yearsInTrade > 30)
})

test('the early towns are biography, never markets', () => {
  // Summer work by a teenager three decades ago. Publishing these as service
  // areas is the Atlanta forty-years error in a different costume.
  assert.equal(TRADE_EXPERIENCE.publishableAsMarkets, false)
  assert.equal(TRADE_EXPERIENCE.publishableAs, 'experience')

  const dir = 'src/data'
  const towns = TRADE_EXPERIENCE.earlyPlaces.map((p) => p.split(',')[0].trim())
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.js') && f !== 'ownershipRecord.js')) {
    const text = readFileSync(join(dir, file), 'utf8')
    for (const town of towns) {
      if (town === 'Franklin') continue // a common name; Franklin County VA is separately evidenced
      assert.equal(text.includes(town), false, `${town} is teenage summer work but appears in ${file}`)
    }
  }
})

test('the generation count is still not inferred from the grandfather', () => {
  // He worked with his grandfather. That does not settle four versus five,
  // and a repository that counted generations off it would be guessing.
  assert.equal(TRADE_EXPERIENCE.workedWith, 'his grandfather')
  const gen = UNEVIDENCED_HERITAGE_CLAIMS.find((c) => c.claim === '4th generation')
  assert.equal(gen.basis, 'owner-stated', 'the generation count was resolved by inference')
})
