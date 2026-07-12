import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Camera,
  CheckCircle,
  Circle,
  FileText,
  Layers,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Target,
  Thermometer,
  TrendingUp,
  Truck,
  Users,
  XCircle,
  Zap,
} from 'lucide-react';
import { JarvisChat } from '../components/JarvisChat';

// ── Types ──────────────────────────────────────────────────────────────────────

interface KpiData {
  generated_at: string;
  pipeline: { total_leads: number; new_leads_mtd: number; open_leads: number; won_ytd: number };
  jobs: { total: number; active: number };
  work_orders: { pending: number; in_progress: number; completed_mtd: number };
  workforce: { active_crew: number; active_subs: number; total_headcount: number };
  safety: { incidents_ytd: number; recordables_ytd: number; trir: number };
  cashflow: { inflow_30d: number; outflow_30d: number; net_30d: number };
  proposals: { total: number; won: number; win_rate_pct: number };
  market: { vdot_open_bids: number; vdot_total_tracked: number };
  gallery: { photos_total: number };
}

interface LeadRow {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  service: string | null;
  estimated_value: number | null;
  score_label: string | null;
  status: string;
  created_at: string;
}

interface AnomalyResult {
  metric_name: string;
  current_value: number;
  baseline_value: number;
  z_score: number;
  severity: string;
  message: string;
  is_anomaly: boolean;
}

interface PulseHotspot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  heat?: number;
  terms?: { term: string; heat: number }[];
}

// ── Tab config ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'jarvis',        label: 'Jarvis',        icon: Zap },
  { id: 'kpi',           label: 'KPI',           icon: BarChart3 },
  { id: 'leads',         label: 'Live Leads',    icon: Users },
  { id: 'search-pulse',  label: 'Search Pulse',  icon: Search },
  { id: 'integrations',  label: 'Integrations',  icon: Settings },
  { id: 'ops',           label: 'Ops',           icon: Activity },
  { id: 'crm',           label: 'CRM',           icon: FileText },
  { id: 'dispatch',      label: 'Dispatch',      icon: Truck },
  { id: 'civil-intel',   label: 'Civil Intel',   icon: Shield },
  { id: 'thermal',       label: 'Thermal',       icon: Thermometer },
  { id: 'drone',         label: 'Drone',         icon: Camera },
  { id: 'lidar',         label: 'LiDAR',         icon: Layers },
  { id: 'roller',        label: 'Roller',        icon: Circle },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ── Small components ───────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, accent = false,
}: {
  label: string; value: string | number; sub?: string; accent?: boolean;
}) {
  return (
    <div className={`bg-zinc-900 border rounded-xl p-5 ${accent ? 'border-yellow-500/40' : 'border-zinc-800'}`}>
      <p className="text-zinc-500 text-xs font-medium mb-1">{label}</p>
      <p className={`text-2xl font-black ${accent ? 'text-yellow-400' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-zinc-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

function Section({
  title, icon: Icon, children,
}: {
  title: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={16} className="text-yellow-400" />
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">{children}</div>
    </div>
  );
}

function ComingSoon({
  title, batch, description,
}: {
  title: string; batch: string; description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 max-w-md">
        <p className="text-yellow-400 text-xs font-semibold mb-2 uppercase tracking-widest">{batch}</p>
        <h2 className="text-xl font-black text-white mb-3">{title}</h2>
        <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30',
    HIGH:     'bg-orange-500/20 text-orange-400 border-orange-500/30',
    MEDIUM:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    INFO:     'bg-zinc-700 text-zinc-400 border-zinc-600',
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${colors[severity] ?? colors.INFO}`}>
      {severity}
    </span>
  );
}

// ── Formatters ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}
function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1,
  }).format(n);
}

// ── Tab panels ─────────────────────────────────────────────────────────────────

