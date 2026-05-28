import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Zap, Droplets, Target, Award, Construction, Star, Trophy } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SEO from '@/components/SEO'
import { trackPhoneClick } from '@/lib/analytics'

const SEALCOATING_ADVANTAGES = [
  {
    title: 'Coal Tar vs. Asphalt Emulsion',
    description: 'We offer industrial-grade coal tar for heavy fuel and oxidation resistance, or eco-friendly asphalt emulsion. 100% commercial-weight materials — never watered down.',
    icon: <ShieldCheck className="w-5 h-5" />
  },
  {
    title: 'State-Level Scale',
    description: 'Serving Richmond, Tidewater, Northern Virginia, Shenandoah Valley, and Roanoke. No project is too large for our fleet and high-output commercial spray systems.',
    icon: <Zap className="w-5 h-5" />
  },
  {
    title: 'Hot-Pour Rubberized Crack Filler',
    description: '400° rubberized hot-pour crack sealing that permanently bonds to aged asphalt. We stop water intrusion at the source before it destroys your base layer.',
    icon: <Construction className="w-5 h-5" />
  },
  {
    title: 'Micro-Surface Polymer Sealer',
    description: 'Advanced polymer-modified emulsion sealer for commercial lots. Extends pavement life by 5–7 years. Applied with a squeegee finish for maximum penetration.',
    icon: <Droplets className="w-5 h-5" />
  },
  {
    title: 'Slurry Seal & Sand Fill',
    description: 'Slurry seal for high-traffic commercial surfaces requiring an aggregate texture. Excellent skid resistance and UV protection for large lots and roadways.',
    icon: <Award className="w-5 h-5" />
  },
  {
    title: 'Fog Seal & Rejuvenator',
    description: 'Penetrating fog seal for newer pavements showing early oxidation. Restores maltene oil content and flexibility — prevents cracking before it starts.',
    icon: <Target className="w-5 h-5" />
  }
]

const AWARDS = [
  { label: 'Houzz Pro', detail: 'Multiple Best Of Houzz Awards — Service & Design', href: 'https://www.houzz.com/jwordenandsons' },
  { label: 'Pavement Magazine', detail: 'Top 75 Contractor — 4 Categories', href: '#' },
  { label: 'Family Business', detail: 'Founded 1984 — 40+ Years Virginia Paving', href: '#' },
]

const SEALCOAT_MATERIALS = [
  { name: 'Coal Tar Emulsion', best: 'Gas stations, industrial lots', life: '+8 yrs', cost: '$$$' },
  { name: 'Asphalt Emulsion', best: 'Residential, eco-sensitive areas', life: '+5 yrs', cost: '$$' },
  { name: 'Polymer-Modified Sealer', best: 'Commercial, high-traffic lots', life: '+7 yrs', cost: '$$$' },
  { name: 'Slurry Seal', best: 'Municipal, large surface areas', life: '+6 yrs', cost: '$$$' },
  { name: 'Fog Seal / Rejuvenator', best: 'New pavement preservation', life: '+4 yrs', cost: '$' },
  { name: 'Acrylic Sealer', best: 'Decorative, stamped concrete', life: '+3 yrs', cost: '$$' },
]

const CRACK_FILLERS = [
  { name: 'Hot-Pour Rubberized', temp: '400°F', type: 'Flexible joint filler', best: 'All climate zones, parking lots' },
  { name: 'Cold-Pour Emulsion', temp: 'Ambient', type: 'Quick-patch fill', best: 'Minor residential cracks' },
  { name: 'Silicone Joint Sealant', temp: 'Ambient', type: 'Expansion joint', best: 'Concrete transitions, curbs' },
  { name: 'Polyurethane Caulk', temp: 'Ambient', type: 'Rigid crack fill', best: 'Wide structural cracks' },
]

