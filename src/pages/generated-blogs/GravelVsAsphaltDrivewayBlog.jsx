import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SEO from '@/components/SEO'
import { premiumBlogPostingSchema } from '@/components/SchemaMarkup'
import { Calendar, Clock, ArrowRight, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react'

export default function GravelVsAsphaltDrivewayBlog() {
  const jsonLd = premiumBlogPostingSchema({
    slug: 'info/gravel-vs-asphalt-driveway-virginia',
    headline: 'Gravel vs Asphalt Driveway in Virginia: Which Should You Choose?',
    description:
      'Honest comparison of gravel and asphalt driveways for Virginia properties — upfront cost, maintenance, lifespan, and which option fits which type of property.',
    imageUrl: '/hero-paving.jpg',
    datePublished: '2026-05-30T08:00:00-04:00',
    dateModified: '2026-05-30T08:00:00-04:00',
  })

  return (
    <div className="min-h-screen bg-background font-body">
      <SEO
        title="Gravel vs Asphalt Driveway Virginia: Which Is Right for Your Property? — J. Worden & Sons"
        description="Honest comparison of gravel and asphalt driveways for Virginia properties — upfront cost, maintenance, lifespan, and which option fits which type of property."
        canonicalPath="/blog/info/gravel-vs-asphalt-driveway-virginia"
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
            <span className="text-primary font-bold">Driveway Options</span>
            <span>•</span>
            <div className="flex items-center"><Calendar className="w-3 h-3 mr-1.5" /> May 2026</div>
            <span>•</span>
            <div className="flex items-center"><Clock className="w-3 h-3 mr-1.5" /> 6 min read</div>
          </div>
          <h1 className="font-display font-black text-foreground text-4xl md:text-5xl uppercase tracking-tight leading-[0.95] mb-6">
            Gravel vs Asphalt Driveway in Virginia
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
            Upfront cost, long-term maintenance, and the honest answer to which surface is the better investment for your property.
          </p>
        </header>

        <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed space-y-6">

          <p>
            Gravel is cheaper up front. Asphalt is more durable and lower-maintenance long-term. That's the short version — but neither of those facts fully answers the question for your specific driveway. The right choice depends on traffic volume, drainage conditions, lot size, soil type, and how much time you want to spend on annual maintenance. Here's the comparison that actually helps you decide.
          </p>

          <h2 className="font-display text-2xl text-foreground uppercase tracking-wide mt-10 mb-4 font-black">
            Cost Comparison: Gravel vs Asphalt in Virginia (2026)
          </h2>

          <div className="overflow-x-auto my-8">
            <table className="w-full text-sm border border-border">
              <thead>
                <tr className="bg-card">
                  <th className="text-left p-4 font-display uppercase tracking-wide text-foreground border-b border-border">Factor</th>
                  <th className="text-left p-4 font-display uppercase tracking-wide text-foreground border-b border-border">Gravel</th>
                  <th className="text-left p-4 font-display uppercase tracking-wide text-foreground border-b border-border">Asphalt</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { factor: 'Install cost', gravel: '$1.50 – $3.00 / sq ft', asphalt: '$4.00 – $7.00 / sq ft' },
                  { factor: '1,000 sq ft driveway', gravel: '$1,500 – $3,000', asphalt: '$4,000 – $7,000' },
                  { factor: 'Annual maintenance', gravel: '$300 – $800 (regrading, top-dress)', asphalt: '$50 – $150 (crack sealing, inspection)' },
                  { factor: 'Sealcoating / renewal', gravel: 'N/A', asphalt: '$150 – $350 every 2–3 years' },
                  { factor: 'Expected lifespan', gravel: 'Indefinite with annual topdress', asphalt: '20 – 30 years' },
                  { factor: 'Snow plowing', gravel: 'Difficult — plow displaces stone', asphalt: 'Standard blade, no displacement' },
                  { factor: 'Mud in wet weather', gravel: 'Can wash out on clay subsoil', asphalt: 'None when properly drained' },
                ].map((row, i) => (
                  <tr key={row.factor} className={i % 2 === 0 ? 'bg-background' : 'bg-card/50'}>
                    <td className="p-4 font-medium text-foreground border-b border-border">{row.factor}</td>
                    <td className="p-4 border-b border-border">{row.gravel}</td>
                    <td className="p-4 border-b border-border">{row.asphalt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="font-display text-2xl text-foreground uppercase tracking-wide mt-10 mb-4 font-black">
            When Gravel Is the Right Choice
          </h2>

          <div className="space-y-4">
            {[
              { title: 'Long rural driveways on large lots', detail: 'A 600-foot driveway in Louisa, Cumberland, or King William County that sees 10–20 vehicle passes per day can run on gravel indefinitely with an annual topdress and regrading pass. The savings over asphalt on 4,000+ sq ft of surface can be $10,000–$20,000.' },
              { title: 'Temporary or transitional paving', detail: 'New construction phases, land under development, or properties you plan to subdivide or sell as raw land in the next five years don\'t benefit from a full asphalt install. Gravel protects the sub-grade while plans develop.' },
              { title: 'Properties where drainage flexibility matters', detail: 'Gravel allows stormwater infiltration across the surface rather than concentrating runoff at outfall points. In some Virginia counties with stormwater management requirements, a gravel or permeable surface can reduce the required drainage infrastructure.' },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 bg-card border border-border p-5 rounded-sm">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-display font-bold text-foreground text-sm uppercase tracking-wide mb-1">{item.title}</p>
                  <p className="text-sm">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="font-display text-2xl text-foreground uppercase tracking-wide mt-10 mb-4 font-black">
            When Asphalt Is the Right Choice
          </h2>

          <div className="space-y-4">
            {[
              { title: 'Clay subsoil that turns to mud', detail: 'If your gravel driveway is producing mud in wet weather — especially on Piedmont or Southside Virginia clay — it means the clay is pumping up through the gravel base. The fix is asphalt with a geotextile fabric separator above the clay. More gravel on top just delays the problem.' },
              { title: 'Daily commuter use on a suburban or semi-rural property', detail: 'A driveway used 4–8 times per day by passenger vehicles, especially one under 200 feet, should be asphalt. The maintenance difference on a well-traveled gravel driveway (annual regrading, repeated topdressing, stone migration onto lawn and road) adds up to $300–$700 per year that an asphalt surface eliminates.' },
              { title: 'Properties where appearance and resale matter', detail: 'Asphalt adds curb appeal and buyer confidence in suburban Virginia markets. A well-maintained asphalt driveway conveys that the property is cared for; a rutted or muddy gravel driveway signals ongoing cost to buyers.' },
              { title: 'Steep grades and sloped approaches', detail: 'Gravel migrates downhill on slopes above 5–6%. An approach on a hillside property in the Charlottesville foothills or the Northern Virginia Piedmont will lose its surface material to erosion. Asphalt stays in place.' },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 bg-card border border-border p-5 rounded-sm">
                <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-display font-bold text-foreground text-sm uppercase tracking-wide mb-1">{item.title}</p>
                  <p className="text-sm">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="font-display text-2xl text-foreground uppercase tracking-wide mt-10 mb-4 font-black">
            The Middle Option: Tar and Chip
          </h2>
          <p>
            For properties that want a bound surface at lower cost than full asphalt — especially rural driveways and equestrian properties — tar and chip (chip seal) is worth comparing. It installs at $2.50–$4.50 per square foot (versus $4–$7 for asphalt), handles low-traffic rural use well, and fits the rural Virginia landscape. It's not the right surface for high-traffic or commercial use, but it fills the gap between gravel and asphalt for a large share of Virginia rural properties.
          </p>

          <div className="bg-card border border-border p-8 my-10 rounded-sm">
            <h4 className="font-display text-lg text-primary uppercase font-bold mb-2">Not Sure Which Surface Is Right?</h4>
            <p className="mb-6 text-sm">We'll visit the property, look at the soil, grade, and traffic pattern, and give you straight numbers for gravel conversion, tar and chip, and full asphalt so you can compare all three before deciding.</p>
            <Link to="/quote" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-display font-bold text-xs tracking-[0.14em] uppercase rounded hover:bg-primary/90 transition-all">
              Request Free Estimate <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>

          <div className="border-t border-border pt-8 mt-8">
            <p className="text-sm">
              <strong className="text-foreground">Related reading:</strong>{' '}
              <Link to="/blog/info/tar-and-chip-paving-virginia" className="text-primary hover:underline">Tar and chip paving in Virginia: cost and lifespan guide</Link>
              {' · '}
              <Link to="/blog/info/driveway-paving-cost-virginia" className="text-primary hover:underline">How much does driveway paving cost in Virginia?</Link>
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
