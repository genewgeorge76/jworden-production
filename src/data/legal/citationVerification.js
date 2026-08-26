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
 *
 * ONE REJECTED SOURCE TURNED OUT TO BE RIGHT
 * ──────────────────────────────────────────
 * An unsourced 51-state lien table in another repository disagreed with the
 * cited datasets on 21 of 51 states and was rejected rather than imported. On
 * Utah it said 180 days where the cited dataset said 90.
 *
 * Utah Code § 38-1a-502(1) says 180. The rejected table was right and the
 * cited one was wrong.
 *
 * The rejection was still correct as a method — a figure with no citation
 * cannot be trusted because it happens to agree with a statute nobody had
 * read, and being right about Utah says nothing about the other twenty. What
 * it does mean is that the cited dataset does not automatically win a
 * disagreement. The remaining twenty are open questions, and each one is a
 * candidate for the next statute to read.
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
  {
    abbr: 'CA', topic: 'mechanicsLien', citation: 'Cal. Civ. Code §§ 8412, 8414',
    source: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=8412',
    checked: '2026-08-26',
    heading: '§ 8412 (direct contractor); § 8414 (claimant other than direct contractor)',
    quote:
      'Before the earlier of the following times: (1) Ninety days after completion of the work of ' +
      'improvement. (2) Sixty days after the owner records a notice of completion or cessation. ' +
      '[§ 8412] … (2) Thirty days after the owner records a notice of completion or cessation. [§ 8414]',
    verdict: 'corrected',
    finding:
      'The row had the two periods THE WRONG WAY ROUND — 30 days for general contractors and 60 ' +
      'for subcontractors. The statute is the reverse. As a GC that understated the time, which ' +
      'is merely wrong; as a subcontractor it promised sixty days where thirty are allowed, and a ' +
      'lien filed on day 45 in reliance on it is lost.',
  },
  {
    abbr: 'DE', topic: 'mechanicsLien', citation: '25 Del. C. § 2711',
    source: 'https://delcode.delaware.gov/title25/c027/sc02/index.html',
    checked: '2026-08-26', heading: '§ 2711. Statement of claim; time of filing.',
    quote:
      'within 180 days after the completion of such structure [contractor dealing directly with ' +
      'the owner] … within 120 days from the date from the completion of the labor performed or ' +
      'from the last delivery of materials furnished [all other claimants]',
    verdict: 'corrected',
    finding:
      'Both figures in the old note were wrong: it said 60 days for original contractors and 90 ' +
      'for subcontractors. The statute gives 180 days to a contractor dealing directly with the ' +
      'owner and 120 to everyone else.',
  },
  {
    abbr: 'NV', topic: 'mechanicsLien', citation: 'Nev. Rev. Stat. § 108.226',
    source: 'https://www.leg.state.nv.us/nrs/nrs-108.html',
    checked: '2026-08-26', heading: 'NRS 108.226 Perfection of lien: Time for recording notice of lien',
    quote:
      'Within 90 days after the date on which the latest of the following occurs: (1) The ' +
      'completion of the work of improvement; (2) The last delivery of material or furnishing of ' +
      'equipment by the lien claimant … or Within 40 days after the recording of a valid notice ' +
      'of completion',
    verdict: 'corrected',
    finding:
      'Ninety days was right but incomplete. A recorded and served notice of completion cuts the ' +
      'window to forty days and the row said nothing about it.',
  },
  {
    abbr: 'WI', topic: 'mechanicsLien', citation: 'Wis. Stat. § 779.06(1)',
    source: 'https://docs.legis.wisconsin.gov/statutes/statutes/779/i/06',
    checked: '2026-08-26', heading: '779.06 Lien claim; notice; foreclosure.',
    quote:
      'within 6 months from the date the lien claimant performed, furnished, or procured the last ' +
      'labor, services, materials, plans, or specifications, a claim for the lien is filed … ' +
      'within 2 years from the date of filing a claim for lien an action is brought',
    verdict: 'corrected',
    finding:
      'Six calendar months stored as 180 days. The two-year enforcement window from filing was ' +
      'correct at 730 days.',
  },
  {
    abbr: 'OR', topic: 'mechanicsLien', citation: 'Or. Rev. Stat. §§ 87.035, 87.055',
    source: 'https://www.oregonlegislature.gov/bills_laws/ors/ors087.html',
    checked: '2026-08-26', heading: '87.035 Perfecting lien; 87.055 Duration of lien',
    quote:
      'not later than 75 days after the person has ceased to provide labor, rent equipment or ' +
      'furnish materials or 75 days after completion of construction, whichever is earlier … ' +
      'No lien … shall bind any improvement for a longer period than 120 days after the claim of ' +
      'lien is filed unless suit is brought',
    verdict: 'confirmed',
    finding: 'Both figures exact — 75 days to file, 120 days from filing to sue.',
  },
  {
    abbr: 'ID', topic: 'mechanicsLien', citation: 'Idaho Code § 45-507',
    source: 'https://legislature.idaho.gov/statutesrules/idstat/Title45/T45CH5/SECT45-507/',
    checked: '2026-08-26', heading: '45-507. Claim of lien — filing.',
    quote: 'The claim shall be filed within ninety (90) days after the completion of the labor or services, or furnishing of materials.',
    verdict: 'confirmed', finding: '90 days. Matches.',
  },
  {
    abbr: 'ME', topic: 'mechanicsLien', citation: 'Me. Rev. Stat. tit. 10, § 3253',
    source: 'https://legislature.maine.gov/statutes/10/title10sec3253.html',
    checked: '2026-08-26', heading: '§3253. Dissolution of lien',
    quote: 'The lien under section 3252 is dissolved unless the claimant, within 90 days after ceasing to labor, furnish materials or perform services',
    verdict: 'confirmed', finding: '90 days from ceasing to labor. Matches.',
  },
  {
    abbr: 'OH', topic: 'mechanicsLien', citation: 'Ohio Rev. Code § 1311.06',
    source: 'https://codes.ohio.gov/ohio-revised-code/section-1311.06',
    checked: '2026-08-26', heading: '1311.06 Affidavit for mechanics lien.',
    quote: 'within seventy-five days from the date on which the last of the labor or work was performed or material was furnished by the person claiming the lien',
    verdict: 'confirmed', finding: '75 days. Matches.',
  },
  {
    abbr: 'WA', topic: 'mechanicsLien', citation: 'Wash. Rev. Code § 60.04.091',
    source: 'https://app.leg.wa.gov/RCW/default.aspx?cite=60.04.091',
    checked: '2026-08-26', heading: 'RCW 60.04.091 Claim of lien — Recording.',
    quote: 'no action to foreclose a lien shall be maintained unless the claim of lien is filed for recording within the ninety-day period stated',
    verdict: 'confirmed', finding: '90 days. Matches.',
  },
  {
    abbr: 'NE', topic: 'mechanicsLien', citation: 'Neb. Rev. Stat. § 52-137',
    source: 'https://nebraskalegislature.gov/laws/statutes.php?statute=52-137',
    checked: '2026-08-26', heading: '52-137. Lien; recording; time.',
    quote: "not later than one hundred twenty days after his or her final furnishing of services or materials, he or she has recorded a lien",
    verdict: 'confirmed', finding: '120 days from final furnishing. Matches.',
  },
  {
    abbr: 'UT', topic: 'mechanicsLien', citation: 'Utah Code § 38-1a-502(1)',
    source: 'https://le.utah.gov/xcode/Title38/Chapter1a/C38-1a-S502_1800010118000101.pdf',
    checked: '2026-08-26',
    heading: '38-1a-502 Notice of construction lien -- Contents -- Recording -- Service on owner.',
    quote:
      '(i) 180 days after the date on which final completion of the original contract occurs, if ' +
      'no notice of completion is filed under Section 38-1a-507; or (ii) 90 days after the date on ' +
      'which a notice of completion is filed under Section 38-1a-507, but not later than 180 days ' +
      'after the date on which final completion of the original contract occurs.',
    verdict: 'corrected',
    finding:
      'The row had the EXCEPTION recorded as the rule. Ninety days is what a claimant gets once ' +
      'the owner files a notice of completion. With no notice filed the period is 180 days, so ' +
      'every Utah job was being told it had half the time it has.',
  },
  {
    abbr: 'AZ', topic: 'mechanicsLien', citation: 'Ariz. Rev. Stat. § 33-993',
    source: 'https://www.azleg.gov/ars/33/00993.htm',
    checked: '2026-08-26', heading: '33-993. Notice and claim of lien; recording',
    quote:
      'within one hundred twenty days after completion of a building, structure or improvement … ' +
      'if a notice of completion has been recorded, within sixty days after recordation of such notice',
    verdict: 'corrected',
    finding:
      'The 120 days was right. The row said nothing about the recorded notice of completion that ' +
      'halves the window.',
  },
  {
    abbr: 'WV', topic: 'mechanicsLien', citation: 'W. Va. Code § 38-2-8',
    source: 'https://code.wvlegislature.gov/38-2-8/',
    checked: '2026-08-26', heading: '§38-2-8. Notice of lien by general contractor.',
    quote: 'within one hundred days after the completion of his work provided for in such contract',
    verdict: 'corrected',
    finding:
      'The count of 100 days was right, the anchor was not. The period runs from completion of the ' +
      'contract work, not from the last day materials happened to be furnished.',
  },
  {
    abbr: 'MT', topic: 'mechanicsLien', citation: 'Mont. Code Ann. § 71-3-535',
    source: 'https://mca.legmt.gov/bills/mca/title_0710/chapter_0030/part_0050/section_0350/0710-0030-0050-0350.html',
    checked: '2026-08-26', heading: '71-3-535. Attachment of lien -- filing.',
    quote:
      'the person has filed a lien not later than 90 days after: (a) the person\u2019s final ' +
      'furnishing of services or materials; or (b) the owner files a notice of completion pursuant ' +
      'to 71-3-533',
    verdict: 'confirmed', finding: '90 days from final furnishing. Matches.',
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
