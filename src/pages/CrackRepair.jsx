import React from 'react'
import { Link } from 'react-router-dom'
import { Wrench, MapPin, AlertTriangle, Phone } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SEO from '@/components/SEO'
import { trackPhoneClick } from '@/lib/analytics'

// Virginia-specific crack failure knowledge — this is real local expertise.
const CRACK_TYPES = [
  {
    name: 'Alligator / Fatigue Cracking',
    cause: 'Virginia clay base failure. Water saturates the subbase, freezes in winter, and destroys the structural layer. Common on older Chesterfield and Henrico subdivisions.',
    fix: 'Full-depth reclamation of the failure zone. Patches alone will not hold — the base must be stabilized.',
    severity: 'Critical',
    color: 'text-red-400 bg-red-400/10',
  },
  {
    name: 'Longitudinal Cracking',
    cause: 'Virginia\'s hot summers cause asphalt to expand and contract at seams. Poorly compacted paving joints, common in rushed commercial projects, fail first.',
    fix: 'Hot-pour rubberized crack sealing at 400°F — permanently bonds to the pavement, preventing water infiltration.',
    severity: 'Moderate',
    color: 'text-yellow-400 bg-yellow-400/10',
  },
  {
    name: 'Edge Cracking',
    cause: 'Lack of lateral support at driveway and parking lot edges. Tree roots, soil erosion, and missing curbing let the asphalt edge break away.',
    fix: 'Edge repair with new asphalt extension or curbing + hot-pour sealing of existing cracks.',
    severity: 'Moderate',
    color: 'text-yellow-400 bg-yellow-400/10',
  },
  {
    name: 'Reflective / Block Cracking',
    cause: 'Slab-on-grade overlay failure — cracks from the old surface telegraph through the new layer. Common on older Richmond commercial lots with poor overlay specs.',
    fix: 'Interlayer geotextile fabric + proper depth overlay. Must address the root cause, not just the surface.',
    severity: 'High',
    color: 'text-orange-400 bg-orange-400/10',
  },
  {
    name: 'Transverse Cracking',
    cause: 'Thermal shock from Richmond\'s freeze-thaw cycles. Asphalt contracts in cold and surface tension fails perpendicular to the paving direction.',
    fix: 'Hot-pour rubberized sealant applied in autumn before ground freeze to prevent water intrusion over winter.',
    severity: 'Low-Moderate',
    color: 'text-green-400 bg-green-400/10',
  },
  {
    name: 'Pothole Formation',
    cause: 'End-stage failure. Water enters cracks, freezes, expands, and blows out the asphalt layer. Untreated potholes in Virginia grow 3–5x in one winter season.',
    fix: 'Hot-mix infrared repair or cold-pour patching for emergency response, then full surface evaluation.',
    severity: 'Urgent',
    color: 'text-red-500 bg-red-500/10',
  },
]

const FAQS = [
  {
    q: 'When is crack sealing enough vs. when do I need full replacement?',
    a: 'If less than 25% of the surface shows distress and the base is structurally sound, crack sealing + sealcoating extends life 5–8 years. When you see alligatoring over large areas or potholes forming, the base is failing and resurfacing or full replacement is required. We assess and give you a written recommendation.',
  },
  {
    q: 'What\'s the best time of year to seal cracks in Virginia?',
    a: 'Spring (April–May) or early fall (September–October). Surface temperature must be above 50°F and rising. Avoid sealing in summer heat (above 90°F) when asphalt is already expanded — the sealant won\'t bond correctly.',
  },
  {
    q: 'Does crack repair prevent pothole formation?',
    a: 'Yes — 100% of potholes begin as unsealed cracks. Water enters, freezes, and the expansion destroys the asphalt from within. A $500 crack sealing job prevents a $3,000+ pothole repair in most cases.',
  },
  {
    q: 'What do you use for crack sealing in Virginia?',
    a: 'We use 400°F hot-pour rubberized crack filler — a rubberized asphalt compound that permanently bonds, flexes with temperature changes, and seals out moisture. We do not use cold-pour materials for any permanent repair.',
  },
]