function KpiTab({ kpi }: { kpi: KpiData }) {
  const netColor = kpi.cashflow.net_30d >= 0 ? 'text-green-400' : 'text-red-400';
  return (
    <div>
      <Section title="Pipeline" icon={Target}>
        <StatCard label="Total Leads" value={fmt(kpi.pipeline.total_leads)} accent />
        <StatCard label="New This Month" value={kpi.pipeline.new_leads_mtd} />
        <StatCard label="Open Leads" value={kpi.pipeline.open_leads} />
        <StatCard label="Won YTD" value={kpi.pipeline.won_ytd} />
      </Section>

      <Section title="Proposals" icon={FileText}>
        <StatCard label="Total Proposals" value={kpi.proposals.total} />
        <StatCard label="Won" value={kpi.proposals.won} />
        <StatCard label="Win Rate" value={`${kpi.proposals.win_rate_pct}%`} accent />
      </Section>

      <Section title="Operations" icon={BarChart3}>
        <StatCard label="Active Jobs" value={kpi.jobs.active} sub={`${kpi.jobs.total} total`} />
        <StatCard label="Pending WOs" value={kpi.work_orders.pending} />
        <StatCard label="In Progress WOs" value={kpi.work_orders.in_progress} accent />
        <StatCard label="Completed MTD" value={kpi.work_orders.completed_mtd} />
      </Section>

      <Section title="Workforce" icon={Users}>
        <StatCard label="Active Crew" value={kpi.workforce.active_crew} accent />
        <StatCard label="Active Subs" value={kpi.workforce.active_subs} />
        <StatCard label="Total Headcount" value={kpi.workforce.total_headcount} />
      </Section>

      <Section title="Safety" icon={AlertTriangle}>
        <StatCard label="Incidents YTD" value={kpi.safety.incidents_ytd} />
        <StatCard label="Recordables YTD" value={kpi.safety.recordables_ytd} />
        <StatCard
          label="TRIR"
          value={kpi.safety.trir}
          sub="Industry avg: 3.4"
          accent={kpi.safety.trir > 3.4}
        />
      </Section>

      <Section title="Cash Flow (Last 30 Days)" icon={TrendingUp}>
        <StatCard label="Inflow" value={fmtCurrency(kpi.cashflow.inflow_30d)} />
        <StatCard label="Outflow" value={fmtCurrency(kpi.cashflow.outflow_30d)} />
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-zinc-500 text-xs font-medium mb-1">Net</p>
          <p className={`text-2xl font-black ${netColor}`}>{fmtCurrency(kpi.cashflow.net_30d)}</p>
        </div>
      </Section>

      <Section title="Market" icon={TrendingUp}>
        <StatCard label="VDOT Open Bids" value={kpi.market.vdot_open_bids} accent />
        <StatCard label="Total Tracked" value={kpi.market.vdot_total_tracked} />
      </Section>

      <Section title="Gallery" icon={Camera}>
        <StatCard label="Project Photos" value={kpi.gallery.photos_total} />
      </Section>
    </div>
  );
}

