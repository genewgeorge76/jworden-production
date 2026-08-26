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
    // OWNER CONFIRMED, 2026-08-26: "i havent renewed the georgia one".
    //
    // So the inference above is settled and the sixty-day cure window was not
    // used. The registration is not current.
    //
    // WHAT THIS DOES NOT TOUCH, WHICH MATTERS MORE THAN IT SOUNDS
    // The 29 paid Georgia stores were done while the registration WAS current
    // — annual registrations processed 2018 and 2020, and the work sits inside
    // that span. A past job does not become unsayable because a registration
    // later lapsed. The Georgia work, the county pages and the landmark data
    // are all unaffected.
    //
    // What is affected is any PRESENT-TENSE claim to operate in Georgia, and
    // any new Georgia work, which needs the registration reinstated first.
    ownerConfirmed: {
      status: 'not renewed',
      basis: 'owner-stated, 2026-08-26',
      consequence: 'Registration not current. Past Georgia work is unaffected; new work needs reinstatement.',
    },
    whyNotPublished:
      'Owner confirms the Georgia registration was not renewed after the 2021 notices. It is not current and may not be stated as such.',
    resolvedBy:
      'If Georgia work resumes, reinstate at ecorp.sos.ga.gov against control number 16031980 and record the new status date.',
    ownerShouldReview:
      'No page may imply current Georgia registration. Historic Georgia work stays publishable — it was performed while the registration was live.',
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
    // Owner's view, 2026-08-26: "the south carolina one should be good i think".
    // Hedged, and hedging is not evidence. It stays UNCONFIRMED. This is the
    // state holding the SCDOT permit and 18 invoiced Carolina jobs, so it is
    // worth five minutes on the register rather than a guess.
    ownerBelief: 'likely current — owner-stated and explicitly uncertain, 2026-08-26',
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
    id: 'nascla-accredited-exam',
    brand: BRAND_JWORDEN,
    status: UNCONFIRMED,
    authority: 'National Association of State Contractors Licensing Agencies',
    authorityShort: 'NASCLA',
    kind: 'Accredited Examination',
    reference: null,
    state: null,
    year: 2015,
    headline: 'NASCLA accredited examination',
    plain:
      'The owner states the company held NASCLA accreditation. NASCLA accreditation rests on a passed examination held by a named individual.',
    // WHY THIS IS WORTH CHASING RATHER THAN DROPPING
    //
    // A NASCLA accredited exam pass is not a licence and does not lapse the
    // way one does. It is a credential the person keeps, recognised for
    // reciprocity across participating states, and it would survive the Class A
    // licence lapsing. If the owner passed it, it is a genuine and durable
    // credential — the only one in this record that the 2024 lapse did not
    // touch.
    //
    // WHAT THE ARCHIVE ACTUALLY HOLDS, WHICH IS NOT THE CERTIFICATE
    //
    //   2015-01-05  PSI registration confirmation, support@psionline.com
    //   2020-01-07  a PSI candidate exam bulletin PDF, sent onward
    //
    // PSI administers the NASCLA examination among many others, so an account
    // and a bulletin are consistent with sitting it and equally consistent
    // with looking into it. Neither is a result. Searched in:anywhere for
    // nascla, "accredited examination", psiexams, psionline, score report,
    // exam result, prometric, candidate id — those two items are everything.
    //
    // The 2015 PSI registration does sit sensibly before the Class A licence,
    // which a customer confirmed against the state register in June 2016. A
    // coherent sequence is not a proof of one.
    whyNotPublished:
      'No score report or certificate in the archive. A PSI account and an exam bulletin are consistent with sitting the exam and with merely considering it.',
    resolvedBy:
      'NASCLA holds a national registry of individuals who have passed the Accredited Examination, and PSI retains candidate score reports. Either will confirm or refute it in one request.',
    removedFromSite: '2026-08-26',
    removedFromSiteNote:
      'The site claimed "NASCLA certified" in the Home trust points and the locations FAQ. Removed with the lapsed Class A claim, on the same rule: unverified credentials do not sit on pages. It goes back the day the certificate or registry entry appears.',
    source:
      'PSI registration confirmation 2015-01-05; PSI candidate exam bulletin PDF 2020-01-07. Owner states NASCLA accreditation was held (owner-stated, 2026-08-26).',
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

