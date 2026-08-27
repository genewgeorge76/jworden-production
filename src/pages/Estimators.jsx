import React, { useState } from 'react';
import { api } from '@/api/client';
import { Calculator, Loader2, AlertTriangle, Gauge, DollarSign, CalendarClock, Target, Play } from 'lucide-react';

/**
 * AI Estimators — the math-ai engines surfaced.
 *
 * Backed by /api/v1/math-ai/{pavement-score,cost-estimate,maintenance-forecast,
 * lead-quality} (app/routers/math_ai.py). Real deterministic models that were
 * built and mounted but had no frontend. Lead-quality is premium-gated; the
 * other three are public.
 *
 * Honest: it renders exactly what the backend returns — no synthetic numbers.
 * A failed call surfaces the error; it never invents a score.
 */

const inputCls =
  'w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-amber-500/50 focus:outline-none';

const SERVICE_TYPES = ['paving', 'sealcoating', 'crackfill', 'parking_lot', 'driveway', 'maintenance', 'overlay', 'reconstruction', 'striping', 'patching'];

const MONEY_HINTS = /(usd|cost|price|estimate|value|low|high|revenue|total)/i;

function humanize(k) {
  return k.replace(/_/g, ' ').replace(/\busd\b/i, '(USD)').replace(/\b\w/g, (c) => c.toUpperCase());
}
function fmt(key, val) {
  if (val == null) return '—';
  if (typeof val === 'number') {
    if (MONEY_HINTS.test(key) && Math.abs(val) >= 100) return val.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
    return Number.isInteger(val) ? val.toLocaleString() : val.toFixed(2);
  }
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (Array.isArray(val)) return val.map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(', ');
  if (typeof val === 'object') return null; // rendered as nested block
  return String(val);
}

function ResultBlock({ result }) {
  const entries = Object.entries(result).filter(([k]) => k !== 'status');
  return (
    <div className="mt-4 space-y-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] p-3">
      {entries.map(([k, v]) => {
        const scalar = fmt(k, v);
        if (scalar === null) {
          return (
            <div key={k} className="text-sm">
              <div className="text-[11px] uppercase tracking-wider text-slate-400">{humanize(k)}</div>
              <pre className="mt-1 overflow-x-auto rounded bg-black/30 p-2 text-xs text-slate-300">{JSON.stringify(v, null, 2)}</pre>
            </div>
          );
        }
        return (
          <div key={k} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-slate-400">{humanize(k)}</span>
            <span className="text-right font-medium tabular-nums text-white">{scalar}</span>
          </div>
        );
      })}
    </div>
  );
}

function EstimatorCard({ icon: Icon, title, blurb, fields, initial, runner, premium }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const set = (k, type) => (e) => {
    const raw = e.target.value;
    setForm((f) => ({ ...f, [k]: type === 'number' ? (raw === '' ? '' : Number(raw)) : raw }));
  };

  const run = async (e) => {
    e.preventDefault();
    setBusy(true); setError(''); setResult(null);
    try {
      const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== '' && v != null));
      const res = await runner(payload);
      setResult(res);
    } catch (err) {
      const msg = String(err?.message || err);
      setError(/401|403|unauthor|forbidden|premium/i.test(msg) ? 'Sign in — this estimator is a premium tool.' : msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={run} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
      <div className="mb-1 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/15 text-amber-400"><Icon className="h-4 w-4" /></span>
        <h2 className="text-base font-bold text-white">{title}</h2>
        {premium && <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-300">Premium</span>}
      </div>
      <p className="mb-4 text-xs text-slate-400">{blurb}</p>

      <div className="grid grid-cols-2 gap-3">
        {fields.map((f) => (
          <label key={f.key} className={f.full ? 'col-span-2 block' : 'block'}>
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-400">{f.label}</span>
            {f.options ? (
              <select value={form[f.key]} onChange={set(f.key, 'text')} className={inputCls}>
                {f.options.map((o) => <option key={o} value={o} className="capitalize">{typeof o === 'string' ? o.replace(/_/g, ' ') : o}</option>)}
              </select>
            ) : (
              <input
                value={form[f.key]}
                onChange={set(f.key, f.type)}
                type={f.type === 'number' ? 'number' : 'text'}
                inputMode={f.type === 'number' ? 'decimal' : undefined}
                step="any"
                placeholder={f.placeholder}
                className={inputCls}
              />
            )}
          </label>
        ))}
      </div>

      <button type="submit" disabled={busy} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 py-2.5 text-sm font-bold text-[#070a10] hover:bg-amber-400 disabled:opacity-60">
        {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Calculating…</> : <><Play className="h-4 w-4" /> Run estimate</>}
      </button>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" /> <span className="break-words">{error}</span>
        </div>
      )}
      {result && <ResultBlock result={result} />}
    </form>
  );
}

