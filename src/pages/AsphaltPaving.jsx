import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, Construction, HardHat, Award } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import JobPhotoStrip from '@/components/JobPhotoStrip'
import QuoteBlock from '@/components/QuoteBlock'
import SEO from '@/components/SEO'
import LiveReviewBadges from '@/components/LiveReviewBadges'
import { trackPhoneClick } from '@/lib/analytics'

const PAVING_SERVICES = [
  {
    title: 'Asphalt Driveway Paving',
    description: 'New asphalt driveways and full repaving for homes across Richmond, Chesterfield, Henrico, and Hanover. Every driveway is built on a compacted 4–6 inch stone base with a hot-mix asphalt surface and dual-roller compaction — so it holds up to Virginia freeze-thaw winters.',
    icon: <Construction className="w-6 h-6 text-primary" />
  },
  {
    title: 'Commercial Parking Lot Paving',
    description: 'Parking lot paving, resurfacing, and repair for retail, office, church, and HOA properties. We handle subgrade drainage, ADA-compliant line striping, and phased schedules that keep your lot open while we work.',
    icon: <ShieldCheck className="w-6 h-6 text-primary" />
  },
  {
    title: 'Asphalt Overlay & Resurfacing',
    description: 'When the base is still sound, a 2-inch asphalt overlay restores a worn driveway or lot for a fraction of full replacement — and adds 8 to 12 years of service life without a full tear-out.',
    icon: <Award className="w-6 h-6 text-primary" />
  },
  {
    title: 'Private Roads & Asphalt Millings',
    description: 'Full-depth asphalt and dust-free recycled millings for private lanes, farm roads, and long rural driveways across Central Virginia — graded, crowned, and compacted for proper drainage.',
    icon: <HardHat className="w-6 h-6 text-primary" />
  }
]

const PAVING_FAQS = [
  {
    q: 'How much does asphalt paving cost in Virginia?',
    a: 'Most residential asphalt driveways in Central Virginia run $3 to $6 per square foot for a full installation — grading, a compacted stone base, and a 2 to 3 inch hot-mix surface. A typical 1,000 square foot driveway lands between $3,000 and $6,000. Commercial parking lots are priced by square footage, base condition, and striping scope. We give every customer a written, line-item estimate before any work begins.',
  },
  {
    q: 'How long does a new asphalt driveway take to cure?',
    a: 'You can usually drive on a new asphalt driveway within 24 to 48 hours. Full curing takes 30 to 90 days as the surface continues to harden, and we recommend waiting 6 to 12 months before the first sealcoat so the asphalt can cure fully.',
  },
  {
    q: 'How long does asphalt paving last in Virginia?',
    a: 'A properly installed asphalt driveway lasts 20 to 30 years in Virginia when it is sealed every 2 to 4 years and cracks are filled early. The base is what determines lifespan — which is why we never pave over a failed base.',
  },
  {
    q: 'What areas of Virginia do you serve?',
    a: 'We are based in Chester, VA and pave throughout Central Virginia — Richmond, Chesterfield, Henrico, Hanover, Midlothian, Short Pump, Mechanicsville, Powhatan, Goochland, Petersburg, and the surrounding counties — with extended service to Hampton Roads, Fredericksburg, and the I-81 corridor.',
  },
]

