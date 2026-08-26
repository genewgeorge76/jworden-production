import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { sourceWithoutComments } from '../helpers/source.mjs'

import {
  GBP_QUERY_PERFORMANCE,
  QUERY_CHARACTER,
  GBP_CONVERSION,
  GBP_REVIEWS_2019_2020,
  GBP_TIMELINE,
  GBP_PROFILES_SEEN,
  SEARCH_CONSOLE_PROPERTIES,
  SUMMARY,
} from '../../src/data/searchPresence.js'

/**
 * OPERATOR INTELLIGENCE, NOT PAGE CONTENT
 * ───────────────────────────────────────
 * Measured query volumes, review complaints and indexing faults have no place
 * on a website — publishing our own impression counts is a gift to a
 * competitor, and a customer's complaint is not marketing copy. Enforced as a
 * file boundary because a bundler ships whole modules and "we would never
 * render it" is a statement about pixels, not about what leaves the server.
 */
test('no page-facing code imports the search presence record', () => {
  const offenders = []
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, e.name)
      if (e.isDirectory()) walk(full)
      else if (/\.(jsx?|mjs)$/.test(e.name) && full !== 'src/data/searchPresence.js') {
        if (/searchPresence/.test(sourceWithoutComments(full))) offenders.push(full)
      }
    }
  }
  for (const r of ['src/pages', 'src/components', 'src/lib', 'src/data']) walk(r)
  assert.deepEqual(offenders, [], `search presence reachable from page code: ${offenders.join(', ')}`)
})

/** Every query figure is Google's own, so each month must name its source month. */
test('the performance record is month-stamped and query-level', () => {
  assert.ok(GBP_QUERY_PERFORMANCE.length >= 5)
  for (const m of GBP_QUERY_PERFORMANCE) {
    assert.match(m.month, /^\d{4}-\d{2}$/)
    assert.ok(m.topQueries.length > 0)
    for (const q of m.topQueries) {
      assert.ok(typeof q.query === 'string' && q.query.length > 0)
      // `people` may be null where Google reported a band rather than a count.
      assert.ok(q.people === null || Number.isInteger(q.people))
    }
  }
  // The best recorded month, kept as a fixed point.
  const nov = GBP_QUERY_PERFORMANCE.find((m) => m.month === '2019-11')
  assert.equal(nov.topQueries[0].query, 'asphalt paving richmond va')
  assert.equal(nov.topQueries[0].people, 19)
})

/**
 * The finding that matters most: every query Google reported is residential
 * and local. Commercial intent never appears. That corroborates the customer
 * archive from Google's side rather than from ours, and it must not quietly
 * flip to "we rank for commercial" without new data.
 */
test('the residential-only character of the measured queries is pinned', () => {
  assert.equal(QUERY_CHARACTER.allResidentialAndLocal, true)
  assert.equal(QUERY_CHARACTER.noCommercialQueriesRecorded, true)
  const all = GBP_QUERY_PERFORMANCE.flatMap((m) => m.topQueries.map((q) => q.query)).join(' ')
  assert.doesNotMatch(all, /commercial|parking lot|multi.site|franchise/i)
})

/** Ranking without conversion proves nothing; both are on the record. */
test('the profile is recorded as having converted, not merely appeared', () => {
  assert.ok(GBP_CONVERSION.quoteRequestsThroughProfile.length >= 2)
  assert.equal(GBP_CONVERSION.photoPerformance.views, 649)
  assert.equal(SUMMARY.rankedPreviously, true)
  assert.equal(SUMMARY.convertedPreviously, true)
})

/**
 * A dissatisfied customer is not named in this repository. The substance of
 * the complaint is the useful part and the name is not.
 */
test('review complaints are recorded without naming anyone', () => {
  assert.equal(GBP_REVIEWS_2019_2020.fiveStar.count, 5)
  assert.equal(GBP_REVIEWS_2019_2020.oneStar.count, 2)
  assert.ok(GBP_REVIEWS_2019_2020.complaintSubstance.length >= 2)
  const blob = JSON.stringify(GBP_REVIEWS_2019_2020)
  // No capitalised first-name-plus-surname pairs anywhere in the review block.
  assert.doesNotMatch(blob, /\b[A-Z][a-z]+ [A-Z][a-z]+\b/)
})

/**
 * THE LINE BETWEEN WHAT WAS MEASURED AND WHAT IS TRUE NOW
 * The archive stops in February 2020. Anything after that is unmeasured, and
 * this record must keep saying so rather than letting a 2019 result read as a
 * present-tense claim.
 */
test('present performance is explicitly recorded as unknown', () => {
  assert.equal(SUMMARY.presentPerformanceUnknown, true)
  assert.equal(SUMMARY.measurementEndsAt, '2020-02-13')
  assert.ok(SUMMARY.presentPerformanceNote)
  assert.ok(SUMMARY.blockersInOrder.length >= 4)
  assert.match(SUMMARY.blockersInOrder[0], /parking|Sedo/i)
})

/** The unwatched Search Console property, and the fact it was unknown here. */
test('the Atlanta Search Console property is recorded as unknown to the repo', () => {
  const [p] = SEARCH_CONSOLE_PROPERTIES
  assert.equal(p.property, 'atlantaasphaltpavingpros.com')
  assert.equal(p.verified, '2024-07-05')
  assert.equal(p.inDomainsInventory, false)
  assert.equal(p.auditedAsLiveSite, false)
  assert.ok(p.messages.some((m) => /prevent pages from being indexed/i.test(m.type)))
  // It really is absent from the inventory doc — asserted, not assumed.
  const inv = readFileSync('docs/DOMAINS_INVENTORY.md', 'utf8')
  assert.equal(inv.includes('atlantaasphaltpavingpros.com'), false)
})

/** Three profile names for one business is a finding, not a footnote. */
test('the multiple Business Profiles are recorded', () => {
  assert.ok(GBP_PROFILES_SEEN.length >= 3)
  for (const p of GBP_PROFILES_SEEN) assert.ok(p.name && p.evidence)
  assert.ok(GBP_TIMELINE.some((e) => /Verify your Business Profile/i.test(e.event)))
})
