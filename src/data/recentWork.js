/**
 * recentWork.js — 2022 to 2026, the years the job book has nothing for.
 *
 * THE PROBLEM THIS EXISTS TO FIX
 * ─────────────────────────────
 * The Kickserv export holds 2,610 jobs and its last one is dated 2022-04-04.
 * Nothing from 2023, 2024, 2025 or 2026 is in it. Nothing is in invoiceRecord.js
 * either — that ends the same day, because it comes from the same account.
 *
 * So every record in this repository stops four years ago, and a reader — human
 * or machine — who asks "is this company still working?" finds a documented
 * history that ends in April 2022. That is not a cosmetic gap. Recency of
 * first-hand experience is exactly what search ranking systems weigh, and the
 * evidence base currently makes a working contractor look dormant at the moment
 * he is opening a new market.
 *
 * The work did not stop. The RECORD stopped, because the invoicing moved off
 * Kickserv — to Joist (cancelled in early 2026) and then to InvoiceFly. Neither
 * has been exported. This file is what could be recovered from correspondence
 * in the meantime, and it is deliberately small: five records is what the
 * evidence supports, and five real records beat a fuller list that is partly
 * assumed.
 *
 * WHAT IS NOT HERE, AND WHY
 * ─────────────────────────
 * NO NAMES. Four of these five are private individuals — a homeowner who wanted
 * a concrete walk replaced, a customer who asked whether the crew was starting
 * that morning. The rule applied throughout this repository is that a
 * residential customer contributes a town and nothing else, and it is not
 * suspended because these records happen to be recent and useful.
 *
 * Companies are different and are named: a business that signs a contract is a
 * commercial reference, which is why OS Steel PM and Hardrock Construction
 * Services appear and the homeowners do not.
 *
 * NO DOLLAR TOTAL. One figure is known ($1,875 of material on estimate 2832)
 * and it is a materials line, not a job value. Summing what is here would
 * produce a number that means nothing and invites the reader to think it means
 * the period's revenue.
 *
 * WHEN THE INVOICEFLY EXPORT ARRIVES
 * ──────────────────────────────────
 * This file gets replaced by a derivation, the way invoiceRecord.js was built
 * from the aging report. Until then it is correspondence, graded as
 * correspondence, and it says so.
 */

/** Where each of these came from. Not a spreadsheet — individual emails. */
export const SOURCE = 'correspondence'

export const QUOTED = 'quoted'
export const CONTRACTED = 'contracted'
export const INVOICED = 'invoiced'

/**
 * The gap this file covers, and the reason it exists. Stated as data so a page
 * cannot quietly present these five as though they were the whole period.
 */
export const LEDGER_ENDS = '2022-04-04'
export const GAP_NOTE =
  'The job book and the invoice record both end on 2022-04-04, when invoicing moved off Kickserv. These are what correspondence evidences since — not a complete record of the period.'

export const RECENT_WORK = [
  {
    ref: 'Joist estimate 14',
    date: '2022-08-28',
    evidence: QUOTED,
    client: null,
    clientType: 'residential',
    brand: 'J. Worden & Sons Paving LLC',
    detail:
      'Estimate issued, and the customer came back the next day asking to add replacement of a concrete walk section by the building — a live job conversation, not a cold quote.',
    source: 'Joist delivery email, and the customer’s reply of 2022-08-29',
  },
  {
    ref: 'Joist estimates 14, 16, 17, 19',
    date: '2022-09-13',
    evidence: QUOTED,
    client: 'Hardrock Construction Services LLC',
    clientType: 'commercial',
    brand: 'Michigan Paving Pros',
    detail:
      'Four estimates issued in six days under the Michigan Paving Pros name, to four separate customers including a construction services firm and a water-infrastructure company. Evidence the Michigan brand was trading with a real customer base, not a domain sitting on a parking page.',
    source: 'Joist delivery emails, 2022-09-08 to 2022-09-13',
  },
  {
    ref: 'Estimate 2832',
    date: '2025-02-22',
    evidence: CONTRACTED,
    client: 'OS Steel PM',
    clientType: 'commercial',
    brand: 'J. Worden & Sons Paving LLC',
    detail:
      'Signed and returned by the client. Crushed concrete and #3 rock already ordered against it and paid for separately at $1,875; the base install was deferred by the client, not by us. The strongest record in the gap years — a countersigned document, not a quote.',
    source: 'Client email returning the signed estimate with the materials invoice attached',
  },
  {
    ref: 'Invoice Jhw6743',
    date: '2025-10-23',
    evidence: INVOICED,
    client: null,
    clientType: 'residential',
    brand: 'J. Worden & Sons Paving LLC',
    detail:
      'Invoice issued through InvoiceFly. The customer wrote the following morning asking whether the crew was starting that day — which places the work on the ground, not on paper.',
    source: 'InvoiceFly delivery email and the customer’s reply of 2025-10-24',
  },
  {
    ref: 'Invoice Jhw6747',
    date: '2026-04-07',
    evidence: INVOICED,
    client: null,
    clientType: 'residential',
    brand: 'J. Worden & Sons Paving LLC',
    detail:
      'Invoice issued, with a sealcoat scheduled for June 2026 written into the contract at the customer’s request. A maintenance cycle booked forward, which is what a repeat customer looks like.',
    source: 'InvoiceFly delivery email and the contract revision agreed 2026-04-08',
  },
]

export const PUBLISHABLE_GRADES = new Set([CONTRACTED, INVOICED])

/** Only contracted or invoiced. A quote is work asked for, not work done. */
export function publishableRecentWork() {
  return RECENT_WORK.filter((r) => PUBLISHABLE_GRADES.has(r.evidence))
}

/** Years with at least one record. The answer to "are they still working?" */
export function activeYears() {
  return [...new Set(RECENT_WORK.map((r) => r.date.slice(0, 4)))].sort()
}

/** Commercial clients that may be named. Residential rows carry no name at all. */
export function namedClients() {
  return RECENT_WORK.filter((r) => r.clientType === 'commercial' && r.client).map((r) => r.client)
}

export const mostRecent = () => RECENT_WORK.map((r) => r.date).sort().at(-1)
