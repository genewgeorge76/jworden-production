import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ParkingSquare, ShieldCheck, Zap, Ruler, CheckCircle2, Car, Building2, Truck } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import QuoteBlock from '@/components/QuoteBlock'
import SEO from '@/components/SEO'
import { trackPhoneClick } from '@/lib/analytics'
import { legacyPortfolioImages } from '@/data/legacyPortfolio'

// Real Richmond-area commercial references — the kind of properties we serve.
const LOCAL_ACCOUNTS = [
  { name: 'KFC Franchise Sites', region: 'Multi-state QSR work', note: 'Parking lots, drive-thru lanes, ADA layout, sealcoating, resurfacing, and documented project photos.' },
  { name: 'Taco Bell Restaurant Lots', region: 'Commercial restaurant work', note: 'Drive-thru circulation, customer access, tight scheduling, patching, and striping around active operations.' },
  { name: 'Arby\'s Restaurant Lots', region: 'Commercial restaurant work', note: 'Restaurant parking and access lanes where clean turnover and customer flow matter.' },
  { name: 'CVS / Rite Aid Style Retail', region: 'Virginia retail lots', note: 'Retail parking lots, ADA upgrades, resurfacing, patching, and line layout for daily customer traffic.' },
  { name: 'Richmond Metro Commercial Corridors', region: 'Chester, Richmond, Henrico, Chesterfield', note: 'Local lots, offices, churches, schools, HOAs, and active business sites.' },
  { name: 'Industrial And Service Yards', region: 'Central Virginia', note: 'Heavier traffic areas, loading movements, base failure repair, and practical phasing.' },
]

const SERVICES = [
  {
    icon: <Truck className="w-5 h-5 text-brand-amber" />,
    title: 'Full-Depth Reclamation',
    desc: 'When the base is failed, we don\'t just resurface — we reclaim. Cold-in-place recycling and full-depth replacement for parking lots that have hit the end of their lifecycle.',
  },
  {
    icon: <Ruler className="w-5 h-5 text-brand-amber" />,
    title: 'Mill & Overlay',
    desc: 'Precision milling to remove the failed top layer, then machine-laid asphalt resurfacing. The cost-effective answer to oxidized, cracked, or uneven lots.',
  },
  {
    icon: <ParkingSquare className="w-5 h-5 text-brand-amber" />,
    title: 'Line Striping & ADA Compliance',
    desc: 'Federal ADA-compliant striping, handicap spaces, fire lanes, directional arrows, and loading zones. We pull the permits so you don\'t have to.',
  },
  {
    icon: <ShieldCheck className="w-5 h-5 text-brand-amber" />,
    title: 'Sealcoating & Crack Filling',
    desc: 'Coal-tar emulsion sealcoating + hot-pour rubberized crack sealing applied as a unified maintenance system to protect your investment for 5–8 years.',
  },
  {
    icon: <Zap className="w-5 h-5 text-brand-amber" />,
    title: 'Drainage Engineering',
    desc: 'Virginia clay soils are the #1 enemy of parking lot asphalt. We regrade, install French drains, and add catch basin infrastructure to stop water from destroying your base.',
  },
  {
    icon: <Building2 className="w-5 h-5 text-brand-amber" />,
    title: 'Phased Active-Property Scheduling',
    desc: 'Your business never closes for paving. We section lots, coordinate with tenants, and execute overnight or weekend work to eliminate revenue disruption.',
  },
]

const FAQS = [
  {
    q: 'How long does a parking lot last in Virginia\'s climate?',
    a: 'Virginia\'s freeze-thaw cycle and humid summers accelerate asphalt oxidation. A properly installed commercial lot lasts 20–25 years with a sealcoating program every 3–5 years. Without maintenance, failure begins at 8–12 years.',
  },
  {
    q: 'What\'s the difference between a patch and a mill & overlay?',
    a: 'Patches address isolated failures. Mill & overlay removes the top 1.5–2" of the entire surface and replaces it — restoring structural integrity and appearance statewide. For lots with widespread cracking or severe alligatoring, patches alone are money wasted.',
  },
  {
    q: 'Can you pave around active businesses in Richmond?',
    a: 'Yes — this is our specialty. We work nights and weekends, use temporary signage and traffic control, and phase the project so your tenants and customers are never blocked.',
  },
  {
    q: 'Do you handle ADA parking lot compliance in Virginia?',
    a: 'Yes. We apply current VDOT and federal ADA standards for space width, access aisle dimensions, signage placement, and slope requirements. Non-compliant lots create liability exposure — we eliminate it.',
  },
]

