/**
 * VirginiaStatewide.jsx — Statewide Command Center
 *
 * Three-panel intelligence dashboard:
 *   Left  — VDOT district filter + bid list
 *   Center — SVG county coverage map (color-coded by service tier)
 *   Right  — SCC entity verifier + live result card
 */

import { useState, useMemo } from 'react';
import {
  VA_ALL_LOCALITIES, VA_VDOT_DISTRICTS, VA_BOUNDS, PRIMARY_LOCALITIES, EXTENDED_LOCALITIES,
} from '../data/virginia_counties';
import { api } from '../api/client';

// ── Tier colours ──────────────────────────────────────────────────────────────
const TIER_COLOR = {
  primary:   '#f59e0b',   // amber  — HQ coverage
  extended:  '#3b82f6',   // blue   — same-day mobilisation
  statewide: '#6b7280',   // grey   — VDOT bid / sub network
};
const TIER_LABEL = {
  primary:   'Primary (same-day)',
  extended:  'Extended (same-day mobilise)',
  statewide: 'Statewide (VDOT/sub network)',
};

// ── Simple dot-map (lon→x, lat→y within SVG 800×600) ─────────────────────────
function toSvgCoords(lat, lng) {
  const x = ((lng - VA_BOUNDS.west)  / (VA_BOUNDS.east  - VA_BOUNDS.west))  * 800;
  const y = ((VA_BOUNDS.north - lat) / (VA_BOUNDS.north - VA_BOUNDS.south)) * 600;
  return { x, y };
}

function CoverageMap({ selected, onSelect }) {
  return (
    <svg viewBox="0 0 800 600" className="w-full h-full" aria-label="Virginia county coverage map">
      <rect width="800" height="600" fill="#0f172a" rx="8" />
      {VA_ALL_LOCALITIES.map((loc) => {
        const { x, y } = toSvgCoords(loc.lat, loc.lng);
        const isSelected = selected?.fips === loc.fips;
        return (
          <g key={`${loc.fips}-${loc.name}`} onClick={() => onSelect(loc)} className="cursor-pointer">
            <circle
              cx={x} cy={y}
              r={isSelected ? 8 : 5}
              fill={TIER_COLOR[loc.tier]}
              opacity={isSelected ? 1 : 0.75}
              stroke={isSelected ? '#fff' : 'none'}
              strokeWidth={isSelected ? 2 : 0}
            />
          </g>
        );
      })}
      {/* Legend */}
      {Object.entries(TIER_LABEL).map(([tier, label], i) => (
        <g key={tier} transform={`translate(12, ${520 + i * 26})`}>
          <circle cx={8} cy={8} r={6} fill={TIER_COLOR[tier]} />
          <text x={20} y={13} fill="#cbd5e1" fontSize={13}>{label}</text>
        </g>
      ))}
    </svg>
  );
}

// ── SCC verifier panel ────────────────────────────────────────────────────────
function SccPanel() {
  const [query, setQuery]   = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const handleVerify = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const isId = /^S\d+$/i.test(query.trim());
      const params = isId ? `entity_id=${encodeURIComponent(query.trim())}`
                           : `entity_name=${encodeURIComponent(query.trim())}`;
      const data = await api.request('GET', `/api/v1/scc/verify?${params}`);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
        SCC Entity Verify
      </h3>
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
          placeholder="Entity ID (S1234567) or name…"
          className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <button
          onClick={handleVerify}
          disabled={loading}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded text-sm disabled:opacity-50"
        >
          {loading ? '…' : 'Check'}
        </button>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      {result && (
        <div className="bg-slate-800 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold truncate">{result.entity_name}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
              result.is_good_standing ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}>
              {result.status}
            </span>
          </div>
          <p className="text-slate-400">Type: <span className="text-slate-200">{result.entity_type || '—'}</span></p>
          <p className="text-slate-400">Entity ID: <span className="text-slate-200">{result.entity_id || '—'}</span></p>
          {result.registered_agent && (
            <p className="text-slate-400">Agent: <span className="text-slate-200">{result.registered_agent}</span></p>
          )}
          {result.principal_office && (
            <p className="text-slate-400 text-xs">{result.principal_office}</p>
          )}
          {result.date_formed && (
            <p className="text-slate-400">Formed: <span className="text-slate-200">{result.date_formed}</span></p>
          )}
          <p className="text-slate-600 text-xs">Source: {result.source} · {result.checked_at?.slice(0, 10)}</p>
        </div>
      )}
    </div>
  );
}

