import React from 'react';
import { Phone, Shield, Star } from 'lucide-react';
import { trackPhoneClick } from '@/lib/analytics';

/**
 * Hero section for LocationsIndex — keyword-rich H1, intro copy,
 * trust signals, and a strong CTA above the fold.
 */
export default function LocationsHero({ cityCount }) {
  return (
    <section className="pt-32 pb-16 border-b border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-3">
          // Virginia Service Areas
        </p>
        <h1 className="font-display font-black text-foreground text-4xl md:text-6xl lg:text-7xl uppercase tracking-tight leading-[0.95] max-w-5xl">
          Asphalt Paving Across{' '}
          <span className="text-primary">All of Virginia</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
          <div className="lg:col-span-2 space-y-4">
            <p className="font-body text-foreground/90 text-lg md:text-xl leading-relaxed">
              J. Worden & Sons is Virginia's family-owned asphalt paving contractor — headquartered in Chester and serving every corner of the Commonwealth for over 40 years. From Richmond driveways and Virginia Beach coastal-spec builds to Roanoke's Blue Ridge freeze-thaw engineering and Fredericksburg's virgin-soil new-construction work, we bring region-specific specs to every job.
            </p>
            <p className="font-body text-muted-foreground text-base md:text-lg leading-relaxed">
              Pick your Virginia city below for local climate analysis, neighborhood coverage, permitting details, and region-specific engineering notes. Every market page is written by paving professionals — no canned SEO copy, no out-of-state pretenders.
            </p>
          </div>

          {/* Trust sidebar */}
          <aside className="border border-border bg-card p-6 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <div className="w-10 h-10 bg-primary flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-display font-black text-foreground text-xs tracking-wider uppercase">
                  VA Licensed Contractor
                </p>
                <p className="font-display text-muted-foreground text-[10px] tracking-wider uppercase mt-0.5">
                  Bonded · Insured · NASCLA
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <Star className="w-5 h-5 text-primary fill-primary" />
              <div>
                <p className="font-display font-black text-foreground text-xs tracking-wider uppercase">
                  4.9 / 5 · 1,289 Reviews
                </p>
                <p className="font-display text-muted-foreground text-[10px] tracking-wider uppercase mt-0.5">
                  Houzz · Angi · Facebook
                </p>
              </div>
            </div>
            <a
              href="tel:+18044461296"
              onClick={() => trackPhoneClick('locations_hero')}
              className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground px-5 py-4 font-display font-bold text-sm tracking-wider uppercase hover:bg-primary/90 transition-colors"
            >
              <Phone className="w-4 h-4" />
              (804) 446-1296
            </a>
            <p className="font-body text-muted-foreground text-xs leading-relaxed text-center">
              Serving <span className="text-foreground font-bold">{cityCount} Virginia cities</span> · Same-week site visits
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
