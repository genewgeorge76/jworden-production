import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon } from 'lucide-react';

export default function PhotoGallery({ photos }) {
  const [selected, setSelected] = useState(null);

  if (photos.length === 0) {
    return (
      <div className="border border-border bg-card p-6">
        <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-5">Progress Photos</p>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ImageIcon className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="font-body text-muted-foreground text-sm italic">
            No progress photos have been uploaded yet. Check back during your project.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="font-display text-primary text-xs tracking-[0.3em] uppercase">Progress Photos</p>
          <span className="font-display text-muted-foreground text-xs tracking-wider uppercase">
            {photos.length} photo{photos.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => setSelected(photo)}
              className="group relative aspect-square overflow-hidden bg-muted border border-border hover:border-primary transition-colors"
            >
              <img
                src={photo.file_url}
                alt={photo.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {photo.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-3">
                  <p className="font-display text-foreground text-xs truncate">{photo.title}</p>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-6 cursor-pointer"
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute top-6 right-6 w-10 h-10 bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-5xl max-h-[90vh] cursor-default"
            >
              <img
                src={selected.file_url}
                alt={selected.title}
                className="max-w-full max-h-[85vh] object-contain"
              />
              {(selected.title || selected.description) && (
                <div className="mt-4 text-center">
                  {selected.title && (
                    <p className="font-display font-bold text-foreground text-sm uppercase tracking-wider">
                      {selected.title}
                    </p>
                  )}
                  {selected.description && (
                    <p className="font-body text-muted-foreground text-sm mt-1">{selected.description}</p>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
