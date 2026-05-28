import React from 'react';

const CLIENTS = [
  'Henrico County',
  'Food Lion',
  'Winn-Dixie',
  'Arby\'s',
  'Wendy\'s',
  'KFC',
  'Taco Bell',
  'Virginia DOT',
];

export default function TrustedBy() {
  return (
    <section className="border-t border-border py-16 bg-muted/20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <span className="text-primary font-display font-black text-lg">//</span>
          <p className="font-display text-muted-foreground text-xs tracking-[0.3em] uppercase">
            Trusted By Leading Organizations Across Virginia
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6 border-t border-border pt-8">
          {CLIENTS.map((client) => (
            <div
              key={client}
              className="flex items-center justify-center h-16 border border-border bg-background px-4 hover:border-primary/40 transition-colors duration-300"
            >
              <p className="font-display font-bold text-muted-foreground text-xs md:text-sm tracking-wider uppercase text-center">
                {client}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
