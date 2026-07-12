import { useState, useEffect, useRef, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import type { LatLng } from '@/lib/estimator-engine';

/**
 * MapEstimator — Leaflet-based polygon drawing tool for the Interactive 3D Estimator.
 * Uses the existing Leaflet dependency (no new packages).
 * Lets users draw a polygon on satellite imagery to define their project area.
 */

interface MapEstimatorProps {
  onPolygonChange: (coords: LatLng[]) => void;
  onClear: () => void;
  center?: LatLng;
  zoom?: number;
}

export default function MapEstimator({
  onPolygonChange,
  onClear,
  center = [37.3592, -77.3986], // Chester, VA — Worden HQ
  zoom = 18,
}: MapEstimatorProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polygonRef = useRef<L.Polygon | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  const [points, setPoints] = useState<LatLng[]>([]);
  const [isDrawing, setIsDrawing] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [address, setAddress] = useState('');
  const [addressError, setAddressError] = useState('');

  // Initialize Leaflet map (center/zoom are initial values only — not reactive)
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initMap = async () => {
      const L = await import('leaflet');

      // Fix default marker icon path issue with bundlers
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const map = L.map(mapContainerRef.current!, {
        center,
        zoom,
        zoomControl: true,
        attributionControl: true,
      });

      // Use OpenStreetMap tiles (free, no API key required)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 22,
      }).addTo(map);

      mapRef.current = map;
      setMapLoaded(true);

      // Click handler for drawing polygon points
      map.on('click', (e: L.LeafletMouseEvent) => {
        setPoints((prev) => {
          const next: LatLng[] = [...prev, [e.latlng.lat, e.latlng.lng]];
          return next;
        });
      });
    };

    void initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update polygon on the map when points change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const initDraw = async () => {
      const L = await import('leaflet');
      const map = mapRef.current!;

      // Clear old markers and polygon
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (polygonRef.current) {
        polygonRef.current.remove();
        polygonRef.current = null;
      }

      if (points.length === 0) return;

      // Draw markers at each vertex
      points.forEach((p, i) => {
        const marker = L.circleMarker(p, {
          radius: 6,
          color: '#ffcc00',
          fillColor: i === 0 ? '#ff6600' : '#ffcc00',
          fillOpacity: 0.9,
          weight: 2,
        }).addTo(map);
        marker.bindTooltip(`Point ${i + 1}`, { permanent: false });
        markersRef.current.push(marker);
      });

      // Draw polygon if 3+ points
      if (points.length >= 3) {
        const polygon = L.polygon(points, {
          color: '#ffcc00',
          fillColor: '#ffcc00',
          fillOpacity: 0.2,
          weight: 3,
          dashArray: '8 4',
        }).addTo(map);
        polygonRef.current = polygon;

        onPolygonChange(points);
      }
    };

    void initDraw();
  }, [points, mapLoaded, onPolygonChange]);

  const handleClear = useCallback(() => {
    setPoints([]);
    setIsDrawing(true);
    onClear();
  }, [onClear]);

  const handleUndo = useCallback(() => {
    setPoints((prev) => prev.slice(0, -1));
    if (points.length <= 3) {
      onClear();
    }
  }, [points.length, onClear]);

  // Geocode address to center the map
  const handleAddressSearch = useCallback(async () => {
    if (!address.trim() || !mapRef.current) return;
    setAddressError('');
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'jwordenasphaltpaving.com/estimator (contact@jwordenasphaltpaving.com)',
          },
        },
      );
      const results = await response.json();
      if (results.length > 0) {
        const { lat, lon } = results[0];
        mapRef.current.setView([parseFloat(lat), parseFloat(lon)], 19);
      } else {
        setAddressError('Address not found — try a more specific address or pan the map manually.');
      }
    } catch {
      setAddressError('Could not search address — please pan the map manually.');
    }
  }, [address]);

  return (
    <div className="space-y-4">
      {/* Address Search */}
      <div className="flex gap-2">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void handleAddressSearch(); }}
          placeholder="Enter your property address..."
          className="flex-1 bg-black border border-zinc-700 text-white p-3 text-sm focus:border-[#ffcc00] outline-none transition-colors"
        />
        <button
          type="button"
          onClick={() => void handleAddressSearch()}
          className="bg-[#ffcc00] text-black font-black uppercase tracking-wider text-xs px-6 py-3 hover:bg-white transition-colors"
        >
          Go
        </button>
      </div>

      {/* Address error */}
      {addressError && (
        <p className="text-red-400 text-xs font-bold px-1">{addressError}</p>
      )}

      {/* Drawing instructions */}
      <div className="bg-zinc-900/80 border border-zinc-700 px-4 py-3 text-xs text-zinc-200">
        {isDrawing ? (
          <span>
            <span className="text-[#ffcc00] font-bold">📍 Click on the map</span> to place points around
            your project area. Place at least 3 points to form the area.
            {points.length > 0 && (
              <span className="text-zinc-300 ml-2">({points.length} point{points.length !== 1 ? 's' : ''} placed)</span>
            )}
          </span>
        ) : (
          <span className="text-green-400 font-bold">✓ Area defined — see your estimate below</span>
        )}
      </div>

      {/* Map Container */}
      <div className="relative">
        <div
          ref={mapContainerRef}
          className="w-full h-[400px] md:h-[500px] border-2 border-zinc-700 bg-zinc-900"
          style={{ zIndex: 1 }}
        />
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 border-2 border-zinc-700">
            <span className="text-[#ffcc00] font-bold text-sm animate-pulse">Loading map...</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleUndo}
          disabled={points.length === 0}
          className="flex-1 bg-zinc-800 text-zinc-300 font-bold uppercase text-xs tracking-wider py-3 hover:bg-zinc-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ↩ Undo Last Point
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={points.length === 0}
          className="flex-1 bg-zinc-800 text-red-400 font-bold uppercase text-xs tracking-wider py-3 hover:bg-zinc-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ✕ Clear All
        </button>
      </div>
    </div>
  );
}
