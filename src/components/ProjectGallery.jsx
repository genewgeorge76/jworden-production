import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Ruler, Loader2 } from 'lucide-react';
import { api } from '@/api/client';
import { RICHMOND_COMMERCIAL_PROOF } from '@/lib/richmondCommercialProof';

// Build rich, keyword-dense alt text for each photo — critical for Google Images SEO.
const buildAltText = (p) => {
  const area = p.sqft ? `${Math.round(p.sqft).toLocaleString()} sq ft ` : '';
  const loc = p.location ? ` in ${p.location}` : '';
  const year = p.year ? ` (completed ${p.year})` : '';
  const cat = p.category ? `${p.category} asphalt paving project` : 'asphalt paving project';
  return `${p.title} \u2014 ${area}${cat}${loc}${year} by J. Worden & Sons Paving LLC.`;
};

// Inject ImageGallery JSON-LD into <head> so Google can index each photo with context.
const useImageGalleryJsonLd = (projects) => {
  useEffect(() => {
    if (!projects || projects.length === 0) return;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ImageGallery',
      name: 'J. Worden & Sons \u2014 Completed Asphalt Paving Projects',
      description:
        'Real photographs of completed asphalt paving, sealcoating, and site-work projects across Central Virginia and the Southeast by J. Worden & Sons.',
      author: {
        '@type': 'Organization',
        name: 'J. Worden & Sons Paving LLC',
        url: 'https://www.jwordenasphaltpaving.com/',
      },
      image: projects.map((p) => ({
        '@type': 'ImageObject',
        contentUrl: p.image_url,
        name: p.title,
        caption: buildAltText(p),
        description: p.description || buildAltText(p),
        contentLocation: p.location ? { '@type': 'Place', name: p.location } : undefined,
        datePublished: p.year ? `${p.year}-01-01` : undefined,
        creditText: 'J. Worden & Sons Paving LLC',
        creator: {
          '@type': 'Organization',
          name: 'J. Worden & Sons Paving LLC',
        },
        copyrightNotice: `\u00a9 ${p.year || new Date().getFullYear()} J. Worden & Sons Paving LLC`,
        license: 'https://www.jwordenasphaltpaving.com/',
      })),
    };

    const existing = document.head.querySelector('script[data-gallery-jsonld="true"]');
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-gallery-jsonld', 'true');
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    return () => {
      const el = document.head.querySelector('script[data-gallery-jsonld="true"]');
      if (el) el.remove();
    };
  }, [projects]);
};

const CATEGORIES = [
  { id: 'all', label: 'All Projects' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'residential', label: 'Residential' },
  { id: 'industrial', label: 'Industrial' },
  { id: 'municipal', label: 'Municipal' },
];

// Specific images that were captured sideways and need a 90° clockwise rotation.
const ROTATE_90_URLS = new Set([
  '/work/imported/va cars photos and videos for website/IMG_8724.JPG',
]);

