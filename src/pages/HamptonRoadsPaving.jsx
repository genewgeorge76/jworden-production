import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, ShieldCheck, Building2, Phone, Waves } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SEO from '@/components/SEO'
import { trackPhoneClick } from '@/lib/analytics'

// Virginia Beach / Hampton Roads — 40 years of coastal commercial experience.
// Real commercial corridors: Military Highway, Virginia Beach Blvd, Town Center, Atlantic Ave hotel strip.
const COMMERCIAL_CORRIDORS = [
  {
    area: 'Virginia Beach Town Center',
    detail: 'High-volume commercial lot paving around the Central Business District, Convention Center, and Pembroke Mall. We navigate business-hours restrictions and phase work to keep retail open.',
  },
  {
    area: 'Military Highway (US-13) Corridor',
    detail: 'Chesapeake\'s primary commercial spine. We have paved dozens of strip mall, fast food, and big-box lots along Military Highway from Indian River Road to the Bypass.',
  },
  {
    area: 'Naval Station Norfolk & Military Bases',
    detail: 'Federally contracted paving on the world\'s largest naval station, NAS Oceana, and Joint Base Langley-Eustis. Bonded, insured, and cleared for base access.',
  },
  {
    area: 'Atlantic Ave Hotel & Resort Corridor',
    detail: 'Oceanfront hotel parking lots face salt air, sand abrasion, and extreme seasonal traffic. We spec heavy-duty mixes and accelerated seal schedules for coastal conditions.',
  },
  {
    area: 'Chesapeake & Suffolk Industrial',
    detail: 'Heavy industrial yard paving for logistics, warehousing, and manufacturing facilities off Greenbrier Road, I-464, and Route 58 in Chesapeake and Suffolk.',
  },
  {
    area: 'Newport News & Hampton',
    detail: 'Shipyard support facility paving, retail corridor work on Jefferson Avenue, and residential neighborhoods in Hampton and Newport News.',
  },
]

const COASTAL_CHALLENGES = [
  { issue: 'Salt Air Oxidation', fix: 'Polymer-modified binder and coal-tar emulsion sealcoating — protects the asphalt binder from salt-driven oxidation and UV degradation in coastal exposure zones.' },
  { issue: 'High Water Table', fix: 'Extended drainage engineering near the oceanfront and tidal areas. French drain integration and proper subbase specification prevent subgrade saturation.' },
  { issue: 'Sand Infiltration', fix: 'Closed-face surface mixes (SM-9.5A) resist sand infiltration that destroys open-graded surfaces. We spec for your proximity to the beach.' },
  { issue: 'Heavy Truck Traffic', fix: 'Military logistics and port traffic requires truck-rated pavement design. We increase base depth and use PG 76-22 high-performance binder for heavy haul routes.' },
]

const FAQS = [
  {
    q: 'Do you serve Virginia Beach, Norfolk, Chesapeake, and Suffolk?',
    a: 'Yes. Our Hampton Roads service area covers Virginia Beach, Norfolk, Chesapeake, Suffolk, Portsmouth, Newport News, Hampton, and all of the Peninsula and Southside. We mobilize crews for this region and have active commercial accounts throughout the metro.',
  },
  {
    q: 'Can you pave oceanfront parking lots and hotel properties?',
    a: 'Yes — and this is a specialty. Coastal asphalt takes more abuse than inland pavement. We spec appropriate mixes, seal more frequently, and use drainage designs built for oceanfront conditions. We have paved multiple resort and hotel lots on Atlantic Avenue.',
  },
  {
    q: 'Are you cleared for military base paving contracts?',
    a: 'Yes. We have performed paving work at multiple federal and military installations in Virginia. We maintain appropriate bonding, insurance, and clearance documentation for base access and government contracts.',
  },
  {
    q: 'How does saltwater air affect asphalt differently than inland pavement?',
    a: 'Salt accelerates oxidation of the asphalt binder, making pavement brittle faster. Combined with UV exposure and temperature swings, oceanfront lots deteriorate 30–40% faster than comparable inland properties. Sealcoating every 2–3 years (vs. 4–5 inland) is the standard maintenance spec for Virginia Beach properties.',
  },
]

