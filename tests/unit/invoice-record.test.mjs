/**
 * The invoice record, and the two things it must never be used to say.
 *
 * This file is the strongest evidence document in the repository — it
 * corroborates the Texas programme, the advance/final rule and the KBP
 * authorisation letter, all from a source none of them were checked against.
 *
 * It is also the easiest to misuse. An aging report is a receivables document.
 * Turning it into "we earned $4.9M" would be a lie assembled out of true rows,
 * which is the exact failure this whole system was built after.
 */
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const M = await import(path.join(ROOT, 'src/data/invoiceRecord.js'))
const { TX_SITES } = await import(path.join(ROOT, 'src/data/texasProgram.js'))

test('the file is internally consistent', () => {
  assert.equal(M.INVOICES.length, M.INVOICE_COUNT)
  const sum = M.INVOICES.reduce((s, i) => s + i.amountUsd, 0)
  assert.ok(Math.abs(sum - M.INVOICED_TOTAL_USD) < 0.01)
  assert.equal(M.kfcInvoices().length, M.KFC_INVOICE_COUNT)
})

test('everything is graded invoiced, and nothing claims payment', () => {
  assert.equal(M.EVIDENCE, 'invoiced')
  // No field may assert payment in either direction. The export's own column
  // reads $0.00 on 243 of 256 lines and is not trusted; the owner states the
  // invoices were paid and the system never updated. Neither goes on a page.
  for (const i of M.INVOICES) {
    assert.ok(!('paid' in i), `${i.invoice} carries a paid field`)
    assert.ok(!('amountPaid' in i), `${i.invoice} carries an amountPaid field`)
    assert.ok(!('outstanding' in i), `${i.invoice} carries an outstanding field`)
  }
  assert.equal(M.OUTSTANDING_TOTAL_USD, undefined, 'no receivables figure may be exported')
  assert.equal(M.COLLECTED_TOTAL_USD, undefined, 'no collected figure may be exported')
})

test('it corroborates the Texas programme, including the two-stage billing', () => {
  const byStore = new Map()
  for (const i of M.kfcInvoices()) {
    const m = /KFC\s*\(?(\d{2,3})\)?/.exec(i.customer)
    if (!m) continue
    const k = m[1].padStart(3, '0')
    byStore.set(k, [...(byStore.get(k) || []), i.amountUsd])
  }
  let corroborated = 0
  for (const s of TX_SITES) {
    const a = byStore.get(s.store.slice(-3))
    if (!a) continue
    const single = a.some((x) => Math.abs(x - s.value) < 0.01)
    const sums = Math.abs(a.reduce((x, y) => x + y, 0) - s.value) < 0.01
    if (single || sums) corroborated += 1
  }
  // 13 of 23 at the time this test was written. If it drops, either the
  // invoice data or texasProgram.js has changed and the disagreement matters.
  assert.ok(corroborated >= 13, `only ${corroborated} Texas sites corroborate`)
})

test('the advance/final trap is visible in the data', () => {
  // Greenville: two invoices, both 17,949, one job. texasProgram.js says these
  // must never be summed. This asserts the evidence for that rule survives.
  const greenville = M.INVOICES.filter((i) => /KFC\s*\(?209\)?/.test(i.customer))
  assert.equal(greenville.length, 2)
  assert.ok(greenville.every((i) => Math.abs(i.amountUsd - 17949) < 0.01))
  const site = TX_SITES.find((s) => s.store === 'G135209')
  assert.equal(site.value, 17949, 'the tracker must carry ONE of them, not the sum')
})

test('it corroborates the KBP authorisation letter', () => {
  // Don Larsen, 1400 N Lewis Ave Waukegan, $35,575, October 2017.
  const hit = M.INVOICES.find((i) => Math.abs(i.amountUsd - 35575) < 0.01)
  assert.ok(hit, 'the $35,575 authorisation is not in the invoice record')
  assert.match(hit.customer, /1400/)
  assert.equal(hit.date.slice(0, 7), '2017-10')
})

test('every invoice carries a date, an amount and a customer', () => {
  for (const i of M.INVOICES) {
    assert.match(i.date, /^\d{4}-\d{2}-\d{2}$/, `${i.invoice} has a bad date`)
    assert.ok(i.amountUsd > 0, `${i.invoice} has no amount`)
    assert.ok(i.customer.length > 0, `${i.invoice} has no customer`)
  }
})

test('the totals are the only publishable figures', () => {
  // Individual residential lines carry private names. The aggregates do not.
  assert.ok(M.INVOICED_TOTAL_USD > 4_000_000)
  assert.ok(M.KFC_INVOICED_USD > 4_000_000)
  assert.ok(M.KFC_INVOICED_USD < M.INVOICED_TOTAL_USD)
})
