import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Phone, ShieldCheck, Star } from 'lucide-react';
import { trackPhoneClick } from '@/lib/analytics';

const CAPABILITIES = [
  'Heavy-duty parking lot paving built for high traffic',
  'Full-depth asphalt replacement and resurfacing',
  'ADA-compliant upgrades and line striping',
  'Drainage correction and base repair',
  'Minimal downtime for active businesses',
];

const COMMERCIAL_SERVICES = [
  'Parking Lot Paving',
  'Roadway and Access Lanes',
  'Emergency Asphalt Repairs',
  'Sealcoating and Crack Sealing',
  'Basketball and Tennis Courts',
  'Walking and Cart Paths',
  'Speed Bumps and Traffic Control Features',
  'ADA Compliance and Marking Upgrades',
];

export default function CommercialCapabilities() {
  return (
    <section className="border-t border-border py-16 md:py-24 relative overflow-hidden">
      <div className="absolute -top-20 right-0 w-72 h-72 rounded-full bg-primary/14 blur-3xl pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-primary font-display font-black text-lg">//</span>
          <p className="font-display text-primary text-xs tracking-[0.3em] uppercase">
            Commercial Capabilities
          </p>
        </div>
        <h2 className="font-display font-black text-foreground text-3xl md:text-5xl uppercase tracking-tight leading-[0.95] max-w-3xl mb-8">
          From Single-Location Projects<br />
          <span className="text-primary">To Multi-Site Contracts</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4 mb-10 max-w-4xl">
          {CAPABILITIES.map((item, i) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex items-start gap-3 border-t border-border pt-4"
            >
              <div className="w-6 h-6 bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 text-primary" />
              </div>
              <p className="font-body text-foreground text-base leading-relaxed">
                {item}
              </p>
            </motion.div>
          ))}
        </div>

        <p className="font-body text-muted-foreground text-base md:text-lg leading-relaxed max-w-3xl border-l-2 border-primary pl-5">
          When you hire <span className="text-foreground font-semibold">J. Worden & Sons Paving LLC</span>, you're choosing a contractor with real-world experience, proven results, and the capability to handle large-scale commercial paving projects the right way.
        </p>

        <div className="mt-10 grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 premium-panel rounded-2xl p-6 md:p-7">
            <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-3">Commercial Services</p>
            <h3 className="font-display font-black text-foreground text-2xl md:text-3xl uppercase tracking-tight mb-4">
              Need Something Paved Around Richmond?
            </h3>
            <p className="font-body text-muted-foreground text-sm md:text-base leading-relaxed mb-6 max-w-2xl">
              We handle everything from parking lots and access roads to emergency repairs and compliance upgrades. If you manage a commercial property, we can scope options quickly and give you a clear estimate.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {COMMERCIAL_SERVICES.map((service) => (
                <div key={service} className="flex items-start gap-2.5 text-sm text-foreground/90">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>{service}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="premium-panel rounded-2xl p-6 md:p-7 flex flex-col justify-between">
            <div>
              <p className="font-display text-primary text-xs tracking-[0.28em] uppercase mb-2">Free Evaluation</p>
              <h4 className="font-display font-black text-foreground text-2xl uppercase tracking-tight">Talk To Our Team</h4>
              <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
                No pressure. No vague pricing. Just a clear assessment and practical next step.
              </p>
            </div>

            <div className="space-y-3 mt-6">
              <Link
                to="/commercial/richmond-va"
                className="w-full flex items-center justify-center gap-2 border border-primary/40 text-primary px-5 py-3 font-display font-bold text-xs tracking-[0.14em] uppercase hover:bg-primary/10 transition-colors"
              >
                View Richmond Commercial Page
              </Link>

              <a
                href="tel:+18044461296"
                onClick={() => trackPhoneClick('commercial_capabilities')}
                className="premium-cta w-full flex items-center justify-center gap-2 text-primary-foreground px-5 py-4 font-display font-bold text-sm tracking-[0.14em] uppercase"
              >
                <Phone className="w-4 h-4" />
                Call 804-446-1296
              </a>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                Licensed, bonded, and insured in Virginia
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Star className="w-3.5 h-3.5 text-primary" />
                Trusted by commercial and multi-site clients
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
