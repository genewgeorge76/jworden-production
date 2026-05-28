import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Layers, Phone, ShieldCheck } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SEO from '@/components/SEO'
import { trackPhoneClick } from '@/lib/analytics'

const PROCESS_STEPS = [
  'Prepare and grade the base for proper drainage and long-term stability',
  'Apply a hot liquid asphalt binder layer at controlled coverage rates',
  'Broadcast clean aggregate chips and roll for tight stone embedment',
  'Sweep and finish the surface for traction, curb appeal, and durability',
]

const BENEFITS = [
  'Lower upfront cost than full asphalt paving for many projects',
  'Excellent traction for driveways, private roads, and sloped surfaces',
  'Natural stone texture and color options for a custom look',
  'Strong weather performance with practical maintenance cycles',
  'Great fit for rural properties, long lanes, and low-to-moderate traffic routes',
]

const FAQS = [
  {
    q: 'How thick should a tar and chip surface be?',
    a: 'A typical finished tar and chip system is about 1 to 1.5 inches depending on site conditions, traffic load, and aggregate selection. We confirm final spec after site review.',
  },
  {
    q: 'Is tar and chip good for driveways and parking areas?',
    a: 'Yes. Tar and chip works well for residential driveways, private lanes, and many parking areas where owners want traction, durability, and value.',
  },
  {
    q: 'How long does tar and chip paving last?',
    a: 'With proper prep, drainage, and maintenance, tar and chip surfaces can provide long service life and strong performance in Virginia weather conditions.',
  },
  {
    q: 'Is chip and tar a good option for rural properties?',
    a: 'Yes. Chip and tar is often a strong solution for rural driveways, farm lanes, private roads, and in-between corridor properties where traction and value are priorities.',
  },
  {
    q: 'Why are chip and tar plus sealcoating especially important in the I-81 corridor?',
    a: 'Mountain weather swings, freeze-thaw cycling, and rural route traffic patterns make traction and surface preservation critical. Chip-and-tar systems plus regular sealcoating can improve durability and reduce lifecycle repair costs in I-81 markets.',
  },
]

