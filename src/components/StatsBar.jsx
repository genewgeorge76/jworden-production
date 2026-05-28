import React from 'react';
import { motion } from 'framer-motion';

const STATS = [
  { value: '40+', label: 'Years in Business' },
  { value: '2.4M', label: 'Sq Ft Paved' },
  { value: '1,200+', label: 'Projects Complete' },
  { value: '98%', label: 'Repeat Clients' },
];

export default function StatsBar() {
  return (
    <section className="border-t border-border bg-primary">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="text-center md:border-r md:border-primary-foreground/20 last:border-r-0"
            >
              <p className="font-display font-black text-primary-foreground text-5xl md:text-6xl lg:text-7xl leading-none">
                {stat.value}
              </p>
              <p className="font-display text-primary-foreground/70 text-xs md:text-sm tracking-[0.2em] uppercase mt-3">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
