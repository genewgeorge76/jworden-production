import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Building2, Calendar, Ruler } from 'lucide-react';

/**
 * Lazy-rendered photo panel. Only mounts (loads images) when a location
 * is selected — keeps the homepage fast even with dozens of photos.
 */
export default function LocationPhotoPanel({ location, onClose }) {
  return (
    <AnimatePresence>
      {location && (
        <motion.div
          key={location.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="border border-primary/40 bg-card mt-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-primary" />
                <p className="font-display text-primary text-xs tracking-[0.2em] uppercase">
                  {location.client} · {location.jobType}
                </p>
              </div>
              <h3 className="font-display font-black text-foreground text-2xl md:text-3xl uppercase tracking-tight">
                {location.city}, {location.state}
              </h3>
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground font-display tracking-wider uppercase">
                {location.sqft && (
                  <span className="flex items-center gap-1.5">
                    <Ruler className="w-3 h-3 text-primary" />
                    {location.sqft.toLocaleString()} sq ft
                  </span>
                )}
                {location.year && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-primary" />
                    {location.year}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3 h-3 text-primary" />
                  {location.photos.length} photo{location.photos.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="border border-border p-2 hover:border-primary hover:text-primary text-muted-foreground transition-colors"
              aria-label="Close photo panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Photo grid — images load lazily as user scrolls */}
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {location.photos.map((url, i) => (
                <motion.div
                  key={url + i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="aspect-[4/3] overflow-hidden border border-border group"
                >
                  <img
                    src={url}
                    alt={`${location.client} ${location.city} jobsite photo ${i + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
