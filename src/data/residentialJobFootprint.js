/**
 * residentialJobFootprint.js — completed Kickserv jobs, aggregated to cities.
 *
 * WHAT THIS IS AND WHAT IT DELIBERATELY IS NOT
 * ────────────────────────────────────────────
 * Every entry is a city and a count of jobs with status `complete` and revenue
 * greater than zero in this company's own Kickserv export (read 2026-08-28).
 * City centers were geocoded via Nominatim/OpenStreetMap.
 *
 * No customer names, no street addresses, no per-job data — residential
 * customers are never mapped individually. The city-level count is the whole
 * disclosure, which is why this file may be committed while the export itself
 * never is.
 *
 * 782 completed jobs across 223 cities. Twelve more completed jobs carry no
 * usable city in the export and are not drawn; four city names failed to
 * geocode (misspellings in the source data, e.g. "Carrolllton").
 */
export const RESIDENTIAL_FOOTPRINT = [
 {
  "city": "Richmond",
  "state": "VA",
  "jobs": 123,
  "lat": 37.53851,
  "lng": -77.43428
 },
 {
  "city": "Chesterfield",
  "state": "VA",
  "jobs": 79,
  "lat": 37.386,
  "lng": -77.57851
 },
 {
  "city": "Henrico",
  "state": "VA",
  "jobs": 52,
  "lat": 37.51312,
  "lng": -77.34651
 },
 {
  "city": "Midlothian",
  "state": "VA",
  "jobs": 35,
  "lat": 37.48681,
  "lng": -77.64732
 },
 {
  "city": "Detroit",
  "state": "MI",
  "jobs": 16,
  "lat": 42.33155,
  "lng": -83.04664
 },
 {
  "city": "Overland Park",
  "state": "KS",
  "jobs": 15,
  "lat": 38.97425,
  "lng": -94.68517
 },
 {
  "city": "Mechanicsville",
  "state": "VA",
  "jobs": 14,
  "lat": 37.62772,
  "lng": -77.35382
 },
 {
  "city": "Manakin Sabot",
  "state": "VA",
  "jobs": 12,
  "lat": 37.60159,
  "lng": -77.71509
 },
 {
  "city": "North Chesterfield",
  "state": "VA",
  "jobs": 11,
  "lat": 37.50561,
  "lng": -77.6087
 },
 {
  "city": "Glen Allen",
  "state": "VA",
  "jobs": 11,
  "lat": 37.66488,
  "lng": -77.48712
 },
 {
  "city": "Chester",
  "state": "VA",
  "jobs": 11,
  "lat": 37.34895,
  "lng": -77.43838
 },
 {
  "city": "Atlanta",
  "state": "GA",
  "jobs": 10,
  "lat": 33.75447,
  "lng": -84.38982
 },
 {
  "city": "Chesapeake",
  "state": "VA",
  "jobs": 9,
  "lat": 36.71683,
  "lng": -76.24945
 },
 {
  "city": "Goochland",
  "state": "VA",
  "jobs": 8,
  "lat": 37.72043,
  "lng": -77.8838
 },
 {
  "city": "Virginia Beach",
  "state": "VA",
  "jobs": 8,
  "lat": 36.84966,
  "lng": -75.97608
 },
 {
  "city": "Flint",
  "state": "MI",
  "jobs": 8,
  "lat": 43.01617,
  "lng": -83.69002
 },
 {
  "city": "Kansas City",
  "state": "MO",
  "jobs": 8,
  "lat": 39.1001,
  "lng": -94.57814
 },
 {
  "city": "Petersburg",
  "state": "VA",
  "jobs": 6,
  "lat": 37.22793,
  "lng": -77.40193
 },
 {
  "city": "Davenport",
  "state": "IA",
  "jobs": 6,
  "lat": 41.52247,
  "lng": -90.57564
 },
 {
  "city": "Ashland",
  "state": "VA",
  "jobs": 5,
  "lat": 37.7594,
  "lng": -77.48066
 },
 {
  "city": "Tyler",
  "state": "TX",
  "jobs": 5,
  "lat": 32.35126,
  "lng": -95.30106
 },
 {
  "city": "Grand Blanc",
  "state": "MI",
  "jobs": 5,
  "lat": 42.92753,
  "lng": -83.62995
 },
 {
  "city": "Kansas City",
  "state": "KS",
  "jobs": 5,
  "lat": 39.11346,
  "lng": -94.6265
 },
 {
  "city": "Jennings",
  "state": "LA",
  "jobs": 5,
  "lat": 30.22243,
  "lng": -92.65708
 },
 {
  "city": "Roswell",
  "state": "GA",
  "jobs": 4,
  "lat": 34.02332,
  "lng": -84.36002
 },
 {
  "city": "Brownsville",
  "state": "TX",
  "jobs": 4,
  "lat": 25.90243,
  "lng": -97.49817
 },
 {
  "city": "Laredo",
  "state": "TX",
  "jobs": 4,
  "lat": 27.50792,
  "lng": -99.50698
 },
 {
  "city": "Newport News",
  "state": "VA",
  "jobs": 4,
  "lat": 36.9775,
  "lng": -76.42977
 },
 {
  "city": "Greensboro",
  "state": "NC",
  "jobs": 4,
  "lat": 36.07264,
  "lng": -79.79198
 },
 {
  "city": "Topeka",
  "state": "KS",
  "jobs": 4,
  "lat": 39.04901,
  "lng": -95.67756
 },
 {
  "city": "Fort Pierce",
  "state": "FL",
  "jobs": 4,
  "lat": 27.44671,
  "lng": -80.32561
 },
 {
  "city": "Birmingham",
  "state": "AL",
  "jobs": 4,
  "lat": 33.52068,
  "lng": -86.80243
 },
 {
  "city": "New Kent",
  "state": "VA",
  "jobs": 3,
  "lat": 37.49747,
  "lng": -76.99905
 },
 {
  "city": "Colonial Heights",
  "state": "VA",
  "jobs": 3,
  "lat": 37.25557,
  "lng": -77.4112
 },
 {
  "city": "Richmon",
  "state": "VA",
  "jobs": 3,
  "lat": 38.79984,
  "lng": -78.78972
 },
 {
  "city": "Medina",
  "state": "OH",
  "jobs": 3,
  "lat": 41.10008,
  "lng": -81.93825
 },
 {
  "city": "Smyrna",
  "state": "GA",
  "jobs": 3,
  "lat": 33.88389,
  "lng": -84.51475
 },
 {
  "city": "Davison",
  "state": "MI",
  "jobs": 3,
  "lat": 43.03469,
  "lng": -83.51802
 },
 {
  "city": "Athens",
  "state": "GA",
  "jobs": 3,
  "lat": 33.95977,
  "lng": -83.3764
 },
 {
  "city": "Harlingen",
  "state": "TX",
  "jobs": 3,
  "lat": 26.19075,
  "lng": -97.69606
 },
 {
  "city": "San Benito",
  "state": "TX",
  "jobs": 3,
  "lat": 26.13262,
  "lng": -97.63079
 },
 {
  "city": "Hackettstown",
  "state": "NJ",
  "jobs": 3,
  "lat": 40.85386,
  "lng": -74.82926
 },
 {
  "city": "Olathe",
  "state": "KS",
  "jobs": 3,
  "lat": 38.88389,
  "lng": -94.81887
 },
 {
  "city": "Belton",
  "state": "MO",
  "jobs": 3,
  "lat": 38.81081,
  "lng": -94.53135
 },
 {
  "city": "Harrisonville",
  "state": "MO",
  "jobs": 3,
  "lat": 38.65512,
  "lng": -94.34711
 },
 {
  "city": "Hampton",
  "state": "VA",
  "jobs": 3,
  "lat": 37.02644,
  "lng": -76.34428
 },
 {
  "city": "Norfolk",
  "state": "VA",
  "jobs": 3,
  "lat": 36.84937,
  "lng": -76.28995
 },
 {
  "city": "Independance",
  "state": "MO",
  "jobs": 3,
  "lat": 39.10326,
  "lng": -94.51591
 },
 {
  "city": "Williamsburg",
  "state": "VA",
  "jobs": 3,
  "lat": 37.27125,
  "lng": -76.70003
 },
 {
  "city": "Farmville",
  "state": "VA",
  "jobs": 2,
  "lat": 37.30247,
  "lng": -78.39238
 },
 {
  "city": "Midlothian,",
  "state": "VA",
  "jobs": 2,
  "lat": 37.48681,
  "lng": -77.64732
 },
 {
  "city": "Prince George",
  "state": "VA",
  "jobs": 2,
  "lat": 37.1815,
  "lng": -77.21531
 },
 {
  "city": "Sterling",
  "state": "VA",
  "jobs": 2,
  "lat": 39.00368,
  "lng": -77.40831
 },
 {
  "city": "Montpellier",
  "state": "VA",
  "jobs": 2,
  "lat": 36.88323,
  "lng": -76.26779
 },
 {
  "city": "Manakin-Sabot",
  "state": "VA",
  "jobs": 2,
  "lat": 37.60159,
  "lng": -77.71509
 },
 {
  "city": "Roanoke",
  "state": "VA",
  "jobs": 2,
  "lat": 37.27097,
  "lng": -79.94143
 },
 {
  "city": "Decatur",
  "state": "GA",
  "jobs": 2,
  "lat": 30.87366,
  "lng": -84.5741
 },
 {
  "city": "Suwanee Road",
  "state": "GA",
  "jobs": 2,
  "lat": 31.12058,
  "lng": -83.75051
 },
 {
  "city": "Acworth",
  "state": "GA",
  "jobs": 2,
  "lat": 34.06593,
  "lng": -84.67688
 },
 {
  "city": "Forest Park",
  "state": "GA",
  "jobs": 2,
  "lat": 33.62205,
  "lng": -84.36909
 },
 {
  "city": "Norcross",
  "state": "GA",
  "jobs": 2,
  "lat": 33.94121,
  "lng": -84.21353
 },
 {
  "city": "Temperanceville",
  "state": "VA",
  "jobs": 2,
  "lat": 37.89918,
  "lng": -75.55075
 },
 {
  "city": "Stone Mountain",
  "state": "GA",
  "jobs": 2,
  "lat": 33.80622,
  "lng": -84.14575
 },
 {
  "city": "Lawrenceville",
  "state": "GA",
  "jobs": 2,
  "lat": 33.95664,
  "lng": -83.98901
 },
 {
  "city": "Alpharetta",
  "state": "GA",
  "jobs": 2,
  "lat": 34.0756,
  "lng": -84.2946
 },
 {
  "city": "Canton",
  "state": "MI",
  "jobs": 2,
  "lat": 42.72693,
  "lng": -84.64331
 },
 {
  "city": "Stockbridge",
  "state": "GA",
  "jobs": 2,
  "lat": 33.54428,
  "lng": -84.23381
 },
 {
  "city": "Marietta",
  "state": "GA",
  "jobs": 2,
  "lat": 33.95285,
  "lng": -84.54961
 },
 {
  "city": "Clio",
  "state": "MI",
  "jobs": 2,
  "lat": 43.17742,
  "lng": -83.73469
 },
 {
  "city": "Rock Island",
  "state": "IL",
  "jobs": 2,
  "lat": 41.44118,
  "lng": -90.57661
 },
 {
  "city": "Milan",
  "state": "IL",
  "jobs": 2,
  "lat": 41.45309,
  "lng": -90.57208
 },
 {
  "city": "Moline",
  "state": "IL",
  "jobs": 2,
  "lat": 41.50626,
  "lng": -90.51626
 },
 {
  "city": "Oak Forest",
  "state": "IL",
  "jobs": 2,
  "lat": 41.60281,
  "lng": -87.74394
 },
 {
  "city": "Chicago Heights",
  "state": "IL",
  "jobs": 2,
  "lat": 41.50628,
  "lng": -87.63571
 },
 {
  "city": "Matteson",
  "state": "IL",
  "jobs": 2,
  "lat": 41.50983,
  "lng": -87.73927
 },
 {
  "city": "Midlothian",
  "state": "IL",
  "jobs": 2,
  "lat": 41.62531,
  "lng": -87.71755
 },
 {
  "city": "Weslaco",
  "state": "TX",
  "jobs": 2,
  "lat": 26.15943,
  "lng": -97.99074
 },
 {
  "city": "Mcallen",
  "state": "TX",
  "jobs": 2,
  "lat": 26.20411,
  "lng": -98.23006
 },
 {
  "city": "Mission",
  "state": "TX",
  "jobs": 2,
  "lat": 26.21591,
  "lng": -98.32529
 },
 {
  "city": "Pharr",
  "state": "TX",
  "jobs": 2,
  "lat": 26.1948,
  "lng": -98.18362
 },
 {
  "city": "Edinburg",
  "state": "TX",
  "jobs": 2,
  "lat": 26.3014,
  "lng": -98.16245
 },
 {
  "city": "Eagle Pass",
  "state": "TX",
  "jobs": 2,
  "lat": 28.70921,
  "lng": -100.49929
 },
 {
  "city": "Greenville",
  "state": "TX",
  "jobs": 2,
  "lat": 33.13845,
  "lng": -96.11081
 },
 {
  "city": "Ledgewood",
  "state": "NJ",
  "jobs": 2,
  "lat": 40.87386,
  "lng": -74.67132
 },
 {
  "city": "Pontiac",
  "state": "MI",
  "jobs": 2,
  "lat": 42.63892,
  "lng": -83.29105
 },
 {
  "city": "Waco",
  "state": "TX",
  "jobs": 2,
  "lat": 31.54919,
  "lng": -97.14746
 },
 {
  "city": "Covington",
  "state": "GA",
  "jobs": 2,
  "lat": 33.5966,
  "lng": -83.85987
 },
 {
  "city": "Irvington",
  "state": "NJ",
  "jobs": 2,
  "lat": 40.72641,
  "lng": -74.22895
 },
 {
  "city": "Lenexa",
  "state": "KS",
  "jobs": 2,
  "lat": 38.96975,
  "lng": -94.78458
 },
 {
  "city": "Burlington",
  "state": "NC",
  "jobs": 2,
  "lat": 36.09569,
  "lng": -79.4378
 },
 {
  "city": "Raytown",
  "state": "MO",
  "jobs": 2,
  "lat": 39.00892,
  "lng": -94.46221
 },
 {
  "city": "Independence",
  "state": "MO",
  "jobs": 2,
  "lat": 39.09248,
  "lng": -94.41379
 },
 {
  "city": "Dearborn",
  "state": "MI",
  "jobs": 2,
  "lat": 42.32226,
  "lng": -83.17631
 },
 {
  "city": "Harper Woods",
  "state": "MI",
  "jobs": 2,
  "lat": 42.43334,
  "lng": -82.92388
 },
 {
  "city": "Upper Marlboro",
  "state": "MD",
  "jobs": 2,
  "lat": 38.81625,
  "lng": -76.75171
 },
 {
  "city": "Chicago",
  "state": "IL",
  "jobs": 2,
  "lat": 41.87556,
  "lng": -87.62442
 },
 {
  "city": "Auburn Hills",
  "state": "MI",
  "jobs": 2,
  "lat": 42.68753,
  "lng": -83.2341
 },
 {
  "city": "Aurora",
  "state": "IL",
  "jobs": 2,
  "lat": 41.75717,
  "lng": -88.31475
 },
 {
  "city": "West Chicago",
  "state": "IL",
  "jobs": 2,
  "lat": 41.88475,
  "lng": -88.20396
 },
 {
  "city": "Lawrence",
  "state": "KS",
  "jobs": 2,
  "lat": 38.97191,
  "lng": -95.23594
 },
 {
  "city": "Syracuse",
  "state": "NY",
  "jobs": 2,
  "lat": 43.04812,
  "lng": -76.14742
 },
 {
  "city": "Liverpool",
  "state": "NY",
  "jobs": 2,
  "lat": 43.10646,
  "lng": -76.2177
 },
 {
  "city": "Huntsville",
  "state": "AL",
  "jobs": 2,
  "lat": 34.72985,
  "lng": -86.5859
 },
 {
  "city": "Madison",
  "state": "AL",
  "jobs": 2,
  "lat": 34.77368,
  "lng": -86.56751
 },
 {
  "city": "Jefferson City",
  "state": "MO",
  "jobs": 2,
  "lat": 38.57736,
  "lng": -92.17243
 },
 {
  "city": "Burton",
  "state": "MI",
  "jobs": 2,
  "lat": 42.98973,
  "lng": -83.6335
 },
 {
  "city": "Charlottesville",
  "state": "VA",
  "jobs": 2,
  "lat": 38.02931,
  "lng": -78.47668
 },
 {
  "city": "Charles City",
  "state": "VA",
  "jobs": 1,
  "lat": 37.37058,
  "lng": -77.06051
 },
 {
  "city": "Sutherland",
  "state": "VA",
  "jobs": 1,
  "lat": 37.19598,
  "lng": -77.55971
 },
 {
  "city": "North Chesterfield,",
  "state": "VA",
  "jobs": 1,
  "lat": 37.50561,
  "lng": -77.6087
 },
 {
  "city": "Spring Grove",
  "state": "VA",
  "jobs": 1,
  "lat": 37.1657,
  "lng": -76.9733
 },
 {
  "city": "New Kent,",
  "state": "VA",
  "jobs": 1,
  "lat": 37.49747,
  "lng": -76.99905
 },
 {
  "city": "Glen Burnie",
  "state": "MD",
  "jobs": 1,
  "lat": 39.15954,
  "lng": -76.61515
 },
 {
  "city": "Providence Forge",
  "state": "VA",
  "jobs": 1,
  "lat": 37.44243,
  "lng": -77.04396
 },
 {
  "city": "South Chesterfield",
  "state": "VA",
  "jobs": 1,
  "lat": 38.84743,
  "lng": -77.10761
 },
 {
  "city": "Ricmond",
  "state": "VA",
  "jobs": 1,
  "lat": 37.53851,
  "lng": -77.43428
 },
 {
  "city": "Henrico,",
  "state": "VA",
  "jobs": 1,
  "lat": 37.51312,
  "lng": -77.34651
 },
 {
  "city": "Bon Air",
  "state": "VA",
  "jobs": 1,
  "lat": 37.51912,
  "lng": -77.57513
 },
 {
  "city": "Glenn Allen",
  "state": "VA",
  "jobs": 1,
  "lat": 37.66879,
  "lng": -77.47522
 },
 {
  "city": "N. Chesterfield",
  "state": "VA",
  "jobs": 1,
  "lat": 37.50561,
  "lng": -77.6087
 },
 {
  "city": "Yale",
  "state": "VA",
  "jobs": 1,
  "lat": 36.84571,
  "lng": -77.28747
 },
 {
  "city": "Phenix",
  "state": "VA",
  "jobs": 1,
  "lat": 37.07987,
  "lng": -78.74778
 },
 {
  "city": "N Chesterfield",
  "state": "VA",
  "jobs": 1,
  "lat": 37.50561,
  "lng": -77.6087
 },
 {
  "city": "Blacksburg",
  "state": "VA",
  "jobs": 1,
  "lat": 37.22966,
  "lng": -80.41368
 },
 {
  "city": "Spotsylvania",
  "state": "VA",
  "jobs": 1,
  "lat": 38.18809,
  "lng": -77.67418
 },
 {
  "city": "Montpelier",
  "state": "VA",
  "jobs": 1,
  "lat": 38.21883,
  "lng": -78.16843
 },
 {
  "city": "East Point",
  "state": "GA",
  "jobs": 1,
  "lat": 33.67955,
  "lng": -84.43937
 },
 {
  "city": "Sandy Hook",
  "state": "VA",
  "jobs": 1,
  "lat": 37.75265,
  "lng": -77.9125
 },
 {
  "city": "Bufford",
  "state": "GA",
  "jobs": 1,
  "lat": 34.24787,
  "lng": -84.75021
 },
 {
  "city": "West Point",
  "state": "VA",
  "jobs": 1,
  "lat": 37.53153,
  "lng": -76.79636
 },
 {
  "city": "Morrow",
  "state": "GA",
  "jobs": 1,
  "lat": 33.58317,
  "lng": -84.33937
 },
 {
  "city": "Douglasville",
  "state": "GA",
  "jobs": 1,
  "lat": 33.7515,
  "lng": -84.74771
 },
 {
  "city": "Loganville",
  "state": "GA",
  "jobs": 1,
  "lat": 33.839,
  "lng": -83.90074
 },
 {
  "city": "Snellville",
  "state": "GA",
  "jobs": 1,
  "lat": 33.85733,
  "lng": -84.01991
 },
 {
  "city": "Cumming",
  "state": "GA",
  "jobs": 1,
  "lat": 34.20732,
  "lng": -84.14019
 },
 {
  "city": "Quinton",
  "state": "VA",
  "jobs": 1,
  "lat": 37.53279,
  "lng": -77.11544
 },
 {
  "city": "Dallas",
  "state": "GA",
  "jobs": 1,
  "lat": 33.92371,
  "lng": -84.84077
 },
 {
  "city": "Riverdale",
  "state": "GA",
  "jobs": 1,
  "lat": 33.57261,
  "lng": -84.41326
 },
 {
  "city": "Jackson",
  "state": "GA",
  "jobs": 1,
  "lat": 34.12826,
  "lng": -83.57534
 },
 {
  "city": "Cartersville",
  "state": "GA",
  "jobs": 1,
  "lat": 34.16523,
  "lng": -84.79976
 },
 {
  "city": "Kennesaw",
  "state": "GA",
  "jobs": 1,
  "lat": 34.02343,
  "lng": -84.61549
 },
 {
  "city": "Tucker",
  "state": "GA",
  "jobs": 1,
  "lat": 33.85327,
  "lng": -84.22007
 },
 {
  "city": "Conyers",
  "state": "GA",
  "jobs": 1,
  "lat": 33.66761,
  "lng": -84.01769
 },
 {
  "city": "Clinton",
  "state": "IL",
  "jobs": 1,
  "lat": 38.58962,
  "lng": -89.42006
 },
 {
  "city": "Fenton",
  "state": "MI",
  "jobs": 1,
  "lat": 42.79781,
  "lng": -83.70495
 },
 {
  "city": "S Padre Island",
  "state": "TX",
  "jobs": 1,
  "lat": 26.10369,
  "lng": -97.16469
 },
 {
  "city": "Excelsior Springs",
  "state": "MO",
  "jobs": 1,
  "lat": 39.34172,
  "lng": -94.22235
 },
 {
  "city": "Rio Grande City",
  "state": "TX",
  "jobs": 1,
  "lat": 26.38278,
  "lng": -98.82053
 },
 {
  "city": "Del Rio",
  "state": "TX",
  "jobs": 1,
  "lat": 29.35751,
  "lng": -100.89877
 },
 {
  "city": "Palestine",
  "state": "TX",
  "jobs": 1,
  "lat": 31.76212,
  "lng": -95.63079
 },
 {
  "city": "Temple",
  "state": "TX",
  "jobs": 1,
  "lat": 31.09837,
  "lng": -97.34296
 },
 {
  "city": "Clarkston",
  "state": "GA",
  "jobs": 1,
  "lat": 33.80955,
  "lng": -84.23964
 },
 {
  "city": "Hampton",
  "state": "GA",
  "jobs": 1,
  "lat": 33.38706,
  "lng": -84.28298
 },
 {
  "city": "Villa Rica",
  "state": "GA",
  "jobs": 1,
  "lat": 33.73205,
  "lng": -84.91911
 },
 {
  "city": "Killeen",
  "state": "TX",
  "jobs": 1,
  "lat": 31.11714,
  "lng": -97.7278
 },
 {
  "city": "Elmhurst",
  "state": "IL",
  "jobs": 1,
  "lat": 41.89947,
  "lng": -87.94034
 },
 {
  "city": "Hazlet",
  "state": "NJ",
  "jobs": 1,
  "lat": 40.42922,
  "lng": -74.1649
 },
 {
  "city": "Rockaway",
  "state": "NJ",
  "jobs": 1,
  "lat": 40.90135,
  "lng": -74.51382
 },
 {
  "city": "Florham Park",
  "state": "NJ",
  "jobs": 1,
  "lat": 40.78816,
  "lng": -74.38916
 },
 {
  "city": "East Orange",
  "state": "NJ",
  "jobs": 1,
  "lat": 40.76424,
  "lng": -74.21501
 },
 {
  "city": "Iselin",
  "state": "NJ",
  "jobs": 1,
  "lat": 40.56934,
  "lng": -74.31511
 },
 {
  "city": "Rahway",
  "state": "NJ",
  "jobs": 1,
  "lat": 40.60816,
  "lng": -74.27765
 },
 {
  "city": "North Brunswick",
  "state": "NJ",
  "jobs": 1,
  "lat": 40.45392,
  "lng": -74.47655
 },
 {
  "city": "Junction City",
  "state": "KS",
  "jobs": 1,
  "lat": 39.02861,
  "lng": -96.8314
 },
 {
  "city": "Portsmouth",
  "state": "VA",
  "jobs": 1,
  "lat": 36.83201,
  "lng": -76.2977
 },
 {
  "city": "High Point",
  "state": "NC",
  "jobs": 1,
  "lat": 35.95569,
  "lng": -80.00532
 },
 {
  "city": "Homewood",
  "state": "IL",
  "jobs": 1,
  "lat": 41.5574,
  "lng": -87.66515
 },
 {
  "city": "Prince Frederick",
  "state": "MD",
  "jobs": 1,
  "lat": 38.54061,
  "lng": -76.58351
 },
 {
  "city": "Bryans Road",
  "state": "MD",
  "jobs": 1,
  "lat": 38.62537,
  "lng": -77.08208
 },
 {
  "city": "Orland Park",
  "state": "IL",
  "jobs": 1,
  "lat": 41.63066,
  "lng": -87.85363
 },
 {
  "city": "Westchester",
  "state": "IL",
  "jobs": 1,
  "lat": 41.85059,
  "lng": -87.882
 },
 {
  "city": "Waterford Township",
  "state": "MI",
  "jobs": 1,
  "lat": 42.67064,
  "lng": -83.38962
 },
 {
  "city": "Shawnee",
  "state": "KS",
  "jobs": 1,
  "lat": 39.02737,
  "lng": -95.76275
 },
 {
  "city": "Millington",
  "state": "MI",
  "jobs": 1,
  "lat": 43.28134,
  "lng": -83.52981
 },
 {
  "city": "Highland Park",
  "state": "MI",
  "jobs": 1,
  "lat": 42.4056,
  "lng": -83.09658
 },
 {
  "city": "Bonner Springs",
  "state": "KS",
  "jobs": 1,
  "lat": 39.05971,
  "lng": -94.88376
 },
 {
  "city": "Tappahannock",
  "state": "VA",
  "jobs": 1,
  "lat": 37.92832,
  "lng": -76.86004
 },
 {
  "city": "Yorkville",
  "state": "IL",
  "jobs": 1,
  "lat": 41.64114,
  "lng": -88.44729
 },
 {
  "city": "Des Plaines",
  "state": "IL",
  "jobs": 1,
  "lat": 42.04158,
  "lng": -87.88739
 },
 {
  "city": "Bolingbrook",
  "state": "IL",
  "jobs": 1,
  "lat": 41.70033,
  "lng": -88.07177
 },
 {
  "city": "Waukegan",
  "state": "IL",
  "jobs": 1,
  "lat": 42.36023,
  "lng": -87.83182
 },
 {
  "city": "Naperville",
  "state": "IL",
  "jobs": 1,
  "lat": 41.77287,
  "lng": -88.14793
 },
 {
  "city": "Downers Grove",
  "state": "IL",
  "jobs": 1,
  "lat": 41.79368,
  "lng": -88.01023
 },
 {
  "city": "Lake Orion",
  "state": "MI",
  "jobs": 1,
  "lat": 42.78448,
  "lng": -83.23966
 },
 {
  "city": "Jacksonville",
  "state": "TX",
  "jobs": 1,
  "lat": 31.96378,
  "lng": -95.2705
 },
 {
  "city": "Copperas Cove",
  "state": "TX",
  "jobs": 1,
  "lat": 31.12406,
  "lng": -97.90308
 },
 {
  "city": "Marshall",
  "state": "TX",
  "jobs": 1,
  "lat": 32.54478,
  "lng": -94.3661
 },
 {
  "city": "Elizabeth City",
  "state": "NC",
  "jobs": 1,
  "lat": 36.30102,
  "lng": -76.22037
 },
 {
  "city": "Port St. Lucie",
  "state": "FL",
  "jobs": 1,
  "lat": 27.29393,
  "lng": -80.35033
 },
 {
  "city": "Watertown",
  "state": "NY",
  "jobs": 1,
  "lat": 43.97478,
  "lng": -75.91076
 },
 {
  "city": "Evans Mills",
  "state": "NY",
  "jobs": 1,
  "lat": 44.08832,
  "lng": -75.80738
 },
 {
  "city": "Camillus",
  "state": "NY",
  "jobs": 1,
  "lat": 43.03923,
  "lng": -76.3041
 },
 {
  "city": "Cicero",
  "state": "NY",
  "jobs": 1,
  "lat": 43.17562,
  "lng": -76.11937
 },
 {
  "city": "Waterloo",
  "state": "NY",
  "jobs": 1,
  "lat": 42.90469,
  "lng": -76.86279
 },
 {
  "city": "Herkimer",
  "state": "NY",
  "jobs": 1,
  "lat": 43.49113,
  "lng": -74.94813
 },
 {
  "city": "Auburn",
  "state": "NY",
  "jobs": 1,
  "lat": 42.93202,
  "lng": -76.5672
 },
 {
  "city": "Scottsboro",
  "state": "AL",
  "jobs": 1,
  "lat": 34.67313,
  "lng": -86.03388
 },
 {
  "city": "New Hartford",
  "state": "NY",
  "jobs": 1,
  "lat": 43.07311,
  "lng": -75.28793
 },
 {
  "city": "Pelham",
  "state": "AL",
  "jobs": 1,
  "lat": 33.28567,
  "lng": -86.80999
 },
 {
  "city": "Gardendale",
  "state": "AL",
  "jobs": 1,
  "lat": 33.6601,
  "lng": -86.81277
 },
 {
  "city": "Forestdale",
  "state": "AL",
  "jobs": 1,
  "lat": 33.5741,
  "lng": -86.88992
 },
 {
  "city": "Bessemer",
  "state": "AL",
  "jobs": 1,
  "lat": 33.40178,
  "lng": -86.95444
 },
 {
  "city": "Hueytown",
  "state": "AL",
  "jobs": 1,
  "lat": 33.45122,
  "lng": -86.99666
 },
 {
  "city": "Irondale",
  "state": "AL",
  "jobs": 1,
  "lat": 33.53816,
  "lng": -86.70721
 },
 {
  "city": "Fayetteville",
  "state": "TN",
  "jobs": 1,
  "lat": 35.15203,
  "lng": -86.57055
 },
 {
  "city": "Centerpoint",
  "state": "AL",
  "jobs": 1,
  "lat": 33.65605,
  "lng": -86.68088
 },
 {
  "city": "Decatur",
  "state": "AL",
  "jobs": 1,
  "lat": 34.60602,
  "lng": -86.98382
 },
 {
  "city": "Meridianville",
  "state": "AL",
  "jobs": 1,
  "lat": 34.87032,
  "lng": -86.57136
 },
 {
  "city": "Waldorf",
  "state": "MD",
  "jobs": 1,
  "lat": 38.60239,
  "lng": -76.92741
 },
 {
  "city": "Stevensville",
  "state": "MD",
  "jobs": 1,
  "lat": 38.97777,
  "lng": -76.31894
 },
 {
  "city": "Oak Grove",
  "state": "MO",
  "jobs": 1,
  "lat": 39.00484,
  "lng": -94.12919
 },
 {
  "city": "Cameron",
  "state": "MO",
  "jobs": 1,
  "lat": 39.74127,
  "lng": -94.23845
 },
 {
  "city": "Lakeland",
  "state": "FL",
  "jobs": 1,
  "lat": 28.03947,
  "lng": -81.9498
 },
 {
  "city": "Lake Wales",
  "state": "FL",
  "jobs": 1,
  "lat": 27.90141,
  "lng": -81.58591
 },
 {
  "city": "Ennis",
  "state": "TX",
  "jobs": 1,
  "lat": 32.32931,
  "lng": -96.62527
 },
 {
  "city": "Crowley",
  "state": "LA",
  "jobs": 1,
  "lat": 30.21409,
  "lng": -92.37458
 },
 {
  "city": "Sulphur Springs",
  "state": "TX",
  "jobs": 1,
  "lat": 33.13849,
  "lng": -95.60101
 },
 {
  "city": "Winston-Salem",
  "state": "NC",
  "jobs": 1,
  "lat": 36.09981,
  "lng": -80.24405
 },
 {
  "city": "Columbia",
  "state": "MI",
  "jobs": 1,
  "lat": 42.35433,
  "lng": -83.30633
 },
 {
  "city": "North Port",
  "state": "FL",
  "jobs": 1,
  "lat": 27.04422,
  "lng": -82.23593
 },
 {
  "city": "Dunedin",
  "state": "FL",
  "jobs": 1,
  "lat": 28.01166,
  "lng": -82.78938
 },
 {
  "city": "Westfield",
  "state": "NC",
  "jobs": 1,
  "lat": 36.47541,
  "lng": -80.44672
 },
 {
  "city": "Spotsylvania Courthouse",
  "state": "VA",
  "jobs": 1,
  "lat": 38.20001,
  "lng": -77.58647
 }
]
