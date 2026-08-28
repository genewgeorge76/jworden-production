import React from 'react'
import { Link } from 'react-router-dom'
import { Mountain, Phone, CheckCircle2, MapPin } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import QuoteBlock from '@/components/QuoteBlock'
import JobPhotoStrip from '@/components/JobPhotoStrip'
import SEO from '@/components/SEO'
import { trackPhoneClick } from '@/lib/analytics'
import { AGGREGATE_RATING } from '@/lib/reviews'

// Charlottesville / Albemarle / Nelson County. The owner lives in Faber —
// this is home turf, not a service-area pin on a map. Route 29 corridor,
// Blue Ridge foothill geology, estate and winery driveways.
const AREA_ZONES = [
  {
    area: 'Charlottesville & UVA',
    detail: 'City residential streets, commercial lots off Route 29 and Pantops, and university-adjacent rental property paving. Charlottesville\'s mix of historic streets and new development calls for both careful edge work and full-depth construction.',
  },
  {
    area: 'Albemarle County Estates',
    detail: 'Long estate driveways are Albemarle\'s signature project — quarter-mile runs through rolling terrain with grade changes, culvert crossings, and tree-lined approaches. Drainage engineering decides whether these last 5 years or 25.',
  },
  {
    area: 'Faber, Nelson County & Route 29 South',
    detail: 'Our owner lives in Faber. Nelson County\'s brewery and cidery corridor, Wintergreen-area mountain drives, and Route 29 commercial between Lovingston and North Garden are minutes from home — not the far edge of a service map.',
  },
  {
    area: 'Crozet & Western Albemarle',
    detail: 'One of the fastest-growing corridors in central Virginia. New subdivision driveways, HOA street maintenance, and commercial paving along Route 250 west toward Afton Mountain.',
  },
  {
    area: 'Scottsville & Southern Albemarle',
    detail: 'Rural residential and farm access roads down Route 20. Tar-and-chip and asphalt over stone base for long rural drives where hauling distance makes job planning matter.',
  },
  {
    area: 'Waynesboro, Afton & the I-64 Gap',
    detail: 'Where the Piedmont meets the Blue Ridge. Afton Mountain properties need mountain drainage spec; Waynesboro commercial work connects to our long-standing Shenandoah Valley coverage.',
  },
]

const FOOTHILL_CHALLENGES = [
  {
    issue: 'Blue Ridge Foothill Clay',
    fix: 'Albemarle and Nelson sit on red clay that holds water and heaves in winter. We build on compacted stone base sized to the soil — not a one-depth-fits-all spec — so the mat stays flat through freeze-thaw.',
  },
  {
    issue: 'Long Estate Driveways',
    fix: 'A quarter-mile driveway is a small road. We grade for crown and side drainage the full length, place culverts where the terrain demands them, and pave in passes that keep the mat hot to the far end.',
  },
  {
    issue: 'Mountain Grades',
    fix: 'Wintergreen, Afton, and the Nelson hollows have real slope. Water management on grade — channeling it off and away from the subbase — is the difference between a driveway and a washout.',
  },
  {
    issue: 'Rural Haul Distances',
    fix: 'Hot mix cools on long hauls. We schedule Nelson and southern Albemarle jobs around plant location and load timing so asphalt arrives workable and compacts to spec.',
  },
]

const LOCAL_WORK = [
  'Estate and farm driveway construction throughout Albemarle County',
  'Winery, brewery, and cidery lot and access-road paving in Nelson County',
  'Residential driveways in Charlottesville, Crozet, and Ruckersville',
  'Commercial parking lot paving and sealcoating on the Route 29 corridor',
  'Tar-and-chip surfacing for long rural drives',
  'Church, school, and institutional lot work across central Virginia',
]

const FAQS = [
  {
    q: 'Are you actually local to Charlottesville?',
    a: 'Yes. Our owner lives in Faber in Nelson County, about 20 minutes south of Charlottesville, and the company has paved central Virginia for four decades from our Chester base. Charlottesville, Albemarle, and Nelson are home-area jobs for us, not long-distance work.',
  },
  {
    q: 'Do you pave long estate driveways in Albemarle County?',
    a: 'Yes — long driveways through rolling terrain are one of our core project types. We handle grading, stone base, drainage and culverts, and asphalt or tar-and-chip surfacing, and we will walk the full run with you before quoting it.',
  },
  {
    q: 'What does a driveway cost in the Charlottesville area?',
    a: 'It depends on length, existing base, grade, and drainage — which is why we don\'t give ballpark numbers. We come out, measure, and give you a written free estimate. Every quote is built from the actual site, not a per-foot guess.',
  },
  {
    q: 'Can you handle steep mountain driveways near Wintergreen or Afton?',
    a: 'Yes. Mountain-grade paving is a specialty we developed over 40 years in the Shenandoah Valley and Blue Ridge. Steep sites get drainage engineering, adjusted base depth, and compaction planned for the slope — not a flatten-and-pave shortcut.',
  },
]

