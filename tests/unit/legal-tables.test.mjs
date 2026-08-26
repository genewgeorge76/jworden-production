import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

import { pythonSourceWithoutComments } from '../helpers/source.mjs'

const PY = readFileSync('app/services/legal_tables.py', 'utf8')
const lien = (await import('../../src/data/legal/mechanicsLienLaws.js')).default
const wage = (await import('../../src/data/legal/prevailingWage.js')).default
const licensing = (await import('../../src/data/legal/constructionLicensing.js')).default

/**
 * The Python half of the legal advisor used to keep its own copies of this
 * data — 13 states in the lien calculator, 3 in the compliance ability. Both
 * were quietly short, and the way you find out a lien table is short is a
 * missed filing deadline.
 *
 * These tests hold the generated file to the cited source it came from.
 */
test('every jurisdiction in the cited data reaches the Python tables', () => {
  assert.equal(lien.length, 51)
  for (const row of lien) {
    assert.ok(PY.includes(`"${row.abbr}":`), `${row.abbr} is missing from LIEN_LAWS`)
  }
  for (const row of wage) assert.ok(PY.includes(`"${row.abbr}":`), `${row.abbr} missing from wage`)
  for (const row of licensing) {
    assert.ok(PY.includes(`"${row.abbr}":`), `${row.abbr} missing from licensing`)
  }
  assert.match(PY, /JURISDICTION_COUNT = 51/)
})

test('every lien row carries the citation and verification date it had', () => {
  // A number without a citation is the unsourced table this replaced.
  for (const row of lien) {
    assert.ok(row.citation, `${row.abbr} has no citation in the source`)
    assert.ok(PY.includes(JSON.stringify(row.citation)), `${row.abbr} lost its citation`)
  }
  assert.ok(PY.includes('"last_verified"'))
})

/**
 * THE UNSOURCED TABLE WAS RIGHT ABOUT UTAH, AND THAT IS WORTH RECORDING
 * ────────────────────────────────────────────────────────────────────
 * A 51-state lien table in another repository disagreed with the cited data on
 * 21 of 51 states, carried no citations, and was rejected rather than imported.
 * This test pinned three of those disagreements so a future paste would be
 * caught — including Utah, where the other table said 180 days and the cited
 * dataset said 90.
 *
 * Reading Utah Code § 38-1a-502(1) settled it: 180 days after final completion
 * where no notice of completion is filed, and 90 only once one is. The other
 * table had it right. The cited dataset had the exception recorded as the rule.
 *
 * The rejection was still the correct call — an unsourced figure cannot be
 * trusted because it happens to be right, and being right about Utah says
 * nothing about the other twenty. But it does mean the cited dataset does not
 * automatically win a disagreement, and the remaining twenty are now open
 * questions rather than settled ones.
 *
 * The pins that survive are the ones a statute has since confirmed.
 */
test('a disagreement is settled by the statute, not by which file it came from', () => {
  // Utah: read, and the answer was 180. This pin now records the statute.
  assert.equal(lien.find((r) => r.abbr === 'UT').lienFilingDeadlineDays, 180)
  assert.equal(lien.find((r) => r.abbr === 'UT').lienFilingShortenedBy.days, 90)

  // Mississippi and Texas remain as the cited dataset has them; neither
  // statute has been read, so neither figure is more than a starting point.
  assert.equal(lien.find((r) => r.abbr === 'MS').lienFilingDeadlineDays, 365)
  assert.equal(lien.find((r) => r.abbr === 'TX').lienForeClosureDeadlineDays, 730)
})

/**
 * A GAP MUST STAY A GAP — BUT KENTUCKY WAS NOT ONE
 * ────────────────────────────────────────────────
 * This test used to pin Kentucky's null foreclosure period as the example,
 * on the reading that the source stated none. Reading KRS 376.090(1) showed
 * otherwise: the lien dissolves unless an action is brought "within twelve
 * (12) months from the day of filing the statement". The null was a defect,
 * and this test was holding it in place.
 *
 * An absent deadline is worse than a wrong one. A wrong number is something a
 * reader checks; an absent one reads as "this state has no limit", which
 * nobody goes looking to disprove. Every jurisdiction now states a foreclosure
 * period, so the rule is asserted on its own terms rather than through an
 * example that turned out to be an error.
 */
test('a gap in the source stays a gap, and is never a silent one', () => {
  // No foreclosure period may be null any more — the one that was has been read.
  for (const row of lien) {
    assert.notEqual(
      row.lienForeClosureDeadlineDays,
      null,
      `${row.abbr} states no enforcement deadline, which reads as "no limit"`,
    )
  }
  // Where a filing period is null it is because the row states months instead,
  // never because nothing was recorded.
  for (const row of lien.filter((r) => r.lienFilingDeadlineDays === null)) {
    assert.ok(
      row.lienFilingDeadlineMonths,
      `${row.abbr} has neither a day count nor a month count`,
    )
  }
  // Topics no cited dataset covers are named rather than left to be inferred.
  assert.match(PY, /UNCOVERED_TOPICS/)
  assert.match(PY, /retainage_limit/)
})

