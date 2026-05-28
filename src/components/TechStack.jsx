import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Calculator, Map, FileText, Zap, Users, Radar } from 'lucide-react';

const TECH_FEATURES = [
  {
    icon: Calculator,
    label: '01',
    title: 'Precision Quote Engine',
    description: 'Multi-step estimator that calculates tonnage, labor, and total cost live — factoring surface type, dimensions, material grade, and urgency.',
    tags: ['5-Step Flow', 'Live Cost Math', 'Material Specs'],
  },
  {
    icon: Bot,
    label: '02',
    title: 'AI Paving Consultant',
    description: 'Proactive AI agent that greets every lead by name, answers technical asphalt questions, handles objections, and guides prospects toward a signed contract — 24/7.',
    tags: ['WhatsApp Ready', 'Context-Aware', 'CRM-Linked'],
  },
  {
    icon: Map,
    label: '03',
    title: 'Live Operations Dashboard',
    description: 'Real-time interactive map of every active job site with status tracking, crew assignments, and instant geocoding — so dispatch always knows where the fleet is.',
    tags: ['Live Sync', 'Geo-Mapping', 'Crew Tracking'],
  },
  {
    icon: FileText,
    label: '04',
    title: 'One-Click Invoicing',
    description: 'Generate branded PDF invoices directly from completed jobs and email them to clients — no spreadsheets, no copy-paste, no delays.',
    tags: ['Auto-PDF', 'Email Dispatch', 'Branded'],
  },
  {
    icon: Zap,
    label: '05',
    title: 'Automated Workflows',
    description: 'Welcome emails fire on lead submission, stale-quote alerts ping admins after 5 days, and daily job summaries land in inboxes every morning — automatically.',
    tags: ['Lead Nurture', 'Daily Digests', 'Stale Alerts'],
  },
  {
    icon: Users,
    label: '06',
    title: 'Crew Performance Analytics',
    description: 'Productivity dashboards ranking crews by square footage, job count, and monthly output — so leadership can reward top performers and coach the rest.',
    tags: ['KPI Charts', 'Historical Trends', 'Leaderboards'],
  },
  {
    icon: Radar,
    label: '07',
    title: 'Subsurface Ground Scanning',
    description: 'Ground-penetrating radar maps what lies beneath before a single ton of asphalt is laid — voids, utilities, soft soil, moisture. We engineer the base from real data, so the surface lasts decades instead of seasons.',
    tags: ['GPR Imaging', 'Data-Driven Base', 'Longevity Engineered'],
  },
];

export default function TechStack() {
  return (
    <section id="tech" className="border-t border-border py-16 md:py-24 bg-muted/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-primary font-display font-black text-lg">//</span>
              <p className="font-display text-primary text-xs tracking-[0.3em] uppercase">
                Built-In Technology
              </p>
            </div>
            <h2 className="font-display font-black text-foreground text-4xl md:text-6xl uppercase tracking-tight">
              Powered By Our
              <br />
              <span className="text-primary">Own Platform</span>
            </h2>
          </div>
          <p className="font-body text-muted-foreground text-lg max-w-md leading-relaxed">
            We didn't just pave the paths of progress — we built the software that runs our operation. Every tool below is custom-engineered for how J. Worden & Sons works.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TECH_FEATURES.map((feature, i) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group border border-border bg-card p-7 hover:border-primary/40 transition-colors duration-500"
            >
              <div className="flex items-start justify-between mb-6">
                <span className="font-display text-primary text-sm tracking-[0.3em]">{feature.label}</span>
                <div className="w-12 h-12 border border-primary/30 bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-500">
                  <feature.icon className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors duration-500" />
                </div>
              </div>

              <h3 className="font-display font-black text-foreground text-2xl uppercase tracking-tight leading-tight mb-3">
                {feature.title}
              </h3>
              <p className="font-body text-muted-foreground text-sm leading-relaxed mb-6">
                {feature.description}
              </p>

              <div className="flex flex-wrap gap-2 pt-5 border-t border-border">
                {feature.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 border border-border text-muted-foreground font-display text-[10px] tracking-[0.15em] uppercase"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
