import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, AlertTriangle, CheckCircle2, TrendingDown, Calendar, Wrench } from 'lucide-react';

const CONDITIONS = [
  {
    id: 'excellent',
    label: 'Excellent',
    sub: 'Smooth, deep black, no cracks',
    icon: CheckCircle2,
  },
  {
    id: 'good',
    label: 'Good',
    sub: 'Minor fading, hairline cracks',
    icon: Droplets,
  },
  {
    id: 'fair',
    label: 'Fair',
    sub: 'Visible cracks, gray surface',
    icon: Wrench,
  },
  {
    id: 'poor',
    label: 'Poor',
    sub: 'Potholes, alligator cracking',
    icon: AlertTriangle,
  },
];

// Cost assumptions (per sq ft averages, Central VA market)
const SEALCOAT_COST_PER_SQFT = 0.22;
const CRACK_FILL_PER_SQFT = 0.15;
const RESURFACE_PER_SQFT = 2.75;
const REPLACEMENT_PER_SQFT = 5.50;
const DEFAULT_SQFT = 800; // typical residential driveway

function buildRecommendation(age, condition) {
  const a = parseFloat(age) || 0;

  // Priority: condition dictates urgency, age modifies cadence
  if (condition === 'poor' || (condition === 'fair' && a > 20)) {
    return {
      urgency: 'critical',
      headline: 'Full Resurface Recommended',
      summary: "Your driveway is past the point where sealcoating alone will help. A 1.5\" mill-and-overlay will reset the surface for another 20+ years.",
      actions: [
        { label: 'Schedule a site assessment', timing: 'Within 30 days' },
        { label: 'Mill & overlay resurface', timing: 'This season' },
        { label: 'Sealcoat the new surface', timing: '12 months after overlay' },
      ],
      savingsNote: 'Acting now on a resurface saves you from a full tear-out & replacement later.',
      savingsMultiplier: REPLACEMENT_PER_SQFT - RESURFACE_PER_SQFT,
    };
  }

  if (condition === 'fair') {
    return {
      urgency: 'high',
      headline: 'Crack Repair + Sealcoat This Season',
      summary: 'Water is infiltrating the cracks. Seal them now and you can likely push a full resurface another 5–8 years out.',
      actions: [
        { label: 'Hot-pour crack filling', timing: 'Within 60 days' },
        { label: 'Full sealcoat application', timing: '2–4 weeks after crack fill' },
        { label: 'Re-seal on a 2-year cycle', timing: 'Ongoing' },
      ],
      savingsNote: 'Every $1 spent on crack repair saves ~$8 on deferred resurfacing.',
      savingsMultiplier: RESURFACE_PER_SQFT - (CRACK_FILL_PER_SQFT + SEALCOAT_COST_PER_SQFT),
    };
  }

  if (condition === 'good') {
    const interval = a < 5 ? 3 : 2;
    return {
      urgency: 'medium',
      headline: `Sealcoat on a ${interval}-Year Cycle`,
      summary: `Your surface is holding up well. Regular sealcoating every ${interval} years will protect it from UV, water, and oxidation — the three killers of asphalt.`,
      actions: [
        { label: 'Sealcoat application', timing: `Every ${interval} years` },
        { label: 'Annual crack inspection', timing: 'Each spring' },
        { label: 'Spot crack-fill as needed', timing: 'As they appear' },
      ],
      savingsNote: 'Routine sealcoating extends driveway life to 25–30 years vs. 15 without.',
      savingsMultiplier: (RESURFACE_PER_SQFT * 0.4),
    };
  }

  // excellent
  if (a < 1) {
    return {
      urgency: 'low',
      headline: 'Let the New Surface Cure',
      summary: 'Fresh asphalt needs 6–12 months to fully oxidize before its first sealcoat. Enjoy it — you\'re ahead of schedule.',
      actions: [
        { label: 'First sealcoat', timing: '6–12 months after install' },
        { label: 'Avoid heavy point loads', timing: 'First 30 days' },
        { label: 'Annual inspection', timing: 'Each spring' },
      ],
      savingsNote: 'Proactive care from year one typically doubles the lifespan.',
      savingsMultiplier: RESURFACE_PER_SQFT * 0.5,
    };
  }

  return {
    urgency: 'low',
    headline: 'Stay on a 3-Year Seal Cycle',
    summary: 'Surface is in great shape. A light sealcoat every 3 years is all you need to keep it that way.',
    actions: [
      { label: 'Sealcoat application', timing: 'Every 3 years' },
      { label: 'Annual visual inspection', timing: 'Each spring' },
      { label: 'Keep drainage clear', timing: 'Ongoing' },
    ],
    savingsNote: 'Consistent maintenance is the cheapest insurance against premature failure.',
    savingsMultiplier: RESURFACE_PER_SQFT * 0.35,
  };
}

const URGENCY_STYLES = {
  low:      { bar: 'bg-green-500',  label: 'Low Priority',      text: 'text-green-500' },
  medium:   { bar: 'bg-primary',    label: 'Medium Priority',   text: 'text-primary' },
  high:     { bar: 'bg-orange-500', label: 'High Priority',     text: 'text-orange-500' },
  critical: { bar: 'bg-destructive',label: 'Critical',          text: 'text-destructive' },
};

