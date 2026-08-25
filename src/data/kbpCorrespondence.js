/**
 * kbpCorrespondence.js — the KBP document trail, recovered from the mailbox
 * that ran the programme.
 *
 * WHY THIS FILE CHANGES WHAT THE GEORGIA RECORD CAN SAY
 * ────────────────────────────────────────────────────
 * georgiaStores.js records the reason no individual store can be graded
 * completed: of 146 KFC and KBP invoices worth $4,082,440.23, not one names a
 * store number or a city. Every job field reads "Asphalt Paving" or "parking
 * lot rehab". Without a store, an invoice cannot be tied to a place.
 *
 * These documents carry store numbers. Three appear by number — 74, 143 and
 * 5075 — and they arrive attached to something better than a number, which is
 * the client's own written answer.
 *
 * THE APPROVALS ARE THE POINT, NOT THE AMOUNTS
 * ────────────────────────────────────────────
 * Eight of these documents carry an approval written by KBP rather than by
 * this company: "APPROVED", "This one (143) is approved too", "Let's go on
 * this one ASAP", "Approved. Please send date of project."
 *
 * Almost nothing else in this repository is that. The Texas figures reconcile
 * against a client tracker and the SCDOT permit is a state record, but a
 * client writing "approved" against a numbered document is the counterparty
 * confirming the work was authorised, in their words, at the time.
 *
 * WHAT AN APPROVAL IS NOT
 * ───────────────────────
 * It is not completion. A client can approve a job that is later cancelled,
 * rescoped or done by somebody else, and the evidence ladder in
 * stateEvidence.js exists precisely so that one rung is not read as another.
 * These are graded `approved`: above `quoted`, below `completed`.
 *
 * THE $47,200 THAT MUST NOT BE ADDED TO ANYTHING
 * ──────────────────────────────────────────────
 * Five documents approved on 11 January 2016 carry amounts totalling
 * $47,200.00. That figure is recorded here and must never be added to the
 * $4,082,440.23 invoice total.
 *
 * An approved estimate becomes an invoice. The invoice record already begins
 * in 2015 and runs through 2018, so the work these estimates describe is
 * almost certainly already inside that four million. Adding them would be the
 * fourth instance of the same error in this repository — after Greenville's
 * $17,949 read twice, the Joist archive's $51,750, and six PayPal receipts
 * paying invoices already counted.
 *
 * A sixth document, 1699 at $26,950 against Store 74, was NOT approved. Tony
 * queried it — "2 bids for store 74??? Which is it??" — and the record does
 * not show which bid won. It is excluded from the approved total for that
 * reason, and recorded so nobody later finds it and adds it in.
 *
 * WHAT IS MISSING, AND WHY IT IS RECOVERABLE
 * ──────────────────────────────────────────
 * The 2017 estimates have no amounts. They were delivered as Kickserv PDFs and
 * those links have expired. The documents existed and the approvals for them
 * are in the mail; only the figures are gone. Kickserv holds the originals,
 * and the customer book has already been preserved from that same account.
 */

/** Where this came from. Recorded so the provenance survives the file. */
export const SOURCE = {
  mailbox: 'j.wordenandsonspaving@gmail.com',
  searched: '2026-08-25',
  client: 'KBP Foods / KBP Investments',
  clientBase: 'Overland Park, Kansas',
  delivery: 'Documents sent via Kickserv',
  contactDetailsCommitted: false,
  contactNote:
    'The sheet carries direct emails and a mobile number for four living people. None is copied here. They are in the owner’s mailbox, which is where they belong.',
}

export const APPROVED = 'approved'
export const QUERIED = 'queried'
export const SENT = 'sent'
export const SUBMITTED = 'submitted'

/** Only these may be described as work the client authorised. */
export const AUTHORISED = new Set([APPROVED])

/**
 * The documents. `amountUsd` is null where the figure lived only in an expired
 * Kickserv PDF — absent, not zero, and never treated as zero.
 */
