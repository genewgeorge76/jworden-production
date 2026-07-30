/**
 * StormTracker.jsx — live radar, satellite and severe-weather command view.
 *
 * Three feeds drive this page:
 *   • RainViewer  — rolling radar + infrared satellite frames, animated as a loop
 *   • NWS         — active watches/warnings/advisories, drawn as real polygons
 *   • OpenWeather — point conditions + 24h trend, scored into a paving verdict
 *
 * Everything degrades honestly: when a feed is down the panel says so rather
 * than showing stale or invented weather. Crews make go/no-go calls off this.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  AlertTriangle,
  CloudRain,
  Gauge,
  Layers,
  Loader2,
  MapPin,
  Pause,
  Play,
  RefreshCw,
  Satellite,
  ShieldAlert,
  Thermometer,
  Wind,
} from 'lucide-react'
import api from '../api/client'

// Richmond, VA — home base. The map opens here and conditions are read here
// until the operator picks another point.
const HOME = { lat: 37.5407, lon: -77.436, label: 'Richmond, VA' }

const ANIMATION_MS = 500 // per-frame dwell time for the radar loop
const REFRESH_MS = 5 * 60 * 1000 // pull new frames/alerts every 5 minutes

const SEVERITY_STYLE = {
  Extreme: { stroke: '#ef4444', fill: '#ef4444', chip: 'bg-red-500/15 text-red-300 border-red-500/30' },
  Severe: { stroke: '#f97316', fill: '#f97316', chip: 'bg-orange-500/15 text-orange-300 border-orange-500/30' },
  Moderate: { stroke: '#eab308', fill: '#eab308', chip: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' },
  Minor: { stroke: '#38bdf8', fill: '#38bdf8', chip: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  Unknown: { stroke: '#94a3b8', fill: '#94a3b8', chip: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
}

const VERDICT_STYLE = {
  go: { ring: 'ring-emerald-500/40', text: 'text-emerald-300', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400' },
  caution: { ring: 'ring-amber-500/40', text: 'text-amber-300', bg: 'bg-amber-500/10', dot: 'bg-amber-400' },
  no_go: { ring: 'ring-red-500/40', text: 'text-red-300', bg: 'bg-red-500/10', dot: 'bg-red-400' },
}

function fmtClock(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  } catch {
    return '—'
  }
}

/** Animated radar/satellite raster overlay driven by the active frame. */
function FrameLayer({ frame, opacity }) {
  if (!frame?.url_template) return null
  return (
    <TileLayer
      key={frame.url_template}
      url={frame.url_template}
      opacity={opacity}
      zIndex={400}
    />
  )
}

/** Lets the operator retarget conditions by clicking the map. */
function ClickHandler({ onPick }) {
  const map = useMap()
  useEffect(() => {
    const handler = (e) => onPick({ lat: e.latlng.lat, lon: e.latlng.lng, label: 'Selected point' })
    map.on('click', handler)
    return () => map.off('click', handler)
  }, [map, onPick])
  return null
}

const pinIcon = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;border-radius:9999px;background:#f97316;box-shadow:0 0 0 4px rgba(249,115,22,.28),0 0 12px rgba(249,115,22,.9)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

