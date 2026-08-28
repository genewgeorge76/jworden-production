/**
 * kbpTrackerApril2017.js — the April 2017 programme tracker, read.
 *
 * WHAT WAS READ
 * ─────────────
 * "Updated Invoice tracker TX&NJ&QUADS 4317.xlsx", read from the owner's
 * Drive on 2026-08-28 (also present in the 2017-04-03 Drive original). It is
 * three months NEWER than every tracker read before it, and it carries the
 * columns the older reads lacked: per-store deposit money received, per-store
 * paid amounts, and — on the Quad Cities sheet — the client's own job-status
 * column with the word "Finished".
 *
 * WHY THIS UPGRADED 31 STORE GRADES
 * ─────────────────────────────────
 * The owner said it plainly on 2026-08-28: the published counts were low —
 * "you have the invoice tracker of all the stores... all these jobs are
 * completed." This file is the document that lets the grades follow him.
 *
 *   TEXAS (Project Red): 23 of 28 stores carry invoices. Fifteen carry
 *   deposit money received against the store — money in hand is payment
 *   evidence, so those fifteen grade `paid` (Laredo G135212 and Eagle Pass
 *   G135233 additionally show "Balance due is $0"). Eight carry invoices
 *   without a payment column and grade `invoiced`. Sheet totals:
 *   $646,694.00 of job value, ~$264,000 of deposits received. Conroe
 *   G135225 is marked "Job not to be completed" and stays `listed`.
 *
 *   NEW JERSEY: Ledgewood G135303 and Hackettstown G135304 each carry
 *   "$ Amount Paid: $40,478.50", with $80,957.00 recorded as total deposit
 *   received. Both grade `paid`. The sheet notes work was halted by weather
 *   with $36,786 invoiced for work completed before the halt, and $44,171
 *   credited to the Excelsior Springs pipe job — the tracker's own words.
 *
 *   QUAD CITIES: six stores carry the client's status "Finished" AND deposit
 *   money received and accounted ($89,420 for Chicago, matched to the row
 *   amounts): Davenport G135002 and G135005, Clinton G135206, Midlothian IL
 *   G135277, S. Chicago Heights G135271 ("ballard work"), Oak Forest
 *   G135270. All six grade `paid`. Four more carry deposit invoices without
 *   completion status and stay `invoiced`.
 *
 * THE 50% RULE HELD AGAIN
 * ───────────────────────
 * Advance and final invoices on the Texas sheet are two halves of one job
 * (projectRedTracker.js), and this sheet says so in its own margin: deposits
 * are deducted out of final invoices. No advance+final pair was summed as two
 * jobs anywhere in the grade upgrades above.
 *
 * THE MASTER ROSTER, READ THE SAME DAY
 * ────────────────────────────────────
 * "KFC MASTER LIST ALL STORES'.xls" — the KBP FOODS 247 STORE CONTACT SHEET —
 * was read from Drive the same day. Store rows span FOURTEEN states:
 * GA 61, FL 46, VA 44, MI 30, IL 28, TX 28, NC 24, MO 19, NJ 19, NY 19,
 * MD 13, KS 12, NE 11, IA 6 — markets from Tampa and South Florida to
 * Kansas City, Norfolk, Richmond, NYC and Syracuse. The roster is the
 * denominator; it grades nothing by itself.
 */

export const SOURCE = {
  file: 'Updated Invoice tracker TX&NJ&QUADS 4317.xlsx',
  via: 'Google Drive',
  read: '2026-08-28',
  sheets: ['TX Project Red', 'NJ', 'QUADS'],
  carriesPaymentSide: true,
}

export const MASTER_ROSTER = {
  file: "KFC MASTER LIST ALL STORES'.xls",
  via: 'Google Drive',
  read: '2026-08-28',
  contactSheetTitle: 'KBP FOODS 247 STORE CONTACT SHEET',
  storeRowsByState: {
    GA: 61, FL: 46, VA: 44, MI: 30, IL: 28, TX: 28, NC: 24,
    MO: 19, NJ: 19, NY: 19, MD: 13, KS: 12, NE: 11, IA: 6,
  },
  states: 14,
}

export const TX_APRIL_2017 = {
  storesWithInvoices: 23,
  storesWithDepositsReceived: 15,
  jobValueUsd: 646694.0,
  depositsReceivedUsd: 264000.0,
  notToBeCompleted: ['G135225'],
}

export const NJ_APRIL_2017 = {
  storesPaid: 2,
  paidPerStoreUsd: 40478.5,
  depositReceivedUsd: 80957.0,
}

export const QUADS_APRIL_2017 = {
  storesFinished: 6,
  depositReceivedUsd: 89420.0,
}

/**
 * The owner's attestation, in his own words, recorded the way the Class A
 * license confirmation was: as testimony with a date, distinct from and
 * alongside the document grades. It is why the trackers were re-hunted and
 * re-read; it does not by itself change any grade.
 */
export const OWNER_ATTESTATION = {
  date: '2026-08-28',
  statement:
    'The invoice tracker covers all the stores — Florida, Texas, KC, Michigan, ' +
    'NC, New Jersey, New York and more — and these jobs are completed.',
}
