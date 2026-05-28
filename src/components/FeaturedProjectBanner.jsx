import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Ruler } from 'lucide-react';

const HERO_SHOT = '/hero-paving.jpg';

export default function FeaturedProjectBanner() {
  const scrollToFootprint = () => {
    const el = document.querySelector('#footprint');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="border-t border-border">
      <div className="relative w-full overflow-hidden">
        <div className="relative aspect-[21/9] min-h-[420px] max-h-[680px]">
          <img
            src={HERO_SHOT}
            alt="Completed KFC / Taco Bell combo build at dusk — Overland Park, KS"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Dark overlay for legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/30 to-transparent" />

          {/* Content */}
          <div className="relative z-10 h-full flex items-end">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-10 md:pb-16 w-full">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="max-w-2xl"
              >
                <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-3">
                  // Featured Project · QSR Combo New Build
                </p>
                <h2 className="font-display font-black text-foreground text-3xl md:text-5xl lg:text-6xl uppercase tracking-tight leading-[0.95]">
                  KFC · Taco Bell<br />
                  <span className="text-primary">Combo Build</span>
                </h2>
                <p className="font-body text-foreground/80 text-base md:text-lg mt-4 md:mt-6 leading-relaxed">
                  Full-scope site work — from subgrade prep and reinforced concrete curbs to final asphalt and striping. Delivered on schedule, under a winter sunset in Overland Park, Kansas.
                </p>

                {/* Meta row */}
                <div className="flex flex-wrap gap-5 md:gap-7 mt-6 md:mt-8 border-t border-border/60 pt-5">
                  <span className="flex items-center gap-2 text-muted-foreground font-display text-xs tracking-wider uppercase">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    Overland Park, KS
                  </span>
                  <span className="flex items-center gap-2 text-muted-foreground font-display text-xs tracking-wider uppercase">
                    <Ruler className="w-3.5 h-3.5 text-primary" />
                    34,000 sq ft
                  </span>
                  <span className="flex items-center gap-2 text-muted-foreground font-display text-xs tracking-wider uppercase">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    Completed 2017
                  </span>
                </div>

                <button
                  onClick={scrollToFootprint}
                  className="mt-7 md:mt-8 bg-primary text-primary-foreground px-6 py-3 font-display font-bold text-xs tracking-[0.2em] uppercase hover:bg-primary/90 transition-colors"
                >
                  View National Footprint →
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
