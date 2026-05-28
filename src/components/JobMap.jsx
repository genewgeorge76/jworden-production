import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Clock, Users } from 'lucide-react';

const jobIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNCIgZmlsbD0iIzJCN0EwQiIgc3Ryb2tlPSIjRkZDNzAwIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMTYgOFYyNE0yNCAxNkg4IiBzdHJva2U9IiNGRkM3MDAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

const selectedIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNCIgZmlsbD0iIzYyMjQyNCIgc3Ryb2tlPSIjRkZDNzAwIiBzdHJva2Utd2lkdGg9IjMiLz48cGF0aCBkPSJNMTYgOFYyNE0yNCAxNkg4IiBzdHJva2U9IiNGRkM3MDAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

function JobMarker({ job, isSelected, onSelect }) {
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    // Geocode address to coordinates
    const geocode = async () => {
      if (!job.address) return;
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(job.address)}&format=json&limit=1`
        );
        const data = await response.json();
        if (data.length > 0) {
          setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
      } catch (error) {
        console.error('Geocoding failed:', error);
      }
    };

    geocode();
  }, [job.address]);

  if (!coords) return null;

  return (
    <Marker
      position={coords}
      icon={isSelected ? selectedIcon : jobIcon}
      eventHandlers={{ click: () => onSelect(job) }}
    >
      <Popup>
        <div className="text-xs">
          <p className="font-bold text-foreground">{job.title}</p>
          <p className="text-muted-foreground mt-1">{job.address}</p>
          {job.crew && (
            <p className="text-muted-foreground mt-1 flex items-center gap-1">
              <Users className="w-3 h-3" /> {job.crew}
            </p>
          )}
          {job.start_time && (
            <p className="text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {job.start_time}
            </p>
          )}
          <span className={`inline-block mt-2 px-2 py-1 text-xs font-bold rounded ${
            job.status === 'in_progress'
              ? 'bg-primary/20 text-primary'
              : 'bg-secondary/20 text-secondary-foreground'
          }`}>
            {job.status.replace('_', ' ')}
          </span>
        </div>
      </Popup>
    </Marker>
  );
}

export default function JobMap({ jobs, selectedJob, onSelectJob }) {
  const centerCoord = [41.8781, -87.6298]; // Default to Connecticut center

  return (
    <MapContainer
      center={centerCoord}
      zoom={9}
      style={{ width: '100%', height: '100%' }}
      className="rounded-lg"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {jobs.map((job) => (
        <JobMarker
          key={job.id}
          job={job}
          isSelected={selectedJob?.id === job.id}
          onSelect={onSelectJob}
        />
      ))}
    </MapContainer>
  );
}
