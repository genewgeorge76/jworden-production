/**
 * The Carolina record, from the Joist archive.
 *
 * carolinaRegions.js said in its own header that South Carolina rested on the
 * owner's word and that proof would be added when the carolinablacktop archive
 * turned up. It turned up: 83 documents, 2019 to 2026.
 *
 * WHAT THESE TESTS EXIST TO STOP
 * ──────────────────────────────
 * Two of the 23 invoices carry a dollar amount. Summing them gives $10,285.00 —
 * real arithmetic, and the wrong number, because it describes 2 documents out
 * of 23 while looking like the Carolina revenue. That is the same trap as the
 * $41,295,234.93 charge-line sum, and the tests below make it unrepresentable
 * rather than merely discouraged.
 *
 * And one client sent a termination and refund demand. It stays out.
 */
import assert from 'node:assert/strict'
import test from 'node:test'

const M = await import('../../src/data/carolinaBlacktopRecord.js')

test('the total counts JOBS, not documents', () => {
  /**
   * 23 invoice documents describe 18 jobs, because Joist issues an invoice and
   * then a payment receipt for the same work and each carries the full total.
   * Summing documents gives $207,050; summing jobs gives $155,300.
   */
  assert.equal(M.INVOICE_DOCUMENTS, 23)
  assert.equal(M.INVOICE_COUNT, 18)
  assert.equal(M.INVOICED_USD, 155300)
})

test('the double-counted document sum appears nowhere', () => {
  const text = JSON.stringify(M) + M.PUBLISHABLE_LINE
  for (const shape of ['207050', '207,050']) {
    assert.ok(!text.includes(shape), `the inflated document sum leaked in: ${shape}`)
  }
})

test('payment status is not recorded in either direction', () => {
  const text = JSON.stringify(M)
  assert.equal(M.OUTSTANDING_USD, undefined)
  assert.equal(M.PAID_USD, undefined)
  for (const shape of ['138017', '138,017', '69,033', '69033']) {
    assert.ok(!text.includes(shape), `a payment figure leaked in: ${shape}`)
  }
})

test('the publishable line states jobs, the total and the permit', () => {
  assert.match(M.PUBLISHABLE_LINE, /18 invoiced Carolina jobs/)
  assert.match(M.PUBLISHABLE_LINE, /155,300/)
  assert.match(M.PUBLISHABLE_LINE, /SCDOT/)
})

test('the trading-name sequence is the one the mailbox supports', () => {
  /**
   * The second extraction recorded "Carolina Asphalt Paving Pros" on every
   * document including 2023 ones. The email subject for estimate 2800, dated
   * 2024-04-24, reads "Your estimate 2800 from Carolina Blacktop". A tidier
   * column is not always a truer one.
   */
  assert.equal(M.TRADING_NAMES[0], 'Carolina Blacktop')
  assert.match(M.TRADING_NAME_SOURCE, /Email subject/i)
})

// ── The SCDOT permit ─────────────────────────────────────────────────────────

test('the permit is recorded with its reference, so it can be checked', () => {
  assert.match(M.SCDOT_PERMIT.reference, /211746/)
  assert.match(M.SCDOT_PERMIT.authority, /South Carolina Department of Transportation/)
  assert.equal(M.SCDOT_PERMIT.evidence, 'completed')
  assert.ok(M.SCDOT_PERMIT.archived > M.SCDOT_PERMIT.applied)
})

test('the permit is described as third-party verification, because that is what it is', () => {
  /**
   * Everything else here rests on our own documents. A state agency archiving
   * a permit is somebody else's record, and that is the whole reason it
   * outweighs a year of driveways for a contractor arguing capability to a
   * public body.
   */
  assert.match(M.SCDOT_PERMIT.whyItMatters, /third-party|only/i)
})

// ── Privacy and the dispute ──────────────────────────────────────────────────

test('no private individual is named', () => {
  const text = JSON.stringify(M)
  for (const name of ['Sudol', 'Ferreira', 'Carroll', 'Androyna', 'Scruggs', 'Little', 'Maynor', 'Clark']) {
    assert.ok(!new RegExp(`\\b${name}\\b`).test(text), `a customer's name reached the record: ${name}`)
  }
})

test('no email address appears anywhere', () => {
  assert.ok(!/@[a-z0-9.-]+\.[a-z]{2,}/i.test(JSON.stringify(M.NAMED_COMMERCIAL_CLIENTS)))
})

test('the disputing client is not named', () => {
  const text = JSON.stringify(M)
  assert.ok(!/Ascent Realty/i.test(text), 'the party to an unresolved dispute is named')
  assert.ok(!/Romanov|Urmanov/i.test(text))
})

test('the Lancaster entry acknowledges the exclusion rather than hiding it', () => {
  const lancaster = M.CAROLINA_FOOTPRINT.find((f) => f.place.startsWith('Lancaster'))
  assert.match(lancaster.note, /exclusion/i, 'the reader is not told something was left out')
})

// ── A bid is not a market ────────────────────────────────────────────────────

test('bids and leads are recorded but not publishable', () => {
  const bases = new Set(M.CAROLINA_FOOTPRINT.map((f) => f.basis))
  assert.ok(bases.has('bid') && bases.has('lead'), 'bids and leads should be recorded')
  for (const row of M.publishableFootprint()) {
    assert.ok(!['bid', 'lead', 'quoted'].includes(row.basis), `${row.place} is not evidenced work`)
  }
})

test('the Greenville County RFP is an invitation and stays one', () => {
  const rfp = M.CAROLINA_FOOTPRINT.find((f) => f.place.startsWith('Greenville County'))
  assert.equal(rfp.basis, 'bid')
  assert.match(rfp.note, /invitation only/i)
})

test('every Carolina footprint row carries a state, given Chester and Lancaster both exist twice', () => {
  for (const row of M.CAROLINA_FOOTPRINT) {
    assert.match(row.state, /^(SC|NC)$/)
    assert.ok(row.place.endsWith(`, ${row.state}`), `${row.place} does not name its state`)
  }
})

// ── The brand problem the archive revealed ───────────────────────────────────

test('all four trading names are recorded rather than tidied away', () => {
  assert.equal(M.TRADING_NAMES.length, 4)
  assert.ok(M.TRADING_NAMES.includes('Savannah Paving & Sealing'))
})

test('the Savannah invoice is kept, because it evidences that brand traded', () => {
  /**
   * savannahasphaltpaving.com is a live domain with six pages and, until this
   * archive, nothing in the repository showed the name had ever been used on a
   * real document. One invoice to a named commercial client changes that.
   */
  const savannah = M.NAMED_COMMERCIAL_CLIENTS.find((c) => c.brand === 'Savannah Paving & Sealing')
  assert.ok(savannah, 'the Savannah trading evidence is gone')
  assert.equal(savannah.client, 'Palmetto Place')
  assert.match(savannah.document, /48/)
})
