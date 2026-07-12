import React, { useState } from 'react';
import { Calculator, Save, Copy, CheckCircle } from 'lucide-react';
import {
  TRADES,
  TRADES_BY_CATEGORY,
  calculateEstimate,
  formatDollars,
  BINDER_INDEX,
  GROSS_MARGIN_FLOOR,
} from '@jworden/core';
import type { EstimateOutput } from '@jworden/core';

export function EstimatorPage() {
  const [tradeKey, setTradeKey] = useState('asphalt_res');
  const [qty, setQty] = useState('');
  const [depth, setDepth] = useState('2');
  const [cost, setCost] = useState('');
  const [location, setLocation] = useState('');
  const [result, setResult] = useState<EstimateOutput | null>(null);
  const [copied, setCopied] = useState(false);

  const trade = TRADES[tradeKey];

  const calc = () => {
    const q = parseFloat(qty);
    const c = parseFloat(cost);
    if (!q || !c) return;
    const output = calculateEstimate(
      { tradeKey, quantity: q, depthIn: trade.depthUnit ? parseFloat(depth) : undefined, costPerUnit: c, location },
      trade.defaultDensity,
    );
    output.tradeLabel = trade.label;
    setResult(output);
  };

  const copy = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center justify-center">
            <Calculator size={18} className="text-yellow-400" />
          </div>
          <h1 className="text-3xl font-black text-white">Instant Estimate</h1>
        </div>
        <p className="text-zinc-400">Get an immediate ballpark. Formal written estimates are free — just fill out the form on the contact page.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
        <div className="grid gap-5">
          {/* Trade select */}
          <div>
            <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wide mb-2">Trade / Service</label>
            <select
              value={tradeKey}
              onChange={(e) => { setTradeKey(e.target.value); setResult(null); }}
              className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 transition-colors cursor-pointer"
            >
              {Object.entries(TRADES_BY_CATEGORY).map(([cat, trades]) => (
                <optgroup key={cat} label={cat.charAt(0).toUpperCase() + cat.slice(1)}>
                  {Object.entries(trades).map(([key, spec]) => (
                    <option key={key} value={key}>{spec.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Qty + depth */}
          <div className={`grid gap-4 ${trade.depthUnit ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div>
              <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wide mb-2">
                {trade.unit === 'sqft' ? 'Square Feet' : trade.unit === 'lnft' ? 'Linear Feet' : trade.unit === 'cuyd' ? 'Cubic Yards' : 'Quantity'}
              </label>
              <input
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="0"
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 transition-colors"
              />
            </div>
            {trade.depthUnit && (
              <div>
                <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wide mb-2">Depth (inches)</label>
                <input
                  type="number"
                  value={depth}
                  onChange={(e) => setDepth(e.target.value)}
                  step="0.25"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>
            )}
          </div>

          {/* Cost + location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wide mb-2">
                Material cost ({trade.costLabel})
              </label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0"
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wide mb-2">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, VA"
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 transition-colors"
              />
            </div>
          </div>

          <button
            onClick={calc}
            className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-lg transition-colors"
          >
            <Calculator size={16} /> Calculate Estimate
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          {result.isLargeJob && (
            <div className="mb-4 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded text-orange-400 text-xs flex items-center gap-2">
              ⚠ Large project ({result.quantity.toLocaleString()} {TRADES[tradeKey].unit}) — owner-level review required for final pricing.
            </div>
          )}
          <div className="grid grid-cols-2 gap-px bg-zinc-800 rounded overflow-hidden mb-5">
            {[
              result.tonnage !== null && { label: 'Tonnage', value: result.tonnage.toFixed(2) + ' tons', highlight: false },
              { label: 'Material Cost', value: formatDollars(result.materialCost), highlight: false },
              { label: `Binder Index`, value: formatDollars(BINDER_INDEX), highlight: false },
              { label: `Final Bid (${(GROSS_MARGIN_FLOOR * 100).toFixed(0)}% margin)`, value: formatDollars(result.finalBid), highlight: true },
            ].filter(Boolean).map((row) => {
              const r = row as { label: string; value: string; highlight: boolean };
              return (
                <div key={r.label} className={`p-4 ${r.highlight ? 'bg-zinc-800 col-span-2' : 'bg-zinc-950'}`}>
                  <div className="text-zinc-500 text-xs mb-1">{r.label}</div>
                  <div className={`font-bold ${r.highlight ? 'text-yellow-400 text-2xl' : 'text-white text-lg'}`}>{r.value}</div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={copy}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded transition-colors"
            >
              {copied ? <><CheckCircle size={14} className="text-green-400" /> Copied</> : <><Copy size={14} /> Copy JSON</>}
            </button>
            <div className="text-zinc-600 text-xs self-center ml-auto">ID: {result.id}</div>
          </div>
        </div>
      )}

      <p className="mt-6 text-zinc-600 text-xs text-center">
        This is a rough estimate based on material cost input. Final pricing requires site visit and formal proposal. Oil shield buffer (±$9/ton) applied automatically.
      </p>
    </div>
  );
}
