/**
 * publicRecordsWithheld.js — credentials we hold that no page may show.
 *
 * WHY THIS IS A SEPARATE FILE AND NOT A FLAG IN publicRecords.js
 * ─────────────────────────────────────────────────────────────
 * It started as a flag in that file, and the flag worked: the component read
 * only the verifiable rows and none of this reached a page. Then the built
 * bundle was grepped, and every withheld row was in it — the lapsed licence
 * number, and beneath it the sentence explaining that the qualifying
 * individual took out his own licence.
 *
 * Never rendered, and shipped to every visitor's browser anyway, because a
 * bundler ships the whole module when anything in it is imported. "The
 * component does not render it" is a statement about pixels, not about what
 * leaves the server.
 *
 * So the boundary is now a file boundary, which a bundler respects. Page code
 * imports publicRecords.js and cannot reach this module. The test suite and
 * the operator cockpit import this one.
 *
 * THE REASONS ARE THE POINT
 * ─────────────────────────
 * Each row records why it cannot be published. Without that, the next person
 * to read the archive finds an SCDOT permit, a Richmond permit and a DPOR
 * number, sees only two of them on the sites, and reasonably assumes an
 * oversight. It was a decision, and a decision that is not written down gets
 * quietly reversed by someone being helpful.
 */

import { HELD, UNCONFIRMED, LAPSED, BRAND_JWORDEN, BRAND_CAROLINA, BRAND_SHARED } from './publicRecords.js'

