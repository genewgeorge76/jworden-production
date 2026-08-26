import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { sourceWithoutComments } from '../helpers/source.mjs'

import {
  PUBLIC_RECORDS,
  VERIFIABLE,
  HELD,
  UNCONFIRMED,
  LAPSED,
  PUBLISHABLE,
  BRAND_JWORDEN,
  BRAND_CAROLINA,
  BRAND_SHARED,
  publishableFor,
  recordById,
} from '../../src/data/publicRecords.js'
import {
  WITHHELD_RECORDS,
  USDOT_UNPUBLISHED,
  SAFETY_AUDIT_2015,
  withheldById,
} from '../../src/data/publicRecordsWithheld.js'

test('every record carries a status the vocabulary recognises', () => {
  for (const r of [...PUBLIC_RECORDS, ...WITHHELD_RECORDS]) {
    assert.ok([VERIFIABLE, HELD, UNCONFIRMED, LAPSED].includes(r.status), `${r.id}: ${r.status}`)
    assert.ok([BRAND_JWORDEN, BRAND_CAROLINA, BRAND_SHARED].includes(r.brand), `${r.id} brand`)
    assert.ok(r.authority && r.kind && r.source, `${r.id} is missing provenance`)
    assert.match(r.sourceVerified, /^\d{4}-\d{2}-\d{2}$/, `${r.id} verification date`)
  }
})

/**
 * The load-bearing one. Only VERIFIABLE reaches a page, and VERIFIABLE means
 * a stranger can confirm it at the issuing authority — not that we hold a copy.
 */
test('only verifiable records are publishable', () => {
  assert.equal(PUBLISHABLE.has(HELD), false)
  assert.equal(PUBLISHABLE.has(UNCONFIRMED), false)
  assert.equal(PUBLISHABLE.has(LAPSED), false)
  for (const brand of [BRAND_JWORDEN, BRAND_CAROLINA]) {
    for (const r of publishableFor(brand)) {
      assert.equal(r.status, VERIFIABLE, `${r.id} reached a page at ${r.status}`)
      assert.ok(r.howToCheck, `${r.id} is publishable but says nothing about how to check it`)
      assert.ok(r.whyItMatters, `${r.id} is publishable with no reason to care`)
    }
  }
  assert.ok(WITHHELD_RECORDS.length > 0, 'nothing is withheld, which cannot be right')
  // The page-facing module must hold nothing but publishable rows.
  for (const r of PUBLIC_RECORDS) assert.equal(r.status, VERIFIABLE, `${r.id} sits in the bundled module`)
  for (const r of WITHHELD_RECORDS) {
    assert.equal(PUBLISHABLE.has(r.status), false, `${r.id} is withheld but publishable`)
    assert.ok(r.whyNotPublished, `${r.id} is withheld with no reason recorded`)
  }
})

/**
 * SCDOT belongs to the Carolina brand and Richmond belongs to J. Worden. Two
 * reasons, either sufficient: the sites must not run identical text, and the
 * permit says where the work was done.
 */
test('brand-specific records stay on their own site', () => {
  const carolina = publishableFor(BRAND_CAROLINA).map((r) => r.id)
  const jworden = publishableFor(BRAND_JWORDEN).map((r) => r.id)

  assert.ok(carolina.includes('scdot-211746'))
  assert.equal(jworden.includes('scdot-211746'), false, 'the SCDOT permit leaked onto the Virginia site')

  assert.ok(jworden.includes('richmond-encroachment-1360'))
  assert.equal(
    carolina.includes('richmond-encroachment-1360'),
    false,
    'the Richmond permit leaked onto the Carolina site',
  )

  // The federal number is one fact about one legal entity, so it is shared by
  // design — that is not the duplication the rule is about.
  assert.ok(carolina.includes('usdot-2568168'))
  assert.ok(jworden.includes('usdot-2568168'))
})

/**
 * NO CLAIM WITHOUT A NUMBER OR AN AUTHORITY THAT HOLDS IT
 * A record with no reference must at least say who to ask.
 */
