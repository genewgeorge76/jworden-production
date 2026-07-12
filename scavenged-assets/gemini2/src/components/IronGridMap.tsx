import { useEffect, useRef, useState } from 'react';

// ── State centroid positions in 960×580 SVG viewport ──────────────────────────
// Projection: x = (lon + 124.7) / 57.8 * 900 + 30
//             y = (49.4 - lat)  / 24.9 * 530 + 25
const STATES: { abbr: string; name: string; x: number; y: number }[] = [
  { abbr: 'AL', name: 'Alabama',        x: 648, y: 410 },
  { abbr: 'AK', name: 'Alaska',         x: 120, y: 520 },
  { abbr: 'AZ', name: 'Arizona',        x: 218, y: 415 },
  { abbr: 'AR', name: 'Arkansas',       x: 575, y: 375 },
  { abbr: 'CA', name: 'California',     x: 111, y: 296 },
  { abbr: 'CO', name: 'Colorado',       x: 320, y: 305 },
  { abbr: 'CT', name: 'Connecticut',    x: 823, y: 192 },
  { abbr: 'DE', name: 'Delaware',       x: 800, y: 243 },
  { abbr: 'FL', name: 'Florida',        x: 699, y: 505 },
  { abbr: 'GA', name: 'Georgia',        x: 681, y: 406 },
  { abbr: 'HI', name: 'Hawaii',         x: 210, y: 540 },
  { abbr: 'ID', name: 'Idaho',          x: 196, y: 178 },
  { abbr: 'IL', name: 'Illinois',       x: 604, y: 278 },
  { abbr: 'IN', name: 'Indiana',        x: 636, y: 270 },
  { abbr: 'IA', name: 'Iowa',           x: 552, y: 238 },
  { abbr: 'KS', name: 'Kansas',         x: 472, y: 310 },
  { abbr: 'KY', name: 'Kentucky',       x: 668, y: 300 },
  { abbr: 'LA', name: 'Louisiana',      x: 585, y: 455 },
  { abbr: 'ME', name: 'Maine',          x: 862, y: 140 },
  { abbr: 'MD', name: 'Maryland',       x: 777, y: 255 },
  { abbr: 'MA', name: 'Massachusetts',  x: 837, y: 176 },
  { abbr: 'MI', name: 'Michigan',       x: 638, y: 202 },
  { abbr: 'MN', name: 'Minnesota',      x: 537, y: 155 },
  { abbr: 'MS', name: 'Mississippi',    x: 614, y: 420 },
  { abbr: 'MO', name: 'Missouri',       x: 568, y: 300 },
  { abbr: 'MT', name: 'Montana',        x: 274, y: 140 },
  { abbr: 'NE', name: 'Nebraska',       x: 452, y: 265 },
  { abbr: 'NV', name: 'Nevada',         x: 169, y: 295 },
  { abbr: 'NH', name: 'New Hampshire',  x: 845, y: 162 },
  { abbr: 'NJ', name: 'New Jersey',     x: 809, y: 221 },
  { abbr: 'NM', name: 'New Mexico',     x: 294, y: 395 },
  { abbr: 'NY', name: 'New York',       x: 796, y: 184 },
  { abbr: 'NC', name: 'N. Carolina',    x: 729, y: 333 },
  { abbr: 'ND', name: 'North Dakota',   x: 431, y: 142 },
  { abbr: 'OH', name: 'Ohio',           x: 682, y: 246 },
  { abbr: 'OK', name: 'Oklahoma',       x: 477, y: 370 },
  { abbr: 'OR', name: 'Oregon',         x: 141, y: 195 },
  { abbr: 'PA', name: 'Pennsylvania',   x: 769, y: 220 },
  { abbr: 'RI', name: 'Rhode Island',   x: 833, y: 186 },
  { abbr: 'SC', name: 'S. Carolina',    x: 726, y: 370 },
  { abbr: 'SD', name: 'South Dakota',   x: 431, y: 193 },
  { abbr: 'TN', name: 'Tennessee',      x: 640, y: 340 },
  { abbr: 'TX', name: 'Texas',          x: 416, y: 443 },
  { abbr: 'UT', name: 'Utah',           x: 234, y: 305 },
  { abbr: 'VT', name: 'Vermont',        x: 828, y: 159 },
  { abbr: 'VA', name: 'Virginia',       x: 748, y: 289 },
  { abbr: 'WA', name: 'Washington',     x: 155, y: 148 },
  { abbr: 'WV', name: 'West Virginia',  x: 726, y: 268 },
  { abbr: 'WI', name: 'Wisconsin',      x: 583, y: 193 },
  { abbr: 'WY', name: 'Wyoming',        x: 302, y: 220 },
];

