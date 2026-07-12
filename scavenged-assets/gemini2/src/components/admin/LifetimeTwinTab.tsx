/**
 * LifetimeTwinTab — JWORDENAI Asset Mirror Job Ledger + Maintenance Ping Engine
 * Stores completed jobs and auto-generates 1/3/5/12-year maintenance revenue pings.
 */
import { useState, useMemo } from 'react';
import { Archive, Bell, CheckCircle, AlertTriangle, TrendingUp, Plus, Mail } from 'lucide-react';
import {
  DEMO_JOBS,
  generateMaintenancePings,
  ledgerLifetimeSummary,
  calcLifetimeRevenue,
  type CompletedJob,
  type MaintenanceWindow,
} from '@/lib/industrialDigitalTwin';
import { fmtInt as fmt } from '@/lib/adminFmt';

const windowLabels: Record<MaintenanceWindow, string> = {
  year1: '1-Yr Check',
  year3: '3-Yr Sealcoat',
  year5: '5-Yr Resurface',
  year12: '12-Yr Reconstruct',
};

const windowColors: Record<MaintenanceWindow, string> = {
  year1: 'text-blue-400 border-blue-700 bg-blue-950/20',
  year3: 'text-[#ffcc00] border-yellow-700 bg-yellow-950/10',
  year5: 'text-orange-400 border-orange-700 bg-orange-950/20',
  year12: 'text-red-400 border-red-700 bg-red-950/20',
};

const BLANK_JOB: Omit<CompletedJob, 'id'> = {
  clientName: '', clientEmail: '', clientPhone: '',
  propertyAddress: '', city: '', stateCode: 'VA',
  serviceType: 'asphalt-new', sqFt: 0, tonsUsed: 0,
  sealerBrand: 'Neyra STAR Sealcoat',
  baseDepthIn: 6, surfaceDepthIn: 2,
  compactionPct: 97.0, weatherAtPour: '', ambientTempF: 70, groundTempF: 64,
  asphaltMixSpec: 'SM-9.5A / BM-25.0 VDOT Sec 315',
  stoneBaseSpec: '21A Crusher Run VDOT 303',
  completionDate: new Date().toISOString().slice(0, 10),
  contractValue: 0, crew: '', foreman: '', notes: '', photos: [],
};