/**
 * THE OWNER'S LICENSING POLICY, AND WHAT IT OBLIGES THE SITES TO DO
 * ────────────────────────────────────────────────────────────────
 * Stated 2026-08-26: "when this system can produce work in marketed locations
 * the licences will be obtained to do the said work."
 *
 * That is ordinary and sound contracting practice. Nobody carries credentials
 * in fifty states on the chance of a job; you licence to the contract. It also
 * fits the shape of the business after the pandemic — a smaller operation with
 * a national record, licensing per market as work lands.
 *
 * But it has a direct consequence for what the pages may say, and the
 * consequence is the whole reason this block exists:
 *
 *     MARKETING A LOCATION IS NOT CLAIMING A CREDENTIAL IN IT.
 *
 * The sites market Virginia, the Carolinas, Georgia, Michigan, Texas and more,
 * and under this policy the licences for most of those markets do not exist
 * yet and are not meant to. So a page may say where we work, what we have
 * built and to which specification. It may not say we are licensed there.
 *
 * That distinction is what the 2026-08-26 sweep enforced. Ten claims came off
 * the pages, including a hasCredential node in the JSON-LD — which
 * businessInfo.canonical.js had already documented as forbidden while
 * schemas.js emitted it anyway. Insurance claims were left alone: general
 * liability and workers' compensation are separate, were not stated to have
 * lapsed, and are not credentials granted by a state.
 */
export const LICENSING_POLICY = {
  stated: '2026-08-26',
  policy: 'Licences are obtained per market when work is secured there, not carried speculatively.',
  basis: 'owner-stated',
  siteRule:
    'Pages may state where work is performed and to what specification. Pages may not state or imply a licence in a market where one is not currently held.',
  insuranceUnaffected:
    'General liability and workers’ compensation are separate from state licensing, were not stated to have lapsed, and remain on the pages.',
  sweptOn: '2026-08-26',
  claimsRemoved: [
    'src/lib/schemas.js — hasCredential node naming the Virginia Class A licence in JSON-LD',
    'src/pages/Home.jsx — trust point and licensing FAQ answer',
    'src/components/locations/LocationsFAQ.jsx — "we hold a Virginia Class A Contractor license"',
    'src/components/CommercialClientAuthority.jsx — "Verified Class A License" badge',
    'src/data/corridorServiceAreas.js — public-work FAQ answer',
    'src/components/ChatWidget.jsx — "fully licensed in Virginia"',
    'src/pages/CityPage.jsx — "Fully licensed and insured" bullet',
    'src/pages/ResidentialAsphalt.jsx — "Licensed And Insured" heading',
    'src/pages/RichmondPaving.jsx — "fully licensed and insured"',
    'NASCLA certification claims alongside the above',
  ],
  stillToReview: [
    'src/data/blogPosts.js and src/lib/fallbackBlogPosts.js and src/pages/generated-blogs/HoaAsphaltPavingGuideBlog.jsx carry licensing language inside article prose rather than as site claims. Lower stakes and different register — advice about checking a contractor’s licensing is not a claim about ours — but they should be read before the next content pass.',
  ],
}

