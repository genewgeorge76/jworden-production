/**
 * DocumentedWorkMap — every documented job site, pinned, with its evidence grade.
 *
 * The map answers the owner's question "where's the map with the pins of each
 * job?" without repeating the fabricated-database mistake in colour: every pin
 * is drawn from a data module that carries provenance, and 'listed'-grade
 * roster stores are NOT drawn — a roster entry is a place to look, not a job
 * done (kbpStoreMap.js doctrine).
 *
 * Pin sources:
 *   - KBP/KFC programme stores (kbpStoreMap.js grades) joined to Census-geocoded
 *     coordinates (kbpStoreCounties.json). Only paid / invoiced / completed.
 *   - Named commercial jobs from documentedJobSites.js (exact or city-level,
 *     stated in the popup).
 *
 * No customer PII: residential jobs are not on this map at all.
 */
import React, { useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { KBP_STORES, SHOWABLE_AS_WORK } from '@/data/kbpStoreMap'
import storeCounties from '@/data/kbpStoreCounties.json'
import { DOCUMENTED_JOB_SITES } from '@/data/documentedJobSites'
import { RESIDENTIAL_FOOTPRINT } from '@/data/residentialJobFootprint'

const GRADE_STYLE = {
  paid: { color: '#facc15', label: 'Invoiced & paid (client tracker)' },
  invoiced: { color: '#e2e8f0', label: 'Invoiced (client tracker)' },
  completed: { color: '#60a5fa', label: 'Completed job in our Kickserv record' },
  named: { color: '#fb7185', label: 'Named commercial client (documented)' },
  city: { color: '#94a3b8', label: 'Completed jobs by city (our records; count in circle)' },
}

function joinKbpPins() {
  const byAddress = new Map(
    (storeCounties.stores || [])
      .filter((s) => typeof s.lat === 'number' && typeof s.lng === 'number')
      .map((s) => [s.address_queried, s]),
  )
  const pins = []
  for (const s of KBP_STORES) {
    if (!SHOWABLE_AS_WORK.has(s.grade)) continue
    const geo = byAddress.get(`${s.address}, ${s.city}, ${s.state}`)
    if (!geo) continue
    pins.push({
      id: `kbp-${s.store}`,
      lat: geo.lat,
      lng: geo.lng,
      grade: s.grade,
      title: `KFC — ${s.city}, ${s.state}`,
      sub: `Store ${s.store}`,
      note: GRADE_STYLE[s.grade].label,
    })
  }
  return pins
}

export default function DocumentedWorkMap() {
  const kbpPins = useMemo(joinKbpPins, [])
  const namedPins = DOCUMENTED_JOB_SITES.map((j) => ({
    id: j.id,
    lat: j.lat,
    lng: j.lng,
    grade: 'named',
    title: `${j.client} — ${j.city}, ${j.state}`,
    sub: j.label,
    note:
      j.precision === 'city'
        ? `${j.evidence}. Pin shown at city level.`
        : j.evidence,
  }))
  // Residential and small-commercial footprint: city-level counts only.
  // Individual homes are never mapped — the count IS the disclosure.
  const cityPins = RESIDENTIAL_FOOTPRINT.map((c) => ({
    id: `city-${c.city}-${c.state}`,
    lat: c.lat,
    lng: c.lng,
    grade: 'city',
    jobs: c.jobs,
    title: `${c.city}, ${c.state}`,
    sub: `${c.jobs} completed job${c.jobs === 1 ? '' : 's'} in our records`,
    note: 'City-level count from our own completed-job records. No addresses shown.',
  }))
  const pins = [...cityPins, ...kbpPins, ...namedPins]
  const counts = pins.reduce((t, p) => ((t[p.grade] = (t[p.grade] || 0) + 1), t), {})
  const cityJobsTotal = cityPins.reduce((t, p) => t + p.jobs, 0)

  return (
    <section className="bg-slate-950 border-b border-slate-800/80 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-semibold tracking-widest uppercase">
            The map is the record, drawn
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-50">
            {kbpPins.length + namedPins.length} documented sites. {cityJobsTotal} completed
            jobs across {cityPins.length} cities.
          </h2>
          <p className="mt-4 text-slate-400 leading-relaxed">
            Every mark comes from a document — the client&apos;s own invoice trackers, our
            completed-job records, jobsite photo emails, or a purchase order acknowledged
            in writing. Roster assignments that never became work are not drawn.
            Residential work appears as city-level counts only; customers&apos; homes are
            never mapped.
          </p>
        </div>

        <div className="rounded-2xl overflow-hidden border border-slate-800/80" style={{ height: 480 }}>
          <MapContainer
            center={[36.6, -81.5]}
            zoom={5}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%', background: '#0f172a' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {pins.map((p) => (
              <CircleMarker
                key={p.id}
                center={[p.lat, p.lng]}
                radius={
                  p.grade === 'city'
                    ? Math.min(4 + Math.sqrt(p.jobs) * 2, 18)
                    : p.grade === 'named'
                      ? 9
                      : 6
                }
                pathOptions={{
                  color: '#0f172a',
                  weight: 1.5,
                  fillColor: GRADE_STYLE[p.grade].color,
                  fillOpacity: p.grade === 'city' ? 0.55 : 0.9,
                }}
              >
                <Popup>
                  <div style={{ minWidth: 180 }}>
                    <strong>{p.title}</strong>
                    <div style={{ fontSize: 12, marginTop: 2 }}>{p.sub}</div>
                    <div style={{ fontSize: 11, marginTop: 4, opacity: 0.75 }}>{p.note}</div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
          {Object.entries(GRADE_STYLE).map(([grade, s]) =>
            counts[grade] ? (
              <span key={grade} className="inline-flex items-center gap-2 text-sm text-slate-400">
                <span
                  className="inline-block w-3 h-3 rounded-full border border-slate-900"
                  style={{ background: s.color }}
                />
                {counts[grade]} · {s.label}
              </span>
            ) : null,
          )}
        </div>
      </div>
    </section>
  )
}
