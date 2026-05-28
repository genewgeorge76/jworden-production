/**
 * AutonomyDashboard.jsx — Level 4 Autonomous Intelligence Command Center
 *
 * Three areas:
 *   Top     — Intelligence level map (L1–L4 capability coverage)
 *   Middle  — Goal submission + live execution trace (Orchestrator)
 *   Bottom  — Cognitive Digital Twin: project drift monitor
 */

import { useState } from 'react';
import { api } from '../api/client';

// ── Intelligence level colours ─────────────────────────────────────────────
const LEVEL_META = {
  L1_descriptive:  { label: 'L1 — Descriptive',  color: '#6b7280', badge: 'bg-slate-600' },
  L2_predictive:   { label: 'L2 — Predictive',   color: '#3b82f6', badge: 'bg-blue-600'  },
  L3_prescriptive: { label: 'L3 — Prescriptive', color: '#8b5cf6', badge: 'bg-purple-600'},
  L4_autonomous:   { label: 'L4 — Autonomous',   color: '#f59e0b', badge: 'bg-amber-500' },
};

const GOAL_TYPES = [
  'schedule_integrity',
  'cost_control',
  'safety_compliance',
  'material_supply',
  'site_quality',
  'lead_pipeline',
  'structural_health',
  'subcontractor_perf',
];

const SEVERITY_COLOR = {
  NORMAL:   'text-green-400',
  LOW:      'text-blue-400',
  MEDIUM:   'text-yellow-400',
  HIGH:     'text-orange-400',
  CRITICAL: 'text-red-400',
};

const STATUS_COLOR = {
  complete: 'bg-green-700 text-green-100',
  partial:  'bg-yellow-700 text-yellow-100',
  failed:   'bg-red-700 text-red-100',
  pending:  'bg-slate-700 text-slate-300',
  running:  'bg-blue-700 text-blue-100',
  skipped:  'bg-slate-600 text-slate-400',
};

