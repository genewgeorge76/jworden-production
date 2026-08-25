/**
 * unrecoveredWork.js — jobs the owner states, whose evidence is not in hand.
 *
 * WHAT THIS FILE IS, AND THE ONE RULE THAT GOVERNS IT
 * ──────────────────────────────────────────────────
 * Every other record file in src/data/ holds work backed by a document: a Joist
 * invoice, a KBP punch list, an after-photograph, an SCDOT permit. This file
 * holds the opposite — work the owner says he did, for which the paper is in a
 * mailbox nobody can open.
 *
 * Nothing in this file may appear on a page. Not the towns, not the job types,
 * not a count of them. It exists so that a real job is not forgotten while its
 * evidence is missing, and so that whoever recovers that evidence knows exactly
 * what to look for. A test enforces the rule.
 *
 * This is deliberately NOT stateEvidence.js. That file grades what the record
 * supports; the lowest grade it has is `surveyed`, and even that rests on a
 * document. These entries rest on nothing but the owner's account, which is
 * a rung below the bottom of that ladder. Mixing them in would corrupt it.
 *
 * WHY THE EVIDENCE IS MISSING
 * ───────────────────────────
 * The Georgia coastal work was run through a Savannah mailbox, under the
 * savannahasphaltpaving.com trading name. The owner no longer has access to
 * that account and is not certain of its exact address — see LOST_MAILBOX,
 * which carries both candidates. The documents are not deleted; they are
 * behind a login.
 *
 * WHAT WAS ALREADY SEARCHED, SO NOBODY SEARCHES IT AGAIN
 * ─────────────────────────────────────────────────────
 * carolinablacktop@gmail.com was swept on 2026-08-25 for all four entries
 * below — by town name, by client name, by subject line, and across sent mail.
 * It holds none of them. The Joist archive in carolinaBlacktopRecord.js is the
 * whole of what that mailbox contains. Re-sweeping it will not help.
 *
 * The Wayback Machine could not be reached from the environment this sweep ran
 * in, so whether savannahasphaltpaving.com left a public archive is UNKNOWN —
 * unchecked, not absent. It is the cheapest remaining lead and it is listed as
 * such below.
 */

/** Work stated by the owner, evidence not recovered. Never publishable. */
export const UNRECOVERED_WORK = [
  {
    id: 'UR-001',
    client: 'Christine',
    place: 'Summerville, South Carolina',
    scope: 'A road into a neighbourhood.',
    basis: 'owner-stated',
    recovery: 'The client holds her own copy. A direct approach is the shortest route to a document for this one.',
  },
  {
    id: 'UR-002',
    client: null,
    place: 'South Carolina, town not stated',
    scope: 'A large church.',
    basis: 'owner-stated',
    recovery:
      'A church keeps board minutes and paid invoices, and a congregation is a willing reference. Identify the church first; the paperwork follows.',
  },
  {
    id: 'UR-003',
    client: null,
    place: 'Tybee Island, Georgia',
    scope: 'Invoiced work, count and amounts not stated.',
    basis: 'owner-stated',
    recovery: 'The lost Savannah mailbox — see LOST_MAILBOX. Google account recovery is the only route to the originals.',
  },
  {
    id: 'UR-004',
    client: null,
    place: 'Savannah, Georgia',
    scope: 'Invoiced work, count and amounts not stated.',
    basis: 'owner-stated',
    recovery: 'The lost Savannah mailbox, as above.',
  },
]

/**
 * The mailbox that holds UR-003 and UR-004, and the trading name it ran under.
 *
 * THE ADDRESS IS NOW CONFIRMED, AND THE EARLIER REASONING WAS WRONG
 * ────────────────────────────────────────────────────────────────
 * This entry previously listed two candidates and put
 * savannahpavingandsealing@gmail.com first, arguing that a mailbox named for a
 * documented trading name — Savannah Paving & Sealing, Invoice 48 — was the
 * better bet than one named for a trading name the company did not use.
 *
 * The argument was reasonable and the conclusion was wrong. The mailbox is
 * savannahpaving@gmail.com. Three independent sightings, all inside
 * carolinablacktop@gmail.com:
 *
 *   2023-09-18  A web agency addresses one pitch to three of the owner's
 *   2023-10-27  accounts at once — carolinablacktop, j.wordenandsonspaving
 *               and savannahpaving. Two separate threads, same three.
 *   2024-06-07  An email FROM savannahpaving@gmail.com to this mailbox,
 *               sent from the owner's phone, carrying a photograph.
 *
 * The lesson is worth keeping: a good inference about a naming convention lost
 * to one line of raw address data. Where a header can be read, read it.
 */
