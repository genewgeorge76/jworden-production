import React from 'react';
import { motion } from 'framer-motion';
import { HardHat, FileCheck2, Download, ClipboardCheck } from 'lucide-react';

const SAFETY_FORM_URL =
  '#';

const COMPLIANCE_ITEMS = [
  {
    icon: ClipboardCheck,
    title: 'Daily Tailgate Meetings',
    description:
      'Every crew starts the day with a documented Tool Box Talk — hazards reviewed, signatures collected, records archived.',
  },
  {
    icon: FileCheck2,
    title: 'OSHA-Aligned Safety Plans',
    description:
      'Fall prevention, respiratory protection, hazard communication (MSDS), ladder safety, and Drug-Free Workplace covered on every site.',
  },
  {
    icon: HardHat,
    title: 'Supervisor Accountability',
    description:
      'Every form signed by the supervisor and retained in duplicate — ready for GC, owner, or OSHA review on request.',
  },
];

export default function SafetyCompliance() {
  return (
    <section className="border-t border-border py-16 md:py-24 bg-card/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-12">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-primary font-display font-black text-lg">//</span>
              <p className="font-display text-primary text-xs tracking-[0.3em] uppercase">
                Safety & Compliance
              </p>
            </div>
            <h2 className="font-display font-black text-foreground text-4xl md:text-5xl uppercase tracking-tight leading-[0.95]">
              Proof of Daily<br />
              <span className="text-primary">Safety Compliance</span>
            </h2>
            <p className="font-body text-muted-foreground text-lg leading-relaxed mt-6 max-w-xl">
              Every J. Worden & Sons crew runs a documented Tool Box Talk before the first roller moves.
              The form below is the real document our supervisors complete — daily, on every jobsite, before every new scope of work.
            </p>
          </div>

          {/* Download card */}
          <div className="lg:col-span-5">
            <a
              href={SAFETY_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group block border border-border bg-background p-6 md:p-8 hover:border-primary/60 transition-colors duration-300 h-full"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-primary flex items-center justify-center shrink-0">
                  <FileCheck2 className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-xs tracking-[0.2em] uppercase text-muted-foreground mb-1">
                    Official Document · PDF
                  </p>
                  <h3 className="font-display font-black text-foreground text-lg md:text-xl uppercase tracking-tight leading-tight">
                    Tool Box Talks / Tailgate Safety Meeting Form
                  </h3>
                  <p className="font-body text-muted-foreground text-sm mt-2 leading-relaxed">
                    The exact form our supervisors complete on every site, every day.
                  </p>
                  <span className="inline-flex items-center gap-2 mt-4 text-primary font-display font-bold text-xs tracking-[0.2em] uppercase group-hover:gap-3 transition-all">
                    <Download className="w-4 h-4" />
                    View / Download PDF
                  </span>
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* Compliance items */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COMPLIANCE_ITEMS.map(({ icon: Icon, title, description }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="border border-border bg-background p-6 hover:border-primary/40 transition-colors duration-300"
            >
              <div className="w-12 h-12 bg-primary/10 border border-primary/30 flex items-center justify-center mb-5">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-bold text-foreground text-base uppercase tracking-wider mb-2">
                {title}
              </h3>
              <p className="font-body text-muted-foreground text-sm leading-relaxed">
                {description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
