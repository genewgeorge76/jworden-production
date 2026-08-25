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
 *   listed    The store was assigned to the programme. Nothing more. A roster
 *             entry is a place to look, not a job done.
 *
 * Only `paid` and `invoiced` may be shown as work. `listed` exists so the
 * footprint can be understood without being claimed, and a test enforces it.
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
export const LISTED = 'listed'

/** Only these two may be drawn as work performed. */
export const SHOWABLE_AS_WORK = new Set([PAID, INVOICED])

const S = (store, address, city, state, grade, usd = null) => ({ store, address, city, state, grade, usd })

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
  S('G135354', '9848 Livernois Ave', 'Detroit', 'MI', LISTED),
  S('G135355', '383 S Broadway St', 'Lake Orion', 'MI', LISTED),
  S('G135356', '8939 W 7 Mile Rd', 'Detroit', 'MI', LISTED),
  S('G135357', '15700 E 8 Mile Rd', 'Detroit', 'MI', LISTED),
  S('G135358', '2600 E 8 Mile Rd', 'Detroit', 'MI', LISTED),
  S('G135359', '4790 Dixie Hwy', 'Waterford', 'MI', LISTED),
  S('G135360', '3510 Clio Rd', 'Flint', 'MI', LISTED),
  S('G135361', '2716 W Grand Blvd', 'Detroit', 'MI', LISTED),
  S('G135363', '3785 Gratiot St', 'Detroit', 'MI', LISTED),
  S('G135364', '9041 Chalmers', 'Detroit', 'MI', LISTED),
  S('G135365', '606 S Rochester Rd', 'Rochester Hills', 'MI', LISTED),
  S('G135366', '13546 W McNichols Rd', 'Detroit', 'MI', LISTED),
  S('G135367', '20990 Harper Ave', 'Harper Woods', 'MI', LISTED),
  S('G135368', '13253 Woodward Ave', 'Highland Park', 'MI', LISTED),
  S('G135369', '12721 Michigan Ave', 'Dearborn', 'MI', LISTED),
  S('G135371', '2339 S Wayne Rd', 'Westland', 'MI', LISTED),
  S('G135373', '4427 Corunna Road', 'Flint', 'MI', LISTED),
  S('G135374', '22345 Grand River', 'Detroit', 'MI', LISTED),
  S('G135375', '1361 N Opdyke Road', 'Auburn Hills', 'MI', LISTED),
  S('G135376', '2601 W Davison Avenue', 'Detroit', 'MI', LISTED),
  S('G135379', '14201 W 7 Mile Rd', 'Detroit', 'MI', LISTED),
  S('G135380', '1000 S Opdyke Road', 'Pontiac', 'MI', LISTED),
  S('G135384', '4255 West Vienna Road', 'Clio', 'MI', LISTED),
  S('G135385', '9230 Birch Run Road', 'Birch Run', 'MI', LISTED),

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
  const t = { paid: 0, invoiced: 0, listed: 0 }
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
    out[s.state] ??= { paid: 0, invoiced: 0, listed: 0 }
    out[s.state][s.grade] += 1
  }
  return out
}
