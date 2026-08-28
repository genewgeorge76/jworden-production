/**
 * kfcNewBuilds.js — the 2018 ground-up KFC new-build programme, corroborated.
 *
 * THE OWNER'S ACCOUNT
 * ───────────────────
 * 2026-08-28: "we did build new kfcs for plaza street partners for kbp foods
 * ... after the remodeling program was complete." Sequence: the KBP
 * pavement/remodel programme first (the 2015–2017 trackers), then the 2018
 * new-build programme.
 *
 * FIVE INDEPENDENT CORROBORATIONS
 * ───────────────────────────────
 * 1. The programme structure was already in the repository before he said it:
 *    nationalProjects.json records the 2018 KFC new-build programme with
 *    Plaza Street Partners as developer — and the KFC responsibility matrix
 *    carries a "Worden" trade-partner column (clientProgramDocuments.js).
 * 2. The contract vehicle: Master Construction Agreement with Plaza Street
 *    Partners, dated 2018-02-02 (unsigned v1 in the archive — evidence of
 *    the engagement's form, graded as such).
 * 3. Plaza Street Partners is a CUSTOMER in the company's own Kickserv book,
 *    with a completed, revenue-carrying job at 1145 North Belsay Road,
 *    Burton MI — the same address as the KFC-Burton new build.
 * 4. Completed new-build job rows in the same book, August 2018 — the months
 *    immediately after the remodel programme's tracker activity ends, which
 *    is exactly the sequence the owner described.
 * 5. The 146-invoice KBP archive includes new-build invoices
 *    (georgiaStores.js KBP_INVOICE_EVIDENCE).
 *
 * THE JEFFERSON CITY QUESTION, MOVED
 * ──────────────────────────────────
 * NEW_BUILD_PROGRAMME_CROSSCHECK (clientProgramDocuments.js) recorded on
 * 2026-08-26 that the Jefferson City drawing set "names no contractor and
 * the invoice archive has no Jefferson City entry." The KICKSERV book —
 * read 2026-08-28, a source that finding did not cover — holds two
 * completed jobs at 706 Virginia St, Jefferson City MO. The drawing-set
 * finding stands as written about the drawing set; the company's role at
 * Jefferson City is now evidenced by its own completed-job records.
 *
 * Dollar amounts stay off public cards, as everywhere in this record.
 */

/**
 * Grades:
 *   completed  Completed, revenue-carrying rows in the company's own book —
 *              or, for Leesville, the construction manager's own final-payment
 *              invoice, which only flows at the end of a finished build.
 *   book       New-build entries in the book whose status column was never
 *              maintained (a block of rows bulk-dated 2018-11-27), attested
 *              built by the owner (2026-08-28: "we built more in LA —
 *              Jennings and others"). Recorded, named cautiously.
 */
export const NEW_BUILD_SITES = [
  { city: 'Jefferson City', state: 'MO', address: '706 Virginia St', completed: '2018-08', jobs: 2, grade: 'completed' },
  { city: 'Sulphur Springs', state: 'TX', address: '900 Gilmer St', completed: '2018-08', jobs: 1, grade: 'completed' },
  { city: 'Ennis', state: 'TX', address: '100 North Kaufman Street', completed: '2018-08', jobs: 1, grade: 'completed' },
  { city: 'Burton', state: 'MI', address: '1145 North Belsay Road', completed: '2018-08', jobs: 2, grade: 'completed', note: 'One job row billed under the customer "Plaza Street Partners" directly.' },
  { city: 'Jennings', state: 'LA', address: '1498 Elton Road', completed: '2018-08', jobs: 5, grade: 'completed', note: 'Includes a completed change order — a build, not site work.' },
  { city: 'Leesville', state: 'LA', address: '1102 5th Street', completed: '2018-10', jobs: 1, grade: 'completed', note: 'Corroborated by the construction manager’s final-payment invoice for KFC-618, WO-7170336, Oct 2018 (clientProgramDocuments.js).' },
  { city: 'Crowley', state: 'LA', address: '2203 North Parkerson Avenue', completed: '2018', jobs: 2, grade: 'book' },
  { city: 'Lake Charles (Ryan St)', state: 'LA', address: '2412 Ryan Street', completed: '2018', jobs: 1, grade: 'book' },
  { city: 'Lake Charles (MLK Pkwy)', state: 'LA', address: 'N MLK Pkwy', completed: '2018', jobs: 1, grade: 'book' },
  { city: 'DeRidder', state: 'LA', address: '812 Pine St', completed: '2018', jobs: 1, grade: 'book' },
]

export const PROGRAMME = {
  year: 2018,
  developer: 'Plaza Street Partners',
  franchisee: 'KBP Foods',
  constructionManager: 'Innovative Building Solutions LLC',
  engineer: 'Burns & McDonnell',
  architect: 'Davidson AE',
  wordenInResponsibilityMatrix: true,
  sequence: 'After the KBP remodel/pavement programme completed (owner, 2026-08-28) — matching the job-log dates.',
}

export const OWNER_ATTESTATION = {
  date: '2026-08-28',
  statement:
    'We did build new kfcs for plaza street partners for kbp foods — after the remodeling program was complete.',
}
