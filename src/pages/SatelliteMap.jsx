import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { JOB_LOCATIONS } from '@/lib/job-locations';
import { SERVICE_AREAS } from '@/data/serviceAreas';
import { VA_ALL_LOCALITIES } from '@/data/virginia_counties';
import { api } from '@/api/client';
import SEO from '@/components/SEO';

/**
 * Satellite map with switchable pin layers.
 *
 * Imagery is Esri World Imagery and geocoding is OpenStreetMap Nominatim —
 * both keyless on purpose. A Google Maps embed needs a browser-visible API
 * key, and anything shipped to the browser is public.
 *
 * Layers are declared in LAYERS below. Static ones read from repo data; live
 * ones call the backend. A live layer that cannot reach its endpoint says so
 * explicitly rather than rendering an empty map — "no jobs available" and "we
 * never managed to ask" must not look identical.
 */

const dot = (color, size = 12) =>
  L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:2px solid #fff;border-radius:50%;box-shadow:0 0 10px ${color}"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

const ICONS = {
  completed: dot('#C5A059'),
  service: dot('#22c55e'),
  county: dot('#64748b', 9),
  available: dot('#f59e0b', 14),
  search: dot('#38bdf8', 16),
};

/** Pull coordinates out of whatever shape the backend returns. */
function coordsOf(o) {
  const lat = o.lat ?? o.latitude ?? o.geo?.lat;
  const lng = o.lng ?? o.lon ?? o.longitude ?? o.geo?.lng;
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

const LAYERS = [
  {
    id: 'blank',
    label: 'Blank',
    hint: 'Imagery only',
    load: () => ({ pins: [] }),
  },
  {
    id: 'completed',
    label: 'Jobs completed',
    hint: `${JOB_LOCATIONS.length} commercial sites`,
    icon: ICONS.completed,
    load: () => ({
      pins: JOB_LOCATIONS.map((j) => ({
        id: j.id,
        lat: j.lat,
        lng: j.lng,
        title: j.client,
        lines: [`${j.city}, ${j.state}`, j.jobType, j.sqft ? `${j.sqft.toLocaleString()} sq ft` : null],
      })),
    }),
  },
  {
    id: 'service',
    label: 'Service areas',
    hint: `${SERVICE_AREAS.length} markets`,
    icon: ICONS.service,
    load: () => ({
      pins: SERVICE_AREAS.map((s) => ({
        id: s.slug,
        lat: s.lat,
        lng: s.lng,
        title: `${s.city}, ${s.stateCode}`,
        lines: [s.county, s.tagline],
        href: `/locations/${s.slug}`,
      })),
    }),
  },
  {
    id: 'counties',
    label: 'VA localities',
    hint: `${VA_ALL_LOCALITIES.length} by service tier`,
    icon: ICONS.county,
    load: () => ({
      pins: VA_ALL_LOCALITIES.map((c) => ({
        id: c.fips,
        lat: c.lat,
        lng: c.lng,
        title: c.name,
        lines: [`VDOT ${c.vdot} district`, `Tier: ${c.tier}`],
      })),
    }),
  },
  {
    id: 'vdot',
    label: 'VDOT bids',
    hint: 'Live · open solicitations',
    icon: ICONS.available,
    live: true,
    load: async () => {
      const res = await api.getVdotBids({ limit: 200 });
      const items = Array.isArray(res) ? res : res?.items ?? res?.bids ?? [];
      const pins = [];
      let missing = 0;
      for (const b of items) {
        const c = coordsOf(b);
        if (!c) { missing += 1; continue; }
        pins.push({
          id: b.id ?? b.bid_id ?? `${c.lat},${c.lng}`,
          ...c,
          title: b.title ?? b.project_name ?? 'VDOT solicitation',
          lines: [b.county ?? b.location, b.due_date ? `Due ${b.due_date}` : null, b.value ? `Est. ${b.value}` : null],
        });
      }
      return { pins, missing, total: items.length };
    },
  },
  {
    id: 'diamond',
    label: 'Available jobs',
    hint: 'Live · scraped leads',
    icon: ICONS.available,
    live: true,
    load: async () => {
      const res = await api.getDiamondJobs();
      const items = Array.isArray(res) ? res : res?.items ?? res?.jobs ?? [];
      const pins = [];
      let missing = 0;
      for (const j of items) {
        const c = coordsOf(j);
        if (!c) { missing += 1; continue; }
        pins.push({
          id: j.id ?? `${c.lat},${c.lng}`,
          ...c,
          title: j.title ?? j.client ?? 'Available job',
          lines: [j.city && j.state ? `${j.city}, ${j.state}` : j.location, j.job_type, j.value],
        });
      }
      return { pins, missing, total: items.length };
    },
  },
];

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 17, { duration: 1.2 });
  }, [target, map]);
  return null;
}

