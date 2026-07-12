import {
  Lock,
  Unlock,
  LayoutDashboard,
  Truck,
  DollarSign,
  FileText,
  Users,
  BarChart3,
  Zap,
  Globe,
  Wrench,
} from 'lucide-react';
import SovereignAssetAnalysis from '@/components/SovereignAssetAnalysis';

const COMMAND_MODULES = [
  {
    icon: LayoutDashboard,
    label: 'Executive Dashboard',
    href: '/dashboard',
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    desc: 'Real-time operations overview',
  },
  {
    icon: Truck,
    label: 'Dispatch Node',
    href: '/dispatch',
    color: 'text-sky-400',
    border: 'border-sky-500/30',
    desc: 'Crew & equipment routing',
  },
  {
    icon: DollarSign,
    label: 'Profit Node',
    href: '/profit-node',
    color: 'text-green-400',
    border: 'border-green-500/30',
    desc: 'Live margin & job P&L',
  },
  {
    icon: FileText,
    label: 'GC Bid Engine',
    href: '/gc-bid',
    color: 'text-violet-400',
    border: 'border-violet-500/30',
    desc: 'Government & commercial bids',
  },
  {
    icon: BarChart3,
    label: 'Investor ROI',
    href: '/investor-roi',
    color: 'text-rose-400',
    border: 'border-rose-500/30',
    desc: '50-state expansion analytics',
  },
  {
    icon: Zap,
    label: 'Pre-Con AI',
    href: '/pre-con',
    color: 'text-yellow-400',
    border: 'border-yellow-500/30',
    desc: 'Preconstruction intelligence',
  },
  {
    icon: Globe,
    label: 'Whale Hunter',
    href: '/whale-hunter',
    color: 'text-cyan-400',
    border: 'border-cyan-500/30',
    desc: 'National bid lead sourcing',
  },
  {
    icon: Users,
    label: 'Payroll & Treasury',
    href: '/payroll-treasury',
    color: 'text-orange-400',
    border: 'border-orange-500/30',
    desc: 'Davis-Bacon & crew pay',
  },
  {
    icon: Wrench,
    label: 'Pre-Con Dashboard',
    href: '/pre-con-dashboard',
    color: 'text-lime-400',
    border: 'border-lime-500/30',
    desc: 'God-Mode project control',
  },
] as const;

interface CommandCenterProps {
  onLock?: () => void;
}

export default function CommandCenter({ onLock }: CommandCenterProps) {
  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10 relative overflow-hidden">
      <div
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,204,0,0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,204,0,0.8) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Unlock className="w-5 h-5 text-amber-400" />
              <h1 className="text-2xl font-black uppercase tracking-[0.2em] text-white">
                SOVEREIGN COMMAND CENTER
              </h1>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-amber-500/60">
              J. Worden &amp; Sons &middot; 4th Generation &middot; Est. 1984 &middot; Virginia Class A
            </p>
          </div>
          {onLock && (
            <button
              onClick={onLock}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-700 hover:border-amber-500/40 text-zinc-200 hover:text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors"
            >
              <Lock className="w-3 h-3" />
              Lock
            </button>
          )}
        </div>

        <div className="flex items-center gap-6 mb-8 px-5 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-green-400">Systems Online</span>
          </div>
          <div className="h-3 w-px bg-zinc-700" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-300">
            96% Marshall &middot; VDOT Sec 315 &middot; $9/Ton Shield &middot; Zero-Downtime Medical
          </span>
          <div className="ml-auto text-[9px] font-bold text-zinc-200 uppercase tracking-widest">
            JWORDENAI&trade; v1.0.0
          </div>
        </div>

        <SovereignAssetAnalysis />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {COMMAND_MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <a
                key={mod.href}
                href={mod.href}
                className={`group flex items-start gap-4 p-5 bg-zinc-900/60 border ${mod.border} hover:bg-zinc-800/60 rounded-xl transition-all duration-200 hover:shadow-lg`}
              >
                <div className={`mt-0.5 p-2 rounded-lg bg-zinc-950/80 border ${mod.border}`}>
                  <Icon className={`w-5 h-5 ${mod.color}`} />
                </div>
                <div>
                  <p className={`text-sm font-black uppercase tracking-wider ${mod.color} mb-1`}>
                    {mod.label}
                  </p>
                  <p className="text-[11px] text-zinc-300 leading-snug">{mod.desc}</p>
                </div>
              </a>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <p className="text-[8px] font-bold uppercase tracking-[0.4em] text-zinc-700">
            JWORDENAI&trade; Sovereign System &middot; All access logged &middot; 4th Generation Since 1984
          </p>
        </div>
      </div>
    </div>
  );
}
