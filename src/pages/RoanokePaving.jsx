import React from 'react'
import { Link } from 'react-router-dom'
import { Mountain, Phone, CheckCircle2, Building2 } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import QuoteBlock from '@/components/QuoteBlock'
import JobPhotoStrip from '@/components/JobPhotoStrip'
import SEO from '@/components/SEO'
import { trackPhoneClick } from '@/lib/analytics'
import { AGGREGATE_RATING } from '@/lib/reviews'

// Roanoke Valley — the southern anchor of our I-81 corridor coverage.
// Star City commercial, Salem industrial, clay shale bedrock. The claims here
// mirror what the Shenandoah page has stated since it shipped: real corridor
// history, not a new pin on the map.
const VALLEY_ZONES = [
  {
    area: 'Roanoke City & Star City Commercial',
    detail: 'Retail lots, office parks, and commercial strips across the Star City. Downtown and Williamson Road corridor work where lane closures and business hours have to be planned around, not ignored.',
  },
  {
    area: 'Salem & I-81 Exit Corridors',
    detail: 'Industrial yards and distribution sites along the Salem stretch of I-81. Heavy-vehicle pavement design — thicker sections, stronger base — for lots that see trucks every day, not just cars.',
  },
  {
    area: 'Cave Spring & South Roanoke County',
    detail: 'Residential driveways and neighborhood commercial off Route 221 and Brambleton Avenue. Rolling terrain that calls for the same grade-drainage discipline we use across the Blue Ridge.',
  },
  {
    area: 'Vinton & East County',
    detail: 'Small-commercial and residential work east of the city. Church lots, storage facilities, and subdivision drives along the Route 24 corridor.',
  },
  {
    area: 'Botetourt County & Daleville',
    detail: 'The growing I-81 corridor north of Roanoke — Exit 150 commercial, Greenfield-area industrial, and rural residential drives toward Fincastle.',
  },
  {
    area: 'Rocky Mount & Route 220 South',
    detail: 'Franklin County residential and commercial along the Route 220 corridor toward Smith Mountain Lake. Long rural drives and lake-property paving.',
  },
]

const ROANOKE_CHALLENGES = [
  {
    issue: 'Clay Shale Bedrock',
    fix: 'Roanoke\'s clay shale demands different base preparation than the limestone Valley floor to the north. We excavate to solid bearing and spec the stone section for the soil that is actually there — a distinction we\'ve worked for decades along I-81.',
  },
  {
    issue: 'Valley Freeze-Thaw',
    fix: 'The Roanoke Valley sits near 1,000 ft with real winters. Base depth and binder selection are chosen for the freeze-thaw cycling this valley actually sees, not a statewide default.',
  },
  {
    issue: 'Heavy Commercial Traffic',
    fix: 'I-81 logistics traffic means Roanoke commercial lots take truck loading. We design pavement sections by traffic class — a distribution yard is not a hair-salon parking lot, and we don\'t pave them the same.',
  },
  {
    issue: 'Grade & Stormwater',
    fix: 'Valley terrain funnels water. Lots and drives get graded to move stormwater off the mat and away from the subbase, with curbing and swales where the site needs them.',
  },
]

const LOCAL_WORK = [
  'Commercial parking lot paving and repair across the Roanoke Valley',
  'Industrial yard and heavy-traffic pavement along the I-81 corridor',
  'Residential driveway paving in Roanoke, Salem, and Cave Spring',
  'Sealcoating and crack-seal maintenance programs for property managers',
  'Parking lot striping and ADA-compliant layout',
  'Church, school, and institutional lot work throughout the valley',
]

const FAQS = [
  {
    q: 'Do you actually work in the Roanoke Valley?',
    a: 'Yes. Roanoke and Salem are the southern anchor of the I-81 corridor we have covered for decades — our Shenandoah Valley coverage runs Winchester to Roanoke. We know the valley\'s clay shale bedrock and what it demands from base preparation.',
  },
  {
    q: 'Can you handle large commercial and industrial lots in Roanoke?',
    a: 'Yes. Commercial and industrial paving is core work for us — from retail lots to distribution yards. We design the pavement section around the traffic the lot will actually carry and put the full scope in writing before work starts.',
  },
  {
    q: 'What makes Roanoke paving different from Richmond paving?',
    a: 'Geology and winter. Roanoke sits on clay shale at elevation with harder freeze-thaw cycling than the Piedmont. Base preparation, drainage, and binder selection all shift accordingly — treating Roanoke like Richmond is how lots fail early.',
  },
  {
    q: 'Do you give free estimates in Roanoke?',
    a: 'Yes — free written estimates from a measured site visit. We don\'t quote ballpark numbers over the phone because the site conditions decide the real scope. We measure, then we put the price in writing.',
  },
]

