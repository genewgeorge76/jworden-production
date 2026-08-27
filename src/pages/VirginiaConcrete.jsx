import React from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Factory, Building2, Truck, Ruler, ShieldCheck, Phone } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import QuoteBlock from '@/components/QuoteBlock'
import SEO from '@/components/SEO'
import SmartImage from '@/components/SmartImage'
import { trackPhoneClick } from '@/lib/analytics'
import { legacyPortfolioImages } from '@/data/legacyPortfolio'

const CONCRETE_SERVICES = [
  {
    title: 'Driveway Aprons & Transitions',
    description: 'Concrete aprons where asphalt driveways meet the public road — the highest-wear transition point. Properly formed and reinforced to handle vehicle weight and county road edge conditions.',
    icon: <Ruler className="w-5 h-5 text-brand-amber" />,
  },
  {
    title: 'Commercial Sidewalks & Curbs',
    description: 'ADA-compliant sidewalks, dumpster pads, extruded curbing, and handicap ramps for commercial properties and retail corridors. We pull the permits so you don\'t have to.',
    icon: <Building2 className="w-5 h-5 text-brand-amber" />,
  },
  {
    title: 'Loading Docks & Industrial Pads',
    description: 'Minimum 4,000-PSI reinforced slabs rated for forklift traffic, freight loads, and industrial machinery vibration. Rebar and fiber mesh specs matched to the operational load.',
    icon: <Factory className="w-5 h-5 text-brand-amber" />,
  },
  {
    title: 'Decorative & Stamped Concrete',
    description: 'Stamped patterns — slate, cobblestone, brick, natural stone textures — for driveways, patios, and walkways that require a finished look alongside asphalt or pavers.',
    icon: <ShieldCheck className="w-5 h-5 text-brand-amber" />,
  },
  {
    title: 'Concrete Patching & Slab Repair',
    description: 'Spalled slabs, cracked sidewalk sections, failing joint edges, and heaved panels. Targeted concrete repair extends the life of otherwise sound slabs at a fraction of full replacement cost.',
    icon: <Truck className="w-5 h-5 text-brand-amber" />,
  },
  {
    title: 'Asphalt-to-Concrete Transitions',
    description: 'Properly engineered transitions between concrete and asphalt surfaces — the most common failure point when the two materials aren\'t tied correctly at the interface.',
    icon: <CheckCircle2 className="w-5 h-5 text-brand-amber" />,
  },
]

const CONCRETE_FAQS = [
  {
    q: 'How much does a concrete driveway apron cost in Virginia?',
    a: 'A standard concrete driveway apron in the Richmond, Chesterfield, or Henrico area typically runs $800–$2,500 depending on width, depth, and whether the existing transition needs demolition. We provide a written itemized estimate at no charge before any work begins.',
  },
  {
    q: 'What PSI concrete do you use for driveways and parking slabs?',
    a: 'We use a minimum 4,000-PSI mix for driveways and commercial slabs. For heavy-load applications (loading docks, industrial pads, areas with regular truck traffic), we specify 4,500–5,000 PSI with rebar reinforcement. We do not use 3,000-PSI mixes for vehicular surfaces — it\'s an underspec that leads to premature surface scaling, especially in Virginia\'s freeze-thaw climate.',
  },
  {
    q: 'How long does concrete take to cure before I can drive on it in Virginia?',
    a: 'Concrete gains approximately 70% of its rated strength in the first 7 days. In Virginia summer conditions (above 85°F), we recommend waiting 5–7 days before light vehicle traffic and 14 days before full truck and commercial loads. Cold-weather pours (below 50°F) require extended cure time and insulated blankets to prevent freeze damage in the first 24 hours.',
  },
  {
    q: 'Do you need a permit for concrete work in Chesterfield or Henrico?',
    a: 'Concrete driveway aprons typically require a right-of-way permit from Chesterfield County VDOT, Henrico County, or Richmond City depending on where the apron meets the public road. New concrete pads, sidewalks, and structures over a certain square footage may require a building permit. We evaluate permit requirements at estimate and handle the application where required.',
  },
  {
    q: 'Can you repair a cracked concrete slab instead of replacing it?',
    a: 'Yes, in most cases. Hairline cracks and surface spalling without structural heave or settlement are good candidates for repair. Slabs that have heaved from tree root pressure, settled unevenly from subbase failure, or cracked through with active water movement typically require replacement. We assess and give you an honest written recommendation — we don\'t push replacement when repair is the right answer.',
  },
]