// ── Heat intensity per state (0–1). States not listed get 0. ──────────────────
const HEAT: Record<string, number> = {
  TX: 0.95, FL: 0.90, OH: 0.85, VA: 0.92,
  NC: 0.78, GA: 0.74, MD: 0.72, PA: 0.68,
  TN: 0.62, IL: 0.60, NY: 0.65, CA: 0.58,
  SC: 0.55, WV: 0.52, KY: 0.50, NJ: 0.48,
};

// ── Live intercept feed data ──────────────────────────────────────────────────
const INTERCEPTS = [
  { city: 'Dallas, TX',      intent: '"Plaza Street Partners Asphalt Paving"',             status: 'JWORDENAI Auto-Targeted',          tier: 1 },
  { city: 'Orlando, FL',     intent: '"50-State Commercial Paving Contractor"',             status: 'Dominance SEO Triggered',          tier: 1 },
  { city: 'Columbus, OH',    intent: '"K-VA-T Food Stores Parking Lot Resurfacing"',        status: 'Proposal Queued',                  tier: 1 },
  { city: 'Richmond, VA',    intent: '"J. Worden Sons National Paving"',                    status: 'Home Territory Lock — Confirmed',  tier: 1 },
  { city: 'Charlotte, NC',   intent: '"Taco Bell NSO Paving Contractor"',                   status: 'GC Intercept · Bid Staged',        tier: 1 },
  { city: 'Atlanta, GA',     intent: '"National Commercial Paving 50 States"',              status: 'JWORDENAI Auto-Targeted',          tier: 2 },
  { city: 'Nashville, TN',   intent: '"KFC Restaurant Remodel Paving"',                    status: 'Franchise NSO Alert Fired',        tier: 2 },
  { city: 'Philadelphia, PA',intent: '"VDOT-Grade Asphalt Infrastructure"',                status: 'Dominance SEO Triggered',          tier: 2 },
  { city: 'Chicago, IL',     intent: '"Industrial Parking Lot Resurfacing GC"',            status: 'Proposal Queued',                  tier: 2 },
  { city: 'Houston, TX',     intent: '"Fast Food Chain Paving Contractor National"',       status: 'JWORDENAI Auto-Targeted',          tier: 1 },
  { city: 'Baltimore, MD',   intent: '"State DOT Asphalt Contractor Prequalified"',        status: 'Bid Pipeline Activated',           tier: 2 },
  { city: 'Los Angeles, CA', intent: '"50-State Infrastructure Paving Firm"',              status: 'West Coast Intercept — Monitoring',tier: 2 },
  { city: 'Tampa, FL',       intent: '"Chick-fil-A Site Development Paving"',              status: 'Franchise NSO Alert Fired',        tier: 1 },
  { city: 'Cleveland, OH',   intent: '"K-VA-T Asphalt Infrastructure Partner"',            status: 'Proposal Queued',                  tier: 1 },
  { city: 'Raleigh, NC',     intent: '"Commercial Parking Lot GC Virginia"',               status: 'Dominance SEO Triggered',          tier: 2 },
];

