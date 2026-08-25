/**
 * stateEvidence.js — what each state claim actually rests on.
 *
 * WHY THIS IS SEPARATE FROM trackRecord.js
 * ────────────────────────────────────────
 * trackRecord.js derives COMMERCIAL_STATES from one source: the `state` column
 * of the Kickserv export. That is a real derivation and it stands. But a column
 * of two-letter codes cannot tell anyone WHAT was done in Ohio, and a reader who
 * asks is entitled to more than "the spreadsheet said OH".
 *
 * This file answers that question per state, from a SECOND and independent
 * source: the KBP Foods email archive, 2015-2018. Where the two agree, the
 * claim is corroborated by two records that were never reconciled against each
 * other at the time — which is the strongest kind of agreement there is.
 *
 * THE DISTINCTION THAT DOES THE WORK HERE
 * ───────────────────────────────────────
 * `work`      Documented work on the ground: a completed job, an
 *             after-photograph sent to the client, a punch list, an invoice.
 * `pipeline`  Scheduled or bid but not evidenced as finished — Design,
 *             Permitting, an invitation to bid.
 * `licensing` A licence was pursued in the state. This is NOT evidence of work
 *             and must never be counted as a market. Alabama is here for
 *             exactly that reason: the archive shows a licence application and
 *             nothing else.
 * `surveyed`  The state appears only in KBP's 2015 pilot survey — the list of
 *             stores this company was asked to BID. 246 of its 262 rows read
 *             "Not Started". Being on it proves nothing about work done.
 *
 * Only `work` may be presented as a market this company has served. A page that
 * blurs these four is the fabricated store database again, assembled out of
 * true rows.
 */

export const WORK = 'work'
export const PIPELINE = 'pipeline'
export const LICENSING = 'licensing'
export const SURVEYED = 'surveyed'

/** Only this grade may be described publicly as a market served. */
export const PUBLISHABLE = new Set([WORK])