/**
 * THE FOURTH ILLINOIS BOND
 * ────────────────────────
 * The broker's statement of 2016-11-15 invoices four bonds at $75 each, $300
 * in total, all through Contractors Bonding and Insurance Company. Three are
 * published in publicRecords.js against Oak Forest, Midlothian and South
 * Chicago Heights. This is the fourth.
 *
 * WHAT THE MAILBOX CAN AND CANNOT SETTLE
 *
 * It can settle that the bond exists: the statement names policy LSM0900110,
 * effective 2016-10-10, term to 2017-10-10, invoice 631097, $75 — issued the
 * same day as Oak Forest (LSM0900108) and Midlothian (LSM0900109), both of
 * which are south Cook County villages. A fourth south-suburban Chicago
 * municipality is the obvious reading.
 *
 * It cannot settle which one. Searched 2026-08-26: all correspondence between
 * 2016-09-20 and 2016-10-26 mentioning a village, city, bond, licence, permit
 * or clerk — twelve threads, every one a newsletter or an unrelated invoice.
 * The three October bonds were evidently arranged by telephone, and the
 * archive holds no municipal correspondence from that window at all.
 *
 * THE FAX WAS CHASED AND IS NOT THE ANSWER
 *
 * On 2016-11-11 the broker faxed a bond to 1-708-755-1881. The chain reads:
 * 09:35 the owner sends a photograph, "This one I need next"; 09:36 he gives
 * that fax number; 15:56 the broker faxes the bond; 17:07 she emails him the
 * South Chicago Heights bond LSM0900702.
 *
 * So the fax is same-day with LSM0900702, and 708-755 is the Chicago Heights
 * exchange. It is South Chicago Heights being served by fax as well as by
 * email, not a fifth municipality — and it is a November transaction, while
 * LSM0900110 is an October one. The fax cannot identify it.
 *
 * The fax cover note carries no bond attachment, only the broker's signature
 * image, so nothing further can be read out of it.
 *
 * HOW IT ACTUALLY GETS RESOLVED
 *
 * The surety holds the answer and one enquiry gets it. This does not need the
 * mailbox at all.
 */
export const FOURTH_ILLINOIS_BOND = {
  number: 'LSM0900110',
  surety: 'Contractors Bonding and Insurance Company (an RLI company), Peoria, Illinois',
  effective: '2016-10-10',
  termEnds: '2017-10-10',
  brokerInvoice: '631097',
  premiumUsd: 75,
  obligee: null,
  likelyObligee: 'A fourth south Cook County municipality — inferred from the two bonds issued the same day, and not evidence.',
  faxChased: '2026-08-26 — 1-708-755-1881 is same-day with the November South Chicago Heights bond and on the Chicago Heights exchange. Not a separate municipality.',
  mailboxSearched: '2026-08-26 — no municipal correspondence exists between 2016-09-20 and 2016-10-26.',
  resolvedBy:
    'Ask Contractors Bonding and Insurance Company for the obligee on bond LSM0900110. The surety holds it and the mailbox never will.',
  publishable: false,
}

/**
 * THE AURORA INSURANCE CERTIFICATE — CORROBORATION, NOT A CREDENTIAL
 * ─────────────────────────────────────────────────────────────────
 * An ACORD 25 certificate of liability insurance dated 11 October 2017, naming
 * the City of Aurora at 44 E Downer Place as certificate holder. It is the
 * same date as performance bond LSM1151451, which is the useful part: a
 * municipality releasing a right-of-way permit asks for a bond and a
 * certificate together, and here both were produced on the same day for the
 * same obligee. Two independent documents describing one transaction.
 *
 * WHY IT IS NOT PUBLISHED, THOUGH THE BOND IS
 * The certificate says so itself, in capitals across the top: issued as a
 * matter of information only, conferring no rights, and not amending the
 * policies. It is a snapshot of coverage on one day in 2017, not a credential
 * and not something a stranger can confirm at any authority — an insurer will
 * not discuss a policy with a member of the public. Under this repository's
 * test it is HELD.
 *
 * Every policy period on it expired in 2018. Publishing 2017 limits in 2026
 * would imply current coverage that this document cannot support, which is the
 * same tense error that demoted the Virginia SCC registration.
 *
 * The limits are recorded because a bid package asks for them and an operator
 * needs to know what was carried. They are not marketing copy.
 */
