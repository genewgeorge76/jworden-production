import React from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, House, Phone, Wrench } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SEO from '@/components/SEO'
import { trackPhoneClick } from '@/lib/analytics'
import { getRichmondRadiusLocations, RICHMOND_RADIUS_MILES } from '@/lib/locations'

const HOME_SERVICE_ITEMS = [
  {
    title: 'Driveway Sealcoating',
    detail: 'Protect asphalt from UV oxidation, water penetration, and surface breakdown with scheduled sealcoating.',
  },
  {
    title: 'Crack Filling And Joint Sealing',
    detail: 'Seal active cracks before they expand and compromise the base, especially through freeze-thaw seasons.',
  },
  {
    title: 'Asphalt Patch Repairs',
    detail: 'Targeted full-depth and skin-patch repairs for failed spots, potholes, and soft subgrade areas.',
  },
  {
    title: 'Drainage Corrections',
    detail: 'Resolve standing water and edge failure with grade adjustments and runoff management.',
  },
  {
    title: 'Driveway Widening And Extensions',
    detail: 'Add practical parking space and improve approach access without rebuilding the entire surface.',
  },
  {
    title: 'Gravel To Asphalt Conversion',
    detail: 'Upgrade dusty and unstable aggregate drives into clean, compacted asphalt with proper base structure.',
  },
]

const HOME_SERVICE_FAQS = [
  {
    q: 'How often should homeowners sealcoat asphalt?',
    a: 'Most residential driveways should be sealcoated every 2-3 years depending on traffic, sun exposure, and surface condition.',
  },
  {
    q: 'Can small cracks wait until next year?',
    a: 'Usually no. Open cracks let water into the base and accelerate failure. Early crack sealing is significantly cheaper than replacement.',
  },
  {
    q: 'Do you bundle maintenance plans for homeowners?',
    a: 'Yes. We can set a practical maintenance cadence for your driveway so repairs are proactive instead of emergency-driven.',
  },
]

