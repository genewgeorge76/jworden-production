/**
 * Construction OS — /os
 *
 * Flagship authenticated dashboard. Fixed overlay (z-50) covers the public
 * site header/footer. Sidebar navigation, 13 live + demo modules, multi-tenant
 * TenantConfig branding, TypeScript strict throughout.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity, AlertTriangle, BarChart3, BookOpen, Bot, Brain, Building2,
  Calendar, Camera, CheckCircle, ChevronRight, Circle, Cloud, CloudRain,
  Cpu, FileText, HardHat, Layout, Layers, LayoutDashboard, Menu,
  MessageSquare, Package, Plus, RefreshCw, Scale, Search, Shield,
  Thermometer, TrendingDown, TrendingUp, Truck, Users, Wind,
  X, XCircle, Zap,
} from 'lucide-react';
import { JarvisChat } from '../components/JarvisChat';
import {
  JWORDEN_TENANT,
  PAVING_MIN_TEMP_F,
  WORDEN_COMPACTION_FLOOR_PCT,
} from '@jworden/core';

// ── Constants ──────────────────────────────────────────────────────────────────

const TENANT = JWORDEN_TENANT;

// Thermal cooling model constant for 2″ HMA layer (Chadbourn approximation)
const THERMAL_K = 0.0315;
// Compaction cutoff temperature (°F) — below this asphalt is too stiff
const COMPACTION_MIN_F = 175;
// Breakdown rolling ceiling
const BREAKDOWN_CEIL_F = 225;

// ── Types ──────────────────────────────────────────────────────────────────────

interface KpiData {
  generated_at: string;
  pipeline:   { total_leads: number; new_leads_mtd: number; open_leads: number; won_ytd: number };
  jobs:       { total: number; active: number };
  work_orders:{ pending: number; in_progress: number; completed_mtd: number };
  workforce:  { active_crew: number; active_subs: number; total_headcount: number };
  safety:     { incidents_ytd: number; recordables_ytd: number; trir: number };
  cashflow:   { inflow_30d: number; outflow_30d: number; net_30d: number };
  proposals:  { total: number; won: number; win_rate_pct: number };
  market:     { vdot_open_bids: number; vdot_total_tracked: number };
  gallery:    { photos_total: number };
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

interface LienEntry {
  id: number;
  customer_name: string;
  project_address: string;
  state_code: string;
  lien_filing_deadline: string | null;
  preliminary_notice_deadline: string | null;
  created_at: string;
}

interface ProposalRow {
  id: number;
  proposal_title: string;
  estimated_value: number | null;
  outcome: string | null;
  generated_at: string;
}

interface PulseHotspot {
  id: string; name: string; lat: number; lng: number;
  heat?: number;
  terms?: { term: string; heat: number }[];
}

// ── Module config ───────────────────────────────────────────────────────────────

type ModuleId =
  | 'overview' | 'jarvis' | 'crm' | 'digital-twin' | 'thermal'
  | 'onboarding' | 'finish-selections'
  | 'roller' | 'drone' | 'crew' | 'search-pulse' | 'legal'
  | 'dispatch' | 'proposals' | 'math-ai'
  | 'gantt' | 'catalog' | 'quickbooks' | 'saas' | 'bim' | 'jarvis-faces' | 'weather';

interface Module { id: ModuleId; label: string; icon: React.ElementType; live: boolean }

const MODULES: Module[] = [
  { id: 'overview',      label: 'Overview',      icon: LayoutDashboard, live: true  },
  { id: 'jarvis',        label: 'Jarvis AI',      icon: Zap,             live: true  },
  { id: 'crm',           label: 'CRM',            icon: Users,           live: true  },
  { id: 'digital-twin',  label: 'Digital Twin',   icon: Brain,           live: false },
  { id: 'thermal',       label: 'Thermal',        icon: Thermometer,     live: false },
  { id: 'roller',        label: 'Roller',         icon: Circle,          live: false },
  { id: 'drone',         label: 'Drone / Vision', icon: Camera,          live: false },
  { id: 'crew',          label: 'Crew Safety',    icon: HardHat,         live: false },
  { id: 'search-pulse',  label: 'Search Pulse',   icon: Search,          live: true  },
  { id: 'legal',         label: 'Legal',          icon: Scale,           live: true  },
  { id: 'dispatch',      label: 'Dispatch',       icon: Truck,           live: true  },
  { id: 'proposals',     label: 'Proposals',      icon: FileText,        live: true  },
  { id: 'math-ai',       label: 'Math AI',        icon: Cpu,             live: false },
  { id: 'gantt',         label: 'Gantt / CPM',    icon: Calendar,        live: true  },
  { id: 'catalog',       label: 'Catalog',        icon: Package,         live: true  },
  { id: 'quickbooks',    label: 'QuickBooks',     icon: BookOpen,        live: true  },
  { id: 'saas',          label: 'SaaS Admin',     icon: Building2,       live: true  },
  { id: 'bim',           label: 'BIM / Plans',    icon: Layout,          live: true  },
  { id: 'jarvis-faces',       label: 'Jarvis Faces',        icon: MessageSquare, live: true  },
  { id: 'weather',            label: 'Weather / GO',        icon: Cloud,         live: true  },
  { id: 'onboarding',         label: 'Onboard Tenant',      icon: Users,         live: true  },
  { id: 'finish-selections',  label: 'Finish Selections',   icon: CheckCircle,   live: true  },
];

// ── Demo data (genuine logic, not Math.random()) ───────────────────────────────

const CDT_DIMS = [
  { key: 'schedule_adherence', label: 'Schedule Adherence', score: 0.82, threshold: 0.85 },
  { key: 'material_quality',   label: 'Material Quality',   score: 0.91, threshold: 0.85 },
  { key: 'crew_efficiency',    label: 'Crew Efficiency',    score: 0.78, threshold: 0.80 },
  { key: 'equipment_uptime',   label: 'Equipment Uptime',   score: 0.87, threshold: 0.85 },
  { key: 'safety_score',       label: 'Safety Score',       score: 0.94, threshold: 0.85 },
  { key: 'budget_variance',    label: 'Budget Variance',    score: 0.64, threshold: 0.80 },
];

const ROLLER_GRID: number[][] = [
  [4,4,3,4,4,3,4,4],
  [4,3,4,4,3,4,4,3],
  [3,4,4,3,4,4,3,4],
  [2,3,4,4,4,3,4,4],
  [1,2,3,4,3,4,4,3],
  [0,1,2,3,4,4,3,4],
  [0,0,1,2,3,4,4,3],
  [0,0,0,1,2,3,4,4],
];

const CREW_DEMO = [
  { id: 'C1', name: 'Mike W.',  role: 'Foreman',  hr: 82,  temp: 98.4, heatIdx: 'OK',      fatigue: 'LOW'    },
  { id: 'C2', name: 'Dave L.',  role: 'Operator', hr: 95,  temp: 99.1, heatIdx: 'WATCH',   fatigue: 'LOW'    },
  { id: 'C3', name: 'Tony R.',  role: 'Laborer',  hr: 112, temp: 100.2,heatIdx: 'CAUTION', fatigue: 'MEDIUM' },
  { id: 'C4', name: 'James P.', role: 'Laborer',  hr: 88,  temp: 98.7, heatIdx: 'OK',      fatigue: 'LOW'    },
];

// Math AI — PCI scoring constants
const PCI_SITE = { name: 'Chesterfield County — Lot #7', area_sqft: 4200, pci_now: 68, age_years: 11 };
const PCI_DECAY_PER_YEAR = 4.5 * 1.15; // 1.15 = Virginia freeze-thaw climate factor
const PCI_TREATMENTS: { min: number; label: string; usd_sqft: number }[] = [
  { min: 71, label: 'Seal Coat',                usd_sqft: 0.25 },
  { min: 55, label: 'Crack Fill + Thin Overlay', usd_sqft: 1.85 },
  { min: 40, label: 'Mill & Overlay',            usd_sqft: 4.10 },
  { min:  0, label: 'Full Depth Reclamation',    usd_sqft: 7.80 },
];

// ── Utility functions ──────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}
function fmtUsd(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1,
  }).format(n);
}
function fmtUsdFull(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

/** Chadbourn cooling model: T(t) = T_air + (T_mix - T_air) * exp(-k * t) */
function coolTemp(tMix: number, tAir: number, tMinutes: number): number {
  return tAir + (tMix - tAir) * Math.exp(-THERMAL_K * tMinutes);
}

/** Minutes until mat cools to targetF */
function minsToTemp(tMix: number, tAir: number, targetF: number): number {
  if (tMix <= targetF) return 0;
  return -Math.log((targetF - tAir) / (tMix - tAir)) / THERMAL_K;
}

function pciAtYear(base: number, year: number): number {
  return Math.max(0, base - PCI_DECAY_PER_YEAR * year);
}

function treatmentForPci(pci: number) {
  return PCI_TREATMENTS.find((t) => pci >= t.min) ?? PCI_TREATMENTS[PCI_TREATMENTS.length - 1];
}

// ── Small UI primitives ────────────────────────────────────────────────────────

function DemoBadge({ batch }: { batch: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded font-medium">
      Demo · Live in {batch}
    </span>
  );
}

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-green-400">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      LIVE
    </span>
  );
}

function OSCard({ children, className = '', accent = false }: {
  children: React.ReactNode; className?: string; accent?: boolean;
}) {
  return (
    <div className={`bg-zinc-900 border rounded-2xl p-5 ${
      accent ? 'border-yellow-500/30' : 'border-zinc-800'
    } ${className}`}>
      {children}
    </div>
  );
}

function KV({ k, v, accent = false }: { k: string; v: string | number; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-zinc-500 text-xs font-medium">{k}</p>
      <p className={`text-xl font-black ${accent ? 'text-yellow-400' : 'text-white'}`}>{v}</p>
    </div>
  );
}

function SevBadge({ severity }: { severity: string }) {
  const c: Record<string, string> = {
    CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30',
    HIGH:     'bg-orange-500/20 text-orange-400 border-orange-500/30',
    MEDIUM:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    INFO:     'bg-zinc-700 text-zinc-400 border-zinc-600',
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${c[severity] ?? c.INFO}`}>
      {severity}
    </span>
  );
}

function HealthBar({ score, threshold }: { score: number; threshold: number }) {
  const state = score >= threshold ? 'OK' : score >= threshold - 0.1 ? 'DRIFT' : 'ALERT';
  const color = state === 'OK' ? 'bg-green-500' : state === 'DRIFT' ? 'bg-yellow-500' : 'bg-red-500';
  const textColor = state === 'OK' ? 'text-green-400' : state === 'DRIFT' ? 'text-yellow-400' : 'text-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.round(score * 100)}%` }} />
      </div>
      <span className={`text-xs font-bold w-12 text-right ${textColor}`}>{state}</span>
    </div>
  );
}

