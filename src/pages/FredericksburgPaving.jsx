import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, TrendingUp, Phone, CheckCircle2, Truck, Construction } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SEO from '@/components/SEO'
import { trackPhoneClick } from '@/lib/analytics'

// Fredericksburg — fastest-growing I-95 corridor. Stafford + Spotsylvania exploding.
// Real geography: Central Park, Celebrate Virginia, Route 3 (Plank Road), I-95 interchange commercial.
const GROWTH_ZONES = [
  {
    area: 'Stafford County',
    detail: 'One of Virginia\'s fastest-growing counties. Massive subdivision development along Route 610 (Garrisonville Road), Courthouse Road, and the I-95 commuter belt. New driveways and HOA roads our core work here.',
  },
  {
    area: 'Spotsylvania County',
    detail: 'Heavy growth along the Route 3 corridor toward Culpeper. New commercial pads at the Spotsylvania Towne Centre area, hospital district off Route 1, and Cosner\'s Corner retail.',
  },
  {
    area: 'Fredericksburg City / Central Park',
    detail: 'Central Park is one of Virginia\'s largest retail concentrations. We compete for — and win — large-format commercial lot paving and maintenance contracts in this corridor.',
  },
  {
    area: 'I-95 Interchange Commercial Strip',
    detail: 'Route 17 and Route 3 interchange commercial development. High-traffic retail and hospitality lots with heavy 18-wheeler access and tight DOT sight-line requirements.',
  },
  {
    area: 'Celebrate Virginia & Route 1 Corridor',
    detail: 'The exploding development district at I-95 Exit 126 area. Hotel, sports, and conference facility paving with high design expectations and phase-work scheduling.',
  },
  {
    area: 'King George & Caroline Counties',
    detail: 'Rural residential driveways, farm access roads, and church/institutional lot paving in the outer Fredericksburg commuter zone.',
  },
]

const SERVICES = [
  { title: 'New Subdivision Roads', desc: 'Properly spec\'d new subdivision street paving for developers in Stafford and Spotsylvania. 21-A base, proper compaction testing, and VDOT secondary road standards.' },
  { title: 'Commercial Lot Paving', desc: 'Large-format retail, hospitality, and office lot paving. Phased around business operations. ADA-compliant striping included.' },
  { title: 'Residential Driveways', desc: 'New construction and replacement driveways for Fredericksburg\'s booming residential market. Built right the first time — not the cut-corner spec used by low-bid crews flooding the area.' },
  { title: 'HOA Road Maintenance', desc: 'Recurring maintenance contracts for Stafford and Spotsylvania HOA communities. Crack sealing, sealcoating, and pavement management planning.' },
  { title: 'I-95 Corridor Commercial', desc: 'High-visibility commercial lots along the I-95 corridor where first impressions matter — hotel parking, chain restaurant drives, gas station canopy areas.' },
  { title: 'Emergency Pothole Repair', desc: 'Same-day response anywhere in the Fredericksburg metro. We dispatch from Chester and can reach Fredericksburg in under an hour on most days.' },
]

const FAQS = [
  {
    q: 'Why is Fredericksburg seeing so much paving demand right now?',
    a: 'Stafford and Spotsylvania are among Virginia\'s fastest-growing counties. Thousands of new homes, retail developments, and commercial facilities are being built every year along the I-95 commuter corridor. This creates enormous demand for new driveways, subdivision roads, and commercial lots — and a lot of out-of-area contractors trying to grab the work without local knowledge.',
  },
  {
    q: 'Do you serve Stafford County and Spotsylvania County?',
    a: 'Yes — both are active service counties for us. We work throughout Stafford (Garrisonville, Aquia Harbour, North Stafford), Spotsylvania (Central Park area, Cosner\'s Corner, Spotsylvania CH), King George County, and Fredericksburg City.',
  },
  {
    q: 'What do you charge for a new driveway in the Fredericksburg area?',
    a: 'Residential asphalt driveways in the Fredericksburg/Stafford area typically run $4–$7 per square foot installed, depending on base requirements, existing material removal, grading, and access. We provide written, itemized quotes — no surprise upcharges.',
  },
  {
    q: 'Can you handle phased paving on a large commercial site while the business stays open?',
    a: 'Yes. Phased commercial paving is a core competency. We sequence work to maintain customer access, coordinate with your property manager, and meet local building department requirements for ADA path-of-travel continuity.',
  },
]

