import { useState } from 'react';

type Project = {
  id: number;
  sector: string;
  client: string;
  location: string;
  tonnage: string;
  img: string;
  desc: string;
};

const projects: Project[] = [
  {
    id: 1,
    sector: 'RETAIL TITANS',
    client: 'Taco Bell',
    location: 'Fairfax, VA',
    tonnage: '450 Tons',
    img: 'https://images.unsplash.com/photo-1518557984649-7b161c230cfa?auto=format&fit=crop&w=800&q=80',
    desc: 'Complete lot overhaul. Zero business disruption.',
  },
  {
    id: 2,
    sector: 'RETAIL TITANS',
    client: 'KFC',
    location: 'Arlington, VA',
    tonnage: '320 Tons',
    img: 'https://images.unsplash.com/photo-1541888005391-761e389e02b7?auto=format&fit=crop&w=800&q=80',
    desc: 'ADA compliance upgrade & heavy-duty overlay.',
  },
  {
    id: 3,
    sector: 'VDOT MUNICIPAL',
    client: 'State Route 17',
    location: 'Stafford, VA',
    tonnage: '1,200 Tons',
    img: 'https://images.unsplash.com/photo-1523452294109-84b2386927d6?auto=format&fit=crop&w=800&q=80',
    desc: '96% Marshall Density compliant main artery repair.',
  },
  {
    id: 4,
    sector: 'THE PALACE',
    client: 'Estate Driveway',
    location: 'McLean, VA',
    tonnage: '80 Tons',
    img: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?auto=format&fit=crop&w=800&q=80',
    desc: 'High-end residential asphalt paving with Belgium block accents.',
  },
];

export const ProjectDominanceGallery = () => {
  const [activeSector, setActiveSector] = useState('RETAIL TITANS');
  const filteredProjects = projects.filter((project) => project.sector === activeSector);

  return (
    <div className="mt-12 bg-glass p-8 rounded-xl border border-white/10">
      <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-4 gap-4 flex-wrap">
        <div>
          <h3 className="text-[#d4af37] font-black text-2xl uppercase tracking-widest">Visual Proof: Operational Supremacy</h3>
          <p className="text-gray-200 text-sm mt-1">4K Optmized Asset Delivery // Fourth Generation Execution</p>
        </div>

        <div className="flex space-x-2">
          {['RETAIL TITANS', 'VDOT MUNICIPAL', 'THE PALACE'].map((sector) => (
            <button
              key={sector}
              onClick={() => setActiveSector(sector)}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${
                activeSector === sector
                  ? 'bg-[#d4af37] text-black shadow-[0_0_10px_rgba(212,175,55,0.5)]'
                  : 'bg-[#1f1f23] text-gray-200 hover:text-white border border-white/10'
              }`}
            >
              {sector}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProjects.map((project) => (
          <div key={project.id} className="group relative overflow-hidden rounded-lg border border-white/5 bg-[#1f1f23]">
            <div className="aspect-video w-full overflow-hidden">
              <img
                src={project.img}
                alt={`${project.client} Paving Project`}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                loading="lazy"
              />
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 translate-y-2 group-hover:translate-y-0 transition-transform">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-white font-bold text-xl">{project.client}</h4>
                  <p className="text-[#d4af37] text-xs font-mono">{project.location}</p>
                </div>
                <div className="bg-[#1f1f23]/80 backdrop-blur border border-white/20 px-3 py-1 rounded text-white font-mono text-sm">{project.tonnage}</div>
              </div>
              <p className="text-gray-300 text-sm mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">{project.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