export const LOST_MAILBOX = {
  address: 'savannahpaving@gmail.com',
  confirmed: true,
  confirmedBy: 'Sent from that address to carolinablacktop@gmail.com, 2024-06-07; also addressed alongside it in two 2023 threads.',
  /** Considered and ruled out. Kept so the question is not reopened. */
  ruledOut: ['savannahpavingandsealing@gmail.com'],
  tradingName: 'savannahasphaltpaving.com',
  status: 'access lost',
  holds: ['UR-003', 'UR-004'],
  route: 'https://accounts.google.com/signin/recovery',
  note: 'Recovery needs the phone number or backup address the account was created with. Nothing else in this repository can substitute for it.',
}

/**
 * THE CROSSOVER, WHICH IS THE REAL FINDING HERE
 * ─────────────────────────────────────────────
 * The owner predicted that Savannah material would cross into his other
 * accounts. It does, and the proof is small but decisive: on 2024-06-07 at
 * 16:49 Joist sent Invoice 48 to Palmetto Place under the Savannah Paving &
 * Sealing name, and at 19:06 the same day a photograph came from
 * savannahpaving@gmail.com into this mailbox.
 *
 * That photograph is in an account nobody has lost. A jobsite image from the
 * Savannah operation survived the loss of the Savannah mailbox because it was
 * sent somewhere else.
 *
 * The consequence: the lost mailbox is not the only route to that work, and
 * the other accounts have not been searched. The Gmail connector holds ONE
 * Google account and binds it at session start, so carolinablacktop is all
 * that has been swept. j.wordenandsonspaving@gmail.com is the strongest of the
 * unsearched ones — it is already known to have been addressed alongside
 * savannahpaving twice.
 */
export const CROSSOVER = {
  proven: true,
  example: {
    date: '2024-06-07',
    what: 'Photograph sent from the Savannah account into carolinablacktop@gmail.com, hours after Invoice 48 went out under the Savannah trading name.',
    filename: 'IMG_5306.heic',
    significance: 'Savannah-operation material exists outside the lost mailbox.',
  },
  unsearchedMailboxes: [
    'j.wordenandsonspaving@gmail.com',
    'wordenpaving@gmail.com',
    'jhworden1@gmail.com',
    'genewgeorge@gmail.com',
  ],
  constraint:
    'The Gmail connector holds one Google account and binds at session start. Sweeping another mailbox needs that account connected and a new session.',
}

/**
 * A document seen in carolinablacktop@gmail.com but not yet opened, and whose
 * DIRECTION is unknown — it may be money owed to this company or by it.
 *
 * joist_import.py exists because that distinction was got wrong once already:
 * supplier bills read as revenue until the payable patterns were tested first.
 * Until the PDF is read, this counts as neither.
 */
export const UNREAD_DOCUMENTS = [
  {
    id: 'UD-001',
    filename: 'Carolina Black TOP.pdf',
    received: '2025-10-04',
    via: 'forwarded by a hauling contractor',
    direction: 'unknown',
    note: 'Dated after the Joist archive ends, so it is not already counted in carolinaBlacktopRecord.js. Open before assuming either direction.',
  },
]

/** Leads not yet followed, cheapest first. */
export const OPEN_LEADS = [
  'Check the Wayback Machine for savannahasphaltpaving.com — costs nothing and needs no account.',
  'PayPal transaction history covers the same years and is a third-party record, which an own-invoice is not.',
  'Bank deposits for the period place the money even where the invoice is gone.',
]
