import React from 'react';
import { Link } from '@tanstack/react-router';
import { Shield, Award, Clock, Phone, ChevronRight, Star } from 'lucide-react';
import { LeadCaptureForm } from '../components/LeadCaptureForm';
import { JarvisChat } from '../components/JarvisChat';
import {
  BUSINESS_NAME,
  BUSINESS_SINCE,
  BUSINESS_GENERATION,
  BUSINESS_PHONE,
  WORDEN_COMPACTION_FLOOR_PCT,
  WORDEN_BASE_SPEC,
} from '@jworden/core';

const TRUST = [
  { icon: Shield, label: `${WORDEN_COMPACTION_FLOOR_PCT}% Compaction`, sub: 'Marshall Unit Weight — guaranteed' },
  { icon: Award, label: `Since ${BUSINESS_SINCE}`, sub: `${BUSINESS_GENERATION} family business` },
  { icon: Clock, label: '< 24h Response', sub: 'Free estimate, no obligation' },
  { icon: Star, label: '4.9 Stars', sub: '300+ verified Google reviews' },
];

const SERVICES_PREVIEW = [
  { title: 'Residential Driveways', desc: 'New install, mill & overlay, or full-depth reclamation. 2-inch minimum wearing course, VDOT-certified compaction.', href: '/services' },
  { title: 'Commercial Parking Lots', desc: 'Strip malls, warehouses, QSR/KFC portfolios, industrial yards. ADA-compliant striping included.', href: '/services' },
  { title: 'Sealcoating', desc: 'Coal-tar or asphalt-based sealer with 30% sand additive. Extends pavement life 3–5 years.', href: '/services' },
  { title: 'Municipal & Government', desc: 'VDOT pre-qualified. Davis-Bacon compliant. SAM.gov registered. Roads, parks, federal facilities.', href: '/services' },
];

export function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-zinc-950 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(245,166,35,0.08),transparent)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <Award size={12} /> {BUSINESS_GENERATION} · {BUSINESS_SINCE} · Richmond, VA Metro
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
                Asphalt Paving<br />
                <span className="text-yellow-400">Built to Last.</span>
              </h1>
              <p className="text-zinc-400 text-lg leading-relaxed mb-8 max-w-xl">
                Central Virginia's most trusted asphalt contractor. {WORDEN_COMPACTION_FLOOR_PCT}% compaction on every project.
                {' '}{WORDEN_BASE_SPEC}. No shortcuts, no excuses.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/estimator" className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-3 rounded-lg transition-colors no-underline">
                  Get Free Estimate <ChevronRight size={16} />
                </Link>
                <a href={`tel:+1${BUSINESS_PHONE.replace(/\D/g, '')}`} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors no-underline">
                  <Phone size={14} /> {BUSINESS_PHONE}
                </a>
              </div>
            </div>

            {/* Right — Jarvis chat */}
            <div className="h-[440px] lg:h-[480px]">
              <JarvisChat />
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-zinc-900 border-y border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {TRUST.map((t) => (
              <div key={t.label} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <t.icon size={18} className="text-yellow-400" />
                </div>
                <div>
                  <div className="text-white font-bold text-sm">{t.label}</div>
                  <div className="text-zinc-500 text-xs">{t.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white mb-3">What We Build</h2>
            <p className="text-zinc-400 max-w-xl mx-auto">From single driveways to federal highway contracts. Every project gets the same Worden Standard.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {SERVICES_PREVIEW.map((s) => (
              <Link key={s.title} to={s.href} className="group p-6 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all no-underline">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-white font-bold text-lg group-hover:text-yellow-400 transition-colors">{s.title}</h3>
                  <ChevronRight size={18} className="text-zinc-600 group-hover:text-yellow-400 transition-colors mt-0.5" />
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed">{s.desc}</p>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/services" className="text-yellow-400 hover:text-yellow-300 text-sm font-semibold no-underline">
              View all services →
            </Link>
          </div>
        </div>
      </section>

      {/* Lead form */}
      <section className="py-20 bg-zinc-900 border-t border-zinc-800">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-white mb-3">Get Your Free Estimate</h2>
            <p className="text-zinc-400">We respond within 1 business hour. No obligation.</p>
          </div>
          <LeadCaptureForm />
        </div>
      </section>
    </>
  );
}