// ── VDOT bid panel ────────────────────────────────────────────────────────────
function VdotPanel() {
  const [district, setDistrict] = useState('');
  const [bids, setBids]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError]       = useState('');

  const fetchBids = async (d = district) => {
    setLoading(true); setError('');
    try {
      const qs = d ? `?district=${encodeURIComponent(d)}&limit=20` : '?limit=20';
      const data = await api.request('GET', `/api/v1/vdot-bids${qs}`);
      setBids(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const triggerScan = async () => {
    setScanning(true);
    try {
      await api.request('POST', '/api/v1/vdot-bids/scan');
      await fetchBids();
    } catch (e) {
      setError(e.message);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">VDOT Bid Board</h3>
        <button
          onClick={triggerScan}
          disabled={scanning}
          className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {scanning ? 'Scanning…' : '↻ Scan Now'}
        </button>
      </div>
      <div className="flex gap-2">
        <select
          value={district}
          onChange={(e) => { setDistrict(e.target.value); fetchBids(e.target.value); }}
          className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white"
        >
          <option value="">All Districts</option>
          {VA_VDOT_DISTRICTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <button
          onClick={() => fetchBids()}
          disabled={loading}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm disabled:opacity-50"
        >
          {loading ? '…' : 'Load'}
        </button>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      {bids && (
        <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
          <p className="text-slate-500 text-xs">{bids.total} bids total</p>
          {bids.bids.length === 0 && (
            <p className="text-slate-500 text-sm">No bids stored — click Scan Now to load.</p>
          )}
          {bids.bids.map((b) => (
            <div key={b.id} className="bg-slate-800 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between gap-2">
                <span className="text-white font-medium text-xs leading-snug line-clamp-2">{b.title}</span>
                {b.estimated_value && (
                  <span className="shrink-0 text-green-400 font-semibold text-xs">
                    ${(b.estimated_value / 1000).toFixed(0)}K
                  </span>
                )}
              </div>
              <div className="flex gap-2 text-slate-400 text-xs flex-wrap">
                <span>{b.district}</span>
                {b.county && <span>· {b.county}</span>}
                {b.close_date && <span>· Closes {b.close_date?.slice(0, 10)}</span>}
              </div>
              <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                b.prime_eligible ? 'bg-amber-700 text-amber-100' : 'bg-slate-700 text-slate-300'
              }`}>
                {b.prime_eligible ? 'Prime Eligible' : 'Sub Only'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function VirginiaStatewide() {
  const [selectedLocality, setSelectedLocality] = useState(null);
  const [filterTier, setFilterTier] = useState('');

  const stats = useMemo(() => ({
    primary:   PRIMARY_LOCALITIES.length,
    extended:  EXTENDED_LOCALITIES.length,
    statewide: VA_ALL_LOCALITIES.length,
  }), []);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Virginia Statewide Command</h1>
        <p className="text-slate-400 text-sm mt-1">
          {stats.statewide} localities · {stats.primary} primary · {stats.extended} extended · VDOT bid intelligence
        </p>
      </div>

      {/* Tier stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {Object.entries(TIER_LABEL).map(([tier, label]) => (
          <button
            key={tier}
            onClick={() => setFilterTier(filterTier === tier ? '' : tier)}
            className={`rounded-lg p-3 text-left border transition-colors ${
              filterTier === tier
                ? 'border-amber-500 bg-slate-800'
                : 'border-slate-700 bg-slate-900 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full" style={{ background: TIER_COLOR[tier] }} />
              <span className="text-xs text-slate-400 uppercase tracking-wide">{tier}</span>
            </div>
            <p className="text-xl font-bold text-white">
              {VA_ALL_LOCALITIES.filter((l) => l.tier === tier).length}
            </p>
            <p className="text-xs text-slate-500 leading-tight">{label}</p>
          </button>
        ))}
      </div>

      {/* Three-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_320px] gap-4">
        {/* Left — VDOT bids */}
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <VdotPanel />
        </div>

        {/* Center — Map */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden min-h-[500px] relative">
          <CoverageMap
            selected={selectedLocality}
            onSelect={setSelectedLocality}
          />
          {selectedLocality && (
            <div className="absolute bottom-4 left-4 bg-slate-800/90 backdrop-blur rounded-lg p-3 text-sm max-w-[240px]">
              <p className="font-semibold text-white">{selectedLocality.name}</p>
              <p className="text-slate-400 text-xs">{selectedLocality.vdot} District</p>
              <span
                className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium"
                style={{ background: TIER_COLOR[selectedLocality.tier] + '33', color: TIER_COLOR[selectedLocality.tier] }}
              >
                {TIER_LABEL[selectedLocality.tier]}
              </span>
            </div>
          )}
        </div>

        {/* Right — SCC verifier */}
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <SccPanel />
          <div className="mt-6 border-t border-slate-800 pt-4 space-y-1">
            <h4 className="text-xs text-slate-500 uppercase tracking-wide mb-2">Quick Stats</h4>
            <p className="text-xs text-slate-400">133 counties + 38 independent cities</p>
            <p className="text-xs text-slate-400">9 VDOT districts covered</p>
            <p className="text-xs text-slate-400">VDOT bid scrape: daily 07:00 UTC</p>
            <p className="text-xs text-slate-400">SCC check: on-demand, auto-logs</p>
          </div>
        </div>
      </div>
    </div>
  );
}
