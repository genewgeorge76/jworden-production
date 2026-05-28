import React from 'react'
import { Link } from 'react-router-dom'
import { Construction, MapPin, Trophy, Phone, Camera, ShieldCheck } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import SEO from '../components/SEO'
import { trackPhoneClick } from '../lib/analytics'

const RICHMOND_ZONES = [
  { area: 'The Fan & Museum District', detail: "Residential driveways and alley paving in Richmond City's historic neighborhoods — tight access, precision work, no margin for error." },
  { area: "Scott's Addition", detail: 'Brewery districts, mixed-use commercial courtyards, and rapidly developing urban lots. We work nights to keep the district moving.' },
  { area: 'Shockoe Bottom & Slip', detail: "Urban commercial and restaurant row parking. We've maintained lots serving Richmond's restaurant corridor for decades." },
  { area: 'Manchester / South Richmond', detail: 'Heavy industrial and logistics yards along the James River corridor — full-depth concrete and asphalt for high-axle-load surfaces.' },
  { area: 'West End / Short Pump', detail: "Suburban retail, HOA communities, and commercial strip paving in Henrico's fastest-growing commercial corridor." },
  { area: 'Midlothian / Chesterfield', detail: 'Our home base. We know every subdivision, every commercial strip, and every drainage problem on Route 360 and Midlothian Turnpike.' },
]

const SERVICES = [
  { title: 'New Asphalt Driveways', desc: 'Grade-A, machine-laid residential driveways with 6" compacted stone base. Built for Virginia clay soil, not patched together.' },
  { title: 'Commercial Parking Lots', desc: 'New construction through mill & overlay. Phased active-property scheduling so your tenants never lose access.' },
  { title: 'VDOT Road Construction', desc: 'Prequalified for VDOT contracts. We bid and execute public roadway paving across the Richmond district.' },
  { title: 'Asphalt Resurfacing', desc: 'Mill failed surface layers and machine-lay fresh asphalt. The cost-effective solution for oxidized and cracked pavement.' },
  { title: 'Industrial Yard Paving', desc: 'Heavy-duty 4"+ asphalt sections for logistics yards, trucking facilities, and port access roads that bear serious axle weight.' },
  { title: 'Same-Day Emergency Paving', desc: 'Pothole failures, collapse events, utility cut restoration — our rapid-response crews deploy within hours in the Richmond metro.' },
]

const FAQS = [
  { q: 'Do you need a permit to pave a driveway in Richmond?', a: "In the City of Richmond, you generally need a right-of-way permit if tying into a city street or alleyway. In Chesterfield and Henrico, basic resurfacing doesn't typically require a permit, but new cut-ins do. We handle all zoning and utility checks." },
  { q: 'How does clay soil in Central Virginia affect paving?', a: "Richmond sits on heavy red clay which expands and contracts aggressively with moisture. If your base course isn't properly excavated and compacted with CR-6 stone, the asphalt will fail prematurely. We dig deep." },
  { q: "Are you insured for commercial paving in Scott's Addition?", a: "Yes. We carry comprehensive commercial general liability, auto, and workers' comp exceeding minimum requirements for Class A contractors in VA. COIs are provided with all commercial bids." },
]

const LOCAL_IMAGES = [
  '/work/imported/KFC/IMG_9496.JPG',
  '/work/imported/KFC/IMG_9499-COLLAGE.jpg',
  '/work/imported/KFC/IMG_9499.JPG',
  '/work/imported/KFC/IMG_9500.JPG',
  '/work/imported/KFC/IMG_9507.JPG',
  '/work/imported/KFC/IMG_9509.JPG'
];

