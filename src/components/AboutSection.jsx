import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Award, Thermometer } from 'lucide-react';
import SmartImage from './SmartImage';

const TEXTURE_IMG = '/hero-paving.jpg';

const VALUES = [
{ icon: Shield, title: 'Built to Last', description: 'Every job engineered for decades of performance, not just aesthetics.' },
{ icon: Users, title: 'Family Owned', description: '40+ years of family ownership. Our reputation is our legacy.' },
{ icon: Award, title: 'Licensed & Insured', description: 'Fully bonded, insured, and licensed in the Commonwealth of Virginia.' },
{ icon: Thermometer, title: 'Precision Process', description: 'Temperature-controlled application ensures optimal compaction every time.' }];


export default function AboutSection() {
  return (
    <section id="about" className="border-t border-border relative overflow-hidden">
      <div className="absolute top-10 -right-20 w-64 h-64 rounded-full bg-primary/12 blur-3xl pointer-events-none" />
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Image side */}
        <div className="relative min-h-[400px] lg:min-h-[600px] overflow-hidden">
          <SmartImage
            src={TEXTURE_IMG}
            alt="J. Worden & Sons crew completing a commercial asphalt paving project at dusk in Virginia."
            width={1600}
            height={1100}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="w-full h-full object-cover quality-premium"
          />
          
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/40 lg:to-background" />
        </div>

        {/* Content side */}
        <div className="px-6 lg:px-14 py-16 md:py-24 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
            
            <p className="font-display text-primary text-sm tracking-[0.3em] uppercase mb-3">About Us</p>
            <h2 className="font-display font-black text-foreground text-4xl md:text-5xl uppercase tracking-tight">THE JWORDEN & SONS STANDARD

            </h2>
            <p className="font-body text-muted-foreground text-lg leading-relaxed mt-6 max-w-lg">
              For over 40 years, J. Worden & Sons Paving LLC has delivered professional asphalt paving built to last — across all of Virginia. From residential driveways in Richmond and Virginia Beach to commercial projects in Roanoke, Fredericksburg, and Williamsburg, we bring proven experience, top-grade materials, and no-compromise workmanship to every job. Wherever you are in Virginia, we come to you — on-site, ready to evaluate, quote, and get your project done right the first time.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10">
            {VALUES.map((item, i) =>
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="premium-panel rounded-2xl p-5 hover:border-primary/40 transition-colors duration-500">
              
                <item.icon className="w-5 h-5 text-primary mb-3" />
                <h3 className="font-display font-bold text-foreground text-sm tracking-wider uppercase">
                  {item.title}
                </h3>
                <p className="font-body text-muted-foreground text-sm leading-relaxed mt-2">
                  {item.description}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>);

}
