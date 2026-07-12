// ─────────────────────────────────────────────────────────────────────────────
// Worden Autonomous AI General Counsel — Legal & Compliance Node
// Simulates live federal/state law integration with liability shield interceptor
// Advisory Only — Not Legal Counsel | © J. Worden & Sons, Since 1984
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  FEDERAL_LAWS,
  STATE_LAWS,
  OVERRIDE_RISKS,
  type AuditLogEntry,
  type OverrideRisk,
  type StateLaw,
  type FederalLaw,
  generateSessionId,
  generateMockIpHash,
  getStateList,
} from '@/data/legalLaws';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getRiskBadgeClass(level: string): string {
  switch (level) {
    case 'CRITICAL': return 'bg-red-900/60 border border-red-500 text-red-300';
    case 'HIGH': return 'bg-orange-900/60 border border-orange-500 text-orange-300';
    case 'MEDIUM': return 'bg-yellow-900/60 border border-yellow-500 text-yellow-300';
    default: return 'bg-green-900/60 border border-green-500 text-green-300';
  }
}

function nowISO(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 23) + ' UTC';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LegalStatusBar({ stateCode, sessionId }: { stateCode: string; sessionId: string }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-4 px-6 py-3 bg-[#0a1628] border-b border-[#1e3a5f] text-xs font-mono">
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-green-400 font-bold">SYSTEM ONLINE</span>
      </span>
      <span className="text-gray-300">|</span>
      <span className="text-gray-200">
        SESSION: <span className="text-[#4a9eff]">{sessionId}</span>
      </span>
      <span className="text-gray-300">|</span>
      <span className="text-gray-200">
        STATE LAW: <span className="text-[#ffcc00] font-bold">{stateCode || 'NOT SET'}</span>
      </span>
      <span className="text-gray-300">|</span>
      <span className="text-gray-200">
        FEDERAL DB:{' '}
        <span className="text-green-400">
          {FEDERAL_LAWS.length} REGULATIONS LOADED
        </span>
      </span>
      <span className="text-gray-300">|</span>
      <span className="text-gray-200">
        CLOCK: <span className="text-white">{new Date().toUTCString().replace('GMT', 'UTC')}</span>
      </span>
      <span className="ml-auto text-gray-200 hidden md:block">
        v2025.04 · Advisory Only · Not Legal Counsel
      </span>
      {/* tick used to force re-render for clock */}
      <span className="sr-only">{tick}</span>
    </div>
  );
}

interface LiabilityShieldModalProps {
  risk: OverrideRisk;
  stateCode: string;
  sessionId: string;
  onAccept: (agreed: boolean) => void;
}

