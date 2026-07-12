import { createFileRoute, Link } from '@tanstack/react-router';
import { useSeo } from '../lib/useSeo';
import { CITIES } from '../data/cities';
import SectionBackdrop from '../components/SectionBackdrop';
import { PHONE_DISPLAY as PHONE, PHONE_HREF, ADDRESS, PHONE_SCHEMA, SITE_URL } from '../lib/businessInfo';

export const Route = createFileRoute('/services')({
  component: ServicesPage,
});

const SERVICES = [
  {
    name: 'Commercial Asphalt Paving',
    desc: 'New construction, full-depth replacement, and parking-lot expansions for retail centers, restaurants, medical campuses, distribution yards, and HOA roadways. Phased night-shift mobilization keeps your doors open and your traffic moving across Richmond, Chesterfield, and Henrico.',
    to: '/commercial',
    keywords: 'commercial asphalt paving Richmond VA, parking lot contractor Chesterfield, retail center paving Henrico',
  },
  {
    name: 'Residential Driveway Paving',
    desc: 'Hot-mix asphalt driveways engineered for Virginia clay: 6-inch compacted #21A stone base, 2 to 3-inch wear course, hand-formed edges, and finish-graded approaches. New installs, full tear-out replacements, widenings, and estate-grade circular drives.',
    to: '/residential',
    keywords: 'driveway paving Midlothian VA, residential asphalt contractor Chester, asphalt driveway installation Richmond',
  },
  {
    name: 'Sealcoating & Pavement Maintenance',
    desc: 'Commercial-grade coal-tar and asphalt-emulsion sealcoats, hot-pour rubberized crack fill, infrared patching, and ADA-compliant restriping. A planned maintenance cycle every 24\u201336 months can double pavement life and defer six-figure replacement bids.',
    to: '/sealcoating',
    keywords: 'sealcoating Richmond VA, parking lot striping Chesterfield, asphalt maintenance program Henrico',
  },
  {
    name: 'Tar & Chip / Chip Seal',
    desc: 'Bituminous surface treatment over a prepared aggregate base \u2014 the durable, lower-cost surface for long farm lanes, equestrian properties, vineyard access, and private rural roads. Outperforms gravel on washout, traction, and dust control.',
    to: '/tar-and-chip',
    keywords: 'tar and chip driveway Powhatan VA, chip seal Goochland farm road, rural driveway Hanover County',
  },
  {
    name: 'Asphalt Patching & Pothole Repair',
    desc: 'Saw-cut, full-depth patching tied flush to surrounding pavement. Base-failure remediation, drive-thru lane repair, utility-cut restoration, and emergency mobilization for property managers, municipalities, and industrial sites.',
    to: '/services',
    keywords: 'asphalt patching Henrico VA, pothole repair Richmond, commercial pavement repair Chesterfield',
  },
  {
    name: 'Milling & Asphalt Overlay',
    desc: 'Cold-planed mill-and-fill resurfacing for parking lots, drive aisles, and private roads. Tied-in transitions to existing curb, gutter, and concrete pads \u2014 no lip, no trip hazard, no pooling water.',
    to: '/services',
    keywords: 'asphalt milling Chesterfield VA, parking lot overlay Richmond, asphalt resurfacing Henrico',
  },
  {
    name: 'Line Striping & ADA Layout',
    desc: 'High-build latex traffic paint, thermoplastic on request, and full ADA layout including van-accessible stalls, access aisles, fire lanes, and directional arrows. Engineered to current Virginia and federal accessibility code on the first pass.',
    to: '/services',
    keywords: 'parking lot striping Richmond VA, ADA striping Virginia, fire lane painting Chesterfield',
  },
];

const NEAR_HQ = ['chester', 'chesterfield', 'midlothian', 'richmond', 'henrico', 'mechanicsville', 'glen-allen', 'short-pump', 'bon-air', 'colonial-heights', 'petersburg', 'hopewell'];
const RURAL = ['powhatan', 'goochland', 'hanover', 'new-kent', 'amelia', 'cumberland', 'fluvanna', 'louisa', 'orange', 'king-william', 'charles-city', 'dinwiddie'];

