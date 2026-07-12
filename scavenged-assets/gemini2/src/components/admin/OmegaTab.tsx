/**
 * OmegaTab — JWORDENAI Omega Solidifier Command Panel
 * Three operational modules in one sovereign interface:
 *   1. Whale-Sense Financial Screener
 *   2. Drone-to-Plant Price Lock
 *   3. Voice Dispatcher (The Worden Voice)
 */
import { useState, useMemo } from 'react';
import {
  Zap, Shield, Mic, Lock, AlertTriangle, CheckCircle,
  XCircle, Search, Copy, ChevronDown, ChevronUp,
  TrendingUp, Clock,
} from 'lucide-react';
import {
  screenClient,
  lockMaterialPrice,
  PLANT_NETWORK,
  VOICE_RESPONSES,
  VOICE_CATEGORIES,
  searchVoiceResponses,
  type ClientData,
  type ClientTier,
  type VoiceCategory,
  MOBILIZATION_THRESHOLD,
} from '@/lib/omegaSolidifier';
import { fmt } from '@/lib/adminFmt';

// ─── helpers ─────────────────────────────────────────────────────────────────

const TIER_OPTIONS: ClientTier[] = ['🐋 Whale', '🦈 Shark', '🐟 Fish'];
const CLIENT_TYPES = ['Federal Agency', 'State DOT', 'National Chain', 'Municipal', 'Commercial', 'HOA', 'Individual'];
const STATE_CODES_SIMPLE = [
  'VA','MD','DC','DE','WV','NC','SC','GA','FL','AL','MS','TN','KY','AR','LA',
  'PA','NJ','NY','CT','RI','MA','VT','NH','ME','OH','MI','IN','WI','MN',
  'IL','MO','IA','KS','NE','SD','ND','OK','TX','NM','AZ','CO','UT','NV',
  'MT','WY','ID','WA','OR','CA','AK','HI',
];

type OmegaPanel = 'whale' | 'lock' | 'voice';

// ─── sub-components ───────────────────────────────────────────────────────────