test('published records are checkable', () => {
  for (const r of PUBLIC_RECORDS.filter((x) => x.status === VERIFIABLE)) {
    assert.ok(r.reference || r.verifyUrl, `${r.id} is published with nothing to look up`)
  }
})

/**
 * THE FMCSA SAFETY FIGURES MUST NEVER BE PUBLISHED
 * ────────────────────────────────────────────────
 * The SAFER snapshot reports 0 crashes, 0 out-of-service orders and a 0%
 * out-of-service rate. All true, all meaningless: the same record reports 0
 * inspections in the past two years. A 0% rate over an empty set is not a
 * safety record, and SAFER prints the national averages right beside it, so
 * publishing ours would read as outperformance where none has been measured.
 *
 * This test exists because those numbers are genuinely flattering and the
 * temptation to use them will recur.
 */
test('the FMCSA safety figures stay off the site', () => {
  const usdot = recordById('usdot-2568168')
  assert.equal(USDOT_UNPUBLISHED.usdot, usdot.reference)
  assert.equal(USDOT_UNPUBLISHED.inspectionsTwoYear, 0)
  assert.equal(USDOT_UNPUBLISHED.safetyRating, 'None')
  assert.match(USDOT_UNPUBLISHED.reason, /measures nothing|0 inspections/)

  // None of it may appear in what the component renders.
  const rendered = [usdot.plain, usdot.whyItMatters, usdot.howToCheck, usdot.headline].join(' ')
  assert.doesNotMatch(rendered, /out.of.service rate/i)
  assert.doesNotMatch(rendered, /0%/)
  assert.doesNotMatch(rendered, /crash/i)
  assert.doesNotMatch(rendered, /satisfactory/i)
  // For-hire authority is NOT held and must never be implied.
  assert.doesNotMatch(rendered, /for.hire|operating authority/i)
})

/**
 * The licence lapsed because the qualifying individual took out his own.
 * The remedy is in motion and that is still not a current licence.
 */
test('the DPOR licence is recorded lapsed and never published', () => {
  const dpor = withheldById('dpor-2705105644')
  assert.equal(dpor.status, LAPSED)
  assert.equal(PUBLISHABLE.has(dpor.status), false)
  assert.equal(dpor.remedyInMotion, true)
  assert.ok(dpor.whyNotPublished)
  assert.equal(publishableFor(BRAND_JWORDEN).some((r) => r.id === dpor.id), false)
  assert.equal(recordById('dpor-2705105644'), null, 'the lapsed licence is in the bundled module')
})

/**
 * The pages must not carry a present-tense Class A claim while the register
 * does not support one. Checked against the built source, not intentions.
 */
test('no page claims a current Class A licence', () => {
  for (const page of ['src/pages/Home.jsx', 'src/pages/MarketLanding.jsx']) {
    const src = readFileSync(page, 'utf8')
      // Strip comments — the reasoning quotes the phrase it forbids, and a
      // naive grep would fail on the explanation rather than on a claim.
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
    assert.doesNotMatch(src, /Class A [Ll]icensed/, `${page} still claims a current Class A licence`)
  }
})

/**
 * A private customer's street address does not become publishable because a
 * permit number is attached to it.
 */
test('the Richmond permit withholds the residential address', () => {
  const r = recordById('richmond-encroachment-1360')
  assert.equal(r.addressWithheld, true)
  assert.ok(r.addressWithheldReason)
  const rendered = [r.plain, r.whyItMatters, r.howToCheck, r.headline].join(' ')
  assert.doesNotMatch(rendered, /\d+\s+Maple/i, 'the street address reached the page')
})

/** The component may not widen what the data module allows. */
test('the component publishes only what publishableFor returns', () => {
  const src = readFileSync('src/components/PublicRecords.jsx', 'utf8')
  assert.match(src, /publishableFor\(brand\)/)
  assert.equal(/PUBLIC_RECORDS/.test(src), false, 'the component reads the unfiltered list')
  assert.equal(/unpublishedFields/.test(src), false, 'the component reaches into the withheld block')
})

