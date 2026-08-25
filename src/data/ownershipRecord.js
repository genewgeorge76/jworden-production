/**
 * ownershipRecord.js — what the succession actually rests on.
 *
 * WHY THIS FILE EXISTS
 * ────────────────────
 * "4th-generation family paving contractor, since 1984" appears in
 * businessInfo.js, businessInfo.canonical.js, and as a tagline on dozens of
 * service-area pages. It is one of the most-repeated claims this company makes
 * and, until this record, nothing in this repository evidenced any part of it.
 *
 * A claim that appears on fifty pages and rests on nothing is the same
 * structural problem as the fabricated store database, only better hidden —
 * repetition reads as corroboration when it is only volume.
 *
 * WHAT WAS FOUND, AND WHAT IT PROVES
 * ──────────────────────────────────
 * On 2024-09-20 the owner emailed a draft to the prior principal of J. Worden
 * & Sons for review. The attachment is named:
 *
 *     "letter to state of virginia concerning ownership jwsp.docx"
 *
 * Seven minutes later the prior principal replied with three corrections:
 *
 *   1. the date should read March 15, and should carry the year 2015
 *   2. "I have taken over" should read "I took over"
 *   3. a signed copy would be welcome
 *
 * The second correction is the interesting one. It moves the handover from an
 * ongoing state to a completed past event with a fixed date — the change a
 * person makes when a statement is going to a state regulator rather than to a
 * customer.
 *
 * So: THE PRIOR PRINCIPAL HIMSELF PUTS THE TAKEOVER AT 15 MARCH 2015. That is
 * the other party to the handover, correcting the record unprompted, in
 * writing, for a document addressed to the Commonwealth of Virginia.
 *
 * Outside the SCDOT permit, this is the only claim in this repository
 * corroborated by someone other than the company.
 *
 * WHAT IT DOES NOT PROVE, WHICH MATTERS AS MUCH
 * ─────────────────────────────────────────────
 * It says nothing whatever about 1984. The founding year, the generation
 * count, and the unbroken-trading claim are all still owner-stated. This
 * document evidences ONE fact — when the current owner took over — and a
 * reader who stretches it to cover the rest has done exactly what this
 * repository exists to prevent.
 *
 * Nor is the letter itself in hand. What survives is the correspondence about
 * it. Whether it was signed, sent, filed or accepted by Virginia is unknown,
 * and the .docx has not been read.
 */

/** The takeover date, per the prior principal's own correction. */
export const TAKEOVER_DATE = '2015-03-15'

/** How that date is known. Not the owner's assertion — the other party's. */
export const TAKEOVER_EVIDENCE = {
  kind: 'correspondence',
  date: '2024-09-20',
  document: 'letter to state of virginia concerning ownership jwsp.docx',
  addressedTo: 'Commonwealth of Virginia',
  corroboratedBy: 'the prior principal of J. Worden & Sons',
  corroboration:
    'Replied to the draft asking that the date read March 15, 2015, that "I have taken over" be changed to "I took over", and that a signed copy be sent.',
  thirdParty: true,
  /** The letter itself was not recovered — only the exchange about it. */
  letterInHand: false,
  filingConfirmed: false,
}

/**
 * Still owner-stated. Listed explicitly so nobody reads the succession
 * evidence as covering the heritage claims that surround it on every page.
 */
export const UNEVIDENCED_HERITAGE_CLAIMS = [
  { claim: 'Founded 1984', basis: 'owner-stated', note: 'The ownership letter says nothing about the founding year.' },
  { claim: '4th generation', basis: 'owner-stated', note: 'Generation count is not addressed by any document in this repository.' },
  { claim: 'Continuous trading since 1984', basis: 'owner-stated', note: 'No document here covers the years between founding and 2015.' },
]

/** Only the takeover date is third-party corroborated. */
export const THIRD_PARTY_CORROBORATED = new Set(['takeover-date'])
