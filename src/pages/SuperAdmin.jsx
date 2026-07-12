import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Brain, Activity, Users, DollarSign, AlertCircle, ArrowUpRight, Rocket, GraduationCap, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function SuperAdmin() {
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [intervening, setIntervening] = useState(null);

  useEffect(() => {
    fetchTelemetry();
  }, []);

  const fetchTelemetry = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/superadmin/telemetry`);
      if (res.ok) {
        setTelemetry(await res.json());
      }
    } catch (err) {
      console.error("Telemetry fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleIntervene = async (tenantId) => {
    setIntervening(tenantId);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/superadmin/intervene`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          message: "Deploy Jarvis for engagement assistance"
        })
      });
      if (res.ok) {
        alert("Jarvis has been dispatched to assist the customer.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIntervening(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center">
        <Activity className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050810] text-slate-200 font-sans p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Shield className="w-8 h-8 text-amber-500" />
              J. WORDEN HQ
            </h1>
            <p className="text-slate-400 mt-2">Global SaaS Telemetry & Engagement Interventions</p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/super-admin/apis" className="px-4 py-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-bold tracking-wider hover:bg-indigo-500/30 transition-colors">
              API MATRIX
            </Link>
            <div className="px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-300 tracking-wider">SYSTEM NOMINAL</span>
            </div>
          </div>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="w-5 h-5 text-green-500" />
              <span className="text-sm font-bold text-slate-400">Total MRR</span>
            </div>
            <div className="text-4xl font-black text-white">${(telemetry?.total_mrr || 0).toLocaleString()}</div>
          </div>
          
          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-bold text-slate-400">Active Tenants</span>
            </div>
            <div className="text-4xl font-black text-white">{telemetry?.active_tenants || 0}</div>
          </div>
          
          <div className="p-6 bg-slate-900/50 border border-red-500/30 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-[40px]" />
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-sm font-bold text-slate-400">Churn Risk</span>
            </div>
            <div className="text-4xl font-black text-white relative z-10">{telemetry?.churn_risk_count || 0}</div>
          </div>
        </div>

        {/* J. WORDEN UNIVERSITY (SPACEX THEMED MODULE) */}
        <div className="mb-12 relative overflow-hidden border border-slate-800 rounded-2xl bg-[#000000] p-8 shadow-[0_0_40px_rgba(255,255,255,0.05)]">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"></div>
           <div className="flex items-center justify-between mb-8">
              <div>
                 <h2 className="text-2xl font-black text-white tracking-widest uppercase flex items-center gap-3">
                    <Rocket className="w-6 h-6 text-slate-300" />
                    J. Worden University
                 </h2>
                 <p className="text-slate-400 font-mono text-sm mt-1 uppercase tracking-widest">Starbase Campus • Training & Certification</p>
              </div>
              <div className="text-right">
                 <p className="text-slate-500 font-mono text-xs mb-1">UNIVERSITY INCOME (YTD)</p>
                 <p className="text-3xl font-mono font-bold text-emerald-400">$214,500</p>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#111] border border-slate-800 rounded-lg p-5 hover:border-slate-600 transition-colors">
                 <div className="flex items-center gap-3 mb-3">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Recruits</span>
                 </div>
                 <div className="text-2xl font-mono text-white">128</div>
                 <div className="text-xs text-emerald-500 mt-2">↑ 12 this week</div>
              </div>

              <div className="bg-[#111] border border-slate-800 rounded-lg p-5 hover:border-slate-600 transition-colors">
                 <div className="flex items-center gap-3 mb-3">
                    <GraduationCap className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Course Completions</span>
                 </div>
                 <div className="text-2xl font-mono text-white">845</div>
                 <div className="text-xs text-slate-500 mt-2">Starship Class Subcontractors</div>
              </div>

              <div className="bg-[#111] border border-slate-800 rounded-lg p-5 hover:border-slate-600 transition-colors">
                 <div className="flex items-center gap-3 mb-3">
                    <FileCheck className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Certifications Issued</span>
                 </div>
                 <div className="text-2xl font-mono text-white">342</div>
                 <div className="text-xs text-slate-500 mt-2">OSHA & Advanced Paving</div>
              </div>
           </div>
        </div>

        {/* TENANT GRID */}
        <h2 className="text-xl font-bold text-white mb-6">SaaS Tenants</h2>
        <div className="bg-[#0a0f1c] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-slate-900/80 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Company</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Industry</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Users</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">MRR</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {telemetry?.tenants.map((t) => (
                <tr key={t.tenant_id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white">{t.company_name}</div>
                    <div className="text-xs text-slate-500">{t.tenant_id}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">{t.industry}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      t.subscription_tier === 'max' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' :
                      t.subscription_tier === 'pro' ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {t.subscription_tier}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-500" />
                      {t.user_count}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-green-400">${t.mrr_contribution}/mo</td>
                  <td className="px-6 py-4 text-right">
                    {t.user_count <= 1 && t.tenant_id !== 'default' ? (
                      <Button 
                        size="sm"
                        onClick={() => handleIntervene(t.tenant_id)}
                        disabled={intervening === t.tenant_id}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold"
                      >
                        <Brain className="w-4 h-4 mr-2" />
                        Deploy Jarvis
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="border-slate-700 text-slate-400 hover:text-white">
                        View Log <ArrowUpRight className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              
              {!telemetry?.tenants.length && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No active tenants found in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
