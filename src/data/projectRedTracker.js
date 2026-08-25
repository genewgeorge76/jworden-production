/**
 * projectRedTracker.js — the client tracker, read.
 *
 * WHAT THIS FILE IS
 * ─────────────────
 * invoiceTrackerInventory.js located the client trackers and read none of
 * them, on the rule that Texas — the only market whose answer is already known
 * to the cent — must be read first as a control before any unknown market is
 * trusted.
 *
 * This is that control, read on 2026-08-25 from the owner's Drive. It is
 * "Texas Invoice Tracker deposits.xlsx", and it carries two sheets under the
 * client's own programme name, Project Red.
 *
 * IT VALIDATED THE METHOD AND THEN EXPLAINED AN OLD RULE
 * ─────────────────────────────────────────────────────
 * texasProgram.js has always carried a discipline with no stated cause: an
 * advance and a final are never summed, because Greenville reads $17,949 twice
 * and is ONE job. That rule was inferred from the damage it prevented.
 *
 * The tracker gives the mechanism. Every Texas row carrying figures has an
 * invoice column and a job-total column, and the ratio between them is exactly
 * 0.5000 on all nine — not approximately, exactly. The billing was 50% up
 * front. So a job worth $35,898 is invoiced at $17,949 twice, and a reader
 * summing both columns doubles every job in the file.
 *
 * The rule was right. It is now also explained, which is better, because an
 * explained rule survives the next person who thinks it looks overcautious.
 *
 * WHAT THE SECOND SHEET TURNED OUT TO BE
 * ──────────────────────────────────────
 * Nobody was looking for it. Sheet two is "Roof Project Red", and it is a
 * roster of 30 Michigan stores — G135354 to G135385 — with store numbers and
 * street addresses across Detroit, Flint, Pontiac, Dearborn, Highland Park,
 * Harper Woods, Rochester Hills, Auburn Hills, Waterford, Lake Orion,
 * Westland, Canton, Davison, Clio, Grand Blanc and Birch Run.
 *
 * programScope.js records the owner saying he did every KFC KBP owned in
 * Michigan, against 2 documented sites, and notes the archive already put the
 * Detroit market at 31 stores. This roster names 30 of them.
 *
 * TWO THINGS THAT MUST NOT BE READ INTO IT
 * ────────────────────────────────────────
 * First, being on a tracker is not having done the work. Every Michigan row's
 * invoice, date and amount columns are EMPTY. The sheet documents assignment,
 * not completion, and Michigan therefore gains a roster and not a grade. This
 * is the same distinction that keeps the 2015 bid survey from counting.
 *
 * Second, the Michigan sheet is categorised "Roof". That is roofing, a
 * different trade from paving, and it corroborates a 2015 thread with Bear
 * Construction Services about Texas store inspections in which the owner
 * writes about the roofs. It widens what this company is documented as doing;
 * it does not add paving.
 */

/** Read from the owner's Drive, not relayed. */
export const SOURCE = {
  file: 'Texas Invoice Tracker deposits.xlsx',
  via: 'Google Drive',
  read: '2026-08-25',
  programmeName: 'Project Red',
  role: 'control — the market whose answer was already known',
}

/**
 * THE FINDING THAT EXPLAINS THE OLD RULE.
 * Verified on all nine rows carrying figures. Exactly one half, every time.
 */
export const DEPOSIT_RATIO = 0.5
export const DEPOSIT_ROWS_VERIFIED = 9

/** Sum of the invoice column across those nine rows. HALF of the job value. */
export const TX_DEPOSITS_INVOICED_USD = 151696.0

/** Sum of the job-total column across the same nine. The deposits are inside this. */
export const TX_JOB_VALUE_USD = 303392.0

/**
 * Never add these two together. $151,696 + $303,392 = $455,088 describes no
 * work at all — it is nine jobs counted one and a half times.
 */
export const NEVER_SUM = ['TX_DEPOSITS_INVOICED_USD', 'TX_JOB_VALUE_USD']

/** Texas stores named in the parking sheet, with numbers and addresses. */
export const TX_STORES_LISTED = 28
export const TX_STORES_WITH_FIGURES = 9
export const TX_STORE_RANGE = ['G135209', 'G135242']

/**
 * The Michigan roster. Named, numbered, and NOT graded — every figure column
 * on this sheet is empty.
 */
export const MI_STORES_LISTED = 30
export const MI_STORE_RANGE = ['G135354', 'G135385']
export const MI_CATEGORY = 'Roof'
export const MI_HAS_FIGURES = false
export const MI_CITIES = [
  'Detroit', 'Flint', 'Pontiac', 'Dearborn', 'Highland Park', 'Harper Woods',
  'Rochester Hills', 'Auburn Hills', 'Waterford', 'Lake Orion', 'Westland',
  'Canton', 'Davison', 'Clio', 'Grand Blanc', 'Birch Run',
]

/**
 * What a roster is worth without figures: it is the DENOMINATOR. programScope.js
 * could only say Michigan was "2 documented against a market said to run to 31".
 * Now 30 of those stores have numbers and addresses, which means the Google
 * Photos index in jobsite_photos.py has something to match coordinates against.
 *
 * A geotagged photograph at 8939 W 7 Mile Road is no longer a dot on a map. It
 * is store G135356.
 */
export const ROSTER_ENABLES = {
  matchesAgainst: 'jobsite_photos.py — GPS clusters can now resolve to store numbers',
  changesGrade: false,
  why: 'A roster names what to look for. It does not evidence that any of it was done.',
}

/** The full sheet lives in private/. Addresses are a client asset register. */
export const FULL_ROSTER_COMMITTED = false
