import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Ruler, Calendar, Loader2 } from 'lucide-react';
import { api } from '@/api/client';
import BeforeAfterSlider from './BeforeAfterSlider';

export default function BeforeAfterGallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.entities.BeforeAfter.list('display_order', 12)
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="border-t border-border py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 flex justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section id="before-after" className="border-t border-border py-16 md:py-24 bg-muted/20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-primary font-display font-black text-lg">//</span>
              <p className="font-display text-primary text-xs tracking-[0.3em] uppercase">
                The Transformation
              </p>
            </div>
            <h2 className="font-display font-black text-foreground text-4xl md:text-6xl uppercase tracking-tight leading-[0.95]">
              Drag to See
              <br />
              <span className="text-primary">The Difference</span>
            </h2>
          </div>
          <p className="font-body text-muted-foreground text-base md:text-lg max-w-md leading-relaxed">
            Real projects. Real crews. Real cure time. Slide the handle to see what your surface could look like in 2–3 days.
          </p>
        </div>

        {/* Sliders */}
        <div className="space-y-12">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
            >
              {/* Slider */}
              <div className="lg:col-span-2">
                <BeforeAfterSlider
                  beforeImage={item.before_image}
                  afterImage={item.after_image}
                  alt={`${item.title} — asphalt paving by J. Worden & Sons`}
                />
              </div>

              {/* Meta */}
              <div className="lg:pt-4">
                <p className="font-display text-primary text-[10px] tracking-[0.3em] uppercase mb-3">
                  Project #{String(i + 1).padStart(2, '0')}
                </p>
                <h3 className="font-display font-black text-foreground text-3xl uppercase tracking-tight leading-[0.95] mb-4">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="font-body text-muted-foreground text-base leading-relaxed mb-6">
                    {item.description}
                  </p>
                )}
                <div className="space-y-3 border-t border-border pt-5">
                  {item.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-display text-foreground text-xs tracking-[0.2em] uppercase">
                        {item.location}
                      </span>
                    </div>
                  )}
                  {item.sqft && (
                    <div className="flex items-center gap-3">
                      <Ruler className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-display text-foreground text-xs tracking-[0.2em] uppercase">
                        {Math.round(item.sqft).toLocaleString()} sq ft
                      </span>
                    </div>
                  )}
                  {item.duration_days && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-display text-foreground text-xs tracking-[0.2em] uppercase">
                        {item.duration_days} day{item.duration_days === 1 ? '' : 's'} on-site
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