export default function TarAndChip() {
  const canonicalPath = '/tar-and-chip'
  const videoRef = useRef(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.45
    }
  }, [])

  const title = 'Tar and Chip Paving in Virginia | Driveways and Parking Areas'
  const description =
    'Tar and chip paving for driveways, private roads, and parking areas in Virginia. Cost-effective, durable, and traction-focused installation with clear scope.'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        '@id': 'https://www.jwordenasphaltpaving.com/tar-and-chip#service',
        name: 'Tar and Chip Paving',
        provider: {
          '@type': 'LocalBusiness',
          name: 'J. Worden & Sons Paving LLC',
          url: 'https://www.jwordenasphaltpaving.com/',
          telephone: '+18044461296',
        },
        areaServed: {
          '@type': 'State',
          name: 'Virginia',
        },
        serviceType: [
          'Tar and chip paving',
          'Chip seal driveways',
          'Private lane paving',
          'Parking area paving',
        ],
        url: 'https://www.jwordenasphaltpaving.com/tar-and-chip',
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQS.map((item) => ({
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
          { '@type': 'ListItem', position: 2, name: 'Tar and Chip', item: 'https://www.jwordenasphaltpaving.com/tar-and-chip' },
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
          <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-4">Tar And Chip Division</p>
          <h1 className="font-display font-black text-foreground text-4xl md:text-6xl uppercase tracking-tight leading-[0.95] max-w-5xl">
            Tar And Chip Paving For Driveways And Parking Areas
          </h1>
          <p className="text-muted-foreground text-base md:text-lg mt-6 max-w-3xl leading-relaxed">
            Get durable, traction-focused surfaces with a cost-effective paving system designed for residential and light-commercial properties.
          </p>

          <div className="flex flex-wrap gap-3 mt-8">
            <a
              href="tel:+18044461296"
              onClick={() => trackPhoneClick('tar_chip_page_hero')}
              className="premium-cta inline-flex items-center gap-2 px-6 py-4 font-display font-bold text-sm tracking-[0.14em] uppercase text-primary-foreground"
            >
              <Phone className="w-4 h-4" />
              Call 804-446-1296
            </a>
            <Link
              to="/#quote"
              className="border border-primary/50 text-primary px-6 py-4 font-display font-bold text-sm tracking-[0.14em] uppercase hover:bg-primary/10 transition-colors"
            >
              Request Tar And Chip Quote
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 border-b border-border bg-card/40">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <p className="font-display text-primary text-xs tracking-[0.28em] uppercase mb-2">See It In Action</p>
          <h2 className="font-display font-black text-foreground text-3xl md:text-4xl uppercase tracking-tight leading-[0.95] mb-6">
            Tar And Chip Installation Video
          </h2>
          <div className="relative overflow-hidden rounded-2xl border border-border bg-black aspect-video shadow-xl">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              src="/videos/chip-and-tar.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/hero-paving.jpg"
            >
              Your browser does not support embedded video.
            </video>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Real J. Worden &amp; Sons crew performing tar and chip installation in Virginia.
          </p>
        </div>
      </section>

      <section className="py-14 md:py-16 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="premium-panel rounded-2xl p-6 md:p-8">
              <h2 className="font-display font-black text-foreground text-2xl md:text-3xl uppercase tracking-tight mb-4">
                Installation Process
              </h2>
              <div className="space-y-3">
                {PROCESS_STEPS.map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <Layers className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-foreground/90 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="premium-panel rounded-2xl p-6 md:p-8">
              <h2 className="font-display font-black text-foreground text-2xl md:text-3xl uppercase tracking-tight mb-4">
                Why Owners Choose Tar And Chip
              </h2>
              <div className="space-y-3">
                {BENEFITS.map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-foreground/90 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-6">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                Site-specific recommendations for traffic, grade, and drainage conditions
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-18 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="font-display text-primary text-xs tracking-[0.28em] uppercase mb-2">Common Questions</p>
          <h2 className="font-display font-black text-foreground text-3xl md:text-5xl uppercase tracking-tight leading-[0.95] mb-8">
            Tar And Chip FAQ
          </h2>
          <div className="space-y-4">
            {FAQS.map((item) => (
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

      <section className="py-14 md:py-16 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="font-display text-primary text-xs tracking-[0.28em] uppercase mb-2">Coastal Service Areas</p>
          <h2 className="font-display font-black text-foreground text-3xl md:text-5xl uppercase tracking-tight leading-[0.95] mb-6">
            Virginia Beach And Outer Banks Tar And Chip Coverage
          </h2>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-3xl mb-6">
            We support coastal properties where traction, drainage, and weather durability are critical.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/locations/virginia-beach-va"
              className="border border-primary/40 text-primary px-5 py-3 font-display font-bold text-xs tracking-[0.14em] uppercase hover:bg-primary/10 transition-colors"
            >
              Virginia Beach Service Page
            </Link>
            <Link
              to="/locations/outer-banks-nc"
              className="border border-primary/40 text-primary px-5 py-3 font-display font-bold text-xs tracking-[0.14em] uppercase hover:bg-primary/10 transition-colors"
            >
              Outer Banks Service Page
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-16 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="font-display text-primary text-xs tracking-[0.28em] uppercase mb-2">Rural Coverage</p>
          <h2 className="font-display font-black text-foreground text-3xl md:text-5xl uppercase tracking-tight leading-[0.95] mb-6">
            Chip And Tar Is A Strong Match For Rural Areas Too
          </h2>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-4xl mb-6">
            Rural properties between major cities often need long driveway runs, private lanes, and budget-aware surface systems.
            Chip and tar provides traction, practical durability, and lifecycle value for these in-between service areas.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/locations/chester-va"
              className="border border-primary/40 text-primary px-5 py-3 font-display font-bold text-xs tracking-[0.14em] uppercase hover:bg-primary/10 transition-colors"
            >
              Chester And Rural Corridor
            </Link>
            <Link
              to="/locations/fredericksburg-va"
              className="border border-primary/40 text-primary px-5 py-3 font-display font-bold text-xs tracking-[0.14em] uppercase hover:bg-primary/10 transition-colors"
            >
              Fredericksburg Corridor
            </Link>
            <Link
              to="/locations/harrisonburg-va"
              className="border border-primary/40 text-primary px-5 py-3 font-display font-bold text-xs tracking-[0.14em] uppercase hover:bg-primary/10 transition-colors"
            >
              Shenandoah Valley Rural Areas
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-16 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="font-display text-primary text-xs tracking-[0.28em] uppercase mb-2">I-81 Corridor Focus</p>
          <h2 className="font-display font-black text-foreground text-3xl md:text-5xl uppercase tracking-tight leading-[0.95] mb-6">
            Chip And Tar Plus Sealcoating Are Major Factors In I-81 Markets
          </h2>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-4xl mb-6">
            In Roanoke, Harrisonburg, and nearby I-81 corridors, traction and preservation matter more due to mountain weather, freeze-thaw movement,
            and mixed rural traffic loads. We prioritize chip-and-tar suitability and sealcoating cadence as part of long-life planning.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/locations/roanoke-va"
              className="border border-primary/40 text-primary px-5 py-3 font-display font-bold text-xs tracking-[0.14em] uppercase hover:bg-primary/10 transition-colors"
            >
              Roanoke Service Page
            </Link>
            <Link
              to="/locations/harrisonburg-va"
              className="border border-primary/40 text-primary px-5 py-3 font-display font-bold text-xs tracking-[0.14em] uppercase hover:bg-primary/10 transition-colors"
            >
              Harrisonburg Service Page
            </Link>
            <Link
              to="/locations/winchester-va"
              className="border border-primary/40 text-primary px-5 py-3 font-display font-bold text-xs tracking-[0.14em] uppercase hover:bg-primary/10 transition-colors"
            >
              Winchester Service Page
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-18">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="premium-panel rounded-2xl p-7 md:p-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <p className="font-display text-primary text-xs tracking-[0.28em] uppercase mb-2">Next Step</p>
              <h2 className="font-display font-black text-foreground text-3xl uppercase tracking-tight">Book A Tar And Chip Site Review</h2>
              <p className="text-muted-foreground text-sm md:text-base mt-3 max-w-2xl leading-relaxed">
                We will review your property and confirm the best chip size, binder strategy, and surface design for your goals.
              </p>
            </div>
            <a
              href="tel:+18044461296"
              onClick={() => trackPhoneClick('tar_chip_page_footer_cta')}
              className="premium-cta inline-flex items-center gap-2 px-6 py-4 font-display font-bold text-sm tracking-[0.14em] uppercase text-primary-foreground"
            >
              <Layers className="w-4 h-4" />
              Talk To Tar And Chip Team
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
