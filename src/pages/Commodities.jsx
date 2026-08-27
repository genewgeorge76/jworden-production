import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Loader2, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';

import { api } from '@/api/client';

/**
 * Supply Chain Pricing — the MAX plan line, backed by
 * /api/v1/materials/commodities.
 *
 * The feed underneath is real: BLS producer price indices and EIA spot prices
 * for the five commodities that move a paving bid (asphalt, WTI, diesel,
 * natural gas, aggregate). Each commodity falls back independently to
 * multiplier 1.0 with a status message when its source is unreachable, so one
 * dead API never fakes the other four.
 *
 * This page surfaces that fallback rather than hiding it. A multiplier of 1.00
 * that came from a failed fetch is not the same fact as a multiplier of 1.00
 * that came from a live index, and quoting off the first one costs money.
 */

const Change = ({ pct }) => {
  if (pct === null || pct === undefined) return null;
  const up = pct >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${up ? 'text-amber-400' : 'text-emerald-400'}`}>
      <Icon className="w-3 h-3" />
      {up ? '+' : ''}{Number(pct).toFixed(1)}%
    </span>
  );
};

export default function Commodities() {
  const [feed, setFeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFeed(await api.getCommodityPrices());
    } catch (err) {
      setError(err?.message || 'Could not load the commodity feed.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const commodities = feed?.commodities ? Object.entries(feed.commodities) : [];

  return (
    <div className="min-h-screen bg-[#050810] text-slate-200 px-4 py-8 md:px-8">
      <header className="max-w-5xl mx-auto mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.08em] text-amber-500/80">Max plan</p>
          <h1 className="font-display text-3xl font-bold text-white">Material Prices</h1>
          <p className="mt-1 text-xs text-slate-500">
            {feed?.as_of_date ? `As of ${feed.as_of_date} · BLS and EIA` : 'BLS and EIA'}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="shrink-0 text-slate-500 hover:text-amber-500"
          aria-label="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </header>

      <div className="max-w-5xl mx-auto">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500 py-10">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : error ? (
          <div className="flex items-start gap-3 border border-red-500/30 bg-red-500/5 rounded-lg p-4">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-300">{error}</p>
              <button
                type="button"
                onClick={load}
                className="mt-2 text-xs uppercase tracking-[0.08em] text-red-300 hover:text-red-200 underline underline-offset-4"
              >
                Try again
              </button>
            </div>
          </div>
        ) : commodities.length === 0 ? (
          <p className="text-sm text-slate-500">The feed returned no commodities.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {commodities.map(([key, data]) => {
              const stale = Boolean(data?.status_message);
              return (
                <div key={key} className="border border-white/10 bg-[#0a0f1c] rounded-lg p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[10px] uppercase tracking-[0.08em] text-slate-500">
                      {data?.label || key.replace(/_/g, ' ')}
                    </p>
                    <Change pct={data?.pct_change} />
                  </div>

                  <p className="mt-2 text-2xl font-bold text-white tabular-nums">
                    {data?.price !== null && data?.price !== undefined
                      ? Number(data.price).toLocaleString(undefined, { maximumFractionDigits: 2 })
                      : <span className="text-sm font-normal italic text-slate-500">Unavailable</span>}
                  </p>

                  <p className="mt-1 text-xs text-slate-500 tabular-nums">
                    Multiplier ×{Number(data?.multiplier ?? 1).toFixed(3)}
                  </p>

                  {stale && (
                    // The multiplier fell back to 1.0 because the source could
                    // not be reached. Saying so is the difference between a
                    // real reading and a placeholder that looks like one.
                    <p className="mt-2 rounded border border-amber-500/30 bg-amber-500/5 px-2 py-1 text-[11px] text-amber-400">
                      {data.status_message}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