export default function FredericksburgPaving() {
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
          { '@type': 'City', name: 'Fredericksburg', containedInPlace: { '@type': 'State', name: 'Virginia' } },
          { '@type': 'County', name: 'Stafford County', containedInPlace: { '@type': 'State', name: 'Virginia' } },
          { '@type': 'County', name: 'Spotsylvania County', containedInPlace: { '@type': 'State', name: 'Virginia' } },
        ],
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.jwordenasphaltpaving.com/' },
          { '@type': 'ListItem', position: 2, name: 'Service Areas', item: 'https://www.jwordenasphaltpaving.com/services' },
          { '@type': 'ListItem', position: 3, name: 'Fredericksburg VA', item: 'https://www.jwordenasphaltpaving.com/fredericksburg-paving' },
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
        title="Asphalt Paving Fredericksburg VA | Stafford & Spotsylvania Contractor"
        description="Virginia's I-95 growth corridor needs an experienced paving contractor. J. Worden & Sons serves Fredericksburg, Stafford County, and Spotsylvania. New subdivisions, commercial lots, driveways, and HOA roads. 40 years of Virginia expertise."
        canonicalPath="/fredericksburg-paving"
        jsonLd={jsonLd}
      />
      <Navbar />

      {/* HERO */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 30% 60%, #d97706 0%, transparent 60%)' }} />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-3/5 space-y-6">
              <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-white/30 text-xs">
                <Link to="/" className="hover:text-white/60 transition-colors">Home</Link>
                <span>/</span>
                <Link to="/services" className="hover:text-white/60 transition-colors">Services</Link>
                <span>/</span>
                <span className="text-white/60">Fredericksburg VA</span>
              </nav>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 bg-brand-amber/10 text-brand-amber text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  <TrendingUp className="w-3 h-3" /> Virginia's Fastest-Growing Corridor
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  <MapPin className="w-3 h-3" /> Stafford · Spotsylvania · Fredericksburg
                </span>
              </div>
              <h1 className="font-display font-black text-5xl md:text-7xl text-white leading-tight tracking-tight">
                Fredericksburg<br /><span className="text-brand-amber">Is Growing.</span><br />So Is Demand.
              </h1>
              <p className="text-white/70 text-xl max-w-2xl">
                Stafford and Spotsylvania are two of the fastest-growing counties in Virginia. Thousands of driveways, subdivision roads, and commercial lots are being paved every year — and too many are being done wrong. We've done this for 40 years. We do it right.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <a
                  href="tel:+18044461296"
                  onClick={() => trackPhoneClick('fredericksburg-hero')}
                  className="btn-primary py-4 px-8 font-black flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" /> (804) 446-1296
                </a>
                <Link to="/quote" className="btn-outline py-4 px-8 text-white font-black">Free Written Estimate</Link>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
                {[
                  { val: '< 1hr', label: 'Response Time from Chester' },
                  { val: 'VDOT', label: 'Prequalified' },
                  { val: '40+', label: 'Years in Virginia' },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className="text-brand-amber font-black text-2xl">{s.val}</p>
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

            {/* Growth signal card */}
            <div className="lg:w-2/5">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-5">
                <h2 className="text-white font-black text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-brand-amber" /> Why Fredericksburg Is Exploding
                </h2>
                {[
                  'Stafford County population +35% in 10 years',
                  'Spotsylvania among top 10 fastest-growing VA counties',
                  'I-95 widening → new interchange commercial development',
                  'Remote work → DC commuters buying in Stafford/Spotsylvania',
                  'Central Park retail expansion ongoing',
                  'Celebrate Virginia sports/hospitality district buildout',
                ].map((fact, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-brand-amber mt-0.5 flex-shrink-0" />
                    <p className="text-white/60 text-sm">{fact}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-24 bg-white/5 border-y border-white/10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-white font-black text-3xl md:text-5xl tracking-tight mb-4">Full Paving Services.<br />Fredericksburg to King George.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SERVICES.map((svc, i) => (
              <div key={i} className="bg-brand-navy border border-white/10 rounded-3xl p-8 hover:border-brand-amber/30 transition-all group">
                <Construction className="w-8 h-8 text-brand-amber mb-5 group-hover:scale-110 transition-transform" />
                <h3 className="text-white font-black text-xl mb-3">{svc.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{svc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GROWTH ZONES */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-white font-black text-3xl md:text-4xl tracking-tight mb-4">Active Service Zones — Fredericksburg Metro.</h2>
            <p className="text-white/40 max-w-xl mx-auto">We know the roads, the soil conditions, and the permit requirements for every area below.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {GROWTH_ZONES.map((z, i) => (
              <div key={i} className="flex items-start gap-3 p-5 bg-white/5 border border-white/10 rounded-2xl hover:border-brand-amber/20 transition-all">
                <div className="w-2 h-2 rounded-full bg-brand-amber mt-2 flex-shrink-0" />
                <div>
                  <p className="text-white font-bold text-sm">{z.area}</p>
                  <p className="text-white/40 text-xs mt-1 leading-relaxed">{z.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-white/5 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-white font-black text-3xl md:text-5xl tracking-tight text-center mb-14">Fredericksburg Paving FAQs.</h2>
          <div className="space-y-6">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-brand-navy border border-white/10 rounded-2xl p-8">
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
              { label: 'Richmond Paving', to: '/richmond-paving' },
              { label: 'Northern Virginia Paving', to: '/northern-virginia-paving' },
              { label: 'Crack Repair', to: '/crack-repair' },
              { label: 'Parking Lots', to: '/parking-lots' },
              { label: 'Sealcoating', to: '/sealcoating' },
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
          <div className="absolute top-0 right-0 p-8 opacity-10"><Truck size={140} /></div>
          <p className="text-brand-navy/50 font-bold uppercase tracking-widest text-sm mb-3">Serving the I-95 Growth Corridor</p>
          <h2 className="text-brand-navy font-black text-3xl md:text-5xl leading-tight mb-6">
            Don't Let the Boom Pass You By<br />with a Bad Paving Job.
          </h2>
          <p className="text-brand-navy/60 text-lg mb-8 max-w-2xl mx-auto">
            Stafford and Spotsylvania are growing fast. Low-bid contractors are flooding the market. Get a written quote from the Virginia contractor with 40 years of track record.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="tel:+18044461296"
              onClick={() => trackPhoneClick('fredericksburg-cta')}
              className="bg-brand-navy text-white font-black py-4 px-8 rounded-full hover:bg-brand-navy/80 transition-colors"
            >
              Call (804) 446-1296
            </a>
            <Link to="/quote" className="bg-white/20 text-brand-navy font-black py-4 px-8 rounded-full hover:bg-white/30 transition-colors">
              Get Free Estimate
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