export default function ProjectGallery() {
  const [projects, setProjects] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.entities.Project.list('-year', 100)
      .then((data) => {
        setProjects(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setProjects([]);
        setLoading(false);
      });
  }, []);

  // Defensive: guarantee array at every consumer site, even if state was somehow set to non-array.
  const safeProjects = Array.isArray(projects) ? projects : [];

  const projectsWithFallback = useMemo(() => {
    const map = new Map();

    [...safeProjects, ...RICHMOND_COMMERCIAL_PROOF].forEach((project) => {
      const key = `${project.title}|${project.location}|${project.image_url}`;
      if (!map.has(key)) map.set(key, project);
    });

    return Array.from(map.values()).sort((a, b) => (b.year || 0) - (a.year || 0));
  }, [safeProjects]);

  // SEO: inject ImageGallery structured data once projects load.
  useImageGalleryJsonLd(projectsWithFallback);

  const filtered = activeCategory === 'all'
    ? projectsWithFallback
    : projectsWithFallback.filter((p) => p.category === activeCategory);

  const availableCategories = CATEGORIES.filter(
    (c) => c.id === 'all' || projectsWithFallback.some((p) => p.category === c.id)
  );

  return (
    <section id="proof" className="relative border-t border-white/5 py-32 md:py-48 overflow-hidden">
      {/* Background visual depth */}
      <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-primary/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-white/2 blur-[160px] rounded-full" />

      <div className="max-w-[1400px] mx-auto px-8 lg:px-12 relative z-10">
        {/* Header with Luxury Styling */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-4 mb-6">
              <div className="h-px w-12 bg-primary/40" />
              <p className="font-display text-primary text-xs tracking-[0.4em] uppercase">
                Portfolio of Mastery
              </p>
            </motion.div>
            <h2 className="editorial-header mb-8">
              Completed <span className="text-gold-gradient">Works</span>
            </h2>
            <p className="font-body text-foreground/50 text-xl max-w-2xl leading-relaxed italic border-l border-white/10 pl-8">
              "We don't just pave; we engineer foundations that withstand the test of time, traffic, and Virginia weather."
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-2 text-right">
            <span className="font-display text-primary text-5xl tracking-tighter">1,200+</span>
            <span className="font-body text-foreground/30 text-[10px] uppercase tracking-[0.3em]">Successful Deployments</span>
          </div>
        </div>

        {/* Category filters — Glassmorphism style */}
        <div className="flex flex-wrap gap-3 mb-16">
          {availableCategories.map((cat) => {
            const count = cat.id === 'all' ? projectsWithFallback.length : projectsWithFallback.filter((p) => p.category === cat.id).length;
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-8 py-3 rounded-full font-display font-medium text-[11px] tracking-[0.25em] uppercase transition-all duration-500 flex items-center gap-3 ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-[0_15px_30px_-10px_rgba(255,166,35,0.4)]'
                    : 'bg-white/5 text-foreground/40 hover:bg-white/10 hover:text-foreground/60 border border-white/5 shadow-xl'
                }`}
              >
                {cat.label}
                <span className={`text-[10px] opacity-40`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Gallery grid — Cards updated for luxury */}
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 glass-surface-premium rounded-[3rem]">
            <p className="font-display text-muted-foreground text-sm tracking-widest uppercase italic">
              Awaiting Next Field Capture
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filtered.map((project) => (
                <motion.figure
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group relative h-[500px] rounded-[2.5rem] overflow-hidden bg-zinc-900 border border-white/5 m-0"
                  itemScope
                  itemType="https://schema.org/ImageObject"
                >
                  {/* Image with High-End Overlay */}
                  <div className="absolute inset-0 z-0">
                    <img
                      src={project.image_url}
                      alt={buildAltText(project)}
                      title={project.title}
                      loading="lazy"
                      decoding="async"
                      style={
                        ROTATE_90_URLS.has(project.image_url)
                          ? { transform: 'rotate(270deg) scale(1.34)', transformOrigin: 'center center' }
                          : undefined
                      }
                      className="w-full h-full object-cover quality-premium transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-1"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent opacity-90 transition-opacity duration-700 group-hover:opacity-70" />
                  </div>

                  {/* Info Overlay — Technical & Luxury */}
                  <figcaption className="absolute inset-0 z-10 flex flex-col justify-end p-10 translate-y-4 group-hover:translate-y-0 transition-transform duration-700">
                    <div className="flex items-center gap-3 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100">
                      <span className="px-3 py-1 bg-primary text-primary-foreground font-display font-medium text-[9px] tracking-[0.2em] uppercase rounded-full">
                        {project.category}
                      </span>
                      {project.year && (
                        <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-foreground font-display font-medium text-[9px] tracking-[0.2em] uppercase rounded-full border border-white/10">
                          {project.year}
                        </span>
                      )}
                    </div>

                    <h3
                      className="font-display font-black text-white text-3xl uppercase tracking-tight leading-none mb-3 group-hover:text-gold-gradient transition-colors"
                      itemProp="name"
                    >
                      {project.title}
                    </h3>

                    <div className="max-h-0 opacity-0 group-hover:max-h-24 group-hover:opacity-100 transition-all duration-700 delay-150 overflow-hidden">
                      {project.description && (
                        <p
                          className="font-body text-white/50 text-sm leading-relaxed mb-6 line-clamp-2 italic"
                          itemProp="description"
                        >
                          {project.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-6 pt-6 border-t border-white/10">
                        {project.location && (
                          <div className="flex items-center gap-2 text-white/40">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span className="font-display text-[10px] tracking-[0.2em] uppercase">{project.location}</span>
                          </div>
                        )}
                        {project.sqft && (
                          <div className="flex items-center gap-2 text-white/40">
                            <Ruler className="w-4 h-4 text-primary" />
                            <span className="font-display text-[10px] tracking-[0.2em] uppercase">{project.sqft.toLocaleString()} SQ FT</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </figcaption>
                  
                  {/* Decorative Industrial Corner */}
                  <div className="absolute top-8 right-8 w-2 h-2 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse" />
                </motion.figure>
              ))}
            </AnimatePresence>
          </div>
        ) }
      </div>
    </section>
  );
}
