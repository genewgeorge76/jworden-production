import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const FAQS = [
  {
    category: 'Longevity',
    items: [
      {
        q: 'How long does asphalt paving last?',
        a: 'A properly installed asphalt surface lasts 20–30 years depending on traffic load, climate, and maintenance. Residential driveways typically reach 25+ years; high-traffic commercial lots average 15–20 years before major resurfacing is needed.',
      },
      {
        q: 'What factors shorten the lifespan of asphalt?',
        a: 'The main culprits are water infiltration through unsealed cracks, heavy vehicle loads exceeding the design spec, UV oxidation, freeze-thaw cycles, and poor subbase preparation during original installation. We engineer every job to mitigate these from day one.',
      },
      {
        q: 'Is asphalt better than concrete for my project?',
        a: 'Asphalt is typically 30–40% less expensive upfront, repairs are faster and cheaper, and it performs better in cold climates where freeze-thaw cycles cause concrete to heave and crack. Concrete lasts longer but at significantly higher cost and complexity to repair.',
      },
    ],
  },
  {
    category: 'Maintenance',
    items: [
      {
        q: 'How often should I sealcoat my asphalt?',
        a: 'We recommend sealcoating every 2–3 years for residential driveways and every 1–2 years for high-traffic commercial surfaces. The first seal should be applied 6–12 months after initial installation to allow the asphalt to cure fully.',
      },
      {
        q: 'When should cracks be repaired?',
        a: 'Address cracks as soon as they appear — typically anything wider than 1/4 inch. Water infiltrating cracks is the leading cause of premature failure. Small crack sealing is inexpensive; ignoring it leads to potholes and full-depth patching costs 5–10x more.',
      },
      {
        q: 'How long after paving can I use my driveway?',
        a: 'You can drive on new asphalt within 24–48 hours in most conditions. However, avoid parking in the same spot repeatedly for the first 2–4 weeks while the asphalt fully cures, especially in summer heat. Heavy vehicles should wait at least 72 hours.',
      },
      {
        q: 'What routine maintenance does asphalt require?',
        a: 'Annual inspections, prompt crack filling, periodic sealcoating, keeping drainage clear, and avoiding sharp edges or point loads from jack stands. A simple maintenance schedule dramatically extends surface life and keeps costs low long-term.',
      },
    ],
  },
  {
    category: 'The Paving Process',
    items: [
      {
        q: 'How does the paving process work, start to finish?',
        a: 'We begin with a site assessment and subbase evaluation, then excavate and grade the area, install a compacted aggregate base, apply a tack coat for adhesion, lay the hot-mix asphalt in lifts, compact with roller equipment, and finish the edges. Most residential jobs complete in 1–2 days.',
      },
      {
        q: 'What is the minimum temperature for paving?',
        a: 'Hot-mix asphalt must be laid and compacted before it cools below approximately 185°F. Ambient temperatures below 40°F make it difficult to maintain that window, so we generally do not pave in cold weather or when ground frost is present. Our season runs March through November.',
      },
      {
        q: 'Do I need to be home during the paving job?',
        a: "Not necessarily. We conduct a full walk-through before work begins and provide you with a detailed scope of work. You'll need to ensure vehicles and obstacles are cleared from the area. We keep you updated throughout and do a final walkthrough before we leave.",
      },
      {
        q: 'Will you haul away the old asphalt?',
        a: 'Yes — full removal and disposal of existing asphalt or concrete is included in our demolition services. Old asphalt is 100% recyclable; we deliver it to asphalt recycling facilities where it becomes reclaimed asphalt pavement (RAP) for future mixes.',
      },
    ],
  },
];

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-4 py-5 text-left min-h-[48px]"
        aria-expanded={open}
      >
        <span className={`font-display font-bold text-base tracking-wide transition-colors duration-300 ${open ? 'text-primary' : 'text-foreground'}`}>
          {question}
        </span>
        <span className="flex-shrink-0 mt-0.5">
          {open
            ? <Minus className="w-4 h-4 text-primary" />
            : <Plus className="w-4 h-4 text-muted-foreground" />}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="font-body text-muted-foreground text-base leading-relaxed pb-5 pr-8">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQSection() {
  const [activeCategory, setActiveCategory] = useState('Longevity');
  const active = FAQS.find((g) => g.category === activeCategory);

  return (
    <section id="faq" className="border-t border-border py-16 md:py-24 relative overflow-hidden">
      <div className="absolute -bottom-20 left-0 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <p className="font-display text-primary text-sm tracking-[0.3em] uppercase mb-3">FAQ</p>
            <h2 className="font-display font-black text-foreground text-4xl md:text-6xl uppercase tracking-tight">
              Common Questions
            </h2>
          </div>
          <p className="font-body text-muted-foreground text-lg max-w-sm leading-relaxed">
            Everything you need to know before the first roller hits the ground.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Category tabs */}
          <div className="lg:col-span-1 flex lg:flex-col gap-2 premium-panel rounded-2xl p-3 h-fit">
            {FAQS.map((group) => (
              <button
                key={group.category}
                onClick={() => setActiveCategory(group.category)}
                className={`flex-1 lg:flex-none text-left px-4 py-3 border font-display font-bold text-sm tracking-wider uppercase transition-all duration-300 min-h-[48px] ${
                  activeCategory === group.category
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                {group.category}
              </button>
            ))}
          </div>

          {/* FAQ items */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-3 premium-panel rounded-2xl divide-y-0 px-6"
            >
              {active?.items.map((item) => (
                <FAQItem key={item.q} question={item.q} answer={item.a} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
