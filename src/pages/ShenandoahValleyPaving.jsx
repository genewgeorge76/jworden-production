import React from 'react'
import { Link } from 'react-router-dom'
import { Mountain, Phone, CheckCircle2, Thermometer } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SEO from '@/components/SEO'
import { trackPhoneClick } from '@/lib/analytics'

// Shenandoah Valley — I-81 corridor. 40 years in the mountains. This is the real story.
// Winchester to Roanoke. US-11 (Valley Pike). Blue Ridge geology. Mountain drainage engineering.
// Massanutten, Bryce Resort, Harrisonburg poultry/ag industry, Staunton I-64 crossover.
const VALLEY_ZONES = [
  {
    area: 'Winchester & Frederick County',
    detail: 'Northern gateway of the Valley. Apple orchard and cold storage facility lot paving, medical campus work off Amherst Street, and subdivision driveways along Millwood Avenue and Route 7 corridor.',
  },
  {
    area: 'Front Royal, Strasburg & Woodstock',
    detail: 'Shenandoah County residential and commercial. Route 11 (Valley Pike) corridor paving between I-81 interchanges. Rural resort driveways near the Massanutten Caverns and Shenandoah River outfitter corridors.',
  },
  {
    area: 'Harrisonburg & Rockingham County',
    detail: 'Virginia\'s poultry capital. We have paved processing facility yards, cold storage access roads, and industrial pads for agricultural operations throughout Rockingham County. JMU adjacent commercial work on Port Republic Road.',
  },
  {
    area: 'Staunton, Waynesboro & Augusta County',
    detail: 'I-64 / I-81 interchange — a critical logistics crossroads. Industrial park paving off Statler Boulevard, residential work in Fishersville and Stuarts Draft, and institutional paving for Augusta Health campus.',
  },
  {
    area: 'Lexington, Buena Vista & Rockbridge County',
    detail: 'VMI and W&L institutional campus adjacent commercial. Rural residential driveways on steep grades — our mountain drainage expertise is essential here. US-11 commercial strips in Lexington.',
  },
  {
    area: 'Roanoke & Salem',
    detail: 'Southern anchor of the I-81 corridor. Star City commercial paving, Roanoke Valley retail work, and Salem industrial along I-81 exit corridors. We know Roanoke\'s clay shale bedrock — it demands different base prep than the Valley floor.',
  },
]

const MOUNTAIN_CHALLENGES = [
  {
    issue: 'Grade Drainage Engineering',
    fix: 'Asphalt on a slope fails from water migration, not surface wear. We grade to channel water off the surface and away from the subbase — not just flatten and pave. Every mountain job gets a drainage analysis.',
  },
  {
    issue: 'Blue Ridge Geology',
    fix: 'Valley floor is limestone-based (good drainage). Blue Ridge foothill sites hit clay shale and hard rock. We spec and excavate to solid bearing, not a depth number. This is 40 years of mountain-specific knowledge.',
  },
  {
    issue: 'Elevation Freeze-Thaw Severity',
    fix: 'At 1,500–2,500 ft elevation, freeze-thaw cycles are more numerous and more severe than at Richmond. We increase base depth and use PG 58-28 binder grade for high-elevation sites that see hard winter conditions.',
  },
  {
    issue: 'Shortened Paving Season',
    fix: 'The effective paving window in the upper Valley (above 2,000 ft) is April–October. We schedule mountain projects early and don\'t take on late-fall elevation work that will fail in the first freeze.',
  },
]

const RESORT_WORK = [
  'Massanutten Resort — access road and parking lot maintenance',
  'Bryce Resort, Shenandoah County — ski area and lodge access paving',
  'Shenandoah Valley outfitter facilities along the river corridor',
  'Skyline Drive-adjacent private property driveways',
  'Historic property and inn driveways in Lexington and Staunton',
  'Rural church and institutional lot paving throughout the Valley',
]

