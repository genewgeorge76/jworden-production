import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Building2, Phone, ShieldCheck, Globe } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SEO from '@/components/SEO'
import { trackPhoneClick } from '@/lib/analytics'

// Northern Virginia — Fairfax, Loudoun, Prince William.
// Data center alley, Dulles corridor, Tysons Corner, government contractor campuses.
const SERVICE_ZONES = [
  {
    area: 'Fairfax County',
    detail: 'Virginia\'s most populous county. Tysons Corner redevelopment, Route 50 (Lee-Jackson Hwy) retail, Route 29 (Lee Hwy) commercial corridors, and dense suburban subdivisions requiring HOA road maintenance.',
  },
  {
    area: 'Loudoun County / Dulles Corridor',
    detail: 'Ashburn and Sterling data center campuses demand truck-rated parking and access road paving with heavy base specs. One North Loudoun development corridor paving is an active market for us.',
  },
  {
    area: 'Prince William County / Manassas',
    detail: 'Manassas industrial corridor along Route 28, new residential development in Gainesville, Haymarket, and Bristow. We know Prince William\'s inspection standards and VDOT Northern District specs.',
  },
  {
    area: 'Reston, Herndon & Chantilly',
    detail: 'Corporate campus and technology park paving along the Dulles Access Road. High-specification surface work with design review coordination.',
  },
  {
    area: 'Springfield & I-495 Corridor',
    detail: 'High-traffic retail and office park lots near the Springfield Interchange. Heavy commercial paving with complex phased scheduling.',
  },
  {
    area: 'Alexandria & Arlington (Adjacent)',
    detail: 'Infill commercial paving, alley resurfacing, and private lot work in the inner NoVA urban corridor where access and neighborhood coordination is critical.',
  },
]

const NOVA_CHALLENGES = [
  { issue: 'VDOT Northern District Permits', fix: 'Northern Virginia is in VDOT\'s Northern District with different inspection protocols than Central. We have operated under both and know how to navigate the differences without delays.' },
  { issue: 'High Property Density', fix: 'Tight access, adjacent property protection, and nighttime/weekend work windows are standard in NoVA. Our crews are trained for urban-constraint commercial paving.' },
  { issue: 'Data Center Truck Traffic', fix: 'Ashburn/Sterling data centers have constant heavy-equipment delivery. We specify PG 76-22 binder and 8"+ base for truck-heavy access routes in the data center corridor.' },
  { issue: 'Aggressive Market Competition', fix: 'NoVA has many contractors. What makes us different: 40 years of Virginia-specific knowledge, VDOT prequalification, and a written warranty on every job.' },
]

const FAQS = [
  {
    q: 'Do you serve Fairfax County, Loudoun County, and Prince William County?',
    a: 'Yes. Northern Virginia — Fairfax, Loudoun, Prince William, Stafford (upper), and the independent cities of Manassas and Manassas Park — are active service counties. We mobilize crews from Chester for Northern Virginia commercial and residential projects.',
  },
  {
    q: 'Can you pave a data center access road or parking facility in Ashburn or Sterling?',
    a: 'Yes. Data center campuses in the Dulles Technology Corridor require truck-rated pavement design with heavy base specs and high-performance binder grades. We have spec\'d and executed this type of work and can provide technical proposals for facilities managers.',
  },
  {
    q: 'What makes Northern Virginia paving harder than Central Virginia paving?',
    a: 'Three things: VDOT Northern District has different permitting protocols, access constraints are tighter in dense suburban/urban areas, and client expectations for finish quality are higher on corporate and institutional work. We operate comfortably in all three conditions.',
  },
  {
    q: 'Do you do HOA road maintenance in Northern Virginia?',
    a: 'Yes. Fairfax and Loudoun have hundreds of private HOA communities with road maintenance responsibilities. We provide multi-year pavement management plans, crack sealing, sealcoating, and resurfacing on a contract basis for HOAs.',
  },
]

