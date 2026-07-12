import { Link } from '@tanstack/react-router'

export default function EliteSplit() {
  return (
    <section className="bg-[#0b0b0e] text-white px-6 py-16">
      <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-8">
        <div className="relative overflow-hidden rounded-sm border border-[#2b2b2b] bg-linear-to-br from-[#0f0f12] via-[#141419] to-[#1b1b21] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.06),transparent_45%)]" />
          <div className="relative space-y-4">
            <p className="text-[0.75rem] uppercase tracking-[0.22em] text-[#c8a84b] font-semibold">
              Commercial Power — Rose Paving Class
            </p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              Heavy-Duty Lots <span className="text-[#c8a84b]">Built to Stay Open</span>
            </h2>
            <p className="text-[#d7d7d7] leading-relaxed">
              KFC, Taco Bell, and grocery lots with a six-inch compacted stone base, ADA striping, night work, and traffic-control crews that keep revenue flowing.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="tel:8044461296"
                className="rounded-sm bg-[#c8a84b] px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[#0b0b0e] hover:bg-[#e0c06a] transition-colors"
              >
                Call 804-446-1296
              </a>
              <Link
                to="/commercial"
                className="rounded-sm border border-white/40 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] hover:border-[#c8a84b] hover:text-[#c8a84b] transition-colors"
              >
                Commercial Proof
              </Link>
            </div>
            <div className="pt-4 flex flex-wrap gap-2 text-xs text-[#b5b5b5] uppercase tracking-[0.16em]">
              <span className="px-3 py-1 rounded-sm bg-white/5 border border-white/10">Six-Inch Structural Standard</span>
              <span className="px-3 py-1 rounded-sm bg-white/5 border border-white/10">Night &amp; Weekend Crews</span>
              <span className="px-3 py-1 rounded-sm bg-white/5 border border-white/10">ADA Striping Included</span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-sm border border-[#1f261f] bg-linear-to-br from-[#0f1610] via-[#112016] to-[#0f2717] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.30)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,196,132,0.14),transparent_40%)]" />
          <div className="relative space-y-4">
            <p className="text-[0.75rem] uppercase tracking-[0.22em] text-[#5bdd8a] font-semibold">
              Residential Luxury — Metropolitan Precision
            </p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              Estate Drives <span className="text-[#5bdd8a]">Without a Rattle</span>
            </h2>
            <p className="text-[#d9f1e3] leading-relaxed">
              Windsor Farms, Westham Parkway, and Stratford Hills drives poured with commercial compaction, hand-finished edges, and drainage tuned for river slopes and tree canopies.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/locations/windsor-farms"
                className="rounded-sm bg-[#5bdd8a] px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[#0e1a11] hover:bg-[#73f0a2] transition-colors"
              >
                Richmond Estates
              </Link>
              <Link
                to="/locations/mclean"
                className="rounded-sm border border-[#83f1aa]/70 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[#d9f1e3] hover:border-white hover:text-white transition-colors"
              >
                McLean Walkthrough
              </Link>
            </div>
            <div className="pt-4 flex flex-wrap gap-2 text-xs text-[#bfe8cf] uppercase tracking-[0.16em]">
              <span className="px-3 py-1 rounded-sm bg-white/5 border border-white/10">Hand-Finished Aprons</span>
              <span className="px-3 py-1 rounded-sm bg-white/5 border border-white/10">Drainage &amp; Grade Tuning</span>
              <span className="px-3 py-1 rounded-sm bg-white/5 border border-white/10">Quiet, Low-Dust Crews</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
