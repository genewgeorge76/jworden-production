import { useState, useMemo } from 'react';
import {
  TrendingUp,
  Building2,
  AlertTriangle,
  DollarSign,
  BarChart3,
  Zap,
  Shield,
  Clock,
} from 'lucide-react';

// ─── Utility ────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 0) {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtUSD(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${fmt(n)}`;
}

function numSetter(setter: (v: number) => void) {
  return (e: React.ChangeEvent<HTMLInputElement>) => setter(Number(e.target.value));
}

type SliderField = {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  setter: (v: number) => void;
  prefix: string;
  suffix?: string;
  fmtVal?: (v: number) => string;
};


function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-[#ffcc00] font-black uppercase tracking-[0.3em] text-[10px] mb-4 bg-white/5 px-3 py-1 border border-[#ffcc00]/20">
      {children}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-5 border ${highlight ? 'border-[#ffcc00] bg-[#ffcc00]/5' : 'border-zinc-800 bg-zinc-900'}`}
    >
      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-1">
        {label}
      </div>
      <div
        className={`text-3xl font-black ${highlight ? 'text-[#ffcc00]' : 'text-white'}`}
      >
        {value}
      </div>
      {sub && (
        <div className="text-xs text-zinc-300 font-bold mt-1">{sub}</div>
      )}
    </div>
  );
}

// ─── Section 1 — Cap Rate & NOI Calculator ──────────────────────────────────

function CapRateCalculator() {
  const [investmentCost, setInvestmentCost] = useState(850_000);
  const [currentNOI, setCurrentNOI] = useState(300_000);
  const [noiIncrease, setNoiIncrease] = useState(180_000);
  const [capRate, setCapRate] = useState(6);

  const results = useMemo(() => {
    const newNOI = currentNOI + noiIncrease;
    const currentValue = currentNOI / (capRate / 100);
    const newValue = newNOI / (capRate / 100);
    const valueIncrease = newValue - currentValue;
    const roi = ((valueIncrease - investmentCost) / investmentCost) * 100;
    const leverageMultiple = valueIncrease / investmentCost;
    return { newNOI, currentValue, newValue, valueIncrease, roi, leverageMultiple };
  }, [investmentCost, currentNOI, noiIncrease, capRate]);

  const sliderClass =
    'w-full h-2 bg-zinc-800 rounded appearance-none cursor-pointer accent-[#ffcc00]';

  return (
    <section className="mb-20">
      <SectionLabel>Module 01 · Cap Rate &amp; NOI Engine</SectionLabel>
      <h2 className="text-4xl font-black uppercase text-white mb-2 tracking-tight">
        Asset Valuation <span className="text-[#ffcc00]">Calculator</span>
      </h2>
      <p className="text-zinc-200 font-bold mb-10 max-w-3xl">
        Enter the infrastructure investment cost, current NOI, projected NOI
        increase, and local cap rate. The engine calculates exactly how many
        dollars of asset equity your paving investment manufactures.
      </p>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Inputs */}
        <div className="bg-zinc-900 border border-zinc-800 p-8 space-y-8">
          {(
            [
              {
                id: 'investmentCost',
                label: 'Infrastructure Investment Cost',
                value: investmentCost,
                min: 50_000,
                max: 5_000_000,
                step: 10_000,
                setter: setInvestmentCost,
                prefix: '$',
              },
              {
                id: 'currentNOI',
                label: 'Current Annual NOI',
                value: currentNOI,
                min: 50_000,
                max: 5_000_000,
                step: 10_000,
                setter: setCurrentNOI,
                prefix: '$',
              },
              {
                id: 'noiIncrease',
                label: 'Projected NOI Increase (from improved asset)',
                value: noiIncrease,
                min: 0,
                max: 1_000_000,
                step: 5_000,
                setter: setNoiIncrease,
                prefix: '$',
              },
              {
                id: 'capRate',
                label: 'Local Market Cap Rate',
                value: capRate,
                min: 3,
                max: 12,
                step: 0.25,
                setter: setCapRate,
                prefix: '',
                suffix: '%',
                fmtVal: (v: number) => v.toFixed(2),
              },
            ] as SliderField[]
          ).map((field) => (
            <div key={field.id}>
              <div className="flex justify-between items-center mb-2">
                <label
                  htmlFor={field.id}
                  className="text-xs font-black uppercase tracking-widest text-[#ffcc00]"
                >
                  {field.label}
                </label>
                <span className="text-white font-black text-lg">
                  {field.prefix}
                  {field.fmtVal ? field.fmtVal(field.value) : fmt(field.value)}
                  {field.suffix ?? ''}
                </span>
              </div>
              <input
                type="range"
                id={field.id}
                min={field.min}
                max={field.max}
                step={field.step}
                value={field.value}
                onChange={numSetter(field.setter)}
                className={sliderClass}
              />
              <div className="flex justify-between text-[10px] text-zinc-200 font-bold mt-1">
                <span>
                  {field.prefix}
                  {field.fmtVal ? field.fmtVal(field.min) : fmt(field.min)}
                  {field.suffix ?? ''}
                </span>
                <span>
                  {field.prefix}
                  {field.fmtVal ? field.fmtVal(field.max) : fmt(field.max)}
                  {field.suffix ?? ''}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label="Current Asset Value"
              value={fmtUSD(results.currentValue)}
              sub={`At ${capRate}% cap rate`}
            />
            <StatCard
              label="Post-Investment Value"
              value={fmtUSD(results.newValue)}
              sub="Projected stabilized"
              highlight
            />
            <StatCard
              label="Value Increase"
              value={fmtUSD(results.valueIncrease)}
              sub="Equity manufactured"
              highlight
            />
            <StatCard
              label="ROI on Investment"
              value={`${results.roi.toFixed(1)}%`}
              sub="Net return"
              highlight={results.roi > 0}
            />
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-3">
              Leverage Multiple
            </div>
            <div className="text-5xl font-black text-[#ffcc00]">
              {results.leverageMultiple.toFixed(2)}×
            </div>
            <div className="text-zinc-200 text-sm font-bold mt-2">
              Every $1 invested in infrastructure generates{' '}
              <span className="text-white">
                ${results.leverageMultiple.toFixed(2)}
              </span>{' '}
              in asset value.
            </div>
          </div>
          {/* AI Verdict Banner */}
          <div className="bg-black border-l-4 border-[#ffcc00] p-5">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-[#ffcc00]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#ffcc00]">
                Worden AI Verdict
              </span>
            </div>
            <p className="text-zinc-300 text-sm font-bold leading-relaxed">
              "Investing{' '}
              <span className="text-white">{fmtUSD(investmentCost)}</span> in
              Class-A infrastructure at a{' '}
              <span className="text-white">{capRate}%</span> cap rate
              manufactures{' '}
              <span className="text-[#ffcc00]">
                {fmtUSD(results.valueIncrease)}
              </span>{' '}
              in additional asset equity — a{' '}
              <span className="text-[#ffcc00]">
                {results.leverageMultiple.toFixed(2)}×
              </span>{' '}
              leverage multiple. This is arbitrage, not expense."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 2 — Highest & Best Use Analyzer ────────────────────────────────

const USE_SCENARIOS = [
  {
    id: 'logistics',
    label: 'Class A Logistics Hub',
    currentUse: 'Class C Industrial (Vacant)',
    proposedUse: 'Class A Logistics / Last-Mile Distribution',
    investmentReq: 1_200_000,
    valueIncrease: 4_500_000,
    irr: 22,
    soilNote: 'Load-bearing gravel sub-base confirmed. Heavy-axle spec required.',
    spec: '6" VDOT-grade stone base + 4" heavy-duty binder + 2" surface',
    tenant: 'Amazon / FedEx Last-Mile',
    badge: '🏭',
  },
  {
    id: 'qsr',
    label: 'QSR / Fast-Food Pad',
    currentUse: 'Class C Retail Strip',
    proposedUse: 'QSR Drive-Through Pad (Taco Bell / KFC / Chick-fil-A)',
    investmentReq: 850_000,
    valueIncrease: 2_200_000,
    irr: 18,
    soilNote: 'Sandy loam detected. Cement stabilization layer required.',
    spec: '4" VDOT Sec 315 base + 2.5" binder + 1.5" surface + drive-through curbing',
    tenant: 'National QSR Franchise (NNN Lease)',
    badge: '🍔',
  },
  {
    id: 'mixed',
    label: 'Mixed-Use Urban Infill',
    currentUse: 'Surface Parking (Blighted)',
    proposedUse: 'Ground-Floor Retail + Upper-Floor Multifamily',
    investmentReq: 2_500_000,
    valueIncrease: 7_800_000,
    irr: 26,
    soilNote: 'Urban fill detected. Engineered sub-base and drainage overhaul required.',
    spec: 'Full site prep + 6" engineered base + permeable pavement zones + utilities',
    tenant: 'Mixed-Use NNN + Residential Cap Rate Arbitrage',
    badge: '🏙️',
  },
  {
    id: 'datacenter',
    label: 'Data Center / Critical Facility',
    currentUse: 'Class B Office (Underutilized)',
    proposedUse: 'Tier III Data Center / Edge Computing Node',
    investmentReq: 3_200_000,
    valueIncrease: 11_000_000,
    irr: 31,
    soilNote: 'Dense gravel confirmed. Heavy equipment access roads and generator pads required.',
    spec: 'Heavy-duty 8" base + 4" binder + 2" surface + equipment access pads (50-ton capacity)',
    tenant: 'Hyperscaler / Colocation (Long-Term Lease)',
    badge: '🖥️',
  },
];

function HighestBestUse() {
  const [selected, setSelected] = useState(USE_SCENARIOS[0].id);
  const scenario = USE_SCENARIOS.find((s) => s.id === selected) ?? USE_SCENARIOS[0];

  return (
    <section className="mb-20">
      <SectionLabel>Module 02 · Highest &amp; Best Use AI</SectionLabel>
      <h2 className="text-4xl font-black uppercase text-white mb-2 tracking-tight">
        Land Use <span className="text-[#ffcc00]">Optimizer</span>
      </h2>
      <p className="text-zinc-200 font-bold mb-10 max-w-3xl">
        The AI analyzes soil data, zoning context, and infrastructure
        investment requirements to identify the highest-value use for the
        subject parcel.
      </p>

      {/* Scenario Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        {USE_SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelected(s.id)}
            className={`p-4 border text-left transition-all cursor-pointer ${
              selected === s.id
                ? 'border-[#ffcc00] bg-[#ffcc00]/10'
                : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'
            }`}
          >
            <div className="text-2xl mb-2">{s.badge}</div>
            <div
              className={`text-xs font-black uppercase tracking-widest ${
                selected === s.id ? 'text-[#ffcc00]' : 'text-zinc-200'
              }`}
            >
              {s.label}
            </div>
          </button>
        ))}
      </div>

      {/* Scenario Detail */}
      <div className="bg-zinc-900 border border-zinc-800 p-8 md:p-10">
        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-1">
              Current Use
            </div>
            <div className="text-xl font-black text-zinc-300 mb-4">
              {scenario.currentUse}
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-1">
              Proposed Use
            </div>
            <div className="text-xl font-black text-white mb-4">
              {scenario.proposedUse}
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-1">
              Target Tenant / Exit
            </div>
            <div className="text-lg font-bold text-[#ffcc00] mb-6">
              {scenario.tenant}
            </div>

            <div className="bg-black border border-zinc-800 p-5 mb-4">
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 text-[#ffcc00] mt-0.5 shrink-0" />
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#ffcc00] mb-1">
                    Worden Spec
                  </div>
                  <div className="text-sm text-zinc-300 font-bold">
                    {scenario.spec}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-black border border-zinc-800 p-5">
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-zinc-200 mt-0.5 shrink-0" />
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-1">
                    Soil Intelligence
                  </div>
                  <div className="text-sm text-zinc-200 font-bold">
                    {scenario.soilNote}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                label="Required Investment"
                value={fmtUSD(scenario.investmentReq)}
                sub="Structural paving scope"
              />
              <StatCard
                label="Asset Value Increase"
                value={fmtUSD(scenario.valueIncrease)}
                sub="Upon stabilization"
                highlight
              />
              <StatCard
                label="Projected IRR"
                value={`${scenario.irr}%`}
                sub="Internal rate of return"
                highlight
              />
              <StatCard
                label="Value Multiplier"
                value={`${(scenario.valueIncrease / scenario.investmentReq).toFixed(1)}×`}
                sub="Equity created per dollar"
                highlight
              />
            </div>

            {/* AI Verdict */}
            <div className="bg-black border-l-4 border-[#ffcc00] p-5">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-[#ffcc00]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#ffcc00]">
                  Worden AI Verdict
                </span>
              </div>
              <p className="text-zinc-300 text-sm font-bold leading-relaxed">
                "Current Use:{' '}
                <span className="text-zinc-200">{scenario.currentUse}</span>.
                Proposed Use:{' '}
                <span className="text-white">{scenario.proposedUse}</span>.
                Structural paving investment of{' '}
                <span className="text-white">
                  {fmtUSD(scenario.investmentReq)}
                </span>{' '}
                will yield a{' '}
                <span className="text-[#ffcc00]">
                  {fmtUSD(scenario.valueIncrease)}
                </span>{' '}
                increase in asset valuation at a projected{' '}
                <span className="text-[#ffcc00]">{scenario.irr}% IRR</span>."
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 3 — Investor Risk vs. Reward Pro Forma ─────────────────────────

const RISK_LEVELS = [
  { id: 'low', label: 'Low Risk', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30' },
  { id: 'medium', label: 'Medium Risk', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30' },
  { id: 'high', label: 'High Risk', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30' },
] as const;

type RiskLevel = (typeof RISK_LEVELS)[number]['id'];

function ProFormaPanel() {
  const [loanAmount, setLoanAmount] = useState(1_000_000);
  const [interestRate, setInterestRate] = useState(7.5);
  const [delayDays, setDelayDays] = useState(30);
  const [liquidatedDamages, setLiquidatedDamages] = useState(5_000);
  const [weatherRisk, setWeatherRisk] = useState<RiskLevel>('medium');
  const [soilRisk, setSoilRisk] = useState<RiskLevel>('low');
  const [executionRisk, setExecutionRisk] = useState<RiskLevel>('low');

  const results = useMemo(() => {
    const dailyCarry = (loanAmount * (interestRate / 100)) / 365;
    const totalCarry = dailyCarry * delayDays;
    const ldExposure = liquidatedDamages * delayDays;
    const totalDelayExposure = totalCarry + ldExposure;

    // Risk-weighted delay multiplier
    const riskMultiplier: Record<RiskLevel, number> = { low: 1.0, medium: 1.4, high: 1.9 };
    const avgRisk =
      (riskMultiplier[weatherRisk] +
        riskMultiplier[soilRisk] +
        riskMultiplier[executionRisk]) /
      3;
    const riskAdjustedDelay = delayDays * avgRisk;
    const riskAdjustedExposure =
      dailyCarry * riskAdjustedDelay + liquidatedDamages * riskAdjustedDelay;

    // Schedule crashing cost (spend ~20% of exposure to avoid the rest)
    const crashCost = totalDelayExposure * 0.2;
    const netSavings = totalDelayExposure - crashCost;

    return {
      dailyCarry,
      totalCarry,
      ldExposure,
      totalDelayExposure,
      riskAdjustedExposure,
      crashCost,
      netSavings,
      riskAdjustedDelay: Math.round(riskAdjustedDelay),
    };
  }, [loanAmount, interestRate, delayDays, liquidatedDamages, weatherRisk, soilRisk, executionRisk]);

  const sliderClass =
    'w-full h-2 bg-zinc-800 rounded appearance-none cursor-pointer accent-[#ffcc00]';

  return (
    <section className="mb-20">
      <SectionLabel>Module 03 · Investor Pro Forma</SectionLabel>
      <h2 className="text-4xl font-black uppercase text-white mb-2 tracking-tight">
        Delay &amp; Carrying Cost <span className="text-[#ffcc00]">Risk Engine</span>
      </h2>
      <p className="text-zinc-200 font-bold mb-10 max-w-3xl">
        Integrates weather, soil, and execution risks into a financial Pro
        Forma view. Quantifies exactly how a 30-day delay bleeds the
        investor's IRR and triggers the Schedule Crashing protocol.
      </p>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Left: Inputs */}
        <div className="space-y-8">
          {/* Financial Inputs */}
          <div className="bg-zinc-900 border border-zinc-800 p-8 space-y-6">
            <div className="text-xs font-black uppercase tracking-widest text-[#ffcc00] mb-4">
              Financial Parameters
            </div>

            {(
              [
                {
                  id: 'loanAmount',
                  label: 'Construction Loan Balance',
                  value: loanAmount,
                  min: 100_000,
                  max: 10_000_000,
                  step: 50_000,
                  setter: setLoanAmount,
                  prefix: '',
                  fmtVal: (v: number) => `$${fmt(v)}`,
                },
                {
                  id: 'interestRate',
                  label: 'Construction Loan Interest Rate',
                  value: interestRate,
                  min: 4,
                  max: 14,
                  step: 0.25,
                  setter: setInterestRate,
                  prefix: '',
                  fmtVal: (v: number) => `${v.toFixed(2)}%`,
                },
                {
                  id: 'delayDays',
                  label: 'Weather / Schedule Delay (Days)',
                  value: delayDays,
                  min: 1,
                  max: 90,
                  step: 1,
                  setter: setDelayDays,
                  prefix: '',
                  fmtVal: (v: number) => `${v} days`,
                },
                {
                  id: 'liquidatedDamages',
                  label: 'Liquidated Damages Rate',
                  value: liquidatedDamages,
                  min: 0,
                  max: 25_000,
                  step: 500,
                  setter: setLiquidatedDamages,
                  prefix: '',
                  fmtVal: (v: number) => `$${fmt(v)}/day`,
                },
              ] as SliderField[]
            ).map((field) => (
              <div key={field.id}>
                <div className="flex justify-between items-center mb-2">
                  <label
                    htmlFor={field.id}
                    className="text-xs font-black uppercase tracking-widest text-zinc-200"
                  >
                    {field.label}
                  </label>
                  <span className="text-white font-black">
                    {field.fmtVal ? field.fmtVal(field.value) : fmt(field.value)}
                  </span>
                </div>
                <input
                  type="range"
                  id={field.id}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={field.value}
                  onChange={numSetter(field.setter)}
                  className={sliderClass}
                />
              </div>
            ))}
          </div>

          {/* Risk Toggles */}
          <div className="bg-zinc-900 border border-zinc-800 p-8">
            <div className="text-xs font-black uppercase tracking-widest text-[#ffcc00] mb-6">
              Construction Risk Matrix
            </div>
            {(
              [
                {
                  label: 'Weather Risk',
                  value: weatherRisk,
                  setter: setWeatherRisk,
                  icon: '🌧️',
                },
                {
                  label: 'Soil / Subgrade Risk',
                  value: soilRisk,
                  setter: setSoilRisk,
                  icon: '🏔️',
                },
                {
                  label: 'Execution Risk',
                  value: executionRisk,
                  setter: setExecutionRisk,
                  icon: '⚙️',
                },
              ] as const
            ).map((row) => (
              <div key={row.label} className="flex items-center gap-4 mb-4">
                <span className="text-lg w-6">{row.icon}</span>
                <span className="text-sm font-black text-zinc-300 w-40">
                  {row.label}
                </span>
                <div className="flex gap-2">
                  {RISK_LEVELS.map((lvl) => (
                    <button
                      key={lvl.id}
                      onClick={() =>
                        (row.setter as (v: RiskLevel) => void)(lvl.id)
                      }
                      className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer ${
                        row.value === lvl.id
                          ? `${lvl.bg} ${lvl.color} border-current`
                          : 'border-zinc-700 text-zinc-200 hover:border-zinc-500'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Output */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label="Daily Carry Cost"
              value={fmtUSD(results.dailyCarry)}
              sub="Interest per day"
            />
            <StatCard
              label="Total Carry Exposure"
              value={fmtUSD(results.totalCarry)}
              sub={`Over ${delayDays}-day delay`}
              highlight
            />
            <StatCard
              label="LD Exposure"
              value={fmtUSD(results.ldExposure)}
              sub="Liquidated damages"
              highlight
            />
            <StatCard
              label="Total Delay Exposure"
              value={fmtUSD(results.totalDelayExposure)}
              sub="Carry + LD combined"
              highlight
            />
          </div>

          {/* Risk-Adjusted Exposure */}
          <div className="bg-zinc-900 border border-zinc-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-xs font-black uppercase tracking-widest text-red-400">
                Risk-Weighted Scenario
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] text-zinc-300 font-black uppercase tracking-widest mb-1">
                  Risk-Adj. Delay
                </div>
                <div className="text-2xl font-black text-red-400">
                  {results.riskAdjustedDelay} days
                </div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-300 font-black uppercase tracking-widest mb-1">
                  Risk-Adj. Exposure
                </div>
                <div className="text-2xl font-black text-red-400">
                  {fmtUSD(results.riskAdjustedExposure)}
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Crashing Recommendation */}
          <div className="bg-[#ffcc00]/5 border border-[#ffcc00] p-6">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-5 h-5 text-[#ffcc00]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#ffcc00]">
                Schedule Crashing Protocol
              </span>
            </div>
            <p className="text-zinc-200 text-sm font-bold leading-relaxed mb-4">
              Authorize{' '}
              <span className="text-[#ffcc00]">{fmtUSD(results.crashCost)}</span>{' '}
              in double-time weekend labor to beat the delay window and avoid{' '}
              <span className="text-white">
                {fmtUSD(results.totalDelayExposure)}
              </span>{' '}
              in total exposure.
            </p>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-[10px] text-zinc-300 font-black uppercase tracking-widest mb-1">
                  Net Investor Savings
                </div>
                <div className="text-3xl font-black text-[#ffcc00]">
                  {fmtUSD(results.netSavings)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-zinc-300 font-black uppercase tracking-widest mb-1">
                  Crash ROI
                </div>
                <div className="text-3xl font-black text-white">
                  {((results.netSavings / results.crashCost) * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>

          {/* AI Verdict */}
          <div className="bg-black border-l-4 border-[#ffcc00] p-5">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-[#ffcc00]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#ffcc00]">
                Worden AI Verdict
              </span>
            </div>
            <p className="text-zinc-300 text-sm font-bold leading-relaxed">
              "A{' '}
              <span className="text-white">{delayDays}-day</span> weather delay
              on a{' '}
              <span className="text-white">{fmtUSD(loanAmount)}</span>{' '}
              construction loan at{' '}
              <span className="text-white">{interestRate}%</span> costs the
              investor{' '}
              <span className="text-[#ffcc00]">
                {fmtUSD(results.dailyCarry)}
              </span>{' '}
              per day in carry alone — plus liquidated damages. Authorize the{' '}
              <span className="text-white">Schedule Crashing Protocol</span>{' '}
              immediately to protect{' '}
              <span className="text-[#ffcc00]">
                {fmtUSD(results.netSavings)}
              </span>{' '}
              in net investor return."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Summary / CTA ──────────────────────────────────────────────────────────

function InvestorCTA() {
  return (
    <section className="bg-[#ffcc00] p-10 md:p-16">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex justify-center gap-6 mb-6 text-4xl">
          <DollarSign className="w-10 h-10 text-black" />
          <BarChart3 className="w-10 h-10 text-black" />
          <TrendingUp className="w-10 h-10 text-black" />
        </div>
        <h2 className="text-5xl font-black uppercase text-black mb-4 tracking-tight">
          Ready to Manufacture Equity?
        </h2>
        <p className="text-black/70 font-bold text-lg mb-8 max-w-2xl mx-auto">
          J. Worden &amp; Sons doesn't sell asphalt. We manufacture real estate
          equity through Class-A infrastructure. Contact our team for a
          custom Investor Pro Forma on your specific asset.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/estimator"
            className="inline-block bg-black text-[#ffcc00] font-black uppercase tracking-widest px-10 py-4 text-base hover:bg-zinc-900 transition-colors"
          >
            Request Pro Forma →
          </a>
          <a
            href="tel:8044461296"
            className="inline-block bg-transparent text-black border-2 border-black font-black uppercase tracking-widest px-10 py-4 text-base hover:bg-black hover:text-[#ffcc00] transition-colors"
          >
            804-446-1296
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Root Export ─────────────────────────────────────────────────────────────

export default function InvestorROINode() {
  return (
    <main className="min-h-screen bg-[#0d0d0d] text-white font-sans">
      {/* Hero */}
      <section className="relative py-32 px-6 bg-[#111111] border-b-[8px] border-[#ffcc00] overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <span className="bg-[#ffcc00] text-black px-6 py-1.5 font-black uppercase text-xs tracking-[0.4em] mb-8 inline-block shadow-2xl">
            Real Estate · Capital Investors · REITs · Developers
          </span>
          <h1 className="text-7xl md:text-8xl font-black uppercase text-[#ffcc00] leading-[0.9] tracking-tighter">
            INVESTOR <br />
            <span className="text-white italic">ROI ENGINE</span>
          </h1>
          <p className="text-2xl text-zinc-200 italic font-bold mt-10 max-w-4xl leading-snug">
            Infrastructure is not a cost — it is an equity manufacturing
            machine. This dashboard translates every dollar of J. Worden
            &amp; Sons construction work into cap rate math, asset valuation
            uplift, and IRR-protected Pro Forma analysis.
          </p>
          {/* Quick stats bar */}
          <div className="grid grid-cols-3 gap-px mt-12 border border-zinc-800 overflow-hidden">
            {[
              { label: 'Leverage Avg', value: '3.5×', sub: 'Value created per $1 invested' },
              { label: 'Avg IRR', value: '22%', sub: 'Infrastructure-driven return' },
              { label: 'Delay Protected', value: '$0', sub: 'With crashing protocol active' },
            ].map((s) => (
              <div key={s.label} className="bg-zinc-900 px-6 py-5">
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-1">
                  {s.label}
                </div>
                <div className="text-3xl font-black text-[#ffcc00]">{s.value}</div>
                <div className="text-xs text-zinc-300 font-bold mt-1">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <CapRateCalculator />
        <HighestBestUse />
        <ProFormaPanel />
      </div>

      {/* CTA */}
      <InvestorCTA />
    </main>
  );
}