function PciGauge({ pci }: { pci: number }) {
  const label = pci >= 86 ? 'Excellent' : pci >= 71 ? 'Very Good' : pci >= 56 ? 'Good'
    : pci >= 41 ? 'Fair' : pci >= 26 ? 'Poor' : 'Very Poor';
  const color = pci >= 71 ? 'text-green-400' : pci >= 55 ? 'text-yellow-400' : 'text-red-400';
  const bar = pci >= 71 ? 'bg-green-500' : pci >= 55 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div>
      <div className="flex items-end gap-2 mb-1">
        <span className={`text-5xl font-black ${color}`}>{pci}</span>
        <span className={`text-sm font-semibold mb-1 ${color}`}>{label}</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full ${bar} rounded-full`} style={{ width: `${pci}%` }} />
      </div>
    </div>
  );
}

// ── Module: Overview ───────────────────────────────────────────────────────────

function OverviewModule({
  kpi, anomalies, authKey, apiBase,
}: {
  kpi: KpiData; anomalies: AnomalyResult[]; authKey: string; apiBase: string;
}) {
  const net = kpi.cashflow.net_30d;
  const anomalous = anomalies.filter((a) => a.is_anomaly);

  const [weather, setWeather] = useState<{ temp_f: number; condition: string; paving_status: string; nogo_reason: string | null } | null>(null);
  const [nextGoDay, setNextGoDay] = useState<string | null>(null);
  const [criticalTasks, setCriticalTasks] = useState<{ task_name: string; phase: string; planned_end: string; is_critical: boolean }[]>([]);
  const [jarvisInsight, setJarvisInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState(false);

  useEffect(() => {
    fetch(`${apiBase}/api/v1/weather/current`, { headers: { 'X-Master-Key': authKey } })
      .then((r) => r.ok ? r.json() : null).then((d) => d && setWeather(d)).catch(() => {});
    fetch(`${apiBase}/api/v1/weather/forecast?days=7`, { headers: { 'X-Master-Key': authKey } })
      .then((r) => r.ok ? r.json() : null).then((d) => d && setNextGoDay(d.next_go_day ?? null)).catch(() => {});
    fetch(`${apiBase}/api/v1/gantt/tasks?project_name=Chesterfield`, { headers: { 'X-Master-Key': authKey } })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setCriticalTasks((d.tasks ?? []).filter((t: { is_critical: boolean }) => t.is_critical).slice(0, 3)))
      .catch(() => {});
  }, [authKey, apiBase]);

  const fetchJarvisInsight = async () => {
    setLoadingInsight(true);
    const anomSummary = anomalous.length === 0
      ? 'No anomalies detected.'
      : anomalous.map((a) => `${a.metric_name}: ${a.message} (z=${a.z_score.toFixed(1)})`).join('; ');
    const weatherSummary = weather
      ? `Current: ${weather.temp_f}°F, ${weather.condition}, paving ${weather.paving_status}. Next GO: ${nextGoDay ?? 'unknown'}.`
      : '';
    const kpiSummary = `Leads: ${kpi.pipeline.total_leads}, Win rate: ${kpi.proposals.win_rate_pct}%, Active jobs: ${kpi.jobs.active}, Net 30d: $${net.toLocaleString()}`;
    try {
      const r = await fetch(`${apiBase}/api/v1/jarvis-modes/chat`, {
        method: 'POST',
        headers: { 'X-Master-Key': authKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'operator',
          messages: [{ role: 'user', content: `Based on this data, give me 2-3 specific action items for today:\n\nAnomalies: ${anomSummary}\nWeather: ${weatherSummary}\nKPIs: ${kpiSummary}\n\nBe direct, specific, and concise.` }],
        }),
      });
      const d = r.ok ? await r.json() : null;
      setJarvisInsight(d?.reply ?? 'Jarvis unavailable.');
    } catch {
      setJarvisInsight('Jarvis unavailable — check API keys.');
    } finally {
      setLoadingInsight(false);
    }
  };

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Fused intelligence bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <OSCard accent={weather?.paving_status === 'GO'}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-500 text-xs mb-0.5">Paving Status</p>
              {weather ? (
                <>
                  <p className={`text-2xl font-black ${weather.paving_status === 'GO' ? 'text-green-400' : 'text-red-400'}`}>
                    {weather.paving_status}
                  </p>
                  <p className="text-zinc-400 text-xs mt-0.5">{weather.temp_f}°F · {weather.condition}</p>
                  {nextGoDay && <p className="text-zinc-500 text-xs">Next GO: {fmtDate(nextGoDay)}</p>}
                </>
              ) : <p className="text-zinc-600 text-sm">Loading…</p>}
            </div>
            <Cloud size={24} className={weather?.paving_status === 'GO' ? 'text-green-400' : 'text-zinc-600'} />
          </div>
        </OSCard>

        <OSCard>
          <p className="text-zinc-500 text-xs mb-2">Critical Path</p>
          {criticalTasks.length === 0 ? (
            <p className="text-zinc-600 text-xs">No active critical tasks</p>
          ) : (
            <div className="space-y-1.5">
              {criticalTasks.map((t, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1 shrink-0" />
                  <div>
                    <p className="text-white font-semibold leading-tight">{t.task_name}</p>
                    <p className="text-zinc-500">{t.phase} · ends {fmtDate(t.planned_end)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </OSCard>

        <OSCard accent={anomalous.length > 0}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-zinc-500 text-xs">Anomalies</p>
            <AlertTriangle size={14} className={anomalous.length > 0 ? 'text-yellow-400' : 'text-zinc-600'} />
          </div>
          {anomalous.length === 0 ? (
            <p className="text-green-400 font-bold">All clear</p>
          ) : (
            <div className="space-y-1">
              {anomalous.slice(0, 3).map((a) => (
                <div key={a.metric_name} className="flex items-center gap-1.5 text-xs">
                  <SevBadge severity={a.severity} />
                  <span className="text-zinc-400 truncate">{a.metric_name.replace(/_/g, ' ')}</span>
                </div>
              ))}
              {anomalous.length > 3 && <p className="text-zinc-600 text-xs">+{anomalous.length - 3} more</p>}
            </div>
          )}
        </OSCard>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <OSCard accent><KV k="Total Leads" v={fmt(kpi.pipeline.total_leads)} accent /></OSCard>
        <OSCard><KV k="Won YTD" v={kpi.pipeline.won_ytd} /></OSCard>
        <OSCard><KV k="Active Jobs" v={kpi.jobs.active} /></OSCard>
        <OSCard accent><KV k="Win Rate" v={`${kpi.proposals.win_rate_pct}%`} accent /></OSCard>
        <OSCard><KV k="VDOT Open Bids" v={kpi.market.vdot_open_bids} /></OSCard>
        <OSCard><KV k="Active Crew" v={kpi.workforce.active_crew} /></OSCard>
        <OSCard><KV k="Proposals Sent" v={kpi.proposals.total} /></OSCard>
        <OSCard>
          <p className="text-zinc-500 text-xs mb-1">Net 30d Cash</p>
          <p className={`text-xl font-black ${net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {fmtUsd(net)}
          </p>
        </OSCard>
      </div>

      {/* Jarvis Operator Intelligence */}
      <OSCard>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain size={14} className="text-yellow-400" />
            <p className="text-white font-bold text-sm">Jarvis Operator Intelligence</p>
          </div>
          <button onClick={fetchJarvisInsight} disabled={loadingInsight}
            className="flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-lg transition-colors disabled:opacity-50">
            {loadingInsight ? <RefreshCw size={11} className="animate-spin" /> : <Zap size={11} />}
            {loadingInsight ? 'Thinking…' : 'Get Insights'}
          </button>
        </div>
        {jarvisInsight ? (
          <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">{jarvisInsight}</p>
        ) : (
          <p className="text-zinc-600 text-sm">Click "Get Insights" to run a proactive Jarvis operator analysis fusing anomaly data, weather, and KPIs.</p>
        )}
      </OSCard>

      {/* Detailed anomaly list */}
      {anomalous.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-yellow-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Anomaly Detail</h3>
          </div>
          <div className="space-y-2">
            {anomalous.map((a) => (
              <OSCard key={a.metric_name} accent className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <SevBadge severity={a.severity} />
                    <span className="text-white text-sm font-semibold">{a.metric_name.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="text-zinc-400 text-xs">{a.message}</p>
                </div>
                <span className="text-zinc-500 font-mono text-xs shrink-0">z={a.z_score.toFixed(2)}</span>
              </OSCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Module: Jarvis ─────────────────────────────────────────────────────────────

function JarvisModule() {
  return (
    <div className="h-full">
      <JarvisChat />
    </div>
  );
}

// ── Module: CRM ────────────────────────────────────────────────────────────────

function CrmModule({ authKey, apiBase, kpi }: { authKey: string; apiBase: string; kpi: KpiData }) {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiBase}/api/v1/leads/?limit=50`, { headers: { 'X-Master-Key': authKey } })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setLeads(Array.isArray(d) ? d : (d.leads ?? [])))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authKey, apiBase]);

  const scoreColor = (s: string | null) =>
    s === 'HOT' ? 'text-red-400 font-bold' : s === 'WARM' ? 'text-yellow-400' : 'text-zinc-500';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <OSCard><KV k="Total Leads" v={fmt(kpi.pipeline.total_leads)} /></OSCard>
        <OSCard><KV k="New MTD" v={kpi.pipeline.new_leads_mtd} /></OSCard>
        <OSCard accent><KV k="Win Rate" v={`${kpi.proposals.win_rate_pct}%`} accent /></OSCard>
        <OSCard><KV k="Won YTD" v={kpi.pipeline.won_ytd} /></OSCard>
      </div>
      {loading ? (
        <div className="text-zinc-500 text-sm py-6 text-center">Loading leads…</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60">
                {['Name', 'Location', 'Service', 'Value', 'Score', 'Status', 'Date'].map((h) => (
                  <th key={h} className="text-left text-zinc-500 text-xs font-semibold px-3 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.slice(0, 30).map((l) => (
                <tr key={l.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/40 transition-colors">
                  <td className="px-3 py-2.5 text-white font-medium">{l.name}</td>
                  <td className="px-3 py-2.5 text-zinc-400 text-xs">{[l.city, l.state].filter(Boolean).join(', ') || '—'}</td>
                  <td className="px-3 py-2.5 text-zinc-300 text-xs">{l.service ?? '—'}</td>
                  <td className="px-3 py-2.5 text-zinc-300 text-xs">{l.estimated_value != null ? fmtUsdFull(l.estimated_value) : '—'}</td>
                  <td className={`px-3 py-2.5 text-xs ${scoreColor(l.score_label)}`}>{l.score_label ?? '—'}</td>
                  <td className="px-3 py-2.5">
                    <span className="text-xs bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">{l.status}</span>
                  </td>
                  <td className="px-3 py-2.5 text-zinc-600 text-xs">{new Date(l.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {leads.length === 0 && !loading && (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-zinc-600 text-sm">No leads found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Module: Digital Twin ───────────────────────────────────────────────────────

function DigitalTwinModule({ kpi }: { kpi: KpiData }) {
  // Blend real KPI data into CDT dimensions where possible
  const dims = CDT_DIMS.map((d) => {
    let score = d.score;
    if (d.key === 'safety_score') {
      score = kpi.safety.incidents_ytd === 0 ? 0.97 : Math.max(0.5, 1 - kpi.safety.incidents_ytd * 0.06);
    }
    if (d.key === 'schedule_adherence') {
      const total = kpi.work_orders.completed_mtd + kpi.work_orders.pending;
      score = total > 0 ? Math.min(1, kpi.work_orders.completed_mtd / total) : d.score;
    }
    return { ...d, score };
  });
  const overall = dims.reduce((s, d) => s + d.score, 0) / dims.length;
  const overallLabel = overall >= 0.90 ? 'NOMINAL' : overall >= 0.80 ? 'GOOD' : overall >= 0.70 ? 'CAUTION' : 'ALERT';
  const overallColor = overall >= 0.90 ? 'text-green-400' : overall >= 0.80 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-zinc-500 text-xs mb-1">Cognitive Digital Twin — Overall Health</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-black ${overallColor}`}>{Math.round(overall * 100)}%</span>
            <span className={`font-bold ${overallColor}`}>{overallLabel}</span>
          </div>
        </div>
        <DemoBadge batch="Batch 4" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {dims.map((d) => {
          const state = d.score >= d.threshold ? 'OK' : d.score >= d.threshold - 0.1 ? 'DRIFT' : 'ALERT';
          const stateColor = state === 'OK' ? 'text-green-400' : state === 'DRIFT' ? 'text-yellow-400' : 'text-red-400';
          return (
            <OSCard key={d.key} accent={state !== 'OK'}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-white text-sm font-semibold">{d.label}</p>
                <span className={`text-xs font-bold ${stateColor}`}>{state}</span>
              </div>
              <p className="text-2xl font-black text-white mb-2">{Math.round(d.score * 100)}%</p>
              <HealthBar score={d.score} threshold={d.threshold} />
              <p className="text-zinc-600 text-xs mt-2">threshold ≥ {Math.round(d.threshold * 100)}%</p>
            </OSCard>
          );
        })}
      </div>

      <OSCard>
        <p className="text-zinc-500 text-xs">
          CDT monitors 6 dimensions in real time via roller telemetry, crew wearables, and project data feeds.
          Live sensor integration arrives in Batch 4. Current values blend KPI data with calibrated demo state.
        </p>
      </OSCard>
    </div>
  );
}

// ── Module: Thermal ────────────────────────────────────────────────────────────

function ThermalModule() {
  const AMBIENT_F = 67;   // demo ambient temperature
  const MIX_F     = 290;  // mat temperature at delivery
  const tBreakdown = minsToTemp(MIX_F, AMBIENT_F, BREAKDOWN_CEIL_F); // already above 225 = 0
  const tCompactionEnd = minsToTemp(MIX_F, AMBIENT_F, COMPACTION_MIN_F);
  const goNogo = AMBIENT_F >= PAVING_MIN_TEMP_F;

  const curve = [0, 5, 10, 15, 20, 25, 30].map((t) => ({
    min: t,
    temp: Math.round(coolTemp(MIX_F, AMBIENT_F, t)),
  }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-black">Asphalt Lay-Down Thermal Window</h3>
        <DemoBadge batch="Batch 4" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <OSCard>
          <p className="text-zinc-500 text-xs mb-1">Ambient Temp</p>
          <p className="text-2xl font-black text-white">{AMBIENT_F}°F</p>
          <p className="text-zinc-500 text-xs mt-1">{goNogo ? 'Above paving floor' : 'BELOW MIN — NO GO'}</p>
        </OSCard>
        <OSCard>
          <p className="text-zinc-500 text-xs mb-1">Mix Temp</p>
          <p className="text-2xl font-black text-white">{MIX_F}°F</p>
          <p className="text-zinc-500 text-xs mt-1">at delivery</p>
        </OSCard>
        <OSCard>
          <p className="text-zinc-500 text-xs mb-1">Compaction Window</p>
          <p className="text-2xl font-black text-yellow-400">~{Math.round(tCompactionEnd)} min</p>
          <p className="text-zinc-500 text-xs mt-1">from placement</p>
        </OSCard>
        <OSCard accent={goNogo}>
          <p className="text-zinc-500 text-xs mb-1">Paving Status</p>
          <p className={`text-2xl font-black ${goNogo ? 'text-green-400' : 'text-red-400'}`}>
            {goNogo ? 'GO' : 'NO-GO'}
          </p>
          <p className="text-zinc-500 text-xs mt-1">{goNogo ? `> ${PAVING_MIN_TEMP_F}°F floor` : `< ${PAVING_MIN_TEMP_F}°F min`}</p>
        </OSCard>
      </div>

      <OSCard>
        <p className="text-zinc-500 text-xs font-semibold uppercase mb-3">Cooling Curve (Chadbourn Model, 2″ HMA)</p>
        <div className="flex items-end gap-1 h-24">
          {curve.map(({ min, temp }) => {
            const pct = Math.max(0, ((temp - AMBIENT_F) / (MIX_F - AMBIENT_F)) * 100);
            const color = temp >= BREAKDOWN_CEIL_F ? 'bg-red-500'
              : temp >= COMPACTION_MIN_F ? 'bg-yellow-500' : 'bg-zinc-700';
            return (
              <div key={min} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end" style={{ height: '72px' }}>
                  <div className={`w-full rounded-t ${color}`} style={{ height: `${Math.round(pct)}%` }} />
                </div>
                <p className="text-zinc-600 text-xs">{min}m</p>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded" /> breakdown zone ({BREAKDOWN_CEIL_F}°F+)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-500 rounded" /> compaction zone ({COMPACTION_MIN_F}–{BREAKDOWN_CEIL_F}°F)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-zinc-700 rounded" /> too cold</span>
        </div>
      </OSCard>

      <OSCard>
        <p className="text-zinc-500 text-xs">
          Live NOAA weather integration + per-project calibration arrive in Batch 4. Formula: T(t) = T_air + (T_mix − T_air) × e^(−{THERMAL_K}t). Compaction floor: {COMPACTION_MIN_F}°F, matching {WORDEN_COMPACTION_FLOOR_PCT}% Marshall target.
        </p>
      </OSCard>
    </div>
  );
}

// ── Module: Roller ─────────────────────────────────────────────────────────────

function RollerModule() {
  const passColor = (n: number) =>
    n >= 4 ? 'bg-green-500' : n === 3 ? 'bg-yellow-500' : n >= 1 ? 'bg-orange-600' : 'bg-zinc-800';
  const totalCells = ROLLER_GRID.flat().length;
  const compacted = ROLLER_GRID.flat().filter((n) => n >= 3).length;
  const pct = Math.round((compacted / totalCells) * 100);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-black">Roller Telemetry — Compaction GPS</h3>
        <DemoBadge batch="Batch 4" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <OSCard><KV k="Coverage" v={`${pct}%`} /></OSCard>
        <OSCard accent={pct >= 90}><KV k="Zones ≥ 3 Passes" v={`${compacted}/${totalCells}`} accent={pct >= 90} /></OSCard>
        <OSCard><KV k="IRI Proxy" v="42 in/mi" /></OSCard>
        <OSCard><KV k="Roller Speed" v="2.8 mph" /></OSCard>
      </div>

      <OSCard>
        <p className="text-zinc-500 text-xs font-semibold uppercase mb-3">Pass Density Grid (8×8 zones)</p>
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(8, minmax(0,1fr))' }}>
          {ROLLER_GRID.flat().map((n, i) => (
            <div key={i} className={`aspect-square rounded ${passColor(n)} flex items-center justify-center`}>
              <span className="text-xs font-bold text-black/60">{n}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded" /> 4 passes</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-500 rounded" /> 3 passes</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-orange-600 rounded" /> 1–2 passes</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-zinc-800 border border-zinc-700 rounded" /> 0 passes</span>
        </div>
      </OSCard>
    </div>
  );
}

// ── Module: Drone / Vision ─────────────────────────────────────────────────────

function DroneModule() {
  const area = 4247;
  const confidence = 94.2;
  const perSqft = 3.85;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-black">Drone Capture + AI Vision Takeoff</h3>
        <DemoBadge batch="Batch 4" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <OSCard accent><KV k="Area (sqft)" v={area.toLocaleString()} accent /></OSCard>
        <OSCard><KV k="Confidence" v={`${confidence}%`} /></OSCard>
        <OSCard><KV k="Suggested Service" v="Commercial Reseal" /></OSCard>
        <OSCard><KV k="Estimate" v={fmtUsdFull(area * perSqft)} /></OSCard>
      </div>

      <OSCard>
        <p className="text-zinc-500 text-xs font-semibold uppercase mb-3">Aerial View (placeholder)</p>
        <div className="w-full h-48 bg-zinc-800 rounded-xl flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-4 border-2 border-yellow-400/60 rounded-lg" />
          <div className="absolute top-6 left-6 w-2 h-2 bg-yellow-400 rounded-full" />
          <div className="absolute top-6 right-6 w-2 h-2 bg-yellow-400 rounded-full" />
          <div className="absolute bottom-6 left-6 w-2 h-2 bg-yellow-400 rounded-full" />
          <div className="absolute bottom-6 right-6 w-2 h-2 bg-yellow-400 rounded-full" />
          <div className="text-center">
            <Camera size={24} className="text-zinc-600 mx-auto mb-2" />
            <p className="text-zinc-600 text-sm">Aerial imagery via drone or Google Solar API</p>
            <p className="text-zinc-700 text-xs mt-1">OpenCV boundary detection · {confidence}% confidence</p>
          </div>
        </div>
      </OSCard>

      <OSCard>
        <p className="text-zinc-500 text-xs">
          Live integration: upload drone photo → OpenCV contour detection → sqft measurement + price estimate.
          Google Solar API integration provides aerial backdrop. Batch 4.
        </p>
      </OSCard>
    </div>
  );
}

// ── Module: Crew Safety ────────────────────────────────────────────────────────

function CrewModule() {
  const heatColor = (h: string) =>
    h === 'OK' ? 'text-green-400' : h === 'WATCH' ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-black">Crew Safety — Wearable Biometrics</h3>
        <DemoBadge batch="Batch 6" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CREW_DEMO.map((c) => (
          <OSCard key={c.id} accent={c.heatIdx !== 'OK'}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-white font-bold">{c.name}</p>
                <p className="text-zinc-500 text-xs">{c.role}</p>
              </div>
              <span className={`text-sm font-bold ${heatColor(c.heatIdx)}`}>{c.heatIdx}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-zinc-600">Heart Rate</p>
                <p className={`font-bold ${c.hr > 100 ? 'text-orange-400' : 'text-white'}`}>{c.hr} bpm</p>
              </div>
              <div>
                <p className="text-zinc-600">Core Temp</p>
                <p className={`font-bold ${c.temp > 100 ? 'text-red-400' : 'text-white'}`}>{c.temp}°F</p>
              </div>
              <div>
                <p className="text-zinc-600">Fatigue</p>
                <p className={`font-bold ${c.fatigue === 'LOW' ? 'text-green-400' : 'text-yellow-400'}`}>{c.fatigue}</p>
              </div>
            </div>
          </OSCard>
        ))}
      </div>

      <OSCard>
        <p className="text-zinc-500 text-xs">
          Multi-provider biometric ingest (HMAC-verified webhook) from Garmin, Apple Watch, and industrial
          wearables. NIOSH heat stress index computed per-worker. Alerts trigger Vapi call to foreman on CAUTION+. Batch 6.
        </p>
      </OSCard>
    </div>
  );
}

// ── Module: Search Pulse ───────────────────────────────────────────────────────

function SearchPulseModule({ authKey, apiBase }: { authKey: string; apiBase: string }) {
  const [data, setData] = useState<{ ok: boolean; reason?: string; hotspots: PulseHotspot[]; terms: string[]; ts: number; cached?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback((force = false) => {
    const url = `${apiBase}/api/v1/seo/${force ? 'search-pulse/refresh' : 'search-pulse'}`;
    const method = force ? 'POST' : 'GET';
    if (force) setRefreshing(true); else setLoading(true);
    fetch(url, { method, headers: { 'X-Master-Key': authKey } })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, [authKey, apiBase]);

  useEffect(() => { load(false); }, [load]);

  const heatColor = (h: number) => h >= 0.7 ? 'bg-red-500' : h >= 0.4 ? 'bg-yellow-500' : h >= 0.2 ? 'bg-green-500' : 'bg-zinc-700';

  if (loading) return <div className="text-zinc-500 text-sm py-12 text-center">Fetching SERP data…</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-black">Search Pulse — VA Market SERP Heat Map</h3>
          {data?.ts && <p className="text-zinc-500 text-xs mt-0.5">{data.cached ? 'Cached · ' : ''}Updated {new Date(data.ts * 1000).toLocaleTimeString()}</p>}
        </div>
        <div className="flex items-center gap-3">
          {data?.ok ? <LiveBadge /> : null}
          <button onClick={() => load(true)} disabled={refreshing}
            className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 disabled:opacity-40">
            <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {!data?.ok && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-yellow-300 text-sm">
          Demo mode — {data?.reason ?? 'No live data.'}
          {' '}Set <code className="bg-yellow-500/20 px-1 rounded">SERPAPI_KEY</code> for live scores.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(data?.hotspots ?? []).map((hs) => {
          const heat = hs.heat ?? 0;
          return (
            <OSCard key={hs.id}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm font-bold">{hs.name}</span>
                {heat > 0 && <span className="text-zinc-500 font-mono text-xs">{(heat * 100).toFixed(0)}%</span>}
              </div>
              {heat > 0 ? (
                <div className="h-1.5 bg-zinc-800 rounded-full">
                  <div className={`h-full rounded-full ${heatColor(heat)}`} style={{ width: `${Math.round(heat * 100)}%` }} />
                </div>
              ) : (
                <p className="text-zinc-700 text-xs">No live data</p>
              )}
            </OSCard>
          );
        })}
      </div>
    </div>
  );
}

// ── Module: Legal / Lien ───────────────────────────────────────────────────────

function LegalModule({ authKey, apiBase }: { authKey: string; apiBase: string }) {
  const [entries, setEntries] = useState<LienEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiBase}/api/v1/lien-calendar/`, { headers: { 'X-Master-Key': authKey } })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setEntries(Array.isArray(d) ? d : (d.entries ?? [])))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [authKey, apiBase]);

  const daysUntil = (iso: string | null) => {
    if (!iso) return null;
    const diff = new Date(iso).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-black">Lien Calendar &amp; Legal Compliance</h3>
        <LiveBadge />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-2">
        {[
          ['Class A License', 'Virginia DPOR'],
          ['Bond', '$2M liability'],
          ['BBB Rating', 'A+ since 1994'],
        ].map(([k, v]) => (
          <OSCard key={k}><KV k={k} v={v} /></OSCard>
        ))}
      </div>

      {loading ? (
        <div className="text-zinc-500 text-sm py-6 text-center">Loading lien calendar…</div>
      ) : entries.length === 0 ? (
        <OSCard>
          <p className="text-zinc-500 text-sm text-center py-4">No lien calendar entries. Add projects via the lien calendar API.</p>
        </OSCard>
      ) : (
        <div className="space-y-2">
          {entries.slice(0, 15).map((e) => {
            const days = daysUntil(e.lien_filing_deadline);
            const urgent = days !== null && days <= 30;
            return (
              <OSCard key={e.id} accent={urgent}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold">{e.customer_name}</p>
                    <p className="text-zinc-500 text-xs">{e.project_address}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {days !== null ? (
                      <span className={`text-xs font-bold ${urgent ? 'text-red-400' : 'text-zinc-400'}`}>
                        {days > 0 ? `${days}d remaining` : 'EXPIRED'}
                      </span>
                    ) : <span className="text-zinc-600 text-xs">No deadline</span>}
                    <p className="text-zinc-600 text-xs">{e.state_code}</p>
                  </div>
                </div>
              </OSCard>
            );
          })}
        </div>
      )}

      <OSCard>
        <p className="text-zinc-500 text-xs font-semibold mb-2 uppercase">51-State Compliance Overview</p>
        <p className="text-zinc-600 text-xs">
          SupremeCourtAI engine (Batch 5) provides per-state lien law deadlines, bond thresholds, prevailing wage
          tiers, and contractor licensing for all 50 states + DC.
        </p>
      </OSCard>
    </div>
  );
}

// ── Module: Dispatch ───────────────────────────────────────────────────────────

function DispatchModule({ authKey, apiBase, kpi }: { authKey: string; apiBase: string; kpi: KpiData }) {
  const [jobs, setJobs] = useState<Array<{ id: string; trade: string; city: string | null; bid: number; status: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiBase}/api/v1/jobs/?limit=25`, { headers: { 'X-Master-Key': authKey } })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setJobs(Array.isArray(d) ? d : (d.jobs ?? [])))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [authKey, apiBase]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-black">Dispatch &amp; Field Operations</h3>
        <LiveBadge />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <OSCard accent><KV k="Active Jobs" v={kpi.jobs.active} accent /></OSCard>
        <OSCard><KV k="Total Jobs" v={kpi.jobs.total} /></OSCard>
        <OSCard><KV k="WOs Pending" v={kpi.work_orders.pending} /></OSCard>
        <OSCard><KV k="WOs In Progress" v={kpi.work_orders.in_progress} /></OSCard>
      </div>

      {loading ? (
        <div className="text-zinc-500 text-sm py-6 text-center">Loading jobs…</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60">
                {['Trade', 'City', 'Bid', 'Status'].map((h) => (
                  <th key={h} className="text-left text-zinc-500 text-xs font-semibold px-3 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.slice(0, 20).map((j) => (
                <tr key={j.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/40 transition-colors">
                  <td className="px-3 py-2.5 text-white text-sm">{j.trade}</td>
                  <td className="px-3 py-2.5 text-zinc-400 text-xs">{j.city ?? '—'}</td>
                  <td className="px-3 py-2.5 text-zinc-300 text-xs">{fmtUsdFull(j.bid)}</td>
                  <td className="px-3 py-2.5">
                    <span className="text-xs bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">{j.status}</span>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && !loading && (
                <tr><td colSpan={4} className="px-3 py-8 text-center text-zinc-600 text-sm">No jobs found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Module: Proposals / Approval Gate ─────────────────────────────────────────

function ProposalsModule({ authKey, apiBase, kpi }: { authKey: string; apiBase: string; kpi: KpiData }) {
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState<Record<number, 'approved' | 'held' | 'rejected'>>({});

  useEffect(() => {
    fetch(`${apiBase}/api/v1/proposals/outcomes/?limit=20`, { headers: { 'X-Master-Key': authKey } })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setProposals(Array.isArray(d) ? d : (d.proposals ?? d.outcomes ?? [])))
      .catch(() => setProposals([]))
      .finally(() => setLoading(false));
  }, [authKey, apiBase]);

  return (
    <div className="space-y-5">
      <h3 className="text-white font-black">Proposals &amp; Human-in-the-Loop Approval Gate</h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <OSCard><KV k="Total Proposals" v={kpi.proposals.total} /></OSCard>
        <OSCard accent><KV k="Won" v={kpi.proposals.won} accent /></OSCard>
        <OSCard><KV k="Win Rate" v={`${kpi.proposals.win_rate_pct}%`} /></OSCard>
      </div>

      {/* Demo approval gate — Batch 5 will wire real estimate_approval.py */}
      <OSCard accent>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded font-bold">
                PENDING REVIEW
              </span>
              <DemoBadge batch="Batch 5" />
            </div>
            <p className="text-white font-bold">Chesterfield County — Parking Lot Reseal</p>
            <p className="text-zinc-400 text-sm">4,200 sqft · AI Estimate: $16,170</p>
          </div>
          <p className="text-yellow-400 font-black text-xl shrink-0">{fmtUsdFull(16170)}</p>
        </div>
        <p className="text-zinc-500 text-xs mb-3">
          AI recommendation: <span className="text-green-400 font-semibold">APPROVE</span> · Margin: 41.2% · Lead score: HOT · Win probability: 78%
        </p>
        <div className="flex gap-2">
          {(['approved', 'held', 'rejected'] as const).map((action) => {
            const labels = { approved: 'Approve', held: 'Hold', rejected: 'Reject' };
            const colors = {
              approved: 'bg-green-600 hover:bg-green-500 text-white',
              held: 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200',
              rejected: 'bg-red-900/60 hover:bg-red-800/60 text-red-300',
            };
            const current = approvals[-1];
            return (
              <button
                key={action}
                onClick={() => setApprovals((p) => ({ ...p, [-1]: action }))}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${colors[action]} ${
                  current === action ? 'ring-2 ring-yellow-400' : ''
                }`}
              >
                {current === action ? '✓ ' : ''}{labels[action]}
              </button>
            );
          })}
        </div>
        {approvals[-1] && (
          <p className="text-xs text-zinc-400 mt-2">
            Decision recorded: <strong className="text-white">{approvals[-1].toUpperCase()}</strong>.
            Full gate with audit trail + Vapi notification wires in Batch 5.
          </p>
        )}
      </OSCard>

      {loading ? (
        <div className="text-zinc-500 text-sm py-6 text-center">Loading proposals…</div>
      ) : proposals.length > 0 ? (
        <div className="space-y-2">
          {proposals.map((p) => (
            <OSCard key={p.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-semibold">{p.proposal_title}</p>
                  <p className="text-zinc-500 text-xs">{new Date(p.generated_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  {p.estimated_value && <p className="text-zinc-300 text-sm">{fmtUsdFull(p.estimated_value)}</p>}
                  {p.outcome && <span className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">{p.outcome}</span>}
                </div>
              </div>
            </OSCard>
          ))}
        </div>
      ) : (
        <OSCard>
          <p className="text-zinc-500 text-sm text-center py-4">No proposals found.</p>
        </OSCard>
      )}
    </div>
  );
}

// ── Module: Math AI ────────────────────────────────────────────────────────────

function MathAiModule() {
  const { pci_now, area_sqft, name } = PCI_SITE;
  const currentTx = treatmentForPci(pci_now);
  const costNow = area_sqft * currentTx.usd_sqft;

  // Deterioration forecast — 5-year horizon
  const forecast = [0, 1, 2, 3, 4, 5].map((year) => {
    const pci = pciAtYear(pci_now, year);
    const tx  = treatmentForPci(pci);
    return { year, pci: Math.round(pci), tx: tx.label, cost: Math.round(area_sqft * tx.usd_sqft) };
  });

  const year3Cost = forecast[3].cost;
  const savings = year3Cost - costNow;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-black">Math AI — PCI Scoring &amp; Maintenance Forecast</h3>
        <DemoBadge batch="Batch 4" />
      </div>

      <OSCard accent>
        <p className="text-zinc-500 text-xs mb-2">{name}</p>
        <PciGauge pci={pci_now} />
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-zinc-800">
          <div><p className="text-zinc-500 text-xs mb-1">Area</p><p className="text-white font-bold">{area_sqft.toLocaleString()} sqft</p></div>
          <div><p className="text-zinc-500 text-xs mb-1">Pavement Age</p><p className="text-white font-bold">{PCI_SITE.age_years} years</p></div>
          <div><p className="text-zinc-500 text-xs mb-1">Decay Rate</p><p className="text-white font-bold">{PCI_DECAY_PER_YEAR.toFixed(1)} PCI/yr</p></div>
        </div>
      </OSCard>

      <div className="grid grid-cols-2 gap-3">
        <OSCard>
          <p className="text-zinc-500 text-xs mb-1">Recommended Treatment</p>
          <p className="text-white font-black text-lg">{currentTx.label}</p>
          <p className="text-yellow-400 font-black text-2xl mt-1">{fmtUsdFull(costNow)}</p>
          <p className="text-zinc-500 text-xs mt-1">${currentTx.usd_sqft.toFixed(2)}/sqft</p>
        </OSCard>
        <OSCard accent>
          <p className="text-zinc-500 text-xs mb-1">3-Year Delay Cost</p>
          <p className="text-white font-black text-lg">{forecast[3].tx}</p>
          <p className="text-red-400 font-black text-2xl mt-1">{fmtUsdFull(year3Cost)}</p>
          <p className="text-zinc-500 text-xs mt-1">Treat now → save {fmtUsdFull(savings)}</p>
        </OSCard>
      </div>

      <OSCard>
        <p className="text-zinc-500 text-xs font-semibold uppercase mb-3">5-Year Deterioration Forecast</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Year', 'PCI', 'Recommended Treatment', 'Cost'].map((h) => (
                  <th key={h} className="text-left text-zinc-500 text-xs font-semibold pb-2 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {forecast.map((f) => (
                <tr key={f.year} className={`border-b border-zinc-800/50 ${f.year === 0 ? 'bg-yellow-500/5' : ''}`}>
                  <td className="py-2 pr-4 text-zinc-400 text-xs">{f.year === 0 ? 'Now' : `Year ${f.year}`}</td>
                  <td className="py-2 pr-4">
                    <PciGauge pci={f.pci} />
                  </td>
                  <td className="py-2 pr-4 text-zinc-300 text-xs">{f.tx}</td>
                  <td className="py-2 pr-4 text-white font-semibold text-xs">{fmtUsdFull(f.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </OSCard>

      <OSCard>
        <p className="text-zinc-500 text-xs font-semibold mb-2 uppercase">GBM Lead Prediction</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white text-sm font-bold">Downtown Richmond — Commercial Lot</p>
            <p className="text-zinc-400 text-xs">$42,000 · 3 email opens · HOT score</p>
          </div>
          <div className="text-right">
            <p className="text-green-400 font-black text-xl">78%</p>
            <p className="text-zinc-500 text-xs">close in 14d</p>
          </div>
        </div>
        <p className="text-zinc-600 text-xs mt-2">
          GBM features: property type (commercial), estimated value, lead score, email engagement, days in pipeline.
          Full SciPy CI intervals in Batch 4.
        </p>
      </OSCard>
    </div>
  );
}

// ── Module: Gantt / Critical Path ─────────────────────────────────────────────

interface GanttTaskRow {
  id: number;
  project_name: string;
  task_name: string;
  phase: string | null;
  planned_start: string;
  planned_end: string;
  pct_complete: number;
  is_critical: boolean;
  weather_hold: boolean;
}

function GanttModule({ authKey, apiBase }: { authKey: string; apiBase: string }) {
  const [tasks, setTasks] = useState<GanttTaskRow[]>([]);
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string>('');

  const loadDemo = useCallback(() => {
    setLoading(true);
    fetch(`${apiBase}/api/v1/gantt/demo`, { headers: { 'X-Master-Key': authKey } })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => { setTasks(d.tasks ?? []); setProjectName(d.project_name ?? ''); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authKey, apiBase]);

  useEffect(() => { loadDemo(); }, [loadDemo]);

  const syncWeather = async () => {
    if (!projectName) return;
    setSyncing(true);
    setSyncResult('');
    try {
      const encoded = encodeURIComponent(projectName);
      const r = await fetch(`${apiBase}/api/v1/gantt/weather-sync?project_name=${encoded}`, {
        method: 'POST',
        headers: { 'X-Master-Key': authKey },
      });
      const d = r.ok ? await r.json() : null;
      if (d) {
        setSyncResult(d.message ?? '');
        loadDemo();
      }
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <div className="text-zinc-500 text-sm py-12 text-center">Loading Gantt…</div>;

  const starts = tasks.map((t) => new Date(t.planned_start).getTime());
  const ends   = tasks.map((t) => new Date(t.planned_end).getTime());
  const minTs  = Math.min(...starts);
  const span   = (Math.max(...ends) - minTs) || 1;
  const criticalCount = tasks.filter((t) => t.is_critical).length;
  const avgPct = tasks.length ? Math.round(tasks.reduce((s, t) => s + t.pct_complete, 0) / tasks.length) : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-black">Gantt / Critical Path</h3>
          {projectName && <p className="text-zinc-500 text-xs mt-0.5">{projectName}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={syncWeather} disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold rounded-lg transition-colors disabled:opacity-50">
            {syncing ? <RefreshCw size={11} className="animate-spin" /> : <Cloud size={11} />}
            {syncing ? 'Syncing…' : 'Sync Weather'}
          </button>
          <LiveBadge />
        </div>
      </div>

      {syncResult && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2 text-blue-400 text-xs">{syncResult}</div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <OSCard><KV k="Tasks" v={tasks.length} /></OSCard>
        <OSCard accent><KV k="Critical Tasks" v={criticalCount} accent /></OSCard>
        <OSCard><KV k="Avg Complete" v={`${avgPct}%`} /></OSCard>
        <OSCard><KV k="Weather Holds" v={tasks.filter((t) => t.weather_hold).length} /></OSCard>
      </div>

      <OSCard>
        <p className="text-zinc-500 text-xs font-semibold uppercase mb-4">Schedule View</p>
        <div className="space-y-2">
          {tasks.map((task) => {
            const s = new Date(task.planned_start).getTime();
            const e = new Date(task.planned_end).getTime();
            const left  = ((s - minTs) / span) * 100;
            const width = Math.max(2, ((e - s) / span) * 100);
            const bar   = task.is_critical ? 'bg-red-500' : task.weather_hold ? 'bg-yellow-500' : 'bg-blue-500';
            return (
              <div key={task.id} className="flex items-center gap-2">
                <div className="w-36 shrink-0 text-right">
                  <p className="text-xs text-zinc-300 truncate">{task.task_name}</p>
                  {task.phase && <p className="text-zinc-600 text-xs">{task.phase}</p>}
                </div>
                <div className="flex-1 relative h-5 bg-zinc-800 rounded overflow-hidden">
                  <div className={`absolute top-0 h-full ${bar} rounded opacity-80`}
                    style={{ left: `${left}%`, width: `${width}%` }}>
                    {task.pct_complete > 0 && (
                      <div className="absolute top-0 left-0 h-full bg-white/25 rounded"
                        style={{ width: `${task.pct_complete}%` }} />
                    )}
                  </div>
                  <span className="absolute left-1 top-0 h-full flex items-center text-xs text-white/60 font-medium">
                    {task.pct_complete}%
                  </span>
                </div>
                {task.is_critical && <span className="text-red-400 text-xs font-bold w-4">★</span>}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded" /> Critical ★</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-500 rounded" /> Weather hold</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded" /> Standard</span>
        </div>
      </OSCard>
    </div>
  );
}

// ── Module: Houzz Catalog ──────────────────────────────────────────────────────

interface CatalogItem {
  id: number;
  sku: string;
  category: string;
  name: string;
  unit: string;
  price_usd: number;
  install_labor_usd: number;
  lead_time_days: number;
  in_stock: boolean;
  seasonal_note: string | null;
}

interface CatalogProjectRow {
  id: number;
  customer_name: string;
  property_address: string | null;
  status: string;
  total_material_usd: number;
  total_labor_usd: number;
  total_usd: number;
  item_count: number;
  estimated_days_to_start: number;
}

interface SwapSuggestion {
  current_item_id: number;
  current_item_name: string;
  suggestion_id: number;
  suggestion_name: string;
  suggestion_sku: string;
  current_total_usd: number;
  suggestion_total_usd: number;
  savings_usd: number;
  pct_cheaper: number;
}

function CatalogModule({ authKey, apiBase }: { authKey: string; apiBase: string }) {
  const [tab, setTab] = useState<'browse' | 'projects' | 'swaps'>('browse');
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [projects, setProjects] = useState<CatalogProjectRow[]>([]);
  const [swaps, setSwaps] = useState<SwapSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState('all');
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjAddr, setNewProjAddr] = useState('');
  const [newProjBudget, setNewProjBudget] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [addingItem, setAddingItem] = useState<{ item: CatalogItem; qty: string; zone: string } | null>(null);

  const loadItems = useCallback(() => {
    fetch(`${apiBase}/api/v1/catalog/items`, { headers: { 'X-Master-Key': authKey } })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setItems(d.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authKey, apiBase]);

  const loadProjects = useCallback(() => {
    fetch(`${apiBase}/api/v1/catalog/projects`, { headers: { 'X-Master-Key': authKey } })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setProjects(d.projects ?? []))
      .catch(() => {});
  }, [authKey, apiBase]);

  useEffect(() => { loadItems(); loadProjects(); }, [loadItems, loadProjects]);

  const createProject = async () => {
    if (!newProjName.trim()) return;
    setCreating(true);
    try {
      const r = await fetch(`${apiBase}/api/v1/catalog/projects`, {
        method: 'POST',
        headers: { 'X-Master-Key': authKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: newProjName,
          property_address: newProjAddr || undefined,
          budget_usd: newProjBudget ? parseFloat(newProjBudget) : undefined,
        }),
      });
      if (r.ok) {
        const p = await r.json();
        setProjects((prev) => [p, ...prev]);
        setSelectedProject(p.id);
        setShowNewProject(false);
        setNewProjName(''); setNewProjAddr(''); setNewProjBudget('');
      }
    } finally { setCreating(false); }
  };

  const addItemToProject = async () => {
    if (!addingItem || !selectedProject) return;
    const qty = parseFloat(addingItem.qty) || 1;
    await fetch(`${apiBase}/api/v1/catalog/projects/${selectedProject}/selections`, {
      method: 'POST',
      headers: { 'X-Master-Key': authKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: addingItem.item.id, quantity: qty, zone_label: addingItem.zone || undefined }),
    });
    setAddingItem(null);
    loadProjects();
  };

  const loadSwaps = (projectId: number) => {
    fetch(`${apiBase}/api/v1/catalog/swap-suggestions/${projectId}`, { headers: { 'X-Master-Key': authKey } })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setSwaps(d.suggestions ?? []))
      .catch(() => {});
  };

  const cats = ['all', ...Array.from(new Set(items.map((i) => i.category)))];
  const filtered = activeCat === 'all' ? items : items.filter((i) => i.category === activeCat);
  const activeProjData = projects.find((p) => p.id === selectedProject);

  const TABS = [
    { id: 'browse' as const,   label: 'Browse Catalog' },
    { id: 'projects' as const, label: `Projects (${projects.length})` },
    { id: 'swaps' as const,    label: 'Swap Suggestions' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-black">Material Catalog + Project Builder</h3>
        <LiveBadge />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-zinc-800">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${
              tab === t.id ? 'text-yellow-400 border-yellow-400' : 'text-zinc-500 border-transparent hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Browse tab */}
      {tab === 'browse' && (
        <>
          <div className="flex gap-2 flex-wrap">
            {cats.map((cat) => (
              <button key={cat} onClick={() => setActiveCat(cat)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  activeCat === cat ? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                }`}>
                {cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          {loading ? (
            <div className="text-zinc-500 text-sm py-12 text-center">Loading catalog…</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((item) => (
                <OSCard key={item.id} accent={!item.in_stock}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold leading-tight">{item.name}</p>
                      <p className="text-zinc-600 text-xs mt-0.5">{item.sku}</p>
                    </div>
                    <span className={`ml-2 shrink-0 text-xs font-bold px-1.5 py-0.5 rounded ${
                      item.in_stock ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>{item.in_stock ? 'In Stock' : 'Out'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                    <div><p className="text-zinc-600">Material</p><p className="text-yellow-400 font-black">${item.price_usd.toFixed(2)}/{item.unit}</p></div>
                    <div><p className="text-zinc-600">Labor</p><p className="text-white font-bold">${item.install_labor_usd.toFixed(2)}/{item.unit}</p></div>
                    <div><p className="text-zinc-600">Lead Time</p><p className="text-zinc-300">{item.lead_time_days === 0 ? 'Same day' : `${item.lead_time_days}d`}</p></div>
                    <div><p className="text-zinc-600">Total/{item.unit}</p><p className="text-zinc-300 font-bold">${(item.price_usd + item.install_labor_usd).toFixed(2)}</p></div>
                  </div>
                  {item.seasonal_note && <p className="text-yellow-400/70 text-xs mt-2 italic">{item.seasonal_note}</p>}
                  {selectedProject && (
                    <button onClick={() => setAddingItem({ item, qty: '1', zone: '' })}
                      className="mt-3 w-full flex items-center justify-center gap-1 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-lg transition-colors">
                      <Plus size={11} /> Add to Project #{selectedProject}
                    </button>
                  )}
                </OSCard>
              ))}
            </div>
          )}
        </>
      )}

      {/* Projects tab */}
      {tab === 'projects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-zinc-400 text-sm">{projects.length} projects</p>
            <button onClick={() => setShowNewProject(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold rounded-xl transition-colors">
              <Plus size={12} /> New Project
            </button>
          </div>

          {showNewProject && (
            <OSCard accent>
              <p className="text-white font-bold text-sm mb-3">New Catalog Project</p>
              <div className="space-y-2">
                <input type="text" placeholder="Customer name *" value={newProjName} onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-yellow-500" />
                <input type="text" placeholder="Property address" value={newProjAddr} onChange={(e) => setNewProjAddr(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-yellow-500" />
                <input type="number" placeholder="Budget ($)" value={newProjBudget} onChange={(e) => setNewProjBudget(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-yellow-500" />
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={createProject} disabled={!newProjName || creating}
                  className="flex-1 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black text-sm font-bold rounded-xl transition-colors">
                  {creating ? 'Creating…' : 'Create Project'}
                </button>
                <button onClick={() => setShowNewProject(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm rounded-xl transition-colors">
                  Cancel
                </button>
              </div>
            </OSCard>
          )}

          {projects.length === 0 ? (
            <OSCard><p className="text-zinc-500 text-sm text-center py-4">No projects. Create one to start selecting finishes.</p></OSCard>
          ) : (
            <div className="space-y-2">
              {projects.map((p) => (
                <OSCard key={p.id} accent={selectedProject === p.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-white font-bold text-sm">{p.customer_name}</p>
                        <span className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">{p.status}</span>
                      </div>
                      {p.property_address && <p className="text-zinc-500 text-xs">{p.property_address}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="text-zinc-400">{p.item_count} items</span>
                        <span className="text-yellow-400 font-bold">{fmtUsdFull(p.total_usd)}</span>
                        {p.estimated_days_to_start > 0 && <span className="text-zinc-500">Lead: {p.estimated_days_to_start}d</span>}
                      </div>
                    </div>
                    <button onClick={() => {
                      setSelectedProject(selectedProject === p.id ? null : p.id);
                      if (selectedProject !== p.id) setTab('browse');
                    }}
                      className={`shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                        selectedProject === p.id
                          ? 'bg-yellow-500 text-black'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}>
                      {selectedProject === p.id ? '✓ Active' : 'Select'}
                    </button>
                  </div>
                </OSCard>
              ))}
            </div>
          )}

          {activeProjData && (
            <OSCard accent>
              <div className="flex items-center justify-between mb-3">
                <p className="text-yellow-400 font-black text-sm">Active: {activeProjData.customer_name}</p>
                <span className="text-yellow-400 font-black text-xl">{fmtUsdFull(activeProjData.total_usd)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div><p className="text-zinc-500">Material</p><p className="text-white font-bold">{fmtUsdFull(activeProjData.total_material_usd)}</p></div>
                <div><p className="text-zinc-500">Labor</p><p className="text-white font-bold">{fmtUsdFull(activeProjData.total_labor_usd)}</p></div>
                <div><p className="text-zinc-500">Items</p><p className="text-white font-bold">{activeProjData.item_count}</p></div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => { loadSwaps(activeProjData.id); setTab('swaps'); }}
                  className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-lg transition-colors">
                  View Swap Suggestions
                </button>
                <button onClick={() => setTab('browse')}
                  className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-lg transition-colors">
                  Add Items
                </button>
              </div>
            </OSCard>
          )}
        </div>
      )}

      {/* Swap suggestions tab */}
      {tab === 'swaps' && (
        <div className="space-y-4">
          {!selectedProject ? (
            <OSCard><p className="text-zinc-500 text-sm text-center py-4">Select a project in the Projects tab to see swap suggestions.</p></OSCard>
          ) : swaps.length === 0 ? (
            <OSCard>
              <p className="text-zinc-500 text-sm text-center py-4">
                {selectedProject
                  ? 'No cheaper alternatives found — current selections are already best-value.'
                  : 'Select a project to see swap suggestions.'}
              </p>
              <div className="text-center mt-2">
                <button onClick={() => loadSwaps(selectedProject!)}
                  className="px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-xl transition-colors">
                  Load Suggestions
                </button>
              </div>
            </OSCard>
          ) : (
            <div className="space-y-3">
              {swaps.map((s, i) => (
                <OSCard key={i} accent>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-500 text-xs mb-1">Currently selected:</p>
                      <p className="text-white font-semibold text-sm">{s.current_item_name}</p>
                      <p className="text-zinc-500 text-xs mt-2 mb-1">Suggested swap:</p>
                      <p className="text-green-400 font-semibold text-sm">{s.suggestion_name}</p>
                      <p className="text-zinc-600 text-xs">{s.suggestion_sku}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-green-400 font-black text-xl">-{fmtUsdFull(s.savings_usd)}</p>
                      <p className="text-green-400 text-xs">{s.pct_cheaper.toFixed(1)}% cheaper</p>
                    </div>
                  </div>
                </OSCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add item overlay */}
      {addingItem && (
        <div className="fixed inset-0 z-60 bg-black/60 flex items-end sm:items-center justify-center p-4" onClick={() => setAddingItem(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <p className="text-white font-bold mb-1">Add to Project</p>
            <p className="text-yellow-400 text-sm font-semibold mb-4">{addingItem.item.name}</p>
            <div className="space-y-3">
              <div>
                <p className="text-zinc-500 text-xs mb-1">Quantity ({addingItem.item.unit})</p>
                <input type="number" value={addingItem.qty}
                  onChange={(e) => setAddingItem({ ...addingItem, qty: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-yellow-500" />
              </div>
              <div>
                <p className="text-zinc-500 text-xs mb-1">Zone label (optional)</p>
                <input type="text" placeholder="e.g. Front driveway" value={addingItem.zone}
                  onChange={(e) => setAddingItem({ ...addingItem, zone: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-yellow-500" />
              </div>
              <div className="bg-zinc-800 rounded-xl p-3 text-xs">
                <div className="flex justify-between"><span className="text-zinc-500">Material</span><span className="text-white">${(addingItem.item.price_usd * (parseFloat(addingItem.qty)||1)).toFixed(2)}</span></div>
                <div className="flex justify-between mt-1"><span className="text-zinc-500">Labor</span><span className="text-white">${(addingItem.item.install_labor_usd * (parseFloat(addingItem.qty)||1)).toFixed(2)}</span></div>
                <div className="flex justify-between mt-1 font-bold"><span className="text-zinc-400">Total</span><span className="text-yellow-400">${((addingItem.item.price_usd + addingItem.item.install_labor_usd) * (parseFloat(addingItem.qty)||1)).toFixed(2)}</span></div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={addItemToProject} className="flex-1 py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-bold rounded-xl transition-colors">Add</button>
              <button onClick={() => setAddingItem(null)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm rounded-xl transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Module: QuickBooks ────────────────────────────────────────────────────────

interface QbLog {
  id: number;
  entity_type: string;
  local_id: string;
  qb_id: string | null;
  direction: string;
  status: string;
}

function QuickBooksModule({ authKey, apiBase }: { authKey: string; apiBase: string }) {
  const [qbStatus, setQbStatus] = useState<{ connected: boolean; demo_mode: boolean; total_syncs: number; synced: number; errors: number } | null>(null);
  const [log, setLog] = useState<QbLog[]>([]);
  const [syncing, setSyncing] = useState(false);

  const reload = useCallback(() => {
    Promise.all([
      fetch(`${apiBase}/api/v1/quickbooks/status`, { headers: { 'X-Master-Key': authKey } }).then((r) => r.ok ? r.json() : null),
      fetch(`${apiBase}/api/v1/quickbooks/log?limit=10`, { headers: { 'X-Master-Key': authKey } }).then((r) => r.ok ? r.json() : null),
    ]).then(([s, l]) => {
      if (s) setQbStatus(s);
      if (l) setLog(l.log ?? []);
    }).catch(() => {});
  }, [authKey, apiBase]);

  useEffect(() => { reload(); }, [reload]);

  const bulkSync = () => {
    setSyncing(true);
    fetch(`${apiBase}/api/v1/quickbooks/bulk-sync`, {
      method: 'POST',
      headers: { 'X-Master-Key': authKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(['Invoice', 'Customer', 'Payment']),
    }).then(() => reload()).catch(() => {}).finally(() => setSyncing(false));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-black">QuickBooks Online Sync</h3>
        {qbStatus?.connected ? <LiveBadge /> : <DemoBadge batch="production" />}
      </div>

      {qbStatus?.demo_mode && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-yellow-300 text-sm">
          Demo mode — set <code className="bg-yellow-500/20 px-1 rounded">QUICKBOOKS_CLIENT_ID</code> and <code className="bg-yellow-500/20 px-1 rounded">QUICKBOOKS_ACCESS_TOKEN</code> to connect.
        </div>
      )}

      {qbStatus && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <OSCard accent={qbStatus.connected}><KV k="Status" v={qbStatus.connected ? 'Connected' : 'Demo'} accent={qbStatus.connected} /></OSCard>
          <OSCard><KV k="Total Syncs" v={qbStatus.total_syncs} /></OSCard>
          <OSCard><KV k="Synced" v={qbStatus.synced} /></OSCard>
          <OSCard accent={qbStatus.errors > 0}><KV k="Errors" v={qbStatus.errors} accent={qbStatus.errors > 0} /></OSCard>
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={bulkSync} disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white text-sm font-bold rounded-xl transition-colors">
          <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Syncing…' : 'Run Bulk Sync'}
        </button>
      </div>

      {log.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60">
                {['Entity', 'Local ID', 'QB ID', 'Dir', 'Status'].map((h) => (
                  <th key={h} className="text-left text-zinc-500 text-xs font-semibold px-3 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {log.map((row) => (
                <tr key={row.id} className="border-b border-zinc-800/50">
                  <td className="px-3 py-2 text-zinc-300 text-xs">{row.entity_type}</td>
                  <td className="px-3 py-2 text-zinc-500 font-mono text-xs">{row.local_id}</td>
                  <td className="px-3 py-2 text-zinc-400 font-mono text-xs">{row.qb_id ?? '—'}</td>
                  <td className="px-3 py-2 text-zinc-500 text-xs">{row.direction}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs font-bold ${row.status === 'synced' ? 'text-green-400' : 'text-red-400'}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Module: SaaS Admin ────────────────────────────────────────────────────────

interface TenantRow {
  id: number;
  tenant_id: string;
  business_name: string;
  plan: string;
  status: string;
  monthly_price_usd: number;
}

function SaasAdminModule({ authKey, apiBase }: { authKey: string; apiBase: string }) {
  const [analytics, setAnalytics] = useState<{
    total_tenants: number;
    by_plan: Record<string, number>;
    by_status: Record<string, number>;
    mrr_usd: number;
    arr_usd: number;
    demo: boolean;
  } | null>(null);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${apiBase}/api/v1/saas/analytics`, { headers: { 'X-Master-Key': authKey } }).then((r) => r.ok ? r.json() : null),
      fetch(`${apiBase}/api/v1/saas/tenants?limit=20`, { headers: { 'X-Master-Key': authKey } }).then((r) => r.ok ? r.json() : null),
    ]).then(([a, t]) => {
      if (a) setAnalytics(a);
      if (t) setTenants(t.tenants ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [authKey, apiBase]);

  const planColor: Record<string, string> = { starter: 'text-zinc-400', pro: 'text-blue-400', enterprise: 'text-yellow-400' };
  const statusColor: Record<string, string> = { trial: 'text-yellow-400', active: 'text-green-400', past_due: 'text-red-400', cancelled: 'text-zinc-600' };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-black">SaaS Licensee Admin Console</h3>
        {analytics?.demo ? <DemoBadge batch="production" /> : <LiveBadge />}
      </div>

      {loading ? (
        <div className="text-zinc-500 text-sm py-12 text-center">Loading…</div>
      ) : analytics ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <OSCard><KV k="Tenants" v={analytics.total_tenants} /></OSCard>
            <OSCard accent><KV k="MRR" v={fmtUsdFull(analytics.mrr_usd)} accent /></OSCard>
            <OSCard><KV k="ARR" v={fmtUsd(analytics.arr_usd)} /></OSCard>
            <OSCard><KV k="Active" v={analytics.by_status.active ?? 0} /></OSCard>
          </div>

          {Object.keys(analytics.by_plan).length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(analytics.by_plan).map(([plan, count]) => (
                <OSCard key={plan}>
                  <p className={`text-lg font-black ${planColor[plan] ?? 'text-white'}`}>{count}</p>
                  <p className="text-zinc-500 text-xs capitalize">{plan} plan</p>
                </OSCard>
              ))}
            </div>
          )}

          {tenants.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-zinc-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/60">
                    {['Tenant', 'Business', 'Plan', 'Status', 'MRR'].map((h) => (
                      <th key={h} className="text-left text-zinc-500 text-xs font-semibold px-3 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t) => (
                    <tr key={t.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/40">
                      <td className="px-3 py-2 font-mono text-xs text-zinc-400">{t.tenant_id}</td>
                      <td className="px-3 py-2 text-white text-sm">{t.business_name}</td>
                      <td className={`px-3 py-2 text-xs font-bold capitalize ${planColor[t.plan] ?? 'text-white'}`}>{t.plan}</td>
                      <td className={`px-3 py-2 text-xs font-bold capitalize ${statusColor[t.status] ?? 'text-zinc-400'}`}>{t.status}</td>
                      <td className="px-3 py-2 text-zinc-300 text-xs">{fmtUsdFull(t.monthly_price_usd)}/mo</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <OSCard>
              <p className="text-zinc-500 text-sm text-center py-4">
                No tenants yet. Create via POST /api/v1/saas/tenants.
              </p>
            </OSCard>
          )}
        </>
      ) : null}
    </div>
  );
}

// ── Module: Tenant Onboarding Wizard ─────────────────────────────────────────

const PLANS_INFO = [
  { id: 'starter',    label: 'Starter',    price: '$299/mo', features: ['Leads', 'Jarvis AI', 'CRM', 'Proposals'] },
  { id: 'pro',        label: 'Pro',         price: '$599/mo', features: ['Everything in Starter', 'Gantt', 'Catalog', 'QuickBooks', 'BIM'] },
  { id: 'enterprise', label: 'Enterprise',  price: '$1,499/mo', features: ['Everything in Pro', 'SaaS Admin', 'Custom branding', 'Dedicated support'] },
];

type OnboardStep = 'info' | 'plan' | 'features' | 'confirm' | 'done';

function TenantOnboardingModule({ authKey, apiBase }: { authKey: string; apiBase: string }) {
  const [step, setStep] = useState<OnboardStep>('info');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [plan, setPlan] = useState<'starter' | 'pro' | 'enterprise'>('starter');
  const [features, setFeatures] = useState<string[]>(['leads', 'crm', 'jarvis']);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ tenant_id: string; name: string; plan: string } | null>(null);
  const [err, setErr] = useState('');

  const ALL_FEATURES = [
    { id: 'leads',      label: 'Lead Capture' },
    { id: 'crm',        label: 'CRM' },
    { id: 'jarvis',     label: 'Jarvis AI' },
    { id: 'proposals',  label: 'Proposals' },
    { id: 'gantt',      label: 'Gantt / Scheduling' },
    { id: 'catalog',    label: 'Material Catalog' },
    { id: 'quickbooks', label: 'QuickBooks Sync' },
    { id: 'bim',        label: 'BIM / Plan Markup' },
    { id: 'analytics',  label: 'Analytics Dashboard' },
  ];

  const toggleFeature = (id: string) =>
    setFeatures((prev) => prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]);

  const submit = async () => {
    setSubmitting(true);
    setErr('');
    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40)
        + '-' + Date.now().toString(36);
      const r = await fetch(`${apiBase}/api/v1/saas/tenants`, {
        method: 'POST',
        headers: { 'X-Master-Key': authKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: slug,
          business_name: name,
          contact_email: email || 'noemail@example.com',
          contact_phone: phone || undefined,
          plan,
        }),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.detail ?? 'Server error'); }
      const d = await r.json();
      setResult({ tenant_id: d.tenant_id, name: d.business_name, plan: d.plan });
      setStep('done');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  const STEPS: OnboardStep[] = ['info', 'plan', 'features', 'confirm'];
  const stepIdx = STEPS.indexOf(step);

  const planInfo = PLANS_INFO.find((p) => p.id === plan)!;

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-black">New Tenant Onboarding</h3>
        <LiveBadge />
      </div>

      {/* Progress bar */}
      {step !== 'done' && (
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-colors ${
              i <= stepIdx ? 'bg-yellow-500' : 'bg-zinc-800'
            }`} />
          ))}
        </div>
      )}

      {step === 'done' && result ? (
        <OSCard accent>
          <div className="text-center py-4">
            <CheckCircle className="mx-auto text-green-400 mb-3" size={40} />
            <p className="text-white font-black text-xl mb-1">Tenant Created!</p>
            <p className="text-zinc-400 text-sm mb-4">{result.name}</p>
            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
              <div className="bg-zinc-800 rounded-xl p-3">
                <p className="text-zinc-500 text-xs">Tenant ID</p>
                <p className="text-yellow-400 font-mono font-bold text-xs mt-0.5">{result.tenant_id}</p>
              </div>
              <div className="bg-zinc-800 rounded-xl p-3">
                <p className="text-zinc-500 text-xs">Plan</p>
                <p className="text-white font-bold capitalize mt-0.5">{result.plan}</p>
              </div>
            </div>
            <button onClick={() => { setStep('info'); setName(''); setEmail(''); setPhone(''); setPlan('starter'); setFeatures(['leads','crm','jarvis']); setResult(null); }}
              className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-colors">
              Onboard Another
            </button>
          </div>
        </OSCard>
      ) : step === 'info' ? (
        <OSCard>
          <p className="text-white font-bold mb-4">Step 1 — Company Info</p>
          <div className="space-y-3">
            <input type="text" placeholder="Company name *" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-yellow-500" />
            <input type="email" placeholder="Admin email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-yellow-500" />
            <input type="tel" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-yellow-500" />
          </div>
          <button onClick={() => setStep('plan')} disabled={!name.trim()}
            className="mt-4 w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-bold rounded-xl transition-colors">
            Next: Choose Plan
          </button>
        </OSCard>
      ) : step === 'plan' ? (
        <div className="space-y-3">
          <p className="text-white font-bold">Step 2 — Select Plan</p>
          {PLANS_INFO.map((p) => (
            <OSCard key={p.id} accent={plan === p.id}>
              <div className="flex items-start gap-3 cursor-pointer" onClick={() => setPlan(p.id as typeof plan)}>
                <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 transition-colors ${
                  plan === p.id ? 'border-yellow-500 bg-yellow-500' : 'border-zinc-600'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-white font-bold">{p.label}</p>
                    <p className="text-yellow-400 font-black">{p.price}</p>
                  </div>
                  <ul className="mt-1 space-y-0.5">
                    {p.features.map((f) => (
                      <li key={f} className="text-zinc-400 text-xs flex items-center gap-1">
                        <span className="text-green-400">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </OSCard>
          ))}
          <div className="flex gap-2">
            <button onClick={() => setStep('info')} className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold rounded-xl transition-colors">Back</button>
            <button onClick={() => setStep('features')} className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-colors">Next: Features</button>
          </div>
        </div>
      ) : step === 'features' ? (
        <OSCard>
          <p className="text-white font-bold mb-4">Step 3 — Feature Access</p>
          <div className="grid grid-cols-2 gap-2">
            {ALL_FEATURES.map((f) => (
              <button key={f.id} onClick={() => toggleFeature(f.id)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm font-medium transition-colors text-left ${
                  features.includes(f.id)
                    ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
                    : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
                }`}>
                <span className={`w-3.5 h-3.5 rounded shrink-0 border ${
                  features.includes(f.id) ? 'bg-yellow-500 border-yellow-500' : 'border-zinc-600'
                }`} />
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setStep('plan')} className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold rounded-xl transition-colors">Back</button>
            <button onClick={() => setStep('confirm')} className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-colors">Review</button>
          </div>
        </OSCard>
      ) : step === 'confirm' ? (
        <OSCard accent>
          <p className="text-white font-bold mb-4">Step 4 — Confirm</p>
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between"><span className="text-zinc-500">Company</span><span className="text-white font-bold">{name}</span></div>
            {email && <div className="flex justify-between"><span className="text-zinc-500">Email</span><span className="text-zinc-300">{email}</span></div>}
            <div className="flex justify-between"><span className="text-zinc-500">Plan</span><span className="text-yellow-400 font-bold capitalize">{plan} — {planInfo.price}</span></div>
            <div className="flex justify-between items-start"><span className="text-zinc-500">Features</span><span className="text-zinc-300 text-right max-w-[60%]">{features.join(', ')}</span></div>
          </div>
          {err && <p className="text-red-400 text-xs mb-3">{err}</p>}
          <div className="flex gap-2">
            <button onClick={() => setStep('features')} className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold rounded-xl transition-colors">Back</button>
            <button onClick={submit} disabled={submitting}
              className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-bold rounded-xl transition-colors">
              {submitting ? 'Creating…' : 'Create Tenant'}
            </button>
          </div>
        </OSCard>
      ) : null}
    </div>
  );
}

// ── Module: Finish Selections (Homeowner View) ────────────────────────────────

interface ProjectSelection {
  id: number;
  zone_label: string | null;
  quantity: number;
  area_sqft: number | null;
  approved: boolean;
  item: {
    id: number;
    name: string;
    sku: string;
    category: string;
    unit: string;
    in_stock: boolean;
    lead_time_days: number;
    seasonal_note?: string;
  } | null;
  line_total_material: number;
  line_total_labor: number;
}

interface ProjectSummary {
  id: number;
  customer_name: string;
  property_address: string | null;
  status: string;
  total_usd: number;
  item_count: number;
  estimated_days_to_start: number;
}

function FinishSelectionsModule({ authKey, apiBase }: { authKey: string; apiBase: string }) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selections, setSelections] = useState<ProjectSelection[]>([]);
  const [projData, setProjData] = useState<ProjectSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSel, setLoadingSel] = useState(false);
  const [approving, setApproving] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${apiBase}/api/v1/catalog/projects`, { headers: { 'X-Master-Key': authKey } })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setProjects(d.projects ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authKey, apiBase]);

  const loadProject = useCallback((id: number) => {
    setLoadingSel(true);
    setSelectedId(id);
    fetch(`${apiBase}/api/v1/catalog/projects/${id}`, { headers: { 'X-Master-Key': authKey } })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => { setProjData(d.project); setSelections(d.selections ?? []); })
      .catch(() => {})
      .finally(() => setLoadingSel(false));
  }, [authKey, apiBase]);

  const approveSelection = async (selId: number) => {
    if (!selectedId) return;
    setApproving(selId);
    await fetch(`${apiBase}/api/v1/catalog/projects/${selectedId}/selections/${selId}/approve`, {
      method: 'POST',
      headers: { 'X-Master-Key': authKey },
    });
    setSelections((prev) => prev.map((s) => s.id === selId ? { ...s, approved: true } : s));
    setApproving(null);
  };

  const catColors: Record<string, string> = {
    pavers: 'bg-yellow-500/20 text-yellow-400',
    surfaces: 'bg-blue-500/20 text-blue-400',
    concrete: 'bg-zinc-500/20 text-zinc-300',
    edging: 'bg-purple-500/20 text-purple-400',
    striping: 'bg-green-500/20 text-green-400',
    plantings: 'bg-emerald-500/20 text-emerald-400',
  };

  const totalLine = selections.reduce((s, sel) => s + sel.line_total_material + sel.line_total_labor, 0);
  const approvedCount = selections.filter((s) => s.approved).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-black">Finish Selections — Client View</h3>
        <LiveBadge />
      </div>

      {!selectedId ? (
        <>
          <p className="text-zinc-500 text-sm">Select a project to review and approve finish selections.</p>
          {loading ? (
            <div className="text-zinc-500 text-sm py-8 text-center">Loading projects…</div>
          ) : projects.length === 0 ? (
            <OSCard><p className="text-zinc-500 text-sm text-center py-4">No projects yet. Create one in the Catalog module.</p></OSCard>
          ) : (
            <div className="space-y-2">
              {projects.map((p) => (
                <OSCard key={p.id}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-white font-bold">{p.customer_name}</p>
                      {p.property_address && <p className="text-zinc-500 text-xs mt-0.5">{p.property_address}</p>}
                      <div className="flex items-center gap-3 mt-1.5 text-xs">
                        <span className="text-zinc-400">{p.item_count} items</span>
                        <span className="text-yellow-400 font-bold">{fmtUsdFull(p.total_usd)}</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          p.status === 'approved' ? 'bg-green-500/20 text-green-400'
                          : p.status === 'draft' ? 'bg-zinc-700 text-zinc-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                        }`}>{p.status}</span>
                      </div>
                    </div>
                    <button onClick={() => loadProject(p.id)}
                      className="shrink-0 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-bold rounded-xl transition-colors">
                      Review
                    </button>
                  </div>
                </OSCard>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <button onClick={() => { setSelectedId(null); setSelections([]); setProjData(null); }}
              className="text-zinc-500 hover:text-white text-sm transition-colors">← Back</button>
            {projData && <p className="text-white font-bold">{projData.customer_name}</p>}
          </div>

          {projData && (
            <div className="grid grid-cols-3 gap-3">
              <OSCard accent>
                <p className="text-zinc-500 text-xs mb-1">Total Estimate</p>
                <p className="text-yellow-400 font-black text-xl">{fmtUsdFull(totalLine)}</p>
              </OSCard>
              <OSCard>
                <p className="text-zinc-500 text-xs mb-1">Approved</p>
                <p className="text-green-400 font-black text-xl">{approvedCount}/{selections.length}</p>
              </OSCard>
              <OSCard>
                <p className="text-zinc-500 text-xs mb-1">Lead Time</p>
                <p className="text-white font-black text-xl">
                  {projData.estimated_days_to_start > 0 ? `${projData.estimated_days_to_start}d` : 'Now'}
                </p>
              </OSCard>
            </div>
          )}

          {loadingSel ? (
            <div className="text-zinc-500 text-sm py-8 text-center">Loading selections…</div>
          ) : selections.length === 0 ? (
            <OSCard><p className="text-zinc-500 text-sm text-center py-4">No finish selections yet. Add items in the Catalog module.</p></OSCard>
          ) : (
            <div className="space-y-3">
              {selections.map((sel) => (
                <OSCard key={sel.id} accent={sel.approved}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {sel.item && (
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${catColors[sel.item.category] ?? 'bg-zinc-700 text-zinc-300'}`}>
                            {sel.item.category}
                          </span>
                        )}
                        {sel.zone_label && <span className="text-zinc-500 text-xs">{sel.zone_label}</span>}
                        {sel.approved && <span className="text-green-400 text-xs font-bold">✓ Approved</span>}
                      </div>
                      <p className="text-white font-bold">{sel.item?.name ?? 'Unknown item'}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">{sel.item?.sku}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                        <span>Qty: {sel.quantity} {sel.item?.unit}</span>
                        {sel.area_sqft && <span>{sel.area_sqft.toLocaleString()} sqft</span>}
                        {sel.item && (
                          <span className={sel.item.in_stock ? 'text-green-400' : 'text-red-400'}>
                            {sel.item.in_stock ? 'In stock' : 'Out of stock'}
                          </span>
                        )}
                        {sel.item && sel.item.lead_time_days > 0 && (
                          <span>Lead: {sel.item.lead_time_days}d</span>
                        )}
                      </div>
                      {sel.item?.seasonal_note && (
                        <p className="text-yellow-400/70 text-xs mt-1 italic">{sel.item.seasonal_note}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-yellow-400 font-black text-lg">{fmtUsdFull(sel.line_total_material + sel.line_total_labor)}</p>
                      <p className="text-zinc-600 text-xs">Mat: {fmtUsdFull(sel.line_total_material)}</p>
                      <p className="text-zinc-600 text-xs">Labor: {fmtUsdFull(sel.line_total_labor)}</p>
                      {!sel.approved && (
                        <button onClick={() => approveSelection(sel.id)} disabled={approving === sel.id}
                          className="mt-2 px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs font-bold rounded-lg transition-colors disabled:opacity-50">
                          {approving === sel.id ? '…' : 'Approve'}
                        </button>
                      )}
                    </div>
                  </div>
                </OSCard>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Module: BIM / Plan Markup ─────────────────────────────────────────────────

interface BimZone {
  id: string;
  label: string;
  type: string;
  area_sqft: number;
  catalog_item_id: number | null;
  x_pct: number;
  y_pct: number;
  w_pct: number;
  h_pct: number;
  color: string;
  notes?: string;
}

interface BimPlan {
  id: number;
  title: string;
  catalog_project_id: number | null;
  file_url: string | null;
  file_type: string | null;
  zones: BimZone[];
  total_area_sqft: number | null;
  version: number;
  is_approved: boolean;
  notes: string | null;
  created_at: string;
  demo: boolean;
}

function BimModule({ authKey, apiBase }: { authKey: string; apiBase: string }) {
  const [plan, setPlan] = useState<BimPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${apiBase}/api/v1/bim/demo`, { headers: { 'X-Master-Key': authKey } })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setPlan(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authKey, apiBase]);

  const totalArea = plan?.zones.reduce((s, z) => s + z.area_sqft, 0) ?? 0;
  const zoneCount = plan?.zones.length ?? 0;
  const hasItems = plan?.zones.filter((z) => z.catalog_item_id).length ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-black">BIM / Plan Markup</h3>
        <LiveBadge />
      </div>

      {loading ? (
        <div className="text-zinc-500 text-sm py-12 text-center">Loading plan…</div>
      ) : plan ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <OSCard accent><KV k="Total Area" v={`${totalArea.toLocaleString()} sqft`} accent /></OSCard>
            <OSCard><KV k="Zones" v={zoneCount} /></OSCard>
            <OSCard><KV k="Linked Items" v={`${hasItems}/${zoneCount}`} /></OSCard>
            <OSCard><KV k="Version" v={`v${plan.version}`} /></OSCard>
          </div>

          <OSCard>
            <div className="flex items-center justify-between mb-3">
              <p className="text-zinc-400 text-xs font-semibold uppercase">{plan.title}</p>
              {plan.is_approved && (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold">Approved</span>
              )}
            </div>

            {/* Interactive zone map */}
            <div className="relative w-full bg-zinc-800 rounded-xl overflow-hidden border border-zinc-700" style={{ paddingTop: '56.25%' }}>
              <div className="absolute inset-0">
                {/* Site boundary */}
                <div className="absolute inset-2 border border-zinc-600 rounded-lg" />
                {/* Zones as positioned overlays */}
                {plan.zones.map((zone) => (
                  <div
                    key={zone.id}
                    className="absolute rounded cursor-pointer transition-all duration-150"
                    style={{
                      left: `${zone.x_pct}%`,
                      top: `${zone.y_pct}%`,
                      width: `${zone.w_pct}%`,
                      height: `${zone.h_pct}%`,
                      background: `${zone.color}22`,
                      border: `2px solid ${zone.color}`,
                      opacity: hoveredZone === zone.id ? 1 : 0.75,
                      zIndex: hoveredZone === zone.id ? 10 : 1,
                    }}
                    onMouseEnter={() => setHoveredZone(zone.id)}
                    onMouseLeave={() => setHoveredZone(null)}
                  >
                    <span className="text-[10px] font-bold leading-tight p-1 block truncate" style={{ color: zone.color }}>
                      {zone.label}
                    </span>
                    {zone.area_sqft > 0 && (
                      <span className="text-[9px] leading-tight px-1 block" style={{ color: zone.color, opacity: 0.8 }}>
                        {zone.area_sqft.toLocaleString()} sqft
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Zone legend */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              {plan.zones.map((z) => (
                <div key={z.id}
                  className={`flex items-start gap-2 text-xs p-1.5 rounded-lg transition-colors ${hoveredZone === z.id ? 'bg-zinc-700' : ''}`}
                  onMouseEnter={() => setHoveredZone(z.id)}
                  onMouseLeave={() => setHoveredZone(null)}>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ background: z.color }} />
                  <div>
                    <p className="text-zinc-300 font-semibold">{z.label}</p>
                    {z.area_sqft > 0 && <p className="text-zinc-600">{z.area_sqft.toLocaleString()} sqft · {z.type}</p>}
                    {z.notes && <p className="text-zinc-600 italic mt-0.5">{z.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </OSCard>

          {plan.notes && (
            <OSCard>
              <p className="text-zinc-500 text-xs">{plan.notes}</p>
            </OSCard>
          )}
        </>
      ) : (
        <OSCard><p className="text-zinc-500 text-sm text-center py-4">Demo plan unavailable — check API connection.</p></OSCard>
      )}
    </div>
  );
}

// ── Module: Weather / GO ───────────────────────────────────────────────────────

interface WeatherDay {
  date: string;
  temp_max_f: number;
  temp_min_f: number;
  precip_probability_pct: number;
  wind_max_mph: number;
  condition: string;
  weather_code: number;
  paving_status: 'GO' | 'NO-GO';
  nogo_reason: string | null;
}

interface WeatherForecast {
  lat: number;
  lng: number;
  forecast: WeatherDay[];
  paving_windows: WeatherDay[];
  next_go_day: string | null;
  mock: boolean;
}

interface WeatherCurrent {
  temp_f: number;
  precip_probability_pct: number;
  wind_mph: number;
  condition: string;
  paving_status: 'GO' | 'NO-GO';
  nogo_reason: string | null;
  mock: boolean;
}

function WeatherModule({ authKey, apiBase }: { authKey: string; apiBase: string }) {
  const [current, setCurrent] = useState<WeatherCurrent | null>(null);
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch(`${apiBase}/api/v1/weather/current`, { headers: { 'X-Master-Key': authKey } }).then((r) => r.ok ? r.json() : null),
      fetch(`${apiBase}/api/v1/weather/forecast?days=7`, { headers: { 'X-Master-Key': authKey } }).then((r) => r.ok ? r.json() : null),
    ]).then(([cur, fcast]) => {
      if (cur) setCurrent(cur);
      if (fcast) setForecast(fcast);
    }).finally(() => setLoading(false));
  }, [authKey, apiBase]);

  useEffect(() => { reload(); }, [reload]);

  const goCount = forecast?.paving_windows.length ?? 0;
  const nogoCount = (forecast?.forecast.length ?? 0) - goCount;

  const dayLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-black">Weather / Paving GO Window</h3>
        <div className="flex items-center gap-2">
          {current?.mock && <span className="text-xs text-zinc-500 italic">mock data</span>}
          <button onClick={reload} className="text-zinc-500 hover:text-white transition-colors">
            <RefreshCw size={14} />
          </button>
          <LiveBadge />
        </div>
      </div>

      {loading ? (
        <div className="text-zinc-500 text-sm py-12 text-center">Fetching weather…</div>
      ) : (
        <>
          {/* Current conditions hero */}
          {current && (
            <OSCard accent={current.paving_status === 'GO'}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-500 text-xs uppercase font-semibold mb-1">Richmond, VA — Now</p>
                  <p className="text-white font-black text-4xl">{current.temp_f}°F</p>
                  <p className="text-zinc-400 text-sm mt-1">{current.condition}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                    <span className="flex items-center gap-1"><CloudRain size={11} /> {current.precip_probability_pct}% precip</span>
                    <span className="flex items-center gap-1"><Wind size={11} /> {current.wind_mph.toFixed(0)} mph</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-3xl font-black px-4 py-2 rounded-2xl ${
                    current.paving_status === 'GO'
                      ? 'text-green-400 bg-green-500/20'
                      : 'text-red-400 bg-red-500/20'
                  }`}>{current.paving_status}</span>
                  {current.nogo_reason && (
                    <p className="text-red-400 text-xs mt-2 max-w-[180px] text-right">{current.nogo_reason}</p>
                  )}
                </div>
              </div>
            </OSCard>
          )}

          {/* 7-day summary */}
          {forecast && (
            <div className="grid grid-cols-3 gap-3">
              <OSCard accent>
                <p className="text-zinc-500 text-xs mb-1">GO Days (7d)</p>
                <p className="text-green-400 font-black text-3xl">{goCount}</p>
              </OSCard>
              <OSCard>
                <p className="text-zinc-500 text-xs mb-1">NO-GO Days</p>
                <p className="text-red-400 font-black text-3xl">{nogoCount}</p>
              </OSCard>
              <OSCard>
                <p className="text-zinc-500 text-xs mb-1">Next GO Day</p>
                <p className="text-white font-black text-sm mt-1">
                  {forecast.next_go_day ? dayLabel(forecast.next_go_day) : 'None'}
                </p>
              </OSCard>
            </div>
          )}

          {/* 7-day strip */}
          {forecast && (
            <OSCard>
              <p className="text-zinc-500 text-xs font-semibold uppercase mb-3">7-Day Paving Forecast</p>
              <div className="space-y-2">
                {forecast.forecast.map((day) => (
                  <div key={day.date}
                    className={`flex items-center gap-3 p-2 rounded-xl ${
                      day.paving_status === 'GO' ? 'bg-green-500/5 border border-green-500/20' : 'bg-zinc-800/50'
                    }`}>
                    <span className={`text-xs font-bold w-14 shrink-0 ${
                      day.paving_status === 'GO' ? 'text-green-400' : 'text-red-400'
                    }`}>{day.paving_status}</span>
                    <span className="text-zinc-400 text-xs w-24 shrink-0">{dayLabel(day.date)}</span>
                    <span className="text-white text-xs font-semibold">{day.temp_max_f}°/{day.temp_min_f}°F</span>
                    <span className="text-zinc-500 text-xs flex-1">{day.condition}</span>
                    <span className="text-zinc-600 text-xs shrink-0 flex items-center gap-1">
                      <CloudRain size={10} />{day.precip_probability_pct}%
                    </span>
                    <span className="text-zinc-600 text-xs shrink-0 flex items-center gap-1">
                      <Wind size={10} />{day.wind_max_mph.toFixed(0)}
                    </span>
                    {day.nogo_reason && (
                      <span className="text-red-400/60 text-xs hidden sm:block shrink-0 max-w-[160px] truncate">{day.nogo_reason}</span>
                    )}
                  </div>
                ))}
              </div>
            </OSCard>
          )}
        </>
      )}
    </div>
  );
}

// ── Module: Jarvis Three Faces ─────────────────────────────────────────────────

interface JarvisFaceMsg { role: 'user' | 'assistant'; content: string }

function JarvisFacesModule({ authKey, apiBase }: { authKey: string; apiBase: string }) {
  const [mode, setMode] = useState<'operator' | 'contractor' | 'homeowner'>('operator');
  const [messages, setMessages] = useState<JarvisFaceMsg[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);

  const FACES = [
    { id: 'operator'   as const, label: 'Operator',   sub: 'Owner — full data access',      accent: 'yellow' },
    { id: 'contractor' as const, label: 'Contractor',  sub: 'Mentor — field decisions only', accent: 'blue'   },
    { id: 'homeowner'  as const, label: 'Homeowner',   sub: 'Companion — zero jargon',       accent: 'green'  },
  ];

  const placeholders: Record<string, string> = {
    operator:   'Ask about margins, compaction, OSHA, pipeline…',
    contractor: 'Ask about compaction %, lay-down window, weather go/no-go…',
    homeowner:  'Ask about your project, costs, timeline…',
  };

  const activeClasses: Record<string, string> = {
    operator:   'border-yellow-500 bg-yellow-500/10 text-yellow-400',
    contractor: 'border-blue-500 bg-blue-500/10 text-blue-400',
    homeowner:  'border-green-500 bg-green-500/10 text-green-400',
  };

  const sendMsg = async () => {
    const text = input.trim();
    if (!text || thinking) return;
    const updated: JarvisFaceMsg[] = [...messages, { role: 'user', content: text }];
    setMessages(updated);
    setInput('');
    setThinking(true);
    try {
      const r = await fetch(`${apiBase}/api/v1/jarvis-modes/chat`, {
        method: 'POST',
        headers: { 'X-Master-Key': authKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, messages: updated }),
      });
      const data = r.ok ? await r.json() : null;
      setMessages((p) => [...p, { role: 'assistant', content: data?.reply ?? 'Jarvis unavailable — check API keys.' }]);
    } catch {
      setMessages((p) => [...p, { role: 'assistant', content: 'Jarvis unavailable — check API keys.' }]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="space-y-5">
      <h3 className="text-white font-black">Jarvis — One Brain, Three Permission-Walled Faces</h3>

      <div className="grid grid-cols-3 gap-3">
        {FACES.map((f) => (
          <button key={f.id} onClick={() => { setMode(f.id); setMessages([]); }}
            className={`p-3 rounded-xl border text-left transition-all ${
              mode === f.id ? activeClasses[f.id] : 'border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white'
            }`}>
            <p className="font-bold text-sm">{f.label}</p>
            <p className="text-xs opacity-70 mt-0.5">{f.sub}</p>
          </button>
        ))}
      </div>

      {mode !== 'operator' && (
        <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
          <Shield size={11} className="text-zinc-600 shrink-0" />
          <span>
            {mode === 'contractor'
              ? 'Margins, markups, OSHA metrics filtered server-side before LLM call.'
              : 'All operational data, pricing internals, and jargon filtered. Homeowner-safe.'}
          </span>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col" style={{ minHeight: '380px' }}>
        <div className="flex-1 space-y-3 overflow-y-auto mb-4" style={{ maxHeight: '300px' }}>
          {messages.length === 0 && (
            <p className="text-zinc-600 text-sm text-center py-8">{placeholders[mode]}</p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                msg.role === 'user'
                  ? 'bg-yellow-500 text-black font-medium rounded-br-sm'
                  : 'bg-zinc-800 text-zinc-200 rounded-bl-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 px-4 py-2.5 rounded-2xl rounded-bl-sm">
                <span className="text-zinc-500 text-sm animate-pulse">Jarvis is thinking…</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMsg()}
            placeholder={placeholders[mode]}
            className="flex-1 bg-zinc-800 border border-zinc-700 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-yellow-500 transition-colors placeholder:text-zinc-600"
          />
          <button onClick={sendMsg} disabled={!input.trim() || thinking}
            className="px-4 py-2.5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-bold text-sm rounded-xl transition-colors">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────────

function Sidebar({
  active, onSelect, onClose, mobile,
}: {
  active: ModuleId; onSelect: (id: ModuleId) => void; onClose: () => void; mobile: boolean;
}) {
  return (
    <aside className={`
      ${mobile
        ? 'fixed inset-0 z-50 flex'
        : 'hidden lg:flex w-56 xl:w-64 shrink-0 flex-col border-r border-zinc-800'
      }
    `}>
      {mobile && (
        <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      )}
      <div className={`
        ${mobile ? 'relative z-10 w-56 xl:w-64 h-full' : 'w-full h-full'}
        bg-zinc-900 flex flex-col
      `}>
        {/* Brand header */}
        <div className="px-4 py-4 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-400 font-black text-xs uppercase tracking-widest">Construction OS</p>
              <p className="text-white font-bold text-sm truncate">{TENANT.business.shortName}</p>
            </div>
            {mobile && (
              <button onClick={onClose} className="text-zinc-500 hover:text-white p-1">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {MODULES.map(({ id, label, icon: Icon, live }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => { onSelect(id); if (mobile) onClose(); }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-yellow-500/10 text-yellow-400 font-semibold border-r-2 border-yellow-400'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <Icon size={14} className="shrink-0" />
                <span className="truncate">{label}</span>
                {!live && !isActive && (
                  <span className="ml-auto text-zinc-700 text-xs">demo</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* System status footer */}
        <div className="px-4 py-3 border-t border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-xs font-semibold">Jarvis Online</span>
          </div>
          <p className="text-zinc-600 text-xs">
            v2.0 · {TENANT.id} · {TENANT.branding.primaryColor}
          </p>
        </div>
      </div>
    </aside>
  );
}

// ── Top bar ────────────────────────────────────────────────────────────────────

function TopBar({
  activeModule, kpi, onMenuOpen,
}: {
  activeModule: ModuleId; kpi: KpiData | null; onMenuOpen: () => void;
}) {
  const mod = MODULES.find((m) => m.id === activeModule);
  return (
    <header className="h-12 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 shrink-0">
      <button onClick={onMenuOpen} className="lg:hidden text-zinc-500 hover:text-white mr-3">
        <Menu size={18} />
      </button>
      <div className="flex items-center gap-2 text-zinc-500 text-xs">
        <span className="text-yellow-400 font-semibold">OS</span>
        <ChevronRight size={12} />
        <span className="text-white font-semibold">{mod?.label ?? ''}</span>
        {mod?.live ? <LiveBadge /> : null}
      </div>
      {kpi && (
        <div className="ml-auto flex items-center gap-4 text-xs text-zinc-500">
          <span className="hidden sm:inline">
            Leads: <strong className="text-white">{kpi.pipeline.new_leads_mtd}</strong>
          </span>
          <span className="hidden sm:inline">
            Jobs: <strong className="text-white">{kpi.jobs.active}</strong>
          </span>
          <span className="hidden md:inline">
            Win rate: <strong className="text-yellow-400">{kpi.proposals.win_rate_pct}%</strong>
          </span>
          <span className="text-zinc-700 hidden md:inline">
            {new Date(kpi.generated_at).toLocaleTimeString()}
          </span>
        </div>
      )}
    </header>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export function OSPage() {
  const [authKey, setAuthKey] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authErr, setAuthErr] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyResult[]>([]);
  const [activeModule, setActiveModule] = useState<ModuleId>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const apiBase = import.meta.env.VITE_API_BASE_URL || '';

  useEffect(() => {
    document.title = 'Construction OS | J. Worden & Sons';
  }, []);

  const authenticate = useCallback((key: string) => {
    setAuthLoading(true);
    setAuthErr(false);
    fetch(`${apiBase}/api/v1/kpi/`, { headers: { 'X-Master-Key': key } })
      .then((r) => {
        if (r.status === 401 || r.status === 403) throw new Error('auth');
        if (!r.ok) throw new Error('err');
        return r.json();
      })
      .then((d: KpiData) => {
        setKpi(d);
        setAuthed(true);
        // Fire anomaly check in background
        fetch(`${apiBase}/api/v1/anomalies/`, { headers: { 'X-Master-Key': key } })
          .then((r) => r.ok ? r.json() : Promise.reject())
          .then((d) => setAnomalies(d.results ?? []))
          .catch(() => {});
      })
      .catch((e) => { if (e.message === 'auth') setAuthErr(true); })
      .finally(() => setAuthLoading(false));
  }, [apiBase]);

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="fixed inset-0 z-50 bg-zinc-950 flex items-center justify-center px-4"
        style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(245,166,35,0.04) 0%, transparent 70%)' }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-yellow-400 mb-3">
              <Zap size={20} />
              <span className="font-black text-xl">Construction OS</span>
            </div>
            <p className="text-white font-bold text-lg">{TENANT.business.name}</p>
            <p className="text-zinc-500 text-sm mt-1">{TENANT.branding.tagline}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <p className="text-zinc-400 text-sm mb-5 text-center">Master key required</p>
            {authErr && <p className="text-red-400 text-xs mb-3 text-center font-medium">Invalid master key.</p>}
            <input
              type="password"
              placeholder="Enter master key…"
              value={authKey}
              onChange={(e) => setAuthKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !authLoading && authKey && authenticate(authKey)}
              className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-xl px-4 py-3 mb-3 focus:outline-none focus:border-yellow-500 transition-colors"
              autoFocus
            />
            <button
              onClick={() => authenticate(authKey)}
              disabled={!authKey || authLoading}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black text-sm rounded-xl py-3 disabled:opacity-40 transition-colors"
            >
              {authLoading ? 'Authenticating…' : 'Launch OS'}
            </button>
          </div>
          <p className="text-zinc-700 text-xs text-center mt-4">{TENANT.compliance.licenseStatement}</p>
        </div>
      </div>
    );
  }

  // ── Operating system ───────────────────────────────────────────────────────
  const sharedProps = { authKey, apiBase };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col">
      <TopBar activeModule={activeModule} kpi={kpi} onMenuOpen={() => setSidebarOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          active={activeModule}
          onSelect={setActiveModule}
          onClose={() => setSidebarOpen(false)}
          mobile={false}
        />
        {sidebarOpen && (
          <Sidebar
            active={activeModule}
            onSelect={setActiveModule}
            onClose={() => setSidebarOpen(false)}
            mobile={true}
          />
        )}

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
            {activeModule === 'overview'     && kpi && <OverviewModule kpi={kpi} anomalies={anomalies} {...sharedProps} />}
            {activeModule === 'jarvis'       && <JarvisModule />}
            {activeModule === 'crm'          && kpi && <CrmModule {...sharedProps} kpi={kpi} />}
            {activeModule === 'digital-twin' && kpi && <DigitalTwinModule kpi={kpi} />}
            {activeModule === 'thermal'      && <ThermalModule />}
            {activeModule === 'roller'       && <RollerModule />}
            {activeModule === 'drone'        && <DroneModule />}
            {activeModule === 'crew'         && <CrewModule />}
            {activeModule === 'search-pulse' && <SearchPulseModule {...sharedProps} />}
            {activeModule === 'legal'        && <LegalModule {...sharedProps} />}
            {activeModule === 'dispatch'     && kpi && <DispatchModule {...sharedProps} kpi={kpi} />}
            {activeModule === 'proposals'    && kpi && <ProposalsModule {...sharedProps} kpi={kpi} />}
            {activeModule === 'math-ai'       && <MathAiModule />}
            {activeModule === 'gantt'          && <GanttModule {...sharedProps} />}
            {activeModule === 'catalog'        && <CatalogModule {...sharedProps} />}
            {activeModule === 'quickbooks'     && <QuickBooksModule {...sharedProps} />}
            {activeModule === 'saas'           && <SaasAdminModule {...sharedProps} />}
            {activeModule === 'bim'            && <BimModule {...sharedProps} />}
            {activeModule === 'jarvis-faces'   && <JarvisFacesModule {...sharedProps} />}
            {activeModule === 'weather'           && <WeatherModule {...sharedProps} />}
            {activeModule === 'onboarding'        && <TenantOnboardingModule {...sharedProps} />}
            {activeModule === 'finish-selections' && <FinishSelectionsModule {...sharedProps} />}
            {!kpi && !['jarvis','thermal','roller','drone','crew','math-ai','gantt','catalog','quickbooks','saas','bim','jarvis-faces','weather','onboarding','finish-selections'].includes(activeModule) && (
              <div className="text-zinc-500 text-sm text-center py-12">Loading data…</div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