export default function NorthernVirginiaPaving() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
        '@id': 'https://www.jwordenasphaltpaving.com/#business',
        name: 'J. Worden & Sons Paving LLC',
        url: 'https://www.jwordenasphaltpaving.com/',
        telephone: '+18044461296',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Chester',
          addressRegion: 'VA',
          postalCode: '23831',
          addressCountry: 'US',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          reviewCount: '147',
          bestRating: '5',
        },
        areaServed: [
          { '@type': 'County', name: 'Fairfax County', containedInPlace: { '@type': 'State', name: 'Virginia' } },
          { '@type': 'County', name: 'Loudoun County', containedInPlace: { '@type': 'State', name: 'Virginia' } },
          { '@type': 'County', name: 'Prince William County', containedInPlace: { '@type': 'State', name: 'Virginia' } },
        ],
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.jwordenasphaltpaving.com/' },
          { '@type': 'ListItem', position: 2, name: 'Service Areas', item: 'https://www.jwordenasphaltpaving.com/services' },
          { '@type': 'ListItem', position: 3, name: 'Northern Virginia', item: 'https://www.jwordenasphaltpaving.com/northern-virginia-paving' },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQS.map(faq => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: { '@type': 'Answer', text: faq.a },
        })),
      },
    ],
  }

  return (
    <div className="min-h-screen bg-brand-navy">
      <SEO
        title="Asphalt Paving Northern Virginia | Fairfax, Loudoun & Prince William"
        description="Commercial and residential asphalt paving in Fairfax County, Loudoun County, and Prince William County. Data center campus roads, HOA maintenance, retail lot paving. VDOT prequalified. 40 years Virginia expertise."
        canonicalPath="/northern-virginia-paving"
        jsonLd={jsonLd}
      />
      <Navbar />

      {/* HERO */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 80% 40%, #d97706 0%, transparent 60%)' }} />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-3/5 space-y-6">
              <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-white/30 text-xs">
                <Link to="/" className="hover:text-white/60 transition-colors">Home</Link>
                <span>/</span>
                <Link to="/services" className="hover:text-white/60 transition-colors">Services</Link>
                <span>/</span>
                <span className="text-white/60">Northern Virginia</span>
              </nav>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 bg-brand-amber/10 text-brand-amber text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  <Globe className="w-3 h-3" /> Fairfax · Loudoun · Prince William
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  <ShieldCheck className="w-3 h-3" /> VDOT Northern District Qualified
                </span>
              </div>
              <h1 className="font-display font-black text-5xl md:text-7xl text-white leading-tight tracking-tight">
                Northern Virginia<br /><span className="text-brand-amber">Deserves</span><br />Virginia Expertise.
              </h1>
              <p className="text-white/70 text-xl max-w-2xl">
                Fairfax data centers. Dulles tech campuses. Tysons Corner retail. Loudoun subdivision roads. We bring 40 years of Virginia paving knowledge to Northern Virginia's most demanding commercial and institutional projects.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <a
                  href="tel:+18044461296"
                  onClick={() => trackPhoneClick('nova-hero')}
                  className="btn-primary py-4 px-8 font-black flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" /> (804) 446-1296
                </a>
                <Link to="/quote" className="btn-outline py-4 px-8 text-white font-black">Commercial Quote</Link>
              </div>
              <div className="grid grid-cols-4 gap-4 pt-6 border-t border-white/10">
                {[
                  { val: '40+', label: 'Yrs Experience' },
                  { val: 'VDOT', label: 'Prequalified' },
                  { val: '4.9★', label: 'Avg Rating' },
                  { val: 'NoVA', label: 'Permits Ready' },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className="text-brand-amber font-black text-xl">{s.val}</p>
                    <p className="text-white/40 text-xs uppercase tracking-widest mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              {/* Awards */}
              <div className="flex flex-wrap items-center gap-2 pt-4">
                <span className="text-white/30 text-xs uppercase tracking-widest font-bold">Awards:</span>
                <span className="bg-brand-amber/10 text-brand-amber text-xs font-bold px-3 py-1.5 rounded-full">🏆 Pavement Mag Top 75</span>
                <span className="bg-white/10 text-white/80 text-xs font-bold px-3 py-1.5 rounded-full">⭐ Best of Houzz</span>
                <span className="bg-white/10 text-white/80 text-xs font-bold px-3 py-1.5 rounded-full">🎖 2026 Top Contractor Nominee</span>
              </div>
            </div>

            {/* Challenge cards */}
            <div className="lg:w-2/5">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-5">
                <h2 className="text-white font-black text-lg">What Makes NoVA Different.</h2>
                {NOVA_CHALLENGES.map((c, i) => (
                  <div key={i} className="border-l-2 border-brand-amber/40 pl-4">
                    <p className="text-brand-amber font-bold text-sm">{c.issue}</p>
                    <p className="text-white/50 text-xs mt-1 leading-relaxed">{c.fix}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICE ZONES */}
      <section className="py-24 bg-white/5 border-y border-white/10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-white font-black text-3xl md:text-5xl tracking-tight">Active Northern Virginia Coverage.</h2>
            <p className="text-white/40 mt-4 max-w-2xl mx-auto">Real service areas with real knowledge of each locality's permit requirements, soil conditions, and project types.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICE_ZONES.map((z, i) => (
              <div key={i} className="bg-brand-navy border border-white/10 rounded-2xl p-7 hover:border-brand-amber/30 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-brand-amber flex-shrink-0" />
                  <h3 className="text-white font-black text-base">{z.area}</h3>
                </div>
                <p className="text-white/50 text-sm leading-relaxed">{z.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-white font-black text-3xl md:text-5xl tracking-tight text-center mb-14">Northern Virginia Paving FAQs.</h2>
          <div className="space-y-6">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <h3 className="text-white font-bold text-lg mb-3">{faq.q}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INTERNAL LINKS */}
      <section className="py-12 px-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <p className="text-white/30 text-xs uppercase tracking-widest font-bold mb-5">Related Services & Areas</p>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Fredericksburg Paving', to: '/fredericksburg-paving' },
              { label: 'Parking Lots', to: '/parking-lots' },
              { label: 'Richmond Paving', to: '/richmond-paving' },
              { label: 'Crack Repair', to: '/crack-repair' },
              { label: 'Commercial Richmond', to: '/commercial/richmond-va' },
            ].map(l => (
              <Link key={l.to} to={l.to} className="text-brand-amber/70 hover:text-brand-amber text-sm border border-brand-amber/20 hover:border-brand-amber/50 px-4 py-2 rounded-full transition-all">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto bg-brand-amber rounded-[2.5rem] p-12 md:p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Building2 size={140} /></div>
          <p className="text-brand-navy/50 font-bold uppercase tracking-widest text-sm mb-3">Northern Virginia's Virginia Contractor</p>
          <h2 className="text-brand-navy font-black text-3xl md:text-5xl leading-tight mb-6">
            Fairfax to the Blue Ridge.<br />One Contractor. Full Virginia.
          </h2>
          <p className="text-brand-navy/60 text-lg mb-8 max-w-2xl mx-auto">
            We mobilize from Chester for commercial projects throughout Northern Virginia. VDOT prequalified, bonded, and insured for any scale.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="tel:+18044461296"
              onClick={() => trackPhoneClick('nova-cta')}
              className="bg-brand-navy text-white font-black py-4 px-8 rounded-full hover:bg-brand-navy/80 transition-colors"
            >
              Call (804) 446-1296
            </a>
            <Link to="/quote" className="bg-white/20 text-brand-navy font-black py-4 px-8 rounded-full hover:bg-white/30 transition-colors">
              Request Proposal
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