export function LifetimeTwinTab() {
  const [jobs, setJobs] = useState<CompletedJob[]>(DEMO_JOBS);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newJob, setNewJob] = useState<Omit<CompletedJob, 'id'>>(BLANK_JOB);
  const [selectedPing, setSelectedPing] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'ledger' | 'pings'>('pings');

  const pings = useMemo(() => generateMaintenancePings(jobs), [jobs]);
  const summary = useMemo(() => ledgerLifetimeSummary(jobs), [jobs]);

  function addJob() {
    const id = `JW-${new Date().getFullYear()}-${String(jobs.length + 1).padStart(3, '0')}`;
    setJobs((prev) => [...prev, { ...newJob, id }]);
    setNewJob(BLANK_JOB);
    setShowAddForm(false);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black uppercase text-white flex items-center gap-2">
          <Archive size={20} className="text-[#ffcc00]" /> JWORDENAI Asset Mirror — Lifetime Revenue Engine
        </h2>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-[#ffcc00] text-black font-black text-xs uppercase hover:bg-yellow-400 transition-colors"
        >
          <Plus size={14} /> Log Completed Job
        </button>
      </div>

      {/* Lifetime KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111] border border-gray-800 p-4">
          <div className="text-xs text-gray-300 uppercase font-bold mb-1">Jobs in Ledger</div>
          <div className="text-3xl font-black text-white">{summary.totalJobs}</div>
        </div>
        <div className="bg-[#111] border border-gray-800 p-4">
          <div className="text-xs text-gray-300 uppercase font-bold mb-1">Total Contract Value</div>
          <div className="text-3xl font-black text-[#ffcc00]">{fmt(summary.totalContractValue)}</div>
        </div>
        <div className="bg-[#111] border border-green-800 bg-green-950/10 p-4">
          <div className="text-xs text-gray-300 uppercase font-bold mb-1">Projected Lifetime Revenue</div>
          <div className="text-3xl font-black text-green-400">{fmt(summary.projectedLifetimeRevenue)}</div>
          <div className="text-xs text-gray-300 mt-0.5">{summary.lifetimeMultiplier}× multiplier</div>
        </div>
        <div className="bg-[#111] border border-[#ffcc00]/40 p-4">
          <div className="text-xs text-gray-300 uppercase font-bold mb-1">Active Maintenance Pings</div>
          <div className="text-3xl font-black text-[#ffcc00]">{pings.length}</div>
          <div className="text-xs text-gray-300">{pings.filter((p) => p.isOverdue).length} overdue</div>
        </div>
      </div>

      {/* Add job form */}
      {showAddForm && (
        <div className="bg-[#111] border border-[#ffcc00]/40 p-5">
          <h3 className="text-sm font-black uppercase tracking-wider text-gray-300 mb-4">Log New Completed Job</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {[
              { key: 'clientName', label: 'Client Name', type: 'text' },
              { key: 'clientEmail', label: 'Client Email', type: 'email' },
              { key: 'propertyAddress', label: 'Property Address', type: 'text' },
              { key: 'city', label: 'City', type: 'text' },
              { key: 'stateCode', label: 'State Code', type: 'text' },
              { key: 'contractValue', label: 'Contract Value ($)', type: 'number' },
              { key: 'sqFt', label: 'Square Footage', type: 'number' },
              { key: 'tonsUsed', label: 'Tons Used', type: 'number' },
              { key: 'compactionPct', label: 'Compaction %', type: 'number' },
              { key: 'completionDate', label: 'Completion Date', type: 'date' },
              { key: 'foreman', label: 'Foreman', type: 'text' },
              { key: 'sealerBrand', label: 'Sealer Brand', type: 'text' },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="text-gray-300 uppercase font-bold mb-1 block">{label}</label>
                <input
                  type={type}
                  value={String((newJob as Record<string, unknown>)[key] ?? '')}
                  onChange={(e) => setNewJob((prev) => ({ ...prev, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 text-white text-sm p-2 font-bold focus:border-[#ffcc00] outline-none"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={addJob} className="px-6 py-2 bg-[#ffcc00] text-black font-black text-xs uppercase">
              ✅ Save Job to Ledger
            </button>
            <button onClick={() => setShowAddForm(false)} className="px-6 py-2 bg-gray-800 text-gray-200 font-black text-xs uppercase">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* View toggle */}
      <div className="flex gap-1 border-b border-gray-800">
        {(['pings', 'ledger'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setActiveView(v)}
            className={`px-5 py-3 text-xs font-black uppercase tracking-wider ${activeView === v ? 'text-[#ffcc00] border-b-2 border-[#ffcc00]' : 'text-gray-300 hover:text-gray-300'}`}
          >
            {v === 'pings' ? `🔔 Maintenance Pings (${pings.length})` : `📋 Job Ledger (${jobs.length})`}
          </button>
        ))}
      </div>

      {/* Maintenance Pings */}
      {activeView === 'pings' && (
        <div className="space-y-4">
          {pings.length === 0 && (
            <div className="text-center text-gray-200 py-12 font-bold">No maintenance pings within range. All jobs are either too new or too far out.</div>
          )}
          {pings.map((ping) => {
            const cfg = windowColors[ping.window];
            const isExpanded = selectedPing === ping.jobId + ping.window;
            return (
              <div key={ping.jobId + ping.window} className={`border ${cfg} px-4 py-4`}>
                <div
                  className="flex items-start justify-between cursor-pointer"
                  onClick={() => setSelectedPing(isExpanded ? null : ping.jobId + ping.window)}
                >
                  <div className="flex items-start gap-3">
                    <Bell size={16} className={ping.isOverdue ? 'text-red-400 animate-pulse' : 'text-[#ffcc00]'} />
                    <div>
                      <div className="text-white font-black text-sm">{ping.clientName}</div>
                      <div className="text-gray-300 text-xs mt-0.5">{ping.propertyAddress} · Job {ping.jobId}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-black border px-2 py-0.5 ${cfg}`}>
                      {windowLabels[ping.window]}
                    </div>
                    <div className={`text-xs font-bold mt-1 ${ping.isOverdue ? 'text-red-400' : 'text-gray-200'}`}>
                      {ping.isOverdue ? `⚠️ ${Math.abs(ping.daysUntil)}d overdue` : `${ping.daysUntil}d away`}
                    </div>
                    <div className="text-[#ffcc00] font-black text-sm mt-1">{fmt(ping.estimatedRevenue)}</div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 border-t border-gray-700 pt-4 space-y-3">
                    <div className="text-xs text-gray-200 font-bold">Recommended Action:</div>
                    <p className="text-sm text-white">{ping.recommendedAction}</p>
                    <div className="text-xs text-gray-200 font-bold flex items-center gap-1">
                      <Mail size={12} /> Auto-Ping Message:
                    </div>
                    <div className="bg-gray-900/60 p-3 text-xs text-gray-300 leading-relaxed font-mono border border-gray-700">
                      {ping.pingMessage}
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#ffcc00] text-black font-black text-xs uppercase hover:bg-yellow-400">
                      <Mail size={12} /> Send Ping Now
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Job Ledger */}
      {activeView === 'ledger' && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-gray-300 uppercase tracking-widest">
                <th className="text-left py-3 pr-4">Job ID</th>
                <th className="text-left py-3 pr-4">Client</th>
                <th className="text-left py-3 pr-4">Location</th>
                <th className="text-left py-3 pr-4">Completed</th>
                <th className="text-right py-3 pr-4">Contract</th>
                <th className="text-right py-3 pr-4">Lifetime Value</th>
                <th className="text-right py-3">Compaction</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const ltv = calcLifetimeRevenue(job);
                const compOk = job.compactionPct >= 96;
                return (
                  <tr key={job.id} className="border-b border-gray-900 hover:bg-gray-900/30 transition-colors">
                    <td className="py-3 pr-4 font-black text-[#ffcc00]">{job.id}</td>
                    <td className="py-3 pr-4">
                      <div className="text-white font-bold">{job.clientName}</div>
                      <div className="text-gray-300">{job.serviceType}</div>
                    </td>
                    <td className="py-3 pr-4 text-gray-200">{job.city}, {job.stateCode}</td>
                    <td className="py-3 pr-4 text-gray-200">{new Date(job.completionDate).toLocaleDateString()}</td>
                    <td className="py-3 pr-4 text-right font-black text-white">{fmt(job.contractValue)}</td>
                    <td className="py-3 pr-4 text-right font-black text-green-400">{fmt(ltv)}</td>
                    <td className="py-3 text-right">
                      {job.compactionPct > 0 ? (
                        <span className={`font-black flex items-center justify-end gap-1 ${compOk ? 'text-green-400' : 'text-red-400'}`}>
                          {compOk ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                          {job.compactionPct}%
                        </span>
                      ) : <span className="text-gray-200">N/A</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-4 p-3 border border-[#ffcc00]/30 bg-[#ffcc00]/5 flex items-center gap-2 text-xs text-[#ffcc00] font-black">
            <TrendingUp size={14} />
            Total Contract Value: {fmt(summary.totalContractValue)} →
            Projected Lifetime Revenue: {fmt(summary.projectedLifetimeRevenue)} ({summary.lifetimeMultiplier}× multiplier via recurring maintenance)
          </div>
        </div>
      )}
    </div>
  );
}
