/**
 * WeatherGuardTab — 50-State NOAA Scheduling Intelligence
 * Reads from weatherGuard.ts to display scheduling risk across any US city.
 */
import { useState, useMemo } from 'react';
import { CloudRain, Wind, Thermometer, CheckCircle, AlertTriangle, XCircle, Calendar, MapPin } from 'lucide-react';
import {
  generateWeatherSchedule,
  getStateProfile,
  STATE_CLIMATE_PROFILES,
  type ScheduleRisk,
} from '@/lib/weatherGuard';

const riskConfig: Record<ScheduleRisk, { label: string; color: string; border: string; icon: React.ReactNode }> = {
  CLEAR:       { label: 'CLEAR', color: 'text-green-400', border: 'border-green-800 bg-green-950/20', icon: <CheckCircle size={14} className="text-green-400" /> },
  CAUTION:     { label: 'CAUTION', color: 'text-yellow-400', border: 'border-yellow-700 bg-yellow-950/20', icon: <AlertTriangle size={14} className="text-yellow-400" /> },
  RESCHEDULE:  { label: 'RESCHEDULE', color: 'text-orange-400', border: 'border-orange-700 bg-orange-950/20', icon: <AlertTriangle size={14} className="text-orange-400" /> },
  HALT:        { label: 'HALT', color: 'text-red-400', border: 'border-red-700 bg-red-950/20', icon: <XCircle size={14} className="text-red-400" /> },
};

export function WeatherGuardTab() {
  const [city, setCity] = useState('Richmond');
  const [stateCode, setStateCode] = useState('VA');
  const [cityInput, setCityInput] = useState('Richmond');

  const schedule = useMemo(() => generateWeatherSchedule(city, stateCode), [city, stateCode]);
  const profile = useMemo(() => getStateProfile(stateCode), [stateCode]);

  const clearDays  = schedule.filter((d) => d.risk === 'CLEAR').length;
  const haltDays   = schedule.filter((d) => d.risk === 'HALT' || d.risk === 'RESCHEDULE').length;
  const nextClear  = schedule.find((d) => d.risk === 'CLEAR');
  const nextHalt   = schedule.find((d) => d.risk === 'HALT');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black uppercase text-white flex items-center gap-2">
          <CloudRain size={20} className="text-[#ffcc00]" /> Weather-Guard — 50-State Scheduling AI
        </h2>
        <span className="text-xs text-blue-400 font-black uppercase">NOAA Standard Thresholds</span>
      </div>

      {/* City + State selector */}
      <div className="flex flex-wrap gap-4 bg-[#111] border border-gray-800 p-4">
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs font-black uppercase text-gray-300 mb-1 block">City / Project Site</label>
          <div className="flex gap-2">
            <input
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setCity(cityInput)}
              placeholder="Enter city name"
              className="flex-1 bg-gray-900 border border-gray-700 text-white text-sm p-2 font-bold focus:border-[#ffcc00] outline-none"
            />
            <button
              onClick={() => setCity(cityInput)}
              className="px-4 py-2 bg-[#ffcc00] text-black font-black text-xs uppercase"
            >
              Go
            </button>
          </div>
        </div>
        <div className="min-w-[140px]">
          <label className="text-xs font-black uppercase text-gray-300 mb-1 block">State (50 States)</label>
          <select
            value={stateCode}
            onChange={(e) => setStateCode(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 text-white text-sm p-2 font-bold focus:border-[#ffcc00] outline-none"
          >
            {STATE_CLIMATE_PROFILES.map((p) => (
              <option key={p.stateCode} value={p.stateCode}>{p.stateCode} — {p.state}</option>
            ))}
          </select>
        </div>
      </div>

      {/* State climate profile */}
      {profile && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Region', value: profile.region },
            { label: 'Frost-Free Days', value: `${profile.frostFreeDays} days/yr` },
            { label: 'Paving Season', value: `${profile.pavingSeasonMonths.length} months` },
            { label: 'Primary Risk', value: profile.primaryRisk },
          ].map((s) => (
            <div key={s.label} className="bg-[#111] border border-gray-800 p-4">
              <div className="text-xs text-gray-300 uppercase font-bold mb-1">{s.label}</div>
              <div className="text-sm text-white font-black leading-tight">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* 14-day summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Clear Days (14d)', value: clearDays, color: 'text-green-400' },
          { label: 'Risk Days (14d)', value: haltDays, color: 'text-red-400' },
          { label: 'Next Clear Window', value: nextClear?.label ?? 'None in 14d', color: 'text-[#ffcc00]' },
          { label: 'Next Halt Day', value: nextHalt?.label ?? 'None in 14d', color: nextHalt ? 'text-red-400' : 'text-green-400' },
        ].map((s) => (
          <div key={s.label} className="bg-[#111] border border-gray-800 p-4">
            <div className="text-xs text-gray-300 uppercase font-bold mb-1">{s.label}</div>
            <div className={`text-lg font-black ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* 14-day schedule grid */}
      <section>
        <h3 className="text-sm font-black uppercase tracking-wider text-gray-200 mb-3 flex items-center gap-2">
          <Calendar size={14} className="text-[#ffcc00]" /> 14-Day Paving Schedule — {city}, {stateCode}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {schedule.map((day) => {
            const cfg = riskConfig[day.risk];
            return (
              <div key={day.dayIndex} className={`border ${cfg.border} px-4 py-3`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {cfg.icon}
                    <span className="font-black text-sm text-white">{day.label}</span>
                  </div>
                  <span className={`text-xs font-black uppercase px-2 py-0.5 border ${cfg.border} ${cfg.color}`}>{cfg.label}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                  <div className="text-gray-300">
                    <Thermometer size={10} className="inline mr-1" />
                    <span className="text-white font-bold">{day.ambientTempF}°F</span>
                  </div>
                  <div className="text-gray-300">
                    Ground: <span className="text-white font-bold">{day.groundTempF}°F</span>
                  </div>
                  <div className="text-gray-300">
                    <CloudRain size={10} className="inline mr-1" />
                    <span className={day.precipChancePct >= 40 ? 'text-orange-400 font-bold' : 'text-white font-bold'}>{day.precipChancePct}%</span>
                  </div>
                  <div className="text-gray-300">
                    <Wind size={10} className="inline mr-1" />
                    <span className="text-white font-bold">{day.windMph} mph</span>
                  </div>
                </div>
                <p className={`text-xs font-bold ${cfg.color}`}>{day.wordenAction}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Threshold reference */}
      <div className="p-4 bg-[#111] border border-gray-800 text-xs">
        <div className="text-gray-200 font-black uppercase mb-2 flex items-center gap-2">
          <MapPin size={12} /> VDOT Section 315 Weather Thresholds (All States)
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-gray-300">
          <div>Min Ambient: <span className="text-white font-bold">45°F</span></div>
          <div>Min Ground: <span className="text-white font-bold">40°F</span></div>
          <div>Max Rain Prob: <span className="text-orange-400 font-bold">40%</span></div>
          <div>High Wind: <span className="text-white font-bold">20 mph</span></div>
        </div>
      </div>
    </div>
  );
}
