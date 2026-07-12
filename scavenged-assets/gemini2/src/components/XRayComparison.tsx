import { useState } from 'react';

type Layer = { label: string; depth: string; color: string; subtext: string };

const wordenLayers: Layer[] = [
  { label: 'Asphalt Surface Course', depth: '2"', color: 'bg-zinc-800', subtext: 'Municipal-grade SM-9.5A mix' },
  { label: 'Asphalt Binder Course', depth: '1"', color: 'bg-zinc-700', subtext: 'BM-25 binder (commercial grade)' },
  { label: 'Compacted Aggregate Base', depth: '6"', color: 'bg-amber-800', subtext: '21-A Crush & Run — THE WORDEN MINIMUM' },
  { label: 'Geotextile Fabric', depth: '', color: 'bg-yellow-600', subtext: 'Separation & stabilization layer' },
  { label: 'Compacted Subgrade', depth: '∞', color: 'bg-stone-700', subtext: 'Verified bearing capacity' },
];

const competitorLayers: Layer[] = [
  { label: 'Asphalt Surface Course', depth: '1.5"', color: 'bg-zinc-800', subtext: 'Unknown mix grade' },
  { label: 'Minimal Stone (if any)', depth: '2"', color: 'bg-amber-900', subtext: 'Often skipped or under-spec' },
  { label: 'Uncompacted Soil Base', depth: '∞', color: 'bg-stone-600', subtext: 'No stabilization — cracks within 3 years' },
];

function LayerStack({ layers, title, badge }: { layers: Layer[]; title: string; badge: string }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="flex flex-col gap-0 rounded-2xl overflow-hidden border-2 border-zinc-800 shadow-2xl">
      <div className="bg-zinc-900 px-6 py-4 flex items-center justify-between">
        <h3 className="font-black uppercase text-white tracking-tight text-lg">{title}</h3>
        <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${badge === 'WORDEN' ? 'bg-[#ffcc00] text-black' : 'bg-red-600 text-white'}`}>{badge}</span>
      </div>

      <button
        onClick={() => setRevealed((r) => !r)}
        className="bg-zinc-950 text-[#ffcc00] text-xs font-black uppercase tracking-widest py-2 hover:bg-zinc-900 transition-colors border-b border-zinc-800"
      >
        {revealed ? '▲ Close X-Ray View' : '▼ Reveal Structural Layers'}
      </button>

      <div
        className={`flex flex-col gap-0 overflow-hidden transition-all duration-700 ${revealed ? 'max-h-[600px]' : 'max-h-0'}`}
      >
        {layers.map((layer, i) => (
          <div
            key={i}
            className={`${layer.color} px-6 py-4 border-b border-black/20 flex items-center justify-between gap-4`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div>
              <p className="text-white font-black text-sm uppercase tracking-wide">{layer.label}</p>
              <p className="text-white/60 text-xs mt-0.5">{layer.subtext}</p>
            </div>
            {layer.depth && (
              <span className="text-white font-black text-xl shrink-0">{layer.depth}</span>
            )}
          </div>
        ))}
      </div>

      {!revealed && (
        <div className="bg-zinc-950 px-6 py-4 text-zinc-200 text-xs font-bold italic text-center">
          Click to X-Ray the structure below the surface →
        </div>
      )}
    </div>
  );
}

export default function XRayComparison() {
  return (
    <section className="py-24 px-6 lg:px-12 bg-zinc-950 border-t border-zinc-800">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[#ffcc00] font-black uppercase tracking-[0.3em] text-sm">Material Grade Transparency</span>
          <h2 className="text-4xl md:text-6xl font-black uppercase text-white tracking-tight mt-4 mb-4">
            The <span className="text-[#ffcc00]">X-Ray</span> Comparison
          </h2>
          <p className="text-xl text-zinc-200 max-w-2xl mx-auto font-medium">
            Most paving companies hide what's under the surface. We reveal every layer so you know exactly what you're paying for.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <LayerStack layers={wordenLayers} title="J. Worden & Sons" badge="WORDEN" />
          <LayerStack layers={competitorLayers} title="Industry Shortcut" badge="AVOID" />
        </div>

        <div className="bg-[#ffcc00] text-black rounded-2xl p-8 text-center shadow-[0_0_40px_rgba(255,204,0,0.2)]">
          <p className="font-black uppercase text-xl tracking-tight">
            The Worden Minimum: 6-Inch Compacted Aggregate Base — Every Project, No Exceptions
          </p>
          <p className="font-bold text-sm mt-2 opacity-70 uppercase tracking-widest">
            This is why our driveways last 20+ years. Click either card to reveal the layers.
          </p>
        </div>
      </div>
    </section>
  );
}
