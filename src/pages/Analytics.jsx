import React, { useCallback, useEffect, useState } from 'react';
import { api } from '@/api/client';
import {
  BarChart3,
  Loader2,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Flame,
  Target,
  DollarSign,
  Users,
} from 'lucide-react';

/**
 * Analytics — the owner business-intelligence dashboard.
 *
 * Backed by /api/v1/analytics/dashboard (funnel, revenue forecast, 12-month
 * volume, permit-to-lead, review approval) plus /api/v1/bid-intelligence/summary.
 * These backends were built and mounted but had no frontend, so the owner's
 * pipeline funnel, revenue forecast, and volume trend were all invisible.
 *
 * Honest states only. No synthetic numbers — an empty pipeline renders as zero,
 * an auth failure says so, a backend error surfaces the message.
 */

const money = (n) =>
  typeof n === 'number' ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) : '—';

const STAGE_ORDER = ['new', 'contacted', 'proposal_sent', 'won', 'lost'];
const STAGE_LABELS = {
  new: 'New', contacted: 'Contacted', proposal_sent: 'Proposal sent', won: 'Won', lost: 'Lost',
};
const SCORE_COLORS = {
  HOT: 'bg-red-500', WARM: 'bg-amber-500', COLD: 'bg-sky-500', QUALIFIED: 'bg-emerald-500',
};

