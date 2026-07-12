import { useState, useMemo } from 'react';
import {
  CloudRain,
  Wind,
  Thermometer,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Droplets,
  Calendar,
  DollarSign,
  Info,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type PaveRisk = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

interface DayForecast {
  day: number;
  date: string;
  dayName: string;
  ambientTempF: number;
  groundTempF: number;
  windSpeedMph: number;
  precipChance: number;   // 0–100
  precipInches: number;   // expected rainfall
  humidity: number;       // 0–100
  condition: string;
  risk: PaveRisk;
  profitImpact: number;   // dollars — positive = protected, negative = loss
  recommendation: string;
  warnings: string[];
}

// ─── Simulation helpers ───────────────────────────────────────────────────────

function seedRand(seed: number) {
  // Simple deterministic pseudo-random based on seed so renders stay stable
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function calcRisk(
  ambientTempF: number,
  groundTempF: number,
  windSpeedMph: number,
  precipChance: number,
  precipInches: number,
): PaveRisk {
  if (precipChance >= 70 || precipInches >= 0.5 || groundTempF < 40) return 'CRITICAL';
  if (precipChance >= 45 || groundTempF < 50 || windSpeedMph > 20 || ambientTempF < 45) return 'HIGH';
  if (precipChance >= 25 || groundTempF < 55 || windSpeedMph > 12 || ambientTempF < 55) return 'MODERATE';
  return 'LOW';
}

function calcProfitImpact(risk: PaveRisk, baseProjectValue: number): number {
  switch (risk) {
    case 'LOW':      return Math.round(baseProjectValue * 0.18);   // full margin
    case 'MODERATE': return Math.round(baseProjectValue * 0.06);   // reduced margin
    case 'HIGH':     return -Math.round(baseProjectValue * 0.25);  // partial loss
    case 'CRITICAL': return -Math.round(baseProjectValue * 0.55);  // ruined mat
  }
}

function buildWarnings(
  ambientTempF: number,
  groundTempF: number,
  windSpeedMph: number,
  precipChance: number,
  precipInches: number,
): string[] {
  const w: string[] = [];
  if (groundTempF < 40) w.push('Ground temp below 40°F — asphalt will chill before compaction.');
  else if (groundTempF < 50) w.push('Ground temp < 50°F — risk of rapid bottom-up cooling.');
  if (ambientTempF < 45) w.push('Ambient air too cold — VDOT Sec 315 minimum not met.');
  if (windSpeedMph > 20) w.push('High winds (> 20 mph) — surface cools 50 %+ faster; keep rollers ≤ 15 ft behind screed.');
  else if (windSpeedMph > 12) w.push('Moderate wind — keep breakdown roller tight to paver.');
  if (precipChance >= 70) w.push(`${precipChance}% rain probability — mat failure risk EXTREME.`);
  else if (precipChance >= 45) w.push(`${precipChance}% rain probability — sub-base washout likely.`);
  else if (precipChance >= 25) w.push(`${precipChance}% rain chance — monitor radar closely.`);
  if (precipInches >= 1.0) w.push('Expected precip ≥ 1 inch — delay all grading & stone base work.');
  else if (precipInches >= 0.5) w.push('Expected precip ≥ 0.5 inch — sub-base saturation risk.');
  return w;
}

function buildRecommendation(risk: PaveRisk, day: number, forecast: DayForecast[]): string {
  const nextLow = forecast.slice(day).findIndex((d) => d.risk === 'LOW');
  const nextLowDay = nextLow >= 0 ? day + nextLow + 1 : null;

  switch (risk) {
    case 'LOW':
      return 'Optimal paving window. Full compaction achievable. Proceed — protect margin.';
    case 'MODERATE':
      return nextLowDay
        ? `Marginal conditions. Proceed with caution or defer to Day ${nextLowDay} for optimal margin.`
        : 'Marginal conditions. Proceed with roller protocols adjusted for wind/temp.';
    case 'HIGH':
      return nextLowDay
        ? `HIGH RISK — recommend rescheduling to Day ${nextLowDay}. Current conditions threaten 96% Marshall density.`
        : 'HIGH RISK — hold paving. Grading and prep only. Monitor 48-hr radar.';
    case 'CRITICAL':
      return nextLowDay
        ? `DO NOT PAVE. Reschedule crew & material to Day ${nextLowDay}. Proceed with washout prevention.`
        : 'DO NOT PAVE. Full stop. Risk of total mat failure and sub-base loss.';
  }
}

function generateForecast(baseProjectValue: number): DayForecast[] {
  const today = new Date();
  const days: DayForecast[] = [];

  // Seasonal base — late spring / mid-season
  const baseTempF = 68;
  const conditions = ['Clear', 'Partly Cloudy', 'Overcast', 'Showers', 'Thunderstorms', 'Sunny', 'Light Rain', 'Fog'];

  for (let i = 0; i < 30; i++) {
    const r = (offset: number) => seedRand(i * 13 + offset);

    const tempSwing = (r(1) - 0.5) * 28;
    const ambientTempF = Math.round(baseTempF + tempSwing + Math.sin(i * 0.4) * 8);
    const groundTempF  = Math.round(ambientTempF - 4 - r(2) * 10);
    const windSpeedMph = Math.round(r(3) * 30);
    const precipChance = Math.round(r(4) * 100);
    const precipInches  = precipChance > 40 ? Math.round((precipChance / 100) * r(5) * 20) / 10 : 0;
    const humidity      = Math.round(40 + r(6) * 55);

    const conditionIndex = precipChance > 70 ? 4 : precipChance > 45 ? 3 : precipChance > 25 ? 6 : r(7) > 0.5 ? 0 : 1;
    const condition = conditions[conditionIndex];

    const risk = calcRisk(ambientTempF, groundTempF, windSpeedMph, precipChance, precipInches);
    const profitImpact = calcProfitImpact(risk, baseProjectValue);
    const warnings = buildWarnings(ambientTempF, groundTempF, windSpeedMph, precipChance, precipInches);

    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    days.push({
      day: i + 1,
      date: dateStr,
      dayName,
      ambientTempF,
      groundTempF,
      windSpeedMph,
      precipChance,
      precipInches,
      humidity,
      condition,
      risk,
      profitImpact,
      recommendation: '', // filled after loop
      warnings,
    });
  }

  // Fill recommendations with look-ahead
  for (let i = 0; i < days.length; i++) {
    days[i].recommendation = buildRecommendation(days[i].risk, i, days);
  }

  return days;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const RISK_CONFIG: Record<PaveRisk, { label: string; color: string; bg: string; border: string; icon: typeof CheckCircle }> = {
  LOW:      { label: 'LOW RISK',      color: 'text-emerald-400', bg: 'bg-emerald-900/20',  border: 'border-emerald-500/40',  icon: CheckCircle  },
  MODERATE: { label: 'MODERATE',      color: 'text-yellow-400',  bg: 'bg-yellow-900/20',   border: 'border-yellow-500/40',   icon: AlertTriangle },
  HIGH:     { label: 'HIGH RISK',     color: 'text-orange-400',  bg: 'bg-orange-900/20',   border: 'border-orange-500/40',   icon: AlertTriangle },
  CRITICAL: { label: 'CRITICAL — NO PAVE', color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-500/40',  icon: XCircle      },
};

function RiskBadge({ risk }: { risk: PaveRisk }) {
  const cfg = RISK_CONFIG[risk];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-sm border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

function ProfitBadge({ amount }: { amount: number }) {
  const positive = amount >= 0;
  return (
    <span className={`inline-flex items-center gap-1 font-black text-sm ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
      {positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
      {positive ? '+' : ''}${Math.abs(amount).toLocaleString()}
    </span>
  );
}

function DayCard({ d, isSelected, onClick }: { d: DayForecast; isSelected: boolean; onClick: () => void }) {
  const cfg = RISK_CONFIG[d.risk];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-3 rounded-lg border cursor-pointer transition-all min-w-[72px] select-none
        ${isSelected ? `${cfg.bg} ${cfg.border} ring-2 ring-offset-1 ring-offset-zinc-950 ${cfg.border.replace('border-', 'ring-')}` : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'}`}
    >
      <span className="text-[10px] font-bold uppercase text-zinc-300">{d.dayName}</span>
      <span className="text-[11px] font-black text-zinc-200">{d.date}</span>
      <span className={`text-[10px] font-black uppercase ${cfg.color}`}>
        {d.risk === 'LOW' ? '✓ PAVE' : d.risk === 'MODERATE' ? '⚠ CAUTION' : d.risk === 'HIGH' ? '⚠ RISK' : '✗ NO-PAVE'}
      </span>
      <span className={`text-[10px] font-bold ${d.profitImpact >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
        {d.profitImpact >= 0 ? '+' : ''}${(d.profitImpact / 1000).toFixed(0)}K
      </span>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WeatherIntel() {
  const BASE_PROJECT_VALUE = 85000; // default simulated project value
  const forecast = useMemo(() => generateForecast(BASE_PROJECT_VALUE), []);

  const [selectedDay, setSelectedDay] = useState(0);
  const [projectValue, setProjectValue] = useState(BASE_PROJECT_VALUE);
  const [showInfo, setShowInfo] = useState(false);

  // Re-compute profit impacts when project value changes
  const adjustedForecast = useMemo<DayForecast[]>(() => {
    return forecast.map((d) => ({
      ...d,
      profitImpact: calcProfitImpact(d.risk, projectValue),
    }));
  }, [forecast, projectValue]);

  const day = adjustedForecast[selectedDay];
  const cfg = RISK_CONFIG[day.risk];
  const Icon = cfg.icon;

  // Summary stats
  const lowDays      = adjustedForecast.filter((d) => d.risk === 'LOW').length;
  const moderateDays = adjustedForecast.filter((d) => d.risk === 'MODERATE').length;
  const highDays     = adjustedForecast.filter((d) => d.risk === 'HIGH').length;
  const criticalDays = adjustedForecast.filter((d) => d.risk === 'CRITICAL').length;
  const totalPotentialGain = adjustedForecast.reduce((s, d) => s + (d.profitImpact > 0 ? d.profitImpact : 0), 0);
  const totalPotentialLoss = adjustedForecast.reduce((s, d) => s + (d.profitImpact < 0 ? d.profitImpact : 0), 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans pt-36 pb-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="bg-[#ffcc00] text-black px-4 py-1 text-[10px] font-black uppercase tracking-[0.4em]">
              Enterprise Dispatch Node
            </span>
            <span className="border border-zinc-700 text-zinc-200 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
              Meteorological Intelligence v3.0
            </span>
            <button
              type="button"
              onClick={() => setShowInfo(!showInfo)}
              className="ml-auto text-zinc-300 hover:text-[#ffcc00] transition-colors"
              aria-label="Toggle info"
            >
              <Info size={18} />
            </button>
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none">
            30-DAY <span className="text-[#ffcc00]">PAVE / NO-PAVE</span>
          </h1>
          <p className="mt-4 text-zinc-200 text-lg font-bold max-w-3xl">
            Financial meteorological engine for heavy highway &amp; asphalt paving. Every forecast day is evaluated against 96% Marshall compaction thresholds, VDOT ground-temp minimums, wind-chill cooling rates, and sub-base washout risk — then converted into projected profit or loss.
          </p>

          {showInfo && (
            <div className="mt-4 bg-zinc-900 border border-zinc-700 rounded-xl p-6 text-sm text-zinc-200 space-y-2">
              <p><span className="text-[#ffcc00] font-black">Ground Temp Logic:</span> VDOT Sec 315 requires a minimum 40°F surface temp for compaction. Below 50°F the mat cools from the bottom up before rollers reach it, jeopardizing 96% Marshall density.</p>
              <p><span className="text-[#ffcc00] font-black">Wind-Chill Cooling Factor:</span> Every 5 mph above 10 mph cuts effective mat temperature by ~6°F. Above 20 mph the surface cools 50% faster — rollers must stay within 15 ft of the screed.</p>
              <p><span className="text-[#ffcc00] font-black">Moisture / Washout Risk:</span> Rain ≥ 0.5 inch saturates the sub-base, causing "mud pumping" beneath the new mat. All grading and stone-base work should be deferred if ≥ 0.5 inch is forecast within 48 hours.</p>
              <p><span className="text-[#ffcc00] font-black">$9/Ton Oil-Price Shield:</span> Worden Standard includes a ±$9/ton liquid asphalt price buffer. Profit projections here reflect mat material costs, not the full contract value.</p>
            </div>
          )}
        </div>

        {/* ── Project Value Slider ── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-3">
            <DollarSign className="text-[#ffcc00]" size={20} />
            <span className="text-sm font-black uppercase tracking-widest text-zinc-300">Active Project Value</span>
          </div>
          <div className="flex-1 flex items-center gap-4">
            <input
              type="range"
              min={10000}
              max={500000}
              step={5000}
              value={projectValue}
              onChange={(e) => setProjectValue(Number(e.target.value))}
              className="flex-1 accent-[#ffcc00] h-1.5"
              aria-label="Active project value"
            />
            <span className="text-[#ffcc00] font-black text-xl min-w-[110px] text-right">
              ${projectValue.toLocaleString()}
            </span>
          </div>
        </div>

        {/* ── 30-Day Summary Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: '✓ Optimal Days',  value: lowDays,      color: 'text-emerald-400', sub: 'Full margin achievable' },
            { label: '⚠ Caution Days', value: moderateDays, color: 'text-yellow-400',  sub: 'Reduced margin' },
            { label: '⚠ High-Risk Days', value: highDays,   color: 'text-orange-400',  sub: 'Partial loss risk' },
            { label: '✗ No-Pave Days',  value: criticalDays, color: 'text-red-400',    sub: 'Mat failure risk' },
          ].map((s) => (
            <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className={`text-4xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs font-black uppercase tracking-widest text-zinc-200 mt-1">{s.label}</div>
              <div className="text-[10px] text-zinc-200 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Financial Exposure Banner ── */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-5 flex items-center gap-4">
            <TrendingUp className="text-emerald-400 shrink-0" size={28} />
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-emerald-400/70">30-Day Protected Profit</div>
              <div className="text-3xl font-black text-emerald-400">+${totalPotentialGain.toLocaleString()}</div>
              <div className="text-xs text-zinc-300 mt-0.5">If all optimal windows are utilized</div>
            </div>
          </div>
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-5 flex items-center gap-4">
            <TrendingDown className="text-red-400 shrink-0" size={28} />
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-red-400/70">30-Day Exposure If Not Rescheduled</div>
              <div className="text-3xl font-black text-red-400">-${Math.abs(totalPotentialLoss).toLocaleString()}</div>
              <div className="text-xs text-zinc-300 mt-0.5">Mat failures + washout + warranty repairs</div>
            </div>
          </div>
        </div>

        {/* ── 30-Day Calendar Scroll ── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-5">
            <Calendar className="text-[#ffcc00]" size={18} />
            <span className="text-sm font-black uppercase tracking-widest text-zinc-300">30-Day Forecast Calendar</span>
            <span className="text-xs text-zinc-200 ml-2">Select a day for full analysis</span>
          </div>
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-2 w-max">
              {adjustedForecast.map((d, i) => (
                <DayCard
                  key={d.day}
                  d={d}
                  isSelected={i === selectedDay}
                  onClick={() => setSelectedDay(i)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Selected Day Detail ── */}
        <div className={`rounded-2xl border-2 p-6 md:p-8 ${cfg.bg} ${cfg.border} transition-all`}>
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-zinc-200 mb-1">
                Day {day.day} — {day.dayName}, {day.date}
              </div>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none">
                {day.condition}
              </h2>
            </div>
            <div className="flex flex-col items-end gap-2">
              <RiskBadge risk={day.risk} />
              <div className="flex items-center gap-2">
                <Icon size={16} className={cfg.color} />
                <ProfitBadge amount={day.profitImpact} />
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {[
              {
                icon: Thermometer,
                label: 'Ambient Air',
                value: `${day.ambientTempF}°F`,
                sub: day.ambientTempF < 45 ? '⚠ Below VDOT min' : 'Acceptable',
                alert: day.ambientTempF < 45,
              },
              {
                icon: Thermometer,
                label: 'Ground Temp',
                value: `${day.groundTempF}°F`,
                sub: day.groundTempF < 50 ? '⚠ Cooling risk' : 'Compaction OK',
                alert: day.groundTempF < 50,
              },
              {
                icon: Wind,
                label: 'Wind Speed',
                value: `${day.windSpeedMph} mph`,
                sub: day.windSpeedMph > 20 ? '⚠ High — tight roller' : day.windSpeedMph > 12 ? 'Moderate' : 'Normal',
                alert: day.windSpeedMph > 12,
              },
              {
                icon: CloudRain,
                label: 'Precip Chance',
                value: `${day.precipChance}%`,
                sub: day.precipChance >= 45 ? '⚠ Washout risk' : 'Acceptable',
                alert: day.precipChance >= 25,
              },
              {
                icon: Droplets,
                label: 'Expected Rain',
                value: `${day.precipInches.toFixed(1)} in`,
                sub: day.precipInches >= 0.5 ? '⚠ Sub-base risk' : 'Clear',
                alert: day.precipInches >= 0.5,
              },
              {
                icon: Droplets,
                label: 'Humidity',
                value: `${day.humidity}%`,
                sub: day.humidity > 85 ? 'Tack coat adhesion risk' : 'Normal',
                alert: day.humidity > 85,
              },
            ].map((m) => {
              const MIcon = m.icon;
              return (
                <div
                  key={m.label}
                  className={`rounded-xl p-4 border ${m.alert ? 'bg-orange-950/30 border-orange-500/30' : 'bg-zinc-900 border-zinc-800'}`}
                >
                  <MIcon size={16} className={m.alert ? 'text-orange-400' : 'text-zinc-200'} />
                  <div className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mt-2">{m.label}</div>
                  <div className={`text-2xl font-black mt-0.5 ${m.alert ? 'text-orange-300' : 'text-white'}`}>{m.value}</div>
                  <div className={`text-[10px] mt-1 font-bold ${m.alert ? 'text-orange-400' : 'text-zinc-300'}`}>{m.sub}</div>
                </div>
              );
            })}
          </div>

          {/* Temp Delta Explainer */}
          <div className="bg-zinc-900/60 border border-zinc-700 rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-4 md:items-center">
            <div className="flex-1">
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-1">Ambient ↔ Ground Temp Delta</div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-white">{day.ambientTempF}°F</span>
                <span className="text-zinc-200 font-bold">vs.</span>
                <span className={`text-2xl font-black ${day.groundTempF < 50 ? 'text-orange-400' : 'text-emerald-400'}`}>{day.groundTempF}°F</span>
                <span className="text-zinc-200 font-bold text-sm">
                  (Δ {Math.abs(day.ambientTempF - day.groundTempF)}°F gap)
                </span>
              </div>
              <div className="text-xs text-zinc-300 mt-1">
                {day.groundTempF >= 55
                  ? 'Ground temp adequate — mat will stay workable through full compaction cycle.'
                  : day.groundTempF >= 45
                  ? 'Ground cooling risk — accelerate roller pass schedule to achieve 96% Marshall before mat cools.'
                  : 'Ground too cold — asphalt will chill from bottom up before breakdown roller reaches it.'}
              </div>
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-1">Wind-Chill Cooling Factor</div>
              <div className="text-sm text-zinc-200">
                At <span className="text-white font-bold">{day.windSpeedMph} mph</span>,
                surface cools approximately{' '}
                <span className={`font-bold ${day.windSpeedMph > 12 ? 'text-orange-400' : 'text-emerald-400'}`}>
                  {Math.round((Math.max(0, day.windSpeedMph - 5) / 5) * 6)}°F faster
                </span>{' '}
                per roller pass. {day.windSpeedMph > 20
                  ? 'Reduce paver speed and run breakdown roller within 15 ft of screed.'
                  : day.windSpeedMph > 12
                  ? 'Keep rollers tight — do not allow extended joint exposure.'
                  : 'Wind speed within normal operating parameters.'}
              </div>
            </div>
          </div>

          {/* Warnings */}
          {day.warnings.length > 0 && (
            <div className="bg-zinc-900/60 border border-orange-500/20 rounded-xl p-4 mb-6">
              <div className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-3 flex items-center gap-2">
                <AlertTriangle size={12} />
                Active Warnings ({day.warnings.length})
              </div>
              <ul className="space-y-1.5">
                {day.warnings.map((w) => (
                  <li key={w} className="flex items-start gap-2 text-sm text-zinc-300">
                    <span className="text-orange-400 mt-0.5 shrink-0">›</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendation */}
          <div className={`rounded-xl border p-5 ${cfg.bg} ${cfg.border}`}>
            <div className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
              <Icon size={12} className={cfg.color} />
              <span className={cfg.color}>Superintendent Recommendation</span>
            </div>
            <p className="text-white font-bold text-base leading-relaxed">{day.recommendation}</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Projected Impact:</span>
              <ProfitBadge amount={day.profitImpact} />
              {day.risk !== 'LOW' && (
                <span className="text-xs text-zinc-200">vs. optimal-day profit of +${calcProfitImpact('LOW', projectValue).toLocaleString()}</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Legend ── */}
        <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="text-xs font-black uppercase tracking-widest text-zinc-300 mb-4">Risk Legend &amp; VDOT Thresholds</div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            {(Object.entries(RISK_CONFIG) as [PaveRisk, typeof RISK_CONFIG[PaveRisk]][]).map(([risk, c]) => {
              const LIcon = c.icon;
              return (
                <div key={risk} className={`rounded-lg border p-3 ${c.bg} ${c.border}`}>
                  <div className={`flex items-center gap-2 font-black uppercase tracking-wide mb-1 ${c.color}`}>
                    <LIcon size={12} />
                    {c.label}
                  </div>
                  <div className="text-zinc-300 leading-relaxed">
                    {risk === 'LOW'      && 'Ambient ≥ 55°F · Ground ≥ 55°F · Wind ≤ 12 mph · Precip < 25%'}
                    {risk === 'MODERATE' && 'Ambient 45–54°F or Ground 50–54°F or Wind 13–20 mph or Precip 25–44%'}
                    {risk === 'HIGH'     && 'Ambient < 45°F or Ground < 50°F or Wind > 20 mph or Precip 45–69%'}
                    {risk === 'CRITICAL' && 'Precip ≥ 70% or Rain ≥ 0.5 in or Ground < 40°F — VDOT stop-work threshold'}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-[10px] text-zinc-200">
            Standards: VDOT Section 315 (Asphalt Base/Surface) · AASHTO T245 (Marshall Mix Design) · Worden Standard: 96% Marshall Unit Weight minimum · $9/ton oil-price shield applied to all cost projections.
          </div>
        </div>

      </div>
    </div>
  );
}