// ── Heat color mapping ────────────────────────────────────────────────────────
function heatColor(h: number): string {
  if (h >= 0.88) return '#ff2200'; // deep red
  if (h >= 0.75) return '#ff5500'; // orange-red
  if (h >= 0.60) return '#ff8800'; // amber-orange
  if (h >= 0.48) return '#ffaa00'; // amber
  return '#ffcc00';                 // gold
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function IronGridMap() {
  const [tick, setTick] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [feedIdx, setFeedIdx] = useState(0);
  const [visibleItems, setVisibleItems] = useState<number[]>([0, 1, 2]);
  const feedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pulse animation driver
  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => t + 1);
      setPulse((p) => !p);
    }, 1400);
    return () => clearInterval(id);
  }, []);

  // Intercept feed — add one new entry every 2.8 s
  useEffect(() => {
    feedRef.current = setInterval(() => {
      setFeedIdx((i) => (i + 1) % INTERCEPTS.length);
    }, 2800);
    return () => { if (feedRef.current) clearInterval(feedRef.current); };
  }, []);

  // Rolling window of 6 visible feed entries
  useEffect(() => {
    setVisibleItems((prev) => {
      const next = [...prev, feedIdx].slice(-6);
      return next;
    });
  }, [feedIdx]);

  // For animated glow radius
  const glowScale = pulse ? 1.0 : 0.85;

  return (
    <section className="py-12 px-6 border-b border-zinc-900 bg-[#060609]">
      <div className="max-w-7xl mx-auto">

        {/* Section header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full bg-red-500"
              style={{ boxShadow: '0 0 8px 3px #ff220066', animation: 'pulse 1.4s ease-in-out infinite' }}
            />
            <span className="text-[10px] font-black uppercase tracking-[0.45em] text-red-400">
              LIVE · Search Intent Heatmap
            </span>
          </div>
          <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest">
            <span className="text-zinc-200">
              Intercepted Queries: <span className="text-[#ffcc00]">{(tick * 7 + 1402).toLocaleString()}</span>
            </span>
            <span className="text-zinc-200">
              Auto-Proposals Fired: <span className="text-green-400">{(tick * 2 + 348).toLocaleString()}</span>
            </span>
            <span className="bg-red-900/30 border border-red-700/40 text-red-400 px-3 py-1 rounded-full animate-pulse">
              AI DOMINANCE ACTIVE
            </span>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white mb-1">
          Iron Grid <span className="text-red-500">War Room</span>{' '}
          <span className="text-zinc-200 text-lg">— National Search Intercept Map</span>
        </h2>
        <p className="text-[11px] text-zinc-300 font-bold uppercase tracking-wider mb-8">
          Real-time SEO dominance radar · JWORDENAI detecting high commercial search intent across 50 states
        </p>

        {/* Two-column layout: map + feed */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">

          {/* ── The Iron Grid Map ─────────────────────────────────────────── */}
          <div
            className="relative rounded-xl overflow-hidden border border-zinc-800"
            style={{
              background: 'linear-gradient(145deg, #07070f 0%, #0a0a14 60%, #0d0a08 100%)',
              boxShadow: '0 0 40px 4px #ff220012, inset 0 0 80px #00000080',
            }}
          >
            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-[#ffcc00]/30 rounded-tl-xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-[#ffcc00]/30 rounded-tr-xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-[#ffcc00]/30 rounded-bl-xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-[#ffcc00]/30 rounded-br-xl pointer-events-none" />

            {/* Map header bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800/80 bg-black/40">
              <span className="text-[9px] font-black uppercase tracking-[0.5em] text-[#ffcc00]/60">
                JWORDENAI · SEARCH DOMINANCE GRID · CONTIG. USA
              </span>
              <span className="ml-auto flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-green-500">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                LIVE
              </span>
            </div>

            {/* SVG map */}
            <svg
              viewBox="30 110 870 450"
              className="w-full"
              style={{ display: 'block' }}
              aria-label="US Search Intent Heatmap"
            >
              <defs>
                {/* Glow filters for each heat tier */}
                <filter id="glow-critical" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="18" result="blur" />
                  <feColorMatrix in="blur" type="matrix"
                    values="1 0 0 0 1  0 0.1 0 0 0  0 0 0 0 0  0 0 0 0.7 0" result="colored" />
                  <feMerge><feMergeNode in="colored" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="glow-high" x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur" />
                  <feColorMatrix in="blur" type="matrix"
                    values="1 0.3 0 0 0.9  0 0.2 0 0 0.1  0 0 0 0 0  0 0 0 0.6 0" result="colored" />
                  <feMerge><feMergeNode in="colored" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="glow-med" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                  <feColorMatrix in="blur" type="matrix"
                    values="1 0.5 0 0 0.8  0.3 0.3 0 0 0.2  0 0 0 0 0  0 0 0 0.5 0" result="colored" />
                  <feMerge><feMergeNode in="colored" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="dot-glow" x="-200%" y="-200%" width="500%" height="500%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
                </filter>

                {/* Heatmap radial gradients for hot states */}
                {STATES.filter((s) => HEAT[s.abbr] !== undefined).map((s) => {
                  const h = HEAT[s.abbr]!;
                  const col = heatColor(h);
                  return (
                    <radialGradient key={`grad-${s.abbr}`} id={`heat-${s.abbr}`} cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={col} stopOpacity={0.45 * h} />
                      <stop offset="55%" stopColor={col} stopOpacity={0.18 * h} />
                      <stop offset="100%" stopColor={col} stopOpacity={0} />
                    </radialGradient>
                  );
                })}
              </defs>

              {/* Fine grid background */}
              {Array.from({ length: 30 }).map((_, i) => (
                <line
                  key={`gx-${i}`}
                  x1={30 + i * 30} y1={110}
                  x2={30 + i * 30} y2={560}
                  stroke="#ffcc0008" strokeWidth="1"
                />
              ))}
              {Array.from({ length: 16 }).map((_, i) => (
                <line
                  key={`gy-${i}`}
                  x1={30} y1={110 + i * 30}
                  x2={900} y2={110 + i * 30}
                  stroke="#ffcc0008" strokeWidth="1"
                />
              ))}

              {/* Heatmap glow blobs — drawn first (behind state dots) */}
              {STATES.filter((s) => HEAT[s.abbr] !== undefined).map((s) => {
                const h = HEAT[s.abbr]!;
                const r = (48 + h * 48) * glowScale;
                return (
                  <ellipse
                    key={`heat-${s.abbr}`}
                    cx={s.x} cy={s.y}
                    rx={r * 1.2} ry={r}
                    fill={`url(#heat-${s.abbr})`}
                    style={{ transition: 'rx 0.7s ease, ry 0.7s ease' }}
                  />
                );
              })}

              {/* State dots + labels */}
              {STATES.map((s) => {
                const h = HEAT[s.abbr] ?? 0;
                const isHot = h >= 0.48;
                const col = h > 0 ? heatColor(h) : '#334155';
                const r = isHot ? 5 : 3;

                return (
                  <g key={s.abbr}>
                    {/* Outer glow ring for hot states */}
                    {isHot && (
                      <circle
                        cx={s.x} cy={s.y}
                        r={r + 6 + (pulse ? 3 : 0)}
                        fill="none"
                        stroke={col}
                        strokeWidth="1"
                        opacity={0.3}
                        style={{ transition: 'r 0.7s ease, opacity 0.7s ease' }}
                      />
                    )}
                    {/* Core dot */}
                    <circle
                      cx={s.x} cy={s.y} r={r}
                      fill={col}
                      opacity={isHot ? 0.95 : 0.45}
                      filter={isHot ? (h >= 0.88 ? 'url(#glow-critical)' : h >= 0.72 ? 'url(#glow-high)' : 'url(#glow-med)') : undefined}
                    />
                    {/* State abbreviation */}
                    <text
                      x={s.x} y={s.y + (isHot ? 16 : 12)}
                      textAnchor="middle"
                      fontSize={isHot ? '8' : '7'}
                      fontFamily="monospace"
                      fontWeight={isHot ? 'bold' : 'normal'}
                      fill={isHot ? col : '#475569'}
                      opacity={isHot ? 1 : 0.7}
                    >
                      {s.abbr}
                    </text>
                  </g>
                );
              })}

              {/* VA home-base star marker */}
              {(() => {
                const va = STATES.find((s) => s.abbr === 'VA')!;
                return (
                  <text
                    x={va.x} y={va.y - 10}
                    textAnchor="middle"
                    fontSize="12"
                    fill="#ffcc00"
                    style={{ filter: 'drop-shadow(0 0 6px #ffcc00)' }}
                  >
                    ★
                  </text>
                );
              })()}
            </svg>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 px-4 pb-3 pt-1 border-t border-zinc-800/60">
              {[
                { col: '#ff2200', label: 'Critical Intent (95%+)' },
                { col: '#ff5500', label: 'High Intent (75–94%)' },
                { col: '#ff8800', label: 'Med Intent (60–74%)' },
                { col: '#ffcc00', label: 'Emerging (48–59%)' },
                { col: '#334155', label: 'Monitoring' },
              ].map(({ col, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ background: col, boxShadow: `0 0 6px 1px ${col}66` }}
                  />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-300">{label}</span>
                </div>
              ))}
              <span className="ml-auto text-[9px] font-bold uppercase tracking-widest text-[#ffcc00]/50">
                ★ HQ — Richmond, VA
              </span>
            </div>
          </div>

          {/* ── Intercept Feed (The Radar) ─────────────────────────────────── */}
          <div
            className="flex flex-col rounded-xl border border-zinc-800 overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #070b07 0%, #07090b 100%)',
              boxShadow: '0 0 24px 2px #00ff4408, inset 0 0 40px #00000060',
            }}
          >
            {/* Feed header */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800/80 bg-black/40">
              <span
                className="inline-block w-2 h-2 rounded-full bg-green-400"
                style={{ boxShadow: '0 0 6px 2px #22c55e80', animation: 'pulse 1s ease-in-out infinite' }}
              />
              <span className="text-[9px] font-black uppercase tracking-[0.45em] text-green-500/80">
                SEARCH INTERCEPT RADAR
              </span>
              <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-zinc-200">
                [{INTERCEPTS.length} STREAMS]
              </span>
            </div>

            {/* Sub-header */}
            <div className="px-4 py-2 border-b border-zinc-900 bg-black/20">
              <div className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-200">
                &gt;&gt; JWORDENAI · REAL-TIME SEO DOMINANCE ENGINE · LIVE FEED
              </div>
            </div>

            {/* Feed entries */}
            <div className="flex-1 overflow-hidden px-3 py-3 space-y-2">
              {visibleItems.map((idx, pos) => {
                const item = INTERCEPTS[idx % INTERCEPTS.length];
                const isNew = pos === visibleItems.length - 1;
                const tierColor = item.tier === 1 ? 'text-red-400' : 'text-amber-400';
                const tierBorder = item.tier === 1 ? 'border-red-700/40' : 'border-amber-700/30';
                const tierBg = item.tier === 1 ? 'bg-red-950/20' : 'bg-amber-950/10';
                return (
                  <div
                    key={`${idx}-${pos}`}
                    className={`border ${tierBorder} ${tierBg} rounded px-3 py-2 transition-all duration-700`}
                    style={{ opacity: isNew ? 1 : 0.55 + pos * 0.07 }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[8px] font-black uppercase tracking-[0.4em] ${tierColor}`}>
                        ▶ INTERCEPTED
                      </span>
                      <span className={`text-[8px] font-black uppercase tracking-widest ${tierColor} opacity-70`}>
                        TIER-{item.tier}
                      </span>
                    </div>
                    <div className="text-[9px] font-black text-green-300 font-mono mb-1">
                      IP ORIGIN: {item.city}
                    </div>
                    <div className="text-[9px] text-zinc-300 font-mono mb-1 leading-snug">
                      QUERY: {item.intent}
                    </div>
                    <div className="text-[8px] font-black uppercase tracking-widest text-green-500/80">
                      STATUS: {item.status}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Feed footer stats */}
            <div className="border-t border-zinc-800/80 px-4 py-3 bg-black/30 space-y-1.5">
              <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                <span className="text-zinc-200">Queries / Hour</span>
                <span className="text-green-400 font-mono">{(2847 + tick * 3).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                <span className="text-zinc-200">Proposals Auto-Fired</span>
                <span className="text-[#ffcc00] font-mono">{(348 + tick * 2).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                <span className="text-zinc-200">Hot Zones Active</span>
                <span className="text-red-400 font-mono">
                  {Object.values(HEAT).filter((h) => h >= 0.75).length} STATES
                </span>
              </div>
              <div className="mt-2 text-[8px] font-black uppercase tracking-[0.5em] text-zinc-700 text-center">
                ██████████ SEO DOMINANCE: {Math.min(100, 72 + tick % 12)}% ██████████
              </div>
            </div>
          </div>
        </div>

        {/* Bottom status bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-4 py-2 rounded-lg bg-zinc-950 border border-zinc-900">
          <div className="flex items-center gap-3">
            {['TX', 'FL', 'OH', 'VA', 'NC'].map((st) => {
              const s = STATES.find((x) => x.abbr === st)!;
              const h = HEAT[st] ?? 0;
              const col = heatColor(h);
              return (
                <div key={st} className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ background: col, boxShadow: `0 0 4px 1px ${col}` }}
                  />
                  <span className="text-[9px] font-black text-zinc-200 uppercase tracking-widest">
                    {s.name}
                  </span>
                  <span className="text-[9px] font-mono" style={{ color: col }}>
                    {Math.round(h * 100)}%
                  </span>
                </div>
              );
            })}
          </div>
          <div className="text-[9px] font-black uppercase tracking-widest text-zinc-200">
            JWORDENAI Search Radar · Updated every 2.8s · 50-State Coverage
          </div>
        </div>
      </div>
    </section>
  );
}