function Tile({ icon: Icon, label, value, sub, accent = 'amber' }) {
  const ring = accent === 'red' ? 'bg-red-500/15 text-red-400' : accent === 'emerald' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400';
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${ring}`}><Icon className="h-4 w-4" /></span>
        <span className="text-[11px] uppercase tracking-wider text-slate-400">{label}</span>
      </div>
      <div className="text-2xl font-black tabular-nums text-white">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

function Bars({ data, colorFor }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.key} className="flex items-center gap-3">
          <div className="w-28 flex-none truncate text-xs text-slate-400">{d.label}</div>
          <div className="h-6 flex-1 overflow-hidden rounded bg-white/[0.04]">
            <div className={`h-full rounded ${colorFor ? colorFor(d) : 'bg-amber-500'}`} style={{ width: `${(d.value / max) * 100}%`, minWidth: d.value ? '6px' : 0 }} />
          </div>
          <div className="w-10 flex-none text-right text-xs tabular-nums text-slate-300">{d.value}</div>
        </div>
      ))}
    </div>
  );
}

function Panel({ title, children, note }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">{title}</h2>
        {note && <span className="text-xs text-slate-500">{note}</span>}
      </div>
      {children}
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [bid, setBid] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      const [dash, bidRes] = await Promise.all([
        api.analyticsDashboard(),
        api.bidSummary().catch(() => null),
      ]);
      setData(dash);
      setBid(bidRes);
      setStatus('ready');
    } catch (err) {
      const msg = String(err?.message || err);
      if (/401|403|unauthor|forbidden|premium/i.test(msg)) setStatus('unauthorized');
      else { setStatus('error'); setError(msg); }
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const funnel = data?.lead_funnel || {};
  const revenue = data?.revenue_forecast || {};
  const monthly = Array.isArray(data?.monthly_lead_volume) ? data.monthly_lead_volume : [];
  const totalLeads = funnel.total_leads ?? 0;
  const hot = funnel.by_score_label?.HOT ?? 0;
  const maxMonthly = Math.max(1, ...monthly.map((m) => m.total_leads || 0));

  const stageBars = STAGE_ORDER
    .filter((s) => funnel.by_stage && s in funnel.by_stage)
    .map((s) => ({ key: s, label: STAGE_LABELS[s] || s, value: funnel.by_stage[s] || 0 }));
  const serviceBars = Object.entries(funnel.by_service || {})
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([k, v]) => ({ key: k, label: k, value: v }));
  const scoreBars = Object.entries(funnel.by_score_label || {})
    .map(([k, v]) => ({ key: k, label: k, value: v }));

  return (
    <div className="min-h-screen bg-[#070a10] px-4 py-8 text-slate-200 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Command Center</p>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Analytics</h1>
            <p className="mt-1 text-sm text-slate-400">Pipeline funnel, revenue forecast, and 12-month volume — live from your lead data.</p>
          </div>
          <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/[0.07]">
            <RefreshCw className={`h-4 w-4 ${status === 'loading' ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {status === 'unauthorized' && (
          <Banner tone="amber" title="Sign in to view analytics" body="This is a premium owner tool. Unlock the Command Center to load your business intelligence." />
        )}
        {status === 'error' && <Banner tone="red" title="Couldn't load analytics" body={error} />}
        {status === 'loading' && (
          <div className="flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] py-16 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading analytics…
          </div>
        )}

        {status === 'ready' && (
          <div className="space-y-5">
            {/* Top tiles */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Tile icon={Users} label="Total leads" value={totalLeads.toLocaleString()} />
              <Tile icon={Flame} label="HOT leads" value={hot.toLocaleString()} accent="red" sub={totalLeads ? `${Math.round((hot / totalLeads) * 100)}% of pipeline` : null} />
              <Tile icon={DollarSign} label="Forecast (low)" value={money(revenue.total_forecast_low_usd)} accent="emerald" />
              <Tile icon={TrendingUp} label="Forecast (high)" value={money(revenue.total_forecast_high_usd)} accent="emerald" />
            </div>

            {bid && (bid.win_rate != null || bid.total_bids != null) && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Tile icon={Target} label="Win rate" value={bid.win_rate != null ? `${Math.round(bid.win_rate * (bid.win_rate <= 1 ? 100 : 1))}%` : '—'} />
                {bid.total_bids != null && <Tile icon={BarChart3} label="Bids tracked" value={bid.total_bids.toLocaleString()} />}
                {bid.wins != null && <Tile icon={Target} label="Wins" value={bid.wins.toLocaleString()} accent="emerald" />}
                {bid.losses != null && <Tile icon={Target} label="Losses" value={bid.losses.toLocaleString()} accent="red" />}
              </div>
            )}

            <div className="grid gap-5 lg:grid-cols-2">
              <Panel title="Pipeline funnel" note={`${totalLeads} leads`}>
                {stageBars.length ? <Bars data={stageBars} /> : <Empty />}
              </Panel>
              <Panel title="By lead score">
                {scoreBars.length ? <Bars data={scoreBars} colorFor={(d) => SCORE_COLORS[d.key] || 'bg-slate-500'} /> : <Empty />}
              </Panel>
            </div>

            {/* Monthly volume */}
            <Panel title="Monthly lead volume" note="last 12 months">
              {monthly.length ? (
                <div className="flex items-end gap-1.5 overflow-x-auto pb-1" style={{ minHeight: 140 }}>
                  {monthly.map((m) => (
                    <div key={m.month} className="flex min-w-[38px] flex-1 flex-col items-center gap-1">
                      <div className="flex h-28 w-full items-end justify-center">
                        <div className="relative flex w-6 flex-col justify-end overflow-hidden rounded-t bg-white/[0.04]" style={{ height: '100%' }}>
                          <div className="w-full bg-amber-500/80" style={{ height: `${((m.total_leads || 0) / maxMonthly) * 100}%` }} title={`${m.total_leads} leads`} />
                          <div className="absolute bottom-0 w-full bg-red-500" style={{ height: `${((m.hot_leads || 0) / maxMonthly) * 100}%` }} title={`${m.hot_leads} HOT`} />
                        </div>
                      </div>
                      <div className="whitespace-nowrap text-[9px] text-slate-500">{(m.label || m.month || '').replace(/ \d{4}$/, '')}</div>
                      <div className="text-[10px] font-medium tabular-nums text-slate-300">{m.total_leads ?? 0}</div>
                    </div>
                  ))}
                </div>
              ) : <Empty />}
              <div className="mt-3 flex gap-4 text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-500/80" /> Total leads</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-red-500" /> HOT leads</span>
              </div>
            </Panel>

            {/* Revenue forecast by service */}
            <Panel title="Revenue forecast by service" note={revenue.assumptions || ''}>
              {Array.isArray(revenue.forecasts_by_service) && revenue.forecasts_by_service.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="text-[11px] uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="py-2 pr-4 font-semibold">Service</th>
                        <th className="py-2 pr-4 text-right font-semibold">HOT leads</th>
                        <th className="py-2 pr-4 text-right font-semibold">Win rate</th>
                        <th className="py-2 pr-4 text-right font-semibold">Exp. wins</th>
                        <th className="py-2 text-right font-semibold">Forecast</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06]">
                      {revenue.forecasts_by_service.map((f) => (
                        <tr key={f.service_type}>
                          <td className="py-2 pr-4 capitalize text-slate-200">{f.service_type || '—'}</td>
                          <td className="py-2 pr-4 text-right tabular-nums text-slate-300">{f.hot_lead_count}</td>
                          <td className="py-2 pr-4 text-right tabular-nums text-slate-300">{Math.round((f.win_rate || 0) * 100)}%</td>
                          <td className="py-2 pr-4 text-right tabular-nums text-slate-300">{f.expected_wins}</td>
                          <td className="py-2 text-right tabular-nums font-medium text-white">{money(f.forecast_low_usd)}–{money(f.forecast_high_usd)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <Empty msg="No HOT leads to forecast yet." />}
            </Panel>

            {/* Top services */}
            {serviceBars.length > 0 && (
              <Panel title="Leads by service">
                <Bars data={serviceBars} />
              </Panel>
            )}

            {data.generated_at && (
              <p className="text-center text-xs text-slate-600">Generated {new Date(data.generated_at).toLocaleString()}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Empty({ msg = 'No data yet.' }) {
  return <p className="py-6 text-center text-sm text-slate-500">{msg}</p>;
}

function Banner({ tone, title, body }) {
  const cls = tone === 'red' ? 'border-red-500/25 bg-red-500/10' : 'border-amber-500/25 bg-amber-500/10';
  const icon = tone === 'red' ? 'text-red-400' : 'text-amber-400';
  const head = tone === 'red' ? 'text-red-300' : 'text-amber-300';
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-4 ${cls}`}>
      <AlertTriangle className={`mt-0.5 h-5 w-5 flex-none ${icon}`} />
      <div className="text-sm">
        <p className={`font-semibold ${head}`}>{title}</p>
        <p className="break-words text-slate-300">{body}</p>
      </div>
    </div>
  );
}