export const WITHHELD_RECORDS = [
  {
    id: 'va-scc-s1800053',
    brand: BRAND_JWORDEN,
    status: UNCONFIRMED,
    authority: 'Virginia State Corporation Commission',
    authorityShort: 'Virginia SCC',
    kind: 'Registered Entity',
    reference: 'S1800053',
    state: 'VA',
    year: 2015,
    headline: 'Virginia SCC — J. Worden & Sons Paving, LLC',
    plain:
      'Limited liability company registered with the Virginia State Corporation Commission under SCC ID S1800053.',
    // DEMOTED FROM PUBLISHED, 2026-08-26. THIS ONE WAS MY ERROR.
    //
    // It shipped as VERIFIABLE, on the site, worded "with annual registration
    // filings on record". Four SCC emails exist in the archive and the most
    // recent is 2016-06-08. The last annual registration FEE payment is
    // 2016-02-29. A Virginia LLC owes that fee every year, so "filings on
    // record" was true of 2016 and asserted of the present tense.
    //
    // What prompted the re-check was Georgia. The same company let its Georgia
    // registration lapse to the point of a dissolution notice, and once that
    // was on the table an unexamined ten-year silence in the Virginia file
    // stopped looking like an archiving gap.
    //
    // Ten years of silence is not proof of termination — fees may have been
    // paid by another route, or notices sent elsewhere. It is equally not
    // proof of good standing, and good standing was what the page implied.
    // Neither register is machine-checkable from here: cis.scc.virginia.gov
    // sits behind a cookie gate and Georgia's behind Cloudflare.
    //
    // So it comes off the site until the register itself is read. That is the
    // same rule the DPOR licence got, applied to my own work.
    whyNotPublished:
      'Last SCC filing in the archive is 2016. Virginia’s registration fee is annual, so ten years of silence cannot support a present-tense claim of good standing. The register was not readable from here.',
    resolvedBy:
      'Search cis.scc.virginia.gov for SCC ID S1800053. If active and in good standing, restore to publicRecords.js as VERIFIABLE with the status date.',
    lastFilingInArchive: '2016-06-08',
    demotedFromPublished: '2026-08-26',
    source:
      'SCC eFile confirmations: registered agent change 2015-11-19, annual registration fee 2016-02-29, certificate order 2016-06-08. Nothing after.',
    sourceVerified: '2026-08-26',
  },

  {
    id: 'ga-sos-16031980',
    brand: BRAND_JWORDEN,
    status: UNCONFIRMED,
    authority: 'Georgia Secretary of State, Corporations Division',
    authorityShort: 'Georgia SOS',
    kind: 'Registered Entity',
    reference: '16031980',
    state: 'GA',
    year: 2016,
    headline: 'Georgia SOS — J. Worden and Sons Paving LLC, control number 16031980',
    plain:
      'Registered with the Georgia Secretary of State under control number 16031980, with annual registrations processed in 2018 and 2020.',
    // FOUND 2026-08-26, AND IT IS NOT THE CREDENTIAL IT FIRST LOOKED LIKE
    //
    // Georgia matters more here than any other secondary state: 29 paid KBP
    // stores, the Atlanta market pages, and a domain pointed at that market. A
    // Georgia registration would have been the natural thing to publish beside
    // them.
    //
    // The trail in the archive:
    //
    //   2018-02-01  2018 annual registration processed
    //   2020-08-22  2020 annual registration processed
    //   2021-02..04 four "2021 Annual Registration Season" reminders
    //   2021-07-19  grounds determined for administrative dissolution
    //   2021-07-28  Notice of Intent to Administratively Dissolve
    //   2021-07-28  Notice of Intent to Revoke
    //   thereafter  nothing
    //
    // The notice gives sixty days from 2021-07-19 to cure by filing the annual
    // registration — so the window closed around 2021-09-17. The account was
    // subscribed to the Corporations Division e-notification service, which is
    // why the reminders and both notices arrived at all, and no cure
    // confirmation followed them.
    //
    // That is strong, and it is still circumstantial. A filing made by post,
    // or a confirmation sent to the registered agent rather than here, would
    // leave the same silence. What it rules out is publishing Georgia
    // registration as a current fact.
    whyNotPublished:
      'Georgia issued a Notice of Intent to Administratively Dissolve and a Notice of Intent to Revoke on 2021-07-28, with sixty days from 2021-07-19 to cure. No cure and no later annual registration appears in the archive.',
    resolvedBy:
      'Search ecorp.sos.ga.gov for control number 16031980 and read the entity status. If it was cured or has since been reinstated, record the status date; if it was dissolved, that is the fact and no Georgia page may imply otherwise.',
    ownerShouldReview:
      'This is the one to check first. Georgia carries 29 paid stores and the Atlanta market pages, and an administratively dissolved entity cannot lawfully transact there until reinstated.',
    registeredAgent: 'InCorp (agent of record on the 2018 and 2020 filings)',
    source:
      'Georgia SOS e-notifications to this address: annual registrations 2018-02-01 and 2020-08-22; Notice of Intent to Administratively Dissolve and Notice of Intent to Revoke, both 2021-07-28.',
    sourceVerified: '2026-08-26',
  },

  {
    id: 'sc-sos-filing',
    brand: BRAND_CAROLINA,
    status: UNCONFIRMED,
    authority: 'South Carolina Secretary of State',
    authorityShort: 'SC SOS',
    kind: 'Business Filing',
    reference: null,
    state: 'SC',
    year: 2020,
    headline: 'South Carolina Secretary of State filing',
    plain:
      'A business filing submitted to the South Carolina Secretary of State was approved on 24 August 2020.',
    // The confirmation email carries no entity number and does not say which
    // filing it was — formation, foreign qualification or an amendment. Those
    // are materially different claims and the archive does not distinguish
    // them, so nothing goes on a page until the SOS record itself is read.
    whyNotPublished:
      'The confirmation names no entity number and does not say which filing was approved. Formation, foreign qualification and amendment are different claims; the archive cannot tell them apart.',
    resolvedBy:
      'Search the SC Secretary of State business entity register for the company name and record the entity ID and filing type.',
    // The full sequence, recovered 2026-08-26. It was not one filing but four
    // messages over three days, and the shape of it is informative:
    //
    //   2020-08-22 04:28  registration confirmation, SC Business Entities Online
    //   2020-08-22 04:40  filing confirmation, "j worden and sons paving llc"
    //   2020-08-24 13:47  TRANSACTION REJECTED
    //   2020-08-24 17:43  filing confirmation, "J Worden & Sons paving LLC"
    //   2020-08-24 18:53  TRANSACTION APPROVED
    //
    // A rejection followed by a refile under a differently-punctuated name and
    // then an approval. Still no entity number in any of the five messages and
    // still no statement of which filing type was approved, so the row does
    // not move. But it is now clear a filing was actually completed rather
    // than merely attempted.
    filingSequence: '2020-08-22 submitted, 2020-08-24 rejected, refiled, approved same day',
    source:
      'noreply@noreply.sc.gov: registration confirmation and filing confirmation 2020-08-22; "Business Filing Transaction Rejected" 2020-08-24 13:47; filing confirmation 17:43; "Business Filing Transaction Approved" 18:53.',
    sourceVerified: '2026-08-26',
  },

  {
    id: 'vsp-safety-audit-2015',
    brand: BRAND_SHARED,
    status: UNCONFIRMED,
    authority: 'Virginia State Police, Motor Carrier Safety Unit',
    authorityShort: 'Virginia State Police',
    kind: 'New Entrant Safety Audit',
    reference: null,
    state: 'VA',
    year: 2015,
    headline: 'New entrant safety audit, September 2015',
    plain:
      'A Virginia State Police safety auditor scheduled a new-entrant safety audit of USDOT 2568168 for 15 September 2015.',
    // The scheduling letter is in the archive. The RESULT is not. A passed
    // audit is a credential; a scheduled audit is a calendar entry, and the
    // difference is the entire value of the row. The FMCSA record shows the
    // carrier's New Entrant Status as no longer pending, which is consistent
    // with the audit having been completed — consistent with, not proof of.
    whyNotPublished:
      'The archive holds the scheduling letter, not the outcome. A scheduled audit is not a passed audit, and the difference is the whole claim.',
    resolvedBy:
      'The audit result is obtainable from FMCSA or Virginia State Police against USDOT 2568168.',
    source:
      'Email from a Virginia State Police safety auditor, 2015-08-12, attaching "SA Confirmation - DOT 2568168".',
    sourceVerified: '2026-08-26',
  },

  {
    id: 'va-dmv-irp-ifta',
    brand: BRAND_SHARED,
    status: HELD,
    authority: 'Virginia Department of Motor Vehicles',
    authorityShort: 'Virginia DMV',
    kind: 'IRP / IFTA Credentials',
    reference: null,
    state: 'VA',
    year: 2015,
    headline: 'Virginia DMV apportioned registration and fuel tax licence',
    plain:
      'Apportioned interstate registration (IRP) processed by Virginia DMV in 2015, and an active IFTA fuel tax licence — DMV was still addressing the company as a Virginia IFTA licensee in 2025 and 2026.',
    // Real, current, and useless to a stranger: IRP and IFTA records are not
    // publicly searchable by name the way a USDOT number is. It is recorded
    // because it corroborates the interstate operation the USDOT row asserts.
    whyNotPublished:
      'IRP and IFTA records are not publicly searchable, so a reader cannot confirm them. They corroborate the USDOT row rather than standing on their own.',
    source:
      'Virginia DMV IFTA/IRP processing notices 2015-06-10 and 2015-09-24; DMV IFTA licensee notices 2025-10-12 and 2026-07-16.',
    sourceVerified: '2026-08-26',
  },

  {
    id: 'dpor-2705105644',
    brand: BRAND_JWORDEN,
    status: LAPSED,
    authority: 'Virginia Department of Professional and Occupational Regulation',
    authorityShort: 'Virginia DPOR',
    kind: 'Class A Contractor Licence',
    reference: '2705105644',
    state: 'VA',
    year: 2016,
    headline: 'Virginia Class A contractor licence 2705105644',
    plain:
      'Class A contractor licence 2705105644, held by this company and confirmed by a third party against the state register in 2016.',
    // THE ONE ROW THAT MUST NEVER DRIFT BACK TO PRESENT TENSE
    //
    // See the block in src/lib/businessInfo.js. The qualifying individual — a
    // named person who has passed the trade exam and stands behind the licence
    // — was the owner's son. He took out his own licence, which removed him as
    // this company's qualifier, and the licence lapsed at the following
    // renewal because nobody was left holding the exam credential.
    //
    // The owner is sitting the exam to re-qualify the company. That is a real
    // remedy in motion and it is still not a current licence, and a buyer
    // checking DPOR would find that out in one search.
    //
    // So: the number is recorded, the history is recorded, and no page says
    // "Class A licensed" in the present tense until DPOR says it again.
    whyNotPublished:
      'Not current. The qualifying individual took out his own licence, which removed him as this company’s qualifier, and the licence lapsed at renewal. The owner is sitting the exam to re-qualify.',
    expired: '2024-06-30',
    remedyInMotion: true,
    resolvedBy:
      'On requalification, confirm the new expiration date against the DPOR register and move this row to VERIFIABLE.',
    source:
      'Licence number confirmed by a customer against the Virginia register, 2016-06-11. Lapse recorded in src/lib/businessInfo.js.',
    sourceVerified: '2026-08-25',
  },
]

