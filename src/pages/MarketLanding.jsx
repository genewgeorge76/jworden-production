import React from 'react'
import { ArrowRight, CheckCircle2, Phone, ShieldCheck, Snowflake } from 'lucide-react'
import SEO from '@/components/SEO'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AIConciergeBubble from '@/components/AIConciergeBubble'
import EstimateForm from '@/components/EstimateForm'
import LiveReviewBadges from '@/components/LiveReviewBadges'
import { FEATURED_REVIEWS } from '@/lib/reviews'
import { getRegionalMarketProfile } from '@/data/regionalMarketProfiles'
import { trackPhoneClick } from '@/lib/analytics'
import { useTenant } from '@/lib/TenantContext'
import { SAME_AS, AGGREGATE_RATING, BUSINESS_LEGAL_NAME } from '@/lib/businessInfo.canonical'

const DEFAULT_MARKET_CONTENT = {
  marketName: 'Local Asphalt Paving',
  primaryRegion: 'Your Service Region',
  primaryMetro: 'Major Metro Area',
  heroKicker: 'Verified Field Documentation',
  heroHeadline: 'Premium Asphalt Construction Built For Local Conditions',
  heroBody:
    'Commercial parking lots and residential driveways delivered with clear scope, structural prep discipline, and execution standards built for long-term performance.',
  ctaLabel: 'Call For A Professional Estimate',
  phoneDisplay: '804-446-1296',
  proofHeadline: 'Recent Documented Work',
  geo: {
    region: 'US-VA',
    placename: 'Chester, Virginia',
    position: '37.3563;-77.4411',
    icbm: '37.3563, -77.4411',
  },
}

const DELIVERY_STANDARDS = [
  'Detailed scope and sequencing approved before mobilization',
  'Compaction and lift planning matched to actual traffic load',
  'Seasonal installation protocols for temperature-sensitive paving windows',
  'Photo-documented closeout package for every project',
]

const SERVICE_MIX = [
  'Commercial parking lots, retail lanes, and access corridors',
  'Drive-thru and franchise remodel paving scopes',
  'Private driveways, estate lanes, and long-lane resurfacing',
  'Repair, overlay, and preservation planning',
]

const PROOF_IMAGES = [
  {
    id: 'kfc-9509',
    src: '/work/imported/KFC/IMG_9509.JPG',
    title: 'High-traffic commercial lot delivery',
    body: 'Documented paving execution for high-use customer traffic with controlled sequencing and closeout verification.',
  },
  {
    id: 'va-8724',
    src: '/work/imported/va_cars_photos_and_videos_for_website/IMG_8724.JPG',
    title: 'Residential driveway finish and edge control',
    body: 'Clean residential finish work with stable transitions, water-shedding slope, and detail-focused completion.',
  },
  {
    id: 'va-8733',
    src: '/work/imported/va_cars_photos_and_videos_for_website/IMG_8733.JPG',
    title: 'Surface renewal with preservation planning',
    body: 'Asphalt renewal strategy designed to protect service life, support traffic demand, and reduce avoidable capital rework.',
  },
]

function toTelHref(phoneDisplay) {
  const digits = String(phoneDisplay || '').replace(/\D/g, '')
  if (!digits) return 'tel:+18044461296'
  if (digits.startsWith('1')) return `tel:+${digits}`
  return `tel:+1${digits}`
}

