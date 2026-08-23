import React, { useCallback, useEffect, useState } from 'react';
import { Activity, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';

import { api } from '@/api/client';

/**
 * Advanced Telemetry — the PRO plan line, which had a live backend endpoint
 * (/api/v1/telematics/live) and no interface.
 *
 * The endpoint is deliberately honest: it returns `simulated: false` and sets a
 * KPI to null when nothing in the schema measures it, rather than estimating.
 * This page keeps that contract — a null renders as "not measured", never as a
 * zero and never as a dash that could be mistaken for one.
 */

const Metric = ({ label, value, unit, note }) => {
  const measured = value !== null && value !== undefined;
  return (
    <div className="border border-white/10 bg-[#0a0f1c] rounded-lg p-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</p>
      {measured ? (
        <p className="mt-1 text-2xl font-bold text-white tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
          {unit && <span className="ml-1 text-sm font-normal text-slate-400">{unit}</span>}
        </p>
      ) : (
        // Not "0", and not "—". Nothing in the schema measures this, and a
        // zero here would be read as a real measurement of zero.
        <p className="mt-1 text-sm text-slate-500 italic">Not measured</p>
      )}
      {note && <p className="mt-1 text-[11px] text-slate-600">{note}</p>}
    </div>
  );
};

export default function Telemetry() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSnapshot(await api.getLiveTelemetry());
    } catch (err) {
      setError(err?.message || 'Could not load telemetry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const kpi = snapshot?.kpi || {};

  return (
    <div className="min-h-screen bg-[#050810] text-slate-200 px-4 py-8 md:px-8">
      <header className="max-w-5xl mx-auto mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-amber-500/80">Pro plan</p>
          <h1 className="font-display text-3xl font-black text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-amber-500" /> Telemetry
          </h1>
          {snapshot?.generated_at && (
            <p className="mt-1 text-xs text-slate-500">
              As of {new Date(snapshot.generated_at).toLocaleString()}
            </p>
          )}
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
                className="mt-2 text-xs uppercase tracking-widest text-red-300 hover:text-red-200 underline underline-offset-4"
              >
                Try again
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Active trucks" value={kpi.active_trucks} />
              <Metric
                label="Asphalt index"
                value={kpi.asphalt_index}
                unit={kpi.asphalt_index_unit}
                note={kpi.asphalt_index_source ? `Source: ${kpi.asphalt_index_source}` : null}
              />
              <Metric label="Scans, last 24h" value={kpi.scans_last_24h} />
              <Metric label="Scans, total" value={kpi.scans_total} />
              <Metric
                label="Fuel saved"
                value={kpi.fuel_saved_pct}
                unit="%"
                note="No telemetry in the schema measures this."
              />
            </div>

            {snapshot?.fleet && !snapshot.fleet.available && (
              <p className="mt-6 text-sm text-slate-500">
                No fleet source is connected, so truck positions are unavailable.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
