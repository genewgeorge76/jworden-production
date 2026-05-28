import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Percent } from 'lucide-react';

export default function BeatAnyQuoteBadge() {
  const scrollToQuote = () => {
    const el = document.querySelector('#quote');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="border-t border-border py-16 md:py-20 bg-obsidian">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-center gap-8 border-2 border-primary bg-background p-8 md:p-12"
        >
          {/* Stamp */}
          <div className="relative shrink-0">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-primary flex flex-col items-center justify-center border-4 border-background shadow-2xl">
              <Percent className="w-6 h-6 md:w-8 md:h-8 text-primary-foreground" strokeWidth={3} />
              <p className="font-display font-black text-primary-foreground text-3xl md:text-4xl leading-none mt-1">
                5%
              </p>
              <p className="font-display font-black text-primary-foreground text-[9px] md:text-[10px] tracking-[0.2em] uppercase mt-1">
                Beat Rate
              </p>
            </div>
          </div>

          {/* Copy */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <p className="font-display text-primary text-[10px] tracking-[0.3em] uppercase">
                Written Guarantee
              </p>
            </div>
            <h3 className="font-display font-black text-foreground text-3xl md:text-4xl uppercase tracking-tight leading-[0.95] mb-3">
              Beat Any Written Quote by 5%
            </h3>
            <p className="font-body text-muted-foreground text-base leading-relaxed max-w-xl">
              Bring us a competitor's written estimate for the same scope and spec — we'll beat it by 5% or send you home with $100. Because cheap paving isn't a deal when it cracks in two winters.
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={scrollToQuote}
            className="shrink-0 bg-primary text-primary-foreground px-8 py-5 font-display font-bold text-sm tracking-wider uppercase hover:bg-primary/90 transition-colors min-h-[56px] whitespace-nowrap"
          >
            Bring Your Quote
          </button>
        </motion.div>
      </div>
    </section>
  );
}
