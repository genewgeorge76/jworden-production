import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Info } from 'lucide-react';

// Material grades with pricing and specs
export const MATERIALS = [
  {
    id: 'type2_fine',
    label: 'Type II Fine',
    subtitle: 'Residential Grade',
    description: 'Fine aggregate mix ideal for driveways and walkways. Smooth finish.',
    depth_in: 3,          // standard install depth in inches
    density_lbs_per_sqft: 12.5, // per inch of depth
    price_per_ton: 135,
    best_for: ['driveway', 'other'],
    color: 'bg-amber-500/20 border-amber-500/40',
  },
  {
    id: 'type1_heavy',
    label: 'Type I Heavy',
    subtitle: 'Commercial Grade',
    description: 'Heavy-duty mix for parking lots and access roads. High load capacity.',
    depth_in: 4,
    density_lbs_per_sqft: 14,
    price_per_ton: 155,
    best_for: ['parking_lot', 'road', 'commercial'],
    color: 'bg-steel/20 border-steel/40',
  },
  {
    id: 'superpave',
    label: 'Superpave',
    subtitle: 'Industrial Grade',
    description: 'Highest performance specification engineered for maximum load and longevity.',
    depth_in: 6,
    density_lbs_per_sqft: 16,
    price_per_ton: 195,
    best_for: ['industrial'],
    color: 'bg-primary/20 border-primary/40',
  },
];

// Base cost multipliers by urgency
export const URGENCY_MULTIPLIERS = {
  flexible: 1.0,
  standard: 1.05,
  urgent: 1.18,
};

function calcEstimate(width, length, material, urgency) {
  const sqft = width * length;
  if (!sqft || !material) return null;

  const totalDepthInches = material.depth_in;
  // Tons = (sqft × depth_in × density_lbs_per_sqft_per_inch) / 2000
  const tons = (sqft * totalDepthInches * (material.density_lbs_per_sqft / material.depth_in)) / 2000;
  const materialCost = tons * material.price_per_ton;
  const laborCost = sqft * 2.8; // rough labor at $2.80/sqft
  const baseCost = materialCost + laborCost;
  const multiplier = URGENCY_MULTIPLIERS[urgency] || 1.0;
  const totalLow = baseCost * multiplier;
  const totalHigh = totalLow * 1.2;

  return {
    sqft: Math.round(sqft),
    tons: parseFloat(tons.toFixed(1)),
    depthIn: totalDepthInches,
    materialCost: Math.round(materialCost),
    laborCost: Math.round(laborCost),
    totalLow: Math.round(totalLow),
    totalHigh: Math.round(totalHigh),
  };
}