export default function HamptonRoadsPaving() {
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
          { '@type': 'City', name: 'Virginia Beach', containedInPlace: { '@type': 'State', name: 'Virginia' } },
          { '@type': 'City', name: 'Norfolk', containedInPlace: { '@type': 'State', name: 'Virginia' } },
          { '@type': 'City', name: 'Chesapeake', containedInPlace: { '@type': 'State', name: 'Virginia' } },
          { '@type': 'City', name: 'Newport News', containedInPlace: { '@type': 'State', name: 'Virginia' } },
          { '@type': 'City', name: 'Hampton', containedInPlace: { '@type': 'State', name: 'Virginia' } },
        ],
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.jwordenasphaltpaving.com/' },
          { '@type': 'ListItem', position: 2, name: 'Service Areas', item: 'https://www.jwordenasphaltpaving.com/services' },
          { '@type': 'ListItem', position: 3, name: 'Hampton Roads & Virginia Beach', item: 'https://www.jwordenasphaltpaving.com/hampton-roads-paving' },
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
        title="Asphalt Paving Virginia Beach & Hampton Roads | Commercial Contractor"
        description="40 years of commercial paving in Hampton Roads. Virginia Beach, Norfolk, Chesapeake, Newport News, and Hampton. Hotel lots, military base contracts, retail corridors. Coastal-spec asphalt that outlasts salt air and sand."
        canonicalPath="/hampton-roads-paving"
        jsonLd={jsonLd}
      />
      <Navbar />

      {/* HERO */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #d97706 0%, transparent 55%)' }} />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-3/5 space-y-6">
              <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-white/30 text-xs">
                <Link to="/" className="hover:text-white/60 transition-colors">Home</Link>
                <span>/</span>
                <Link to="/services" className="hover:text-white/60 transition-colors">Services</Link>
                <span>/</span>
                <span className="text-white/60">Hampton Roads</span>
              </nav>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 bg-brand-amber/10 text-brand-amber text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  <Waves className="w-3 h-3" /> Coastal Specialist
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  <ShieldCheck className="w-3 h-3" /> Military Base Cleared
                </span>
              </div>
              <h1 className="font-display font-black text-5xl md:text-7xl text-white leading-tight tracking-tight">
                Hampton Roads'<br /><span className="text-brand-amber">Commercial</span><br />Paving Experts.
              </h1>
              <p className="text-white/70 text-xl max-w-2xl">
                Virginia Beach hotel lots. Military Highway retail strips. Naval Station Norfolk. Joint Base Langley-Eustis. We have paved the commercial corridors of Hampton Roads for decades — and we know coastal asphalt spec better than anyone in Virginia.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <a
                  href="tel:+18044461296"
                  onClick={() => trackPhoneClick('hampton-roads-hero')}
                  className="btn-primary py-4 px-8 font-black flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" /> (804) 446-1296
                </a>
                <Link to="/quote" className="btn-outline py-4 px-8 text-white font-black">Free Commercial Quote</Link>
              </div>
              <div className="grid grid-cols-4 gap-4 pt-6 border-t border-white/10">
                {[
                  { val: '40+', label: 'Years Serving HR' },
                  { val: '4.9★', label: 'Avg Rating' },
                  { val: 'Base', label: 'Access Cleared' },
                  { val: 'VDOT', label: 'Prequalified' },
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

            {/* Coastal challenge cards */}
            <div className="lg:w-2/5">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-5">
                <h2 className="text-white font-black text-lg">Why Coastal Paving Is Different.</h2>
                <p className="text-white/40 text-xs">Virginia Beach asphalt faces threats inland paving never sees.</p>
                {COASTAL_CHALLENGES.map((c, i) => (
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

      {/* COMMERCIAL CORRIDORS */}
      <section className="py-24 bg-white/5 border-y border-white/10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-brand-amber/10 text-brand-amber text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">Active Commercial Coverage</span>
            <h2 className="text-white font-black text-3xl md:text-5xl tracking-tight">We Know These Roads.<br />Not Just the ZIP Code.</h2>
            <p className="text-white/40 mt-4 max-w-2xl mx-auto">
              Decades of commercial paving across every major corridor in Hampton Roads. This is real experience — not a service-area map we drew to grab clicks.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {COMMERCIAL_CORRIDORS.map((c, i) => (
              <div key={i} className="bg-brand-navy border border-white/10 rounded-2xl p-7 hover:border-brand-amber/30 transition-all group">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-4 h-4 text-brand-amber flex-shrink-0" />
                  <h3 className="text-white font-black text-base">{c.area}</h3>
                </div>
                <p className="text-white/50 text-sm leading-relaxed">{c.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ — Google FAQPage schema target */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-white font-black text-3xl md:text-5xl tracking-tight">Hampton Roads Paving FAQs.</h2>
          </div>
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

      {/* INTERNAL LINKS — SEO signal */}
      <section className="py-12 px-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <p className="text-white/30 text-xs uppercase tracking-widest font-bold mb-5">Related Services</p>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Parking Lot Paving', to: '/parking-lots' },
              { label: 'Asphalt Crack Repair', to: '/crack-repair' },
              { label: 'Richmond Commercial', to: '/richmond-paving' },
              { label: 'Chesterfield Paving', to: '/chesterfield-paving' },
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
          <div className="absolute top-0 right-0 p-8 opacity-10"><Building2 size={140} /></div>
          <p className="text-brand-navy/50 font-bold uppercase tracking-widest text-sm mb-3">Hampton Roads Commercial Paving</p>
          <h2 className="text-brand-navy font-black text-3xl md:text-5xl leading-tight mb-6">
            Virginia Beach to Newport News.<br />One Contractor. 40 Years.
          </h2>
          <p className="text-brand-navy/60 text-lg mb-8 max-w-2xl mx-auto">
            Whether it's a hotel lot on Atlantic Ave or a military facility in Norfolk — we have the experience, clearance, and coastal expertise to do it right.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="tel:+18044461296"
              onClick={() => trackPhoneClick('hampton-roads-cta')}
              className="bg-brand-navy text-white font-black py-4 px-8 rounded-full hover:bg-brand-navy/80 transition-colors"
            >
              Call (804) 446-1296
            </a>
            <Link to="/quote" className="bg-white/20 text-brand-navy font-black py-4 px-8 rounded-full hover:bg-white/30 transition-colors">
              Request Commercial Quote
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