export const AURORA_INSURANCE_CERTIFICATE = {
  form: 'ACORD 25 Certificate of Liability Insurance',
  issued: '2017-10-11',
  certificateHolder: 'City of Aurora, 44 E Downer Place, Aurora, IL 60505',
  certificateNumber: '17-18 MASTER COI',
  broker: 'MIG, Rock Hill, South Carolina',
  carriers: ['Selective Insurance Co. (general liability, auto, umbrella, inland marine)', 'Accident Fund National Insurance Co. (workers compensation)'],
  coverageAsOf2017: {
    generalLiabilityEachOccurrenceUsd: 1000000,
    generalAggregateUsd: 2000000,
    productsCompletedOperationsAggregateUsd: 2000000,
    automobileCombinedSingleLimitUsd: 1000000,
    umbrellaEachOccurrenceUsd: 1000000,
    workersCompEmployersLiabilityEachAccidentUsd: 500000,
    inlandMarineAnyOneItemUsd: 25000,
    inlandMarineTotalLimitUsd: 100000,
  },
  allPolicyPeriodsExpired: 2018,
  corroborates: 'aurora-performance-bond-2017',
  status: UNCONFIRMED,
  publishable: false,
  whyWithheld:
    'An ACORD certificate confers no rights by its own terms, cannot be confirmed by a member of the public, and its policy periods all expired in 2018. Publishing 2017 limits would imply current coverage the document cannot support.',
  sourceVerified: '2026-08-26',
}

/**
 * THE SUCCESSION, IN A CORPORATE DOCUMENT RATHER THAN CORRESPONDENCE ABOUT ONE
 * ───────────────────────────────────────────────────────────────────────────
 * ownershipRecord.js rests the handover on an exchange in which the prior
 * principal corrected a draft letter and put the takeover at 15 March 2015.
 * That was the best evidence available and it was correspondence about a
 * document, not the document.
 *
 * This is a corporate one: minutes of a shareholders' meeting of J. Worden &
 * Sons Paving LLC held 6 April 2015, recording that the prior principal was
 * reported deceased on 25 February 2015, appointing the current owner and one
 * other as officers, and recording two family members withdrawing from their
 * positions. It is signed off by a chairperson.
 *
 * TWO DATES THAT DO NOT MATCH, LEFT UNMATCHED
 * The prior principal's own correction says 15 March 2015. These minutes put
 * the formal appointment at 6 April 2015. Both can be true — an operational
 * handover followed by its formalisation three weeks later is the ordinary
 * shape of such a thing — but "can be true" is not evidence, and this file does
 * not merge two dates into one story.
 *
 * WHY IT IS NOT PUBLISHED, AND WOULD NOT BE EVEN IF IT COULD BE
 * Internal minutes on a commercial template are not a state filing; no
 * registrar holds them and no stranger can confirm them. Beyond that, the
 * document contains a named private individual's date of death and the names of
 * family members leaving the business. A marketing page has no business
 * carrying either, whatever it might do for a heritage claim.
 *
 * What it supports internally is narrow and real: that a succession occurred in
 * 2015 and was minuted. It says nothing at all about 1984, or about how many
 * generations preceded it.
 */
export const SHAREHOLDERS_RESOLUTION_2015 = {
  document: 'Minutes of a meeting of shareholders, J. Worden & Sons Paving LLC',
  meetingDate: '2015-04-06',
  priorPrincipalReportedDeceased: '2015-02-25',
  officersAppointed: 2,
  membersWithdrawing: 2,
  chairpersonSigned: true,
  corroborates: 'A 2015 succession, minuted by the company itself.',
  tensionWithOwnershipRecord:
    'ownershipRecord.js carries 15 March 2015 from the prior principal’s own correction; these minutes formalise on 6 April 2015. Recorded as two dates, not reconciled into one.',
  provesNothingAbout: ['the 1984 founding year', 'the generation count', 'unbroken trading'],
  status: HELD,
  publishable: false,
  whyWithheld:
    'Internal minutes on a commercial template, held by no registrar and confirmable by nobody. Contains a named individual’s date of death and family members’ withdrawal, neither of which belongs on a marketing page.',
  sourceVerified: '2026-08-26',
}
