import { useState, useCallback } from 'react';
import { AlertTriangle, CheckCircle, Clock, DollarSign, Zap, CloudRain, Thermometer, Wind } from 'lucide-react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type ScenarioKey = 'cold_asphalt' | 'wet_earthwork' | 'schedule_crash' | 'wind_crane' | 'frost_concrete';

interface RiskScenario {
  id: ScenarioKey;
  label: string;
  icon: React.ReactNode;
  weatherCondition: string;
  waitCost: number;        // cost of waiting (LD exposure in $)
  executeCost: number;     // cost of executing in bad conditions ($)
  daysToIdeal: number;
  countermeasures: CounterMeasure[];
}

interface CounterMeasure {
  type: 'MANDATORY' | 'RECOMMENDED' | 'CRITICAL';
  action: string;
  spec?: string;
  cost?: number;
}

interface ArbitrationVerdict {
  decision: 'EXECUTE_NOW' | 'WAIT' | 'CRASH_SCHEDULE';
  headline: string;
  rationale: string;
  netSavings: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  countermeasures: CounterMeasure[];
  auditTimestamp: string;
  auditSignature?: string;
}

// ─────────────────────────────────────────────
// Mock scenario library
// ─────────────────────────────────────────────
const SCENARIOS: RiskScenario[] = [
  {
    id: 'cold_asphalt',
    label: 'Cold Weather Asphalt Paving',
    icon: <Thermometer className="w-5 h-5 text-blue-400" />,
    weatherCondition: '42°F ground temperature — High thermal compaction failure risk',
    waitCost: 60000,
    executeCost: 25000,
    daysToIdeal: 12,
    countermeasures: [
      {
        type: 'MANDATORY',
        action: 'Order Evotherm® Warm-Mix Asphalt (WMA) additive at the plant. This lowers viscosity and extends the compaction window by 40°F.',
        spec: 'VDOT Special Provision for WMA — Section 315.03(b)',
      },
      {
        type: 'MANDATORY',
        action: 'Deploy 3 breakdown rollers keeping within 50 feet of the screed at all times. Achieve 96% Marshall density before mat cools below 220°F.',
        spec: 'VDOT Section 315 / Marshall Mix Design AASHTO T245',
      },
      {
        type: 'MANDATORY',
        action: 'Raise plant temperature 25–30°F above standard mix design to compensate for ambient heat loss during transport.',
        spec: 'NAPA QIP-116: Paving in Cold Weather',
      },
      {
        type: 'RECOMMENDED',
        action: 'Pre-heat existing pavement surface with propane-fired infrared heaters. Target base temp ≥ 50°F prior to first lift placement.',
        cost: 3800,
      },
      {
        type: 'RECOMMENDED',
        action: 'Insulated truck tarps on all haul vehicles. Maximum haul distance 15 miles. No holding time exceeding 45 minutes.',
      },
    ],
  },
  {
    id: 'wet_earthwork',
    label: 'Wet Subgrade Earthwork / Compaction',
    icon: <CloudRain className="w-5 h-5 text-cyan-400" />,
    weatherCondition: 'Soil moisture 18% above Proctor optimum — Compaction test will fail',
    waitCost: 45000,
    executeCost: 22000,
    daysToIdeal: 7,
    countermeasures: [
      {
        type: 'MANDATORY',
        action: 'Import 200 tons of Portland Cement Type I/II or agricultural lime (CaO) and blade-mix into top 12 inches of subgrade. This chemically dries the soil and raises pH, destroying expansive clay plasticity.',
        spec: 'VDOT Section 303 / ASTM D559 — Soil-Lime Stabilization',
        cost: 18000,
      },
      {
        type: 'MANDATORY',
        action: 'Allow 24-hour cure time after lime stabilization before compaction attempt. Re-test moisture content with nuclear gauge — must be within ±2% of optimum before rolling.',
        spec: 'AASHTO T99 / T180 Modified Proctor',
      },
      {
        type: 'MANDATORY',
        action: 'Geotextile fabric (Mirafi 500X or equal) placed over treated subgrade before aggregate base placement. Prevents subgrade pumping under compaction.',
        spec: 'VDOT Road & Bridge Spec Section 303.04',
        cost: 4200,
      },
      {
        type: 'RECOMMENDED',
        action: 'Blade and scarify surface to 6-inch depth to accelerate natural drying. Operate motor grader in aeration mode 4–6 hours before lime application.',
      },
      {
        type: 'RECOMMENDED',
        action: 'Install temporary interceptor swales and silt fence to divert incoming water away from active work zone during stabilization.',
        cost: 1500,
      },
    ],
  },
  {
    id: 'schedule_crash',
    label: 'Schedule Crashing — Incoming Storm System',
    icon: <CloudRain className="w-5 h-5 text-orange-400" />,
    weatherCondition: '14-day rain system approaching in 8 days — Will push project past contract deadline',
    waitCost: 70000,
    executeCost: 15000,
    daysToIdeal: 22,
    countermeasures: [
      {
        type: 'CRITICAL',
        action: 'Authorize $15,000 in double-time weekend labor (Saturday + Sunday). This compresses 14 workdays into 10 days, beating the incoming storm system by 4 days.',
        spec: 'Davis-Bacon Double-Time Threshold — verify wage determination',
        cost: 15000,
      },
      {
        type: 'MANDATORY',
        action: 'Mobilize second paving crew and second paver machine for parallel operations. Split site into two active paving zones to double daily production rate.',
        cost: 8500,
      },
      {
        type: 'MANDATORY',
        action: 'Pre-order all aggregate base material and stage on site immediately. Do not wait for daily deliveries — eliminate all material delay risk.',
        cost: 2200,
      },
      {
        type: 'RECOMMENDED',
        action: 'Notify asphalt plant 72 hours in advance of surge production requirement. Secure priority batch queue to avoid plant scheduling conflicts during peak season.',
      },
      {
        type: 'RECOMMENDED',
        action: 'Brief superintendent and foremen on compressed schedule. Post revised CPM on job-site bulletin board. Daily stand-up meetings at 6:00 AM.',
      },
    ],
  },
  {
    id: 'wind_crane',
    label: 'High-Wind Crane / Steel Erection',
    icon: <Wind className="w-5 h-5 text-yellow-400" />,
    weatherCondition: '35mph sustained winds — Federal OSHA crane wind limit exceeded',
    waitCost: 35000,
    executeCost: 0,
    daysToIdeal: 3,
    countermeasures: [
      {
        type: 'CRITICAL',
        action: 'FEDERAL OSHA HARD STOP: DO NOT LIFT. OSHA 1926.1431(k)(8) prohibits crane operations when wind exceeds manufacturer\'s rated limit (typically 25–30mph). No override permitted — criminal negligence exposure.',
        spec: 'OSHA CFR 29 1926.1431(k)(8) — Suspended Personnel Platforms',
      },
      {
        type: 'MANDATORY',
        action: 'Resequence work. Assign all available crew to ground-level tasks: rebar tying, formwork, MEP rough-in, concrete work, or earthwork that does not require crane.',
      },
      {
        type: 'MANDATORY',
        action: 'Tag-out and lock crane boom in stowed position. Issue weather hold notice to all subs. Document wind readings every 2 hours in daily log.',
      },
      {
        type: 'RECOMMENDED',
        action: 'Deploy portable weather station on-site for real-time anemometer readings. Resume lift operations when sustained wind drops below 20mph for 30 continuous minutes.',
      },
    ],
  },
  {
    id: 'frost_concrete',
    label: 'Cold Weather Concrete Pour',
    icon: <Thermometer className="w-5 h-5 text-indigo-400" />,
    weatherCondition: '29°F ambient temperature — Freeze damage risk to fresh concrete',
    waitCost: 50000,
    executeCost: 18000,
    daysToIdeal: 10,
    countermeasures: [
      {
        type: 'MANDATORY',
        action: 'Specify Type III High Early Strength cement or add 3% calcium chloride admixture to accelerate set time. Target 2,000 PSI within 24 hours before freeze cycle.',
        spec: 'ACI 306R Cold Weather Concreting Guide / ASTM C150 Type III',
        cost: 4500,
      },
      {
        type: 'MANDATORY',
        action: 'Enclose full slab area with polyethylene sheeting and propane or electric ground heaters. Maintain minimum 50°F for 7 days post-pour. Do not allow surface to freeze.',
        spec: 'ACI 306R Section 8 — Curing Requirements',
        cost: 9200,
      },
      {
        type: 'MANDATORY',
        action: 'Heat mix water to 140°F at batch plant. Verify concrete delivery temperature ≥ 55°F at point of placement using calibrated thermometer.',
        spec: 'ASTM C1064 — Temperature of Freshly Mixed Concrete',
      },
      {
        type: 'RECOMMENDED',
        action: 'Pre-heat subgrade with ground heaters 24 hours before pour. Frozen subgrade will wick heat from slab and cause differential cracking.',
        cost: 3800,
      },
      {
        type: 'RECOMMENDED',
        action: 'Increase concrete cover over rebar by 0.5 inches. Cold weather increases risk of corrosion-induced spalling if freeze/thaw cycles occur before full cure.',
      },
    ],
  },
];

