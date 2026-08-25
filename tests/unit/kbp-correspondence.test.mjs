import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'

import {
  KBP_DOCUMENTS, APPROVED, QUERIED, AUTHORISED,
  APPROVED_WITH_AMOUNTS_USD, QUERIED_NOT_APPROVED_USD,
  STORE_NUMBERS, ROSTER_LEAD, CLIENT_COMMENDATION, SOURCE,
} from '../../src/data/kbpCorrespondence.js'
import { KBP_INVOICE_EVIDENCE } from '../../src/data/georgiaStores.js'

test('the approved total matches the documents it claims to sum', () => {
  const summed = KBP_DOCUMENTS
    .filter((d) => d.status === APPROVED && d.amountUsd != null)
    .reduce((s, d) => s + d.amountUsd, 0)
  assert.equal(summed, APPROVED_WITH_AMOUNTS_USD)
})

/**
 * The fourth instance of the same trap. An approved estimate becomes an
 * invoice, and the invoice record already spans these years.
 */
test('approvals are never added to the invoice total', () => {
  const inflated = KBP_INVOICE_EVIDENCE.totalUsd + APPROVED_WITH_AMOUNTS_USD
  assert.notEqual(KBP_INVOICE_EVIDENCE.totalUsd, inflated)
  assert.equal(KBP_INVOICE_EVIDENCE.totalUsd, 4082440.23, 'the invoice total moved when approvals arrived')
})

test('the queried document is excluded from the approved total', () => {
  const queried = KBP_DOCUMENTS.find((d) => d.doc === '1699')
  assert.equal(queried.status, QUERIED)
  assert.equal(queried.amountUsd, QUERIED_NOT_APPROVED_USD)
  assert.equal(
    AUTHORISED.has(queried.status),
    false,
    'a document the client questioned is being counted as authorised',
  )
})

test('approval is not completion', () => {
  // A client can approve a job later cancelled, rescoped, or given to someone
  // else. The ladder exists so one rung is not read as another.
  assert.equal(AUTHORISED.has('completed'), false)
  assert.equal(AUTHORISED.size, 1, 'the authorised set grew beyond approval')
})

test('a missing amount is absent, never zero', () => {
  const pdfOnly = KBP_DOCUMENTS.filter((d) => d.amountUsd === null)
  assert.ok(pdfOnly.length > 0, 'the expired-PDF documents lost their null amounts')
  for (const d of pdfOnly) {
    assert.notEqual(d.amountUsd, 0, `${d.doc} turned a missing figure into zero`)
  }
})

test('no personal contact details were committed', () => {
  const text = readFileSync('src/data/kbpCorrespondence.js', 'utf8')
  assert.equal(SOURCE.contactDetailsCommitted, false)
  assert.equal(/@kbp-foods/.test(text), false, 'a work email was committed')
  assert.equal(/\b\d{3}-\d{3}-\d{4}\b/.test(text), false, 'a phone number was committed')
})

test('the roster lead keeps what makes it findable', () => {
  assert.equal(ROSTER_LEAD.subject, 'worden kfc master')
  assert.ok(ROSTER_LEAD.date && ROSTER_LEAD.mailbox)
  // It was SENT by this company, which is why it needs no reply from KBP.
  assert.match(ROSTER_LEAD.whyItMatters, /own account|no reply/i)
})

test('the real commendation is not published without permission', () => {
  assert.equal(CLIENT_COMMENDATION.quotedOnAnyPage, false)
  assert.ok(CLIENT_COMMENDATION.from, 'an attributable testimonial lost its attribution')
})

test('store numbers are recorded as strings, not parsed into numbers', () => {
  // Store 5075 and store 74 are identifiers. Arithmetic on them is meaningless
  // and leading zeros in other rosters would be destroyed by a numeric cast.
  for (const s of STORE_NUMBERS) assert.equal(typeof s, 'string')
})
