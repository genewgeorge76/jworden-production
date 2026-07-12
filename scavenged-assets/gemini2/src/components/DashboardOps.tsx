import { useState } from 'react';
import legacyData from '../data/legacyPortfolio.json';
import { JWordenAI } from '../ai/JWordenAIEngine';
import { ProjectDominanceGallery } from './ProjectDominanceGallery';
import { NegotiationPanel } from './NegotiationPanel';

type LegacyAccount = {
  name?: string;
  projects?: string;
  relationship?: string;
};

function getHeritageLine() {
  const heritage = legacyData.heritage as unknown;
  if (typeof heritage === 'string') return heritage;
  if (heritage && typeof heritage === 'object') {
    const h = heritage as { summary?: unknown; founded?: unknown };
    if (typeof h.summary === 'string') return h.summary;
    if (typeof h.founded === 'number') return `EST ${h.founded}`;
  }
  return 'EST 1984';
}

function getMajorAccounts(): LegacyAccount[] {
  const legacy = legacyData as unknown as {
    major_accounts?: LegacyAccount[];
    majorAccounts?: LegacyAccount[];
  };
  return legacy.major_accounts ?? legacy.majorAccounts ?? [];
}

export const DashboardOps = ({ isAutoMode }: { isAutoMode: boolean }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const seoTargets = [
    { keyword: 'Commercial Paving Contractor I-95', rank: 1, change: '+2', volume: 'High' },
    { keyword: 'VDOT Approved Asphalt', rank: 2, change: '+4', volume: 'Extreme' },
    { keyword: 'Retail Repaving Syndicate', rank: 1, change: '0', volume: 'Medium' },
    { keyword: 'Taco Bell Driveway Contractor', rank: 3, change: '+7', volume: 'High' },
  ];

  const heritageLine = getHeritageLine();
  const majorAccounts = getMajorAccounts();
  const activeLead = {
    name: majorAccounts[0]?.name ?? 'Target Account',
    email: 'estimating@jwordenandsons.com',
    estimatedPrice: 185000,
    tonnage: 720,
    projectDays: 4,
  };

  const runEstimator = async () => {
    setIsGenerating(true);
    try {
      await JWordenAI.generateAutonomousBid('Fredericksburg, VA', 10000);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen p-8 radar-sweep relative">
      {/* Sovereign VPC Edge Intelligence Banner */}
      <div className="w-full bg-[#0a0a0c] border-b border-[#d4af37]/30 text-center py-1 mb-6 flex justify-center items-center space-x-3">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d4af37] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#d4af37]"></span>
        </span>
        <span className="text-[10px] text-[#d4af37] font-mono tracking-[0.3em] uppercase">VPC ENCLAVE SECURED • SWARM INTELLIGENCE ACTIVE • VLA ORBITAL SYNC ONLINE</span>
      </div>
      <header className="flex justify-between items-center mb-10 pb-4 border-b border-white/10 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#d4af37] tracking-tighter text-glow uppercase">
            JWordenAI <span className="text-white font-light text-xl">Sovereign Absolute</span>
          </h1>
          <p className="text-xs text-gray-200 tracking-widest mt-1">NATIONWIDE PRIME CONTRACTOR // AUTH 1984</p>
        </div>
        <div className="px-4 py-1 rounded-full bg-glass border-gold-glow text-sm text-[#d4af37] animate-pulse">
          {isAutoMode ? '🟢 AUTO-PILOT ACTIVE' : '🟡 MANUAL OVERRIDE'}
        </div>
      </header>

      <div className="bg-glass rounded-lg mb-8 border border-white/5 overflow-hidden flex whitespace-nowrap p-4">
        <div className="animate-pulse flex space-x-12">
          <span className="text-[#d4af37] font-bold tracking-widest">🏛️ {heritageLine.toUpperCase()}</span>
          {majorAccounts.map((account, idx) => (
            <span key={idx} className="text-gray-300 tracking-wide">
              ⭐ <strong className="text-white">{(account.name ?? 'ACCOUNT').toUpperCase()}</strong> // {(account.projects ?? account.relationship ?? 'PROJECTS').toUpperCase()}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-2 space-y-8">
          <div className="bg-glass p-8 rounded-xl border-gold-glow relative overflow-hidden h-[300px]">
            <h2 className="text-xl font-bold text-white mb-2">Live Demand Heatmap & Satellite Targeting</h2>
            <p className="text-sm text-gray-200 mb-6">Scanning High-Intensity I-95 Nodes (Fairfax, Arlington, Fredericksburg)...</p>
            <div className="absolute inset-0 top-24 bg-[#1f1f23] rounded-lg border border-white/10 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
              <p className="text-[#00ff41] font-mono z-10 animate-pulse">AWAITING SATELLITE LOCK...</p>
            </div>
          </div>

          <div className="bg-glass p-6 rounded-xl border border-white/10">
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
              <h3 className="text-[#00ff41] font-bold uppercase tracking-wider text-sm">🌐 Google SERP Supremacy Radar</h3>
              <span className="text-xs text-gray-300 font-mono">LIVE API SYNC</span>
            </div>
            <div className="grid grid-cols-4 gap-4 text-xs text-gray-200 mb-2 font-mono uppercase">
              <div className="col-span-2">Target Keyword</div>
              <div>Google Rank</div>
              <div>7-Day Trend</div>
            </div>
            <div className="space-y-3">
              {seoTargets.map((seo, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-4 items-center bg-[#1f1f23]/50 p-3 rounded border border-white/5">
                  <div className="col-span-2 font-bold text-white">{seo.keyword}</div>
                  <div className="text-[#d4af37] font-black text-lg">#{seo.rank}</div>
                  <div className="text-[#00ff41] font-bold">{seo.change} ↗</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Project Dominance Gallery */}
        <div className="col-span-2">
          <ProjectDominanceGallery />
        </div>

        <div className="bg-glass p-6 rounded-xl border border-white/10 h-fit">
          <h3 className="text-[#d4af37] font-bold mb-4 uppercase tracking-wider text-sm border-b border-white/10 pb-2">Weapons Free: AI Actions</h3>
          <button onClick={runEstimator} className="w-full bg-[#d4af37] hover:bg-[#b5952f] text-black font-black py-4 px-4 rounded-lg mb-4 transition-all shadow-[0_0_15px_rgba(212,175,55,0.4)]">
            {isGenerating ? 'GENERATING BID...' : '1. RUN SATELLITE AI ESTIMATOR'}
          </button>
          <button className="w-full bg-[#1f1f23] hover:bg-black text-white border border-white/20 font-bold py-3 px-4 rounded-lg mb-3">2. DEPLOY TWILIO SMS SURGE</button>
          <button className="w-full bg-[#1f1f23] hover:bg-black text-white border border-white/20 font-bold py-3 px-4 rounded-lg mb-3">3. GENERATE LEGAL PDF</button>
          <button className="w-full bg-[#1f1f23] hover:bg-black text-white border border-white/20 font-bold py-3 px-4 rounded-lg">4. AUDIT STRIPE MOAT DEPOSITS</button>
          <NegotiationPanel activeLead={activeLead} />
        </div>
      </div>
    </div>
  );
};
