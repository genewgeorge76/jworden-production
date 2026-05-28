import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { MapPin, Truck, Phone, Star } from 'lucide-react';
import { LOCATIONS } from '@/lib/locations';

// HQ pin — primary amber
const hqIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="42" height="52" viewBox="0 0 42 52">
      <path d="M21 0C9.4 0 0 9.4 0 21c0 15.8 21 31 21 31s21-15.2 21-31C42 9.4 32.6 0 21 0z" fill="#FFBF00" stroke="#0A0A0A" stroke-width="2"/>
      <circle cx="21" cy="21" r="8" fill="#0A0A0A"/>
      <circle cx="21" cy="21" r="3" fill="#FFBF00"/>
    </svg>
  `),
  iconSize: [42, 52],
  iconAnchor: [21, 52],
  popupAnchor: [0, -48],
});

// Primary service area pin
const primaryIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
      <path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 24 16 24s16-12 16-24C32 7.2 24.8 0 16 0z" fill="#FFBF00" stroke="#0A0A0A" stroke-width="1.5"/>
      <circle cx="16" cy="16" r="6" fill="#0A0A0A"/>
    </svg>
  `),
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -36],
});

// Extended region pin — outlined
const extendedIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
      <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z" fill="#0A0A0A" stroke="#FFBF00" stroke-width="2"/>
      <circle cx="14" cy="14" r="4" fill="#FFBF00"/>
    </svg>
  `),
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  popupAnchor: [0, -32],
});

// HQ coordinates (Ware Bottom Spring Rd, Chester VA)
const HQ = { lat: 37.3563, lng: -77.4411 };

// Central Virginia + nearby coverage — filter to VA markets for this primary-zones map
const PRIMARY_ZONES = LOCATIONS.filter((l) => l.stateAbbr === 'VA');

function FitBounds({ zones }) {
  const map = useMap();
  React.useEffect(() => {
    if (zones.length === 0) return;
    const bounds = zones.map((z) => [z.geo.lat, z.geo.lng]);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 9 });
  }, [zones, map]);
  return null;
}

export default function ServiceAreaMap() {
  const [activeZone, setActiveZone] = useState(null);

  const { centralVA, extended } = useMemo(() => {
    const central = PRIMARY_ZONES.filter((l) => l.region === 'Central Virginia');
    const ext = PRIMARY_ZONES.filter((l) => l.region !== 'Central Virginia');
    return { centralVA: central, extended: ext };
  }, []);

  return (
    <section id="service-area" className="border-t border-border py-16 md:py-24 bg-card/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 md:mb-12">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-primary font-display font-black text-lg">//</span>
            <p className="font-display text-primary text-xs tracking-[0.3em] uppercase">
              Service Area Map
            </p>
          </div>
          <h2 className="font-display font-black text-foreground text-4xl md:text-6xl uppercase tracking-tight leading-[0.95] max-w-4xl">
            Where We <span className="text-primary">Come To You</span>
          </h2>
          <p className="font-body text-muted-foreground text-base md:text-lg mt-5 max-w-2xl leading-relaxed">
            Headquartered in Chester, VA — our crews mobilize on-site for paving estimates across Central Virginia and surrounding regions. Click any zone to see local expertise and coverage details.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Map */}
          <div className="relative border border-border bg-card overflow-hidden h-[500px] lg:h-[620px]">
            <MapContainer
              center={[HQ.lat, HQ.lng]}
              zoom={8}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              <FitBounds zones={PRIMARY_ZONES} />

              {/* Coverage radius around HQ — primary zone (~60 miles) */}
              <Circle
                center={[HQ.lat, HQ.lng]}
                radius={96560} // 60 miles in meters
                pathOptions={{
                  color: '#FFBF00',
                  fillColor: '#FFBF00',
                  fillOpacity: 0.08,
                  weight: 1.5,
                  dashArray: '6, 6',
                }}
              />

              {/* HQ marker */}
              <Marker position={[HQ.lat, HQ.lng]} icon={hqIcon}>
                <Popup>
                  <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 200 }}>
                    <p style={{ fontWeight: 900, fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#FFBF00', marginBottom: 4 }}>
                      Headquarters
                    </p>
                    <p style={{ fontWeight: 700, fontSize: 15, color: '#0a0a0a', marginBottom: 6 }}>
                      Chester, VA
                    </p>
                    <p style={{ fontSize: 12, color: '#4a4a4a', marginBottom: 8 }}>
                      1601 Ware Bottom Spring Rd, Suite 214
                    </p>
                    <a href="tel:+18044461296" style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a', textDecoration: 'underline' }}>
                      (804) 446-1296
                    </a>
                  </div>
                </Popup>
              </Marker>

              {/* Primary Central VA zones */}
              {centralVA.filter((l) => !l.isHeadquarters).map((loc) => (
                <Marker
                  key={loc.slug}
                  position={[loc.geo.lat, loc.geo.lng]}
                  icon={primaryIcon}
                  eventHandlers={{ click: () => setActiveZone(loc) }}
                >
                  <Popup>
                    <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 220 }}>
                      <p style={{ fontWeight: 900, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#FFBF00', marginBottom: 4 }}>
                        Primary Zone
                      </p>
                      <p style={{ fontWeight: 700, fontSize: 15, color: '#0a0a0a', marginBottom: 4 }}>
                        {loc.city}, {loc.stateAbbr}
                      </p>
                      <p style={{ fontSize: 11, color: '#4a4a4a', marginBottom: 8 }}>
                        {loc.region} · {loc.reviews} reviews · ★ {loc.rating}
                      </p>
                      <a
                        href={`/locations/${loc.slug}`}
                        style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a', textDecoration: 'underline' }}
                      >
                        View {loc.city} paving →
                      </a>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Extended VA zones */}
              {extended.map((loc) => (
                <Marker
                  key={loc.slug}
                  position={[loc.geo.lat, loc.geo.lng]}
                  icon={extendedIcon}
                  eventHandlers={{ click: () => setActiveZone(loc) }}
                >
                  <Popup>
                    <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 220 }}>
                      <p style={{ fontWeight: 900, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#4a4a4a', marginBottom: 4 }}>
                        Extended Coverage
                      </p>
                      <p style={{ fontWeight: 700, fontSize: 15, color: '#0a0a0a', marginBottom: 4 }}>
                        {loc.city}, {loc.stateAbbr}
                      </p>
                      <p style={{ fontSize: 11, color: '#4a4a4a', marginBottom: 8 }}>
                        {loc.region}
                      </p>
                      <a
                        href={`/locations/${loc.slug}`}
                        style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a', textDecoration: 'underline' }}
                      >
                        View {loc.city} paving →
                      </a>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Legend overlay */}
            <div className="absolute bottom-4 left-4 z-[400] bg-background/95 backdrop-blur-sm border border-border p-3 md:p-4 space-y-2 max-w-[220px]">
              <p className="font-display text-primary text-[10px] tracking-[0.2em] uppercase mb-2">
                Coverage Legend
              </p>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full border border-foreground flex-shrink-0" />
                <p className="font-body text-foreground text-xs">Headquarters · Chester</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0" />
                <p className="font-body text-foreground text-xs">Primary service zone</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-background border-2 border-primary rounded-full flex-shrink-0" />
                <p className="font-body text-foreground text-xs">Extended coverage</p>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-border">
                <div className="w-3 h-3 border border-primary border-dashed rounded-full flex-shrink-0" />
                <p className="font-body text-muted-foreground text-[11px]">60-mile mobile radius</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-border bg-card p-4">
                <p className="font-display text-muted-foreground text-[10px] tracking-[0.2em] uppercase mb-2">
                  Coverage
                </p>
                <p className="font-display font-black text-primary text-3xl">
                  {PRIMARY_ZONES.length}
                </p>
                <p className="font-body text-muted-foreground text-xs mt-1">VA zones</p>
              </div>
              <div className="border border-border bg-card p-4">
                <p className="font-display text-muted-foreground text-[10px] tracking-[0.2em] uppercase mb-2">
                  Mobile Radius
                </p>
                <p className="font-display font-black text-primary text-3xl">60mi</p>
                <p className="font-body text-muted-foreground text-xs mt-1">From HQ</p>
              </div>
            </div>

            {/* Active zone detail or primary list */}
            {activeZone ? (
              <div className="border border-primary/40 bg-primary/5 p-5 flex-1">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-display text-primary text-[10px] tracking-[0.3em] uppercase mb-1">
                      Selected Zone
                    </p>
                    <p className="font-display font-black text-foreground text-xl uppercase tracking-tight">
                      {activeZone.city}, {activeZone.stateAbbr}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveZone(null)}
                    className="text-muted-foreground hover:text-foreground text-xs font-display tracking-wider uppercase"
                  >
                    Clear
                  </button>
                </div>
                <p className="font-body text-muted-foreground text-sm leading-relaxed mb-4">
                  {activeZone.intro}
                </p>
                <div className="flex items-center gap-3 pt-3 border-t border-primary/20 mb-4">
                  <div className="flex items-center gap-1 text-primary">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="font-display font-bold text-xs">{activeZone.rating}</span>
                  </div>
                  <span className="font-body text-muted-foreground text-xs">
                    {activeZone.reviews} reviews
                  </span>
                </div>
                <a
                  href={`/locations/${activeZone.slug}`}
                  className="block w-full text-center bg-primary text-primary-foreground font-display font-bold text-xs tracking-wider uppercase py-3 hover:bg-primary/90 transition-colors"
                >
                  View {activeZone.city} Details →
                </a>
              </div>
            ) : (
              <div className="border border-border bg-card p-5 flex-1">
                <p className="font-display text-primary text-[10px] tracking-[0.3em] uppercase mb-4">
                  Primary Zones
                </p>
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {PRIMARY_ZONES.map((loc) => (
                    <button
                      key={loc.slug}
                      onClick={() => setActiveZone(loc)}
                      className="w-full text-left flex items-center justify-between gap-2 py-2.5 border-b border-border last:border-b-0 hover:text-primary transition-colors group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-display font-bold text-foreground text-sm uppercase tracking-tight group-hover:text-primary transition-colors truncate">
                            {loc.city}{loc.isHeadquarters ? ' · HQ' : ''}
                          </p>
                          <p className="font-body text-muted-foreground text-[11px] truncate">
                            {loc.region}
                          </p>
                        </div>
                      </div>
                      <span className="font-display text-muted-foreground text-[10px] tracking-wider uppercase flex-shrink-0">
                        {loc.stateAbbr}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="w-4 h-4 text-primary" />
                <p className="font-display font-bold text-foreground text-xs tracking-wider uppercase">
                  Outside These Zones?
                </p>
              </div>
              <p className="font-body text-muted-foreground text-xs mb-4 leading-relaxed">
                For commercial contracts and multi-site work, we travel nationwide. Call us to discuss your project.
              </p>
              <a
                href="tel:+18044461296"
                className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground font-display font-bold text-xs tracking-wider uppercase py-3 hover:bg-primary/90 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" /> (804) 446-1296
              </a>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
