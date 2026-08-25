/**
 * carolinaBlacktopRecord.js — the Carolina work, from the Joist archive.
 *
 * WHAT CHANGED, AND WHY IT MATTERS
 * ────────────────────────────────
 * carolinaRegions.js was written saying, in its own header, that South Carolina
 * rested on the owner's word alone and that a proof block would be added "when
 * the InvoiceFly export or the carolinablacktop@gmail.com archive turns up".
 *
 * It has turned up. 83 documents recovered from that mailbox, spanning
 * 2019-12-20 to 2026-01-02: 27 estimates, 23 invoices and payment receipts, 19
 * jobs and leads, 14 supplier bills. South Carolina moves from owner-stated to
 * record-backed, and this file is the record.
 *
 * THE STRONGEST ITEM IS NOT AN INVOICE
 * ────────────────────────────────────
 * SCDOT Encroachment Permit #211746. Applied for through the South Carolina
 * Department of Transportation in May 2024, completion photographs submitted,
 * and archived by SCDOT in June 2024.
 *
 * That is a state agency's own record saying work was permitted, performed and
 * closed out. Nothing else in this repository is verified by a third party at
 * all — the Texas figures reconcile against a client's tracker, the Georgia
 * stores rest on a punch list, and every photograph rests on the crew that took
 * it. A DOT permit is a government record, and for a contractor arguing
 * capability to a public body it is worth more than a year of driveways.
 *
 * THE TOTAL, AND THE $51,750 THAT IS NOT IN IT
 * ────────────────────────────────────────────
 * A second extraction pulled every figure from Joist's own document API, so
 * amounts now exist for all 23 invoice documents. Summing them gives
 * $207,050.00 and that number is wrong.
 *
 * Joist issues an invoice and then a payment receipt for the same work, and
 * every one of those documents carries the job's FULL total. Three jobs
 * account for the error:
 *
 *     one client   $9,000   invoiced once, three documents
 *     another     $13,500   invoiced once, three documents
 *     a third      $6,750   invoiced once, two documents
 *
 * 23 documents describe 18 jobs. Counted once each: $155,300.00.
 *
 * texasProgram.js already states this rule — an advance and a final are never
 * summed, because Greenville reads 17,949 twice and is ONE job. The same trap,
 * in a different system, five years later. It is now applied structurally in
 * joist_import.distinct_jobs rather than caught by eye.
 *
 * PAYMENT STATUS IS STILL NOT PUBLISHED
 * ─────────────────────────────────────
 * The workbook carries paid and outstanding columns showing $138,017
 * outstanding. Two reasons that figure does not appear on any page.
 *
 * First, it is computed against the inflated $207,050, so it inherits the same
 * double count.
 *
 * Second, and more important, this is the Kickserv aging report again. That
 * export read $0.00 paid on 243 of 256 invoices and the owner's account was
 * that the work was paid for and the box was never ticked. Joist has the same
 * shape: payments taken by cheque, cash or Cash App never reach it — one row
 * in the first extraction says so explicitly, "$1,000 also paid via Cash App
 * same day". No contractor's website states whether its invoices cleared, and
 * this one will not become the first.
 *
 * WHAT IS DELIBERATELY EXCLUDED
 * ─────────────────────────────
 * The Lancaster dispute. One client sent a termination and refund demand in
 * September 2024 after part payment. It is in the archive, it is in the private
 * workbook, and it is not on a page — not because it is inconvenient but
 * because an unresolved dispute is a private matter between two parties and
 * publishing either side of it would be a decision for a lawyer rather than a
 * marketing file.
 *
 * Individual customers, likewise. 19 of the 23 invoices went to private people
 * at their homes. The rule everywhere else in this repository holds here.
 */

export const SOURCE = 'joist'
export const ARCHIVE = 'carolinablacktop@gmail.com'
export const EVIDENCE = 'invoiced'

/** Complete counts. These are what the archive actually establishes. */
export const INVOICE_DOCUMENTS = 23
/** 23 documents describe 18 jobs. See the header on the $51,750. */
export const INVOICE_COUNT = 18
export const INVOICED_USD = 155300.0
export const ESTIMATE_COUNT = 27
export const FIRST_DOCUMENT = '2019-12-20'
export const LAST_INVOICE = '2025-02-18'

