import React from 'react';

const RESIDENTIAL_IMG = '/work/imported/va cars photos and videos for website/IMG_8721.JPG';
const COMMERCIAL_IMG = '/work/imported/KFC/IMG_9496.JPG';
const INDUSTRIAL_IMG = '/work/imported/va cars photos and videos for website/IMG_8838.JPG';

const SECTORS = [
  { title: "National Retail", description: "Multi-site rollout and maintenance for commercial brands." },
  { title: "Healthcare Facilities", description: "Compliance-driven paving for hospitals and medical campuses." },
  { title: "Industrial Logistics", description: "Heavy-duty surfaces engineered for massive truck loads." },
  { title: "Public Infrastructure", description: "Standard-setting paving for municipal and state projects." }
];

const SOLUTIONS = [
  { title: "Precision Milling & Profiling", description: "Advanced removal and leveling for perfect drainage." },
  { title: "High-Performance Asphalt", description: "Custom mix designs for maximum lifecycle durability." },
  { title: "Advanced Preservation", description: "Micro-surfacing and sealants to double asset life." },
  { title: "Pavement Management", description: "Data-driven budgeting and multi-year planning." }
];

export default function ServicePanels() {
  return (
    <section id="services" className="bg-[#0A0A0A] py-24 border-t border-zinc-900">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* Sectors Column */}
          <div>
            <h2 className="font-display text-primary text-5xl mb-12 tracking-tight">INDUSTRY SECTORS</h2>
            <div className="space-y-8">
              {SECTORS.map((s) => (
                <div key={s.title} className="p-8 border-l border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors">
                  <h3 className="font-display text-2xl text-white mb-2 tracking-wide">{s.title}</h3>
                  <p className="font-body text-zinc-500 text-sm leading-relaxed">{s.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Solutions Column */}
          <div>
            <h2 className="font-display text-white text-5xl mb-12 tracking-tight">TECHNICAL SOLUTIONS</h2>
            <div className="space-y-8">
              {SOLUTIONS.map((s) => (
                <div key={s.title} className="p-8 border-l border-primary/50 bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors">
                  <h3 className="font-display text-2xl text-primary mb-2 tracking-wide">{s.title}</h3>
                  <p className="font-body text-zinc-500 text-sm leading-relaxed">{s.description}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}