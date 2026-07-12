import { Link } from '@tanstack/react-router';
import { useSeo } from '../lib/useSeo';
import type { CityEntry } from '../data/cities';
import SectionBackdrop from './SectionBackdrop';
import { PHONE_DISPLAY as PHONE, PHONE_HREF, ADDRESS, ADDRESS_DISPLAY, PHONE_SCHEMA, SITE_URL } from '../lib/businessInfo';

const HQ_ADDRESS = ADDRESS_DISPLAY;

interface Props {
  city: CityEntry;
  /** Sibling cities for internal linking (4-8). */
  nearby: CityEntry[];
}

const slug = (s: string) => s.toLowerCase().replace(/\s+/g, '-');

export default function LocationPage({ city, nearby }: Props) {
  const cityState = `${city.name}, ${city.state}`;
  const countyText = city.county ? `${city.county} County, ${city.state}` : city.state;
  const title = `Asphalt Paving in ${cityState} | Driveways, Parking Lots & Sealcoating | J. Worden & Sons`;
  const description =
    `Class A licensed asphalt paving contractor serving ${cityState}. Residential driveway installation, commercial parking lot construction, sealcoating, milling, and ADA striping built on a 6-inch compacted #21A stone base. BBB A+ since 1994. Free on-site estimates throughout ${countyText}. Call ${PHONE}.`;

  useSeo({
    title,
    description,
    path: `/locations/${city.slug}`,
  });

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `https://www.jwordenasphaltpaving.com/locations/${city.slug}#business`,
    name: `J. Worden & Sons Paving LLC — ${cityState}`,
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
    areaServed: {
      '@type': 'City',
      name: city.name,
      containedInPlace: city.county
        ? { '@type': 'AdministrativeArea', name: `${city.county} County, ${city.state}` }
        : { '@type': 'State', name: city.state },
    },
    url: `https://www.jwordenasphaltpaving.com/locations/${city.slug}`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.4',
      reviewCount: '91',
    },
    openingHoursSpecification: [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '07:00', closes: '19:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '07:00', closes: '17:00' },
    ],
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.jwordenasphaltpaving.com/' },
      { '@type': 'ListItem', position: 2, name: 'Service Area', item: 'https://www.jwordenasphaltpaving.com/services' },
      { '@type': 'ListItem', position: 3, name: cityState, item: `https://www.jwordenasphaltpaving.com/locations/${city.slug}` },
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `How much does asphalt paving cost in ${cityState}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Asphalt paving in ${cityState} typically runs $3.50 to $7.00 per square foot for residential driveways, with commercial parking lot pricing depending on scope, base condition, and access. J. Worden & Sons provides free on-site estimates for ${city.name} property owners.`,
        },
      },
      {
        '@type': 'Question',
        name: `Do you serve all of ${city.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Yes. We pave throughout ${cityState}${city.county ? ' and the broader ' + city.county + ' County area' : ''}, including driveways, parking lots, and sealcoating projects of every size.`,
        },
      },
      {
        '@type': 'Question',
        name: 'Are you licensed and insured in Virginia?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. J. Worden & Sons holds a Class A Virginia Contractor license, BBB A+ rating since 1994, and carries full liability and workers’ compensation insurance.',
        },
      },
    ],
  };

  return (
    <main className="bg-premium-black grain text-white antialiased">
      {/* Breadcrumbs */}
      <div className="border-b border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6 py-4 text-xs text-white/75">
          <Link to="/" className="hover:text-white">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/services" className="hover:text-white">Service area</Link>
          <span className="mx-2">/</span>
          <span className="text-white/70">{cityState}</span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-white/[0.04] bg-black">
        <SectionBackdrop video="/video/hero-paving.mp4" opacity={0.7} />
        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
          <p className="mb-6 text-xs font-medium uppercase tracking-[0.3em] text-white/80">
            {city.county ? `${city.county} County, ${city.state}` : city.state} \u00b7 Class A Licensed
          </p>
          <h1 className="max-w-4xl text-5xl font-medium leading-[1.05] tracking-tight md:text-7xl">
            Asphalt paving contractor serving {city.name}, {city.state}.
          </h1>
          <p className="mt-8 max-w-2xl text-lg text-white/60 md:text-xl">
            J. Worden &amp; Sons is a fourth-generation, family-owned asphalt paving contractor
            serving {city.name} and the surrounding {countyText} area. We self-perform residential
            driveway installation, commercial parking lot construction, sealcoating, milling, and
            ADA striping \u2014 every project built on the 6-inch compacted #21A structural stone base
            that has defined the Worden standard since 1984.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href={PHONE_HREF}
              onClick={() => {
                const w = window as unknown as { gtag?: (...args: unknown[]) => void };
                if (w.gtag) w.gtag('event', 'click', { event_category: 'phone_call', event_label: PHONE, page_location: city.slug });
              }}
              className="btn-primary"
            >
              Call {PHONE}
            </a>
            <Link to="/contact" className="btn-ghost">
              Request estimate &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="relative isolate overflow-hidden border-b border-white/[0.04] bg-black">
        <div className="relative mx-auto max-w-7xl px-6 py-16">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat value="40+" label="Years in business" />
            <Stat value="100+" label="Franchise sites paved" />
            <Stat value="A+" label="BBB rating since 1994" />
            <Stat value="Class A" label="Virginia contractor" />
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="relative isolate overflow-hidden border-b border-white/[0.04] bg-black">
        <div className="relative mx-auto max-w-7xl px-6 py-24">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/80">Services in {city.name}</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-medium tracking-tight md:text-5xl">
            Full-scope asphalt construction &amp; pavement maintenance in {city.name}.
          </h2>
          <p className="mt-6 max-w-2xl text-base text-white/60">
            From single-family driveways to multi-acre commercial parking lots, every project in
            {' '}{city.name} is delivered under one Class A license, with one accountable Worden on site.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            <ServiceCard
              to="/residential"
              title="Residential Driveway Paving"
              desc={`Hot-mix asphalt driveway installation, full tear-out replacement, widenings, and estate-grade circular drives throughout ${city.name}. Engineered base, hand-formed edges, finish-graded approaches.`}
            />
            <ServiceCard
              to="/commercial"
              title="Commercial Parking Lot Construction"
              desc={`New construction, full-depth reconstruction, and parking-lot expansions for retail centers, restaurants, medical offices, and industrial sites across ${countyText}.`}
            />
            <ServiceCard
              to="/sealcoating"
              title="Sealcoating, Crack Fill & ADA Striping"
              desc={`Coal-tar and asphalt-emulsion sealcoats, hot-pour rubberized crack fill, and code-compliant ADA restriping for ${city.name} property managers and homeowners.`}
            />
          </div>
        </div>
      </section>

      {/* Local proof */}
      <section className="relative isolate overflow-hidden border-b border-white/[0.04] bg-black">
        <SectionBackdrop video="/video/segment-2.mp4" opacity={0.5} />
        <div className="relative mx-auto max-w-5xl px-6 py-28 text-center md:py-36">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/80">Construction specifications</p>
          <h2 className="mx-auto mt-6 max-w-3xl text-4xl font-medium tracking-tight md:text-6xl">
            Built to a documented standard in {city.name}.
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

      {/* FAQ */}
      <section className="relative isolate overflow-hidden border-b border-white/[0.04] bg-black">
        <div className="relative mx-auto max-w-4xl px-6 py-20">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/80">{city.name} questions</p>
          <dl className="mt-10 divide-y divide-white/[0.06] border-y border-white/[0.06]">
            {faqSchema.mainEntity.map((q) => (
              <div key={q.name} className="py-8">
                <dt className="text-lg font-medium">{q.name}</dt>
                <dd className="mt-3 text-base text-white/60">{q.acceptedAnswer.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Nearby cities */}
      {nearby.length > 0 && (
        <section className="relative isolate overflow-hidden border-b border-white/[0.04] bg-black">
          <div className="relative mx-auto max-w-7xl px-6 py-20">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/80">Nearby cities we serve</p>
            <div className="mt-8 flex flex-wrap gap-2 text-sm">
              {nearby.map((n) => (
                <Link
                  key={n.slug}
                  to={`/locations/${n.slug}` as string}
                  className="rounded-full border border-white/15 bg-black/30 backdrop-blur px-4 py-2 text-white/70 hover:bg-white/10 hover:text-white"
                >
                  Paving in {n.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* NAP block */}
      <section className="relative isolate overflow-hidden border-b border-white/[0.04] bg-black">
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-20 md:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/80">Phone</p>
            <a href={PHONE_HREF} className="mt-3 block text-2xl font-medium hover:text-white/80">{PHONE}</a>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/80">Headquarters</p>
            <p className="mt-3 text-base text-white">{HQ_ADDRESS}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/80">Hours</p>
            <p className="mt-3 text-base text-white">Mon&ndash;Fri 7am&ndash;7pm</p>
            <p className="text-base text-white">Sat 7am&ndash;5pm</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative isolate overflow-hidden">
        <SectionBackdrop video="/video/bg-awards.mp4" opacity={0.7} />
        <div className="relative mx-auto max-w-7xl px-6 py-32">
          <h2 className="max-w-3xl text-4xl font-medium tracking-tight md:text-5xl">
            Free estimate in {city.name}.
          </h2>
          <p className="mt-6 max-w-xl text-lg text-white/60">
            Call {PHONE} and a J. Worden picks up. We&rsquo;ll come walk the job.
          </p>
          <a href={PHONE_HREF} className="btn-primary mt-10">
            Call {PHONE}
          </a>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="surface-glass lift-hover p-8">
      <div className="text-3xl font-medium tracking-tight md:text-4xl">{value}</div>
      <div className="mt-2 text-sm text-white/60">{label}</div>
    </div>
  );
}

function ServiceCard({ to, title, desc }: { to: string; title: string; desc: string }) {
  return (
    <Link to={to} className="surface-glass lift-hover group block p-10 md:p-12">
      <div className="text-xl font-medium">{title}</div>
      <div className="mt-3 text-sm text-white/60">{desc}</div>
      <div className="mt-8 text-sm text-white/75 transition group-hover:text-white">Learn more &rarr;</div>
    </Link>
  );
}

// Reference unused imports for typecheck
void slug;
