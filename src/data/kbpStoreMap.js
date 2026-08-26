/**
 * kbpStoreMap.js — every KBP store this company can point to, and on what basis.
 *
 * WHY EACH PIN CARRIES A GRADE
 * ────────────────────────────
 * A map of 120 identical pins is the fabricated store database again, drawn in
 * colour instead of typed in a table. It would say "we worked here" 120 times
 * on evidence ranging from a client's cleared payment to a name on a list.
 *
 * So every store carries the grade the documents support:
 *
 *   paid      The client invoiced, received and SETTLED it. KBP agreed the
 *             work was done and paid for it. The strongest evidence here.
 *   invoiced  A bill appears in the client's own tracker. Work was
 *             commissioned. The payment column is not completed.
 *   completed The store has a COMPLETED JOB WITH REVENUE in this company's own
 *             Kickserv record. Not the client's document — ours. It proves the
 *             work was done and billed; it does not prove KBP acknowledged the
 *             bill, which is what `invoiced` proves.
 *   listed    The store was assigned to the programme. Nothing more. A roster
 *             entry is a place to look, not a job done.
 *
 * Only `paid`, `invoiced` and `completed` may be shown as work. `listed` exists
 * so the footprint can be understood without being claimed, and a test enforces
 * it.
 *
 * WHY `completed` WAS ADDED, AND WHY IT IS NOT JUST `invoiced`
 * ───────────────────────────────────────────────────────────
 * Michigan forced the question. KBP's tracker carries 30 Michigan stores and
 * fills in an invoice number for six of them. The other twenty-four rows hold a
 * store number, an address, a city and a zip, and nothing else — which is
 * precisely why they sat at `listed`.
 *
 * The owner said he did every KFC KBP owned in Michigan, Flint and Detroit
 * both. The Kickserv export settles it: twenty-one of those twenty-four have a
 * completed job with revenue in this company's own invoicing system.
 *
 * That is documentary evidence and it deserves a grade. But it is not the same
 * evidence as `invoiced`. A line in KBP's tracker means the client wrote the
 * bill down. A completed Kickserv job means we did. Collapsing the two would
 * have quietly widened `invoiced` to mean "somebody, somewhere, has a record",
 * and the whole reason this ladder is trusted is that each rung says exactly
 * whose document it rests on.
 *
 * THE TWO SYSTEMS DISAGREE ON AMOUNTS, AND MUST NEVER BE SUMMED TOGETHER
 * ────────────────────────────────────────────────────────────────────
 * All six Michigan stores KBP invoiced also appear in Kickserv, with different
 * figures — Davison $69,400 against $79,583, Detroit 362 $23,040 against
 * $48,642, Flint 377 $14,532 against $27,520, Grand Blanc 370 $30,780 against
 * $11,842. Kickserv shows two or three separate jobs at several of those
 * stores, so these are almost certainly different scopes rather than a
 * contradiction. Either way a Michigan total has to name which system it came
 * from, and adding the two produces a number that is true of neither.
 *
 * ADDRESSES ARE HERE; STORE NUMBERS ARE NOT FOR PUBLICATION
 * ────────────────────────────────────────────────────────
 * These are public restaurant locations — anyone can drive past them. The
 * store numbers are KBP's internal identifiers, kept because they are the join
 * key to this company's invoices and to the GPS clusters in
 * jobsite_photos.py. They belong in the record, not on a public map.
 *
 * SOURCE
 * ──────
 * "Updated Invoice Tracker KFC.xlsx" and "Texas Invoice Tracker deposits.xlsx",
 * read from the owner's Drive on 2026-08-25. Georgia reconciles to the
 * client's own outstanding total to the cent; see kfcProgrammeTracker.js.
 *
 * Two Quad Cities addresses are given their real municipality rather than the
 * sheet's "Quads" shorthand, which is a regional nickname and not a city a
 * geocoder can find.
 */

export const PAID = 'paid'
export const INVOICED = 'invoiced'
export const COMPLETED = 'completed'
export const LISTED = 'listed'

/** Only these three may be drawn as work performed. */
export const SHOWABLE_AS_WORK = new Set([PAID, INVOICED, COMPLETED])

/**
 * `source` names whose document the grade rests on, so a reader never has to
 * infer it: 'kbp-tracker' for paid and invoiced, 'kickserv' for completed.
 */