export default function VirginiaConcrete() {
  const concreteImages = legacyPortfolioImages.filter(img => img.category === 'Commercial' || img.category === 'Professional').slice(0, 3)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: 'Concrete Contractor in Central Virginia',
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
          'Chester, VA', 'Richmond, VA', 'Chesterfield, VA',
          'Henrico, VA', 'Midlothian, VA', 'Colonial Heights, VA',
        ],
        serviceType: [
          'Concrete driveway aprons', 'Commercial sidewalks', 'Loading dock slabs',
          'Stamped concrete', 'Concrete repair', 'Curb and gutter',
        ],
        url: 'https://www.jwordenasphaltpaving.com/concrete',
      },
      {
        '@type': 'FAQPage',
        mainEntity: CONCRETE_FAQS.map((faq) => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: { '@type': 'Answer', text: faq.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.jwordenasphaltpaving.com/' },
          { '@type': 'ListItem', position: 2, name: 'Concrete', item: 'https://www.jwordenasphaltpaving.com/concrete' },
        ],
      },
    ],
  }

  return (
    <div className="min-h-screen bg-brand-navy">
      <SEO
        title="Concrete Contractor in Virginia | Aprons, Sidewalks & Industrial Slabs | J. Worden & Sons"
        description="Concrete contractor serving Richmond, Chesterfield, Henrico, and Central Virginia. Driveway aprons, ADA sidewalks, loading dock slabs, stamped..."
        canonicalPath="/concrete"
        jsonLd={jsonLd}
      />
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, #d97706 0%, transparent 60%)' }} />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-1/2 space-y-6">
              <div className="flex flex-wrap gap-2">
                <span className="inline-block bg-brand-amber/10 text-brand-amber text-xs font-bold uppercase tracking-[0.08em] px-3 py-1 rounded-full">
                  Concrete Division
                </span>
                <span className="inline-block bg-white/10 text-white/80 text-xs font-bold uppercase tracking-[0.08em] px-3 py-1 rounded-full">
                  4th Generation Since 1984
                </span>
              </div>
              <h1 className="font-display font-bold text-5xl md:text-7xl text-white leading-tight tracking-tight">
                Concrete Contractor in Central Virginia.
              </h1>
              <p className="text-white/70 text-lg md:text-xl max-w-xl">
                Aprons, sidewalks, loading docks, industrial pads, stamped concrete, and concrete repair across Richmond, Chesterfield, Henrico, and surrounding Virginia counties. Written estimates. Written warranty. No shortcuts on mix spec or base prep.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <a
                  href="tel:+18044461296"
                  onClick={() => trackPhoneClick('concrete-hero')}
                  className="btn-primary py-4 px-8 flex items-center gap-2 font-bold"
                >
                  <Phone className="w-4 h-4" /> Call 804-446-1296
                </a>
                <a href="#quote" className="btn-outline py-4 px-8 text-white font-bold">
                  Free Estimate
                </a>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
                <div className="text-center">
                  <p className="text-brand-amber font-bold text-2xl">4,000+</p>
                  <p className="text-white/40 text-xs uppercase tracking-[0.08em]">PSI Minimum</p>
                </div>
                <div className="text-center">
                  <p className="text-brand-amber font-bold text-2xl">40+</p>
                  <p className="text-white/40 text-xs uppercase tracking-[0.08em]">Years in Trade</p>
                </div>
                <div className="text-center">
                  <p className="text-brand-amber font-bold text-2xl">ADA</p>
                  <p className="text-white/40 text-xs uppercase tracking-[0.08em]">Code Compliant</p>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2 grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <SmartImage
                  src={concreteImages[0]?.url || '/work/portfolio/portfolio-017.jpg'}
                  className="rounded-2xl w-full h-64 object-cover border border-white/10"
                  alt="Concrete work in Richmond Virginia by J. Worden and Sons"
                />
                <div className="bg-brand-amber p-6 rounded-2xl">
                  <p className="text-brand-navy font-bold text-3xl">Written</p>
                  <p className="text-brand-navy/80 font-bold uppercase text-xs tracking-tighter">5-Year Workmanship Warranty</p>
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
                  <ShieldCheck className="w-8 h-8 text-brand-amber mb-2" />
                  <p className="text-white font-bold">Rebar & Fiber Mesh</p>
                  <p className="text-white/40 text-xs">Reinforced to load spec</p>
                </div>
                <SmartImage
                  src={concreteImages[1]?.url || '/work/portfolio/portfolio-030.jpg'}
                  className="rounded-2xl w-full h-48 object-cover border border-white/10"
                  alt="Commercial concrete slab installation Virginia"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-24 bg-white/5 border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="inline-block bg-brand-amber/10 text-brand-amber text-xs font-bold uppercase tracking-[0.08em] px-3 py-1 rounded-full mb-4">Concrete Services</span>
            <h2 className="text-white font-bold text-3xl md:text-5xl tracking-tight">
              Concrete Contractor Services in Virginia.
            </h2>
            <p className="text-white/40 mt-4 max-w-2xl mx-auto">Aprons to industrial slabs — every scope gets a proper mix specification, base evaluation, and written scope before work begins.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CONCRETE_SERVICES.map((service, idx) => (
              <div key={idx} className="bg-brand-navy border border-white/10 p-8 rounded-3xl hover:border-brand-amber/40 transition-all group">
                <div className="bg-brand-amber/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {service.icon}
                </div>
                <h3 className="text-white font-bold text-xl mb-3 tracking-tight">{service.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Virginia Expertise Body Copy */}
      <section className="py-24 bg-brand-navy border-b border-white/10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <span className="inline-block bg-brand-amber/10 text-brand-amber text-xs font-bold uppercase tracking-[0.08em] px-3 py-1 rounded-full mb-4">Virginia Concrete Expertise</span>
              <h2 className="text-white font-bold text-3xl md:text-5xl tracking-tight mb-6">
                Concrete Work in Virginia Requires Virginia Knowledge.
              </h2>
              <div className="space-y-4 text-white/60 text-sm leading-relaxed">
                <p>Virginia's climate creates specific challenges for concrete that generic specifications don't address. The freeze-thaw cycle — Richmond averages 35–45 cycles per winter — is concrete's primary enemy. Water enters micro-pores in the surface, freezes, expands, and spalls the surface from within. Air-entrained concrete mixes with a minimum 4,000-PSI rating resist this process significantly better than the underspec 3,000-PSI pours that many contractors use to cut cost.</p>
                <p>The joint layout matters as much as the mix. Concrete expands and contracts with temperature — control joints placed at the wrong spacing or cut too shallow allow slab cracking between joints rather than at them. We calculate joint spacing by slab thickness and anticipate the thermal range for the specific site, not a generic rule-of-thumb that ignores Virginia's hot summers and hard winters.</p>
                <p>The base preparation under a concrete slab is often more important than the mix. Virginia's clay-dominant subsoils shrink in dry weather and expand with moisture — a concrete slab sitting directly on clay with no aggregate base layer will move, crack, and heave within a few years. We always install a compacted aggregate base before any slab pour, with drainage consideration built into the grade.</p>
                <p>We tie all our concrete work into the surrounding <Link to="/paving" className="text-brand-amber hover:underline">asphalt paving</Link> and <Link to="/residential" className="text-brand-amber hover:underline">driveway</Link> scopes. Concrete aprons, transitions, and sidewalks adjacent to asphalt need to be formed and finished with the interface detail in mind — the most common concrete failure point is where the two materials meet without proper joint treatment.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-white font-bold text-base uppercase tracking-[0.08em] mb-4">Every Concrete Estimate Includes</p>
                <ul className="space-y-2.5">
                  {[
                    'Written scope with mix specification (PSI and air content)',
                    'Base depth recommendation by soil condition',
                    'Joint layout plan by slab thickness and thermal range',
                    'Rebar or fiber mesh spec by load requirement',
                    'Permit requirement evaluation',
                    'Written 5-year workmanship warranty',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-white/60">
                      <CheckCircle2 className="w-4 h-4 text-brand-amber mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-white font-bold text-base uppercase tracking-[0.08em] mb-3">Related Services</p>
                <div className="flex flex-wrap gap-2">
                  <Link to="/paving" className="border border-white/20 text-brand-amber text-xs font-bold tracking-[0.08em] uppercase px-3 py-1.5 hover:bg-white/10 transition-colors rounded-full">Asphalt Paving</Link>
                  <Link to="/residential" className="border border-white/20 text-brand-amber text-xs font-bold tracking-[0.08em] uppercase px-3 py-1.5 hover:bg-white/10 transition-colors rounded-full">Driveway Paving</Link>
                  <Link to="/parking-lots" className="border border-white/20 text-brand-amber text-xs font-bold tracking-[0.08em] uppercase px-3 py-1.5 hover:bg-white/10 transition-colors rounded-full">Parking Lots</Link>
                  <Link to="/hardscapes" className="border border-white/20 text-brand-amber text-xs font-bold tracking-[0.08em] uppercase px-3 py-1.5 hover:bg-white/10 transition-colors rounded-full">Hardscapes</Link>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-white font-bold text-base uppercase tracking-[0.08em] mb-2">Chester, VA — Serving Central Virginia</p>
                <div className="grid grid-cols-2 gap-1.5 text-sm text-white/50 mt-3">
                  {['Richmond City', 'Chesterfield', 'Henrico', 'Midlothian', 'Mechanicsville', 'Colonial Heights', 'Petersburg', 'Glen Allen'].map((c) => (
                    <div key={c} className="flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-brand-amber shrink-0" />
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white/5 border-b border-white/10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-brand-amber/10 text-brand-amber text-xs font-bold uppercase tracking-[0.08em] px-3 py-1 rounded-full mb-4">Common Questions</span>
            <h2 className="text-white font-bold text-3xl md:text-5xl tracking-tight">Virginia Concrete FAQ.</h2>
          </div>
          <div className="space-y-6">
            {CONCRETE_FAQS.map((faq) => (
              <div key={faq.q} className="bg-brand-navy border border-white/10 rounded-2xl p-8">
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
          <div className="absolute top-0 right-0 p-8 opacity-10"><Building2 size={140} /></div>
          <h2 className="text-brand-navy font-bold text-3xl md:text-5xl leading-tight mb-6">
            Get a Written Concrete Estimate.
          </h2>
          <p className="text-brand-navy/60 text-lg mb-8 max-w-2xl mx-auto">
            We walk the site, spec the mix and base, and give you a clear written estimate. No pressure, no guesswork. Serving Richmond, Chesterfield, Henrico, and surrounding Central Virginia counties.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="tel:+18044461296"
              onClick={() => trackPhoneClick('concrete-cta')}
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
        source="service_concrete"
        heading="Get a Concrete Estimate"
        intro="Tell us the pour and we will price the reinforcement with it. Free estimate written to ACI 318, including the joint spacing that decides where it cracks."
      />

      <Footer />
    </div>
  )
}
