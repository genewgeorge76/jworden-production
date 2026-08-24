/**
 * The Bear Claw record — the origin of the restaurant work.
 *
 * The owner's account is "we did all the KFCs in Virginia for Bear Claw
 * Construction, they were the first ones". The archive supports the FIRST part
 * of that flatly — a sent email, at the time, in the company's own words,
 * saying one named restaurant was completed — and does not support a count.
 *
 * These tests exist to keep those two apart. The failure mode this repository
 * keeps hitting is a true statement growing a number, and a number is the one
 * thing this file may not acquire.
 */
import assert from 'node:assert/strict'
import test from 'node:test'

const M = await import('../../src/data/bearClawOrigin.js')

test('the first job is graded on the company\'s own word, at the time', () => {
  assert.equal(M.FIRST_JOB.evidence, 'completed')
  assert.equal(M.FIRST_JOB.completedOn, '2013-06-15')
  assert.match(M.FIRST_JOB.source, /completed/i)
})

test('it predates both the KBP programme and the job book', () => {
  // First Kickserv invoice: 2014-10-08. KBP pilot survey: 2015.
  assert.ok(M.FIRST_JOB.completedOn < '2014-10-08')
})

test('no street number is invented for an address the email left partial', () => {
  assert.equal(M.FIRST_JOB.street, 'Azalea Avenue')
  assert.ok(!/\d/.test(M.FIRST_JOB.street), 'the email says "azalea ave." and no number')
})

test('no count of Virginia restaurants is stated anywhere in the module', () => {
  const text = JSON.stringify(M.FIRST_JOB) + M.PUBLISHABLE_LINE + JSON.stringify(M.ONBOARDING)
  assert.ok(
    !/\b(\d+)\+?\s*(kfc|restaurant|location|store)/i.test(text),
    'the archive evidences one completed and one more contracted — not a count',
  )
})

test('no dollar figure is attached to a subcontract whose value is not in the archive', () => {
  const text = JSON.stringify(M)
  assert.ok(!/\$\s?[\d,]/.test(text), 'subcontract 13-076 is named; its value is not')
})

test('the general contractor is a company, and is named as one', () => {
  assert.match(M.CLIENT.name, /LLC$/)
  assert.equal(M.CLIENT.state, 'MO')
})

test('the paperwork runs in order and lands on the completion', () => {
  const dates = M.ONBOARDING.map((s) => s.date)
  assert.deepEqual([...dates].sort(), dates, 'onboarding steps must be chronological')
  assert.equal(dates.at(-1), M.FIRST_JOB.completedOn)
})