function LeadsTab({ authKey, apiBase }: { authKey: string; apiBase: string }) {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`${apiBase}/api/v1/leads/?limit=50`, {
      headers: { 'X-Master-Key': authKey },
    })
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((d) => { setLeads(Array.isArray(d) ? d : d.leads ?? []); setError(''); })
      .catch(() => setError('Failed to load leads.'))
      .finally(() => setLoading(false));
  }, [authKey, apiBase]);

  if (loading) return <div className="text-zinc-500 py-12 text-center text-sm">Loading leads…</div>;
  if (error) return <div className="text-red-400 py-12 text-center text-sm">{error}</div>;

  const scoreColor = (label: string | null) => {
    if (label === 'HOT') return 'text-red-400';
    if (label === 'WARM') return 'text-yellow-400';
    return 'text-zinc-400';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-black text-lg">Live Leads</h2>
        <span className="text-zinc-500 text-xs">{leads.length} shown</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              {['Name', 'Location', 'Service', 'Value', 'Score', 'Status', 'Date'].map((h) => (
                <th key={h} className="text-left text-zinc-500 text-xs font-semibold px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/40 transition-colors">
                <td className="px-4 py-3 text-white font-medium">{l.name}</td>
                <td className="px-4 py-3 text-zinc-400">{[l.city, l.state].filter(Boolean).join(', ') || '—'}</td>
                <td className="px-4 py-3 text-zinc-300">{l.service ?? '—'}</td>
                <td className="px-4 py-3 text-zinc-300">
                  {l.estimated_value != null ? fmtCurrency(l.estimated_value) : '—'}
                </td>
                <td className={`px-4 py-3 font-bold ${scoreColor(l.score_label)}`}>
                  {l.score_label ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">{l.status}</span>
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs">
                  {new Date(l.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-600 text-sm">No leads found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SearchPulseTab({ authKey, apiBase }: { authKey: string; apiBase: string }) {
  const [data, setData] = useState<{
    ok: boolean; reason?: string; hotspots: PulseHotspot[]; terms: string[]; ts: number; cached?: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback((force = false) => {
    const url = `${apiBase}/api/v1/seo/${force ? 'search-pulse/refresh' : 'search-pulse'}`;
    const method = force ? 'POST' : 'GET';
    if (force) setRefreshing(true); else setLoading(true);
    fetch(url, { method, headers: { 'X-Master-Key': authKey } })
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, [authKey, apiBase]);

  useEffect(() => { load(false); }, [load]);

  if (loading) return <div className="text-zinc-500 py-12 text-center text-sm">Fetching SERP data…</div>;

  const heatColor = (h: number) => {
    if (h >= 0.7) return 'bg-red-500';
    if (h >= 0.4) return 'bg-yellow-500';
    if (h >= 0.2) return 'bg-green-500';
    return 'bg-zinc-600';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white font-black text-lg">Search Pulse — VA Market Heat Map</h2>
          {data?.ts && (
            <p className="text-zinc-500 text-xs mt-1">
              {data.cached ? 'Cached · ' : ''}Last updated {new Date(data.ts * 1000).toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-yellow-400 hover:text-yellow-300 disabled:opacity-40 transition-colors"
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing…' : 'Force refresh'}
        </button>
      </div>

      {!data?.ok && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 text-yellow-300 text-sm">
          <strong>Demo mode:</strong> {data?.reason ?? 'No live data available.'}
          {' '}Set <code className="bg-yellow-500/20 px-1 rounded">SERPAPI_KEY</code> in runtime config for live SERP scores.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {(data?.hotspots ?? []).map((hs) => {
          const heat = hs.heat ?? 0;
          return (
            <div key={hs.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white text-sm font-bold">{hs.name}</span>
                {heat > 0 && (
                  <span className="text-xs font-mono text-zinc-400">{(heat * 100).toFixed(0)}%</span>
                )}
              </div>
              {heat > 0 ? (
                <>
                  <div className="h-1.5 bg-zinc-800 rounded-full mb-3">
                    <div
                      className={`h-1.5 rounded-full ${heatColor(heat)} transition-all`}
                      style={{ width: `${Math.round(heat * 100)}%` }}
                    />
                  </div>
                  <div className="space-y-1">
                    {(hs.terms ?? []).map((t) => (
                      <div key={t.term} className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500 truncate max-w-[70%]">{t.term}</span>
                        <div className="h-1 w-16 bg-zinc-800 rounded-full ml-2">
                          <div
                            className={`h-1 rounded-full ${heatColor(t.heat)}`}
                            style={{ width: `${Math.round(t.heat * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-zinc-600 text-xs">No live data</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 border-t border-zinc-800 pt-4">
        <p className="text-zinc-600 text-xs">
          Heat = min(1.0, ads×0.18 + organic×0.035) · Terms: {data?.terms?.join(' · ') ?? '—'}
        </p>
      </div>
    </div>
  );
}

function IntegrationsTab({ authKey, apiBase }: { authKey: string; apiBase: string }) {
  const [status, setStatus] = useState<Record<string, unknown> | null>(null);
  const [features, setFeatures] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const h = { 'X-Master-Key': authKey };
    Promise.all([
      fetch(`${apiBase}/api/v1/voice-ai/status`, { headers: h }).then((r) => r.json()),
      fetch(`${apiBase}/api/v1/seo/features`, { headers: h }).then((r) => r.json()),
    ]).then(([s, f]) => { setStatus(s); setFeatures(f); }).catch(() => {});
  }, [authKey, apiBase]);

  const providers = (status?.llm_providers ?? {}) as Record<string, boolean>;
  const tier = (features?.tier ?? '—') as string;
  const enabledFeatures = (features?.features ?? []) as string[];
  const auto = status?.autonomy as Record<string, unknown> | undefined;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-white font-black mb-3">LLM Providers</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(providers).map(([name, ok]) => (
            <div key={name} className={`bg-zinc-900 border rounded-xl p-4 ${ok ? 'border-green-500/30' : 'border-zinc-800'}`}>
              <div className="flex items-center gap-2 mb-1">
                {ok
                  ? <CheckCircle size={14} className="text-green-400" />
                  : <XCircle size={14} className="text-zinc-600" />}
                <span className="text-white text-sm font-semibold capitalize">{name}</span>
              </div>
              <p className="text-xs text-zinc-500">{ok ? 'Key present' : 'No key set'}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-white font-black mb-3">Autonomy State</h3>
        {auto ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-zinc-500 text-xs mb-1">Master</p>
              <p className={`font-bold text-sm ${auto.master_enabled ? 'text-green-400' : 'text-zinc-500'}`}>
                {auto.master_enabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs mb-1">Frozen</p>
              <p className={`font-bold text-sm ${auto.frozen ? 'text-red-400' : 'text-green-400'}`}>
                {auto.frozen ? 'YES' : 'No'}
              </p>
            </div>
            {Boolean(auto.frozen_reason) && (
              <div className="col-span-2">
                <p className="text-zinc-500 text-xs mb-1">Freeze reason</p>
                <p className="text-yellow-300 text-sm">{String(auto.frozen_reason)}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-zinc-600 text-sm">Loading autonomy state…</div>
        )}
      </div>

      <div>
        <h3 className="text-white font-black mb-3">License Tier &amp; Features</h3>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-yellow-400 font-bold text-sm mb-3 uppercase">{tier}</p>
          <div className="flex flex-wrap gap-2">
            {enabledFeatures.map((f) => (
              <span key={f} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">{f}</span>
            ))}
            {enabledFeatures.length === 0 && (
              <span className="text-zinc-600 text-sm">Loading features…</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OpsTab({
  authKey, apiBase, kpi,
}: {
  authKey: string; apiBase: string; kpi: KpiData | null;
}) {
  const [anomalies, setAnomalies] = useState<{ results: AnomalyResult[]; checks_run: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiBase}/api/v1/anomalies/`, { headers: { 'X-Master-Key': authKey } })
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((d) => setAnomalies(d))
      .catch(() => setAnomalies(null))
      .finally(() => setLoading(false));
  }, [authKey, apiBase]);

  return (
    <div className="space-y-6">
      {kpi && (
        <Section title="Operations" icon={Activity}>
          <StatCard label="Active Jobs" value={kpi.jobs.active} sub={`${kpi.jobs.total} total`} accent />
          <StatCard label="Pending WOs" value={kpi.work_orders.pending} />
          <StatCard label="In Progress WOs" value={kpi.work_orders.in_progress} />
          <StatCard label="Completed MTD" value={kpi.work_orders.completed_mtd} />
        </Section>
      )}

      <div>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-yellow-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Anomaly Detection</h2>
          {!loading && anomalies && (
            <span className="text-zinc-500 text-xs">{anomalies.checks_run} checks</span>
          )}
        </div>

        {loading && <div className="text-zinc-500 text-sm">Running anomaly checks…</div>}

        {!loading && !anomalies && (
          <div className="text-zinc-600 text-sm bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            Anomaly data unavailable — check API connectivity.
          </div>
        )}

        {!loading && anomalies && (
          <div className="space-y-2">
            {anomalies.results.map((r) => (
              <div
                key={r.metric_name}
                className={`bg-zinc-900 border rounded-xl p-4 flex items-start justify-between gap-4 ${
                  r.is_anomaly ? 'border-yellow-500/30' : 'border-zinc-800'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white text-sm font-semibold">{r.metric_name.replace(/_/g, ' ')}</span>
                    <SeverityBadge severity={r.severity} />
                  </div>
                  <p className="text-zinc-400 text-xs">{r.message}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-zinc-300 text-sm font-mono">z={r.z_score.toFixed(2)}</p>
                  <p className={`text-xs font-bold ${r.is_anomaly ? 'text-yellow-400' : 'text-zinc-600'}`}>
                    {r.is_anomaly ? 'ANOMALY' : 'normal'}
                  </p>
                </div>
              </div>
            ))}
            {anomalies.results.length === 0 && (
              <div className="text-zinc-600 text-sm text-center py-6">No results — insufficient data for Z-score baseline.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Pulse Bar ──────────────────────────────────────────────────────────────────

function PulseBar({ kpi, authKey, apiBase }: { kpi: KpiData | null; authKey: string; apiBase: string }) {
  const [frozen, setFrozen] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`${apiBase}/api/v1/voice-ai/status`, { headers: { 'X-Master-Key': authKey } })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setFrozen(d?.autonomy?.frozen ?? false))
      .catch(() => {});
  }, [authKey, apiBase]);

  return (
    <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center gap-6 overflow-x-auto text-xs">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`w-2 h-2 rounded-full ${frozen === null ? 'bg-zinc-600' : frozen ? 'bg-red-500' : 'bg-green-500'}`} />
          <span className="text-zinc-400">
            Autonomy: {frozen === null ? '…' : frozen ? 'FROZEN' : 'LIVE'}
          </span>
        </div>
        {kpi && (
          <>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-400 shrink-0">
              Leads MTD: <strong className="text-white">{kpi.pipeline.new_leads_mtd}</strong>
            </span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-400 shrink-0">
              Active Jobs: <strong className="text-white">{kpi.jobs.active}</strong>
            </span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-400 shrink-0">
              Win Rate: <strong className="text-white">{kpi.proposals.win_rate_pct}%</strong>
            </span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-400 shrink-0">
              VDOT Open: <strong className="text-yellow-400">{kpi.market.vdot_open_bids}</strong>
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export function CommandCenterPage() {
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [authKey, setAuthKey] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authErr, setAuthErr] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('jarvis');
  const tabBarRef = useRef<HTMLDivElement>(null);
  const apiBase = import.meta.env.VITE_API_BASE_URL || '';

  useEffect(() => {
    document.title = 'Command Center | J. Worden & Sons';
  }, []);

  const fetchKpi = (key: string) => {
    setKpiLoading(true);
    setAuthErr(false);
    fetch(`${apiBase}/api/v1/kpi/`, { headers: { 'X-Master-Key': key } })
      .then((r) => {
        if (r.status === 401 || r.status === 403) throw new Error('auth');
        if (!r.ok) throw new Error('err');
        return r.json();
      })
      .then((d: KpiData) => { setKpi(d); setAuthed(true); })
      .catch((e) => { if (e.message === 'auth') setAuthErr(true); setAuthed(false); })
      .finally(() => setKpiLoading(false));
  };

  // ── Login gate ────────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="bg-zinc-950 min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <div className="flex items-center gap-2 text-yellow-400 mb-4">
            <BarChart3 size={20} />
            <h1 className="font-black text-lg">Command Center</h1>
          </div>
          <p className="text-zinc-400 text-sm mb-6">Enter your master key to access the operations dashboard.</p>
          {authErr && <p className="text-red-400 text-xs mb-3 font-medium">Invalid master key.</p>}
          <input
            type="password"
            placeholder="Master key"
            value={authKey}
            onChange={(e) => setAuthKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchKpi(authKey)}
            className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-4 py-2.5 mb-3 focus:outline-none focus:border-yellow-500"
          />
          <button
            onClick={() => fetchKpi(authKey)}
            disabled={!authKey}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm rounded-lg py-2.5 disabled:opacity-40 transition-colors"
          >
            Access Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Operating room ────────────────────────────────────────────────────────────
  return (
    <div className="bg-zinc-950 min-h-screen flex flex-col">
      {/* PulseBar */}
      <PulseBar kpi={kpi} authKey={authKey} apiBase={apiBase} />

      {/* Header */}
      <div className="bg-zinc-950 border-b border-zinc-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-yellow-400" />
            <h1 className="text-white font-black text-base">Command Center</h1>
          </div>
          {kpi && (
            <p className="text-zinc-600 text-xs">
              KPI updated {new Date(kpi.generated_at).toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div
        ref={tabBarRef}
        className="sticky top-0 z-20 bg-zinc-900 border-b border-zinc-800 overflow-x-auto"
      >
        <div className="max-w-7xl mx-auto px-4 flex gap-0.5 py-1.5 min-w-max">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-yellow-500 text-black'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {activeTab === 'jarvis' && <JarvisChat />}

        {activeTab === 'kpi' && (
          kpiLoading || !kpi
            ? <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[...Array(16)].map((_, i) => (
                  <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 h-20 animate-pulse" />
                ))}
              </div>
            : <KpiTab kpi={kpi} />
        )}

        {activeTab === 'leads' && (
          <LeadsTab authKey={authKey} apiBase={apiBase} />
        )}

        {activeTab === 'search-pulse' && (
          <SearchPulseTab authKey={authKey} apiBase={apiBase} />
        )}

        {activeTab === 'integrations' && (
          <IntegrationsTab authKey={authKey} apiBase={apiBase} />
        )}

        {activeTab === 'ops' && (
          <OpsTab authKey={authKey} apiBase={apiBase} kpi={kpi} />
        )}

        {activeTab === 'crm' && (
          <ComingSoon
            title="Full CRM View"
            batch="Batch 5"
            description="Expanded customer timeline, deal stages, revenue forecasting, and client portal integration. CRM data is currently accessible via the Live Leads tab."
          />
        )}

        {activeTab === 'dispatch' && (
          <ComingSoon
            title="Dispatch &amp; Schedule Simulation"
            batch="Batch 5"
            description="AI-powered schedule optimization engine with crew+equipment conflict detection, drag-drop Gantt chart, and weather-aware paving windows."
          />
        )}

        {activeTab === 'civil-intel' && (
          <ComingSoon
            title="Civil Intelligence — 51-State Compliance"
            batch="Batch 5"
            description="SupremeCourtAI engine: lien law deadlines, bond thresholds, prevailing wage tiers, and contractor licensing requirements for all 50 states + DC."
          />
        )}

        {activeTab === 'thermal' && (
          <ComingSoon
            title="Asphalt Thermal Lay-Down Window"
            batch="Batch 4"
            description="NOAA weather integration + Chadbourn/MultiCool cooling model. Predicts safe compaction windows based on ambient temperature, mat temperature, and mix design."
          />
        )}

        {activeTab === 'drone' && (
          <ComingSoon
            title="Drone Capture + AI Takeoff"
            batch="Batch 4"
            description="OpenCV aerial imagery processing for automatic square footage measurement. Integrates with Google Solar API for aerial views and Google Maps for site context."
          />
        )}

        {activeTab === 'lidar' && (
          <ComingSoon
            title="LiDAR Vision Measurement"
            batch="Batch 4"
            description="Computer vision pipeline for precise area measurement from drone or satellite imagery. Zero-tape field estimation with confidence intervals."
          />
        )}

        {activeTab === 'roller' && (
          <ComingSoon
            title="Roller Telemetry &amp; Compaction GPS"
            batch="Batch 4"
            description="GPS-tracked compaction pass counting with IRI smoothness proxy. Real-time roller position map, pass density heat map, and compaction QA reporting."
          />
        )}
      </div>
    </div>
  );
}
