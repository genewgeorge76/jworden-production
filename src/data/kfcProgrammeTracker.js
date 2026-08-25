/**
 * kfcProgrammeTracker.js — the whole KBP programme, from the client tracker.
 *
 * WHAT WAS READ, AND WHY IT IS DIFFERENT FROM EVERYTHING BEFORE IT
 * ───────────────────────────────────────────────────────────────
 * "Updated Invoice Tracker KFC.xlsx", read from the owner's Drive on
 * 2026-08-25. Six state sheets — Georgia, Texas, New Jersey, Michigan, New
 * York, and the Quad Cities — each carrying store numbers, street addresses,
 * invoice numbers, dates submitted, amounts, dates RECEIVED and amounts PAID.
 *
 * Every other source in this repository is one side of a transaction. This is
 * both sides. An invoice says a bill was sent; a date received and an amount
 * paid say the client agreed the work was done and settled it.
 *
 * THE METHOD VALIDATED ITSELF BEFORE ANY FIGURE WAS TRUSTED
 * ────────────────────────────────────────────────────────
 * invoiceTrackerInventory.js required a control: read the market whose answer
 * is known before trusting one where it is not. This file provided a second
 * and better control, from inside itself.
 *
 * Summing the Georgia sheet gave $579,981.00 invoiced against $453,311.00
 * paid, leaving $126,670.00 outstanding. The sheet carries its own outstanding
 * total: $123,270.00. A $3,400 disagreement.
 *
 * The gap is one row. Smyrna was invoiced $8,900, part-paid $5,500, and the
 * $3,400 remainder was RE-INVOICED as "Balance From Cobb Pkwy" and then paid.
 * That balance is not additional work — it is the rest of the same job. Remove
 * it and the outstanding total is $123,270.00 exactly, matching the client's
 * own figure to the cent.
 *
 * So the fourth instance of this repository's oldest error was caught by
 * arithmetic rather than by suspicion, and the match is what licenses every
 * other number below. The deposit ratio held at exactly 0.5000 again — on the
 * Quad Cities rows and the New Jersey rows independently — which is now three
 * separate confirmations of the billing structure projectRedTracker.js found.
 */

export const SOURCE = {
  file: 'Updated Invoice Tracker KFC.xlsx',
  via: 'Google Drive',
  read: '2026-08-25',
  sheets: ['GA', 'TX', 'NJ', 'MI', 'NY', 'QUADS'],
  carriesPaymentSide: true,
  selfValidated: 'The Georgia outstanding total reconciles to the sheet’s own figure, $123,270.00, once a re-invoiced balance is removed.',
}

/**
 * GEORGIA — the market this repository could say least about, now the one it
 * can say most about.
 *
 * georgiaStores.js grades 23 stores `listed` because no invoice named a store.
 * These invoices name stores. 29 distinct Georgia stores were invoiced AND
 * PAID, across Atlanta, Decatur, Athens, Marietta, Alpharetta, Acworth,
 * Suwanee, Norcross, Douglasville, Dallas, Smyrna, Morrow, Carrollton,
 * Cumming, Snellville, Lawrenceville, Loganville, Stone Mountain, Lithia
 * Springs, Forest Park, East Point and Powder Springs.
 */
export const GA = {
  documentRows: 40,
  distinctStores: 35,
  storesPaid: 29,
  invoicedUsd: 576581.0,
  paidUsd: 453311.0,
  outstandingUsd: 123270.0,
  reInvoicedBalanceRemovedUsd: 3400.0,
  matchesClientTotal: true,
}

/** MICHIGAN — 6 of the 30 listed stores carry an invoice in this file. */
export const MI = {
  storesListed: 30,
  storesInvoiced: 6,
  invoicedUsd: 289402.0,
  paidUsd: null,
  note: 'Invoice numbers 1932-1969, Detroit, Grand Blanc, Canton, Flint (two) and Davison. No payment column completed on this sheet, so these are invoiced and not evidenced as paid.',
}

/**
 * THE QUAD CITIES — and the four Iowa stores.
 *
 * programScope.js records the owner saying he did four in Iowa, against a
 * state graded `surveyed` — the floor, meaning Iowa appeared only on a 2015
 * bid list where 246 of 262 rows read "Not Started".
 *
 * This sheet carries exactly four Iowa stores. Not approximately four.
 * G135002, G135003, G135005 and G135206, each with an invoice number, a
 * deposit submitted 8 October 2016, and a job-status note written by someone
 * running the schedule: "at location currently", "next job", "3rd job",
 * "4th jpb".
 *
 * A bid list does not say "at location currently".
 */
export const QUADS = {
  rowsWithFigures: 11,
  illinois: 7,
  iowa: 4,
  depositsUsd: 200730.5,
  jobValueUsd: 401460.0,
  depositRatio: 0.5,
  iowaStores: ['G135002', 'G135003', 'G135005', 'G135206'],
  iowaDepositsUsd: 56171.0,
  iowaJobValueUsd: 112342.0,
  iowaStatusNotes: ['at location currently', 'next job', '3rd job', '4th job'],
  /**
   * A one-dollar disagreement inside the client's own sheet, recorded rather
   * than smoothed. Store G135006 shows a deposit of $22,227.50 against a job
   * total of $44,454 — twice the deposit is $44,455. Somebody rounded.
   *
   * It is immaterial against $401,460 and it is left exactly as found. The
   * alternative is adjusting a source figure to make a total look tidy, which
   * is the habit this whole repository exists to prevent. A reader who finds
   * the dollar should find this note rather than a silent correction.
   */
  jobValueRoundingUsd: 1.0,
  jobValueRoundingRow: 'G135006',
}

/** NEW JERSEY — 2 of 19 listed stores invoiced, at the same 50% deposit. */
export const NJ = {
  storesListed: 19,
  storesInvoiced: 2,
  depositsUsd: 80957.0,
  jobValueUsd: 161914.0,
  depositRatio: 0.5,
}

/** NEW YORK — 5 stores listed, no figures. A roster only. */
export const NY = { storesListed: 5, storesInvoiced: 0 }

/** TEXAS — the same 28 stores as projectRedTracker.js. Not re-counted here. */
export const TX = { storesListed: 28, seeAlso: 'projectRedTracker.js' }

/**
 * THE RULE THAT GOVERNS EVERY FIGURE ABOVE
 * ────────────────────────────────────────
 * A deposit is half a job. A job total contains its own deposit. An invoice
 * plus its re-invoiced balance is one invoice. Summing across those columns
 * inflates without describing any additional work, and this file caught the
 * fourth such error in this repository by arithmetic.
 *
 * Paid is the strongest column here and the only one that means the client
 * agreed the work was done. Invoiced means a bill was sent. Listed means a
 * store was assigned. They are three different claims.
 */
export const NEVER_SUM = [
  'a deposit and its job total',
  'an invoice and its re-invoiced balance',
  'invoiced and paid on the same row',
]

export const COLUMN_MEANINGS = {
  listed: 'A store was assigned to the programme. Not evidence of work.',
  invoiced: 'A bill was sent. Evidence of work commissioned.',
  paid: 'The client settled it. Evidence the client agreed the work was done.',
}