export default function CharlottesvillePaving() {
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
          { '@type': 'City', name: 'Charlottesville', containedInPlace: { '@type': 'State', name: 'Virginia' } },
          { '@type': 'AdministrativeArea', name: 'Albemarle County', containedInPlace: { '@type': 'State', name: 'Virginia' } },
          { '@type': 'AdministrativeArea', name: 'Nelson County', containedInPlace: { '@type': 'State', name: 'Virginia' } },
          { '@type': 'City', name: 'Crozet', containedInPlace: { '@type': 'State', name: 'Virginia' } },
        ],
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.jwordenasphaltpaving.com/' },
          { '@type': 'ListItem', position: 2, name: 'Service Areas', item: 'https://www.jwordenasphaltpaving.com/services' },
          { '@type': 'ListItem', position: 3, name: 'Charlottesville & Nelson County', item: 'https://www.jwordenasphaltpaving.com/charlottesville-paving' },
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
        title="Asphalt Paving Charlottesville VA | Albemarle & Nelson County Contractor"
        description="Locally based paving contractor for Charlottesville, Albemarle, and Nelson County. Estate driveways, winery lots, mountain grades. Owner lives in Faber. Free estimates."
        canonicalPath="/charlottesville-paving"
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
                <span className="text-white/60">Charlottesville & Nelson County</span>
              </nav>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 bg-brand-amber/10 text-brand-amber text-xs font-bold uppercase tracking-[0.08em] px-3 py-1 rounded-full">
                  <MapPin className="w-3 h-3" /> Owner Lives in Nelson County
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 text-white text-xs font-bold uppercase tracking-[0.08em] px-3 py-1 rounded-full">
                  <Mountain className="w-3 h-3" /> Blue Ridge Foothill Spec
                </span>
              </div>
              <h1 className="font-display font-bold text-5xl md:text-7xl text-white leading-tight tracking-tight">
                Asphalt Paving<br /><span className="text-brand-amber">in Charlottesville</span><br />& Nelson County.
              </h1>
              <p className="text-white/70 text-xl max-w-2xl">
                Our owner lives in Faber, twenty minutes south of Charlottesville. Albemarle estate driveways, Nelson County winery lots, Crozet subdivisions, and Route 29 commercial — this is home ground for a company with 40 years of Virginia paving behind it.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <a
                  href="tel:+18044461296"
                  onClick={() => trackPhoneClick('charlottesville-hero')}
                  className="btn-primary py-4 px-8 font-bold flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" /> (804) 446-1296
                </a>
                <a href="#quote" className="btn-outline py-4 px-8 text-white font-bold">Free On-Site Estimate</a>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
                {[
                  { val: 'Faber, VA', label: 'Owner Home Base' },
                  { val: '40+', label: 'Yrs Paving Virginia' },
                  { val: '20 min', label: 'To Downtown C’ville' },
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
                <h2 className="text-white font-bold text-lg">What Foothill Paving Demands.</h2>
                {FOOTHILL_CHALLENGES.map((c, i) => (
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
            <span className="inline-block bg-brand-amber/10 text-brand-amber text-xs font-bold uppercase tracking-[0.08em] px-3 py-1 rounded-full mb-4">Route 29 Corridor Coverage</span>
            <h2 className="text-white font-bold text-3xl md:text-5xl tracking-tight">Charlottesville to Lovingston.<br />Crozet to Scottsville.</h2>
            <p className="text-white/40 mt-4 max-w-2xl mx-auto">This is where our owner drives home every night — not the outer ring of somebody’s service-area map.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AREA_ZONES.map((z, i) => (
              <div key={i} className="bg-brand-navy border border-white/10 rounded-2xl p-7 hover:border-brand-amber/30 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-brand-amber flex-shrink-0" />
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
        category="residential"
        heading="Real Driveways. Our Crews. Our Photos."
        intro="Every photograph on this site is from a J. Worden & Sons job — no stock images, no renders."
        limit={6}
        market="VA"
      />

      {/* LOCAL WORK */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 items-start">
            <div className="lg:w-1/2 space-y-6">
              <h2 className="text-white font-bold text-3xl md:text-4xl tracking-tight">Estate, Winery &amp; Residential Work.</h2>
              <p className="text-white/50 text-sm leading-relaxed max-w-lg">
                The Charlottesville area builds projects you don’t see elsewhere in Virginia — long estate approaches, tasting-room lots that have to look as good as they perform, and mountain drives that punish shortcuts. That mix is exactly what four decades of Virginia paving prepares you for.
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
                <h3 className="text-white font-bold text-lg mb-6">How We Quote a C’ville-Area Job.</h3>
                <div className="space-y-4">
                  {[
                    { step: '1. Walk the site', note: 'We measure the full run, check the existing base, and look at where water goes today — before anything is priced.' },
                    { step: '2. Written scope', note: 'Base depth, drainage work, asphalt thickness, and edges in writing. No verbal ballparks, no per-foot guesses.' },
                    { step: '3. Honest schedule', note: 'Foothill and mountain sites get scheduled inside the weather window that lets the mat cure right.' },
                    { step: '4. Built to spec', note: 'Compacted to our 96% Marshall standard on VDOT-spec stone base. The same standard we bring to federal work.' },
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
          <h2 className="text-white font-bold text-3xl md:text-5xl tracking-tight text-center mb-14">Charlottesville Paving FAQs.</h2>
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
              { label: 'Richmond Paving', to: '/richmond-paving' },
              { label: 'Roanoke Paving', to: '/roanoke-paving' },
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
          <p className="text-brand-navy/50 font-bold uppercase tracking-[0.08em] text-sm mb-3">Charlottesville · Albemarle · Nelson County</p>
          <h2 className="text-brand-navy font-bold text-3xl md:text-5xl leading-tight mb-6">
            The Contractor Who<br />Drives These Roads Home.
          </h2>
          <p className="text-brand-navy/60 text-lg mb-8 max-w-2xl mx-auto">
            From Pantops to Wintergreen, from Crozet to Lovingston — call the company whose owner lives here, and get a written estimate measured from your actual site.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="tel:+18044461296"
              onClick={() => trackPhoneClick('charlottesville-cta')}
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
        source="service_charlottesville"
        heading="Request a Quote in the Charlottesville Area"
        intro="Send the address and we will come out — Albemarle, Nelson, and the Route 29 corridor. Free written estimate from a measured site."
      />

      <Footer />
    </div>
  )
}
