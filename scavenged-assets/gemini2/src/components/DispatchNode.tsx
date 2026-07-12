import { useState, useMemo } from 'react';
import type { ReactElement } from 'react';
import { AlertTriangle, CheckCircle, XCircle, CloudRain, Wind, Thermometer, DollarSign, TrendingDown, TrendingUp, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type Trade = 'asphalt' | 'concrete' | 'earthwork' | 'crane' | 'roofing';

type DayStatus = 'optimal' | 'marginal' | 'nogo';

interface WeatherDay {
  dayIndex: number;          // 1–90
  date: Date;
  month: string;
  dayOfMonth: number;
  dayOfWeek: string;
  tempHigh: number;          // °F ambient
  tempLow: number;           // °F ambient
  groundTemp: number;        // °F soil/ground
  windSpeed: number;         // mph sustained
  precipMM: number;          // mm expected
  humidity: number;          // %
  dewPoint: number;          // °F
  isWeekend: boolean;
}

interface DayAnalysis {
  day: WeatherDay;
  status: DayStatus;
  riskLabel: string;
  financialRisk: number;     // dollars at risk (negative = loss)
  profitProtection: number;  // % of margin protected
  warnings: string[];
  seasonalAlert?: string;
}

// ─── Deterministic weather seeder ────────────────────────────────────────────
// Uses date-based pseudo-random values so the grid is stable & realistic.

function seedRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function generateWeatherDay(index: number, startDate: Date): WeatherDay {
  const date = new Date(startDate);
  date.setDate(startDate.getDate() + index);

  const month = date.getMonth(); // 0 = Jan
  const doy = index;
  const r1 = seedRandom(doy * 7 + 1);
  const r2 = seedRandom(doy * 7 + 2);
  const r3 = seedRandom(doy * 7 + 3);
  const r4 = seedRandom(doy * 7 + 4);
  const r5 = seedRandom(doy * 7 + 5);
  const r6 = seedRandom(doy * 7 + 6);

  // Seasonal temperature baseline (Virginia climate)
  const seasonalHigh: Record<number, number> = {
    0: 42, 1: 47, 2: 57, 3: 67, 4: 76, 5: 84,
    6: 88, 7: 87, 8: 80, 9: 68, 10: 57, 11: 46,
  };
  const base = seasonalHigh[month] ?? 65;
  const tempHigh = Math.round(base + (r1 - 0.5) * 18);
  const tempLow = Math.round(tempHigh - 12 - r2 * 10);
  const groundTemp = Math.round((tempHigh + tempLow) / 2 - 4 - r3 * 6);
  const windSpeed = Math.round(3 + r4 * 22);
  // Rain probability peaks in spring & fall
  const rainProb = month === 3 || month === 4 || month === 9 || month === 10
    ? 0.35 : month === 11 || month === 0 || month === 1 ? 0.25 : 0.18;
  const precipMM = r5 < rainProb ? Math.round(r5 * 60 + 2) : 0;
  const humidity = Math.round(45 + r6 * 40);
  const dewPoint = Math.round(tempLow - 5 + r1 * 8);

  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
  const monthName = date.toLocaleDateString('en-US', { month: 'long' });
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

  return {
    dayIndex: index + 1,
    date,
    month: monthName,
    dayOfMonth: date.getDate(),
    dayOfWeek,
    tempHigh,
    tempLow,
    groundTemp,
    windSpeed,
    precipMM,
    humidity,
    dewPoint,
    isWeekend,
  };
}

// ─── Trade-specific risk engine ───────────────────────────────────────────────

function analyzeDayForTrade(day: WeatherDay, trade: Trade): DayAnalysis {
  const warnings: string[] = [];
  let status: DayStatus = 'optimal';
  let financialRisk = 0;
  let profitProtection = 100;
  let seasonalAlert: string | undefined;

  const month = day.date.getMonth();
  const isFreezing = day.groundTemp < 32 || day.tempLow < 32;
  const isDeepFreeze = day.groundTemp < 20 || day.tempLow < 20;
  const isHotConc = day.tempHigh > 90;
  const isHighWind = day.windSpeed >= 20;
  const isCraneWind = day.windSpeed >= 20;
  const hasRain = day.precipMM > 0;
  const hasHeavyRain = day.precipMM >= 15;
  const isHumidCoating = day.humidity > 85 || Math.abs(day.tempHigh - day.dewPoint) < 5;

  // Seasonal deep-risk flags (long-lead consequence analysis)
  if (isDeepFreeze && trade === 'asphalt') {
    seasonalAlert = `Day ${day.dayIndex} (${day.month}): Deep freeze risk. Ground ${day.groundTemp}°F. Asphalt paving in these conditions will result in near-certain mat failure. ±$42,000 total loss.`;
  }
  if ((month === 11 || month === 0 || month === 1) && trade === 'earthwork') {
    seasonalAlert = `Day ${day.dayIndex} (${day.month}): Winter earthwork — frozen ground. Equipment productivity drops 40%. Compaction impossible below 28°F ground temp. Add $18,000 mobilization cost for cold-weather ops.`;
  }
  if ((month === 11 || month === 0) && trade === 'concrete') {
    seasonalAlert = `Day ${day.dayIndex} (${day.month}): Freeze risk for concrete. Require heated forms & thermal blankets. If delayed 2 weeks, pour moves into frozen conditions — structural failure risk. Cold-weather plan adds $28,000.`;
  }
  if (day.dayIndex >= 60 && (month === 10 || month === 11) && trade === 'earthwork') {
    seasonalAlert = `Day ${day.dayIndex} (${day.month}): Late-season earthwork. If grading is delayed 2 weeks from now, asphalt paving will be pushed into winter conditions — requiring $40,000 in ground heaters & protective tarping.`;
  }

  switch (trade) {
    case 'asphalt': {
      // Ground temp is the critical variable
      if (day.groundTemp < 40) {
        status = 'nogo';
        financialRisk = -42000;
        profitProtection = 0;
        warnings.push(`Ground temp ${day.groundTemp}°F — below 40°F minimum. Mat will chill from bottom up before rollers can set density.`);
        warnings.push('Risk: 100% compaction failure. Total material loss ~$42,000.');
      } else if (day.groundTemp < 50) {
        status = 'marginal';
        financialRisk = -8500;
        profitProtection = 55;
        warnings.push(`Ground temp ${day.groundTemp}°F — marginal. Breakdown roller must follow screed within 15 ft. Risk: 15% density failure.`);
      }
      if (isHighWind) {
        if (status !== 'nogo') { status = 'marginal'; }
        financialRisk = Math.min(financialRisk, -6500);
        profitProtection = Math.min(profitProtection, 60);
        warnings.push(`${day.windSpeed} mph wind — heat strips off mat 40% faster. Surface cools before rollers can achieve 96% Marshall density.`);
      }
      if (hasHeavyRain) {
        status = 'nogo';
        financialRisk = -45000;
        profitProtection = 0;
        warnings.push(`${day.precipMM}mm rain — sub-base washout risk. Paving over wet stone = catastrophic failure in 12–18 months. DO NOT PAVE.`);
      } else if (hasRain) {
        status = 'nogo';
        financialRisk = -18000;
        profitProtection = 0;
        warnings.push(`${day.precipMM}mm rain expected. Moisture in the mat = voids and delamination. Reschedule required.`);
      }
      if (status === 'optimal') {
        warnings.push(`Ground temp ${day.groundTemp}°F ✓ | Wind ${day.windSpeed} mph ✓ | Precip: Clear ✓ — FULL MARGIN PROTECTED.`);
      }
      break;
    }

    case 'concrete': {
      if (isDeepFreeze) {
        status = 'nogo';
        financialRisk = -80000;
        profitProtection = 0;
        warnings.push(`Temp ${day.tempLow}°F — water in mix will freeze. Structural integrity catastrophically compromised. Loss: $80,000+.`);
      } else if (isFreezing) {
        status = 'marginal';
        financialRisk = -22000;
        profitProtection = 40;
        warnings.push('Sub-freezing temps. Require thermal blankets + heated mix. Pour before 8 AM or after sunset. Cold-weather premium: +$22,000.');
      }
      if (isHotConc) {
        if (status !== 'nogo') { status = 'marginal'; }
        financialRisk = Math.min(financialRisk, -15000);
        profitProtection = Math.min(profitProtection, 50);
        warnings.push(`${day.tempHigh}°F high — flash cure risk. Add ice to ready-mix. Schedule 2 AM pour. Failure risk: $120,000 structural slab.`);
      }
      if (hasHeavyRain) {
        status = 'nogo';
        financialRisk = -35000;
        profitProtection = 0;
        warnings.push('Heavy rain will wash surface and compromise water-cement ratio. Do not pour. Loss: $35,000.');
      } else if (hasRain) {
        status = status === 'optimal' ? 'marginal' : status;
        financialRisk = Math.min(financialRisk, -9000);
        profitProtection = Math.min(profitProtection, 65);
        warnings.push('Rain risk. Cover forms. Timed pour window required.');
      }
      if (status === 'optimal') {
        warnings.push(`Temp range ${day.tempLow}–${day.tempHigh}°F ✓ | No precip ✓ | Humidity ${day.humidity}% ✓ — OPTIMAL POUR CONDITIONS.`);
      }
      break;
    }

    case 'earthwork': {
      if (hasHeavyRain) {
        status = 'nogo';
        financialRisk = -28000;
        profitProtection = 0;
        warnings.push(`${day.precipMM}mm rain — site turns to mud. Zero chance of passing Proctor compaction test. Stand down scrapers. Daily rental burn: $4,500.`);
      } else if (hasRain) {
        status = 'marginal';
        financialRisk = -7500;
        profitProtection = 60;
        warnings.push(`${day.precipMM}mm rain. Site moisture will be elevated for 24–48 hrs post-rain. Density tests likely to fail. Grade first thing in the AM.`);
      }
      if (isFreezing) {
        if (status !== 'nogo') { status = 'marginal'; }
        financialRisk = Math.min(financialRisk, -12000);
        profitProtection = Math.min(profitProtection, 45);
        warnings.push(`Ground temp ${day.groundTemp}°F — frozen soil. Equipment productivity -40%. Compaction test failure guaranteed below 28°F.`);
      }
      if (isHighWind && day.windSpeed >= 30) {
        if (status !== 'nogo') { status = 'marginal'; }
        warnings.push(`${day.windSpeed} mph wind — dust control SWPPP violation risk. Erosion control must be staged.`);
      }
      if (status === 'optimal') {
        warnings.push(`Ground moisture optimal | Temp ${day.tempHigh}°F ✓ | Clear ✓ — PROCTOR TEST CONDITIONS FAVORABLE.`);
      }
      break;
    }

    case 'crane': {
      if (day.windSpeed >= 35) {
        status = 'nogo';
        financialRisk = -18000;
        profitProtection = 0;
        warnings.push(`${day.windSpeed} mph sustained — OSHA crane lockout. Catastrophic load failure risk. Secure all booms immediately. Daily crane loss: $5,000.`);
      } else if (isCraneWind) {
        status = 'marginal';
        financialRisk = -5500;
        profitProtection = 55;
        warnings.push(`${day.windSpeed} mph wind — 20 mph OSHA threshold approaching. Monitor gusts. Tag line required on all picks. Defer critical lifts.`);
      }
      // Lightning / heavy rain = full no-go for crane
      if (hasHeavyRain) {
        status = 'nogo';
        financialRisk = Math.min(financialRisk, -5000);
        profitProtection = 0;
        warnings.push('Heavy precipitation — crane ops halted. Lightning risk. Secure boom, evacuate cab.');
      }
      if (status === 'optimal') {
        warnings.push(`Wind ${day.windSpeed} mph ✓ | Clear skies ✓ — GREEN LIGHT FOR PICKS & STEEL ERECTION.`);
      }
      break;
    }

    case 'roofing': {
      if (isHumidCoating) {
        status = 'marginal';
        financialRisk = -14000;
        profitProtection = 50;
        warnings.push(`Dew point ${day.dewPoint}°F / ambient ${day.tempHigh}°F — moisture trapped under coating. Rust-through in 18 months. Delay application.`);
      }
      if (hasRain) {
        status = 'nogo';
        financialRisk = -22000;
        profitProtection = 0;
        warnings.push('Moisture event — TPO/EPDM seams will not cure. Membrane delamination risk. No roofing operations.');
      }
      if (isHighWind) {
        if (status !== 'nogo') { status = 'marginal'; }
        financialRisk = Math.min(financialRisk, -6000);
        profitProtection = Math.min(profitProtection, 55);
        warnings.push(`${day.windSpeed} mph wind — roof insulation boards cannot be set. FM Global wind uplift spec requires calm conditions.`);
      }
      if (isFreezing) {
        status = 'nogo';
        financialRisk = Math.min(financialRisk, -18000);
        profitProtection = 0;
        warnings.push('Sub-freezing — adhesives and sealants will not cure. Modified bitumen cannot be torched in freezing conditions.');
      }
      if (status === 'optimal') {
        warnings.push(`Dew point safe ✓ | Wind ${day.windSpeed} mph ✓ | No precip ✓ — OPTIMAL MEMBRANE APPLICATION WINDOW.`);
      }
      break;
    }
  }

  return { day, status, riskLabel: status === 'optimal' ? 'PAVE/GO' : status === 'marginal' ? 'CAUTION' : 'NO-GO', financialRisk, profitProtection, warnings, seasonalAlert };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const TRADE_CONFIG: Record<Trade, { label: string; emoji: string; spec: string }> = {
  asphalt: { label: 'Asphalt Paving', emoji: '🛣️', spec: 'VDOT Sec 315 / Marshall Mix' },
  concrete: { label: 'Concrete & Structural', emoji: '🏗️', spec: 'ACI 318 / VDOT Flatwork' },
  earthwork: { label: 'Earthwork & Grading', emoji: '⛏️', spec: 'AASHTO T99 / 96% Proctor' },
  crane: { label: 'Crane & Steel Erection', emoji: '🏛️', spec: 'OSHA 1926.1400 Wind Regs' },
  roofing: { label: 'Roofing & Coatings', emoji: '🏠', spec: 'FM Global RoofNav / NRCA' },
};

function StatusDot({ status }: { status: DayStatus }) {
  if (status === 'optimal') return <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />;
  if (status === 'marginal') return <span className="inline-block w-2 h-2 rounded-full bg-yellow-400" />;
  return <span className="inline-block w-2 h-2 rounded-full bg-red-500" />;
}

function DayCell({ analysis, isSelected, onClick }: {
  analysis: DayAnalysis;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { day, status, financialRisk, seasonalAlert } = analysis;

  const bg =
    status === 'optimal' ? 'bg-emerald-900/40 border-emerald-600/30 hover:border-emerald-400' :
    status === 'marginal' ? 'bg-yellow-900/30 border-yellow-600/30 hover:border-yellow-400' :
    'bg-red-900/30 border-red-600/30 hover:border-red-500';

  const selectedRing = isSelected ? 'ring-2 ring-[#ffcc00] ring-offset-1 ring-offset-zinc-950' : '';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center justify-between p-1.5 border rounded cursor-pointer transition-all text-center min-w-0 ${bg} ${selectedRing} ${day.isWeekend ? 'opacity-60' : ''}`}
      title={`Day ${day.dayIndex} — ${status.toUpperCase()}`}
      aria-label={`Day ${day.dayIndex}, ${day.month} ${day.dayOfMonth}, ${status}`}
    >
      {seasonalAlert && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border border-zinc-950 z-10" title="Seasonal risk alert" />
      )}
      <span className="text-[9px] font-bold text-zinc-200 uppercase">{day.dayOfWeek}</span>
      <span className="text-base font-black text-white leading-none">{day.dayOfMonth}</span>
      {financialRisk < 0 && (
        <span className="text-[8px] font-black text-red-300 leading-none">
          ${Math.abs(financialRisk / 1000).toFixed(0)}k
        </span>
      )}
      <StatusDot status={status} />
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function DispatchNode() {
  const [selectedTrade, setSelectedTrade] = useState<Trade>('asphalt');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [viewMonth, setViewMonth] = useState(0); // 0 = Month 1, 1 = Month 2, 2 = Month 3

  // Generate 90 days starting "today"
  const startDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const allDays = useMemo(
    () => Array.from({ length: 90 }, (_, i) => generateWeatherDay(i, startDate)),
    [startDate],
  );

  const analyses = useMemo(
    () => allDays.map((d) => analyzeDayForTrade(d, selectedTrade)),
    [allDays, selectedTrade],
  );

  // Split into 3 months of 30 days each
  const months = [analyses.slice(0, 30), analyses.slice(30, 60), analyses.slice(60, 90)];
  const currentMonthData = months[viewMonth];

  // Aggregate risk stats across all 90 days
  const totalRisk = analyses.reduce((sum, a) => sum + (a.financialRisk < 0 ? a.financialRisk : 0), 0);
  const noGoDays = analyses.filter((a) => a.status === 'nogo').length;
  const marginalDays = analyses.filter((a) => a.status === 'marginal').length;
  const optimalDays = analyses.filter((a) => a.status === 'optimal').length;
  const seasonalAlerts = analyses.filter((a) => a.seasonalAlert).slice(0, 4);

  const selectedAnalysis = selectedDayIndex !== null
    ? analyses.find((a) => a.day.dayIndex === selectedDayIndex) ?? null
    : null;

  const trade = TRADE_CONFIG[selectedTrade];

  // Calculate month label
  const monthDates = [0, 30, 60].map((offset) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + offset);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  return (
    <div className="bg-zinc-950 text-white font-sans min-h-screen">
      {/* ── Header Banner ── */}
      <div className="bg-[#ffcc00] text-black px-6 py-3 text-center">
        <p className="font-black uppercase text-xs tracking-[0.3em]">
          ⚡ WORDEN METEOROLOGICAL INTELLIGENCE ENGINE v2.0 — 90-DAY SEASONAL GRID — GC COMMAND CENTER
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">

        {/* ── Page Title ── */}
        <div className="border-b-2 border-zinc-800 pb-8">
          <span className="inline-block text-[#ffcc00] font-black uppercase tracking-[0.3em] text-xs mb-3 bg-white/5 px-4 py-1.5 border border-[#ffcc00]/20">
            Dispatch Node / Omni-Node Seasonal Intelligence
          </span>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white leading-none mb-4">
            90-Day <span className="text-[#ffcc00]">Pave/No-Pave</span><br />
            <span className="text-zinc-200 text-4xl md:text-5xl">Financial Forecast Grid</span>
          </h1>
          <p className="text-zinc-200 font-bold italic text-lg max-w-3xl border-l-4 border-[#ffcc00] pl-4">
            Every day rated by Ground Temp, Wind Chill, Moisture, and Long-Term Seasonal Risk.
            Financial exposure calculated in real-time so you never pave on a losing day again.
          </p>
        </div>

        {/* ── Trade Selector ── */}
        <section>
          <h2 className="text-xs font-black uppercase tracking-widest text-[#ffcc00] mb-3">
            Select Active Trade / Phase
          </h2>
          <div className="flex flex-wrap gap-3">
            {(Object.entries(TRADE_CONFIG) as [Trade, typeof TRADE_CONFIG[Trade]][]).map(([key, cfg]) => (
              <button
                key={key}
                type="button"
                onClick={() => { setSelectedTrade(key); setSelectedDayIndex(null); }}
                className={`flex items-center gap-2 px-4 py-2.5 border-2 font-black uppercase text-xs tracking-widest transition-all ${
                  selectedTrade === key
                    ? 'bg-[#ffcc00] text-black border-[#ffcc00]'
                    : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-[#ffcc00]/60 hover:text-white'
                }`}
              >
                <span>{cfg.emoji}</span>
                <span>{cfg.label}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-zinc-300 font-bold uppercase tracking-widest">
            Active Spec Reference: <span className="text-zinc-300">{trade.spec}</span>
          </p>
        </section>

        {/* ── 90-Day Risk Summary Bar ── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-emerald-900/30 border border-emerald-700/40 rounded-xl p-4 text-center">
            <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <p className="text-3xl font-black text-emerald-400">{optimalDays}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-200">Optimal Days</p>
          </div>
          <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-4 text-center">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
            <p className="text-3xl font-black text-yellow-400">{marginalDays}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-200">Marginal Days</p>
          </div>
          <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-4 text-center">
            <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
            <p className="text-3xl font-black text-red-400">{noGoDays}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-200">No-Go Days</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-center">
            <TrendingDown className="w-5 h-5 text-red-400 mx-auto mb-1" />
            <p className="text-2xl font-black text-red-400">
              ${Math.abs(totalRisk / 1000).toFixed(0)}K
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-200">Total Exposure</p>
          </div>
        </section>

        {/* ── 3-Month Calendar Grid ── */}
        <section>
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#ffcc00]" />
              <h2 className="text-2xl font-black uppercase text-white tracking-tight">
                {monthDates[viewMonth]}
                <span className="text-zinc-300 text-sm font-bold ml-3">
                  (Days {viewMonth * 30 + 1}–{viewMonth * 30 + 30})
                </span>
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setViewMonth((m) => Math.max(0, m - 1))}
                disabled={viewMonth === 0}
                className="p-2 border border-zinc-700 hover:border-[#ffcc00] disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              {[0, 1, 2].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setViewMonth(m)}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-widest border transition-colors rounded ${
                    viewMonth === m
                      ? 'bg-[#ffcc00] text-black border-[#ffcc00]'
                      : 'border-zinc-700 text-zinc-200 hover:border-[#ffcc00]/60 hover:text-white'
                  }`}
                >
                  Month {m + 1}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setViewMonth((m) => Math.min(2, m + 1))}
                disabled={viewMonth === 2}
                className="p-2 border border-zinc-700 hover:border-[#ffcc00] disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Calendar Grid — 7 columns */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-center text-[9px] font-black uppercase tracking-widest text-zinc-300 py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Build the calendar rows, inserting empty cells for the first week offset */}
            {(() => {
              const firstDay = currentMonthData[0]?.day.date;
              const offset = firstDay ? firstDay.getDay() : 0; // Sunday = 0
              const cells: ReactElement[] = [];
              for (let i = 0; i < offset; i++) {
                cells.push(<div key={`blank-${i}`} />);
              }
              currentMonthData.forEach((analysis) => {
                cells.push(
                  <DayCell
                    key={analysis.day.dayIndex}
                    analysis={analysis}
                    isSelected={selectedDayIndex === analysis.day.dayIndex}
                    onClick={() => setSelectedDayIndex(
                      selectedDayIndex === analysis.day.dayIndex ? null : analysis.day.dayIndex,
                    )}
                  />,
                );
              });
              // Pad to complete the last row
              const remainder = cells.length % 7;
              if (remainder !== 0) {
                for (let i = 0; i < 7 - remainder; i++) {
                  cells.push(<div key={`end-${i}`} />);
                }
              }
              return (
                <div className="grid grid-cols-7 gap-1">
                  {cells}
                </div>
              );
            })()}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-3 text-[10px] font-bold uppercase tracking-widest text-zinc-200">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-900 border border-emerald-600" /> Optimal — Full margin</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-yellow-900 border border-yellow-600" /> Marginal — Reduced profit</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-900 border border-red-600" /> No-Go — Financial loss</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-500 border border-zinc-800" /> Seasonal alert</span>
            <span className="flex items-center gap-1.5 text-zinc-300">Grayed = Weekend</span>
          </div>
        </section>

        {/* ── Day Detail Panel ── */}
        {selectedAnalysis && (
          <section className="bg-zinc-900 border-2 border-[#ffcc00]/40 rounded-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#ffcc00]">
                  Day {selectedAnalysis.day.dayIndex} of 90
                </span>
                <h3 className="text-3xl font-black text-white tracking-tight">
                  {selectedAnalysis.day.dayOfWeek}, {selectedAnalysis.day.month} {selectedAnalysis.day.dayOfMonth}
                </h3>
              </div>
              <div className={`px-6 py-3 font-black text-lg uppercase tracking-widest rounded-lg ${
                selectedAnalysis.status === 'optimal' ? 'bg-emerald-500 text-black' :
                selectedAnalysis.status === 'marginal' ? 'bg-yellow-400 text-black' :
                'bg-red-600 text-white'
              }`}>
                {selectedAnalysis.riskLabel}
              </div>
            </div>

            {/* Weather Data */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-zinc-800 rounded-lg p-3 flex items-center gap-3">
                <Thermometer className="w-5 h-5 text-orange-400 flex-shrink-0" />
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-200">Temp Range</p>
                  <p className="text-lg font-black text-white">{selectedAnalysis.day.tempLow}–{selectedAnalysis.day.tempHigh}°F</p>
                </div>
              </div>
              <div className="bg-zinc-800 rounded-lg p-3 flex items-center gap-3">
                <Thermometer className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-200">Ground Temp</p>
                  <p className={`text-lg font-black ${selectedAnalysis.day.groundTemp < 40 ? 'text-red-400' : selectedAnalysis.day.groundTemp < 50 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                    {selectedAnalysis.day.groundTemp}°F
                  </p>
                </div>
              </div>
              <div className="bg-zinc-800 rounded-lg p-3 flex items-center gap-3">
                <Wind className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-200">Wind Speed</p>
                  <p className={`text-lg font-black ${selectedAnalysis.day.windSpeed >= 35 ? 'text-red-400' : selectedAnalysis.day.windSpeed >= 20 ? 'text-yellow-400' : 'text-white'}`}>
                    {selectedAnalysis.day.windSpeed} mph
                  </p>
                </div>
              </div>
              <div className="bg-zinc-800 rounded-lg p-3 flex items-center gap-3">
                <CloudRain className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-200">Precipitation</p>
                  <p className={`text-lg font-black ${selectedAnalysis.day.precipMM > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {selectedAnalysis.day.precipMM > 0 ? `${selectedAnalysis.day.precipMM}mm` : 'Clear'}
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Risk */}
            <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <DollarSign className="w-5 h-5 text-[#ffcc00]" />
                <h4 className="font-black uppercase text-white tracking-tight">Financial Risk Analysis</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-200 mb-1">Profit Margin Protected</p>
                  <p className={`text-4xl font-black ${selectedAnalysis.profitProtection >= 80 ? 'text-emerald-400' : selectedAnalysis.profitProtection >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {selectedAnalysis.profitProtection}%
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-200 mb-1">Dollars at Risk</p>
                  <p className={`text-4xl font-black ${selectedAnalysis.financialRisk < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {selectedAnalysis.financialRisk < 0
                      ? `-$${Math.abs(selectedAnalysis.financialRisk).toLocaleString()}`
                      : '$0'}
                  </p>
                </div>
              </div>
            </div>

            {/* Warnings / AI Recommendations */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#ffcc00]">
                AI Field Intelligence — {trade.label}
              </h4>
              {selectedAnalysis.warnings.map((w, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg text-sm font-bold leading-snug ${
                  selectedAnalysis.status === 'optimal' ? 'bg-emerald-900/30 text-emerald-200' :
                  selectedAnalysis.status === 'marginal' ? 'bg-yellow-900/30 text-yellow-100' :
                  'bg-red-900/30 text-red-200'
                }`}>
                  {selectedAnalysis.status === 'optimal' ? <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> :
                   selectedAnalysis.status === 'marginal' ? <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" /> :
                   <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                  <span>{w}</span>
                </div>
              ))}
            </div>

            {/* Seasonal Alert */}
            {selectedAnalysis.seasonalAlert && (
              <div className="flex items-start gap-3 p-4 bg-orange-900/30 border border-orange-700/50 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-1">Long-Term Seasonal Risk</p>
                  <p className="text-sm font-bold text-orange-100">{selectedAnalysis.seasonalAlert}</p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Seasonal Risk Alerts Panel ── */}
        {seasonalAlerts.length > 0 && (
          <section>
            <h2 className="text-lg font-black uppercase tracking-tight text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              Long-Term Seasonal Risk Intelligence
              <span className="text-xs font-bold text-zinc-300 normal-case ml-2">— 90-Day Consequence Analysis</span>
            </h2>
            <div className="space-y-3">
              {seasonalAlerts.map((a) => (
                <div key={a.day.dayIndex} className="flex items-start gap-4 bg-orange-900/20 border border-orange-700/30 rounded-xl p-4">
                  <span className="text-[10px] font-black text-orange-400 bg-orange-900/50 px-2 py-1 rounded whitespace-nowrap">
                    Day {a.day.dayIndex}
                  </span>
                  <p className="text-sm font-bold text-orange-100 leading-snug">{a.seasonalAlert}</p>
                  <button
                    type="button"
                    onClick={() => { setViewMonth(a.day.dayIndex <= 30 ? 0 : a.day.dayIndex <= 60 ? 1 : 2); setSelectedDayIndex(a.day.dayIndex); }}
                    className="ml-auto text-[9px] font-black uppercase tracking-widest text-[#ffcc00] bg-zinc-900 border border-[#ffcc00]/30 px-3 py-1.5 hover:bg-[#ffcc00] hover:text-black transition-colors rounded whitespace-nowrap"
                  >
                    View Day
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 90-Day Aggregate Financial Summary ── */}
        <section className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-[#ffcc00]" />
            <h2 className="text-xl font-black uppercase text-white tracking-tight">
              90-Day Aggregate Financial Risk Report
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Per-month summaries */}
            {[0, 1, 2].map((m) => {
              const mData = months[m];
              const mRisk = mData.reduce((s, a) => s + (a.financialRisk < 0 ? a.financialRisk : 0), 0);
              const mGo = mData.filter((a) => a.status === 'optimal').length;
              const mNoGo = mData.filter((a) => a.status === 'nogo').length;
              return (
                <div key={m} className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#ffcc00] mb-2">
                    Month {m + 1} — {monthDates[m]}
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-200 font-bold">Optimal Days</span>
                      <span className="font-black text-emerald-400">{mGo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-200 font-bold">No-Go Days</span>
                      <span className="font-black text-red-400">{mNoGo}</span>
                    </div>
                    <div className="flex justify-between border-t border-zinc-700 pt-2 mt-2">
                      <span className="text-zinc-200 font-bold">Exposure</span>
                      <span className={`font-black ${mRisk < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {mRisk < 0 ? `-$${Math.abs(mRisk / 1000).toFixed(0)}K` : '$0'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total row */}
          <div className="mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-zinc-800 border border-zinc-600 rounded-xl">
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-red-400" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-200">Total 90-Day Financial Exposure if Crews Deploy on No-Go Days</p>
                <p className="text-3xl font-black text-red-400">
                  -${Math.abs(totalRisk).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-200">Protected by Worden Intelligence Engine</p>
              <p className="text-2xl font-black text-emerald-400">
                ${Math.abs(totalRisk).toLocaleString()} SAVED
              </p>
            </div>
          </div>

          <p className="mt-4 text-[10px] text-zinc-300 font-bold">
            * Risk figures calculated using trade-specific thresholds: VDOT Sec 315 (Asphalt), ACI 318 (Concrete), AASHTO T99 (Earthwork), OSHA 1926.1400 (Crane), FM Global RoofNav (Roofing). Weather data uses seeded simulation. Connect to a live weather API for production deployment.
          </p>
        </section>

        {/* ── CTA ── */}
        <section className="text-center py-8 border-t border-zinc-800">
          <h3 className="text-3xl font-black uppercase text-white mb-3">
            Never Lose Money to the Weather <span className="text-[#ffcc00]">Again</span>
          </h3>
          <p className="text-zinc-200 font-bold max-w-xl mx-auto mb-6">
            This dashboard saves a paving company $40,000+ the first time it prevents a crew from laying 500 tons on a washout day. Enterprise license: $2,500/month.
          </p>
          <a
            href="tel:8044461296"
            className="inline-flex items-center gap-3 bg-[#ffcc00] text-black px-8 py-4 font-black uppercase tracking-widest hover:bg-white transition-colors shadow-xl"
          >
            <span>804-446-1296 — Command Center Dispatch</span>
          </a>
        </section>
      </div>
    </div>
  );
}
