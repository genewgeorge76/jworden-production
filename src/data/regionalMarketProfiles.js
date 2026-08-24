/**
 * regionalMarketProfiles — hostname → regional market profile lookup.
 *
 * Backs two things:
 *   1. Client-side: MarketLanding.jsx / SocialLinks.jsx call
 *      getRegionalMarketProfile(window.location.hostname) to localize hero
 *      copy, phone CTA, and geo meta tags per geo-targeted domain.
 *   2. Build-time: scripts/normalize-meta-quality.mjs imports
 *      REGIONAL_MARKET_PROFILES directly to generate a static
 *      `<domain>.html` per entry (title/description/canonical/schema baked
 *      into the raw HTML for crawlers) — these are the files
 *      vercel.json's host-based rewrites serve for each custom domain.
 *
 * A prior stub here (returning null / no REGIONAL_MARKET_PROFILES export)
 * meant normalize-meta-quality.mjs generated zero domain files, so every
 * geo-targeted domain silently fell through to the default index.html —
 * which carries a canonical tag pointing at www.jwordenasphaltpaving.com.
 * That told Google each of these domains was a duplicate of the main site,
 * not an indexable page in its own right.
 */

export const REGIONAL_MARKET_PROFILES = {
  'richmondasphaltpaving.com': {
    basedIn: 'Chester, Virginia — 20 minutes from downtown Richmond',
    travelNote: null,
    stateDot: 'VDOT (Virginia Department of Transportation) Road & Bridge Specifications, Section 315',
    subgrade: 'Central Virginia sits on Piedmont clay-loam that holds water against the stone base. Undercut and stone-replace soft spots rather than paving over them — a mat laid on a pumping subgrade fails at the joint within two winters.',
    climate: 'Roughly 30 freeze-thaw cycles a year. Water entering a crack in November is ice by January, and every cycle widens it. Crack sealing before December is the cheapest work a property manager can buy.',
    commercialFocus: [
      'Parking lot construction and full-depth reclamation',
      'Mill-and-overlay for lots still structurally sound underneath',
      'ADA stall, aisle and ramp layout to current federal standards',
      'Night and phased work so retail stays open',
    ],
    marketName: 'Richmond Asphalt Paving',
    primaryRegion: 'Greater Richmond, Virginia',
    primaryMetro: 'Richmond, VA',
    heroKicker: 'Richmond Metro Field Documentation',
    heroHeadline: 'Richmond’s Trusted Asphalt Paving & Sealcoating Contractor',
    heroBody:
      'Serving Richmond, Chesterfield, Henrico, and Hanover with commercial parking lot construction and residential driveway paving built to VDOT structural stone base standards.',
    ctaLabel: 'Call For A Richmond Estimate',
    phoneDisplay: '804-446-1296',
    proofHeadline: 'Recent Richmond-Area Projects',
    localSpecs: [
      'VDOT Section 315 structural stone base on every commercial scope',
      '96% Marshall Unit Weight minimum compaction floor',
      'Freeze-thaw resilient mix design for Central Virginia winters',
    ],
    geo: {
      region: 'US-VA',
      placename: 'Richmond, Virginia',
      position: '37.5407;-77.4360',
      icbm: '37.5407, -77.4360',
    },
    serviceAreas: ['Richmond', 'Henrico', 'Chesterfield', 'Midlothian', 'Short Pump', 'Glen Allen', 'Chester', 'Mechanicsville', 'Ashland', 'Colonial Heights', 'Hopewell', 'Petersburg', 'Bon Air', 'Brandermill', 'Hanover'],
  },

  'carolinablacktop.com': {
    basedIn: 'Chester, Virginia — crews travel to the Carolinas for commercial work',
    travelNote: 'We mobilise into the Carolinas for commercial and multi-site work — one accountable crew, one number, and one invoice however many locations are on the list.',
    stateDot: 'NCDOT Standard Specifications for Roads and Structures (and SCDOT for South Carolina scopes)',
    subgrade: 'Piedmont red clay shrinks in drought and swells when saturated, so pavement built straight on it moves seasonally. The fix is a properly thick stone base with drainage that actually leaves the site, not a heavier mat.',
    climate: 'Milder winters than Virginia but real summer heat. Rutting and shoving under truck traffic is the failure to design against here — binder grade and compaction matter more than thickness alone.',
    commercialFocus: [
      'Multi-site retail and franchise portfolios across NC and SC',
      'Distribution and warehouse yards built for loaded trailer traffic',
      'Full-depth reclamation where the existing base has failed',
      'Single point of contact across every location in the portfolio',
    ],
    marketName: 'Carolina Blacktop',
    primaryRegion: 'North & South Carolina',
    primaryMetro: 'Charlotte, NC',
    heroKicker: 'Carolinas Field Documentation',
    // Was 'Built For the Piedmont' — accurate for North Carolina and wrong for
    // the half of this brand that carries an 843 Charleston number. Both
    // states now have their own page; the headline names both.
    heroHeadline: 'Carolina Blacktop — Asphalt Paving Across Both Carolinas',
    heroBody:
      'Commercial and residential asphalt paving, sealcoating, and repair across the Charlotte metro, the Piedmont Triad, and the Upstate of South Carolina.',
    ctaLabel: 'Call For A Carolinas Estimate',
    // Both Carolinas. geo.region is US-NC because the written content is
    // Piedmont-facing, but the number is 843 — Charleston/Myrtle Beach/Hilton
    // Head — and the owner reports years of South Carolina work, heavily in the
    // last three. Declared here so the area-code check knows this brand
    // legitimately spans a state line.
    //
    // The CONTENT still only speaks to North Carolina. That is a real gap, not
    // a rendering detail: a South Carolina customer reading this page is told
    // about the Piedmont. It should be filled the way Texas was — from invoiced
    // jobs in the Kickserv export — rather than by asserting a presence.
    statesServed: ['NC', 'SC'],
    phoneDisplay: '843-610-8935',
    proofHeadline: 'Recent Carolina Blacktop Projects',
    localSpecs: [
      'Structural stone base engineered for Piedmont clay subgrade',
      '96% Marshall Unit Weight minimum compaction floor',
      'Heat-stable mix design for Carolina summer traffic loads',
    ],
    geo: {
      region: 'US-NC',
      placename: 'Charlotte, North Carolina',
      position: '35.2271;-80.8431',
      icbm: '35.2271, -80.8431',
    },
    // Both states. The coastal SC cities — Charleston through Beaufort — were
    // entirely absent while the brand's phone number was an 843 Lowcountry
    // line. See src/data/carolinaRegions.js.
    serviceAreas: [
      'Charlotte', 'Raleigh', 'Durham', 'Greensboro', 'Winston-Salem', 'Fayetteville',
      'Concord', 'Gastonia', 'Huntersville', 'Mooresville', 'Cary', 'Apex',
      'Charleston', 'North Charleston', 'Mount Pleasant', 'Summerville', 'Goose Creek',
      'Myrtle Beach', 'Hilton Head Island', 'Bluffton', 'Beaufort',
      'Columbia', 'Greenville', 'Spartanburg', 'Rock Hill',
    ],
  },

  // Outer Banks — full-service coastal market.
  //
  // NO documented job sites. An earlier version of this profile cited ten
  // "documented" Dare County sites carrying 183 GPS-tagged photographs; the
  // owner identified those photographs as a family visit, not work, and the
  // entries have been removed from jobSites.json entirely. They were personal
  // locations, and they should never have been on a public map.
  //
  // So this page carries no proof section — sitesForMarket() returns nothing
  // for this domain and proofSection() renders nothing, which is the correct
  // behaviour for a market we have not yet documented work in. It sells on
  // capability and on the company's actual record, not on borrowed evidence.
  // Add a proof section only when real OBX jobs exist in jobSites.json.
  'obxpaving.com': {
    basedIn: 'Chester, Virginia — crews mobilise to the Outer Banks',
    travelNote:
      'We are a Virginia contractor opening up the Outer Banks. We do not keep a yard on the beach road, and we have no completed OBX projects to point you at yet — the documented work behind this company is in Virginia and the Carolinas. We would rather tell you that than dress up somebody else’s photographs as ours.',
    stateDot: 'NCDOT Standard Specifications for Roads and Structures',
    subgrade:
      'A barrier island is the opposite problem from the Piedmont. Coastal sand drains beautifully and holds almost nothing together — drainage without cohesion, so a mat laid straight on it moves under load rather than heaving under frost. The work goes into the base: proper stone, properly compacted, thick enough to bridge a subgrade that will never itself be structural. Wind-blown sand also finds its way back onto everything, and sand sitting on asphalt acts like grit under every tyre that turns on it.',
    climate:
      'Salt air and UV age pavement here, not the freeze-thaw cycle that governs inland Virginia. Salt and sun strip binder out of the surface, greying it and opening it to water years before a comparable inland lot would need attention — which makes sealcoating a structural decision on the coast rather than a cosmetic one. Add nor’easters and hurricane season pushing water across low-lying lots, and drainage that genuinely leaves the site matters more than any amount of extra thickness.',
    commercialFocus: [
      'Asphalt paving and overlays — rental-property drives, restaurants, beach-road retail and marina lots',
      'Concrete of all types — driveways, walks, aprons, pads, steps, ADA ramps and patios',
      'Sealcoating on a coastal cycle, because salt and UV age a surface faster here than inland',
      'Striping and ADA layout to current federal standards, scheduled around the rental season',
      'Maintenance and repairs — crack sealing, patching and pothole work between turnovers',
    ],
    marketName: 'OBX Paving',
    primaryRegion: 'the Outer Banks, North Carolina',
    primaryMetro: 'Kill Devil Hills, NC',
    heroKicker: 'Outer Banks — Full Service',
    heroHeadline: 'OBX Paving — Asphalt, Concrete, Sealcoating, Striping & Maintenance',
    heroBody:
      'Full-service paving and concrete across Dare County — Kill Devil Hills, Nags Head, Kitty Hawk, Manteo, Duck and Corolla. Asphalt, sealcoating, striping, concrete of all types including patios, and ongoing maintenance. Built for sand subgrade and salt air, to NCDOT specification.',
    ctaLabel: 'Call For An Outer Banks Estimate',
    // Declared explicitly so the schema advertises the full scope rather than
    // inheriting the asphalt-only default.
    serviceTypes: [
      'Asphalt Paving',
      'Concrete Paving',
      'Concrete Patio Construction',
      'Sealcoating',
      'Pavement Marking and Striping',
      'Asphalt Repair',
      'Pavement Maintenance',
      'Parking Lot Construction',
    ],
    // NOTE: main J. Worden line. Swap it if OBX gets its own number.
    phoneDisplay: '804-446-1296',
    localSpecs: [
      'Structural stone base engineered for coastal sand subgrade, not clay',
      '96% Marshall Unit Weight minimum compaction floor',
      'Salt- and UV-aware sealcoating cycle rather than an inland schedule',
      'Concrete and asphalt from one contractor, so the joint between them is somebody’s responsibility',
      'Work sequenced around the rental season so lots stay usable',
    ],
    geo: {
      region: 'US-NC',
      placename: 'Kill Devil Hills, North Carolina',
      position: '35.9918;-75.6674',
      icbm: '35.9918, -75.6674',
    },
    serviceAreas: ['Kill Devil Hills', 'Nags Head', 'Kitty Hawk', 'Manteo', 'Duck', 'Corolla', 'Southern Shores', 'Wanchese', 'Manns Harbor', 'Rodanthe', 'Avon', 'Hatteras', 'Currituck', 'Elizabeth City', 'Columbia'],
  },

  // Texas — the one regional market with a documented statewide record.
  //
  // Every other profile in this file sells on capability. This one sells on 23
  // invoiced jobs worth $670,039 across 19 Texas cities, read out of the
  // Project Red invoice tracker by app/services/job_ledger.py and carried in
  // src/data/texasProgram.js with the query behind each figure.
  //
  // The travelNote here is not an apology, which is what it is on the other
  // out-of-state profiles. Running one programme from the Rio Grande Valley to
  // East Texas is the argument: a multi-site owner does not want nineteen local
  // contractors and nineteen invoices.
  //
  // The client IS named — KBP Foods, a KFC franchise operator — on the owner's
  // express instruction after being asked directly. This profile first withheld
  // it. See src/data/texasProgram.js for the full note, including that the same
  // programme carries a payments dispute in the archive: the decision was made
  // with that in front of him.
  'texaspavementgroup.com': {
    basedIn: 'Chester, Virginia — a statewide Texas programme run from one contract',
    travelNote:
      'We have run a full Texas programme: 23 invoiced KFC restaurant sites for KBP Foods across 19 cities, from Brownsville and McAllen to Waco, Tyler and Greenville — coordinated on one contract, one schedule and one point of contact. Every site can be checked by store number.',
    stateDot:
      'TxDOT Standard Specifications — Item 341 dense-graded hot-mix asphalt over Item 247 flexible base, with lime or cement treatment where the subgrade calls for it',
    subgrade:
      'Central and North Texas sit on Blackland Prairie clay with a plasticity index high enough to lift and drop a slab through a single wet-dry cycle. Thickening the mat does not fix that; treating the subgrade and building a base that drains does. In the Valley the problem inverts — a high water table and saline soils attack from below.',
    climate:
      'The failure mode here is heat, not frost. Sustained summer surface temperatures push an under-specified binder into rutting and shoving under loaded traffic, so binder grade and compaction carry the pavement, not thickness alone.',
    // Four lines, in the order the evidence supports them. QSR first because
    // 23 invoiced sites is the strongest thing on the page; ground-up building
    // last because it is the largest claim and rests on one contract rather
    // than a programme — stated as what it is instead of implied as routine.
    commercialFocus: [
      'Multi-site restaurant and retail portfolios coordinated across the state — one contract, one schedule, one invoice for every location, as run for KBP Foods across 19 Texas cities',
      'Commercial lots, industrial yards and distribution aprons built for loaded traffic',
      'Estate and acreage driveways where the run is long enough that base and drainage decide whether it lasts',
      'Ground-up site and building work: our largest single contract ran to eleven divisions, from clearing and pavement through masonry, openings, plumbing and HVAC, electrical and roofing',
    ],
    // The six lines this market actually buys. The default list in the builder
    // is the Virginia one and it says nothing to a ranch owner with two miles
    // of caliche road — tar-and-chip is the product there, not a parking lot.
    services: [
      'Ground-up QSR and retail site work — pad, pavement and building',
      'Commercial paving and resurfacing for multi-site portfolios',
      'Sealcoating and crack repair on a maintenance cycle',
      'Rural and ranch road paving, including long unpaved runs',
      'Tar-and-chip surfacing where the run is too long to justify hot mix',
      'Line striping, ADA layout and fire-lane marking',
    ],
    servicesDesc:
      'Texas asphalt services: ground-up QSR site work, commercial paving and resurfacing, sealcoating, ranch and rural road paving, tar-and-chip surfacing, and line striping. Documented specs, honest scope.',
    residentialServices: [
      'Estate and acreage driveways, including runs measured in tenths of a mile',
      'Tar-and-chip surfacing for long rural drives',
      'New driveway installation and widening',
      'Resurfacing, overlays and remove-and-replace',
      'Crown and open-ditch drainage where there is no curb to carry water',
      'Sealcoating and crack repair',
    ],
    marketName: 'Texas Pavement Group',
    primaryRegion: 'Texas',
    // A real metro, because the builder writes "Asphalt Paving in
    // {primaryMetro}" into the title and a phrase reads as broken English
    // there. The statewide reach is made in the headline and the proof, which
    // is where it belongs.
    primaryMetro: 'McAllen, TX',
    heroKicker: '23 Invoiced KFC Sites for KBP Foods',
    heroHeadline: 'Texas Pavement Group — One Contractor, Every Texas Location',
    heroBody:
      'Commercial and estate asphalt paving, resurfacing and ground-up site work across Texas. We have already run the statewide programme: 23 invoiced KFC restaurant sites for KBP Foods across 19 cities, from Brownsville and McAllen to Waco, Tyler and Greenville.',
    ctaLabel: 'Call For A Texas Portfolio Estimate',
    // 804-822-7715 was disconnected years ago and was published here on every
    // Texas page and in the JSON-LD. Omitted rather than replaced so this brand
    // inherits the canonical number from businessInfo.canonical.js; a Texas
    // local number goes here when one is bought.
    proofHeadline: 'Documented Texas Programme',
    localSpecs: [
      'TxDOT Item 341 dense-graded hot mix over a base built to drain',
      '96% Marshall Unit Weight minimum compaction floor',
      'Binder grade specified for sustained Texas surface temperatures',
      'Lime or cement subgrade treatment where the plasticity index calls for it',
    ],
    geo: {
      region: 'US-TX',
      placename: 'McAllen, Texas',
      position: '26.2034;-98.2300',
      icbm: '26.2034, -98.2300',
    },
    serviceAreas: [
      'McAllen', 'Harlingen', 'Brownsville', 'Pharr', 'Mission', 'Weslaco', 'Edinburg',
      'San Benito', 'Rio Grande City', 'Laredo', 'Del Rio', 'Eagle Pass', 'Waco',
      'Temple', 'Killeen', 'Tyler', 'Palestine', 'Greenville', 'South Padre Island',
    ],
  },

  'atlantaasphaltpavingpros.com': {
    basedIn: 'Chester, Virginia — crews travel to Georgia for commercial work',
    travelNote: 'We mobilise into metro Atlanta for commercial and multi-site work — one accountable crew and one number, wherever the sites are.',
    stateDot: 'GDOT (Georgia Department of Transportation) Standard Specifications',
    subgrade: 'Metro Atlanta red clay is among the most reactive subgrade in the Southeast. It loses strength fast when wet, so base thickness and drainage carry the design — paving thicker over a saturated clay subgrade buys nothing.',
    climate: 'Long, hot summers with intense afternoon storms. Heat drives rutting under stopped traffic at drive-thrus and loading docks; sudden heavy rain punishes any lot without real slope.',
    commercialFocus: [
      'Franchise and QSR portfolios — drive-thru lanes built for standing loads',
      'Retail centre parking lots phased to keep tenants trading',
      'Heavy-duty sections at dumpster pads and truck approaches',
      'ADA compliance review across an entire portfolio at once',
    ],
    marketName: 'Atlanta Asphalt Paving Pros',
    primaryRegion: 'Metro Atlanta, Georgia',
    primaryMetro: 'Atlanta, GA',
    heroKicker: 'Atlanta Metro Field Documentation',
    heroHeadline: 'Atlanta’s Asphalt Paving Pros — Commercial & Residential',
    heroBody:
      'Parking lot construction, driveway paving, and sealcoating across Metro Atlanta — built with documented compaction and closeout standards for high-traffic Georgia conditions.',
    ctaLabel: 'Call For An Atlanta Estimate',
    // 470 is the metro Atlanta overlay. This was the Virginia number, which
    // is a NAP inconsistency on a Georgia market page: the area code is the
    // first thing a local customer reads.
    phoneDisplay: '470-485-7715',
    proofHeadline: 'Recent Atlanta-Area Projects',
    localSpecs: [
      'Structural stone base rated for heavy retail and franchise traffic',
      '96% Marshall Unit Weight minimum compaction floor',
      'Heat-resilient mix design for Georgia summer pavement temperatures',
    ],
    geo: {
      region: 'US-GA',
      placename: 'Atlanta, Georgia',
      position: '33.7490;-84.3880',
      icbm: '33.7490, -84.3880',
    },
    serviceAreas: ['Atlanta', 'Marietta', 'Roswell', 'Alpharetta', 'Sandy Springs', 'Decatur', 'Smyrna', 'Kennesaw', 'Woodstock', 'Dunwoody', 'Johns Creek', 'Peachtree City', 'McDonough', 'Buckhead', 'Gainesville'],
  },

  'asphaltpavingkansascity.com': {
    basedIn: 'Chester, Virginia — crews travel to the Kansas City metro for commercial work',
    travelNote: 'We mobilise into the Kansas City metro for commercial and multi-site work on both sides of the state line, where freeze-thaw makes documented compaction the whole job.',
    stateDot: 'MoDOT and KDOT specifications, depending on which side of the state line the site sits',
    subgrade: 'Kansas City swings between deep freeze and summer heat, and the freeze line runs deep enough to heave a base that was never compacted properly. Compaction verification is not paperwork here — it is the whole job.',
    climate: 'Among the harshest freeze-thaw cycling of any market we work. Water in a joint becomes a pothole in one season, so joint sealing and drainage do more for lot life than an extra half-inch of mat.',
    commercialFocus: [
      'Multi-site portfolios spanning the Missouri–Kansas line',
      'Freight and distribution yards built for loaded semi traffic',
      'Winter-damage assessment and spring reconstruction planning',
      'AASHTO T99/T180 density verification documented per section',
    ],
    marketName: 'Asphalt Paving Kansas City',
    primaryRegion: 'Greater Kansas City, Missouri & Kansas',
    primaryMetro: 'Kansas City, MO',
    heroKicker: 'Kansas City Metro Field Documentation',
    heroHeadline: 'Kansas City Asphalt Paving — Commercial & Residential Specialists',
    heroBody:
      'Serving the Kansas City metro on both sides of the state line with parking lot construction, driveway paving, and sealcoating engineered for Midwest freeze-thaw cycles.',
    ctaLabel: 'Call For A Kansas City Estimate',
    phoneDisplay: '816-662-7011',
    proofHeadline: 'Recent Kansas City-Area Projects',
    localSpecs: [
      'Structural stone base engineered for Midwest freeze-thaw cycles',
      '96% Marshall Unit Weight minimum compaction floor',
      'AASHTO T99/T180 compaction verification on every commercial scope',
    ],
    geo: {
      region: 'US-MO',
      placename: 'Kansas City, Missouri',
      position: '39.0997;-94.5786',
      icbm: '39.0997, -94.5786',
    },
    serviceAreas: ['Kansas City', 'Overland Park', 'Olathe', "Lee's Summit", 'Independence', 'Blue Springs', 'Shawnee', 'Lenexa', 'Leavenworth', 'Liberty', 'Gladstone', 'Raymore', 'Belton', 'Grandview', 'Parkville'],
  },

  'savannahasphaltpaving.com': {
    basedIn: 'Chester, Virginia — crews travel to coastal Georgia for commercial work',
    travelNote: 'We mobilise into Savannah and the Georgia coast for commercial and multi-site work, where salt, humidity and a high water table decide how long a lot lasts. There is a crew, a spec, and one number that reaches the owner.',
    stateDot: 'GDOT (Georgia Department of Transportation) Standard Specifications',
    subgrade: 'Coastal Georgia sits low with a high water table and sandy, poorly-draining soils. Pavement here is a drainage problem before it is a paving problem — if water cannot leave the site, no mat thickness saves it.',
    climate: 'Heat, humidity and salt air year-round, with tropical rainfall events. Almost no freeze-thaw, so the enemy is oxidation, standing water and rutting rather than cracking from ice.',
    commercialFocus: [
      'Port-adjacent and logistics yards built for container traffic',
      'Hospitality and retail lots phased around peak season',
      'Drainage-first design — slope, inlets and outfall before mat depth',
      'Sealcoating scheduled around coastal humidity and cure windows',
      'Sealcoating and restoration on historic and older properties, where the existing asphalt and the access both constrain the work',
    ],
    marketName: 'Savannah Asphalt Paving',
    primaryRegion: 'Coastal Georgia',
    primaryMetro: 'Savannah, GA',
    heroKicker: 'Savannah Coastal Field Documentation',
    heroHeadline: 'Savannah’s Coastal Asphalt Paving & Sealcoating Contractor',
    heroBody:
      'Commercial and residential asphalt paving across Savannah and the Georgia coast — built with drainage-first design for low-lying, high-humidity coastal conditions.',
    ctaLabel: 'Call For A Savannah Estimate',
    // Was 843-610-8935 — a Charleston-area SOUTH CAROLINA number on a Georgia
    // market page. 470 is at least in-state. Savannah's own code is 912;
    // replace this the day a 912 number exists.
    phoneDisplay: '470-485-7715',
    proofHeadline: 'Recent Savannah-Area Projects',
    localSpecs: [
      'Drainage-first slope design for coastal Georgia water tables',
      '96% Marshall Unit Weight minimum compaction floor',
      'Moisture-resistant mix design for humid coastal conditions',
    ],
    geo: {
      region: 'US-GA',
      placename: 'Savannah, Georgia',
      position: '32.0809;-81.0912',
      icbm: '32.0809, -81.0912',
    },
    serviceAreas: ['Savannah', 'Pooler', 'Richmond Hill', 'Tybee Island', 'Garden City', 'Port Wentworth', 'Hinesville', 'Wilmington Island', 'Statesboro', 'Vidalia', 'Bluffton', 'Hilton Head', 'Beaufort', 'Hardeeville', 'Rincon', 'Springfield'],
  },
};

export function getRegionalMarketProfile(hostname) {
  if (!hostname) return null;
  const key = String(hostname).replace(/^www\./i, '').toLowerCase();
  return REGIONAL_MARKET_PROFILES[key] || null;
}

export default getRegionalMarketProfile;