/**
 * THE FILE BOUNDARY IS THE SECURITY BOUNDARY
 * ──────────────────────────────────────────
 * This started as a status flag in one module. The component honoured it and
 * the built bundle still contained the lapsed licence number and the sentence
 * explaining the lapse, because a bundler ships whole modules. "Not rendered"
 * is a claim about pixels, not about what leaves the server.
 *
 * So no page-facing file may import the withheld module, and that is checked
 * here rather than remembered.
 */
test('no page-facing code imports the withheld records', () => {
  const roots = ['src/pages', 'src/components', 'src/lib', 'src/data']
  const offenders = []
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, e.name)
      if (e.isDirectory()) walk(full)
      else if (/\.(jsx?|mjs)$/.test(e.name) && full !== 'src/data/publicRecordsWithheld.js') {
        // Comments name the module on purpose — the boundary is explained
        // where it is enforced. Strip them; an import is what matters. This is
        // the fifth time in this repository a text check has been fooled by
        // the comment describing the rule it enforces.
        if (/publicRecordsWithheld/.test(sourceWithoutComments(full))) offenders.push(full)
      }
    }
  }
  for (const r of roots) walk(r)
  assert.deepEqual(offenders, [], `withheld records reachable from page code: ${offenders.join(', ')}`)
})


/**
 * THE 2015 SAFETY AUDIT IS NOT A PUBLISHABLE CREDENTIAL, AND THE REASON IS
 * REGULATORY RATHER THAN ARCHIVAL
 * ────────────────────────────────────────────────────────────────────────
 * 49 CFR 385.319: a safety audit produces no safety fitness determination, and
 * the result reaches the carrier as written notice rather than a public field.
 * SAFER showing "Rating: None" is therefore expected and says nothing either
 * way.
 *
 * The owner's account — a trooper reviewed the findings on site and approved
 * the company — matches 385.319(a) exactly. It is still a recollection of
 * something said aloud, and "we passed our FMCSA safety audit" needs the
 * letter. This test keeps that distinction from eroding.
 */
test('the 2015 safety audit stays unpublished until the notice is in hand', () => {
  assert.equal(SAFETY_AUDIT_2015.resultInArchive, false)
  assert.equal(SAFETY_AUDIT_2015.publiclyRetrievable, false)
  assert.match(SAFETY_AUDIT_2015.whyNotPublic, /385\.319/)
  assert.ok(SAFETY_AUDIT_2015.publicSystemsChecked.length >= 4)

  // The on-site approval is owner-stated and must never be graded as the result.
  assert.equal(SAFETY_AUDIT_2015.onSiteReview.publishable, false)
  assert.match(SAFETY_AUDIT_2015.onSiteReview.basis, /owner-stated/)
  assert.match(SAFETY_AUDIT_2015.handedToDmv.basis, /owner-stated/)
  // The DMV date sequence is suggestive, and the caution against reading it as
  // proof is part of the record rather than left to the next reader.
  assert.ok(SAFETY_AUDIT_2015.handedToDmv.caution)

  // It is not a record in the publishable module under any id.
  assert.equal(PUBLIC_RECORDS.some((r) => /audit/i.test(r.kind)), false)

  // The mailbox sweep is a result in its own right: a negative that stops the
  // next reader spending an hour re-running it.
  assert.equal(SAFETY_AUDIT_2015.mailboxSwept.found, false)
  assert.equal(SAFETY_AUDIT_2015.mailboxSwept.coveredTrashAndSpam, true)
  assert.ok(SAFETY_AUDIT_2015.mailboxSwept.nextMailbox)
})

/**
 * The MCS-150 fleet figure was flagged as possibly stale and is not: the owner
 * sold trucks during the pandemic and runs one dump truck. The correction is
 * pinned so the earlier advice cannot be acted on by a later reader.
 */
test('the MCS-150 fleet figure is recorded as current, not stale', () => {
  assert.equal(USDOT_UNPUBLISHED.fleetFigureIsCurrent, true)
  assert.equal(USDOT_UNPUBLISHED.powerUnits, 1)
  assert.match(USDOT_UNPUBLISHED.fleetFigureBasis, /owner-stated/)
  assert.equal('ownerShouldReview' in USDOT_UNPUBLISHED, false, 'the retracted MCS-150 advice is still present')
})