const FAQS = [
  {
    q: 'Can you pave driveways on steep grades in the Shenandoah Valley?',
    a: 'Yes — and this is a specialty we\'ve developed over 40 years. Steep driveways require proper drainage channels, thicker base at the uphill edge, and compaction techniques that account for grade. We do not flatten and pave steep sites. We engineer them.',
  },
  {
    q: 'What areas along the I-81 corridor do you serve?',
    a: 'We serve the full I-81 corridor from Winchester south through Front Royal, Harrisonburg, Staunton, Waynesboro, Lexington, and into the Roanoke Valley. US-11 (Valley Pike) communities, mountain resorts, agricultural facilities, and all residential and commercial properties in between.',
  },
  {
    q: 'How does mountain paving differ from Piedmont or coastal paving?',
    a: 'Three major differences: drainage must be engineered for grade (not just slope and forget), Blue Ridge geology varies from limestone valley floor to clay shale on the ridges, and elevation increases freeze-thaw severity. We adjust binder grade, base depth, and drainage design for every mountain job.',
  },
  {
    q: 'Do you pave resort and hospitality properties in the Valley?',
    a: 'Yes. We have worked at resort properties throughout the Shenandoah Valley including Massanutten, Bryce, and private lodge and inn properties. Resort paving must look right as well as perform — we understand that the finish and edge quality matters as much as the structural spec.',
  },
]

