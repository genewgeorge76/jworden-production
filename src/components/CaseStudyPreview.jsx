import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, TrendingUp } from 'lucide-react';
import { api } from '@/api/client';

export default function CaseStudyPreview() {
  const [studies, setStudies] = useState([]);

  useEffect(() => {
    api.entities.CaseStudy.filter({ featured: true }, '-year', 3)
      .then((d) => setStudies(Array.isArray(d) ? d : []))
      .catch(() => setStudies([]));
  }, []);

  if (studies.length === 0) return null;

  return (
    <section className="border-t border-border py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-primary font-display font-black text-lg">//</span>
              <p className="font-display text-primary text-xs tracking-[0.3em] uppercase">
                Case Studies
              </p>
            </div>
            <h2 className="font-display font-black text-foreground text-4xl md:text-6xl uppercase tracking-tight leading-[0.95]">
              Real Numbers.
              <br />
              <span className="text-primary">Real Wins.</span>
            </h2>
          </div>
          <p className="font-body text-muted-foreground text-base md:text-lg max-w-md leading-relaxed">
            Every project below is documented, measurable, and verifiable. This is what 40 years of discipline delivers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {studies.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="group border border-border bg-card overflow-hidden hover:border-primary transition-all flex flex-col"
            >
              {s.cover_image && (
                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                  <img
                    src={s.cover_image}
                    alt={s.headline}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
                  {s.project_type && (
                    <span className="absolute top-4 left-4 px-3 py-1 bg-primary text-primary-foreground font-display font-bold text-[10px] tracking-[0.2em] uppercase">
                      {s.project_type}
                    </span>
                  )}
                </div>
              )}

              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  <p className="font-display text-primary text-[10px] tracking-[0.3em] uppercase">
                    Case Study
                  </p>
                </div>
                <h3 className="font-display font-black text-foreground text-xl uppercase tracking-tight leading-[1.05] mb-4">
                  {s.headline}
                </h3>

                {Array.isArray(s.results) && s.results.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mb-5 pb-5 border-b border-border">
                    {s.results.slice(0, 2).map((r, idx) => (
                      <div key={idx}>
                        <p className="font-display font-black text-primary text-xl leading-none">
                          {r.value}
                        </p>
                        <p className="font-display text-muted-foreground text-[10px] tracking-wider uppercase mt-1">
                          {r.metric}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {s.testimonial_quote && (
                  <blockquote className="font-body text-muted-foreground text-sm italic leading-relaxed mt-auto border-l-2 border-primary pl-3">
                    "{s.testimonial_quote.length > 120 ? s.testimonial_quote.slice(0, 120) + '…' : s.testimonial_quote}"
                  </blockquote>
                )}

                <div className="flex items-center justify-between mt-5 pt-5 border-t border-border">
                  <p className="font-display text-muted-foreground text-[10px] tracking-[0.2em] uppercase">
                    {s.client_name}
                  </p>
                  <ArrowUpRight className="w-4 h-4 text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
