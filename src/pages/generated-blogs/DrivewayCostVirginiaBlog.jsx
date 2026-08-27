import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import QuoteBlock from '@/components/QuoteBlock'
import SEO from '@/components/SEO'
import { premiumBlogPostingSchema } from '@/components/SchemaMarkup'
import { Calendar, Clock, ArrowRight, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react'

export default function DrivewayCostVirginiaBlog() {
  const jsonLd = premiumBlogPostingSchema({
    slug: 'info/driveway-paving-cost-virginia',
    headline: 'How Much Does Driveway Paving Cost in Virginia? (2026 Price Guide)',
    description:
      'Honest price ranges for asphalt driveway paving in Virginia — by size, condition, and region. What drives cost up, what contractors don\'t tell you, and how to compare bids.',
    imageUrl: '/hero-paving.jpg',
    datePublished: '2026-05-01T08:00:00-04:00',
    dateModified: '2026-05-29T08:00:00-04:00',
  })

  return (
    <div className="min-h-screen bg-background font-body">
      <SEO
        title="How Much Does Driveway Paving Cost in Virginia? (2026 Guide) — J. Worden & Sons"
        description="Honest price ranges for asphalt driveway paving in Virginia — by size, condition, and region. What drives cost up, what contractors don't tell you, and how to compare bids."
        canonicalPath="/blog/info/driveway-paving-cost-virginia"
        jsonLd={jsonLd}
      />
      <Navbar />

      <article className="pt-32 pb-16 md:pb-20 max-w-4xl mx-auto px-6 lg:px-8">
        <header className="mb-12 border-b border-border pb-10">
          <Link to="/blog" className="inline-flex items-center text-sm font-display uppercase tracking-[0.08em] text-muted-foreground hover:text-primary transition-colors mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Articles
          </Link>
          <div className="flex items-center gap-4 text-xs font-display tracking-[0.08em] text-muted-foreground uppercase mb-6">
            <span className="text-primary font-bold">Pricing</span>
            <span>•</span>
            <div className="flex items-center"><Calendar className="w-3 h-3 mr-1.5" /> May 2026</div>
            <span>•</span>
            <div className="flex items-center"><Clock className="w-3 h-3 mr-1.5" /> 6 min read</div>
          </div>
          <h1 className="font-display font-bold text-foreground text-4xl md:text-5xl uppercase tracking-tight leading-[0.95] mb-6">
            How Much Does Driveway Paving Cost in Virginia?
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
            Real price ranges by size, condition, and region — plus the cost drivers most contractors won't mention until after the bid.
          </p>
        </header>

        <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed space-y-6">

          <p>
            The most common question we get before a site visit: <em>"What's this going to cost me?"</em> It's the right question to ask early. Here's an honest breakdown — not a sales pitch — of what asphalt driveway paving costs in Virginia in 2026, what moves the number up or down, and how to tell whether a bid is real or just the number a contractor thinks you want to hear.
          </p>

          <h2 className="font-display text-2xl text-foreground uppercase tracking-wide mt-10 mb-4 font-bold">
            Average Asphalt Driveway Cost in Virginia
          </h2>
          <p>
            For a standard residential driveway in the Richmond metro, Chesterfield, Henrico, or surrounding Central Virginia counties, expect these ranges in 2026:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8">
            {[
              { size: 'Small (400–700 sq ft)', range: '$1,800 – $3,500', note: 'Single-car, short run' },
              { size: 'Medium (700–1,400 sq ft)', range: '$3,200 – $6,500', note: 'Two-car or longer single' },
              { size: 'Large (1,400–2,500 sq ft)', range: '$5,800 – $12,000+', note: 'Wide or long rural drive' },
            ].map((tier) => (
              <div key={tier.size} className="bg-card border border-border p-5 rounded-sm">
                <p className="font-display font-bold text-primary text-sm uppercase tracking-wide mb-1">{tier.size}</p>
                <p className="font-display font-bold text-foreground text-xl mb-1">{tier.range}</p>
                <p className="text-xs text-muted-foreground">{tier.note}</p>
              </div>
            ))}
          </div>

          <p>
            These ranges assume a full installation: grading, 4–6 inch compacted stone base, 2–3 inch hot-mix asphalt, and rolling. They do not include tear-out of an existing surface, which adds $1–$3 per square foot depending on depth and disposal.
          </p>

          <h2 className="font-display text-2xl text-foreground uppercase tracking-wide mt-10 mb-4 font-bold">
            What Drives the Cost Up
          </h2>

          <div className="space-y-4">
            {[
              { factor: 'Poor existing base or drainage problems', impact: 'Can add $2,000–$8,000', detail: 'If the ground under your driveway has moved, held water, or never had a proper base, we have to fix that first. A new asphalt surface over a failed base fails in 2–3 years.' },
              { factor: 'Tear-out and haul-away of old surface', impact: '+$1–$3/sq ft', detail: 'Removing existing concrete or old asphalt, loading, and hauling to a recycling facility adds real cost. Concrete removal runs higher than asphalt.' },
              { factor: 'Steep grades or tight access', impact: '+10–25%', detail: 'Equipment needs room to maneuver. Steep slopes require slower compaction passes and sometimes hand-tamping in tight sections.' },
              { factor: 'Distance from the plant', impact: 'Varies by location', detail: 'Hot-mix asphalt must be laid while it\'s hot. Longer haul from the plant means less time on-site before the mix cools, which affects compaction quality. Contractors further from a batch plant may charge a premium.' },
              { factor: 'Edging, curbing, and transitions', impact: '+$8–$18/linear ft', detail: 'A clean border — whether it\'s a poured concrete curb, Belgian block, or a cut edge — costs more but protects the asphalt from edge cracking.' },
            ].map((item) => (
              <div key={item.factor} className="flex gap-4 bg-card border border-border p-5 rounded-sm">
                <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-display font-bold text-foreground text-sm uppercase tracking-wide mb-1">{item.factor}</p>
                  <p className="text-xs text-primary font-bold mb-1">{item.impact}</p>
                  <p className="text-sm">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="font-display text-2xl text-foreground uppercase tracking-wide mt-10 mb-4 font-bold">
            What Keeps Cost Down Without Cutting Corners
          </h2>
          <div className="space-y-3">
            {[
              'Scheduling in spring or fall — peak summer heat increases material costs slightly',
              'Combining your job with a neighbor\'s to reduce mobilization cost (ask us about neighborhood pricing)',
              'Choosing a 2-inch surface course over 3-inch if your driveway sees only passenger vehicles',
              'Reusing existing base if it\'s structurally sound (we\'ll tell you honestly after inspecting it)',
            ].map((tip) => (
              <div key={tip} className="flex gap-3 items-start">
                <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm">{tip}</p>
              </div>
            ))}
          </div>

          <h2 className="font-display text-2xl text-foreground uppercase tracking-wide mt-10 mb-4 font-bold">
            Red Flags in a Low Bid
          </h2>
          <p>
            If a quote comes in significantly below others, ask these questions before signing:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>What is the base depth they're proposing? Less than 4 inches compacted stone is a problem in Virginia clay soil.</li>
            <li>What mix design are they using? A cheap cold-mix patch product is not the same as hot-mix asphalt from a certified plant.</li>
            <li>Are they licensed as a Class A or B contractor in Virginia? Verify at the DPOR website.</li>
            <li>Do they carry workers' compensation? If not, a crew injury on your property is your liability.</li>
            <li>Will they put the scope in writing before you pay a deposit? Verbal quotes are unenforceable.</li>
          </ul>

          <div className="bg-card border border-border p-8 my-10 rounded-sm">
            <h4 className="font-display text-lg text-primary uppercase font-bold mb-2">Get a Written Scope Before You Decide</h4>
            <p className="mb-6 text-sm">We'll walk the property, measure, assess the base, and give you a written breakdown — not just a number. No obligation.</p>
            <a href="#quote" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-display font-bold text-xs tracking-[0.06em] uppercase rounded hover:bg-primary/90 transition-all">
              Get a Free Estimate <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </div>

          <h2 className="font-display text-2xl text-foreground uppercase tracking-wide mt-10 mb-4 font-bold">
            Cost by Virginia Region
          </h2>
          <p>
            Material and labor costs vary slightly across Virginia. Richmond metro and Chesterfield County run close to the ranges above. Northern Virginia (Fairfax, Loudoun, Prince William) typically runs 15–25% higher due to labor market rates. Hampton Roads (Norfolk, Virginia Beach, Chesapeake) is comparable to Richmond. Rural Shenandoah Valley and Southside Virginia often run slightly lower but may have limited contractor availability.
          </p>
          <p>
            J. Worden & Sons operates out of Chester, VA and covers Central Virginia without a travel surcharge — including Richmond, Chesterfield, Henrico, Hanover, Midlothian, Powhatan, Goochland, and surrounding counties.
          </p>

          <h2 className="font-display text-2xl text-foreground uppercase tracking-wide mt-10 mb-4 font-bold">
            Long-Term Cost: Sealcoating and Maintenance
          </h2>
          <p>
            A properly installed asphalt driveway in Virginia lasts 20–30 years with maintenance. The biggest lever is sealcoating every 2–4 years, which costs $0.15–$0.35 per square foot. A $300 sealcoat job on a 1,000 sq ft driveway extends life by years and is the most cost-effective maintenance decision you can make.
          </p>
          <p>
            Crack filling ($3–$8 per linear foot) when cracks are narrow stops water from reaching the base — the failure mode that turns a $500 repair into a $6,000 reconstruction.
          </p>

          <div className="border-t border-border pt-8 mt-8">
            <p className="text-sm">
              <strong className="text-foreground">Related reading:</strong>{' '}
              <Link to="/blog/asphalt-driveway-lifespan-virginia" className="text-primary hover:underline">How long does an asphalt driveway last in Virginia?</Link>
              {' · '}
              <Link to="/sealcoating" className="text-primary hover:underline">Our sealcoating services</Link>
              {' · '}
              <Link to="/residential" className="text-primary hover:underline">Residential paving</Link>
            </p>
          </div>
        </div>
      </article>

      <QuoteBlock
        source="blog_driveway_cost"
        heading="Get Your Own Driveway Priced, Not a Range"
        intro="The numbers above are ranges. Send the address and we will measure the actual square footage, read the existing base, and give you a real figure instead of a bracket."
      />

      <Footer />
    </div>
  )
}
