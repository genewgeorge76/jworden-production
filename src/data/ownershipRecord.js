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

/**
 * THREE DIFFERENT FACTS THAT KEEP GETTING TOLD AS ONE
 * ──────────────────────────────────────────────────
 * Most of the tenure confusion across the properties comes from collapsing
 * three separate things into a single number. They are not the same claim and
 * they do not have the same evidence:
 *
 *   1. WHEN THE COMPANY WAS FOUNDED      1984, owner-stated, unevidenced here.
 *   2. WHEN THE CURRENT OWNER TOOK OVER  15 March 2015, corroborated by the
 *                                        prior principal in writing.
 *   3. HOW LONG HE HAS BEEN IN THE TRADE ~1991, owner-stated, and the
 *                                        strongest of the three in practice.
 *
 * A Google profile's "years in business" field means the first. A biography
 * saying "35 years of experience" means the third. Both can be true at once,
 * and stating one where the other belongs is how the estate ended up claiming
 * four different company ages.
 *
 * WHAT HE ACTUALLY SAID, AND WHY IT IS WORTH MORE THAN THE OTHER TWO
 * ─────────────────────────────────────────────────────────────────
 * He began paving with his grandfather at fourteen and worked the summers
 * until he was eighteen or nineteen — Monterey, Williamsville and Franklin in
 * Virginia, among others. He is now almost fifty, which places the start
 * around 1991 and the last of those summers around 1995.
 *
 * Google's own quality framework leads with Experience — first-hand,
 * demonstrable, personal. "Fourth generation since 1984" is a slogan with
 * nothing behind it and every competitor has one. "On a paving crew at
 * fourteen with my grandfather, in Highland and Bath County, and still doing
 * it at fifty" is a specific person in specific places over a specific span,
 * and it cannot be copied by anyone who did not live it.
 *
 * The 25+ years on the mid-Florida profile is not merely inconsistent with
 * the rest. Against his own account it understates him by about a decade.
 *
 * WHAT THIS IS NOT
 * ────────────────
 * It is not a service area. Monterey, Williamsville and Franklin are where a
 * teenager worked summers thirty years ago, and listing them as markets served
 * today would be the same overreach as attaching the company's age to Atlanta.
 * They belong in a biography and nowhere else.
 *
 * It is also not a generation count. He worked with his grandfather; how that
 * line runs, and whether it makes four generations or five, is not something
 * to infer from a sentence about summer work. It stays open below.
 */

/** Roughly when the current owner started in the trade. His own account. */
export const TRADE_EXPERIENCE = {
  startedApprox: 1991,
  startedAge: 14,
  workedWith: 'his grandfather',
  throughApprox: 1995,
  earlyPlaces: ['Monterey, VA', 'Williamsville, VA', 'Franklin, VA'],
  basis: 'owner-stated',
  yearsInTrade: 35,
  /** Biography only. Never a service area, never a market served. */
  publishableAs: 'experience',
  publishableAsMarkets: false,
}

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
  {
    claim: '4th generation',
    basis: 'owner-stated',
    settled: '2026-08-25',
    note:
      'Confirmed by the owner and closed. It remains owner-stated — no document here addresses a generation count and none is likely to — but it is no longer an open question between competing numbers, and every property must now say four.',
  },
  { claim: 'Continuous trading since 1984', basis: 'owner-stated', note: 'No document here covers the years between founding and 2015.' },
]

/** Only the takeover date is third-party corroborated. */
export const THIRD_PARTY_CORROBORATED = new Set(['takeover-date'])
