import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'

import { SAME_AS, AGGREGATE_RATING, BUSINESS_LEGAL_NAME } from '../../src/lib/businessInfo.canonical.js'

const LANDING = readFileSync('src/pages/MarketLanding.jsx', 'utf8')

/**
 * The brand sites build their own JSON-LD instead of reusing HomeSchema, which
 * is how sameAs and aggregateRating came to exist in the codebase and reach no
 * brand page. Fourteen verified citations and a real rating were invisible to
 * Google on carolinablacktop.com, savannahasphaltpaving.com and the rest.
 */
test('brand sites emit the citation glue', () => {
  assert.match(LANDING, /sameAs: SAME_AS/)
  assert.match(LANDING, /AggregateRating/)
  assert.match(LANDING, /legalName: BUSINESS_LEGAL_NAME/)
})

test('the citations are real profiles, not placeholders', () => {
  assert.ok(SAME_AS.length >= 8, 'the citation list shrank')
  for (const url of SAME_AS) {
    assert.match(url, /^https:\/\//, `${url} is not a URL`)
    assert.equal(/example\.com|placeholder|yourbusiness/i.test(url), false, `${url} is a placeholder`)
  }
  assert.equal(new Set(SAME_AS).size, SAME_AS.length, 'a citation is listed twice')
})

/**
 * A rating is the single easiest thing on a contractor site to invent, and
 * Google penalises invented ones specifically. This one comes from reviews.js,
 * which carries the rule in writing: only entries that exist on a real public
 * profile.
 */
test('the rating is sourced and internally consistent', () => {
  const value = Number(AGGREGATE_RATING.ratingValue)
  const count = Number(AGGREGATE_RATING.reviewCount)
  assert.ok(value > 0 && value <= 5, 'rating is outside the possible range')
  assert.ok(count > 0, 'a rating with no reviews behind it')
  assert.equal(AGGREGATE_RATING.bestRating, '5')
  // A suspiciously perfect score across many reviews is the shape of an
  // invented one. This is 4.4 across 78 and should stay honest if it changes.
  if (count >= 20) assert.ok(value < 5, 'a perfect score across many reviews needs checking')
})

test('the legal entity ties the brands together', () => {
  // Each market trades under its own name. One legal name across all of them
  // is what tells Google this is one business, not several thin ones.
  assert.match(BUSINESS_LEGAL_NAME, /Worden/)
  assert.match(LANDING, /BUSINESS_LEGAL_NAME/)
})
