import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

const BEFORE_AFTER_IMG = '/work/imported/va cars photos and videos for website/IMG_8721.JPG';
const CREW_IMG = '/work/imported/va cars photos and videos for website/IMG_8713.JPG';
const TEXTURE_IMG = '/work/imported/va cars photos and videos for website/IMG_8724.JPG';
const COMMERCIAL_IMG = '/work/imported/KFC/IMG_9496.JPG';

const PROJECTS = [
  {
    title: 'Municipal Road Overlay',
    location: 'Richmond, VA',
    scope: '48,000 sq ft',
    image: CREW_IMG,
    alt: 'Paving crew silhouetted against golden sunrise with heavy asphalt equipment and steam',
  },
  {
    title: 'Commercial Parking Complex',
    location: 'Short Pump, VA',
    scope: '120,000 sq ft',
    image: COMMERCIAL_IMG,
    alt: 'Completed commercial parking lot with fresh asphalt and yellow line markings',
  },
  {
    title: 'Residential Development',
    location: 'Midlothian, VA',
    scope: '24,000 sq ft',
    image: BEFORE_AFTER_IMG,
    alt: 'Before and after comparison showing deteriorated surface transformed to perfect black asphalt',
  },
  {
    title: 'Industrial Logistics Hub',
    location: 'Chester, VA',
    scope: '250,000 sq ft',
    image: TEXTURE_IMG,
    alt: 'Macro view of compacted hot-mix asphalt showing uniform stone aggregate distribution',
  },
];

export default function ProofGallery() {
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <section id="proof" className="border-t border-border py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="font-display text-primary text-sm tracking-[0.3em] uppercase mb-3">Our Work</p>
            <h2 className="font-display font-black text-foreground text-4xl md:text-6xl uppercase tracking-tight">
              Proof Gallery
            </h2>
          </div>
          <p className="font-body text-muted-foreground text-lg max-w-md leading-relaxed">
            Every surface tells a story. Drag to explore our latest projects.
          </p>
        </div>
      </div>

      {/* Horizontal scrolling gallery */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto cursor-grab active:cursor-grabbing px-6 lg:px-8 pb-6 scrollbar-hide"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {PROJECTS.map((project, i) => (
          <motion.div
            key={project.title}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="flex-shrink-0 w-[80vw] sm:w-[60vw] md:w-[40vw] lg:w-[30vw] group"
          >
            <div className="relative overflow-hidden aspect-[4/3]">
              <img
                src={project.image}
                alt={project.alt}
                width="1200"
                height="900"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover quality-premium transition-all duration-700 group-hover:scale-105 group-hover:contrast-110"
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="font-display text-primary text-xs tracking-[0.3em] uppercase">{project.scope}</p>
                <h3 className="font-display font-bold text-foreground text-xl mt-1">{project.title}</h3>
                <p className="font-body text-muted-foreground text-sm mt-1">{project.location}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
