import React from 'react';
import { motion } from 'framer-motion';
import { trackEvent } from '@/lib/analytics';
import SmartImage from './SmartImage';

const HERO_IMAGE = '/hero-paving.jpg';

export default function HeroSection() {
  const scrollToQuote = () => {
    trackEvent('hero_cta_click', { cta: 'free_estimate' });
    const el = document.querySelector('#quote');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToServices = () => {
    trackEvent('hero_cta_click', { cta: 'explore_services' });
    const el = document.querySelector('#services');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToFaq = () => {
    trackEvent('hero_cta_click', { cta: 'diagnose_first' });
    const el = document.querySelector('#faq');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex flex-col justify-end overflow-hidden mesh-gradient-hero">
      {/* Background image */}
      <div className="absolute inset-0 overflow-hidden opacity-40">
        <SmartImage
          src={HERO_IMAGE}
          alt="Technical milling and paving operation in an industrial setting"
          width={2560}
          height={1440}
          priority
          sizes="100vw"
          className="w-full h-full object-cover object-top filter grayscale contrast-125"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pb-24 pt-32 w-full">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>

          <div className="inline-flex items-center gap-4 border-l-2 border-primary bg-zinc-900/80 px-4 py-2 mb-8">
            <span className="font-display text-xs tracking-[0.3em] uppercase text-primary">
              Institutional Grade Infrastructure
            </span>
          </div>
          
          <h1 className="font-display font-black text-foreground uppercase leading-[0.9] tracking-tight">
            <span className="block text-[12vw] md:text-[8vw] lg:text-[7vw]">THE PREMIER</span>
            <span className="block text-[12vw] md:text-[8vw] lg:text-[7vw] text-primary">PAVEMENT ASSET</span>
            <span className="block text-[12vw] md:text-[8vw] lg:text-[7vw]">PARTNER</span>
          </h1>

          <p className="font-body text-zinc-400 mt-8 text-lg md:text-xl max-w-2xl leading-relaxed">
            Providing Institutional-Grade Paving Solutions for National Logistics, Healthcare, and Industrial Infrastructure.
          </p>

          <div className="mt-12 flex flex-wrap gap-6">
            <button 
              onClick={scrollToQuote}
              className="px-8 py-4 bg-primary text-black font-display text-lg tracking-wider uppercase hover:bg-white transition-colors"
            >
              Technical Consultation
            </button>
            <button 
              onClick={scrollToServices}
              className="px-8 py-4 border border-zinc-700 text-white font-display text-lg tracking-wider uppercase hover:bg-zinc-800 transition-colors"
            >
              Our Solutions
            </button>
          </div>

          <div className="mt-16 pt-8 border-t border-zinc-800 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col">
              <span className="text-3xl font-display text-white">40+ YEARS</span>
              <span className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Operational Excellence</span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-display text-white">5,000+ PROJECTS</span>
              <span className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Institutional Scale</span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-display text-white">$500M+ ASSETS</span>
              <span className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Managed Infrastructure</span>
            </div>
          </div>
        </motion.div>
      </div>
        </section>
  );
}