function ServicesPage() {
  useSeo({
    title: 'Asphalt Paving Services in Chester, VA | Driveways, Parking Lots, Sealcoating | J. Worden & Sons',
    description:
      'Class A licensed asphalt paving contractor headquartered in Chester, VA. Commercial parking lots, residential driveways, sealcoating, milling & overlay, ADA striping, and tar & chip throughout Chesterfield, Richmond, Henrico, Midlothian, Powhatan, Goochland, and Hanover. Family-owned since 1984. Call 804-446-1296.',
    path: '/services',
  });

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'PavingContractor',
    '@id': 'https://www.jwordenasphaltpaving.com/services#contractor',
    name: 'J. Worden & Sons Paving LLC',
    image: 'https://www.jwordenasphaltpaving.com/parking-lot-pave-richmond-va.jpg',
    telephone: PHONE_SCHEMA,
    priceRange: '$$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: ADDRESS.streetAddress,
      addressLocality: ADDRESS.addressLocality,
      addressRegion: ADDRESS.addressRegion,
      postalCode: ADDRESS.postalCode,
      addressCountry: ADDRESS.addressCountry,
    },
    areaServed: [
      { '@type': 'City', name: 'Chester' },
      { '@type': 'City', name: 'Chesterfield' },
      { '@type': 'City', name: 'Richmond' },
      { '@type': 'City', name: 'Midlothian' },
      { '@type': 'City', name: 'Henrico' },
      { '@type': 'AdministrativeArea', name: 'Chesterfield County, Virginia' },
      { '@type': 'AdministrativeArea', name: 'Henrico County, Virginia' },
      { '@type': 'AdministrativeArea', name: 'Powhatan County, Virginia' },
      { '@type': 'AdministrativeArea', name: 'Goochland County, Virginia' },
      { '@type': 'AdministrativeArea', name: 'Hanover County, Virginia' },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Asphalt Paving Services',
      itemListElement: SERVICES.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.name, description: s.desc },
      })),
    },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '127' },
  };

  return (
    <main className="bg-premium-black grain text-white antialiased">
      {/* Hero — local-pack signal: city + county + service in H1 */}
      <section className="relative isolate overflow-hidden border-b border-white/[0.04] bg-black">
        <SectionBackdrop video="/video/hero-paving.mp4" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
          <p className="mb-6 text-xs font-medium uppercase tracking-[0.3em] text-white/80">
            Chester, Virginia &middot; Class A Licensed Paving Contractor &middot; Est. 1984
          </p>
          <h1 className="max-w-5xl text-5xl font-medium leading-[1.05] tracking-tight md:text-7xl">
            Our business&nbsp;&nbsp; Asphalt.
          </h1>
          <p className="mt-6 max-w-3xl text-xl font-light tracking-tight text-white/70 md:text-2xl">
            Pavement built to last. Quoted in 24 hours.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a href={PHONE_HREF} className="btn-primary">
              Call {PHONE}
            </a>
            <Link to="/contact" className="btn-ghost">
              Free estimate &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Service grid */}
      <section className="relative isolate overflow-hidden border-b border-white/[0.04] bg-black">
        <div className="relative mx-auto max-w-7xl px-6 py-20">
          <div className="mb-12 max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/80">
              Four generations &middot; Chester, Virginia &middot; Est. 1984
            </p>
            <h2 className="mt-4 text-4xl font-medium tracking-tight md:text-5xl">
              J. Worden &amp; Sons has been paving Virginia for forty years.
            </h2>
            <p className="mt-6 text-base text-white/60">
              Founded in Chester in 1984, J. Worden &amp; Sons is now in its fourth generation of
              family ownership. BBB A+ accredited since 1994. Class A Virginia license. Four-time
              Best of Houzz. National preferred contractor for KFC, Taco Bell, and Arby&rsquo;s.
              Every estimate is walked, scoped, and approved by Mr. Worden &mdash;
              and every crew on your property is a direct employee of this company.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s, i) => (
            <Link
              key={s.name}
              to={s.to}
              className="surface-glass lift-hover group block p-10 md:p-12"
            >
              <div className="text-xs font-medium uppercase tracking-[0.2em] text-white/75">
                0{i + 1}
              </div>
              <div className="mt-6 text-2xl font-medium tracking-tight">{s.name}</div>
              <div className="mt-3 text-sm text-white/60">{s.desc}</div>
              <div className="mt-8 text-sm text-white/75 transition group-hover:text-white">
                Details &rarr;
              </div>
            </Link>
          ))}
          </div>
        </div>
      </section>

      {/* CTA — 3rd section */}
      <section className="relative isolate overflow-hidden border-b border-white/[0.04] bg-black">
        <SectionBackdrop video="/video/segment-2.mp4" />
        <div className="relative mx-auto max-w-7xl px-6 py-32">
          <h2 className="max-w-3xl text-4xl font-medium tracking-tight md:text-5xl">
            Ready for a real number?
          </h2>
          <p className="mt-6 max-w-xl text-lg text-white/60">
            Call {PHONE} and a J. Worden picks up. We&rsquo;ll come walk the job.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a href={PHONE_HREF} className="btn-primary">
              Call {PHONE}
            </a>
            <Link to="/contact" className="btn-ghost">
              Request estimate &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Tar & chip teaser strip */}
      <section className="relative isolate overflow-hidden border-b border-white/[0.04] bg-black">
        <div className="relative mx-auto max-w-5xl px-6 py-28 text-center md:py-36">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/80">
            Bituminous surface treatment
          </p>
          <h2 className="mx-auto mt-6 max-w-3xl text-4xl font-medium tracking-tight md:text-6xl">
            Tar &amp; chip for farms, estates &amp; private rural roads.
          </h2>
          <div className="mt-10">
            <Link to="/tar-and-chip" className="btn-ghost">
              Tar &amp; chip details &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Worden Standard teaser strip */}
      <section className="relative isolate overflow-hidden border-b border-white/[0.04] bg-black">
        <div className="relative mx-auto max-w-5xl px-6 py-28 text-center md:py-36">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/80">
            Construction specifications
          </p>
          <h2 className="mx-auto mt-6 max-w-3xl text-4xl font-medium tracking-tight md:text-6xl">
            Built to a documented standard.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base text-white/60">
            VDOT-spec construction, written into every contract, verified on site.
          </p>
          <div className="mt-10">
            <Link to="/the-worden-standard" className="btn-ghost">
              Read the Worden Standard &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Local pack: nearby cities + rural counties */}
      <section className="relative isolate overflow-hidden border-b border-white/[0.04] bg-black">
        <div className="relative mx-auto max-w-7xl px-6 py-20">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/80">
            Greater Richmond service area
          </p>
          <h2 className="mt-4 max-w-3xl text-3xl font-medium tracking-tight md:text-4xl">
            Local crews, local equipment, same-week site visits.
          </h2>
          <p className="mt-6 max-w-2xl text-base text-white/60">
            Our paving and sealcoating crews dispatch daily from our Chester, VA yard. Most estimate
            walks within Chesterfield, Henrico, and the City of Richmond are scheduled inside 72 hours.
          </p>
          <div className="mt-10 flex flex-wrap gap-2 text-sm">
            {NEAR_HQ.map((slug) => {
              const c = CITIES.find((x) => x.slug === slug);
              if (!c) return null;
              return (
                <Link
                  key={slug}
                  to={`/locations/${slug}`}
                  className="rounded-full border border-white/15 px-4 py-2 text-white/70 hover:bg-white/5 hover:text-white"
                >
                  Paving in {c.name}
                </Link>
              );
            })}
          </div>

          <p className="mt-16 text-xs font-medium uppercase tracking-[0.3em] text-white/80">
            Tar &amp; chip + rural service area
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-sm">
            {RURAL.map((slug) => {
              const c = CITIES.find((x) => x.slug === slug);
              if (!c) return null;
              return (
                <Link
                  key={slug}
                  to={`/locations/${slug}`}
                  className="rounded-full border border-white/15 px-4 py-2 text-white/70 hover:bg-white/5 hover:text-white"
                >
                  {c.name}
                  {c.county ? <span className="text-white/75"> &middot; {c.county} Co.</span> : null}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* NAP block — matches Google Business Profile */}
      <section className="relative isolate overflow-hidden">
        <SectionBackdrop video="/video/driveway-stratford-hills.mp4" />
        <div className="relative mx-auto grid min-h-[70vh] max-w-7xl grid-cols-1 items-center gap-16 px-6 py-40 md:grid-cols-3 md:py-56">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/60">Phone</p>
            <a href={PHONE_HREF} className="mt-4 block text-3xl font-light tracking-tight text-white hover:text-white/80 md:text-4xl">
              {PHONE}
            </a>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/60">Headquarters</p>
            <p className="mt-4 text-lg font-light leading-relaxed text-white/90 md:text-xl">
              {ADDRESS.streetAddress}
              <br />
              {ADDRESS.addressLocality}, {ADDRESS.addressRegion} {ADDRESS.postalCode}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/60">Hours</p>
            <p className="mt-4 text-lg font-light text-white/90 md:text-xl">Mon&ndash;Fri 7am&ndash;6pm</p>
            <p className="text-lg font-light text-white/90 md:text-xl">Sat 7am&ndash;2pm</p>
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
    </main>
  );
}
