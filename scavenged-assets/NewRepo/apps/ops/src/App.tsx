import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  TRADES,
  TRADES_BY_CATEGORY,
  calculateEstimate,
  formatDollars,
  pavingDecision,
  BINDER_INDEX,
  GROSS_MARGIN_FLOOR,
  BUSINESS_SHORT,
  STATE_LEGAL,
  AVAILABLE_STATES,
} from '@jworden/core';
import type { Job, CrewMember, Equipment, EstimateOutput, PavingDecision } from '@jworden/core';

// ── Storage helpers ──────────────────────────────────────────────────────────

function load<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : fallback; }
  catch { return fallback; }
}
function save<T>(key: string, val: T) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* noop */ }
}

// ── Types ────────────────────────────────────────────────────────────────────

type Station = 'home' | 'jarvis' | 'estimate' | 'jobs' | 'crew' | 'equipment' | 'weather' | 'banking' | 'legal' | 'crm' | 'lien' | 'dispatch' | 'safety' | 'cashflow' | 'market' | 'workforce' | 'proposals' | 'operations' | 'subcontractors' | 'foreman' | 'permits' | 'scan-campaign' | 'roadscan' | 'advisor';
type AutoMode = 'manual' | 'hybrid' | 'auto';

interface JarvisMsg { role: 'jarvis' | 'user'; text: string; }

interface WeatherDay {
  date: string; high: number; low: number;
  precip: number; wind: number; code: number;
  decision: PavingDecision;
}

// ── Nav definition ───────────────────────────────────────────────────────────

const NAV: { id: Station; icon: string; label: string }[] = [
  { id: 'home',          icon: '◉', label: 'Home'         },
  { id: 'jarvis',        icon: '⚡', label: 'Jarvis'       },
  { id: 'estimate',      icon: '◇', label: 'Estimate'     },
  { id: 'jobs',          icon: '☰', label: 'Jobs'         },
  { id: 'crew',          icon: '●', label: 'Crew'         },
  { id: 'equipment',     icon: '▣', label: 'Equipment'    },
  { id: 'weather',       icon: '☁', label: 'Weather'      },
  { id: 'banking',       icon: '$', label: 'Banking'      },
  { id: 'legal',         icon: '§', label: 'Legal'        },
  { id: 'crm',           icon: '◈', label: 'CRM'          },
  { id: 'lien',          icon: '⚖', label: 'Lien Cal'     },
  { id: 'dispatch',      icon: '⌖', label: 'Dispatch'     },
  { id: 'foreman',       icon: '✦', label: 'Foreman'      },
  { id: 'workforce',     icon: '◎', label: 'Workforce'    },
  { id: 'operations',    icon: '≡', label: 'Operations'   },
  { id: 'subcontractors',icon: '⊞', label: 'Subs'         },
  { id: 'safety',        icon: '⛨', label: 'Safety'       },
  { id: 'cashflow',      icon: '⊟', label: 'Cash Flow'    },
  { id: 'permits',       icon: '⊡', label: 'Permits'      },
  { id: 'proposals',     icon: '✉', label: 'Proposals'    },
  { id: 'market',        icon: '⚑', label: 'Market'       },
  { id: 'scan-campaign', icon: '◈', label: 'Scan Mail'    },
  { id: 'roadscan',      icon: '◭', label: 'Road Scan'    },
  { id: 'advisor',       icon: '♔', label: 'Advisor'      },
];

const JOB_STATUSES: Job['status'][] = [
  'Estimated','Proposed','Accepted','Scheduled','In Progress','Complete','Invoiced','Paid','Archived',
];

// ── Weather helpers ──────────────────────────────────────────────────────────

const WX_ICON: Record<number, string> = {};
function wxIcon(code?: number): string {
  if (code === undefined) return '—';
  if (code <= 1) return '☀';
  if (code <= 3) return '⛅';
  if (code <= 48) return '🌫';
  if (code <= 67) return '🌧';
  if (code <= 77) return '❄';
  return '⛈';
}

function dayName(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' });
}

const DECISION_COLOR: Record<PavingDecision, string> = {
  'GO':     '#22c55e',
  'CAUTION':'#eab308',
  'NO-GO':  '#ef4444',
};

// ── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [station, setStation] = useState<Station>('home');
  const [autoMode, setAutoMode] = useState<AutoMode>('manual');
  const [now, setNow] = useState(new Date());
  const [cmd, setCmd] = useState(false);
  const cmdRef = useRef<HTMLInputElement>(null);

  // Persisted state
  const [jobs,  setJobs]  = useState<Job[]>(() => load('ws5-jobs', []));
  const [crew,  setCrew]  = useState<CrewMember[]>(() => load('ws5-crew', []));
  const [equip, setEquip] = useState<Equipment[]>(() => load('ws5-equip', []));

  // Estimate
  const [tradeKey, setTradeKey] = useState('asphalt_res');
  const [qty,   setQty]   = useState('');
  const [depth, setDepth] = useState('2');
  const [cost,  setCost]  = useState('');
  const [city,  setCity]  = useState('');
  const [result, setResult] = useState<EstimateOutput | null>(null);

  // Jarvis
  const [jInput, setJInput] = useState('');
  const [jLog,   setJLog]   = useState<JarvisMsg[]>([
    { role: 'jarvis', text: `Worden Standard v5 — ${Object.keys(TRADES).length} trades · 51 states · 9 stations online.\nAutonomy: MANUAL.\n\nReady.` },
  ]);
  const [jBusy, setJBusy] = useState(false);
  const jBottom = useRef<HTMLDivElement>(null);

  // Weather
  const [wxDays, setWxDays] = useState<WeatherDay[]>([]);
  const [wxCurrent, setWxCurrent] = useState<{ tempF: number; humidity: number; windMph: number; code: number } | null>(null);

  // Legal
  const [legalState, setLegalState] = useState('Virginia');
  const [cmdInput, setCmdInput] = useState('');

  // CRM
  const [crmLeads, setCrmLeads] = useState<Array<{
    id: string; name: string; phone: string | null; service_type: string | null;
    urgency: string | null; score_label: string | null; pipeline_stage: string;
    estimated_value: number | null; created_at: string;
  }>>([]);
  const [crmStage, setCrmStage] = useState('');
  const [crmLoading, setCrmLoading] = useState(false);

  // Lien Calendar
  const [lienEntries, setLienEntries] = useState<Array<{
    id: number; customer_name: string; project_address: string; state_code: string;
    lien_filing_deadline: string | null; preliminary_notice_deadline: string | null;
    foreclosure_deadline: string | null; days_until_lien: number | null; is_urgent?: boolean;
  }>>([]);
  const [lienCalcState, setLienCalcState] = useState('VA');
  const [lienStartDate, setLienStartDate] = useState('');
  const [lienLastDate, setLienLastDate] = useState('');
  const [lienCalcResult, setLienCalcResult] = useState<Record<string, unknown> | null>(null);
  const [lienLoading, setLienLoading] = useState(false);

  const API = import.meta.env.VITE_API_BASE_URL ?? '';
  const MK = import.meta.env.VITE_MASTER_KEY ?? '';

  // ── Side effects ──────────────────────────────────────────────────────────

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { save('ws5-jobs', jobs); }, [jobs]);
  useEffect(() => { save('ws5-crew', crew); }, [crew]);
  useEffect(() => { save('ws5-equip', equip); }, [equip]);
  useEffect(() => { jBottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [jLog, jBusy]);
  useEffect(() => { if (cmd) setTimeout(() => cmdRef.current?.focus(), 50); }, [cmd]);

  // Keyboard: Ctrl+K / Esc
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmd(p => !p); }
      if (e.key === 'Escape') setCmd(false);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // Weather fetch
  useEffect(() => {
    const fetchWx = (lat: number, lon: number) => {
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,weathercode&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=10`)
        .then(r => r.json())
        .then((d: {
          current?: { temperature_2m?: number; relative_humidity_2m?: number; wind_speed_10m?: number; weather_code?: number };
          daily?: { time?: string[]; temperature_2m_max?: number[]; temperature_2m_min?: number[]; precipitation_probability_max?: number[]; wind_speed_10m_max?: number[]; weathercode?: number[] };
        }) => {
          if (d.current) {
            setWxCurrent({
              tempF: d.current.temperature_2m ?? 0,
              humidity: d.current.relative_humidity_2m ?? 0,
              windMph: d.current.wind_speed_10m ?? 0,
              code: d.current.weather_code ?? 0,
            });
          }
          if (d.daily?.time) {
            setWxDays(d.daily.time.map((date, i) => ({
              date,
              high:   d.daily!.temperature_2m_max![i]!,
              low:    d.daily!.temperature_2m_min![i]!,
              precip: d.daily!.precipitation_probability_max![i]!,
              wind:   d.daily!.wind_speed_10m_max![i]!,
              code:   d.daily!.weathercode?.[i] ?? 0,
              decision: pavingDecision(d.daily!.temperature_2m_max![i]!, d.daily!.precipitation_probability_max![i]!, d.daily!.wind_speed_10m_max![i]!),
            })));
          }
        })
        .catch(() => undefined);
    };
    navigator.geolocation?.getCurrentPosition(
      p => fetchWx(p.coords.latitude, p.coords.longitude),
      () => fetchWx(37.38, -77.45), // Chester, VA default
    );
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────

  const activeJobs   = jobs.filter(j => !['Paid','Archived'].includes(j.status));
  const paidJobs     = jobs.filter(j => j.status === 'Paid');
  const invoicedJobs = jobs.filter(j => j.status === 'Invoiced');
  const revenue      = paidJobs.reduce((s, j) => s + j.bid, 0);
  const ar           = invoicedJobs.reduce((s, j) => s + j.bid, 0);
  const pipeline     = jobs.reduce((s, j) => s + j.bid, 0);
  const acColor      = autoMode === 'auto' ? '#22c55e' : autoMode === 'hybrid' ? '#eab308' : '#6b7280';

  // ── Estimate calc ─────────────────────────────────────────────────────────

  const calc = useCallback(() => {
    const q = parseFloat(qty), c = parseFloat(cost);
    if (!q || !c) return;
    const trade = TRADES[tradeKey]!;
    const out = calculateEstimate(
      { tradeKey, quantity: q, depthIn: trade.depthUnit ? parseFloat(depth) : undefined, costPerUnit: c, location: city },
      trade.defaultDensity,
    );
    out.tradeLabel = trade.label;
    setResult(out);
  }, [qty, cost, tradeKey, depth, city]);

  const saveJob = useCallback(() => {
    if (!result) return;
    const trade = TRADES[tradeKey]!;
    setJobs(p => [{
      id: result.id,
      trade: trade.label,
      city,
      quantity: result.quantity,
      bid: result.finalBid,
      status: 'Estimated',
      isLargeJob: result.isLargeJob,
      createdAt: result.generatedAt,
    }, ...p]);
    setStation('jobs');
  }, [result, tradeKey, city]);

  // ── Jarvis ────────────────────────────────────────────────────────────────

  const sendJarvis = useCallback(async (text?: string) => {
    const msg = (text ?? jInput).trim();
    if (!msg || jBusy) return;
    setJInput('');
    setJLog(p => [...p, { role: 'user', text: msg }]);
    setJBusy(true);
    try {
      const res = await fetch(`${API}/api/v1/ai/jarvis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Master-Key': MK },
        body: JSON.stringify({
          messages: [...jLog.map(m => ({ role: m.role === 'jarvis' ? 'assistant' : 'user', content: m.text })), { role: 'user', content: msg }],
          field_mode: false,
        }),
      });
      const d = await res.json() as { reply?: string };
      setJLog(p => [...p, { role: 'jarvis', text: d.reply ?? 'No response.' }]);
    } catch {
      setJLog(p => [...p, { role: 'jarvis', text: 'Network error — check connection.' }]);
    }
    setJBusy(false);
  }, [jInput, jBusy, jLog]);

  // ── Command palette ───────────────────────────────────────────────────────

  const execCmd = useCallback((q: string) => {
    setCmd(false);
    const c = q.replace('/', '').toLowerCase().trim();
    const stationMap: Record<string, Station> = { home:'home', jarvis:'jarvis', estimate:'estimate', jobs:'jobs', crew:'crew', equipment:'equipment', weather:'weather', banking:'banking', legal:'legal', crm:'crm', lien:'lien', dispatch:'dispatch', foreman:'foreman', workforce:'workforce', operations:'operations', subcontractors:'subcontractors', subs:'subcontractors', safety:'safety', cashflow:'cashflow', permits:'permits', proposals:'proposals', market:'market', 'scan-campaign':'scan-campaign', scan:'scan-campaign', mail:'scan-campaign', roadscan:'roadscan', road:'roadscan', pavement:'roadscan', advisor:'advisor', strategy:'advisor' };
    if (stationMap[c]) { setStation(stationMap[c]); return; }
    setJInput(q);
    setStation('jarvis');
    setTimeout(() => sendJarvis(q), 100);
  }, [sendJarvis]);

  // ── Shared styles ─────────────────────────────────────────────────────────

  const S = {
    inp: { width:'100%', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:5, color:'#e0e2e8', fontFamily:'inherit', fontSize:14, padding:'7px 11px', outline:'none' } as React.CSSProperties,
    lbl: { fontSize:11, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.25)', display:'block', marginBottom:5 },
    row: { display:'flex', alignItems:'center', padding:'7px 10px', borderRadius:5, gap:10, borderBottom:'1px solid rgba(255,255,255,0.015)' } as React.CSSProperties,
    dot: (color: string): React.CSSProperties => ({ width:5, height:5, borderRadius:'50%', background:color, flexShrink:0 }),
    btn: (bg: string, color: string): React.CSSProperties => ({ background:bg, color, border:'none', borderRadius:5, cursor:'pointer', fontFamily:'inherit', fontWeight:600 }),
  };

  const todayDecision = wxDays[0]?.decision;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ display:'flex', height:'100vh', background:'#08090e', color:'#c9cdd8', fontFamily:'inherit', overflow:'hidden' }}>

      {/* ── SIDEBAR ── */}
      <div style={{ width:188, minWidth:188, borderRight:'1px solid rgba(255,255,255,0.04)', display:'flex', flexDirection:'column', padding:'10px 6px' }}>
        {/* Brand */}
        <div style={{ padding:'8px 10px 14px', borderBottom:'1px solid rgba(255,255,255,0.04)', marginBottom:6 }}>
          <div style={{ fontSize:12, fontWeight:700, letterSpacing:'0.16em', color:'#f5a623' }}>WORDEN</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.12)', letterSpacing:'0.08em' }}>STANDARD v5</div>
        </div>

        {/* Search */}
        <button
          onClick={() => setCmd(true)}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', borderRadius:5, border:'1px solid rgba(255,255,255,0.04)', background:'transparent', color:'rgba(255,255,255,0.15)', fontFamily:'inherit', fontSize:13, cursor:'pointer', marginBottom:8, textAlign:'left', width:'100%' }}
        >
          <span style={{ flex:1 }}>Search…</span>
          <span style={{ fontSize:10, background:'rgba(255,255,255,0.04)', padding:'1px 4px', borderRadius:2 }}>⌘K</span>
        </button>

        {/* Nav */}
        {NAV.map(n => {
          const badge = n.id === 'jobs' ? activeJobs.length : n.id === 'crew' ? crew.length : n.id === 'equipment' ? equip.length : 0;
          return (
            <button
              key={n.id}
              onClick={() => setStation(n.id)}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'5px 10px', borderRadius:4, border:'none', background: station === n.id ? 'rgba(255,255,255,0.04)' : 'transparent', color: station === n.id ? '#e0e2e8' : 'rgba(255,255,255,0.28)', fontFamily:'inherit', fontSize:14, cursor:'pointer', textAlign:'left', width:'100%', marginBottom:1 }}
            >
              <span style={{ fontSize:13, width:14, textAlign:'center', color: station === n.id ? '#f5a623' : 'rgba(255,255,255,0.12)' }}>{n.icon}</span>
              <span style={{ flex:1 }}>{n.label}</span>
              {!!badge && <span style={{ fontSize:11, color:'rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.04)', padding:'0 5px', borderRadius:8 }}>{badge}</span>}
            </button>
          );
        })}

        {/* Autonomy toggle */}
        <div style={{ marginTop:'auto', padding:'10px 8px', borderTop:'1px solid rgba(255,255,255,0.03)' }}>
          <div style={{ display:'flex', background:'rgba(255,255,255,0.02)', borderRadius:4, padding:2 }}>
            {(['manual','hybrid','auto'] as AutoMode[]).map(m => (
              <button key={m} onClick={() => setAutoMode(m)} style={{ flex:1, fontFamily:'inherit', fontSize:10, fontWeight:600, padding:'4px 0', borderRadius:3, border:'none', cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.06em', background: autoMode === m ? 'rgba(255,255,255,0.05)' : 'transparent', color: autoMode === m ? acColor : 'rgba(255,255,255,0.1)' }}>{m}</button>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:3, marginTop:5, justifyContent:'center' }}>
            <span style={{ width:4, height:4, borderRadius:'50%', background:acColor, boxShadow:`0 0 5px ${acColor}`, animation:'pulse-dot 2.5s infinite' }} />
            <span style={{ fontSize:10, color:acColor, fontWeight:600 }}>{autoMode.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
        {/* Header bar */}
        <div style={{ padding:'6px 18px', borderBottom:'1px solid rgba(255,255,255,0.03)', display:'flex', alignItems:'center', justifyContent:'space-between', minHeight:34, flexShrink:0 }}>
          <div style={{ fontSize:15, fontWeight:600, color:'#e0e2e8' }}>{{ home:'Home', jarvis:'Jarvis', estimate:'New Estimate', jobs:'Jobs', crew:'Crew', equipment:'Equipment', weather:'Weather', banking:'Banking', legal:'Legal / Compliance', crm:'CRM', lien:'Lien Calendar', dispatch:'Dispatch', foreman:'Foreman Check-In', workforce:'Workforce', operations:'Operations / Work Orders', subcontractors:'Subcontractors', safety:'Safety / OSHA', cashflow:'Cash Flow', permits:'Permit Leads', proposals:'Proposals', market:'Market Intelligence', 'scan-campaign':'Scan → Mail Campaigns', roadscan:'Road Scan / Pavement Intel', advisor:'Legal Advisor — 51 States' }[station]}</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.1)', display:'flex', gap:12, alignItems:'center' }}>
            {todayDecision && <span style={{ color: DECISION_COLOR[todayDecision], fontWeight:700, fontSize:11 }}>PAVING: {todayDecision}</span>}
            {now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' })}
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'14px 18px' }}>

          {/* ── HOME ── */}
          {station === 'home' && (
            <div style={{ maxWidth:720 }}>
              <div style={{ marginBottom:22 }}>
                <div style={{ fontSize:22, color:'#e0e2e8', fontWeight:400, marginBottom:3 }}>
                  Good {now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'}
                </div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.18)' }}>{activeJobs.length} active · {crew.length} crew · {equip.length} equipment · Pipeline {formatDollars(pipeline)}</div>
              </div>

              {/* Telemetry */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:1, background:'rgba(255,255,255,0.02)', borderRadius:7, overflow:'hidden', marginBottom:18 }}>
                {[
                  { v: String(activeJobs.length), l:'Active', c: activeJobs.length ? '#22c55e' : '#333' },
                  { v: formatDollars(revenue),    l:'Revenue', c:'#f5a623' },
                  { v: formatDollars(ar),          l:'Receivable', c: ar ? '#eab308' : '#333' },
                  { v: formatDollars(pipeline),    l:'Pipeline', c:'#c9cdd8' },
                  { v: '35%',                      l:'Margin', c:'#22c55e' },
                  { v: autoMode.toUpperCase(),     l:'Autonomy', c: acColor },
                ].map((m, i) => (
                  <div key={i} style={{ padding:'10px 8px', background:'#08090e', textAlign:'center' }}>
                    <div style={{ fontSize:14, fontWeight:700, color:m.c, fontVariantNumeric:'tabular-nums' }}>{m.v}</div>
                    <div style={{ fontSize:9, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(255,255,255,0.1)', marginTop:2 }}>{m.l}</div>
                  </div>
                ))}
              </div>

              {/* Weather mini — 5-day paving forecast strip */}
              {wxDays.length > 0 && (
                <div
                  onClick={() => setStation('weather')}
                  style={{ display:'flex', gap:1, marginBottom:18, cursor:'pointer', background:'rgba(255,255,255,0.02)', borderRadius:6, overflow:'hidden' }}
                  title="Click for full 10-day forecast"
                >
                  {wxDays.slice(0, 5).map((d, i) => (
                    <div key={i} style={{ flex:1, padding:'7px 4px', textAlign:'center', background: i === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                      <div style={{ fontSize:9, color:'rgba(255,255,255,0.2)', marginBottom:3 }}>{dayName(d.date)}</div>
                      <div style={{ fontSize:13, marginBottom:3 }}>{wxIcon(d.code)}</div>
                      <div style={{ fontSize:9, color:'rgba(255,255,255,0.18)', marginBottom:4 }}>{Math.round(d.high)}°</div>
                      <div style={{ width:8, height:8, borderRadius:'50%', background: DECISION_COLOR[d.decision], margin:'0 auto', boxShadow:`0 0 4px ${DECISION_COLOR[d.decision]}` }} title={d.decision} />
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Jarvis */}
              <div style={{ display:'flex', gap:6, marginBottom:18 }}>
                <input value={jInput} onChange={e => setJInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { setStation('jarvis'); sendJarvis(); } }} placeholder="Ask Jarvis anything…" style={{ ...S.inp, flex:1, fontSize:14 }} />
                <button onClick={() => { setStation('jarvis'); sendJarvis(); }} style={{ fontFamily:'inherit', fontSize:12, fontWeight:700, padding:'0 14px', background:'#f5a623', color:'#08090e', border:'none', borderRadius:5, cursor:'pointer' }}>Go</button>
              </div>

              {/* Recent jobs */}
              {jobs.length > 0 && (
                <div>
                  <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(255,255,255,0.1)', marginBottom:6 }}>Recent Jobs</div>
                  {jobs.slice(0, 8).map(j => (
                    <div key={j.id} onClick={() => setStation('jobs')} style={{ ...S.row, cursor:'pointer' }}>
                      <span style={S.dot(j.status === 'Paid' ? '#22c55e' : j.status === 'In Progress' ? '#f5a623' : 'rgba(255,255,255,0.06)')} />
                      <span style={{ flex:1, fontSize:14, color:'#c9cdd8', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{j.trade}{j.city ? ` · ${j.city}` : ''}</span>
                      <span style={{ fontSize:13, color:'rgba(255,255,255,0.22)', fontVariantNumeric:'tabular-nums' }}>{formatDollars(j.bid)}</span>
                      <span style={{ fontSize:11, color:'rgba(255,255,255,0.1)', minWidth:70, textAlign:'right' }}>{j.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── JARVIS ── */}
          {station === 'jarvis' && (
            <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 80px)', maxWidth:680 }}>
              <div style={{ flex:1, overflowY:'auto', paddingBottom:8 }}>
                {jLog.map((m, i) => (
                  <div key={i} style={{ display:'flex', gap:8, marginBottom:10, justifyContent: m.role === 'jarvis' ? 'flex-start' : 'flex-end' }}>
                    {m.role === 'jarvis' && <div style={{ width:18, height:18, borderRadius:3, background:'rgba(245,166,35,0.06)', border:'1px solid rgba(245,166,35,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, flexShrink:0, marginTop:2 }}>⚡</div>}
                    <div style={{ maxWidth:'86%', background: m.role === 'jarvis' ? 'rgba(255,255,255,0.02)' : 'rgba(245,166,35,0.03)', border:`1px solid ${m.role === 'jarvis' ? 'rgba(255,255,255,0.03)' : 'rgba(245,166,35,0.06)'}`, borderRadius:6, padding:'7px 11px', fontSize:13, lineHeight:1.8, whiteSpace:'pre-wrap' }}>{m.text}</div>
                  </div>
                ))}
                {jBusy && <div style={{ fontSize:12, color:'rgba(255,255,255,0.1)', paddingLeft:26, animation:'pulse-dot 1s infinite' }}>Processing…</div>}
                <div ref={jBottom} />
              </div>
              <div style={{ display:'flex', gap:6, borderTop:'1px solid rgba(255,255,255,0.03)', paddingTop:8 }}>
                <input value={jInput} onChange={e => setJInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendJarvis(); }} placeholder="Command Jarvis…" style={{ ...S.inp, flex:1 }} />
                <button onClick={() => sendJarvis()} disabled={jBusy} style={{ fontFamily:'inherit', fontSize:13, fontWeight:600, padding:'0 16px', background: jBusy ? 'rgba(255,255,255,0.02)' : '#f5a623', color: jBusy ? 'rgba(255,255,255,0.1)' : '#08090e', border:'none', borderRadius:5, cursor: jBusy ? 'wait' : 'pointer' }}>{jBusy ? '…' : 'Send'}</button>
              </div>
            </div>
          )}

          {/* ── ESTIMATE ── */}
          {station === 'estimate' && (
            <div style={{ maxWidth:520 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div>
                  <label style={S.lbl}>Trade / Service</label>
                  <select value={tradeKey} onChange={e => { setTradeKey(e.target.value); setResult(null); }} style={{ ...S.inp, cursor:'pointer' }}>
                    {Object.entries(TRADES_BY_CATEGORY).map(([cat, trades]) => (
                      <optgroup key={cat} label={cat.charAt(0).toUpperCase() + cat.slice(1)}>
                        {Object.entries(trades).map(([k, spec]) => <option key={k} value={k}>{spec.label}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div style={{ display:'grid', gridTemplateColumns: TRADES[tradeKey]?.depthUnit ? '1fr 1fr' : '1fr', gap:10 }}>
                  <div>
                    <label style={S.lbl}>{TRADES[tradeKey]?.unit === 'sqft' ? 'Square Feet' : TRADES[tradeKey]?.unit === 'lnft' ? 'Linear Feet' : 'Quantity'}</label>
                    <input type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder="0" style={S.inp} />
                  </div>
                  {TRADES[tradeKey]?.depthUnit && (
                    <div>
                      <label style={S.lbl}>Depth (in)</label>
                      <input type="number" value={depth} onChange={e => setDepth(e.target.value)} step="0.25" style={S.inp} />
                    </div>
                  )}
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div>
                    <label style={S.lbl}>Cost ({TRADES[tradeKey]?.costLabel})</label>
                    <input type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="0" style={S.inp} />
                  </div>
                  <div>
                    <label style={S.lbl}>Location</label>
                    <input value={city} onChange={e => setCity(e.target.value)} placeholder="City, VA" style={S.inp} />
                  </div>
                </div>

                <button onClick={calc} style={{ width:'100%', padding:'9px', background:'#f5a623', color:'#08090e', fontFamily:'inherit', fontSize:14, fontWeight:700, border:'none', borderRadius:5, cursor:'pointer' }}>Calculate</button>
              </div>

              {result && (
                <div style={{ marginTop:18, paddingTop:18, borderTop:'1px solid rgba(255,255,255,0.04)' }}>
                  {result.isLargeJob && <div style={{ padding:'6px 10px', borderRadius:4, background:'rgba(239,68,68,0.05)', border:'1px solid rgba(239,68,68,0.08)', fontSize:12, color:'#ef4444', marginBottom:10 }}>⚠ {result.quantity.toLocaleString()} {TRADES[tradeKey]?.unit} — exceeds 20K threshold. Owner review required.</div>}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background:'rgba(255,255,255,0.02)', borderRadius:6, overflow:'hidden', marginBottom:12 }}>
                    {[
                      result.tonnage !== null && { l:'Tonnage', v: result.tonnage.toFixed(2) + ' tons' },
                      { l:'Material', v: formatDollars(result.materialCost) },
                      { l:'Binder', v: formatDollars(BINDER_INDEX) },
                      { l:`Final Bid · ${(GROSS_MARGIN_FLOOR * 100).toFixed(0)}%`, v: formatDollars(result.finalBid), big: true },
                    ].filter(Boolean).map((row, i) => {
                      const r = row as { l: string; v: string; big?: boolean };
                      return (
                        <div key={i} style={{ padding:12, background:'#08090e', gridColumn: r.big ? 'span 2' : undefined }}>
                          <div style={{ fontSize:10, color:'rgba(255,255,255,0.15)', marginBottom:3 }}>{r.l}</div>
                          <div style={{ fontSize: r.big ? 20 : 15, fontWeight:700, color: r.big ? '#f5a623' : '#c9cdd8', fontVariantNumeric:'tabular-nums' }}>{r.v}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={saveJob} style={{ flex:1, padding:'7px', borderRadius:4, border:'1px solid rgba(34,197,94,0.1)', background:'rgba(34,197,94,0.03)', color:'#22c55e', fontFamily:'inherit', fontSize:13, fontWeight:600, cursor:'pointer' }}>Save as Job</button>
                    <button onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))} style={{ flex:1, padding:'7px', borderRadius:4, border:'1px solid rgba(255,255,255,0.04)', background:'rgba(255,255,255,0.01)', color:'rgba(255,255,255,0.25)', fontFamily:'inherit', fontSize:13, cursor:'pointer' }}>Copy JSON</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── JOBS ── */}
          {station === 'jobs' && (
            <div style={{ maxWidth:780 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.18)' }}>{activeJobs.length} active · Pipeline {formatDollars(pipeline)}</span>
                <button onClick={() => setStation('estimate')} style={{ fontFamily:'inherit', fontSize:13, padding:'4px 11px', borderRadius:4, border:'1px solid rgba(255,255,255,0.05)', background:'transparent', color:'rgba(255,255,255,0.3)', cursor:'pointer' }}>+ Estimate</button>
              </div>
              {jobs.length === 0
                ? <div style={{ textAlign:'center', padding:50, color:'rgba(255,255,255,0.08)', fontSize:14 }}>No jobs yet — create an estimate first</div>
                : jobs.map((j, i) => (
                    <div key={j.id} style={S.row}>
                      <span style={S.dot(j.status === 'Paid' ? '#22c55e' : j.status === 'In Progress' ? '#f5a623' : j.status === 'Complete' ? '#3b82f6' : 'rgba(255,255,255,0.06)')} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:14 }}>{j.trade}{j.city ? ` · ${j.city}` : ''}</div>
                        <div style={{ fontSize:10, color:'rgba(255,255,255,0.08)', marginTop:1 }}>{j.id}</div>
                      </div>
                      <span style={{ fontSize:13, color:'rgba(255,255,255,0.25)', fontVariantNumeric:'tabular-nums', minWidth:80, textAlign:'right' }}>{formatDollars(j.bid)}</span>
                      <select
                        value={j.status}
                        onChange={e => setJobs(p => { const s = [...p]; s[i] = { ...s[i]!, status: e.target.value as Job['status'] }; return s; })}
                        style={{ fontFamily:'inherit', fontSize:12, background:'transparent', color: j.status === 'Paid' ? '#22c55e' : j.status === 'In Progress' ? '#f5a623' : 'rgba(255,255,255,0.18)', border:'1px solid rgba(255,255,255,0.04)', borderRadius:3, padding:'2px 4px', cursor:'pointer', minWidth:80 }}
                      >
                        {JOB_STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  ))}
            </div>
          )}

          {/* ── CREW ── */}
          {station === 'crew' && (
            <div style={{ maxWidth:520 }}>
              <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:10 }}>
                <button onClick={() => {
                  const name = prompt('Name:'); if (!name) return;
                  const role = prompt('Role:') ?? 'Laborer';
                  setCrew(p => [...p, { id: String(Date.now()), name, role, status:'Available' }]);
                }} style={{ fontFamily:'inherit', fontSize:13, padding:'4px 11px', borderRadius:4, border:'1px solid rgba(255,255,255,0.05)', background:'transparent', color:'rgba(255,255,255,0.3)', cursor:'pointer' }}>+ Add</button>
              </div>
              {crew.length === 0
                ? <div style={{ textAlign:'center', padding:50, color:'rgba(255,255,255,0.08)' }}>No crew</div>
                : crew.map((c, i) => (
                    <div key={c.id} style={S.row}>
                      <span style={S.dot(c.status === 'Available' ? '#22c55e' : c.status === 'On Job' ? '#f5a623' : 'rgba(255,255,255,0.08)')} />
                      <div style={{ flex:1 }}><div style={{ fontSize:14 }}>{c.name}</div><div style={{ fontSize:11, color:'rgba(255,255,255,0.1)' }}>{c.role}</div></div>
                      <select value={c.status} onChange={e => setCrew(p => { const s = [...p]; s[i] = { ...s[i]!, status: e.target.value as CrewMember['status'] }; return s; })} style={{ fontFamily:'inherit', fontSize:12, background:'transparent', color: c.status === 'Available' ? '#22c55e' : c.status === 'On Job' ? '#f5a623' : 'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.04)', borderRadius:3, padding:'2px 4px', cursor:'pointer' }}>
                        {['Available','On Job','Off','Vacation','Terminated'].map(s => <option key={s}>{s}</option>)}
                      </select>
                      <button onClick={() => setCrew(p => p.filter((_, x) => x !== i))} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.08)', cursor:'pointer', fontSize:16 }}>×</button>
                    </div>
                  ))}
            </div>
          )}

          {/* ── EQUIPMENT ── */}
          {station === 'equipment' && (
            <div style={{ maxWidth:520 }}>
              <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:10 }}>
                <button onClick={() => {
                  const name = prompt('Equipment:'); if (!name) return;
                  const type = prompt('Type:') ?? 'Other';
                  setEquip(p => [...p, { id: String(Date.now()), name, type, status:'Available' }]);
                }} style={{ fontFamily:'inherit', fontSize:13, padding:'4px 11px', borderRadius:4, border:'1px solid rgba(255,255,255,0.05)', background:'transparent', color:'rgba(255,255,255,0.3)', cursor:'pointer' }}>+ Add</button>
              </div>
              {equip.length === 0
                ? <div style={{ textAlign:'center', padding:50, color:'rgba(255,255,255,0.08)' }}>No equipment</div>
                : equip.map((e, i) => (
                    <div key={e.id} style={S.row}>
                      <span style={S.dot(e.status === 'Available' ? '#22c55e' : e.status === 'On Job' ? '#f5a623' : e.status === 'Down' ? '#ef4444' : 'rgba(255,255,255,0.08)')} />
                      <div style={{ flex:1 }}><div style={{ fontSize:14 }}>{e.name}</div><div style={{ fontSize:11, color:'rgba(255,255,255,0.1)' }}>{e.type}</div></div>
                      <select value={e.status} onChange={ev => setEquip(p => { const s = [...p]; s[i] = { ...s[i]!, status: ev.target.value as Equipment['status'] }; return s; })} style={{ fontFamily:'inherit', fontSize:12, background:'transparent', color: e.status === 'Available' ? '#22c55e' : e.status === 'On Job' ? '#f5a623' : e.status === 'Down' ? '#ef4444' : 'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.04)', borderRadius:3, padding:'2px 4px', cursor:'pointer' }}>
                        {['Available','On Job','Maintenance','Down','Retired'].map(s => <option key={s}>{s}</option>)}
                      </select>
                      <button onClick={() => setEquip(p => p.filter((_, x) => x !== i))} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.08)', cursor:'pointer', fontSize:16 }}>×</button>
                    </div>
                  ))}
            </div>
          )}

          {/* ── WEATHER ── */}
          {station === 'weather' && (
            <div style={{ maxWidth:680 }}>
              {wxCurrent && (
                <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:24 }}>
                  <span style={{ fontSize:32 }}>{wxIcon(wxCurrent.code)}</span>
                  <div>
                    <div style={{ fontSize:28, fontWeight:700, color:'#e0e2e8', fontVariantNumeric:'tabular-nums' }}>{Math.round(wxCurrent.tempF)}°F</div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.18)' }}>Wind {Math.round(wxCurrent.windMph)} mph · Humidity {Math.round(wxCurrent.humidity)}%</div>
                  </div>
                  {wxDays[0] && (
                    <div style={{ marginLeft:'auto', padding:'8px 16px', borderRadius:6, border:`1px solid ${DECISION_COLOR[wxDays[0].decision]}20`, background:`${DECISION_COLOR[wxDays[0].decision]}08`, textAlign:'center' }}>
                      <div style={{ fontSize:13, fontWeight:700, color: DECISION_COLOR[wxDays[0].decision] }}>{wxDays[0].decision}</div>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,0.12)', marginTop:2 }}>PAVING TODAY</div>
                    </div>
                  )}
                </div>
              )}
              {!wxCurrent && <div style={{ color:'rgba(255,255,255,0.12)', fontSize:13, animation:'pulse-dot 1.5s infinite' }}>Loading weather…</div>}

              <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(255,255,255,0.1)', marginBottom:8 }}>10-Day Paving Forecast</div>
              <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                {wxDays.map((d, i) => (
                  <div key={i} style={{ ...S.row }}>
                    <span style={{ fontSize:12, color:'rgba(255,255,255,0.18)', minWidth:30 }}>{dayName(d.date)}</span>
                    <span style={{ fontSize:13 }}>{wxIcon(d.code)}</span>
                    <span style={{ fontSize:13, fontVariantNumeric:'tabular-nums', minWidth:70 }}>{Math.round(d.low)}°/{Math.round(d.high)}°</span>
                    <span style={{ fontSize:12, color:'rgba(255,255,255,0.14)', minWidth:50 }}>💧 {d.precip}%</span>
                    <span style={{ fontSize:12, color:'rgba(255,255,255,0.14)', minWidth:55 }}>💨 {Math.round(d.wind)} mph</span>
                    <span style={{ marginLeft:'auto', fontSize:12, fontWeight:700, color: DECISION_COLOR[d.decision], background:`${DECISION_COLOR[d.decision]}08`, border:`1px solid ${DECISION_COLOR[d.decision]}15`, padding:'2px 8px', borderRadius:3 }}>{d.decision}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── BANKING ── */}
          {station === 'banking' && (
            <div style={{ maxWidth:680 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:1, background:'rgba(255,255,255,0.02)', borderRadius:7, overflow:'hidden', marginBottom:22 }}>
                {[
                  { l:'Revenue (Paid)', v: formatDollars(revenue), c:'#22c55e', sub:`${paidJobs.length} jobs` },
                  { l:'Receivable', v: formatDollars(ar), c: ar ? '#eab308' : 'rgba(255,255,255,0.1)', sub:`${invoicedJobs.length} invoices` },
                  { l:'Total Pipeline', v: formatDollars(pipeline), c:'#c9cdd8', sub:`${jobs.length} jobs` },
                ].map((m, i) => (
                  <div key={i} style={{ padding:18, background:'#08090e' }}>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.1)', marginBottom:4 }}>{m.l}</div>
                    <div style={{ fontSize:20, fontWeight:700, color:m.c, fontVariantNumeric:'tabular-nums' }}>{m.v}</div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.08)', marginTop:2 }}>{m.sub}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(255,255,255,0.1)', marginBottom:8 }}>Margin Protection</div>
              <div style={{ background:'rgba(255,255,255,0.02)', borderRadius:5, padding:12, marginBottom:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:13, color:'rgba(255,255,255,0.25)' }}>Target margin floor</span>
                  <span style={{ fontSize:14, fontWeight:700, color:'#22c55e' }}>35%</span>
                </div>
                <div style={{ height:2, background:'rgba(255,255,255,0.03)', borderRadius:1, marginTop:8, overflow:'hidden' }}>
                  <div style={{ width:'35%', height:'100%', background:'#22c55e', borderRadius:1 }} />
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.08)', marginTop:5 }}>Every estimate enforces 35% net margin. Binder index ${BINDER_INDEX} + machine health $0.08/ton applied automatically.</div>
              </div>

              <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(255,255,255,0.1)', marginBottom:8 }}>Pipeline by Status</div>
              {JOB_STATUSES.map(status => {
                const sj = jobs.filter(j => j.status === status);
                if (!sj.length) return null;
                const tot = sj.reduce((a, j) => a + j.bid, 0);
                return (
                  <div key={status} style={{ display:'flex', alignItems:'center', padding:'5px 10px', gap:8 }}>
                    <span style={S.dot(status === 'Paid' ? '#22c55e' : status === 'In Progress' ? '#f5a623' : 'rgba(255,255,255,0.08)')} />
                    <span style={{ flex:1, fontSize:13, color:'rgba(255,255,255,0.25)' }}>{status}</span>
                    <span style={{ fontSize:12, color:'rgba(255,255,255,0.1)', fontVariantNumeric:'tabular-nums' }}>{sj.length} jobs</span>
                    <span style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.35)', fontVariantNumeric:'tabular-nums', minWidth:90, textAlign:'right' }}>{formatDollars(tot)}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── CRM ── */}
          {station === 'crm' && (
            <div style={{ maxWidth: 720 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
                <select
                  value={crmStage}
                  onChange={e => setCrmStage(e.target.value)}
                  style={{ ...S.inp, width: 180, cursor: 'pointer' }}
                >
                  <option value="">All Stages</option>
                  {['new', 'contacted', 'proposal_sent', 'negotiating', 'won', 'lost'].map(s => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    setCrmLoading(true);
                    const qs = crmStage ? `?pipeline_stage=${crmStage}` : '';
                    fetch(`${API}/api/v1/crm/leads${qs}`, {
                      headers: { 'X-Master-Key': MK },
                    })
                      .then(r => r.json())
                      .then((d: { leads: typeof crmLeads }) => setCrmLeads(d.leads || []))
                      .catch(() => {/* noop */})
                      .finally(() => setCrmLoading(false));
                  }}
                  style={{ ...S.btn('#f5a623', '#000'), fontSize: 11, padding: '6px 14px' }}
                >
                  {crmLoading ? 'Loading…' : 'Load'}
                </button>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>
                  {crmLeads.length} leads
                </span>
              </div>
              {crmLeads.length === 0 && !crmLoading && (
                <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 12, padding: '20px 0' }}>
                  Press Load to fetch leads from the API.
                </div>
              )}
              {crmLeads.map(lead => {
                const tierColor: Record<string, string> = { WHALE: '#3b82f6', SHARK: '#8b5cf6', FISH: '#22c55e' };
                const color = tierColor[lead.score_label ?? ''] ?? 'rgba(255,255,255,0.08)';
                return (
                  <div key={lead.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 5, background: 'rgba(255,255,255,0.015)', marginBottom: 2 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.5)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lead.name}
                    </span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                      {lead.service_type ?? lead.pipeline_stage}
                    </span>
                    {lead.estimated_value && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>
                        ${lead.estimated_value.toLocaleString()}
                      </span>
                    )}
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.12)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {lead.pipeline_stage.replace('_', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── LIEN CALENDAR ── */}
          {station === 'lien' && (
            <div style={{ maxWidth: 680 }}>
              {/* Calculator */}
              <div style={{ background: 'rgba(255,255,255,0.015)', borderRadius: 6, padding: '12px 14px', marginBottom: 14, border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#f5a623', marginBottom: 10 }}>
                  Calculate Deadlines
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                  <div>
                    <label style={S.lbl}>State</label>
                    <input value={lienCalcState} onChange={e => setLienCalcState(e.target.value.toUpperCase())} maxLength={2} style={S.inp} placeholder="VA" />
                  </div>
                  <div>
                    <label style={S.lbl}>Project Start</label>
                    <input type="date" value={lienStartDate} onChange={e => setLienStartDate(e.target.value)} style={S.inp} />
                  </div>
                  <div>
                    <label style={S.lbl}>Last Furnishing</label>
                    <input type="date" value={lienLastDate} onChange={e => setLienLastDate(e.target.value)} style={S.inp} />
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!lienStartDate || !lienLastDate) return;
                    setLienLoading(true);
                    fetch(`${API}/api/v1/lien/calculate`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'X-Master-Key': MK },
                      body: JSON.stringify({
                        state_code: lienCalcState,
                        project_start_date: lienStartDate,
                        last_furnishing_date: lienLastDate,
                      }),
                    })
                      .then(r => r.json())
                      .then((d: Record<string, unknown>) => setLienCalcResult(d))
                      .catch(() => {/* noop */})
                      .finally(() => setLienLoading(false));
                  }}
                  style={{ ...S.btn('#f5a623', '#000'), fontSize: 11, padding: '6px 14px' }}
                >
                  {lienLoading ? 'Calculating…' : 'Calculate'}
                </button>
                {lienCalcResult && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {([
                      ['State', String(lienCalcResult.state_code)],
                      ['Preliminary Notice', lienCalcResult.preliminary_notice_deadline ? new Date(String(lienCalcResult.preliminary_notice_deadline)).toLocaleDateString() : 'Not required'],
                      ['Lien Filing Deadline', lienCalcResult.lien_filing_deadline ? new Date(String(lienCalcResult.lien_filing_deadline)).toLocaleDateString() : '—'],
                      ['Days Until Lien', String(lienCalcResult.days_until_lien_deadline ?? '—')],
                      ['Foreclosure Deadline', lienCalcResult.foreclosure_deadline ? new Date(String(lienCalcResult.foreclosure_deadline)).toLocaleDateString() : '—'],
                      ['Notes', String(lienCalcResult.state_notes ?? '')],
                    ] as [string, string][]).map(([label, value]) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <span style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>{label}</span>
                        <span style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'right' }}>{value}</span>
                      </div>
                    ))}
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.1)', marginTop: 4 }}>
                      ⚖ Verify all deadlines with a licensed attorney.
                    </div>
                  </div>
                )}
              </div>

              {/* Tracked entries */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                <button
                  onClick={() => {
                    setLienLoading(true);
                    fetch(`${API}/api/v1/lien/upcoming?days_ahead=60`, {
                      headers: { 'X-Master-Key': MK },
                    })
                      .then(r => r.json())
                      .then((d: { entries: typeof lienEntries }) => setLienEntries(d.entries || []))
                      .catch(() => {/* noop */})
                      .finally(() => setLienLoading(false));
                  }}
                  style={{ ...S.btn('rgba(255,255,255,0.06)', 'rgba(255,255,255,0.4)'), fontSize: 11, padding: '5px 12px' }}
                >
                  Load Upcoming (60 days)
                </button>
                {lienEntries.length > 0 && (
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>{lienEntries.length} entries</span>
                )}
              </div>
              {lienEntries.map(entry => {
                const urgent = entry.is_urgent || (entry.days_until_lien !== null && entry.days_until_lien <= 7);
                return (
                  <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 5, background: urgent ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.015)', marginBottom: 2, border: urgent ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: urgent ? '#ef4444' : 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.5)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.customer_name} — {entry.project_address}
                    </span>
                    <span style={{ fontSize: 11, color: urgent ? '#ef4444' : 'rgba(255,255,255,0.15)', whiteSpace: 'nowrap', fontWeight: urgent ? 700 : 400 }}>
                      {entry.days_until_lien !== null ? `${entry.days_until_lien}d` : '—'} · {entry.state_code}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── LEGAL ── */}
          {station === 'legal' && (
            <div style={{ maxWidth:620 }}>
              <div style={{ marginBottom:14 }}>
                <label style={S.lbl}>Select State</label>
                <select value={legalState} onChange={e => setLegalState(e.target.value)} style={{ ...S.inp, cursor:'pointer' }}>
                  {AVAILABLE_STATES.map(s => <option key={s}>{s}</option>)}
                </select>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.08)', marginTop:4 }}>{AVAILABLE_STATES.length} states · Ask Jarvis for any state not listed</div>
              </div>
              {STATE_LEGAL[legalState] && (
                <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                  {(Object.entries({
                    'Contractor Licensing': STATE_LEGAL[legalState]!.licensing,
                    'Bond Requirements': STATE_LEGAL[legalState]!.bond,
                    'Mechanics Lien Law': STATE_LEGAL[legalState]!.lienLaw,
                    'Worker Classification': STATE_LEGAL[legalState]!.workerClassification,
                    'Prevailing Wage': STATE_LEGAL[legalState]!.prevailingWage,
                    'OSHA': STATE_LEGAL[legalState]!.osha,
                    'Continuing Education': STATE_LEGAL[legalState]!.continuingEducation,
                  })).map(([label, value]) => (
                    <div key={label} style={{ background:'rgba(255,255,255,0.015)', borderRadius:5, padding:'10px 12px', borderLeft:'2px solid rgba(245,166,35,0.15)', marginBottom:2 }}>
                      <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'#f5a623', marginBottom:3 }}>{label}</div>
                      <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', lineHeight:1.7 }}>{value}</div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop:14, padding:'9px 11px', borderRadius:5, border:'1px solid rgba(255,255,255,0.03)', fontSize:11, color:'rgba(255,255,255,0.1)', lineHeight:1.7 }}>
                ⚖ Educational information based on public law. Consult a licensed attorney for legal advice specific to your situation.
              </div>
            </div>
          )}

          {/* ── DISPATCH ── */}
          {station === 'dispatch' && (
            <DispatchStation apiBase={import.meta.env.VITE_API_BASE_URL || ''} masterKey={import.meta.env.VITE_MASTER_KEY || ''} />
          )}

          {/* ── SAFETY ── */}
          {station === 'safety' && (
            <SafetyStation apiBase={import.meta.env.VITE_API_BASE_URL || ''} masterKey={import.meta.env.VITE_MASTER_KEY || ''} />
          )}

          {/* ── CASH FLOW ── */}
          {station === 'cashflow' && (
            <CashFlowStation apiBase={import.meta.env.VITE_API_BASE_URL || ''} masterKey={import.meta.env.VITE_MASTER_KEY || ''} />
          )}

          {/* ── MARKET INTELLIGENCE ── */}
          {station === 'market' && (
            <MarketStation apiBase={import.meta.env.VITE_API_BASE_URL || ''} masterKey={import.meta.env.VITE_MASTER_KEY || ''} />
          )}

          {/* ── WORKFORCE ── */}
          {station === 'workforce' && (
            <WorkforceStation apiBase={import.meta.env.VITE_API_BASE_URL || ''} masterKey={import.meta.env.VITE_MASTER_KEY || ''} />
          )}

          {/* ── PROPOSALS ── */}
          {station === 'proposals' && (
            <ProposalsStation apiBase={import.meta.env.VITE_API_BASE_URL || ''} masterKey={import.meta.env.VITE_MASTER_KEY || ''} />
          )}

          {/* ── OPERATIONS / WORK ORDERS ── */}
          {station === 'operations' && (
            <OperationsStation apiBase={import.meta.env.VITE_API_BASE_URL || ''} masterKey={import.meta.env.VITE_MASTER_KEY || ''} />
          )}

          {/* ── SUBCONTRACTORS ── */}
          {station === 'subcontractors' && (
            <SubcontractorsStation apiBase={import.meta.env.VITE_API_BASE_URL || ''} masterKey={import.meta.env.VITE_MASTER_KEY || ''} />
          )}

          {/* ── FOREMAN CHECK-IN ── */}
          {station === 'foreman' && (
            <ForemanStation apiBase={import.meta.env.VITE_API_BASE_URL || ''} masterKey={import.meta.env.VITE_MASTER_KEY || ''} />
          )}

          {/* ── PERMITS ── */}
          {station === 'permits' && (
            <PermitsStation apiBase={import.meta.env.VITE_API_BASE_URL || ''} masterKey={import.meta.env.VITE_MASTER_KEY || ''} />
          )}

          {/* ── SCAN CAMPAIGNS ── */}
          {station === 'scan-campaign' && (
            <ScanCampaignStation apiBase={import.meta.env.VITE_API_BASE_URL || ''} masterKey={import.meta.env.VITE_MASTER_KEY || ''} />
          )}

          {station === 'roadscan' && (
            <RoadScanStation apiBase={import.meta.env.VITE_API_BASE_URL || ''} masterKey={import.meta.env.VITE_MASTER_KEY || ''} />
          )}

          {station === 'advisor' && (
            <AdvisorStation apiBase={import.meta.env.VITE_API_BASE_URL || ''} masterKey={import.meta.env.VITE_MASTER_KEY || ''} />
          )}

        </div>
      </div>

      {/* ── CMD PALETTE ── */}
      {cmd && (
        <div onClick={() => setCmd(false)} style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:'18vh' }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)' }} />
          <div onClick={e => e.stopPropagation()} style={{ position:'relative', width:'100%', maxWidth:440, background:'#0e1018', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, overflow:'hidden', boxShadow:'0 16px 50px rgba(0,0,0,0.5)' }}>
            <input
              ref={cmdRef}
              value={cmdInput}
              onChange={e => setCmdInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && cmdInput.trim()) execCmd(cmdInput.trim()); if (e.key === 'Escape') setCmd(false); }}
              placeholder="Search or ask Jarvis…"
              style={{ width:'100%', background:'transparent', border:'none', borderBottom:'1px solid rgba(255,255,255,0.04)', color:'#e0e2e8', fontFamily:'inherit', fontSize:13, padding:'12px 16px', outline:'none' }}
            />
            <div style={{ padding:6 }}>
              {NAV.map(n => (
                <button key={n.id} onClick={() => { execCmd('/' + n.id); setCmdInput(''); }} style={{ display:'block', width:'100%', textAlign:'left', padding:'5px 11px', borderRadius:4, border:'none', background:'transparent', color:'rgba(255,255,255,0.3)', fontFamily:'inherit', fontSize:13, cursor:'pointer' }}>
                  {n.label}<span style={{ float:'right', fontSize:11, color:'rgba(255,255,255,0.08)' }}>/{n.id}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Wave 2 Station Sub-Components ────────────────────────────────────────────

interface StationProps { apiBase: string; masterKey: string; }

function authHeaders(key: string) {
  return { 'Content-Type': 'application/json', 'X-Master-Key': key };
}

function DispatchStation({ apiBase, masterKey }: StationProps) {
  const [schedule, setSchedule] = React.useState<unknown[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`${apiBase}/api/v1/dispatch/schedule`, { headers: authHeaders(masterKey) })
      .then(r => r.ok ? r.json() : { schedule: [] })
      .then(d => setSchedule(d.schedule || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [apiBase, masterKey]);

  const row = (label: string, value: string | number) => (
    <div style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', width: 120, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{value}</span>
    </div>
  );

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.12)', marginBottom: 10 }}>Next 7 days — work orders requiring crew assignment</div>
      {loading ? <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 12 }}>Loading…</div> : schedule.length === 0 ? (
        <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 12 }}>No scheduled work orders.</div>
      ) : (schedule as any[]).map((wo: any) => (
        <div key={wo.id} style={{ background: 'rgba(255,255,255,0.015)', borderRadius: 5, padding: '9px 12px', marginBottom: 4, border: '1px solid rgba(255,255,255,0.04)' }}>
          {row('Work Order', wo.title)}
          {row('Status', wo.status)}
          {row('Site', wo.site_address || '—')}
          {row('Date', wo.scheduled_date ? new Date(wo.scheduled_date).toLocaleDateString() : '—')}
          {row('Crew', wo.crew_assigned || 'Unassigned')}
        </div>
      ))}
    </div>
  );
}

function SafetyStation({ apiBase, masterKey }: StationProps) {
  const [incidents, setIncidents] = React.useState<unknown[]>([]);
  const [rate, setRate] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      fetch(`${apiBase}/api/v1/safety/incidents?limit=20`, { headers: authHeaders(masterKey) }).then(r => r.ok ? r.json() : { incidents: [] }),
      fetch(`${apiBase}/api/v1/safety/osha-rate`, { headers: authHeaders(masterKey) }).then(r => r.ok ? r.json() : null),
    ]).then(([inc, rate]) => { setIncidents(inc.incidents || []); setRate(rate); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [apiBase, masterKey]);

  return (
    <div style={{ maxWidth: 680 }}>
      {rate && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          {[['TRIR', rate.trir], ['DART Rate', rate.dart_rate], ['Recordables', rate.recordable_incidents], ['Incidents', rate.recordable_incidents]].map(([l, v]) => (
            <div key={String(l)} style={{ flex: 1, background: 'rgba(255,255,255,0.015)', borderRadius: 5, padding: '9px 12px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginBottom: 3 }}>{l}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#e0e2e8' }}>{v}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.12)', marginBottom: 8 }}>Recent incidents</div>
      {loading ? <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 12 }}>Loading…</div> : incidents.length === 0 ? (
        <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 12 }}>No incidents logged. ✓</div>
      ) : (incidents as any[]).map((inc: any) => (
        <div key={inc.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '6px 10px', background: 'rgba(255,255,255,0.015)', borderRadius: 4, marginBottom: 2, border: inc.osha_recordable ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(255,255,255,0.03)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: inc.osha_recordable ? '#ef4444' : '#f5a623', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.description}</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', whiteSpace: 'nowrap' }}>{inc.incident_type} · {new Date(inc.incident_date).toLocaleDateString()}</span>
        </div>
      ))}
    </div>
  );
}

function CashFlowStation({ apiBase, masterKey }: StationProps) {
  const [forecast, setForecast] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`${apiBase}/api/v1/cashflow/forecast`, { headers: authHeaders(masterKey) })
      .then(r => r.ok ? r.json() : null)
      .then(d => setForecast(d))
      .catch(() => {}).finally(() => setLoading(false));
  }, [apiBase, masterKey]);

  if (loading) return <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 12 }}>Loading…</div>;
  if (!forecast) return <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 12 }}>No cash flow data.</div>;

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        {[
          ['Current Est. Balance', `$${(forecast.current_balance_estimate || 0).toLocaleString()}`],
          ['Negative Weeks', forecast.negative_weeks],
          ['First Negative', forecast.first_negative_week ? `Wk ${forecast.first_negative_week.week}` : 'None'],
        ].map(([l, v]) => (
          <div key={String(l)} style={{ flex: 1, background: 'rgba(255,255,255,0.015)', borderRadius: 5, padding: '9px 12px', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginBottom: 3 }}>{l}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: l === 'Negative Weeks' && forecast.negative_weeks > 0 ? '#ef4444' : '#e0e2e8' }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.12)', marginBottom: 8 }}>13-week rolling forecast</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {(forecast.forecast || []).slice(0, 13).map((w: any) => (
          <div key={w.week} style={{ display: 'flex', gap: 10, padding: '5px 8px', borderRadius: 3, background: w.alert ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.01)', border: w.alert ? '1px solid rgba(239,68,68,0.15)' : '1px solid transparent' }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', width: 50, flexShrink: 0 }}>Wk {w.week}</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', width: 70 }}>{w.start}</span>
            <span style={{ fontSize: 11, color: '#4ade80', width: 80, textAlign: 'right' }}>+${w.projected_inflow.toLocaleString()}</span>
            <span style={{ fontSize: 11, color: '#f87171', width: 80, textAlign: 'right' }}>-${w.projected_outflow.toLocaleString()}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: w.running_balance < 0 ? '#ef4444' : '#e0e2e8', width: 90, textAlign: 'right' }}>${w.running_balance.toLocaleString()}</span>
            {w.alert && <span style={{ fontSize: 10, color: '#ef4444' }}>⚠</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkforceStation({ apiBase, masterKey }: StationProps) {
  const [members, setMembers] = React.useState<any[]>([]);
  const [expiring, setExpiring] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      fetch(`${apiBase}/api/v1/workforce/`, { headers: authHeaders(masterKey) }).then(r => r.ok ? r.json() : { members: [] }),
      fetch(`${apiBase}/api/v1/workforce/expiring-certs?days=30`, { headers: authHeaders(masterKey) }).then(r => r.ok ? r.json() : { members: [] }),
    ]).then(([m, e]) => { setMembers(m.members || []); setExpiring(e.members || []); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [apiBase, masterKey]);

  const statusColor = (s: string) => s === 'active' ? '#22c55e' : s === 'inactive' ? '#eab308' : 'rgba(255,255,255,0.12)';

  return (
    <div style={{ maxWidth: 720 }}>
      {expiring.length > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '10px 14px', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', marginBottom: 6 }}>⚠ {expiring.length} cert(s) expiring within 30 days</div>
          {expiring.map((m: any) => (
            <div key={m.id} style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', padding: '2px 0' }}>
              {m.name} — {m.role}
              {m.license_expiry && <span style={{ color: '#f87171', marginLeft: 8 }}>License exp: {new Date(m.license_expiry).toLocaleDateString()}</span>}
              {m.osha_card_expiry && <span style={{ color: '#f87171', marginLeft: 8 }}>OSHA exp: {new Date(m.osha_card_expiry).toLocaleDateString()}</span>}
            </div>
          ))}
        </div>
      )}
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.12)', marginBottom: 8 }}>{members.length} workforce members</div>
      {loading ? <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 12 }}>Loading…</div> : members.length === 0 ? (
        <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 12 }}>No workforce members found.</div>
      ) : members.map((m: any) => (
        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 5, background: 'rgba(255,255,255,0.015)', marginBottom: 2, border: '1px solid rgba(255,255,255,0.03)' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor(m.status), flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{m.name}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>{m.role} {m.skills ? `· ${JSON.parse(m.skills || '[]').slice(0, 2).join(', ')}` : ''}</div>
          </div>
          <span style={{ fontSize: 11, color: statusColor(m.status), textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.status}</span>
          {m.hourly_rate && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)' }}>${m.hourly_rate}/hr</span>}
        </div>
      ))}
    </div>
  );
}

function ProposalsStation({ apiBase, masterKey }: StationProps) {
  const [proposals, setProposals] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      fetch(`${apiBase}/api/v1/proposals/`, { headers: authHeaders(masterKey) }).then(r => r.ok ? r.json() : { proposals: [] }),
      fetch(`${apiBase}/api/v1/proposals/win-rate`, { headers: authHeaders(masterKey) }).then(r => r.ok ? r.json() : null),
    ]).then(([p, s]) => { setProposals(p.proposals || []); setStats(s); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [apiBase, masterKey]);

  const outcomeColor = (o: string) => o === 'won' ? '#22c55e' : o === 'lost' ? '#ef4444' : '#eab308';

  return (
    <div style={{ maxWidth: 720 }}>
      {stats && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          {[
            ['Win Rate', `${Math.round((stats.win_rate || 0) * 100)}%`],
            ['Won', stats.won],
            ['Lost', stats.lost],
            ['Pending', stats.pending],
          ].map(([l, v]) => (
            <div key={String(l)} style={{ flex: 1, background: 'rgba(255,255,255,0.015)', borderRadius: 5, padding: '9px 12px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginBottom: 3 }}>{l}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: l === 'Win Rate' ? '#22c55e' : '#e0e2e8' }}>{v}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.12)', marginBottom: 8 }}>{proposals.length} proposals</div>
      {loading ? <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 12 }}>Loading…</div> : proposals.length === 0 ? (
        <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 12 }}>No proposals yet.</div>
      ) : proposals.map((p: any) => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 5, background: 'rgba(255,255,255,0.015)', marginBottom: 2, border: '1px solid rgba(255,255,255,0.03)' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: outcomeColor(p.outcome || 'pending'), flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.proposal_title}</span>
          {p.estimated_value && <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>${p.estimated_value.toLocaleString()}</span>}
          <span style={{ fontSize: 10, color: outcomeColor(p.outcome || 'pending'), textTransform: 'uppercase', whiteSpace: 'nowrap', letterSpacing: '0.06em' }}>{p.outcome || 'pending'}</span>
        </div>
      ))}
    </div>
  );
}

function OperationsStation({ apiBase, masterKey }: StationProps) {
  const [wos, setWos] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      fetch(`${apiBase}/api/v1/operations/work-orders?limit=50`, { headers: authHeaders(masterKey) }).then(r => r.ok ? r.json() : { work_orders: [] }),
      fetch(`${apiBase}/api/v1/operations/stats`, { headers: authHeaders(masterKey) }).then(r => r.ok ? r.json() : null),
    ]).then(([w, s]) => { setWos(w.work_orders || []); setStats(s); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [apiBase, masterKey]);

  const statusDot = (s: string) => s === 'complete' ? '#22c55e' : s === 'in_progress' ? '#f5a623' : s === 'assigned' ? '#3b82f6' : 'rgba(255,255,255,0.1)';

  return (
    <div style={{ maxWidth: 720 }}>
      {stats && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          {[['Total WOs', stats.total], ['In Progress', stats.in_progress], ['Pending', stats.pending], ['Complete', stats.complete]].map(([l, v]) => (
            <div key={String(l)} style={{ flex: 1, background: 'rgba(255,255,255,0.015)', borderRadius: 5, padding: '9px 12px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginBottom: 3 }}>{l}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#e0e2e8' }}>{v ?? 0}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.12)', marginBottom: 8 }}>Work orders</div>
      {loading ? <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 12 }}>Loading…</div> : wos.length === 0 ? (
        <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 12 }}>No work orders found.</div>
      ) : wos.map((wo: any) => (
        <div key={wo.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 5, background: 'rgba(255,255,255,0.015)', marginBottom: 2, border: '1px solid rgba(255,255,255,0.03)' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusDot(wo.status), flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wo.title}</div>
            {wo.site_address && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>{wo.site_address}</div>}
          </div>
          {wo.scheduled_date && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>{new Date(wo.scheduled_date).toLocaleDateString()}</span>}
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{wo.status?.replace('_', ' ')}</span>
        </div>
      ))}
    </div>
  );
}

function SubcontractorsStation({ apiBase, masterKey }: StationProps) {
  const [subs, setSubs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`${apiBase}/api/v1/subcontractors/?limit=50`, { headers: authHeaders(masterKey) })
      .then(r => r.ok ? r.json() : { subcontractors: [] })
      .then(d => setSubs(d.subcontractors || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, [apiBase, masterKey]);

  const statusColor = (s: string) => s === 'approved' ? '#22c55e' : s === 'suspended' ? '#ef4444' : '#eab308';

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.12)', marginBottom: 8 }}>{subs.length} subcontractors</div>
      {loading ? <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 12 }}>Loading…</div> : subs.length === 0 ? (
        <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 12 }}>No subs in directory.</div>
      ) : subs.map((s: any) => (
        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 5, background: 'rgba(255,255,255,0.015)', marginBottom: 2, border: '1px solid rgba(255,255,255,0.03)' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor(s.status), flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{s.company_name}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>{s.trade_specialty} {s.contact_name ? `· ${s.contact_name}` : ''}</div>
          </div>
          {s.aggregate_rating != null && (
            <span style={{ fontSize: 12, color: s.aggregate_rating >= 4 ? '#22c55e' : s.aggregate_rating >= 3 ? '#eab308' : '#ef4444', fontWeight: 600 }}>
              {'★'.repeat(Math.round(s.aggregate_rating))} {s.aggregate_rating.toFixed(1)}
            </span>
          )}
          {s.insurance_expiry && (
            <span style={{ fontSize: 10, color: new Date(s.insurance_expiry) < new Date() ? '#ef4444' : 'rgba(255,255,255,0.15)', whiteSpace: 'nowrap' }}>
              Ins: {new Date(s.insurance_expiry).toLocaleDateString()}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function ForemanStation({ apiBase, masterKey }: StationProps) {
  const [activeJobs, setActiveJobs] = React.useState<any[]>([]);
  const [notes, setNotes] = React.useState<any[]>([]);
  const [noteInput, setNoteInput] = React.useState('');
  const [selectedJob, setSelectedJob] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const S = {
    inp: { width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 5, color: '#e0e2e8', fontFamily: 'inherit', fontSize: 14, padding: '7px 11px', outline: 'none' } as React.CSSProperties,
    lbl: { fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.25)', display: 'block', marginBottom: 5 },
  };

  React.useEffect(() => {
    Promise.all([
      fetch(`${apiBase}/api/v1/foreman/active-jobs`, { headers: authHeaders(masterKey) }).then(r => r.ok ? r.json() : { jobs: [] }),
      fetch(`${apiBase}/api/v1/foreman/notes?limit=20`, { headers: authHeaders(masterKey) }).then(r => r.ok ? r.json() : { notes: [] }),
    ]).then(([a, n]) => { setActiveJobs(a.jobs || []); setNotes(n.notes || []); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [apiBase, masterKey]);

  async function submitNote() {
    if (!noteInput.trim() || !selectedJob) return;
    setSaving(true);
    try {
      await fetch(`${apiBase}/api/v1/foreman/check-in`, {
        method: 'POST',
        headers: authHeaders(masterKey),
        body: JSON.stringify({ job_id: selectedJob, note: noteInput, status: 'in_progress' }),
      });
      setNoteInput('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      const n = await fetch(`${apiBase}/api/v1/foreman/notes?limit=20`, { headers: authHeaders(masterKey) }).then(r => r.json());
      setNotes(n.notes || []);
    } catch { /* noop */ } finally { setSaving(false); }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 6, padding: '12px 14px', marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#f5a623', marginBottom: 10 }}>Field Check-In</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <label style={S.lbl}>Job</label>
            <select value={selectedJob} onChange={e => setSelectedJob(e.target.value)} style={{ ...S.inp, cursor: 'pointer' }}>
              <option value="">— select job —</option>
              {activeJobs.map((j: any) => <option key={j.id} value={j.id}>{j.title || j.id} {j.site_address ? `· ${j.site_address}` : ''}</option>)}
            </select>
          </div>
          <div>
            <label style={S.lbl}>Progress Note</label>
            <textarea value={noteInput} onChange={e => setNoteInput(e.target.value)} placeholder="Site conditions, progress, issues…" rows={3} style={{ ...S.inp, resize: 'vertical' }} />
          </div>
          <button onClick={submitNote} disabled={saving || !noteInput.trim() || !selectedJob} style={{ fontFamily: 'inherit', fontSize: 13, fontWeight: 700, padding: '7px 16px', background: saved ? '#22c55e' : saving ? 'rgba(255,255,255,0.04)' : '#f5a623', color: saving ? 'rgba(255,255,255,0.1)' : '#08090e', border: 'none', borderRadius: 5, cursor: 'pointer', alignSelf: 'flex-start' }}>
            {saved ? '✓ Saved' : saving ? 'Saving…' : 'Check In'}
          </button>
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.12)', marginBottom: 8 }}>Recent field notes</div>
      {loading ? <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 12 }}>Loading…</div> : notes.length === 0 ? (
        <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 12 }}>No notes yet.</div>
      ) : notes.map((n: any) => (
        <div key={n.id} style={{ padding: '8px 10px', borderRadius: 4, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', marginBottom: 3 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{n.note}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', marginTop: 3 }}>{n.job_id} · {n.created_at ? new Date(n.created_at).toLocaleString() : '—'}</div>
        </div>
      ))}
    </div>
  );
}

function PermitsStation({ apiBase, masterKey }: StationProps) {
  const [permits, setPermits] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState<any>(null);
  const [priority, setPriority] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [scanning, setScanning] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    const qs = priority ? `?priority=${priority}` : '';
    Promise.all([
      fetch(`${apiBase}/api/v1/permits/${qs}&limit=50`, { headers: authHeaders(masterKey) }).then(r => r.ok ? r.json() : { permits: [] }),
      fetch(`${apiBase}/api/v1/permits/stats`, { headers: authHeaders(masterKey) }).then(r => r.ok ? r.json() : null),
    ]).then(([p, s]) => { setPermits(p.permits || []); setStats(s); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [apiBase, masterKey, priority]);

  React.useEffect(() => { load(); }, [load]);

  async function triggerScan() {
    setScanning(true);
    try {
      await fetch(`${apiBase}/api/v1/permits/scan`, { method: 'POST', headers: authHeaders(masterKey) });
      setTimeout(() => { load(); setScanning(false); }, 2000);
    } catch { setScanning(false); }
  }

  const labelColor = (l: string) => l === 'HOT' ? '#ef4444' : l === 'WARM' ? '#f5a623' : 'rgba(255,255,255,0.25)';

  return (
    <div style={{ maxWidth: 720 }}>
      {stats && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          {[['Total', stats.total], ['HOT', stats.hot], ['WARM', stats.warm], ['COOL', stats.cool]].map(([l, v]) => (
            <div key={String(l)} style={{ flex: 1, background: 'rgba(255,255,255,0.015)', borderRadius: 5, padding: '9px 12px', border: `1px solid ${l === 'HOT' ? 'rgba(239,68,68,0.2)' : l === 'WARM' ? 'rgba(245,166,35,0.15)' : 'rgba(255,255,255,0.04)'}` }}>
              <div style={{ fontSize: 10, color: l === 'HOT' ? '#ef4444' : l === 'WARM' ? '#f5a623' : 'rgba(255,255,255,0.2)', marginBottom: 3 }}>{l}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#e0e2e8' }}>{v ?? 0}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <select value={priority} onChange={e => setPriority(e.target.value)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 5, color: '#e0e2e8', fontFamily: 'inherit', fontSize: 12, padding: '5px 8px', outline: 'none', cursor: 'pointer' }}>
          <option value="">All priorities</option>
          <option value="HOT">HOT</option>
          <option value="WARM">WARM</option>
          <option value="COOL">COOL</option>
        </select>
        <button onClick={triggerScan} disabled={scanning} style={{ fontFamily: 'inherit', fontSize: 11, fontWeight: 600, padding: '5px 12px', background: scanning ? 'rgba(255,255,255,0.03)' : 'rgba(245,166,35,0.08)', color: scanning ? 'rgba(255,255,255,0.2)' : '#f5a623', border: '1px solid rgba(245,166,35,0.15)', borderRadius: 4, cursor: 'pointer' }}>
          {scanning ? 'Scanning…' : '↻ Scan VPT'}
        </button>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.12)' }}>{permits.length} leads</span>
      </div>
      {loading ? <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 12 }}>Loading…</div> : permits.length === 0 ? (
        <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 12 }}>No permit leads. Click Scan VPT to fetch new leads.</div>
      ) : permits.map((p: any) => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 5, background: 'rgba(255,255,255,0.015)', marginBottom: 2, border: `1px solid ${p.priority_label === 'HOT' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.03)'}` }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: labelColor(p.priority_label), minWidth: 36 }}>{p.priority_label}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.property_address}{p.property_city ? `, ${p.property_city}` : ''} {p.property_state ? `${p.property_state}` : ''}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>{p.permit_type || '—'} {p.contractor_name ? `· ${p.contractor_name}` : '· No contractor'}</div>
          </div>
          {p.project_value != null && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap' }}>${p.project_value.toLocaleString()}</span>}
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.1)', whiteSpace: 'nowrap' }}>{p.priority_score}</span>
        </div>
      ))}
    </div>
  );
}

function MarketStation({ apiBase, masterKey }: StationProps) {
  const [seasonal, setSeasonal] = React.useState<any>(null);
  const [vdot, setVdot] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      fetch(`${apiBase}/api/v1/market-intelligence/seasonal`, { headers: authHeaders(masterKey) }).then(r => r.ok ? r.json() : null),
      fetch(`${apiBase}/api/v1/vdot-bids/stats`, { headers: authHeaders(masterKey) }).then(r => r.ok ? r.json() : null),
    ]).then(([s, v]) => { setSeasonal(s); setVdot(v); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [apiBase, masterKey]);

  if (loading) return <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 12 }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 680 }}>
      {seasonal && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.12)', marginBottom: 8 }}>Seasonal demand</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            {[
              ['This Month', `${seasonal.current_demand_index}/100`],
              ['Next Month', `${seasonal.next_month_demand_index}/100`],
              ['Trend', seasonal.trend],
            ].map(([l, v]) => (
              <div key={String(l)} style={{ flex: 1, background: 'rgba(255,255,255,0.015)', borderRadius: 5, padding: '9px 12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginBottom: 3 }}>{l}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: v === 'rising' ? '#4ade80' : v === 'falling' ? '#f87171' : '#e0e2e8' }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', padding: '8px 10px', background: 'rgba(245,166,35,0.06)', borderRadius: 4, borderLeft: '2px solid rgba(245,166,35,0.3)' }}>
            {seasonal.recommendation}
          </div>
        </div>
      )}
      {vdot && (
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.12)', marginBottom: 8 }}>VDOT bids</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[['Open', vdot.open], ['Awarded', vdot.awarded], ['Total', vdot.total]].map(([l, v]) => (
              <div key={String(l)} style={{ flex: 1, background: 'rgba(255,255,255,0.015)', borderRadius: 5, padding: '9px 12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginBottom: 3 }}>{l}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#e0e2e8' }}>{v}</div>
              </div>
            ))}
          </div>
          {vdot.by_tier && (
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              {[['WHALE', vdot.by_tier.WHALE], ['SHARK', vdot.by_tier.SHARK], ['FISH', vdot.by_tier.FISH]].map(([l, v]) => (
                <div key={String(l)} style={{ flex: 1, background: 'rgba(255,255,255,0.01)', borderRadius: 4, padding: '6px 10px', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ fontSize: 10, color: l === 'WHALE' ? '#f5a623' : l === 'SHARK' ? '#60a5fa' : '#4ade80', marginBottom: 2 }}>{l}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#e0e2e8' }}>{v}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScanCampaignStation({ apiBase, masterKey }: StationProps) {
  const [campaigns, setCampaigns] = React.useState<any[]>([]);
  const [selected, setSelected] = React.useState<any | null>(null);
  const [zip, setZip] = React.useState('');
  const [label, setLabel] = React.useState('');
  const [maxProps, setMaxProps] = React.useState(25);
  const [autoMail, setAutoMail] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [running, setRunning] = React.useState<number | null>(null);
  const [exporting, setExporting] = React.useState<number | null>(null);

  const S = {
    inp: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 5, color: '#e0e2e8', fontFamily: 'inherit', fontSize: 13, padding: '6px 10px', outline: 'none' } as React.CSSProperties,
    lbl: { fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.2)', display: 'block', marginBottom: 4 },
  };

  const loadCampaigns = React.useCallback(() => {
    setLoading(true);
    fetch(`${apiBase}/api/v1/scan-campaigns/?limit=30`, { headers: authHeaders(masterKey) })
      .then(r => r.ok ? r.json() : { campaigns: [] })
      .then(d => setCampaigns(d.campaigns || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [apiBase, masterKey]);

  React.useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

  const loadSelected = React.useCallback((id: number) => {
    fetch(`${apiBase}/api/v1/scan-campaigns/${id}`, { headers: authHeaders(masterKey) })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setSelected(d); })
      .catch(() => {});
  }, [apiBase, masterKey]);

  async function createCampaign() {
    if (!zip.trim()) return;
    setCreating(true);
    try {
      const r = await fetch(`${apiBase}/api/v1/scan-campaigns/`, {
        method: 'POST', headers: authHeaders(masterKey),
        body: JSON.stringify({ zip_code: zip.trim(), label: label || `Campaign ${zip.trim()}`, max_properties: maxProps, auto_mail: autoMail }),
      });
      if (r.ok) { setZip(''); setLabel(''); loadCampaigns(); }
    } catch { /* noop */ } finally { setCreating(false); }
  }

  async function runCampaign(id: number) {
    setRunning(id);
    try {
      await fetch(`${apiBase}/api/v1/scan-campaigns/${id}/run`, { method: 'POST', headers: authHeaders(masterKey) });
      setTimeout(() => { loadCampaigns(); if (selected?.campaign?.id === id) loadSelected(id); setRunning(null); }, 2500);
    } catch { setRunning(null); }
  }

  async function exportCampaign(id: number, zipCode: string) {
    setExporting(id);
    try {
      const r = await fetch(`${apiBase}/api/v1/scan-campaigns/${id}/export`, { headers: authHeaders(masterKey) });
      if (r.ok) {
        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `campaign_${id}_${zipCode}.zip`; a.click();
        URL.revokeObjectURL(url);
      }
    } catch { /* noop */ } finally { setExporting(null); }
  }

  const statusColor = (s: string) => s === 'done' ? '#22c55e' : s === 'running' || s === 'queued' ? '#f5a623' : s === 'failed' ? '#ef4444' : 'rgba(255,255,255,0.2)';

  const condColor = (c: string) => c === 'good' ? '#22c55e' : c === 'poor' ? '#ef4444' : '#eab308';

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Create form */}
      <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 6, padding: '12px 14px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#f5a623', marginBottom: 10 }}>New Scan Campaign</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={S.lbl}>ZIP Code</label>
            <input value={zip} onChange={e => setZip(e.target.value)} placeholder="23220" maxLength={10} style={{ ...S.inp, width: 90 }} />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={S.lbl}>Label (optional)</label>
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Spring outreach" style={{ ...S.inp, width: '100%' }} />
          </div>
          <div>
            <label style={S.lbl}>Max Properties</label>
            <input type="number" value={maxProps} onChange={e => setMaxProps(Math.max(1, parseInt(e.target.value) || 25))} min={1} max={500} style={{ ...S.inp, width: 70 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 2 }}>
            <input type="checkbox" id="automail" checked={autoMail} onChange={e => setAutoMail(e.target.checked)} style={{ accentColor: '#f5a623', cursor: 'pointer' }} />
            <label htmlFor="automail" style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>Auto-mail</label>
          </div>
          <button onClick={createCampaign} disabled={creating || !zip.trim()} style={{ fontFamily: 'inherit', fontSize: 12, fontWeight: 700, padding: '6px 14px', background: creating ? 'rgba(255,255,255,0.03)' : '#f5a623', color: creating ? 'rgba(255,255,255,0.1)' : '#08090e', border: 'none', borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {creating ? 'Creating…' : '+ Create'}
          </button>
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', marginTop: 6 }}>
          Demo mode: runs full pipeline with mock parcels + mock imagery when no API keys set.
          Auto-mail sends physical letters via Lob (mock send when LOB_API_KEY not set).
        </div>
      </div>

      {/* Campaign list */}
      {!selected && (
        <>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.12)', marginBottom: 8 }}>{campaigns.length} campaigns</div>
          {loading ? <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.1)' }}>Loading…</div>
            : campaigns.length === 0 ? <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.1)' }}>No campaigns yet — create one above.</div>
            : campaigns.map((c: any) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 5, background: 'rgba(255,255,255,0.015)', marginBottom: 3, border: '1px solid rgba(255,255,255,0.03)', cursor: c.status === 'done' ? 'pointer' : 'default' }}
                onClick={() => c.status === 'done' && loadSelected(c.id)}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor(c.status), flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{c.label}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
                    ZIP {c.zip_code} · {c.scanned}/{c.total_properties} scanned · {c.mailed} mailed · {c.status}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {c.status === 'pending' && (
                    <button onClick={e => { e.stopPropagation(); runCampaign(c.id); }} disabled={running === c.id} style={{ fontFamily: 'inherit', fontSize: 11, fontWeight: 600, padding: '4px 10px', background: running === c.id ? 'rgba(255,255,255,0.03)' : 'rgba(34,197,94,0.1)', color: running === c.id ? 'rgba(255,255,255,0.1)' : '#22c55e', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 4, cursor: 'pointer' }}>
                      {running === c.id ? 'Running…' : '▶ Run'}
                    </button>
                  )}
                  {c.status === 'done' && (
                    <button onClick={e => { e.stopPropagation(); exportCampaign(c.id, c.zip_code); }} disabled={exporting === c.id} style={{ fontFamily: 'inherit', fontSize: 11, fontWeight: 600, padding: '4px 10px', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, cursor: 'pointer' }}>
                      {exporting === c.id ? '…' : '↓ ZIP'}
                    </button>
                  )}
                </div>
              </div>
            ))
          }
        </>
      )}

      {/* Selected campaign detail */}
      {selected && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <button onClick={() => setSelected(null)} style={{ fontFamily: 'inherit', fontSize: 11, padding: '3px 8px', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, cursor: 'pointer' }}>← Back</button>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{selected.campaign.label}</div>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>ZIP {selected.campaign.zip_code} · {selected.properties?.length || 0} properties</span>
            <button onClick={() => exportCampaign(selected.campaign.id, selected.campaign.zip_code)} disabled={exporting === selected.campaign.id} style={{ marginLeft: 'auto', fontFamily: 'inherit', fontSize: 11, fontWeight: 600, padding: '4px 10px', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, cursor: 'pointer' }}>
              {exporting === selected.campaign.id ? 'Exporting…' : '↓ Export ZIP'}
            </button>
          </div>
          {(selected.properties || []).map((p: any) => (
            <div key={p.id} style={{ padding: '8px 10px', borderRadius: 5, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', marginBottom: 3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.address}{p.city ? `, ${p.city}` : ''}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{p.owner_name} · {p.owner_type} · {p.lot_size_sqft ? `${Math.round(p.lot_size_sqft).toLocaleString()} sqft` : '—'}</div>
                </div>
                {p.result && (
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexShrink: 0 }}>
                    {[['R', p.result.roof], ['D', p.result.driveway], ['Dr', p.result.drainage]].map(([abbr, cond]) => (
                      <span key={String(abbr)} style={{ fontSize: 9, fontWeight: 700, color: condColor(String(cond)), background: `${condColor(String(cond))}18`, padding: '2px 5px', borderRadius: 3 }}>
                        {abbr}:{String(cond).toUpperCase().slice(0, 1)}
                      </span>
                    ))}
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>
                      ${p.result.estimate_low?.toLocaleString()}–${p.result.estimate_high?.toLocaleString()}
                    </span>
                    {p.result.mailer_sent && <span style={{ fontSize: 9, color: '#22c55e', fontWeight: 700 }}>✓ MAILED</span>}
                  </div>
                )}
              </div>
              {p.result?.narrative && (
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 4, fontStyle: 'italic', lineHeight: 1.5 }}>{p.result.narrative}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Wave 9 Stations — Road Scan + Legal Advisor ──────────────────────────────

function RoadScanStation({ apiBase }: StationProps) {
  const [age, setAge] = React.useState('8');
  const [cracks, setCracks] = React.useState('15');
  const [potholes, setPotholes] = React.useState('1');
  const [traffic, setTraffic] = React.useState('medium');
  const [busy, setBusy] = React.useState(false);
  const [score, setScore] = React.useState<any>(null);
  const [forecast, setForecast] = React.useState<any>(null);
  const [decay, setDecay] = React.useState<any>(null);

  const scoreColor = (s: number) => s >= 70 ? '#22c55e' : s >= 40 ? '#eab308' : '#ef4444';

  const runScan = async () => {
    setBusy(true);
    try {
      const body = { age: Number(age), cracks: Number(cracks), potholes: Number(potholes), traffic };
      const sRes = await fetch(`${apiBase}/api/v1/pavement/score`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const s = await sRes.json();
      setScore(s);
      const [fRes, dRes] = await Promise.all([
        fetch(`${apiBase}/api/v1/pavement/forecast`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pavement_age: Number(age), condition: s.score }) }),
        fetch(`${apiBase}/api/v1/pavement/decay`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pavement_type: 'commercial_parking_lot', age_years: Number(age), current_condition_score: s.score, traffic_level: traffic === 'very_high' ? 'heavy_truck' : traffic, crack_severity: Number(cracks) > 30 ? 'high' : Number(cracks) > 10 ? 'medium' : 'low', potholes: Number(potholes) }) }),
      ]);
      setForecast(await fRes.json());
      setDecay(await dRes.json());
    } catch { /* network error — leave prior results */ }
    setBusy(false);
  };

  const inp: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 5, color: '#e0e2e8', fontFamily: 'inherit', fontSize: 14, padding: '7px 11px', outline: 'none' };
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', display: 'block', marginBottom: 5 };

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.12)', marginBottom: 12 }}>ASTM D6433-calibrated PCI scoring · exponential decay forecasting · maintenance calendar</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 8, alignItems: 'end', marginBottom: 16 }}>
        <div><span style={lbl}>Age (yrs)</span><input value={age} onChange={e => setAge(e.target.value)} style={inp} /></div>
        <div><span style={lbl}>Cracking %</span><input value={cracks} onChange={e => setCracks(e.target.value)} style={inp} /></div>
        <div><span style={lbl}>Potholes /1k sqft</span><input value={potholes} onChange={e => setPotholes(e.target.value)} style={inp} /></div>
        <div><span style={lbl}>Traffic</span>
          <select value={traffic} onChange={e => setTraffic(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="very_high">Very High</option>
          </select>
        </div>
        <button onClick={runScan} disabled={busy} style={{ background: '#f5a623', color: '#08090e', border: 'none', borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, padding: '8px 18px', fontSize: 13 }}>{busy ? 'Scanning…' : 'Scan'}</button>
      </div>

      {score && (
        <div style={{ display: 'flex', gap: 14, marginBottom: 16, alignItems: 'stretch' }}>
          <div style={{ background: 'rgba(255,255,255,0.015)', borderRadius: 7, padding: '16px 22px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: 38, fontWeight: 700, color: scoreColor(score.score), fontVariantNumeric: 'tabular-nums' }}>{score.score}</div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>PCI · {score.condition}</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.015)', borderRadius: 7, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: 13, color: '#e0e2e8', marginBottom: 6 }}>{score.recommended_action}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Urgency: <span style={{ color: score.urgency === 'immediate' ? '#ef4444' : '#eab308', fontWeight: 600 }}>{score.urgency}</span> · Confidence {Math.round((score.confidence ?? 0) * 100)}%</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', marginTop: 6 }}>Deductions — age {score.deductions?.age_deduction} · cracks {score.deductions?.crack_deduction} · potholes {score.deductions?.pothole_deduction}</div>
          </div>
        </div>
      )}

      {forecast && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#f5a623', marginBottom: 8 }}>Maintenance Calendar</div>
          {(forecast.service_schedule || []).map((m: any) => (
            <div key={m.service} style={{ display: 'flex', gap: 10, padding: '7px 12px', background: 'rgba(255,255,255,0.015)', borderRadius: 5, marginBottom: 3, alignItems: 'center', borderLeft: `2px solid ${m.status === 'overdue' ? '#ef4444' : 'rgba(245,166,35,0.3)'}` }}>
              <span style={{ fontSize: 13, color: '#e0e2e8', width: 130 }}>{m.service}</span>
              <span style={{ fontSize: 12, color: m.status === 'overdue' ? '#ef4444' : 'rgba(255,255,255,0.4)', fontWeight: m.status === 'overdue' ? 700 : 400 }}>{m.status === 'overdue' ? 'OVERDUE' : m.target_date}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', marginLeft: 'auto' }}>{m.years_from_now} yrs · PCI {m.pci_at_trigger}</span>
            </div>
          ))}
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.12)', marginTop: 6 }}>PCI projection — 1yr: {forecast.projected_pci_1yr} · 3yr: {forecast.projected_pci_3yr} · 5yr: {forecast.projected_pci_5yr}</div>
        </div>
      )}

      {decay && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#f5a623', marginBottom: 8 }}>10-Year Decay Projection · {decay.annual_decay_points} pts/yr · risk {decay.risk_level}</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 90 }}>
            {(decay.projection || []).map((p: any) => (
              <div key={p.year} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ height: Math.max(4, p.condition_score * 0.7), background: scoreColor(p.condition_score), borderRadius: '3px 3px 0 0', opacity: 0.75 }} />
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>{p.condition_score}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.12)' }}>yr {p.year}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

function AdvisorStation({ apiBase }: StationProps) {
  const [advState, setAdvState] = React.useState('VA');
  const [dispute, setDispute] = React.useState('lien');
  const [role, setRole] = React.useState('gc');
  const [busy, setBusy] = React.useState(false);
  const [rec, setRec] = React.useState<any>(null);
  const [optimizer, setOptimizer] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetch(`${apiBase}/api/v1/advisor/license-optimizer?top_n=10`)
      .then(r => r.ok ? r.json() : { results: [] })
      .then(d => setOptimizer(d.results || []))
      .catch(() => {});
  }, [apiBase]);

  const analyze = async () => {
    setBusy(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/advisor/legal-strategy`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state: advState, dispute_type: dispute, role }) });
      setRec(await res.json());
    } catch { /* keep prior */ }
    setBusy(false);
  };

  const inp: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 5, color: '#e0e2e8', fontFamily: 'inherit', fontSize: 14, padding: '7px 11px', outline: 'none', cursor: 'pointer' };
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', display: 'block', marginBottom: 5 };
  const strengthColor: Record<string, string> = { green: '#22c55e', yellow: '#eab308', red: '#ef4444' };

  const bar = (label: string, v: number) => (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.25)', marginBottom: 2 }}><span>{label}</span><span>{v}</span></div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 2 }}>
        <div style={{ height: 4, width: `${v}%`, background: v >= 75 ? '#22c55e' : v >= 55 ? '#eab308' : '#ef4444', borderRadius: 2 }} />
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.12)', marginBottom: 12 }}>51-state dispute strength scoring + negotiation strategy · advisory only, not legal advice</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr auto', gap: 8, alignItems: 'end', marginBottom: 16 }}>
        <div><span style={lbl}>State</span><select value={advState} onChange={e => setAdvState(e.target.value)} style={inp}>{US_STATES.map(s => <option key={s}>{s}</option>)}</select></div>
        <div><span style={lbl}>Dispute</span>
          <select value={dispute} onChange={e => setDispute(e.target.value)} style={inp}>
            <option value="lien">Mechanics Lien</option><option value="payment">Payment / Prompt-Pay</option><option value="contract_breach">Contract Breach</option><option value="general">General</option>
          </select>
        </div>
        <div><span style={lbl}>Your Role</span>
          <select value={role} onChange={e => setRole(e.target.value)} style={inp}>
            <option value="gc">General Contractor</option><option value="sub">Subcontractor</option><option value="supplier">Supplier</option><option value="owner">Owner</option>
          </select>
        </div>
        <button onClick={analyze} disabled={busy} style={{ background: '#f5a623', color: '#08090e', border: 'none', borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, padding: '8px 18px', fontSize: 13 }}>{busy ? 'Analyzing…' : 'Analyze'}</button>
      </div>

      {rec && rec.scores && (
        <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 190, background: 'rgba(255,255,255,0.015)', borderRadius: 7, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: strengthColor[rec.scores.color] || '#e0e2e8', textAlign: 'center' }}>{rec.scores.composite}</div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: strengthColor[rec.scores.color], textAlign: 'center', marginBottom: 10 }}>{rec.scores.label} · {rec.state}</div>
            {bar('Lien', rec.scores.lien)}
            {bar('Payment', rec.scores.payment)}
            {bar('Contract', rec.scores.contract)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e0e2e8', marginBottom: 4 }}>{rec.strategy?.title}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, marginBottom: 8 }}>{rec.strategy?.description}</div>
            {(rec.strategy?.key_actions || []).map((a: string, i: number) => (
              <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', padding: '4px 0 4px 14px', borderLeft: '2px solid rgba(245,166,35,0.25)', marginBottom: 3 }}>{a}</div>
            ))}
            {rec.strategy?.state_specific_note && <div style={{ fontSize: 11, color: '#f5a623', marginTop: 8, opacity: 0.8 }}>{rec.strategy.state_specific_note}</div>}
          </div>
        </div>
      )}

      {optimizer.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#f5a623', marginBottom: 8 }}>License Optimizer — Best Base States</div>
          {optimizer.map((s: any) => (
            <div key={s.abbr} style={{ display: 'flex', gap: 10, padding: '6px 12px', background: 'rgba(255,255,255,0.015)', borderRadius: 5, marginBottom: 3, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', width: 18 }}>{s.rank}</span>
              <span style={{ fontSize: 13, color: '#e0e2e8', width: 130 }}>{s.state}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>recip {s.reciprocity_count} · scope {s.class_scope_score} · bond ${(s.bond_min_commercial || 0).toLocaleString()}</span>
              <span style={{ fontSize: 11, fontWeight: 700, marginLeft: 'auto', color: s.optimizer_label === 'OPTIMAL' ? '#22c55e' : s.optimizer_label === 'GOOD' ? '#eab308' : 'rgba(255,255,255,0.25)' }}>{s.optimizer_score} {s.optimizer_label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
