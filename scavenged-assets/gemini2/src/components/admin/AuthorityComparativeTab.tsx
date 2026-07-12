/**
 * AuthorityComparativeTab — "Jordan Wells Filter"
 * Competitor bid deconstruction UI.
 */
import { useState, useMemo } from 'react';
import { Shield, CheckCircle, ChevronDown, ChevronUp, DollarSign, AlertTriangle } from 'lucide-react';
import {
  JWORDENAI_SOVEREIGN_STANDARD_ITEMS,
  analyzeCompetitorBid,
  type CompetitorBidInput,
} from '@/lib/authorityComparative';
import { fmt } from '@/lib/adminFmt';

export function AuthorityComparativeTab() {
  const [competitorName, setCompetitorName] = useState('');
  const [theirPrice, setTheirPrice] = useState(12000);
  const [wordenPrice, setWordenPrice] = useState(16500);
  const [sqFt, setSqFt] = useState(5000);
  const [projectType, setProjectType] = useState<CompetitorBidInput['projectType']>('driveway');
  const [omittedIds, setOmittedIds] = useState<string[]>(['compaction', 'stone-base', 'warranty']);
  const [expandedScript, setExpandedScript] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  const result = useMemo(() => {
    if (!analyzed) return null;
    return analyzeCompetitorBid({
      competitorName: competitorName || 'Unknown Contractor',
      theirPrice,
      wordenPrice,
      sqFt,
      projectType,
      omittedItemIds: omittedIds,
    });
  }, [analyzed, competitorName, theirPrice, wordenPrice, sqFt, projectType, omittedIds]);

  function toggleOmitted(id: string) {
    setOmittedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    setAnalyzed(false);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-black uppercase text-white flex items-center gap-2">
          <Shield size={20} className="text-[#ffcc00]" /> Authority Comparative — Jordan Wells Filter
        </h2>
        <p className="text-gray-300 text-xs mt-1">When a customer says "someone else was cheaper" — run this filter to deconstruct what they're NOT getting.</p>
      </div>

      {/* Input panel */}
      <div className="bg-[#111] border border-gray-800 p-5">
        <h3 className="text-sm font-black uppercase tracking-wider text-gray-200 mb-4">Bid Comparison Input</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs font-black uppercase text-gray-300 mb-1 block">Competitor Name</label>
            <input
              value={competitorName}
              onChange={(e) => { setCompetitorName(e.target.value); setAnalyzed(false); }}
              placeholder="e.g. Jordan Wells Paving"
              className="w-full bg-gray-900 border border-gray-700 text-white text-sm p-2 font-bold focus:border-[#ffcc00] outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-black uppercase text-gray-300 mb-1 block">Project Type</label>
            <select value={projectType} onChange={(e) => { setProjectType(e.target.value as CompetitorBidInput['projectType']); setAnalyzed(false); }}
              className="w-full bg-gray-900 border border-gray-700 text-white text-sm p-2 font-bold focus:border-[#ffcc00] outline-none">
              <option value="driveway">Residential Driveway</option>
              <option value="parking-lot">Parking Lot</option>
              <option value="commercial">Commercial Site</option>
              <option value="government">Government / VDOT</option>
              <option value="sealcoat">Sealcoat Only</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-black uppercase text-gray-300 mb-1 block">Square Footage</label>
            <input type="number" value={sqFt} min={100} onChange={(e) => { setSqFt(Number(e.target.value)); setAnalyzed(false); }}
              className="w-full bg-gray-900 border border-gray-700 text-white text-sm p-2 font-bold focus:border-[#ffcc00] outline-none" />
          </div>
          <div>
            <label className="text-xs font-black uppercase text-gray-300 mb-1 block">Their Price</label>
            <input type="number" value={theirPrice} min={0} onChange={(e) => { setTheirPrice(Number(e.target.value)); setAnalyzed(false); }}
              className="w-full bg-gray-900 border border-gray-700 text-white text-sm p-2 font-bold focus:border-[#ffcc00] outline-none" />
          </div>
          <div>
            <label className="text-xs font-black uppercase text-gray-300 mb-1 block">Worden Quote</label>
            <input type="number" value={wordenPrice} min={0} onChange={(e) => { setWordenPrice(Number(e.target.value)); setAnalyzed(false); }}
              className="w-full bg-gray-900 border border-gray-700 text-white text-sm p-2 font-bold focus:border-[#ffcc00] outline-none" />
          </div>
        </div>

        {/* Omitted items checklist */}
        <div className="mb-4">
          <label className="text-xs font-black uppercase text-gray-300 mb-2 block">What JWORDENAI Sovereign Standard Items Did They Likely Omit?</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {JWORDENAI_SOVEREIGN_STANDARD_ITEMS.map((item) => (
              <label key={item.id} className={`flex items-center gap-2 text-xs font-bold cursor-pointer px-3 py-2 border ${omittedIds.includes(item.id) ? 'border-orange-600 bg-orange-950/20 text-orange-400' : 'border-gray-800 text-gray-200'}`}>
                <input type="checkbox" checked={omittedIds.includes(item.id)} onChange={() => toggleOmitted(item.id)} className="accent-[#ffcc00]" />
                {item.category}
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={() => setAnalyzed(true)}
          className="w-full py-3 bg-[#ffcc00] text-black font-black uppercase tracking-widest text-sm hover:bg-yellow-400 transition-colors"
        >
          🔍 Run Authority Comparative
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#111] border border-gray-800 p-4">
              <div className="text-xs text-gray-300 uppercase font-bold mb-1">Price Difference</div>
              <div className="text-2xl font-black text-orange-400">{fmt(result.priceDifference)}</div>
              <div className="text-xs text-gray-300">{result.priceDifferencePct}% of Worden bid</div>
            </div>
            <div className="bg-[#111] border border-gray-800 p-4">
              <div className="text-xs text-gray-300 uppercase font-bold mb-1">Missing Standards</div>
              <div className="text-2xl font-black text-red-400">{result.valueDeficit}</div>
              <div className="text-xs text-gray-300">critical items omitted</div>
            </div>
            <div className="bg-[#111] border border-orange-800 bg-orange-950/10 p-4">
              <div className="text-xs text-gray-300 uppercase font-bold mb-1">True Cost (Low)</div>
              <div className="text-2xl font-black text-orange-400">{fmt(result.trueCompetitorCostLow)}</div>
              <div className="text-xs text-gray-300">their price + hidden costs</div>
            </div>
            <div className="bg-[#111] border border-red-800 bg-red-950/10 p-4">
              <div className="text-xs text-gray-300 uppercase font-bold mb-1">True Cost (High)</div>
              <div className="text-2xl font-black text-red-400">{fmt(result.trueCompetitorCostHigh)}</div>
              <div className="text-xs text-gray-300">worst-case 5yr exposure</div>
            </div>
          </div>

          {/* Verdict */}
          <div className="p-4 border border-[#ffcc00]/40 bg-[#ffcc00]/5">
            <div className="flex items-start gap-3">
              <DollarSign size={18} className="text-[#ffcc00] shrink-0 mt-0.5" />
              <p className="text-sm text-gray-200 font-bold">{result.verdictSummary}</p>
            </div>
          </div>

          {/* Omitted items breakdown */}
          {result.omittedItems.length > 0 && (
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-gray-200 mb-3">What They Didn't Include</h3>
              <div className="space-y-3">
                {result.omittedItems.map((item) => (
                  <div key={item.id} className="border border-red-800 bg-red-950/10 px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-red-400 font-black text-sm uppercase">{item.category}</span>
                      <span className="text-xs text-gray-300 font-mono">{item.spec}</span>
                    </div>
                    <p className="text-gray-300 text-xs font-bold mb-1">Requirement: {item.requirement}</p>
                    <p className="text-orange-400 text-xs">Cost impact: {item.typicalCostImpact}</p>
                    <p className="text-red-300 text-xs mt-1">Risk if omitted: {item.riskIfOmitted}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interrogation script */}
          <div className="border border-gray-800 bg-[#111]">
            <button
              onClick={() => setExpandedScript((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-sm font-black uppercase tracking-wider text-gray-300 hover:text-white"
            >
              <span className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-[#ffcc00]" />
                Customer Interrogation Script ({result.interrogationScript.length} questions)
              </span>
              {expandedScript ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expandedScript && (
              <div className="px-5 pb-5 space-y-3 border-t border-gray-800">
                <p className="text-xs text-gray-300 mt-3 italic">Share these questions with the customer. Let the competitor's spec sheet do the talking.</p>
                {result.interrogationScript.map((q, i) => (
                  <div key={i} className="text-sm text-gray-200 font-bold">{q}</div>
                ))}
                <div className="mt-4 p-3 border border-green-800 bg-green-950/20">
                  <p className="text-green-400 text-xs font-black flex items-center gap-2">
                    <CheckCircle size={12} /> J. Worden & Sons — 4th Generation Since 1984. Virginia Class A Licensed. 3-Year Warranty. 96% Compaction Guaranteed in Writing.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
