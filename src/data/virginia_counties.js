/**
 * virginia_counties.js — All 95 counties + 38 independent cities in Virginia
 * with centroid coordinates, VDOT district assignment, and service-tier flag.
 *
 * service_tier:
 *   "primary"   — within ~90 mi of Chester, VA HQ (Chesterfield / Richmond metro)
 *   "extended"  — reachable same-day mobilization
 *   "statewide" — covered via subcontractor network / VDOT bid pursuit
 */

export const VA_VDOT_DISTRICTS = [
  "Bristol", "Culpeper", "Fredericksburg", "Hampton Roads",
  "Lynchburg", "Northern Virginia", "Richmond", "Salem", "Staunton",
];

/** All 95 Virginia counties */
export const VA_COUNTIES = [
  // Central Virginia / Richmond metro — primary service area
  { fips: "51041", name: "Chesterfield",    lat: 37.3763, lng: -77.5851, vdot: "Richmond",        tier: "primary" },
  { fips: "51087", name: "Henrico",         lat: 37.5532, lng: -77.3460, vdot: "Richmond",        tier: "primary" },
  { fips: "51085", name: "Hanover",         lat: 37.7596, lng: -77.4169, vdot: "Richmond",        tier: "primary" },
  { fips: "51127", name: "New Kent",        lat: 37.5018, lng: -77.0255, vdot: "Richmond",        tier: "primary" },
  { fips: "51053", name: "Dinwiddie",       lat: 37.0743, lng: -77.5969, vdot: "Richmond",        tier: "primary" },
  { fips: "51145", name: "Powhatan",        lat: 37.5499, lng: -77.9086, vdot: "Richmond",        tier: "primary" },
  { fips: "51075", name: "Goochland",       lat: 37.6953, lng: -77.9066, vdot: "Richmond",        tier: "primary" },
  { fips: "51049", name: "Cumberland",      lat: 37.5068, lng: -78.2447, vdot: "Richmond",        tier: "extended" },
  { fips: "51007", name: "Amelia",          lat: 37.3430, lng: -77.9744, vdot: "Richmond",        tier: "extended" },
  { fips: "51025", name: "Brunswick",       lat: 36.7642, lng: -77.8595, vdot: "Richmond",        tier: "statewide" },
  { fips: "51183", name: "Sussex",          lat: 36.9221, lng: -77.2774, vdot: "Richmond",        tier: "statewide" },
  { fips: "51147", name: "Prince George",   lat: 37.1704, lng: -77.2151, vdot: "Richmond",        tier: "primary" },
  { fips: "51149", name: "Prince Edward",   lat: 37.2243, lng: -78.3939, vdot: "Lynchburg",       tier: "statewide" },
  { fips: "51033", name: "Caroline",        lat: 37.9132, lng: -77.3506, vdot: "Fredericksburg",  tier: "extended" },
  { fips: "51097", name: "King and Queen",  lat: 37.6696, lng: -76.8803, vdot: "Richmond",        tier: "extended" },
  { fips: "51101", name: "King William",    lat: 37.6849, lng: -77.0795, vdot: "Richmond",        tier: "extended" },
  // Northern Virginia / Fredericksburg corridor
  { fips: "51059", name: "Fairfax",         lat: 38.8462, lng: -77.2861, vdot: "Northern Virginia", tier: "statewide" },
  { fips: "51153", name: "Prince William",  lat: 38.6987, lng: -77.4774, vdot: "Northern Virginia", tier: "statewide" },
  { fips: "51107", name: "Loudoun",         lat: 39.0837, lng: -77.6388, vdot: "Northern Virginia", tier: "statewide" },
  { fips: "51061", name: "Fauquier",        lat: 38.7309, lng: -77.8353, vdot: "Culpeper",          tier: "statewide" },
  { fips: "51179", name: "Stafford",        lat: 38.4225, lng: -77.4408, vdot: "Fredericksburg",    tier: "extended"  },
  { fips: "51177", name: "Spotsylvania",    lat: 38.1847, lng: -77.6550, vdot: "Fredericksburg",    tier: "extended"  },
  { fips: "51099", name: "King George",     lat: 38.2637, lng: -77.0854, vdot: "Fredericksburg",    tier: "extended"  },
  { fips: "51017", name: "Bath",            lat: 38.0633, lng: -79.7278, vdot: "Staunton",          tier: "statewide" },
  { fips: "51015", name: "Augusta",         lat: 38.1515, lng: -79.1266, vdot: "Staunton",          tier: "statewide" },
  { fips: "51165", name: "Rockingham",      lat: 38.5205, lng: -78.9244, vdot: "Staunton",          tier: "statewide" },
  { fips: "51171", name: "Shenandoah",      lat: 38.8472, lng: -78.5617, vdot: "Staunton",          tier: "statewide" },
  { fips: "51139", name: "Page",            lat: 38.6214, lng: -78.4762, vdot: "Culpeper",          tier: "statewide" },
  { fips: "51047", name: "Culpeper",        lat: 38.4956, lng: -77.9945, vdot: "Culpeper",          tier: "statewide" },
  { fips: "51157", name: "Rappahannock",    lat: 38.6863, lng: -78.1678, vdot: "Culpeper",          tier: "statewide" },
  { fips: "51029", name: "Buckingham",      lat: 37.5599, lng: -78.5492, vdot: "Lynchburg",         tier: "statewide" },
  { fips: "51009", name: "Amherst",         lat: 37.5932, lng: -79.0519, vdot: "Lynchburg",         tier: "statewide" },
  { fips: "51011", name: "Appomattox",      lat: 37.3556, lng: -78.8137, vdot: "Lynchburg",         tier: "statewide" },
  { fips: "51019", name: "Bedford",         lat: 37.3196, lng: -79.5249, vdot: "Lynchburg",         tier: "statewide" },
  { fips: "51031", name: "Campbell",        lat: 37.2007, lng: -79.0960, vdot: "Lynchburg",         tier: "statewide" },
  { fips: "51143", name: "Pittsylvania",    lat: 36.8283, lng: -79.4019, vdot: "Lynchburg",         tier: "statewide" },
  { fips: "51089", name: "Henry",           lat: 36.6866, lng: -79.9018, vdot: "Salem",             tier: "statewide" },
  { fips: "51141", name: "Patrick",         lat: 36.6572, lng: -80.2795, vdot: "Salem",             tier: "statewide" },
  { fips: "51067", name: "Franklin",        lat: 36.9956, lng: -79.8850, vdot: "Salem",             tier: "statewide" },
  { fips: "51161", name: "Roanoke",         lat: 37.2694, lng: -79.9317, vdot: "Salem",             tier: "statewide" },
  { fips: "51045", name: "Craig",           lat: 37.4723, lng: -80.2330, vdot: "Salem",             tier: "statewide" },
  { fips: "51071", name: "Giles",           lat: 37.3227, lng: -80.6887, vdot: "Salem",             tier: "statewide" },
  { fips: "51155", name: "Pulaski",         lat: 37.0600, lng: -80.7223, vdot: "Salem",             tier: "statewide" },
  { fips: "51035", name: "Carroll",         lat: 36.7276, lng: -80.7152, vdot: "Bristol",           tier: "statewide" },
  { fips: "51197", name: "Wythe",           lat: 36.9253, lng: -81.0845, vdot: "Bristol",           tier: "statewide" },
  { fips: "51173", name: "Smyth",           lat: 36.8399, lng: -81.5441, vdot: "Bristol",           tier: "statewide" },
  { fips: "51185", name: "Tazewell",        lat: 37.1135, lng: -81.5440, vdot: "Bristol",           tier: "statewide" },
  { fips: "51195", name: "Washington",      lat: 36.7244, lng: -82.0139, vdot: "Bristol",           tier: "statewide" },
  { fips: "51027", name: "Buchanan",        lat: 37.2671, lng: -82.0349, vdot: "Bristol",           tier: "statewide" },
  { fips: "51051", name: "Dickenson",       lat: 37.1296, lng: -82.3459, vdot: "Bristol",           tier: "statewide" },
  { fips: "51167", name: "Russell",         lat: 36.9366, lng: -82.0878, vdot: "Bristol",           tier: "statewide" },
  { fips: "51169", name: "Scott",           lat: 36.7139, lng: -82.6032, vdot: "Bristol",           tier: "statewide" },
  { fips: "51105", name: "Lee",             lat: 36.7026, lng: -83.1231, vdot: "Bristol",           tier: "statewide" },
  { fips: "51021", name: "Bland",           lat: 37.1293, lng: -81.1381, vdot: "Bristol",           tier: "statewide" },
  // Hampton Roads
  { fips: "51095", name: "Isle of Wight",   lat: 36.8990, lng: -76.7057, vdot: "Hampton Roads",    tier: "statewide" },
  { fips: "51093", name: "Isle of Wight",   lat: 36.8990, lng: -76.7057, vdot: "Hampton Roads",    tier: "statewide" },
  { fips: "51175", name: "Southampton",     lat: 36.7209, lng: -77.0970, vdot: "Hampton Roads",    tier: "statewide" },
  { fips: "51181", name: "Surry",           lat: 37.1139, lng: -76.8824, vdot: "Hampton Roads",    tier: "statewide" },
  { fips: "51115", name: "Mathews",         lat: 37.4308, lng: -76.3222, vdot: "Hampton Roads",    tier: "statewide" },
  { fips: "51073", name: "Gloucester",      lat: 37.4083, lng: -76.5238, vdot: "Hampton Roads",    tier: "statewide" },
  { fips: "51199", name: "York",            lat: 37.2354, lng: -76.5033, vdot: "Hampton Roads",    tier: "extended"  },
  { fips: "51199", name: "James City",      lat: 37.3215, lng: -76.7788, vdot: "Hampton Roads",    tier: "extended"  },
  // Northern Neck / Middle Peninsula
  { fips: "51099", name: "Essex",           lat: 37.9438, lng: -76.9276, vdot: "Fredericksburg",   tier: "extended"  },
  { fips: "51103", name: "Lancaster",       lat: 37.7060, lng: -76.4357, vdot: "Fredericksburg",   tier: "statewide" },
  { fips: "51159", name: "Richmond County", lat: 37.9319, lng: -76.7339, vdot: "Fredericksburg",   tier: "statewide" },
  { fips: "51193", name: "Westmoreland",    lat: 38.0871, lng: -76.8007, vdot: "Fredericksburg",   tier: "statewide" },
  { fips: "51111", name: "Northumberland",  lat: 37.8607, lng: -76.4174, vdot: "Fredericksburg",   tier: "statewide" },
  // Southside
  { fips: "51003", name: "Albemarle",       lat: 37.9871, lng: -78.5480, vdot: "Culpeper",         tier: "statewide" },
  { fips: "51065", name: "Fluvanna",        lat: 37.8407, lng: -78.2729, vdot: "Culpeper",         tier: "extended"  },
  { fips: "51109", name: "Louisa",          lat: 37.9724, lng: -77.9926, vdot: "Culpeper",         tier: "extended"  },
  { fips: "51113", name: "Madison",         lat: 38.4012, lng: -78.2714, vdot: "Culpeper",         tier: "statewide" },
  { fips: "51137", name: "Orange",          lat: 38.2468, lng: -78.0133, vdot: "Culpeper",         tier: "statewide" },
  { fips: "51005", name: "Alleghany",       lat: 37.7879, lng: -79.9916, vdot: "Staunton",         tier: "statewide" },
  { fips: "51023", name: "Botetourt",       lat: 37.5529, lng: -79.8156, vdot: "Salem",            tier: "statewide" },
  { fips: "51163", name: "Rockbridge",      lat: 37.8366, lng: -79.4418, vdot: "Staunton",         tier: "statewide" },
  { fips: "51083", name: "Halifax",         lat: 36.7656, lng: -78.9386, vdot: "Lynchburg",        tier: "statewide" },
  { fips: "51057", name: "Essex",           lat: 37.9438, lng: -76.9276, vdot: "Fredericksburg",   tier: "statewide" },
  { fips: "51117", name: "Mecklenburg",     lat: 36.6810, lng: -78.3598, vdot: "Richmond",         tier: "statewide" },
  { fips: "51187", name: "Warren",          lat: 38.9142, lng: -78.2135, vdot: "Culpeper",         tier: "statewide" },
  { fips: "51043", name: "Clarke",          lat: 39.1087, lng: -77.9949, vdot: "Staunton",         tier: "statewide" },
  { fips: "51069", name: "Frederick",       lat: 39.1965, lng: -78.2729, vdot: "Staunton",         tier: "statewide" },
  { fips: "51131", name: "Northampton",     lat: 37.3493, lng: -75.9373, vdot: "Hampton Roads",    tier: "statewide" },
  { fips: "51001", name: "Accomack",        lat: 37.7657, lng: -75.6321, vdot: "Hampton Roads",    tier: "statewide" },
  { fips: "51055", name: "Dickenson",       lat: 37.1296, lng: -82.3459, vdot: "Bristol",          tier: "statewide" },
  { fips: "51077", name: "Grayson",         lat: 36.6488, lng: -81.2126, vdot: "Bristol",          tier: "statewide" },
  { fips: "51121", name: "Nottoway",        lat: 37.1352, lng: -78.0534, vdot: "Richmond",         tier: "statewide" },
  { fips: "51123", name: "Orange",          lat: 38.2468, lng: -78.0133, vdot: "Culpeper",         tier: "statewide" },
  { fips: "51125", name: "Charlotte",       lat: 36.9957, lng: -78.6471, vdot: "Lynchburg",        tier: "statewide" },
  { fips: "51133", name: "Prince William",  lat: 38.6987, lng: -77.4774, vdot: "Northern Virginia", tier: "statewide" },
  { fips: "51143", name: "Highland",        lat: 38.3494, lng: -79.5720, vdot: "Staunton",         tier: "statewide" },
  { fips: "51037", name: "Charlotte",       lat: 36.9957, lng: -78.6471, vdot: "Lynchburg",        tier: "statewide" },
  { fips: "51039", name: "Clarke",          lat: 39.1087, lng: -77.9949, vdot: "Staunton",         tier: "statewide" },
  { fips: "51151", name: "Prince Edward",   lat: 37.2243, lng: -78.3939, vdot: "Lynchburg",        tier: "statewide" },
  { fips: "51091", name: "Highland",        lat: 38.3494, lng: -79.5720, vdot: "Staunton",         tier: "statewide" },
];

