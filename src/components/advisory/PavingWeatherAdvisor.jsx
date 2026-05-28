import React, { useState } from 'react';
import { Cloud, CloudRain, Thermometer, CheckCircle2, AlertTriangle, XCircle, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPavingForecast } from '@/api/weather';

export default function PavingWeatherAdvisor() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState(null);
  const [error, setError] = useState(null);
  const [view, setView] = useState('daily'); // 'daily', '5day', 'extended'

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!address.trim()) return;

    setLoading(true);
    setForecast(null);
    setError(null);
    try {
      const data = await getPavingForecast(address);
      if (data.status === 'ok') {
        setForecast(data);
      } else {
        setError(data.error || 'Failed to fetch weather data');
      }
    } catch (err) {
      setError('Connection to JWordenAI Weather Service failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentWindow = forecast?.paving_windows?.[0];

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-brand-navy p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-display font-bold flex items-center gap-2">
              <Cloud className="w-6 h-6 text-brand-amber animate-pulse" />
              High-Resolution Weather Intelligence
            </h3>
            <p className="text-white/70 text-sm mt-1">
              Real-time telemetry for civil construction & site operations.
            </p>
          </div>
          {forecast && (
            <div className="hidden sm:flex gap-1 bg-white/10 p-1 rounded-lg">
              {['daily', '5day', 'extended'].map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest transition-all ${
                    view === v ? 'bg-brand-amber text-brand-navy shadow-lg' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {v === 'extended' ? '8-Day' : v}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Search Input */}
        <form onSubmit={handleSearch} className="relative mb-6">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Search Job Site Address..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-900 font-bold focus:ring-2 focus:ring-brand-navy transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-brand-navy text-white rounded-lg font-bold text-sm disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </form>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 text-sm">
            <XCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {forecast ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              key={view}
              className="space-y-6"
            >
              {view === 'daily' && (
                <>
                  {/* Daily Intelligence Report */}
                  <div className="p-5 rounded-2xl bg-brand-navy/5 border border-brand-navy/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                      <Cloud className="w-16 h-16" />
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-navy/60 mb-2">Tactical 24H Report</h4>
                    <p className="text-brand-navy font-display text-lg font-bold leading-snug">
                      {forecast.daily_suitability_report}
                    </p>
                  </div>

                  <div className={`p-6 rounded-2xl border-2 flex flex-col md:flex-row items-center gap-6 ${
                    currentWindow?.is_suitable 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}>
                    <div className="shrink-0">
                      {currentWindow?.is_suitable ? (
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white shadow-xl rotate-3">
                          <CheckCircle2 className="w-10 h-10" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-xl -rotate-3">
                          <AlertTriangle className="w-10 h-10" />
                        </div>
                      )}
                    </div>
                    <div className="text-center md:text-left">
                      <h4 className="text-2xl font-display font-black uppercase tracking-tight leading-none">
                        {currentWindow?.is_suitable ? 'Operational: GO' : 'Tactical Alert: HOLD'}
                      </h4>
                      <p className="text-base font-body mt-2 font-bold opacity-80 uppercase tracking-wide">
                        {currentWindow?.reason}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard label="Morning Paving" value={currentWindow?.morning_suitability ? 'OPTIMAL' : 'RISKY'} icon={Thermometer} status={currentWindow?.morning_suitability ? 'success' : 'risk'} />
                    <MetricCard label="Precip Risk" value={`${currentWindow?.precip_prob}%`} icon={CloudRain} status={currentWindow?.precip_prob < 30 ? 'success' : 'risk'} />
                    <MetricCard label="Cure Speed" value={currentWindow?.humidity < 50 ? 'FAST' : 'BUFFER'} icon={Cloud} status="info" />
                    <MetricCard label="8-Day Risk" value={`${forecast.risk_score}/10`} icon={AlertTriangle} status={forecast.risk_score < 4 ? 'success' : 'risk'} />
                  </div>
                </>
              )}

              {(view === '5day' || view === 'extended') && (
                <div className="space-y-3">
                  <h5 className="text-brand-navy font-display font-black text-sm uppercase tracking-[0.2em] mb-4">
                     {view === '5day' ? '5-Day Site Sequence' : '8-Day Extended Infrastructure Horizon'}
                  </h5>
                  {(view === '5day' ? forecast.five_day_summary : forecast.extended_look).map((day, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-12 text-center">
                          <span className="block text-[10px] uppercase font-black text-slate-400">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                          <span className="block text-sm font-black text-brand-navy leading-none mt-0.5">{new Date(day.date).getDate()}</span>
                        </div>
                        <div className={`h-8 w-1 rounded-full ${day.is_suitable ? 'bg-green-500' : 'bg-amber-400'}`} />
                        <div>
                          <p className={`text-sm font-black uppercase tracking-tight ${day.is_suitable ? 'text-green-700' : 'text-amber-700'}`}>
                            {day.is_suitable ? 'Optimal' : 'Caution'}
                          </p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase truncate max-w-[140px] md:max-w-none">
                            {day.reason.split('—')[0]}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8 text-right shrink-0">
                        <div className="hidden md:block">
                           <span className="block text-[8px] uppercase font-black text-slate-400">Rain Prob</span>
                           <span className="text-xs font-black text-slate-700">{day.precip_prob}%</span>
                        </div>
                        <div>
                           <span className="block text-[8px] uppercase font-black text-slate-400">High Temp</span>
                           <span className="text-sm font-black text-brand-navy">{day.high_temp_f}°F</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-center gap-2 p-4 bg-brand-amber/10 rounded-xl">
                 <CheckCircle2 className="w-4 h-4 text-brand-amber" />
                 <span className="text-[10px] font-black uppercase text-brand-navy tracking-widest text-center">
                   {forecast.recommendation}
                 </span>
              </div>
            </motion.div>
          ) : (
            <div className="py-24 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl group">
              <CloudRain className="w-16 h-16 opacity-10 mb-6 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-bold opacity-40 uppercase tracking-widest">Awaiting Site Telemetry Target...</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <div className="px-6 py-4 bg-slate-50 border-t border-border flex items-center justify-between text-slate-400 text-[8px] font-black uppercase tracking-widest md:text-[10px]">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
          Live Satellite Feed Active
        </div>
        <div>ID: JW-WX-{(forecast?.risk_score * 1024).toString(16).toUpperCase() || 'OFFLINE'}</div>
        <div>Paving Thresholds: 50°F / 30% Rain</div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, status }) {
  const colors = {
    success: 'bg-green-50 text-green-700 border-green-100',
    risk: 'bg-red-50 text-red-700 border-red-100',
    info: 'bg-blue-50 text-blue-700 border-blue-100',
  };
  
  return (
    <div className={`p-4 rounded-xl border ${colors[status] || colors.info}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-4 h-4 opacity-60" />
        <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">{label}</span>
      </div>
      <div className="text-lg font-display font-bold">{value}</div>
    </div>
  );
}