export default function MarketLanding() {
  const tenant = useTenant()
  const localProfile = typeof window !== 'undefined' ? getRegionalMarketProfile(window.location.hostname) : null
  const market = {
    ...DEFAULT_MARKET_CONTENT,
    ...(tenant?.market || {}),
    ...(localProfile || {}),
  }

  const phoneDisplay = market.phoneDisplay || DEFAULT_MARKET_CONTENT.phoneDisplay
  const phoneHref = toTelHref(phoneDisplay)

  const title = `${market.marketName} | Verified Asphalt Paving`
  const description = `${market.marketName} serving ${market.primaryRegion}. Documented project proof, clear scope language, and asphalt construction built for local weather cycles.`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
        name: market.marketName,
        // The trading name differs per market; the legal entity does not, and
        // it is what ties these sites to one business rather than several.
        legalName: BUSINESS_LEGAL_NAME,
        areaServed: {
          '@type': 'AdministrativeArea',
          name: market.primaryRegion,
        },
        telephone: `+1${String(phoneDisplay || '').replace(/\D/g, '') || '8044461296'}`,
        url: tenant?.canonicalUrl || 'https://www.thewordenstandard.com',
        // WHY THESE TWO WERE MISSING AND WHY IT MATTERED
        // The brand sites build their own JSON-LD rather than reusing
        // HomeSchema, and this graph omitted both. The result: eight verified
        // review profiles and a real Houzz-sourced rating existed in the
        // codebase and reached no brand page, so Google had no way to connect
        // carolinablacktop.com to the Google Business Profile or to any
        // citation. Connecting an entity to its citations is the entire job
        // sameAs does, and an unlinked profile is a citation nobody can follow
        // home.
        sameAs: SAME_AS,
        aggregateRating: {
          '@type': 'AggregateRating',
          ...AGGREGATE_RATING,
        },
      },
      {
        '@type': 'Service',
        name: `${market.marketName} Asphalt Services`,
        provider: {
          '@type': 'Organization',
          name: market.marketName,
          url: tenant?.canonicalUrl || 'https://www.thewordenstandard.com',
        },
        areaServed: {
          '@type': 'AdministrativeArea',
          name: market.primaryRegion,
        },
      },
    ],
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-100 font-body">
      <SEO title={title} description={description} canonicalPath="/" geo={market.geo} jsonLd={jsonLd} />
      <Navbar />

      <header className="border-b border-slate-800/80 bg-[#121212]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
              <p className="font-display text-[11px] uppercase tracking-[0.2em] text-orange-400 font-semibold">Class A Licensed Asphalt Operations</p>
            </div>
            <p className="font-display text-xl uppercase font-black text-white tracking-wide mt-0.5">{market.marketName}</p>
          </div>
          <a
            href={phoneHref}
            onClick={() => trackPhoneClick('market_landing_header')}
            className="inline-flex items-center gap-2.5 px-5 py-3 text-xs font-display font-bold uppercase tracking-[0.14em] text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl shadow-lg shadow-orange-500/20 transition-all transform hover:-translate-y-0.5"
          >
            <Phone className="w-4 h-4 text-white" />
            {phoneDisplay}
          </a>
        </div>
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-[#111111] via-[#0d0d0d] to-[#0a0a0a]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(249,115,22,0.15),transparent_55%),radial-gradient(circle_at_90%_90%,rgba(245,158,11,0.1),transparent_50%)]" />
          <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-16 md:py-24">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30 text-xs font-semibold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                {market.heroKicker}
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
                🏆 Best of Houzz 4× Winner
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30 text-xs font-bold uppercase tracking-wider">
                🥇 Pavement Magazine Top 75
              </span>
            </div>

            <h1 className="font-display text-4xl md:text-6xl font-black uppercase tracking-tight leading-[0.96] text-white max-w-5xl">
              {market.heroHeadline}
            </h1>
            <p className="mt-6 text-base md:text-lg text-slate-300 max-w-3xl leading-relaxed">
              {market.heroBody}
            </p>

            {/* LIVE AWARDS & TRUST BADGES */}
            <div className="mt-8 pt-4 border-t border-slate-800/60">
              <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-400 mb-3">National Awards & Verified Industry Recognition:</p>
              <LiveReviewBadges compact={true} />
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={phoneHref}
                onClick={() => trackPhoneClick('market_landing_hero')}
                className="inline-flex items-center gap-2.5 px-7 py-4 text-sm font-display font-bold uppercase tracking-[0.14em] text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl shadow-xl shadow-orange-500/25 transition-all transform hover:-translate-y-0.5"
              >
                <Phone className="w-4 h-4" />
                {market.ctaLabel}
              </a>
              <a
                href="#proof"
                className="inline-flex items-center gap-2.5 px-7 py-4 border border-orange-500/40 text-orange-400 hover:text-white hover:border-orange-500 text-sm font-display font-bold uppercase tracking-[0.14em] bg-orange-500/5 hover:bg-orange-500/20 rounded-xl transition-all"
              >
                See Verified Field Photos
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-slate-800/80 bg-slate-900/60 backdrop-blur rounded-xl p-5 hover:border-orange-500/40 transition-colors">
                <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-orange-400">Primary Region</p>
                <p className="font-display text-2xl font-bold text-white uppercase mt-1">{market.primaryRegion}</p>
              </div>
              <div className="border border-slate-800/80 bg-slate-900/60 backdrop-blur rounded-xl p-5 hover:border-orange-500/40 transition-colors">
                <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-orange-400">Core Metro</p>
                <p className="font-display text-2xl font-bold text-white uppercase mt-1">{market.primaryMetro}</p>
              </div>
              <div className="border border-slate-800/80 bg-slate-900/60 backdrop-blur rounded-xl p-5 hover:border-orange-500/40 transition-colors">
                <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-orange-400">Operating Standard</p>
                <p className="font-display text-2xl font-bold text-white uppercase mt-1">Photo Documented</p>
              </div>
            </div>
          </div>
        </section>

        {/* STANDARDS & SERVICE MIX */}
        <section className="py-16 border-b border-slate-800/80 bg-[#0d0d0d]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-8">
            {market.localSpecs && (
              <div className="border border-orange-500/30 bg-slate-900/80 backdrop-blur rounded-2xl p-7 md:p-9 space-y-4 hover:border-orange-500/60 transition-all shadow-xl shadow-orange-500/5">
                <div className="flex items-center space-x-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-500 animate-ping"></span>
                  <h3 className="font-display text-orange-400 text-xs tracking-[0.22em] uppercase font-bold">Regional Climate & Engineering Formulations ({market.primaryRegion})</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {market.localSpecs.map((spec) => (
                    <div key={spec} className="border border-slate-800 bg-slate-950/70 rounded-xl p-4 flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-slate-200 leading-relaxed font-semibold">{spec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="border border-slate-800 bg-slate-900/50 backdrop-blur rounded-2xl p-7 md:p-9 space-y-4 hover:border-orange-500/30 transition-all">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-orange-400" />
                  <h3 className="font-display text-orange-400 text-xs tracking-[0.22em] uppercase font-bold">Delivery Standards</h3>
                </div>
                <div className="space-y-3 pt-2">
                  {DELIVERY_STANDARDS.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-slate-200 leading-relaxed font-medium">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-slate-800 bg-slate-900/50 backdrop-blur rounded-2xl p-7 md:p-9 space-y-4 hover:border-orange-500/30 transition-all">
                <div className="flex items-center space-x-2">
                  <Snowflake className="w-5 h-5 text-orange-400" />
                  <h3 className="font-display text-orange-400 text-xs tracking-[0.22em] uppercase font-bold">Service Mix</h3>
                </div>
                <div className="space-y-3 pt-2">
                  {SERVICE_MIX.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-slate-200 leading-relaxed font-medium">{item}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-orange-400 shrink-0" />
                  Scope clarity, documented execution, and accountable delivery standards on every project.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ESTIMATE FORM & CONVERSION SECTION */}
        <section id="quote" className="py-16 md:py-24 border-b border-slate-800/80 bg-[#111111]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30 text-xs font-semibold uppercase tracking-wider">
                Instant Price Estimate
              </div>
              <h2 className="font-display text-3xl md:text-5xl font-black uppercase tracking-tight text-white leading-tight">
                Request A Free On-Site Estimate For {market.primaryRegion}
              </h2>
              <p className="text-slate-300 text-base leading-relaxed">
                Our local paving estimators evaluate compaction, subgrade stability, slope drainage, and material specs to provide a guaranteed line-item quote.
              </p>
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-3 text-sm text-slate-200 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0" />
                  <span>Free on-site inspection & core compaction assessment</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-slate-200 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0" />
                  <span>Itemized pricing with no hidden mobilization fees</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-slate-200 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0" />
                  <span>Class A licensed, bonded, and $5M insured</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 border border-slate-800 bg-slate-900/80 backdrop-blur rounded-2xl p-6 md:p-8 shadow-2xl">
              <h3 className="font-display text-xl font-bold uppercase tracking-wide text-white mb-6">Fast Project Estimate Request</h3>
              <EstimateForm source={`market_landing_${market.primaryRegion}`} />
            </div>
          </div>
        </section>

        {/* FEATURED VERIFIED REVIEWS SECTION */}
        <section className="py-16 md:py-24 border-b border-slate-800/80 bg-[#0d0d0d]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-semibold uppercase tracking-wider mb-4">
                ⭐ 5-Star Verified Customer Feedback
              </div>
              <h2 className="font-display text-3xl md:text-5xl font-black uppercase tracking-tight text-white leading-tight">
                What Real Clients Say About Our Quality & Execution
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {FEATURED_REVIEWS.map((rev, idx) => (
                <div key={idx} className="border border-slate-800 bg-slate-900/60 backdrop-blur rounded-2xl p-7 hover:border-orange-500/40 transition-all shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-amber-400 text-lg">
                      {'★'.repeat(rev.rating)}
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
                      Verified {rev.source} Review
                    </span>
                  </div>
                  <p className="text-slate-200 text-sm leading-relaxed italic">
                    "{rev.text}"
                  </p>
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400 font-semibold">
                    <span className="text-white font-bold">{rev.author}</span>
                    <span>{rev.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FIELD PROOF GALLERY (HIGH RES ZOOM-CORRECTED) */}
        <section id="proof" className="py-16 md:py-24 border-b border-slate-800/80 bg-[#0a0a0a]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30 text-xs font-semibold uppercase tracking-wider mb-4">
              {market.proofHeadline}
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-black uppercase tracking-tight leading-[0.95] text-white mb-10">
              Verified High-Resolution Field Photos & Scope Accuracy
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {(market.proofImages || PROOF_IMAGES).map((item) => (
                <article key={item.id} className="group border border-slate-800 bg-slate-900/60 rounded-2xl overflow-hidden hover:border-orange-500/50 transition-all shadow-xl hover:shadow-orange-500/10">
                  <div className="overflow-hidden aspect-[16/9]">
                    <img
                      src={item.src}
                      alt={item.title}
                      width="1200"
                      height="800"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-display text-lg font-bold uppercase tracking-tight text-white group-hover:text-orange-400 transition-colors">{item.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed mt-2.5">{item.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <AIConciergeBubble />
    </div>
  )
}