/**
 * What the FMCSA snapshot reports about USDOT 2568168 beyond its ACTIVE
 * status. All true, none of it publishable — see the reason field.
 */
export const USDOT_UNPUBLISHED = {
  usdot: '2568168',
  inspectionsTwoYear: 0,
  crashesTwoYear: 0,
  outOfServiceRate: '0%',
  safetyRating: 'None',
  operatingAuthority: 'NOT AUTHORIZED (for-hire authority not held)',
  powerUnits: 1,
  drivers: 1,
  // A 0% out-of-service rate computed over zero inspections is not a safety
  // record. It is an empty set with a percentage sign on it. SAFER prints the
  // national averages directly beside it — 22.26% vehicle, 6.67% driver — so
  // publishing ours would read as "we outperform the industry" when what it
  // actually says is "nobody has looked".
  //
  // Safety Rating is "None": never rated, so no rating may be claimed either.
  //
  // Operating Authority reads NOT AUTHORIZED. For a contractor moving its own
  // equipment that is normal and expected; for-hire authority is a different
  // thing and we do not hold it. Nothing on any page may imply we do.
  reason:
    'A 0% out-of-service rate over 0 inspections measures nothing. No safety rating has ever been issued. For-hire authority is not held and must never be implied.',
  // The owner's to act on, not the site's: the MCS-150 on file declares one
  // power unit and one driver. That is the filed figure, not a judgement about
  // the operation.
  // CORRECTED 2026-08-26. An earlier note here flagged the 1 power unit / 1
  // driver figure as possibly stale and suggested filing an updated MCS-150.
  // The owner's account: trucks were sold when the pandemic hit and the
  // operation now runs one dump truck. The filed figure is accurate. No
  // correction is needed and none should be filed on the strength of that
  // earlier note.
  fleetFigureIsCurrent: true,
  fleetFigureBasis: 'owner-stated, 2026-08-26 — trucks sold during the pandemic, one dump truck now',

  // WHY 0 INSPECTIONS IS COHERENT RATHER THAN SUSPICIOUS
  // SAFER counts roadside inspections over a rolling 24 months. The owner
  // reports the last time the truck was pulled over was 2024, in South
  // Carolina. One truck running reduced miles, with the last stop at or beyond
  // the edge of that window, produces exactly the empty inspection record the
  // snapshot shows.
  //
  // Note also that being pulled over is not the same as a recorded inspection:
  // a stop that produces no inspection report never reaches SMS at all. So the
  // owner's account and the zero on the record do not even conflict.
  lastStopReported: '2024, South Carolina (owner-stated, 2026-08-26)',
}

