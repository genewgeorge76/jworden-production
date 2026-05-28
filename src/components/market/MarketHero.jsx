import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, ArrowDown } from 'lucide-react';
import SmartImage from '../SmartImage';

const HERO_IMAGE = '/work/imported/KFC/IMG_9510.JPG';

export default function MarketHero({ city, state, region, headline, intro }) {
  const scrollDown = () => {
    const el = document.querySelector('#market-content');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[80vh] flex flex-col justify-end overflow-hidden">
      <div className="absolute inset-0">
        <SmartImage
          src={HERO_IMAGE}
          alt={`Asphalt paving services in ${city}, ${state}`}
          width={2400}
          height={1350}
          priority
          sizes="100vw"
          className="w-full h-full object-cover quality-premium"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pb-12 pt-32 w-full">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center gap-2 mb-5">
            <MapPin className="w-4 h-4 text-primary" />
            <p className="font-display text-primary text-sm tracking-[0.3em] uppercase">
              {region} · J. Worden & Sons
            </p>
          </div>

          <h1 className="font-display font-black text-foreground uppercase leading-[0.9] tracking-tight text-4xl md:text-6xl lg:text-7xl max-w-4xl">
            {headline}
          </h1>

          <p className="text-muted-foreground mt-6 text-lg md:text-xl max-w-2xl leading-relaxed">
            {intro}
          </p>

          <div className="mt-10 flex flex-wrap gap-4 items-center">
            <a
              href="tel:+18044461296"
              className="bg-primary text-primary-foreground px-7 py-4 font-display font-bold text-sm tracking-wider uppercase hover:bg-primary/90 transition-colors min-h-[48px] flex items-center gap-2"
            >
              <Phone className="w-4 h-4" /> (804) 446-1296
            </a>
            <button
              onClick={scrollDown}
              className="border border-border text-foreground px-6 py-4 font-display font-bold text-sm tracking-wider uppercase hover:border-primary hover:text-primary transition-colors min-h-[48px] flex items-center gap-2"
            >
              Local Details <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
