import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';
import { JOB_LOCATIONS } from '@/lib/job-locations';

// Custom gold pin icon — pure SVG
const goldPinIcon = L.divIcon({
  className: 'custom-gold-pin',
  html: `
    <div style="
      width: 14px;
      height: 14px;
      background: #C5A059;
      border: 2px solid #fff;
      border-radius: 50%;
      box-shadow: 0 0 15px rgba(197, 160, 89, 0.8);
    "></div>
  `,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export default function NationalFootprintMap() {
  const [selected, setSelected] = useState(null);

  return (
    <section id="footprint" className="py-24 bg-[#0A0A0A] border-t border-zinc-900">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <p className="font-display text-primary text-sm tracking-[0.4em] uppercase mb-4">
            // LOGISTICS FOOTPRINT
          </p>
          <h2 className="font-display font-black text-foreground text-5xl md:text-7xl uppercase tracking-tight leading-[0.9] max-w-4xl">
            REGIONAL AUTHORITY.<br />
            <span className="text-primary">NATIONAL CAPABILITIES.</span>
          </h2>
          <p className="font-body text-zinc-500 text-lg mt-8 max-w-2xl leading-relaxed">
            Strategic asset management for national portfolios. While rooted in the Mid-Atlantic, our specialized heavy-duty crews deploy across logistics corridors to maintain critical industrial infrastructure.
          </p>
        </motion.div>

        {/* Map */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="border border-zinc-800 bg-zinc-900/20 overflow-hidden relative"
          style={{ height: 600 }}
        >
          <MapContainer
            center={[38.5, -78]}
            zoom={6}
            minZoom={4}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%', background: '#0A0A0A' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
            />
            {JOB_LOCATIONS.map((loc) => (
              <Marker
                key={loc.id}
                position={[loc.lat, loc.lng]}
                icon={goldPinIcon}
              >
              </Marker>
            ))}
          </MapContainer>
          
          {/* Legend/Overlay */}
          <div className="absolute top-8 left-8 z-[1000] bg-zinc-900/90 border border-zinc-800 p-6 backdrop-blur-md">
            <h4 className="font-display text-white text-xl mb-4 tracking-wide uppercase">Operational Hubs</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-primary rounded-full shadow-[0_0_8px_#C5A059]"></div>
                <span className="text-zinc-400 text-xs uppercase tracking-widest font-display">Active Industrial Project</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-px bg-zinc-700"></div>
                <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-display">National Logistics Route</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
        </section>
  );
}