// ── Intelligence Map panel ──────────────────────────────────────────────────
function IntelligenceMap({ map }) {
  if (!map) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {Object.entries(LEVEL_META).map(([key, meta]) => {
        const level = map.levels?.[key];
        if (!level) return null;
        const caps = level.capabilities || [];
        return (
          <div key={key} className="bg-slate-900 rounded-xl border border-slate-800 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${meta.badge} text-white`}>
                {meta.label}
              </span>
            </div>
            <p className="text-slate-400 text-xs mb-2">{level.label}</p>
            <ul className="space-y-1">
              {caps.map((c, i) => (
                <li key={i} className={`text-xs leading-snug ${c.includes('(NEW)') ? 'text-amber-300 font-medium' : 'text-slate-400'}`}>
                  • {c.replace(' (NEW)', '')}
                  {c.includes('(NEW)') && (
                    <span className="ml-1 px-1 rounded bg-amber-800 text-amber-200 text-[10px]">NEW</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

// ── Goal submission panel ───────────────────────────────────────────────────
function GoalPanel() {
  const [goalType, setGoalType]   = useState('schedule_integrity');
  const [projectId, setProjectId] = useState('');
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const submit = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const data = await api.request('POST', '/api/v1/autonomy/goals', {
        goal_type:  goalType,
        project_id: projectId || undefined,
        context:    {},
      });
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">
        Orchestrator — Submit Goal
      </h3>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select
          value={goalType}
          onChange={(e) => setGoalType(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white"
        >
          {GOAL_TYPES.map((g) => (
            <option key={g} value={g}>{g.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <input
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          placeholder="Project ID (optional)"
          className="w-40 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-slate-500"
        />
        <button
          onClick={submit}
          disabled={loading}
          className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded text-sm disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? 'Executing…' : '▶ Run Goal'}
        </button>
      </div>

      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

      {result && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-white font-semibold">{result.goal_type?.replace(/_/g, ' ')}</p>
              <p className="text-slate-500 text-xs">{result.goal_id}</p>
            </div>
            <span className={`px-3 py-1 rounded text-xs font-bold ${STATUS_COLOR[result.status] || STATUS_COLOR.pending}`}>
              {result.status?.toUpperCase()}
            </span>
          </div>

          {/* Executive summary */}
          <p className="text-slate-300 text-xs bg-slate-800 rounded p-3">{result.executive_summary}</p>

          {/* Worker task trace */}
          <div className="space-y-2">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Worker Execution Trace</p>
            {result.tasks?.map((t) => (
              <div key={t.task_id} className="bg-slate-800 rounded p-3 text-xs">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-slate-300 font-medium">{t.worker_id}</span>
                  <div className="flex items-center gap-2">
                    {t.retry_count > 0 && (
                      <span className="text-yellow-400">↺ {t.retry_count} retries</span>
                    )}
                    <span className={`px-2 py-0.5 rounded font-bold ${STATUS_COLOR[t.status] || STATUS_COLOR.pending}`}>
                      {t.status}
                    </span>
                    <span className="text-slate-500">conf {(t.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <p className="text-slate-400">{t.description}</p>
                {t.critique && t.critique !== 'Output accepted.' && (
                  <p className="text-yellow-400 mt-1">Reflexion: {t.critique}</p>
                )}
              </div>
            ))}
          </div>

          {/* Actions taken */}
          {result.actions_taken?.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Actions Taken</p>
              <ul className="space-y-1">
                {result.actions_taken.map((a, i) => (
                  <li key={i} className="text-xs text-green-300">✓ {a}</li>
                ))}
              </ul>
            </div>
          )}

          {/* RL */}
          <p className="text-slate-600 text-xs">
            RL strategy: {result.rl_strategy_used} · completed {result.completed_at?.slice(0, 19).replace('T', ' ')} UTC
          </p>
        </div>
      )}
    </div>
  );
}

// ── Cognitive Digital Twin panel ────────────────────────────────────────────
function TwinPanel() {
  const [projectId, setProjectId] = useState('');
  const [report, setReport]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const load = async () => {
    if (!projectId.trim()) return;
    setLoading(true); setError(''); setReport(null);
    try {
      const data = await api.request('GET', `/api/v1/autonomy/twin/${projectId.trim()}`);
      setReport(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">
        Cognitive Digital Twin
      </h3>

      <div className="flex gap-3 mb-4">
        <input
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          placeholder="Project / Site ID"
          className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-slate-500"
        />
        <button
          onClick={load}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded text-sm disabled:opacity-50"
        >
          {loading ? '…' : 'Sync'}
        </button>
      </div>

      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

      {report && (
        <div className="space-y-4">
          {/* Overall */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-white font-semibold">{report.project_id}</p>
              <p className={`text-sm font-bold ${SEVERITY_COLOR[report.overall_drift_severity] || 'text-slate-300'}`}>
                {report.overall_drift_severity} drift
              </p>
            </div>
            <span className="text-xs text-slate-400">{report.intelligence_level}</span>
          </div>

          {/* Dimension bars */}
          <div className="space-y-3">
            {report.dimensions?.map((d) => {
              const pct = Math.min(100, Math.max(0, d.actual));
              const devStr = `${d.deviation_pct > 0 ? '+' : ''}${d.deviation_pct?.toFixed(1)}%`;
              return (
                <div key={d.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 capitalize">{d.name}</span>
                    <div className="flex gap-3 text-slate-400">
                      <span>planned {d.planned?.toFixed(1)}{d.unit}</span>
                      <span>actual {d.actual?.toFixed(1)}{d.unit}</span>
                      <span className={SEVERITY_COLOR[d.severity] || 'text-slate-300'}>
                        {devStr} {d.severity !== 'NORMAL' ? `[${d.severity}]` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        d.severity === 'CRITICAL' ? 'bg-red-500' :
                        d.severity === 'HIGH'     ? 'bg-orange-500' :
                        d.severity === 'MEDIUM'   ? 'bg-yellow-500' :
                        d.severity === 'LOW'      ? 'bg-blue-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Remediation actions */}
          {report.remediation_actions?.length > 0 && (
            <div className="border-t border-slate-700 pt-3">
              <p className="text-xs text-orange-400 font-semibold uppercase tracking-wide mb-2">
                Auto-Remediation Triggered
              </p>
              {report.remediation_actions.map((a, i) => (
                <div key={i} className="text-xs bg-slate-800 rounded p-2 mb-1">
                  <span className={`font-bold ${SEVERITY_COLOR[a.severity] || 'text-slate-300'}`}>
                    [{a.severity}]
                  </span>{' '}
                  <span className="text-slate-300">{a.description}</span>
                  {a.record_id && (
                    <span className="text-slate-500 ml-2">→ record #{a.record_id}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <p className="text-slate-600 text-xs">
            Snapshot {report.snapshot_id} · {report.captured_at?.slice(0, 19).replace('T', ' ')} UTC
          </p>
        </div>
      )}
    </div>
  );
}

// ── Platform status bar ─────────────────────────────────────────────────────
function StatusBar({ status }) {
  if (!status) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
        <p className="text-amber-400 font-bold text-lg">{status.autonomy_level}</p>
        <p className="text-slate-400 text-xs mt-0.5">{status.autonomy_label?.split('—')[0]}</p>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
        <p className="text-white font-bold text-lg">{status.worker_agents?.length}</p>
        <p className="text-slate-400 text-xs mt-0.5">Worker Agents</p>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
        <p className="text-white font-bold text-lg">{status.goal_types?.length}</p>
        <p className="text-slate-400 text-xs mt-0.5">Goal Types</p>
      </div>
      <div className={`border rounded-xl p-3 text-center ${
        status.reflexion_enabled
          ? 'bg-green-500/10 border-green-500/30'
          : 'bg-slate-900 border-slate-800'
      }`}>
        <p className={`font-bold text-lg ${status.reflexion_enabled ? 'text-green-400' : 'text-slate-400'}`}>
          {status.reflexion_enabled ? '✓' : '✗'}
        </p>
        <p className="text-slate-400 text-xs mt-0.5">Reflexion Loop</p>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function AutonomyDashboard() {
  const [status, setStatus]       = useState(null);
  const [map, setMap]             = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [statusError, setStatusError]     = useState('');

  const loadStatus = async () => {
    setLoadingStatus(true); setStatusError('');
    try {
      const [s, m] = await Promise.all([
        api.request('GET', '/api/v1/autonomy/status'),
        api.request('GET', '/api/v1/autonomy/intelligence-map'),
      ]);
      setStatus(s);
      setMap(m);
    } catch (e) {
      setStatusError(e.message);
    } finally {
      setLoadingStatus(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Autonomous Intelligence
            <span className="ml-3 px-2 py-0.5 rounded bg-amber-500 text-slate-900 text-sm font-bold align-middle">L4</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Orchestrator · Reflexion · Reinforcement Learning · Cognitive Digital Twin
          </p>
        </div>
        <button
          onClick={loadStatus}
          disabled={loadingStatus}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-sm disabled:opacity-50 border border-slate-700 whitespace-nowrap"
        >
          {loadingStatus ? 'Loading…' : '⟳ Load Status'}
        </button>
      </div>

      {statusError && <p className="text-red-400 text-sm">{statusError}</p>}

      {/* Status bar */}
      {status && <StatusBar status={status} />}

      {/* Intelligence map */}
      {map && (
        <div>
          <h2 className="text-xs text-slate-500 uppercase tracking-wide mb-3">
            Platform Capability Map
          </h2>
          <IntelligenceMap map={map} />
        </div>
      )}

      {/* Gaps */}
      {map?.gaps_and_roadmap && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h3 className="text-xs text-slate-500 uppercase tracking-wide mb-2">Phase 2 Roadmap</h3>
          <ul className="space-y-1">
            {map.gaps_and_roadmap.map((g, i) => (
              <li key={i} className="text-xs text-slate-400">→ {g}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Orchestrator + CDT side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <GoalPanel />
        <TwinPanel />
      </div>
    </div>
  );
}