export const STATE_EVIDENCE = {
  VA: {
    grade: WORK,
    detail: 'Home market, and where the restaurant work began. The KFC on Azalea Avenue, Richmond, reported complete by the company itself on 15 June 2013 under subcontract to Bear Claw Construction Management of Kansas City — two years before the KBP programme and sixteen months before the first invoice in the job book. Then three KBP restaurant sites with after-photographs: Hull Street Road Richmond (G135149), Mercury Boulevard (G135135) and Independence Boulevard (G135162), both Norfolk.',
    sources: ['bear-claw-correspondence', 'photo-email', 'kbp-2015-survey', 'kickserv'],
  },
  NC: {
    grade: WORK,
    detail: 'Three restaurant sites with after-photographs — High Point (G135195) and two in Burlington (G135184, G135186). Store #207 Elizabeth City documented in correspondence with KBP over striping and bollards.',
    sources: ['photo-email', 'kbp-correspondence', 'kickserv'],
  },
  GA: {
    grade: WORK,
    detail: 'Twelve stores on the owner’s punch list, five more named in emails the crew sent to KBP area coaches with the work each describes, and the Big Chicken in Marietta (G135094). A further 23 Georgia stores sit in KBP’s 2017 tracker at Design or Permitting and are pipeline, not work.',
    sources: ['punch-list', 'area-coach-email', 'kbp-2017-tracker', 'kickserv'],
  },
  TX: {
    grade: WORK,
    detail: '23 invoiced restaurant sites across 19 cities, $670,039, reconciled to the cent against the Project Red invoice tracker. Delivered with Rizo Paving of Mercedes, Texas as subcontractor.',
    sources: ['invoice-tracker', 'kickserv'],
  },
  NJ: {
    grade: WORK,
    detail: 'Nine locations documented to KBP in April 2017 — Rockaway, North Brunswick, Iselin, Rahway, Hazlet, two in Irvington, Florham Park — and Hackettstown, whose email carries finished pictures.',
    sources: ['photo-email', 'kbp-correspondence', 'kickserv'],
  },
  MI: {
    grade: WORK,
    detail: 'Two Detroit-area sites with photographs — 8939 W Seven Mile Road (G135356) and 12721 Michigan Avenue, Dearborn (G135369). KBP’s Detroit market ran to 31 stores and the archive shows the operation staffing it, including a search for Michigan plumbers.',
    sources: ['photo-email', 'kbp-2015-survey', 'kbp-correspondence', 'kickserv'],
  },
  KS: {
    grade: WORK,
    detail: '7100 W 119th Street, Overland Park (G135020) — the 119th and Metcalf job, reported in November 2018 as "all work is completed", invoiced at $8,777.50. KBP Foods is headquartered in Overland Park.',
    sources: ['kbp-correspondence', 'kbp-2015-survey', 'kickserv'],
  },
  NY: {
    grade: WORK,
    detail: 'A Bronx site reported in November 2018 as "all work is completed", awaiting a DOT sidewalk inspection dismissal.',
    sources: ['kbp-correspondence', 'kickserv'],
  },
  LA: {
    grade: WORK,
    detail: 'KFC Leesville, reported by the general contractor as 99.9% complete internally in October 2018. DeRidder property work with gravel receipts on file. A Louisiana State Licensing Board document request in December 2018 confirms the company was operating in-state.',
    sources: ['kbp-correspondence', 'kickserv'],
  },
  MO: {
    grade: WORK,
    detail: 'Thirteen Missouri stores in KBP’s Midwest market, including Kansas City, Raytown and Independence. Brukner Boulevard invoiced at $27,170 in November 2018.',
    sources: ['kbp-correspondence', 'kbp-2015-survey', 'kickserv'],
  },
  FL: {
    grade: PIPELINE,
    detail: 'Coral Springs was in permitting in November 2018 — engineering plans with IBI Group, awaiting city DRC review — and explicitly NOT complete. A Ft. Pierce jobsite appears in a July 2018 workers’ compensation matter, which places a crew in the state but does not evidence a finished job.',
    sources: ['kbp-correspondence'],
  },
  OH: {
    grade: PIPELINE,
    detail: 'A June 2018 DocuSign titled "KFC-Michigan and Ohio" places Ohio in the contracted programme. No completion evidence in the archive.',
    sources: ['kbp-correspondence'],
  },
  TN: {
    grade: PIPELINE,
    detail: 'A TDOT permit for Sulphur Springs. A permit is permission to work, not proof that work happened.',
    sources: ['kbp-correspondence'],
  },
  AL: {
    grade: LICENSING,
    detail: 'A licence application in progress in July 2018 — "How are we looking in Alabama and Florida on license applications?". Nothing in the archive shows work performed.',
    sources: ['kbp-correspondence'],
  },
  SC: {
    grade: WORK,
    // The one state the KBP archive does NOT corroborate, and that is expected
    // rather than troubling: South Carolina work ran under Carolina Blacktop
    // for other clients, so it was never going to appear in a KFC franchise
    // programme's correspondence. Its evidence is the job book plus the brand's
    // own 843 Lowcountry line, in use since at least 2019.
    grade_note: 'Now record-backed — SCDOT permit plus the Joist archive',
    detail: 'SCDOT Encroachment Permit #211746: applied for in May 2024, completion photographs submitted, archived by the department in June 2024 — the only third-party-verified record in this repository. Alongside it, 23 invoices and payment receipts from the Carolina Blacktop Joist archive between 2023 and 2025, and a chip-and-tar job as far back as December 2019.',
    sources: ['scdot-permit', 'joist-archive', 'kickserv', 'carolina-blacktop-correspondence'],
  },
  MD: { grade: SURVEYED, detail: '13 stores in KBP’s 2015 pilot survey, all marked Not Started.', sources: ['kbp-2015-survey'] },
  IL: { grade: SURVEYED, detail: '14 stores in the 2015 pilot survey, all marked Not Started.', sources: ['kbp-2015-survey'] },
  IA: { grade: SURVEYED, detail: 'Three stores in KBP’s Midwest market — the Quad Cities end of it.', sources: ['kbp-2015-survey'] },
}

/** States with documented work on the ground. The only ones a page may claim. */
export function statesWithWork() {
  return Object.keys(STATE_EVIDENCE)
    .filter((s) => PUBLISHABLE.has(STATE_EVIDENCE[s].grade))
    .sort()
}

export function statesByGrade(grade) {
  return Object.keys(STATE_EVIDENCE).filter((s) => STATE_EVIDENCE[s].grade === grade).sort()
}

export function evidenceFor(state) {
  return STATE_EVIDENCE[String(state || '').toUpperCase()] || null
}
