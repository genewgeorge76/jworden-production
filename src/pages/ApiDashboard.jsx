import React, { useEffect, useState } from 'react';
import { Server, Key, Activity, Database, Phone, DollarSign, CheckCircle, XCircle, AlertTriangle, HelpCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Status vocabulary from GET /api/v1/system/apis.
 *
 * The distinction this dashboard exists to draw is between "we asked the
 * provider and it answered" and "a key is set in the environment". Those used
 * to render identically, as a green tick, which is how a revoked OpenAI key
 * sat on this page showing connected while every call behind it was failing.
 *
 * `configured` is deliberately amber, not green: a key is present and nobody
 * has checked whether it works.
 */
const STATUS_STYLES = {
  live:                { label: 'LIVE',            icon: CheckCircle,   pill: 'bg-emerald-500/10 text-emerald-400', mark: 'text-emerald-500' },
  configured:          { label: 'KEY SET',         icon: HelpCircle,    pill: 'bg-amber-500/10 text-amber-400',     mark: 'text-amber-500'   },
  unverified:          { label: 'UNVERIFIED',      icon: HelpCircle,    pill: 'bg-slate-500/10 text-slate-400',     mark: 'text-slate-500'   },
  not_configured:      { label: 'NO KEY',          icon: XCircle,       pill: 'bg-slate-500/10 text-slate-400',     mark: 'text-slate-600'   },
  invalid_credentials: { label: 'KEY REJECTED',    icon: AlertTriangle, pill: 'bg-rose-500/10 text-rose-400',       mark: 'text-rose-500'    },
  degraded:            { label: 'DEGRADED',        icon: AlertTriangle, pill: 'bg-rose-500/10 text-rose-400',       mark: 'text-rose-500'    },
  unreachable:         { label: 'UNREACHABLE',     icon: AlertTriangle, pill: 'bg-rose-500/10 text-rose-400',       mark: 'text-rose-500'    },
};

const FALLBACK_STYLE = STATUS_STYLES.unverified;

export default function ApiDashboard() {
  const [apis, setApis] = useState([]);
  const [summary, setSummary] = useState(null);
  const [spend, setSpend] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchApis() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/system/apis`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setApis(Array.isArray(data.apis) ? data.apis : []);
        setSummary(data.summary || null);
        setSpend(data.spend || null);
      } catch (err) {
        console.error('Failed to fetch APIs', err);
        setError(err.message || 'Request failed');
      } finally {
        setLoading(false);
      }
    }
    fetchApis();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-700 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const failing = summary?.failing ?? 0;

  return (
    <div className="min-h-screen bg-[#050810] text-slate-200 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex flex-wrap gap-6 items-center justify-between border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Server className="w-8 h-8 text-amber-500" />
              API Intelligence Matrix
            </h1>
            <p className="text-slate-400 mt-2 font-mono text-sm tracking-wide">
              SUPER ADMIN / SYSTEM CONNECTIONS
            </p>
          </div>
          <div className="text-right flex gap-6">
            <div>
              <p className="text-slate-500 text-xs font-mono mb-1">PROBED LIVE</p>
              <p className="text-2xl text-white font-mono">
                {summary?.live ?? 0} <span className="text-slate-500 text-sm">/ {summary?.total ?? apis.length}</span>
              </p>
            </div>
            <div className="pl-6 border-l border-slate-800">
              <p className="text-slate-500 text-xs font-mono mb-1">FAILING</p>
              <p className={`text-2xl font-mono ${failing > 0 ? 'text-rose-400' : 'text-slate-600'}`}>{failing}</p>
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-8 rounded-lg border border-rose-800/60 bg-rose-500/5 p-4 text-sm text-rose-300">
            Could not load integration status: {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apis.map(api => {
            const style = STATUS_STYLES[api.status] || FALLBACK_STYLE;
            const Mark = style.icon;
            return (
              <div key={api.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 relative overflow-hidden group hover:border-slate-700 transition-colors">
                <div className="absolute top-0 right-0 p-4">
                  <Mark className={`w-5 h-5 ${style.mark}`} />
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-slate-800 rounded-lg">
                    {api.category === 'ai' && <Database className="w-5 h-5 text-indigo-400" />}
                    {api.category === 'comms' && <Phone className="w-5 h-5 text-sky-400" />}
                    {api.category === 'finance' && <DollarSign className="w-5 h-5 text-emerald-400" />}
                    {api.category === 'infra' && <Server className="w-5 h-5 text-slate-400" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{api.name}</h3>
                    <p className="text-xs text-slate-500 uppercase tracking-widest">{api.category}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-t border-slate-800/50">
                    <span className="text-sm text-slate-400 flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      Status
                    </span>
                    <span className={`text-sm font-mono uppercase px-2 py-1 rounded ${style.pill}`}>
                      {style.label}
                    </span>
                  </div>

                  {api.detail && (
                    <p className="text-xs text-slate-500 leading-relaxed">{api.detail}</p>
                  )}

                  <div className="flex justify-between items-center py-2 border-t border-slate-800/50 text-xs font-mono text-slate-500">
                    <span className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      {api.checked || 'not checked'}
                    </span>
                    {api.latency_ms != null && <span>{api.latency_ms} ms</span>}
                  </div>

                  {api.models && (
                    <div className="pt-3 border-t border-slate-800/50">
                      <p className="text-xs text-slate-500 mb-2">Configured Models</p>
                      <div className="flex flex-wrap gap-2">
                        {api.models.map(m => (
                          <span key={m} className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-slate-300">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {spend?.note && (
          <p className="mt-10 pt-6 border-t border-slate-800 text-xs text-slate-500 font-mono leading-relaxed">
            SPEND: {spend.note}
          </p>
        )}
      </div>
    </div>
  );
}