export default function ParkingLots() {
  const commercialImg = legacyPortfolioImages.find(img => img.category === 'Commercial')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: 'Parking Lot Paving in Richmond, VA',
        provider: {
          '@type': 'LocalBusiness',
          name: 'J. Worden & Sons Paving LLC',
          url: 'https://www.jwordenasphaltpaving.com/',
          telephone: '+18044461296',
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Chester',
            addressRegion: 'VA',
            addressCountry: 'US',
          },
        },
        areaServed: [
          { '@type': 'City', name: 'Richmond', containedInPlace: { '@type': 'State', name: 'Virginia' } },
          { '@type': 'City', name: 'Midlothian', containedInPlace: { '@type': 'State', name: 'Virginia' } },
          { '@type': 'City', name: 'Chesterfield', containedInPlace: { '@type': 'State', name: 'Virginia' } },
          { '@type': 'City', name: 'Henrico', containedInPlace: { '@type': 'State', name: 'Virginia' } },
          { '@type': 'City', name: 'Colonial Heights', containedInPlace: { '@type': 'State', name: 'Virginia' } },
        ],
        serviceType: ['Parking lot paving', 'Mill and overlay', 'ADA striping', 'Sealcoating', 'Full-depth reclamation'],
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

  const heroVideoRef = useRef(null)
  useEffect(() => {
    if (heroVideoRef.current) {
      heroVideoRef.current.playbackRate = 0.6
    }
  }, [])

  return (
    <div className="min-h-screen bg-brand-navy">
      <SEO
        title="Commercial Parking Lot Paving Richmond VA | KFC, Taco Bell & Arby's Proof"
        description="Commercial asphalt paving, parking lot resurfacing, drive-thru lanes, ADA striping, sealcoating, and repairs for Richmond, Chesterfield, Henrico, and..."
        canonicalPath="/parking-lots"
        jsonLd={jsonLd}
      />
      <Navbar />

      {/* HERO */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Subtle grid bg */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 60px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 60px)' }} />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row gap-12 items-start">
            <div className="lg:w-1/2 space-y-6">
              <div className="flex flex-wrap gap-2">
                <span className="inline-block bg-brand-amber/10 text-brand-amber text-xs font-bold uppercase tracking-[0.08em] px-3 py-1 rounded-full">
                  Commercial Parking Lots
                </span>
                <span className="inline-block bg-green-500/10 text-green-400 text-xs font-bold uppercase tracking-[0.08em] px-3 py-1 rounded-full">
                  KFC • Taco Bell • Arby's Proof
                </span>
              </div>
              <h1 className="font-display font-bold text-5xl md:text-7xl text-white leading-tight tracking-tight">
                Commercial<br /><span className="text-brand-amber">Parking Lot Paving</span><br />in Virginia.
              </h1>
              <p className="text-white/70 text-lg md:text-xl max-w-xl">
                Restaurant, retail, office, church, HOA, industrial, and active commercial lots need more than fresh blacktop. They need access planning, drainage, ADA layout, striping, drive-thru durability, and a crew that knows how to work around customers.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <a
                  href="tel:+18044461296"
                  onClick={() => trackPhoneClick('parking-lot-hero')}
                  className="btn-primary py-4 px-8 flex items-center gap-2 text-base font-bold"
                >
                  <Car className="w-4 h-4" /> Call (804) 446-1296
                </a>
                <a href="#quote" className="btn-outline py-4 px-8 text-white text-base font-bold">
                  Free Lot Assessment
                </a>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
                <div className="text-center">
                  <p className="text-brand-amber font-bold text-2xl">40+</p>
                  <p className="text-white/40 text-xs uppercase tracking-[0.08em]">Years in the trade</p>
                </div>
                <div className="text-center">
                  <p className="text-brand-amber font-bold text-2xl">500+</p>
                  <p className="text-white/40 text-xs uppercase tracking-[0.08em]">QSR photos on file</p>
                </div>
                <div className="text-center">
                  <p className="text-brand-amber font-bold text-2xl">ADA</p>
                  <p className="text-white/40 text-xs uppercase tracking-[0.08em]">Code Certified</p>
                </div>
              </div>
              {/* Awards */}
              <div className="flex flex-wrap items-center gap-2 pt-4">
                <span className="text-white/30 text-xs uppercase tracking-[0.08em] font-bold">Proof:</span>
                <span className="bg-brand-amber/10 text-brand-amber text-xs font-bold px-3 py-1.5 rounded-full">KFC program photos</span>
                <span className="bg-white/10 text-white/80 text-xs font-bold px-3 py-1.5 rounded-full">Restaurant drive-thru lanes</span>
                <span className="bg-white/10 text-white/80 text-xs font-bold px-3 py-1.5 rounded-full">Retail parking lots</span>
              </div>
            </div>

            {/* Right — Image + floating stat */}
            <div className="lg:w-1/2 relative">
              <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black h-[480px]">
                <video
                  ref={heroVideoRef}
                  className="w-full h-full object-cover"
                  src="/videos/parking-lot.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster={commercialImg?.url || undefined}
                  aria-label="Commercial parking lot paving in progress"
                >
                  Your browser does not support embedded video.
                </video>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-brand-amber rounded-2xl p-6 shadow-xl">
                <p className="text-brand-navy font-bold text-4xl leading-none">20yr</p>
                <p className="text-brand-navy/70 text-xs font-bold uppercase tracking-[0.08em] mt-1">Life Expectancy<br />When Done Right</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOCAL ACCOUNTS — Social Proof with Real Richmond Geography */}
      <section className="py-20 bg-white/5 border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block bg-brand-amber/10 text-brand-amber text-xs font-bold uppercase tracking-[0.08em] px-3 py-1 rounded-full mb-4">Commercial Proof</span>
            <h2 className="text-white font-bold text-3xl md:text-5xl tracking-tight">Restaurant And Retail Work Is Our Proof.</h2>
            <p className="text-white/40 mt-4 max-w-2xl mx-auto">KFC, Taco Bell, Arby's, CVS/Rite Aid-style retail, and local commercial lots all require the same discipline: clear scope, safe access, durable sections, and a finish that represents the business well.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {LOCAL_ACCOUNTS.map((acct, i) => (
              <div key={i} className="bg-brand-navy border border-white/10 rounded-2xl p-6 hover:border-brand-amber/40 transition-all">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-brand-amber flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-white font-bold text-sm">{acct.name}</p>
                    <p className="text-brand-amber/70 text-xs font-semibold uppercase tracking-[0.08em] mt-1">{acct.region}</p>
                    <p className="text-white/40 text-xs mt-2 leading-relaxed">{acct.note}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES GRID */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-white font-bold text-3xl md:text-5xl tracking-tight mb-4">Commercial Lot Services That Keep Sites Open.</h2>
            <p className="text-white/40 max-w-2xl mx-auto">Repair the failed areas, preserve the good pavement, resurface when it makes sense, and rebuild when the base is gone.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SERVICES.map((svc, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-brand-amber/30 transition-all group">
                <div className="bg-brand-amber/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {svc.icon}
                </div>
                <h3 className="text-white font-bold text-xl mb-3 tracking-tight">{svc.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{svc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white/5 border-t border-white/10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-white font-bold text-3xl md:text-5xl tracking-tight">Virginia Parking Lot FAQs.</h2>
          </div>
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

      {/* VIRGINIA COMMERCIAL EXPERTISE */}
      <section className="py-24 bg-brand-navy border-t border-white/10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <span className="inline-block bg-brand-amber/10 text-brand-amber text-xs font-bold uppercase tracking-[0.08em] px-3 py-1 rounded-full mb-4">Virginia Commercial Pavement Science</span>
              <h2 className="text-white font-bold text-3xl md:text-5xl tracking-tight mb-6">
                Why Virginia Parking Lots Fail — And What We Do Differently.
              </h2>
              <div className="space-y-4 text-white/60 text-sm leading-relaxed">
                <p>Virginia's commercial parking lots face a specific set of failure conditions that most paving companies underestimate. Richmond clay soils — prevalent from Chesterfield through Henrico and into the city itself — have high shrink-swell potential. In wet seasons, clay expands and pushes the base material upward. In dry summers, it contracts and pulls support away from the mat. Lots built without proper subbase drainage fail through the bottom, not the top, and no amount of surface patching corrects a base that's moving.</p>
                <p>Our commercial spec always begins with a drainage evaluation. We identify low points, broken catch basins, missing French drains, and clay-dominant subbase zones before we quote the job. The drainage solution is part of the project cost — not a surprise add-on that appears after the lot is stripped. Virginia's commercial lots that fail prematurely almost always share one cause: inadequate base drainage that was never corrected at construction time.</p>
                <p>For active commercial properties — restaurants, retail centers, churches, office parks — we execute phased projects that keep customers and tenants moving throughout the job. We use temporary traffic control, section off active work zones, and coordinate night and weekend shifts to match your operational needs. A parking lot project should not cost you a single day of revenue.</p>
                <p>After installation, a managed <Link to="/sealcoating" className="text-brand-amber hover:underline">sealcoating program every 3–5 years</Link> and routine <Link to="/crack-repair" className="text-brand-amber hover:underline">crack sealing</Link> whenever thermal cracks appear protect a 20–25 year life expectancy on properly built commercial asphalt. We provide a written maintenance schedule with every completed lot.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-white font-bold text-base uppercase tracking-[0.08em] mb-4">Commercial Markets We Serve</p>
                <div className="grid grid-cols-2 gap-2 text-sm text-white/60">
                  {[
                    'Richmond City', 'Chester & Chesterfield',
                    'Henrico & Short Pump', 'Midlothian & Bon Air',
                    'Colonial Heights', 'Mechanicsville & Hanover',
                    'Petersburg & Hopewell', 'Glen Allen & Innsbrook',
                    'Hampton Roads', 'Northern Virginia',
                    'Fredericksburg Corridor', 'Shenandoah Valley',
                  ].map((city) => (
                    <div key={city} className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-amber shrink-0" />
                      <span>{city}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-white font-bold text-base uppercase tracking-[0.08em] mb-3">Related Services</p>
                <div className="flex flex-wrap gap-2">
                  <Link to="/sealcoating" className="border border-white/20 text-brand-amber text-xs font-bold tracking-[0.08em] uppercase px-3 py-1.5 hover:bg-white/10 transition-colors rounded-full">Sealcoating</Link>
                  <Link to="/crack-repair" className="border border-white/20 text-brand-amber text-xs font-bold tracking-[0.08em] uppercase px-3 py-1.5 hover:bg-white/10 transition-colors rounded-full">Crack Repair</Link>
                  <Link to="/paving" className="border border-white/20 text-brand-amber text-xs font-bold tracking-[0.08em] uppercase px-3 py-1.5 hover:bg-white/10 transition-colors rounded-full">Asphalt Paving</Link>
                  <Link to="/residential" className="border border-white/20 text-brand-amber text-xs font-bold tracking-[0.08em] uppercase px-3 py-1.5 hover:bg-white/10 transition-colors rounded-full">Driveway Paving</Link>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-white font-bold text-base uppercase tracking-[0.08em] mb-2">4th Generation. Since 1984.</p>
                <p className="text-white/50 text-sm leading-relaxed">Family-owned and operated out of Chester, Virginia. No project management layers, no subcontracted crews, no national franchise pricing. The owner reviews your scope, your crew knows the layout, and your lot is treated like it belongs to someone who cares.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto bg-brand-amber rounded-[2.5rem] p-12 md:p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10"><ParkingSquare size={140} /></div>
          <h2 className="text-brand-navy font-bold text-3xl md:text-5xl leading-tight mb-6">
            Ready for a Free Parking Lot Assessment?
          </h2>
          <p className="text-brand-navy/60 text-lg mb-8 max-w-2xl mx-auto">
            We walk the property, identify failure zones, and give you a written scope — no sales pressure. Serving Chesterfield, Henrico, Richmond City, Colonial Heights, and all Richmond-metro counties.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="tel:+18044461296"
              onClick={() => trackPhoneClick('parking-lot-cta')}
              className="bg-brand-navy text-white font-bold py-4 px-8 rounded-full hover:bg-brand-navy/80 transition-colors"
            >
              Call (804) 446-1296
            </a>
            <a href="#quote" className="bg-white/20 text-brand-navy font-bold py-4 px-8 rounded-full hover:bg-white/30 transition-colors">
              Request Free Estimate
            </a>
          </div>
        </div>
      </section>

      <QuoteBlock
        source="service_parking_lots"
        heading="Get a Parking Lot Estimate"
        intro="Send the lot and the hours it has to stay open. We phase commercial work so the doors never close, and the estimate says which nights we are on site."
      />

      <Footer />
    </div>
  )
}
