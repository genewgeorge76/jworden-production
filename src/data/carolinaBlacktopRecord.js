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
/**
 * THE PAYPAL CROSS-CHECK, AND THE $13,540.85 THAT IS NOT NEW MONEY
 * ───────────────────────────────────────────────────────────────
 * carolinablacktop@gmail.com holds six PayPal "payment received" notifications,
 * July–August 2024, totalling $13,540.85. PayPal is a third party, so these
 * looked like the strongest evidence in the Carolina file — a processor's own
 * record of money arriving, not this company's word for it.
 *
 * Every one of them was already counted.
 *
 * Matched against the Joist workbook line by line, all six are the PAYMENT SIDE
 * of invoices already in the 18 jobs below. Two are part-payments against the
 * same $13,500 Lancaster repair. Two more are payments against one $9,000 job.
 * The remaining two are a $600 job and a partial against it.
 *
 * Adding them to INVOICED_USD would have inflated it by $13,540.85 while
 * describing no work that is not already described.
 *
 * THIS IS THE THIRD TIME THIS TRAP HAS BEEN SPRUNG HERE
 * ────────────────────────────────────────────────────
 * texasProgram.js: Greenville reads $17,949 twice and is ONE job.
 * This file, above: 23 documents describe 18 jobs, a $51,750 overstatement.
 * Now: six processor receipts describe payments on jobs already counted.
 *
 * The shape never changes. A record system emits one document per EVENT —
 * quote, invoice, deposit, final, receipt — and a reader summing documents
 * counts the job once per event it generated. The rule is the same every time:
 * deduplicate to the JOB, then sum. A new source of money is only new revenue
 * if it describes a job the record does not already contain.
 *
 * SO THE TOTAL IS UNCHANGED. $155,300.00, 18 jobs. The PayPal receipts
 * corroborate it; they do not increase it. That is worth more than the money
 * would have been — an independent processor confirming the same jobs is
 * exactly the third-party check this file otherwise only gets from SCDOT.
 *
 * THE MONEY GOING THE OTHER WAY WAS WAGES
 * ────────────────────────────────────────
 * The same account shows roughly $6,800 paid OUT across July and August 2024,
 * in small frequent amounts, to someone sharing a mailbox with one of the
 * customers above. The owner has confirmed what it was: his nephew, who worked
 * on the crew. It is labour cost.
 *
 * This is recorded because of what sits beside it. The Lancaster job was
 * disputed in September 2024 and the client demanded a refund. An outgoing
 * payment stream next to a refund dispute is the pair a reconciler misreads —
 * wages get booked as money returned, the dispute looks larger than it was,
 * and a job that was part-paid starts to read as a job that went wrong.
 *
 * It is not revenue and it is not a refund. It is payroll, and it belongs on
 * the cost side of 2024 wherever that is finally reckoned.
 *
 * WHAT THE PAYPAL RECORD DOES NOT CONTAIN
 * ───────────────────────────────────────
 * No Savannah payments. No Tybee Island payments. Nothing on the Georgia coast
 * at all. Every incoming payment on this account is Carolina work. That is
 * consistent with the Georgia coastal jobs having run through a separate
 * mailbox and a separate PayPal — see unrecoveredWork.js — and it means this
 * account cannot be used to evidence them.
 */

/** Six PayPal receipts, July–August 2024. All matched to invoices already counted. */
export const PAYPAL_RECEIPTS_USD = 13540.85

/** Not added to INVOICED_USD. See the note above on why. */
export const PAYPAL_ADDS_NEW_REVENUE = false

/** The PayPal record holds nothing from the Georgia coast. */
export const PAYPAL_COVERS_SAVANNAH = false

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
  reported: '2024-05-13',
  archived: '2024-06-12',
  evidence: 'completed',
  detail:
    'Encroachment permit issued by SCDOT, work performed, completion photographs submitted to the department, and the permit archived.',
  // Verified in the mailbox on 2026-08-25 rather than taken from the workbook.
  // The company's own email to the department's permit officer, 2024-05-13:
  // "Per our conversation concerning permit 21146 Has been completed Please
  // see attached photos". The subject line carries the full number, 211746;
  // the body drops a digit, which is a typing slip and not a second permit.
  source:
    'Email to the SCDOT permit officer, 2024-05-13, subject "Permit 211746", reporting completion with photographs attached.',
  whyItMatters:
    'A state transportation agency’s own record that work was permitted, performed and closed out. It is the only third-party verification in this repository.',
}

/**
 * beaufortasphaltpaving.com — a working site nobody in this repository knew about.
 *
 * It does not appear in the Vercel account, in vercel.json, in middleware.js,
 * or in any audit run against the estate. It surfaced in the mailbox because it
 * DOES something: the Holiday Inn enquiry of 2024-07-09 arrived from
 * no-reply@beaufortasphaltpaving.com with the subject "Contact Beaufort Asphalt
 * Paving from kelley@hmvhotels.com" — a contact form on a live site producing a
 * commercial lead from a hotel group, which then ran to an arranged site visit.
 *
 * It is hosted at Webador, and in April 2025 the registrar wrote under the
 * ICANN Expired Registration Recovery Policy. The owner asked to renew. Webador
 * replied that open invoices had to be settled first. Nothing in the archive
 * shows they were.
 *
 * So: a domain that has demonstrably generated commercial work is sitting
 * behind an unpaid invoice, and no part of the system this repository builds
 * knows it exists. Recorded because a lead-generating asset quietly lapsing is
 * worth more attention than most of what is on the pages.
 */
export const UNMANAGED_DOMAIN = {
  domain: 'beaufortasphaltpaving.com',
  host: 'Webador',
  status: 'renewal requested 2025-04-21; Webador replied that open invoices must be paid first',
  evidenceItWorks:
    'Contact-form lead from HMV Hotels, 2024-07-09, for a Holiday Inn reseal and restripe at 2225 Boundary St, Beaufort SC.',
  inThisRepository: false,
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
