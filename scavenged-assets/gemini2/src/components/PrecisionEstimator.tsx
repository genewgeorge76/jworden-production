import { useState } from 'react';
import { SERVICE_AREAS_41 } from '../constants/serviceAreas';

const PRICING = {
  standard: 4.5,
  premium: 6.75,
  baseAddOn: 1.5,
};

export default function PrecisionEstimator() {
  const [sqft, setSqft] = useState<number>(0);
  const [baseNeeded, setBaseNeeded] = useState(false);
  const [city, setCity] = useState('Richmond');

  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const rate = baseNeeded ? PRICING.premium + PRICING.baseAddOn : PRICING.standard;
  const total = sqft > 0 ? sqft * rate : 0;
  const formattedTotal = total.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const handleCityChange = (selected: string) => {
    setCity(selected);
    const win = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof window !== 'undefined' && win.gtag) {
      win.gtag('event', 'estimate_intent', {
        event_category: 'demand_heatmap',
        event_label: selected,
      });
    }
  };

  return (
    <div className="bg-zinc-900 border-2 border-[#ffcc00] p-8 rounded-2xl shadow-2xl text-white">
      {/* Dynamic Dispatch Banner */}
      <div className="bg-[#ffcc00] text-black px-6 py-3 rounded-xl mb-6 text-center">
        <p className="font-black uppercase text-sm tracking-wider">
          ⚡ High-Capacity Dispatch Available for {today} in {city}
        </p>
      </div>

      <h3 className="text-3xl font-black uppercase mb-6 tracking-tight">
        Precision <span className="text-[#ffcc00]">Estimator</span>
      </h3>

      <div className="space-y-6">
        {/* City selector for Demand Heatmap */}
        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-[#ffcc00] mb-2">
            Your City / Service Area
          </label>
          <select
            value={city}
            onChange={(e) => handleCityChange(e.target.value)}
            className="w-full bg-black border border-zinc-700 text-white p-4 focus:border-[#ffcc00] outline-none transition-colors appearance-none"
          >
            {SERVICE_AREAS_41.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Square Footage */}
        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-[#ffcc00] mb-2">
            Project Square Footage
          </label>
          <input
            type="number"
            min="0"
            value={sqft || ''}
            onChange={(e) => setSqft(Number(e.target.value))}
            className="w-full bg-black border border-zinc-700 text-white p-4 text-xl font-bold focus:border-[#ffcc00] outline-none transition-colors"
            placeholder="e.g. 2500"
          />
        </div>

        {/* 6" Structural Base Toggle */}
        <label className="flex items-start gap-4 cursor-pointer group">
          <input
            type="checkbox"
            checked={baseNeeded}
            onChange={(e) => setBaseNeeded(e.target.checked)}
            className="w-6 h-6 mt-1 accent-[#ffcc00] flex-shrink-0"
          />
          <div>
            <span className="font-black uppercase text-sm block">Include 6&quot; Structural Stone Base</span>
            <span className="text-zinc-200 text-xs font-medium block mt-1">
              The Worden Minimum — adds ${PRICING.baseAddOn.toFixed(2)}/sq ft for municipal-grade foundation.
              Prevents cracking, shifting &amp; sub-base failure.
            </span>
          </div>
        </label>

        {/* Rate Summary */}
        <div className="bg-zinc-800/60 rounded-xl p-4 text-sm">
          <div className="flex justify-between font-bold mb-1">
            <span className="text-zinc-200 uppercase tracking-wider">Base Rate</span>
            <span className="text-white">${PRICING.standard.toFixed(2)} / sq ft</span>
          </div>
          {baseNeeded && (
            <div className="flex justify-between font-bold mb-1">
              <span className="text-zinc-200 uppercase tracking-wider">6&quot; Stone Base Add-On</span>
              <span className="text-[#ffcc00]">+${(rate - PRICING.standard).toFixed(2)} / sq ft</span>
            </div>
          )}
          <div className="flex justify-between font-bold border-t border-zinc-700 pt-2 mt-2">
            <span className="text-zinc-300 uppercase tracking-wider">Effective Rate</span>
            <span className="text-white">${rate.toFixed(2)} / sq ft</span>
          </div>
        </div>

        {/* Projected Investment */}
        <div className="pt-6 border-t border-zinc-800">
          <span className="text-zinc-200 font-black uppercase text-xs tracking-widest block mb-2">
            Projected Investment
          </span>
          <div className="text-5xl font-black text-[#ffcc00] drop-shadow-[0_0_20px_rgba(255,204,0,0.3)]">
            {sqft > 0 ? formattedTotal : '—'}
          </div>
          {sqft > 0 && (
            <p className="text-zinc-300 text-xs mt-2 italic">
              * Estimate only. Final pricing confirmed after on-site structural evaluation.
            </p>
          )}
        </div>

        {/* CTA to Kickserv */}
        <a
          href="https://app.kickserv.com/jwordenandsonspaving/self_service/requests/new"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-[#ffcc00] text-black font-black uppercase tracking-[0.2em] text-lg py-5 text-center hover:bg-white transition-colors shadow-[0_0_30px_rgba(255,204,0,0.3)] mt-2"
        >
          ⚡ Get Your Estimate Now — Stop Waiting
        </a>
      </div>
    </div>
  );
}
