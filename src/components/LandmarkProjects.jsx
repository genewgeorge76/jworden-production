import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

// Landmark commercial projects — high-profile, nationally recognized jobs
// that validate J. Worden & Sons' ability to execute at the highest tier.
const LANDMARKS = [
  {
    title: 'Proven Commercial Experience You Can Trust',
    subtitle: 'Over 300 Commercial Projects Completed for National Brands Across the U.S.',
    year: '2017',
    scope: 'Asphalt Patching, Sealcoating & Line Striping',
    description:
      'At J. Worden & Sons Paving LLC, we\'ve completed parking lot paving, asphalt repairs, sealcoating, and line striping for major brands including KFC, Taco Bell, Arby\'s, and Wendy\'s across multiple states. Our team understands the demands of high-traffic commercial properties and delivers durable, professional results that meet strict standards.\n\nWe were also selected to perform asphalt patching, sealcoating, and precision line striping at one of America\'s most recognizable roadside landmarks—home to the iconic 56-foot steel rooster listed on the National Register. This high-traffic site required careful scheduling, attention to detail, and a clean, long-lasting finish while keeping the property fully operational.',
    image:
      '/work/imported/va cars photos and videos for website/IMG_8730.JPG',
    badge: 'National Landmark',
    details: [
      { label: 'Location', value: 'Marietta, Georgia' },
      { label: 'Year', value: '2017' },
      { label: 'Scope', value: 'Parking Lot Rebuild' },
      { label: 'Significance', value: 'National Register Site' },
    ],
  },
  {
    title: 'KFC / Taco Bell / Pizza Hut 3-in-1',
    subtitle: 'Flagship Combo Build — Overland Park, KS',
    year: '2017',
    scope: 'Full Site — 100% Concrete & Asphalt Installation',
    description:
      'Executed every square foot of concrete and asphalt work on this flagship "3-in-1" combo restaurant — one of the most complex QSR builds in the country, combining three major brands under one roof. 34,000 sq ft of paved surface, drive-thru lanes, and engineered drainage — delivered on spec, on time.',
    image:
      '/work/imported/va cars photos and videos for website/IMG_8713.JPG',
    badge: 'Flagship Build',
    details: [
      { label: 'Location', value: 'Overland Park, KS' },
      { label: 'Year', value: '2017' },
      { label: 'Scope', value: 'Concrete + Asphalt' },
      { label: 'Size', value: '34,000 sq ft' },
    ],
  },
];

export default function LandmarkProjects() {
  return (
    <section className="border-t border-border py-16 md:py-24 bg-card/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 md:mb-16">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-primary font-display font-black text-lg">//</span>
            <p className="font-display text-primary text-xs tracking-[0.3em] uppercase">
              Landmark Projects
            </p>
          </div>
          <h2 className="font-display font-black text-foreground text-4xl md:text-6xl uppercase tracking-tight leading-[0.95] max-w-4xl">
            When National Brands
            <br />
            <span className="text-primary">Needed It Right</span>
          </h2>
          <p className="font-body text-muted-foreground text-base md:text-lg mt-5 max-w-2xl leading-relaxed">
            Not every paving contractor gets trusted with America's most recognizable commercial sites. We have.
          </p>
        </div>

        {/* Landmark cards */}
        <div className="space-y-10 md:space-y-16">
          {LANDMARKS.map((project, i) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className={`grid grid-cols-1 lg:grid-cols-5 gap-0 border border-border bg-card overflow-hidden ${
                i % 2 === 1 ? 'lg:direction-rtl' : ''
              }`}
            >
              {/* Image */}
              <div
                className={`relative lg:col-span-3 aspect-[16/10] lg:aspect-auto bg-muted overflow-hidden ${
                  i % 2 === 1 ? 'lg:order-2' : ''
                }`}
              >
                <img
                  src={project.image}
                  alt={`${project.title} — ${project.subtitle} — paving project completed by J. Worden & Sons in ${project.year}`}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground font-display font-bold text-[10px] tracking-[0.2em] uppercase">
                  <Star className="w-3 h-3 fill-current" />
                  {project.badge}
                </span>
              </div>

              {/* Content */}
              <div
                className={`lg:col-span-2 p-7 md:p-10 flex flex-col justify-center ${
                  i % 2 === 1 ? 'lg:order-1' : ''
                }`}
              >
                <p className="font-display text-primary text-[10px] tracking-[0.3em] uppercase mb-3">
                  {project.subtitle}
                </p>
                <h3 className="font-display font-black text-foreground text-2xl md:text-3xl uppercase tracking-tight leading-tight mb-4">
                  {project.title}
                </h3>
                <div className="font-body text-muted-foreground text-sm md:text-base leading-relaxed mb-6 space-y-3">
                  {project.description.split('\n\n').map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 pt-5 border-t border-border">
                  {project.details.map((d) => (
                    <div key={d.label}>
                      <p className="font-display text-muted-foreground text-[10px] tracking-[0.2em] uppercase mb-1">
                        {d.label}
                      </p>
                      <p className="font-display font-bold text-foreground text-xs tracking-wider uppercase">
                        {d.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
