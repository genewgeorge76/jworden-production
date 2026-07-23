import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

export default function DiamondMap({ jobs = [], onJobClick = null }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);

  // Initialize Map
  useEffect(() => {
    if (map.current) return; // initialize map only once

    // Default center roughly eastern US (WV/VA area where Diamond operates)
    const defaultLng = -80.7061;
    const defaultLat = 38.3502;

    if (!mapboxgl.accessToken) {
      console.error("Mapbox token missing - cannot load map.");
      if (mapContainer.current) {
        mapContainer.current.innerHTML = "<div style='padding:20px; color:red;'>Mapbox token missing</div>";
      }
      return;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12', // Premium look
      center: [defaultLng, defaultLat],
      zoom: 6,
      pitch: 45,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
  }, []);

  // Update Markers when jobs change
  useEffect(() => {
    if (!map.current) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (jobs.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    let hasCoords = false;

    jobs.forEach(job => {
      const lat = job.latitude;
      const lng = job.longitude;
      
      // We need valid coordinates
      if (lng && lat && !isNaN(lng) && !isNaN(lat)) {
        bounds.extend([lng, lat]);
        hasCoords = true;

        // Custom diamond pin
        const el = document.createElement('div');
        el.className = 'diamond-marker group';
        el.style.cursor = 'pointer';
        
        // Use a diamond shape for the marker icon
        el.innerHTML = `
          <div class="relative w-8 h-8 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-200 z-10 hover:z-50">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#06b6d4" width="32px" height="32px" style="filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.7))">
              <path d="M12 2L22 12L12 22L2 12L12 2Z" stroke="#fff" stroke-width="2"/>
            </svg>
          </div>
        `;

        // Popup Content
        const priceStr = job.price ? `$${Number(job.price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'TBD';
        
        const popupContent = `
          <div style="font-family: inherit; background: #0f172a; color: #f8fafc; border-radius: 8px; padding: 12px; max-width: 250px; box-shadow: 0 10px 25px rgba(0,0,0,0.8); font-size: 12px; border: 1px solid rgba(6, 182, 212, 0.4)">
            <h4 style="margin: 0 0 4px 0; color: #22d3ee; font-weight: 800; font-size: 13px; text-transform: uppercase;">${job.job_number || 'JOB'}</h4>
            <div style="font-weight: 700; margin-bottom: 6px; font-size: 14px; color: #fff; line-height: 1.2;">${job.title || job.name}</div>
            <div style="color: #94a3b8; margin-bottom: 6px; display: flex; align-items: flex-start; gap: 4px;">
              <span style="flex-shrink: 0; color: #cbd5e1;">📍</span>
              <span>${job.site_address || job.address || 'No address'}</span>
            </div>
            <div style="color: #cbd5e1; margin-bottom: 4px; font-weight: 600;">${job.service_type || 'General Service'}</div>
            <div style="color: #4ade80; font-weight: bold; margin-bottom: 0;">💵 ${priceStr}</div>
          </div>
        `;

        const popup = new mapboxgl.Popup({ offset: 15, closeButton: false }).setHTML(popupContent);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map.current);

        // Click handler to select job in the main dashboard view
        el.addEventListener('click', (e) => {
          e.stopPropagation(); // prevent map click
          if (onJobClick) {
            onJobClick(job);
          }
        });

        markersRef.current.push(marker);
      }
    });

    // Fit map view bounds
    if (hasCoords) {
      map.current.fitBounds(bounds, {
        padding: 80,
        maxZoom: 15,
        duration: 1200
      });
    }
  }, [jobs, onJobClick]);

  return (
    <div className="w-full h-[400px] sm:h-[500px] lg:h-[600px] rounded-2xl overflow-hidden border border-slate-700 shadow-2xl relative bg-slate-900 mt-8 mb-8">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur border border-slate-700 p-3 rounded-lg shadow-lg z-10 pointer-events-none">
        <h3 className="text-white font-bold text-sm">Contracted Jobs Map</h3>
        <p className="text-slate-400 text-xs">{jobs.length} Active {jobs.length === 1 ? 'Project' : 'Projects'}</p>
      </div>
    </div>
  );
}
