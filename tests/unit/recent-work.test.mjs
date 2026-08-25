/**
 * The gap years — 2022 to 2026.
 *
 * WHY THIS FILE IS THE ONE TO GET RIGHT
 * ─────────────────────────────────────
 * Every other record in this repository stops on 2022-04-04, when invoicing
 * moved off Kickserv. A reader asking "is this company still working?" finds a
 * documented history that ends four years ago — at exactly the moment the
 * business is opening a new market and wants to rank in it.
 *
 * That makes these five records disproportionately valuable, and disproportionately
 * tempting to overstate. So the tests pull hard in the opposite direction:
 *
 *   * No private individual may be named. Four of the five are homeowners.
 *   * A quote is not work. Only contracted and invoiced are publishable.
 *   * No dollar total. One materials figure is known; summing it into a period
 *     revenue number would invent a meaning the evidence does not carry.
 *   * The file must keep saying it is correspondence, not a ledger.
 */
import assert from 'node:assert/strict'
import test from 'node:test'

const M = await import('../../src/data/recentWork.js')
const invoiceRecord = await import('../../src/data/invoiceRecord.js')

test('these records start where the invoice ledger stops', () => {
  assert.equal(M.LEDGER_ENDS, invoiceRecord.LAST_INVOICE)
  for (const row of M.RECENT_WORK) {
    assert.ok(row.date > M.LEDGER_ENDS, `${row.ref} is inside the period the ledger already covers`)
  }
})

test('the gap is actually closed — there is a record after 2024', () => {
  const recent = M.RECENT_WORK.filter((r) => r.date >= '2025-01-01')
  assert.ok(recent.length >= 2, 'two or more records since 2025 is the minimum that reads as active')
  assert.ok(M.mostRecent() > '2026-01-01', 'nothing from the current year')
})

// ── Privacy ──────────────────────────────────────────────────────────────────

test('no private individual is named anywhere in the file', () => {
  for (const row of M.RECENT_WORK) {
    if (row.clientType === 'residential') {
      assert.equal(row.client, null, `${row.ref} names a homeowner`)
    }
  }
  const text = JSON.stringify(M.RECENT_WORK)
  // The four real people behind these records. None may appear.
  for (const name of ['Garcia', 'Jonathan', 'Patten', 'Pinotti', 'Caroline', "O'Connor", 'Tim']) {
    assert.ok(!new RegExp(`\\b${name}\\b`).test(text), `a person's name reached the record: ${name}`)
  }
})

test('no email address or phone number is carried through', () => {
  const text = JSON.stringify(M.RECENT_WORK)
  assert.ok(!/@[a-z0-9.-]+\.[a-z]{2,}/i.test(text), 'an email address is in the record')
  assert.ok(!/\b\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}\b/.test(text), 'a phone number is in the record')
})

test('companies ARE named, because a company that signs is a reference', () => {
  const named = M.namedClients()
  assert.ok(named.includes('OS Steel PM'))
  assert.ok(named.includes('Hardrock Construction Services LLC'))
})

// ── Grading ──────────────────────────────────────────────────────────────────

test('a quote is not publishable work', () => {
  const publishable = M.publishableRecentWork()
  assert.ok(publishable.every((r) => r.evidence !== M.QUOTED))
  assert.ok(publishable.length >= 2)
  assert.ok(publishable.length < M.RECENT_WORK.length, 'everything published means nothing was graded')
})

test('the signed estimate is graded contracted, not invoiced', () => {
  /**
   * It was countersigned and materials were bought against it. It was not
   * invoiced as a completed job, and the client deferred the base install —
   * so `contracted` is the honest ceiling.
   */
  const signed = M.RECENT_WORK.find((r) => r.ref === 'Estimate 2832')
  assert.equal(signed.evidence, M.CONTRACTED)
  assert.match(signed.detail, /signed/i)
})

// ── No invented totals ───────────────────────────────────────────────────────

test('no period revenue figure is exported', () => {
  assert.equal(M.TOTAL_USD, undefined)
  assert.equal(M.RECENT_TOTAL, undefined)
  assert.equal(M.GAP_REVENUE, undefined)
})

test('the one dollar figure present is labelled as materials, not job value', () => {
  const signed = M.RECENT_WORK.find((r) => r.ref === 'Estimate 2832')
  assert.match(signed.detail, /\$1,875/)
  assert.match(signed.detail, /crushed concrete|rock|material/i)
})

// ── It must keep admitting what it is ────────────────────────────────────────

test('the file says it is correspondence, not a ledger', () => {
  assert.equal(M.SOURCE, 'correspondence')
  assert.match(M.GAP_NOTE, /not a complete record/i)
})

test('every record cites where it came from', () => {
  for (const row of M.RECENT_WORK) {
    assert.ok(row.source && row.source.length > 20, `${row.ref} has no usable source`)
    assert.ok(row.detail.length > 80, `${row.ref} is too thin to be worth publishing`)
  }
})

test('the Michigan brand is recorded as trading, which is what the domains needed', () => {
  const mi = M.RECENT_WORK.find((r) => r.brand === 'Michigan Paving Pros')
  assert.ok(mi, 'the Michigan record is gone')
  assert.match(mi.detail, /parking page|customer base/i)
})
