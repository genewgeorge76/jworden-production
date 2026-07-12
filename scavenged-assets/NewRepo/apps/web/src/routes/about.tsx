import React from 'react';
import { Link } from '@tanstack/react-router';
import { BUSINESS_NAME, BUSINESS_SINCE, BUSINESS_GENERATION, BUSINESS_PHONE, WORDEN_COMPACTION_FLOOR_PCT, WORDEN_BASE_SPEC } from '@jworden/core';

export function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-white mb-4">About {BUSINESS_NAME}</h1>
        <div className="h-1 w-16 bg-yellow-500 rounded" />
      </div>

      <div className="grid md:grid-cols-2 gap-12 mb-16">
        <div>
          <h2 className="text-xl font-bold text-white mb-4">{BUSINESS_GENERATION} Family Business</h2>
          <p className="text-zinc-400 leading-relaxed mb-4">
            Since {BUSINESS_SINCE}, J. Worden & Sons has built Virginia's roads, driveways, and parking lots with the same commitment to quality that started with the first generation. We're not a franchise, not a national chain — we're your neighbors.
          </p>
          <p className="text-zinc-400 leading-relaxed">
            Every crew member understands the Worden Standard: {WORDEN_COMPACTION_FLOOR_PCT}% Marshall compaction minimum, {WORDEN_BASE_SPEC}, and a 35% gross margin floor that means we never cut corners to win a bid.
          </p>
        </div>
        <div className="space-y-4">
          {[
            { label: 'Founded', value: String(BUSINESS_SINCE) },
            { label: 'Generation', value: BUSINESS_GENERATION },
            { label: 'Compaction Standard', value: `${WORDEN_COMPACTION_FLOOR_PCT}% Marshall Unit Weight` },
            { label: 'Base Specification', value: WORDEN_BASE_SPEC },
            { label: 'Service Area', value: '150-mile radius from Chester, VA' },
            { label: 'Licensing', value: 'Virginia Class A Contractor (DPOR)' },
          ].map((r) => (
            <div key={r.label} className="flex gap-4 py-3 border-b border-zinc-800">
              <div className="text-zinc-500 text-sm w-36 flex-shrink-0">{r.label}</div>
              <div className="text-white text-sm font-medium">{r.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
        <h3 className="text-2xl font-black text-white mb-3">Ready to talk?</h3>
        <p className="text-zinc-400 mb-6">Call us directly or request a free estimate online.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <a href={`tel:+1${BUSINESS_PHONE.replace(/\D/g, '')}`} className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-3 rounded-lg no-underline transition-colors">
            {BUSINESS_PHONE}
          </a>
          <Link to="/estimator" className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-6 py-3 rounded-lg no-underline transition-colors">
            Free Estimate
          </Link>
        </div>
      </div>
    </div>
  );
}