export default function Estimators() {
  return (
    <div className="min-h-screen bg-[#070a10] px-4 py-8 text-slate-200 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-amber-400">Command Center</p>
          <div className="flex items-center gap-2">
            <Calculator className="h-6 w-6 text-amber-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">AI Estimators</h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">Pavement condition, cost, maintenance timing, and lead quality — computed by the math-ai engines. Results are exactly what the models return.</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <EstimatorCard
            icon={Gauge}
            title="Pavement Condition Score"
            blurb="PCI-style score from age, cracking, potholes, and traffic load."
            initial={{ age: 8, cracks: 15, potholes: 2, traffic: 'medium' }}
            fields={[
              { key: 'age', label: 'Age (years)', type: 'number' },
              { key: 'cracks', label: 'Cracking (%)', type: 'number' },
              { key: 'potholes', label: 'Potholes / 1k sqft', type: 'number' },
              { key: 'traffic', label: 'Traffic', options: ['low', 'medium', 'high', 'very_high'] },
            ]}
            runner={(p) => api.mathPavementScore(p)}
          />

          <EstimatorCard
            icon={DollarSign}
            title="Cost Estimate"
            blurb="Ballpark project cost by area, service, and state pricing."
            initial={{ sqft: 5000, service_type: 'paving', state: 'VA' }}
            fields={[
              { key: 'sqft', label: 'Area (sqft)', type: 'number' },
              { key: 'service_type', label: 'Service', options: SERVICE_TYPES },
              { key: 'state', label: 'State (2-letter)', type: 'text', placeholder: 'VA' },
            ]}
            runner={(p) => api.mathCostEstimate(p)}
          />

          <EstimatorCard
            icon={CalendarClock}
            title="Maintenance Forecast"
            blurb="When the next treatment is due, from age and current PCI."
            initial={{ pavement_age: 6, condition: 72 }}
            fields={[
              { key: 'pavement_age', label: 'Pavement age (yrs)', type: 'number' },
              { key: 'condition', label: 'Current PCI (0-100)', type: 'number' },
            ]}
            runner={(p) => api.mathMaintenanceForecast(p)}
          />

          <EstimatorCard
            icon={Target}
            title="Lead Quality"
            premium
            blurb="Predicts how strong a lead is from size, type, urgency, and location."
            initial={{ project_size_sqft: 8500, property_type: 'commercial', urgency: 'within_1_week', service_type: 'parking_lot', state_code: 'VA' }}
            fields={[
              { key: 'project_size_sqft', label: 'Project size (sqft)', type: 'number' },
              { key: 'property_type', label: 'Property', options: ['residential', 'commercial'] },
              { key: 'urgency', label: 'Urgency', options: ['asap', 'within_1_week', 'within_1_month', 'flexible'] },
              { key: 'service_type', label: 'Service', options: SERVICE_TYPES },
              { key: 'state_code', label: 'State', type: 'text', placeholder: 'VA' },
            ]}
            runner={(p) => api.mathLeadQuality(p)}
          />
        </div>
      </div>
    </div>
  );
}