function CoordReadout({ onMove }) {
  const map = useMap();
  useEffect(() => {
    const h = (e) => onMove(e.latlng);
    map.on('mousemove', h);
    return () => map.off('mousemove', h);
  }, [map, onMove]);
  return null;
}

export default function SatelliteMap() {
  const [activeIds, setActiveIds] = useState(['completed']);
  const [layerState, setLayerState] = useState({}); // id -> {pins,status,error,missing,total}
  const [query, setQuery] = useState('');
  const [found, setFound] = useState(null);
  const [searchStatus, setSearchStatus] = useState('idle');
  const [cursor, setCursor] = useState(null);
  const abortRef = useRef(null);

  const toggle = (id) =>
    setActiveIds((prev) => {
      if (id === 'blank') return [];
      return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
    });

  // Load each newly-activated layer once.
  useEffect(() => {
    for (const id of activeIds) {
      if (layerState[id]) continue;
      const layer = LAYERS.find((l) => l.id === id);
      if (!layer) continue;
      setLayerState((s) => ({ ...s, [id]: { status: 'loading', pins: [] } }));
      Promise.resolve()
        .then(() => layer.load())
        .then((r) => setLayerState((s) => ({ ...s, [id]: { status: 'ready', ...r } })))
        .catch((err) =>
          setLayerState((s) => ({
            ...s,
            [id]: { status: 'error', pins: [], error: err?.message || 'Request failed' },
          })),
        );
    }
  }, [activeIds]); // eslint-disable-line react-hooks/exhaustive-deps

  const search = useCallback(
    async (e) => {
      e.preventDefault();
      const q = query.trim();
      if (!q) return;
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setSearchStatus('searching');
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
          { signal: ctrl.signal, headers: { Accept: 'application/json' } },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data.length) { setFound(null); setSearchStatus('notfound'); return; }
        setFound({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), label: data[0].display_name });
        setSearchStatus('idle');
      } catch (err) {
        if (err.name !== 'AbortError') setSearchStatus('error');
      }
    },
    [query],
  );

  const visible = useMemo(
    () => activeIds.map((id) => ({ layer: LAYERS.find((l) => l.id === id), state: layerState[id] })).filter((x) => x.layer),
    [activeIds, layerState],
  );

  const totalPins = visible.reduce((n, v) => n + (v.state?.pins?.length || 0), 0);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100">
      <SEO title="Satellite Map" description="Satellite imagery with job, market and solicitation layers." noindex />

      <div className="mx-auto max-w-[1600px] px-4 py-6">
        <header className="mb-4">
          <h1 className="font-display text-3xl font-black uppercase tracking-tight">Satellite Map</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Scope property and job sites. Toggle layers, search any address, read coordinates off the cursor.
          </p>
        </header>

        {/* Layer switcher */}
        <div className="mb-3 flex flex-wrap gap-2">
          {LAYERS.map((l) => {
            const on = l.id === 'blank' ? activeIds.length === 0 : activeIds.includes(l.id);
            const st = layerState[l.id];
            return (
              <button
                key={l.id}
                onClick={() => toggle(l.id)}
                className={`rounded-md border px-3 py-2 text-left transition ${
                  on ? 'border-sky-500 bg-sky-950/40' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  {l.id !== 'blank' && (
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: l.id === 'completed' ? '#C5A059' : l.id === 'service' ? '#22c55e' : l.id === 'counties' ? '#64748b' : '#f59e0b' }}
                    />
                  )}
                  {l.label}
                  {l.live && <span className="rounded bg-zinc-800 px-1 text-[9px] uppercase tracking-wider text-zinc-400">live</span>}
                </span>
                <span className="mt-0.5 block text-[11px] text-zinc-500">
                  {st?.status === 'loading' ? 'Loading…'
                    : st?.status === 'error' ? 'Unavailable'
                    : st?.status === 'ready' ? `${st.pins.length} pins`
                    : l.hint}
                </span>
              </button>
            );
          })}
        </div>

        {/* Honest reporting for live layers */}
        {visible.map(({ layer, state }) => {
          if (!state) return null;
          if (state.status === 'error') {
            return (
              <p key={layer.id} className="mb-2 rounded border border-red-900 bg-red-950/40 px-3 py-2 text-xs text-red-300">
                <strong>{layer.label}</strong> could not be loaded — {state.error}. This is a connection or
                permission problem, not an empty result: no conclusion should be drawn about how many jobs exist.
              </p>
            );
          }
          if (state.status === 'ready' && state.missing > 0) {
            return (
              <p key={layer.id} className="mb-2 rounded border border-amber-900 bg-amber-950/30 px-3 py-2 text-xs text-amber-300">
                <strong>{layer.label}</strong>: {state.pins.length} of {state.total} plotted.{' '}
                {state.missing} record{state.missing === 1 ? '' : 's'} had no coordinates and cannot be shown on a map.
              </p>
            );
          }
          if (state.status === 'ready' && state.total === 0) {
            return (
              <p key={layer.id} className="mb-2 rounded border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs text-zinc-400">
                <strong>{layer.label}</strong>: the source responded and returned nothing. There are genuinely no
                open records right now.
              </p>
            );
          }
          return null;
        })}

        {/* Search */}
        <form onSubmit={search} className="mb-3 flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search an address, city or parcel…"
            aria-label="Search a location"
            className="flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm placeholder:text-zinc-600 focus:border-sky-500 focus:outline-none"
          />
          <button type="submit" disabled={searchStatus === 'searching'}
            className="rounded-md bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50">
            {searchStatus === 'searching' ? 'Searching…' : 'Find'}
          </button>
        </form>
        {searchStatus === 'notfound' && (
          <p className="mb-2 text-xs text-amber-400">No match. Try adding a state or a nearby town.</p>
        )}
        {searchStatus === 'error' && (
          <p className="mb-2 text-xs text-red-400">Lookup service unreachable — the map still pans and zooms.</p>
        )}
        {found && searchStatus === 'idle' && <p className="mb-2 truncate text-xs text-zinc-400">{found.label}</p>}

        {/* Map */}
        <div className="relative overflow-hidden rounded-lg border border-zinc-800" style={{ height: '70vh', minHeight: 480 }}>
          <MapContainer center={[38.5, -92]} zoom={4} minZoom={3} maxZoom={19} scrollWheelZoom
            style={{ height: '100%', width: '100%', background: '#0A0A0A' }}>
            <TileLayer
              attribution="Imagery &copy; Esri, Maxar, Earthstar Geographics"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />

            {visible.map(({ layer, state }) =>
              (state?.pins || []).map((p) => (
                <Marker key={`${layer.id}-${p.id}`} position={[p.lat, p.lng]} icon={layer.icon || ICONS.completed}>
                  <Popup>
                    <strong>{p.title}</strong>
                    {(p.lines || []).filter(Boolean).map((line, i) => <div key={i}>{line}</div>)}
                    {p.href && <a href={p.href} className="text-sky-600 underline">Open page</a>}
                  </Popup>
                </Marker>
              )),
            )}

            {found && (
              <Marker position={[found.lat, found.lng]} icon={ICONS.search}>
                <Popup>{found.label}</Popup>
              </Marker>
            )}

            <FlyTo target={found} />
            <CoordReadout onMove={setCursor} />
          </MapContainer>

          <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded bg-zinc-950/85 px-3 py-1.5 text-[11px] text-zinc-300 backdrop-blur">
            {totalPins} pin{totalPins === 1 ? '' : 's'} shown
          </div>
          {cursor && (
            <div className="pointer-events-none absolute bottom-3 right-3 z-[1000] rounded bg-zinc-950/85 px-3 py-1.5 font-mono text-[11px] text-zinc-300 backdrop-blur">
              {cursor.lat.toFixed(5)}, {cursor.lng.toFixed(5)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