export default function HomeServices() {
  const canonicalPath = '/home-services'
  const title = 'Asphalt Home Services in Virginia | Maintenance and Repairs'
  const description =
    'Asphalt home services for Virginia homeowners: sealcoating, crack filling, patch repairs, widening, and drainage corrections to extend driveway life.'

  const richmondRadiusMarkets = getRichmondRadiusLocations()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        '@id': 'https://www.jwordenasphaltpaving.com/home-services#service',
        name: 'Asphalt Home Services',
        provider: {
          '@type': 'LocalBusiness',
          name: 'J. Worden & Sons Paving LLC',
          url: 'https://www.jwordenasphaltpaving.com/',
          telephone: '+18044461296',
        },
        areaServed: {
          '@type': 'GeoCircle',
          geoMidpoint: {
            '@type': 'GeoCoordinates',
            latitude: 37.5407,
            longitude: -77.4360,
          },
          geoRadius: 144841,
        },
        serviceType: [
          'Driveway sealcoating',
          'Crack filling',
          'Asphalt patch repair',
          'Drainage correction',
          'Driveway widening',
        ],
        url: 'https://www.jwordenasphaltpaving.com/home-services',
      },
      {
        '@type': 'FAQPage',
        mainEntity: HOME_SERVICE_FAQS.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a,
          },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.jwordenasphaltpaving.com/' },
          { '@type': 'ListItem', position: 2, name: 'Home Services', item: 'https://www.jwordenasphaltpaving.com/home-services' },
        ],
      },
    ],
  }

  return (
    <div className="min-h-screen bg-background font-body">
      <SEO title={title} description={description} canonicalPath={canonicalPath} jsonLd={jsonLd} />
      <Navbar />

      <section className="relative border-b border-border pt-32 pb-16 md:pb-20 overflow-hidden">
        <div className="absolute -top-16 right-0 w-72 h-72 rounded-full bg-primary/12 blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-4">Home Services</p>
          <h1 className="font-display font-black text-foreground text-4xl md:text-6xl uppercase tracking-tight leading-[0.95] max-w-5xl">
            Proactive Asphalt Home Services That Protect Your Driveway
          </h1>
          <p className="text-muted-foreground text-base md:text-lg mt-6 max-w-3xl leading-relaxed">
            Your driveway does not fail overnight. We help homeowners prevent major replacement costs with maintenance
            and repair services designed to keep asphalt stable, sealed, and functional.
          </p>

          <div className="flex flex-wrap gap-3 mt-8">
            <a
              href="tel:+18044461296"
              onClick={() => trackPhoneClick('home_services_hero')}
              className="premium-cta inline-flex items-center gap-2 px-6 py-4 font-display font-bold text-sm tracking-[0.14em] uppercase text-primary-foreground"
            >
              <Phone className="w-4 h-4" />
              Call 804-446-1296
            </a>
            <Link
              to="/#quote"
              className="border border-primary/50 text-primary px-6 py-4 font-display font-bold text-sm tracking-[0.14em] uppercase hover:bg-primary/10 transition-colors"
            >
              Book Home Service Visit
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-18 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="font-display text-primary text-xs tracking-[0.28em] uppercase mb-2">Service Menu</p>
          <h2 className="font-display font-black text-foreground text-3xl md:text-5xl uppercase tracking-tight leading-[0.95] mb-8">
            Residential Maintenance And Repair Scope
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {HOME_SERVICE_ITEMS.map((item) => (
              <article key={item.title} className="border border-border bg-card p-6">
                <h3 className="font-display font-black text-foreground text-xl uppercase tracking-tight leading-tight">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mt-3">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 md:py-16 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="font-display text-primary text-xs tracking-[0.28em] uppercase mb-2">Richmond Radius Coverage</p>
          <h2 className="font-display font-black text-foreground text-3xl md:text-5xl uppercase tracking-tight leading-[0.95] mb-8">
            Home Services Within {RICHMOND_RADIUS_MILES} Miles Of Richmond
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {richmondRadiusMarkets.map((loc) => (
              <Link
                key={loc.slug}
                to={`/locations/${loc.slug}`}
                className="border border-border bg-card p-4 flex items-center gap-2.5 hover:border-primary/40 transition-colors"
              >
                <House className="w-4 h-4 text-primary shrink-0" />
                <span className="font-display font-bold text-foreground text-sm tracking-wide">{loc.city}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 md:py-16 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="premium-panel rounded-2xl p-6 md:p-8">
              <h2 className="font-display font-black text-foreground text-2xl md:text-3xl uppercase tracking-tight mb-4">
                Preventive Home Asphalt Strategy
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground/90 leading-relaxed">Annual visual checks to catch early surface distress.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground/90 leading-relaxed">Timed crack and sealcoat cycles to block moisture entry.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground/90 leading-relaxed">Repairs prioritized by risk so budget goes to high-impact fixes first.</p>
                </div>
              </div>
            </div>

            <div className="premium-panel rounded-2xl p-6 md:p-8">
              <h2 className="font-display font-black text-foreground text-2xl md:text-3xl uppercase tracking-tight mb-4">
                Build The Full Plan
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                Need a full replacement or major reconstruction? We handle everything from base repair to new installation — get a free estimate and we'll walk you through every option.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/residential"
                  className="premium-cta inline-flex items-center gap-2 px-5 py-3 font-display font-bold text-xs tracking-[0.14em] uppercase text-primary-foreground"
                >
                  <House className="w-4 h-4" />
                  Residential Paving Page
                </Link>
                <Link
                  to="/locations/richmond-va"
                  className="border border-primary/40 text-primary px-5 py-3 font-display font-bold text-xs tracking-[0.14em] uppercase hover:bg-primary/10 transition-colors"
                >
                  Richmond Service Area
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-18 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="font-display text-primary text-xs tracking-[0.28em] uppercase mb-2">Common Questions</p>
          <h2 className="font-display font-black text-foreground text-3xl md:text-5xl uppercase tracking-tight leading-[0.95] mb-8">
            Home Services FAQ
          </h2>
          <div className="space-y-4">
            {HOME_SERVICE_FAQS.map((item) => (
              <article key={item.q} className="border border-border bg-card p-5 md:p-6">
                <h3 className="font-display font-black text-foreground text-lg md:text-xl uppercase tracking-tight leading-tight">
                  {item.q}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mt-3">{item.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 md:py-18">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="premium-panel rounded-2xl p-7 md:p-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <p className="font-display text-primary text-xs tracking-[0.28em] uppercase mb-2">Homeowner Support</p>
              <h2 className="font-display font-black text-foreground text-3xl uppercase tracking-tight">Book Your Driveway Condition Review</h2>
              <p className="text-muted-foreground text-sm md:text-base mt-3 max-w-2xl leading-relaxed">
                We will assess current condition, explain priorities, and map out the next best step for your property.
              </p>
            </div>
            <a
              href="tel:+18044461296"
              onClick={() => trackPhoneClick('home_services_footer_cta')}
              className="premium-cta inline-flex items-center gap-2 px-6 py-4 font-display font-bold text-sm tracking-[0.14em] uppercase text-primary-foreground"
            >
              <Wrench className="w-4 h-4" />
              Talk To Home Services
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