/**
 * THE 2015 NEW ENTRANT SAFETY AUDIT, AND WHY ITS RESULT IS NOT ON SAFER
 * ────────────────────────────────────────────────────────────────────
 * The archive holds the scheduling letter — a Virginia State Police safety
 * auditor set an audit of USDOT 2568168 for 15 September 2015 — and no result.
 * Every public FMCSA system was checked for one on 2026-08-26:
 *
 *   SAFER company snapshot   Review Information: Rating Date None, Review Date
 *                            None, Rating None, Type None.
 *   FMCSA SMS (A&I)          "Most Recent Investigation" empty. 0 inspections,
 *                            0 crashes.
 *   QCMobile API             requires a webKey; returns no audit field anyway.
 *   Licensing & Insurance    captcha-gated, and covers authority and insurance
 *                            rather than audits.
 *   The mailbox              only the scheduling letter.
 *
 * That is not a gap in the record. It is what the regulation prescribes.
 *
 * 49 CFR 385.319, read at the source: "A safety audit will not result in a
 * safety fitness determination. Safety fitness determinations follow
 * completion of a compliance review." On a pass the Agency "will provide the
 * new entrant written notice as soon as practicable, but not later than 45
 * days after completion of the safety audit, that it has adequate basic safety
 * management controls."
 *
 * So the result exists as a letter sent to the carrier, not as a public field.
 * SAFER reading "Rating: None" is exactly what a carrier looks like when it
 * passed a safety audit and never had a compliance review. It is not evidence
 * of anything either way.
 *
 * WHAT THE PUBLIC RECORD SUPPORTS, AND WHERE IT STOPS
 * Registered 2015, ACTIVE in 2026, no out-of-service date, no investigation on
 * record. Under Part 385 a new entrant whose audit finds inadequate controls
 * is notified and, unremedied, has its registration revoked. Eleven years of
 * unbroken ACTIVE status is consistent with a pass.
 *
 * Consistent with. Not proof of. It is an inference from the absence of a
 * revocation, and "we passed our FMCSA safety audit" is a sentence that needs
 * the letter, not the inference. Nothing goes on a page until the letter or an
 * FMCSA record is in hand.
 */
