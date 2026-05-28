import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, ArrowUpRight, Star } from 'lucide-react';
import {
  LOCATIONS,
  getLocationsByRegion,
  getRichmondRadiusLocations,
  getStrategicCorridorLocations,
  PRIMARY_DOMAIN,
  RICHMOND_RADIUS_MILES,
} from '@/lib/locations';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import LocationsHero from '@/components/locations/LocationsHero';
import LocationsServicesStrip from '@/components/locations/LocationsServicesStrip';
import LocationsFAQ, { LOCATIONS_FAQS } from '@/components/locations/LocationsFAQ';

// Region-level intros — adds unique, keyword-rich content for each VA region
// so Google sees topical depth beyond a flat city list.
const REGION_META = {
  'Central Virginia': {
    summary:
      'Our home turf. Richmond metro driveways, Chesterfield County commercial lots, and Henrico industrial yards — Piedmont clay subsoil, 30–40 freeze-thaw cycles per winter, and a paving corridor we\'ve worked for four decades.',
  },
  'Hampton Roads': {
    summary:
      'Coastal-spec paving for Chesapeake, Virginia Beach, and the Tidewater region. Salt aerosol, sandy subgrade, and hurricane drainage demand woven geotextile, 6-inch #57 stone base, and PG 76-22 polymer-modified binder — every time.',
  },
  'Hampton Roads / Atlantic Coast': {
    summary:
      'Virginia Beach and oceanfront properties face the toughest paving environment in the state. We build every coastal driveway with engineered drainage, salt-resistant binders, and elevated finish grades above 10-year storm surge.',
  },
  'Historic Triangle': {
    summary:
      'Williamsburg, James City County, and the Colonial historic overlay zones. Our charcoal matte-finish recipe satisfies preservation review while draining like standard asphalt. Discretion is part of the spec.',
  },
  'I-81 Corridor / Blue Ridge': {
    summary:
      'Roanoke and Smith Mountain Lake mountain driveways face 40+ freeze-thaw cycles per winter and steep-grade drainage challenges. In these markets, chip-and-tar traction and sealcoating cadence are major lifecycle factors alongside structural base prep.',
  },
  'I-81 Corridor / Shenandoah Valley': {
    summary:
      'Harrisonburg, Rockingham County, and the Shenandoah Valley agricultural corridor. Karst geology demands subgrade probing, while chip-and-tar options and preservation-focused sealcoating are often key in rural and mixed-load surfaces.',
  },
  'I-81 Corridor / Northern Shenandoah': {
    summary:
      'Winchester, Frederick County, and the Northern Valley commuter corridor. 45+ freeze-thaw cycles paired with Route 7 commuter traffic volumes punish cheap residential driveways, so traction-focused chip-and-tar use cases and regular sealcoating are major planning inputs.',
  },
  'I-95 Corridor / Rappahannock': {
    summary:
      'Fredericksburg, Stafford, Spotsylvania — Virginia\'s fastest-growing new-construction corridor. Builder-grade virgin soil ruts within 18 months. Our subgrade engineering fixes it at the base, not the surface.',
  },
  'Northern Virginia / DMV Fringe': {
    summary:
      'Fairfax and nearby NOVA corridors require schedule control, traffic-aware planning, and high-standard execution for both residential and commercial paving scopes.',
  },
  'Coastal North Carolina / Outer Banks': {
    summary:
      'Outer Banks driveways, parking lots, and access lanes face dense seasonal vehicle loads, salt aerosol, wind-driven sand, and stormwater stress. We build coastal-ready asphalt systems with drainage-first execution for long-term durability.',
  },
};

