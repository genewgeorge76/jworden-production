/**
 * georgiaStores.js — the Georgia KFC record, from KBP's own documents.
 *
 * TWO SOURCES, AND THEY CARRY DIFFERENT WEIGHT
 * ────────────────────────────────────────────
 * PIPELINE (below, `TRACKER_STORES`)
 *   From "KBP - 2017 tracker - J. W. - Champion.xlsx", attached to a June 2017
 *   email from Tony Miceli of KBP. Twenty-three Georgia stores with real
 *   addresses and postcodes, each marked Design or Permitting.
 *
 *   Design and Permitting are PRE-CONSTRUCTION. This is the work that was
 *   scheduled, not the work that was finished, and it is graded `listed`
 *   accordingly. Publishing it as completed work would be the same error as
 *   reading a "Before Pictures" email as proof of a finished job.
 *
 * PUNCH LIST (`PUNCH_LIST_STORES`)
 *   From the punch list the owner supplied. A punch list is issued at
 *   SUBSTANTIAL COMPLETION — it is the snagging list for work already on the
 *   ground. That makes it stronger evidence than the tracker, not weaker,
 *   and those stores are graded `completed`.
 *
 * WHAT THIS FILE DOES NOT CLAIM
 * ─────────────────────────────
 * It does not say 100+. The owner states 100+ Georgia KFCs and that may well be
 * right, but neither document here supports it: the 2015 pilot survey lists 62
 * stores in the whole Atlanta DMA, and this tracker holds 23. Both are
 * snapshots taken BEFORE the work, so they cannot disprove the figure either —
 * they simply are not evidence for it. See src/data/georgiaProgram.js, where
 * the 100+ figure lives on the owner's authority and is labelled as such.
 *
 * THE BIG CHICKEN IS IN HERE
 * ──────────────────────────
 * G135094, 12 Cobb Pkwy N, Marietta GA 30062 — the same address the landmark
 * page was built from, independently confirmed by KBP's own tracker. That is
 * the strongest single corroboration in this repository: the address was
 * written by the client, not by us.
 */

/** Stage as recorded by KBP. Neither means the work was finished. */
export const PRE_CONSTRUCTION = new Set(['design', 'permitting'])

/**
 * Georgia stores from the 2017 tracker. `stage` is KBP's own column.
 * Graded `listed` — scheduled work, not completed work.
 */
export const TRACKER_STORES = [
  { store: 'G135088', address: '5040 Cherokee Street', city: 'Acworth', zip: '30101', stage: 'permitting' },
  { store: 'G135180', address: '2150 Barnett Shoals Road', city: 'Athens', zip: '30605', stage: 'design' },
  { store: 'G135074', address: '3901 Buford Hwy NE', city: 'Atlanta', zip: '30329', stage: 'design' },
  { store: 'G135109', address: '5245 Old National Hwy', city: 'Atlanta', zip: '30349', stage: 'design' },
  { store: 'G135106', address: '23 Joseph E Lowery Blvd. SW', city: 'Atlanta', zip: '30314', stage: 'design' },
  { store: 'G135077', address: '4368 Highway 20', city: 'Buford', zip: '30518', stage: 'design' },
  { store: 'G135089', address: '575 Bankhead Hwy', city: 'Carrollton', zip: '30117', stage: 'design' },
  { store: 'G135070', address: '1675 Highway 138 SE', city: 'Conyers', zip: '30013', stage: 'permitting' },
  { store: 'G135090', address: '1297 Atlanta Hwy', city: 'Dallas', zip: '30132', stage: 'design' },
  { store: 'G135071', address: '2532 Wesley Chapel Rd', city: 'Decatur', zip: '30035', stage: 'design' },
  { store: 'G135111', address: '3555 Flat Shoals Rd', city: 'Decatur', zip: '30034', stage: 'design' },
  { store: 'G135108', address: '1395 Virginia Ave', city: 'East Point', zip: '30344', stage: 'design' },
  { store: 'G135105', address: '4845 Jonesboro Rd', city: 'Forest Park', zip: '30297', stage: 'permitting' },
  { store: 'G135093', address: '1970 N Cobb Parkway', city: 'Kennesaw', zip: '30152', stage: 'permitting' },
  { store: 'G135177', address: '675 Georgia Highway 120', city: 'Lawrenceville', zip: '30045', stage: 'permitting' },
  { store: 'G135098', address: '664 Thornton Road', city: 'Lithia Springs', zip: '30122', stage: 'permitting' },
  { store: 'G135084', address: '2848 Panola Road', city: 'Lithonia', zip: '30058', stage: 'design' },
  { store: 'G135094', address: '12 Cobb Pkwy. N', city: 'Marietta', zip: '30062', stage: 'design' },
  { store: 'G135103', address: '1493 Mount Zion Rd', city: 'Morrow', zip: '30260', stage: 'design' },
  { store: 'G135080', address: '1635 Indian Trail Rd', city: 'Norcross', zip: '30093', stage: 'design' },
  { store: 'G135181', address: '2663 W. Main Street', city: 'Snellville', zip: '30078', stage: 'design' },
  { store: 'G135075', address: '5681 Memorial Dr', city: 'Stone Mountain', zip: '30083', stage: 'design' },
  { store: 'G135081', address: '3277 Lawrenceville Suwanee Rd', city: 'Suwanee', zip: '30024', stage: 'design' },
]