function WhaleSensePanel() {
  const [form, setForm] = useState<ClientData>({
    name: '',
    riskScore: 3,
    tier: '🦈 Shark',
    projectValue: 50_000,
    stateCode: 'VA',
    clientType: 'Commercial',
    hasPriorRelationship: false,
    hasCurrentLien: false,
    creditDaysOutstanding: 0,
  });
  const [screened, setScreened] = useState(false);

  const result = useMemo(() => screened ? screenClient(form) : null, [screened, form]);

  function field<K extends keyof ClientData>(key: K, value: ClientData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setScreened(false);
  }

  const termsColor = result
    ? result.paymentTerms === 'STANDARD_TERMS' ? 'text-green-400 border-green-700'
    : result.paymentTerms === 'REQUIRE_50_PCT_MOBILIZATION' ? 'text-orange-400 border-orange-700'
    : result.paymentTerms === 'REQUIRE_FULL_PREPAY' ? 'text-red-400 border-red-700'
    : 'text-red-600 border-red-600'
    : '';

  const termsLabel = result
    ? result.paymentTerms === 'STANDARD_TERMS' ? 'Standard Net-30 Terms'
    : result.paymentTerms === 'REQUIRE_50_PCT_MOBILIZATION' ? '50% Mobilization Required'
    : result.paymentTerms === 'REQUIRE_FULL_PREPAY' ? 'Full Prepayment Required'
    : 'DECLINE — Senior Approval Needed'
    : '';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Input */}
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-gray-200 mb-2">Client Financial Profile</h3>
        <div className="bg-[#111] border border-gray-800 p-5 space-y-4">
          <div>
            <label className="text-xs font-black uppercase text-gray-300 mb-1 block">Client Name</label>
            <input value={form.name} onChange={(e) => field('name', e.target.value)} placeholder="e.g. KBP Foods LLC"
              className="w-full bg-gray-900 border border-gray-700 text-white text-sm p-2 font-bold focus:border-[#ffcc00] outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black uppercase text-gray-300 mb-1 block">Client Tier</label>
              <select value={form.tier} onChange={(e) => field('tier', e.target.value as ClientTier)}
                className="w-full bg-gray-900 border border-gray-700 text-white text-sm p-2 font-bold focus:border-[#ffcc00] outline-none">
                {TIER_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-black uppercase text-gray-300 mb-1 block">Client Type</label>
              <select value={form.clientType} onChange={(e) => field('clientType', e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-white text-sm p-2 font-bold focus:border-[#ffcc00] outline-none">
                {CLIENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-black uppercase text-gray-300 mb-1 block">
              Risk Score: <span className={form.riskScore > MOBILIZATION_THRESHOLD ? 'text-orange-400' : 'text-green-400'}>{form.riskScore} / 10</span>
            </label>
            <input type="range" min={0} max={10} value={form.riskScore} onChange={(e) => field('riskScore', Number(e.target.value))}
              className="w-full accent-[#ffcc00]" />
            <div className="flex justify-between text-xs text-gray-200 mt-1">
              <span>0 — Minimal</span><span>5 — Elevated</span><span>10 — Extreme</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black uppercase text-gray-300 mb-1 block">Project Value ($)</label>
              <input type="number" value={form.projectValue} min={0} onChange={(e) => field('projectValue', Number(e.target.value))}
                className="w-full bg-gray-900 border border-gray-700 text-white text-sm p-2 font-bold focus:border-[#ffcc00] outline-none" />
            </div>
            <div>
              <label className="text-xs font-black uppercase text-gray-300 mb-1 block">State</label>
              <select value={form.stateCode} onChange={(e) => field('stateCode', e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-white text-sm p-2 font-bold focus:border-[#ffcc00] outline-none">
                {STATE_CODES_SIMPLE.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-black uppercase text-gray-300 mb-1 block">Outstanding Invoice Days</label>
            <input type="number" value={form.creditDaysOutstanding} min={0} onChange={(e) => field('creditDaysOutstanding', Number(e.target.value))}
              className="w-full bg-gray-900 border border-gray-700 text-white text-sm p-2 font-bold focus:border-[#ffcc00] outline-none" />
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-300 cursor-pointer">
              <input type="checkbox" checked={form.hasPriorRelationship} onChange={(e) => field('hasPriorRelationship', e.target.checked)} className="accent-[#ffcc00]" />
              Prior Relationship
            </label>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-300 cursor-pointer">
              <input type="checkbox" checked={form.hasCurrentLien} onChange={(e) => field('hasCurrentLien', e.target.checked)} className="accent-[#ffcc00]" />
              Active Lien on File
            </label>
          </div>
          <button onClick={() => setScreened(true)}
            className="w-full py-3 bg-[#ffcc00] text-black font-black uppercase tracking-widest text-sm hover:bg-yellow-400 transition-colors">
            🧬 Run Whale-Sense Screen
          </button>
        </div>
      </div>

      {/* Result */}
      <div>
        {!result && (
          <div className="h-full flex items-center justify-center text-gray-200 font-bold text-center p-8">
            <div><Shield size={48} className="mx-auto mb-4 opacity-20" /><p>Enter client profile and run the screen.</p></div>
          </div>
        )}
        {result && (
          <div className="space-y-4">
            {/* Sovereign flags */}
            {result.sovereignFlags.length > 0 && (
              <div className="space-y-2">
                {result.sovereignFlags.map((f, i) => (
                  <div key={i} className="border border-red-600 bg-red-950/30 px-4 py-3 text-red-400 font-black text-sm">{f}</div>
                ))}
              </div>
            )}

            {/* Terms verdict */}
            <div className={`border ${termsColor} bg-opacity-10 px-5 py-4`}>
              <div className="text-xs text-gray-300 uppercase font-bold mb-1">Payment Terms Decision</div>
              <div className={`text-2xl font-black ${termsColor.split(' ')[0]}`}>{termsLabel}</div>
              {result.mobilizationAmountDue > 0 && (
                <div className="text-lg font-black text-white mt-1">
                  Mobilization Due: {fmt(result.mobilizationAmountDue)}
                </div>
              )}
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#111] border border-gray-800 p-4">
                <div className="text-xs text-gray-300 uppercase font-bold mb-1">Effective Risk Score</div>
                <div className={`text-3xl font-black ${result.riskScore > MOBILIZATION_THRESHOLD ? 'text-orange-400' : 'text-green-400'}`}>{result.riskScore}</div>
                <div className="text-xs text-gray-300">{result.riskLabel}</div>
              </div>
              <div className={`border p-4 ${result.approvedToProceed ? 'border-green-800 bg-green-950/10' : 'border-red-800 bg-red-950/10'}`}>
                <div className="text-xs text-gray-300 uppercase font-bold mb-1">Proceed?</div>
                <div className={`text-xl font-black flex items-center gap-2 ${result.approvedToProceed ? 'text-green-400' : 'text-red-400'}`}>
                  {result.approvedToProceed ? <CheckCircle size={18} /> : <XCircle size={18} />}
                  {result.approvedToProceed ? 'Approved' : 'Declined'}
                </div>
              </div>
            </div>

            {/* Rationale */}
            <div className="bg-[#111] border border-gray-800 p-4">
              <div className="text-xs text-gray-300 uppercase font-bold mb-2">Sovereign Rationale</div>
              <div className="space-y-1">
                {result.rationale.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                    <TrendingUp size={10} className="text-[#ffcc00] mt-0.5 shrink-0" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PriceLockPanel() {
  const [tonnage, setTonnage] = useState(250);
  const [stateCode, setStateCode] = useState('VA');
  const [locked, setLocked] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const result = useMemo(() => locked ? lockMaterialPrice(tonnage, stateCode) : null, [locked, tonnage, stateCode]);

  const availColor = (a: string) =>
    a === 'OPTIMAL' ? 'text-green-400' : a === 'MODERATE' ? 'text-yellow-400' : a === 'LIMITED' ? 'text-orange-400' : 'text-red-400';

  function copyLockId(id: string) {
    navigator.clipboard.writeText(id).catch(() => { /* clipboard unavailable in non-HTTPS or restricted contexts */ });
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Plant network status */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-gray-200 mb-3">Plant Network Status</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-gray-300 uppercase tracking-widest">
                <th className="text-left py-2 pr-4">Plant</th>
                <th className="text-left py-2 pr-4">Network</th>
                <th className="text-right py-2 pr-4">Market $/ton</th>
                <th className="text-right py-2 pr-4">Shielded $/ton</th>
                <th className="text-right py-2 pr-4">Wait</th>
                <th className="text-right py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {PLANT_NETWORK.map((p) => (
                <tr key={p.id} className="border-b border-gray-900 hover:bg-gray-900/30">
                  <td className="py-2 pr-4 font-bold text-white">{p.shortName}<div className="text-gray-300 text-xs">{p.location}</div></td>
                  <td className="py-2 pr-4 text-gray-200">{p.network}</td>
                  <td className="py-2 pr-4 text-right text-gray-200">${(p.currentPricePerTon).toFixed(2)}</td>
                  <td className="py-2 pr-4 text-right font-black text-[#ffcc00]">${p.shieldedPricePerTon.toFixed(2)}</td>
                  <td className="py-2 pr-4 text-right text-gray-200">{p.waitTimeMins} min</td>
                  <td className="py-2 text-right"><span className={`font-black ${availColor(p.availability)}`}>{p.availability}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lock form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-gray-200 mb-3">Lock Material Price</h3>
          <div className="bg-[#111] border border-gray-800 p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black uppercase text-gray-300 mb-1 block">Tonnage</label>
                <input type="number" value={tonnage} min={1} onChange={(e) => { setTonnage(Number(e.target.value)); setLocked(false); }}
                  className="w-full bg-gray-900 border border-gray-700 text-white text-sm p-2 font-bold focus:border-[#ffcc00] outline-none" />
              </div>
              <div>
                <label className="text-xs font-black uppercase text-gray-300 mb-1 block">Project State</label>
                <select value={stateCode} onChange={(e) => { setStateCode(e.target.value); setLocked(false); }}
                  className="w-full bg-gray-900 border border-gray-700 text-white text-sm p-2 font-bold focus:border-[#ffcc00] outline-none">
                  {STATE_CODES_SIMPLE.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <button onClick={() => setLocked(true)}
              className="w-full py-3 bg-[#ffcc00] text-black font-black uppercase tracking-widest text-sm hover:bg-yellow-400 transition-colors">
              🔒 Engage Price Lock — 48h Window
            </button>
          </div>
        </div>

        {/* Lock result */}
        {result && (
          <div className="space-y-4">
            {result.warningIfUnavailable && (
              <div className="border border-orange-700 bg-orange-950/20 px-4 py-3 text-orange-400 font-bold text-xs">
                <AlertTriangle size={12} className="inline mr-1" />{result.warningIfUnavailable}
              </div>
            )}
            <div className={`border ${result.locked ? 'border-[#ffcc00]/40 bg-[#ffcc00]/5' : 'border-gray-700 bg-gray-900/30'} px-5 py-4`}>
              <div className="flex items-center gap-2 mb-3">
                <Lock size={16} className={result.locked ? 'text-[#ffcc00]' : 'text-gray-200'} />
                <span className={`font-black text-sm uppercase ${result.locked ? 'text-[#ffcc00]' : 'text-gray-300'}`}>
                  {result.locked ? 'Price Locked ✓' : 'Lock Pending'}
                </span>
                <button onClick={() => copyLockId(result.lockId)} className="ml-auto text-gray-300 hover:text-white flex items-center gap-1 text-xs">
                  <Copy size={12} />{copiedId === result.lockId ? 'Copied!' : result.lockId}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><div className="text-gray-300 uppercase font-bold mb-0.5">Plant</div><div className="text-white font-bold">{result.plant.shortName}</div></div>
                <div><div className="text-gray-300 uppercase font-bold mb-0.5">Network</div><div className="text-gray-200">{result.plant.network}</div></div>
                <div><div className="text-gray-300 uppercase font-bold mb-0.5">Locked $/ton</div><div className="text-[#ffcc00] font-black">${result.pricePerTonLocked.toFixed(2)}</div></div>
                <div><div className="text-gray-300 uppercase font-bold mb-0.5">Tonnage</div><div className="text-white font-black">{result.tonnage} tons</div></div>
                <div className="col-span-2">
                  <div className="text-gray-300 uppercase font-bold mb-0.5">Total Material Cost</div>
                  <div className="text-2xl font-black text-white">{fmt(result.totalMaterialCost)}</div>
                  <div className="text-xs text-green-400 mt-0.5">Oil Shield Applied: {fmt(result.oilShieldApplied)} protection</div>
                </div>
                <div className="col-span-2 flex items-center gap-2 text-xs text-gray-200">
                  <Clock size={12} className="text-[#ffcc00]" />
                  Lock expires: <span className="text-white font-bold">{result.expiresLabel}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function VoiceDispatcherPanel() {
  const [activeCategory, setActiveCategory] = useState<VoiceCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const displayed = useMemo(() => {
    let base = searchQuery.length >= 2 ? searchVoiceResponses(searchQuery) : VOICE_RESPONSES;
    if (activeCategory !== 'all') base = base.filter((r) => r.category === activeCategory);
    return base;
  }, [activeCategory, searchQuery]);

  function copyScript(id: string, script: string) {
    navigator.clipboard.writeText(script).catch(() => { /* clipboard unavailable in non-HTTPS or restricted contexts */ });
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  }

  const toneColor = (tone: string) =>
    tone.includes('Authority') ? 'text-[#ffcc00]' :
    tone.includes('Premium') ? 'text-blue-400' :
    tone.includes('Urgent') ? 'text-red-400' :
    tone.includes('Technical') ? 'text-purple-400' :
    'text-gray-200';

  return (
    <div className="space-y-6">
      {/* Search + filter */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[220px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search triggers, scripts, specs…"
            className="w-full bg-gray-900 border border-gray-700 text-white text-sm pl-9 pr-3 py-2 font-bold focus:border-[#ffcc00] outline-none"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 text-xs font-black uppercase ${activeCategory === 'all' ? 'bg-[#ffcc00] text-black' : 'border border-gray-700 text-gray-200 hover:border-gray-500'}`}
        >
          All ({VOICE_RESPONSES.length})
        </button>
        {VOICE_CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => setActiveCategory(c.id)}
            className={`px-3 py-1.5 text-xs font-black uppercase flex items-center gap-1 ${activeCategory === c.id ? 'bg-[#ffcc00] text-black' : 'border border-gray-700 text-gray-200 hover:border-gray-500'}`}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* Response cards */}
      <div className="space-y-3">
        {displayed.length === 0 && (
          <div className="text-center text-gray-200 py-8 font-bold">No responses match that query.</div>
        )}
        {displayed.map((r) => {
          const isExpanded = expandedId === r.id;
          return (
            <div key={r.id} className="border border-gray-800 hover:border-gray-700 transition-colors">
              <button
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
                className="w-full flex items-start justify-between px-5 py-4 text-left"
              >
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-black text-sm">{r.subject}</span>
                    <span className={`text-xs font-bold uppercase ${toneColor(r.tone)}`}>{r.tone}</span>
                  </div>
                  <div className="text-xs text-gray-300 italic">{r.trigger}</div>
                </div>
                {isExpanded ? <ChevronUp size={16} className="text-gray-300 shrink-0 mt-1" /> : <ChevronDown size={16} className="text-gray-300 shrink-0 mt-1" />}
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 border-t border-gray-800 space-y-4 pt-4">
                  {/* Script */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black uppercase text-gray-200 flex items-center gap-1">
                        <Mic size={12} className="text-[#ffcc00]" /> The Worden Voice
                      </span>
                      <button onClick={() => copyScript(r.id, r.script + '\n\n' + r.closingLine)}
                        className="flex items-center gap-1 text-xs text-gray-300 hover:text-white font-bold">
                        <Copy size={11} />{copiedId === r.id ? '✅ Copied!' : 'Copy Script'}
                      </button>
                    </div>
                    <blockquote className="text-sm text-gray-200 leading-relaxed border-l-4 border-[#ffcc00] pl-4">
                      {r.script}
                    </blockquote>
                    <p className="text-sm text-[#ffcc00] font-black italic mt-3 pl-4">"{r.closingLine}"</p>
                  </div>
                  {/* Spec reference */}
                  <div className="flex items-center gap-2 text-xs text-gray-300 font-mono border-t border-gray-800 pt-2">
                    <Shield size={11} className="text-[#ffcc00]" />
                    <span>{r.spec}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tone reference footer */}
      <div className="p-4 bg-[#111] border border-gray-800 text-xs">
        <div className="text-gray-200 font-black uppercase mb-2 flex items-center gap-2">
          <Mic size={12} className="text-[#ffcc00]" /> Worden Voice Protocol
        </div>
        <p className="text-gray-300">Tone: <span className="text-[#ffcc00] font-black">Premium / Authority / 4th-Generation Legacy</span> — Never defensive. Never apologetic. Always specific. Always cite the spec.</p>
      </div>
    </div>
  );
}

// ─── Main exported component ─────────────────────────────────────────────────

export function OmegaTab() {
  const [panel, setPanel] = useState<OmegaPanel>('whale');

  const PANELS: Array<{ id: OmegaPanel; label: string; icon: React.ReactNode }> = [
    { id: 'whale', label: 'Whale-Sense Screener', icon: <Shield size={14} /> },
    { id: 'lock', label: 'Drone-Plant Price Lock', icon: <Lock size={14} /> },
    { id: 'voice', label: 'Voice Dispatcher', icon: <Mic size={14} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black uppercase text-white flex items-center gap-2">
            <Zap size={20} className="text-[#ffcc00]" /> Omega Solidifier — Sovereign v2.0
          </h2>
          <p className="text-gray-300 text-xs mt-1">
            Whale-Sense · Drone-Plant Sync · Voice Dispatch · 50-State Dominance Confirmed.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-green-400 font-black uppercase">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Omega Modules Online
        </div>
      </div>

      {/* Module selector */}
      <div className="flex gap-2 border-b border-gray-800 pb-0">
        {PANELS.map((p) => (
          <button key={p.id} onClick={() => setPanel(p.id)}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-wider transition-colors ${
              panel === p.id
                ? 'text-[#ffcc00] border-b-2 border-[#ffcc00]'
                : 'text-gray-300 hover:text-gray-300'
            }`}
          >
            {p.icon}{p.label}
          </button>
        ))}
      </div>

      {/* Module descriptions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { id: 'whale' as OmegaPanel, icon: '🧬', label: 'Whale-Sense', desc: 'Cross-reference client financial risk against Sovereign profile. Auto-set payment terms.', stat: `Threshold: ${MOBILIZATION_THRESHOLD}/10` },
          { id: 'lock' as OmegaPanel, icon: '🔒', label: 'Drone-Plant Lock', desc: 'Lock material tonnage price via AEI-Richmond or Universal-Broker. 48h price hold.', stat: '$9/ton oil shield active' },
          { id: 'voice' as OmegaPanel, icon: '🎙️', label: 'Worden Voice', desc: 'Premium authority response library. VDOT, Sunday Standard, competitor filter, warranty.', stat: `${VOICE_RESPONSES.length} sovereign responses` },
        ].map((m) => (
          <button key={m.id} onClick={() => setPanel(m.id)}
            className={`text-left border p-4 transition-colors ${panel === m.id ? 'border-[#ffcc00]/50 bg-[#ffcc00]/5' : 'border-gray-800 hover:border-gray-700'}`}>
            <div className="text-2xl mb-2">{m.icon}</div>
            <div className="text-white font-black text-sm mb-1">{m.label}</div>
            <p className="text-gray-300 text-xs leading-snug">{m.desc}</p>
            <div className="mt-2 text-xs font-black text-[#ffcc00]">{m.stat}</div>
          </button>
        ))}
      </div>

      {/* Active panel */}
      <div className="border border-gray-800 p-6">
        {panel === 'whale' && <WhaleSensePanel />}
        {panel === 'lock' && <PriceLockPanel />}
        {panel === 'voice' && <VoiceDispatcherPanel />}
      </div>

      {/* Footer brand */}
      <div className="text-center text-xs text-gray-700 font-black uppercase tracking-widest py-2">
        JWORDENAI · Omega Modules Initialized · 50-State Dominance Confirmed · 4th Generation Since 1984
      </div>
    </div>
  );
}
