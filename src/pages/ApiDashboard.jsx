import React, { useEffect, useState } from 'react';
import { Shield, Server, Key, Activity, DollarSign, Database, Phone, CheckCircle, XCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export default function ApiDashboard() {
  const [apis, setApis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchApis() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/system/apis`);
        const data = await res.json();
        setApis(data.apis);
      } catch (err) {
        console.error('Failed to fetch APIs', err);
      } finally {
        setLoading(false);
      }
    }
    fetchApis();
  }, []);

  const totalEstimate = apis.reduce((acc, api) => acc + (api.monthly_estimate || 0), 0);
  
  const connectedCount = apis.filter(a => a.status === 'connected').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-700 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050810] text-slate-200 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex items-center justify-between border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Server className="w-8 h-8 text-amber-500" />
              API Intelligence Matrix
            </h1>
            <p className="text-slate-400 mt-2 font-mono text-sm tracking-wide">
              SUPER ADMIN / SYSTEM CONNECTIONS / BILLING
            </p>
          </div>
          <div className="text-right flex gap-6">
             <div>
                <p className="text-slate-500 text-xs font-mono mb-1">TOTAL CONNECTED</p>
                <p className="text-2xl text-white font-mono">{connectedCount} <span className="text-slate-500 text-sm">/ {apis.length}</span></p>
             </div>
             <div className="pl-6 border-l border-slate-800">
                <p className="text-slate-500 text-xs font-mono mb-1">EST. MONTHLY SPEND</p>
                <p className="text-2xl text-amber-500 font-mono">${totalEstimate.toFixed(2)}</p>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apis.map(api => (
            <div key={api.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 relative overflow-hidden group hover:border-slate-700 transition-colors">
              <div className="absolute top-0 right-0 p-4">
                {api.status === 'connected' ? (
                   <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : (
                   <XCircle className="w-5 h-5 text-rose-500" />
                )}
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
                  <span className={`text-sm font-mono uppercase px-2 py-1 rounded ${api.status === 'connected' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {api.status}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-t border-slate-800/50">
                  <span className="text-sm text-slate-400 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Est. Spend
                  </span>
                  <span className="text-sm font-mono text-white">
                    ${api.monthly_estimate.toFixed(2)}/mo
                  </span>
                </div>

                {api.models && (
                  <div className="pt-3 border-t border-slate-800/50">
                    <p className="text-xs text-slate-500 mb-2">Active Models</p>
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
          ))}
        </div>
      </div>
    </div>
  );
}
