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
  },

  'carolinablacktop.com': {
    marketName: 'Carolina Blacktop',
    primaryRegion: 'North & South Carolina',
    primaryMetro: 'Charlotte, NC',
    heroKicker: 'Carolinas Field Documentation',
    heroHeadline: 'Carolina Blacktop — Asphalt Paving Built For the Piedmont',
    heroBody:
      'Commercial and residential asphalt paving, sealcoating, and repair across the Charlotte metro, the Piedmont Triad, and the Upstate of South Carolina.',
    ctaLabel: 'Call For A Carolinas Estimate',
    phoneDisplay: '804-446-1296',
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
  },

  'atlantaasphaltpavingpros.com': {
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
  },

  'asphaltpavingkansascity.com': {
    marketName: 'Asphalt Paving Kansas City',
    primaryRegion: 'Greater Kansas City, Missouri & Kansas',
    primaryMetro: 'Kansas City, MO',
    heroKicker: 'Kansas City Metro Field Documentation',
    heroHeadline: 'Kansas City Asphalt Paving — Commercial & Residential Specialists',
    heroBody:
      'Serving the Kansas City metro on both sides of the state line with parking lot construction, driveway paving, and sealcoating engineered for Midwest freeze-thaw cycles.',
    ctaLabel: 'Call For A Kansas City Estimate',
    phoneDisplay: '804-446-1296',
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
  },

  'savannahasphaltpaving.com': {
    marketName: 'Savannah Asphalt Paving',
    primaryRegion: 'Coastal Georgia',
    primaryMetro: 'Savannah, GA',
    heroKicker: 'Savannah Coastal Field Documentation',
    heroHeadline: 'Savannah’s Coastal Asphalt Paving & Sealcoating Contractor',
    heroBody:
      'Commercial and residential asphalt paving across Savannah and the Georgia coast — built with drainage-first design for low-lying, high-humidity coastal conditions.',
    ctaLabel: 'Call For A Savannah Estimate',
    phoneDisplay: '804-446-1296',
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
  },
};

export function getRegionalMarketProfile(hostname) {
  if (!hostname) return null;
  const key = String(hostname).replace(/^www\./i, '').toLowerCase();
  return REGIONAL_MARKET_PROFILES[key] || null;
}

export default getRegionalMarketProfile;
