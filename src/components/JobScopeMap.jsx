import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { Save } from 'lucide-react';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

export default function JobScopeMap({ job, onSave }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const draw = useRef(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    
    // Default to a central location if job has no geo, e.g. Richmond, VA
    const defaultLng = job?.geo_lng || -77.4360;
    const defaultLat = job?.geo_lat || 37.5407;
    const defaultZoom = job?.geo_lat ? 18 : 10;

    if (!mapboxgl.accessToken) {
      console.error("Mapbox token missing - cannot load map.");
      if (mapContainer.current) {
        mapContainer.current.innerHTML = "<div style='padding:20px; color:red;'>Mapbox token missing</div>";
      }
      return;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [defaultLng, defaultLat],
      zoom: defaultZoom
    });

    // Add navigation control
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Initialize MapboxDraw
    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        line_string: true,
        point: true,
        trash: true
      },
      defaultMode: 'draw_polygon'
    });

    map.current.addControl(draw.current, 'top-left');

    map.current.on('load', () => {
      // If job has existing scope_geojson, add it to the draw control
      if (job?.scope_geojson) {
        draw.current.add(job.scope_geojson);
      }
      
      // If we don't have job geo but have an address, we could geocode here. 
      // For now we rely on the backend or manual positioning.
    });

  }, [job]);

  const handleSave = async () => {
    if (!draw.current) return;
    
    setSaving(true);
    try {
      const data = draw.current.getAll();
      const center = map.current.getCenter();
      
      const updatedData = {
          geo_lat: center.lat,
          geo_lng: center.lng,
          scope_geojson: data
      };
      
      if (job?.id) {
          // Hit the raw endpoint using fetch
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/jobs/${job.id}/scope`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('OWNER_TOKEN') || ''}`
            },
            body: JSON.stringify(updatedData)
          });
          
          if (!res.ok) throw new Error('Failed to save scope');
          const updatedJob = await res.json();
          if (onSave) onSave(updatedJob);
      } else {
          // If no job ID, just bubble up the data (used by Scanner)
          if (onSave) onSave(updatedData);
      }
      
    } catch (err) {
      console.error(err);
      alert('Failed to save map scope.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative w-full h-[500px] border border-border rounded-xl overflow-hidden shadow-sm">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Save Overlay */}
      <div className="absolute bottom-6 right-6 z-10 bg-card/90 backdrop-blur-md p-4 rounded-xl border border-border shadow-2xl flex flex-col items-end gap-3 max-w-sm">
        <p className="text-xs text-muted-foreground font-display uppercase tracking-widest text-right">
          Interactive Scope
        </p>
        <p className="text-sm font-bold leading-tight text-right text-foreground">
          Draw boundaries for paving, milling, and striping.
        </p>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-6 py-3 rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Scope'}
        </button>
      </div>
    </div>
  );
}
