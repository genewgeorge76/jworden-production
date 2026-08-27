import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import QuoteBlock from '@/components/QuoteBlock'
import SEO from '@/components/SEO'
import { premiumBlogPostingSchema } from '@/components/SchemaMarkup'
import { Calendar, Clock, ArrowRight, ArrowLeft, CheckCircle, XCircle } from 'lucide-react'

export default function AsphaltVsConcreteVirginiaBlog() {
  const jsonLd = premiumBlogPostingSchema({
    slug: 'info/asphalt-vs-concrete-driveway-virginia',
    headline: 'Asphalt vs. Concrete Driveway in Virginia: Which Is Right for Your Property?',
    description:
      'Side-by-side comparison of asphalt and concrete driveways for Virginia homeowners — cost, durability in Virginia\'s climate, maintenance requirements, and when each makes sense.',
    imageUrl: '/hero-paving.jpg',
    datePublished: '2026-05-05T08:00:00-04:00',
    dateModified: '2026-05-29T08:00:00-04:00',
  })

  return (
    <div className="min-h-screen bg-background font-body">
      <SEO
        title="Asphalt vs. Concrete Driveway in Virginia: Which Is Better? — J. Worden & Sons"
        description="Side-by-side comparison of asphalt and concrete driveways for Virginia homeowners — cost, durability in Virginia's climate, maintenance requirements, and when each makes sense."
        canonicalPath="/blog/info/asphalt-vs-concrete-driveway-virginia"
        jsonLd={jsonLd}
      />
      <Navbar />

      <article className="pt-32 pb-16 md:pb-20 max-w-4xl mx-auto px-6 lg:px-8">
        <header className="mb-12 border-b border-border pb-10">
          <Link to="/blog" className="inline-flex items-center text-sm font-display uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Articles
          </Link>
          <div className="flex items-center gap-4 text-xs font-display tracking-widest text-muted-foreground uppercase mb-6">
            <span className="text-primary font-bold">Buyer's Guide</span>
            <span>•</span>
            <div className="flex items-center"><Calendar className="w-3 h-3 mr-1.5" /> May 2026</div>
            <span>•</span>
            <div className="flex items-center"><Clock className="w-3 h-3 mr-1.5" /> 7 min read</div>
          </div>
          <h1 className="font-display font-black text-foreground text-4xl md:text-5xl uppercase tracking-tight leading-[0.95] mb-6">
            Asphalt vs. Concrete Driveway in Virginia: Which Is Right for You?
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
            Virginia's freeze-thaw cycles, red clay soil, and summer heat affect both materials differently. Here's the honest comparison.
          </p>
        </header>

        <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed space-y-6">

          <p>
            Both asphalt and concrete make durable driveways. The right choice depends on your budget, your soil conditions, how long you plan to stay in the house, and how much maintenance you're willing to do. We install both — so this comparison has no agenda other than helping you make the right call.
          </p>

          <h2 className="font-display text-2xl text-foreground uppercase tracking-wide mt-10 mb-4 font-black">
            Cost Comparison (Virginia, 2026)
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border">
              <thead>
                <tr className="bg-card">
                  <th className="text-left p-3 font-display uppercase text-foreground text-xs tracking-wide">Factor</th>
                  <th className="text-left p-3 font-display uppercase text-primary text-xs tracking-wide">Asphalt</th>
                  <th className="text-left p-3 font-display uppercase text-foreground text-xs tracking-wide">Concrete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ['Install cost (per sq ft)', '$3–$6', '$8–$14'],
                  ['Typical 1,000 sq ft driveway', '$3,000–$6,000', '$8,000–$14,000'],
                  ['Usable within', '24–48 hours', '7–10 days'],
                  ['Lifespan (maintained)', '20–30 years', '30–50 years'],
                  ['Sealcoating needed', 'Every 2–4 years', 'Not required'],
                  ['Crack repair cost', '$3–$8/linear ft', '$10–$20/linear ft'],
                  ['Resurfacing option', 'Yes — overlay possible', 'Limited — usually full replace'],
                ].map(([factor, asphalt, concrete]) => (
                  <tr key={factor} className="hover:bg-card/50">
                    <td className="p-3 text-foreground font-medium">{factor}</td>
                    <td className="p-3 text-primary">{asphalt}</td>
                    <td className="p-3">{concrete}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="font-display text-2xl text-foreground uppercase tracking-wide mt-10 mb-4 font-black">
            How Virginia's Climate Affects Each Material
          </h2>

          <h3 className="font-display text-xl text-foreground uppercase mt-8 mb-3 font-bold">Freeze-Thaw Cycles</h3>
          <p>
            Central Virginia averages 30–50 freeze-thaw cycles per year. Water expands 9% when it freezes. Any water that enters cracks in either surface damages the base from below. This is the #1 cause of driveway failure in Virginia regardless of material.
          </p>
          <p>
            <strong className="text-foreground">Asphalt advantage:</strong> Asphalt is flexible and moves slightly with the freeze-thaw cycle without cracking as readily as concrete. Concrete is rigid — once it cracks from frost heave, the crack propagates. Repair options for cracked concrete slabs are limited and expensive.
          </p>

          <h3 className="font-display text-xl text-foreground uppercase mt-8 mb-3 font-bold">Summer Heat</h3>
          <p>
            Virginia summers hit 95°F+ regularly. Asphalt softens in extreme heat and can be marked by heavy vehicles or kickstands if it's a fresh installation. However, quality asphalt installed with the right binder grade (PG 64-22 is standard for Virginia) handles summer heat without issue under normal use.
          </p>
          <p>
            <strong className="text-foreground">Concrete advantage:</strong> Concrete doesn't soften in heat and reflects more sunlight, making it slightly cooler underfoot. If you're in an area where standing on the driveway in July matters, concrete has an edge.
          </p>

          <h3 className="font-display text-xl text-foreground uppercase mt-8 mb-3 font-bold">Virginia Red Clay Soil</h3>
          <p>
            Virginia's clay soil expands when wet and shrinks when dry. This movement is the primary cause of base failure under driveways. Both asphalt and concrete require a properly compacted aggregate base — 4–6 inches minimum — to isolate the surface from soil movement. No surface material compensates for a bad base.
          </p>

          <h2 className="font-display text-2xl text-foreground uppercase tracking-wide mt-10 mb-4 font-black">
            Asphalt: Pros and Cons for Virginia Homeowners
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border p-5 rounded-sm">
              <p className="font-display font-bold text-primary text-xs uppercase tracking-wide mb-3">Pros</p>
              <div className="space-y-2">
                {[
                  'Lower upfront cost — 40–60% less than concrete',
                  'Flexible — handles freeze-thaw better',
                  'Repairable and resurfaceable',
                  'Usable in 24–48 hours',
                  'Easier to patch without visible seams',
                  'Recyclable at end of life',
                ].map(p => (
                  <div key={p} className="flex gap-2 items-start">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm">{p}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border p-5 rounded-sm">
              <p className="font-display font-bold text-foreground text-xs uppercase tracking-wide mb-3">Cons</p>
              <div className="space-y-2">
                {[
                  'Requires sealcoating every 2–4 years',
                  'Can soften in extreme heat under heavy loads',
                  'Shorter lifespan than concrete (with equal maintenance)',
                  'Petroleum-based — prices tied to oil market',
                ].map(c => (
                  <div key={c} className="flex gap-2 items-start">
                    <XCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-sm">{c}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <h2 className="font-display text-2xl text-foreground uppercase tracking-wide mt-10 mb-4 font-black">
            Concrete: Pros and Cons for Virginia Homeowners
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border p-5 rounded-sm">
              <p className="font-display font-bold text-primary text-xs uppercase tracking-wide mb-3">Pros</p>
              <div className="space-y-2">
                {[
                  'Longer lifespan — 30–50 years properly installed',
                  'No sealcoating required',
                  'Doesn\'t soften in heat',
                  'Higher resale value perception',
                  'Lighter color — reflects heat, easier to see at night',
                ].map(p => (
                  <div key={p} className="flex gap-2 items-start">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm">{p}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border p-5 rounded-sm">
              <p className="font-display font-bold text-foreground text-xs uppercase tracking-wide mb-3">Cons</p>
              <div className="space-y-2">
                {[
                  'Higher upfront cost — often $8,000–$14,000+',
                  'Not usable for 7–10 days after pour',
                  'Cracks from frost heave are hard and expensive to repair',
                  'Salt damage — de-icers accelerate surface spalling',
                  'Stains (oil, tire marks) are harder to clean',
                  'Joints create trip hazards as slabs shift',
                ].map(c => (
                  <div key={c} className="flex gap-2 items-start">
                    <XCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-sm">{c}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <h2 className="font-display text-2xl text-foreground uppercase tracking-wide mt-10 mb-4 font-black">
            Our Recommendation for Most Virginia Homeowners
          </h2>
          <p>
            For the typical Richmond-area homeowner with a standard residential driveway, asphalt is the better value. The upfront savings are significant, the material handles Virginia's freeze-thaw climate well, and routine sealcoating keeps it looking clean and extends lifespan. Over a 30-year period, the total cost of ownership — including sealcoating — is still typically lower than concrete.
          </p>
          <p>
            Concrete makes sense if: you're planning to stay 30+ years, you want zero maintenance beyond occasional cleaning, or you have a specific aesthetic goal (exposed aggregate, stamped patterns, decorative finishes).
          </p>

          <div className="bg-card border border-border p-8 my-10 rounded-sm">
            <h4 className="font-display text-lg text-primary uppercase font-bold mb-2">We Install Both. We'll Tell You Which Makes Sense for Your Property.</h4>
            <p className="mb-6 text-sm">Site walk, measurements, soil assessment, and written quote — no pressure, no obligation.</p>
            <a href="#quote" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-display font-bold text-xs tracking-[0.14em] uppercase rounded hover:bg-primary/90 transition-all">
              Schedule a Free Estimate <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </div>

          <div className="border-t border-border pt-8 mt-8">
            <p className="text-sm">
              <strong className="text-foreground">Related reading:</strong>{' '}
              <Link to="/blog/info/driveway-paving-cost-virginia" className="text-primary hover:underline">Driveway paving cost in Virginia</Link>
              {' · '}
              <Link to="/blog/asphalt-driveway-lifespan-virginia" className="text-primary hover:underline">How long does an asphalt driveway last?</Link>
              {' · '}
              <Link to="/concrete" className="text-primary hover:underline">Our concrete services</Link>
            </p>
          </div>
        </div>
      </article>

      <QuoteBlock
        source="blog_asphalt_vs_concrete"
        heading="Have Both Priced Before You Choose"
        intro="We install asphalt and concrete, so we have no reason to steer you. Send the job and we will price it both ways with the honest lifespan on each in Virginia freeze-thaw."
      />

      <Footer />
    </div>
  )
}
