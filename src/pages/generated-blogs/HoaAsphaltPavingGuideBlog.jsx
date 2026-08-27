import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import QuoteBlock from '@/components/QuoteBlock'
import SEO from '@/components/SEO'
import { premiumBlogPostingSchema } from '@/components/SchemaMarkup'
import { Calendar, Clock, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'

export default function HoaAsphaltPavingGuideBlog() {
  const jsonLd = premiumBlogPostingSchema({
    slug: 'info/hoa-asphalt-paving-guide-virginia',
    headline: 'HOA Asphalt Paving Guide: Roads, Parking Lots & Budgeting for Virginia Communities',
    description:
      'A complete guide for HOA boards and property managers on maintaining asphalt roads and parking lots in Virginia — inspection cycles, budgeting, bid evaluation, and contractor selection.',
    imageUrl: '/hero-paving.jpg',
    datePublished: '2026-05-15T08:00:00-04:00',
    dateModified: '2026-05-29T08:00:00-04:00',
  })

  return (
    <div className="min-h-screen bg-background font-body">
      <SEO
        title="HOA Asphalt Paving Guide: Roads, Lots & Budgeting in Virginia — J. Worden & Sons"
        description="Complete guide for HOA boards on maintaining asphalt roads and parking lots in Virginia — inspection cycles, reserve budgeting, bid evaluation, and contractor selection."
        canonicalPath="/blog/info/hoa-asphalt-paving-guide-virginia"
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
            <span className="text-primary font-bold">HOA & Property Management</span>
            <span>•</span>
            <div className="flex items-center"><Calendar className="w-3 h-3 mr-1.5" /> May 2026</div>
            <span>•</span>
            <div className="flex items-center"><Clock className="w-3 h-3 mr-1.5" /> 8 min read</div>
          </div>
          <h1 className="font-display font-black text-foreground text-4xl md:text-5xl uppercase tracking-tight leading-[0.95] mb-6">
            HOA Asphalt Paving Guide: Roads, Parking Lots & Budgeting in Virginia
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
            A practical framework for HOA boards and property managers — from annual inspection to reserve funding to selecting a contractor who won't disappear after the job.
          </p>
        </header>

        <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed space-y-6">

          <p>
            Asphalt infrastructure is typically the largest single maintenance liability in an HOA's reserve fund. Roadways, parking areas, and shared drives in Virginia communities can represent $50,000 to $500,000+ in replacement cost depending on community size. Boards that manage this asset proactively spend 30–40% less over a 20-year horizon than those who defer until failure forces emergency replacement.
          </p>

          <h2 className="font-display text-2xl text-foreground uppercase tracking-wide mt-10 mb-4 font-black">
            The HOA Pavement Lifecycle Framework
          </h2>
          <p>
            Virginia's climate — freeze-thaw cycles in winter, summer heat above 95°F, seasonal rainfall — accelerates asphalt aging compared to drier regions. A properly managed HOA asphalt program has four phases:
          </p>

          <div className="space-y-4 my-6">
            {[
              { phase: 'Years 1–3', action: 'New Installation Warranty & Monitoring', detail: 'Inspect annually. Verify contractor has addressed any settlement or cracking within the warranty period. Establish baseline condition photos.' },
              { phase: 'Years 3–7', action: 'Preventive Maintenance', detail: 'Crack sealing ($0.50–$1.50/linear ft) and sealcoating ($0.15–$0.35/sq ft) every 2–4 years. This is the lowest-cost phase and the most neglected.' },
              { phase: 'Years 8–15', action: 'Corrective Maintenance', detail: 'Skin patching, mill-and-fill of failed sections, infrared repair of isolated potholes. Budget $1–$4/sq ft for worst areas annually.' },
              { phase: 'Years 15–25', action: 'Overlay or Reconstruction', detail: 'A 1.5–2 inch overlay over sound base ($4–$7/sq ft) extends life 8–12 years. Full reconstruction ($10–$18/sq ft) when base has failed.' },
            ].map(({ phase, action, detail }) => (
              <div key={phase} className="flex gap-4 bg-card border border-border p-5 rounded-sm">
                <div className="shrink-0 w-20 text-right">
                  <span className="font-display font-black text-primary text-xs uppercase tracking-wide">{phase}</span>
                </div>
                <div className="border-l border-border pl-4">
                  <p className="font-display font-bold text-foreground text-sm uppercase tracking-wide mb-1">{action}</p>
                  <p className="text-sm">{detail}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="font-display text-2xl text-foreground uppercase tracking-wide mt-10 mb-4 font-black">
            Reserve Fund Budgeting for Asphalt
          </h2>
          <p>
            Virginia Code § 55.1-1964 requires HOAs with common area maintenance obligations to conduct a reserve study or disclose to members that they have not done so. A professionally prepared reserve study will include a pavement replacement line item. Here's how to sanity-check the numbers:
          </p>

          <div className="overflow-x-auto my-6">
            <table className="w-full text-sm border border-border">
              <thead>
                <tr className="bg-card">
                  <th className="text-left p-3 font-display uppercase text-foreground text-xs tracking-wide">Community Size</th>
                  <th className="text-left p-3 font-display uppercase text-foreground text-xs tracking-wide">Approx. Road/Lot Area</th>
                  <th className="text-left p-3 font-display uppercase text-foreground text-xs tracking-wide">Replacement Cost Range</th>
                  <th className="text-left p-3 font-display uppercase text-foreground text-xs tracking-wide">Annual Reserve Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ['50-unit townhome community', '15,000–25,000 sq ft', '$150K–$400K', '$7,500–$20,000/year'],
                  ['100-unit community', '30,000–50,000 sq ft', '$300K–$750K', '$15,000–$37,500/year'],
                  ['200+ unit community', '60,000–100,000+ sq ft', '$600K–$1.8M+', '$30,000–$90,000/year'],
                ].map(([size, area, cost, reserve]) => (
                  <tr key={size} className="hover:bg-card/50">
                    <td className="p-3 text-foreground font-medium text-xs">{size}</td>
                    <td className="p-3 text-xs">{area}</td>
                    <td className="p-3 text-primary text-xs">{cost}</td>
                    <td className="p-3 text-xs">{reserve}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground italic">Assumes 20-year replacement cycle. Annual contribution assumes 50% current funding level. These are estimates — a reserve study provides property-specific numbers.</p>

          <h2 className="font-display text-2xl text-foreground uppercase tracking-wide mt-10 mb-4 font-black">
            Annual Inspection Checklist for HOA Boards
          </h2>
          <p>Walk the community with this checklist each spring (after frost season) and fall (before winter):</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-6">
            {[
              'Photograph all visible cracking — note location and pattern type',
              'Measure approximate area of alligator cracking (base failure indicator)',
              'Check all drainage inlets and swales — clear blockages',
              'Walk parking lot perimeter for edge failure and drop-offs',
              'Test pavement flexibility — does it flex underfoot in failed areas?',
              'Check line striping visibility — faded striping is an ADA and safety issue',
              'Note any standing water locations 24 hours after rain',
              'Inspect speed bumps, curbing, and handicap ramp transitions',
              'Document any tree root intrusion near pavement edges',
              'Photograph before and after any patch repairs for warranty documentation',
            ].map(item => (
              <div key={item} className="flex gap-2 items-start">
                <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm">{item}</p>
              </div>
            ))}
          </div>

          <h2 className="font-display text-2xl text-foreground uppercase tracking-wide mt-10 mb-4 font-black">
            Evaluating Contractor Bids for HOA Work
          </h2>
          <p>
            HOA boards typically receive 3–5 bids for major paving work. Price is not the right sorting criterion. These are the questions that matter:
          </p>
          <ul className="list-disc pl-5 space-y-3 text-sm">
            <li><strong className="text-foreground">Is the scope of work identical across bids?</strong> A low bid is often a narrow scope. Compare base depth, mix design, thickness, and what's included in mobilization.</li>
            <li><strong className="text-foreground">What is the contractor's Virginia contractor license class?</strong> Commercial paving at HOA scale typically requires a Class A contractor license. Verify at the DPOR Board for Contractors website.</li>
            <li><strong className="text-foreground">Do they carry commercial general liability and workers' comp?</strong> Request certificates naming the HOA as additional insured for the project duration.</li>
            <li><strong className="text-foreground">What is the warranty on workmanship?</strong> Industry standard is 1 year on labor, but contractors who stand behind their work will offer 2–3 years on base and surface.</li>
            <li><strong className="text-foreground">Can they provide references from other HOA projects?</strong> Ask specifically for communities of similar size where you can walk the completed work.</li>
            <li><strong className="text-foreground">What is the phasing plan?</strong> Full community paving done in phases maintains resident access. A plan that closes an entire community at once is a red flag for poor project management.</li>
          </ul>

          <div className="bg-card border border-border p-8 my-10 rounded-sm">
            <h4 className="font-display text-lg text-primary uppercase font-bold mb-2">HOA Pavement Assessment — Central Virginia</h4>
            <p className="mb-6 text-sm">We provide written pavement condition assessments for HOA boards including zone-by-zone condition ratings, recommended action timelines, and budget projections. No cost, no obligation.</p>
            <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-display font-bold text-xs tracking-[0.14em] uppercase rounded hover:bg-primary/90 transition-all">
              Request HOA Assessment <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>

          <div className="border-t border-border pt-8 mt-8">
            <p className="text-sm">
              <strong className="text-foreground">Related reading:</strong>{' '}
              <Link to="/blog/hoa-roadway-maintenance-plan" className="text-primary hover:underline">Building a 3-year HOA roadway maintenance plan</Link>
              {' · '}
              <Link to="/blog/info/parking-lot-repair-vs-replace-virginia" className="text-primary hover:underline">Parking lot repair vs. replacement</Link>
              {' · '}
              <Link to="/parking-lots" className="text-primary hover:underline">Commercial paving services</Link>
            </p>
          </div>
        </div>
      </article>

      <QuoteBlock
        source="blog_hoa_paving"
        heading="Get a Proposal Your Board Can Actually Vote On"
        intro="Send the community and we will write it the way a board needs it: scope, phasing, resident access, and a number that survives the reserve study."
      />

      <Footer />
    </div>
  )
}