/**
 * Texas is the one that mattered most. The rule is the 15th day of the 4th
 * calendar month after completion; the old table stored `lien_filing_days: 15`
 * and computed last furnishing plus fifteen days — about three and a half
 * months early, on the state with more documented work than anywhere outside
 * Virginia.
 */
test('a calendar-month rule is stored as one, not flattened to days', () => {
  assert.match(PY, /"kind": "calendar_month_day"/)
  assert.match(PY, /"months_after": 4/)
  assert.match(PY, /"residential_months_after": 3/)
  const calc = pythonSourceWithoutComments('app/services/lien_calendar.py')
  assert.match(calc, /_add_months/)
  assert.match(calc, /calendar_month_day/)
})

test('deadlines are counted from what the source says they are counted from', () => {
  const calc = pythonSourceWithoutComments('app/services/lien_calendar.py')
  // Nine states count filing from completion, not last furnishing, and
  // Virginia's preliminary notice runs from last furnishing, not project start.
  assert.match(calc, /_anchor_date/)
  assert.match(PY, /"lien_filing_anchor"/)
  assert.match(PY, /"preliminary_notice_anchor"/)
  const completion = lien.filter((r) => /completion|work completed/i.test(r.lienFilingDeadlineNote ?? ''))
  assert.ok(completion.length >= 9, 'the completion-anchored states vanished from the source')
})

test('the calculator no longer substitutes a default for an unknown state', () => {
  const calc = pythonSourceWithoutComments('app/services/lien_calendar.py')
  assert.equal(/_DEFAULT_LAW/.test(calc), false, 'the 90/180 default is back')
  assert.match(calc, /"known": False/)
})

test('the compliance ability is no longer a three-state demonstration', () => {
  const src = pythonSourceWithoutComments(
    'app/jarvis_os/abilities/LegalAndCompliance/state_51_compliance_engine.py',
  )
  assert.equal(/Hardcoded database/i.test(src), false)
  // It used to tell 48 jurisdictions it was falling back on federal guidelines
  // it did not have.
  assert.equal(/Reverting to Federal default/i.test(src), false)
  assert.match(src, /from \.\.\.\.services\.legal_tables import/)
  assert.match(src, /UNCOVERED_TOPICS/)
})

test('retainage is reported as uncovered rather than answered', () => {
  const src = pythonSourceWithoutComments(
    'app/jarvis_os/abilities/LegalAndCompliance/state_51_compliance_engine.py',
  )
  // The old three-state table was the only place a statutory retainage limit
  // appeared anywhere in this repository, and it was not sourced.
  assert.equal(/'10%'|"10%"|'5%'|"5%"/.test(src), false, 'a retainage percentage is back')
  assert.match(src, /not covered by any cited dataset/)
})

test('the generated file says it is generated', () => {
  assert.match(PY, /GENERATED\. Do not hand-edit/)
  assert.match(PY, /build-python-legal-tables\.mjs/)
})

/**
 * QUOTING THE STATUTE MUST NOT COST THE ROW ITS MEANING
 * ────────────────────────────────────────────────────
 * Rewriting North Dakota's note to the statute's own words — "contribution is
 * done" instead of "last furnishing" — stopped the anchor parser recognising
 * it, and the calculator silently returned no filing date at all. New
 * Hampshire did the same thing in the same commit.
 *
 * The parser reads prose, so improving the prose can break it. Every row must
 * resolve an anchor from somewhere: its own explicit field, its rule, or the
 * note. None may resolve from nothing.
 */
test('every jurisdiction resolves a filing anchor', () => {
  const rows = [...PY.matchAll(/"([A-Z]{2})": \{(.*?)\},\n/gs)]
  assert.ok(rows.length >= 51)
  for (const row of lien) {
    const hasExplicit = Boolean(row.lienFilingDeadlineAnchor)
    const noteHasAnchor = /last furnish|last (date|day)|completion|work completed|providing/i.test(
      row.lienFilingDeadlineNote ?? '',
    )
    const hasMonths = Boolean(row.lienFilingDeadlineMonths)
    assert.ok(
      hasExplicit || noteHasAnchor || hasMonths,
      `${row.abbr} states no anchor its calculator can use`,
    )
  }
})

test('an owner-controlled shortening is never silently absorbed', () => {
  // Four kinds of fact the owner or the project controls, none computed:
  // a notice of completion, a notice of substantial completion, a written
  // demand forcing suit, and the project type.
  assert.match(PY, /"lien_filing_shortened_by"/)
  assert.match(PY, /"enforcement_accelerated_by"/)
  assert.match(PY, /"lien_filing_by_project_type"/)
  const calc = pythonSourceWithoutComments('app/services/lien_calendar.py')
  assert.match(calc, /enforcement can be cut to/)
  assert.match(calc, /the period depends on the project type/)
})