export default function MaintenanceCalculator() {
  const [age, setAge] = useState('');
  const [condition, setCondition] = useState('');
  const [sqft, setSqft] = useState(DEFAULT_SQFT);

  const ready = age !== '' && !!condition;

  const recommendation = useMemo(() => {
    if (!ready) return null;
    return buildRecommendation(age, condition);
  }, [age, condition, ready]);

  const estimatedSavings = useMemo(() => {
    if (!recommendation) return 0;
    return Math.round(recommendation.savingsMultiplier * sqft);
  }, [recommendation, sqft]);

  return (
    <section id="maintenance" className="border-t border-border py-16 md:py-24 bg-muted/10">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-primary font-display font-black text-lg">//</span>
              <p className="font-display text-primary text-xs tracking-[0.3em] uppercase">
                Maintenance Planner
              </p>
            </div>
            <h2 className="font-display font-black text-foreground text-4xl md:text-6xl uppercase tracking-tight">
              Sealcoat &
              <br />
              <span className="text-primary">Savings Calculator</span>
            </h2>
          </div>
          <p className="font-body text-muted-foreground text-lg max-w-md leading-relaxed">
            Tell us the age and condition of your driveway. We'll return a tailored maintenance schedule and estimate what proactive care saves you long-term.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="border border-border bg-card p-7 space-y-8">
            {/* Age */}
            <div>
              <label className="font-display text-muted-foreground text-xs tracking-wider uppercase block mb-3">
                Driveway Age (Years)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={age}
                onChange={(e) => setAge(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="e.g. 8"
                className="w-full h-16 bg-muted border border-border text-foreground text-center font-display font-bold text-3xl placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors"
              />
            </div>

            {/* Square footage */}
            <div>
              <label className="font-display text-muted-foreground text-xs tracking-wider uppercase flex items-center justify-between mb-3">
                <span>Driveway Size</span>
                <span className="text-primary">{sqft.toLocaleString()} sq ft</span>
              </label>
              <input
                type="range"
                min={200}
                max={3000}
                step={50}
                value={sqft}
                onChange={(e) => setSqft(parseInt(e.target.value, 10))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between font-display text-muted-foreground text-[10px] tracking-wider uppercase mt-1">
                <span>200</span>
                <span>3,000</span>
              </div>
            </div>

            {/* Condition */}
            <div>
              <label className="font-display text-muted-foreground text-xs tracking-wider uppercase block mb-3">
                Current Surface Condition
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CONDITIONS.map((c) => {
                  const active = condition === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setCondition(c.id)}
                      className={`p-4 border text-left transition-all duration-300 min-h-[48px] ${
                        active
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <c.icon className={`w-4 h-4 mb-2 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                      <p className="font-display font-bold text-foreground text-sm tracking-wider uppercase leading-none">
                        {c.label}
                      </p>
                      <p className="font-body text-muted-foreground text-xs mt-1 leading-snug">
                        {c.sub}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="border border-border bg-card p-7 min-h-[420px] flex flex-col">
            <AnimatePresence mode="wait">
              {!ready ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center text-center"
                >
                  <div className="w-14 h-14 border border-primary/30 bg-primary/5 flex items-center justify-center mb-5">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-display font-bold text-foreground text-sm tracking-wider uppercase">
                    Awaiting Input
                  </p>
                  <p className="font-body text-muted-foreground text-sm mt-2 max-w-xs">
                    Enter your driveway age and select a condition to generate a custom plan.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key={`${age}-${condition}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                  className="flex-1 flex flex-col"
                >
                  {/* Urgency bar */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`h-1.5 w-10 ${URGENCY_STYLES[recommendation.urgency].bar}`} />
                    <p className={`font-display text-xs tracking-[0.3em] uppercase ${URGENCY_STYLES[recommendation.urgency].text}`}>
                      {URGENCY_STYLES[recommendation.urgency].label}
                    </p>
                  </div>

                  <h3 className="font-display font-black text-foreground text-2xl md:text-3xl uppercase tracking-tight leading-tight mb-3">
                    {recommendation.headline}
                  </h3>
                  <p className="font-body text-muted-foreground text-sm leading-relaxed mb-6">
                    {recommendation.summary}
                  </p>

                  {/* Action timeline */}
                  <div className="space-y-3 mb-6">
                    {recommendation.actions.map((action, i) => (
                      <div key={action.label} className="flex items-start gap-3 border-l-2 border-primary/40 pl-4 py-1">
                        <div>
                          <p className="font-display font-bold text-foreground text-sm tracking-wider uppercase leading-tight">
                            {action.label}
                          </p>
                          <p className="font-display text-muted-foreground text-[11px] tracking-wider uppercase mt-0.5">
                            {action.timing}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Savings */}
                  <div className="mt-auto border border-primary/30 bg-primary/5 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="w-4 h-4 text-primary" />
                      <p className="font-display text-primary text-xs tracking-[0.3em] uppercase">
                        Estimated Savings
                      </p>
                    </div>
                    <p className="font-display font-black text-foreground text-4xl leading-none">
                      ${estimatedSavings.toLocaleString()}
                    </p>
                    <p className="font-body text-muted-foreground text-xs mt-2 leading-relaxed">
                      {recommendation.savingsNote}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="font-body text-muted-foreground text-xs text-center mt-6 max-w-2xl mx-auto">
          Figures are directional estimates based on Central Virginia market averages. For a precise plan, request an on-site assessment.
        </p>
      </div>
    </section>
  );
}
