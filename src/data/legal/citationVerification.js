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
  {
    abbr: 'SC',
    topic: 'mechanicsLien',
    citation: 'S.C. Code Ann. §§ 29-5-90, 29-5-120',
    source: 'https://www.scstatehouse.gov/code/t29c005.php',
    checked: '2026-08-26',
    heading: '§ 29-5-90 (filing); § 29-5-120 (dissolution unless suit commenced)',
    quote:
      'within ninety days after he ceases to labor on or furnish labor or materials for such ' +
      'building or structure … Unless a suit for enforcing the lien is commenced and notice of ' +
      'pendency of the action is filed within six months after the person desiring to avail ' +
      'himself of it ceases to labor on or furnish labor or material for the building or ' +
      'structure, the lien must be dissolved.',
    verdict: 'corrected',
    finding:
      'Filing at 90 days was right. Enforcement was wrong in the dangerous direction: the row ' +
      'held 365 days FROM FILING, which lands about fifteen months after work ends. The statute ' +
      'dissolves the lien six months after the claimant ceases to labor. Roughly nine months of ' +
      'time that does not exist.',
  },
  {
    abbr: 'IA',
    topic: 'mechanicsLien',
    citation: 'Iowa Code §§ 572.9, 572.27',
    source: 'https://www.legis.iowa.gov/docs/code/572.pdf',
    checked: '2026-08-26',
    heading: '572.9 Time of lien posting; 572.27 Limitation on action',
    quote:
      'shall be posted by a general contractor or subcontractor within two years and ninety days ' +
      'after the date on which the last of the material was furnished or the last of the labor ' +
      'was performed … Any action to enforce a mechanic\u2019s lien shall be brought within two ' +
      'years from the expiration of ninety days after the date on which the last of the material ' +
      'was furnished or the last of the labor was performed.',
    verdict: 'confirmed',
    finding:
      'Both figures check out. The 730-day enforcement period measured from a 90-day filing ' +
      'deadline reproduces the statute exactly: two years from the expiration of those ninety ' +
      'days. Worth knowing that §§ 572.10 and 572.11 allow posting after ninety days with the ' +
      'lien\u2019s extent limited against the owner — the 90 days is the full-priority window, ' +
      'not an absolute cutoff.',
  },
  {
    abbr: 'KS',
    topic: 'mechanicsLien',
    citation: 'Kan. Stat. Ann. § 60-1102',
    source: 'https://ksrevisor.gov/statutes/chapters/ch60/060_011_0002.html',
    checked: '2026-08-26',
    heading: '60-1102. Filing and recording of lien statement; notice of extension.',
    quote:
      'within four months after the date material, equipment or supplies, used or consumed was ' +
      'last furnished or last labor performed under the contract',
    verdict: 'corrected',
    finding:
      'The row stored 120 days for what the statute states as four calendar months. The two ' +
      'differ by up to three days depending on which months a job spans, and the difference ' +
      'always runs short.',
  },
  {
    abbr: 'IL',
    topic: 'mechanicsLien',
    citation: '770 ILCS 60/7',
    source: 'https://www.ilga.gov/documents/legislation/ilcs/documents/077000600K7.htm',
    checked: '2026-08-26',
    heading: 'Sec. 7. Claim for lien; third parties; errors or overcharges; multiple buildings or lots.',
    quote:
      'within 4 months after completion, or if extra or additional work is done or labor, ' +
      'services, material, fixtures, apparatus or machinery, forms or form work is delivered ' +
      'therefor within 4 months after the completion of such extra or additional work',
    verdict: 'corrected',
    finding:
      'Two errors. The row stored 120 days for four calendar months, and it ran the period from ' +
      'the last date of furnishing when the statute runs it from COMPLETION.',
  },
  {
    abbr: 'MO',
    topic: 'mechanicsLien',
    citation: 'Mo. Rev. Stat. § 429.080',
    source: 'https://revisor.mo.gov/main/OneSection.aspx?section=429.080',
    checked: '2026-08-26',
    heading: 'Section 429.080. Lien filed with circuit clerk, when.',
    quote:
      'within six months after the indebtedness shall have accrued, or, with respect to rental ' +
      'equipment or machinery rented to others, then, within sixty days after the date the last ' +
      'of the rental equipment or machinery was last removed from the property',
    verdict: 'corrected',
    finding:
      'The row said "6 months from last furnishing" and stored 180 days. The statute states six ' +
      'calendar months and runs them from when the INDEBTEDNESS ACCRUED, which is a question ' +
      'about the contract rather than the last day on site. The calculator now declines to ' +
      'compute Missouri and says why, instead of answering from the wrong event.',
  },
  {
    abbr: 'DC',
    topic: 'mechanicsLien',
    citation: 'D.C. Code § 40-301.02',
    source: 'https://code.dccouncil.gov/us/dc/council/code/sections/40-301.02',
    checked: '2026-08-26',
    heading: '§ 40–301.02. Notice.',
    quote:
      'The notice of intent shall be recorded during the construction or within 90 days after ' +
      'the earlier of the completion or termination of the project.',
    verdict: 'corrected',
    finding:
      'This row was a placeholder wearing the shape of a real one. Its note read "Advisory ' +
      'baseline: file promptly after last furnishing; verify claimant-specific statutory timing ' +
      'before filing", which is not a deadline, and its citation read "District of Columbia ' +
      'mechanics lien statutes and Superior Court filing procedures", which is a description of ' +
      'where to look rather than a statute. Both replaced with the section and its rule.',
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
    abbr: 'MI',
    reason:
      'legislature.mi.gov did not answer — the MCL section URL returns no HTTP response and the ' +
      'PDF mirror returns 503. Not evidence the statute is unavailable, only that it could not ' +
      'be read from here.',
  },
  {
    abbr: 'NJ',
    reason:
      'The New Jersey statutes are served through an NXT gateway that exposes a search interface ' +
      'rather than fetchable section text.',
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
