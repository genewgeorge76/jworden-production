import React from 'react';
import { Phone, Mail } from 'lucide-react';

export default function MarketCTA({ city, state }) {
  return (
    <section className="border-t border-border py-16 md:py-20 bg-primary">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <p className="font-display text-primary-foreground/70 text-xs tracking-[0.3em] uppercase mb-4">
          Ready to start your {city} project?
        </p>
        <h2 className="font-display font-black text-primary-foreground text-3xl md:text-5xl uppercase tracking-tight leading-[1.05] mb-8">
          Get a Precision Quote for Your {city}, {state} Property
        </h2>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="tel:+18044461296"
            className="bg-primary-foreground text-primary px-7 py-4 font-display font-bold text-sm tracking-wider uppercase hover:bg-primary-foreground/90 transition-colors min-h-[48px] flex items-center gap-2"
          >
            <Phone className="w-4 h-4" /> (804) 446-1296
          </a>
          <a
            href="mailto:j.wordenandsonspaving@gmail.com"
            className="border border-primary-foreground/40 text-primary-foreground px-7 py-4 font-display font-bold text-sm tracking-wider uppercase hover:bg-primary-foreground/10 transition-colors min-h-[48px] flex items-center gap-2"
          >
            <Mail className="w-4 h-4" /> Email Estimate Team
          </a>
        </div>
      </div>
    </section>
  );
}
