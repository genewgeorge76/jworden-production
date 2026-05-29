import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SEO from '@/components/SEO'
import { premiumBlogPostingSchema } from '@/components/SchemaMarkup'
import { Calendar, Clock, ArrowRight, ArrowLeft } from 'lucide-react'

export default function SignsDrivewayNeedsRepavingBlog() {
  const jsonLd = premiumBlogPostingSchema({
    slug: 'info/signs-driveway-needs-repaving-virginia',
    headline: '7 Signs Your Driveway Needs Repaving in Virginia',
    description:
      'Virginia homeowners: learn the 7 warning signs that your asphalt driveway has reached the end of its repair life and needs full replacement — before the problem becomes more expensive.',
    imageUrl: '/hero-paving.jpg',
    datePublished: '2026-05-12T08:00:00-04:00',
    dateModified: '2026-05-29T08:00:00-04:00',
  })

  return (
    <div className="min-h-screen bg-background font-body">
      <SEO
        title="7 Signs Your Driveway Needs Repaving in Virginia — J. Worden & Sons"
        description="Virginia homeowners: learn the 7 warning signs that your asphalt driveway has reached the end of its repair life and needs full replacement before it gets more expensive."
        canonicalPath="/blog/info/signs-driveway-needs-repaving-virginia"
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
            <span className="text-primary font-bold">Homeowner Guide</span>
            <span>•</span>
            <div className="flex items-center"><Calendar className="w-3 h-3 mr-1.5" /> May 2026</div>
            <span>•</span>
            <div className="flex items-center"><Clock className="w-3 h-3 mr-1.5" /> 5 min read</div>
          </div>
          <h1 className="font-display font-black text-foreground text-4xl md:text-5xl uppercase tracking-tight leading-[0.95] mb-6">
            7 Signs Your Driveway Needs Repaving in Virginia
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
            Most driveways give you clear warning before they fail completely. Here's how to read them — and when patching stops making financial sense.
          </p>
        </header>

        <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed space-y-6">

          <p>
            A properly maintained asphalt driveway in Virginia lasts 20–30 years. But most driveways we're called to replace are 12–18 years old — they failed early because the warning signs were ignored until patching became more expensive than starting over. Here are the seven signs that your driveway has crossed that line.
          </p>

          <div className="space-y-8 mt-8">
            {[
              {
                number: '01',
                title: 'Alligator Cracking Across Multiple Sections',
                body: 'Alligator cracking — the interconnected web pattern that looks like reptile scales — is a base failure signal, not a surface problem. It means the structural foundation beneath the asphalt has been compromised by water, soil movement, or load failure. You cannot fix alligator cracking by filling the cracks or adding an overlay. Water will continue reaching the damaged base and the cracking will return within one to two seasons. Once alligator cracking covers more than 25–30% of your driveway, replacement is the right call.',
              },
              {
                number: '02',
                title: 'Multiple Potholes Recurring After Repair',
                body: 'A single pothole in an otherwise sound driveway is repairable. Multiple potholes that return season after season — particularly in the same locations — indicate the base is failing in those areas. The base holds water, freezes, and the cycle punches out new potholes each spring. Repeated pothole patching in the same spots is money spent without solving the underlying problem.',
              },
              {
                number: '03',
                title: 'Visible Drainage Problems and Pooling Water',
                body: 'Standing water on your driveway after rain indicates the surface has lost its crown (the slight slope that sheds water) or has developed low spots from base settlement. Water sitting on asphalt accelerates surface oxidation and — more critically — finds its way through cracks to the base. A driveway that holds water is aging faster than one that drains. Regrading minor areas is possible, but widespread drainage failure usually means the base has shifted.',
              },
              {
                number: '04',
                title: 'Edges Crumbling and Breaking Away',
                body: 'Asphalt edges are the most vulnerable part of a driveway — they have no lateral support. Minor edge cracking is normal and can be sealed. But when large chunks of the edge are breaking away, exposing the base aggregate, the structural integrity of the surface is gone in those sections. Edge failure spreads inward over time as water penetrates the exposed aggregate and the surrounding asphalt loses support.',
              },
              {
                number: '05',
                title: 'Surface Is Gray, Brittle, and Crumbling (Raveling)',
                body: 'Fresh asphalt is black and cohesive. As it ages, UV exposure oxidizes the binders that hold the aggregate together. When you walk on a dry day and the surface crumbles underfoot or kicks up loose aggregate, the asphalt has entered advanced raveling. At this stage, sealcoating — which is a surface treatment — cannot restore structural integrity. A 2-inch overlay may extend life, but only if the base is sound. If the driveway is gray, brittle, and 20+ years old, replacement is typically the better long-term investment.',
              },
              {
                number: '06',
                title: 'Significant Surface Depressions or Rutting',
                body: 'Depressions deeper than 1 inch, or ruts that have formed in your tire tracks, indicate the base has compressed unevenly or the sub-base has settled. This is common in Virginia\'s clay soil, where the soil expands and contracts with moisture. Depressions hold water, which accelerates failure. Rutting is particularly common in driveways that were installed without sufficient base depth — a shortcut that saves money at installation and costs far more over the driveway\'s life.',
              },
              {
                number: '07',
                title: 'The Repair Cost Exceeds 50% of Replacement',
                body: 'This is the financial test. When a contractor walks your driveway and the repair scope — patching, crack filling, leveling, and resurfacing — approaches 50% of what a new installation would cost, you are better off replacing. A repaired old driveway still has an aging base, still has the original installation\'s lifespan limitations, and will likely require additional repairs within 3–5 years. A new installation carries a fresh 20-30 year clock.',
              },
            ].map(({ number, title, body }) => (
              <div key={number} className="flex gap-6 border-b border-border pb-8">
                <div className="shrink-0">
                  <span className="font-display font-black text-primary text-3xl leading-none">{number}</span>
                </div>
                <div>
                  <h2 className="font-display font-black text-foreground text-xl uppercase tracking-wide mb-3">{title}</h2>
                  <p className="text-sm leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="font-display text-2xl text-foreground uppercase tracking-wide mt-10 mb-4 font-black">
            What to Do If You See These Signs
          </h2>
          <p>
            Don't wait for full failure. A driveway that's showing signs 1 through 3 is still a candidate for a properly scoped repair or overlay. Once signs 4 through 7 are present across more than a third of the surface, the math almost always favors replacement.
          </p>
          <p>
            The most important step: get a contractor to physically assess the base before they write a scope. Any contractor who quotes a repair without probing the base or at least walking the surface carefully is guessing. We walk every driveway before we write a single number.
          </p>

          <div className="bg-card border border-border p-8 my-10 rounded-sm">
            <h4 className="font-display text-lg text-primary uppercase font-bold mb-2">Free Driveway Assessment — Richmond & Central Virginia</h4>
            <p className="mb-6 text-sm">We'll walk your driveway, assess the base condition, and give you an honest recommendation in writing — repair, overlay, or replace — with pricing for each option.</p>
            <Link to="/quote" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-display font-bold text-xs tracking-[0.14em] uppercase rounded hover:bg-primary/90 transition-all">
              Get a Free Assessment <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>

          <div className="border-t border-border pt-8 mt-8">
            <p className="text-sm">
              <strong className="text-foreground">Related reading:</strong>{' '}
              <Link to="/blog/asphalt-driveway-lifespan-virginia" className="text-primary hover:underline">How long does a driveway last in Virginia?</Link>
              {' · '}
              <Link to="/blog/info/driveway-paving-cost-virginia" className="text-primary hover:underline">What does driveway paving cost in Virginia?</Link>
              {' · '}
              <Link to="/residential" className="text-primary hover:underline">Residential paving services</Link>
            </p>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  )
}
