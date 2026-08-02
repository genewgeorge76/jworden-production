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
    travelNote: 'We are a Virginia contractor that mobilises to the Carolinas for commercial and multi-site work. We do not run a Charlotte storefront, and we would rather tell you that than pretend otherwise.',
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
    heroHeadline: 'Carolina Blacktop — Asphalt Paving Built For the Piedmont',
    heroBody:
      'Commercial and residential asphalt paving, sealcoating, and repair across the Charlotte metro, the Piedmont Triad, and the Upstate of South Carolina.',
    ctaLabel: 'Call For A Carolinas Estimate',
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
    serviceAreas: ['Charlotte', 'Raleigh', 'Durham', 'Greensboro', 'Winston-Salem', 'Fayetteville', 'Greenville SC', 'Spartanburg', 'Rock Hill', 'Concord', 'Gastonia', 'Huntersville', 'Mooresville', 'Cary', 'Apex'],
  },

  'atlantaasphaltpavingpros.com': {
    basedIn: 'Chester, Virginia — crews travel to Georgia for commercial work',
    travelNote: 'We are a Virginia contractor that mobilises to metro Atlanta for commercial and multi-site work. No local branch — one accountable crew and one number, wherever the sites are.',
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
    phoneDisplay: '804-446-1296',
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
    travelNote: 'We are a Virginia contractor that mobilises to Kansas City for commercial and multi-site work. We are not a local KC shop, and we will say so before you ask.',
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
    travelNote: 'We are a Virginia contractor that mobilises to Savannah and the Georgia coast for commercial and multi-site work. There is no Savannah office — there is a crew, a spec, and one number that reaches the owner.',
    stateDot: 'GDOT (Georgia Department of Transportation) Standard Specifications',
    subgrade: 'Coastal Georgia sits low with a high water table and sandy, poorly-draining soils. Pavement here is a drainage problem before it is a paving problem — if water cannot leave the site, no mat thickness saves it.',
    climate: 'Heat, humidity and salt air year-round, with tropical rainfall events. Almost no freeze-thaw, so the enemy is oxidation, standing water and rutting rather than cracking from ice.',
    commercialFocus: [
      'Port-adjacent and logistics yards built for container traffic',
      'Hospitality and retail lots phased around peak season',
      'Drainage-first design — slope, inlets and outfall before mat depth',
      'Sealcoating scheduled around coastal humidity and cure windows',
    ],
    marketName: 'Savannah Asphalt Paving',
    primaryRegion: 'Coastal Georgia',
    primaryMetro: 'Savannah, GA',
    heroKicker: 'Savannah Coastal Field Documentation',
    heroHeadline: 'Savannah’s Coastal Asphalt Paving & Sealcoating Contractor',
    heroBody:
      'Commercial and residential asphalt paving across Savannah and the Georgia coast — built with drainage-first design for low-lying, high-humidity coastal conditions.',
    ctaLabel: 'Call For A Savannah Estimate',
    phoneDisplay: '843-610-8935',
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
    serviceAreas: ['Savannah', 'Pooler', 'Richmond Hill', 'Tybee Island', 'Garden City', 'Port Wentworth', 'Hinesville', 'Wilmington Island', 'Statesboro', 'Vidalia', 'Bluffton', 'Hilton Head', 'Beaufort', 'Rincon', 'Springfield'],
  },
};

export function getRegionalMarketProfile(hostname) {
  if (!hostname) return null;
  const key = String(hostname).replace(/^www\./i, '').toLowerCase();
  return REGIONAL_MARKET_PROFILES[key] || null;
}

export default getRegionalMarketProfile;