export default function PavingCalculator({ formData, setFormData }) {
  const { width, length, materialId, urgency, surfaceType } = formData;

  const selectedMaterial = MATERIALS.find((m) => m.id === materialId) || null;
  const estimate = calcEstimate(
    parseFloat(width) || 0,
    parseFloat(length) || 0,
    selectedMaterial,
    urgency
  );

  // Auto-suggest material based on surface type
  useEffect(() => {
    if (!materialId && surfaceType) {
      const suggested = MATERIALS.find((m) => m.best_for.includes(surfaceType));
      if (suggested) setFormData((prev) => ({ ...prev, materialId: suggested.id }));
    }
  }, [surfaceType]);

  // Sync sqft back to parent whenever dims change
  useEffect(() => {
    const w = parseFloat(width) || 0;
    const l = parseFloat(length) || 0;
    if (w > 0 && l > 0) {
      setFormData((prev) => ({ ...prev, sqft: w * l }));
    }
  }, [width, length]);

  const handleDim = (field, val) => {
    const numeric = val.replace(/[^0-9.]/g, '');
    setFormData((prev) => ({ ...prev, [field]: numeric }));
  };

  const fmt = (n) => n?.toLocaleString('en-US') ?? '—';
  const fmtUSD = (n) => n ? `$${n.toLocaleString('en-US')}` : '—';

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="w-5 h-5 text-primary" />
        <h3 className="font-display font-bold text-foreground text-lg tracking-wider uppercase">
          Paving Calculator
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: inputs */}
        <div className="space-y-6">
          {/* Dimensions */}
          <div>
            <p className="font-display text-muted-foreground text-xs tracking-[0.2em] uppercase mb-3">
              Dimensions
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { field: 'width', label: 'Width (ft)' },
                { field: 'length', label: 'Length (ft)' },
              ].map(({ field, label }) => (
                <div key={field}>
                  <label className="font-display text-muted-foreground text-xs tracking-wider uppercase block mb-1.5">
                    {label}
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData[field] ?? ''}
                    onChange={(e) => handleDim(field, e.target.value)}
                    placeholder="0"
                    className="w-full h-14 bg-muted border border-border text-foreground text-center font-display font-bold text-2xl placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              ))}
            </div>
            {/* Computed sqft */}
            {parseFloat(width) > 0 && parseFloat(length) > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 flex items-center justify-between border border-border px-4 py-2.5 bg-muted/50"
              >
                <span className="font-body text-muted-foreground text-sm">Total Area</span>
                <span className="font-display font-bold text-primary text-lg">
                  {fmt(Math.round((parseFloat(width) || 0) * (parseFloat(length) || 0)))} sq ft
                </span>
              </motion.div>
            )}
          </div>

          {/* Material selection */}
          <div>
            <p className="font-display text-muted-foreground text-xs tracking-[0.2em] uppercase mb-3">
              Material Grade
            </p>
            <div className="space-y-2">
              {MATERIALS.map((mat) => (
                <button
                  key={mat.id}
                  onClick={() => setFormData((prev) => ({ ...prev, materialId: mat.id }))}
                  className={`w-full text-left border p-5 transition-all duration-300 min-h-[48px] relative ${
                    materialId === mat.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/40 hover:bg-muted/30'
                  }`}
                >
                  {materialId === mat.id && (
                    <span className="absolute top-0 left-0 w-1 h-full bg-primary" />
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-black text-foreground text-lg md:text-xl tracking-tight leading-none">
                          {mat.label}
                        </span>
                        <span className={`px-2 py-0.5 border font-display text-[10px] tracking-[0.2em] uppercase ${mat.color}`}>
                          {mat.subtitle}
                        </span>
                      </div>
                      <p className="font-body text-muted-foreground text-xs mt-2 leading-relaxed">
                        {mat.description}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-display font-black text-primary text-lg leading-none">${mat.price_per_ton}</p>
                      <p className="font-display text-muted-foreground text-[10px] tracking-[0.2em] uppercase mt-1">per ton</p>
                      <p className="font-display text-muted-foreground text-[10px] tracking-[0.2em] uppercase mt-0.5">{mat.depth_in}" depth</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: estimate output */}
        <div>
          <p className="font-display text-muted-foreground text-xs tracking-[0.2em] uppercase mb-3">
            Estimate Summary
          </p>

          {estimate && selectedMaterial ? (
            <motion.div
              key={`${estimate.sqft}-${selectedMaterial.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="border border-border bg-muted/30 h-full"
            >
              {/* Cost headline */}
              <div className="border-b border-border px-6 py-6 text-center">
                <p className="font-display text-muted-foreground text-xs tracking-[0.2em] uppercase mb-1">
                  Estimated Total
                </p>
                <p className="font-display font-black text-primary text-4xl md:text-5xl">
                  {fmtUSD(estimate.totalLow)}
                </p>
                <p className="font-display text-muted-foreground text-sm mt-1">
                  — {fmtUSD(estimate.totalHigh)}
                </p>
                <p className="font-body text-muted-foreground text-xs mt-2">
                  Rough estimate · Final quote after site visit
                </p>
              </div>

              {/* Line items */}
              <div className="px-6 py-5 space-y-3">
                {[
                  { label: 'Area', value: `${fmt(estimate.sqft)} sq ft` },
                  { label: 'Material', value: `${fmt(estimate.tons)} tons · ${estimate.depthIn}" depth` },
                  { label: 'Material Cost', value: fmtUSD(estimate.materialCost) },
                  { label: 'Est. Labor', value: fmtUSD(estimate.laborCost) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="font-body text-muted-foreground text-sm">{label}</span>
                    <span className="font-display font-bold text-foreground text-sm">{value}</span>
                  </div>
                ))}
              </div>

              {/* Disclaimer */}
              <div className="border-t border-border px-6 py-4 flex items-start gap-2">
                <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="font-body text-muted-foreground text-xs leading-relaxed">
                  Pricing varies with site conditions, subbase prep, and market rates. This estimate is for budgeting guidance only.
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="border border-dashed border-border h-full min-h-[280px] flex items-center justify-center text-center px-6 py-10">
              <div>
                <Calculator className="w-10 h-10 text-border mx-auto mb-4" />
                <p className="font-display text-muted-foreground text-sm tracking-wider uppercase">
                  Enter dimensions &amp; select a material to see your estimate
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