// ─────────────────────────────────────────────
// Arbitration engine
// ─────────────────────────────────────────────
function runArbitration(
  scenario: RiskScenario,
  ldPerDay: number,
  daysRemaining: number,
  superintendentName: string,
): ArbitrationVerdict {
  const totalLdExposure = ldPerDay * Math.max(scenario.daysToIdeal - daysRemaining, 0);
  const waitCost = Math.max(totalLdExposure, scenario.waitCost);
  const executeCost = scenario.executeCost;
  const netSavings = waitCost - executeCost;

  // Wind/crane is a hard OSHA stop — never override
  if (scenario.id === 'wind_crane') {
    return {
      decision: 'WAIT',
      headline: '⛔ FEDERAL OSHA HARD STOP — CRANE OPERATIONS PROHIBITED',
      rationale: `OSHA CFR 29 1926.1431(k)(8) prohibits crane operations at current wind speed. This is not a financial risk decision — this is a federal criminal negligence threshold. Resequence to ground-level tasks. Resumption requires verified sustained wind < 20mph for 30 continuous minutes.`,
      netSavings: 0,
      riskLevel: 'CRITICAL',
      countermeasures: scenario.countermeasures,
      auditTimestamp: new Date().toISOString(),
      auditSignature: superintendentName || 'SYSTEM',
    };
  }

  if (daysRemaining <= 0) {
    return {
      decision: 'EXECUTE_NOW',
      headline: '🚨 DEADLINE BREACH IMMINENT — FORCED EXECUTION AUTHORIZED',
      rationale: `Contract deadline has been reached. LD exposure of $${ldPerDay.toLocaleString()}/day is now active. Executing under current conditions is the only path to cost containment. Physics-Cheating countermeasures are MANDATORY — do not proceed without implementing all MANDATORY items.`,
      netSavings: waitCost,
      riskLevel: 'CRITICAL',
      countermeasures: scenario.countermeasures,
      auditTimestamp: new Date().toISOString(),
      auditSignature: superintendentName || 'SYSTEM',
    };
  }

  if (netSavings > 10000) {
    return {
      decision: scenario.id === 'schedule_crash' ? 'CRASH_SCHEDULE' : 'EXECUTE_NOW',
      headline: scenario.id === 'schedule_crash'
        ? '⚡ CRASH SCHEDULE AUTHORIZED — BEAT THE STORM'
        : `✅ EXECUTE NOW — MITIGATED RISK CHEAPER THAN WAITING`,
      rationale: `Waiting for ideal conditions costs $${waitCost.toLocaleString()} in Liquidated Damages exposure. Executing today with countermeasures costs $${executeCost.toLocaleString()} in corrective risk. Net savings to execute: $${netSavings.toLocaleString()}. Implementing all MANDATORY countermeasures reduces execution risk to an acceptable level.`,
      netSavings,
      riskLevel: executeCost > 20000 ? 'HIGH' : 'MEDIUM',
      countermeasures: scenario.countermeasures,
      auditTimestamp: new Date().toISOString(),
      auditSignature: superintendentName || 'SYSTEM',
    };
  }

  return {
    decision: 'WAIT',
    headline: '⏸ HOLD — WAITING IS CHEAPER THAN EXECUTING',
    rationale: `Ideal conditions arrive in ${scenario.daysToIdeal} days. Executing today risks $${executeCost.toLocaleString()} in warranty/repair costs. LD exposure for waiting: $${waitCost.toLocaleString()}. Net savings to wait: $${(executeCost - waitCost).toLocaleString()}. Recommendation: Resequence other phases during the hold period.`,
    netSavings: executeCost - waitCost,
    riskLevel: 'LOW',
    countermeasures: [],
    auditTimestamp: new Date().toISOString(),
    auditSignature: superintendentName || 'SYSTEM',
  };
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export default function RealityEngineNode() {
  const [ldPerDay, setLdPerDay] = useState<number>(5000);
  const [ldInput, setLdInput] = useState<string>('5000');
  const [daysRemaining, setDaysRemaining] = useState<number>(10);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioKey>('cold_asphalt');
  const [superintendentName, setSuperintendentName] = useState<string>('');
  const [verdict, setVerdict] = useState<ArbitrationVerdict | null>(null);
  const [forceAgreed, setForceAgreed] = useState<boolean>(false);
  const [showAuditLog, setShowAuditLog] = useState<boolean>(false);
  const [auditLog, setAuditLog] = useState<ArbitrationVerdict[]>([]);

  const scenario = SCENARIOS.find((s) => s.id === selectedScenario)!;

  const handleRunArbitration = useCallback(() => {
    const result = runArbitration(scenario, ldPerDay, daysRemaining, superintendentName);
    setVerdict(result);
    setForceAgreed(false);
    setAuditLog((prev) => [result, ...prev].slice(0, 20));
  }, [scenario, ldPerDay, daysRemaining, superintendentName]);

  const handleForceExecute = useCallback(() => {
    if (!forceAgreed || !superintendentName.trim()) return;
    const forced: ArbitrationVerdict = {
      decision: 'EXECUTE_NOW',
      headline: '⚠️ SUPERINTENDENT OVERRIDE — EXECUTION FORCED AGAINST AI RECOMMENDATION',
      rationale: `Superintendent "${superintendentName}" manually overrode the Worden Reality Engine's recommendation at ${new Date().toLocaleString()}. Full financial and legal liability for execution outcome assumed by ${superintendentName}. Worden OS and J. Worden & Sons are held harmless.`,
      netSavings: 0,
      riskLevel: 'CRITICAL',
      countermeasures: scenario.countermeasures,
      auditTimestamp: new Date().toISOString(),
      auditSignature: superintendentName,
    };
    setVerdict(forced);
    setAuditLog((prev) => [forced, ...prev].slice(0, 20));
  }, [forceAgreed, superintendentName, scenario]);

  const verdictColors: Record<string, string> = {
    EXECUTE_NOW: 'border-green-500 bg-green-950/30',
    WAIT: 'border-yellow-500 bg-yellow-950/20',
    CRASH_SCHEDULE: 'border-orange-500 bg-orange-950/30',
  };

  const riskBadge: Record<string, string> = {
    LOW: 'bg-green-900/60 text-green-300 border border-green-700',
    MEDIUM: 'bg-yellow-900/60 text-yellow-300 border border-yellow-700',
    HIGH: 'bg-orange-900/60 text-orange-300 border border-orange-700',
    CRITICAL: 'bg-red-900/60 text-red-300 border border-red-700 animate-pulse',
  };

  const cmBadge: Record<string, string> = {
    MANDATORY: 'bg-red-900/80 text-red-200 border border-red-600',
    CRITICAL: 'bg-red-950/90 text-red-100 border border-red-500 font-black',
    RECOMMENDED: 'bg-blue-900/60 text-blue-200 border border-blue-700',
  };

  return (
    <section className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Node Header */}
      <div className="bg-gradient-to-r from-red-950/60 via-[#0f0f0f] to-[#0f0f0f] border-b border-zinc-800 px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-400">
              Worden Reality Engine v3.0 — Must-Complete Arbitration Node
            </span>
          </div>
          <h2 className="text-3xl font-black uppercase text-white tracking-tight">
            ⚡ Risk vs. Penalty <span className="text-[#ffcc00]">Arbitration</span>
          </h2>
          <p className="text-zinc-200 text-sm font-bold mt-1">
            Bridges the gap between perfect AI conditions and the brutal reality of hitting your deadline.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAuditLog(!showAuditLog)}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-[#ffcc00] border border-zinc-800 hover:border-[#ffcc00]/40 px-4 py-2 transition-all"
        >
          <Clock className="w-3 h-3" />
          Audit Log ({auditLog.length})
        </button>
      </div>

      <div className="p-8 space-y-8">

        {/* ── INPUTS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

          {/* Liquidated Damages */}
          <div className="col-span-1 md:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <label className="block text-[10px] font-black uppercase tracking-widest text-[#ffcc00] mb-3 flex items-center gap-2">
              <DollarSign className="w-3 h-3" />
              Liquidated Damages ($/Day)
            </label>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-3xl font-black text-white">${Number(ldPerDay).toLocaleString()}</span>
              <span className="text-xs text-zinc-300 font-bold uppercase">/day penalty</span>
            </div>
            <input
              type="range"
              min={500}
              max={50000}
              step={500}
              value={ldPerDay}
              onChange={(e) => {
                const val = Number(e.target.value);
                setLdPerDay(val);
                setLdInput(String(val));
              }}
              className="w-full accent-[#ffcc00] mb-3"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-200 font-bold">Or enter exact:</span>
              <span className="text-zinc-300 font-bold">$</span>
              <input
                type="number"
                value={ldInput}
                min={0}
                onChange={(e) => {
                  setLdInput(e.target.value);
                  const val = Number(e.target.value);
                  if (!isNaN(val) && val >= 0) setLdPerDay(val);
                }}
                className="w-28 bg-black border border-zinc-700 text-white px-3 py-1.5 text-sm font-bold focus:border-[#ffcc00] outline-none"
              />
            </div>
            <p className="text-[10px] text-zinc-200 mt-2 font-bold uppercase tracking-wider">
              Contract daily penalty for missing deadline
            </p>
          </div>

          {/* Days Remaining */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <label className="block text-[10px] font-black uppercase tracking-widest text-[#ffcc00] mb-3 flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Days to Deadline
            </label>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-3xl font-black text-white">{daysRemaining}</span>
              <span className="text-xs text-zinc-300 font-bold uppercase">days left</span>
            </div>
            <input
              type="range"
              min={0}
              max={90}
              step={1}
              value={daysRemaining}
              onChange={(e) => setDaysRemaining(Number(e.target.value))}
              className="w-full accent-[#ffcc00]"
            />
            <div className="flex justify-between text-[10px] text-zinc-200 font-bold mt-1">
              <span>0 (Breach)</span>
              <span>90 Days</span>
            </div>
          </div>

          {/* Superintendent */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <label className="block text-[10px] font-black uppercase tracking-widest text-[#ffcc00] mb-3 flex items-center gap-2">
              <CheckCircle className="w-3 h-3" />
              Superintendent / PM Name
            </label>
            <input
              type="text"
              value={superintendentName}
              onChange={(e) => setSuperintendentName(e.target.value)}
              placeholder="Enter name for audit log"
              className="w-full bg-black border border-zinc-700 text-white px-3 py-3 text-sm font-bold focus:border-[#ffcc00] outline-none placeholder-zinc-600"
            />
            <p className="text-[10px] text-zinc-200 mt-2 font-bold uppercase tracking-wider">
              Bound to all audit records
            </p>
          </div>
        </div>

        {/* ── SCENARIO SELECTOR ── */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-4">
            Active Field Condition / Scenario
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => { setSelectedScenario(s.id); setVerdict(null); }}
                className={`text-left p-4 border rounded-xl transition-all ${
                  selectedScenario === s.id
                    ? 'border-[#ffcc00] bg-[#ffcc00]/5 text-white'
                    : 'border-zinc-800 bg-zinc-900/30 text-zinc-200 hover:border-zinc-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {s.icon}
                  <span className="text-xs font-black uppercase tracking-wide">{s.label}</span>
                </div>
                <p className="text-[10px] text-zinc-300 font-bold">{s.weatherCondition}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Scenario Detail */}
        {scenario && (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {scenario.icon}
                  <span className="text-sm font-black text-white uppercase tracking-wide">{scenario.label}</span>
                </div>
                <p className="text-[#ffcc00] font-bold text-sm">{scenario.weatherCondition}</p>
              </div>
              <div className="flex gap-6 text-center">
                <div>
                  <div className="text-2xl font-black text-red-400">${scenario.waitCost.toLocaleString()}</div>
                  <div className="text-[10px] text-zinc-300 font-bold uppercase">LD Wait Cost</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-yellow-400">${scenario.executeCost.toLocaleString()}</div>
                  <div className="text-[10px] text-zinc-300 font-bold uppercase">Execution Risk</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-zinc-200">{scenario.daysToIdeal}d</div>
                  <div className="text-[10px] text-zinc-300 font-bold uppercase">Days to Ideal</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── RUN ARBITRATION ── */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={handleRunArbitration}
            className="flex-1 flex items-center justify-center gap-3 bg-[#ffcc00] text-black font-black uppercase tracking-widest py-5 text-lg hover:bg-white transition-all shadow-[0_0_30px_rgba(255,204,0,0.25)] border-b-4 border-black/20"
          >
            <Zap className="w-5 h-5" />
            Run Reality Engine Arbitration
          </button>
        </div>

        {/* ── VERDICT ── */}
        {verdict && (
          <div className={`border-2 rounded-2xl p-8 ${verdictColors[verdict.decision] || 'border-zinc-700 bg-zinc-900/30'}`}>

            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
              <div>
                <h3 className="text-2xl font-black text-white leading-tight mb-2">{verdict.headline}</h3>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded ${riskBadge[verdict.riskLevel]}`}>
                    Risk Level: {verdict.riskLevel}
                  </span>
                  {verdict.netSavings > 0 && (
                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded bg-green-900/60 text-green-300 border border-green-700">
                      Net Savings: ${verdict.netSavings.toLocaleString()}
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-zinc-200">
                    {new Date(verdict.auditTimestamp).toLocaleString()}
                    {verdict.auditSignature ? ` — ${verdict.auditSignature}` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Rationale */}
            <div className="bg-black/40 border border-zinc-800 rounded-lg p-6 mb-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-2">AI Arbitration Rationale</p>
              <p className="text-zinc-300 font-bold leading-relaxed">{verdict.rationale}</p>
            </div>

            {/* Countermeasures */}
            {verdict.countermeasures.length > 0 && (
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#ffcc00] mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3" />
                  Physics-Cheating Countermeasures — Field Execution Protocol
                </h4>
                <div className="space-y-3">
                  {verdict.countermeasures.map((cm, i) => (
                    <div key={i} className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-5">
                      <div className="flex items-start gap-4">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded shrink-0 mt-0.5 ${cmBadge[cm.type]}`}>
                          {cm.type}
                        </span>
                        <div className="flex-1">
                          <p className="text-white font-bold text-sm leading-relaxed">{cm.action}</p>
                          {cm.spec && (
                            <p className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider mt-2">
                              Spec Ref: {cm.spec}
                            </p>
                          )}
                          {cm.cost && (
                            <p className="text-[10px] text-[#ffcc00] font-black uppercase tracking-wider mt-1">
                              Est. Cost: ${cm.cost.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Force Execute Override (only when verdict is WAIT and not a hard OSHA stop) */}
            {verdict.decision === 'WAIT' && scenario.id !== 'wind_crane' && (
              <div className="mt-8 border border-red-900/50 rounded-xl p-6 bg-red-950/20">
                <h4 className="text-sm font-black uppercase tracking-widest text-red-400 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Superintendent Override — Force Execute Against Recommendation
                </h4>
                <p className="text-zinc-200 text-sm font-bold mb-4">
                  By clicking "Force Execute," <strong className="text-white">{superintendentName || '[Superintendent Name Required]'}</strong> personally assumes 100% financial liability for execution outcome and waives all claims against J. Worden &amp; Sons and the Worden OS platform.
                </p>
                <div className="flex items-start gap-3 mb-4">
                  <input
                    id="force-agree"
                    type="checkbox"
                    checked={forceAgreed}
                    onChange={(e) => setForceAgreed(e.target.checked)}
                    className="mt-0.5 accent-red-500 w-4 h-4"
                  />
                  <label htmlFor="force-agree" className="text-sm text-zinc-300 font-bold cursor-pointer">
                    I, <strong className="text-white">{superintendentName || '[name above]'}</strong>, understand I am overriding the AI recommendation. I accept 100% financial and legal responsibility for the outcome of this execution decision.
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleForceExecute}
                  disabled={!forceAgreed || !superintendentName.trim()}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest px-6 py-3 transition-all text-sm"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Force Execute — I Accept All Liability
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── AUDIT LOG ── */}
        {showAuditLog && auditLog.length > 0 && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#ffcc00] mb-4 flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Immutable Audit Log — Black Box Record
            </h4>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {auditLog.map((entry, i) => (
                <div key={i} className="flex items-start gap-4 border-b border-zinc-900 pb-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    entry.riskLevel === 'CRITICAL' ? 'bg-red-500' :
                    entry.riskLevel === 'HIGH' ? 'bg-orange-500' :
                    entry.riskLevel === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-white truncate">{entry.headline}</p>
                    <p className="text-[10px] text-zinc-300 font-bold mt-0.5">
                      {new Date(entry.auditTimestamp).toLocaleString()}
                      {entry.auditSignature ? ` · ${entry.auditSignature}` : ''}
                    </p>
                  </div>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded shrink-0 ${riskBadge[entry.riskLevel]}`}>
                    {entry.riskLevel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legal Disclaimer Footer */}
        <div className="border-t border-zinc-900 pt-6">
          <p className="text-[10px] text-zinc-200 font-bold uppercase tracking-widest leading-relaxed">
            ⚖️ Advisory Tool Only — The Worden Reality Engine is an AI-powered advisory system. All construction decisions are the sole responsibility of the licensed Superintendent and Project Manager on site. This platform does not replace professional engineering judgment, OSHA regulations, or contract obligations. All override actions are recorded in the immutable audit log. J. Worden &amp; Sons and the Worden OS platform are held harmless from outcomes resulting from user-initiated execution decisions.
          </p>
        </div>
      </div>
    </section>
  );
}