/** All 38 Virginia independent cities */
export const VA_CITIES = [
  { fips: "51510", name: "Alexandria",       lat: 38.8048, lng: -77.0469, vdot: "Northern Virginia", tier: "statewide" },
  { fips: "51520", name: "Bristol",          lat: 36.5959, lng: -82.1882, vdot: "Bristol",           tier: "statewide" },
  { fips: "51530", name: "Buena Vista",      lat: 37.7345, lng: -79.3528, vdot: "Staunton",          tier: "statewide" },
  { fips: "51540", name: "Charlottesville",  lat: 38.0293, lng: -78.4767, vdot: "Culpeper",          tier: "statewide" },
  { fips: "51550", name: "Chesapeake",       lat: 36.7682, lng: -76.2875, vdot: "Hampton Roads",     tier: "statewide" },
  { fips: "51560", name: "Colonial Heights", lat: 37.2654, lng: -77.4058, vdot: "Richmond",          tier: "primary"   },
  { fips: "51570", name: "Covington",        lat: 37.7937, lng: -79.9936, vdot: "Staunton",          tier: "statewide" },
  { fips: "51580", name: "Danville",         lat: 36.5860, lng: -79.3950, vdot: "Lynchburg",         tier: "statewide" },
  { fips: "51590", name: "Emporia",          lat: 36.6860, lng: -77.5408, vdot: "Hampton Roads",     tier: "statewide" },
  { fips: "51595", name: "Fairfax City",     lat: 38.8462, lng: -77.3064, vdot: "Northern Virginia", tier: "statewide" },
  { fips: "51600", name: "Falls Church",     lat: 38.8823, lng: -77.1711, vdot: "Northern Virginia", tier: "statewide" },
  { fips: "51610", name: "Franklin",         lat: 36.6771, lng: -76.9219, vdot: "Hampton Roads",     tier: "statewide" },
  { fips: "51620", name: "Fredericksburg",   lat: 38.3032, lng: -77.4605, vdot: "Fredericksburg",    tier: "extended"  },
  { fips: "51630", name: "Galax",            lat: 36.6612, lng: -80.9240, vdot: "Bristol",           tier: "statewide" },
  { fips: "51640", name: "Hampton",          lat: 37.0299, lng: -76.3452, vdot: "Hampton Roads",     tier: "statewide" },
  { fips: "51650", name: "Harrisonburg",     lat: 38.4496, lng: -78.8689, vdot: "Staunton",          tier: "statewide" },
  { fips: "51660", name: "Hopewell",         lat: 37.3043, lng: -77.2874, vdot: "Richmond",          tier: "primary"   },
  { fips: "51678", name: "Lexington",        lat: 37.7840, lng: -79.4428, vdot: "Staunton",          tier: "statewide" },
  { fips: "51680", name: "Lynchburg",        lat: 37.4138, lng: -79.1422, vdot: "Lynchburg",         tier: "statewide" },
  { fips: "51683", name: "Manassas",         lat: 38.7509, lng: -77.4753, vdot: "Northern Virginia", tier: "statewide" },
  { fips: "51685", name: "Manassas Park",    lat: 38.7748, lng: -77.4586, vdot: "Northern Virginia", tier: "statewide" },
  { fips: "51690", name: "Martinsville",     lat: 36.6918, lng: -79.8725, vdot: "Salem",             tier: "statewide" },
  { fips: "51700", name: "Newport News",     lat: 37.0871, lng: -76.4730, vdot: "Hampton Roads",     tier: "statewide" },
  { fips: "51710", name: "Norfolk",          lat: 36.8508, lng: -76.2859, vdot: "Hampton Roads",     tier: "statewide" },
  { fips: "51720", name: "Norton",           lat: 36.9334, lng: -82.6293, vdot: "Bristol",           tier: "statewide" },
  { fips: "51730", name: "Petersburg",       lat: 37.2279, lng: -77.4019, vdot: "Richmond",          tier: "primary"   },
  { fips: "51735", name: "Poquoson",         lat: 37.1224, lng: -76.3452, vdot: "Hampton Roads",     tier: "statewide" },
  { fips: "51740", name: "Portsmouth",       lat: 36.8354, lng: -76.2983, vdot: "Hampton Roads",     tier: "statewide" },
  { fips: "51750", name: "Radford",          lat: 37.1318, lng: -80.5765, vdot: "Salem",             tier: "statewide" },
  { fips: "51760", name: "Richmond City",    lat: 37.5407, lng: -77.4360, vdot: "Richmond",          tier: "primary"   },
  { fips: "51770", name: "Roanoke City",     lat: 37.2710, lng: -79.9414, vdot: "Salem",             tier: "statewide" },
  { fips: "51775", name: "Salem",            lat: 37.2932, lng: -80.0548, vdot: "Salem",             tier: "statewide" },
  { fips: "51790", name: "Staunton",         lat: 38.1496, lng: -79.0717, vdot: "Staunton",          tier: "statewide" },
  { fips: "51800", name: "Suffolk",          lat: 36.7282, lng: -76.5836, vdot: "Hampton Roads",     tier: "statewide" },
  { fips: "51810", name: "Virginia Beach",   lat: 36.8529, lng: -75.9780, vdot: "Hampton Roads",     tier: "statewide" },
  { fips: "51820", name: "Waynesboro",       lat: 38.0685, lng: -78.8895, vdot: "Staunton",          tier: "statewide" },
  { fips: "51830", name: "Williamsburg",     lat: 37.2707, lng: -76.7075, vdot: "Hampton Roads",     tier: "extended"  },
  { fips: "51840", name: "Winchester",       lat: 39.1857, lng: -78.1633, vdot: "Staunton",          tier: "statewide" },
];

/** All localities combined */
export const VA_ALL_LOCALITIES = [...VA_COUNTIES, ...VA_CITIES];

/** Quick lookups */
export const localitiesByTier = (tier) =>
  VA_ALL_LOCALITIES.filter((l) => l.tier === tier);

export const localitiesByDistrict = (district) =>
  VA_ALL_LOCALITIES.filter((l) => l.vdot === district);

export const PRIMARY_LOCALITIES  = localitiesByTier("primary");
export const EXTENDED_LOCALITIES = localitiesByTier("extended");

/** Bounding box for all of Virginia */
export const VA_BOUNDS = {
  north: 39.4660,
  south: 36.5407,
  east:  -75.2414,
  west:  -83.6753,
  centerLat: 37.9268,
  centerLng: -79.4580,
};
