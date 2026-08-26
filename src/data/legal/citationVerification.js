/**
 * citationVerification.js — what has actually been checked against the statute.
 *
 * WHY THIS FILE EXISTS
 * ────────────────────
 * Every row in these datasets carried `lastVerified: '2026-01-01'`. All 510 of
 * them, the same date, across twelve topics and fifty-one jurisdictions. A
 * uniform date is not a verification record; it is a field that was filled in
 * once and has been quoted ever since as though someone had read the statute.
 *
 * Nothing distinguished a citation somebody had opened from one nobody had.
 *
 * This file holds the ones that have been opened, with the evidence: the
 * official source, the date, and the sentence the statute actually says. A
 * state absent from here has not been checked. That is the point — the gap is
 * legible instead of papered over with a date.
 *
 * WHY IT IS NOT ALL FIFTY-ONE
 * ───────────────────────────
 * Verifying a citation means reading the section, not confirming a URL loads.
 * Free official sources do not exist uniformly:
 *
 *   Virginia, North Carolina, Florida, Maryland, Minnesota
 *       Full statute text, free, fetchable. Checked.
 *   Texas
 *       statutes.capitol.texas.gov returns a JavaScript shell — 250KB with no
 *       section text in it.
 *   Georgia
 *       The O.C.G.A. is published under contract with LexisNexis. There is no
 *       free official full text to fetch.
 *
 * The rest are unchecked and say so. Filling them in from a page that merely
 * loaded would be the same lie as the uniform date, told more expensively.
 */

/** A statute this repository has read, and what it said. */
export const VERIFIED_CITATIONS = [
  {
    abbr: 'VA',
    topic: 'mechanicsLien',
    citation: 'Va. Code Ann. § 43-4',
    source: 'https://law.lis.virginia.gov/vacode/title43/chapter1/section43-4/',
    checked: '2026-08-26',
    heading: '§ 43-4. Perfection of lien by general contractor; recordation and notice',
    quote:
      'not later than 90 days from the last day of the month in which he last performs labor ' +
      'or furnishes material, and in no event later than 90 days from the time such building, ' +
      'structure, or railroad is completed',
    verdict: 'corrected',
    finding:
      'The dataset said "90 days from last furnishing". The statute runs the 90 days from the ' +
      'LAST DAY OF THE MONTH in which work ended, and imposes a second, independent cap at 90 ' +
      'days from completion — whichever expires first. Both were missing.',
  },
  {
    abbr: 'NC',
    topic: 'mechanicsLien',
    citation: 'N.C. Gen. Stat. § 44A-12',
    source: 'https://www.ncleg.gov/EnactedLegislation/Statutes/HTML/BySection/Chapter_44A/GS_44A-12.html',
    checked: '2026-08-26',
    heading: 'G.S. 44A-12. Filing claim of lien on real property.',
    quote:
      'not later than 120 days after the last furnishing of labor or materials at the site of ' +
      'the improvement by the person claiming the lien',
    verdict: 'confirmed',
    finding: '120 days from last furnishing. Matches the dataset exactly.',
  },
  {
    abbr: 'FL',
    topic: 'mechanicsLien',
    citation: 'Fla. Stat. § 713.08',
    source:
      'https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0700-0799/0713/Sections/0713.08.html',
    checked: '2026-08-26',
    heading: 'Section 713.08 — Claim of lien',
    quote:
      'may be recorded at any time during the progress of the work or thereafter but not later ' +
      'than 90 days after the final furnishing of the labor or services or materials by the lienor',
    verdict: 'confirmed',
    finding: '90 days from final furnishing. Matches the dataset exactly.',
  },
  {
    abbr: 'MD',
    topic: 'mechanicsLien',
    citation: 'Md. Code, Real Prop. § 9-105',
    source:
      'https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=grp&section=9-105&enactments=false',
    checked: '2026-08-26',
    heading: 'Article - Real Property, § 9–105',
    quote: 'within 180 days after the work has been finished or the materials furnished',
    verdict: 'confirmed',
    finding: '180 days from work finished. Matches the dataset exactly.',
  },
  {
    abbr: 'MN',
    topic: 'mechanicsLien',
    citation: 'Minn. Stat. § 514.08',
    source: 'https://www.revisor.mn.gov/statutes/cite/514.08',
    checked: '2026-08-26',
    heading: '514.08 STATEMENT; NOTICE; NECESSITY FOR RECORDING; CONTENTS.',
    quote:
      'The lien ceases at the end of 120 days after doing the last of the work, or furnishing ' +
      'the last item of skill, material, or machinery, unless within this period',
    verdict: 'confirmed',
    finding: '120 days from the last of the work. Matches the dataset exactly.',
  },
]

/**
 * Jurisdictions whose statute could not be read from a free official source,
 * and why. Recorded so the gap is a known one rather than an assumption that
 * somebody got to it.
 */
export const UNVERIFIABLE_SOURCES = [
  {
    abbr: 'TX',
    reason:
      'statutes.capitol.texas.gov serves a JavaScript shell. The Property Code chapter URL ' +
      'returns 250KB containing no section text.',
  },
  {
    abbr: 'GA',
    reason:
      'The Official Code of Georgia Annotated is published under contract with LexisNexis. No ' +
      'free official full text is fetchable.',
  },
]

/** Rows checked against the statute, keyed as `${abbr}:${topic}`. */
export const VERIFIED_KEYS = new Set(
  VERIFIED_CITATIONS.map((v) => `${v.abbr}:${v.topic}`),
)

/**
 * The blanket date is not evidence. This is what a row can honestly claim.
 *
 * `dataset` means the figure came from the cited dataset and nobody in this
 * repository has opened the statute. It is not a synonym for wrong — it is a
 * statement about who has looked.
 */
export function verificationFor(abbr, topic = 'mechanicsLien') {
  return VERIFIED_CITATIONS.find((v) => v.abbr === abbr && v.topic === topic) ?? null
}
