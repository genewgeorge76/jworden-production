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
 * The 51-state table in another repository disagreed with the cited data on 21
 * of 51 states — Mississippi 90 days against 365, Utah 180 against 90, Texas
 * foreclosure 180 against 730, Rhode Island 40 against 365. It was rejected
 * rather than imported. These four are pinned so a future paste is caught.
 */
test('the rejected unsourced figures did not get in', () => {
  const bad = { MS: 90, UT: 180, RI: 40 }
  for (const [abbr, wrong] of Object.entries(bad)) {
    const row = lien.find((r) => r.abbr === abbr)
    assert.notEqual(row.lienFilingDeadlineDays === wrong && row.lienForeClosureDeadlineDays === wrong, true)
  }
  assert.equal(lien.find((r) => r.abbr === 'MS').lienFilingDeadlineDays, 365)
  assert.equal(lien.find((r) => r.abbr === 'UT').lienFilingDeadlineDays, 90)
  assert.equal(lien.find((r) => r.abbr === 'TX').lienForeClosureDeadlineDays, 730)
})

test('a gap in the source stays a gap', () => {
  // Kentucky states no foreclosure period. The old default silently supplied
  // 180 days for it and for the other 37 jurisdictions the table lacked.
  const ky = lien.find((r) => r.abbr === 'KY')
  assert.equal(ky.lienForeClosureDeadlineDays, null)
  assert.match(PY, /"KY": \{[^}]*"foreclosure_days": None/)
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