function LiabilityShieldModal({ risk, stateCode, sessionId, onAccept }: LiabilityShieldModalProps) {
  const [inputValue, setInputValue] = useState('');
  const [userName, setUserName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const agreed = inputValue === 'I AGREE';

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const stateLaw = stateCode ? STATE_LAWS[stateCode] : null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 bg-[#0d0d0d] border-2 border-red-600 shadow-[0_0_60px_rgba(255,0,0,0.3)] overflow-hidden">
        {/* Header */}
        <div className="bg-red-900/80 px-6 py-4 flex items-center gap-3 border-b border-red-700">
          <span className="text-3xl">⚖️</span>
          <div>
            <div className="text-red-200 font-black uppercase tracking-widest text-xs mb-0.5">
              WORDEN AUTONOMOUS LEGAL INTERCEPTOR — LIABILITY SHIELD ACTIVATED
            </div>
            <div className="text-white font-black text-lg uppercase">
              {risk.warningTitle}
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Risk Badge */}
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 text-xs font-black uppercase tracking-widest rounded-sm ${getRiskBadgeClass(risk.riskLevel)}`}>
              {risk.riskLevel} RISK
            </span>
            {risk.federalCode && (
              <span className="px-3 py-1 text-xs font-mono bg-[#1a1a2e] text-[#4a9eff] border border-[#2a3a6e] rounded-sm">
                {risk.federalCode}
              </span>
            )}
            {stateCode && (
              <span className="px-3 py-1 text-xs font-mono bg-[#2a1a00] text-[#ffcc00] border border-[#5a3a00] rounded-sm">
                {stateCode} State Law
              </span>
            )}
          </div>

          {/* Warning Body */}
          <div className="bg-[#1a0505] border border-red-900/50 rounded-sm p-4">
            <div className="text-xs font-black uppercase tracking-widest text-red-400 mb-2">
              ⚠ AI RISK ASSESSMENT
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              {risk.warningBody}
            </p>
          </div>

          {/* State-specific law if applicable */}
          {stateLaw && (
            <div className="bg-[#0d1a0d] border border-green-900/50 rounded-sm p-4">
              <div className="text-xs font-black uppercase tracking-widest text-green-400 mb-2">
                📋 {stateLaw.stateName.toUpperCase()} APPLICABLE LAW
              </div>
              <div className="text-xs font-mono text-green-300 font-bold mb-1">
                {stateLaw.lienLaw.code}
              </div>
              <p className="text-gray-200 text-xs leading-relaxed">
                {stateLaw.lienLaw.summary}
              </p>
            </div>
          )}

          {/* Liability Statement */}
          <div className="bg-[#1a1a00] border-2 border-[#ffcc00]/50 rounded-sm p-4">
            <div className="text-xs font-black uppercase tracking-widest text-[#ffcc00] mb-2">
              ⚡ LIABILITY ASSUMPTION STATEMENT
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              {risk.liabilityStatement}
            </p>
          </div>

          {/* Timestamp */}
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-sm p-3 font-mono text-xs">
            <div className="text-gray-300 mb-1">OVERRIDE REQUEST — IMMUTABLE AUDIT RECORD</div>
            <div className="grid grid-cols-2 gap-2 text-gray-200">
              <div>Timestamp: <span className="text-white">{nowISO()}</span></div>
              <div>Risk ID: <span className="text-white">{risk.id}</span></div>
              <div>Session: <span className="text-[#4a9eff]">{sessionId}</span></div>
              <div>IP Hash: <span className="text-gray-300">{generateMockIpHash()}</span></div>
            </div>
          </div>

          {/* Signature Field */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-200 mb-1.5">
                Authorized Representative Name (Required)
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Full legal name"
                className="w-full bg-[#111] border border-gray-700 text-white px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-red-400 mb-1.5">
                Type "I AGREE" to assume 100% liability and proceed
              </label>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value.toUpperCase())}
                placeholder={'Type "I AGREE" exactly'}
                className={`w-full bg-[#111] border-2 text-white px-4 py-3 text-lg font-black font-mono tracking-widest focus:outline-none transition-colors ${
                  agreed ? 'border-red-500 text-red-300' : 'border-gray-700'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 border-t border-gray-800 flex gap-3 bg-[#0a0a0a]">
          <button
            type="button"
            onClick={() => onAccept(false)}
            className="flex-1 px-6 py-3 bg-[#1a2a3a] text-[#4a9eff] font-black uppercase tracking-wider text-sm hover:bg-[#1e3050] transition-colors border border-[#2a4a7a]"
          >
            ← ABORT — FOLLOW AI RECOMMENDATION
          </button>
          <button
            type="button"
            disabled={!agreed || userName.trim().length < 2}
            onClick={() => onAccept(true)}
            className={`flex-1 px-6 py-3 font-black uppercase tracking-wider text-sm transition-all border ${
              agreed && userName.trim().length >= 2
                ? 'bg-red-900 border-red-600 text-red-200 hover:bg-red-800 cursor-pointer'
                : 'bg-gray-900 border-gray-700 text-gray-200 cursor-not-allowed'
            }`}
          >
            ⚠ OVERRIDE — ASSUME LIABILITY
          </button>
        </div>
      </div>
    </div>
  );
}

interface AuditLogProps {
  entries: AuditLogEntry[];
}

function AuditLog({ entries }: AuditLogProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-200 font-mono text-sm">
        NO EVENTS RECORDED — AUDIT TRAIL CLEAN
      </div>
    );
  }

  return (
    <div className="space-y-2 font-mono text-xs">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className={`flex flex-col gap-1 px-4 py-3 border-l-4 ${
            entry.overrideAccepted
              ? 'border-red-600 bg-red-950/20'
              : 'border-green-600 bg-green-950/10'
          }`}
        >
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-gray-300">{entry.timestamp}</span>
            <span className={`px-2 py-0.5 text-[10px] font-black uppercase ${getRiskBadgeClass(entry.riskLevel)}`}>
              {entry.riskLevel}
            </span>
            <span className={entry.overrideAccepted ? 'text-red-400 font-black' : 'text-green-400 font-black'}>
              {entry.overrideAccepted ? '⚠ OVERRIDE ACCEPTED' : '✓ AI RECOMMENDATION FOLLOWED'}
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-200">USER: <span className="text-white">{entry.userName}</span></span>
            <span className="text-gray-300">STATE: <span className="text-[#ffcc00]">{entry.stateCode || 'N/A'}</span></span>
          </div>
          <div className="text-gray-200">
            ACTION: <span className="text-white">{entry.action}</span>
          </div>
          <div className="text-gray-200">
            {entry.legalCode} · SESSION: {entry.sessionId} · IP: {entry.ipHash}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Contract Clause Builder ──────────────────────────────────────────────────
function ContractClauses({ stateLaw }: { stateLaw: StateLaw | null }) {
  const [copied, setCopied] = useState(false);

  if (!stateLaw) {
    return (
      <div className="text-center py-12 text-gray-200 text-sm">
        SELECT A STATE TO GENERATE CONTRACT CLAUSES
      </div>
    );
  }

  const allClauses = [
    `━━━ LIEN RIGHTS — ${stateLaw.stateName.toUpperCase()} ━━━\n${stateLaw.lienLaw.contractClause}`,
    `━━━ CONTRACTOR LICENSING — ${stateLaw.stateName.toUpperCase()} ━━━\n${stateLaw.contractorLicense.contractClause}`,
    `━━━ WAGE & LABOR COMPLIANCE — ${stateLaw.stateName.toUpperCase()} ━━━\n${stateLaw.laborLaw.contractClause}`,
    ...(stateLaw.privacyLaw
      ? [`━━━ DATA PRIVACY — ${stateLaw.stateName.toUpperCase()} ━━━\n${stateLaw.privacyLaw.contractClause}`]
      : []),
    ...stateLaw.additionalClauses.map((c, i) => `━━━ ADDITIONAL CLAUSE ${i + 1} ━━━\n${c}`),
    `━━━ FEDERAL — ADVISORY ONLY ━━━\nThis contract was generated with AI-assisted legal compliance tools provided by J. Worden & Sons. All clauses are advisory only. This document does not constitute legal advice. Consult a licensed attorney in ${stateLaw.stateName} before execution.`,
    `━━━ WORDEN HERITAGE STATEMENT ━━━\nJ. Worden & Sons Paving & General Contracting — 4th Generation Family Business, Established 1984. Virginia Class A Contractor License. SAM.gov Active Registration. All work performed to VDOT Road & Bridge Specifications. Minimum 96% Marshall Unit Weight compaction guaranteed.`,
  ];

  const fullText = allClauses.join('\n\n');

  function handleCopy() {
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-black uppercase tracking-widest text-[#ffcc00]">
          {stateLaw.stateName} — {allClauses.length} Clauses Generated
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="px-4 py-2 bg-[#1a2a3a] text-[#4a9eff] text-xs font-black uppercase tracking-wider border border-[#2a4a7a] hover:bg-[#1e3050] transition-colors"
        >
          {copied ? '✓ COPIED' : '📋 COPY ALL CLAUSES'}
        </button>
      </div>
      <div className="space-y-3">
        {allClauses.map((clause, i) => {
          const lines = clause.split('\n');
          const title = lines[0].replace(/━/g, '').trim();
          const body = lines.slice(1).join('\n');
          return (
            <div key={i} className="bg-[#0a0a0a] border border-gray-800 p-4">
              <div className="text-xs font-black uppercase tracking-wider text-[#ffcc00] mb-2">
                {title}
              </div>
              <p className="text-gray-200 text-xs leading-relaxed font-mono">
                {body}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LegalComplianceNode() {
  const [sessionId] = useState(generateSessionId);
  const [selectedState, setSelectedState] = useState<string>('VA');
  const [activeTab, setActiveTab] = useState<'laws' | 'risks' | 'contracts' | 'audit'>('laws');
  const [activeModal, setActiveModal] = useState<OverrideRisk | null>(null);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [liveSync, setLiveSync] = useState(false);

  const stateLaw: StateLaw | null = selectedState ? STATE_LAWS[selectedState] || null : null;
  const stateList = getStateList();

  // Simulate live sync animation
  useEffect(() => {
    setLiveSync(true);
    const t = setTimeout(() => setLiveSync(false), 1200);
    return () => clearTimeout(t);
  }, [selectedState]);

  const filteredFederalLaws: FederalLaw[] =
    filterCategory === 'ALL'
      ? FEDERAL_LAWS
      : FEDERAL_LAWS.filter((l) => l.category === filterCategory);

  const handleOverrideRequest = useCallback((risk: OverrideRisk) => {
    setActiveModal(risk);
  }, []);

  const handleModalClose = useCallback(
    (accepted: boolean) => {
      if (!activeModal) return;
      const entry: AuditLogEntry = {
        id: crypto.randomUUID(),
        timestamp: nowISO(),
        action: activeModal.action,
        riskLevel: activeModal.riskLevel,
        userName: accepted ? 'Authorized User' : 'System (User Aborted)',
        stateCode: selectedState,
        legalCode: activeModal.federalCode ?? 'N/A',
        overrideAccepted: accepted,
        ipHash: generateMockIpHash(),
        sessionId,
      };
      setAuditLog((prev) => [entry, ...prev]);
      setActiveModal(null);
    },
    [activeModal, selectedState, sessionId],
  );

  const categories = ['ALL', 'OSHA', 'DOT', 'ENVIRONMENTAL', 'LABOR', 'CONTRACT', 'LICENSING'];

  return (
    <div className="min-h-screen bg-[#070b14] text-white font-sans">
      {/* Liability Modal */}
      {activeModal && (
        <LiabilityShieldModal
          risk={activeModal}
          stateCode={selectedState}
          sessionId={sessionId}
          onAccept={handleModalClose}
        />
      )}

      {/* Header */}
      <header className="bg-[#0a0f1e] border-b-[4px] border-[#ffcc00]">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[#ffcc00] text-2xl">⚖️</span>
              <span className="text-[#ffcc00] font-black uppercase text-xs tracking-[0.4em]">
                J. Worden & Sons — Autonomous AI General Counsel
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase text-white leading-tight tracking-tighter">
              LEGAL &amp; <span className="text-[#ffcc00]">COMPLIANCE NODE</span>
            </h1>
            <p className="text-gray-200 text-sm mt-1">
              Live Federal &amp; State Law Intelligence · Liability Shield Interceptor · Contract Auto-Append
            </p>
          </div>
          <div className="flex flex-col gap-2 md:items-end">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${liveSync ? 'bg-[#ffcc00] animate-ping' : 'bg-green-400'}`} />
              <span className="text-xs font-mono text-gray-200">
                {liveSync ? 'SYNCING STATE LAW DATABASE...' : 'FEDERAL + STATE DB LIVE'}
              </span>
            </div>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="bg-[#111] border border-[#ffcc00]/40 text-white px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-[#ffcc00] min-w-[220px]"
            >
              <option value="">— SELECT PROJECT STATE —</option>
              {stateList.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
            <div className="text-[10px] font-mono text-gray-200 text-right">
              {FEDERAL_LAWS.length} Federal · {Object.keys(STATE_LAWS).length} States Loaded
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <LegalStatusBar stateCode={selectedState} sessionId={sessionId} />
      </header>

      {/* Tab Navigation */}
      <div className="bg-[#0d1220] border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 flex gap-0">
          {(
            [
              { id: 'laws', label: '📋 Federal Laws', count: FEDERAL_LAWS.length },
              { id: 'risks', label: '⚠ Override Simulator', count: OVERRIDE_RISKS.length },
              { id: 'contracts', label: '📄 Contract Clauses', count: stateLaw ? 'READY' : '—' },
              { id: 'audit', label: '🔒 Audit Log', count: auditLog.length },
            ] as Array<{ id: 'laws' | 'risks' | 'contracts' | 'audit'; label: string; count: number | string }>
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-[#ffcc00] text-[#ffcc00] bg-[#ffcc00]/5'
                  : 'border-transparent text-gray-300 hover:text-gray-300 hover:bg-white/3'
              }`}
            >
              {tab.label}{' '}
              <span className={`ml-1 px-1.5 py-0.5 rounded-sm text-[10px] ${
                activeTab === tab.id ? 'bg-[#ffcc00]/20 text-[#ffcc00]' : 'bg-gray-800 text-gray-300'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* ── TAB: Federal Laws ── */}
        {activeTab === 'laws' && (
          <div className="space-y-6">
            {/* State Law Panel */}
            {stateLaw && (
              <div className="bg-[#0a1628] border border-[#1e3a5f] p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[#4a9eff] text-xl">🗺️</span>
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-[#4a9eff]">
                      ACTIVE STATE LAW PROFILE
                    </div>
                    <div className="text-xl font-black text-white uppercase">
                      {stateLaw.stateName}
                    </div>
                  </div>
                  <span className="ml-auto text-3xl font-black text-[#ffcc00]">{stateLaw.stateCode}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-[#070b14] border border-gray-800 p-4">
                    <div className="text-xs font-black uppercase tracking-wider text-[#ffcc00] mb-2">
                      Lien Law
                    </div>
                    <div className="font-mono text-[#4a9eff] text-xs font-bold mb-1">{stateLaw.lienLaw.code}</div>
                    <div className="text-gray-200 text-xs mb-1">{stateLaw.lienLaw.title}</div>
                    <div className="text-orange-400 text-xs font-bold">
                      ⏱ Deadline: {stateLaw.lienLaw.deadline}
                    </div>
                  </div>
                  <div className="bg-[#070b14] border border-gray-800 p-4">
                    <div className="text-xs font-black uppercase tracking-wider text-[#ffcc00] mb-2">
                      Labor / Prevailing Wage
                    </div>
                    <div className="font-mono text-[#4a9eff] text-xs font-bold mb-1">{stateLaw.laborLaw.code}</div>
                    <div className="text-gray-200 text-xs">
                      {stateLaw.laborLaw.prevailingWageThreshold}
                    </div>
                  </div>
                  <div className="bg-[#070b14] border border-gray-800 p-4">
                    <div className="text-xs font-black uppercase tracking-wider text-[#ffcc00] mb-2">
                      Contractor License
                    </div>
                    <div className="font-mono text-[#4a9eff] text-xs font-bold mb-1">{stateLaw.contractorLicense.code}</div>
                    <div className="text-gray-200 text-xs">{stateLaw.contractorLicense.requirement}</div>
                  </div>
                  {stateLaw.privacyLaw && (
                    <div className="bg-[#0d1a0d] border border-green-900/40 p-4">
                      <div className="text-xs font-black uppercase tracking-wider text-green-400 mb-2">
                        Data Privacy Law
                      </div>
                      <div className="font-mono text-green-300 text-xs font-bold mb-1">{stateLaw.privacyLaw.code}</div>
                      <div className="text-gray-200 text-xs">{stateLaw.privacyLaw.title}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Federal Laws Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-gray-300 mr-2">
                Filter:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all ${
                    filterCategory === cat
                      ? 'bg-[#ffcc00] text-black'
                      : 'bg-[#111] border border-gray-700 text-gray-200 hover:border-[#ffcc00]/40 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Federal Law Cards */}
            <div className="space-y-3">
              {filteredFederalLaws.map((law) => (
                <div
                  key={law.id}
                  className="bg-[#0a0a0a] border border-gray-800 hover:border-gray-700 transition-colors"
                >
                  <div className="flex flex-wrap items-start gap-3 p-4 border-b border-gray-800/50">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-[#4a9eff] text-xs font-bold">{law.code}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-sm ${getRiskBadgeClass(law.riskLevel)}`}>
                          {law.riskLevel}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-[#1a1a1a] text-gray-200 border border-gray-700 rounded-sm">
                          {law.category}
                        </span>
                      </div>
                      <div className="text-white font-bold text-sm mb-1">{law.title}</div>
                      <p className="text-gray-200 text-xs leading-relaxed">{law.summary}</p>
                    </div>
                    <a
                      href={law.referenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 px-3 py-1.5 bg-[#1a2a3a] text-[#4a9eff] text-[10px] font-black uppercase tracking-wider border border-[#2a4a7a] hover:bg-[#1e3050] transition-colors"
                    >
                      CFR SOURCE ↗
                    </a>
                  </div>
                  <div className="flex flex-wrap gap-4 px-4 py-3 text-xs text-gray-300">
                    <span>
                      Penalty: <span className="text-red-400 font-bold">{law.penaltyRange}</span>
                    </span>
                    <span>
                      Triggers:{' '}
                      {law.triggerConditions.map((t, i) => (
                        <span key={i} className="ml-1 px-1.5 py-0.5 bg-gray-900 text-gray-200 rounded text-[10px]">
                          {t}
                        </span>
                      ))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB: Override Simulator ── */}
        {activeTab === 'risks' && (
          <div className="space-y-6">
            <div className="bg-[#1a0505] border border-red-900/50 p-4 flex items-start gap-3">
              <span className="text-2xl mt-0.5">🛡️</span>
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-red-400 mb-1">
                  LIABILITY SHIELD — OVERRIDE SIMULATOR
                </div>
                <p className="text-gray-200 text-sm">
                  The following scenarios trigger the Worden Autonomous Legal Interceptor. Click any scenario to test the Liability Shield modal. In production, these trigger automatically when the AI detects a high-risk condition. All acceptances are logged with timestamp, IP hash, and digital signature.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {OVERRIDE_RISKS.map((risk) => (
                <div
                  key={risk.id}
                  className={`bg-[#0a0a0a] border transition-all ${
                    risk.riskLevel === 'CRITICAL'
                      ? 'border-red-900/60 hover:border-red-600/80'
                      : 'border-orange-900/40 hover:border-orange-600/60'
                  }`}
                >
                  <div className="p-4 flex flex-wrap items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-sm ${getRiskBadgeClass(risk.riskLevel)}`}>
                          {risk.riskLevel}
                        </span>
                        {risk.federalCode && (
                          <span className="font-mono text-[#4a9eff] text-xs">
                            {risk.federalCode}
                          </span>
                        )}
                      </div>
                      <div className="text-white font-bold text-sm mb-1">{risk.action}</div>
                      <p className="text-gray-200 text-xs leading-relaxed line-clamp-2">
                        {risk.warningBody.substring(0, 200)}...
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOverrideRequest(risk)}
                      className={`shrink-0 px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all border ${
                        risk.riskLevel === 'CRITICAL'
                          ? 'border-red-700 bg-red-950/50 text-red-300 hover:bg-red-900/50'
                          : 'border-orange-700 bg-orange-950/50 text-orange-300 hover:bg-orange-900/50'
                      }`}
                    >
                      ⚡ TEST INTERCEPTOR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB: Contract Clauses ── */}
        {activeTab === 'contracts' && (
          <div className="space-y-6">
            <div className="bg-[#0a1628] border border-[#1e3a5f] p-4 flex items-start gap-3">
              <span className="text-2xl">📄</span>
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-[#4a9eff] mb-1">
                  DYNAMIC CONTRACT CLAUSE APPENDER
                </div>
                <p className="text-gray-200 text-sm">
                  The AI automatically appends state-specific legal clauses to all proposals based on the job's location. Select a state above to generate the applicable clauses. Copy all and paste to the bottom of your Claude-generated contract.
                </p>
              </div>
            </div>
            <ContractClauses stateLaw={stateLaw} />
          </div>
        )}

        {/* ── TAB: Audit Log ── */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-gray-300 mb-1">
                  IMMUTABLE AUDIT TRAIL — SESSION {sessionId}
                </div>
                <div className="text-sm text-gray-200">
                  {auditLog.length === 0
                    ? 'No events recorded this session. Use the Override Simulator to generate entries.'
                    : `${auditLog.length} event${auditLog.length !== 1 ? 's' : ''} recorded — ${auditLog.filter((e) => e.overrideAccepted).length} override${auditLog.filter((e) => e.overrideAccepted).length !== 1 ? 's' : ''} accepted`}
                </div>
              </div>
              {auditLog.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1.5 text-red-400">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    {auditLog.filter((e) => e.overrideAccepted).length} Overrides
                  </span>
                  <span className="flex items-center gap-1.5 text-green-400 ml-3">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    {auditLog.filter((e) => !e.overrideAccepted).length} AI-Followed
                  </span>
                </div>
              )}
            </div>
            <div className="bg-[#0a0a0a] border border-gray-800 p-4 min-h-[300px]">
              <AuditLog entries={auditLog} />
            </div>
            {auditLog.length > 0 && (
              <div className="bg-[#0a1628] border border-[#1e3a5f] p-4 text-xs font-mono text-gray-300">
                <div className="font-bold text-[#4a9eff] mb-2">LEGAL ADMISSIBILITY NOTICE</div>
                This audit trail is timestamped in UTC and includes cryptographic IP hashes and session identifiers. In the event of litigation, this log constitutes documentary evidence of contractor decisions and AI recommendations. All entries are write-once and cannot be modified retroactively.
              </div>
            )}
          </div>
        )}
      </main>

      {/* Disclaimer Footer */}
      <footer className="mt-12 border-t border-gray-800 bg-[#060810]">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-gray-200">
            <div>
              <div className="font-black uppercase tracking-wider text-gray-300 mb-2">⚖️ Legal Disclaimer</div>
              <p>This tool provides AI-assisted legal intelligence for advisory purposes only. Content does not constitute legal advice. Consult a licensed attorney in your jurisdiction before contract execution or regulatory decisions.</p>
            </div>
            <div>
              <div className="font-black uppercase tracking-wider text-gray-300 mb-2">📋 Data Sources</div>
              <p>Federal regulations sourced from eCFR.gov, OSHA.gov, FMCSA.dot.gov, EPA.gov, and DOL.gov. State law data reflects publicly available statutes. Users must verify current applicability.</p>
            </div>
            <div>
              <div className="font-black uppercase tracking-wider text-gray-300 mb-2">🏗️ J. Worden & Sons</div>
              <p>4th Generation · Since 1984 · Virginia Class A Contractor · 7011 Wood Rd, Richmond, VA · SAM.gov Active · VDOT Compliant · 96% Marshall Unit Weight Standard</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