export default function VirginiaSealcoating() {
  const title = 'Virginia Sealcoating Contractor | All Types | Best Pricing Statewide | J. Worden & Sons'
  const description = 'Virginia\'s highest-rated sealcoating contractor. Coal tar, asphalt emulsion, polymer-modified, slurry seal, fog seal. Hot-pour crack filling statewide. Houzz Pro award winner. Top 75 Pavement Magazine contractor.'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: 'Asphalt Sealcoating — Virginia Statewide',
        provider: {
          '@type': 'LocalBusiness',
          name: 'J. Worden & Sons Paving LLC',
          url: 'https://www.jwordenasphaltpaving.com/',
          telephone: '+18044461296',
          award: ['Best Of Houzz 2022', 'Best Of Houzz 2023', 'Pavement Magazine Top 75'],
          sameAs: ['https://www.houzz.com/jwordenandsons'],
        },
        areaServed: { '@type': 'State', name: 'Virginia' },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Sealcoating Services',
          itemListElement: [
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Coal Tar Sealcoating' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Asphalt Emulsion Sealcoating' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Polymer-Modified Sealer' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Hot-Pour Crack Filling' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Slurry Seal' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Fog Seal / Rejuvenator' } },
          ],
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is the best sealcoating material for a Virginia driveway?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'For residential driveways in Virginia, asphalt emulsion is the most popular choice — eco-friendly, UV-resistant, and ideal for the freeze-thaw cycles in the region. Coal tar is recommended for high-traffic or fuel-exposed surfaces like gas stations and industrial lots.',
            },
          },
          {
            '@type': 'Question',
            name: 'How often should I sealcoat my asphalt in Virginia?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Every 2–4 years depending on traffic and sun exposure. Virginia\'s hot summers accelerate oxidation. Cracking that appears within 18 months indicates the base may need attention first.',
            },
          },
          {
            '@type': 'Question',
            name: 'Do you offer crack filling before sealcoating?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. We always crack fill first using hot-pour rubberized sealant at 400°F before any sealer application. Applying sealer over open cracks creates a cosmetic fix that fails within one season.',
            },
          },
          {
            '@type': 'Question',
            name: 'What areas of Virginia do you serve for sealcoating?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'We serve the entire Commonwealth of Virginia — Richmond metro, Northern Virginia, Hampton Roads / Tidewater, Shenandoah Valley, Roanoke, Charlottesville, and surrounding areas.',
            },
          },
        ],
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.jwordenasphaltpaving.com/' },
          { '@type': 'ListItem', position: 2, name: 'Sealcoating', item: 'https://www.jwordenasphaltpaving.com/sealcoating' },
        ],
      },
    ],
  }

  return (
    <div className="min-h-screen bg-background font-body">
      <SEO title={title} description={description} canonicalPath="/sealcoating" jsonLd={jsonLd} />
      <Navbar />

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 overflow-hidden bg-black">
        <div className="absolute inset-0">
          <video
            className="w-full h-full object-cover opacity-40"
            src="/videos/sealcoating.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/work/imported/KFC/IMG_9496.JPG"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          {/* Award badges */}
          <div className="flex flex-wrap gap-3 mb-8">
            <a
              href="https://www.houzz.com/jwordenandsons"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary/20 border border-primary/50 text-primary px-4 py-2 text-xs font-display font-black uppercase tracking-widest hover:bg-primary/30 transition-colors"
            >
              <Trophy className="w-3.5 h-3.5" />
              Houzz Pro — Multiple Best Of Awards
            </a>
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white px-4 py-2 text-xs font-display font-black uppercase tracking-widest">
              <Star className="w-3.5 h-3.5 text-primary" />
              Pavement Magazine Top 75 — 4 Categories
            </span>
          </div>

          <p className="font-display text-primary text-xs tracking-[0.4em] uppercase mb-4">Virginia Statewide Sealcoating Authority</p>
          <h1 className="font-display font-black text-white text-5xl md:text-8xl uppercase tracking-tighter leading-[0.88] max-w-5xl mb-8">
            Sealcoating <br />
            <span className="text-primary italic">That Destroys</span><br />
            The Competition.
          </h1>
          <p className="text-gray-300 text-lg md:text-2xl max-w-2xl leading-relaxed mb-10">
            Six sealcoat materials. Four crack-filler systems. 40 years of Virginia pavement science.
            Priced to win — from Richmond driveways to statewide commercial fleets.
          </p>

          <div className="flex flex-wrap gap-4">
            <a
              href="tel:+18044461296"
              onClick={() => trackPhoneClick('sealcoating_hero')}
              className="premium-cta inline-flex items-center gap-2 px-10 py-5 font-display font-bold text-sm tracking-widest uppercase text-primary-foreground"
            >
              Call 804-446-1296
            </a>
            <Link
              to="/#quote"
              className="border-2 border-primary/50 text-white px-10 py-5 font-display font-bold text-sm tracking-widest uppercase hover:bg-primary/20 transition-all"
            >
              Get a Free Quote
            </Link>
          </div>
        </div>
      </section>

      {/* ── Sealcoat Material Comparison Table ──────────────────────────── */}
      <section className="py-24 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-3">Material Science</p>
            <h2 className="font-display font-black text-4xl md:text-6xl uppercase tracking-tight mb-4">
              Every Sealer. Compared.
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We stock and apply all six major sealcoat systems. We'll tell you which one is right for your surface — not which one has the highest margin.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 pr-6 font-display font-black uppercase tracking-wider text-xs text-muted-foreground">Material</th>
                  <th className="text-left py-4 pr-6 font-display font-black uppercase tracking-wider text-xs text-muted-foreground">Best For</th>
                  <th className="text-left py-4 pr-6 font-display font-black uppercase tracking-wider text-xs text-muted-foreground">Life Extension</th>
                  <th className="text-left py-4 font-display font-black uppercase tracking-wider text-xs text-muted-foreground">Cost Tier</th>
                </tr>
              </thead>
              <tbody>
                {SEALCOAT_MATERIALS.map((m, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                    <td className="py-4 pr-6 font-display font-bold text-foreground">{m.name}</td>
                    <td className="py-4 pr-6 text-muted-foreground">{m.best}</td>
                    <td className="py-4 pr-6 text-primary font-bold">{m.life}</td>
                    <td className="py-4 text-muted-foreground">{m.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Crack Filler Systems ─────────────────────────────────────────── */}
      <section className="py-24 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-3">Step 1 Is Always This</p>
            <h2 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tight mb-4">
              Crack Filling Systems
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We never seal over open cracks. Every job starts with the right crack filler for the condition and climate.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CRACK_FILLERS.map((c, i) => (
              <div key={i} className="premium-panel p-6 rounded-2xl hover:border-primary transition-all">
                <p className="font-display font-black text-lg uppercase mb-2">{c.name}</p>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <p><span className="text-primary font-bold">Temp:</span> {c.temp}</p>
                  <p><span className="text-primary font-bold">Type:</span> {c.type}</p>
                  <p><span className="text-primary font-bold">Best:</span> {c.best}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why We Win ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-4">Our Advantage</p>
              <h2 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tight mb-8">
                Six Seal Systems. <br />One Standard.
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                {SEALCOATING_ADVANTAGES.map((adv, i) => (
                  <div key={i} className="premium-panel p-6 rounded-2xl hover:border-primary transition-all">
                    <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mb-4 shadow-md">
                      {adv.icon}
                    </div>
                    <h3 className="font-display font-black text-base uppercase tracking-wide mb-3">{adv.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{adv.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Awards + Social Proof */}
            <div className="space-y-6">
              <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-4">Industry Recognition</p>
              {AWARDS.map((award, i) => (
                <a
                  key={i}
                  href={award.href}
                  target={award.href.startsWith('http') ? '_blank' : undefined}
                  rel={award.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="flex items-start gap-5 premium-panel p-6 rounded-2xl hover:border-primary transition-all block"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-display font-black text-lg uppercase tracking-wide">{award.label}</p>
                    <p className="text-muted-foreground text-sm">{award.detail}</p>
                  </div>
                </a>
              ))}
              <div className="premium-panel p-6 rounded-2xl border-primary/40">
                <p className="font-display font-black text-3xl text-primary mb-1">40+</p>
                <p className="text-sm uppercase tracking-widest text-muted-foreground font-display font-bold">Years Sealing Virginia Asphalt</p>
                <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
                  Every crew member is trained on material compatibility, cure time, and application thickness. 
                  No spray-and-go jobs. We do it right or we don't do it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Competitor Crusher CTA ───────────────────────────────────────── */}
      <section className="py-20 bg-primary">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="font-display font-black text-primary-foreground/70 text-xs tracking-widest uppercase mb-4">Protect Your Investment</p>
          <h2 className="font-display font-black text-4xl md:text-7xl text-primary-foreground uppercase tracking-tighter leading-[0.9] mb-8">
            Stop Oxidation.<br />Start Today.
          </h2>
          <p className="text-primary-foreground/80 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Every month you wait, UV rays and Virginia rain are eating your asphalt. 
            A proper seal now costs a fraction of premature repaving.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="tel:+18044461296"
              onClick={() => trackPhoneClick('sealcoating_bottom')}
              className="bg-black text-white px-12 py-5 font-display font-black text-sm tracking-widest uppercase hover:opacity-90 transition-all shadow-2xl"
            >
              804-446-1296
            </a>
            <Link
              to="/#quote"
              className="border-2 border-black/30 text-primary-foreground px-12 py-5 font-display font-bold text-sm tracking-widest uppercase hover:bg-black/10 transition-all"
            >
              Request Free Estimate
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