const S = (store, address, city, state, grade, usd = null, source = null) => ({
  store,
  address,
  city,
  state,
  grade,
  usd,
  source: source ?? (grade === COMPLETED ? 'kickserv' : grade === LISTED ? null : 'kbp-tracker'),
})

export const KBP_STORES = [
  // Georgia — invoiced AND paid
  S('G135084', '2848 Panola Road', 'Lithonia', 'GA', PAID, 26820),
  S('G135074', '3901 Buford Hwy NE', 'Atlanta', 'GA', PAID, 26950),
  S('G135108', '1395 Virginia Ave', 'East Point', 'GA', PAID, 3500),
  S('G135105', '4845 Jonesboro Rd', 'Forest Park', 'GA', PAID, 17380),
  S('G135088', '5040 Cherokee Street', 'Acworth', 'GA', PAID, 33276),
  S('G135098', '664 Thornton Road', 'Lithia Springs', 'GA', PAID, 19500),
  S('G135081', '3277 Lawrenceville Suwanee Rd', 'Suwanee', 'GA', PAID, 13379),
  S('G135071', '2532 Wesley Chapel Rd', 'Decatur', 'GA', PAID, 10500),
  S('G135080', '1635 Indian Trail Rd', 'Norcross', 'GA', PAID, 40000),
  S('G135111', '3555 Flat Shoals Rd', 'Decatur', 'GA', PAID, 17650),
  S('G135109', '5245 Old National Hwy', 'Atlanta', 'GA', PAID, 12380),
  S('G135089', '575 Bankhead Hwy', 'Carrollton', 'GA', PAID, 13610),
  S('G135103', '1493 Mount Zion Rd', 'Morrow', 'GA', PAID, 28100),
  S('G135181', '2663 W Main Street', 'Snellville', 'GA', PAID, 6400),
  S('G135177', '675 Georgia Highway 120', 'Lawrenceville', 'GA', PAID, 13380),
  S('G135073', '5290 Highway 78', 'Stone Mountain', 'GA', PAID, 7800),
  S('G135183', '4065 Highway 78', 'Loganville', 'GA', PAID, 8970),
  S('G135106', '23 Joseph E Lowery Blvd SW', 'Atlanta', 'GA', PAID, 4400),
  S('G135096', 'Highway 5', 'Douglasville', 'GA', PAID, 13086),
  S('G135090', '1297 Atlanta Hwy', 'Dallas', 'GA', PAID, 15920),
  S('G135085', '2637 Cobb Pkwy SE', 'Smyrna', 'GA', PAID, 8900),
  S('G135117', '3510 Cascade Rd SW', 'Atlanta', 'GA', PAID, 10200),
  S('G135086', '4023 Powder Springs Rd SW', 'Powder Springs', 'GA', PAID, 10700),
  S('G135075', '5681 Memorial Dr', 'Stone Mountain', 'GA', PAID, 25770),
  S('G135078', '695 Atlanta Rd', 'Cumming', 'GA', PAID, 13170),
  S('G135083', '5150 Windward Parkway', 'Alpharetta', 'GA', PAID, 28470),
  S('G135180', '2150 Barnett Shoals Road', 'Athens', 'GA', PAID, 7460),
  S('G135182', '2180 W Broad Street', 'Athens', 'GA', PAID, 6700),
  S('G135179', '3196 Atlanta Hwy', 'Athens', 'GA', PAID, 8940),
  // Georgia — invoiced, payment column not completed
  S('G135093', '1970 N Cobb Parkway', 'Kennesaw', 'GA', INVOICED, 15770),
  S('G135068', '3283 Northcrest Rd', 'Atlanta', 'GA', INVOICED, 15140),
  S('G135082', '4295 Lawrenceville Hwy', 'Tucker', 'GA', INVOICED, 30280),
  S('G135091', '2540 Delk Rd SE', 'Marietta', 'GA', INVOICED, 10210),
  S('G135072', '676 Holcomb Bridge Rd', 'Roswell', 'GA', INVOICED, 27500),
  S('G135113', '955 Eagle Landing Pkwy', 'Stockbridge', 'GA', INVOICED, 15570),
  // Georgia — on the tracker, no figures
  S('G135070', '1675 Highway 138 SE', 'Conyers', 'GA', LISTED),
  S('G135077', '4368 Highway 20', 'Buford', 'GA', LISTED),
  S('G135118', '2475 Bouldercrest Rd SE', 'Atlanta', 'GA', LISTED),
  S('G135100', '255 Cherokee Pl', 'Cartersville', 'GA', LISTED),
  S('G135112', '2840 Greenbriar Pkwy SW', 'Atlanta', 'GA', LISTED),
  S('G135116', '561 E 3rd St', 'Jackson', 'GA', LISTED),
  S('G135092', '6760 Highway 92', 'Acworth', 'GA', LISTED),
  S('G135104', '102 Highway 138 W', 'Stockbridge', 'GA', LISTED),
  S('G135094', '12 Cobb Pkwy N', 'Marietta', 'GA', LISTED),

  // Texas — deposit invoiced
  S('G135211', '201 S 77 Sunshine Strip', 'Harlingen', 'TX', INVOICED, 48672),
  S('G135213', '421 W Highway 83', 'Weslaco', 'TX', INVOICED, 28800),
  S('G135220', '901 E 9th St', 'Mission', 'TX', INVOICED, 22712),
  S('G135229', '2411 S US Highway 281', 'Edinburg', 'TX', INVOICED, 37440),
  S('G135230', '707 West Nolana Ave', 'McAllen', 'TX', INVOICED, 32480),
  S('G135232', '2701 Boca Chica', 'Brownsville', 'TX', INVOICED, 27768),
  S('G135235', '1120 W Hwy 77', 'San Benito', 'TX', INVOICED, 31020),
  S('G135238', '904 E Highway 83', 'Pharr', 'TX', INVOICED, 38000),
  S('G135239', '3565 W Alton Gloor', 'Brownsville', 'TX', INVOICED, 36500),
  // Texas — listed
  S('G135209', '6010 Wesley Street', 'Greenville', 'TX', LISTED),
  S('G135210', '1711 W Palestine Ave', 'Palestine', 'TX', LISTED),
  S('G135212', '2319 Guadalupe', 'Laredo', 'TX', LISTED),
  S('G135215', '1912 E Vet Memorial Blvd', 'Killeen', 'TX', LISTED),
  S('G135216', '1030 N Valley Mills Dr', 'Waco', 'TX', LISTED),
  S('G135217', '3201 Padre Blvd', 'South Padre Island', 'TX', LISTED),
  S('G135221', '2303 Business 190', 'Copperas Cove', 'TX', LISTED),
  S('G135222', '411 S Jackson St', 'Jacksonville', 'TX', LISTED),
  S('G135224', '3630 Troup Hwy 110', 'Tyler', 'TX', LISTED),
  S('G135225', '1424 N Loop 336 W', 'Conroe', 'TX', LISTED),
  S('G135226', '700 E End Blvd S', 'Marshall', 'TX', LISTED),
  S('G135227', '10 S 31st St', 'Temple', 'TX', LISTED),
  S('G135231', "1410 Veteran's Blvd", 'Del Rio', 'TX', LISTED),
  S('G135233', '1993 Garrison St', 'Eagle Pass', 'TX', LISTED),
  S('G135234', '1133 N Loop 340', 'Waco', 'TX', LISTED),
  S('G135236', '6901 S Broadway Ave', 'Tyler', 'TX', LISTED),
  S('G135237', '7605 McPherson Rd', 'Laredo', 'TX', LISTED),
  S('G135240', '4580 E US Highway 83', 'Rio Grande City', 'TX', LISTED),
  S('G135242', '516 East FM 2410', 'Harker Heights', 'TX', LISTED),

  // Michigan — invoiced
  S('G135362', '17750 Fenkell St', 'Detroit', 'MI', INVOICED, 23040),
  S('G135370', '6021 Dort Hwy', 'Grand Blanc', 'MI', INVOICED, 30780),
  S('G135372', '41670 Ford Rd', 'Canton', 'MI', INVOICED, 84670),
  S('G135377', '1445 West Bristol Road', 'Flint', 'MI', INVOICED, 14532),
  S('G135381', '1765 South Dort Highway', 'Flint', 'MI', INVOICED, 66980),
  S('G135383', '10018 Lapeer Road', 'Davison', 'MI', INVOICED, 69400),
  // Michigan — listed
  S('G135354', '9848 Livernois Ave', 'Detroit', 'MI', COMPLETED, 29871),
  S('G135355', '383 S Broadway St', 'Lake Orion', 'MI', COMPLETED, 19284),
  S('G135356', '8939 W 7 Mile Rd', 'Detroit', 'MI', COMPLETED, 11356),
  S('G135357', '15700 E 8 Mile Rd', 'Detroit', 'MI', LISTED),
  S('G135358', '2600 E 8 Mile Rd', 'Detroit', 'MI', COMPLETED, 23985),
  S('G135359', '4790 Dixie Hwy', 'Waterford', 'MI', COMPLETED, 26412),
  S('G135360', '3510 Clio Rd', 'Flint', 'MI', COMPLETED, 30428),
  S('G135361', '2716 W Grand Blvd', 'Detroit', 'MI', COMPLETED, 25985),
  S('G135363', '3785 Gratiot St', 'Detroit', 'MI', COMPLETED, 65705),
  S('G135364', '9041 Chalmers', 'Detroit', 'MI', COMPLETED, 30892),
  S('G135365', '606 S Rochester Rd', 'Rochester Hills', 'MI', LISTED),
  S('G135366', '13546 W McNichols Rd', 'Detroit', 'MI', COMPLETED, 37467),
  S('G135367', '20990 Harper Ave', 'Harper Woods', 'MI', COMPLETED, 41509),
  S('G135368', '13253 Woodward Ave', 'Highland Park', 'MI', COMPLETED, 33415),
  S('G135369', '12721 Michigan Ave', 'Dearborn', 'MI', COMPLETED, 24789),
  S('G135371', '2339 S Wayne Rd', 'Westland', 'MI', LISTED),
  S('G135373', '4427 Corunna Road', 'Flint', 'MI', COMPLETED, 39720),
  S('G135374', '22345 Grand River', 'Detroit', 'MI', COMPLETED, 27124),
  S('G135375', '1361 N Opdyke Road', 'Auburn Hills', 'MI', COMPLETED, 29542),
  S('G135376', '2601 W Davison Avenue', 'Detroit', 'MI', COMPLETED, 26846),
  S('G135379', '14201 W 7 Mile Rd', 'Detroit', 'MI', COMPLETED, 28567),
  S('G135380', '1000 S Opdyke Road', 'Pontiac', 'MI', COMPLETED, 26404),
  S('G135384', '4255 West Vienna Road', 'Clio', 'MI', COMPLETED, 12872),
  S('G135385', '9230 Birch Run Road', 'Birch Run', 'MI', COMPLETED, 34894),

  // Illinois — deposit invoiced
  S('G135001', '2943 18th Avenue', 'Rock Island', 'IL', INVOICED, 37439),
  S('G135004', '895 W 4th Street', 'Milan', 'IL', INVOICED, 28900),
  S('G135006', '1170 42nd Avenue', 'East Moline', 'IL', INVOICED, 44454),
  S('G135277', '14559 S Pulaski Road', 'Midlothian', 'IL', INVOICED, 44230),
  S('G135271', '3029 S Chicago Road', 'South Chicago Heights', 'IL', INVOICED, 37500),
  S('G1355272', '4349 E 211th Street', 'Matteson', 'IL', INVOICED, 64595),
  S('G135270', '5301 W 159th Street', 'Oak Forest', 'IL', INVOICED, 32000),
  S('G135036', '4430 16th St', 'Moline', 'IL', LISTED),

  // Iowa — four stores, exactly as the owner said
  S('G135002', '3843 Elmore Avenue', 'Davenport', 'IA', INVOICED, 28835),
  S('G135003', '208 W Locust St', 'Davenport', 'IA', INVOICED, 26450),
  S('G135005', '1012 W Kimberly', 'Davenport', 'IA', INVOICED, 39257),
  S('G135206', '924 N 2nd St', 'Clinton', 'IA', INVOICED, 17800),

  // New Jersey
  S('G135303', '1110 Route 46', 'Ledgewood', 'NJ', INVOICED, 92456),
  S('G135304', '230 East Mountain Avenue', 'Hackettstown', 'NJ', INVOICED, 69458),
  S('G135301', 'Route 36 Airport Plaza', 'Hazlet', 'NJ', LISTED),
  S('G135302', '190 Route 46', 'Rockaway', 'NJ', LISTED),
  S('G135305', '185 Ridgedale Avenue', 'Florham Park', 'NJ', LISTED),
  S('G135322', '2170 Fletcher Ave', 'Fort Lee', 'NJ', LISTED),
  S('G135323', '587 Cedar Ln', 'Teaneck', 'NJ', LISTED),
  S('G135324', '600 Paterson Plank Rd', 'Union City', 'NJ', LISTED),
  S('G135327', '114-116 Rahway Avenue', 'Elizabeth', 'NJ', LISTED),
  S('G135328', '249 Park Ave', 'Newark', 'NJ', LISTED),
  S('G135329', '591 Communipaw Ave', 'Jersey City', 'NJ', LISTED),
  S('G135330', '688-692 Lyons Avenue', 'Irvington', 'NJ', LISTED),
  S('G135331', '434 Central Ave', 'East Orange', 'NJ', LISTED),
  S('G135332', '516 Broadway', 'Bayonne', 'NJ', LISTED),
  S('G135333', '841 Springfield Avenue', 'Irvington', 'NJ', LISTED),
  S('G135334', '125 Bergen St', 'Newark', 'NJ', LISTED),
  S('G135335', '419 US Route 1', 'Iselin', 'NJ', LISTED),
  S('G135336', '92 St Georges Avenue', 'Rahway', 'NJ', LISTED),
  S('G135382', '1055 Route 1 South', 'North Brunswick', 'NJ', LISTED),

  // New York
  S('G135325', '1453 Forest Ave', 'Staten Island', 'NY', LISTED),
  S('G135326', '1959 Bruckner Blvd', 'Bronx', 'NY', LISTED),
  S('G135337', '2471 Hylan Blvd', 'Staten Island', 'NY', LISTED),
  S('G135338', '375 East 149th Street', 'Bronx', 'NY', LISTED),
  S('G135339', '1731 Webster Avenue', 'Bronx', 'NY', LISTED),
]

