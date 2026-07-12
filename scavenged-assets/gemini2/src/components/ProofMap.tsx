import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import type { Map as LeafletMap } from 'leaflet';
import verifiedPins from '@/data/verified-pins.json';

type Pin = {
  id: number;
  lat: number;
  lng: number;
  title: string;
  type: string;
  date: string;
  description: string;
};

const TYPE_COLORS: Record<string, string> = {
  Headquarters: '#ffcc00',
  Commercial: '#22c55e',
  Government: '#3b82f6',
  Residential: '#f97316',
};

export default function ProofMap() {
  const mapRef = useRef<LeafletMap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    (async () => {
      const L = (await import('leaflet')).default;

      // Override default icon URLs so bundlers (Vite/Rollup) resolve them correctly.
      // Leaflet's default icon uses _getIconUrl internally; mergeOptions replaces the
      // resolved paths without needing to patch the prototype.
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(containerRef.current!).setView([39.5, -98.35], 4);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      (verifiedPins as Pin[]).forEach((pin) => {
        const color = TYPE_COLORS[pin.type] ?? '#ffffff';
        const svgIcon = L.divIcon({
          className: '',
          html: `<div style="
            width:14px;height:14px;border-radius:50%;
            background:${color};border:3px solid #111;
            box-shadow:0 0 8px ${color}88;
          "></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
          popupAnchor: [0, -10],
        });

        const formattedDate = new Date(pin.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        L.marker([pin.lat, pin.lng], { icon: svgIcon })
          .addTo(map)
          .bindPopup(
            `<div style="font-family:Arial Black,Arial,sans-serif;min-width:220px;max-width:280px;">
              <div style="background:#ffcc00;color:#111;padding:6px 10px;font-weight:900;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;margin:-10px -10px 8px;">
                ${pin.title}
              </div>
              <div style="margin-bottom:4px;">
                <span style="background:${color};color:#111;font-weight:900;font-size:10px;text-transform:uppercase;padding:2px 6px;border-radius:2px;">
                  ${pin.type}
                </span>
              </div>
              <div style="color:#555;font-size:11px;margin-bottom:6px;">${formattedDate}</div>
              <div style="color:#222;font-size:12px;line-height:1.5;">${pin.description}</div>
            </div>`,
            { maxWidth: 300 }
          );
      });
    })();

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <section className="py-24 px-6 bg-black">
      <div className="max-w-7xl mx-auto">
        <span className="bg-[#ffcc00] text-black px-6 py-1.5 font-black uppercase text-xs tracking-[0.4em] mb-8 inline-block">
          Verified Nationwide Footprint
        </span>
        <h2 className="text-5xl font-black uppercase text-white mb-4">
          Proof of <span className="text-[#ffcc00]">Performance</span>
        </h2>
        <p className="text-gray-200 font-bold mb-8 max-w-2xl">
          Every pin is a completed project — from Richmond, VA to Los Angeles, CA. Click any marker to see the project details.
        </p>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6">
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full border-2 border-[#111]"
                style={{ background: color, boxShadow: `0 0 6px ${color}88` }}
              />
              <span className="text-xs font-black uppercase tracking-widest text-gray-200">{type}</span>
            </div>
          ))}
        </div>

        <div
          ref={containerRef}
          className="w-full rounded-sm border-2 border-[#ffcc00]/30"
          style={{ height: '500px' }}
        />
      </div>
    </section>
  );
}
