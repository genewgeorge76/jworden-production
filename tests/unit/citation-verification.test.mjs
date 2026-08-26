import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

import { pythonSourceWithoutComments } from '../helpers/source.mjs'

const { VERIFIED_CITATIONS, UNVERIFIABLE_SOURCES, verificationFor } = await import(
  '../../src/data/legal/citationVerification.js'
)
const lien = (await import('../../src/data/legal/mechanicsLienLaws.js')).default
const PY = readFileSync('app/services/legal_tables.py', 'utf8')

/**
 * Every row in these datasets carried lastVerified: '2026-01-01' — all 510 of
 * them, the same date, across twelve topics and fifty-one jurisdictions.
 * Nothing distinguished a citation somebody had opened from one nobody had.
 *
 * These hold the verification record to being a record: evidence per row, and
 * silence where there is none.
 */
test('a verified citation carries the evidence, not just a date', () => {
  assert.ok(VERIFIED_CITATIONS.length > 0)
  for (const v of VERIFIED_CITATIONS) {
    assert.ok(v.source?.startsWith('https://'), `${v.abbr} has no source URL`)
    assert.ok(v.quote?.length > 20, `${v.abbr} records no quoted text`)
    assert.ok(v.heading, `${v.abbr} does not name the section it read`)
    assert.match(v.checked, /^\d{4}-\d{2}-\d{2}$/)
    assert.ok(['confirmed', 'corrected'].includes(v.verdict), `${v.abbr} has no verdict`)
  }
})

test('every source read is an official state source', () => {
  // Not a summary site, not an aggregator. The statute or nothing.
  //
  // The first version of this test required `.gov` and failed on Florida,
  // whose legislature publishes at leg.state.fl.us. That is the official
  // source; the rule was wrong, not the citation. Several states still use the
  // older .state.XX.us convention, so both forms count.
  for (const v of VERIFIED_CITATIONS) {
    assert.match(
      v.source,
      /\.gov\/|\.state\.[a-z]{2}\.us\//,
      `${v.abbr} was checked against ${v.source}, which is not an official state source`,
    )
  }
})

test('a jurisdiction that could not be read says why', () => {
  assert.ok(UNVERIFIABLE_SOURCES.length > 0)
  for (const u of UNVERIFIABLE_SOURCES) {
    assert.ok(u.reason?.length > 30, `${u.abbr} is listed unverifiable with no reason`)
    assert.equal(
      VERIFIED_CITATIONS.some((v) => v.abbr === u.abbr),
      false,
      `${u.abbr} is both verified and unverifiable`,
    )
  }
})

/**
 * VIRGINIA IS THE ONE THAT WAS WRONG
 * ──────────────────────────────────
 * The note said "90 days from last furnishing". Va. Code § 43-4 says the
 * ninety days runs from the last day of the MONTH in which work ended, and
 * imposes a second cap at 90 days from completion, whichever expires first.
 *
 * On the owner's home state. Named explicitly because a general rule that
 * passes is easy to weaken by accident.
 */
test('Virginia carries the month-end anchor and the completion cap', () => {
  const va = lien.find((r) => r.abbr === 'VA')
  assert.equal(va.lienFilingDeadlineAnchor, 'month_end_of_last_furnishing')
  assert.deepEqual(va.lienFilingAlsoCappedBy, { days: 90, from: 'completion' })
  assert.match(va.lienFilingDeadlineNote, /last day of the month/)
  assert.match(va.lienFilingDeadlineNote, /whichever comes first/)
  assert.equal(/^90 days from last furnishing/.test(va.lienFilingDeadlineNote), false)

  const record = verificationFor('VA')
  assert.equal(record.verdict, 'corrected')
  assert.match(record.quote, /last day of the month/)

  assert.match(PY, /"month_end_of_last_furnishing"/)
  assert.match(PY, /"lien_filing_also_capped_by"/)
})

test('the four states that matched are recorded as confirmed, not corrected', () => {
  // NC 120, FL 90, MD 180, MN 120 — each read against the statute and each
  // matching the dataset. A verification pass that finds nothing is a result.
  for (const abbr of ['NC', 'FL', 'MD', 'MN']) {
    const v = verificationFor(abbr)
    assert.ok(v, `${abbr} has no verification record`)
    assert.equal(v.verdict, 'confirmed')
    const row = lien.find((r) => r.abbr === abbr)
    assert.ok(
      v.quote.includes(String(row.lienFilingDeadlineDays)),
      `${abbr}: the quoted statute does not contain the dataset's figure`,
    )
  }
})

/**
 * The cap shortens a deadline. Applying it from a date the caller did not
 * supply would present a guess as the statute's answer — and in the one
 * direction a lien calendar must never be wrong in.
 */
test('a second cap is only applied from a date that was actually supplied', () => {
  const calc = pythonSourceWithoutComments('app/services/lien_calendar.py')
  assert.match(calc, /cap_from = completion_date if cap\["from"\] == "completion"/)
  // When it cannot be evaluated it is reported, not dropped.
  assert.match(calc, /may expire first; supply completion_date/)
})

test('the blanket verification date is not treated as evidence anywhere', () => {
  const src = readFileSync('src/data/legal/citationVerification.js', 'utf8')
  assert.match(src, /2026-01-01/, 'the file no longer explains what the blanket date was')
  // The record must be shorter than the dataset. If it ever claims all 51,
  // something filled it in rather than reading them.
  assert.ok(
    VERIFIED_CITATIONS.length < lien.length,
    'the verification record claims every jurisdiction was read',
  )
})
