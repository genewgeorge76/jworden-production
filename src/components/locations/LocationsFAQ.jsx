import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Virginia-wide FAQs — answer-ready content for AI Overview / Perplexity citations
// and classic featured snippets. These are state-level questions, deliberately
// different from homepage and per-city FAQs.
const FAQS = [
  {
    q: 'What cities in Virginia does J. Worden & Sons serve?',
    a: 'We serve all of Virginia, with full crews regularly working Richmond, Chester, Midlothian, Short Pump, Henrico, Williamsburg, Virginia Beach, Chesapeake, Roanoke, Harrisonburg, Winchester, Fredericksburg, Stafford, and Spotsylvania. Our Chester, VA headquarters dispatches crews statewide — from Hampton Roads coastal properties to I-81 corridor mountain driveways.',
  },
  {
    q: 'How much does asphalt driveway paving cost in Virginia in 2026?',
    a: 'A new asphalt driveway in Virginia costs $5–$9 per square foot installed in 2026. An 800 sq ft driveway typically runs $4,000–$7,200 depending on base preparation, mix spec, existing surface tear-out, and regional requirements. Virginia Beach coastal-spec and Roanoke mountain-grade builds sit at the higher end due to reinforced base requirements. We provide written line-item estimates with the mix design spelled out.',
  },
  {
    q: 'Why does asphalt performance vary so much across Virginia?',
    a: 'Virginia spans four distinct paving environments: Piedmont clay (Richmond, Midlothian), coastal sandy subgrade with salt aerosol (Virginia Beach, Chesapeake), Blue Ridge freeze-thaw with 40+ cycles per winter (Roanoke, Harrisonburg), and Northern Valley commuter-load corridors (Winchester, Fredericksburg). Each demands different binders, base depths, and drainage specs. Contractors using one-size-fits-all mixes see failure in 5–7 years across most of Virginia.',
  },
  {
    q: 'Are you licensed to pave anywhere in Virginia?',
    a: 'Yes — we hold a Virginia Class A Contractor license (registered with the Virginia Board for Contractors, 9960 Mayland Drive, Richmond) and are NASCLA certified, bonded, and fully insured with $5M liability coverage. That licensing covers every county and independent city in the Commonwealth of Virginia.',
  },
  {
    q: 'How long does it take to get a paving estimate in Virginia?',
    a: 'Most Virginia properties get a site visit within 3–7 days of calling, and a written line-item estimate within 48 hours of the visit. Central Virginia and the I-95 corridor often get same-week quotes. Call (804) 446-1296 or request an estimate online.',
  },
  {
    q: 'When is the best time of year to pave in Virginia?',
    a: 'Virginia paving season runs mid-April through early November. Peak months are May, June, September, and October. Off-season pricing discounts of 5–15% are often available in April and early November. Minimum ambient temperature for surface paving is 50°F and rising, with no rain within 24 hours before or after.',
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
      >
        <span className="font-display font-bold text-foreground text-base md:text-lg tracking-tight">
          {q}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-primary flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="font-body text-muted-foreground text-base leading-relaxed pb-6 pr-8">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LocationsFAQ() {
  return (
    <section className="border-t border-border py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-primary font-display font-black text-lg">//</span>
          <p className="font-display text-primary text-xs tracking-[0.3em] uppercase">
            Virginia Paving FAQ
          </p>
        </div>
        <h2 className="font-display font-black text-foreground text-3xl md:text-5xl uppercase tracking-tight mb-8">
          Common Questions About Virginia Asphalt Paving
        </h2>

        <div>
          {FAQS.map((f) => (
            <FAQItem key={f.q} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}

export { FAQS as LOCATIONS_FAQS };
