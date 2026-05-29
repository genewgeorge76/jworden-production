import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SEO from '@/components/SEO'
import { premiumBlogPostingSchema } from '@/components/SchemaMarkup'
import { Calendar, Clock, ArrowRight, ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react'

export default function ParkingLotRepairVsReplaceBlog() {
  const jsonLd = premiumBlogPostingSchema({
    slug: 'info/parking-lot-repair-vs-replace-virginia',
    headline: 'Parking Lot Repair vs. Full Replacement in Virginia: How to Decide',
    description:
      'A commercial property manager\'s guide to deciding between asphalt parking lot repair and full reconstruction — cost benchmarks, failure indicators, and the 40% rule that determines your answer.',
    imageUrl: '/hero-paving.jpg',
    datePublished: '2026-05-08T08:00:00-04:00',
    dateModified: '2026-05-29T08:00:00-04:00',
  })

  return (
    <div className="min-h-screen bg-background font-body">
      <SEO
        title="Parking Lot Repair vs. Replacement in Virginia: How to Decide — J. Worden & Sons"
        description="A commercial property manager's guide to deciding between asphalt parking lot repair and full reconstruction — cost benchmarks, failure indicators, and the 40% rule."
        canonicalPath="/blog/info/parking-lot-repair-vs-replace-virginia"
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
            <span className="text-primary font-bold">Commercial</span>
            <span>•</span>
            <div className="flex items-center"><Calendar className="w-3 h-3 mr-1.5" /> May 2026</div>
            <span>•</span>
            <div className="flex items-center"><Clock className="w-3 h-3 mr-1.5" /> 7 min read</div>
          </div>
          <h1 className="font-display font-black text-foreground text-4xl md:text-5xl uppercase tracking-tight leading-[0.95] mb-6">
            Parking Lot Repair vs. Full Replacement: How to Decide
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
            The wrong choice costs you twice. Here's the framework we use to give property managers an honest answer — before we write the bid.
          </p>
        </header>

        <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed space-y-6">

          <p>
            Every commercial property manager eventually faces this decision. The lot looks rough. Bids range wildly. One contractor says patch it, another says tear it out. The truth is that both answers can be right — it depends on where the failure lives and how much of the surface is affected. Here's how to think through it.
          </p>

          <h2 className="font-display text-2xl text-foreground uppercase tracking-wide mt-10 mb-4 font-black">
            The 40% Rule
          </h2>
          <p>
            The industry standard threshold: <strong className="text-foreground">if more than 40% of a parking lot surface has failed or requires repair, full reconstruction typically costs less over a 10-year horizon than repeated repair cycles.</strong>
          </p>
          <p>
            Below 40% failure, targeted repairs — crack sealing, infrared patching, skin patching, mill-and-fill in isolated areas — are the right call. Above 40%, you're chasing failures. You repair one section and the adjacent section fails the next season because the underlying base has been compromised.
          </p>

          <h2 className="font-display text-2xl text-foreground uppercase tracking-wide mt-10 mb-4 font-black">
            Surface Failure vs. Base Failure: The Critical Distinction
          </h2>
          <p>
            This is the question that determines everything. Surface failures — oxidation, surface cracking, minor raveling — are repaired from the top. Base failures — alligator cracking, potholes, sinking sections, edge crumbling — cannot be fixed from the surface. Paving over a failed base is the most common money-wasting mistake in commercial asphalt.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
            <div className="bg-card border border-border p-5 rounded-sm">
              <p className="font-display font-bold text-primary text-xs uppercase tracking-wide mb-3">Surface Failure — Repairable</p>
              <div className="space-y-2">
                {[
                  'Longitudinal or transverse cracking (linear cracks)',
                  'Surface oxidation and raveling (grainy, faded surface)',
                  'Shallow depressions under 1 inch',
                  'Edge cracking without base movement',
                  'Minor block cracking (hairline thermal pattern)',
                ].map(s => (
                  <div key={s} className="flex gap-2 items-start">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm">{s}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border p-5 rounded-sm">
              <p className="font-display font-bold text-foreground text-xs uppercase tracking-wide mb-3">Base Failure — Requires Reconstruction</p>
              <div className="space-y-2">
                {[
                  'Alligator (fatigue) cracking — interconnected web pattern',
                  'Potholes with depth below 2 inches',
                  'Rutting or shoving — surface moves under traffic',
                  'Subsidence — sections sinking or heaving',
                  'Edge collapse with visible aggregate',
                ].map(s => (
                  <div key={s} className="flex gap-2 items-start">
                    <AlertTriangle className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
                    <p className="text-sm">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <h2 className="font-display text-2xl text-foreground uppercase tracking-wide mt-10 mb-4 font-black">
            Cost Benchmarks: Virginia Commercial Lots (2026)
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border">
              <thead>
                <tr className="bg-card">
                  <th className="text-left p-3 font-display uppercase text-foreground text-xs tracking-wide">Scope</th>
                  <th className="text-left p-3 font-display uppercase text-foreground text-xs tracking-wide">Cost Range</th>
                  <th className="text-left p-3 font-display uppercase text-foreground text-xs tracking-wide">Best For</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ['Crack sealing', '$0.50–$1.50/linear ft', 'Early-stage surface cracks, preventive maintenance'],
                  ['Infrared patch (per spot)', '$400–$900/location', 'Isolated potholes, utility cut repairs'],
                  ['Skin patch / mill & fill', '$2–$5/sq ft', 'Failed sections under 25% of lot'],
                  ['Sealcoat + restripe', '$0.15–$0.35/sq ft', 'Good-condition lots, annual maintenance'],
                  ['Overlay (2" course)', '$4–$7/sq ft', 'Lots with sound base, aging surface'],
                  ['Full reconstruction', '$8–$18/sq ft', 'Failed base, >40% damage, aged lot'],
                ].map(([scope, cost, best]) => (
                  <tr key={scope} className="hover:bg-card/50">
                    <td className="p-3 text-foreground font-medium">{scope}</td>
                    <td className="p-3 text-primary">{cost}</td>
                    <td className="p-3 text-xs">{best}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="font-display text-2xl text-foreground uppercase tracking-wide mt-10 mb-4 font-black">
            The 3-Year Maintenance Window Trap
          </h2>
          <p>
            The most expensive pattern we see in commercial lots is deferred maintenance. A property manager patches the worst areas every spring without a plan. Five years later, the lot is 60% failed, the base is compromised across the whole surface, and the reconstruction cost is double what a properly timed overlay would have cost three years earlier.
          </p>
          <p>
            The smarter model: get a written pavement condition assessment with a 5-year maintenance schedule. Budget sealcoating and crack sealing as a line item. Do an overlay before base failure sets in. This approach reduces total lifecycle cost by 30–40% compared to reactive repair.
          </p>

          <h2 className="font-display text-2xl text-foreground uppercase tracking-wide mt-10 mb-4 font-black">
            Liability: The Factor Property Managers Overlook
          </h2>
          <p>
            A pothole injury on your commercial property is a premises liability exposure. Virginia courts have consistently held property owners liable for failing to maintain safe pavement in high-traffic areas. The typical slip-and-fall or vehicle damage claim from a pothole runs $15,000–$80,000 in settlement. A $12,000 lot repair looks very different next to that number.
          </p>
          <p>
            Document your lot condition with dated photos. If you receive notice of a defect and fail to repair it, your liability exposure increases substantially.
          </p>

          <div className="bg-card border border-border p-8 my-10 rounded-sm">
            <h4 className="font-display text-lg text-primary uppercase font-bold mb-2">Free Parking Lot Assessment</h4>
            <p className="mb-6 text-sm">We'll walk your lot, rate the condition by zone, give you an honest repair vs. replace recommendation in writing, and show you the cost difference over a 10-year horizon.</p>
            <Link to="/parking-lots" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-display font-bold text-xs tracking-[0.14em] uppercase rounded hover:bg-primary/90 transition-all">
              Request Lot Assessment <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>

          <div className="border-t border-border pt-8 mt-8">
            <p className="text-sm">
              <strong className="text-foreground">Related reading:</strong>{' '}
              <Link to="/blog/repair-vs-replace-parking-lot-guide" className="text-primary hover:underline">Parking lot repair vs. replacement cost guide</Link>
              {' · '}
              <Link to="/parking-lots" className="text-primary hover:underline">Commercial parking lot services</Link>
              {' · '}
              <Link to="/crack-repair" className="text-primary hover:underline">Crack repair services</Link>
            </p>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  )
}
