import React, { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MoveHorizontal } from 'lucide-react';

/**
 * Premium drag-to-compare before/after image slider.
 * Supports touch, mouse drag, and keyboard arrows.
 */
export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'BEFORE',
  afterLabel = 'AFTER',
  alt = 'Before and after paving comparison',
}) {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const updatePosition = useCallback((clientX) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  }, []);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    updatePosition(e.clientX);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    updatePosition(e.clientX);
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') setPosition((p) => Math.max(0, p - 5));
    if (e.key === 'ArrowRight') setPosition((p) => Math.min(100, p + 5));
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[16/10] overflow-hidden border border-border bg-card cursor-ew-resize select-none touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="slider"
      aria-label={alt}
      aria-valuenow={Math.round(position)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* After image (base layer) */}
      <img
        src={afterImage}
        alt={`After: ${alt}`}
        width="1600"
        height="1000"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover quality-premium pointer-events-none"
        draggable={false}
        loading="lazy"
      />
      <span className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-primary text-primary-foreground font-display font-bold text-[10px] tracking-[0.25em] uppercase">
        {afterLabel}
      </span>

      {/* Before image (clipped) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={beforeImage}
          alt={`Before: ${alt}`}
          width="1600"
          height="1000"
          decoding="async"
          className="w-full h-full object-cover quality-premium"
          draggable={false}
          loading="lazy"
        />
        <span className="absolute top-4 left-4 px-3 py-1.5 bg-background text-foreground border border-border font-display font-bold text-[10px] tracking-[0.25em] uppercase">
          {beforeLabel}
        </span>
      </div>

      {/* Divider line + handle */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-primary pointer-events-none"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
      >
        <motion.div
          animate={{ scale: isDragging ? 1.15 : 1 }}
          transition={{ duration: 0.2 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-primary border-4 border-background flex items-center justify-center shadow-xl"
        >
          <MoveHorizontal className="w-5 h-5 text-primary-foreground" />
        </motion.div>
      </div>

      {/* Initial hint */}
      {position === 50 && !isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 3, times: [0, 0.5, 1], repeat: 1 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none bg-background/90 border border-border px-4 py-2 font-display text-foreground text-[10px] tracking-[0.25em] uppercase"
        >
          ← Drag to compare →
        </motion.div>
      )}
    </div>
  );
}
