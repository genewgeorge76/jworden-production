import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Construction, Home, Phone, Star } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SEO from '@/components/SEO'
import { trackPhoneClick } from '@/lib/analytics'

// Chesterfield's real geography. This is what ranks.
const CHESTERFIELD_ZONES = [
  { area: 'Midlothian', detail: 'Route 60 corridor commercial paving, Midlothian Pkwy retail, and established subdivision driveways.' },
  { area: 'Chester / Route 10', detail: 'Our home base. We know the soil conditions, drainage patterns, and HOA requirements on every road.' },
  { area: 'Brandermill & Woodlake', detail: 'Award-winning HOA communities with strict standards. We\'ve maintained dozens of driveways and community roads here.' },
  { area: 'Swift Creek / Moseley', detail: 'Fast-growing subdivision area with new driveways and commercial pads. Clay soil management is critical here.' },
  { area: 'Colonial Heights / Petersburg Corridor', detail: 'Heavy commercial and industrial paving along the Route 1 and Rte 36 commercial corridors.' },
  { area: 'Matoaca & South Chesterfield', detail: 'Rural residential driveways and large commercial yard paving for agricultural and logistics operations.' },
]

const SERVICES = [
  { title: 'Chesterfield Residential Driveways', desc: 'Grade-A asphalt driveways built for Chesterfield\'s clay soil. 6" compacted 21-A base, machine-laid surface course, and clean edges every time.' },
  { title: 'HOA & Community Roads', desc: 'Private road resurfacing, subdivision maintenance, and HOA common area paving for Chesterfield\'s premier communities.' },
  { title: 'Commercial Lot Paving', detail: 'From Route 360 retail to Chester industrial yards — phased commercial paving with ADA striping and drainage engineering.' },
  { title: 'Parking Lot Sealcoating', desc: 'Coal-tar emulsion sealcoating + hot-pour crack sealing. Chesterfield commercial lots protected for 5–8 years per application.' },
  { title: 'Emergency Pothole Repair', desc: 'Same-day emergency response throughout Chesterfield County. We dispatch from Chester — fastest response times in the county.' },
  { title: 'VDOT Secondary Roads', desc: 'County road and VDOT secondary road paving. We maintain licenses, bonds, and insurance for all public right-of-way work in Chesterfield.' },
]

const FAQS = [
  {
    q: 'Are you based in Chesterfield County?',
    a: 'Yes. J. Worden & Sons is headquartered in Chester, VA (Chesterfield County). We are a local company — not a national franchise dispatching from hours away. Our crews live here and respond fast.',
  },
  {
    q: 'What\'s the best asphalt for Chesterfield driveways?',
    a: 'SM-9.5A surface course over 21-A crushed stone base compacted to 6". Chesterfield\'s clay soil retains water and shifts seasonally — the base depth is not optional. We never cut base corners.',
  },
  {
    q: 'Do you work in Midlothian, Brandermill, and Woodlake?',
    a: 'Yes — these are among our most active service areas. We\'re familiar with HOA requirements in Brandermill and Woodlake and have maintained community infrastructure in both neighborhoods.',
  },
  {
    q: 'Can you pave around tree roots in older Chesterfield neighborhoods?',
    a: 'Yes. Root management, raised asphalt removal, and root barrier installation is part of our residential paving scope in established neighborhoods. We assess root encroachment before quoting.',
  },
]

