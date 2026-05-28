/**
 * seo_manifest_gen.js — Tool-assisted script to generate a high-performance 
 * SEO and Google Ads landing page manifest for J. Worden & Sons.
 * 
 * Target: Google ranking (Organic) + Google Ads (Paid) landing page precision.
 */

import { LOCATIONS, STRATEGIC_CORRIDOR_SLUGS } from '../src/lib/locations.js';

const PRIMARY_DOMAIN = 'https://www.jwordenasphaltpaving.com';

const SERVICES = [
  { slug: 'services', name: 'All Paving Services' },
  { slug: 'driveway-ai', name: 'AI Driveway Scan (High-Value Bait)' },
  { slug: 'visualizer', name: '4D Project Visualizer' },
  { slug: 'floor-plan-studio', name: '4D Interior & Floor Plan Studio' },
  { slug: 'general-contracting', name: 'General Contracting' },
];

function generateManifest() {
  const manifest = {
    generated_at: new Date().toISOString(),
    primary_domain: PRIMARY_DOMAIN,
    ad_campaign_structures: [
      {
        name: "[GEO] Residential Paving",
        targeting: "Richmond + 50mi, VA Beach, NOVA",
        landing_pages: LOCATIONS.map(l => ({
          city: l.city,
          url: `${PRIMARY_DOMAIN}/locations/${l.slug}`,
          priority: STRATEGIC_CORRIDOR_SLUGS.includes(l.slug) ? 'High (Corridor)' : 'Normal',
          intent: 'Residential Driveway / Private Lane'
        }))
      },
      {
        name: "[TECH] AI/Smart Estimation",
        targeting: "National / State-wide Early Stage Searchers",
        landing_pages: [
            { name: "Driveway AI Scan", url: `${PRIMARY_DOMAIN}/driveway-ai` },
            { name: "Visualizer", url: `${PRIMARY_DOMAIN}/visualizer` }
        ]
      }
    ],
    organic_seo_targets: LOCATIONS.map(l => ({
        page: `${l.city}, ${l.stateAbbr}`,
        url: `${PRIMARY_DOMAIN}/locations/${l.slug}`,
        keywords: [
            `asphalt paving ${l.city} va`,
            `driveway repair ${l.city} va`,
            `sealcoating ${l.city} va`,
            `commercial paving ${l.city} va`
        ],
        schema_types: ["LocalBusiness", "FAQPage", "PostalAddress"]
    }))
  };

  return JSON.stringify(manifest, null, 2);
}

console.log(generateManifest());
