import React from 'react'
import { motion } from 'framer-motion'
import { Award, Shield, ArrowRight } from 'lucide-react'

export default function LegacyStory() {
  const timeline = [
    {
      year: '1984',
      title: 'The Foundation',
      description: 'Founded by J. Worden Sr. after 30+ years in the roofing industry, transitioning a legacy of hard work into asphalt paving. He built the company on a simple promise: "Do it right the first time."',
      image: '/images/gallery/grandfather-paving.jpg', // Placeholder for Google Photos
    },
    {
      year: '2016',
      title: 'A New Era of Leadership',
      description: 'Gene Worden takes the helm after working alongside his grandfather since the age of 14. We expanded our commercial footprint, bringing national-level quality to the Richmond area while keeping our family-first values intact.',
      image: '/images/gallery/gene-paving.jpg', // Placeholder for Google Photos
    },
    {
      year: 'Today',
      title: 'The Third Generation',
      description: 'The legacy continues. As we dominate the local market, my son has launched his own successful enterprise, proving that the Worden standard of excellence and entrepreneurial spirit is built into our DNA.',
      image: '/images/gallery/son-success.jpg', // Placeholder for Google Photos
    }
  ]

  return (
    <section className="py-24 bg-brand-navy text-white relative overflow-hidden" id="legacy">
      <div className="absolute inset-0 bg-[url('/images/asphalt-texture.webp')] opacity-10 mix-blend-overlay pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display font-black text-4xl sm:text-5xl text-brand-amber mb-4">
            Three Generations of Excellence
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            From our grandfather's first driveway to multi-million dollar commercial lots, the Worden name has stood for uncompromised quality in Virginia since 1984.
          </p>
        </motion.div>

        <div className="grid gap-12 lg:gap-20">
          {timeline.map((item, idx) => (
            <motion.div 
              key={item.year}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: idx * 0.2 }}
              className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-16 ${idx % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
            >
              <div className="flex-1 w-full">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                  <div className="absolute inset-0 bg-brand-navy/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
                  {/* Google Photos API will populate these images */}
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      // Fallback if image not yet pulled from Google Photos
                      e.target.src = 'https://images.unsplash.com/photo-1584464457692-23c21a14a849?auto=format&fit=crop&q=80&w=800'
                    }}
                  />
                  <div className="absolute bottom-4 left-4 z-20 bg-brand-amber text-brand-navy font-black text-2xl px-4 py-2 rounded-lg shadow-xl">
                    {item.year}
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-6">
                <h3 className="text-3xl font-bold text-white flex items-center gap-3">
                  {idx === 0 ? <Shield className="text-brand-amber w-8 h-8" /> : <Award className="text-brand-amber w-8 h-8" />}
                  {item.title}
                </h3>
                <p className="text-lg text-white/70 leading-relaxed">
                  {item.description}
                </p>
                <div className="pt-4">
                  <button className="text-brand-amber font-semibold hover:text-white transition-colors flex items-center gap-2 group">
                    View Project Gallery <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
