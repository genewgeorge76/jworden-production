/**
 * DynamicEstimatorTab — Real-Time VDOT Math Bid Calculator
 * Pulls from dynamicEstimator.ts for live material prices + 50-state coverage.
 */
import { useState, useMemo } from 'react';
import { Calculator, TrendingUp, TrendingDown, Minus, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  getLiveMaterialPrices,
  calculateEstimate,
  STATE_PRICE_MULTIPLIER,
  OIL_SHIELD_BUFFER_PER_TON,
  type EstimateInput,
} from '@/lib/dynamicEstimator';
import { fmt } from '@/lib/adminFmt';

const STATE_CODES = Object.keys(STATE_PRICE_MULTIPLIER).sort();

export function DynamicEstimatorTab() {
  const [stateCode, setStateCode] = useState('VA');
  const [lengthFt, setLengthFt] = useState(200);
  const [widthFt, setWidthFt] = useState(60);
  const [surfaceDepthIn, setSurfaceDepthIn] = useState(2);
  const [includeBase, setIncludeBase] = useState(true);
  const [includeSeal, setIncludeSeal] = useState(false);
  const [serviceType, setServiceType] = useState<EstimateInput['serviceType']>('new-install');

  const livePrices = useMemo(() => getLiveMaterialPrices(stateCode), [stateCode]);
  const estimate = useMemo(
    () => calculateEstimate({ lengthFt, widthFt, surfaceDepthIn, includeBase, includeSeal, stateCode, serviceType }),
    [lengthFt, widthFt, surfaceDepthIn, includeBase, includeSeal, stateCode, serviceType],
  );

  const stateMultiplierPct = ((estimate.stateMultiplier - 1) * 100).toFixed(1);
  const stateNote = estimate.stateMultiplier > 1
    ? `+${stateMultiplierPct}% vs VA baseline`
    : estimate.stateMultiplier < 1
    ? `${stateMultiplierPct}% vs VA baseline`
    : 'VA baseline (home market)';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black uppercase text-white flex items-center gap-2">
          <Calculator size={20} className="text-[#ffcc00]" /> Dynamic Estimator — Real-Time VDOT Math
        </h2>
        <span className="text-xs text-green-400 font-black uppercase flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Live Price Index
        </span>
      </div>

      {/* Live Material Price Index */}
      <section>
        <h3 className="text-sm font-black uppercase tracking-wider text-gray-200 mb-3">
          Live Material Index — {stateCode} Market
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-gray-300 uppercase tracking-widest">
                <th className="text-left py-2 pr-4">Material</th>
                <th className="text-left py-2 pr-4">Spec</th>
                <th className="text-right py-2 pr-4">Baseline</th>
                <th className="text-right py-2 pr-4">Current</th>
                <th className="text-right py-2 pr-4">Delta</th>
                <th className="text-right py-2">Shielded Price</th>
              </tr>
            </thead>
            <tbody>
              {livePrices.map((m) => (
                <tr key={m.id} className="border-b border-gray-900 hover:bg-gray-900/30">
                  <td className="py-2 pr-4 text-white font-bold">{m.name}</td>
                  <td className="py-2 pr-4 text-gray-300 font-mono">{m.spec}</td>
                  <td className="py-2 pr-4 text-right text-gray-200">${m.baseline.toFixed(2)}/{m.unit}</td>
                  <td className="py-2 pr-4 text-right">
                    <span className={m.delta > 0 ? 'text-orange-400 font-black' : m.delta < 0 ? 'text-green-400 font-black' : 'text-white'}>
                      ${m.current.toFixed(2)}/{m.unit}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-right">
                    <span className={`flex items-center justify-end gap-1 font-bold ${m.delta > 0 ? 'text-orange-400' : m.delta < 0 ? 'text-green-400' : 'text-gray-300'}`}>
                      {m.deltaSign === '+' ? <TrendingUp size={12} /> : m.deltaSign === '-' ? <TrendingDown size={12} /> : <Minus size={12} />}
                      {m.deltaSign}{Math.abs(m.delta).toFixed(2)}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    {m.shieldActive
                      ? <span className="text-[#ffcc00] font-black">${m.shieldedPrice.toFixed(2)}/{m.unit} <span className="text-xs text-[#ffcc00]/60">(+${OIL_SHIELD_BUFFER_PER_TON} shield)</span></span>
                      : <span className="text-gray-300">{m.unit === 'gal' ? `$${m.shieldedPrice.toFixed(2)}/gal` : 'N/A'}</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bid Calculator */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-gray-200 mb-4">Project Parameters</h3>
          <div className="space-y-4 bg-[#111] border border-gray-800 p-5">
            {/* State */}
            <div>
              <label className="text-xs font-black uppercase text-gray-300 mb-1 block">State (50-State Coverage)</label>
              <select
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-white text-sm p-2 font-bold focus:border-[#ffcc00] outline-none"
              >
                {STATE_CODES.map((s) => (
                  <option key={s} value={s}>{s} — {(STATE_PRICE_MULTIPLIER[s] >= 1 ? '+' : '')}{((STATE_PRICE_MULTIPLIER[s] - 1) * 100).toFixed(0)}% vs VA</option>
                ))}
              </select>
              <p className="text-xs text-[#ffcc00] mt-1 font-bold">{stateNote}</p>
            </div>

            {/* Service Type */}
            <div>
              <label className="text-xs font-black uppercase text-gray-300 mb-1 block">Service Type</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as EstimateInput['serviceType'])}
                className="w-full bg-gray-900 border border-gray-700 text-white text-sm p-2 font-bold focus:border-[#ffcc00] outline-none"
              >
                <option value="new-install">New Installation (full depth)</option>
                <option value="overlay">Mill & Overlay</option>
                <option value="repair">Asphalt Repair / Patch</option>
                <option value="sealcoat-only">Sealcoat Only</option>
              </select>
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black uppercase text-gray-300 mb-1 block">Length (ft)</label>
                <input type="number" value={lengthFt} min={1} onChange={(e) => setLengthFt(Number(e.target.value))}
                  className="w-full bg-gray-900 border border-gray-700 text-white text-sm p-2 font-bold focus:border-[#ffcc00] outline-none" />
              </div>
              <div>
                <label className="text-xs font-black uppercase text-gray-300 mb-1 block">Width (ft)</label>
                <input type="number" value={widthFt} min={1} onChange={(e) => setWidthFt(Number(e.target.value))}
                  className="w-full bg-gray-900 border border-gray-700 text-white text-sm p-2 font-bold focus:border-[#ffcc00] outline-none" />
              </div>
            </div>

            {/* Surface depth */}
            <div>
              <label className="text-xs font-black uppercase text-gray-300 mb-1 block">Surface Course Depth (in)</label>
              <select value={surfaceDepthIn} onChange={(e) => setSurfaceDepthIn(Number(e.target.value))}
                className="w-full bg-gray-900 border border-gray-700 text-white text-sm p-2 font-bold focus:border-[#ffcc00] outline-none">
                <option value={1.5}>1.5" (light residential)</option>
                <option value={2}>2" (standard residential/commercial)</option>
                <option value={2.5}>2.5" (heavy commercial)</option>
                <option value={3}>3" (VDOT / industrial)</option>
              </select>
            </div>

            {/* Options */}
            <div className="flex gap-6">
              {serviceType !== 'sealcoat-only' && (
                <label className="flex items-center gap-2 text-sm font-bold text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={includeBase} onChange={(e) => setIncludeBase(e.target.checked)}
                    className="accent-[#ffcc00]" />
                  6" 21A Stone Base (Sovereign Standard)
                </label>
              )}
              <label className="flex items-center gap-2 text-sm font-bold text-gray-300 cursor-pointer">
                <input type="checkbox" checked={includeSeal} onChange={(e) => setIncludeSeal(e.target.checked)}
                  className="accent-[#ffcc00]" />
                Include Sealcoat
              </label>
            </div>
          </div>
        </div>

        {/* Bid Output */}
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-gray-200 mb-4">Live Bid Output</h3>
          <div className="bg-[#111] border border-[#ffcc00]/40 p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-300 uppercase font-bold">Area</div>
                <div className="text-2xl font-black text-white">{estimate.sqFt.toLocaleString()} <span className="text-sm text-gray-200">sq ft</span></div>
              </div>
              <div>
                <div className="text-xs text-gray-300 uppercase font-bold">Final Bid</div>
                <div className="text-2xl font-black text-[#ffcc00]">{fmt(estimate.finalBidPrice)}</div>
                <div className="text-xs text-gray-300">${estimate.pricePerSqFt}/sq ft</div>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-3 space-y-1 text-xs">
              {estimate.lineItems.map((li, i) => (
                <div key={i} className="flex justify-between text-gray-200">
                  <span className="pr-2 flex-1">{li.description}</span>
                  <span className="font-bold text-white whitespace-nowrap">{fmt(li.total)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-gray-800 pt-2 mt-2">
                <span className="text-gray-300 font-bold uppercase text-xs">Materials + Labor</span>
                <span className="text-white font-black">{fmt(estimate.totalShielded)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300 font-bold uppercase text-xs">Profit ({estimate.profitTargetPct}% margin)</span>
                <span className="text-[#ffcc00] font-black">{fmt(estimate.finalBidPrice - estimate.totalShielded)}</span>
              </div>
              <div className="flex justify-between border-t border-[#ffcc00]/30 pt-2 mt-2">
                <span className="text-[#ffcc00] font-black uppercase text-xs">TOTAL BID PRICE</span>
                <span className="text-[#ffcc00] font-black text-base">{fmt(estimate.finalBidPrice)}</span>
              </div>
            </div>
          </div>

          {/* Compliance notes */}
          <div className="mt-3 space-y-1">
            {estimate.complianceNotes.map((note, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-green-400">
                <CheckCircle size={12} className="mt-0.5 shrink-0" />
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Oil shield status banner */}
      <div className="p-4 border border-[#ffcc00]/30 bg-[#ffcc00]/5 flex items-center gap-3">
        <Shield size={18} className="text-[#ffcc00] shrink-0" />
        <div>
          <span className="text-[#ffcc00] font-black text-sm">$9/Ton Oil-Price Shield ACTIVE</span>
          <p className="text-gray-200 text-xs mt-0.5">
            All oil-linked materials have the Worden $9/ton buffer applied. Even if the liquid asphalt market spikes, this bid holds.
            State multiplier for <strong>{stateCode}</strong>: {estimate.stateMultiplier.toFixed(2)}× — {stateNote}.
          </p>
        </div>
        <AlertTriangle size={14} className="text-orange-400 shrink-0 ml-auto" />
      </div>
    </div>
  );
}
