/**
 * kfcProgrammeSpan.js — how long the KFC work actually ran, from the records.
 *
 * THE OWNER'S WORDS, AND WHAT THE BOOKS SAY
 * ─────────────────────────────────────────
 * 2026-08-28: "I did kfcs for 6 years everyday." The published record was
 * carrying "2015–2018" because that is the slice the KBP invoice PDFs cover.
 * The company's own records reach further on both ends:
 *
 *   June 2013      Bear Claw Construction subcontract 13-076; "K.F.C. Job on
 *                  azalea ave. in Richmond va completed" June 15
 *                  (bearClawOrigin.js — the whole email sequence, in order).
 *   Oct 2014       First KBP Foods entry in the Kickserv book.
 *   Nov 2018       Last KFC activity in the book (Jefferson City MO,
 *                  Swartz Creek MI — unscheduled entries; last COMPLETED
 *                  KFC job 2018-08-28).
 *
 * That is five and a half continuous documented years of KFC work.
 *
 * "EVERYDAY" IS NOT AN EXAGGERATION
 * ─────────────────────────────────
 * The Kickserv export (read 2026-08-28) holds 340 KFC/KBP/Bear Claw customer
 * entries and 364 jobs with status complete:
 *
 *     2014: 5 · 2015: 3 · 2016: 54 · 2017: 44 · 2018: 258
 *
 * 258 completed KFC jobs in 2018 against roughly 250 working days — a KFC
 * lot completed nearly every working day of that year. The owner's daily
 * account and the job log agree.
 *
 * WHAT IS DELIBERATELY NOT PUBLISHED
 * ──────────────────────────────────
 * Summing the Kickserv job totals across those 364 rows gives roughly
 * $9.16M. That figure is NOT published anywhere: this repository's oldest
 * error is double-counting (an advance and a final are one job), and the
 * Kickserv rows have not yet been reconciled against the invoice trackers
 * the way Georgia and Texas were. The counts and dates above are row facts;
 * the dollar sum waits for the reconciliation.
 */

export const KFC_SPAN = {
  firstDocumented: '2013-06-15',
  firstDocumentedWhat: 'KFC Azalea Ave, Richmond VA, completed under Bear Claw subcontract 13-076',
  lastCompleted: '2018-08-28',
  lastActivity: '2018-11-28',
  continuousYears: 5.5,
}

export const KICKSERV_KFC = {
  read: '2026-08-28',
  customers: 340,
  jobsCompleted: 364,
  completedByYear: { 2014: 5, 2015: 3, 2016: 54, 2017: 44, 2018: 258 },
  unreconciledJobTotalUsd: 9162264,
  unreconciledNote:
    'Job-row sum, not yet reconciled for advance/final pairing. Do not publish the dollar figure until it is.',
}

export const OWNER_ATTESTATION = {
  date: '2026-08-28',
  statement: 'I did kfcs for 6 years everyday.',
}