export default function RoanokePaving() {
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
          ...AGGREGATE_RATING,
        },
        areaServed: [
          { '@type': 'City', name: 'Roanoke', containedInPlace: { '@type': 'State', name: 'Virginia' } },
          { '@type': 'City', name: 'Salem', containedInPlace: { '@type': 'State', name: 'Virginia' } },
          { '@type': 'City', name: 'Vinton', containedInPlace: { '@type': 'State', name: 'Virginia' } },
          { '@type': 'AdministrativeArea', name: 'Botetourt County', containedInPlace: { '@type': 'State', name: 'Virginia' } },
        ],
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.jwordenasphaltpaving.com/' },
          { '@type': 'ListItem', position: 2, name: 'Service Areas', item: 'https://www.jwordenasphaltpaving.com/services' },
          { '@type': 'ListItem', position: 3, name: 'Roanoke Valley', item: 'https://www.jwordenasphaltpaving.com/roanoke-paving' },
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
        title="Asphalt Paving Roanoke VA | Commercial & Driveway Contractor"
        description="Asphalt paving in Roanoke, Salem, and the Roanoke Valley — the southern anchor of our I-81 corridor coverage. Commercial lots, driveways, sealcoating. Free estimates."
        canonicalPath="/roanoke-paving"
        jsonLd={jsonLd}
      />
      <Navbar />

      {/* HERO */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 20% 70%, #facc15 0%, transparent 60%)' }} />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-3/5 space-y-6">
              <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-white/30 text-xs">
                <Link to="/" className="hover:text-white/60 transition-colors">Home</Link>
                <span>/</span>
                <Link to="/services" className="hover:text-white/60 transition-colors">Services</Link>
                <span>/</span>
                <span className="text-white/60">Roanoke Valley</span>
              </nav>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 bg-brand-amber/10 text-brand-amber text-xs font-bold uppercase tracking-[0.08em] px-3 py-1 rounded-full">
                  <Mountain className="w-3 h-3" /> Southern Anchor of Our I-81 Coverage
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 text-white text-xs font-bold uppercase tracking-[0.08em] px-3 py-1 rounded-full">
                  <Building2 className="w-3 h-3" /> Commercial & Residential
                </span>
              </div>
              <h1 className="font-display font-bold text-5xl md:text-7xl text-white leading-tight tracking-tight">
                Asphalt Paving<br /><span className="text-brand-amber">in Roanoke</span><br />& the Valley.
              </h1>
              <p className="text-white/70 text-xl max-w-2xl">
                The Star City is the southern anchor of the I-81 corridor we have paved for decades — commercial lots in Roanoke, industrial yards in Salem, and driveways across the valley, built on base prep that respects the clay shale under this ground.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <a
                  href="tel:+18044461296"
                  onClick={() => trackPhoneClick('roanoke-hero')}
                  className="btn-primary py-4 px-8 font-bold flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" /> (804) 446-1296
                </a>
                <a href="#quote" className="btn-outline py-4 px-8 text-white font-bold">Free On-Site Estimate</a>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
                {[
                  { val: '40+', label: 'Yrs on the I-81 Corridor' },
                  { val: 'Winchester→Roanoke', label: 'Corridor Coverage' },
                  { val: '96%', label: 'Marshall Compaction Std' },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className="text-brand-amber font-bold text-lg leading-tight">{s.val}</p>
                    <p className="text-white/40 text-xs uppercase tracking-[0.08em] mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-4">
                <span className="text-white/30 text-xs uppercase tracking-[0.08em] font-bold">Awards:</span>
                <span className="bg-brand-amber/10 text-brand-amber text-xs font-bold px-3 py-1.5 rounded-full">🏆 Pavement Mag Top 75</span>
                <span className="bg-white/10 text-white/80 text-xs font-bold px-3 py-1.5 rounded-full">⭐ Best of Houzz Service</span>
                <span className="bg-white/10 text-white/80 text-xs font-bold px-3 py-1.5 rounded-full">🎖 2026 Top Contractor Nominee</span>
              </div>
            </div>

            <div className="lg:w-2/5">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-5">
                <h2 className="text-white font-bold text-lg">What Roanoke Ground Demands.</h2>
                {ROANOKE_CHALLENGES.map((c, i) => (
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

      {/* ZONES */}
      <section className="py-24 bg-white/5 border-y border-white/10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-brand-amber/10 text-brand-amber text-xs font-bold uppercase tracking-[0.08em] px-3 py-1 rounded-full mb-4">Roanoke Valley Coverage</span>
            <h2 className="text-white font-bold text-3xl md:text-5xl tracking-tight">Star City to Salem.<br />Daleville to Rocky Mount.</h2>
            <p className="text-white/40 mt-4 max-w-2xl mx-auto">The southern end of a corridor we have worked for decades — with the base-prep knowledge this valley's geology requires.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALLEY_ZONES.map((z, i) => (
              <div key={i} className="bg-brand-navy border border-white/10 rounded-2xl p-7 hover:border-brand-amber/30 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <Mountain className="w-4 h-4 text-brand-amber flex-shrink-0" />
                  <h3 className="text-white font-bold text-base">{z.area}</h3>
                </div>
                <p className="text-white/50 text-sm leading-relaxed">{z.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REAL PHOTOS */}
      <JobPhotoStrip
        category="commercial"
        heading="Real Lots. Our Crews. Our Photos."
        intro="Every photograph on this site is from a J. Worden & Sons job — no stock images, no renders."
        limit={6}
        market="VA"
      />

      {/* LOCAL WORK */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 items-start">
            <div className="lg:w-1/2 space-y-6">
              <h2 className="text-white font-bold text-3xl md:text-4xl tracking-tight">Commercial, Industrial &amp; Residential.</h2>
              <p className="text-white/50 text-sm leading-relaxed max-w-lg">
                The Roanoke Valley mixes logistics-corridor industrial with established residential neighborhoods — two very different pavement problems. We design for the traffic each site actually carries and put every scope in writing.
              </p>
              <div className="space-y-3">
                {LOCAL_WORK.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-brand-amber mt-0.5 flex-shrink-0" />
                    <p className="text-white/60 text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:w-1/2">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                <h3 className="text-white font-bold text-lg mb-6">Our Standard, Every Job.</h3>
                <div className="space-y-4">
                  {[
                    { step: 'Measured estimate', note: 'Free written quote from a real site visit — never a phone ballpark.' },
                    { step: 'VDOT-spec base', note: 'Structural stone base built to VDOT Section 315, sized for the soil and the traffic.' },
                    { step: '96% Marshall', note: 'Compaction to 96% Marshall unit weight, minimum — our non-negotiable floor.' },
                    { step: 'Written scope', note: 'Thickness, base, drainage, and edges on paper before the first truck rolls.' },
                  ].map((row, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-brand-amber text-xs font-bold flex-shrink-0 w-28 text-right">{row.step}</p>
                      <p className="text-white/40 text-xs leading-relaxed">{row.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-white/5 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-white font-bold text-3xl md:text-5xl tracking-tight text-center mb-14">Roanoke Paving FAQs.</h2>
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
          <p className="text-white/30 text-xs uppercase tracking-[0.08em] font-bold mb-5">Related Services & Areas</p>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Shenandoah Valley Paving', to: '/shenandoah-valley-paving' },
              { label: 'Charlottesville Paving', to: '/charlottesville-paving' },
              { label: 'Richmond Paving', to: '/richmond-paving' },
              { label: 'Sealcoating', to: '/sealcoating' },
              { label: 'Crack Repair', to: '/crack-repair' },
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
          <div className="absolute top-0 right-0 p-8 opacity-10"><Mountain size={140} /></div>
          <p className="text-brand-navy/50 font-bold uppercase tracking-[0.08em] text-sm mb-3">Roanoke · Salem · Botetourt · Franklin County</p>
          <h2 className="text-brand-navy font-bold text-3xl md:text-5xl leading-tight mb-6">
            Decades on I-81.<br />Built for This Valley's Ground.
          </h2>
          <p className="text-brand-navy/60 text-lg mb-8 max-w-2xl mx-auto">
            Clay shale, real winters, truck traffic — Roanoke pavement has to be built for all three. Call and get a written estimate from a contractor who has worked this corridor for decades.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="tel:+18044461296"
              onClick={() => trackPhoneClick('roanoke-cta')}
              className="bg-brand-navy text-white font-bold py-4 px-8 rounded-full hover:bg-brand-navy/80 transition-colors"
            >
              Call (804) 446-1296
            </a>
            <a href="#quote" className="bg-white/20 text-brand-navy font-bold py-4 px-8 rounded-full hover:bg-white/30 transition-colors">
              Get Free Quote
            </a>
          </div>
        </div>
      </section>

      <QuoteBlock
        source="service_roanoke"
        heading="Request a Quote in the Roanoke Valley"
        intro="Send the address and we will come out — Roanoke, Salem, and the surrounding counties. Free written estimate from a measured site."
      />

      <Footer />
    </div>
  )
}