/** Counts by grade, derived rather than asserted. */
export function tally() {
  const t = { paid: 0, invoiced: 0, completed: 0, listed: 0 }
  for (const s of KBP_STORES) t[s.grade] += 1
  return t
}

/** Stores that may be drawn as work performed. */
export function workStores() {
  return KBP_STORES.filter((s) => SHOWABLE_AS_WORK.has(s.grade))
}

/** States touched, and by what grade. */
export function byState() {
  const out = {}
  for (const s of KBP_STORES) {
    out[s.state] ??= { paid: 0, invoiced: 0, completed: 0, listed: 0 }
    out[s.state][s.grade] += 1
  }
  return out
}

/**
 * THE LARGEST COMPLETED JOB IN THE KICKSERV EXPORT IS NOT A KBP STORE, AND
 * NOT IN THE STATE ITS RECORD CLAIMS
 * ──────────────────────────────────────────────────────────────────────────
 * Found on 2026-08-26 while reconciling Michigan. The Kickserv record reads
 * `state: "MI"`, which put a $351,576.10 job into the Michigan pile — larger
 * than any KBP Michigan store and larger than the entire Michigan
 * `completed` total.
 *
 * Everything else on the record says otherwise:
 *
 *   zip          39429            Columbia, Mississippi
 *   coordinates  31.2418, -89.8097
 *   address      950 Hwy 98 Bypass
 *   phone        area code 251    Mobile, Alabama
 *
 * Reverse-geocoded through the Census: Mississippi, Marion County, Columbia
 * city. The address resolves to 950 HWY 98 E, COLUMBIA, MS 39429. `MI` is a
 * typo for `MS`, and it is the only one of the fifty Michigan-labelled records
 * with a non-Michigan zip.
 *
 * It is recorded here rather than deleted because it is real work — a Burger
 * King, not a KFC, and nothing to do with the KBP programme. Mississippi
 * appears nowhere else in this record, so without this note the state has no
 * presence at all and the largest single job in the export stays misfiled.
 *
 * Not added to KBP_STORES: that array is the KBP programme, and this is
 * neither KBP nor a KFC.
 */
export const MISFILED_BY_STATE = [
  {
    customer: 'BK - Columbia',
    brand: 'Burger King',
    address: '950 Hwy 98 Bypass',
    city: 'Columbia',
    recordedState: 'MI',
    actualState: 'MS',
    county: 'Marion',
    zip: '39429',
    usd: 351576.1,
    completedJobs: 1,
    lastCompletedOn: '2018-11-27',
    source: 'kickserv',
    verifiedBy:
      'US Census reverse geocode of 31.2418343, -89.8096773 — Mississippi, Marion County, Columbia city; and forward geocode of the address to 950 HWY 98 E, COLUMBIA, MS 39429.',
    checked: '2026-08-26',
  },
]
