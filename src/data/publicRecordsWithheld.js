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
    source: 'noreply@noreply.sc.gov, 2020-08-24, "Business Filing Transaction Approved".',
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
  ownerShouldReview:
    'MCS-150 declares 1 power unit and 1 driver. If that is out of date, it is corrected by filing an updated MCS-150 with FMCSA.',
}

export function withheldById(id) {
  return WITHHELD_RECORDS.find((r) => r.id === id) || null
}