export default function CrackRepair() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: 'Asphalt Crack Repair in Virginia',
        provider: {
          '@type': 'LocalBusiness',
          name: 'J. Worden & Sons Paving LLC',
          url: 'https://www.jwordenasphaltpaving.com/',
          telephone: '+18044461296',
        },
        areaServed: ['Richmond, VA', 'Chesterfield, VA', 'Henrico, VA', 'Midlothian, VA', 'Colonial Heights, VA'],
        serviceType: ['Asphalt crack sealing', 'Pothole repair', 'Alligator crack repair', 'Hot-pour crack filling'],
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
        title="Asphalt Crack Repair in Virginia | Richmond, Chesterfield & Henrico"
        description="Professional asphalt crack sealing and repair in Richmond VA, Chesterfield, Henrico, and Midlothian. Hot-pour rubberized crack filling. Stop pothole formation before it starts. 40+ years of Virginia pavement expertise."
        canonicalPath="/crack-repair"
        jsonLd={jsonLd}
      />
      <Navbar />

      {/* HERO */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, #d97706 0%, transparent 60%)' }} />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2 space-y-6">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 bg-brand-amber/10 text-brand-amber text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  <MapPin className="w-3 h-3" /> Richmond Metro Specialist
                </span>
                <span className="inline-flex items-center gap-1.5 bg-red-400/10 text-red-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  <AlertTriangle className="w-3 h-3" /> Cracks = Pothole Warning
                </span>
              </div>
              <h1 className="font-display font-black text-5xl md:text-7xl text-white leading-tight tracking-tight">
                Stop Cracks.<br /><span className="text-brand-amber">Before They</span><br />Stop You.
              </h1>
              <p className="text-white/70 text-lg md:text-xl max-w-xl">
                Virginia's freeze-thaw cycles and clay soils turn a $400 crack into a $4,000 pothole in one winter season. We seal it right — with industrial hot-pour rubber that actually lasts — not hardware store cold-fill.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <a
                  href="tel:+18044461296"
                  onClick={() => trackPhoneClick('crack-repair-hero')}
                  className="btn-primary py-4 px-8 font-black flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" /> Emergency Response
                </a>
                <Link to="/quote" className="btn-outline py-4 px-8 text-white font-black">
                  Get Free Assessment
                </Link>
              </div>
              {/* Awards */}
              <div className="flex flex-wrap items-center gap-2 pt-4">
                <span className="text-white/30 text-xs uppercase tracking-widest font-bold">Awards:</span>
                <span className="bg-brand-amber/10 text-brand-amber text-xs font-bold px-3 py-1.5 rounded-full">🏆 Pavement Mag Top 75</span>
                <span className="bg-white/10 text-white/80 text-xs font-bold px-3 py-1.5 rounded-full">⭐ Best of Houzz</span>
                <span className="bg-white/10 text-white/80 text-xs font-bold px-3 py-1.5 rounded-full">🎖 2026 Top Contractor Nominee</span>
              </div>
            </div>

            {/* Cost comparison card */}
            <div className="lg:w-1/2">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
                <h3 className="text-white font-black text-xl">The Virginia Cost Reality</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Hot-pour crack sealing (now)', cost: '$300–$800', color: 'text-green-400 bg-green-400/10' },
                    { label: 'Sealcoating after sealing', cost: '$0.15–$0.25/sqft', color: 'text-brand-amber bg-brand-amber/10' },
                    { label: 'Pothole repair (if you wait)', cost: '$800–$2,500', color: 'text-orange-400 bg-orange-400/10' },
                    { label: 'Full resurfacing (if base fails)', cost: '$3–$6/sqft', color: 'text-red-400 bg-red-400/10' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-white/70 text-sm">{row.label}</span>
                      <span className={`text-xs font-black px-3 py-1 rounded-full ${row.color}`}>{row.cost}</span>
                    </div>
                  ))}
                </div>
                <p className="text-white/30 text-xs">Based on Richmond VA metro market pricing, May 2026.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CRACK TYPE DIAGNOSTIC */}
      <section className="py-24 bg-white/5 border-y border-white/10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-brand-amber/10 text-brand-amber text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">Virginia Pavement Diagnostics</span>
            <h2 className="text-white font-black text-3xl md:text-5xl tracking-tight">Know Your Crack Type.<br />Know Your Fix.</h2>
            <p className="text-white/40 mt-4 max-w-2xl mx-auto">Virginia's climate creates specific failure patterns. Our crews diagnose the root cause — not just the symptom — before we quote the fix.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CRACK_TYPES.map((crack, i) => (
              <div key={i} className="bg-brand-navy border border-white/10 rounded-2xl p-7 hover:border-brand-amber/30 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-black text-base">{crack.name}</h3>
                  <span className={`text-xs font-black px-2 py-1 rounded-full ${crack.color}`}>{crack.severity}</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-white/30 text-xs uppercase tracking-widest mb-1">Root Cause</p>
                    <p className="text-white/60 text-xs leading-relaxed">{crack.cause}</p>
                  </div>
                  <div>
                    <p className="text-white/30 text-xs uppercase tracking-widest mb-1">Our Fix</p>
                    <p className="text-brand-amber/80 text-xs leading-relaxed">{crack.fix}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-white font-black text-3xl md:text-5xl tracking-tight text-center mb-14">Virginia Crack Repair FAQs.</h2>
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
          <div className="absolute top-0 right-0 p-8 opacity-10"><Wrench size={140} /></div>
          <h2 className="text-brand-navy font-black text-3xl md:text-5xl leading-tight mb-6">
            See a Crack? Call Today.
          </h2>
          <p className="text-brand-navy/60 text-lg mb-8 max-w-2xl mx-auto">
            Every week you wait, Virginia's weather does the work for us — and against you. Emergency same-day response in Chesterfield, Henrico, Richmond City, and all surrounding metro areas.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="tel:+18044461296"
              onClick={() => trackPhoneClick('crack-repair-cta')}
              className="bg-brand-navy text-white font-black py-4 px-8 rounded-full hover:bg-brand-navy/80 transition-colors"
            >
              Call (804) 446-1296
            </a>
            <Link to="/quote" className="bg-white/20 text-brand-navy font-black py-4 px-8 rounded-full hover:bg-white/30 transition-colors">
              Free Inspection
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