export default function RichmondPaving() {
  return (
    <div className="min-h-screen bg-black overflow-x-hidden selection:bg-brand-amber selection:text-black">
      <SEO 
        title="Leading Richmond Asphalt Paving Contractor | Mid-Atlantic Asphalt"
        description="40+ years paving Richmond. Residential driveways, commercial parking lots, & VDOT approved road building in Chesterfield, Henrico & Richmond City."
        type="LocalBusiness"
        schema={{
          "@context": "https://schema.org",
          "@type": "PavingContractor",
          "name": "Mid-Atlantic Asphalt Support",
          "image": "https://midatlanticasphalt.com/work/imported/KFC/IMG_9500.JPG",
          "@id": "https://midatlanticasphalt.com/richmond",
          "url": "https://midatlanticasphalt.com/richmond",
          "telephone": "+18044461296",
          "priceRange": "$$",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Regional HQ",
            "addressLocality": "Richmond",
            "addressRegion": "VA",
            "postalCode": "23219",
            "addressCountry": "US"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": 37.5407,
            "longitude": -77.4360
          },
          "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
              "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
            ],
            "opens": "07:00",
            "closes": "19:00"
          },
          "areaServed": [
            "Richmond", "Chesterfield", "Henrico", "Midlothian", "Petersburg"
          ],
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "reviewCount": "58"
          }
        }}
      />
      <Navbar />
      
      {/* HERO SECTION */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-navy via-brand-navy to-black opacity-95" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
          style={{ backgroundImage: `url('/work/imported/KFC/IMG_9509.JPG')`, filter: 'grayscale(100%)' }}
        />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="inline-flex items-center gap-2 bg-brand-amber/10 text-brand-amber text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                <MapPin className="w-3 h-3" /> Chester, VA — Serving All of Richmond Metro
              </span>
              <span className="inline-flex items-center gap-2 bg-yellow-400/10 text-yellow-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                <Trophy className="w-3 h-3" /> 4th Generation Since 1984
              </span>
            </div>
            <h1 className="font-display font-black text-6xl md:text-8xl text-white leading-[0.9] tracking-tighter mb-8">
              RICHMOND'S<br /><span className="text-brand-amber">PAVING</span><br />LEGACY.
            </h1>
            <p className="text-white/70 text-xl max-w-2xl mb-10 leading-relaxed">
              Four generations. 40+ years. Hundreds of Richmond-area driveways, parking lots, and road sections — from The Fan to Midlothian, from Scott's Addition to Colonial Heights. We are the Richmond asphalt standard.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="tel:+18044461296"
                onClick={() => trackPhoneClick('richmond-paving-hero')}
                className="btn-primary py-5 px-10 text-lg font-black flex items-center gap-2"
              >
                <Phone className="w-5 h-5" /> (804) 446-1296
              </a>
              <Link to="/quote" className="btn-outline py-5 px-10 text-white text-lg font-black bg-white/5 backdrop-blur-sm border-white/20">
                Free Estimate
              </Link>
            </div>

            {/* Stat bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-8 border-t border-white/10">
              {[
                { val: '40+', label: 'Years in VA' },
                { val: '4.9★', label: 'Google Rating' },
                { val: '500+', label: 'Projects Done' },
                { val: 'VDOT', label: 'Prequalified' },
              ].map(stat => (
                <div key={stat.label}>
                  <p className="text-brand-amber font-black text-3xl md:text-4xl">{stat.val}</p>
                  <p className="text-white/30 text-xs uppercase tracking-widest mt-1 font-bold">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MAP & TRUST SIGNS */}
      <section className="py-16 bg-black border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <ShieldCheck className="w-8 h-8 text-brand-amber" />
                <h2 className="text-3xl font-black text-white tracking-tight">Licensed Class A VA Contractor</h2>
              </div>
              <p className="text-white/60 text-lg leading-relaxed mb-6">
                We're fully licensed and insured for both residential and heavy commercial scope throughout the Commonwealth of Virginia.
                When you hire Mid-Atlantic Asphalt, you're getting heavy iron and full liability protection.
              </p>
              <ul className="space-y-4">
                {[
                  "Class A Heavy Highway Qualified",
                  "Full General Liability Insurance",
                  "Workers Compensation Current",
                  "City Right-of-Way Permit Experts"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-white/80 font-medium">
                    <div className="w-2 h-2 rounded-full bg-brand-amber" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d101185.34185794695!2d-77.53325603719714!3d37.524673648439366!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89b111095799c9ed%3A0xbfd83e6de062e742!2sRichmond%2C%20VA!5e0!3m2!1sen!2sus!4v1700684728956!5m2!1sen!2sus" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Richmond Map Coverage"
                className="absolute inset-0"
              />
            </div>
          </div>
        </div>
      </section>

      {/* LOCAL OPTIMIZED GALLERY INTEGRATION */}
      <section className="py-24 bg-brand-navy border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-black/40 text-brand-amber rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-white/5">
               <Camera className="w-4 h-4" /> Live Project Intel
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">
              Recent Paving Work
            </h2>
            <p className="text-white/60 text-lg">
              We document our work. View our latest commercial lot replacements and high-end residential driveway installations across the Richmond region.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {LOCAL_IMAGES.map((imgSrc, idx) => (
              <div key={idx} 
                   className="group relative aspect-square md:aspect-video bg-black overflow-hidden rounded-2xl bg-cover bg-center cursor-pointer border border-white/5"
                   style={{ backgroundImage: `url('${imgSrc}')` }}>
                <div className="absolute inset-0 bg-brand-navy/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6 translate-y-4 group-hover:translate-y-0">
                   <p className="text-brand-amber font-bold uppercase tracking-widest text-xs mb-1">Richmond Job</p>
                   <p className="text-white font-bold text-lg leading-tight md:text-xl">Completed Paving</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GEOGRAPHY GRID */}
      <section className="py-24 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-white font-black text-3xl md:text-5xl tracking-tight mb-4">Richmond Service Areas.</h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              From historic downtown alleys to massive industrial parks south of the river. We have the logistics and the local knowledge to handle it anywhere in RVA.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {RICHMOND_ZONES.map((zone, i) => (
              <div key={i} className="bg-brand-navy border border-white/5 rounded-3xl p-8 hover:border-brand-amber/30 transition-all">
                <MapPin className="w-6 h-6 text-brand-amber mb-4" />
                <h3 className="text-white font-bold text-xl mb-2">{zone.area}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{zone.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-24 px-4 bg-brand-navy border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-white font-black text-3xl md:text-5xl tracking-tight mb-4">Everything Asphalt.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SERVICES.map((svc, i) => (
              <div key={i} className="bg-black/50 border border-white/5 rounded-3xl p-8 hover:border-brand-amber/30 hover:bg-black transition-all group">
                <Construction className="w-8 h-8 text-brand-amber mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform" />
                <h3 className="text-white font-black text-xl mb-3 tracking-tight">{svc.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{svc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ inline schema */}
      <section className="py-24 px-4 bg-black border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-white font-black text-3xl md:text-5xl tracking-tight mb-4">Richmond Paving FAQs</h2>
            <p className="text-white/50 text-lg">Straight answers to common Central Virginia asphalt questions.</p>
          </div>
          <div className="space-y-6" itemScope itemType="https://schema.org/FAQPage">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-brand-navy border border-white/5 rounded-2xl p-8 transition-colors hover:border-white/10" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                <h3 className="text-white font-bold text-xl mb-4 pr-12" itemProp="name">{faq.q}</h3>
                <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                  <p className="text-white/60 text-base leading-relaxed" itemProp="text">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 bg-black">
        <div className="max-w-5xl mx-auto bg-brand-amber rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10 blur-sm mix-blend-overlay pointer-events-none transform rotate-12 scale-150">
            <Trophy size={400} />
          </div>
          <p className="text-brand-navy/60 font-black uppercase tracking-widest text-sm mb-4">The Richmond Standard</p>
          <h2 className="text-brand-navy font-black text-4xl md:text-6xl leading-tight mb-6 tracking-tighter">
            40 Years. One Standard.<br />No Shortcuts.
          </h2>
          <p className="text-brand-navy/70 text-xl md:text-2xl mb-12 max-w-2xl mx-auto font-medium">
            Call the paving crew that Chesterfield, Henrico, and Richmond City have trusted since 1984.
          </p>
          <div className="flex flex-wrap gap-4 justify-center relative z-10">
            <a
              href="tel:+18044461296"
              onClick={() => trackPhoneClick('richmond-cta')}
              className="bg-brand-navy hover:bg-black text-brand-amber py-5 px-10 rounded-full text-xl font-black flex items-center justify-center gap-3 transition-colors shadow-2xl shadow-brand-navy/20 active:scale-95"
            >
              <Phone className="w-6 h-6" /> (804) 446-1296
            </a>
            <Link to="/quote" className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-brand-navy/10 text-brand-navy py-5 px-10 rounded-full text-xl font-black transition-all active:scale-95 text-center flex items-center justify-center">
              Request Your Free Quote
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}