export default function LocationsIndex() {
  const grouped = getLocationsByRegion();
  const cityCount = LOCATIONS.length;
  const richmondRadiusMarkets = getRichmondRadiusLocations();
  const strategicCorridorMarkets = getStrategicCorridorLocations();

  // ── SEO copy ────────────────────────────────────────────────
  const title = `Virginia Asphalt Paving Service Areas | ${cityCount} Cities | J. Worden & Sons`;
  const description = `J. Worden & Sons serves asphalt paving customers across ${cityCount} Virginia cities including Richmond, Virginia Beach, Roanoke, Fredericksburg, Williamsburg, Harrisonburg & Winchester. 40+ years, licensed, bonded, insured. Call (804) 446-1296.`;

  // ── Structured data ─────────────────────────────────────────
  // ItemList helps Google render rich result cards for each city.
  // CollectionPage + FAQPage + BreadcrumbList give full semantic coverage.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${PRIMARY_DOMAIN}/locations#page`,
        url: `${PRIMARY_DOMAIN}/locations`,
        name: 'Virginia Asphalt Paving Service Areas',
        description,
        about: { '@type': 'Service', name: 'Asphalt Paving', areaServed: { '@type': 'State', name: 'Virginia' } },
        isPartOf: { '@id': `${PRIMARY_DOMAIN}/#website` },
      },
      {
        '@type': 'ItemList',
        name: 'Virginia Cities Served by J. Worden & Sons Paving LLC',
        numberOfItems: cityCount,
        itemListElement: LOCATIONS.map((loc, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${PRIMARY_DOMAIN}/locations/${loc.slug}`,
          name: `Asphalt Paving in ${loc.city}, ${loc.stateAbbr}`,
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: LOCATIONS_FAQS.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: PRIMARY_DOMAIN },
          { '@type': 'ListItem', position: 2, name: 'Virginia Service Areas', item: `${PRIMARY_DOMAIN}/locations` },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background font-body">
      <SEO
        title={title}
        description={description}
        canonicalPath="/locations"
        jsonLd={jsonLd}
      />
      <Navbar />

      <LocationsHero cityCount={cityCount} />
      <LocationsServicesStrip />

      <section className="border-t border-border py-12 bg-muted/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="font-display text-primary text-[10px] tracking-[0.3em] uppercase mb-4">
            // Richmond Core Cluster
          </p>
          <h2 className="font-display font-black text-foreground text-2xl md:text-3xl uppercase tracking-tight mb-4">
            Cities Within {RICHMOND_RADIUS_MILES} Miles Of Richmond, VA
          </h2>
          <p className="font-body text-muted-foreground text-sm leading-relaxed max-w-3xl mb-6">
            Local pages in this radius are prioritized for fast scheduling, focused content depth, and stronger internal linking around the Richmond metro hub.
          </p>
          <div className="flex flex-wrap gap-2">
            {richmondRadiusMarkets.map((loc) => (
              <Link
                key={loc.slug}
                to={`/locations/${loc.slug}`}
                className="px-3 py-2 border border-border text-muted-foreground font-display text-[11px] tracking-wider hover:border-primary/40 hover:text-foreground transition-colors"
              >
                {loc.city}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border py-12 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="font-display text-primary text-[10px] tracking-[0.3em] uppercase mb-4">
            // Strategic Coverage Corridor
          </p>
          <h2 className="font-display font-black text-foreground text-2xl md:text-3xl uppercase tracking-tight mb-4">
            Virginia Beach → Harrisonburg → Fairfax → Outer Banks
          </h2>
          <p className="font-body text-muted-foreground text-sm leading-relaxed max-w-4xl mb-6">
            We organize service pages around major anchor markets and all practical corridor markets between them.
            If a search originates from a rural or unincorporated area in-between, Google typically resolves intent to
            the nearest strong city entity page. This structure increases match quality for in-between search demand,
            especially for rural chip-and-tar and sealcoating intent.
          </p>
          <div className="flex flex-wrap gap-2">
            {strategicCorridorMarkets.map((loc) => (
              <Link
                key={loc.slug}
                to={`/locations/${loc.slug}`}
                className="px-3 py-2 border border-border text-muted-foreground font-display text-[11px] tracking-wider hover:border-primary/40 hover:text-foreground transition-colors"
              >
                {loc.city}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* City grid grouped by region */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-16">
          {Object.entries(grouped).map(([region, locs]) => (
            <div key={region}>
              <div className="flex items-start justify-between gap-6 mb-6 flex-col md:flex-row">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-primary font-display font-black text-lg">//</span>
                    <h2 className="font-display font-black text-foreground text-2xl md:text-3xl tracking-tight uppercase">
                      {region}
                    </h2>
                  </div>
                  {REGION_META[region]?.summary && (
                    <p className="font-body text-muted-foreground text-base leading-relaxed max-w-3xl">
                      {REGION_META[region].summary}
                    </p>
                  )}
                </div>
                <span className="font-display text-muted-foreground text-xs tracking-[0.2em] uppercase shrink-0">
                  {locs.length} {locs.length === 1 ? 'city' : 'cities'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {locs.map((loc, i) => (
                  <motion.article
                    key={loc.slug}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                  >
                    <Link
                      to={`/locations/${loc.slug}`}
                      className="group block border border-border bg-card p-6 hover:border-primary/40 transition-colors h-full"
                      title={`Asphalt paving in ${loc.city}, ${loc.stateAbbr}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <MapPin className="w-5 h-5 text-primary" />
                        <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      {loc.isHeadquarters && (
                        <span className="inline-block px-2 py-0.5 bg-primary text-primary-foreground font-display font-bold text-[9px] tracking-[0.2em] uppercase mb-3">
                          HQ · Chester, VA
                        </span>
                      )}
                      <h3 className="font-display font-black text-foreground text-2xl uppercase tracking-tight leading-tight">
                        Asphalt Paving in {loc.city}
                      </h3>
                      <p className="font-display text-muted-foreground text-xs tracking-[0.2em] uppercase mt-1">
                        {loc.stateAbbr} · {loc.region}
                      </p>
                      <p className="font-body text-muted-foreground text-sm leading-relaxed mt-4 line-clamp-3">
                        {loc.intro}
                      </p>
                      <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
                        <div className="flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                          <span className="font-display text-foreground text-xs tracking-wider">
                            {loc.rating} · {loc.reviews} reviews
                          </span>
                        </div>
                        <span className="font-display text-primary text-[10px] tracking-[0.2em] uppercase group-hover:underline">
                          View →
                        </span>
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Internal linking block — boosts crawlability & long-tail keyword coverage */}
      <section className="border-t border-border py-12 bg-muted/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="font-display text-primary text-[10px] tracking-[0.3em] uppercase mb-4">
            // Popular Virginia Searches
          </p>
          <div className="flex flex-wrap gap-2">
            {LOCATIONS.flatMap((loc) => [
              { label: `Driveway paving ${loc.city} VA`, to: `/locations/${loc.slug}` },
              { label: `Parking lot paving ${loc.city}`, to: `/locations/${loc.slug}` },
            ]).map((item, i) => (
              <Link
                key={i}
                to={item.to}
                className="px-3 py-2 border border-border text-muted-foreground font-display text-[11px] tracking-wider hover:border-primary/40 hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <LocationsFAQ />
      <Footer />
    </div>
  );
}
