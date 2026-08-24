/**
 * trackRecord.js — the figures this company may state in public, and what
 * each one rests on.
 *
 * WHY THIS FILE EXISTS
 * ────────────────────
 * A previous file in this repository, public/kfc_individual_stores_database
 * .json, listed ten KFC restaurants with store numbers, street addresses,
 * paving scopes and square footages. All of it was typed into a Python list by
 * hand and the photographs were dealt out to those stores by array slice. It
 * was served on every domain until it was deleted.
 *
 * The lesson was not "check harder". It was that a number with no stated source
 * is indistinguishable from a number somebody made up, six months later, to
 * everyone including the person who wrote it. So every figure below carries the
 * file it came from and the query that produced it, and anything that cannot
 * carry those does not go on this page.
 *
 * SOURCE
 * ──────
 * The Kickserv account export jwordenandsonspaving_20260823215614.zip — the
 * job book the business actually ran on from 2013 to 2022. 2,610 jobs, 2,419
 * charge lines, 2,263 customers. The export itself is not committed: it holds
 * 2,263 customers' names, addresses, phone numbers and email addresses.
 */

/**
 * Jobs carrying a completion date in jobs.csv.
 *
 * CONTESTED — DO NOT TRUST THIS NUMBER UNTIL IT IS RE-DERIVED.
 * app/services/kickserv_import.py's module docstring says 1,135 for the same
 * query against the same export, while this says 1,132. Both cite the same
 * $12,967,927.18. They cannot both be right, and this is the one that renders
 * on the public homepage.
 *
 * Only the export can settle it, and the export is deliberately not committed.
 * To resolve: run
 *   python scripts/import_kickserv_export.py <export>.zip --dry-run
 * and read the completed count it prints, then correct whichever of the two is
 * wrong. Leaving the disagreement recorded here beats quietly picking one.
 */
export const COMPLETED_JOBS = 1132

/**
 * Sum of jobs.total over those 1,132 rows.
 *
 * A FLOOR, NOT A TOTAL, and the distinction is the whole point. 868 further
 * jobs are priced and carry no completion date; the operator's account is that
 * the work was done and the box was never ticked, which is consistent with what
 * those rows look like. They are excluded anyway, because the file cannot tell
 * a finished job from an abandoned quote and neither can this page.
 *
 * What is NOT here: the $41,295,234.93 that all 2,610 rows sum to. That figure
 * includes 66 jobs marked estimate_type "lost" — $162,675.37 of work that was
 * bid and not won. Publishing it would be a lie assembled entirely out of true
 * rows.
 */
export const COMPLETED_VALUE_USD = 12967927.18

/** From customers.csv `company` — the boolean Kickserv itself uses. */
export const COMMERCIAL_JOBS = 655
export const RESIDENTIAL_JOBS = 1955

/** Distinct customers in customers.csv. */
export const CUSTOMERS = 2263

/** Earliest and latest completed_on across jobs.csv. */
export const FIRST_COMPLETION = '2013-04-02'
export const LAST_COMPLETION = '2022-04-04'

/**
 * States with at least one COMMERCIAL job, validated against the USPS list.
 *
 * The raw column offers 23 values. Five are rejected: "GE" and "TE" are not
 * states, "US" is not a state, and 11 rows read "VI" — which is the US Virgin
 * Islands and would have been a remarkable claim, except that every city filed
 * under it is Richmond, Henrico or Highland Springs. It is a typo for VA.
 */
export const COMMERCIAL_STATES = [
  'VA', 'MI', 'TX', 'GA', 'IL', 'KS', 'MO', 'AL', 'NY',
  'NJ', 'LA', 'FL', 'NC', 'IA', 'MD', 'OH', 'TN', 'SC',
]

/**
 * Named clients, each appearing on more than one job in customers.csv.
 *
 * Names only. No addresses, no contacts, no contract values — those are the
 * clients' business, not marketing copy. Residential customers are absent
 * entirely: 1,955 of the jobs are private driveways and those people hired a
 * paving crew, not a listing.
 */
export const NAMED_CLIENTS = [
  { name: 'KBP Foods', note: 'KFC franchise programme — multi-state' },
  { name: 'Meckley Services', note: '54 jobs' },
  { name: 'Rite Aid', note: 'via facilities management' },
  { name: '84 Lumber', note: 'Richmond' },
  { name: 'Windsor Business Park', note: '' },
  { name: 'Plaza Street Partners', note: 'KFC new-build programme' },
]

/**
 * The one contract stated in full, because one verifiable job outweighs a
 * dozen round numbers.
 *
 * AIA A105-2007, 31 March 2016. First States Investors 5200, LLC — a Gramercy
 * Property Trust entity — and J Worden & Sons Paving, LLC.
 */
export const SHOWCASE_CONTRACT = {
  site: 'Robinson & Broad, 2601 West Broad Street, Richmond VA',
  instrument: 'AIA A105-2007',
  date: '2016-03-31',
  sumUSD: 32500.0,
  areaSqFt: 14218,
  scope: 'Mill 2", tack, resurface SM 9.5 hot plant mix at 2.5", roll, compact, re-stripe',
}

/**
 * The largest single contract in the job book, itemised.
 *
 * Kickserv job #2491, a ground-up restaurant build broken into eleven CSI
 * divisions. It is the evidence for the general-contracting claim: a paving
 * subcontractor does not carry masonry, openings, plumbing and HVAC, electrical
 * and roofing on one contract.
 */
export const LARGEST_CONTRACT = {
  reference: 'Kickserv job #2491',
  label: 'Ground-up restaurant build',
  sumUSD: 2945607.6,
  divisions: [
    'Clearing, removal and site work',
    'Asphalt and concrete pavement, curb',
    'Masonry',
    'Insulation and protection',
    'Openings',
    'Plumbing and HVAC',
    'Electrical and gas',
    'Roofing and interior',
    'Landscaping',
    'Mobilisation and per diem',
    'Overhead and profit',
  ],
}

/** Non-negotiable specification, quoted on every proposal. */
export const STANDARDS = [
  { value: '96%', label: 'Marshall unit weight', note: 'minimum compaction floor' },
  { value: 'Sec. 315', label: 'VDOT structural stone base', note: '' },
  { value: '±$9/ton', label: 'Liquid asphalt buffer', note: 'carried in every estimate' },
  { value: 'Zero', label: 'Downtime DOT medical', note: 'crew compliance' },
]

/** Formatted once, so no component rounds it differently. */
export const money = (n) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(2)}M`
    : `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