export default function AsphaltPaving() {
  const canonicalPath = '/paving'
  const title = 'Asphalt Paving in Virginia | Driveways & Parking Lots | J. Worden & Sons'
  const description = 'J. Worden & Sons paves asphalt driveways, commercial parking lots, and private roads across Richmond, Chesterfield, Henrico, and Central Virginia. Family-owned for 40+ years. Free written estimates — call (804) 446-1296.'

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      'serviceType': 'Asphalt Paving',
      'name': 'Asphalt Paving in Virginia',
      'provider': {
        '@type': 'LocalBusiness',
        'name': 'J. Worden & Sons Paving LLC',
        'telephone': '+18044461296',
        'priceRange': '$$'
      },
      'areaServed': {
        '@type': 'State',
        'name': 'Virginia'
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': PAVING_FAQS.map((f) => ({
        '@type': 'Question',
        'name': f.q,
        'acceptedAnswer': { '@type': 'Answer', 'text': f.a }
      }))
    }
  ]

  return (
    <div className="min-h-screen bg-background font-body">
      <SEO title={title} description={description} canonicalPath={canonicalPath} jsonLd={jsonLd} />
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-black">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-10" />
            <picture>
              <source type="image/webp" srcSet="/hero-paving.webp" />
              <img 
                src="/hero-paving.jpg" 
                className="w-full h-full object-cover opacity-60 scale-105"
                alt="Skid steer feeding hot mix to the J. Worden and Sons hand crew"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </picture>
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-20">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="font-display text-primary text-xs tracking-[0.1em] uppercase mb-6 drop-shadow-md">Virginia Statewide Division</p>
            <h1 className="font-display font-bold text-white text-5xl md:text-8xl uppercase tracking-tighter leading-[0.85] max-w-5xl mb-8">
              Asphalt Paving <span className="text-primary italic">Across</span><br />
              Virginia.
            </h1>
            <p className="text-gray-300 text-lg md:text-2xl max-w-2xl leading-relaxed mb-10">
              J. Worden & Sons installs asphalt driveways, commercial parking lots, and private roads across Richmond, Chesterfield, Henrico, and Central Virginia — every surface built on a compacted stone base engineered for our freeze-thaw winters and clay soil.
            </p>

            <div className="flex flex-wrap gap-4">
              <a 
                href="tel:+18044461296" 
                onClick={() => trackPhoneClick('paving_hero')}
                className="premium-cta px-10 py-5 font-display font-bold text-sm tracking-[0.08em] uppercase text-primary-foreground"
              >
                Start My Project
              </a>
              <Link to="/contact" className="border-2 border-primary/40 text-white px-10 py-5 font-display font-bold text-sm tracking-[0.08em] uppercase hover:bg-primary/20 transition-all">
                The Portfolio
              </Link>
              <a href="#quote" className="border-2 border-white/35 bg-white/10 text-white px-10 py-5 font-display font-bold text-sm tracking-[0.08em] uppercase hover:bg-white/20 transition-all">
                Request Estimate
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust signals — verified review platforms */}
      <section className="border-b border-border bg-white py-10">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-center text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground mb-6">
            Verified Reviews On
          </p>
          <LiveReviewBadges />
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-24 bg-card">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="font-display font-bold text-4xl md:text-6xl uppercase tracking-tight mb-4">Asphalt Paving Services Across Central Virginia</h2>
            <div className="w-24 h-1 bg-primary mx-auto mb-6" />
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Driveways, commercial parking lots, overlays, and private roads — installed by a 4th-generation crew that grades, bases, and compacts every job to spec.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {PAVING_SERVICES.map((s, idx) => (
              <div key={idx} className="premium-panel p-8 rounded-2xl hover:border-primary transition-all group">
                <div className="mb-6 p-4 rounded-xl bg-primary/10 inline-block group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  {s.icon}
                </div>
                <h3 className="font-display font-bold text-xl mb-4 uppercase tracking-wide">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEO content — Asphalt paving in Virginia */}
      <section className="py-24 bg-background">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 space-y-6 text-lg leading-relaxed text-muted-foreground">
          <h2 className="font-display font-bold text-3xl md:text-5xl uppercase tracking-tight text-foreground mb-4">
            Asphalt Paving Built for Virginia's Climate
          </h2>
          <p>
            Asphalt fails in Virginia for one reason more than any other: a base that was never built to handle our soil. Central Virginia's red clay swells when it rains and shrinks when it dries, and the region cycles through 30 to 50 freeze-thaw events every winter. Pave over that without a properly compacted stone base and the surface cracks within a few seasons. We start every asphalt paving project — driveway or parking lot — with grading, drainage, and a 4 to 6 inch compacted stone base before a single load of hot-mix asphalt is laid.
          </p>
          <p>
            For homeowners, that means an <Link to="/residential" className="text-primary hover:underline">asphalt driveway</Link> that stays smooth and crack-free for decades. For property managers, it means a <Link to="/parking-lots" className="text-primary hover:underline">commercial parking lot</Link> with proper drainage, ADA-compliant striping, and a phased schedule that keeps your business open. When an existing surface is worn but structurally sound, an asphalt overlay restores it without the cost of a full rebuild — and routine <Link to="/sealcoating" className="text-primary hover:underline">sealcoating</Link> every few years protects the investment.
          </p>
          <p>
            Not sure whether asphalt or concrete is right for your property? Read our honest comparison of <Link to="/blog/info/asphalt-vs-concrete-driveway-virginia" className="text-primary hover:underline">asphalt vs. concrete driveways in Virginia</Link>, or see real 2026 numbers in our <Link to="/blog/info/driveway-paving-cost-virginia" className="text-primary hover:underline">Virginia driveway paving cost guide</Link>.
          </p>
          <h3 className="font-display font-bold text-2xl uppercase tracking-tight text-foreground pt-6">
            Where We Pave
          </h3>
          <p>
            J. Worden & Sons is based in Chester, VA and provides asphalt paving across Central Virginia — including Richmond, Chesterfield, Henrico, Hanover, Midlothian, Short Pump, Glen Allen, Mechanicsville, Powhatan, Goochland, Petersburg, and Colonial Heights — with extended service to Hampton Roads, Fredericksburg, and the Shenandoah Valley.
          </p>
        </div>
      </section>

      {/* FAQ — asphalt paving */}
      <section className="py-24 bg-card border-t border-border">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h2 className="font-display font-bold text-3xl md:text-5xl uppercase tracking-tight text-center mb-14">
            Virginia Asphalt Paving FAQs
          </h2>
          <div className="space-y-8">
            {PAVING_FAQS.map((f) => (
              <div key={f.q} className="border-b border-border pb-8">
                <h3 className="font-display font-bold text-xl text-foreground mb-3">{f.q}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Bar */}
      <section className="bg-primary py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <h2 className="font-display font-bold text-2xl md:text-4xl text-primary-foreground uppercase tracking-tight">Get a Written Asphalt Paving Estimate</h2>
          <a 
            href="tel:+18044461296" 
            onClick={() => trackPhoneClick('paving_bottom')}
            className="bg-black text-white px-12 py-5 font-display font-bold text-sm tracking-[0.08em] uppercase hover:opacity-90 transition-all shadow-2xl"
          >
            804.446.1296
          </a>
        </div>
      </section>
      <JobPhotoStrip category="commercial" heading="Paving days, photographed" intro="The paver, the crew, and the mat going down." />

      <QuoteBlock
        source="service_asphalt_paving"
        heading="Get an Asphalt Paving Estimate"
        intro="Tell us the square footage, or just the address and we will measure it ourselves. Every estimate is written to 96% Marshall unit weight over a VDOT Section 315 stone base."
      />

      <Footer />
    </div>
  )
}