export const KBP_DOCUMENTS = [
  { doc: '1699', type: 'estimate', date: '2016-01-09', amountUsd: 26950.0, store: '74', status: QUERIED, clientWords: 'Two bids queried for the same store; which one won is not in the record.' },
  { doc: '1700', type: 'estimate', date: '2016-01-09', amountUsd: 3500.0, store: null, status: APPROVED, approvedOn: '2016-01-11' },
  { doc: '1701', type: 'estimate', date: '2016-01-09', amountUsd: 12750.0, store: null, status: APPROVED, approvedOn: '2016-01-11' },
  { doc: '1702', type: 'estimate', date: '2016-01-09', amountUsd: 4400.0, store: null, status: APPROVED, approvedOn: '2016-01-11' },
  { doc: '1703', type: 'estimate', date: '2016-01-09', amountUsd: 14200.0, store: null, status: APPROVED, approvedOn: '2016-01-11' },
  { doc: '1704', type: 'estimate', date: '2016-01-09', amountUsd: 12350.0, store: null, status: APPROVED, approvedOn: '2016-01-10', clientWords: 'Asked to start as soon as possible.' },
  { doc: '2186', type: 'estimate', date: '2017-04-06', amountUsd: null, store: null, status: APPROVED, clientWords: 'Approved, and further parking lot repair, sealcoat and re-stripe requested at the same location.' },
  { doc: '2219', type: 'estimate', date: '2017-05-17', amountUsd: null, store: null, status: SENT },
  { doc: '2220', type: 'estimate', date: '2017-05-17', amountUsd: null, store: '143', status: APPROVED, clientWords: 'Approved by store number, with photographs still outstanding.' },
  { doc: '2222', type: 'estimate', date: '2017-05-17', amountUsd: null, store: null, status: APPROVED },
  { doc: '2227', type: 'estimate', date: '2017-05-17', amountUsd: null, store: null, status: APPROVED },
  { doc: '2236', type: 'estimate', date: '2017-05-17', amountUsd: null, store: null, status: APPROVED, clientWords: 'Queried as a large number, then approved with a project date requested.' },
  { doc: '2237', type: 'estimate', date: '2017-05-17', amountUsd: null, store: null, status: SENT },
  { doc: '2231', type: 'estimate', date: '2017-06-26', amountUsd: null, store: null, status: QUERIED, clientWords: 'Queried as high; no approval in the record.' },
  { doc: '2330', type: 'invoice', date: '2017-11-15', amountUsd: null, store: null, status: SUBMITTED, clientWords: 'Confirmed by the client as submitted for payment.' },
]

/** Approved documents whose amount is known. NEVER add this to any invoice total. */
export const APPROVED_WITH_AMOUNTS_USD = 47200.0

/** Recorded so it is not later mistaken for approved work and added in. */
export const QUERIED_NOT_APPROVED_USD = 26950.0

/** Store numbers that appear anywhere in the correspondence. */
export const STORE_NUMBERS = ['74', '143', '5075']

/**
 * THE THREAD THAT WOULD CLOSE THE WHOLE GEORGIA PROBLEM
 * ────────────────────────────────────────────────────
 * On 2 January 2017 this company sent KBP's office manager a document called
 * "worden kfc master" — a KFC store master list.
 *
 * That is the roster. Every note in programScope.js about asking KBP for a
 * vendor work history exists because no list of stores survives on this side.
 * One may, and it was sent from this company's own account, which means it
 * does not depend on KBP replying at all.
 *
 * It is in the j.wordenandsonspaving mailbox, in a thread whose subject is
 * known. That makes it the single highest-value item outstanding anywhere in
 * this repository.
 */
export const ROSTER_LEAD = {
  subject: 'worden kfc master',
  date: '2017-01-02',
  sentTo: 'KBP’s office manager',
  what: 'A KFC store master list',
  mailbox: 'j.wordenandsonspaving@gmail.com',
  whyItMatters:
    'It is a roster of stores, sent from this company’s own account, so recovering it needs no reply from anyone.',
  wouldClose: 'The store-matching gap in georgiaStores.js, and the scope gaps in programScope.js.',
}

/**
 * A client commendation, in writing, from KBP. Not a testimonial this company
 * solicited or wrote — an operations note from the client's own manager,
 * copied to two of his colleagues, thanking this company for improving.
 *
 * ownedProperties.js flags an unattributed testimonial on a live site as
 * needing a source or removal. This is the opposite: a real one, attributable,
 * dated, and currently on no page at all.
 */
export const CLIENT_COMMENDATION = {
  date: '2016-03-12',
  from: 'Don Larsen, KBP',
  copiedTo: 'two KBP colleagues',
  substance: 'Thanked this company for what it was doing to improve, in an operations thread about scheduling and communication.',
  quotedOnAnyPage: false,
  note:
    'Publishing it needs the client’s permission, as any real testimonial does. That is a conversation, not a copy-paste.',
}

/** Work for KBP outside paving, recorded because it widens what the record shows. */
export const NON_PAVING_SCOPE = [
  { date: '2016-05-30', store: '5075', scope: 'Block and masonry repair after property damage', accepted: true },
]

/** Georgia sites named in the correspondence, corroborating nationalProjects.json. */
export const GEORGIA_TOUCHPOINTS = [
  { date: '2016-03-04', place: 'Acworth, GA', matter: 'Drainage culvert' },
  { date: '2016-02-29', place: 'Holcomb Bridge / Cobb Parkway', matter: 'Parking lot — accessibility signage height, resolved within a week' },
]
