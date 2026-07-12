import { useState, useRef } from 'react';

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
  width?: number;
  height?: number;
}

export default function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeAlt,
  afterAlt,
  width = 800,
  height = 533,
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons !== 1) return;
    updatePosition(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    updatePosition(e.touches[0].clientX);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    updatePosition(e.clientX);
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-xl cursor-ew-resize select-none w-full"
      style={{ aspectRatio: `${width}/${height}` }}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onTouchMove={handleTouchMove}
      aria-label="Before and after comparison slider"
    >
      {/* After image (base layer) */}
      <figure className="absolute inset-0 m-0">
        <img
          src={afterSrc}
          alt={afterAlt}
          width={width}
          height={height}
          loading="lazy"
          className="w-full h-full object-cover"
          draggable={false}
        />
        <figcaption className="sr-only">{afterAlt}</figcaption>
      </figure>

      {/* Before image (clipped overlay) */}
      <figure
        className="absolute inset-0 m-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={beforeSrc}
          alt={beforeAlt}
          width={width}
          height={height}
          loading="lazy"
          className="w-full h-full object-cover"
          draggable={false}
        />
        <figcaption className="sr-only">{beforeAlt}</figcaption>
      </figure>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_6px_rgba(0,0,0,0.8)] pointer-events-none"
        style={{ left: `${position}%` }}
      >
        {/* Handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center text-black font-black text-lg pointer-events-none">
          ↔
        </div>
      </div>

      {/* Labels */}
      <span className="absolute top-3 left-3 bg-black/70 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded pointer-events-none">
        Before
      </span>
      <span className="absolute top-3 right-3 bg-[#ffcc00]/90 text-black text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded pointer-events-none">
        After
      </span>

      {/* Range input for accessibility */}
      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
        aria-label="Slide to compare before and after"
      />
    </div>
  );
}