export default function ChesterfieldPaving() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
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
        geo: { '@type': 'GeoCoordinates', latitude: 37.3550, longitude: -77.4410 },
        areaServed: { '@type': 'County', name: 'Chesterfield County', containedInPlace: { '@type': 'State', name: 'Virginia' } },
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
        title="Asphalt Paving Chesterfield VA | Local Contractor — Chester Based"
        description="J. Worden & Sons is Chesterfield County's local asphalt paving contractor. Based in Chester, VA. Driveways, parking lots, HOA roads, and emergency repairs. Midlothian, Brandermill, Woodlake, and all of Chesterfield."
        canonicalPath="/chesterfield-paving"
        jsonLd={jsonLd}
      />
      <Navbar />

      {/* HERO */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute left-0 top-0 w-full h-full bg-gradient-to-br from-brand-amber/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-1/2 space-y-6">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 bg-brand-amber/10 text-brand-amber text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  <MapPin className="w-3 h-3" /> Headquartered in Chester, VA
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  <Home className="w-3 h-3" /> Local. Not a Franchise.
                </span>
              </div>
              <h1 className="font-display font-black text-5xl md:text-7xl text-white leading-tight tracking-tight">
                Chesterfield's<br /><span className="text-brand-amber">Home Court</span><br />Paving Crew.
              </h1>
              <p className="text-white/70 text-xl max-w-xl">
                We're not from out of town. We're from Chester. We pave the roads, driveways, and commercial lots of the county where we live — Midlothian to Matoaca, Brandermill to the Route 1 corridor. 40 years of local knowledge you can't fake.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <a
                  href="tel:+18044461296"
                  onClick={() => trackPhoneClick('chesterfield-hero')}
                  className="btn-primary py-4 px-8 font-black flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" /> (804) 446-1296
                </a>
                <Link to="/quote" className="btn-outline py-4 px-8 text-white font-black">Free Local Estimate</Link>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
                {[
                  { val: 'Chester', label: 'Our Home Base' },
                  { val: '40+', label: 'Years Here' },
                  { val: '#1', label: 'Local Choice' },
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

            {/* Right side — Service zone map visualization */}
            <div className="lg:w-1/2 space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                <h3 className="text-white/50 text-xs uppercase tracking-widest font-bold mb-6">Chesterfield Service Zones — Active Coverage</h3>
                <div className="space-y-3">
                  {CHESTERFIELD_ZONES.map((zone, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-brand-amber mt-2 flex-shrink-0" />
                      <div>
                        <p className="text-white font-bold text-sm">{zone.area}</p>
                        <p className="text-white/40 text-xs mt-0.5 leading-relaxed">{zone.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-24 bg-white/5 border-y border-white/10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-white font-black text-3xl md:text-5xl tracking-tight mb-4">Everything Your Property Needs.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SERVICES.map((svc, i) => (
              <div key={i} className="bg-brand-navy border border-white/10 rounded-3xl p-8 hover:border-brand-amber/30 transition-all group">
                <Construction className="w-8 h-8 text-brand-amber mb-5 group-hover:scale-110 transition-transform" />
                <h3 className="text-white font-black text-xl mb-3">{svc.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{svc.desc || svc.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-white font-black text-3xl md:text-5xl tracking-tight text-center mb-14">Chesterfield Paving FAQs.</h2>
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

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto bg-brand-amber rounded-[2.5rem] p-12 md:p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Star size={140} /></div>
          <p className="text-brand-navy/50 font-bold uppercase tracking-widest text-sm mb-3">Chesterfield's Local Contractor</p>
          <h2 className="text-brand-navy font-black text-3xl md:text-5xl leading-tight mb-6">
            Neighbor to Neighbor.<br />No Middleman. No Franchise.
          </h2>
          <p className="text-brand-navy/60 text-lg mb-8 max-w-2xl mx-auto">
            Call the Chester-based crew. We respond faster because we live here. Serving all of Chesterfield County — Midlothian, Chester, Colonial Heights, and beyond.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="tel:+18044461296"
              onClick={() => trackPhoneClick('chesterfield-cta')}
              className="bg-brand-navy text-white font-black py-4 px-8 rounded-full hover:bg-brand-navy/80 transition-colors"
            >
              Call (804) 446-1296
            </a>
            <Link to="/quote" className="bg-white/20 text-brand-navy font-black py-4 px-8 rounded-full hover:bg-white/30 transition-colors">
              Free Estimate
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