export default function ShenandoahValleyPaving() {
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
          { '@type': 'City', name: 'Winchester', containedInPlace: { '@type': 'State', name: 'Virginia' } },
          { '@type': 'City', name: 'Harrisonburg', containedInPlace: { '@type': 'State', name: 'Virginia' } },
          { '@type': 'City', name: 'Staunton', containedInPlace: { '@type': 'State', name: 'Virginia' } },
          { '@type': 'City', name: 'Roanoke', containedInPlace: { '@type': 'State', name: 'Virginia' } },
        ],
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.jwordenasphaltpaving.com/' },
          { '@type': 'ListItem', position: 2, name: 'Service Areas', item: 'https://www.jwordenasphaltpaving.com/services' },
          { '@type': 'ListItem', position: 3, name: 'Shenandoah Valley & I-81', item: 'https://www.jwordenasphaltpaving.com/shenandoah-valley-paving' },
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
        title="Asphalt Paving Shenandoah Valley & I-81 Corridor | Mountain Contractor"
        description="40 years of mountain asphalt paving along the I-81 corridor. Winchester, Harrisonburg, Staunton, Lexington, and Roanoke. Steep grade drainage, Blue Ridge geology expertise, resort and agricultural facility paving. J. Worden & Sons."
        canonicalPath="/shenandoah-valley-paving"
        jsonLd={jsonLd}
      />
      <Navbar />

      {/* HERO */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 20% 70%, #d97706 0%, transparent 60%)' }} />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-3/5 space-y-6">
              <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-white/30 text-xs">
                <Link to="/" className="hover:text-white/60 transition-colors">Home</Link>
                <span>/</span>
                <Link to="/services" className="hover:text-white/60 transition-colors">Services</Link>
                <span>/</span>
                <span className="text-white/60">Shenandoah Valley & I-81</span>
              </nav>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 bg-brand-amber/10 text-brand-amber text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  <Mountain className="w-3 h-3" /> 40 Years in the Mountains
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  <Thermometer className="w-3 h-3" /> Elevation-Grade Spec
                </span>
              </div>
              <h1 className="font-display font-black text-5xl md:text-7xl text-white leading-tight tracking-tight">
                The Valley.<br /><span className="text-brand-amber">The Ridge.</span><br />We Know Both.
              </h1>
              <p className="text-white/70 text-xl max-w-2xl">
                We have paved the Shenandoah Valley for 40 years — from Winchester orchards to Roanoke industrial yards, from resort driveways on Massanutten to agricultural facility lots in Rockingham County. Flat-land contractors don't understand mountain drainage. We do.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <a
                  href="tel:+18044461296"
                  onClick={() => trackPhoneClick('shenandoah-hero')}
                  className="btn-primary py-4 px-8 font-black flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" /> (804) 446-1296
                </a>
                <Link to="/quote" className="btn-outline py-4 px-8 text-white font-black">Mountain Site Assessment</Link>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
                {[
                  { val: '40+', label: 'Yrs in the Valley' },
                  { val: '2,500+', label: 'Ft Max Elevation Served' },
                  { val: 'Winchester→Roanoke', label: 'I-81 Coverage' },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className="text-brand-amber font-black text-lg leading-tight">{s.val}</p>
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

            {/* Mountain challenges */}
            <div className="lg:w-2/5">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-5">
                <h2 className="text-white font-black text-lg">Why Mountain Paving Is a Specialty.</h2>
                {MOUNTAIN_CHALLENGES.map((c, i) => (
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

      {/* VALLEY ZONES */}
      <section className="py-24 bg-white/5 border-y border-white/10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-brand-amber/10 text-brand-amber text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">I-81 Corridor Coverage</span>
            <h2 className="text-white font-black text-3xl md:text-5xl tracking-tight">Winchester to Roanoke.<br />Every Exit In Between.</h2>
            <p className="text-white/40 mt-4 max-w-2xl mx-auto">We don't just list counties on a service area map. We have real project history throughout the Valley.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALLEY_ZONES.map((z, i) => (
              <div key={i} className="bg-brand-navy border border-white/10 rounded-2xl p-7 hover:border-brand-amber/30 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <Mountain className="w-4 h-4 text-brand-amber flex-shrink-0" />
                  <h3 className="text-white font-black text-base">{z.area}</h3>
                </div>
                <p className="text-white/50 text-sm leading-relaxed">{z.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RESORT & SPECIALTY WORK */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 items-start">
            <div className="lg:w-1/2 space-y-6">
              <h2 className="text-white font-black text-3xl md:text-4xl tracking-tight">Resort, Agricultural &amp; Institutional Work.</h2>
              <p className="text-white/50 text-sm leading-relaxed max-w-lg">
                The Shenandoah Valley has a mix of project types you won't find anywhere else in Virginia — mountain resort driveways, poultry processing facility yards, historic inn access roads, and university-adjacent commercial. We have done all of them.
              </p>
              <div className="space-y-3">
                {RESORT_WORK.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-brand-amber mt-0.5 flex-shrink-0" />
                    <p className="text-white/60 text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Seasonal guide card */}
            <div className="lg:w-1/2">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                <h3 className="text-white font-black text-lg mb-6">Valley Paving Calendar.</h3>
                <div className="space-y-4">
                  {[
                    { season: 'April – May', status: 'Prime season opens', note: 'Ground temps rise, overnight frosts end. Book early — Valley crews fill fast.', color: 'text-green-400 bg-green-400/10' },
                    { season: 'June – August', status: 'Peak season', note: 'Full paving window. Long days, hot mix stays workable longer at elevation.', color: 'text-brand-amber bg-brand-amber/10' },
                    { season: 'September – October', status: 'Second window', note: 'Best time to seal and repair before first frost. Ideal for resort closeout work.', color: 'text-blue-400 bg-blue-400/10' },
                    { season: 'November – March', status: 'High-elevation restricted', note: 'Above 1,500 ft: no paving. Valley floor work possible on warm days only. Emergency only.', color: 'text-red-400 bg-red-400/10' },
                  ].map((row, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-right flex-shrink-0 w-28">
                        <p className="text-white/60 text-xs font-bold">{row.season}</p>
                        <span className={`text-xs font-black px-2 py-0.5 rounded-full mt-1 inline-block ${row.color}`}>{row.status}</span>
                      </div>
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
          <h2 className="text-white font-black text-3xl md:text-5xl tracking-tight text-center mb-14">Shenandoah Valley Paving FAQs.</h2>
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
              { label: 'Crack Repair', to: '/crack-repair' },
              { label: 'Northern Virginia Paving', to: '/northern-virginia-paving' },
              { label: 'Richmond Paving', to: '/richmond-paving' },
              { label: 'Fredericksburg Paving', to: '/fredericksburg-paving' },
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
          <div className="absolute top-0 right-0 p-8 opacity-10"><Mountain size={140} /></div>
          <p className="text-brand-navy/50 font-bold uppercase tracking-widest text-sm mb-3">Shenandoah Valley & I-81 Corridor</p>
          <h2 className="text-brand-navy font-black text-3xl md:text-5xl leading-tight mb-6">
            40 Years in These Mountains.<br />No Contractor Knows Them Better.
          </h2>
          <p className="text-brand-navy/60 text-lg mb-8 max-w-2xl mx-auto">
            From Winchester orchards to Roanoke Star City — we know every soil type, every seasonal constraint, and every project type the Valley produces. Call today and get a quote from people who have actually paved it.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="tel:+18044461296"
              onClick={() => trackPhoneClick('shenandoah-cta')}
              className="bg-brand-navy text-white font-black py-4 px-8 rounded-full hover:bg-brand-navy/80 transition-colors"
            >
              Call (804) 446-1296
            </a>
            <Link to="/quote" className="bg-white/20 text-brand-navy font-black py-4 px-8 rounded-full hover:bg-white/30 transition-colors">
              Get Free Quote
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
