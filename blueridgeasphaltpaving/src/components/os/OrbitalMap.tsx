'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import * as turf from '@turf/turf'
import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import { Navigation } from 'lucide-react'

// JWorden Math Constants (Can be adjusted later)
const ASPHALT_DEPTH_INCHES = 2
const STONE_DEPTH_INCHES = 6
const ASPHALT_TON_PRICE = 110 // Average installed price
const STONE_TON_PRICE = 45

export default function OrbitalMap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const draw = useRef<MapboxDraw | null>(null)

  const [sqFt, setSqFt] = useState(0)
  const [addressInput, setAddressInput] = useState('')
  const [error, setError] = useState('')

  // Derived Calculations
  const cubicYardsAsphalt = (sqFt * (ASPHALT_DEPTH_INCHES / 12)) / 27
  const asphaltTons = cubicYardsAsphalt * 2.05 // 2.05 tons per cubic yard

  const cubicYardsStone = (sqFt * (STONE_DEPTH_INCHES / 12)) / 27
  const stoneTons = cubicYardsStone * 1.5 // 1.5 tons per cubic yard

  const totalCost = (asphaltTons * ASPHALT_TON_PRICE) + (stoneTons * STONE_TON_PRICE)

  useEffect(() => {
    // Setup Mapbox Token
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''
    if (!mapboxToken) {
      setError('Missing NEXT_PUBLIC_MAPBOX_TOKEN. Please add it to your environment variables.')
      return
    }

    if (map.current) return // initialize map only once
    
    mapboxgl.accessToken = mapboxToken

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-77.4360, 37.5407], // Richmond, VA default
      zoom: 15
    })

    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true
      },
      defaultMode: 'draw_polygon'
    })

    map.current.addControl(draw.current, 'top-right')

    map.current.on('draw.create', updateArea)
    map.current.on('draw.delete', updateArea)
    map.current.on('draw.update', updateArea)

    function updateArea(e: any) {
      const data = draw.current!.getAll()
      if (data.features.length > 0) {
        // Calculate area in square meters using Turf
        const area = turf.area(data)
        // Convert sq meters to sq feet (1 sq m = 10.7639 sq ft)
        const areaSqFt = Math.round(area * 10.7639)
        setSqFt(areaSqFt)
      } else {
        setSqFt(0)
      }
    }

  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addressInput) return
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''
    
    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(addressInput)}.json?access_token=${mapboxToken}`)
      const data = await res.json()
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center
        map.current?.flyTo({
          center: [lng, lat],
          zoom: 18,
          essential: true
        })
      }
    } catch (err) {
      console.error('Failed to geocode address', err)
    }
  }

  return (
    <div style={{ display: 'flex', height: '80vh', background: '#0a0a0a', color: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #333' }}>
      
      {/* Sidebar Controls */}
      <div style={{ width: '400px', padding: '30px', background: '#111', display: 'flex', flexDirection: 'column', borderRight: '1px solid #333', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
          <Navigation size={32} color="#d32f2f" />
          <h2 style={{ fontSize: '1.8rem', fontFamily: 'Bebas Neue', letterSpacing: '1px' }}>ORBITAL ESTIMATOR</h2>
        </div>

        {error && (
          <div style={{ background: '#4a0000', padding: '15px', borderRadius: '4px', marginBottom: '20px', fontSize: '0.9rem', borderLeft: '4px solid #d32f2f' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
          <input 
            type="text" 
            placeholder="Fly to Address..." 
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            style={{ flex: 1, padding: '12px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '4px' }}
          />
          <button type="submit" className="btn-primary" style={{ padding: '12px 20px', borderRadius: '4px' }}>FLY</button>
        </form>

        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.2rem', color: '#888', marginBottom: '20px', textTransform: 'uppercase' }}>Live Telemetry</h3>
          
          <div style={{ background: '#222', padding: '20px', borderRadius: '4px', marginBottom: '15px', borderLeft: '4px solid #4CAF50' }}>
            <span style={{ display: 'block', color: '#aaa', fontSize: '0.9rem', marginBottom: '5px' }}>Square Footage</span>
            <span style={{ fontSize: '2.5rem', fontWeight: 'bold', fontFamily: 'monospace' }}>{sqFt.toLocaleString()} sqft</span>
          </div>

          <div style={{ background: '#222', padding: '20px', borderRadius: '4px', marginBottom: '15px', borderLeft: '4px solid #d32f2f' }}>
            <span style={{ display: 'block', color: '#aaa', fontSize: '0.9rem', marginBottom: '5px' }}>Hot Mix Asphalt ({ASPHALT_DEPTH_INCHES}")</span>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', fontFamily: 'monospace' }}>{asphaltTons.toFixed(2)} tons</span>
          </div>

          <div style={{ background: '#222', padding: '20px', borderRadius: '4px', marginBottom: '30px', borderLeft: '4px solid #FF9800' }}>
            <span style={{ display: 'block', color: '#aaa', fontSize: '0.9rem', marginBottom: '5px' }}>21A Stone Base ({STONE_DEPTH_INCHES}")</span>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', fontFamily: 'monospace' }}>{stoneTons.toFixed(2)} tons</span>
          </div>

          <div style={{ borderTop: '1px solid #333', paddingTop: '20px' }}>
             <span style={{ display: 'block', color: '#aaa', fontSize: '1rem', marginBottom: '5px' }}>Projected Material Cost</span>
             <span style={{ fontSize: '3rem', fontWeight: 'bold', color: '#4CAF50', fontFamily: 'Bebas Neue' }}>
               ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
             </span>
          </div>

        </div>

      </div>

      {/* Mapbox Container */}
      <div ref={mapContainer} style={{ flex: 1, position: 'relative' }}>
        {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
            <p style={{ color: '#666', fontSize: '1.2rem', fontFamily: 'monospace' }}>AWAITING SATELLITE UPLINK (MAPBOX KEY)</p>
          </div>
        )}
      </div>

      <style>{`
        .mapboxgl-ctrl-group {
          background: #222 !important;
          border: 1px solid #444 !important;
        }
        .mapboxgl-ctrl-group button {
          border-bottom: 1px solid #444 !important;
        }
        .mapboxgl-ctrl-icon {
          filter: invert(1);
        }
      `}</style>
    </div>
  )
}
