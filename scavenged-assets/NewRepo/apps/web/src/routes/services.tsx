import React from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { WORDEN_COMPACTION_FLOOR_PCT, WORDEN_BASE_SPEC, OIL_SHIELD_BUFFER_PER_TON } from '@jworden/core';

const SERVICES = [
  {
    id: 'asphalt-paving',
    title: 'Asphalt Paving',
    icon: '🛣️',
    desc: `Full-depth asphalt paving for driveways, parking lots, roads, and industrial yards. All work performed to ${WORDEN_COMPACTION_FLOOR_PCT}% Marshall Unit Weight — verified by nuclear density gauge on every lift.`,
    specs: [
      `${WORDEN_COMPACTION_FLOOR_PCT}% Marshall compaction minimum`,
      WORDEN_BASE_SPEC,
      '2" minimum wearing course, 4" on commercial',
      `±$${OIL_SHIELD_BUFFER_PER_TON}/ton oil shield buffer built into pricing`,
    ],
  },
  {
    id: 'sealcoating',
    title: 'Sealcoating',
    icon: '🖤',
    desc: 'Extend your pavement life 3–5 years. Coal-tar or asphalt-based sealer with 30% sand additive for traction. Crack filling included as prep.',
    specs: ['Prep: blow, clean, edge, crack fill', '30% sand additive for traction', 'ADA parking restripe included on lots', '2-coat application standard'],
  },
  {
    id: 'parking-lots',
    title: 'Parking Lot Paving',
    icon: '🅿️',
    desc: 'Commercial and institutional parking lots from 5,000 to 500,000+ sq ft. ADA-compliant striping, stormwater planning, and phased paving to keep you open during construction.',
    specs: ['ADA compliant layout & striping', 'Stormwater grade plan included', 'Phased paving available', 'LED pole-light conduit coordination'],
  },
  {
    id: 'crack-filling',
    title: 'Crack Filling & Repair',
    icon: '⚙️',
    desc: 'Hot-pour rubberized crack filler applied to clean, routed cracks. Stops water infiltration — the #1 cause of early pavement failure.',
    specs: ['Hot-pour rubberized material', 'Router + blower prep', 'Alligator & fatigue crack repair', 'Catch basin collar repair'],
  },
  {
    id: 'concrete',
    title: 'Concrete Work',
    icon: '🏗️',
    desc: 'Flatwork, curb & gutter, retaining walls, and structural concrete. ACI 318 standards. 28-day break tests on commercial pours.',
    specs: ['3,000–5,000 PSI mix design', 'ACI 318 structural standards', 'Curb & gutter, sidewalks, aprons', 'Control joints per ACI 302'],
  },
  {
    id: 'grading',
    title: 'Grading & Excavation',
    icon: '🚜',
    desc: 'Site prep, cut and fill, and rough grading. GPS-controlled equipment for accuracy. Soil report review and compaction testing included.',
    specs: ['GPS-controlled graders', 'Cut/fill balanced plans', 'VDOT-certified base compaction', 'Erosion control included'],
  },
  {
    id: 'line-striping',
    title: 'Line Striping',
    icon: '🔵',
    desc: 'Thermoplastic and water-borne striping for parking lots, roads, and athletic courts. ADA-compliant layouts with van accessible spaces.',
    specs: ['Thermoplastic or water-borne', 'ADA van accessible layouts', 'Directional arrows, handicap, fire lane', 'Night work available'],
  },
  {
    id: 'municipal',
    title: 'Municipal & Government',
    icon: '🏛️',
    desc: 'VDOT pre-qualified. Davis-Bacon wage compliant. SAM.gov registered. Serving federal, state, county, and municipal road and parking projects.',
    specs: ['VDOT pre-qualified contractor', 'Davis-Bacon wage compliance', 'SAM.gov / UEI registered', 'Bonded & insured for public work'],
  },
];

export function ServicesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-black text-white mb-4">Our Services</h1>
        <p className="text-zinc-400 max-w-2xl mx-auto">
          Every service starts with the Worden Standard: {WORDEN_COMPACTION_FLOOR_PCT}% Marshall compaction minimum, {WORDEN_BASE_SPEC}.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {SERVICES.map((s) => (
          <div key={s.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl">{s.icon}</span>
              <h2 className="text-xl font-bold text-white">{s.title}</h2>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">{s.desc}</p>
            <ul className="space-y-1.5">
              {s.specs.map((spec) => (
                <li key={spec} className="flex items-start gap-2 text-xs text-zinc-500">
                  <span className="text-yellow-500 mt-0.5 flex-shrink-0">✓</span>
                  {spec}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-8 text-center">
        <h3 className="text-2xl font-black text-white mb-3">Get a free, itemized estimate</h3>
        <p className="text-zinc-400 mb-6">We respond within 1 business hour. No commitment required.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/estimator" className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-3 rounded-lg no-underline transition-colors">
            Start Estimate <ChevronRight size={16} />
          </Link>
          <Link to="/contact" className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-6 py-3 rounded-lg no-underline transition-colors">
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