export default function StormTracker() {
  const [frames, setFrames] = useState(null)
  const [alerts, setAlerts] = useState(null)
  const [conditions, setConditions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const [layer, setLayer] = useState('radar') // 'radar' | 'satellite'
  const [playing, setPlaying] = useState(true)
  const [idx, setIdx] = useState(0)
  const [opacity, setOpacity] = useState(0.75)
  const [point, setPoint] = useState(HOME)
  const [openAlert, setOpenAlert] = useState(null)

  const timerRef = useRef(null)

  // Radar animates observed frames then the nowcast, so the loop runs
  // "what happened" straight into "what's about to happen".
  const activeFrames = useMemo(() => {
    if (!frames || frames.status !== 'ok') return []
    return layer === 'satellite'
      ? frames.satellite || []
      : [...(frames.past || []), ...(frames.nowcast || [])]
  }, [frames, layer])

  const pastCount = frames?.past?.length || 0
  const isNowcast = layer === 'radar' && idx >= pastCount
  const currentFrame = activeFrames[Math.min(idx, Math.max(activeFrames.length - 1, 0))]

  const loadFeeds = useCallback(async (pt, { silent } = {}) => {
    silent ? setRefreshing(true) : setLoading(true)
    setError('')
    const [f, a, c] = await Promise.allSettled([
      api.getRadarFrames(),
      api.getWeatherAlerts({ lat: pt.lat, lon: pt.lon }),
      api.getWeatherConditions(pt.lat, pt.lon),
    ])
    if (f.status === 'fulfilled') setFrames(f.value)
    else setError('Radar feed unreachable.')
    if (a.status === 'fulfilled') setAlerts(a.value)
    if (c.status === 'fulfilled') setConditions(c.value)
    silent ? setRefreshing(false) : setLoading(false)
  }, [])

  useEffect(() => {
    loadFeeds(point)
  }, [loadFeeds, point])

  // Periodic refresh keeps the loop live without the operator touching anything.
  useEffect(() => {
    const id = setInterval(() => loadFeeds(point, { silent: true }), REFRESH_MS)
    return () => clearInterval(id)
  }, [loadFeeds, point])

  // Reset to the newest observed frame whenever the frame set changes.
  useEffect(() => {
    setIdx(Math.max(0, (frames?.past?.length || 1) - 1))
  }, [frames, layer])

  useEffect(() => {
    if (!playing || activeFrames.length < 2) return
    timerRef.current = setInterval(() => {
      setIdx((i) => (i + 1) % activeFrames.length)
    }, ANIMATION_MS)
    return () => clearInterval(timerRef.current)
  }, [playing, activeFrames.length])

  const verdict = conditions?.verdict
  const vStyle = VERDICT_STYLE[verdict?.state] || VERDICT_STYLE.caution
  const cur = conditions?.current

  const alertList = alerts?.status === 'ok' ? alerts.alerts || [] : []
  const alertGeo = useMemo(
    () => alertList.filter((a) => a.geometry).map((a) => ({ ...a, _key: a.id })),
    [alertList],
  )

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
        <div className="mx-auto max-w-[1600px] px-6 py-5 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-orange-500/15 ring-1 ring-orange-500/30">
              <CloudRain className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Storm Tracker</h1>
              <p className="text-xs text-slate-400">
                Live radar · satellite · NWS alerts — {point.label}
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {refreshing && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            <button
              onClick={() => loadFeeds(point, { silent: true })}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10 transition"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-6 py-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* ── Map ─────────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
            <div className="h-[560px] w-full bg-slate-900">
              <MapContainer
                center={[HOME.lat, HOME.lon]}
                zoom={8}
                scrollWheelZoom
                style={{ height: '100%', width: '100%', background: '#0f172a' }}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap &copy; CARTO'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <FrameLayer frame={currentFrame} opacity={opacity} />

                {alertGeo.map((a) => {
                  const s = SEVERITY_STYLE[a.severity] || SEVERITY_STYLE.Unknown
                  return (
                    <GeoJSON
                      key={a._key}
                      data={a.geometry}
                      style={{ color: s.stroke, weight: 2, fillColor: s.fill, fillOpacity: 0.12 }}
                      eventHandlers={{ click: () => setOpenAlert(a) }}
                    />
                  )
                })}

                <Marker position={[point.lat, point.lon]} icon={pinIcon} />
                <ClickHandler onPick={setPoint} />
              </MapContainer>
            </div>

            {/* Layer switch */}
            <div className="absolute left-4 top-4 z-[1000] flex gap-1 rounded-xl border border-white/10 bg-slate-950/85 p-1 backdrop-blur">
              {[
                { id: 'radar', label: 'Radar', Icon: CloudRain },
                { id: 'satellite', label: 'Satellite', Icon: Satellite },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setLayer(id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    layer === id ? 'bg-orange-500 text-slate-950' : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>

            {/* Nowcast badge */}
            {isNowcast && (
              <div className="absolute right-4 top-4 z-[1000] rounded-lg border border-sky-400/30 bg-sky-500/15 px-3 py-1.5 text-xs font-medium text-sky-200 backdrop-blur">
                Forecast — projected, not observed
              </div>
            )}

            {/* Transport controls */}
            <div className="absolute inset-x-4 bottom-4 z-[1000] rounded-xl border border-white/10 bg-slate-950/85 px-4 py-3 backdrop-blur">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPlaying((p) => !p)}
                  disabled={activeFrames.length < 2}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-orange-500 text-slate-950 hover:bg-orange-400 disabled:opacity-40 transition"
                  aria-label={playing ? 'Pause' : 'Play'}
                >
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>

                <input
                  type="range"
                  min={0}
                  max={Math.max(activeFrames.length - 1, 0)}
                  value={Math.min(idx, Math.max(activeFrames.length - 1, 0))}
                  onChange={(e) => {
                    setPlaying(false)
                    setIdx(Number(e.target.value))
                  }}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-orange-500"
                />

                <div className="w-20 shrink-0 text-right font-mono text-sm tabular-nums text-slate-200">
                  {fmtClock(currentFrame?.iso)}
                </div>
              </div>

              <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <Layers className="h-3 w-3" /> Opacity
                </span>
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={opacity * 100}
                  onChange={(e) => setOpacity(Number(e.target.value) / 100)}
                  className="h-1 w-28 cursor-pointer appearance-none rounded-full bg-white/15 accent-slate-400"
                />
                <span className="ml-auto">
                  {activeFrames.length} frames · {frames?.attribution || '—'}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Click anywhere on the map to read conditions and alerts for that point.
          </p>
        </div>

        {/* ── Right rail ──────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Paving verdict */}
          <div className={`rounded-2xl border border-white/10 p-5 ring-1 ${vStyle.ring} ${vStyle.bg}`}>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400">
              <Gauge className="h-3.5 w-3.5" /> Paving verdict
            </div>

            {loading ? (
              <div className="mt-3 flex items-center gap-2 text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Reading conditions…
              </div>
            ) : conditions?.status === 'ok' && verdict ? (
              <>
                <div className="mt-2 flex items-center gap-2.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${vStyle.dot}`} />
                  <span className={`text-2xl font-semibold tracking-tight ${vStyle.text}`}>
                    {verdict.label}
                  </span>
                </div>

                {verdict.blockers?.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {verdict.blockers.map((b, i) => (
                      <li key={i} className="flex gap-2 text-sm text-red-200">
                        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> {b}
                      </li>
                    ))}
                  </ul>
                )}
                {verdict.cautions?.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {verdict.cautions.map((c, i) => (
                      <li key={i} className="flex gap-2 text-sm text-amber-200">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {c}
                      </li>
                    ))}
                  </ul>
                )}
                {!verdict.blockers?.length && !verdict.cautions?.length && (
                  <p className="mt-2 text-sm text-emerald-200/80">
                    Clear against the Worden Standard — temperature, wind and precipitation all within spec.
                  </p>
                )}
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-400">
                {conditions?.status === 'not_configured'
                  ? 'Conditions feed not configured.'
                  : 'Conditions feed unavailable — radar and alerts still live.'}
              </p>
            )}
          </div>

          {/* Current conditions */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400">
              <MapPin className="h-3.5 w-3.5" /> {conditions?.location?.name || point.label}
            </div>
            {cur ? (
              <>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl font-semibold tracking-tight">
                    {Math.round(cur.temp_f)}°
                  </span>
                  <span className="text-sm capitalize text-slate-400">{cur.description}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  {[
                    { Icon: Thermometer, label: 'Feels like', val: cur.feels_like_f != null ? `${Math.round(cur.feels_like_f)}°F` : '—' },
                    { Icon: Wind, label: 'Wind', val: cur.wind_mph != null ? `${Math.round(cur.wind_mph)} mph` : '—' },
                    { Icon: CloudRain, label: 'Humidity', val: cur.humidity != null ? `${cur.humidity}%` : '—' },
                    { Icon: Layers, label: 'Cloud', val: cur.clouds != null ? `${cur.clouds}%` : '—' },
                  ].map(({ Icon, label, val }) => (
                    <div key={label} className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Icon className="h-3 w-3" /> {label}
                      </div>
                      <div className="mt-0.5 font-medium tabular-nums">{val}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-slate-500">
                  Observed {fmtClock(cur.observed)} · {conditions.attribution}
                </p>
              </>
            ) : (
              !loading && <p className="mt-2 text-sm text-slate-400">No conditions for this point.</p>
            )}
          </div>

          {/* Active alerts */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400">
                <AlertTriangle className="h-3.5 w-3.5" /> Active alerts
              </div>
              {alerts?.status === 'ok' && (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] tabular-nums text-slate-300">
                  {alerts.count}
                </span>
              )}
            </div>

            <div className="mt-3 space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {alerts?.status !== 'ok' ? (
                <p className="text-sm text-slate-400">Alert feed unavailable.</p>
              ) : alertList.length === 0 ? (
                <p className="text-sm text-emerald-300/80">No active warnings for this area.</p>
              ) : (
                alertList.map((a) => {
                  const s = SEVERITY_STYLE[a.severity] || SEVERITY_STYLE.Unknown
                  return (
                    <button
                      key={a.id}
                      onClick={() => setOpenAlert(a)}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition hover:brightness-125 ${s.chip}`}
                    >
                      <div className="text-sm font-medium">{a.event}</div>
                      <div className="mt-0.5 line-clamp-2 text-[11px] opacity-80">{a.areaDesc}</div>
                      <div className="mt-1 text-[11px] opacity-70">
                        Until {fmtClock(a.expires)}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
            {alerts?.attribution && (
              <p className="mt-3 text-[11px] text-slate-500">{alerts.attribution}</p>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Alert detail */}
      {openAlert && (
        <div
          className="fixed inset-0 z-[2000] grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onClick={() => setOpenAlert(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">{openAlert.event}</h3>
                <p className="mt-0.5 text-sm text-slate-400">{openAlert.areaDesc}</p>
              </div>
              <button
                onClick={() => setOpenAlert(null)}
                className="rounded-lg border border-white/10 px-3 py-1 text-sm text-slate-300 hover:bg-white/10"
              >
                Close
              </button>
            </div>

            {openAlert.headline && (
              <p className="mt-4 text-sm font-medium text-orange-300">{openAlert.headline}</p>
            )}
            {openAlert.description && (
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-300">
                {openAlert.description}
              </p>
            )}
            {openAlert.instruction && (
              <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <div className="text-xs uppercase tracking-wider text-amber-300">Instruction</div>
                <p className="mt-1 whitespace-pre-line text-sm text-amber-100">{openAlert.instruction}</p>
              </div>
            )}
            <p className="mt-4 text-[11px] text-slate-500">
              {openAlert.senderName} · expires {fmtClock(openAlert.expires)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