/**
 * Stores from the owner's punch list. A punch list means the crew was on the
 * ground and the work is substantially done, so these grade `completed`.
 *
 * Six carry store numbers. The rest were written by name only; they are kept
 * because they are real entries on the same list, but a store number cannot be
 * invented for them and none is.
 */
export const PUNCH_LIST_STORES = [
  { store: 'G135101', city: 'Riverdale', state: 'GA' },
  { store: 'G135115', city: 'Union City', state: 'GA' },
  { store: 'G135087', city: 'Villa Rica', state: 'GA' },
  { store: 'G135107', city: 'Adamsville', state: 'GA' },
  { store: 'G135108', city: 'East Point', state: 'GA', note: 'Virginia Ave — also in the 2017 tracker at Design stage' },
  { store: 'G135114', city: 'Lovejoy', state: 'GA' },
  { store: null, city: 'Chamblee', state: 'GA' },
  { store: null, city: 'Tucker', state: 'GA' },
  { store: null, city: 'Pleasant Hill', state: 'GA' },
  { store: null, city: 'Sugarloaf', state: 'GA' },
  { store: null, city: 'Covington', state: 'GA' },
  { store: null, city: 'Clarkston', state: 'GA' },
]

/**
 * Georgia stores named in emails the crew sent to KBP area coaches at the time,
 * with the work each email actually describes. Graded `completed`: these are
 * notifications that the work was happening or done, sent to the client.
 */
export const AREA_COACH_STORES = [
  { city: 'Kennesaw',       work: 'asphalt patching',                 when: '2016-07' },
  { city: 'Holcomb Bridge', work: 'sealcoating and striping',         when: '2016-08' },
  { city: 'Stone Mountain', work: 'asphalt patch',                    when: '2016-09' },
  { city: 'Acworth',        work: 'concrete parking lot',             when: '2016-09' },
  { city: 'Cartersville',   work: 'sealcoating',                      when: '2016-10' },
]

export const COMPLETED = 'completed'
export const LISTED = 'listed'

/** Everything, graded. The only function any page should call. */
export function georgiaRecord() {
  return [
    ...PUNCH_LIST_STORES.map((s) => ({ ...s, evidence: COMPLETED, source: 'punch-list' })),
    ...AREA_COACH_STORES.map((s) => ({ ...s, store: null, state: 'GA', evidence: COMPLETED, source: 'area-coach-email' })),
    ...TRACKER_STORES.map((s) => ({ ...s, state: 'GA', evidence: LISTED, source: 'kbp-2017-tracker' })),
  ]
}

/** Only what may be shown as finished work. */
export function completedGeorgia() {
  return georgiaRecord().filter((s) => s.evidence === COMPLETED)
}

/** Cities with completed work, deduplicated. */
export function completedGeorgiaCities() {
  return [...new Set(completedGeorgia().map((s) => s.city))].sort()
}
