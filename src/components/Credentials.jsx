import React from 'react';
import { Award, ShieldCheck, BadgeCheck, Leaf } from 'lucide-react';

const CREDENTIALS = [
  {
    icon: Award,
    title: 'VAA Member',
    description: 'Virginia Asphalt Association member with decades of regional project experience.',
  },
  {
    icon: ShieldCheck,
    title: 'Fully Insured & Bonded',
    description: '$5M liability coverage. OSHA-compliant crews. Workers\' comp on every site.',
  },
  {
    icon: BadgeCheck,
    title: 'VA Licensed Contractor',
    description: 'Registered with the Virginia Board for Contractors — 9960 Mayland Drive, Richmond.',
  },
  {
    icon: Leaf,
    title: 'Eco-Conscious Practices',
    description: 'Recycled asphalt pavement (RAP) reuse and low-emission equipment fleet.',
  },
];

export default function Credentials() {
  return (
    <section className="border-t border-border py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-primary font-display font-black text-lg">//</span>
          <p className="font-display text-primary text-xs tracking-[0.3em] uppercase">
            Credentials
          </p>
        </div>
        <h2 className="font-display font-black text-foreground text-4xl md:text-5xl uppercase tracking-tight max-w-2xl mb-12">
          Licensed. Insured. Accountable.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CREDENTIALS.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="border border-border bg-card p-6 hover:border-primary/40 transition-colors duration-300"
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
