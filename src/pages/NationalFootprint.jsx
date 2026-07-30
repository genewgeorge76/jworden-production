/**
 * NationalFootprint — every documented job site, pinned on a Google map.
 *
 * The data behind this is unusually strong for a contractor site: each pin is a
 * cluster of photographs that carried GPS coordinates and capture timestamps in
 * their EXIF, reverse-geocoded to a real street address. Nothing here is a
 * marketing claim — a pin exists because photographs were taken at those
 * coordinates on those dates.
 *
 * That distinction is the whole point. A franchise buyer evaluating a multi-site
 * contractor can check any pin against the address and the dates. Invented
 * coverage claims cannot survive that, which is exactly why they are worth
 * nothing and this is worth a great deal.
 *
 * Sites are loaded from src/data/jobSites.json, produced by the Dropbox EXIF
 * harvest. If that file is absent or empty the page says so plainly rather than
 * drawing an empty map that looks broken.
 */

import { useMemo, useState } from 'react'
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps'
import { CalendarDays, Camera, MapPin } from 'lucide-react'
import sitesData from '@/data/jobSites.json'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

// Centred on the continental US so a national footprint reads as national.
const US_CENTER = { lat: 39.5, lng: -98.35 }

function fmtDate(raw) {
  if (!raw) return null
  // EXIF dates arrive as "2019:07:14 10:32:08".
  const m = /^(\d{4}):(\d{2}):(\d{2})/.exec(raw)
  if (!m) return raw
  return new Date(`${m[1]}-${m[2]}-${m[3]}`).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
}

export default function NationalFootprint() {
  const [active, setActive] = useState(null)

  const sites = useMemo(() => {
    const list = Array.isArray(sitesData?.sites) ? sitesData.sites : []
    return list.filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lon))
  }, [])

  const stats = useMemo(() => {
    const states = [...new Set(sites.map((s) => s.state).filter(Boolean))].sort()
    const photos = sites.reduce((n, s) => n + (s.photo_count || 0), 0)
    return { states, photos, count: sites.length }
  }, [sites])

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <p className="font-display text-primary text-xs uppercase tracking-[0.3em]">
            Documented Coverage
          </p>
          <h1 className="font-display mt-2 text-3xl font-black uppercase tracking-tight text-foreground">
            National Footprint
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Every pin is a job site where we have dated, GPS-tagged photographs on file.
            Locations come from the photographs themselves, not from a coverage map — each
            one can be checked against its address and the dates the work was done.
          </p>

          {sites.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-8">
              <div>
                <div className="font-display text-2xl font-black text-primary">{stats.count}</div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  documented sites
                </div>
              </div>
              <div>
                <div className="font-display text-2xl font-black text-primary">
                  {stats.states.length}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  states
                </div>
              </div>
              <div>
                <div className="font-display text-2xl font-black text-primary">
                  {stats.photos.toLocaleString()}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  geotagged photographs
                </div>
              </div>
            </div>
          )}

          {stats.states.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {stats.states.map((st) => (
                <span
                  key={st}
                  className="rounded border border-primary/30 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary"
                >
                  {st}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Three distinct states, each said plainly rather than shown as a blank map. */}
        {!API_KEY ? (
          <div className="border border-dashed border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">
              Map unavailable — <code>VITE_GOOGLE_MAPS_API_KEY</code> is not configured for this
              build. The site data below is unaffected.
            </p>
          </div>
        ) : sites.length === 0 ? (
          <div className="border border-dashed border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No documented sites yet. This map is built from GPS data in job photographs — once
              those are imported, every site appears here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden border border-border" style={{ height: 560 }}>
            <APIProvider apiKey={API_KEY}>
              <Map
                defaultCenter={US_CENTER}
                defaultZoom={4}
                mapId="worden-footprint"
                gestureHandling="greedy"
                disableDefaultUI={false}
                style={{ width: '100%', height: '100%' }}
              >
                {sites.map((s, i) => (
                  <AdvancedMarker
                    key={`${s.lat},${s.lon},${i}`}
                    position={{ lat: s.lat, lng: s.lon }}
                    onClick={() => setActive(s)}
                  >
                    {/* Pin scales with how much work is documented there. */}
                    <div
                      style={{
                        width: Math.min(34, 12 + (s.photo_count || 1)),
                        height: Math.min(34, 12 + (s.photo_count || 1)),
                        borderRadius: '9999px',
                        background: '#f97316',
                        border: '2px solid #fff',
                        boxShadow: '0 0 0 2px rgba(249,115,22,.35)',
                      }}
                    />
                  </AdvancedMarker>
                ))}

                {active && (
                  <InfoWindow
                    position={{ lat: active.lat, lng: active.lon }}
                    onCloseClick={() => setActive(null)}
                  >
                    <div style={{ maxWidth: 260, color: '#0f172a' }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>
                        {active.city ? `${active.city}, ${active.state}` : 'Job site'}
                      </div>
                      {active.address && (
                        <div style={{ marginTop: 4, fontSize: 12, color: '#475569' }}>
                          {active.address}
                        </div>
                      )}
                      <div style={{ marginTop: 8, fontSize: 12, color: '#475569' }}>
                        {active.photo_count} photographs on file
                      </div>
                      {active.first_seen && (
                        <div style={{ marginTop: 2, fontSize: 12, color: '#475569' }}>
                          {fmtDate(active.first_seen)}
                          {active.last_seen && active.last_seen !== active.first_seen
                            ? ` – ${fmtDate(active.last_seen)}`
                            : ''}
                        </div>
                      )}
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </APIProvider>
          </div>
        )}

        {/* Text list — indexable, and works without the map script. */}
        {sites.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
              Documented Sites
            </h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {sites.map((s, i) => (
                <div key={`${s.lat}-${i}`} className="border border-border bg-card p-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {s.city ? `${s.city}, ${s.state}` : `${s.lat}, ${s.lon}`}
                      </div>
                      {s.address && (
                        <div className="mt-0.5 text-xs text-muted-foreground">{s.address}</div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 border-t border-border pt-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Camera className="h-3 w-3" /> {s.photo_count} photos
                    </span>
                    {s.first_seen && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" /> {fmtDate(s.first_seen)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