/**
 * The names these documents went out under, in the order they appear.
 *
 * Recorded rather than tidied away, because it is a real finding and a real
 * problem: four trading names across three years is four entities as far as a
 * search engine is concerned, and it splits whatever authority any of them
 * earns. See the note in carolinaRegions.js.
 */
export const TRADING_NAMES = [
  'Carolina Blacktop',
  'Carolina Blacktop Inc',
  'Carolina Asphalt Paving Pros',
  'Savannah Paving & Sealing',
]

/**
 * VERIFIED AGAINST THE MAILBOX, because two extractions disagreed.
 *
 * The second workbook records "Carolina Asphalt Paving Pros" as the business
 * name on every document including the 2023 and 2024 ones. The emails say
 * otherwise: the delivery notice for estimate 2800, dated 2024-04-24, has the
 * subject "Your estimate 2800 from Carolina Blacktop".
 *
 * So the second extraction normalised a historical field to the current name
 * and lost the fact. The first extraction had it right, and the sequence above
 * is the one the mailbox supports. Worth remembering when the next rebuilt
 * spreadsheet arrives: a tidier column is not always a truer one.
 */
export const TRADING_NAME_SOURCE =
  'Email subject lines in carolinablacktop@gmail.com, which carry the name as sent.'

/**
 * The one item verified by somebody other than us.
 */
export const SCDOT_PERMIT = {
  authority: 'South Carolina Department of Transportation',
  reference: 'Encroachment Permit #211746',
  applied: '2024-05-13',
  archived: '2024-06-12',
  evidence: 'completed',
  detail:
    'Encroachment permit issued by SCDOT, work performed, completion photographs submitted, and the permit archived by the department.',
  whyItMatters:
    'A state transportation agency’s own record that work was permitted, performed and closed out. It is the only third-party verification in this repository.',
}

/**
 * Commercial clients that may be named: companies, not people, and not the
 * party to the dispute.
 */
export const NAMED_COMMERCIAL_CLIENTS = [
  { client: 'Palmetto Place', date: '2024-06-07', document: 'Invoice 48', brand: 'Savannah Paving & Sealing' },
]

/**
 * Markets the archive puts this company in, with what each rests on.
 * `bid` and `lead` are NOT work and are recorded so nobody mistakes them later.
 */
export const CAROLINA_FOOTPRINT = [
  { place: 'Lancaster, SC', state: 'SC', basis: 'invoiced', note: 'Asphalt repair, W Meeting St. Part-paid; see the exclusion note above.' },
  { place: 'Chester, SC', state: 'SC', basis: 'quoted', note: '142,000 sq ft shopping centre — sealcoating, striping and patching quoted 2024.' },
  { place: 'Beaufort, SC', state: 'SC', basis: 'lead', note: 'Hotel reseal and restripe enquiry, Boundary Street, 2024.' },
  { place: 'Summerville, SC', state: 'SC', basis: 'lead', note: 'Flex-space build to a heavy-duty section, 2026.' },
  { place: 'Greenville County, SC', state: 'SC', basis: 'bid', note: 'County RFP for speed hump installation, 2025. Invitation only.' },
  { place: 'Elizabeth City, NC', state: 'NC', basis: 'lead', note: 'Pothole repair request through a facilities network, 2024.' },
]

export const PUBLISHABLE_BASES = new Set(['invoiced', 'completed'])

/** Only invoiced or completed. A bid and a lead are not a market served. */
export function publishableFootprint() {
  return CAROLINA_FOOTPRINT.filter((f) => PUBLISHABLE_BASES.has(f.basis))
}

/** What a page may say. Counts and a span — never a total. */
export const PUBLISHABLE_LINE =
  `${INVOICE_COUNT} invoiced Carolina jobs between 2023 and 2025 totalling ` +
  `$${INVOICED_USD.toLocaleString('en-US')}, and an SCDOT encroachment permit performed ` +
  'and archived by the department in 2024.'
