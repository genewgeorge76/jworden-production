import type { MapEstimateResult } from '@/lib/estimator-engine';
import {
  OIL_SHIELD_BUFFER_PER_TON,
  WORDEN_COMPACTION_FLOOR_PCT,
  SOVEREIGN_BASE_DEPTH_IN,
} from '@/lib/estimator-engine';

/**
 * EstimatePricePanel — Live-updating price breakdown for the Interactive 3D Estimator.
 * Shows line-item costs, Worden Standard compliance, and tier classification.
 */

interface EstimatePricePanelProps {
  result: MapEstimateResult | null;
  serviceLabel: string;
}

export default function EstimatePricePanel({ result, serviceLabel }: EstimatePricePanelProps) {
  if (!result) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 p-8 text-center">
        <div className="text-6xl mb-4 opacity-20">📐</div>
        <p className="text-zinc-300 font-bold text-sm uppercase tracking-wider">
          Draw your project area on the map to see a live estimate
        </p>
        <p className="text-zinc-200 text-xs mt-2">
          Click 3+ points to define the area
        </p>
      </div>
    );
  }

  const { sqFt, estimate, tier, tierEmoji, tierLabel } = result;

  // Tier badge colors
  const tierColors = {
    whale: { bg: 'bg-amber-500/20', border: 'border-amber-500', text: 'text-amber-400' },
    shark: { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400' },
    fish: { bg: 'bg-zinc-500/20', border: 'border-zinc-500', text: 'text-zinc-200' },
  };
  const tc = tierColors[tier];

  return (
    <div className="space-y-4">
      {/* Tier Badge + Price */}
      <div className="bg-zinc-900 border-2 border-[#ffcc00] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-zinc-300">
              {serviceLabel}
            </span>
            <div className="text-4xl font-black text-[#ffcc00] mt-1">
              ${estimate.finalBidPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <span className="text-zinc-300 text-xs font-bold">
              ${estimate.pricePerSqFt.toFixed(2)} / sq ft · {sqFt.toLocaleString()} sq ft
            </span>
          </div>
          <div className={`${tc.bg} ${tc.border} border px-4 py-2 text-center`}>
            <div className="text-2xl">{tierEmoji}</div>
            <span className={`${tc.text} text-[10px] font-black uppercase tracking-wider`}>
              {tierLabel}
            </span>
          </div>
        </div>

        {/* State + multiplier */}
        <div className="flex gap-4 text-xs font-bold text-zinc-300 border-t border-zinc-800 pt-3">
          <span>State: {estimate.state}</span>
          <span>Multiplier: {estimate.stateMultiplier.toFixed(2)}×</span>
          <span>Margin: {estimate.profitTargetPct}%</span>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-zinc-900 border border-zinc-700">
        <div className="bg-[#ffcc00] text-black px-4 py-2">
          <h4 className="font-black uppercase text-xs tracking-widest">
            Line-Item Breakdown
          </h4>
        </div>
        <div className="divide-y divide-zinc-800">
          {estimate.lineItems.map((item, i) => (
            <div key={i} className="px-4 py-3 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-bold truncate">{item.description}</p>
                <p className="text-zinc-200 text-xs mt-0.5">
                  {item.spec}
                  {item.shielded && (
                    <span className="text-amber-500 ml-2">🛡 Oil shield applied</span>
                  )}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-white text-sm font-bold">
                  ${item.total.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
                <p className="text-zinc-200 text-xs">
                  {item.qty.toLocaleString()} {item.unit} × ${item.unitPrice.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="bg-zinc-800/50 px-4 py-3 border-t border-zinc-700">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-200 font-bold">Subtotal (Materials + Labor)</span>
            <span className="text-white font-bold">
              ${estimate.totalShielded.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-zinc-200 font-bold">Worden Margin ({estimate.profitTargetPct}%)</span>
            <span className="text-white font-bold">
              ${(estimate.finalBidPrice - estimate.totalShielded).toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex justify-between text-lg mt-2 pt-2 border-t border-zinc-700">
            <span className="text-[#ffcc00] font-black uppercase">Final Bid Price</span>
            <span className="text-[#ffcc00] font-black">
              ${estimate.finalBidPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </div>

      {/* Compliance Notes */}
      <div className="bg-zinc-900 border border-zinc-700 p-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#ffcc00] mb-3">
          Worden Standard Compliance
        </h4>
        <ul className="space-y-2">
          {estimate.complianceNotes.map((note, i) => (
            <li key={i} className="text-zinc-200 text-xs flex items-start gap-2">
              <span className="text-[#ffcc00] mt-0.5">✓</span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 pt-3 border-t border-zinc-800 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-[#ffcc00] font-black text-lg">{WORDEN_COMPACTION_FLOOR_PCT}%</p>
            <p className="text-zinc-200 text-[10px] uppercase tracking-wider font-bold">Marshall Compaction</p>
          </div>
          <div>
            <p className="text-[#ffcc00] font-black text-lg">{SOVEREIGN_BASE_DEPTH_IN}"</p>
            <p className="text-zinc-200 text-[10px] uppercase tracking-wider font-bold">Stone Base Depth</p>
          </div>
          <div>
            <p className="text-[#ffcc00] font-black text-lg">±${OIL_SHIELD_BUFFER_PER_TON}</p>
            <p className="text-zinc-200 text-[10px] uppercase tracking-wider font-bold">Oil Shield/Ton</p>
          </div>
        </div>
      </div>
    </div>
  );
}
