import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import QuoteBlock from '@/components/QuoteBlock'
import SEO from '@/components/SEO'
import { premiumBlogPostingSchema } from '@/components/SchemaMarkup'
import { Calendar, Clock, ArrowRight, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react'

export default function DrivewaySurfacingVsReplacementBlog() {
  const jsonLd = premiumBlogPostingSchema({
    slug: 'info/driveway-resurfacing-vs-replacement-virginia',
    headline: 'Driveway Resurfacing vs Full Replacement in Virginia: How To Choose',
    description:
      'When to resurface your Virginia asphalt driveway and when to tear it out and start over — a cost-based decision guide with real price ranges.',
    imageUrl: '/hero-paving.jpg',
    datePublished: '2026-05-30T08:00:00-04:00',
    dateModified: '2026-05-30T08:00:00-04:00',
  })

  return (
    <div className="min-h-screen bg-background font-body">
      <SEO
        title="Driveway Resurfacing vs Full Replacement Virginia: How To Choose — J. Worden & Sons"
        description="When to resurface your Virginia asphalt driveway and when to tear it out and start over — a cost-based decision guide with real price ranges."
        canonicalPath="/blog/info/driveway-resurfacing-vs-replacement-virginia"
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
            <span className="text-primary font-bold">Driveway Repair</span>
            <span>•</span>
            <div className="flex items-center"><Calendar className="w-3 h-3 mr-1.5" /> May 2026</div>
            <span>•</span>
            <div className="flex items-center"><Clock className="w-3 h-3 mr-1.5" /> 6 min read</div>
          </div>
          <h1 className="font-display font-bold text-foreground text-4xl md:text-5xl uppercase tracking-tight leading-[0.95] mb-6">
            Driveway Resurfacing vs Full Replacement
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
            The right call depends on one thing above all else: is the base still solid? Here's how to know — and what each option costs in Virginia.
          </p>
        </header>

        <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed space-y-6">

          <p>
            The most common question homeowners ask after a hard Virginia winter: <em>"Should I resurface or replace my driveway?"</em> The right answer is almost entirely a base condition question — not a surface appearance question. Contractors who recommend replacement without checking the base, or who recommend resurfacing over a failed base, are both steering you wrong. Here's how to think through it yourself before you call anyone.
          </p>

          <h2 className="font-display text-2xl text-foreground uppercase tracking-wide mt-10 mb-4 font-bold">
            What Resurfacing (Mill and Overlay) Actually Is
          </h2>
          <p>
            Resurfacing — sometimes called a mill and overlay — removes the top 1.5–2 inches of existing asphalt with a milling machine, then lays a new 1.5–2 inch hot-mix surface course over the existing base. It's a legitimate repair strategy when the base is structurally sound and the surface deterioration is limited to the top layer.
          </p>
          <p>
            An overlay without milling (paving over the existing surface without removing it first) is a cheaper alternative that works on very low-deterioration surfaces but adds height at transitions and can hide existing problems. A mill and overlay is almost always the better practice.
          </p>

          <h2 className="font-display text-2xl text-foreground uppercase tracking-wide mt-10 mb-4 font-bold">
            Cost Comparison in Virginia (2026)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-8">
            {[
              { option: 'Mill and Overlay Resurfacing', range: '$2.50 – $4.50 / sq ft', note: 'Remove top layer, new surface course. Base must be sound.' },
              { option: 'Full Replacement', range: '$4.00 – $8.00 / sq ft', note: 'Tear out, haul, regrade base, new asphalt. Includes base repair if needed.' },
            ].map((item) => (
              <div key={item.option} className="bg-card border border-border p-5 rounded-sm">
                <p className="font-display font-bold text-primary text-sm uppercase tracking-wide mb-1">{item.option}</p>
                <p className="font-display font-bold text-foreground text-xl mb-1">{item.range}</p>
                <p className="text-xs text-muted-foreground">{item.note}</p>
              </div>
            ))}
          </div>

          <p>
            For a typical 1,000 sq ft residential driveway, resurfacing saves $1,500–$3,500 compared to full replacement — when the base justifies it. Resurfacing a failed base is money spent twice: you'll be back to full replacement within three to five years anyway.
          </p>

          <h2 className="font-display text-2xl text-foreground uppercase tracking-wide mt-10 mb-4 font-bold">
            Choose Resurfacing When:
          </h2>

          <div className="space-y-4">
            {[
              { condition: 'Surface cracking is longitudinal or transverse, not alligator pattern', detail: 'Single cracks and block cracking indicate thermal movement in the surface — not base failure. A mill and overlay removes the cracked layer and starts fresh.' },
              { condition: 'No soft spots or spring in the surface when you walk it', detail: 'Press firmly on cracked areas with your foot. If the surface flexes, springs back, or feels spongy, the base has failed underneath. That\'s a replacement indicator, not a resurfacing candidate.' },
              { condition: 'Surface is 10–18 years old but base was built right', detail: 'A driveway installed with proper base depth (4–6 inches compacted 21-A stone) in solid condition can be resurfaced to full service life. The base often outlasts two surface courses.' },
              { condition: 'Less than 25–30% of the surface shows distress', detail: 'When deterioration is limited, partial patching followed by an overlay is a viable scope. Spot-excavate the failed areas, rebuild base, patch to grade, then resurface the whole driveway.' },
            ].map((item) => (
              <div key={item.condition} className="flex gap-4 bg-card border border-border p-5 rounded-sm">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-display font-bold text-foreground text-sm uppercase tracking-wide mb-1">{item.condition}</p>
                  <p className="text-sm">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="font-display text-2xl text-foreground uppercase tracking-wide mt-10 mb-4 font-bold">
            Choose Full Replacement When:
          </h2>

          <div className="space-y-4">
            {[
              { condition: 'Alligator cracking (interconnected map cracking) covers more than 25% of surface', detail: 'Alligator cracking means the base is failing — the surface is cracking because the material below it is moving. A new surface coat over this lasts 2–4 years before cracking reappears in the same pattern. Full excavation and base replacement is the only real fix.' },
              { condition: 'Rutting or settlement that repeats after patching', detail: 'If you\'ve patched the same low spots twice and they keep settling, the sub-grade or base is compressing under load. No surface treatment fixes this. Full reconstruction — remove, regrade, recompact, and repave — is the only scope that sticks.' },
              { condition: 'Driveway is 25+ years old with no known base quality', detail: 'Driveways installed before modern base specifications (pre-1990 in many Virginia counties) may not have adequate stone depth. When the surface reaches end-of-life on an unknown base, full tear-out and inspection is the right approach.' },
              { condition: 'Water is pooling in multiple locations that can\'t be corrected with an overlay', detail: 'An overlay follows the existing grade. If the grade has settled into low spots that hold water, resurfacing preserves the drainage problem. Replacement allows regrading for positive drainage before the new asphalt goes down.' },
            ].map((item) => (
              <div key={item.condition} className="flex gap-4 bg-card border border-border p-5 rounded-sm">
                <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-display font-bold text-foreground text-sm uppercase tracking-wide mb-1">{item.condition}</p>
                  <p className="text-sm">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="font-display text-2xl text-foreground uppercase tracking-wide mt-10 mb-4 font-bold">
            The Virginia Clay Factor
          </h2>
          <p>
            Central Virginia's Piedmont clay is the most common driver of early base failure on residential driveways. Clay swells with moisture in winter and contracts in summer — that repeated movement pumps sub-base material upward and creates the spongy, settling base that produces alligator cracking. If your driveway was installed without a geotextile separator between the clay and the aggregate, and without sufficient base depth (less than 4 inches compacted stone), you'll see base failure earlier than the surface would otherwise suggest.
          </p>
          <p>
            When we assess a driveway for resurfacing vs replacement, we core or probe the base to check compaction and depth — not just look at the surface. That $0 diagnostic step is the difference between a recommendation you can trust and one that costs you money.
          </p>

          <div className="bg-card border border-border p-8 my-10 rounded-sm">
            <h4 className="font-display text-lg text-primary uppercase font-bold mb-2">Get an Honest Assessment Before You Decide</h4>
            <p className="mb-6 text-sm">We'll probe the base, walk the surface, and give you a written recommendation with cost for both options — no pressure toward the higher-cost choice if resurfacing is the right answer.</p>
            <a href="#quote" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-display font-bold text-xs tracking-[0.06em] uppercase rounded hover:bg-primary/90 transition-all">
              Request Free Assessment <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </div>

          <div className="border-t border-border pt-8 mt-8">
            <p className="text-sm">
              <strong className="text-foreground">Related reading:</strong>{' '}
              <Link to="/blog/info/signs-driveway-needs-repaving-virginia" className="text-primary hover:underline">7 signs your driveway needs repaving</Link>
              {' · '}
              <Link to="/blog/info/driveway-paving-cost-virginia" className="text-primary hover:underline">How much does driveway paving cost in Virginia?</Link>
              {' · '}
              <Link to="/blog/info/asphalt-milling-and-resurfacing" className="text-primary hover:underline">Asphalt milling and resurfacing explained</Link>
            </p>
          </div>
        </div>
      </article>

      <QuoteBlock
        source="blog_resurface_vs_replace"
        heading="Find Out Which One Yours Needs"
        intro="Resurfacing a driveway that needs replacing wastes the money twice. Send photographs or the address and we will tell you which it is before anyone quotes anything."
      />

      <Footer />
    </div>
  )
}
