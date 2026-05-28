import React from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Bot, Camera, Map, Phone, Route } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SEO from '@/components/SEO'
import { trackPhoneClick } from '@/lib/analytics'

const REAL_PROJECT_IMAGES = [
  {
    segment: 'Residential Driveway',
    src: '/work/imported/va cars photos and videos for website/IMG_8721.JPG',
  },
  {
    segment: 'Commercial Lot',
    src: '/work/imported/KFC/IMG_9496.JPG',
  },
  {
    segment: 'HOA / Private Road',
    src: '/work/imported/va cars photos and videos for website/IMG_8724.JPG',
  },
]

const PILLARS = [
  {
    id: 'data-pipeline',
    icon: BarChart3,
    title: 'Local Project Planning',
    body: 'We build clear scopes for driveways and parking lots using property conditions, drainage patterns, and local traffic realities.',
  },
  {
    id: 'estimate-intel',
    icon: Bot,
    title: 'Honest Estimate Guidance',
    body: 'Property owners receive straightforward options with practical budget ranges for repair, overlay, and full replacement.',
  },
  {
    id: 'dispatch-routing',
    icon: Route,
    title: 'Weather-Aware Scheduling',
    body: 'We sequence paving work around weather windows and traffic needs to keep projects moving safely and efficiently.',
  },
  {
    id: 'vision-qa-reputation',
    icon: Camera,
    title: 'Photo-Based Site Clarity',
    body: 'Customers can share site photos from iPhone or Android so we can evaluate conditions early and recommend the right prep before paving.',
  },
  {
    id: 'expansion-intelligence',
    icon: Map,
    title: 'Regional Service Coverage',
    body: 'Serving Chester, Richmond, Midlothian, and surrounding Virginia markets with over 40 years of asphalt paving experience.',
  },
]

const KPI_LIST = [
  'Driveway and parking lot condition clarity',
  'Prep-before-paving completion quality',
  'On-time start and completion cadence',
  'Drainage and edge-detail attention',
  'Customer communication responsiveness',
  'Long-term pavement durability outcomes',
]

export default function ContractorAIPlatform() {
  const canonicalPath = '/contractor-ai'
  const title = 'Virginia Asphalt Planning And Delivery | J. Worden & Sons'
  const description =
    'Serving Virginia for over 40 years with practical driveway and parking lot planning, prep guidance, and dependable paving delivery.'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://www.jwordenasphaltpaving.com/contractor-ai#page',
        url: 'https://www.jwordenasphaltpaving.com/contractor-ai',
        name: 'Virginia Asphalt Planning And Delivery',
        description,
      },
      {
        '@type': 'ItemList',
        name: 'Virginia Asphalt Service Framework',
        itemListElement: PILLARS.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: p.title,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.jwordenasphaltpaving.com/' },
          { '@type': 'ListItem', position: 2, name: 'Asphalt Planning And Delivery', item: 'https://www.jwordenasphaltpaving.com/contractor-ai' },
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
          <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-4">Serving Virginia For Over 40 Years</p>
          <h1 className="font-display font-black text-foreground text-4xl md:text-6xl uppercase tracking-tight leading-[0.95] max-w-5xl">
            Local Asphalt Planning And Delivery You Can Trust
          </h1>
          <p className="text-muted-foreground text-base md:text-lg mt-6 max-w-3xl leading-relaxed">
            We help homeowners, HOAs, churches, and commercial properties make smart paving
            decisions with practical prep, clear timelines, and reliable workmanship.
          </p>

          <div className="flex flex-wrap gap-3 mt-8">
            <a
              href="tel:+18044461296"
              onClick={() => trackPhoneClick('contractor_ai_hero')}
              className="premium-cta inline-flex items-center gap-2 px-6 py-4 font-display font-bold text-sm tracking-[0.14em] uppercase text-primary-foreground"
            >
              <Phone className="w-4 h-4" />
              Call 804-446-1296
            </a>
            <Link
              to="/general-contracting"
              className="border border-primary/50 text-primary px-6 py-4 font-display font-bold text-sm tracking-[0.14em] uppercase hover:bg-primary/10 transition-colors"
            >
              View Local Services
            </Link>
          </div>
        </div>
      </section>

      <section className="py-10 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {REAL_PROJECT_IMAGES.map((image, idx) => (
              <div key={image.src} className="rounded-2xl overflow-hidden border border-border bg-card relative">
                <img
                  src={image.src}
                  alt={`${image.segment} paving project in Virginia`}
                  className={`w-full h-56 object-cover ${idx === 0 ? 'rotate-90 scale-[1.28] origin-center' : ''}`}
                  loading="lazy"
                />
                <div className="absolute left-3 bottom-3 bg-brand-navy/85 text-white text-[11px] uppercase tracking-[0.14em] px-3 py-1.5 rounded-full border border-white/20">
                  {image.segment}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 md:py-18 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="font-display text-primary text-xs tracking-[0.28em] uppercase mb-2">Service Priorities</p>
          <h2 className="font-display font-black text-foreground text-3xl md:text-5xl uppercase tracking-tight leading-[0.95] mb-8">
            Five Local-Focused Commitments
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {PILLARS.map((pillar) => (
              <article key={pillar.id} className="border border-border bg-card p-6">
                <div className="w-11 h-11 border border-primary/30 bg-primary/5 flex items-center justify-center mb-4">
                  <pillar.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-black text-foreground text-xl uppercase tracking-tight leading-tight">
                  {pillar.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mt-3">{pillar.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 md:py-16 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="premium-panel rounded-2xl p-7 md:p-10">
            <p className="font-display text-primary text-xs tracking-[0.28em] uppercase mb-2">How We Measure Quality</p>
            <h2 className="font-display font-black text-foreground text-3xl md:text-4xl uppercase tracking-tight mb-5">
              Every Project Gets A Prep-First Standard
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {KPI_LIST.map((kpi) => (
                <div key={kpi} className="border border-border bg-card px-4 py-3 text-sm text-foreground/90">
                  {kpi}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-18">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="premium-panel rounded-2xl p-7 md:p-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <p className="font-display text-primary text-xs tracking-[0.28em] uppercase mb-2">Next Move</p>
              <h2 className="font-display font-black text-foreground text-3xl uppercase tracking-tight">Get A Local Paving Plan</h2>
              <p className="text-muted-foreground text-sm md:text-base mt-3 max-w-2xl leading-relaxed">
                Tell us your property goals and we will recommend the best scope for your driveway
                or lot, including any required prep before paving.
              </p>
            </div>
            <a
              href="tel:+18044461296"
              onClick={() => trackPhoneClick('contractor_ai_footer')}
              className="premium-cta inline-flex items-center gap-2 px-6 py-4 font-display font-bold text-sm tracking-[0.14em] uppercase text-primary-foreground"
            >
              <Bot className="w-4 h-4" />
              Start Your Free Quote
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