export const SAFETY_AUDIT_2015 = {
  usdot: '2568168',
  scheduled: '2015-09-15',
  auditor: 'Virginia State Police, Motor Carrier Safety & Hazardous Materials Unit',
  resultInArchive: false,
  publiclyRetrievable: false,
  whyNotPublic:
    '49 CFR 385.319 — a safety audit produces no safety fitness determination. The result is delivered as written notice to the carrier within 45 days, not published.',
  publicSystemsChecked: ['SAFER company snapshot', 'FMCSA SMS', 'QCMobile', 'Licensing & Insurance'],
  checkedOn: '2026-08-26',

  // THE MAILBOX SWEEP, RECORDED SO NOBODY REPEATS IT
  //
  // The owner's recollection was that the record is in the email. It is not in
  // the connected mailbox, and that is worth writing down rather than leaving
  // for the next person to rediscover over another hour.
  //
  // j.wordenandsonspaving@gmail.com — 33,610 inbox, 1,916 sent, one account,
  // no other mailbox attached. Searched 2026-08-26:
  //
  //   in:anywhere "safety audit" | "management controls" | "new entrant"
  //     | "safety fitness" | 385.319        28 threads, all newsletters bar one
  //   in:anywhere filename:audit|safety|SA|MCS|CSA     5 threads, same one
  //   2568168                                 vendor compliance spam, 2020–21
  //   .gov senders                            DOT, DMV, SCC, VSP credentials
  //   to:dmv.virginia.gov 2015-09 → 2016-03   two IRP notices, no audit
  //   has:attachment 2015-09-14 → 2016-02     nothing
  //
  // in:anywhere covers trash and spam. The single relevant hit in every sweep
  // is the same August 2015 scheduling letter. The result is not here.
  //
  // WHERE IT MORE LIKELY IS
  // Jessica Lewis was the office manager through 2015 and 2016 and handled the
  // paperwork this would have landed in — certificates of insurance, W-9s,
  // carrier filings. In November 2015, two months after the audit, she was the
  // one arranging DOT numbers for the truck doors with the sign company.
  // jessica.wordenandsons@gmail.com is the mailbox to search next and it is not
  // connected to this session.
  mailboxSwept: {
    account: 'j.wordenandsonspaving@gmail.com',
    sweptOn: '2026-08-26',
    found: false,
    coveredTrashAndSpam: true,
    nextMailbox: 'jessica.wordenandsons@gmail.com — office manager 2015–2016, handled carrier and insurance filings',
  },
  // OWNER'S ACCOUNT, 2026-08-26, AND WHY IT FITS THE REGULATION EXACTLY
  //
  // "In 2015 we met a state trooper and he approved us onsite."
  //
  // That is not a loose recollection — it is the procedure. 49 CFR 385.319(a):
  // "Upon completion of the safety audit, the auditor will review the findings
  // with the new entrant." A trooper going through the findings on site and
  // saying it was fine IS that step, and it is the step that comes before the
  // written notice rather than instead of it.
  //
  // So the audit was conducted and the on-site review was favourable. Still
  // owner-stated recollection of something said aloud eleven years ago, and
  // the determination of record is the letter. It moves nothing to publishable
  // on its own.
  onSiteReview: {
    reported: 'The auditor reviewed the findings on site and approved the company.',
    basis: 'owner-stated, 2026-08-26',
    matchesRegulation: '49 CFR 385.319(a) — auditor reviews findings with the new entrant on completion.',
    publishable: false,
  },

  // WHERE THE DOCUMENT WENT, WHICH IS THE MOST USEFUL THING THE OWNER SAID
  //
  // "We had to give that to the DMV at that time."
  //
  // This explains the missing copy and points at one that may still exist. The
  // dates line up without being forced:
  //
  //     2015-06-10  IRP ORIGINAL processed by Virginia DMV (log 96992372)
  //     2015-08-12  safety audit scheduled by Virginia State Police
  //     2015-09-15  safety audit conducted
  //     2015-09-24  IRP SUPPLEMENTAL processed by Virginia DMV (log 100878139)
  //
  // The DMV transaction nine days after the audit is consistent with the audit
  // documentation having been handed over as part of it. Consistent with —
  // the sequence is suggestive and it is not proof of a causal link, and this
  // note must not harden into one.
  //
  // The practical point stands either way: Virginia DMV was given the document
  // and its motor carrier file is a place to ask.
  handedToDmv: {
    reported: 'The audit documentation was given to Virginia DMV at the time.',
    basis: 'owner-stated, 2026-08-26',
    supportingSequence:
      'IRP supplemental processed by Virginia DMV 2015-09-24, nine days after the 2015-09-15 audit.',
    caution: 'The sequence is consistent with the account. It does not establish a causal link.',
  },

  howToObtain: [
    'FMCSA Portal (portal.fmcsa.dot.gov) — the carrier’s own login lists its own investigations and audits. Free, immediate, already the owner’s account.',
    'Virginia DMV motor carrier / IRP file — the owner states the audit documentation was handed to DMV in 2015, and a DMV transaction followed nine days after the audit. Ask against USDOT 2568168.',
    'Virginia State Police Motor Carrier Safety Unit — they conducted the audit and hold the report.',
    'The written notice itself — posted to the company address within 45 days of 2015-09-15, so October or November 2015. A paper file, not an email.',
  ],
  ifObtained:
    'A passed safety audit moves to publicRecords.js as VERIFIABLE only if a reader can confirm it. If the only artefact is a letter in a drawer, it stays here — holding a copy is not the same as being checkable.',
}

export function withheldById(id) {
  return WITHHELD_RECORDS.find((r) => r.id === id) || null
}
