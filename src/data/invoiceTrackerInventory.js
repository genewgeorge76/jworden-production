/**
 * invoiceTrackerInventory.js — the client trackers, located.
 *
 * WHY THIS IS THE MOST CONSEQUENTIAL FILE IN THE RECORD
 * ────────────────────────────────────────────────────
 * programScope.js says Texas is the best-documented state not because more
 * work happened there but because a CLIENT'S invoice tracker survived, letting
 * 23 sites across 19 cities reconcile to the cent against $670,039.00. Every
 * other market is thin for the opposite reason: no equivalent document was in
 * hand. That was called an archival accident and the fix was to ask KBP.
 *
 * It was not an accident and KBP does not need to be asked. The trackers were
 * built by this company, sent to KBP, and are sitting in this company's own
 * sent mail — one per market.
 *
 * Located 2026-08-25 in j.wordenandsonspaving@gmail.com:
 *
 *   Atlanta      "Updatedl Invoice Tracker ATL.xlsx"        2016-07-22
 *   Texas        "Updated invoice tracker for Texas..."     2016-11-13
 *   Texas        "Texas Invoice Tracker 1/16/17"            2017-01-16
 *   Illinois     "quads Illinois invoice tracker"           2016-10-10
 *   New Jersey   "Invoice tracker for the two in new..."    2016-11-14
 *   programme    "Updated Invoice Tracker as of 5/25/2016"  2016-05-25
 *   KFC master   "worden kfc master"                        2017-01-02
 *
 * The Atlanta one is the prize. georgiaStores.js grades 23 stores `listed`
 * solely because no invoice names a store, and georgiaCityPages.js rests on a
 * punch list. An Atlanta invoice tracker is the document that closes both, the
 * same way Project Red closed Texas.
 *
 * THE MASTER LIST IS IN THE SAME THREAD AS A SECOND TRACKER
 * ────────────────────────────────────────────────────────
 * "worden kfc master", sent to KBP's office manager on 2017-01-02, carries
 * eleven attachments. Two matter beyond the rest:
 *
 *   KFC MASTER LIST ALL STORES'.xls   the roster
 *   Updated Invoice Tracker KFC.xlsx  a programme-wide tracker
 *
 * A roster and a tracker in one message is the pair the entire KBP record has
 * been missing: stores on one side, money on the other, and store numbers to
 * join them.
 *
 * WHY THIS FILE LISTS RATHER THAN CONTAINS
 * ────────────────────────────────────────
 * The Gmail tools available here read mail but cannot download attachments, so
 * these are located and not yet read. Nothing in this file asserts what any
 * tracker contains — only that it exists, where, and what it would settle. The
 * figures stay exactly as they are until a file is opened.
 */

/** Located, not read. `holds` is what the subject and filename say, nothing more. */
export const TRACKERS = [
  {
    market: 'Atlanta',
    filename: 'Updatedl Invoice Tracker ATL.xlsx',
    subject: 'ATL Invoice tracker need to add the 2 concrete jobs to the estimate portion',
    date: '2016-07-22',
    priority: 1,
    wouldSettle:
      'The Georgia store-matching gap. 23 tracker stores are graded `listed` only because no invoice names a store; this is an invoice tracker for that market.',
  },
  {
    market: 'KBP programme-wide',
    filename: 'Updated Invoice Tracker KFC.xlsx',
    subject: 'worden kfc master',
    date: '2017-01-02',
    priority: 1,
    wouldSettle: 'Money across the whole programme, in the same message as the store roster.',
  },
  {
    market: 'KBP programme-wide',
    filename: "KFC MASTER LIST ALL STORES'.xls",
    subject: 'worden kfc master',
    date: '2017-01-02',
    priority: 1,
    isRoster: true,
    wouldSettle:
      'Every scope claim in programScope.js — Kansas City, Iowa, Detroit, Florida. A roster is the denominator those claims are measured against.',
  },
  {
    market: 'Illinois',
    filename: null,
    subject: 'quads Illinois invoice tracker',
    date: '2016-10-10',
    priority: 2,
    wouldSettle: 'Illinois, currently carried on the Kickserv state column alone.',
  },
  {
    market: 'New Jersey',
    filename: null,
    subject: 'Invoice tracker for the two in new jersey',
    date: '2016-11-14',
    priority: 2,
    wouldSettle: 'New Jersey, which has nine KBP sites in nationalProjects.json and no figures.',
  },
  {
    market: 'Texas',
    filename: null,
    subject: 'Updated invoice tracker for Texas Deposits 11/13/16',
    date: '2016-11-13',
    priority: 3,
    wouldSettle:
      'Nothing new — Texas already reconciles. Valuable as a control: if this tracker reproduces the $670,039.00 already recorded, the method is proven on a known answer before it is trusted on an unknown one.',
  },
  {
    market: 'programme',
    filename: null,
    subject: 'Updated Invoice Tracker as of 5/25/2016',
    date: '2016-05-25',
    priority: 3,
    wouldSettle: 'An earlier programme-wide snapshot.',
  },
]

export const MAILBOX = 'j.wordenandsonspaving@gmail.com'
export const LOCATED_ON = '2026-08-25'

/** None have been opened. Every figure in this repository is unchanged. */
export const ANY_TRACKER_READ = false

/**
 * A CONTROL BEFORE A CONCLUSION
 * ─────────────────────────────
 * The Texas trackers are listed at low priority deliberately. Texas is the one
 * market whose answer is already known to the cent, which makes it the only
 * place a tracker-reading method can be tested rather than trusted.
 *
 * Read Texas first and reproduce $670,039.00 across 23 sites, and the method is
 * proven. Read Atlanta first and there is nothing to check the result against —
 * which is how the $51,750 and the $17,949 errors happened.
 */
export const CONTROL = {
  market: 'Texas',
  expectedTotalUsd: 670039.0,
  expectedSites: 23,
  why: 'The only market with a known answer, so the only one that can validate the method.',
}

/**
 * FURTHER MAILBOXES, FOUND IN THE HEADERS OF THESE THREADS
 * ───────────────────────────────────────────────────────
 * The KBP correspondence copies accounts not previously known. One is
 * dedicated to this client. They are recorded because the archive is plainly
 * spread wider than the five accounts listed so far.
 */
export const FURTHER_MAILBOXES = [
  { address: 'kbp.wordenandsons@gmail.com', note: 'A mailbox dedicated to this client. Not previously known.' },
  { address: 'wordenpaving@gmail.com', note: 'Received the Atlanta and Illinois trackers directly.' },
  { address: 'john.worden1234@gmail.com', note: 'Copied on KBP and Texas threads.' },
  { address: 'jhworden1@gmail.com', note: 'Copied on KBP threads.' },
]
